// Tira a aproximação da câmera dos clipes dos pacientes sem tremer.
// Os clipes originais (Veo) começam ~10% mais abertos e aproximam até ~3 s. A versão anterior
// (estabilizar-zoom.mjs) ampliava cada quadro arredondando tamanho e recorte para pixels inteiros: isso dava
// tremida e um deslize para a direita, e a ampliação fixa de 10% borrava o vídeo.
// Aqui: 1) mede quadro a quadro o zoom em relação ao ÚLTIMO quadro (câmera parada); 2) ajusta uma curva suave;
// 3) aplica o zoom contínuo com supersampling 4x (precisão de 1/4 de pixel) e entrega em 2x (1120x848).
//   node scripts/videos/estabilizar-camera.mjs        (originais em assets-brutos/pacientes-originais/<p>-<clipe>.mp4)
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ORIG = path.join(raiz, "assets-brutos/pacientes-originais");
const CLIPES = ["marcus/fala", "marcus/acerto", "marcus/erro", "teresinha/fala", "teresinha/acerto", "teresinha/erro"];
const SAIDA = [1120, 848];
const tmp = mkdtempSync(path.join(tmpdir(), "camera-"));

function ffmpeg(args, opts = {}) {
  const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { maxBuffer: 1 << 30, ...opts });
  if (r.status !== 0) throw new Error(String(r.stderr) || "ffmpeg falhou");
  return r.stdout;
}

// Zoom de cada quadro (s >= 1) que faz ele coincidir com o último, numa versão 280x212 em tons de cinza.
function medirZoom(arquivo) {
  const W = 280, H = 212, N = W * H;
  const d = ffmpeg(["-i", arquivo, "-vf", `scale=${W}:${H}:flags=area,format=gray`, "-f", "rawvideo", "-"]);
  const n = d.length / N;
  const fr = (i) => d.subarray(i * N, (i + 1) * N);
  const L = fr(n - 1);
  const custo = (f, s) => {
    let soma = 0, c = 0;
    for (let y = 8; y < H - 8; y += 2) for (let x = 8; x < W - 8; x += 2) {
      const sx = (x - W / 2) / s + W / 2, sy = (y - H / 2) / s + H / 2;
      const x0 = sx | 0, y0 = sy | 0, ax = sx - x0, ay = sy - y0, i = y0 * W + x0;
      const v = (f[i] * (1 - ax) + f[i + 1] * ax) * (1 - ay) + (f[i + W] * (1 - ax) + f[i + W + 1] * ax) * ay;
      soma += Math.abs(v - L[y * W + x]); c++;
    }
    return soma / c;
  };
  const zs = new Array(n);
  let ant = 1;
  for (let i = n - 1; i >= 0; i--) {
    let best = ant, bc = custo(fr(i), ant);
    for (const passo of [0.01, 0.003, 0.001, 0.0003]) {
      for (let melhorou = true; melhorou; ) {
        melhorou = false;
        for (const t of [best + passo, best - passo]) {
          if (t < 1) continue;
          const k = custo(fr(i), t);
          if (k < bc - 1e-6) { best = t; bc = k; melhorou = true; }
        }
      }
    }
    zs[i] = ant = best;
  }
  return zs;
}

// Curva suave: média móvel de 9 quadros e nunca crescendo (a câmera só aproxima).
function suavizar(zs) {
  const n = zs.length, out = zs.map((_, i) => {
    let s = 0, c = 0;
    for (let k = Math.max(0, i - 4); k <= Math.min(n - 1, i + 4); k++) { s += zs[k]; c++; }
    return s / c;
  });
  for (let i = 1; i < n; i++) out[i] = Math.min(out[i], out[i - 1]);
  for (let i = 0; i < n; i++) out[i] = Math.max(1, out[i]);
  return out;
}

for (const clipe of CLIPES) {
  const [p, c] = clipe.split("/");
  const mp4 = path.join(ORIG, `${p}-${c}.mp4`);
  if (!existsSync(mp4)) throw new Error(`Falta o original ${mp4}`);
  const zs = suavizar(medirZoom(mp4));
  // Expressão do zoompan: valor de cada quadro (on) por busca binária em if aninhado.
  const expr = (lo, hi) => (lo === hi ? zs[lo].toFixed(5) : `if(lt(on\\,${(lo + hi + 1) >> 1})\\,${expr(lo, (lo + hi + 1 >> 1) - 1)}\\,${expr((lo + hi + 1) >> 1, hi)})`);
  const z = expr(0, zs.length - 1);
  // 4x de supersampling: o recorte do zoompan cai em 1/4 de pixel do original.
  const vf = () =>
    `scale=2240:1696:flags=lanczos,format=yuv420p,zoompan=z='${z}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=${SAIDA[0]}x${SAIDA[1]}:fps=24`;
  const outMp4 = path.join(tmp, "s.mp4");
  const outWebm = path.join(tmp, "s.webm");
  ffmpeg(["-i", mp4, "-vf", vf(), "-c:v", "libx264", "-crf", "18", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", outMp4]);
  // webm opaco, igual ao mp4: o WebKit (Safari) ignora o alfa do VP9 e mostrava o fundo cinza do original.
  ffmpeg(["-i", outMp4, "-c:v", "libvpx-vp9", "-crf", "30", "-b:v", "0", "-pix_fmt", "yuv420p", "-row-mt", "1", "-an", outWebm]);
  const destino = path.join(raiz, "public/pacientes", clipe);
  copyFileSync(outMp4, `${destino}.mp4`);
  copyFileSync(outWebm, `${destino}.webm`);
  console.log(`${clipe}: zoom ${zs[0].toFixed(3)} -> 1 em ${(zs.findIndex((v) => v <= 1.0005) / 24).toFixed(1)} s`);
}
