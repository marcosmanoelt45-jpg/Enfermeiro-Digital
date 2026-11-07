// Voz ao vivo pelo Gemini (TTS), com a mesma GEMINI_API_KEY da IA. Usada pela função `voz` quando não há
// servidor próprio (VOZ_AO_VIVO_URL). O Gemini devolve PCM 16 bits; aqui vira WAV, que o navegador toca.
import { logEvento } from "./log.ts";

const BASE = "https://generativelanguage.googleapis.com/v1beta";

// Vozes prontas do Gemini por personagem (timbre e jeito).
export const VOZES_GEMINI: Record<string, { voz: string; jeito: string }> = {
  marcus: { voz: "Charon", jeito: "um senhor idoso, cansado e um pouco preocupado" },
  teresinha: { voz: "Sulafat", jeito: "uma senhora idosa, calma e gentil" },
  "medico-rui": { voz: "Orus", jeito: "um médico adulto, direto e seguro" },
  "enfermeira-ana": { voz: "Aoede", jeito: "uma enfermeira adulta, simpática e objetiva" },
};
const PADRAO = { voz: "Kore", jeito: "uma pessoa adulta, de forma natural" };

let modelosTts: string[] | null = null;

// deno-lint-ignore no-explicit-any
export function ordenarModelosTts(lista: any[]): string[] {
  const nomes = lista
    .filter((m) => Array.isArray(m?.supportedGenerationMethods) && m.supportedGenerationMethods.includes("generateContent"))
    .map((m) => String(m.name ?? "").replace(/^models\//, ""))
    .filter((n) => /^gemini-.*tts/.test(n));
  const pontos = (n: string) => (/latest/.test(n) ? 1000 : 0) + Number(n.match(/^gemini-(\d+(?:\.\d+)?)/)?.[1] ?? 0) * 10 + (/flash/.test(n) ? 1 : 0) - (/pro/.test(n) ? 2 : 0);
  return [...new Set(nomes)].sort((a, b) => pontos(b) - pontos(a));
}

async function descobrirModelosTts(chave: string, fetchImpl: typeof fetch): Promise<string[]> {
  if (modelosTts?.length) return modelosTts;
  try {
    const r = await fetchImpl(`${BASE}/models?pageSize=200`, { headers: { "x-goog-api-key": chave }, signal: AbortSignal.timeout(6000) });
    if (r.ok) modelosTts = ordenarModelosTts((await r.json())?.models ?? []);
    else logEvento("voz_gemini_listar_falhou", { status: r.status });
  } catch (e) {
    logEvento("voz_gemini_listar_excecao", { tipo: e instanceof Error ? e.name : "Erro" });
  }
  return modelosTts?.length ? modelosTts : ["gemini-2.5-flash-preview-tts"];
}

// PCM 16 bits mono -> WAV (cabeçalho RIFF de 44 bytes).
export function pcmParaWav(pcm: Uint8Array, taxa = 24000, canais = 1, bits = 16): Uint8Array {
  const cabecalho = new ArrayBuffer(44);
  const v = new DataView(cabecalho);
  const escrever = (pos: number, s: string) => [...s].forEach((c, i) => v.setUint8(pos + i, c.charCodeAt(0)));
  const bytesPorAmostra = bits / 8;
  escrever(0, "RIFF");
  v.setUint32(4, 36 + pcm.byteLength, true);
  escrever(8, "WAVE");
  escrever(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, canais, true);
  v.setUint32(24, taxa, true);
  v.setUint32(28, taxa * canais * bytesPorAmostra, true);
  v.setUint16(32, canais * bytesPorAmostra, true);
  v.setUint16(34, bits, true);
  escrever(36, "data");
  v.setUint32(40, pcm.byteLength, true);
  const wav = new Uint8Array(44 + pcm.byteLength);
  wav.set(new Uint8Array(cabecalho), 0);
  wav.set(pcm, 44);
  return wav;
}

function base64ParaBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function vozDoPersonagem(personagemId: string) {
  return VOZES_GEMINI[personagemId] ?? PADRAO;
}

/** Gera a fala em WAV. Devolve null se não der (o cliente cai na voz do navegador). */
export async function falarComGemini(
  { texto, personagemId, chave, fetchImpl = fetch, timeoutMs = 12000 }: { texto: string; personagemId: string; chave: string; fetchImpl?: typeof fetch; timeoutMs?: number },
): Promise<Uint8Array | null> {
  const { voz } = vozDoPersonagem(personagemId);
  const modelos = (await descobrirModelosTts(chave, fetchImpl)).slice(0, 2);
  for (const modelo of modelos) {
    const inicio = Date.now();
    try {
      const r = await fetchImpl(`${BASE}/models/${modelo}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": chave },
        body: JSON.stringify({
          // Só a fala: instrução de estilo no texto era lida em voz alta (o timbre vem da voz escolhida).
          contents: [{ parts: [{ text: texto }] }],
          generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voz } } } },
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!r.ok) {
        logEvento("voz_gemini_falhou", { modelo, status: r.status, ms: Date.now() - inicio });
        continue;
      }
      const dados = await r.json();
      const parte = dados?.candidates?.[0]?.content?.parts?.find((p: { inlineData?: { data?: string } }) => p?.inlineData?.data);
      const b64 = parte?.inlineData?.data;
      if (!b64) {
        logEvento("voz_gemini_vazia", { modelo, ms: Date.now() - inicio });
        continue;
      }
      const taxa = Number(String(parte.inlineData.mimeType ?? "").match(/rate=(\d+)/)?.[1] ?? 24000);
      logEvento("voz_gemini_ok", { modelo, voz, ms: Date.now() - inicio });
      return pcmParaWav(base64ParaBytes(b64), taxa);
    } catch (e) {
      logEvento("voz_gemini_excecao", { modelo, tipo: e instanceof Error ? e.name : "Erro", ms: Date.now() - inicio });
    }
  }
  return null;
}
