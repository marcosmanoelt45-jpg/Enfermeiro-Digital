import React from "react";
import PropTypes from "prop-types";
import { m as motion } from "framer-motion";
import { Headphones } from "lucide-react";
import { fadeUp } from "@/lib/motion";

// Balão com karaokê: palavras já ditas e a atual em #EAF2F8, as futuras em #9FB3C6.
export default function LegendaFala({ texto, palavraAtual = -1, falando = false, className = "", onOuvir }) {
  if (!texto) return null;
  const palavras = texto.split(/\s+/).filter(Boolean);
  return (
    <motion.div
      key={texto}
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className={`flex items-start gap-2 rounded-2xl border border-[#27394B] bg-[#131F2E] px-4 py-3 text-base leading-relaxed font-semibold ${className}`}
      aria-live="polite"
    >
      <p className="flex-1">
        {palavras.map((p, i) => (
          <span key={i} style={{ color: !falando || i <= palavraAtual ? "#EAF2F8" : "#9FB3C6" }}>
            {p}{" "}
          </span>
        ))}
      </p>
      {onOuvir && (
        <button type="button" onClick={onOuvir} aria-label="Ouvir a última fala de novo" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#27394B] bg-[#16222E] text-[#20D5B5] active:scale-95">
          <Headphones size={18} aria-hidden="true" />
        </button>
      )}
    </motion.div>
  );
}

LegendaFala.propTypes = {
  texto: PropTypes.string,
  palavraAtual: PropTypes.number,
  falando: PropTypes.bool,
  className: PropTypes.string,
  onOuvir: PropTypes.func,
};
