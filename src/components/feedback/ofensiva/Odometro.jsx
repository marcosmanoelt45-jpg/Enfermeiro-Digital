import React, { useRef } from "react";
import PropTypes from "prop-types";
import { AnimatePresence, m as motion } from "framer-motion";

const MOLA = { type: "spring", duration: 0.5, bounce: 0.28 };
const EASE_OUT = [0.23, 1, 0.32, 1];

/**
 * Contador mecânico: só os algarismos que mudam rolam (o antigo sobe e sai, o novo entra por baixo), das
 * unidades para a esquerda, com um atraso curto entre eles. 9 → 10 rola as unidades e faz surgir a dezena.
 * Cada casa é contada da direita (unidade = 0) para manter a mesma chave quando o número ganha um algarismo.
 */
export default function Odometro({ valor, className = "" }) {
  const casasIniciais = useRef(String(valor).length);
  const texto = String(valor);
  const casas = texto.split("");
  return (
    <span className={`inline-flex tabular-nums ${className}`}>
      <span className="sr-only">{texto}</span>
      {casas.map((d, i) => {
        const daDireita = casas.length - 1 - i;
        return <Casa key={`c-${daDireita}`} algarismo={d} atraso={daDireita * 0.07} nova={daDireita >= casasIniciais.current} />;
      })}
    </span>
  );
}
Odometro.propTypes = { valor: PropTypes.number.isRequired, className: PropTypes.string };

function Casa({ algarismo, atraso, nova }) {
  return (
    <span className="relative inline-block overflow-hidden" style={{ height: "1.1em", lineHeight: "1.1em" }} aria-hidden="true">
      {/* Mantém a largura do algarismo enquanto os dois se cruzam. */}
      <span className="invisible">{algarismo}</span>
      <AnimatePresence initial={nova}>
        <motion.span
          key={algarismo}
          className="absolute inset-0 text-center"
          initial={{ opacity: 0, transform: "translateY(90%)" }}
          animate={{ opacity: 1, transform: "translateY(0%)", transition: { ...MOLA, delay: atraso } }}
          exit={{ opacity: 0, transform: "translateY(-90%)", transition: { duration: 0.2, ease: EASE_OUT, delay: atraso } }}
        >
          {algarismo}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
Casa.propTypes = { algarismo: PropTypes.string.isRequired, atraso: PropTypes.number.isRequired, nova: PropTypes.bool.isRequired };
