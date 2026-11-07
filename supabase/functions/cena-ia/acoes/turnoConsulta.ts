// Ação turno_consulta: uma fala do aluno -> uma fala do paciente, com regras de revelação aplicadas no servidor.
import { extrairJson } from "../../_shared/llm.ts";
import type { MensagemLLM } from "../../_shared/llm.ts";
import { ErroApp } from "../../_shared/erros.ts";
import { logEvento } from "../../_shared/log.ts";
import { sanitizeClinicalText } from "../../_shared/dlp.ts";
// @ts-ignore: módulos JS puros compartilhados
import { buscarPersonalidade } from "../../_shared/dados/personalidades.js";
// @ts-ignore
import { aplicarResposta, estadoDosFatos } from "../../_shared/logica/regras.js";
// @ts-ignore
import { rapportDe } from "../../_shared/logica/rapport.js";
// @ts-ignore
import { reveladosAteAgora } from "../../_shared/logica/memoria.js";
// @ts-ignore
import { filtrarFala } from "../../_shared/logica/filtroFala.js";
import { montarMensagensTurno, PARAMETROS_PACIENTE } from "../../_shared/prompts/paciente.ts";
import { MAX_TURNOS_ALUNO } from "./tipos.ts";
import type { Dependencias } from "./tipos.ts";

export interface EntradaTurno {
  sessaoId: string;
  turnoId: string;
  texto: string;
  canal: "voz" | "texto";
}

interface RespostaIA {
  fala: string;
  emocao: string;
  revelados: string[];
  temas_do_aluno: string[];
  delta_confianca: number;
  nota_memoria: string;
  exame_solicitado: string | null;
}

// Valida o formato da resposta da IA. Devolve null se não servir (dispara a tentativa de reparo).
function lerResposta(bruto: unknown): RespostaIA | null {
  // deno-lint-ignore no-explicit-any
  const r = bruto as any;
  if (!r || typeof r !== "object") return null;
  if (typeof r.fala !== "string" || r.fala.trim().length < 1 || r.fala.length > 400) return null;
  const delta = Number(r.delta_confianca);
  if (!Number.isFinite(delta) || delta < -10 || delta > 10) return null;
  const lista = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === "string") : []);
  return {
    fala: r.fala,
    emocao: typeof r.emocao === "string" ? r.emocao : "falando",
    revelados: lista(r.revelados),
    temas_do_aluno: lista(r.temas_do_aluno),
    delta_confianca: delta,
    nota_memoria: typeof r.nota_memoria === "string" ? r.nota_memoria : "",
    exame_solicitado: typeof r.exame_solicitado === "string" ? r.exame_solicitado : null,
  };
}

const MSG_REPARO = "Responda apenas o JSON no formato pedido";

