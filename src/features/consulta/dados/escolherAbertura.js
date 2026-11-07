// Escolha da abertura da consulta (pura, sem importar os JSON: dá para testar no Node).
// semente: número ou texto (ex.: o id da sessão) que escolhe a variação sempre igual para a mesma sessão.
export function escolherAbertura(personagemId, personalidadePublica, semente = 0, fontes) {
  const grupo = fontes[personagemId];
  if (!grupo) return [];
  const prefixo = `consulta.abertura.${personalidadePublica}.`;
  let candidatas = grupo.falas.filter((f) => f.id.startsWith(prefixo));
  if (!candidatas.length) candidatas = grupo.falas.filter((f) => f.id.startsWith("consulta.abertura.surpresa."));
  if (!candidatas.length) return [];
  const n = typeof semente === "number" ? semente : [...String(semente)].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7);
  const f = candidatas[n % candidatas.length];
  return [{ id: f.id, texto: f.texto, origem: "fixa" }];
}
