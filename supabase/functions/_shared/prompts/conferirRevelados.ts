// Conferência pelo sentido, no fim da consulta: quais fatos do caso o paciente de fato contou na conversa
// (com quaisquer palavras) ou o aluno registrou na evolução. A marcação turno a turno da IA do paciente
// às vezes falha (o modelo rápido não devolve os revelados) e o relatório dizia "0 de 8" com tudo dito.
import type { MensagemLLM } from "../llm.ts";

export const PARAMETROS_CONFERIR = { json: true, temperatura: 0.1, maxTokens: 300, timeoutMs: 12000 } as const;

const SYSTEM = `Você confere uma anamnese simulada de enfermagem. Recebe a lista de FATOS do caso, a CONVERSA e a EVOLUÇÃO que o aluno escreveu.
Marque um fato como revelado se o PACIENTE disse aquilo na conversa (mesmo com outras palavras, de forma parcial ou indireta) OU se o aluno registrou aquilo na evolução e a informação apareceu na conversa.
Julgue pelo sentido, não por palavras exatas. Não marque o que não apareceu.
SAÍDA: apenas JSON: { "revelados": ["id", ...] }`;

export function montarMensagensConferir(e: {
  fatos: Array<{ id: string; texto: string }>;
  turnos: Array<{ autor: string; texto: string }>;
  achados: string;
}): MensagemLLM[] {
  const conversa = e.turnos.map((t) => `${t.autor === "aluno" ? "ALUNO" : "PACIENTE"}: ${t.texto}`).join("\n");
  const user = [
    `FATOS: ${e.fatos.map((f) => `[${f.id}] ${f.texto}`).join(" | ")}`,
    "",
    "CONVERSA:",
    conversa || "(vazia)",
    "",
    `EVOLUÇÃO DO ALUNO: <<<${e.achados || "(vazia)"}>>>`,
  ].join("\n");
  return [
    { role: "system", content: SYSTEM },
    { role: "user", content: user },
  ];
}
