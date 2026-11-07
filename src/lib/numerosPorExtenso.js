// Números por extenso em português ("cento e vinte e cinco", "mil e duzentos", "meio").
// Usado pelo leitor de resposta falada do Cálculo e pelo parser de sinais vitais.

const UNIDADES = {
  zero: 0, um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10,
  onze: 11, doze: 12, treze: 13, catorze: 14, quatorze: 14, quinze: 15, dezesseis: 16, dezeseis: 16, dezessete: 17, dezesete: 17,
  dezoito: 18, dezenove: 19, dezanove: 19,
};
const DEZENAS = { vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, sessenta: 60, setenta: 70, oitenta: 80, noventa: 90 };
const CENTENAS = { cem: 100, cento: 100, duzentos: 200, duzentas: 200, trezentos: 300, trezentas: 300, quatrocentos: 400, quatrocentas: 400, quinhentos: 500, quinhentas: 500, seiscentos: 600, seiscentas: 600, setecentos: 700, setecentas: 700, oitocentos: 800, oitocentas: 800, novecentos: 900, novecentas: 900 };

export const SEPARADOR_DECIMAL = new Set(["virgula", "ponto"]);
export const META = new Set(["meio", "meia"]);

export const semAcento = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export const ehNumero = (t) => t in UNIDADES || t in DEZENAS || t in CENTENAS || t === "mil" || t === "milhao" || t === "milhoes";

// Soma por extenso ("cento e vinte e cinco", "mil e duzentos", "dois mil"). Devolve null se algo não for número.
export function inteiroPorExtenso(tokens) {
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

// O "e" só junta números que se compõem: "vinte e oito", "cento e vinte", "mil e duzentos".
// "doze e oito" são dois números (pressão 12 e 8), não 20.
function seCompoe(a, b) {
  const centena = a in CENTENAS && a !== "cem";
  const dezena = a in DEZENAS;
  const baixo = b in UNIDADES && UNIDADES[b] > 0;
  if (centena) return b in DEZENAS || (b in UNIDADES && b !== "zero");
  if (dezena) return baixo && UNIDADES[b] < 10;
  if (a === "mil") return b in CENTENAS || b in DEZENAS || baixo;
  return false;
}

// Valor de uma corrida de palavras ("trinta", "e", "seis", "virgula", "cinco") ou null.
export function valorDaCorrida(corrida) {
  const tokens = [...corrida];
  let metade = 0;
  if (META.has(tokens[tokens.length - 1])) {
    tokens.pop();
    if (tokens[tokens.length - 1] === "e") tokens.pop();
    metade = 0.5;
  }
  const sep = tokens.findIndex((t) => SEPARADOR_DECIMAL.has(t));
  const inteiros = sep >= 0 ? tokens.slice(0, sep) : tokens;
  const decimais = sep >= 0 ? tokens.slice(sep + 1) : [];
  if (!inteiros.length && !metade) return null;
  const parteInteira = inteiros.length ? inteiroPorExtenso(inteiros) : 0;
  if (parteInteira === null) return null;
  let valor = parteInteira + metade;
  if (decimais.length) {
    let zeros = 0;
    while (decimais[zeros] === "zero") zeros++;
    const resto = decimais.slice(zeros);
    const n = resto.length ? inteiroPorExtenso(resto) : 0;
    if (n === null) return null;
    valor += n === 0 ? 0 : n / 10 ** (zeros + String(n).length);
  }
  return Math.round(valor * 1e6) / 1e6;
}

/**
 * Troca números por extenso por dígitos dentro de um texto ("pressão doze por oito" → "pressão 12 por 8").
 * "um/uma" sozinhos ficam como estão (são artigos). O resto do texto não muda.
 */
export function extensoParaDigitos(texto) {
  const base = String(texto ?? "");
  const partes = base.split(/(\s+)/); // mantém os espaços
  const palavras = partes.map((p) => semAcento(p).replace(/[^a-z0-9]/g, ""));
  const saida = [];
  let i = 0;
  while (i < partes.length) {
    const p = palavras[i];
    const comeca = partes[i].trim() !== "" && (ehNumero(p) || (META.has(p) && false));
    if (!comeca) { saida.push(partes[i]); i++; continue; }
    // Estende a corrida por palavras de número, "e" que compõe, "vírgula" e "e meio".
    const corrida = [p];
    let fim = i;
    for (let j = i + 2; j < partes.length; j += 2) {
      const t = palavras[j];
      const anterior = corrida[corrida.length - 1];
      if (partes[j - 1].trim() !== "") break; // só espaços entre palavras
      if (ehNumero(t) && (anterior !== "e" || seCompoe(corrida[corrida.length - 2], t))) { corrida.push(t); fim = j; continue; }
      if (t === "e") {
        const proxima = palavras[j + 2];
        if (proxima && META.has(proxima) && ehNumero(anterior)) { corrida.push("e", proxima); fim = j + 2; j += 2; break; }
        if (proxima && ehNumero(proxima) && seCompoe(anterior, proxima)) { corrida.push("e"); fim = j; continue; }
        break;
      }
      if (SEPARADOR_DECIMAL.has(t) && ehNumero(anterior)) {
        const proxima = palavras[j + 2];
        if (proxima && ehNumero(proxima)) {
          corrida.push(t);
          fim = j;
          // consome a parte decimal inteira (zeros e dígitos)
          let k = j + 2;
          while (k < partes.length && ehNumero(palavras[k])) {
            corrida.push(palavras[k]);
            fim = k;
            const seguinte = palavras[k + 2];
            if (seguinte && seguinte === "e" && ehNumero(palavras[k + 4] ?? "") && seCompoe(palavras[k], palavras[k + 4])) { corrida.push("e"); k += 2; fim = k; continue; }
            k += 2;
          }
          j = k;
          break;
        }
        break;
      }
      break;
    }
    const somenteArtigo = corrida.length === 1 && (p === "um" || p === "uma");
    const valor = somenteArtigo ? null : valorDaCorrida(corrida);
    if (valor === null) {
      for (let k = i; k <= fim; k++) saida.push(partes[k]);
    } else {
      saida.push(String(valor));
    }
    i = fim + 1;
  }
  return saida.join("");
}
