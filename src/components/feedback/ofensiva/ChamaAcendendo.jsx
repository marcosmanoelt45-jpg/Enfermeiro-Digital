import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { m as motion, useReducedMotion } from "framer-motion";

const EASE_OUT = [0.23, 1, 0.32, 1];
const CORES = ["#FFC247", "#FF9600", "#FFD978", "#FF7A1A"];

/** Duração da ignição (s). A tela usa para saber quando virar o número: no "pouso" da chama. */
export const DURACAO_IGNICAO = 1.35;
export const POUSO_DA_CHAMA = DURACAO_IGNICAO * 0.64;

// Ignição no estilo do Duolingo, em cinco tempos (frações de DURACAO_IGNICAO):
// 0,00–0,10 a chama cinza se achata (antecipação) e já troca para a colorida;
// 0,10–0,52 sobe girando, pequena, com rastros amarelos em espiral;
// 0,52–0,64 cai e bate achatada no chão (anel + fagulhas);
// 0,64–0,78 estica alta e fina; 0,78–1,00 assenta com um quique.
// Cada quadro: [translateY %, rotate deg, scaleX, scaleY]. A rotação termina em -720 (duas voltas = de pé).
// Subida/escala ficam num invólucro com origem na base; o giro, num de dentro com origem no meio da chama
// (senão ela orbita em volta da base em vez de girar no lugar).
const QUADROS = [
  [0, 0, 1, 1],
  [0, 0, 1.35, 0.55],
  [-30, -110, 0.52, 0.6],
  [-52, -330, 0.42, 0.42],
  [-46, -560, 0.46, 0.46],
  [0, -720, 1.5, 0.36],
  [0, -716, 0.62, 1.55],
  [0, -723, 1.12, 0.88],
  [0, -719, 0.97, 1.04],
  [0, -720, 1, 1],
];
const TEMPOS = [0, 0.1, 0.2, 0.38, 0.52, 0.64, 0.78, 0.88, 0.95, 1];
const CURVAS = [EASE_OUT, EASE_OUT, "linear", EASE_OUT, [0.55, 0, 0.9, 0.45], EASE_OUT, EASE_OUT, "easeInOut", "easeInOut"];
const subida = ([y, , sx, sy]) => `translateY(${y}%) scale(${sx}, ${sy})`;
const giro = ([, r]) => `rotate(${r}deg)`;

/**
 * O foguinho começa apagado (cinza) e, quando `acesa` vira true, acende como no Duolingo: achata, sobe girando
 * com rastros de fogo, bate no chão, estica e assenta. Depois fica tremulando devagar. Em marcos (7, 30, 100…)
 * ondas saem em volta no pouso.
 */
export default function ChamaAcendendo({ acesa, marco = false, tamanho = 168 }) {
  const reduzir = useReducedMotion();
  const animar = acesa && !reduzir;
  const pouso = { delay: POUSO_DA_CHAMA };
  return (
    <div className="relative" style={{ width: tamanho, height: tamanho }}>
      {/* Sombra no chão: some enquanto a chama está no ar. */}
      <motion.span
        aria-hidden="true"
        className="absolute left-1/2 rounded-[50%]"
        style={{ bottom: tamanho * 0.02, width: tamanho * 0.5, height: tamanho * 0.1, marginLeft: -tamanho * 0.25, background: acesa ? "rgba(255,194,71,.22)" : "rgba(91,110,130,.28)" }}
        animate={animar ? { opacity: [1, 1, 0.2, 0.2, 1, 1], transform: ["scaleX(1)", "scaleX(1.3)", "scaleX(0.6)", "scaleX(0.6)", "scaleX(1.5)", "scaleX(1)"] } : { opacity: 1, transform: "scaleX(1)" }}
        transition={{ duration: DURACAO_IGNICAO, times: [0, 0.1, 0.2, 0.52, 0.64, 0.85], ease: EASE_OUT }}
      />

      {/* Brilho atrás da chama, abre no pouso. */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-[4%] rounded-full"
        style={{ background: "radial-gradient(closest-side, rgba(255,150,0,.4), rgba(255,150,0,0))" }}
        initial={{ opacity: 0, transform: "scale(0.6)" }}
        animate={acesa ? { opacity: [0, 1, 0.65], transform: ["scale(0.6)", "scale(1.25)", "scale(1.05)"] } : { opacity: 0, transform: "scale(0.6)" }}
        transition={{ duration: 0.7, ease: EASE_OUT, times: [0, 0.35, 1], ...(animar ? pouso : {}) }}
      />

      {animar && <Espiral tamanho={tamanho} />}
      {animar && <AnelNoChao tamanho={tamanho} atraso={POUSO_DA_CHAMA} />}
      {animar && marco && (
        <>
          <Onda atraso={POUSO_DA_CHAMA + 0.05} tamanho={tamanho} />
          <Onda atraso={POUSO_DA_CHAMA + 0.25} tamanho={tamanho} />
        </>
      )}

      {/* A chama: o invólucro faz a ignição; a imagem de dentro só tremula depois (um não apaga o outro). */}
      <motion.div
        className="absolute inset-0"
        style={{ transformOrigin: "50% 92%" }}
        initial={{ transform: subida(QUADROS[0]) }}
        animate={animar ? { transform: QUADROS.map(subida) } : { transform: subida(QUADROS[0]) }}
        transition={{ duration: DURACAO_IGNICAO, times: TEMPOS, ease: CURVAS }}
      >
      <motion.div
        className="absolute inset-0"
        style={{ transformOrigin: "50% 58%" }}
        initial={{ transform: giro(QUADROS[0]) }}
        animate={animar ? { transform: QUADROS.map(giro) } : { transform: giro(QUADROS[0]) }}
        transition={{ duration: DURACAO_IGNICAO, times: TEMPOS, ease: CURVAS }}
      >
        <img
          src="/feedback/foguinho-apagado.webp"
          alt=""
          width={tamanho}
          height={tamanho}
          className="absolute inset-0 h-full w-full"
          style={{ opacity: acesa ? 0 : 1, transition: `opacity 90ms linear ${animar ? 0.08 : 0}s` }}
        />
        <img
          src="/feedback/foguinho.webp"
          alt=""
          width={tamanho}
          height={tamanho}
          className={`absolute inset-0 h-full w-full ${acesa ? "foguinho-vivo" : ""}`}
          style={{ opacity: acesa ? 1 : 0, transition: `opacity 90ms linear ${animar ? 0.08 : 0}s` }}
        />
      </motion.div>
      </motion.div>

      {animar && (
        <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: POUSO_DA_CHAMA, duration: 0.01 }}>
          <Fagulhas tamanho={tamanho} quantidade={marco ? 18 : 12} atrasoBase={POUSO_DA_CHAMA} />
        </motion.div>
      )}
    </div>
  );
}
ChamaAcendendo.propTypes = { acesa: PropTypes.bool.isRequired, marco: PropTypes.bool, tamanho: PropTypes.number };

