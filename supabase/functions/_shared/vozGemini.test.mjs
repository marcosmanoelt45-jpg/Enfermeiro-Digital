import test from "node:test";
import assert from "node:assert/strict";
import { falarComGemini, ordenarModelosTts, pcmParaWav, vozDoPersonagem } from "./vozGemini.ts";

const logOriginal = console.log;
test.before(() => { console.log = () => {}; });
test.after(() => { console.log = logOriginal; });

test("pcmParaWav monta o cabeçalho RIFF certo", () => {
  const wav = pcmParaWav(new Uint8Array([1, 2, 3, 4]), 24000);
  const txt = (a, b) => String.fromCharCode(...wav.slice(a, b));
  const v = new DataView(wav.buffer);
  assert.equal(txt(0, 4), "RIFF");
  assert.equal(txt(8, 12), "WAVE");
  assert.equal(txt(36, 40), "data");
  assert.equal(v.getUint32(24, true), 24000);
  assert.equal(v.getUint16(34, true), 16);
  assert.equal(v.getUint32(40, true), 4);
  assert.equal(wav.byteLength, 48);
});

test("ordenarModelosTts: só TTS com generateContent, apelido latest e flash primeiro", () => {
  const m = (name, metodos = ["generateContent"]) => ({ name: `models/${name}`, supportedGenerationMethods: metodos });
  assert.deepEqual(
    ordenarModelosTts([m("gemini-2.5-pro-preview-tts"), m("gemini-2.5-flash-preview-tts"), m("gemini-flash-latest"), m("gemini-3-flash-tts"), m("x-tts", ["embed"])]),
    ["gemini-3-flash-tts", "gemini-2.5-flash-preview-tts", "gemini-2.5-pro-preview-tts"],
  );
});

test("cada personagem tem voz; desconhecido cai na padrão", () => {
  for (const id of ["marcus", "teresinha", "medico-rui", "enfermeira-ana"]) assert.ok(vozDoPersonagem(id).voz);
  assert.equal(vozDoPersonagem("outro").voz, "Kore");
});

test("falarComGemini devolve WAV a partir do PCM base64 e usa a voz do personagem", async () => {
  const pedidos = [];
  const fetchImpl = async (url, init) => {
    pedidos.push({ url: String(url), corpo: init?.body ? JSON.parse(init.body) : null });
    if (String(url).includes("/models?")) return { ok: true, status: 200, json: async () => ({ models: [{ name: "models/gemini-9-flash-tts", supportedGenerationMethods: ["generateContent"] }] }) };
    return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ inlineData: { mimeType: "audio/L16;codec=pcm;rate=24000", data: btoa("\u0001\u0002\u0003\u0004") } }] } }] }) };
  };
  const wav = await falarComGemini({ texto: "Bom dia.", personagemId: "marcus", chave: "k", fetchImpl });
  assert.equal(wav.byteLength, 48);
  const geracao = pedidos.find((p) => p.url.includes(":generateContent"));
  assert.match(geracao.url, /gemini-9-flash-tts/);
  assert.equal(geracao.corpo.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName, "Charon");
  assert.match(geracao.corpo.contents[0].parts[0].text, /Bom dia\./);
});

test("falarComGemini devolve null quando o Gemini falha (cliente usa a voz do navegador)", async () => {
  const fetchImpl = async (url) => (String(url).includes("/models?") ? { ok: false, status: 500, json: async () => ({}) } : { ok: false, status: 503, json: async () => ({}) });
  assert.equal(await falarComGemini({ texto: "Oi.", personagemId: "teresinha", chave: "k", fetchImpl }), null);
});
