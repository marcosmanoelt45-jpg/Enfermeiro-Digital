/**
 * dlpSanitizer.js
 * Módulo de Prevenção contra Perda e Vazamento de Dados (DLP) e Anonimização
 * em Estrita Conformidade com a LGPD (Lei nº 13.709/2018) e Resoluções COFEN.
 *
 * Princípios aplicados:
 * - Art. 5º, II & Art. 11: Dados de saúde são dados sensíveis.
 * - Art. 12: Dados anonimizados deixam de ser dados pessoais.
 * - Resolução COFEN nº 564/2017: Sigilo profissional e dever de proteção à intimidade do paciente.
 */

// Expressões regulares para detecção de dados identificadores
export const DLP_PATTERNS = {
  cpf: {
    label: "CPF (Cadastro de Pessoas Físicas)",
    regex: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g,
    mask: "[CPF_ANONIMIZADO]"
  },
  cns: {
    label: "CNS (Cartão Nacional de Saúde - 15 dígitos)",
    regex: /\b[1278]\d{14}\b/g,
    mask: "[CNS_ANONIMIZADO]"
  },
  telefone: {
    label: "Número de Telefone/Celular",
    regex: /\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9?\d{4}[-.\s]?\d{4})\b/g,
    mask: "[TELEFONE_ANONIMIZADO]"
  },
  email: {
    label: "Endereço de E-mail",
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    mask: "[EMAIL_ANONIMIZADO]"
  },
  cep: {
    label: "CEP / Endereço",
    regex: /\b\d{5}-?\d{3}\b/g,
    mask: "[CEP_ANONIMIZADO]"
  },
  leitoProntuario: {
    label: "Leito / Quarto / Prontuário Hospitalar Real",
    regex: /\b(?:leito|quarto|enfermaria|box|apto|prontu[aá]rio)\s*(?:nº|n[o°]|#)?\s*([0-9]+[a-zA-Z]?)\b/gi,
    mask: "[LEITO_DIDATICO]"
  }
};

/**
 * Inspeciona um texto e identifica se há dados pessoais identificáveis (LGPD DLP).
 * @param {string} text 
 * @returns {{ hasSensitiveData: boolean, matches: Array<{ type: string, label: string, snippet: string }> }}
 */
export function inspectClinicalInputForDLP(text) {
  if (!text || typeof text !== "string") {
    return { hasSensitiveData: false, matches: [] };
  }

  const matches = [];

  for (const [key, pattern] of Object.entries(DLP_PATTERNS)) {
    const found = text.match(pattern.regex);
    if (found && found.length > 0) {
      found.forEach((snippet) => {
        if (snippet.length >= 7) {
          matches.push({
            type: key,
            label: pattern.label,
            snippet
          });
        }
      });
    }
  }

  return {
    hasSensitiveData: matches.length > 0,
    matches
  };
}

/**
 * Anonimiza qualquer texto livre substituindo dados sensíveis identificadores.
 * @param {string} text 
 * @returns {string} Texto anonimizado
 */
export function sanitizeTextForLGPD(text) {
  if (!text || typeof text !== "string") return "";

  let sanitized = text;

  for (const [, pattern] of Object.entries(DLP_PATTERNS)) {
    sanitized = sanitized.replace(pattern.regex, pattern.mask);
  }

  return sanitized;
}

/**
 * Converte qualquer nome completo ou identificado em formato seguro de iniciais.
 * Ex: "Sebastião da Silva" -> "Paciente S. S."
 * @param {string} rawName 
 * @param {number|string} [identifier] 
 * @returns {string}
 */
export function anonymizePatientName(rawName, identifier = "") {
  if (!rawName || typeof rawName !== "string") {
    return `Paciente Simulado #${identifier || "X"}`;
  }

  // Remove prefixos como Seu, Dona, Sr., Sra.
  const clean = rawName
    .replace(/^(seu|dona|sr\.|sra\.|senhor|senhora)\s+/i, "")
    .trim();

  const parts = clean.split(/\s+/).filter(p => p.length > 0 && !["de", "da", "do", "das", "dos", "e"].includes(p.toLowerCase()));
  
  if (parts.length === 0) {
    return `Paciente Simulado #${identifier || "X"}`;
  }

  const initials = parts.map(p => p[0].toUpperCase() + ".").join(" ");
  return `Paciente ${initials}${identifier ? ` (Caso #${identifier})` : ""}`;
}
