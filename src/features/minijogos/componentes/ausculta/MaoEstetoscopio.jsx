import React from "react";
import PropTypes from "prop-types";

// A mão do aluno (visão em primeira pessoa) segurando o diafragma do estetoscópio. O centro do diafragma fica em
// (x, y); a mão sai pelo canto inferior direito. `progresso` (0 a 1) desenha o anel de "segurando para ouvir".
// Desenho do Flow (scripts/assets/processar-mao-estetoscopio.py): imagem de 756 x 1024 com o centro do
// diafragma em (143, 470) e raio de 140 px. Aqui o diafragma tem raio 19, como no desenho antigo em código.
const IMAGEM = { src: "/minijogos/ausculta/mao-estetoscopio.webp", largura: 756, altura: 1024, cx: 143, cy: 470, raio: 140 };
const RAIO = 19;
const S = RAIO / IMAGEM.raio;

export default function MaoEstetoscopio({ x, y, encostado = false, progresso = 0, cor = "#20D5B5", escala = 1 }) {
  const anel = RAIO + 3;
  const c = 2 * Math.PI * anel;
  // Encostado: a mão "aperta" um pouco (fica 3% menor), como quem pressiona o diafragma na pele.
  const aperto = encostado ? 0.97 : 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${escala * aperto})`} style={{ pointerEvents: "none" }} aria-hidden="true">
      <image href={IMAGEM.src} x={-IMAGEM.cx * S} y={-IMAGEM.cy * S} width={IMAGEM.largura * S} height={IMAGEM.altura * S} />
      {progresso > 0 && (
        <circle r={anel} fill="none" stroke={cor} strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - progresso)} transform="rotate(-90)" />
      )}
    </g>
  );
}

MaoEstetoscopio.propTypes = { x: PropTypes.number.isRequired, y: PropTypes.number.isRequired, encostado: PropTypes.bool, progresso: PropTypes.number, cor: PropTypes.string, escala: PropTypes.number };
