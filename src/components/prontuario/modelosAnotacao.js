// Modelos que já vêm escritos na folha de anotação (o aluno preenche ou apaga o que não quiser).
// Consulta: SOAP. Plantão (passagem): SBAR.

export const MODELO_SOAP = "S (Subjetivo): \n\nO (Objetivo): \n\nA (Avaliação): \n\nP (Plano): ";
export const MODELO_SBAR = "S (Situação): \n\nB (Breve histórico): \n\nA (Avaliação): \n\nR (Recomendação): ";

const limpo = (t) => String(t ?? "").replace(/\s+/g, " ").trim();

/** O texto ainda é só o modelo, sem nada escrito pelo aluno? */
export function soModelo(texto, modelo) {
  return limpo(texto) === limpo(modelo);
}

/** Leva um resultado para a linha "O (Objetivo)" do SOAP; sem ela, entra no fim da folha. */
export function anotarNoObjetivo(texto, linha) {
  const t = String(texto ?? "");
  const m = t.match(/^O \(Objetivo\):[^\n]*/m);
  if (!m) return `${t.trim() ? `${t.trimEnd()}\n` : ""}${linha}`;
  const fim = m.index + m[0].length;
  const atual = m[0].replace(/^O \(Objetivo\):\s*/, "");
  const nova = `O (Objetivo): ${atual ? `${atual.trimEnd()}; ` : ""}${linha}`;
  return t.slice(0, m.index) + nova + t.slice(fim);
}

/** O que o aluno escreveu: tira o modelo intocado (para não ir como anotação vazia no registro). */
export function semModeloVazio(texto, modelo) {
  return soModelo(texto, modelo) ? "" : String(texto ?? "");
}
