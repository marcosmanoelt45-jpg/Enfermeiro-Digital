// Ação turno_plantao: a enfermeira Ana reage à resposta do aluno com IA (entende "não sei", resposta fora do tema
// ou incompleta). Não grava nada e não dá nota: a avaliação do plantão continua em avaliar_plantao.
// Se a IA falhar, devolve fala null e o cliente usa a fala fixa de reserva.
import { extrairJson } from "../../_shared/llm.ts";
import { ErroApp } from "../../_shared/erros.ts";
import { logEvento } from "../../_shared/log.ts";
// @ts-ignore: módulo JS puro compartilhado
import { buscarCenarioPlantao } from "../../_shared/dados/sbar.js";
import { montarMensagensEnfermeiraPlantao, PARAMETROS_ENFERMEIRA_PLANTAO, SITUACOES_PLANTAO } from "../../_shared/prompts/enfermeiraPlantao.ts";
import type { ChamarLLM } from "./tipos.ts";

export type SituacaoPlantao = (typeof SITUACOES_PLANTAO)[number];

// Limpa a fala da IA: uma linha, sem marcação, no máximo 260 caracteres.
export function limparFala(fala: unknown): string | null {
  const t = String(fala ?? "").replace(/[*_#`>]/g, "").replace(/\s+/g, " ").trim().slice(0, 260);
  return t.length >= 2 ? t : null;
}

export async function turnoPlantao(
  _userId: string,
  entrada: { cenarioId: string; perguntaId: string; texto: string; tentativa: number },
  deps: { llm: ChamarLLM; cota?: () => Promise<void> },
): Promise<{ situacao: SituacaoPlantao; fala: string | null }> {
  const inicio = Date.now();
  // deno-lint-ignore no-explicit-any
  const cenario: any = buscarCenarioPlantao(entrada.cenarioId);
  if (!cenario) throw new ErroApp("ENTRADA_INVALIDA", "Cenário de plantão não encontrado.");
  // deno-lint-ignore no-explicit-any
  const pergunta = cenario.perguntas.find((p: any) => p.id === entrada.perguntaId);
  if (!pergunta) throw new ErroApp("ENTRADA_INVALIDA", "Pergunta não confere com o cenário.");
  const segundaTentativa = entrada.tentativa >= 1;

  await deps.cota?.();

  try {
    const r = await deps.llm({
      mensagens: montarMensagensEnfermeiraPlantao({ cenario, pergunta, resposta: entrada.texto, segundaTentativa }),
      json: PARAMETROS_ENFERMEIRA_PLANTAO.json,
      temperatura: PARAMETROS_ENFERMEIRA_PLANTAO.temperatura,
      maxTokens: PARAMETROS_ENFERMEIRA_PLANTAO.maxTokens,
      timeoutMs: PARAMETROS_ENFERMEIRA_PLANTAO.timeoutMs,
    });
    // deno-lint-ignore no-explicit-any
    const j: any = extrairJson(r.texto);
    let situacao: SituacaoPlantao = SITUACOES_PLANTAO.includes(j?.situacao) ? j.situacao : "respondeu";
    if (segundaTentativa) situacao = "respondeu";
    const fala = limparFala(j?.fala);
    logEvento("turno_plantao", { cenario: cenario.id, situacao, modelo: r.modelo, ms: Date.now() - inicio });
    return { situacao, fala };
  } catch (e) {
    logEvento("turno_plantao_ia_falhou", { tipo: e instanceof Error ? e.name : "Erro", ms: Date.now() - inicio });
    return { situacao: "respondeu", fala: null };
  }
}
