import { useEffect, useRef, useState } from "react";

// Ordem de preferência: Chrome/Android gravam webm/opus; Safari/iOS gravam mp4.
const MIME_TYPES = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg"];

export function pickRecorderMimeType() {
  if (typeof MediaRecorder === "undefined") return undefined;
  return MIME_TYPES.find((t) => {
    try {
      return MediaRecorder.isTypeSupported?.(t);
    } catch {
      return false;
    }
  });
}

// Traduz o erro do navegador numa instrução que o usuário consegue seguir.
export function microphoneErrorMessage(err) {
  switch (err?.name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Permissão negada: toque no cadeado da barra de endereço e libere o microfone.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "Nenhum microfone encontrado neste aparelho.";
    case "NotReadableError":
    case "AbortError":
      return "O microfone está em uso por outro app. Feche-o e tente de novo.";
    default:
      return "Não foi possível acessar o microfone. Verifique as permissões do navegador.";
  }
}

// Gravação de áudio do microfone (MediaRecorder), com tempo e URL de reprodução.
export default function useAudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState(null);
  const [url, setUrl] = useState(null);
  const [error, setError] = useState("");
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const urlRef = useRef(null);
  const startingRef = useRef(false);
  const mountedRef = useRef(true);

  function releaseStream() {
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      const recorder = recorderRef.current;
      if (recorder) {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        if (recorder.state !== "inactive") recorder.stop();
      }
      releaseStream();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  async function start() {
    // Evita abrir dois microfones com toque duplo enquanto a permissão ainda está pendente.
    if (startingRef.current || recorderRef.current?.state === "recording") return;
    setError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Microfone indisponível: abra o app em HTTPS ou atualize o navegador.");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      setError("Este navegador não grava áudio. Use o ditado ou digite.");
      return;
    }

    startingRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      chunksRef.current = [];
      const mimeType = pickRecorderMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        // O tipo real vem do gravador: o Safari pode ignorar o pedido e gravar mp4.
        const recorded = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType || "audio/mp4" });
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        const nextUrl = URL.createObjectURL(recorded);
        urlRef.current = nextUrl;
        setBlob(recorded);
        setUrl(nextUrl);
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (err) {
      releaseStream();
      setError(microphoneErrorMessage(err));
    } finally {
      startingRef.current = false;
    }
  }

  function stop() {
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    releaseStream();
  }

  function reset() {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.onstop = null; // descarta a gravação em curso
      stop();
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setBlob(null);
    setUrl(null);
    setSeconds(0);
    setError("");
  }

  return { recording, seconds, blob, url, error, start, stop, reset };
}
