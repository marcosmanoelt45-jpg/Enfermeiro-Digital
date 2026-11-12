import React from "react";
import PropTypes from "prop-types";
import { m as motion } from "framer-motion";
import { Check, Snowflake } from "lucide-react";

const EASE_OUT = [0.23, 1, 0.32, 1];
const MOLA_POP = { type: "spring", duration: 0.45, bounce: 0.35 };
const LADO = 34; // diâmetro de cada dia
const VAO = 10;

/**
 * A semana da ofensiva. Os dias anteriores já chegam acesos (laranja) ou congelados (azul, com floco); o de hoje
 * acende com um pop e um anel quando `acesa` vira true. Semana perfeita (7 dias estudados, sem congelamento):
 * uma faixa laranja contínua cresce da esquerda e une os dias, como na "semana perfeita" do Duolingo.
 */
export default function SemanaOfensiva({ semana, acesa }) {
  if (semana.length !== 7) return null;
  const perfeita = acesa && semana.every((d) => d.ativo && !d.congelado);
  const largura = 7 * LADO + 6 * VAO;
  return (
    <div className="flex flex-col items-center" aria-label={perfeita ? "Semana perfeita" : "Sua semana"}>
      <ol className="flex" style={{ gap: VAO }}>
        {semana.map((d) => (
          <li key={d.dia} className="w-[34px] text-center text-xs font-extrabold" style={{ color: d.hoje ? "#FFC247" : "#9FB3C6" }}>
            {d.letra}
          </li>
        ))}
      </ol>
      <div className="relative mt-1.5" style={{ width: largura, height: LADO }}>
        {perfeita && (
          <motion.span
            aria-hidden="true"
            className="absolute rounded-full bg-[#FF9600]"
            style={{ left: 0, top: 0, width: largura, height: LADO, transformOrigin: "0% 50%" }}
            initial={{ transform: "scaleX(0.05)", opacity: 0 }}
            animate={{ transform: "scaleX(1)", opacity: 1 }}
            transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.35 }}
          />
        )}
        <ol className="absolute inset-0 flex" style={{ gap: VAO }}>
          {semana.map((d, i) => (
            <Dia key={d.dia} d={d} acesa={acesa} ordem={i} />
          ))}
        </ol>
      </div>
    </div>
  );
}
SemanaOfensiva.propTypes = { semana: PropTypes.array.isRequired, acesa: PropTypes.bool.isRequired };

function Dia({ d, acesa, ordem }) {
  const aceso = d.ativo && (!d.hoje || acesa);
  const cor = d.congelado ? "border-[#4FB3FF] bg-[#123049] text-[#7CC8FF]" : aceso ? "border-[#FF9600] bg-[#FF9600] text-[#2B1700]" : "border-[#27394B] bg-[#131F2E] text-transparent";
  return (
    <li className="relative" style={{ width: LADO, height: LADO }}>
      {d.hoje && acesa && (
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border-2 border-[#FFC247]"
          initial={{ opacity: 0.9, transform: "scale(1)" }}
          animate={{ opacity: 0, transform: "scale(1.9)" }}
          transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.1 }}
        />
      )}
      <motion.span
        className={`flex h-full w-full items-center justify-center rounded-full border-2 transition-colors duration-150 ${cor}`}
        // Os dias anteriores entram em sequência; o de hoje dá o pop na hora em que acende.
        initial={{ opacity: 0, transform: "scale(0.85)" }}
        animate={
          d.hoje && acesa
            ? { opacity: 1, transform: ["scale(0.8)", "scale(1.18)", "scale(1)"], transition: { duration: 0.42, ease: ["easeOut", "easeOut"], delay: 0.05 } }
            : { opacity: 1, transform: "scale(1)", transition: { ...MOLA_POP, delay: 0.12 + ordem * 0.04 } }
        }
      >
        {d.congelado ? <Snowflake size={16} strokeWidth={3} aria-label="Congelado" /> : aceso ? <Check size={16} strokeWidth={3.5} aria-hidden="true" /> : null}
      </motion.span>
    </li>
  );
}
Dia.propTypes = { d: PropTypes.object.isRequired, acesa: PropTypes.bool.isRequired, ordem: PropTypes.number.isRequired };
