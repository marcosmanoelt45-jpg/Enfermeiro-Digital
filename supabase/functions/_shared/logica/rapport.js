// Rapport em três níveis: o cliente nunca recebe o número da confiança (C8).
export function rapportDe(confianca) {
  const c = Number(confianca);
  if (!(c >= 40)) return "baixo";
  return c >= 70 ? "alto" : "medio";
}

export const limitarConfianca = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
