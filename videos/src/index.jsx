import React from "react";
import { Composition, registerRoot } from "remotion";
import { POPS_AULAS } from "../../src/data/procedimentos/popsAulas.js";
import { Pop, duracaoPop, FPS } from "./Pop.jsx";

// Vídeos dos POPs do material da disciplina (um por POP). Renderizar: npm run render (render.mjs).
function Raiz() {
  return (
    <>
      {POPS_AULAS.map((p) => (
        <Composition key={p.id} id={`pop-${p.id}`} component={Pop} defaultProps={{ id: p.id }} durationInFrames={duracaoPop(p.id)} fps={FPS} width={1280} height={720} />
      ))}
    </>
  );
}

registerRoot(Raiz);
