#!/usr/bin/env node
// Clipes de personagem (docs/plano/producao/flow.md, seção 6).
// Entrada: assets-brutos/personagens/<id>/<emocao>.mp4 (fundo verde #00FF00).
// Saída: public/personagens/<id>/<emocao>.webm (VP9 com alfa) + .mp4 de reserva sobre #16222E + poster.png/.webp,
// relatório de QA e atualização de clipes/pasta/poster em src/features/cena/dados/personagens.js.
// Uso: node scripts/assets/processar-personagem.mjs <id> [--sem-atualizar] [--vaivem=parado[:segundos]]
// --vaivem: para clipes gerados só com o quadro inicial (o Veo recusa início = fim quase parado). Usa os primeiros
// N segundos (padrão 3,5) de ida e os mesmos de volta, então o loop fecha sem emenda.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const [id, ...flags] = process.argv.slice(2);
if (!id) {
  console.error("Uso: node scripts/assets/processar-personagem.mjs <id> [--sem-atualizar]");
  process.exit(2);
}
const ENTRADA = join("assets-brutos/personagens", id);
const SAIDA = join("public/personagens", id);
const DADOS = "src/features/cena/dados/personagens.js";
// Recorte por dominância do verde (calibrado em Ana e Rui, 2026-11-08). d = G - max(R,B):
// fundo do Flow (~#0AF609) dá d≈236; verde-água da marca (#20D5B5) dá d≈32; pele e jaleco dão d<=0.
// Alfa cheio com d<=50 e zero com d>=95. O chromakey comum não pegava as frestas finas entre braço e corpo,
// onde a compressão mistura o verde com a pele. O despill só baixa G até max(R,B)+40, então o verde-água
// fica como está e o verde da borda some. A borda do alfa ainda encolhe 1 px.
const VERDE = "0x0AF609";
const CHAVE =
  "format=gbrap,geq=r='r(X,Y)':g='min(g(X,Y),max(r(X,Y),b(X,Y))+40)':b='b(X,Y)'" +
  ":a='255*clip((95-(g(X,Y)-max(r(X,Y),b(X,Y))))/45,0,1)',split[ck_c][ck_a];[ck_a]alphaextract,erosion[ck_m];[ck_c][ck_m]alphamerge";
// Corta 4 px da borda (o Veo deixa uma linha), recorta 4:3, e encolhe 8% com folga em cima (a cabeça não encosta no topo).
// O croma é reamostrado em alta qualidade antes do recorte (o vídeo vem em 4:2:0).
const BASE = `crop=iw-8:ih-8,crop='min(iw,ih*4/3)':'min(ih,iw*3/4)',scale=516:390:flags=lanczos+full_chroma_inp+full_chroma_int,pad=560:424:(ow-iw)/2:oh-ih:color=${VERDE},fps=24`;
const FUNDO = "0x16222E";
// Ordem em que as emoções aparecem nos dados (as que não estiverem aqui vão no fim).
// Emoções com loop de ida e volta: --vaivem=parado ou --vaivem=parado:3.
const VAIVEM = Object.fromEntries(
  flags
    .filter((f) => f.startsWith("--vaivem="))
    .flatMap((f) => f.slice(9).split(","))
    .map((v) => {
      const [e, seg] = v.split(":");
      return [e, Number(seg) || 3.5];
    }),
);
const ORDEM = ["parado", "falando", "pensando", "acerto", "erro", "dor", "desconfiado", "confuso", "irritado", "feliz"];

