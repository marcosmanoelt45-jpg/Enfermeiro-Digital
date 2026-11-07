// Roda os testes do projeto com o `node:test`, sem dependências.
// Procura `*.test.mjs` só nas pastas abaixo. Não usa `node --test` puro porque a descoberta
// automática pegaria `scripts/test-*.js`, que são scripts antigos (alguns com Puppeteer) e quebrariam.
import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const pastas = ["src/features", "src/data", "src/lib", "src/services", "supabase/functions/_shared", "supabase/functions/cena-ia", "scripts/voicebox", "scripts/ia"];

function procurar(dir, achados) {
  if (!existsSync(dir)) return;
  for (const nome of readdirSync(dir)) {
    if (nome === "node_modules") continue;
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) procurar(caminho, achados);
    else if (nome.endsWith(".test.mjs")) achados.push(caminho);
  }
}

const arquivos = [];
for (const pasta of pastas) procurar(join(raiz, pasta), arquivos);
arquivos.sort();

if (arquivos.length === 0) {
  console.warn(`Nenhum arquivo *.test.mjs encontrado em: ${pastas.join(", ")}`);
  process.exit(0);
}

const resultado = spawnSync(process.execPath, ["--test", ...arquivos], { stdio: "inherit", cwd: raiz });
process.exit(resultado.status ?? 1);
