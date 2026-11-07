// Lógica pura do pipeline de falas fixas: decide o que gerar, o que pular e o que sobrou de arquivo.
// Sem rede, sem disco: os scripts passam os dados e recebem o plano. Testado em plano.test.mjs.
import { createHash } from "node:crypto";
export { aplicarPronuncia } from "../../src/features/cena/logica/pronuncia.js";

// hash = sha1(perfil + "|" + texto depois da pronúncia): mudar o dicionário regera só o que foi afetado.
export function hashDaFala(perfil, textoFalado) {
  return createHash("sha1").update(`${perfil}|${textoFalado}`).digest("hex");
}

export const nomeDoArquivo = (id, hash) => `${id}.${hash.slice(0, 8)}.mp3`;

// falas: [{ id, texto }]; manifesto: { falas: { id: { arquivo, hash, duracaoMs } } };
// arquivosNoDisco: Set com os nomes dos .mp3 da pasta do personagem; falar(texto) aplica a pronúncia.
export function planejar({ perfil, falas, manifesto, arquivosNoDisco, falar }) {
  const gerar = [];
  const pular = [];
  const ids = new Set();
  for (const f of falas) {
    if (ids.has(f.id)) throw new Error(`Id de fala repetido: ${f.id}`);
    ids.add(f.id);
    const hash = hashDaFala(perfil, falar(f.texto));
    const atual = manifesto?.falas?.[f.id];
    if (atual && atual.hash === hash && arquivosNoDisco.has(atual.arquivo)) pular.push(f.id);
    else gerar.push({ id: f.id, texto: f.texto, hash, arquivo: nomeDoArquivo(f.id, hash) });
  }
  // Órfãos: mp3 no disco que nenhuma fala do manifesto atual usa, e ids do manifesto que saíram do JSON.
  const emUso = new Set([...gerar.map((g) => g.arquivo), ...pular.map((id) => manifesto.falas[id].arquivo)]);
  const orfaos = [...arquivosNoDisco].filter((a) => !emUso.has(a));
  const idsRemovidos = Object.keys(manifesto?.falas ?? {}).filter((id) => !ids.has(id));
  return { gerar, pular, orfaos, idsRemovidos };
}

// Falas do JSON sem mp3 pronto (não estão no manifesto, ou o arquivo sumiu).
export function semMp3({ falas, manifesto, arquivosNoDisco }) {
  return falas.filter((f) => {
    const m = manifesto?.falas?.[f.id];
    return !m || !arquivosNoDisco.has(m.arquivo);
  }).map((f) => f.id);
}

// Duração em ms de um WAV PCM, lida do cabeçalho.
export function duracaoDoWav(buf) {
  if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WAVE") throw new Error("WAV inválido.");
  let off = 12;
  let byteRate = 0;
  while (off + 8 <= buf.length) {
    const id = buf.toString("ascii", off, off + 4);
    const tam = buf.readUInt32LE(off + 4);
    if (id === "fmt ") byteRate = buf.readUInt32LE(off + 16);
    if (id === "data") return Math.round((Math.min(tam, buf.length - off - 8) / byteRate) * 1000);
    off += 8 + tam;
  }
  throw new Error("WAV sem trecho de dados.");
}

// Vários JSON podem falar pelo mesmo personagem (ex.: dev.json e consulta-abertura-marcus.json).
// Junta por personagem, exige o mesmo perfil do VoiceBox e recusa ids repetidos entre arquivos.
export function agruparFalas(arquivos) {
  const grupos = new Map();
  for (const d of arquivos) {
    if (!d?.personagem || !Array.isArray(d.falas)) continue;
    const g = grupos.get(d.personagem) ?? { personagem: d.personagem, perfilVoicebox: d.perfilVoicebox, falas: [] };
    if (g.perfilVoicebox !== d.perfilVoicebox) throw new Error(`Perfis diferentes para "${d.personagem}": ${g.perfilVoicebox} e ${d.perfilVoicebox}`);
    g.falas.push(...d.falas);
    grupos.set(d.personagem, g);
  }
  return [...grupos.values()];
}
