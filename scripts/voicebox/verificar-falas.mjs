// Confere as falas fixas: lista falas sem mp3 e mp3 órfãos. Sai com 1 se houver órfãos (útil antes de commit).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { agruparFalas, planejar, aplicarPronuncia, semMp3 } from "./plano.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const pastaFalas = join(raiz, "src", "data", "falas");
let orfaosTotal = 0;

const arquivos = readdirSync(pastaFalas).filter((n) => n.endsWith(".json")).map((n) => JSON.parse(readFileSync(join(pastaFalas, n), "utf8")));
for (const grupo of agruparFalas(arquivos)) {
  const pasta = join(raiz, "public", "vozes", grupo.personagem);
  const manifestoCaminho = join(pasta, "manifest.json");
  const manifesto = existsSync(manifestoCaminho) ? JSON.parse(readFileSync(manifestoCaminho, "utf8")) : { falas: {} };
  const arquivosNoDisco = new Set(existsSync(pasta) ? readdirSync(pasta).filter((n) => n.endsWith(".mp3")) : []);

  const faltando = semMp3({ falas: grupo.falas, manifesto, arquivosNoDisco });
  const plano = planejar({ perfil: grupo.perfilVoicebox, falas: grupo.falas, manifesto, arquivosNoDisco, falar: (t) => aplicarPronuncia(t) });
  const desatualizadas = plano.gerar.map((g) => g.id).filter((id) => !faltando.includes(id));
  const orfaos = [...plano.orfaos, ...plano.idsRemovidos.map((id) => `(manifesto) ${id}`)];
  orfaosTotal += orfaos.length;

  console.log(`${grupo.personagem}: ${grupo.falas.length} falas, ${faltando.length} sem mp3, ${desatualizadas.length} desatualizadas, ${orfaos.length} órfãos`);
  for (const id of faltando) console.log(`  sem mp3: ${id}`);
  for (const id of desatualizadas) console.log(`  desatualizada (texto, perfil ou pronúncia mudou): ${id}`);
  for (const o of orfaos) console.log(`  órfão: ${o}`);
}

process.exit(orfaosTotal ? 1 : 0);
