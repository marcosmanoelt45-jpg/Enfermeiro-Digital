// Ação finalizar_consulta: calcula as notas por código, pede à IA só a avaliação de comunicação e raciocínio
// (critérios 0 a 2 com citações), valida as citações e encerra a sessão com o relatório.
// Se a IA falhar, o relatório sai SEM a parte de comunicação, e o resto (por código) sempre sai.
import { extrairJson } from "../../_shared/llm.ts";
import { ErroApp } from "../../_shared/erros.ts";
import { logEvento } from "../../_shared/log.ts";
// @ts-ignore: módulos JS puros compartilhados
import { buscarArquetipo } from "../../_shared/dados/arquetipos.js";
// @ts-ignore
import { buscarPersonalidade } from "../../_shared/dados/personalidades.js";
// @ts-ignore
import { CODIGOS_NANDA } from "../../_shared/dados/nanda-codigos.js";
// @ts-ignore
import { reveladosAteAgora } from "../../_shared/logica/memoria.js";
// @ts-ignore
import { classificarDiagnosticos, limparCitacoes, motivoNaoRevelado, notaAnamnese, notaComunicacao, notaGeral, notaIaRaciocinio, notaRaciocinio, notaSeguranca, segurancaDaSessao } from "../../_shared/logica/pontuacao.js";
import { CRITERIOS_COMUNICACAO, CRITERIOS_RACIOCINIO, montarMensagensAvaliador, numerarTurnos, PARAMETROS_AVALIADOR } from "../../_shared/prompts/avaliadorConsulta.ts";
import type { Dependencias } from "./tipos.ts";

export interface RegistroAluno {
  achados: string;
  diagnosticos: string[];
  intervencoes: string[];
  // Fatores relacionados/de risco e características definidoras que o aluno escolheu para cada diagnóstico.
  indicadores?: Array<{ codigo: string; fatores: string[]; caracteristicas: string[] }>;
  examesFeitos?: Array<{ minijogoId: string; resultado?: unknown }>;
}

export const AVISO_SEM_COMUNICACAO = "A avaliação de comunicação ficou indisponível.";

// A IA precisa devolver os 8 critérios de comunicação e os 3 de raciocínio, com nota de 0 a 2.
// deno-lint-ignore no-explicit-any
function lerAvaliacao(bruto: any) {
  const notaOk = (c: unknown) => c && typeof c === "object" && [0, 1, 2].includes((c as { nota: number }).nota);
  if (!bruto || typeof bruto !== "object") return null;
  if (!CRITERIOS_COMUNICACAO.every((k) => notaOk(bruto.comunicacao?.[k]))) return null;
  if (!CRITERIOS_RACIOCINIO.every((k) => notaOk(bruto.raciocinio?.[k]))) return null;
  return bruto;
}

