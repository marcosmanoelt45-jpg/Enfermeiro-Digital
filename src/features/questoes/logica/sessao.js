// Montagem de uma sessão de Questões: quantidade por modo, filtro de tema e alternativas embaralhadas
// (o gabarito e a explicação de cada alternativa acompanham a troca de lugar).

const LETRAS = ["A", "B", "C", "D", "E"];

export function embaralhar(lista, rng = Math.random) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function embaralharAlternativas(q, rng = Math.random) {
  if (!Array.isArray(q.opcoes) || q.opcoes.length < 2) return { ...q };
  const ordem = embaralhar(q.opcoes.map((_, i) => i), rng);
  return {
    ...q,
    opcoes: ordem.map((i) => q.opcoes[i]),
    correta: ordem.indexOf(q.correta),
    explicacaoAlternativas: Array.isArray(q.explicacaoAlternativas)
      ? ordem.map((i, n) => ({ ...q.explicacaoAlternativas[i], letra: LETRAS[n], texto: q.opcoes[i], isCorreta: i === q.correta }))
      : q.explicacaoAlternativas,
  };
}

const LIMPAR = ["status", "escolhaAluno", "alternativaEscolhidaTexto", "gabaritoTexto", "opcoesFalhadas", "dataErro"];

export function montarSessao(banco, { modo = "rapida", tema = "todos", rng = Math.random } = {}) {
  let base = banco;
  if (tema !== "todos") {
    const doTema = banco.filter((q) => q.categoriaPratica === tema);
    if (doTema.length) base = doTema;
  }
  const faixa = modo === "rapida" ? [4, 6] : modo === "normal" ? [7, 9] : [base.length, Math.min(base.length, 9)];
  const n = modo === "revisao" ? Math.min(base.length, 9) : Math.min(base.length, faixa[0] + Math.floor(rng() * (faixa[1] - faixa[0] + 1)));
  const escolhidas = modo === "revisao" ? [...base].sort((a, b) => new Date(a.dataErro || 0) - new Date(b.dataErro || 0)).slice(0, n) : embaralhar(base, rng).slice(0, n);
  return escolhidas.map((q) => {
    const limpa = { ...q };
    for (const k of LIMPAR) delete limpa[k];
    return embaralharAlternativas(limpa, rng);
  });
}
