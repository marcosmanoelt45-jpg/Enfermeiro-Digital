// Nome escrito no crachá do avatar: só o primeiro nome, limpo e curto, e o tamanho de letra que cabe na área.
// JS puro (testado em nomeNoCracha.test.mjs); o desenho fica em compor.js.

export const MAX_LETRAS = 14;

/** Primeiro nome para o crachá: tira e-mail, símbolos e números; primeira letra maiúscula; até MAX_LETRAS. */
export function primeiroNome(nome) {
  if (typeof nome !== "string") return "";
  const semEmail = nome.includes("@") ? nome.split("@")[0] : nome;
  const palavra = semEmail
    .replace(/[._-]+/g, " ")
    .trim()
    .split(/\s+/)[0]
    ?.replace(/[^\p{L}'’]/gu, "");
  if (!palavra) return "";
  const certo = palavra.charAt(0).toLocaleUpperCase("pt-BR") + palavra.slice(1).toLocaleLowerCase("pt-BR");
  return [...certo].length > MAX_LETRAS ? [...certo].slice(0, MAX_LETRAS - 1).join("") + "." : certo;
}

/** Quanto o texto pode ser estreitado na horizontal antes de abreviar (letra condensada ainda legível). */
export const ESTREITO_MIN = 0.7;

/**
 * Escolhe o tamanho da letra para o texto caber em `largura` x `altura`. `medir(texto, tamanho)` devolve a
 * largura do texto. Diminui até 45% da altura; se ainda não couber, estreita o texto na horizontal (até 70%,
 * `escalaX`); só então corta letras e põe ponto. Antes o nome era abreviado cedo e nomes grandes saíam cortados.
 */
export function ajustarTexto(texto, largura, altura, medir) {
  const max = altura * 0.82;
  const min = altura * 0.45;
  let tamanho = max;
  while (tamanho > min && medir(texto, tamanho) > largura) tamanho -= 0.25;
  const w = medir(texto, tamanho);
  if (w <= largura) return { texto, tamanho, escalaX: 1 };
  if (largura / w >= ESTREITO_MIN) return { texto, tamanho, escalaX: largura / w };
  let letras = [...texto.replace(/\.$/, "")];
  while (letras.length > 2 && medir(letras.join("") + ".", tamanho) * ESTREITO_MIN > largura) letras = letras.slice(0, -1);
  const final = letras.join("") + ".";
  return { texto: final, tamanho, escalaX: Math.min(1, largura / medir(final, tamanho)) };
}