export async function finalizarConsulta(
  userId: string,
  entrada: { sessaoId: string; registro: RegistroAluno },
  deps: Dependencias & { cota?: () => Promise<void> },
) {
  const { repo, llm, cota } = deps;
  const inicio = Date.now();

  const sessao = await repo.carregarSessao(entrada.sessaoId, userId);
  if (!sessao) throw new ErroApp("ENTRADA_INVALIDA", "Consulta não encontrada.");
  if (sessao.status === "encerrada") throw new ErroApp("SESSAO_ENCERRADA", "Esta consulta já foi encerrada.");
  await cota?.();

  const ficha = await repo.carregarFicha(entrada.sessaoId);
  if (!ficha) throw new ErroApp("ERRO_INTERNO", "Ficha da consulta indisponível.");
  const turnos = await repo.carregarTurnos(entrada.sessaoId);
  const arq = buscarArquetipo(ficha.arquetipoId);
  const personalidade = buscarPersonalidade(ficha.personalidadeId);
  const nomeDx = (codigo: string) => arq?.nandaCandidatos.find((c: { codigo: string }) => c.codigo === codigo)?.nome ?? codigo;

  // Registro: códigos NANDA inválidos são descartados.
  const registro: RegistroAluno = {
    achados: entrada.registro.achados,
    diagnosticos: [...new Set(entrada.registro.diagnosticos.filter((c) => CODIGOS_NANDA.has(c)))],
    intervencoes: entrada.registro.intervencoes,
    indicadores: (entrada.registro.indicadores ?? []).filter((i) => CODIGOS_NANDA.has(i.codigo)),
    examesFeitos: entrada.registro.examesFeitos ?? [],
  };

  // ---- Por código ----
  const revelados = reveladosAteAgora(turnos);
  const reveladosSet = new Set(revelados);
  const descobertos = ficha.fatos.filter((f: { id: string }) => reveladosSet.has(f.id));
  const escondidos = ficha.fatos.filter((f: { id: string }) => !reveladosSet.has(f.id));
  const seguranca = segurancaDaSessao(ficha.fatos, revelados, sessao.contagem_temas ?? {});
  const dx = classificarDiagnosticos({
    esperados: ficha.diagnosticosEsperados,
    escolhidos: registro.diagnosticos,
    candidatos: (arq?.nandaCandidatos ?? []).map((c: { codigo: string }) => c.codigo),
  });
  const anamnese = notaAnamnese(ficha.fatos, revelados);
  const notaSeg = notaSeguranca(seguranca);

  // ---- IA: comunicação e raciocínio (critérios 0 a 2) ----
  const mensagens = montarMensagensAvaliador({
    ficha,
    personalidadeNome: personalidade?.nome ?? "Paciente",
    turnos,
    descobertos,
    escondidos,
    diagnosticos: dx,
    registro: { achados: registro.achados, diagnosticos: registro.diagnosticos, intervencoes: registro.intervencoes, indicadores: registro.indicadores },
    nomeDx,
  });
  let avaliacao = null;
  let modelo = "nenhum";
  let texto = "";
  for (let tentativa = 0; tentativa < 2 && !avaliacao; tentativa++) {
    try {
      const msgs = tentativa === 0 ? mensagens : [...mensagens, { role: "assistant" as const, content: texto }, { role: "user" as const, content: "Responda apenas o JSON completo, com os 8 critérios de comunicação e os 3 de raciocínio." }];
      const r = await llm({ mensagens: msgs, json: PARAMETROS_AVALIADOR.json, temperatura: PARAMETROS_AVALIADOR.temperatura, maxTokens: PARAMETROS_AVALIADOR.maxTokens, timeoutMs: PARAMETROS_AVALIADOR.timeoutMs });
      modelo = r.modelo;
      texto = r.texto;
      avaliacao = lerAvaliacao(extrairJson(r.texto));
    } catch (e) {
      logEvento("avaliacao_ia_falhou", { tentativa: tentativa + 1, tipo: e instanceof Error ? e.name : "Erro" });
    }
  }

  // Citações: só valem as de turnos do aluno com o trecho de fato dito (numeração por turno do aluno).
  let comunicacao = null;
  let notaCom: number | null = null;
  let notaIA: number | null = null;
  if (avaliacao) {
    const alunoNumerado = numerarTurnos(turnos).filter((t) => t.autor === "aluno").map((t) => ({ ordem: t.numero, autor: "aluno" as const, texto: t.texto }));
    const { avaliacao: limpa, total, invalidas } = limparCitacoes(avaliacao, alunoNumerado);
    if (total > 0 && invalidas > total / 2) logEvento("avaliacao_citacoes_ruins", { sessao: entrada.sessaoId, total, invalidas });
    notaCom = notaComunicacao(limpa.comunicacao);
    notaIA = notaIaRaciocinio(limpa.raciocinio);
    comunicacao = {
      pontosFortes: (limpa.pontos_fortes ?? []).slice(0, 3).map((p: { turno: number; trecho: string; porque: string }) => ({ ordem: p.turno, trecho: p.trecho, porque: p.porque })),
      melhorar: (limpa.melhorar ?? []).slice(0, 3).map((p: { turno: number | null; trecho: string; sugestao: string; porque: string }) => ({ ordem: p.turno, trecho: p.trecho, sugestao: p.sugestao, porque: p.porque })),
      comentarioGeral: String(limpa.comentario_geral ?? ""),
      criterios: limpa.comunicacao,
    };
    avaliacao = limpa;
  }

  const raciocinio = notaRaciocinio({ certos: dx.certos.length, esperados: ficha.diagnosticosEsperados.length, notaIA, extrasSemRelacao: dx.extrasSemRelacao.length });
  const geral = notaGeral({ anamnese, comunicacao: notaCom, seguranca: notaSeg, raciocinio });

  const ordenarPeso = (a: { peso: number }, b: { peso: number }) => b.peso - a.peso;
  const relatorio = {
    notas: { anamnese, comunicacao: notaCom, seguranca: notaSeg, raciocinio, geral },
    cobertura: {
      revelados: descobertos.map((f: { id: string; texto: string; peso: number }) => ({ id: f.id, texto: f.texto, peso: f.peso })),
      escondidos: escondidos
        .map((f: { id: string; texto: string; peso: number; perguntaQueRevela: string; tema: string; revelacao: string; confiancaMin?: number }) => ({
          id: f.id,
          texto: f.texto,
          peso: f.peso,
          perguntaQueRevela: f.perguntaQueRevela,
          porque: motivoNaoRevelado(f, { confiancaFinal: sessao.confianca, contagemTemas: sessao.contagem_temas ?? {} }),
        }))
        .sort(ordenarPeso),
    },
    comunicacao,
    seguranca,
    raciocinio: {
      diagnosticosCertos: dx.certos.map((codigo: string) => ({ codigo, nome: nomeDx(codigo) })),
      diagnosticosFaltando: dx.faltando.map((codigo: string) => ({ codigo, nome: nomeDx(codigo) })),
      extras: dx.extras.map((codigo: string) => ({ codigo, nome: nomeDx(codigo) })),
      comentario: avaliacao
        ? Object.values(avaliacao.raciocinio as Record<string, { comentario?: string }>).map((c) => c.comentario).filter(Boolean).join(" ")
        : "",
    },
    personalidadeRevelada: ficha.personalidadeId,
    linhaConfianca: [personalidade?.confiancaInicial ?? 50, ...turnos.filter((t) => t.autor === "paciente").map((t) => t.confianca_depois ?? 0)],
    aviso: comunicacao ? null : AVISO_SEM_COMUNICACAO,
  };

  const encerrou = await repo.finalizarSessao(entrada.sessaoId, userId, relatorio);
  if (!encerrou) throw new ErroApp("SESSAO_ENCERRADA", "Esta consulta já foi encerrada.");

  logEvento("consulta_finalizada", { sessao: entrada.sessaoId, modelo, ms: Date.now() - inicio, geral, semComunicacao: !comunicacao });
  return { relatorio };
}
