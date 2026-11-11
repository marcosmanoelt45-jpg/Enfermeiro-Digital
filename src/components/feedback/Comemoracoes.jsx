import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { AnimatePresence, m as motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { vibrate } from "@/lib/motion";
import { celebrate } from "@/lib/celebrate";
import { EVENTO_COMEMORACAO } from "./comemoracoes.js";

// Curvas e molas do projeto (src/lib/motion.js e as variáveis --ease-* de index.css).
const EASE_OUT = [0.23, 1, 0.32, 1];
const MOLA_POP = { type: "spring", duration: 0.5, bounce: 0.3 };
const MARCOS_DA_OFENSIVA = new Set([7, 30, 50, 100, 365]);

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
      <div className="flex items-center gap-3 rounded-full border-2 border-[#20D5B5]/60 bg-[#131F2E] py-2 pl-2 pr-5 shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
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

function TelaOfensiva({ de, para, semana = [], onFechar }) {
  const reduzir = useReducedMotion();
  const [virou, setVirou] = useState(false);
  const botaoRef = useRef(null);

  useEffect(() => {
    // O número antigo fica um instante na tela e então sobe para o novo.
    const t = setTimeout(() => {
      setVirou(true);
      vibrate(20);
      if (MARCOS_DA_OFENSIVA.has(para)) celebrate({ count: 70, y: 0.45 });
    }, reduzir ? 0 : 650);
    const f = setTimeout(() => botaoRef.current?.focus({ preventScroll: true }), 120);
    const tecla = (e) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", tecla);
    return () => {
      clearTimeout(t);
      clearTimeout(f);
      window.removeEventListener("keydown", tecla);
    };
  }, [para, reduzir, onFechar]);

  const titulo = para <= 1 ? "Você começou uma ofensiva!" : `${para} dias seguidos!`;
  const texto = para <= 1 ? "Estude um pouco todo dia para o foguinho crescer." : "Volte amanhã para manter o foguinho aceso.";

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
      {/* A entrada (mola) fica no invólucro; a tremulação em CSS fica na imagem, para um não apagar o outro. */}
      <motion.div
        initial={{ opacity: 0, transform: "translateY(24px) scale(0.6)" }}
        animate={{ opacity: 1, transform: "translateY(0px) scale(1)", transition: { type: "spring", duration: 0.6, bounce: 0.35 } }}
      >
        <img src="/feedback/foguinho.webp" alt="" width={168} height={168} className="foguinho-vivo h-40 w-40" />
      </motion.div>

      {/* Número de dias: o antigo sai por cima, o novo entra por baixo (como um contador mecânico). */}
      <div className="relative mt-2 h-[84px] w-full overflow-hidden" aria-hidden="true">
        <AnimatePresence initial={false}>
          <motion.span
            key={virou ? `n-${para}` : `n-${de}`}
            className="absolute inset-x-0 text-[72px] font-black leading-[84px] tabular-nums text-[#FFC247]"
            initial={{ opacity: 0, transform: "translateY(60%)" }}
            animate={{ opacity: 1, transform: "translateY(0%)", transition: MOLA_POP }}
            exit={{ opacity: 0, transform: "translateY(-60%)", transition: { duration: 0.22, ease: EASE_OUT } }}
          >
            {virou ? para : de}
          </motion.span>
        </AnimatePresence>
      </div>

      <h2 id="ofensiva-titulo" className="mt-1 text-2xl font-black text-[#EAF2F8]">
        {titulo}
      </h2>
      <p className="mt-1 max-w-xs text-sm font-semibold text-[#9FB3C6]">{texto}</p>

      {semana.length === 7 && (
        <ol className="mt-6 flex gap-2.5" aria-label="Sua semana">
          {semana.map((d) => {
            const aceso = d.ativo && (!d.hoje || virou);
            return (
              <li key={d.dia} className="flex flex-col items-center gap-1.5">
                <span className={`text-xs font-extrabold ${d.hoje ? "text-[#FFC247]" : "text-[#9FB3C6]"}`}>{d.letra}</span>
                <motion.span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors duration-200 ${aceso ? "border-[#FF9600] bg-[#FF9600] text-[#2B1700]" : "border-[#27394B] bg-[#131F2E]"}`}
                  animate={d.hoje && virou ? { transform: ["scale(0.8)", "scale(1.12)", "scale(1)"] } : { transform: "scale(1)" }}
                  transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.1 }}
                >
                  {aceso && <Check size={16} strokeWidth={3.5} aria-hidden="true" />}
                </motion.span>
              </li>
            );
          })}
        </ol>
      )}

      <Button ref={botaoRef} variant="warning" size="lg" className="mt-8 w-full max-w-xs" onClick={onFechar}>
        Continuar
      </Button>
    </motion.div>
  );
}
TelaOfensiva.propTypes = { de: PropTypes.number.isRequired, para: PropTypes.number.isRequired, semana: PropTypes.array, onFechar: PropTypes.func.isRequired };
