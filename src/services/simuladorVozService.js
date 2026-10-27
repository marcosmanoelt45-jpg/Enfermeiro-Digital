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

export function pararFala() {
  currentTimers.forEach(clearTimeout);
  currentTimers = [];

  if (currentAudioElement) {
    try {
      currentAudioElement.pause();
      currentAudioElement.currentTime = 0;
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
    if (finished) return;
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
          onWordIndex(k);
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
        const durMs = (audio.duration && !isNaN(audio.duration) && audio.duration > 0)
          ? audio.duration * 1000
          : estimatedDuration;
        programarKaraoke(durMs);
      };

      audio.onended = () => {
        currentAudioElement = null;
        handleFinish();
      };

      audio.onerror = () => {
        // Fallback para Web Speech API se o arquivo não puder ser reproduzido
        currentAudioElement = null;
        tocarViaWebSpeech();
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Bloqueio de autoplay do navegador ou arquivo inacessível -> fallback
          tocarViaWebSpeech();
        });
      }
      return;
    } catch {
      // Se falhar ao instanciar Audio, segue para o fallback
    }
  }

  tocarViaWebSpeech();

  function tocarViaWebSpeech() {
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

/**
 * Inicia o reconhecimento de voz contínuo do estudante via Web Speech API.
 * Sem nenhuma resposta mockada ou exemplo pré-programado.
 *
 * @param {Object} options
 * @param {Function} [options.onInterim] (parcial: string) => void
 * @param {Function} [options.onFinal] (completo: string) => void
 * @param {Function} [options.onError] (erro: string) => void
 * @param {Function} [options.onEnd] () => void
 * @returns {{ stop: () => void }}
 */
export function iniciarReconhecimentoVoz(options = {}) {
  const { onInterim, onFinal, onError, onEnd } = options;

  const SpeechRecognition =
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  if (!SpeechRecognition) {
    if (onError) onError("Microfone não suportado neste navegador. Utilize a opção 'Prefiro digitar'.");
    if (onEnd) onEnd();
    return { stop: () => {} };
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;

    let transcriptAcumulada = "";
    let isStoppedManualmente = false;

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          transcriptAcumulada += (transcriptAcumulada ? " " : "") + item.trim();
        } else {
          interim += item;
        }
      }

      const textoExibicao = (transcriptAcumulada + " " + interim).trim();
      if (interim && onInterim) {
        onInterim(textoExibicao);
      }
      if (transcriptAcumulada && onFinal) {
        onFinal(transcriptAcumulada.trim());
      }
    };

    recognition.onerror = (event) => {
      console.warn("SpeechRecognition error:", event.error);
      if (onError) {
        if (event.error === "not-allowed" || event.error === "permission-denied") {
          onError("Permissão de microfone negada. Clique em 'Prefiro digitar' para responder.");
        } else if (event.error === "no-speech") {
          // Apenas silêncio momentâneo, não bloqueia
        } else {
          onError(`Microfone: ${event.error}`);
        }
      }
    };

    recognition.onend = () => {
      if (!isStoppedManualmente && transcriptAcumulada && onFinal) {
        onFinal(transcriptAcumulada.trim());
      }
      if (onEnd) onEnd();
    };

    recognition.start();

    return {
      stop: () => {
        isStoppedManualmente = true;
        try {
          recognition.stop();
        } catch {
          // ignore
        }
        if (transcriptAcumulada && onFinal) {
          onFinal(transcriptAcumulada.trim());
        }
        if (onEnd) onEnd();
      }
    };
  } catch (err) {
    if (onError) onError(err?.message || "Erro ao inicializar microfone");
    if (onEnd) onEnd();
    return { stop: () => {} };
  }
}

/**
 * Normaliza strings para comparação fonética e sinônimos clínicos.
 */
export function normalizarTextoVoz(texto) {
  if (!texto) return "";
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Validação semântica e fonética determinística de respostas faladas.
 */
export function validarRespostaFalada(respostaAluno, respostasAceitas = []) {
  if (!respostaAluno || !respostasAceitas.length) return false;

  const alunoNorm = normalizarTextoVoz(respostaAluno);

  for (const aceita of respostasAceitas) {
    const aceitaNorm = normalizarTextoVoz(aceita);
    if (!aceitaNorm) continue;

    if (alunoNorm === aceitaNorm) return true;

    if (alunoNorm.includes(aceitaNorm) || aceitaNorm.includes(alunoNorm)) {
      if (Math.min(alunoNorm.length, aceitaNorm.length) >= 4) {
        return true;
      }
    }

    const palavrasAceitas = aceitaNorm.split(" ").filter((w) => w.length > 2);
    if (palavrasAceitas.length > 0) {
      const contemTodas = palavrasAceitas.every((palavra) => alunoNorm.includes(palavra));
      if (contemTodas) return true;
    }
  }

  return false;
}
