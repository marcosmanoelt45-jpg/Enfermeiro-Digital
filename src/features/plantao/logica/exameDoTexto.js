// Reserva sem IA do Plantão: "vou olhar o curativo" -> a lacuna com mais palavras ditas (do rótulo ou de
// PALAVRAS_DOS_EXAMES), desde que a frase tenha um verbo de exame. A IA (cena-ia) entende pelo sentido; isto só
// entra quando ela não aponta exame nenhum. Termos curtos (pe, fc, o2) só contam como palavra inteira.
import { PALAVRAS_DOS_EXAMES } from "../dados/palavrasDosExames.js";

const normal = (t) => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const VERBO_DE_EXAME =
  /(examin|aval|medi|verific|olh|palp|auscult|escut|confer|chec|inspecion|observ|analis|afer|test|sentir|aplic|(^|\s)ver\s|vejo|veja|dar uma olhada|contar)/;

function citou(t, termo) {
  if (termo.length <= 3) return new RegExp(`(^|[^a-z0-9])${termo}([^a-z0-9]|$)`).test(t);
  return t.includes(termo);
}

export function exameDoTexto(texto, lacunas = []) {
  const t = normal(texto);
  if (!VERBO_DE_EXAME.test(t)) return null;
  let melhor = null;
  let pontos = 0;
  for (const l of lacunas) {
    const termos = new Set([...normal(l.rotulo).split(/[^a-z]+/).filter((p) => p.length >= 4), ...(PALAVRAS_DOS_EXAMES[l.campo] ?? [])]);
    const n = [...termos].filter((p) => citou(t, p)).length;
    if (n > pontos) {
      melhor = l;
      pontos = n;
    }
  }
  return melhor;
}
