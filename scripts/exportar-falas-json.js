import fs from "fs";
import path from "path";
import { CASOS_SIMULADOR } from "../src/data/simuladorCasosData.js";

const outJsonPath = path.resolve("scripts/falas_pacientes.json");

const dadosFalas = {
  marcus: CASOS_SIMULADOR.marcus.passos.map((p, idx) => ({
    idx,
    tipo: p.tipo,
    textoFala: p.tipo === "fala" ? p.texto : p.pergunta,
    audioPath: p.audioPath
  })),
  teresinha: CASOS_SIMULADOR.teresinha.passos.map((p, idx) => ({
    idx,
    tipo: p.tipo,
    textoFala: p.tipo === "fala" ? p.texto : p.pergunta,
    audioPath: p.audioPath
  }))
};

fs.writeFileSync(outJsonPath, JSON.stringify(dadosFalas, null, 2), "utf-8");
console.log(`✅ ${dadosFalas.marcus.length} falas do Marcus e ${dadosFalas.teresinha.length} falas da Teresinha exportadas para ${outJsonPath}`);
