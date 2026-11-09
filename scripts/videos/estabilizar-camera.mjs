// Tira a aproximação da câmera dos clipes dos pacientes sem tremer.
// Os clipes originais (Veo) começam ~10% mais abertos e aproximam até ~3 s. A versão anterior
// (estabilizar-zoom.mjs) ampliava cada quadro arredondando tamanho e recorte para pixels inteiros: isso dava
// tremida e um deslize para a direita, e a ampliação fixa de 10% borrava o vídeo.
// Aqui: 1) mede quadro a quadro o zoom em relação ao ÚLTIMO quadro (câmera parada); 2) ajusta uma curva suave;
// 3) reamostra cada quadro na posição exata (bicúbica) e entrega em 2x (1120x848).
//   node scripts/videos/estabilizar-camera.mjs        (originais em assets-brutos/pacientes-originais/<p>-<clipe>.mp4)
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, writeFileSync } from "node:fs";
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

// Para cada quadro: zoom s e deslocamento (dx, dy, em px do original 560x424) que fazem ele coincidir com o ÚLTIMO
// quadro (câmera parada). Mede na resolução original: a versão anterior (zoom só, em 280 px) deixava 0,5 a 1 px
// de tremida, porque a câmera não aproximava exatamente pelo centro e oscilava um pouco.
function medirCamera(arquivo) {
  const W = 560, H = 424, N = W * H;
  const d = ffmpeg(["-i", arquivo, "-vf", `scale=${W}:${H}:flags=area,format=gray`, "-f", "rawvideo", "-"]);
  const n = d.length / N;
  const fr = (i) => d.subarray(i * N, (i + 1) * N);
  const L = fr(n - 1);
  const custo = (f, s, dx, dy) => {
    let soma = 0, c = 0;
    for (let y = 16; y < H - 16; y += 3) for (let x = 16; x < W - 16; x += 3) {
      const sx = (x - W / 2) / s + W / 2 + dx, sy = (y - H / 2) / s + H / 2 + dy;
      if (sx < 0 || sy < 0 || sx >= W - 1 || sy >= H - 1) continue;
      const x0 = sx | 0, y0 = sy | 0, ax = sx - x0, ay = sy - y0, i = y0 * W + x0;
      const v = (f[i] * (1 - ax) + f[i + 1] * ax) * (1 - ay) + (f[i + W] * (1 - ax) + f[i + W + 1] * ax) * ay;
      soma += Math.abs(v - L[y * W + x]); c++;
    }
    return soma / c;
  };
  const res = new Array(n);
  let ant = { s: 1, dx: 0, dy: 0 };
  for (let i = n - 1; i >= 0; i--) {
    const f = fr(i);
    let best = { ...ant }, bc = custo(f, best.s, best.dx, best.dy);
    for (const [ps, pd] of [[0.01, 2], [0.003, 0.6], [0.001, 0.2], [0.0003, 0.06]]) {
      for (let melhorou = true; melhorou; ) {
        melhorou = false;
        for (const [a, b, c] of [[ps, 0, 0], [-ps, 0, 0], [0, pd, 0], [0, -pd, 0], [0, 0, pd], [0, 0, -pd]]) {
          const t = { s: best.s + a, dx: best.dx + b, dy: best.dy + c };
          const k = custo(f, t.s, t.dx, t.dy);
          if (k < bc - 1e-6) { best = t; bc = k; melhorou = true; }
        }
      }
    }
    res[i] = ant = best;
  }
  return res;
}

// Curvas suaves: média móvel de 11 quadros em s, dx e dy (a oscilação fina some, o movimento real fica).
function suavizar(res) {
  const n = res.length;
  const media = (k) => res.map((_, i) => {
    let s = 0, c = 0;
    for (let j = Math.max(0, i - 5); j <= Math.min(n - 1, i + 5); j++) { s += res[j][k]; c++; }
    return s / c;
  });
  const s = media("s"), dx = media("dx"), dy = media("dy");
  return res.map((_, i) => ({ s: Math.max(1, s[i]), dx: dx[i], dy: dy[i] }));
}

