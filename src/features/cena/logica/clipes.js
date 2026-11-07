// Regra de fallback de clipe do C1.
const FALLBACK = {
  feliz: ["acerto"],
  dor: ["pensando"],
  irritado: ["pensando"],
  desconfiado: ["pensando"],
  confuso: ["pensando"],
  acerto: ["parado"],
  erro: ["parado"],
};

// Devolve a emoção cujo clipe existe em disco, ou null quando o personagem não tem nenhum (mostra o poster).
export function resolverClipe(personagem, emocao) {
  const tem = new Set(personagem?.clipes ?? []);
  const ordem = [emocao, ...(FALLBACK[emocao] ?? []), "falando", "parado"];
  for (const e of ordem) if (tem.has(e)) return e;
  return null;
}

// Caminho do clipe (sem extensão) na pasta do personagem; "fala" vira "falando" nos pacientes antigos.
export function caminhoDoClipe(personagem, emocao) {
  const pasta = personagem.pasta ?? `/personagens/${personagem.id}`;
  return `${pasta}/${personagem.arquivos?.[emocao] ?? emocao}`;
}
