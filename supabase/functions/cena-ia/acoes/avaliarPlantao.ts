// Ação avaliar_plantao: confere a entrada contra o cenário (que o servidor carrega), pede à IA só a presença dos
// elementos-chave e a clareza, valida as citações e calcula as notas por código (50% código, 50% IA).
// Sem IA, o relatório sai só por código, com aviso. Não grava nada: o relatório volta direto ao cliente.
import { extrairJson } from "../../_shared/llm.ts";
import { ErroApp } from "../../_shared/erros.ts";
import { logEvento } from "../../_shared/log.ts";
// @ts-ignore: módulos JS puros compartilhados
import { buscarCenarioPlantao } from "../../_shared/dados/sbar.js";
// @ts-ignore
import { calcularNotas, LETRAS } from "../../_shared/logica/pontuacaoPlantao.js";
import { montarMensagensAvaliadorPlantao, PARAMETROS_AVALIADOR_PLANTAO } from "../../_shared/prompts/avaliadorPlantao.ts";
import type { ChamarLLM } from "./tipos.ts";

export interface RespostaPlantao {
  perguntaId: string;
  letra: "S" | "B" | "A" | "R";
  texto: string;
  conferenciaNumerica?: Record<string, "ok" | "errado" | "nao_informado">;
  semAvaliacao?: boolean;
}
export type LacunasPlantao = Record<string, { avaliada: boolean; achado?: string }>;

export const AVISO_SEM_IA_PLANTAO = "A avaliação do texto ficou indisponível: as notas saíram só da conferência dos números e das lacunas.";

// A IA precisa devolver, para cada letra, a lista de elementos e a clareza de 0 a 2.
// deno-lint-ignore no-explicit-any
function lerAvaliacao(bruto: any) {
  if (!bruto || typeof bruto !== "object") return null;
  const ok = LETRAS.every((l: string) => Array.isArray(bruto[l]?.elementos) && [0, 1, 2].includes(bruto[l]?.clareza));
  return ok ? bruto : null;
}

