import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { AnimatePresence, m as motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { vibrate } from "@/lib/motion";
import { celebrate } from "@/lib/celebrate";
import { EVENTO_COMEMORACAO, MARCOS_DA_OFENSIVA } from "./comemoracoes.js";
import ChamaAcendendo from "./ofensiva/ChamaAcendendo.jsx";
import Odometro from "./ofensiva/Odometro.jsx";
import SemanaOfensiva from "./ofensiva/SemanaOfensiva.jsx";
import TelaOfensivaAmigo from "@/features/amigos/TelaOfensivaAmigo.jsx";

// Curvas e molas do projeto (src/lib/motion.js e as variáveis --ease-* de index.css).
const EASE_OUT = [0.23, 1, 0.32, 1];
const MOLA_POP = { type: "spring", duration: 0.5, bounce: 0.3 };

/**
 * Comemorações no estilo do Duolingo, com a cara do Enfere. Montado uma vez no App; ouve EVENTO_COMEMORACAO.
 * - Sequência: a cada 5 acertos seguidos, um selo desce do topo com o número ("10 acertos seguidos!"). Não
 *   bloqueia a tela e some sozinho em pouco mais de 2 s.
 * - Ofensiva: na 1ª resposta do dia, o foguinho aparece, o número de dias sobe (o antigo sai por cima e o novo
 *   entra por baixo) e o dia de hoje acende na semana. Fica até a pessoa tocar em Continuar.
 * Se as duas chegam juntas, a ofensiva vem primeiro e a sequência espera ela fechar.
 */
export default function Comemoracoes() {
  const [fila, setFila] = useState([]);
  useEffect(() => {
    const ouvir = (e) => setFila((f) => [...f, { ...e.detail, chave: `${Date.now()}-${Math.random()}` }]);
    window.addEventListener(EVENTO_COMEMORACAO, ouvir);
    return () => window.removeEventListener(EVENTO_COMEMORACAO, ouvir);
  }, []);
  const atual = fila[0] ?? null;
  const proxima = useCallback(() => setFila((f) => f.slice(1)), []);

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence mode="wait">
      {atual?.tipo === "ofensiva" && <TelaOfensiva key={atual.chave} de={atual.de} para={atual.para} semana={atual.semana} onFechar={proxima} />}
      {atual?.tipo === "sequencia" && <SeloSequencia key={atual.chave} n={atual.n} onFim={proxima} />}
      {atual?.tipo === "ofensiva_amigo" && <TelaOfensivaAmigo key={atual.chave} {...atual.dados} onFechar={proxima} />}
    </AnimatePresence>,
    document.body
  );
}

function SeloSequencia({ n, onFim }) {
  useEffect(() => {
    vibrate(15);
    const t = setTimeout(onFim, 2300);
    return () => clearTimeout(t);
  }, [onFim]);
  return (
    <motion.div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-[75] flex justify-center px-4 pt-[max(1rem,env(safe-area-inset-top))]"
      initial={{ opacity: 0, transform: "translateY(-24px) scale(0.96)" }}
      animate={{ opacity: 1, transform: "translateY(0px) scale(1)", transition: MOLA_POP }}
      exit={{ opacity: 0, transform: "translateY(-16px) scale(0.98)", transition: { duration: 0.2, ease: EASE_OUT } }}
    >
      <div className="flex items-center gap-3 rounded-full border-2 border-[#20D5B5]/60 bg-[#131F2E] py-2 pl-2 pr-5 shadow-[0_4px_0_#0A1118]">
        <motion.img
          src="/feedback/selo-sequencia.webp"
          alt=""
          width={48}
          height={48}
          className="h-12 w-12"
          initial={{ transform: "rotate(-20deg) scale(0.7)" }}
          animate={{ transform: "rotate(0deg) scale(1)", transition: { ...MOLA_POP, delay: 0.08 } }}
        />
        <div className="leading-tight">
          <p className="text-lg font-black text-[#EAF2F8]">
            <motion.span
              className="inline-block tabular-nums text-[#20D5B5]"
              initial={{ opacity: 0, transform: "translateY(8px)" }}
              animate={{ opacity: 1, transform: "translateY(0px)", transition: { duration: 0.25, ease: EASE_OUT, delay: 0.15 } }}
            >
              {n}
            </motion.span>{" "}
            acertos seguidos!
          </p>
          <p className="text-xs font-bold text-[#9FB3C6]">{n >= 20 ? "Que fase. Continue assim." : "Continue assim."}</p>
        </div>
      </div>
    </motion.div>
  );
}
SeloSequencia.propTypes = { n: PropTypes.number.isRequired, onFim: PropTypes.func.isRequired };

