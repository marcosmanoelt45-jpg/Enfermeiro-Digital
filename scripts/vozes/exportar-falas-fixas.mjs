// Exporta as falas fixas (src/data/falas/*.json) para a função `voz`, que gera a versão Gemini de cada uma
// aos poucos (cota grátis do dia) e guarda no Storage. Ordem = prioridade: pacientes da consulta primeiro.
// Uso: node scripts/vozes/exportar-falas-fixas.mjs   (rodar de novo sempre que mudar uma fala fixa)
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const pasta = join(raiz, "src", "data", "falas");
const PRIORIDADE = ["marcus", "teresinha", "enfermeira-ana", "medico-rui"];

const lista = [];
const vistos = new Set();
for (const nome of readdirSync(pasta).filter((n) => n.endsWith(".json") && n !== "dev.json")) {
  const dados = JSON.parse(readFileSync(join(pasta, nome), "utf8"));
  if (!dados?.personagem || !Array.isArray(dados.falas)) continue;
  for (const f of dados.falas) {
    const texto = String(f.texto ?? "").trim();
    const chave = `${dados.personagem}|${texto}`;
    if (!texto || texto.length > 400 || vistos.has(chave)) continue;
    vistos.add(chave);
    lista.push({ p: dados.personagem, t: texto });
  }
}
const ordem = (p) => (PRIORIDADE.includes(p) ? PRIORIDADE.indexOf(p) : PRIORIDADE.length);
lista.sort((a, b) => ordem(a.p) - ordem(b.p));

const destino = join(raiz, "supabase", "functions", "_shared", "falasFixas.json");
writeFileSync(destino, `${JSON.stringify(lista)}\n`);
console.log(`${lista.length} falas fixas exportadas para ${destino}`);
