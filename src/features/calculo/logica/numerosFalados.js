// Lê números ditos pelo aluno ("dois vírgula cinco", "sete e meio mililitros", "vinte e oito gotas", "0,5").
// Devolve { valor, unidade } (unidade é null se não foi dita) ou null se não achou número.
import { META, SEPARADOR_DECIMAL, ehNumero, semAcento, valorDaCorrida } from "../../../lib/numerosPorExtenso.js";

// Ordem importa: as frases mais longas vêm antes das curtas.
const UNIDADES_FALADAS = [
  [/microgramas? por minuto|mcg por minuto|mcg\/min/, "mcg/min"],
  [/(mililitros?|mls?) (por|na|a) hora|ml\/h/, "mL/h"],
  [/microgotas?|mcgts?|micro gotas?/, "mcgts/min"],
  [/gotas?|gts?|macrogotas?/, "gts/min"],
  [/ampolas?/, "ampolas"],
  [/mililitros?|\bmls?\b/, "mL"],
];

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
  return valorDaCorrida(corrida);
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
