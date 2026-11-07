// Sanitização DLP (LGPD) de texto livre antes de ir para a IA externa: CPF, CNS, RG, leito/quarto e telefone.
// Movida da clinical-ai-sanitize sem alteração; as duas funções usam esta.
export function sanitizeClinicalText(text: unknown): string {
  if (!text) return "";
  let clean = String(text);

  // CPF (11 dígitos, pontuados ou contínuos)
  clean = clean.replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[CPF_MASCARADO]");

  // CNS - Cartão Nacional de Saúde (15 dígitos)
  clean = clean.replace(/\b[1278]\d{14}\b/g, "[CNS_MASCARADO]");

  // RG
  clean = clean.replace(/\b\d{1,2}\.?\d{3}\.?\d{3}-?[\dX]\b/gi, "[RG_MASCARADO]");

  // Leitos, quartos, enfermarias, boxes
  clean = clean.replace(/\b(leito|quarto|enfermaria|box|apto|apartamento)\s*([0-9]+[a-zA-Z]?)\b/gi, "[LEITO_MASCARADO]");

  // Telefones
  clean = clean.replace(/\b(\(?\d{2}\)?\s*)?(9?\d{4}[-.\s]?\d{4})\b/g, "[TEL_MASCARADO]");

  return clean;
}
