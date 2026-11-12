import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { m as motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { vibrate } from "@/lib/motion";
import { celebrate } from "@/lib/celebrate";
import Odometro from "@/components/feedback/ofensiva/Odometro.jsx";
import ChamaDupla from "./ChamaDupla.jsx";
import BotaoCutucar from "./BotaoCutucar.jsx";
import { bateuMeta, proximaMeta } from "./ofensivaAmigos.js";

const EASE_OUT = [0.23, 1, 0.32, 1];

/**
 * Comemoração da ofensiva com um amigo, depois do 1º estudo do dia.
 * - Os dois já estudaram: os avatares se encontram, as duas chamas acendem e o número sobe.
 * - Só você estudou: a sua chama acende, a do amigo fica cinza, o número espera, e aparece "Cutucar".
 * Disparada pelo evento de comemoração com `tipo: "ofensiva_amigo"` (ver Comemoracoes.jsx).
 */
export default function TelaOfensivaAmigo({ eu, amigo, de, para, amigoFez = true, meta = 7, onFechar, onCutucar }) {
  const reduzir = useReducedMotion();
  const [virou, setVirou] = useState(false);
  const botaoRef = useRef(null);
  const meta_batida = amigoFez && bateuMeta(para);
  const primeiro = (amigo?.nome ?? "seu amigo").split(" ")[0];

  useEffect(() => {
    const t = setTimeout(() => {
      setVirou(true);
      if (amigoFez) {
        vibrate(meta_batida ? [20, 40, 30] : 20);
        if (meta_batida) celebrate({ count: 80, y: 0.4 });
      }
    }, reduzir ? 0 : 900);
    const f = setTimeout(() => botaoRef.current?.focus({ preventScroll: true }), reduzir ? 0 : 1200);
    const tecla = (e) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", tecla);
    return () => {
      clearTimeout(t);
      clearTimeout(f);
      window.removeEventListener("keydown", tecla);
    };
  }, [amigoFez, meta_batida, reduzir, onFechar]);

  const valor = amigoFez && virou ? para : de;
  const alvo = meta > valor ? meta : proximaMeta(valor).dias;
  const faltam = alvo - valor;
  const texto = !amigoFez
    ? `Falta ${primeiro} estudar hoje para o foguinho de vocês subir.`
    : meta_batida
      ? `Vocês bateram a meta de ${para} dias juntos.`
      : faltam > 0
        ? `${faltam === 1 ? "Falta 1 dia" : `Faltam ${faltam} dias`} para a meta de ${alvo}.`
        : "Continuem estudando juntos amanhã.";
  const depois = (s) => ({ duration: 0.28, ease: EASE_OUT, delay: reduzir ? 0 : s });

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ofensiva-amigo-titulo"
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-[#0B131D]/95 px-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.2, ease: EASE_OUT } }}
      exit={{ opacity: 0, transition: { duration: 0.18, ease: EASE_OUT } }}
    >
      <motion.h2
        id="ofensiva-amigo-titulo"
        className="text-2xl font-black text-[#FFC247]"
        initial={{ opacity: 0, transform: "translateY(-8px)" }}
        animate={{ opacity: 1, transform: "translateY(0px)", transition: depois(0.05) }}
      >
        Ofensiva com {primeiro}
      </motion.h2>

      <div className="mt-6">
        <ChamaDupla eu={eu} amigo={amigo} euAceso amigoAceso={amigoFez} tamanho={220} entrar />
      </div>

      <div className="mt-3 flex items-center gap-2 text-[56px] font-black leading-none" style={{ color: amigoFez && virou ? "#FFC247" : "#5B6E82", transition: "color 200ms ease" }}>
        <Odometro valor={valor} />
      </div>
      <p className="text-sm font-extrabold text-[#9FB3C6]">{valor === 1 ? "dia juntos" : "dias juntos"}</p>

      <motion.p
        className="mt-3 max-w-xs text-sm font-semibold text-[#EAF2F8]"
        initial={{ opacity: 0 }}
        animate={virou ? { opacity: 1, transition: depois(0.15) } : {}}
      >
        {texto}
      </motion.p>

      <motion.div
        className="mt-8 flex w-full max-w-xs flex-col gap-3"
        initial={{ opacity: 0, transform: "translateY(8px)" }}
        animate={virou ? { opacity: 1, transform: "translateY(0px)", transition: depois(0.3) } : {}}
      >
        {!amigoFez && <BotaoCutucar nome={primeiro} onCutucar={onCutucar} grande />}
        <Button ref={botaoRef} variant={amigoFez ? "warning" : "outline"} size="lg" className="w-full" onClick={onFechar}>
          Continuar
        </Button>
      </motion.div>
    </motion.div>
  );
}
TelaOfensivaAmigo.propTypes = {
  eu: PropTypes.object,
  amigo: PropTypes.object,
  de: PropTypes.number.isRequired,
  para: PropTypes.number.isRequired,
  amigoFez: PropTypes.bool,
  meta: PropTypes.number,
  onFechar: PropTypes.func.isRequired,
  onCutucar: PropTypes.func,
};
