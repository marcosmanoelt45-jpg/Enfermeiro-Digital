import React from "react";
import PropTypes from "prop-types";

const NIVEIS = { baixo: 1, medio: 2, alto: 3 };
const ROTULOS = { baixo: "Confiança baixa", medio: "Confiança média", alto: "Confiança alta" };

// Três pontos, sem número: o paciente "abre" ou "fecha" conforme o jeito do aluno.
export default function Rapport({ nivel = "baixo" }) {
  const n = NIVEIS[nivel] ?? 1;
  return (
    <div className="flex items-center justify-center gap-2" role="img" aria-label={ROTULOS[nivel] ?? ROTULOS.baixo}>
      <span className="text-xs font-bold text-[#9FB3C6]">Confiança</span>
      {[1, 2, 3].map((i) => (
        <span key={i} className={`h-2.5 w-2.5 rounded-full transition-colors duration-200 ${i <= n ? "bg-[#20D5B5]" : "bg-[#27394B]"}`} />
      ))}
    </div>
  );
}

Rapport.propTypes = { nivel: PropTypes.oneOf(["baixo", "medio", "alto"]) };
