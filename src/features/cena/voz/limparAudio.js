// Limpa o fim das falas do Gemini TTS no navegador (vale também para os áudios já guardados no cache).
// O Gemini às vezes termina com um trecho de ruído tipo "chiado de TV". Ruído desses tem muitos cruzamentos
// por zero (é um sinal "áspero"); a voz, bem menos. A busca vem do fim: pula silêncio e ruído e para na
// última janela que soa como voz. Só corta ruído que dure 120 ms ou mais (um "s" no fim da palavra é mais curto).

const JANELA_S = 0.02;
const SILENCIO_RMS = 120;
const ZCR_RUIDO = 0.28; // cruzamentos por amostra acima disso = ruído
const MIN_RUIDO_JANELAS = 6; // 120 ms
const MAX_CORTE_S = 2.5;

export function analisarJanelas(amostras, taxa) {
  const W = Math.max(1, Math.round(taxa * JANELA_S));
  const n = Math.floor(amostras.length / W);
  const jan = new Array(n);
  for (let w = 0; w < n; w++) {
    let s = 0;
    let z = 0;
    for (let i = w * W; i < (w + 1) * W; i++) {
      s += amostras[i] * amostras[i];
      if (i > w * W && (amostras[i] >= 0) !== (amostras[i - 1] >= 0)) z++;
    }
    jan[w] = { rms: Math.sqrt(s / W), zcr: z / W };
  }
  return { W, jan };
}

// Devolve quantas amostras manter (n = tudo).
export function pontoDeCorte(amostras, taxa) {
  const n = amostras.length;
  const { W, jan } = analisarJanelas(amostras, taxa);
  if (jan.length < 10) return n;
  const limite = Math.max(0, jan.length - Math.round(MAX_CORTE_S / JANELA_S));
  let w = jan.length - 1;
  let ruido = 0;
  for (; w >= limite; w--) {
    const j = jan[w];
    if (j.rms < SILENCIO_RMS) continue;
    if (j.zcr >= ZCR_RUIDO) {
      ruido++;
      continue;
    }
    break; // voz
  }
  if (ruido < MIN_RUIDO_JANELAS || w < limite) return n;
  return Math.min(n, (w + 1) * W + Math.round(taxa * 0.06)); // mantém 60 ms depois da última janela de voz
}

function fadeFinal(amostras, taxa, ms = 30) {
  const f = Math.min(amostras.length, Math.round((taxa * ms) / 1000));
  for (let i = 0; i < f; i++) amostras[amostras.length - 1 - i] = Math.round(amostras[amostras.length - 1 - i] * (i / f));
  return amostras;
}

// WAV PCM 16 bits (mono) -> WAV limpo. Qualquer outro formato volta como veio.
export function limparWav(bytes) {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const txt = (o, k) => String.fromCharCode(...bytes.subarray(o, o + k));
  if (bytes.byteLength < 44 || txt(0, 4) !== "RIFF" || txt(8, 4) !== "WAVE") return bytes;
  let pos = 12;
  let taxa = 24000;
  let canais = 1;
  let bits = 16;
  let dataPos = -1;
  let dataLen = 0;
  while (pos + 8 <= bytes.byteLength) {
    const id = txt(pos, 4);
    const tam = v.getUint32(pos + 4, true);
    if (id === "fmt ") {
      canais = v.getUint16(pos + 10, true);
      taxa = v.getUint32(pos + 12, true);
      bits = v.getUint16(pos + 22, true);
    } else if (id === "data") {
      dataPos = pos + 8;
      dataLen = Math.min(tam, bytes.byteLength - dataPos);
      break;
    }
    pos += 8 + tam + (tam % 2);
  }
  if (dataPos < 0 || bits !== 16 || canais !== 1) return bytes;
  const n = Math.floor(dataLen / 2);
  const amostras = new Int16Array(n);
  for (let i = 0; i < n; i++) amostras[i] = v.getInt16(dataPos + i * 2, true);
  const fim = pontoDeCorte(amostras, taxa);
  const saida = fadeFinal(amostras.slice(0, fim), taxa);
  const out = new Uint8Array(44 + saida.length * 2);
  const o = new DataView(out.buffer);
  const esc = (p, s) => [...s].forEach((c, i) => o.setUint8(p + i, c.charCodeAt(0)));
  esc(0, "RIFF");
  o.setUint32(4, 36 + saida.length * 2, true);
  esc(8, "WAVE");
  esc(12, "fmt ");
  o.setUint32(16, 16, true);
  o.setUint16(20, 1, true);
  o.setUint16(22, 1, true);
  o.setUint32(24, taxa, true);
  o.setUint32(28, taxa * 2, true);
  o.setUint16(32, 2, true);
  o.setUint16(34, 16, true);
  esc(36, "data");
  o.setUint32(40, saida.length * 2, true);
  for (let i = 0; i < saida.length; i++) o.setInt16(44 + i * 2, saida[i], true);
  return out;
}
