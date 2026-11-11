// Ação turno_consulta: uma fala do aluno -> uma fala do paciente, com regras de revelação aplicadas no servidor.
import { extrairJson } from "../../_shared/llm.ts";
import type { MensagemLLM } from "../../_shared/llm.ts";
import { ErroApp } from "../../_shared/erros.ts";
import { logEvento } from "../../_shared/log.ts";
import { sanitizeClinicalText } from "../../_shared/dlp.ts";
// @ts-ignore: módulos JS puros compartilhados
import { buscarPersonalidade } from "../../_shared/dados/personalidades.js";
// @ts-ignore
import { aplicarResposta, CHAVE_FONTE_EXTERNA, estadoDosFatos, pedeFonteExterna } from "../../_shared/logica/regras.js";
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
// Tolerante: modelos menores às vezes mandam o objeto dentro de uma lista, usam outro nome para a fala,
// omitem o delta ou passam do tamanho. Só a fala é obrigatória; o resto tem valor padrão seguro.
export function lerResposta(bruto: unknown): RespostaIA | null {
  // deno-lint-ignore no-explicit-any
  let r = bruto as any;
  if (Array.isArray(r)) r = r.find((x) => x && typeof x === "object") ?? null;
  if (!r || typeof r !== "object") return null;

  const NOMES_DE_FALA = /^(fala|resposta|texto|mensagem|dialogo|di[aá]logo|speech|reply|answer|content|text|patient_?speech|paciente|resposta_paciente|fala_paciente|falas?)$/i;
  const IGNORAR = /^(emocao|emoção|emotion|nota_memoria|nota|exame_solicitado|exame|revelados|temas_do_aluno|temas|delta_confianca|falante|autor|role|quem|personagem|speaker|tipo|id)$/i;

  // Todos os pares (caminho, valor) do objeto, em qualquer profundidade (o modelo às vezes aninha:
  // { "dialogo": { "paciente": "..." }, "atualizacao_estado": { "emocao": ..., "revelados": [...] } }).
  // deno-lint-ignore no-explicit-any
  const pares: Array<{ chave: string; valor: any; nivel: number }> = [];
  // deno-lint-ignore no-explicit-any
  const andar = (v: any, chave: string, nivel: number) => {
    if (nivel > 5 || v == null) return;
    pares.push({ chave, valor: v, nivel });
    if (Array.isArray(v)) v.forEach((x) => andar(x, chave, nivel + 1));
    else if (typeof v === "object") for (const [k, x] of Object.entries(v)) andar(x, k, nivel + 1);
  };
  andar(r, "", 0);
  const textos = pares.filter((p) => typeof p.valor === "string" && p.valor.trim().length > 1 && !IGNORAR.test(p.chave));
  // Fala: a string com nome de fala mais rasa; senão, a maior string que não é campo de controle.
  const porNome = textos.filter((p) => NOMES_DE_FALA.test(p.chave)).sort((x, y) => x.nivel - y.nivel)[0];
  const maior = [...textos].sort((x, y) => String(y.valor).length - String(x.valor).length)[0];
  const falaBruta = porNome?.valor ?? maior?.valor;
  if (!falaBruta) return null;
  let fala = String(falaBruta).trim();
  if (fala.length > 400) {
    // corta na última frase completa antes de 400 caracteres
    const corte = fala.slice(0, 400);
    const fim = Math.max(corte.lastIndexOf(". "), corte.lastIndexOf("? "), corte.lastIndexOf("! "));
    fala = fim > 80 ? corte.slice(0, fim + 1) : `${corte.slice(0, 397)}...`;
  }
  // Campos de controle: onde quer que estejam.
  const achar = (re: RegExp) => pares.find((p) => re.test(p.chave))?.valor;
  const deltaNum = Number(achar(/^delta_confianca$/i));
  const delta = Number.isFinite(deltaNum) ? Math.max(-10, Math.min(10, Math.round(deltaNum))) : 0;
  const lista = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === "string") : []);
  const emocao = achar(/^(emocao|emoção|emotion)$/i);
  const nota = achar(/^nota_memoria$/i);
  const exame = achar(/^exame_solicitado$/i);
  return {
    fala,
    emocao: typeof emocao === "string" ? emocao : "falando",
    revelados: lista(achar(/^revelados$/i)),
    temas_do_aluno: lista(achar(/^temas_do_aluno$/i)),
    delta_confianca: delta,
    nota_memoria: typeof nota === "string" ? nota : "",
    exame_solicitado: typeof exame === "string" ? exame : null,
  };
}

