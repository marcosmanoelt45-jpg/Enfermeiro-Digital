/**
 * simuladorVozService.js
 *
 * Gerenciador de voz e áudio para o Simulador de Atendimento (Videochamada).
 * Integração com as vozes neurais locais geradas pelo VoiceBox (Marcus e Teresinha)
 * com fallback para síntese Web Speech API (speechSynthesis) e reconhecimento contínuo via SpeechRecognition.
 */

export const PACIENTE_VOZ_CONFIG = {
  marcus: {
    nome: "Sr. Marcus",
    pitch: 0.72,
    rate: 0.90,
    voiceFile: "/pacientes/marcus/fala.wav",
    descricao: "Voz masculina idosa (VoiceBox)"
  },
  teresinha: {
    nome: "Dona Teresinha",
    pitch: 1.10,
    rate: 0.92,
    voiceFile: "/pacientes/teresinha/fala.wav",
    descricao: "Voz feminina idosa (VoiceBox)"
  }
};

let currentTimers = [];
let currentAudioElement = null;
let isSpeakingState = false;

export function getAvailableVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices() || [];
}

export function pickPtBrVoice() {
  const voices = getAvailableVoices();
  const ptBr = voices.find((v) => /pt[-_]BR/i.test(v.lang));
  if (ptBr) return ptBr;
  const anyPt = voices.find((v) => /^pt/i.test(v.lang));
  return anyPt || null;
}

// Cada fala recebe um número; parar ou começar outra fala invalida os callbacks da anterior.
let falaGen = 0;

export function pararFala() {
  falaGen++;
  currentTimers.forEach(clearTimeout);
  currentTimers = [];

  if (currentAudioElement) {
    try {
      const audio = currentAudioElement;
      audio.onloadedmetadata = null;
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    } catch {
      // Ignora erro ao pausar elemento de áudio
    }
    currentAudioElement = null;
  }

  if (typeof window !== "undefined" && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignora erro de cancelamento em navegadores móveis
    }
  }
  isSpeakingState = false;
}

/**
 * Fala o texto utilizando prioritariamente o áudio real do VoiceBox
 * com fallback gracioso para Web Speech API.
 * 
 * @param {string} texto Texto a ser falado
 * @param {'marcus'|'teresinha'} pacienteKey Chave do paciente
 * @param {Object} options
 * @param {boolean} [options.soundEnabled=true]
 * @param {string} [options.customAudioFile] Caminho de áudio customizado
 * @param {Function} [options.onStart]
 * @param {Function} [options.onWordIndex] (index: number) => void
 * @param {Function} [options.onEnd]
 * @returns {void}
 */
export function falar(texto, pacienteKey = "marcus", options = {}) {
  pararFala();
  const gen = ++falaGen;
  const alive = () => gen === falaGen;

  const {
    soundEnabled = true,
    customAudioFile,
    onStart,
    onWordIndex,
    onEnd
  } = options;

  if (!texto) {
    if (onEnd) onEnd();
    return;
  }

  isSpeakingState = true;
  if (onStart) onStart();

  const words = texto.split(" ").filter(Boolean);
  const nWords = words.length;

  let finished = false;
  function handleFinish() {
    if (finished || !alive()) return;
    finished = true;
    isSpeakingState = false;

    if (onWordIndex) {
      for (let i = 0; i < nWords; i++) {
        onWordIndex(i);
      }
    }

    if (onEnd) onEnd();
  }

  function programarKaraoke(duracaoMs) {
    if (onWordIndex && nWords > 0) {
      for (let k = 0; k < nWords; k++) {
        const delay = (duracaoMs * k) / nWords;
        const timer = setTimeout(() => {
          if (alive()) onWordIndex(k);
        }, delay);
        currentTimers.push(timer);
      }
    }
  }

  const config = PACIENTE_VOZ_CONFIG[pacienteKey] || PACIENTE_VOZ_CONFIG.marcus;
  const audioFile = customAudioFile || config.voiceFile;

  // Duração estimada como fallback
  const estimatedDuration = Math.max(2200, texto.length * 68);

  // 1. Se som desligado, simula duração apenas para progresso visual
  if (!soundEnabled) {
    programarKaraoke(estimatedDuration);
    const finishTimer = setTimeout(handleFinish, estimatedDuration);
    currentTimers.push(finishTimer);
    return;
  }

  // 2. Tenta tocar o arquivo de áudio real do VoiceBox se disponível
  if (audioFile && typeof Audio !== "undefined") {
    try {
      const audio = new Audio(audioFile);
      currentAudioElement = audio;

      audio.onloadedmetadata = () => {
        if (!alive()) return;
        const durMs = (audio.duration && !isNaN(audio.duration) && audio.duration > 0)
          ? audio.duration * 1000
          : estimatedDuration;
        programarKaraoke(durMs);
      };

      audio.onended = () => {
        currentAudioElement = null;
        handleFinish();
      };

      // onerror e a rejeição do play() podem disparar juntos: a voz sintética só entra uma vez.
      let fellBack = false;
      const fallbackOnce = () => {
        if (fellBack || !alive()) return;
        fellBack = true;
        currentAudioElement = null;
        tocarViaWebSpeech();
      };

      audio.onerror = fallbackOnce;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // AbortError = a fala foi interrompida de propósito; não é motivo para falar de novo.
          if (err?.name === "AbortError") return;
          fallbackOnce();
        });
      }
      return;
    } catch {
      // Se falhar ao instanciar Audio, segue para o fallback
    }
  }

  tocarViaWebSpeech();

  function tocarViaWebSpeech() {
    if (!alive()) return;
    programarKaraoke(estimatedDuration);

    if (typeof window === "undefined" || !window.speechSynthesis) {
      const finishTimer = setTimeout(handleFinish, estimatedDuration);
      currentTimers.push(finishTimer);
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(texto);
      utterance.lang = "pt-BR";
      utterance.pitch = config.pitch;
      utterance.rate = config.rate;

      const voice = pickPtBrVoice();
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = handleFinish;
      utterance.onerror = handleFinish;

      window.speechSynthesis.speak(utterance);
    } catch {
      const finishTimer = setTimeout(handleFinish, estimatedDuration);
      currentTimers.push(finishTimer);
    }
  }
}
