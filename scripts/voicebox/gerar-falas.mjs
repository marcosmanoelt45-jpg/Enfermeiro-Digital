// Gera os mp3 das falas fixas (src/data/falas/*.json) com o VoiceBox, que roda no PC do dono.
// Uso: node scripts/voicebox/gerar-falas.mjs [--personagem <id>] [--dry-run] [--amostra]
// Pula o que já está pronto (hash igual e arquivo presente): rodar duas vezes gera 0 na segunda.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { agruparFalas, aplicarPronuncia, duracaoDoWav, planejar } from "./plano.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const VOICEBOX = process.env.VOICEBOX_BASE_URL || "http://127.0.0.1:17493";
const FFMPEG = process.env.FFMPEG || "ffmpeg";
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const amostra = args.includes("--amostra");
const so = args.includes("--personagem") ? args[args.indexOf("--personagem") + 1] : null;

function lerFalas() {
  const pasta = join(raiz, "src", "data", "falas");
  const arquivos = readdirSync(pasta)
    .filter((n) => n.endsWith(".json"))
    .map((n) => JSON.parse(readFileSync(join(pasta, n), "utf8")));
  return agruparFalas(arquivos).filter((g) => !so || g.personagem === so);
}

async function voiceboxNoAr() {
  try {
    const r = await fetch(`${VOICEBOX}/profiles`, { signal: AbortSignal.timeout(3000) });
    return r.ok ? r.json() : null;
  } catch {
    return null;
  }
}

async function esperar(id, limiteMs = 180000) {
  const inicio = Date.now();
  while (Date.now() - inicio < limiteMs) {
    const r = await fetch(`${VOICEBOX}/history/${id}`);
    if (r.ok) {
      const d = await r.json();
      if (d.status === "completed") return;
      if (d.status === "failed") throw new Error(d.error || "geração falhou no VoiceBox");
    }
    await new Promise((res) => setTimeout(res, 1500));
  }
  throw new Error("tempo esgotado aguardando o VoiceBox");
}

