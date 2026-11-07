// Filtro de saída da fala do paciente: nunca deixa vazar que é IA, códigos ou nomes de diagnóstico de
// enfermagem, nomes de modelos/provedores nem o prompt; e corta em 3 frases.
export const FALA_RESERVA = "Desculpa, me perdi… o que você perguntou?";

const PROIBIDOS = [
  /\bsou (uma? )?(ia|i\.a\.|inteligência artificial|robô|chatbot)\b/i,
  /modelo de linguagem/i,
  /assistente virtual/i,
  /\b(gemini|gpt|chatgpt|openai|anthropic|claude|deepseek|openrouter|llama)\b/i,
  /\b(prompt|instruções (do|de) sistema|minhas instruções|regras fixas)\b/i,
  /\b00\d{3}\b/, // código NANDA
  /diagnóstico (de enfermagem )?(é|seria|correto)/i,
  /(padrão respiratório ineficaz|débito cardíaco diminuído|troca de gases prejudicada|perfusão tissular (cerebral |periférica )?ineficaz|volume de líquidos excessivo|risco de quedas)/i,
];

// Frases: corta em . ! ? … seguidos de espaço (respeita abreviações comuns e números como 2,5).
export function cortarEmFrases(texto, max = 3) {
  const t = String(texto ?? "").replace(/\s+/g, " ").trim();
  const partes = [];
  let inicio = 0;
  for (let i = 0; i < t.length; i++) {
    if (!".!?…".includes(t[i])) continue;
    let fim = i;
    while (fim + 1 < t.length && ".!?…".includes(t[fim + 1])) fim++;
    const depois = t[fim + 1];
    if (depois !== undefined && depois !== " ") {
      i = fim;
      continue;
    }
    if (t[i] === "." && /\b(dr|dra|sr|sra|srta|prof|enf)$/i.test(t.slice(inicio, i))) continue;
    partes.push(t.slice(inicio, fim + 1).trim());
    inicio = fim + 1;
    i = fim;
  }
  const resto = t.slice(inicio).trim();
  if (resto) partes.push(resto);
  return { frases: partes.slice(0, max), cortada: partes.length > max };
}

// Devolve { fala, trocada, cortada, motivo }. `trocada` = caiu na fala de reserva (registre no log).
export function filtrarFala(texto, reserva = FALA_RESERVA) {
  const original = String(texto ?? "").trim();
  if (!original) return { fala: reserva, trocada: true, cortada: false, motivo: "vazia" };
  const achado = PROIBIDOS.find((re) => re.test(original));
  if (achado) return { fala: reserva, trocada: true, cortada: false, motivo: "proibido" };
  const { frases, cortada } = cortarEmFrases(original, 3);
  return { fala: frases.join(" "), trocada: false, cortada, motivo: null };
}
