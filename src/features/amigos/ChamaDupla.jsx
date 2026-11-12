import React from "react";
import PropTypes from "prop-types";
import { m as motion, useReducedMotion } from "framer-motion";
import { Fagulhas } from "@/components/feedback/ofensiva/ChamaAcendendo.jsx";
import { iniciais } from "./ofensivaAmigos.js";

const EASE_OUT = [0.23, 1, 0.32, 1];
const MOLA = { type: "spring", duration: 0.55, bounce: 0.3 };

/** Avatar redondo: foto, ou iniciais sobre a cor da pessoa. */
export function Avatar({ pessoa, tamanho = 56, borda = "#0B131D" }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full font-black text-white"
      style={{ width: tamanho, height: tamanho, background: pessoa?.cor ?? "#20D5B5", border: `${Math.max(2, tamanho / 18)}px solid ${borda}`, fontSize: tamanho * 0.36 }}
    >
      {pessoa?.foto ? <img src={pessoa.foto} alt="" className="h-full w-full object-cover" /> : iniciais(pessoa?.nome)}
    </span>
  );
}
Avatar.propTypes = { pessoa: PropTypes.object, tamanho: PropTypes.number, borda: PropTypes.string };

/**
 * Dois foguinhos lado a lado, um de cada pessoa, com os avatares na frente. Cada chama acende quando a sua
 * pessoa estudou hoje; com as duas acesas, sobem fagulhas. Com `entrar`, os avatares vêm dos lados e se
 * encontram no meio antes de as chamas acenderem (a esquerda primeiro).
 */
export default function ChamaDupla({ eu, amigo, euAceso, amigoAceso, tamanho = 200, entrar = false }) {
  const reduzir = useReducedMotion();
  const chama = tamanho * 0.62;
  const avatar = tamanho * 0.34;
  const ambas = euAceso && amigoAceso;
  return (
    <div className="relative" style={{ width: tamanho, height: tamanho * 0.86 }}>
      <motion.div
        aria-hidden="true"
        className="absolute inset-x-[4%] top-[6%] bottom-[10%] rounded-full"
        style={{ background: "radial-gradient(closest-side, rgba(255,150,0,.38), rgba(255,150,0,0))" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: ambas ? 1 : 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT, delay: entrar ? 0.7 : 0 }}
      />
      <Chama lado="esq" aceso={euAceso} tamanho={chama} atraso={entrar ? 0.45 : 0} />
      <Chama lado="dir" aceso={amigoAceso} tamanho={chama} atraso={entrar ? 0.62 : 0} />
      {ambas && !reduzir && (
        <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: entrar ? 0.62 : 0 }}>
          <Fagulhas tamanho={tamanho * 0.9} quantidade={12} />
        </motion.div>
      )}
      <div className="absolute inset-x-0 flex justify-center" style={{ bottom: 0 }}>
        <motion.span
          className="relative z-10"
          initial={entrar ? { opacity: 0, transform: `translateX(${-tamanho * 0.35}px)` } : false}
          animate={{ opacity: 1, transform: "translateX(0px)" }}
          transition={MOLA}
        >
          <Avatar pessoa={eu} tamanho={avatar} />
        </motion.span>
        <motion.span
          className="relative -ml-[12%]"
          initial={entrar ? { opacity: 0, transform: `translateX(${tamanho * 0.35}px)` } : false}
          animate={{ opacity: 1, transform: "translateX(0px)" }}
          transition={{ ...MOLA, delay: 0.06 }}
        >
          <Avatar pessoa={amigo} tamanho={avatar} />
        </motion.span>
      </div>
    </div>
  );
}
ChamaDupla.propTypes = {
  eu: PropTypes.object,
  amigo: PropTypes.object,
  euAceso: PropTypes.bool,
  amigoAceso: PropTypes.bool,
  tamanho: PropTypes.number,
  entrar: PropTypes.bool,
};

function Chama({ lado, aceso, tamanho, atraso }) {
  const esq = lado === "esq";
  return (
    <div
      className="absolute top-0"
      style={{ width: tamanho, height: tamanho, [esq ? "left" : "right"]: "6%", transform: `rotate(${esq ? -10 : 10}deg)`, transformOrigin: "50% 90%" }}
    >
      <img src="/feedback/foguinho-apagado.webp" alt="" className="absolute inset-0 h-full w-full transition-opacity duration-200" style={{ opacity: aceso ? 0 : 1 }} />
      <motion.img
        src="/feedback/foguinho.webp"
        alt=""
        className="absolute inset-0 h-full w-full"
        style={{ transformOrigin: "50% 90%" }}
        // Acende como a chama da ofensiva: nasce achatada, estica alta e fina e assenta com um quique.
        initial={{ opacity: 0, transform: "scale(1.3, 0.55)" }}
        animate={
          aceso
            ? { opacity: 1, transform: ["scale(1.3, 0.55)", "scale(0.65, 1.45)", "scale(1.12, 0.9)", "scale(0.97, 1.03)", "scale(1, 1)"] }
            : { opacity: 0, transform: "scale(1.3, 0.55)" }
        }
        transition={{ opacity: { duration: 0.1, delay: atraso }, transform: { duration: 0.65, ease: ["easeOut", "easeInOut", "easeInOut", "easeOut"], times: [0, 0.35, 0.6, 0.8, 1], delay: atraso } }}
      />
    </div>
  );
}
Chama.propTypes = { lado: PropTypes.string.isRequired, aceso: PropTypes.bool, tamanho: PropTypes.number.isRequired, atraso: PropTypes.number };

/** Versão mínima para listas: duas chaminhas sobrepostas (cinzas quando a dupla ainda não fechou o dia). */
export function ChamaDuplaMini({ acesa, tamanho = 22 }) {
  const src = acesa ? "/feedback/foguinho.webp" : "/feedback/foguinho-apagado.webp";
  return (
    <span className="relative inline-flex" style={{ width: tamanho * 1.45, height: tamanho }} aria-hidden="true">
      <img src={src} alt="" className="absolute left-0 top-0" style={{ width: tamanho, height: tamanho, transform: "rotate(-10deg)" }} />
      <img src={src} alt="" className="absolute right-0 top-0" style={{ width: tamanho, height: tamanho, transform: "rotate(10deg)" }} />
    </span>
  );
}
ChamaDuplaMini.propTypes = { acesa: PropTypes.bool, tamanho: PropTypes.number };
