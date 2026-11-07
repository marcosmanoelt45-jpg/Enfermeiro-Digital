import test from "node:test";
import assert from "node:assert/strict";
import { criarReprodutor, montarWavSilencioso, aguardarVozes } from "./reprodutor.js";
import { carregarManifesto, limparCacheDeManifestos } from "./manifestos.js";

function audioFalso() {
  const a = { src: "", duration: NaN, tocou: 0, pausou: 0, atributos: {} };
  a.setAttribute = (k, v) => (a.atributos[k] = v);
  a.play = async () => void a.tocou++;
  a.pause = () => void a.pausou++;
  return a;
}

function sinteseFalsa(vozes = [{ lang: "pt-BR", name: "Luciana" }]) {
  const s = { falados: [], vozes, ouvintes: {} };
  s.getVoices = () => s.vozes;
  s.speak = (u) => {
    s.falados.push(u);
    setImmediate(() => u.onend?.());
  };
  s.cancel = () => {};
  s.addEventListener = (n, f) => (s.ouvintes[n] = f);
  s.removeEventListener = (n) => delete s.ouvintes[n];
  return s;
}

const utteranceFalso = (texto) => ({ text: texto });

function montar(extra = {}) {
  const audio = audioFalso();
  const sintese = extra.sintese ?? sinteseFalsa();
  const r = criarReprodutor({ criarAudio: () => audio, sintese, criarUtterance: utteranceFalso, criarUrl: () => "blob:x", revogarUrl: () => {} });
  return { r, audio, sintese };
}

test("WAV silencioso tem cabeçalho RIFF/WAVE e tamanho coerente", () => {
  const w = montarWavSilencioso(100, 8000);
  assert.equal(String.fromCharCode(...w.slice(0, 4)), "RIFF");
  assert.equal(String.fromCharCode(...w.slice(8, 12)), "WAVE");
  assert.equal(w.length, 44 + 800 * 2);
  assert.ok(w.slice(44).every((b) => b === 0));
});

test("desbloquear toca o mudo no <audio> único e fala um utterance vazio", async () => {
  const { r, audio, sintese } = montar();
  await r.desbloquear();
  assert.equal(audio.tocou, 1);
  assert.equal(audio.pausou, 1);
  assert.deepEqual(sintese.falados.map((u) => u.text), [""]);
  assert.equal(audio.atributos.playsinline, "");
});

test("mp3: resolve quando o áudio termina e dispara o karaokê", async () => {
  const { r, audio } = montar();
  const palavras = [];
  const p = r.tocar({ tipo: "mp3", url: "/vozes/marcus/a.mp3", duracaoMs: 60 }, { texto: "bom dia enfermeiro", onPalavra: (i) => palavras.push(i) });
  assert.equal(audio.src, "/vozes/marcus/a.mp3");
  audio.duration = 0.06;
  audio.onloadedmetadata();
  await new Promise((res) => setTimeout(res, 90));
  audio.onended();
  await p;
  assert.deepEqual(palavras, [0, 1, 2]);
});

test("parar() resolve a fala em andamento e silencia os callbacks antigos", async () => {
  const { r, audio } = montar();
  const palavras = [];
  const p = r.tocar({ tipo: "mp3", url: "/a.mp3", duracaoMs: 5000 }, { texto: "uma frase longa aqui", onPalavra: (i) => palavras.push(i) });
  audio.onloadedmetadata?.();
  r.parar();
  await p;
  await new Promise((res) => setTimeout(res, 20));
  assert.equal(audio.onended, null);
  assert.ok(palavras.length <= 1);
});

test("navegador: fala frase por frase, com pronúncia no áudio e pt-BR", async () => {
  const { r, sintese } = montar();
  await r.tocar({ tipo: "navegador" }, { texto: "Faça 500 mL EV. Depois confira.", personagem: { voz: { navegador: { pitch: 0.7, rate: 0.9 } } } });
  assert.deepEqual(sintese.falados.map((u) => u.text), ["Faça 500 mililitros endovenoso.", "Depois confira."]);
  assert.ok(sintese.falados.every((u) => u.lang === "pt-BR" && u.pitch === 0.7 && u.rate === 0.9 && u.voice.name === "Luciana"));
});

test("navegador sem síntese não falha", async () => {
  const audio = audioFalso();
  const r = criarReprodutor({ criarAudio: () => audio, sintese: null });
  await r.tocar({ tipo: "navegador" }, { texto: "Oi." });
});

test("aguardarVozes resolve por voiceschanged ou por tempo-limite", async () => {
  const s = sinteseFalsa([]);
  const p = aguardarVozes(s, 500);
  s.vozes = [{ lang: "pt-BR" }];
  s.ouvintes.voiceschanged();
  await p;
  await aguardarVozes(sinteseFalsa([]), 20);
});

test("manifestos: um fetch por personagem, 404 e erro viram manifesto vazio", async () => {
  limparCacheDeManifestos();
  let chamadas = 0;
  const bom = async () => (chamadas++, { ok: true, json: async () => ({ falas: { a: { arquivo: "a.mp3" } } }) });
  assert.deepEqual((await carregarManifesto("x", bom)).falas.a, { arquivo: "a.mp3" });
  await carregarManifesto("x", bom);
  assert.equal(chamadas, 1);
  assert.deepEqual(await carregarManifesto("y", async () => ({ ok: false })), { falas: {} });
  assert.deepEqual(await carregarManifesto("z", async () => { throw new Error("rede"); }), { falas: {} });
});