// Gera os quadros de saída (rgb24, SAIDA) a partir do original 560x424: cada quadro i é ampliado por s e
// deslocado por (dx, dy) com interpolação bicúbica (Catmull-Rom) na posição exata, sem arredondar.
function renderizar(arquivo, cam) {
  const W = 560, H = 424, [OW, OH] = SAIDA;
  const d = ffmpeg(["-i", arquivo, "-vf", `scale=${W}:${H}:flags=lanczos,format=rgb24`, "-f", "rawvideo", "-"]);
  const tam = W * H * 3;
  const n = d.length / tam;
  const out = Buffer.alloc(OW * OH * 3 * n);
  const kern = (t) => {
    const a = Math.abs(t);
    if (a <= 1) return 1.5 * a * a * a - 2.5 * a * a + 1;
    if (a < 2) return -0.5 * a * a * a + 2.5 * a * a - 4 * a + 2;
    return 0;
  };
  // Pesos de uma dimensão: para cada coordenada de saída, 4 índices de origem e 4 pesos.
  const pesos = (OUT, IN, s, desloc) => {
    const idx = new Int32Array(OUT * 4), w = new Float32Array(OUT * 4);
    for (let o = 0; o < OUT; o++) {
      const x = ((o + 0.5) * IN) / OUT - 0.5; // coordenada no enquadramento final (espaço do original)
      const src = (x - IN / 2) / s + IN / 2 + desloc;
      const x0 = Math.floor(src);
      let soma = 0;
      for (let k = 0; k < 4; k++) {
        const xi = x0 - 1 + k;
        const wk = kern(src - xi);
        idx[o * 4 + k] = Math.min(IN - 1, Math.max(0, xi));
        w[o * 4 + k] = wk;
        soma += wk;
      }
      for (let k = 0; k < 4; k++) w[o * 4 + k] /= soma;
    }
    return { idx, w };
  };
  for (let i = 0; i < n; i++) {
    const { s, dx, dy } = cam[Math.min(i, cam.length - 1)];
    const px = pesos(OW, W, s, dx);
    const py = pesos(OH, H, s, dy);
    const base = i * tam;
    const ob = i * OW * OH * 3;
    for (let Y = 0; Y < OH; Y++) {
      for (let X = 0; X < OW; X++) {
        let r = 0, g = 0, b = 0;
        for (let ky = 0; ky < 4; ky++) {
          const wy = py.w[Y * 4 + ky];
          const linha = base + py.idx[Y * 4 + ky] * W * 3;
          for (let kx = 0; kx < 4; kx++) {
            const wgt = wy * px.w[X * 4 + kx];
            const p = linha + px.idx[X * 4 + kx] * 3;
            r += d[p] * wgt;
            g += d[p + 1] * wgt;
            b += d[p + 2] * wgt;
          }
        }
        const o = ob + (Y * OW + X) * 3;
        out[o] = r < 0 ? 0 : r > 255 ? 255 : r;
        out[o + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
        out[o + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
      }
    }
  }
  return out;
}

for (const clipe of CLIPES) {
  const [p, c] = clipe.split("/");
  const mp4 = path.join(ORIG, `${p}-${c}.mp4`);
  if (!existsSync(mp4)) throw new Error(`Falta o original ${mp4}`);
  const cam = suavizar(medirCamera(mp4));
  const zs = cam.map((k) => k.s);
  // Reamostragem própria (bicúbica, posição exata de cada pixel): o zoompan do ffmpeg arredonda o recorte
  // para pixel inteiro e deixava ~1 px de tremida.
  const bruto = renderizar(mp4, cam);
  const rawPath = path.join(tmp, "quadros.rgb");
  writeFileSync(rawPath, bruto);
  const outMp4 = path.join(tmp, "s.mp4");
  const outWebm = path.join(tmp, "s.webm");
  ffmpeg(["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${SAIDA[0]}x${SAIDA[1]}`, "-r", "24", "-i", rawPath, "-vf", "unsharp=5:5:0.6:5:5:0", "-c:v", "libx264", "-crf", "14", "-preset", "slow", "-tune", "animation", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", outMp4]);
  // webm opaco, igual ao mp4: o WebKit (Safari) ignora o alfa do VP9 e mostrava o fundo cinza do original.
  ffmpeg(["-i", outMp4, "-c:v", "libvpx-vp9", "-crf", "22", "-b:v", "0", "-pix_fmt", "yuv420p", "-row-mt", "1", "-an", outWebm]);
  const destino = path.join(raiz, "public/pacientes", clipe);
  copyFileSync(outMp4, `${destino}.mp4`);
  copyFileSync(outWebm, `${destino}.webm`);
  console.log(`${clipe}: zoom ${zs[0].toFixed(3)}, desloc. inicial ${cam[0].dx.toFixed(2)},${cam[0].dy.toFixed(2)} px`);
}