const MSG_REPARO = 'Responda apenas o JSON no formato pedido, com a fala do paciente em "fala" (texto), "emocao", "revelados", "temas_do_aluno", "delta_confianca", "nota_memoria" e "exame_solicitado". Sem outras chaves.';

// Sem resposta aproveitável depois do reparo: o paciente pede para repetir (a conversa segue) em vez do erro
// "ficou em silêncio". Erro de verdade só quando a IA está fora do ar (aí o llm lança antes).
export const RESPOSTA_RESERVA: RespostaIA = {
  fala: "Desculpa, não entendi direito. Pode repetir?",
  emocao: "confuso",
  revelados: [],
  temas_do_aluno: [],
  delta_confianca: 0,
  nota_memoria: "",
  exame_solicitado: null,
};

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
  // Pediu para conferir em outra fonte (receita, família, registro): libera o que o paciente esqueceu.
  const contagemTemas: Record<string, number> = { ...(sessao.contagem_temas ?? {}) };
  const pediuFonte = pedeFonteExterna(textoAluno);
  if (pediuFonte) contagemTemas[CHAVE_FONTE_EXTERNA] = (contagemTemas[CHAVE_FONTE_EXTERNA] ?? 0) + 1;
  const turnosRestantes = MAX_TURNOS_ALUNO - sessao.turnos_aluno - 1;
  const mensagens: MensagemLLM[] = montarMensagensTurno({
    ficha,
    personalidade,
    confianca: sessao.confianca,
    contagemTemas,
    reveladosIds: reveladosAteAgora(turnos),
    notas: sessao.notas_memoria ?? [],
    turnosRestantes,
    turnos,
    textoAluno,
    pediuFonte,
  });

  // IA -> formato válido; se não vier, uma tentativa de reparo; se falhar de novo, a fala de reserva.
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
      const json = extrairJson(r.texto);
      resposta = lerResposta(json);
      // Só os NOMES dos campos (nunca o conteúdo): ajuda a ver por que a resposta foi recusada.
      if (!resposta) {
        const chaves = json && typeof json === "object" ? Object.keys(json as object).slice(0, 8).map((k) => k.replace(/[^\w]/g, "")).join("+") : typeof json;
        logEvento("resposta_recusada", { tentativa: tentativa + 1, modelo: r.modelo, chars: r.texto.length, chaves: chaves || "nenhuma" });
      }
    } catch {
      logEvento("resposta_sem_json", { tentativa: tentativa + 1, modelo: r.modelo, chars: r.texto.length, comeca: r.texto.trim().slice(0, 1) });
      // Texto puro (sem JSON) também serve como fala, se parecer uma frase.
      const puro = r.texto.trim().replace(/^["'`]+|["'`]+$/g, "");
      // (só na última tentativa: na primeira, o reparo costuma trazer o JSON certo)
      resposta = tentativa === 1 && puro && !/^[[{]/.test(puro) && puro.length < 400 ? { ...RESPOSTA_RESERVA, fala: puro, emocao: "falando" } : null;
    }
  }
  if (!resposta) {
    logEvento("resposta_reserva", { sessao: entrada.sessaoId, modelo });
    resposta = RESPOSTA_RESERVA;
  }

  // Só o que estava liberado neste turno conta como revelado.
  const liberadosIds = estadoDosFatos(ficha, { confianca: sessao.confianca, contagemTemas })
    .filter((f: { liberado: boolean }) => f.liberado)
    .map((f: { id: string }) => f.id);
  const novo = aplicarResposta(
    { ficha, confianca: sessao.confianca, contagemTemas, notas: sessao.notas_memoria ?? [], liberadosIds },
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
  // _debug é interno: o index só o devolve com CENA_IA_DEBUG=1 (ver resposta.ts). Sem textos de fatos.
  const _debug = {
    revelados,
    confianca: novo.confianca,
    delta: novo.confianca - sessao.confianca,
    liberados: liberadosIds,
    exames: ficha.examesDisponiveis ?? [],
    fatos: ficha.fatos.map((f: { id: string; tema: string; revelacao: string; peso: number; versaoFalsa?: string }) => ({ id: f.id, tema: f.tema, regra: f.revelacao, peso: f.peso, versaoFalsa: f.versaoFalsa ?? null })),
  };
  return { fala, emocao, rapport: rapportDe(novo.confianca), turnosRestantes, exame: novo.exame, _debug };
}

function respostaDeSalva(s: { fala: string; emocao: string; confianca: number; turnosAluno: number }) {
  return { fala: s.fala, emocao: s.emocao, rapport: rapportDe(s.confianca), turnosRestantes: MAX_TURNOS_ALUNO - s.turnosAluno, exame: null };
}
