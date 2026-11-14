// Capas dos POPs: um quadro da abertura de cada vídeo, em public/videos/pops/<id>.jpg
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { getCompositions, renderStill } from "@remotion/renderer";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const serveUrl = await bundle({ entryPoint: path.join(aqui, "src", "index.jsx") });
for (const comp of await getCompositions(serveUrl)) {
  const destino = path.join(aqui, "..", "public", "videos", "pops", `${comp.id.replace(/^pop-/, "")}.jpg`);
  await renderStill({ composition: comp, serveUrl, output: destino, frame: 45, imageFormat: "jpeg", jpegQuality: 80, scale: 0.5, inputProps: comp.defaultProps });
  console.log("ok", path.basename(destino));
}
