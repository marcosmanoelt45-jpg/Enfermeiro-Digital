#!/usr/bin/env node
// "Parado" sem IA: a imagem de referência do personagem (fundo verde) balança bem de leve, pivotando na base,
// como uma pessoa parada mexendo a cabeça de um lado para o outro. O rosto não muda, não há efeitos e o loop fecha
// sem emenda (seno com período = duração). O Veo, nos testes de 2026-11-08, sempre punha aceno ou braço esticado no
// "parado" e recusava pedidos com início = fim quase parados.
// Saída: assets-brutos/personagens/<id>/parado.mp4 (depois rode processar-personagem.mjs <id>).
// Uso: node scripts/assets/parado-sintetico.mjs <id> <imagem-de-referencia> [graus=1.4] [segundos=6]
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const [id, ref, grausArg, segArg] = process.argv.slice(2);
if (!id || !ref) {
  console.error("Uso: node scripts/assets/parado-sintetico.mjs <id> <imagem-de-referencia> [graus=1.4] [segundos=6]");
  process.exit(2);
}
const graus = Number(grausArg) || 1.4;
const seg = Number(segArg) || 6;
const VERDE = "0x0AF609";
const saida = join("assets-brutos/personagens", id, "parado.mp4");

// Dobra a altura com verde embaixo para o centro da rotação cair na base do personagem, gira e corta de volta.
// A respiração é um sobe e desce de 2 px em meio período.
const filtro = [
  "scale=1280:-2,setsar=1",
  `pad=iw:ih*2:0:0:color=${VERDE}`,
  `rotate='${graus}*PI/180*sin(2*PI*t/${seg})':ow=iw:oh=ih:c=${VERDE}:bilinear=1`,
  "crop=iw:ih/2:0:0",
  `pad=iw:ih+8:0:4:color=${VERDE}`,
  `crop=iw:ih-8:0:'4+2*sin(4*PI*t/${seg})'`,
  "format=yuv420p",
].join(",");

const r = spawnSync(
  "ffmpeg",
  ["-hide_banner", "-v", "error", "-y", "-loop", "1", "-framerate", "24", "-i", ref, "-t", String(seg), "-vf", filtro,
    "-c:v", "libx264", "-crf", "12", "-preset", "veryfast", "-an", saida],
  { encoding: "utf8" },
);
if (r.status !== 0) {
  console.error(r.stderr);
  process.exit(1);
}
console.log(`${saida}: ${seg} s, ±${graus}°`);
