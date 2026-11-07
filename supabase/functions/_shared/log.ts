// Log em JSON, uma linha por evento. LGPD: nunca registre o texto do aluno nem o prompt, só ids, tamanhos,
// modelo e duração. Por isso a linha só aceita números, booleanos e textos curtos SEM espaço (ids, códigos,
// nomes de modelo); qualquer outra coisa é descartada.
const CHAVES_PROIBIDAS = new Set([
  "texto",
  "prompt",
  "mensagem",
  "mensagens",
  "content",
  "conteudo",
  "fala",
  "resposta",
  "systemprompt",
  "userprompt",
]);

const TEXTO_SEGURO = /^[\w.:/@+-]{1,64}$/;

export function montarLinhaDeLog(nome: string, dados: Record<string, unknown> = {}): string {
  const seguro: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(dados)) {
    if (CHAVES_PROIBIDAS.has(chave.toLowerCase())) continue;
    if (valor === null || typeof valor === "number" || typeof valor === "boolean") {
      seguro[chave] = valor;
    } else if (typeof valor === "string" && TEXTO_SEGURO.test(valor)) {
      seguro[chave] = valor;
    }
  }
  return JSON.stringify({ evento: nome, ...seguro, em: new Date().toISOString() });
}

export function logEvento(nome: string, dados: Record<string, unknown> = {}): void {
  console.log(montarLinhaDeLog(nome, dados));
}
