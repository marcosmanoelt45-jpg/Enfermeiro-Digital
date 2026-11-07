// Reserva 1: reconhecimento de fala do próprio navegador (webkitSpeechRecognition). Nem todo navegador tem.
export function suportaReconhecimentoNavegador() {
  return typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function criarReconhecimento({ onTexto = () => {}, onErro = () => {} } = {}) {
  const Classe = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new Classe();
  rec.lang = "pt-BR";
  rec.continuous = true;
  rec.interimResults = true;
  let finais = "";
  let parcial = "";
  let terminou = null;

  rec.onresult = (e) => {
    parcial = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finais = `${finais} ${r[0].transcript}`.trim();
      else parcial = `${parcial} ${r[0].transcript}`.trim();
    }
    onTexto({ parcial, final: finais, texto: `${finais} ${parcial}`.trim() });
  };
  rec.onerror = (e) => onErro(e);
  rec.onend = () => terminou?.();

  return {
    iniciar: () => rec.start(),
    async concluir() {
      const fim = new Promise((r) => (terminou = r));
      try {
        rec.stop();
      } catch {
        // já parado
      }
      await Promise.race([fim, new Promise((r) => setTimeout(r, 1500))]);
      return `${finais} ${parcial}`.trim();
    },
    cancelar() {
      try {
        rec.abort();
      } catch {
        // já parado
      }
    },
  };
}