/** Rastros de fogo em espiral em volta da chama enquanto ela sobe girando. */
// Cada rastro é um arco que afina na cauda: três traços do mesmo raio saindo do mesmo ponto, o curto grosso
// (a cabeça, que vai na frente do giro) e o comprido fino (a cauda).
const RASTROS = [
  { raio: 1, inicio: 0, comp: 0.24, larg: 0.075, cor: "#FFC800" },
  { raio: 0.74, inicio: 0.5, comp: 0.2, larg: 0.06, cor: "#FFC800" },
  { raio: 1.22, inicio: 0.27, comp: 0.13, larg: 0.045, cor: "#FF9600" },
  { raio: 0.55, inicio: 0.8, comp: 0.14, larg: 0.04, cor: "#FFD978" },
];
const BRASAS = [0.1, 0.33, 0.58, 0.71, 0.9];

function Espiral({ tamanho }) {
  const r = tamanho * 0.3;
  return (
    <motion.svg
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2 overflow-visible"
      width={r * 2}
      height={r * 2}
      viewBox={`${-r} ${-r} ${r * 2} ${r * 2}`}
      style={{ marginLeft: -r, marginTop: -r - tamanho * 0.25 }}
      initial={{ opacity: 0, transform: "rotate(0deg) scale(0.5)" }}
      animate={{ opacity: [0, 1, 1, 0], transform: ["rotate(0deg) scale(0.5)", "rotate(-160deg) scale(1)", "rotate(-420deg) scale(1.15)", "rotate(-560deg) scale(1.3)"] }}
      transition={{ duration: DURACAO_IGNICAO * 0.5, delay: DURACAO_IGNICAO * 0.12, times: [0, 0.25, 0.75, 1], ease: "linear" }}
    >
      {RASTROS.map((a, i) => {
        const raio = r * a.raio;
        const circ = 2 * Math.PI * raio;
        return [1, 0.6, 0.3].map((fracao, j) => (
          <circle
            key={`${i}-${j}`}
            r={raio}
            fill="none"
            stroke={a.cor}
            strokeWidth={tamanho * a.larg * (j === 0 ? 0.35 : j === 1 ? 0.7 : 1)}
            strokeLinecap="round"
            strokeDasharray={`${circ * a.comp * fracao} ${circ}`}
            strokeDashoffset={-circ * a.inicio}
          />
        ));
      })}
      {BRASAS.map((ang, i) => (
        <circle key={`b-${i}`} cx={Math.cos(ang * 2 * Math.PI) * r * 1.42} cy={Math.sin(ang * 2 * Math.PI) * r * 1.42} r={tamanho * 0.014} fill={i % 2 ? "#FF7A1A" : "#FFC247"} />
      ))}
    </motion.svg>
  );
}
Espiral.propTypes = { tamanho: PropTypes.number.isRequired };

/** Anel achatado que se abre no chão quando a chama bate. */
function AnelNoChao({ tamanho, atraso }) {
  return (
    <motion.span
      aria-hidden="true"
      className="absolute left-1/2 rounded-[50%] border-[5px] border-[#FFC247]"
      style={{ bottom: -tamanho * 0.04, width: tamanho * 0.7, height: tamanho * 0.22, marginLeft: -tamanho * 0.35 }}
      initial={{ opacity: 0, transform: "scale(0.4)" }}
      animate={{ opacity: [0, 0.9, 0], transform: ["scale(0.4)", "scale(1)", "scale(1.5)"] }}
      transition={{ duration: 0.55, delay: atraso, ease: EASE_OUT, times: [0, 0.2, 1] }}
    />
  );
}
AnelNoChao.propTypes = { tamanho: PropTypes.number.isRequired, atraso: PropTypes.number.isRequired };

function Onda({ atraso, tamanho }) {
  return (
    <motion.span
      aria-hidden="true"
      className="absolute rounded-full border-4 border-[#FFC247]"
      style={{ left: "10%", top: "14%", width: tamanho * 0.8, height: tamanho * 0.8 }}
      initial={{ opacity: 0, transform: "scale(0.7)" }}
      animate={{ opacity: [0, 0.9, 0], transform: ["scale(0.7)", "scale(0.9)", "scale(1.7)"] }}
      transition={{ duration: 0.9, ease: EASE_OUT, delay: atraso, times: [0, 0.1, 1] }}
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
