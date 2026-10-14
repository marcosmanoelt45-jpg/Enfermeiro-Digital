/**
 * sampleNames.js
 * Gerador de identificadores clínicos anonimizados em conformidade com a LGPD (Lei nº 13.709/2018).
 * Nomes completos de pacientes são estritamente convertidos em iniciais (ex: J.S.F.).
 */

const FIRST_NAMES_M = [
  "João", "Lucas", "Mateus", "Gabriel", "Rafael", "Pedro", "Carlos", "Antônio",
  "Francisco", "Luiz", "Paulo", "Marcos", "José", "Rodrigo", "Fernando"
];

const FIRST_NAMES_F = [
  "Maria", "Ana", "Juliana", "Mariana", "Beatriz", "Camila", "Fernanda", "Larissa",
  "Aline", "Patrícia", "Helena", "Francisca", "Tereza", "Cláudia", "Renata"
];

const LAST_NAMES = [
  "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves",
  "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida"
];

/**
 * Converte qualquer nome completo ou identificado em formato estrito de iniciais anonimizadas.
 * Ex: "João Silva Fernandes" -> "J.S.F."
 * Ex: "J. S. F." -> "J.S.F."
 * @param {string} rawName 
 * @returns {string}
 */
export function formatToInitials(rawName) {
  if (!rawName || typeof rawName !== "string") return "J.S.F.";
  const cleaned = rawName
    .replace(/^(paciente|sr\.|sra\.|seu|dona|senhor|senhora)\s+/i, "")
    .trim();
  
  if (!cleaned) return "J.S.F.";

  // Se já for uma sequência de iniciais com ou sem pontos (ex: "JSF", "J.S.F", "J. S. F.")
  if (/^[A-Za-z](\s*\.?\s*[A-Za-z])*\.?$/.test(cleaned) && cleaned.length <= 8) {
    const letters = cleaned.replace(/[^A-Za-z]/g, "").toUpperCase().split("");
    if (letters.length > 0) return letters.join(".") + ".";
  }

  // Divide o nome completo em palavras, removendo conectivos comuns
  const parts = cleaned
    .split(/\s+/)
    .filter(p => p.length > 0 && !["de", "da", "do", "das", "dos", "e"].includes(p.toLowerCase()));

  if (parts.length === 0) return "J.S.F.";
  return parts.map(p => p[0].toUpperCase()).join(".") + ".";
}

/**
 * Gera iniciais de paciente aleatórias e anônimas (ex: J.S.F., M.A.S.).
 * @param {"M"|"F"|null} preferredGender 
 * @returns {{ initials: string, name: string, gender: "M"|"F" }}
 */
export function generateRandomInitials(preferredGender = null) {
  const gender = preferredGender || (Math.random() > 0.5 ? "M" : "F");
  const firstList = gender === "M" ? FIRST_NAMES_M : FIRST_NAMES_F;
  const first = firstList[Math.floor(Math.random() * firstList.length)];
  const last1 = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const last2 = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const inits = `${first[0]}.${last1[0]}.${last2[0]}.`;
  
  return {
    initials: inits,
    name: inits, // Para compatibilidade reversa com chamadas legadas
    gender
  };
}

/**
 * Função de conveniência que SEMPRE retorna iniciais em vez de nomes completos.
 */
export function generateRandomName(preferredGender = null) {
  return generateRandomInitials(preferredGender);
}

export function generateRandomAge(min = 18, max = 88) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
