// Compensa a aproximação lenta da câmera nos clipes dos pacientes: cada quadro é ampliado o quanto falta para
// chegar ao enquadramento final, então o vídeo fica parado na câmera e o loop não "volta" e aproxima de novo.
// Medido com SSIM contra o 1º quadro (07/11/2026): Marcus chega a ~10% em ~3 s; Teresinha a ~10% em ~2,5 s.
//   node scripts/videos/estabilizar-zoom.mjs
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CLIPES = [
  ["marcus/fala", 1.10, 3.0],
  ["marcus/acerto", 1.12, 3.5],
  ["marcus/erro", 1.10, 3.0],
  ["teresinha/fala", 1.10, 2.5],
  ["teresinha/acerto", 1.10, 2.5],
  ["teresinha/erro", 1.10, 2.5],
];
const tmp = mkdtempSync(path.join(tmpdir(), "zoom-"));

function ffmpeg(args) {
  const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr || "ffmpeg falhou");
}

for (const [clipe, Z, tz] of CLIPES) {
  const base = path.join(raiz, "public/pacientes", clipe);
  // fator de ampliação do quadro em t: Z / (1 + (Z-1) * min(t/tz, 1))
  const k = `${Z}/(1+${(Z - 1).toFixed(3)}*min(t/${tz}\\,1))`;
  const vf = `scale=w='trunc(iw*${k}/2)*2':h='trunc(ih*${k}/2)*2':eval=frame:flags=lanczos,crop=560:424`;
  const mp4 = path.join(tmp, "s.mp4");
  const webm = path.join(tmp, "s.webm");
  ffmpeg(["-i", `${base}.mp4`, "-vf", vf, "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", mp4]);
  ffmpeg(["-i", `${base}.mp4`, "-vf", vf, "-c:v", "libvpx-vp9", "-crf", "24", "-b:v", "0", "-pix_fmt", "yuv420p", "-an", webm]);
  copyFileSync(mp4, `${base}.mp4`);
  copyFileSync(webm, `${base}.webm`);
  console.log(`${clipe}: ok`);
}
