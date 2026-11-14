import { useEffect, useState } from "react";
import { clinicalGamificationService } from "@/services/clinicalGamificationService";
import { EVENTO_PROGRESSO, EVENTO_SINCRONIZADO } from "@/features/conta/sincronizacao.js";

/**
 * Ofensiva, PE e o resto do estado de jogo, sempre atualizados. Depois do login o progresso chega do servidor
 * alguns segundos depois; antes só o Perfil escutava isso, e o Início e o cabeçalho ficavam com 0 até a pessoa
 * abrir o Perfil. Relê quando o progresso é sincronizado ou muda, e quando a aba volta ao foco.
 */
export function useEstadoJogo(userId) {
  const [estado, setEstado] = useState(() => clinicalGamificationService.getState(userId));
  useEffect(() => {
    const reler = () => setEstado(clinicalGamificationService.getState(userId));
    reler();
    const aoVoltar = () => document.visibilityState === "visible" && reler();
    window.addEventListener(EVENTO_SINCRONIZADO, reler);
    window.addEventListener(EVENTO_PROGRESSO, reler);
    window.addEventListener("storage", reler);
    document.addEventListener("visibilitychange", aoVoltar);
    // à meia-noite o dia vira: a ofensiva é recalculada (zera ou gasta o bloqueio) mesmo com o app aberto
    let meiaNoite;
    const agendar = () => {
      const agora = new Date();
      const amanha = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1, 0, 0, 5);
      meiaNoite = setTimeout(() => { reler(); agendar(); }, amanha - agora);
    };
    agendar();
    return () => {
      clearTimeout(meiaNoite);
      window.removeEventListener(EVENTO_SINCRONIZADO, reler);
      window.removeEventListener(EVENTO_PROGRESSO, reler);
      window.removeEventListener("storage", reler);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [userId]);
  return estado;
}
