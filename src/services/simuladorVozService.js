/**
 * simuladorVozService.js
 *
 * Gerenciador provisório de voz para o Simulador de Atendimento (Fase 1).
 * Implementa síntese (TTS via Web Speech API speechSynthesis) e reconhecimento (STT via SpeechRecognition).
 *
 * Preparado com interface modular para receber arquivos de áudio gerados
 * pelo VoiceBox MCP nas fases seguintes.
 */

// Configurações de voz por paciente
export const PACIENTE_VOZ_CONFIG = {
  marcus: {
    nome: "Sr. Marcus",
    pitch: 0.72,
    rate: 0.90,
    descricao: "Voz masculina idosa pt-BR"
  },
  teresinha: {
    nome: "Dona Teresinha",
    pitch: 1.10,
    rate: 0.92,
    descricao: "Voz feminina idosa pt-BR"
  }
};

let currentTimers = [];
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
 * Fala o texto em português utilizando a Web Speech API.
 * @param {string} texto Texto a ser falado
 * @param {'marcus'|'teresinha'} pacienteKey Chave do paciente
 * @param {Object} options
 * @param {boolean} [options.soundEnabled=true]
 * @param {Function} [options.onStart]
 * @param {Function} [options.onWordIndex] (index: number) => void
 * @param {Function} [options.onEnd]
 * @returns {void}
 */
export function falar(texto, pacienteKey = "marcus", options = {}) {
  pararFala();

  const {
    soundEnabled = true,
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

  // Duração estimada da fala em ms (aproximadamente 68ms por caractere)
  const estimatedDuration = Math.max(2200, texto.length * 68);

  let finished = false;
  function handleFinish() {
    if (finished) return;
    finished = true;
    isSpeakingState = false;

    // Garante que todas as palavras fiquem marcadas como faladas
    if (onWordIndex) {
      for (let i = 0; i < nWords; i++) {
        onWordIndex(i);
      }
    }

    if (onEnd) onEnd();
  }

  // Agenda o acendimento progressivo (efeito karaokê) das palavras
  if (onWordIndex && nWords > 0) {
    for (let k = 0; k < nWords; k++) {
      const delay = (estimatedDuration * k) / nWords;
      const timer = setTimeout(() => {
        onWordIndex(k);
      }, delay);
      currentTimers.push(timer);
    }
  }

  // Se som estiver desativado ou não houver speechSynthesis, utiliza apenas o timer
  if (!soundEnabled || typeof window === "undefined" || !window.speechSynthesis) {
    const finishTimer = setTimeout(handleFinish, estimatedDuration);
    currentTimers.push(finishTimer);
    return;
  }

  try {
    const config = PACIENTE_VOZ_CONFIG[pacienteKey] || PACIENTE_VOZ_CONFIG.marcus;
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

    // Timer de segurança caso o navegador silencie ou não dispare onend
    const safetyTimer = setTimeout(handleFinish, estimatedDuration + 3000);
    currentTimers.push(safetyTimer);
  } catch (err) {
    console.warn("SpeechSynthesis error, caindo para simulação por tempo:", err);
    const finishTimer = setTimeout(handleFinish, estimatedDuration);
    currentTimers.push(finishTimer);
  }
}

/**
 * Inicia o microfone e captura transcrição de fala do estudante.
 */
export function iniciarReconhecimentoVoz({
  onInterim,
  onFinal,
  onError,
  onEnd
}) {
  pararFala();

  if (typeof window === "undefined") {
    if (onError) onError("Reconhecimento não disponível fora do navegador");
    return { stop: () => {} };
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    // Simulação graciosa quando a API não estiver presente no browser
    let canceled = false;
    const simulatedText = "Higienizar as mãos com água e sabão";
    let curIndex = 0;

    const interval = setInterval(() => {
      if (canceled) return;
      curIndex += 2;
      const part = simulatedText.slice(0, curIndex);
      if (onInterim) onInterim(part);

      if (curIndex >= simulatedText.length) {
        clearInterval(interval);
        if (onFinal) onFinal(simulatedText);
        if (onEnd) onEnd();
      }
    }, 80);

    return {
      stop: () => {
        canceled = true;
        clearInterval(interval);
        if (onEnd) onEnd();
      }
    };
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    let finalTranscript = "";

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript = transcript;
        } else {
          interim += transcript;
        }
      }

      if (interim && onInterim) {
        onInterim(interim);
      }
      if (finalTranscript && onFinal) {
        onFinal(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      if (onError) onError(event.error);
    };

    recognition.onend = () => {
      if (onEnd) onEnd();
    };

    recognition.start();

    return {
      stop: () => {
        try {
          recognition.stop();
        } catch {
          // ignore
        }
      }
    };
  } catch (err) {
    if (onError) onError(err?.message || "Erro ao iniciar microfone");
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
 * Validação determinística de resposta falada.
 * Confere termos esperados por código e sinônimos (ex: "lavar as mãos" = "higienizar as mãos").
 */
export function validarRespostaFalada(textoAluno, aceitas = []) {
  if (!textoAluno) return false;
  const normalizado = normalizarTextoVoz(textoAluno);

  // Se houver lista de frases ou expressões aceitas
  if (Array.isArray(aceitas) && aceitas.length > 0) {
    const matchExatoOuContido = aceitas.some((item) => {
      const itemNorm = normalizarTextoVoz(item);
      return normalizado.includes(itemNorm) || itemNorm.includes(normalizado);
    });
    if (matchExatoOuContido) return true;
  }

  // Regras clínicas gerais para higiene de mãos
  const contemMao = /m[aã]o|maos|m[aã]os/.test(normalizado);
  const contemAcao = /higien|lav|limp|assep|asseps|alcool|sab|agua/.test(normalizado);

  return contemMao && contemAcao;
}
