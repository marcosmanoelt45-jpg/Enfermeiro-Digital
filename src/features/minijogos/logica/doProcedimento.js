import { referenciaPop } from "../../../data/procedimentos/referenciasPop.js";
// Gera um minijogo "ordenar" a partir de um procedimento do procedureService (POPs viram minijogos de graça).
const LIMITE_TITULO = 70;
const MINIMO_PASSOS = 4;

const CATEGORIAS = { curativos: "curativos", semiotecnica: "biosseguranca", medicamentos: "medicacao" };

export function cortarTitulo(texto, limite = LIMITE_TITULO) {
  const t = String(texto ?? "").replace(/\s+/g, " ").trim();
  return t.length <= limite ? t : `${t.slice(0, limite - 1).trimEnd()}…`;
}

// Devolve a definição C11 ou null quando o procedimento tem menos de 4 passos.
export function gerarOrdenarDeProcedimento(proc) {
  const passos = [...(proc?.steps ?? [])].sort((a, b) => (a.stepNumber ?? 0) - (b.stepNumber ?? 0));
  if (passos.length < MINIMO_PASSOS) return null;
  const categoria = proc.id === "verificacao-sinais-vitais" ? "sinais_vitais" : CATEGORIAS[proc.category] ?? "procedimentos";
  return {
    id: `ordenar-${proc.id}`,
    versao: 1,
    tipo: "ordenar",
    titulo: `Ordene: ${cortarTitulo(proc.title, 60)}`,
    instrucao: "Coloque os passos do procedimento na ordem correta.",
    categoria,
    fonte: referenciaPop(proc.id) ?? { titulo: `POP: ${cortarTitulo(proc.title, 80)}`, url: proc.officialGuideUrl ?? proc.sourceUrl },
    ordenar: {
      passos: passos.map((p) => ({ id: p.id, texto: cortarTitulo(p.title) })),
      origem: { procedimentoId: proc.id },
    },
  };
}

// Todos os procedimentos elegíveis viram minijogo; devolve também os que ficaram de fora (para registrar).
export function gerarTodosOsOrdenar(procedimentos) {
  const jogos = [];
  const pulados = [];
  for (const p of procedimentos) {
    const j = gerarOrdenarDeProcedimento(p);
    if (j) jogos.push(j);
    else pulados.push(p.id);
  }
  return { jogos, pulados };
}
