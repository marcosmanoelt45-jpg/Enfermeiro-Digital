import React from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Nunito";
import { POPS_AULAS } from "../../src/data/procedimentos/popsAulas.js";
import { EcgOndas, DURACAO_ECG } from "./EcgOndas.jsx";

const { fontFamily } = loadFont("normal", { weights: ["600", "800", "900"], subsets: ["latin", "latin-ext"] });

export const COR = { fundo: "#0B131D", sup: "#131F2E", linha: "#27394B", marca: "#20D5B5", texto: "#EAF2F8", suave: "#9FB3C6", alerta: "#FFC247", erro: "#FF6B6B" };
export const FPS = 30;
const INTRO = 75;
const PASSO = 150;
const FIM = 90;

export const popPorId = (id) => POPS_AULAS.find((p) => p.id === id);
export const temEcg = (id) => id === "eletrocardiograma";
export const duracaoPop = (id) => {
  const p = popPorId(id);
  return INTRO + (temEcg(id) ? DURACAO_ECG : 0) + p.steps.length * PASSO + FIM;
};

const entrada = (f, fps, atraso = 0) => spring({ frame: f - atraso, fps, config: { damping: 200, stiffness: 120, mass: 0.6 } });

function Marca({ escala = 1 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 * escala }}>
      <div style={{ width: 34 * escala, height: 34 * escala, borderRadius: 10 * escala, background: COR.marca, display: "flex", alignItems: "center", justifyContent: "center", color: COR.fundo, fontWeight: 900, fontSize: 22 * escala }}>+</div>
      <span style={{ fontSize: 26 * escala, fontWeight: 900, color: COR.texto, letterSpacing: -0.5 }}>Enfere</span>
    </div>
  );
}

function Intro({ pop }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = entrada(f, fps);
  const b = entrada(f, fps, 8);
  const saida = interpolate(f, [INTRO - 12, INTRO], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ padding: 90, justifyContent: "center", opacity: saida }}>
      <div style={{ opacity: a, transform: `translateY(${(1 - a) * 24}px)` }}>
        <span style={{ display: "inline-block", padding: "8px 18px", borderRadius: 999, background: `${COR.marca}22`, color: COR.marca, fontSize: 24, fontWeight: 800 }}>{pop.categoryLabel}</span>
      </div>
      <h1 style={{ margin: "26px 0 0", fontSize: 66, lineHeight: 1.08, fontWeight: 900, color: COR.texto, maxWidth: 1050, opacity: b, transform: `translateY(${(1 - b) * 28}px)` }}>{pop.title}</h1>
      <p style={{ marginTop: 22, fontSize: 30, fontWeight: 700, color: COR.suave, opacity: b }}>{pop.steps.length} passos · siga o checklist abaixo do vídeo</p>
    </AbsoluteFill>
  );
}

function Passo({ pop, indice }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = pop.steps[indice];
  const a = entrada(f, fps);
  const b = entrada(f, fps, 6);
  const saida = interpolate(f, [PASSO - 10, PASSO], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const total = pop.steps.length;
  const enche = interpolate(f, [0, PASSO], [0, 1], { easing: Easing.linear, extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ padding: "80px 90px 70px", opacity: saida }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 24, fontWeight: 800, color: COR.suave }}>{pop.title}</span>
        <Marca escala={0.8} />
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 56 }}>
        <div style={{ width: 190, height: 190, flexShrink: 0, borderRadius: 999, background: COR.marca, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 104, fontWeight: 900, color: COR.fundo, transform: `scale(${0.85 + a * 0.15})`, opacity: a }}>{p.stepNumber}</div>
        <div style={{ opacity: b, transform: `translateY(${(1 - b) * 20}px)` }}>
          <h2 style={{ margin: 0, fontSize: 54, lineHeight: 1.1, fontWeight: 900, color: COR.texto }}>{p.title}</h2>
          <p style={{ margin: "20px 0 0", fontSize: 32, lineHeight: 1.35, fontWeight: 600, color: "#C9D6E2", maxWidth: 840 }}>{p.desc}</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={{ flex: 1, height: 10, borderRadius: 999, background: COR.linha, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${i < indice ? 100 : i === indice ? enche * 100 : 0}%`, background: COR.marca }} />
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}

function Fim({ pop }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = entrada(f, fps);
  const alerta = pop.safetyAlerts?.[0];
  return (
    <AbsoluteFill style={{ padding: 90, justifyContent: "center", alignItems: "flex-start", opacity: a }}>
      {alerta && (
        <div style={{ borderLeft: `8px solid ${alerta.type === "danger" ? COR.erro : COR.alerta}`, paddingLeft: 26, marginBottom: 44 }}>
          <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: alerta.type === "danger" ? COR.erro : COR.alerta }}>Atenção</p>
          <p style={{ margin: "8px 0 0", fontSize: 40, fontWeight: 900, color: COR.texto, maxWidth: 1000 }}>{alerta.title}</p>
          <p style={{ margin: "10px 0 0", fontSize: 28, fontWeight: 600, color: "#C9D6E2", maxWidth: 1000 }}>{alerta.text}</p>
        </div>
      )}
      <Marca />
    </AbsoluteFill>
  );
}

export function Pop({ id }) {
  const pop = popPorId(id);
  let inicio = 0;
  const blocos = [];
  blocos.push(<Sequence key="intro" from={inicio} durationInFrames={INTRO}><Intro pop={pop} /></Sequence>);
  inicio += INTRO;
  if (temEcg(id)) {
    blocos.push(<Sequence key="ecg" from={inicio} durationInFrames={DURACAO_ECG}><EcgOndas /></Sequence>);
    inicio += DURACAO_ECG;
  }
  pop.steps.forEach((_, i) => {
    blocos.push(<Sequence key={`p${i}`} from={inicio} durationInFrames={PASSO}><Passo pop={pop} indice={i} /></Sequence>);
    inicio += PASSO;
  });
  blocos.push(<Sequence key="fim" from={inicio} durationInFrames={FIM}><Fim pop={pop} /></Sequence>);
  return <AbsoluteFill style={{ background: COR.fundo, fontFamily }}>{blocos}</AbsoluteFill>;
}
