// Reprodutor de voz da Cena ao Vivo: um único <audio> reaproveitado (o iOS só libera o elemento que tocou
// num gesto), speechSynthesis frase por frase e karaokê por palavra.
// Tudo que toca o navegador entra por parâmetro para dar para testar com falsos.
import { dividirEmFrases, tempoPorPalavra } from "../logica/falas.js";
import { aplicarPronuncia } from "../logica/pronuncia.js";

// WAV mudo de 0,1 s (16 bits, mono, 8 kHz), montado em código para não depender de arquivo.
export function montarWavSilencioso(ms = 100, taxa = 8000) {
  const amostras = Math.floor((taxa * ms) / 1000);
  const dados = amostras * 2;
  const buf = new ArrayBuffer(44 + dados);
  const v = new DataView(buf);
  const texto = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  texto(0, "RIFF");
  v.setUint32(4, 36 + dados, true);
  texto(8, "WAVE");
  texto(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, taxa, true);
  v.setUint32(28, taxa * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  texto(36, "data");
  v.setUint32(40, dados, true);
  return new Uint8Array(buf);
}

// Nomes das vozes pt-BR mais comuns (Windows, Android/Chrome, iPhone/Mac) pelo sexo da voz.
const VOZES_MASCULINAS = /daniel|antonio|ant[oô]nio|felipe|fabio|f[aá]bio|julio|j[uú]lio|humberto|valerio|val[eé]rio|donato|nicolau|leonel|ricardo|male|masculin/i;
const VOZES_FEMININAS = /maria|francisca|thalita|luciana|fernanda|vit[oó]ria|leila|raquel|manuela|yara|giovanna|elza|female|feminin|google portugu[eê]s do brasil/i;

/**
 * Voz do navegador para o personagem: em português, do mesmo sexo e sempre a mesma (fica guardada no aparelho
 * por personagem). Antes era a primeira voz em português que aparecesse, às vezes feminina para o Sr. Marcus.
 */
export function escolherVozPtBr(sintese, personagem = null, armazenamento = typeof localStorage !== "undefined" ? localStorage : null) {
  const vozes = (sintese?.getVoices?.() ?? []).filter((v) => /^pt/i.test(v.lang));
  if (!vozes.length) return null;
  const chave = personagem?.id ? `enfere_voz_navegador_${personagem.id}` : null;
  try {
    const guardada = chave && armazenamento?.getItem(chave);
    const achada = guardada && vozes.find((v) => v.name === guardada);
    if (achada) return achada;
  } catch {
    /* sem armazenamento */
  }
  const brasil = vozes.filter((v) => /pt[-_]BR/i.test(v.lang));
  const lista = brasil.length ? brasil : vozes;
  const sexo = personagem?.sexo;
  const doSexo = sexo === "M" ? lista.filter((v) => VOZES_MASCULINAS.test(v.name)) : sexo === "F" ? lista.filter((v) => VOZES_FEMININAS.test(v.name) || !VOZES_MASCULINAS.test(v.name)) : lista;
  // vozes locais primeiro (mais estáveis e sem depender de rede)
  const ordenada = [...(doSexo.length ? doSexo : lista)].sort((a, b) => Number(Boolean(b.localService)) - Number(Boolean(a.localService)));
  const escolhida = ordenada[0];
  try {
    if (chave && escolhida) armazenamento?.setItem(chave, escolhida.name);
  } catch {
    /* sem armazenamento */
  }
  return escolhida;
}

/** Sem voz masculina instalada, o personagem homem fala com voz feminina mais grave (pitch menor). */
export function ajustesDaVoz(personagem, voz) {
  const base = personagem?.voz?.navegador ?? {};
  let pitch = base.pitch ?? 1;
  const vozFeminina = voz && !VOZES_MASCULINAS.test(voz.name);
  if (personagem?.sexo === "M" && vozFeminina) pitch = Math.min(pitch, 0.7);
  return { pitch, rate: base.rate ?? 1 };
}

// speechSynthesis.getVoices() vem vazio na primeira chamada do Chrome: espera voiceschanged por até 1 s.
export function aguardarVozes(sintese, timeoutMs = 1000) {
  return new Promise((resolve) => {
    if (!sintese) return resolve();
    if ((sintese.getVoices?.() ?? []).length) return resolve();
    const fim = () => {
      sintese.removeEventListener?.("voiceschanged", fim);
      clearTimeout(t);
      resolve();
    };
    const t = setTimeout(fim, timeoutMs);
    sintese.addEventListener?.("voiceschanged", fim);
  });
}

export function criarReprodutor({
  criarAudio = () => new Audio(),
  sintese = typeof window !== "undefined" ? window.speechSynthesis : null,
  criarUtterance = (t) => new SpeechSynthesisUtterance(t),
  criarUrl = (blob) => URL.createObjectURL(blob),
  revogarUrl = (u) => URL.revokeObjectURL(u),
} = {}) {
  const audio = criarAudio();
  audio.preload = "auto";
  audio.setAttribute?.("playsinline", "");
  let geracao = 0; // invalida callbacks de falas antigas
  let timers = [];
  let urlAtual = null;
  let encerrarAtual = null;

  function limparTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function soltarUrl() {
    if (urlAtual) revogarUrl(urlAtual);
    urlAtual = null;
  }

  function parar() {
    geracao++;
    limparTimers();
    try {
      audio.onended = audio.onerror = audio.onloadedmetadata = audio.onplaying = null;
      audio.pause();
    } catch {
      // elemento já solto
    }
    try {
      sintese?.cancel?.();
    } catch {
      // sem síntese
    }
    soltarUrl();
    const fim = encerrarAtual;
    encerrarAtual = null;
    fim?.();
  }

  // Dentro do primeiro toque ("Começar"): destrava o <audio> com um som mudo e a síntese com uma fala vazia.
  async function desbloquear() {
    try {
      const url = criarUrl(new Blob([montarWavSilencioso()], { type: "audio/wav" }));
      audio.src = url;
      await audio.play();
      audio.pause();
      revogarUrl(url);
    } catch {
      // o navegador pode recusar; a próxima fala tenta de novo
    }
    try {
      sintese?.speak?.(criarUtterance(""));
    } catch {
      // sem síntese
    }
  }

  function agendarKaraoke(texto, duracaoMs, onPalavra, gen) {
    if (!onPalavra) return;
    tempoPorPalavra(texto, duracaoMs).forEach((p, i) => {
      timers.push(setTimeout(() => gen === geracao && onPalavra(i), p.inicioMs));
    });
  }

  function tocarArquivo(url, texto, duracaoMs, onPalavra, gen, ehBlob, onInicio) {
    return new Promise((resolve) => {
      encerrarAtual = resolve;
      const terminou = () => {
        if (gen !== geracao) return;
        limparTimers();
        if (ehBlob) soltarUrl();
        encerrarAtual = null;
        resolve();
      };
      audio.onloadedmetadata = () => {
        const d = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration * 1000 : duracaoMs || texto.length * 60;
        agendarKaraoke(texto, d, onPalavra, gen);
      };
      audio.onended = terminou;
      audio.onerror = terminou;
      audio.onplaying = () => gen === geracao && onInicio?.();
      audio.src = url;
      audio.play?.().catch(terminou);
    });
  }

  async function falarPeloNavegador(texto, { personagem, onPalavra, onInicio }, gen) {
    if (!sintese) return;
    await aguardarVozes(sintese);
    if (gen !== geracao) return;
    const voz = escolherVozPtBr(sintese, personagem);
    const ajustes = ajustesDaVoz(personagem, voz);
    const falavel = aplicarPronuncia(texto);
    const frases = dividirEmFrases(falavel);
    const originais = dividirEmFrases(texto);
    let palavraBase = 0;
    for (let i = 0; i < frases.length; i++) {
      if (gen !== geracao) return;
      const palavrasDaFrase = (originais[i] ?? frases[i]).split(/\s+/).filter(Boolean).length;
      const base = palavraBase;
      await new Promise((resolve) => {
        encerrarAtual = resolve;
        const u = criarUtterance(frases[i]);
        u.lang = "pt-BR";
        if (voz) u.voice = voz;
        u.pitch = ajustes.pitch;
        u.rate = ajustes.rate;
        u.volume = 1;
        u.onboundary = (e) => {
          if (gen !== geracao || e.name === "sentence") return;
          // Estimativa: posição do caractere na frase -> índice da palavra.
          const idx = frases[i].slice(0, e.charIndex).split(/\s+/).filter(Boolean).length;
          onPalavra?.(base + Math.min(idx, Math.max(0, palavrasDaFrase - 1)));
        };
        const fim = () => {
          if (gen === geracao) encerrarAtual = null;
          resolve();
        };
        u.onstart = () => gen === geracao && onInicio?.();
        u.onend = fim;
        u.onerror = fim;
        sintese.speak(u);
      });
      palavraBase += palavrasDaFrase;
    }
  }

  // fonte: { tipo: 'mp3', url, duracaoMs } | { tipo: 'blob', blob } | { tipo: 'navegador' }
  // Resolve no fim da fala (ou quando parar() for chamado).
  // onInicio: chamado quando o som realmente começa (a animação de fala acompanha o áudio, não o pedido).
  async function tocar(fonte, { texto, personagem, onPalavra, onInicio } = {}) {
    parar();
    const gen = geracao;
    if (fonte.tipo === "mp3") return tocarArquivo(fonte.url, texto, fonte.duracaoMs, onPalavra, gen, false, onInicio);
    if (fonte.tipo === "blob") {
      urlAtual = criarUrl(fonte.blob);
      return tocarArquivo(urlAtual, texto, fonte.duracaoMs, onPalavra, gen, true, onInicio);
    }
    await falarPeloNavegador(texto, { personagem, onPalavra, onInicio }, gen);
  }

  return { desbloquear, tocar, parar };
}

// Um único reprodutor por página: o iOS só libera o <audio> que tocou num gesto, então quem destrava
// (ex.: o botão "Começar consulta") e quem fala (useVozPersonagem) precisam usar o mesmo elemento.
let compartilhado = null;
export function obterReprodutor() {
  if (!compartilhado) compartilhado = criarReprodutor();
  return compartilhado;
}
export const desbloquearAudio = () => obterReprodutor().desbloquear();
