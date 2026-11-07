// Memória e histórico enviados à IA: só os últimos 10 turnos + fatos já revelados + notas curtas (controle de custo).
export const MAX_NOTAS = 12;
export const MAX_TURNOS_HISTORICO = 10;

// Notas curtas devolvidas pela IA (até 12 palavras, no máximo 12 notas; a mais antiga sai primeiro).
export function acrescentarNota(notas, nota) {
  const limpa = String(nota ?? "").trim().split(/\s+/).filter(Boolean).slice(0, 12).join(" ");
  if (!limpa) return notas;
  return [...notas, limpa].slice(-MAX_NOTAS);
}

// Bloco "MEMÓRIA" do prompt: fatos já revelados (texto verdadeiro, pois o paciente já os disse) e notas.
/**
 * @param {{ ficha: any, reveladosIds?: string[], notas?: string[] }} p
 */
export function blocoMemoria({ ficha, reveladosIds = [], notas = [] }) {
  const linhas = [];
  for (const id of reveladosIds) {
    const f = ficha.fatos.find((x) => x.id === id);
    if (f) linhas.push(`- [${f.id}] ${f.texto}`);
  }
  for (const n of notas.slice(-MAX_NOTAS)) linhas.push(`- ${n}`);
  return linhas.length ? linhas.join("\n") : "- (nada ainda)";
}

// turnos: [{ autor: 'aluno'|'paciente', texto }] em ordem. Devolve mensagens do chat; o paciente entra só com a fala.
export function ultimosTurnos(turnos, max = MAX_TURNOS_HISTORICO) {
  return turnos.slice(-max).map((t) => ({ role: t.autor === "aluno" ? "user" : "assistant", content: t.texto }));
}

// Ids já revelados em toda a sessão, a partir dos turnos do paciente.
export function reveladosAteAgora(turnos) {
  const ids = new Set();
  for (const t of turnos) if (t.autor === "paciente") for (const id of t.revelados ?? []) ids.add(id);
  return [...ids];
}
