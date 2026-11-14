// Ação exame_consulta: o aluno pediu um exame de beira de leito na conversa (HGT, palpação, ausculta…) e tocou
// em "Fazer". Devolve o resultado coerente com o caso. Sinais vitais saem da ficha (por código); os demais, da IA
// com a ficha inteira (doença, fatos e sinais vitais), com reserva por código se a IA falhar.
import { extrairJson } from "../../_shared/llm.ts";
import { ErroApp } from "../../_shared/erros.ts";
import { logEvento } from "../../_shared/log.ts";
// @ts-ignore: módulo JS puro compartilhado
import { EXAMES_ROTULOS } from "../../_shared/dados/examesPorEspecialidade.js";
import type { Dependencias } from "./tipos.ts";

const fmt = (n: unknown) => String(n ?? "").replace(".", ",");

// deno-lint-ignore no-explicit-any
export function resultadoPorCodigo(exameId: string, sv: any): string | null {
  if (!sv) return null;
  switch (exameId) {
    case "medir-pa":
      return `PA ${sv.pa_sistolica}/${sv.pa_diastolica} mmHg`;
    case "contar-pulso":
      return `Pulso radial ${sv.fc} bpm`;
    case "contar-fr":
      return `FR ${sv.fr} irpm`;
    case "medir-temperatura":
      return `Temperatura axilar ${fmt(sv.tax)} °C`;
    case "oximetria":
      return `SatO₂ ${sv.sat}% em ar ambiente`;
    default:
      return null;
  }
}

const SYSTEM = `Você é o "resultado do exame" numa simulação de enfermagem. Recebe o caso completo e o exame que o aluno fez à beira do leito.
Escreva o achado como um enfermeiro registraria: curto (até 25 palavras), objetivo, com números e unidades quando couber (ex.: "HGT 486 mg/dL", "Abdome doloroso à palpação em epigástrio, sem defesa"). No ECG, descreva ritmo, frequência e alterações de ST ou onda T (ex.: "Ritmo sinusal, FC 112 bpm, infradesnivelamento de ST em V4-V6"). Seja coerente com a doença, os fatos e os sinais vitais do caso; se o exame não tiver relação com o problema, descreva um achado normal. Não dê diagnóstico nem conduta.
SAÍDA: apenas JSON: { "resultado": "..." }`;

export async function exameConsulta(
  userId: string,
  entrada: { sessaoId: string; exameId: string },
  deps: Dependencias,
): Promise<{ exameId: string; rotulo: string; resultado: string }> {
  const { repo, llm } = deps;
  const rotulo = EXAMES_ROTULOS[entrada.exameId];
  if (!rotulo) throw new ErroApp("ENTRADA_INVALIDA", "Exame desconhecido.");
  const sessao = await repo.carregarSessao(entrada.sessaoId, userId);
  if (!sessao) throw new ErroApp("ENTRADA_INVALIDA", "Consulta não encontrada.");
  if (sessao.status === "encerrada") throw new ErroApp("SESSAO_ENCERRADA", "Esta consulta já foi encerrada.");
  const ficha = await repo.carregarFicha(entrada.sessaoId);
  if (!ficha) throw new ErroApp("ERRO_INTERNO", "Ficha da consulta indisponível.");

  const direto = resultadoPorCodigo(entrada.exameId, ficha.sinaisVitais);
  if (direto) return { exameId: entrada.exameId, rotulo, resultado: direto };

  const sv = ficha.sinaisVitais ?? {};
  const caso = [
    `Paciente: ${ficha.identificacao?.idade} anos, ${ficha.identificacao?.sexo === "F" ? "mulher" : "homem"}. Setor: ${ficha.setor}.`,
    `Queixa: ${ficha.queixaPrincipal}`,
    `Sinais vitais: PA ${sv.pa_sistolica}/${sv.pa_diastolica}, FC ${sv.fc}, FR ${sv.fr}, SatO2 ${sv.sat}%, Tax ${sv.tax}.`,
    `Fatos: ${(ficha.fatos ?? []).map((f: { texto: string }) => f.texto).join(" | ")}`,
    `Diagnósticos esperados (só para coerência, não cite): ${(ficha.diagnosticosEsperados ?? []).join(", ")}`,
    `EXAME FEITO: ${rotulo}`,
  ].join("\n");
  try {
    const r = await llm({ mensagens: [{ role: "system", content: SYSTEM }, { role: "user", content: caso }], json: true, temperatura: 0.3, maxTokens: 160, timeoutMs: 10000 });
    // deno-lint-ignore no-explicit-any
    const j: any = extrairJson(r.texto);
    const resultado = String(j?.resultado ?? "").replace(/\s+/g, " ").trim().slice(0, 220);
    if (resultado.length >= 3) {
      logEvento("exame_consulta", { sessao: entrada.sessaoId, exame: entrada.exameId, modelo: r.modelo });
      return { exameId: entrada.exameId, rotulo, resultado };
    }
  } catch (e) {
    logEvento("exame_consulta_ia_falhou", { tipo: e instanceof Error ? e.name : "Erro" });
  }
  return { exameId: entrada.exameId, rotulo, resultado: "Sem alterações significativas." };
}
