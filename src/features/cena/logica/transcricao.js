import { ErroServidor } from "./erroServidor.js";

// Duração em segundos para cobrar a cota: usa a do gravador; sem ela, estima pelo tamanho (~16 KB/s).
export function estimarDuracaoSeg(blob, duracaoSeg) {
  const informada = Number(duracaoSeg);
  if (Number.isFinite(informada) && informada >= 1) return Math.min(3600, Math.ceil(informada));
  const bytes = Number(blob?.size) || 0;
  return Math.min(3600, Math.max(1, Math.ceil(bytes / 16000)));
}

// Consulta o servidor a cada `intervaloMs` até ficar pronto, dar erro ou estourar `limiteMs`.
// `consultar()` devolve { status, texto? }; `esperar` e `agora` entram por injeção para testar sem relógio.
export async function aguardarTranscricao({ consultar, esperar, agora = () => Date.now(), intervaloMs = 3000, limiteMs = 240000, onEtapa = () => {} }) {
  const inicio = agora();
  while (agora() - inicio < limiteMs) {
    await esperar(intervaloMs);
    const r = await consultar();
    if (r?.status === "pronto") {
      onEtapa("Transcrição concluída.");
      return String(r.texto ?? "").trim();
    }
    if (r?.status === "erro") {
      throw new ErroServidor("IA_INDISPONIVEL", "Não foi possível transcrever este áudio.");
    }
    onEtapa(`Transcrevendo o áudio... ${Math.round((agora() - inicio) / 1000)}s`);
  }
  throw new ErroServidor("TIMEOUT", "A transcrição demorou mais que o esperado. Tente gravar um relato mais curto.");
}
