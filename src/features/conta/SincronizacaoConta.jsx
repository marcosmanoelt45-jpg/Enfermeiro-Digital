import { useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { EVENTO_PROGRESSO, agendarSubida, descarregar, sincronizarAoEntrar } from "./sincronizacao.js";

/**
 * Montado uma vez no App: ao entrar, junta o progresso do aparelho com o da conta; depois, sobe cada mudança
 * (agrupada) e, ao sair da aba, sobe o que faltar. Não desenha nada.
 */
export default function SincronizacaoConta() {
  const { user } = useAuth();
  const id = user?.id;

  useEffect(() => {
    if (!id) return undefined;
    sincronizarAoEntrar(user);
    const mudou = () => agendarSubida(id);
    const saiu = () => document.visibilityState === "hidden" && descarregar();
    window.addEventListener(EVENTO_PROGRESSO, mudou);
    document.addEventListener("visibilitychange", saiu);
    return () => {
      window.removeEventListener(EVENTO_PROGRESSO, mudou);
      document.removeEventListener("visibilitychange", saiu);
      descarregar();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sincroniza de novo só quando troca a conta
  }, [id]);

  return null;
}
