// Avaliação dos 5 tipos de minijogo (C11). Cada função recebe a definição e as ações do aluno e devolve
// { acertos, erros, concluido, detalhes[] }. JS puro, testado em avaliar.test.mjs.

/**
 * Arrastar: `colocados` = { itemId: alvoId | null }. Acerto = item no alvo correto; item sem alvo correto
 * (distrator) colocado em qualquer alvo, ou item correto no alvo errado, conta erro. Concluído = todos os
 * itens corretos estão no alvo certo.
 */
export function avaliarArrastar(def, colocados) {
  const itens = def.arrastar.itens;
  let acertos = 0;
  let erros = 0;
  const detalhes = itens.map((item) => {
    const alvo = colocados?.[item.id] ?? null;
    if (alvo === null) return { id: item.id, estado: "fora", ok: item.alvoCorreto === null, explicacao: item.explicacao };
    const ok = item.alvoCorreto !== null && alvo === item.alvoCorreto;
    if (ok) acertos++;
    else erros++;
    return { id: item.id, estado: ok ? "certo" : "errado", ok, explicacao: item.explicacao };
  });
  const corretos = itens.filter((i) => i.alvoCorreto !== null);
  // Certo = todos os itens corretos no lugar e nenhum item a mais (um distrator na bandeja também é erro).
  const concluido = erros === 0 && corretos.every((i) => colocados?.[i.id] === i.alvoCorreto);
  return { acertos, erros, concluido, detalhes };
}

/**
 * Ordenar: `ordem` = ids dos passos na ordem que o aluno montou. Erros = inversões (pares fora de ordem);
 * `foraDeLugar` lista os passos que não estão na posição certa (é o que a interface mostra).
 */
export function avaliarOrdenar(def, ordem) {
  const correta = def.ordenar.passos.map((p) => p.id);
  const posicao = new Map(correta.map((id, i) => [id, i]));
  let erros = 0;
  for (let i = 0; i < ordem.length; i++) for (let j = i + 1; j < ordem.length; j++) if (posicao.get(ordem[i]) > posicao.get(ordem[j])) erros++;
  const foraDeLugar = ordem.filter((id, i) => correta[i] !== id);
  return {
    acertos: ordem.length - foraDeLugar.length,
    erros,
    concluido: foraDeLugar.length === 0 && ordem.length === correta.length,
    detalhes: ordem.map((id, i) => ({ id, ok: correta[i] === id })),
    foraDeLugar,
  };
}

/**
 * Tocar região: `tocadas` = ids das regiões tocadas. objetivo "explorar" conclui quando todas foram tocadas;
 * "encontrar" acerta quando a região tocada é a `correta` (cada toque errado conta erro).
 */
export function avaliarTocar(def, tocadas) {
  const { regioes, objetivo } = def["tocar-regiao"];
  const unicas = [...new Set(tocadas)].filter((id) => regioes.some((r) => r.id === id));
  if (objetivo === "explorar") {
    return { acertos: unicas.length, erros: 0, concluido: unicas.length === regioes.length, detalhes: regioes.map((r) => ({ id: r.id, ok: unicas.includes(r.id) })) };
  }
  const certas = unicas.filter((id) => regioes.find((r) => r.id === id)?.correta);
  const erradas = unicas.filter((id) => !regioes.find((r) => r.id === id)?.correta);
  return { acertos: certas.length > 0 ? 1 : 0, erros: erradas.length, concluido: certas.length > 0, detalhes: unicas.map((id) => ({ id, ok: certas.includes(id) })) };
}

/** Medir: acerta quando |valor − correto| ≤ tolerância. */
export function avaliarMedir(def, valor) {
  const { valorCorreto, tolerancia } = def.medir;
  const n = Number(String(valor).replace(",", "."));
  const ok = Number.isFinite(n) && Math.abs(n - valorCorreto) <= tolerancia;
  return { acertos: ok ? 1 : 0, erros: ok ? 0 : 1, concluido: ok, detalhes: [{ ok, valor: Number.isFinite(n) ? n : null, valorCorreto }] };
}

/** Escolher: uma opção; o feedback é o da opção escolhida. */
export function avaliarEscolher(def, opcaoId) {
  const opcao = def.escolher.opcoes.find((o) => o.id === opcaoId);
  const ok = Boolean(opcao?.correta);
  return { acertos: ok ? 1 : 0, erros: opcao && !ok ? 1 : 0, concluido: ok, detalhes: [{ id: opcaoId, ok, feedback: opcao?.feedback ?? "" }] };
}

export const AVALIADORES = {
  arrastar: avaliarArrastar,
  ordenar: avaliarOrdenar,
  "tocar-regiao": avaliarTocar,
  medir: avaliarMedir,
  escolher: avaliarEscolher,
};

/** Nota de 0 a 100 do histórico: round(100 × acertos / (acertos + erros)). */
export function notaDoResultado({ acertos, erros }) {
  const total = acertos + erros;
  return total === 0 ? 0 : Math.round((100 * acertos) / total);
}
