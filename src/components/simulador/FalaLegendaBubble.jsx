import React from "react";
import PropTypes from "prop-types";

/**
 * FalaLegendaBubble
 *
 * Balão de fala com barras de onda sonoras animadas e efeito karaokê
 * de acendimento progressivo das palavras sincronizado à fala do paciente.
 */
export default function FalaLegendaBubble({
  texto = "",
  isSpeaking = false,
  activeWordIndex = -1,
  compact = false,
  className = ""
}) {
  const words = texto.split(" ").filter(Boolean);

  return (
    <div
      className={`relative rounded-[18px] bg-[#16222E] border-2 border-[#27394B] border-b-[5px] border-b-[#0A1118] font-bold text-[#EAF2F8] select-none ${
        compact ? "p-3 text-[15px] leading-snug" : "p-4 text-[16.5px] leading-relaxed"
      } ${className}`}
    >
      {/* Barras de Onda Sonora */}
      <div className="flex items-center gap-1 h-5 mb-2">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((barIdx) => (
          <span
            key={barIdx}
            className={`w-1 rounded-full bg-[#2AD3C1] transition-all duration-150 ${
              isSpeaking
                ? "animate-pulse"
                : "opacity-45 h-1.5"
            }`}
            style={{
              height: isSpeaking ? `${Math.sin(barIdx + 1) * 8 + 14}px` : "6px",
              animationDelay: `${barIdx * 90}ms`,
              animationDuration: "600ms"
            }}
          />
        ))}
      </div>

      {/* Texto com Efeito Karaokê */}
      <p className="font-extrabold tracking-tight">
        {words.map((word, idx) => {
          const isSpoken = activeWordIndex === -1 || idx <= activeWordIndex;
          return (
            <span
              key={`${idx}-${word}`}
              className={`inline-block mr-1.5 transition-opacity duration-200 ${
                isSpoken ? "opacity-100 text-[#EAF2F8]" : "opacity-25 text-[#9FB3C6]"
              }`}
            >
              {word}
            </span>
          );
        })}
      </p>
    </div>
  );
}

FalaLegendaBubble.propTypes = {
  texto: PropTypes.string,
  isSpeaking: PropTypes.bool,
  activeWordIndex: PropTypes.number,
  compact: PropTypes.bool,
  className: PropTypes.string
};