/**
 * Tela da ofensiva, em três tempos:
 * 1. entra a chama apagada (cinza) com o número de ontem e a semana, com hoje ainda vazio;
 * 2. ~0,6 s depois a chama acende (brilho + fagulhas), o número rola e o dia de hoje acende com um anel;
 * 3. título e botão chegam por último, para o toque de "Continuar" não pular a virada.
 * Marcos (7, 14, 30, 50, 100…) ganham ondas em volta da chama, um selo de marco e confete.
 */
function TelaOfensiva({ de, para, semana = [], onFechar }) {
  const reduzir = useReducedMotion();
  const [acesa, setAcesa] = useState(false);
  const botaoRef = useRef(null);
  const marco = MARCOS_DA_OFENSIVA.has(para);
  const perfeita = semana.length === 7 && semana.every((d) => d.ativo && !d.congelado);

  useEffect(() => {
    const t = setTimeout(() => {
      setAcesa(true);
      vibrate(marco ? [20, 40, 30] : 20);
      if (marco) celebrate({ count: 80, y: 0.42 });
      else if (perfeita) celebrate({ count: 45, y: 0.62 });
    }, reduzir ? 0 : 600);
    const f = setTimeout(() => botaoRef.current?.focus({ preventScroll: true }), reduzir ? 0 : 1000);
    const tecla = (e) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", tecla);
    return () => {
      clearTimeout(t);
      clearTimeout(f);
      window.removeEventListener("keydown", tecla);
    };
  }, [marco, perfeita, reduzir, onFechar]);

  const titulo = para <= 1 ? (de > 0 ? "Ofensiva recomeçada!" : "Você começou uma ofensiva!") : "dias seguidos!";
  const texto = marco
    ? "Volte amanhã para seguir rumo ao próximo marco."
    : perfeita
      ? "Semana perfeita: 7 dias sem precisar congelar."
      : para <= 1
        ? "Estude um pouco todo dia para o foguinho crescer."
        : "Volte amanhã para manter o foguinho aceso.";
  const depois = (s) => ({ duration: 0.28, ease: EASE_OUT, delay: reduzir ? 0 : s });

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ofensiva-titulo"
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-[#0B131D]/95 px-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.2, ease: EASE_OUT } }}
      exit={{ opacity: 0, transition: { duration: 0.18, ease: EASE_OUT } }}
    >
      <motion.div
        initial={{ opacity: 0, transform: "translateY(16px) scale(0.92)" }}
        animate={{ opacity: 1, transform: "translateY(0px) scale(1)", transition: { type: "spring", duration: 0.5, bounce: 0.25 } }}
      >
        <ChamaAcendendo acesa={acesa} marco={marco} tamanho={168} />
      </motion.div>

      <div className="-mt-3 text-[76px] font-black leading-none" style={{ color: acesa ? "#FFC247" : "#5B6E82", transition: "color 200ms ease" }}>
        <Odometro valor={acesa ? para : de} />
      </div>

      <motion.h2
        id="ofensiva-titulo"
        className="mt-1 text-2xl font-black text-[#EAF2F8]"
        initial={{ opacity: 0, transform: "translateY(8px)" }}
        animate={acesa ? { opacity: 1, transform: "translateY(0px)", transition: depois(0.15) } : {}}
      >
        {titulo}
      </motion.h2>

      {marco && (
        <motion.span
          className="mt-2 rounded-full border-2 border-[#FFC247]/60 bg-[#FFC247]/10 px-3 py-1 text-xs font-black text-[#FFC247]"
          initial={{ opacity: 0, transform: "scale(0.9)" }}
          animate={acesa ? { opacity: 1, transform: "scale(1)", transition: { ...MOLA_POP, delay: reduzir ? 0 : 0.3 } } : {}}
        >
          Marco de {para} dias
        </motion.span>
      )}

      <motion.p
        className="mt-1.5 max-w-xs text-sm font-semibold text-[#9FB3C6]"
        initial={{ opacity: 0 }}
        animate={acesa ? { opacity: 1, transition: depois(0.25) } : {}}
      >
        {texto}
      </motion.p>

      <div className="mt-6">
        <SemanaOfensiva semana={semana} acesa={acesa} />
      </div>

      <motion.div className="mt-8 w-full max-w-xs" initial={{ opacity: 0, transform: "translateY(8px)" }} animate={acesa ? { opacity: 1, transform: "translateY(0px)", transition: depois(0.4) } : {}}>
        <Button ref={botaoRef} variant="warning" size="lg" className="w-full" onClick={onFechar}>
          Continuar
        </Button>
      </motion.div>
    </motion.div>
  );
}
TelaOfensiva.propTypes = { de: PropTypes.number.isRequired, para: PropTypes.number.isRequired, semana: PropTypes.array, onFechar: PropTypes.func.isRequired };
