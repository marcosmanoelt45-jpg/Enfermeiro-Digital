import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { m as motion, useReducedMotion } from "framer-motion";

const EASE_OUT = [0.23, 1, 0.32, 1];
const CORES = ["#FFC247", "#FF9600", "#FFD978", "#FF7A1A"];

/**
 * O foguinho começa apagado (cinza) e acende: a versão colorida cresce por cima da cinza com um quique,
 * um brilho se abre atrás e fagulhas sobem. Em marcos (7, 30, 100…) uma onda sai em volta.
 * `acesa` muda de false para true no momento da virada; antes disso só a chama cinza aparece.
 */
export default function ChamaAcendendo({ acesa, marco = false, tamanho = 168 }) {
  const reduzir = useReducedMotion();
  return (
    <div className="relative" style={{ width: tamanho, height: tamanho }}>
      {/* Brilho atrás da chama. */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-[6%] rounded-full"
        style={{ background: "radial-gradient(closest-side, rgba(255,150,0,.42), rgba(255,150,0,0))" }}
        initial={{ opacity: 0, transform: "scale(0.6)" }}
        animate={acesa ? { opacity: [0, 1, 0.7], transform: ["scale(0.6)", "scale(1.2)", "scale(1.05)"] } : { opacity: 0, transform: "scale(0.6)" }}
        transition={{ duration: 0.7, ease: EASE_OUT, times: [0, 0.35, 1] }}
      />

      {marco && acesa && !reduzir && (
        <>
          <Onda atraso={0.05} tamanho={tamanho} />
          <Onda atraso={0.25} tamanho={tamanho} />
        </>
      )}

      <img
        src="/feedback/foguinho-apagado.webp"
        alt=""
        width={tamanho}
        height={tamanho}
        className="absolute inset-0 h-full w-full transition-opacity duration-200"
        style={{ opacity: acesa ? 0 : 1 }}
      />

      <motion.div
        className="absolute inset-0"
        style={{ transformOrigin: "50% 90%" }}
        initial={{ opacity: 0, transform: "scale(0.72)" }}
        animate={acesa ? { opacity: 1, transform: ["scale(0.72)", "scale(1.14)", "scale(1)"] } : { opacity: 0, transform: "scale(0.72)" }}
        transition={{ opacity: { duration: 0.12 }, transform: { duration: 0.55, ease: EASE_OUT, times: [0, 0.45, 1] } }}
      >
        <img src="/feedback/foguinho.webp" alt="" width={tamanho} height={tamanho} className={`h-full w-full ${acesa ? "foguinho-vivo" : ""}`} />
      </motion.div>

      {acesa && !reduzir && <Fagulhas tamanho={tamanho} quantidade={marco ? 16 : 10} />}
    </div>
  );
}
ChamaAcendendo.propTypes = { acesa: PropTypes.bool.isRequired, marco: PropTypes.bool, tamanho: PropTypes.number };

function Onda({ atraso, tamanho }) {
  return (
    <motion.span
      aria-hidden="true"
      className="absolute rounded-full border-4 border-[#FFC247]"
      style={{ left: "10%", top: "14%", width: tamanho * 0.8, height: tamanho * 0.8 }}
      initial={{ opacity: 0.9, transform: "scale(0.7)" }}
      animate={{ opacity: 0, transform: "scale(1.7)" }}
      transition={{ duration: 0.9, ease: EASE_OUT, delay: atraso }}
    />
  );
}
Onda.propTypes = { atraso: PropTypes.number.isRequired, tamanho: PropTypes.number.isRequired };

/** Fagulhas que sobem da base da chama e se apagam. Posições sorteadas uma vez por montagem. */
export function Fagulhas({ tamanho, quantidade = 10 }) {
  const lista = useMemo(
    () =>
      Array.from({ length: quantidade }, (_, i) => ({
        x: (Math.random() - 0.5) * tamanho * 0.9,
        y: -(tamanho * (0.45 + Math.random() * 0.45)),
        r: 4 + Math.random() * 5,
        cor: CORES[i % CORES.length],
        atraso: Math.random() * 0.18,
        dur: 0.65 + Math.random() * 0.4,
      })),
    [tamanho, quantidade]
  );
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {lista.map((f, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{ left: "50%", top: "62%", width: f.r, height: f.r, marginLeft: -f.r / 2, background: f.cor }}
          initial={{ opacity: 0, transform: "translate(0px,0px) scale(1)" }}
          animate={{ opacity: [0, 1, 0], transform: ["translate(0px,0px) scale(1)", `translate(${f.x}px,${f.y}px) scale(0.35)`] }}
          transition={{ duration: f.dur, ease: EASE_OUT, delay: f.atraso, opacity: { duration: f.dur, times: [0, 0.15, 1], delay: f.atraso } }}
        />
      ))}
    </div>
  );
}
Fagulhas.propTypes = { tamanho: PropTypes.number.isRequired, quantidade: PropTypes.number };
