/**
 * Serviço de Efeitos Sonoros Clínicos Táteis
 * Controla feedback sonoro para acertos, erros e cliques com suporte a Mute e persistência.
 */

const STORAGE_KEY_MUTED = 'enfere_sound_muted';

class SoundEffectsService {
  constructor() {
    this.muted = false;
    this.correctAudio = null;
    this.wrongAudio = null;
    this._init();
  }

  _init() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MUTED);
      // Padrão: desativado (false) para não ser invasivo caso o usuário prefira silêncio
      this.muted = saved !== null ? saved === 'true' : false;

      if (typeof window !== 'undefined' && typeof Audio !== 'undefined') {
        this.correctAudio = new Audio('/audio/clinical-correct.mp3');
        this.wrongAudio = new Audio('/audio/clinical-wrong.mp3');
        this.correctAudio.volume = 0.45;
        this.wrongAudio.volume = 0.35;
      }
    } catch {
      // Ambientes sem áudio ou sem suporte
    }
  }

  isMuted() {
    return this.muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    try {
      localStorage.setItem(STORAGE_KEY_MUTED, String(this.muted));
    } catch {}
    return this.muted;
  }

  setMuted(val) {
    this.muted = Boolean(val);
    try {
      localStorage.setItem(STORAGE_KEY_MUTED, String(this.muted));
    } catch {}
  }

  playCorrect() {
    if (this.muted) return;
    try {
      if (this.correctAudio) {
        this.correctAudio.currentTime = 0;
        this.correctAudio.play().catch(() => {});
      }
    } catch {}
  }

  playWrong() {
    if (this.muted) return;
    try {
      if (this.wrongAudio) {
        this.wrongAudio.currentTime = 0;
        this.wrongAudio.play().catch(() => {});
      }
    } catch {}
  }
}

export const soundEffects = new SoundEffectsService();
