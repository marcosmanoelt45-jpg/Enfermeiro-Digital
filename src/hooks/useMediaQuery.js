import { useSyncExternalStore } from "react";

/**
 * useMediaQuery
 * Diz se a media query bate agora e atualiza quando a tela muda de tamanho.
 * Serve para montar só o layout visível (o outro, escondido por CSS, ainda rodaria vídeo e cálculos).
 */
export function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}
