import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { m as motion, useReducedMotion } from "framer-motion";

const EASE_OUT = [0.23, 1, 0.32, 1];
const CORES = ["#FFC247", "#FF9600", "#FFD978", "#FF7A1A"];

// Ignição escolhida pelo dono ("Cresce"): a chama cinza agacha um pouco, a colorida cresce da base, estica e
// assenta com um quique. Cada quadro: [scaleX, scaleY], com origem no pé da chama.
const DURACAO = 0.8;
const TROCA = 0.12; // fração em que a cinza vira colorida
const POUSO = 0.4; // fração em que a chama "acontece" (a tela vira o número aí)
const TEMPOS = [0, 0.15, 0.4, 0.6, 0.8, 1];
const QUADROS = [
  [1, 1],
  [1.15, 0.72],
  [0.82, 1.28],
  [1.08, 0.93],
  [0.97, 1.03],
  [1, 1],
];
const escala = ([sx, sy]) => `scale(${sx}, ${sy})`;
// Uma curva POR TRECHO: com uma curva só, a animação acelerada pelo navegador (WAAPI) aplica a curva ao conjunto
// e espreme tudo no começo, com um rabo longo e lento no fim.
const CURVAS = TEMPOS.slice(1).map((_, i, a) => (i === a.length - 1 ? "easeOut" : "easeInOut"));

/** Momento (s) em que a chama "acontece": a tela da ofensiva vira o número aí. */
export const pousoDoFogo = () => DURACAO * POUSO;

/**
 * O foguinho começa apagado (cinza) e, quando `acesa` vira true, cresce aceso da base. Depois fica balançando
 * devagar (classe foguinho-vivo). Em marcos (7, 30, 100…) ondas saem em volta.
 */
export default function ChamaAcendendo({ acesa, marco = false, tamanho = 168 }) {
  const reduzir = useReducedMotion();
  const animar = acesa && !reduzir;
  const pouso = DURACAO * POUSO;
  const troca = animar ? DURACAO * TROCA : 0;
  return (
    <div className="relative" style={{ width: tamanho, height: tamanho }}>
      {/* Sombra no chão. */}
      <span
        aria-hidden="true"
        className="absolute left-1/2 rounded-[50%]"
        style={{
          bottom: tamanho * 0.02,
          width: tamanho * 0.5,
          height: tamanho * 0.1,
          marginLeft: -tamanho * 0.25,
          background: acesa ? "rgba(255,194,71,.22)" : "rgba(91,110,130,.28)",
          transition: `background-color 150ms linear ${troca}s`,
        }}
      />

      {/* Brilho atrás da chama, abre quando ela acontece. */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-[4%] rounded-full"
        style={{ background: "radial-gradient(closest-side, rgba(255,150,0,.4), rgba(255,150,0,0))" }}
        initial={{ opacity: 0, transform: "scale(0.6)" }}
        animate={acesa ? { opacity: [0, 1, 0.65], transform: ["scale(0.6)", "scale(1.25)", "scale(1.05)"] } : { opacity: 0, transform: "scale(0.6)" }}
        transition={{ duration: 0.7, ease: ["easeOut", "easeOut"], times: [0, 0.35, 1], delay: animar ? pouso : 0 }}
      />

      {animar && marco && (
        <>
          <Onda atraso={pouso + 0.05} tamanho={tamanho} />
          <Onda atraso={pouso + 0.25} tamanho={tamanho} />
        </>
      )}

      {/* A chama: o invólucro faz a ignição; a imagem de dentro só balança depois (um não apaga o outro). */}
      <motion.div
        className="absolute inset-0"
        style={{ transformOrigin: "50% 92%" }}
        initial={{ transform: escala(QUADROS[0]) }}
        animate={animar ? { transform: QUADROS.map(escala) } : { transform: escala(QUADROS[0]) }}
        transition={{ duration: DURACAO, times: TEMPOS, ease: CURVAS }}
      >
        <img
          src="/feedback/foguinho-apagado.webp"
          alt=""
          width={tamanho}
          height={tamanho}
          className="absolute inset-0 h-full w-full"
          style={{ opacity: acesa ? 0 : 1, transition: `opacity 90ms linear ${troca}s` }}
        />
        <img
          src="/feedback/foguinho.webp"
          alt=""
          width={tamanho}
          height={tamanho}
          className={`absolute inset-0 h-full w-full ${acesa ? "foguinho-vivo" : ""}`}
          style={{ opacity: acesa ? 1 : 0, transition: `opacity 90ms linear ${troca}s` }}
        />
      </motion.div>

      {animar && <Fagulhas tamanho={tamanho} quantidade={marco ? 18 : 12} atrasoBase={pouso} />}
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
      initial={{ opacity: 0, transform: "scale(0.7)" }}
      animate={{ opacity: [0, 0.9, 0], transform: ["scale(0.7)", "scale(0.9)", "scale(1.7)"] }}
      transition={{ duration: 0.9, ease: ["easeOut", "easeOut"], delay: atraso, times: [0, 0.1, 1] }}
    />
  );
}
Onda.propTypes = { atraso: PropTypes.number.isRequired, tamanho: PropTypes.number.isRequired };

/** Fagulhas que sobem da base da chama e se apagam. Posições sorteadas uma vez por montagem. */
export function Fagulhas({ tamanho, quantidade = 10, atrasoBase = 0 }) {
  const lista = useMemo(
    () =>
      Array.from({ length: quantidade }, (_, i) => ({
        x: (Math.random() - 0.5) * tamanho * 1.1,
        y: -(tamanho * (0.45 + Math.random() * 0.5)),
        r: 4 + Math.random() * 5,
        cor: CORES[i % CORES.length],
        atraso: atrasoBase + Math.random() * 0.15,
        dur: 0.6 + Math.random() * 0.45,
      })),
    [tamanho, quantidade, atrasoBase]
  );
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {lista.map((f, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{ left: "50%", top: "70%", width: f.r, height: f.r, marginLeft: -f.r / 2, background: f.cor }}
          initial={{ opacity: 0, transform: "translate(0px,0px) scale(1)" }}
          animate={{ opacity: [0, 1, 0], transform: ["translate(0px,0px) scale(1)", `translate(${f.x}px,${f.y}px) scale(0.35)`] }}
          transition={{ duration: f.dur, ease: EASE_OUT, delay: f.atraso, opacity: { duration: f.dur, times: [0, 0.15, 1], delay: f.atraso } }}
        />
      ))}
    </div>
  );
}
Fagulhas.propTypes = { tamanho: PropTypes.number.isRequired, quantidade: PropTypes.number, atrasoBase: PropTypes.number };