async function gerarWav(perfil, texto) {
  const perfilId = perfil.id;
  // Perfis de voz pronta (kokoro) usam o motor deles; perfis clonados usam o qwen.
  const motor = perfil.voice_type === "preset" && perfil.default_engine ? { engine: perfil.default_engine } : { engine: "qwen", model_size: "1.7B" };
  const r = await fetch(`${VOICEBOX}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile_id: perfilId, text: texto, language: "pt", ...motor, normalize: true }),
  });
  if (!r.ok) throw new Error(`VoiceBox respondeu ${r.status}: ${await r.text()}`);
  const g = await r.json();
  if (g.status !== "completed") await esperar(g.id);
  const audio = await fetch(`${VOICEBOX}/audio/${g.id}`);
  if (!audio.ok) throw new Error(`falha ao baixar o áudio (${audio.status})`);
  return Buffer.from(await audio.arrayBuffer());
}

// WAV -> mp3 com volume normalizado (loudnorm I=-16).
function paraMp3(wav, destino) {
  const entrada = join(tmpdir(), `falas-${process.pid}-${Date.now()}.wav`);
  writeFileSync(entrada, wav);
  try {
    const r = spawnSync(FFMPEG, ["-y", "-loglevel", "error", "-i", entrada, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-codec:a", "libmp3lame", "-q:a", "4", destino], { encoding: "utf8" });
    if (r.error || r.status !== 0) throw new Error(`ffmpeg falhou: ${r.error?.message || r.stderr}`);
  } finally {
    rmSync(entrada, { force: true });
  }
}

function sortear(lista, fracao) {
  const n = Math.max(1, Math.ceil(lista.length * fracao));
  return [...lista].sort(() => Math.random() - 0.5).slice(0, n);
}

const resumo = { geradas: 0, puladas: 0, falhas: 0 };
const grupos = lerFalas();
if (!grupos.length) {
  console.log(so ? `Nenhum arquivo de falas para o personagem "${so}".` : "Nenhum arquivo em src/data/falas/*.json com falas.");
  process.exit(0);
}

let perfis = null;
if (!dryRun) {
  perfis = await voiceboxNoAr();
  if (!perfis) {
    console.error(`O VoiceBox não respondeu em ${VOICEBOX}.\nAbra o aplicativo VoiceBox ou rode:\n  "C:\\Program Files\\Voicebox\\voicebox-server.exe" --port 17493`);
    process.exit(1);
  }
}

for (const grupo of grupos) {
  const pasta = join(raiz, "public", "vozes", grupo.personagem);
  const manifestoCaminho = join(pasta, "manifest.json");
  if (!dryRun) mkdirSync(pasta, { recursive: true });
  const manifesto = existsSync(manifestoCaminho) ? JSON.parse(readFileSync(manifestoCaminho, "utf8")) : { versao: 1, falas: {} };
  manifesto.falas ??= {};
  const arquivosNoDisco = new Set(existsSync(pasta) ? readdirSync(pasta).filter((n) => n.endsWith(".mp3")) : []);

  const plano = planejar({ perfil: grupo.perfilVoicebox, falas: grupo.falas, manifesto, arquivosNoDisco, falar: (t) => aplicarPronuncia(t) });
  resumo.puladas += plano.pular.length;
  console.log(`\n${grupo.personagem} (perfil ${grupo.perfilVoicebox}): ${plano.gerar.length} a gerar, ${plano.pular.length} prontas`);
  if (dryRun) {
    for (const g of plano.gerar) console.log(`  gerar ${g.id}`);
    continue;
  }

  // Nome exato ("Rui") ou com sufixo ("Marcus Male", "Teresinha Female").
  const alvo = grupo.perfilVoicebox.toLowerCase();
  const perfil = perfis.find((p) => p.name?.toLowerCase() === alvo) ?? perfis.find((p) => p.name?.toLowerCase().startsWith(`${alvo} `));
  if (!perfil) {
    console.error(`  Perfil "${grupo.perfilVoicebox}" não existe no VoiceBox. Perfis: ${perfis.map((p) => p.name).join(", ")}`);
    resumo.falhas += plano.gerar.length;
    continue;
  }

  for (const g of plano.gerar) {
    try {
      process.stdout.write(`  ${g.id} ... `);
      const wav = await gerarWav(perfil, aplicarPronuncia(g.texto));
      paraMp3(wav, join(pasta, g.arquivo));
      const antigo = manifesto.falas[g.id]?.arquivo;
      if (antigo && antigo !== g.arquivo) rmSync(join(pasta, antigo), { force: true });
      manifesto.falas[g.id] = { arquivo: g.arquivo, hash: g.hash, duracaoMs: duracaoDoWav(wav) };
      writeFileSync(manifestoCaminho, JSON.stringify(manifesto, null, 2) + "\n"); // grava a cada fala: se parar, nada se perde
      resumo.geradas++;
      console.log("ok");
    } catch (e) {
      resumo.falhas++;
      console.log(`FALHOU (${e.message})`);
    }
  }
  for (const id of plano.idsRemovidos) {
    rmSync(join(pasta, manifesto.falas[id].arquivo), { force: true });
    delete manifesto.falas[id];
  }
  writeFileSync(manifestoCaminho, JSON.stringify(manifesto, null, 2) + "\n");

  if (amostra) {
    const pronto = grupo.falas.filter((f) => manifesto.falas[f.id]);
    const itens = sortear(pronto, 0.1).map((f) => `<li><p>${f.id}: ${f.texto}</p><audio controls src="/vozes/${grupo.personagem}/${manifesto.falas[f.id].arquivo}"></audio></li>`);
    writeFileSync(join(raiz, "public", "vozes", "_amostra.html"), `<!doctype html><meta charset="utf-8"><title>Amostra de falas</title><h1>${grupo.personagem}</h1><ul>${itens.join("")}</ul>`);
    console.log("  Amostra em public/vozes/_amostra.html (abra pelo servidor de desenvolvimento).");
  }
}

console.log(`\nResumo: ${resumo.geradas} geradas, ${resumo.puladas} puladas, ${resumo.falhas} falhas.`);
process.exit(resumo.falhas ? 1 : 0);
