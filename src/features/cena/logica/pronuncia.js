// Aplica o dicionário de pronúncia só ao ÁUDIO (a legenda mantém o texto original).
// Substituição por palavra inteira, sem diferenciar maiúsculas; as chaves mais longas vêm primeiro.
// O dicionário entra por parâmetro para testar sem ler arquivo; o padrão é o JSON do projeto.
import pronunciaPadrao from "../../../data/falas/pronuncia.js";

const SEM_PALAVRA = "[^\\p{L}\\p{N}_]";

function escapar(s) {
  return s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}

export function aplicarPronuncia(texto, dicionario = pronunciaPadrao) {
  let saida = String(texto ?? "");
  const chaves = Object.keys(dicionario).sort((a, b) => b.length - a.length);
  for (const chave of chaves) {
    const re = new RegExp(`(^|${SEM_PALAVRA})${escapar(chave)}(?=$|${SEM_PALAVRA})`, "giu");
    saida = saida.replace(re, (_, antes) => antes + dicionario[chave]);
  }
  return saida;
}
