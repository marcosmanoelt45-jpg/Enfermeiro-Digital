import React from "react";
import PropTypes from "prop-types";

// A mão do aluno (visão em primeira pessoa) segurando o diafragma do estetoscópio. O centro do diafragma fica em
// (x, y); a mão sai pelo canto inferior direito. `progresso` (0 a 1) desenha o anel de "segurando para ouvir".
export default function MaoEstetoscopio({ x, y, encostado = false, progresso = 0, cor = "#20D5B5" }) {
  const r = 15;
  const c = 2 * Math.PI * (r + 6);
  return (
    <g transform={`translate(${x} ${y})`} style={{ pointerEvents: "none" }} aria-hidden="true">
      {/* tubo do estetoscópio saindo da tela */}
      <path d="M10 -6 C60 -40 130 -30 210 -120" fill="none" stroke="#2B3440" strokeWidth="7" strokeLinecap="round" />
      {/* diafragma */}
      <circle r={r + 4} fill="#7E8A95" />
      <circle r={r} fill="#C9D3DB" />
      <circle r={r - 5} fill="#EEF3F6" opacity={encostado ? 0.6 : 1} />
      {progresso > 0 && (
        <circle r={r + 6} fill="none" stroke={cor} strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - progresso)} transform="rotate(-90)" />
      )}
      {/* mão (dedos por cima do diafragma, pulso para baixo e para a direita) */}
      <g transform={`translate(${encostado ? 2 : 6} ${encostado ? 2 : 6})`}>
        <path d="M6 -8 C14 -18 30 -18 34 -6 L40 20 C44 40 46 60 60 110 L18 130 C8 96 0 70 -6 42 C-10 24 -6 4 6 -8 Z" fill="#E7B48F" />
        <path d="M-2 -10 C2 -22 16 -24 20 -12 L22 6 C18 10 6 10 0 4 Z" fill="#F0C4A2" />
        <path d="M18 -14 C24 -24 38 -22 40 -10 L40 8 C34 12 22 10 18 4 Z" fill="#F0C4A2" />
        <path d="M34 -4 C42 -12 54 -8 54 4 L52 22 C46 26 38 24 36 18 Z" fill="#E9BB97" />
        <path d="M-6 12 C-18 6 -26 18 -18 28 L-2 40 C2 32 0 20 -6 12 Z" fill="#E9BB97" />
        <path d="M6 -6 L8 2 M24 -10 L25 0 M42 0 L42 8" stroke="#C98E6B" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        {/* punho da roupa */}
        <path d="M40 104 L74 92 L92 140 L50 156 Z" fill="#1E8F7E" />
      </g>
    </g>
  );
}

MaoEstetoscopio.propTypes = { x: PropTypes.number.isRequired, y: PropTypes.number.isRequired, encostado: PropTypes.bool, progresso: PropTypes.number, cor: PropTypes.string };
