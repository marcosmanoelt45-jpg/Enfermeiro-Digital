// Lê números ditos pelo aluno ("dois vírgula cinco", "sete e meio mililitros", "vinte e oito gotas", "0,5").
// Devolve { valor, unidade } (unidade é null se não foi dita) ou null se não achou número.

const UNIDADES = {
  zero: 0, um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10,
  onze: 11, doze: 12, treze: 13, catorze: 14, quatorze: 14, quinze: 15, dezesseis: 16, dezeseis: 16, dezessete: 17, dezesete: 17,
  dezoito: 18, dezenove: 19, dezanove: 19,
};
const DEZENAS = { vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, sessenta: 60, setenta: 70, oitenta: 80, noventa: 90 };
const CENTENAS = { cem: 100, cento: 100, duzentos: 200, duzentas: 200, trezentos: 300, trezentas: 300, quatrocentos: 400, quatrocentas: 400, quinhentos: 500, quinhentas: 500, seiscentos: 600, seiscentas: 600, setecentos: 700, setecentas: 700, oitocentos: 800, oitocentas: 800, novecentos: 900, novecentas: 900 };
const SEPARADOR_DECIMAL = new Set(["virgula", "ponto"]);
const META = new Set(["meio", "meia"]);

const ehNumero = (t) => t in UNIDADES || t in DEZENAS || t in CENTENAS || t === "mil" || t === "milhao" || t === "milhoes";

// Ordem importa: as frases mais longas vêm antes das curtas.
const UNIDADES_FALADAS = [
  [/microgramas? por minuto|mcg por minuto|mcg\/min/, "mcg/min"],
  [/(mililitros?|mls?) (por|na|a) hora|ml\/h/, "mL/h"],
  [/microgotas?|mcgts?|micro gotas?/, "mcgts/min"],
  [/gotas?|gts?|macrogotas?/, "gts/min"],
  [/ampolas?/, "ampolas"],
  [/mililitros?|\bmls?\b/, "mL"],
];

function semAcento(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Soma por extenso ("cento e vinte e cinco", "mil e duzentos", "dois mil").
function inteiroPorExtenso(tokens) {
  let total = 0;
  let atual = 0;
  for (const t of tokens) {
    if (t === "e") continue;
    if (t in UNIDADES) atual += UNIDADES[t];
    else if (t in DEZENAS) atual += DEZENAS[t];
    else if (t in CENTENAS) atual += CENTENAS[t];
    else if (t === "mil") { total += (atual || 1) * 1000; atual = 0; }
    else if (t === "milhao" || t === "milhoes") { total += (atual || 1) * 1e6; atual = 0; }
    else return null;
  }
  return total + atual;
}

function numeroDeDigitos(texto) {
  const m = texto.match(/\d+(?:[.,]\d+)*/);
  if (!m) return null;
  const bruto = m[0];
  let valor;
  if (/^\d{1,3}(\.\d{3})+$/.test(bruto)) valor = Number(bruto.replace(/\./g, "")); // 1.000 = mil
  else valor = Number(bruto.replace(",", "."));
  if (!Number.isFinite(valor)) return null;
  // "2 e meio"
  const depois = texto.slice(m.index + bruto.length);
  if (/^\s*e\s+(meio|meia)\b/.test(depois)) valor += 0.5;
  return valor;
}

function numeroPorExtenso(texto) {
  const tokens = texto.split(/[^a-z0-9]+/).filter(Boolean);
  const inicio = tokens.findIndex((t) => ehNumero(t) || META.has(t));
  if (inicio < 0) return null;
  // sequência contígua de palavras de número, "e", "virgula" e "meio"
  const corrida = [];
  for (let i = inicio; i < tokens.length; i++) {
    const t = tokens[i];
    if (ehNumero(t) || t === "e" || SEPARADOR_DECIMAL.has(t) || META.has(t)) corrida.push(t);
    else break;
  }
  while (corrida.length && corrida[corrida.length - 1] === "e") corrida.pop();

  let metade = 0;
  if (META.has(corrida[corrida.length - 1])) {
    corrida.pop();
    if (corrida[corrida.length - 1] === "e") corrida.pop();
    metade = 0.5;
  }
  const sep = corrida.findIndex((t) => SEPARADOR_DECIMAL.has(t));
  const parteInteira = sep >= 0 ? corrida.slice(0, sep) : corrida;
  const parteDecimal = sep >= 0 ? corrida.slice(sep + 1) : [];

  const inteiro = parteInteira.length ? inteiroPorExtenso(parteInteira) : 0;
  if (inteiro === null) return null;
  if (!parteInteira.length && !metade) return null;
  let valor = inteiro + metade;

  if (parteDecimal.length) {
    // "vírgula zero cinco" = 0,05; "vírgula vinte e cinco" = 0,25
    let zeros = 0;
    while (parteDecimal[zeros] === "zero") zeros++;
    const resto = parteDecimal.slice(zeros);
    const n = resto.length ? inteiroPorExtenso(resto) : 0;
    if (n === null) return null;
    valor += n === 0 ? 0 : n / 10 ** (zeros + String(n).length);
  }
  return valor;
}

function unidadeDita(texto) {
  for (const [regex, unidade] of UNIDADES_FALADAS) if (regex.test(texto)) return unidade;
  return null;
}

export function lerNumeroFalado(entrada) {
  if (typeof entrada !== "string" || !entrada.trim()) return null;
  const texto = semAcento(entrada);
  const valor = /\d/.test(texto) ? numeroDeDigitos(texto) : numeroPorExtenso(texto);
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return null;
  return { valor: Math.round(valor * 1e6) / 1e6, unidade: unidadeDita(texto) };
}
