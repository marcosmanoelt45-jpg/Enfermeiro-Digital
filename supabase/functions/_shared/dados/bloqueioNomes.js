// Lista de bloqueio simples para nomes gerados pela IA: pessoas muito conhecidas e palavrões.
// A comparação ignora acentos e caixa e olha o nome inteiro e cada pedaço.
const BLOQUEADOS = [
  "lula", "bolsonaro", "dilma", "temer", "neymar", "pele", "ronaldo", "messi", "xuxa", "silvio santos",
  "faustao", "gugu", "ayrton senna", "senna", "roberto carlos", "gil", "caetano", "chico buarque",
  "porra", "merda", "caralho", "puta", "viado", "buceta", "cuzao", "foda", "bosta",
];

const normalizar = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export function nomeBloqueado(nome) {
  const n = normalizar(nome);
  if (!n) return true;
  const palavras = n.split(/\s+/);
  return BLOQUEADOS.some((b) => (b.includes(" ") ? n.includes(b) : palavras.includes(b)));
}
