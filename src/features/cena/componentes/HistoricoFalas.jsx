import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";

// Balões: aluno à direita, personagem à esquerda. Rola sozinho só se a pessoa estiver no fim da lista.
export default function HistoricoFalas({ turnos, className = "" }) {
  const caixa = useRef(null);
  const noFim = useRef(true);

  const aoRolar = () => {
    const el = caixa.current;
    if (el) noFim.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
  };

  useEffect(() => {
    const el = caixa.current;
    if (el && noFim.current) el.scrollTop = el.scrollHeight;
  }, [turnos]);

  if (!turnos.length) return null;
  return (
    <div ref={caixa} onScroll={aoRolar} className={`overflow-y-auto space-y-2 pr-1 ${className}`} role="log" aria-label="Conversa">
      {turnos.map((t, i) => {
        const aluno = t.autor === "aluno";
        return (
          <div key={i} className={`flex ${aluno ? "justify-end" : "justify-start"}`}>
            <p
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm font-semibold leading-snug ${
                aluno ? "bg-[#20D5B5] text-[#0B131D] rounded-br-md" : "bg-[#16222E] text-[#EAF2F8] border border-[#27394B] rounded-bl-md"
              }`}
            >
              {t.texto}
            </p>
          </div>
        );
      })}
    </div>
  );
}

HistoricoFalas.propTypes = {
  turnos: PropTypes.arrayOf(PropTypes.shape({ autor: PropTypes.string, texto: PropTypes.string })).isRequired,
  className: PropTypes.string,
};