function rodar(cmd, args) {
  const r = spawnSync(cmd, args, { maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(`${cmd} falhou: ${String(r.stderr || "").slice(-800)}`);
  return { out: r.stdout, err: String(r.stderr || "") };
}
const ff = (args) => rodar("ffmpeg", ["-hide_banner", "-v", "error", "-y", ...args]);

function duracao(arquivo) {
  const { out } = rodar("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", arquivo]);
  return Number(String(out).trim());
}

// SSIM entre o 1º e o último quadro do clipe já recortado (sobre o fundo, sem alfa).
function ssimLoop(mp4) {
  const d = duracao(mp4);
  const ini = join(SAIDA, ".qa-ini.png");
  const fim = join(SAIDA, ".qa-fim.png");
  ff(["-i", mp4, "-frames:v", "1", ini]);
  ff(["-sseof", "-0.1", "-i", mp4, "-update", "1", "-frames:v", "1", fim]);
  const r = spawnSync("ffmpeg", ["-hide_banner", "-i", ini, "-i", fim, "-lavfi", "ssim", "-f", "null", "-"], { encoding: "utf8" });
  const m = /All:([\d.]+)/.exec(r.stderr || "");
  return { ssim: m ? Number(m[1]) : NaN, d };
}

// % de pixels opacos ainda verdes, no quadro do meio do webm.
function verdeRestante(webm, d) {
  const { out } = rodar("ffmpeg", ["-v", "error", "-c:v", "libvpx-vp9", "-ss", String(d / 2), "-i", webm, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgba", "-"]);
  let opacos = 0, verdes = 0;
  for (let i = 0; i < out.length; i += 4) {
    if (out[i + 3] < 128) continue;
    opacos++;
    if (out[i + 1] > 150 && out[i + 1] > out[i] * 1.6 && out[i + 1] > out[i + 2] * 1.6) verdes++;
  }
  return opacos ? (verdes / opacos) * 100 : 0;
}

// Fonte do clipe: o mp4 bruto, ou uma versão ida e volta dele quando a emoção está em --vaivem.
function fonte(emocao) {
  const bruto = join(ENTRADA, `${emocao}.mp4`);
  if (!VAIVEM[emocao]) return bruto;
  const saida = join(ENTRADA, `.${emocao}-vaivem.mp4`);
  ff([
    "-i", bruto,
    "-filter_complex", `[0:v]trim=0:${VAIVEM[emocao]},setpts=PTS-STARTPTS,split[ida][b];[b]reverse,setpts=PTS-STARTPTS[volta];[ida][volta]concat=n=2:v=1:a=0`,
    "-c:v", "libx264", "-crf", "12", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-an", saida,
  ]);
  return saida;
}

function processarClipe(emocao) {
  const bruto = fonte(emocao);
  const webm = join(SAIDA, `${emocao}.webm`);
  const mp4 = join(SAIDA, `${emocao}.mp4`);
  ff(["-i", bruto, "-vf", `${BASE},${CHAVE},format=yuva420p`, "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-crf", "34", "-b:v", "0", "-row-mt", "1", "-auto-alt-ref", "0", "-an", webm]);
  ff([
    "-f", "lavfi", "-i", `color=${FUNDO}:s=560x424:r=24`, "-i", bruto,
    "-filter_complex", `[1:v]${BASE},${CHAVE}[fg];[0:v][fg]overlay=shortest=1,format=yuv420p`,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "26", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", mp4,
  ]);
  const { ssim, d } = ssimLoop(mp4);
  const verde = verdeRestante(webm, d);
  const mb = statSync(webm).size / (1024 * 1024);
  const avisos = [];
  if (!(ssim >= 0.85)) avisos.push(`SSIM ${ssim.toFixed(3)}: loop vai pular, regerar ou cortar`);
  if (verde > 0.5) avisos.push(`vazou verde (${verde.toFixed(2)}%)`);
  if (d < 3 || d > 8.2) avisos.push(`duração ${d.toFixed(1)} s fora de 3–8 s`);
  if (mb > 1.5) avisos.push(`webm com ${mb.toFixed(2)} MB (> 1,5 MB)`);
  console.log(`${avisos.length ? "⚠" : "✓"} ${emocao}: ${d.toFixed(1)} s, SSIM ${ssim.toFixed(3)}, verde ${verde.toFixed(2)}%, webm ${mb.toFixed(2)} MB`);
  for (const a of avisos) console.log(`    - ${a}`);
  return avisos.length === 0;
}

function poster(emocao) {
  const bruto = fonte(emocao);
  const png = join(SAIDA, "poster.png");
  ff(["-i", bruto, "-vf", `${BASE},${CHAVE},format=rgba`, "-frames:v", "1", png]);
  ff(["-i", png, "-c:v", "libwebp", "-quality", "80", join(SAIDA, "poster.webp")]);
}

// Reescreve só a entrada do personagem: clipes, pasta e poster.
function atualizarDados(clipes) {
  const fonte = readFileSync(DADOS, "utf8");
  const ini = fonte.indexOf(`id: "${id}"`);
  if (ini < 0) throw new Error(`personagem "${id}" não existe em ${DADOS}`);
  const abre = fonte.lastIndexOf("{", ini);
  const fecha = fonte.indexOf("\n  },", ini);
  if (abre < 0 || fecha < 0) throw new Error(`não consegui delimitar a entrada de "${id}"`);
  let bloco = fonte.slice(abre, fecha);
  const lista = `clipes: [${clipes.map((c) => `"${c}"`).join(", ")}],`;
  bloco = bloco.replace(/clipes: \[[^\]]*\],/, lista);
  bloco = bloco.replace(/\n\s*arquivos: \{[^}]*\},/, ""); // clipes novos usam o nome da emoção
  const pasta = `pasta: "/personagens/${id}",`;
  bloco = /pasta: "[^"]*",/.test(bloco) ? bloco.replace(/pasta: "[^"]*",/, pasta) : bloco.replace(lista, `${lista}\n    ${pasta}`);
  bloco = bloco.replace(/poster: "[^"]*",/, `poster: "/personagens/${id}/poster.png",`);
  writeFileSync(DADOS, fonte.slice(0, abre) + bloco + fonte.slice(fecha));
  console.log(`\n${DADOS}: ${id} → ${lista}`);
}

if (!existsSync(ENTRADA)) {
  console.error(`não achei ${ENTRADA}`);
  process.exit(2);
}
mkdirSync(SAIDA, { recursive: true });
const emocoes = readdirSync(ENTRADA)
  .filter((f) => f.endsWith(".mp4") && !f.startsWith("."))
  .map((f) => basename(f, ".mp4"))
  .sort((a, b) => (ORDEM.indexOf(a) + 1 || 99) - (ORDEM.indexOf(b) + 1 || 99));
if (!emocoes.length) {
  console.error(`nenhum .mp4 em ${ENTRADA}`);
  process.exit(2);
}
console.log(`QA de ${id}:`);
let ok = 0;
for (const e of emocoes) {
  try {
    if (processarClipe(e)) ok++;
  } catch (err) {
    console.error(`✗ ${e}: ${err.message}`);
  }
}
poster(emocoes.includes("parado") ? "parado" : emocoes[0]);
for (const f of [".qa-ini.png", ".qa-fim.png"]) {
  const p = join(SAIDA, f);
  if (existsSync(p)) unlinkSync(p);
}
if (!flags.includes("--sem-atualizar")) atualizarDados(emocoes);
console.log(`\n${ok}/${emocoes.length} clipes sem avisos`);
process.exitCode = ok === emocoes.length ? 0 : 1;
