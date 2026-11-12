import React, { useState } from "react";
import PropTypes from "prop-types";
import { m as motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { vibrate } from "@/lib/motion";
import ChamaDupla from "./ChamaDupla.jsx";
import { METAS_AMIGOS } from "./ofensivaAmigos.js";

const EASE_OUT = [0.23, 1, 0.32, 1];

/**
 * Começo de uma ofensiva com amigo: a dupla escolhe uma meta (7, 14, 30 ou 50 dias). As chamas começam cinza;
 * ao confirmar, as duas acendem e a tela fecha logo depois.
 */
export default function TelaCompromisso({ eu, amigo, onConfirmar, onFechar }) {
  const reduzir = useReducedMotion();
  const [escolha, setEscolha] = useState(null);
  const [aceso, setAceso] = useState(false);
  const primeiro = (amigo?.nome ?? "seu amigo").split(" ")[0];

  const confirmar = () => {
    if (!escolha || aceso) return;
    vibrate(20);
    setAceso(true);
    setTimeout(() => onConfirmar?.(escolha), reduzir ? 0 : 900);
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="compromisso-titulo"
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-[#0B131D]/95 px-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.2, ease: EASE_OUT } }}
      exit={{ opacity: 0, transition: { duration: 0.18, ease: EASE_OUT } }}
    >
      <ChamaDupla eu={eu} amigo={amigo} euAceso={aceso} amigoAceso={aceso} tamanho={170} entrar />
      <h2 id="compromisso-titulo" className="mt-4 text-xl font-black text-[#EAF2F8]">
        Combine uma meta com {primeiro}
      </h2>
      <p className="mt-1 max-w-xs text-sm font-semibold text-[#9FB3C6]">O foguinho de vocês sobe nos dias em que os dois estudam.</p>

      <div role="radiogroup" aria-label="Meta da ofensiva" className="mt-5 flex w-full max-w-xs flex-col gap-2.5">
        {METAS_AMIGOS.map((m, i) => {
          const marcada = escolha === m.dias;
          return (
            <motion.button
              key={m.dias}
              type="button"
              role="radio"
              aria-checked={marcada}
              onClick={() => {
                vibrate(10);
                setEscolha(m.dias);
              }}
              className={`flex items-center justify-between rounded-2xl border-2 px-4 py-3 text-left transition-colors duration-150 ${
                marcada ? "border-[#20D5B5] bg-[#20D5B5]/10" : "border-[#27394B] bg-[#131F2E] hover:border-[#3A516A]"
              }`}
              initial={{ opacity: 0, transform: "translateY(10px)" }}
              animate={{ opacity: 1, transform: "translateY(0px)", transition: { duration: 0.25, ease: EASE_OUT, delay: reduzir ? 0 : 0.25 + i * 0.05 } }}
              whileTap={{ transform: "scale(0.98)" }}
            >
              <span className="text-base font-black text-[#EAF2F8]">{m.dias} dias</span>
              <span className="flex items-center gap-2 text-sm font-bold text-[#9FB3C6]">
                {m.nome}
                <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${marcada ? "border-[#20D5B5] bg-[#20D5B5] text-[#062B25]" : "border-[#3A516A]"}`}>
                  {marcada && (
                    <motion.span initial={{ transform: "scale(0.6)" }} animate={{ transform: "scale(1)" }} transition={{ type: "spring", duration: 0.3, bounce: 0.45 }}>
                      <Check className="h-3.5 w-3.5" strokeWidth={3.5} aria-hidden="true" />
                    </motion.span>
                  )}
                </span>
              </span>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
        <Button variant={escolha ? "primary" : "locked"} size="lg" className="w-full" onClick={confirmar} disabled={!escolha}>
          Combinar meta
        </Button>
        <Button variant="ghost" className="w-full" onClick={onFechar}>
          Agora não
        </Button>
      </div>
    </motion.div>
  );
}
TelaCompromisso.propTypes = { eu: PropTypes.object, amigo: PropTypes.object, onConfirmar: PropTypes.func, onFechar: PropTypes.func.isRequired };
