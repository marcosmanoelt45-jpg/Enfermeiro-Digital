// Estado da permissão do microfone. pedir() só pode ser chamado dentro de um gesto (iOS).
import { useCallback, useEffect, useState } from "react";

export function estadoDoErro(err) {
  switch (err?.name) {
    case "NotAllowedError":
    case "SecurityError":
      return "negado";
    default:
      return "indisponivel"; // NotFoundError, NotReadableError, contexto inseguro...
  }
}

export default function usePermissaoMicrofone() {
  const [estado, setEstado] = useState("desconhecido");

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
      setEstado("indisponivel");
      return undefined;
    }
    let vivo = true;
    // Onde a Permissions API existe, lê o estado sem abrir o microfone.
    navigator.permissions?.query?.({ name: "microphone" }).then((p) => {
      if (!vivo) return;
      if (p.state === "granted") setEstado("concedido");
      else if (p.state === "denied") setEstado("negado");
      p.onchange = () => setEstado(p.state === "granted" ? "concedido" : p.state === "denied" ? "negado" : "desconhecido");
    }).catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);

  const pedir = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setEstado("concedido");
      return true;
    } catch (err) {
      setEstado(estadoDoErro(err));
      return false;
    }
  }, []);

  return { estado, pedir };
}