export async function turnoConsulta(userId: string, entrada: EntradaTurno, deps: Dependencias & { cota?: () => Promise<void> }) {
  const { repo, llm, cota } = deps;
  const inicio = Date.now();

  const sessao = await repo.carregarSessao(entrada.sessaoId, userId);
  if (!sessao) throw new ErroApp("ENTRADA_INVALIDA", "Consulta não encontrada.");

  // Idempotência: o mesmo turnoId devolve a resposta já salva, sem gastar IA nem cota.
  const salva = await repo.respostaSalva(entrada.turnoId, entrada.sessaoId);
  if (salva) return respostaDeSalva(salva);

  if (sessao.status === "encerrada") throw new ErroApp("SESSAO_ENCERRADA", "Esta consulta já foi encerrada.");
  if (sessao.turnos_aluno >= MAX_TURNOS_ALUNO) throw new ErroApp("COTA_EXCEDIDA", `Esta consulta chegou ao limite de ${MAX_TURNOS_ALUNO} falas.`);

  await cota?.();

  const ficha = await repo.carregarFicha(entrada.sessaoId);
  if (!ficha) throw new ErroApp("ERRO_INTERNO", "Ficha da consulta indisponível.");
  const personalidade = buscarPersonalidade(ficha.personalidadeId);
  if (!personalidade) throw new ErroApp("ERRO_INTERNO", "Personalidade da consulta indisponível.");

  const turnos = await repo.carregarTurnos(entrada.sessaoId);
  const textoAluno = sanitizeClinicalText(entrada.texto);
  const turnosRestantes = MAX_TURNOS_ALUNO - sessao.turnos_aluno - 1;
  const mensagens: MensagemLLM[] = montarMensagensTurno({
    ficha,
    personalidade,
    confianca: sessao.confianca,
    contagemTemas: sessao.contagem_temas ?? {},
    reveladosIds: reveladosAteAgora(turnos),
    notas: sessao.notas_memoria ?? [],
    turnosRestantes,
    turnos,
    textoAluno,
  });

  // IA -> formato válido; se não vier, uma tentativa de reparo; se falhar de novo, IA_INDISPONIVEL.
  const opcoes = { json: PARAMETROS_PACIENTE.json, temperatura: PARAMETROS_PACIENTE.temperatura, maxTokens: PARAMETROS_PACIENTE.maxTokens, timeoutMs: PARAMETROS_PACIENTE.timeoutMs };
  let resposta: RespostaIA | null = null;
  let modelo = "";
  let texto = "";
  let tokens: number | null = null;
  for (let tentativa = 0; tentativa < 2 && !resposta; tentativa++) {
    const msgs = tentativa === 0 ? mensagens : [...mensagens, { role: "assistant" as const, content: texto }, { role: "user" as const, content: MSG_REPARO }];
    const r = await llm({ mensagens: msgs, ...opcoes });
    modelo = r.modelo;
    texto = r.texto;
    tokens = (r.uso?.entrada ?? 0) + (r.uso?.saida ?? 0) || null;
    try {
      resposta = lerResposta(extrairJson(r.texto));
    } catch {
      resposta = null;
    }
  }
  if (!resposta) throw new ErroApp("IA_INDISPONIVEL", "O paciente ficou em silêncio. Tente de novo.");

  // Só o que estava liberado neste turno conta como revelado.
  const liberadosIds = estadoDosFatos(ficha, { confianca: sessao.confianca, contagemTemas: sessao.contagem_temas ?? {} })
    .filter((f: { liberado: boolean }) => f.liberado)
    .map((f: { id: string }) => f.id);
  const novo = aplicarResposta(
    { ficha, confianca: sessao.confianca, contagemTemas: sessao.contagem_temas ?? {}, notas: sessao.notas_memoria ?? [], liberadosIds },
    resposta,
  );

  const filtro = filtrarFala(resposta.fala);
  if (filtro.trocada) logEvento("fala_filtrada", { sessao: entrada.sessaoId, motivo: filtro.motivo });
  const fala = filtro.fala;
  const emocao = filtro.trocada ? "confuso" : novo.emocao;
  // Fala trocada não revela nada.
  const revelados = filtro.trocada ? [] : novo.revelados;

  const gravou = await repo.registrarTurno({
    sessaoId: entrada.sessaoId,
    turnoAlunoId: entrada.turnoId,
    textoAluno,
    canal: entrada.canal,
    fala,
    emocao,
    revelados,
    confianca: novo.confianca,
    contagemTemas: novo.contagemTemas,
    notas: novo.notas,
  });
  if (!gravou) {
    // Corrida com um envio repetido do mesmo turno: devolve o que ficou salvo.
    const salvo = await repo.respostaSalva(entrada.turnoId, entrada.sessaoId);
    if (salvo) return respostaDeSalva(salvo);
  }

  logEvento("turno", { sessao: entrada.sessaoId, ordem: sessao.turnos_aluno + 1, modelo, ms: Date.now() - inicio, tokens });
  return { fala, emocao, rapport: rapportDe(novo.confianca), turnosRestantes, exame: novo.exame };
}

function respostaDeSalva(s: { fala: string; emocao: string; confianca: number; turnosAluno: number }) {
  return { fala: s.fala, emocao: s.emocao, rapport: rapportDe(s.confianca), turnosRestantes: MAX_TURNOS_ALUNO - s.turnosAluno, exame: null };
}
