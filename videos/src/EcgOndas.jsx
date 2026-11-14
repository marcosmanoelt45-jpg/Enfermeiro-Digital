import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

export const DURACAO_ECG = 300;
const C = { fundo: "#0B131D", grade: "#1B2A3A", traco: "#20D5B5", texto: "#EAF2F8", suave: "#9FB3C6", alerta: "#FFC247" };

// Um ciclo do ECG (componentes da aula): P, PR, QRS, ponto J, ST, T, U; intervalos PR e QT embaixo.
const CAMINHO = "M0 300 L120 300 C150 252 190 252 220 300 L280 300 L300 322 L330 80 L360 345 L380 300 L450 300 C490 226 570 226 610 300 L680 300 C700 284 730 284 750 300 L1100 300";

const ROTULOS = [
  { t: 40, x: 170, y: 225, texto: "Onda P", sub: "átrios despolarizam" },
  { t: 70, x: 330, y: 50, texto: "QRS", sub: "ventrículos despolarizam" },
  { t: 100, x: 380, y: 360, texto: "Ponto J", sub: "" },
  { t: 120, x: 415, y: 270, texto: "ST", sub: "" },
  { t: 145, x: 530, y: 200, texto: "Onda T", sub: "ventrículos repolarizam" },
];
const INTERVALOS = [
  { t: 180, x1: 120, x2: 300, y: 420, texto: "Intervalo PR" },
  { t: 215, x1: 300, x2: 610, y: 480, texto: "Intervalo QT (sístole elétrica)" },
];

export function EcgOndas() {
  const f = useCurrentFrame();
  const desenho = interpolate(f, [8, 150], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const saida = interpolate(f, [DURACAO_ECG - 12, DURACAO_ECG], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const aparece = (t) => interpolate(f, [t, t + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: C.fundo, padding: "60px 90px", opacity: saida }}>
      <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: C.suave }}>Antes de colar os eletrodos: o que o traçado mostra</p>
      <svg viewBox="-20 0 1140 540" style={{ width: "100%", flex: 1 }}>
        {Array.from({ length: 24 }, (_, i) => <line key={`v${i}`} x1={i * 50} y1={20} x2={i * 50} y2={520} stroke={C.grade} strokeWidth={2} />)}
        {Array.from({ length: 11 }, (_, i) => <line key={`h${i}`} x1={0} y1={20 + i * 50} x2={1100} y2={20 + i * 50} stroke={C.grade} strokeWidth={2} />)}
        <path d={CAMINHO} fill="none" stroke={C.traco} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={desenho} />
        {ROTULOS.map((r) => (
          <g key={r.texto} opacity={aparece(r.t)}>
            <text x={r.x} y={r.y} textAnchor="middle" fill={C.texto} fontSize={34} fontWeight={900}>{r.texto}</text>
            {r.sub && <text x={r.x} y={r.y + 32} textAnchor="middle" fill={C.suave} fontSize={22} fontWeight={700}>{r.sub}</text>}
          </g>
        ))}
        {INTERVALOS.map((iv) => (
          <g key={iv.texto} opacity={aparece(iv.t)}>
            <line x1={iv.x1} y1={iv.y} x2={iv.x2} y2={iv.y} stroke={C.alerta} strokeWidth={5} />
            <line x1={iv.x1} y1={iv.y - 14} x2={iv.x1} y2={iv.y + 14} stroke={C.alerta} strokeWidth={5} />
            <line x1={iv.x2} y1={iv.y - 14} x2={iv.x2} y2={iv.y + 14} stroke={C.alerta} strokeWidth={5} />
            <text x={iv.x2 + 18} y={iv.y + 10} fill={C.alerta} fontSize={28} fontWeight={800}>{iv.texto}</text>
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
}