export async function avaliarPlantao(
  _userId: string,
  entrada: { cenarioId: string; respostas: RespostaPlantao[]; lacunas: LacunasPlantao },
  deps: { llm: ChamarLLM; cota?: () => Promise<void> },
) {
  const inicio = Date.now();
  const cenario = buscarCenarioPlantao(entrada.cenarioId);
  if (!cenario) throw new ErroApp("ENTRADA_INVALIDA", "Cenário de plantão não encontrado.");

  // Confere a entrada com o cenário: perguntas e letras que existem, campos de conferência pedidos, lacunas conhecidas.
  const porId = new Map<string, { id: string; letra: string; texto: string; espera: { tipo: string; campos?: string[] } }>(cenario.perguntas.map((p: { id: string }) => [p.id, p]));
  const vistas = new Set<string>();
  const respostas: RespostaPlantao[] = [];
  for (const r of entrada.respostas) {
    const p = porId.get(r.perguntaId);
    if (!p || p.letra !== r.letra || vistas.has(r.perguntaId)) throw new ErroApp("ENTRADA_INVALIDA", "Respostas do plantão não conferem com o cenário.");
    vistas.add(r.perguntaId);
    const permitidos = new Set(p.espera.campos ?? []);
    const conferencia = Object.fromEntries(Object.entries(r.conferenciaNumerica ?? {}).filter(([c]) => permitidos.has(c)));
    respostas.push({ perguntaId: r.perguntaId, letra: r.letra, texto: r.texto, ...(Object.keys(conferencia).length ? { conferenciaNumerica: conferencia } : {}), ...(r.semAvaliacao ? { semAvaliacao: true } : {}) });
  }
  if (!respostas.length) throw new ErroApp("ENTRADA_INVALIDA", "Nenhuma resposta para avaliar.");
  const campos = new Set<string>(cenario.lacunas.map((l: { campo: string }) => l.campo));
  const lacunas: LacunasPlantao = {};
  for (const [campo, v] of Object.entries(entrada.lacunas)) if (campos.has(campo)) lacunas[campo] = { avaliada: Boolean(v.avaliada), ...(v.avaliada && v.achado ? { achado: String(v.achado).slice(0, 200) } : {}) };
  // Lacuna não informada vale como não avaliada.
  for (const campo of campos) if (!lacunas[campo]) lacunas[campo] = { avaliada: false };

  await deps.cota?.();

  // ---- IA: presença dos elementos-chave e clareza ----
  const mensagens = montarMensagensAvaliadorPlantao({
    cenario,
    respostas: respostas.map((r) => ({ letra: r.letra, pergunta: porId.get(r.perguntaId)!.texto, texto: r.texto, semAvaliacao: r.semAvaliacao })),
    conferencia: Object.fromEntries(respostas.flatMap((r) => Object.entries(r.conferenciaNumerica ?? {}).map(([c, v]) => [`${r.letra}.${c}`, v]))),
    lacunas: Object.fromEntries(cenario.lacunas.map((l: { campo: string; rotulo: string }) => [l.campo, { rotulo: l.rotulo, ...lacunas[l.campo] }])),
  });
  let avaliacao = null;
  let modelo = "nenhum";
  let texto = "";
  for (let tentativa = 0; tentativa < 2 && !avaliacao; tentativa++) {
    try {
      const msgs = tentativa === 0 ? mensagens : [...mensagens, { role: "assistant" as const, content: texto }, { role: "user" as const, content: "Responda apenas o JSON completo, com S, B, A e R." }];
      const r = await deps.llm({ mensagens: msgs, json: PARAMETROS_AVALIADOR_PLANTAO.json, temperatura: PARAMETROS_AVALIADOR_PLANTAO.temperatura, maxTokens: PARAMETROS_AVALIADOR_PLANTAO.maxTokens, timeoutMs: PARAMETROS_AVALIADOR_PLANTAO.timeoutMs });
      modelo = r.modelo;
      texto = r.texto;
      avaliacao = lerAvaliacao(extrairJson(r.texto));
    } catch (e) {
      logEvento("avaliacao_plantao_ia_falhou", { tentativa: tentativa + 1, tipo: e instanceof Error ? e.name : "Erro" });
    }
  }

  const calculo = calcularNotas({ cenario, respostas, lacunas, avaliacaoIA: avaliacao });
  if (calculo.citacoesInvalidas > 0) logEvento("avaliacao_plantao_citacoes_ruins", { cenario: cenario.id, invalidas: calculo.citacoesInvalidas });

  const pontos: Record<string, string> = { S: "situation", B: "background", A: "assessment", R: "recommendation" };
  const letras = Object.fromEntries(
    LETRAS.map((l: string) => {
      const d = calculo.letras[l];
      return [l, {
        nota: d.nota,
        notaTexto: d.texto,
        notaCodigo: d.codigo,
        numeros: d.numeros,
        clareza: d.clareza,
        elementos: d.elementos,
        faltou: d.faltou,
        referencia: cenario.goldenSbar[pontos[l]],
        dica: cenario.educationalPointers[pontos[l]],
      }];
    }),
  );

  const relatorio = {
    cenarioId: cenario.id,
    titulo: cenario.title,
    notas: calculo.notas,
    letras,
    lacunas: cenario.lacunas.map((l: { campo: string; rotulo: string; valorEsperado: string }) => ({ campo: l.campo, rotulo: l.rotulo, avaliada: lacunas[l.campo].avaliada, achado: lacunas[l.campo].achado ?? null, esperado: l.valorEsperado })),
    comentarioGeral: avaliacao ? String(avaliacao.comentario_geral ?? "").slice(0, 400) : "",
    aviso: calculo.iaUsada && calculo.letrasSemIA === 0 ? null : AVISO_SEM_IA_PLANTAO,
  };

  logEvento("plantao_avaliado", { cenario: cenario.id, modelo, ms: Date.now() - inicio, geral: calculo.notas.geral, semIA: !calculo.iaUsada });
  return { relatorio };
}
