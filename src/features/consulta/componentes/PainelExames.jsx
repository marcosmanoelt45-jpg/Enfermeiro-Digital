import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { AnimatePresence, m as motion } from "framer-motion";
import { CheckCircle2, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROTULO_EXAME } from "../dados/exames.js";

/** Resultados dos exames já feitos, logo abaixo do paciente. */
export default function PainelExames({ exames }) {
  if (exames.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Exames feitos">
      {exames.map((x) => (
        <li key={x.exameId} className="rounded-xl border border-[#27394B] bg-[#131F2E] px-2.5 py-1.5 text-xs font-semibold">
          <span className="text-[#9FB3C6]">{x.rotulo}:</span> <b className="text-[#EAF2F8]">{x.resultado}</b>
        </li>
      ))}
    </ul>
  );
}

PainelExames.propTypes = { exames: PropTypes.array.isRequired };

/**
 * Pop-up do exame: aparece quando o aluno pede um exame na conversa (o paciente concorda) e, depois, mostra o
 * resultado. Fica em portal no body: um transform num ancestral quebraria o position: fixed.
 */
export function PopupExame({ pedido, resultado, fazendo, erro, onFazer, onDispensar, onAnotar, onFechar }) {
  const aberto = Boolean(pedido || resultado);
  const fechar = resultado ? onFechar : onDispensar;
  const botaoRef = useRef(null);

  useEffect(() => {
    if (!aberto) return undefined;
    const t = setTimeout(() => botaoRef.current?.focus(), 60);
    const tecla = (e) => {
      if (e.key === "Escape" && !fazendo) fechar();
    };
    window.addEventListener("keydown", tecla);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", tecla);
    };
  }, [aberto, fazendo, fechar]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {aberto && (
        <motion.div
          key="popup-exame"
          className="fixed inset-0 z-[70] flex items-end justify-center bg-[#0B131D]/70 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={() => !fazendo && fechar()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="popup-exame-titulo"
            className="w-full max-w-sm rounded-3xl border border-[#20D5B5]/50 bg-[#131F2E] p-5 text-center shadow-[0_18px_50px_rgba(0,0,0,0.5)]"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {resultado ? (
              <>
                <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3DD68C]/15 text-[#3DD68C]">
                  <CheckCircle2 size={30} aria-hidden="true" />
                </span>
                <p id="popup-exame-titulo" className="text-sm font-bold text-[#9FB3C6]">{resultado.rotulo}</p>
                <p className="mt-1 text-xl font-extrabold text-[#EAF2F8]" role="status">{resultado.resultado}</p>
                <div className="mt-5 grid gap-2">
                  <Button ref={botaoRef} variant="primary" size="lg" onClick={onAnotar}>
                    Anotar na evolução
                  </Button>
                  <Button variant="ghost" onClick={onFechar}>
                    Fechar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#20D5B5]/15 text-[#20D5B5]">
                  <Stethoscope size={30} aria-hidden="true" />
                </span>
                <p className="text-xs font-extrabold text-[#20D5B5]">Exame liberado</p>
                <p id="popup-exame-titulo" className="mt-1 text-xl font-extrabold text-[#EAF2F8]">{ROTULO_EXAME[pedido] ?? "Exame"}</p>
                <p className="mt-1 text-sm text-[#9FB3C6]">O paciente concordou. Quer fazer agora?</p>
                {erro && (
                  <p className="mt-2 text-sm font-bold text-[#FF6B6B]" role="alert">
                    {erro}
                  </p>
                )}
                <div className="mt-5 grid gap-2">
                  <Button ref={botaoRef} variant="primary" size="lg" onClick={onFazer} loading={fazendo}>
                    {fazendo ? "Examinando…" : "Fazer o exame"}
                  </Button>
                  <Button variant="ghost" onClick={onDispensar} disabled={fazendo}>
                    Agora não
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

PopupExame.propTypes = {
  pedido: PropTypes.string,
  resultado: PropTypes.shape({ rotulo: PropTypes.string, resultado: PropTypes.string }),
  fazendo: PropTypes.bool,
  erro: PropTypes.string,
  onFazer: PropTypes.func.isRequired,
  onDispensar: PropTypes.func.isRequired,
  onAnotar: PropTypes.func.isRequired,
  onFechar: PropTypes.func.isRequired,
};
