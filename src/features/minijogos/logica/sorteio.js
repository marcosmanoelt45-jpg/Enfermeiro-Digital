// Sorteio dos distratores do minijogo de arrastar: a cada rodada entram todos os itens corretos e uma parte,
// sorteada, dos itens que não vão no alvo (arrastar.sorteio.distratores = quantos). A ordem também é sorteada.
// Sem `sorteio`, devolve a definição como está. `rng` permite teste determinístico.
export function sortearItens(def, rng = Math.random) {
  const n = def?.tipo === "arrastar" ? def.arrastar?.sorteio?.distratores : null;
  if (!n) return def;
  const corretos = def.arrastar.itens.filter((i) => i.alvoCorreto !== null);
  const distratores = embaralhar(def.arrastar.itens.filter((i) => i.alvoCorreto === null), rng).slice(0, n);
  return { ...def, arrastar: { ...def.arrastar, itens: embaralhar([...corretos, ...distratores], rng) } };
}

export function embaralhar(lista, rng = Math.random) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
