#!/usr/bin/env node
// Objetos dos minijogos: assets-brutos/objetos/<id>.png|.jpg (fundo verde #00FF00) → public/minijogos/<id>.webp
// com alfa, recortado no conteúdo, 512 px no maior lado, qualidade 80.
// Uso: node scripts/assets/processar-objetos.mjs [id ...]   (sem ids: processa todos os .png da pasta)
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { basename, extname, join } from "node:path";

const ENTRADA = "assets-brutos/objetos";
const SAIDA = "public/minijogos";
const CHAVE = "chromakey=0x00FF00:0.12:0.06,despill=type=green";
const LADO = 512;
const MARGEM = 8;
const EXTENSOES = [".png", ".jpg", ".jpeg"]; // px de folga em volta do conteúdo

function rodar(cmd, args, opcoes = {}) {
  const r = spawnSync(cmd, args, { maxBuffer: 1 << 28, ...opcoes });
  if (r.status !== 0) throw new Error(`${cmd} falhou: ${String(r.stderr || "").slice(-600)}`);
  return r.stdout;
}

function dimensoes(arquivo) {
  const out = rodar("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", arquivo]);
  const [w, h] = String(out).trim().split(",").map(Number);
  return { w, h };
}

// Caixa do conteúdo (pixels com alfa > 16) depois do recorte do verde.
function caixaConteudo(arquivo, w, h) {
  const rgba = rodar("ffmpeg", ["-v", "error", "-i", arquivo, "-vf", `${CHAVE},format=rgba`, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgba", "-"]);
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (rgba[(y * w + x) * 4 + 3] > 16) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null;
  x0 = Math.max(0, x0 - MARGEM);
  y0 = Math.max(0, y0 - MARGEM);
  x1 = Math.min(w - 1, x1 + MARGEM);
  y1 = Math.min(h - 1, y1 + MARGEM);
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

// % de pixels opacos que ainda são verdes (vazamento do fundo).
function verdeRestante(arquivo) {
  const { w, h } = dimensoes(arquivo);
  const rgba = rodar("ffmpeg", ["-v", "error", "-i", arquivo, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgba", "-"]);
  let opacos = 0, verdes = 0;
  for (let i = 0; i < w * h * 4; i += 4) {
    if (rgba[i + 3] < 128) continue;
    opacos++;
    const [r, g, b] = [rgba[i], rgba[i + 1], rgba[i + 2]];
    if (g > 150 && g > r * 1.6 && g > b * 1.6) verdes++;
  }
  return opacos ? (verdes / opacos) * 100 : 0;
}

function processar(id) {
  const entrada = EXTENSOES.map((e) => join(ENTRADA, `${id}${e}`)).find((f) => existsSync(f));
  if (!entrada) throw new Error(`não achei ${join(ENTRADA, id)}.png|.jpg`);
  const { w, h } = dimensoes(entrada);
  const caixa = caixaConteudo(entrada, w, h);
  if (!caixa) throw new Error(`${id}: a imagem ficou vazia depois do recorte do verde`);
  const escala = caixa.w >= caixa.h ? `${LADO}:-2` : `-2:${LADO}`;
  const filtro = `${CHAVE},crop=${caixa.w}:${caixa.h}:${caixa.x}:${caixa.y},scale=${escala}:flags=lanczos,format=yuva420p`;
  const saida = join(SAIDA, `${id}.webp`);
  rodar("ffmpeg", ["-v", "error", "-y", "-i", entrada, "-vf", filtro, "-c:v", "libwebp", "-quality", "80", "-frames:v", "1", saida]);
  const kb = statSync(saida).size / 1024;
  const verde = verdeRestante(saida);
  const avisos = [];
  if (verde > 0.5) avisos.push(`vazou verde (${verde.toFixed(2)}%)`);
  if (kb > 120) avisos.push(`arquivo grande (${kb.toFixed(0)} KB)`);
  console.log(`${avisos.length ? "⚠" : "✓"} ${id}.webp  ${kb.toFixed(0)} KB  verde ${verde.toFixed(2)}%${avisos.length ? "  " + avisos.join("; ") : ""}`);
  return avisos.length === 0;
}

mkdirSync(SAIDA, { recursive: true });
const ids = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [...new Set(readdirSync(ENTRADA).filter((f) => EXTENSOES.includes(extname(f).toLowerCase())).map((f) => basename(f, extname(f))))];
let falhas = 0;
for (const id of ids) {
  try {
    if (!processar(id)) falhas++;
  } catch (e) {
    falhas++;
    console.error(`✗ ${e.message}`);
  }
}
console.log(`\n${ids.length - falhas}/${ids.length} sem avisos`);
process.exitCode = falhas ? 1 : 0;
