// Utilidades de fala: divisão em frases, tempo por palavra (karaokê) e escolha da origem do áudio.

const ABREVIACOES = ["dr", "dra", "sr", "sra", "srta", "prof", "profa", "enf", "ex", "av", "etc", "ltda", "nº"];

// Corta em . ! ? … sem quebrar abreviações ("Dr.", "Sra.") nem números ("2,5", "0.9").
export function dividirEmFrases(texto) {
  const t = String(texto ?? "").replace(/\s+/g, " ").trim();
  if (!t) return [];
  const frases = [];
  let inicio = 0;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (c !== "." && c !== "!" && c !== "?" && c !== "…") continue;
    // Pontuação repetida ("?!", "...") fecha junto.
    let fim = i;
    while (fim + 1 < t.length && ".!?…".includes(t[fim + 1])) fim++;
    const depois = t[fim + 1];
    if (c === "." && fim === i) {
      if (/\d/.test(t[i - 1] ?? "") && /\d/.test(depois ?? "")) continue; // número com ponto
      const palavra = (t.slice(inicio, i).match(/(\S+)$/)?.[1] ?? "").toLowerCase();
      if (ABREVIACOES.includes(palavra)) continue;
    }
    if (depois !== undefined && depois !== " ") {
      i = fim;
      continue;
    }
    const frase = t.slice(inicio, fim + 1).trim();
    if (frase) frases.push(frase);
    inicio = fim + 1;
    i = fim;
  }
  const resto = t.slice(inicio).trim();
  if (resto) frases.push(resto);
  return frases;
}

// Distribui a duração entre as palavras na proporção do tamanho de cada uma.
// Devolve [{ palavra, inicioMs, fimMs }] cobrindo exatamente duracaoMs.
export function tempoPorPalavra(texto, duracaoMs) {
  const palavras = String(texto ?? "").split(/\s+/).filter(Boolean);
  if (!palavras.length) return [];
  const total = palavras.reduce((s, p) => s + p.length + 1, 0);
  let acumulado = 0;
  return palavras.map((palavra, i) => {
    const inicioMs = Math.round((acumulado / total) * duracaoMs);
    acumulado += palavra.length + 1;
    const fimMs = i === palavras.length - 1 ? Math.round(duracaoMs) : Math.round((acumulado / total) * duracaoMs);
    return { palavra, inicioMs, fimMs };
  });
}

// C3: fixa com id no manifesto -> mp3; ao vivo -> servidor; senão navegador.
export function resolverFala(fala, manifesto, baseUrl = "") {
  if (fala.origem === "fixa" && fala.id) {
    const item = manifesto?.falas?.[fala.id];
    if (item?.arquivo) return { tipo: "mp3", url: `${baseUrl}/${item.arquivo}`, duracaoMs: item.duracaoMs };
  }
  if (fala.origem === "aovivo") return { tipo: "aovivo" };
  return { tipo: "navegador" };
}
