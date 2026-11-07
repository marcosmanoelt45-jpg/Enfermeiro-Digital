// Carrega e cacheia public/vozes/<id>/manifest.json (um fetch por personagem; ausente = sem falas fixas).
const cache = new Map();

export function carregarManifesto(personagemId, buscar = (u) => fetch(u)) {
  if (!cache.has(personagemId)) {
    const promessa = (async () => {
      try {
        const r = await buscar(`/vozes/${personagemId}/manifest.json`);
        if (!r.ok) return { falas: {} };
        const json = await r.json();
        return json && typeof json === "object" && json.falas ? json : { falas: {} };
      } catch {
        return { falas: {} };
      }
    })();
    cache.set(personagemId, promessa);
  }
  return cache.get(personagemId);
}

export function limparCacheDeManifestos() {
  cache.clear();
}
