// Gera um minijogo "escolher" a partir de um achado da semiologia (SEMIOLOGY_KNOWLEDGE_BASE[gapKey]).
export function gerarEscolherDeAchado(gapKey, base) {
  const a = base?.[gapKey];
  if (!a || !Array.isArray(a.options) || a.options.length < 2) return null;
  return {
    id: `escolher-${String(gapKey).replace(/_/g, "-")}`,
    versao: 1,
    tipo: "escolher",
    titulo: a.title,
    instrucao: a.maneuver,
    categoria: "avaliacao",
    fonte: { titulo: "Semiologia e semiotécnica de enfermagem" },
    escolher: {
      pergunta: a.prompt,
      opcoes: a.options.map((o) => ({ id: o.id, texto: o.label, correta: Boolean(o.isCorrect), feedback: o.feedback ?? "" })),
      perola: a.pearl ?? null,
    },
    // Preenche a lacuna do Plantão quando o aluno acerta.
    achado: a.resultingItem ? { campo: gapKey, valor: a.resultingItem.value, texto: a.resultingItem.label } : null,
  };
}

export function gerarTodosOsEscolher(base) {
  return Object.keys(base ?? {}).map((k) => gerarEscolherDeAchado(k, base)).filter(Boolean);
}
