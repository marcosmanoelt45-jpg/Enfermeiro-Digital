// Confere se uma definição de minijogo cumpre o C11. Devolve a lista de problemas (vazia = válida).
export const TIPOS = ["arrastar", "tocar-regiao", "ordenar", "medir", "escolher"];
export const CATEGORIAS = ["curativos", "avaliacao", "biosseguranca", "medicacao", "sinais_vitais", "procedimentos"];
const INSTRUMENTOS = ["termometro", "esfigmo", "glicosimetro", "contar-fr", "contar-pulso"];

export function validarDefinicao(def) {
  const erros = [];
  const faltou = (c) => erros.push(`campo obrigatório ausente: ${c}`);
  if (!def || typeof def !== "object") return ["definição vazia"];
  if (!/^[a-z0-9-]+$/.test(def.id ?? "")) erros.push("id deve ter só minúsculas, números e hífen");
  if (!TIPOS.includes(def.tipo)) erros.push(`tipo inválido: ${def.tipo}`);
  if (!CATEGORIAS.includes(def.categoria)) erros.push(`categoria inválida: ${def.categoria}`);
  for (const c of ["titulo", "instrucao"]) if (!String(def[c] ?? "").trim()) faltou(c);
  if (!def.fonte?.titulo) faltou("fonte.titulo");
  if (def.tipo && !def[def.tipo]) faltou(def.tipo);

  if (def.tipo === "arrastar" && def.arrastar) {
    const { alvos = [], itens = [] } = def.arrastar;
    if (!alvos.length) erros.push("arrastar precisa de pelo menos 1 alvo");
    if (!itens.length) erros.push("arrastar precisa de itens");
    const ids = new Set(alvos.map((a) => a.id));
    for (const i of itens) if (i.alvoCorreto !== null && !ids.has(i.alvoCorreto)) erros.push(`item ${i.id}: alvoCorreto inexistente`);
    if (!itens.some((i) => i.alvoCorreto !== null)) erros.push("arrastar precisa de pelo menos 1 item correto");
    for (const i of itens) if (i.alvoCorreto === null && !String(i.explicacao ?? "").trim()) erros.push(`distrator ${i.id} sem explicação`);
  }
  if (def.tipo === "ordenar" && def.ordenar) {
    const p = def.ordenar.passos ?? [];
    if (p.length < 3) erros.push("ordenar precisa de pelo menos 3 passos");
    if (new Set(p.map((x) => x.id)).size !== p.length) erros.push("ids de passos repetidos");
  }
  if (def.tipo === "tocar-regiao" && def["tocar-regiao"]) {
    const t = def["tocar-regiao"];
    if (!["explorar", "encontrar"].includes(t.objetivo)) erros.push("objetivo deve ser explorar ou encontrar");
    if (!(t.regioes ?? []).length) erros.push("tocar-regiao precisa de regiões");
    if (t.objetivo === "encontrar" && !t.regioes.some((r) => r.correta)) erros.push("encontrar precisa de uma região correta");
    for (const r of t.regioes ?? []) if (!String(r.achado ?? "").trim()) erros.push(`região ${r.id} sem achado`);
  }
  if (def.tipo === "medir" && def.medir) {
    const m = def.medir;
    if (!INSTRUMENTOS.includes(m.instrumento)) erros.push(`instrumento inválido: ${m.instrumento}`);
    if (!Number.isFinite(m.valorCorreto)) erros.push("valorCorreto deve ser número");
    if (!(m.tolerancia >= 0)) erros.push("tolerancia deve ser >= 0");
  }
  if (def.tipo === "escolher" && def.escolher) {
    const o = def.escolher.opcoes ?? [];
    if (o.length < 2) erros.push("escolher precisa de pelo menos 2 opções");
    if (o.filter((x) => x.correta).length !== 1) erros.push("escolher precisa de exatamente 1 opção correta");
    if (!String(def.escolher.pergunta ?? "").trim()) erros.push("escolher sem pergunta");
  }
  return erros;
}
