// Captura do microfone em PCM16 16 kHz (AudioWorklet). O stream é reaproveitado durante a cena e
// liberado em liberar() (encerrar, desmontar ou app em segundo plano) para o indicador do iOS apagar.
import { microphoneErrorMessage } from "@/hooks/useAudioRecorder";

const URL_WORKLET = new URL("./pcm-worklet.js", import.meta.url);

export async function abrirMicrofone() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw Object.assign(new Error("Microfone indisponível: abra o app em HTTPS ou atualize o navegador."), { name: "NotFoundError" });
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
  });
  const Contexto = window.AudioContext || window.webkitAudioContext;
  const contexto = new Contexto();
  let no = null;
  let fonte = null;
  let analisador = null;
  let dados = null;

  async function preparar() {
    if (no) return;
    await contexto.audioWorklet.addModule(URL_WORKLET);
    fonte = contexto.createMediaStreamSource(stream);
    analisador = contexto.createAnalyser();
    analisador.fftSize = 512;
    dados = new Uint8Array(analisador.fftSize);
    no = new AudioWorkletNode(contexto, "pcm-worklet");
    fonte.connect(analisador);
    fonte.connect(no);
    // O nó precisa estar no grafo para processar; a saída vai para um ganho mudo.
    const mudo = contexto.createGain();
    mudo.gain.value = 0;
    no.connect(mudo).connect(contexto.destination);
  }

  return {
    // Começa a entregar quadros PCM16 (ArrayBuffer de ~50 ms) a onQuadro.
    async iniciar(onQuadro) {
      await preparar();
      if (contexto.state === "suspended") await contexto.resume();
      no.port.onmessage = (e) => onQuadro(e.data);
    },
    pausar() {
      if (no) no.port.onmessage = null;
    },
    // Nível de 0 a 1 para a onda do botão.
    nivel() {
      if (!analisador) return 0;
      analisador.getByteTimeDomainData(dados);
      let pico = 0;
      for (let i = 0; i < dados.length; i++) pico = Math.max(pico, Math.abs(dados[i] - 128));
      return Math.min(1, pico / 64);
    },
    liberar() {
      try {
        no?.port && (no.port.onmessage = null);
        no?.disconnect();
        fonte?.disconnect();
      } catch {
        // grafo já desfeito
      }
      stream.getTracks().forEach((t) => t.stop());
      contexto.close().catch(() => {});
    },
  };
}

export { microphoneErrorMessage };
