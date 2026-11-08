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
let bloqueadoAte = 0;
// Para os testes.
export function _zerarBloqueio() {
  bloqueadoAte = 0;
}

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

// O Gemini às vezes termina o áudio com uma rajada alta de ruído (o "chiado de TV") depois de um silêncio.
// Corta esse trecho final quando ele é bem mais alto que a própria fala, e suaviza os últimos 30 ms.
export function limparFinal(pcm: Uint8Array, taxa = 24000): Uint8Array {
  const n = Math.floor(pcm.byteLength / 2);
  if (n < taxa * 0.2) return pcm;
  const amostras = new Int16Array(n);
  const dv = new DataView(pcm.buffer, pcm.byteOffset, n * 2);
  for (let i = 0; i < n; i++) amostras[i] = dv.getInt16(i * 2, true);

  const W = Math.round(taxa * 0.02); // janelas de 20 ms
  const janelas = Math.floor(n / W);
  const rms = Array.from({ length: janelas }, (_, w) => {
    let s = 0;
    for (let i = w * W; i < (w + 1) * W; i++) s += amostras[i] * amostras[i];
    return Math.sqrt(s / W);
  });

  let fim = n;
  // último silêncio de 100 ms ou mais (rms < 120)
  let w = janelas - 1;
  while (w >= 0 && rms[w] >= 120) w--;
  const fimSilencio = w;
  let corrida = 0;
  while (w >= 0 && rms[w] < 120) {
    corrida++;
    w--;
  }
  const depois = rms.slice(fimSilencio + 1);
  if (corrida >= 5 && depois.length > 0 && depois.length <= 15) {
    const picoFala = Math.max(1, ...rms.slice(0, Math.max(1, w + 1)));
    const mediaDepois = depois.reduce((a, b) => a + b, 0) / depois.length;
    if (mediaDepois > picoFala * 1.3) fim = Math.min(n, (w + 1 + Math.min(corrida, 3)) * W); // mantém 60 ms de silêncio
  }

  const saida = amostras.slice(0, fim);
  const fade = Math.min(saida.length, Math.round(taxa * 0.03));
  for (let i = 0; i < fade; i++) saida[saida.length - 1 - i] = Math.round(saida[saida.length - 1 - i] * (i / fade));
  const bytes = new Uint8Array(saida.length * 2);
  const out = new DataView(bytes.buffer);
  for (let i = 0; i < saida.length; i++) out.setInt16(i * 2, saida[i], true);
  return bytes;
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

// Nome do arquivo no bucket "vozes-cache". g2: áudios sem o chiado final (os g- antigos ficam sem uso).
export async function chaveCacheGemini(personagemId: string, texto: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${vozDoPersonagem(personagemId).voz}|${texto}`);
  const hash = await crypto.subtle.digest("SHA-1", bytes);
  return `g2-${Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("")}.wav`;
}

/**
 * Lote diário: gera, na ordem da lista, as falas que ainda não estão guardadas, até `max` ou até a
 * geração falhar (cota do dia acabou). Cada áudio gerado é salvo e passa a ser nosso: tocar de novo não gasta cota.
 */
export async function executarLote(
  { lista, existentes, gerar, salvar, max = 10 }: {
    lista: { p: string; t: string }[];
    existentes: Set<string>;
    gerar: (texto: string, personagemId: string) => Promise<Uint8Array | null>;
    salvar: (chave: string, wav: Uint8Array) => Promise<void>;
    max?: number;
  },
): Promise<{ gerados: number; faltam: number; parouPorFalha: boolean }> {
  const pendentes: { p: string; t: string; chave: string }[] = [];
  for (const f of lista) {
    const chave = await chaveCacheGemini(f.p, f.t);
    if (!existentes.has(chave)) pendentes.push({ ...f, chave });
  }
  let gerados = 0;
  let parouPorFalha = false;
  for (const f of pendentes) {
    if (gerados >= max) break;
    const wav = await gerar(f.t, f.p);
    if (!wav) {
      parouPorFalha = true;
      break;
    }
    await salvar(f.chave, wav);
    gerados++;
  }
  return { gerados, faltam: pendentes.length - gerados, parouPorFalha };
}

/** Gera a fala em WAV. Devolve null se não der (o cliente cai na voz do navegador). */
export async function falarComGemini(
  { texto, personagemId, chave, fetchImpl = fetch, timeoutMs = 12000, maxEsperaMs }: { texto: string; personagemId: string; chave: string; fetchImpl?: typeof fetch; timeoutMs?: number; maxEsperaMs?: number },
): Promise<Uint8Array | null> {
  const opcoesEspera = { maxMs: maxEsperaMs };
  // Cota do dia esgotada: nem tenta até ela voltar (cada tentativa perdida custava ~5 s de espera por frase).
  if (Date.now() < bloqueadoAte) return null;
  const { voz } = vozDoPersonagem(personagemId);
  // Sempre o MESMO modelo (o 1º da lista): trocar de modelo mudava o timbre no meio da conversa.
  // Se falhar, tenta o mesmo de novo; se falhar outra vez, o cliente usa a voz do navegador nessa frase.
  const primeiro = (await descobrirModelosTts(chave, fetchImpl))[0];
  for (const modelo of [primeiro, primeiro]) {
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
        // 429 = limite de uso. Registra QUAL limite (id da cota e valor) e espera o tempo pedido, se for curto.
        let espera = 0;
        let cota = "";
        let limite: number | null = null;
        if (r.status === 429) {
          try {
            const erro = (await r.json())?.error;
            for (const d of erro?.details ?? []) {
              const v = d?.violations?.[0];
              if (v?.quotaId) cota = String(v.quotaId).slice(0, 64);
              if (v?.quotaValue) limite = Number(v.quotaValue);
              if (d?.retryDelay) espera = Math.ceil(parseFloat(String(d.retryDelay)) * 1000);
            }
          } catch {
            // corpo ilegível
          }
        }
        logEvento("voz_gemini_falhou", { modelo, status: r.status, ms: Date.now() - inicio, cota: cota || null, limite, esperaMs: espera });
        if (r.status === 429 && /PerDay/i.test(cota)) {
          bloqueadoAte = Date.now() + Math.max(espera, 60_000);
          return null;
        }
        if (r.status === 429 && espera > 0 && espera <= (opcoesEspera.maxMs ?? 6000)) await new Promise((res) => setTimeout(res, espera));
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
      return pcmParaWav(limparFinal(base64ParaBytes(b64), taxa), taxa);
    } catch (e) {
      logEvento("voz_gemini_excecao", { modelo, tipo: e instanceof Error ? e.name : "Erro", ms: Date.now() - inicio });
    }
  }
  return null;
}
