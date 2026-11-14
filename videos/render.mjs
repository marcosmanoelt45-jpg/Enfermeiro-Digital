// Renderiza os vídeos dos POPs em public/videos/pops/<id>.mp4. Uso: npm run render [-- <id>]
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { getCompositions, renderMedia } from "@remotion/renderer";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const saida = path.join(aqui, "..", "public", "videos", "pops");
fs.mkdirSync(saida, { recursive: true });
const so = process.argv[2];

const serveUrl = await bundle({ entryPoint: path.join(aqui, "src", "index.jsx") });
const comps = (await getCompositions(serveUrl)).filter((c) => !so || c.id === `pop-${so}`);
for (const comp of comps) {
  const destino = path.join(saida, `${comp.id.replace(/^pop-/, "")}.mp4`);
  await renderMedia({ composition: comp, serveUrl, codec: "h264", crf: 30, pixelFormat: "yuv420p", colorSpace: "bt709", outputLocation: destino, inputProps: comp.defaultProps, concurrency: 4 });
  console.log("ok", path.basename(destino), (fs.statSync(destino).size / 1e6).toFixed(1), "MB");
}
