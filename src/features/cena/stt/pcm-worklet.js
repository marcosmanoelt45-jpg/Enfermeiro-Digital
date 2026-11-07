// AudioWorkletProcessor: junta amostras do microfone, reduz para 16 kHz e devolve PCM16 em blocos de ~50 ms.
// Fica autocontido (sem import) porque o Vite o serve como arquivo à parte, carregado com script-src 'self'.
/* global AudioWorkletProcessor, registerProcessor, sampleRate */

const ALVO = 16000;
const QUADRO = 800; // 50 ms a 16 kHz

class ProcessadorPcm extends AudioWorkletProcessor {
  constructor() {
    super();
    this.razao = sampleRate / ALVO;
    this.posicao = 0; // posição fracionária na entrada
    this.pendente = []; // amostras de saída (16 kHz) ainda não enviadas
  }

  process(entradas) {
    const canal = entradas[0]?.[0];
    if (!canal) return true;
    // Reamostragem por média de janela: suficiente para fala.
    while (this.posicao + this.razao <= canal.length) {
      const ini = Math.floor(this.posicao);
      const fim = Math.min(canal.length, Math.floor(this.posicao + this.razao));
      let soma = 0;
      for (let i = ini; i < fim; i++) soma += canal[i];
      const media = soma / Math.max(1, fim - ini);
      const s = Math.max(-1, Math.min(1, media));
      this.pendente.push(s < 0 ? s * 0x8000 : s * 0x7fff);
      this.posicao += this.razao;
    }
    this.posicao -= canal.length;
    while (this.pendente.length >= QUADRO) {
      const bloco = Int16Array.from(this.pendente.splice(0, QUADRO));
      this.port.postMessage(bloco.buffer, [bloco.buffer]);
    }
    return true;
  }
}

registerProcessor("pcm-worklet", ProcessadorPcm);
