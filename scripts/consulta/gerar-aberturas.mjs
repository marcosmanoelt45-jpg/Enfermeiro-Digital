// Gera src/data/falas/consulta-abertura-<personagem>.json: 2 falas de abertura por personalidade.
// Rode de novo se mudar os textos abaixo; depois, `node scripts/voicebox/gerar-falas.mjs` gera os mp3.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const PERSONAGENS = [
  { id: "marcus", perfil: "Marcus", feminino: false },
  { id: "teresinha", perfil: "Teresinha", feminino: true },
];

// {o} = o/a, {pre} = preocupado/preocupada.
const ABERTURAS = {
  colaborativo: ["Bom dia… é você que vai me atender?", "Oi, enfermeiro. Pode perguntar o que precisar."],
  ansioso: ["Ai, que bom que você veio! Será que é grave?", "Bom dia… eu tô com um aperto no peito, tô muito {pre}."],
  desconfiado: ["…Oi.", "Quem é você? Vai me atender?"],
  esquecido: ["Ah, bom dia… esqueci o seu nome, me desculpa.", "Hã? Ah, é você que vem falar comigo?"],
  minimizador: ["Bom dia. Foi minha família que insistiu em eu vir, não é nada.", "Ah, eu tô bem, só vim porque mandaram."],
  poliqueixoso: ["Ai, que bom que veio, tenho tanta coisa pra te contar…", "Bom dia! Olha, hoje é a barriga, é o joelho, é a cabeça…"],
  envergonhado: ["Bom dia… desculpa o incômodo.", "Oi… posso falar baixinho?"],
  surpresa: ["Bom dia, enfermeiro.", "Oi… é você que vai me atender?"],
};

for (const p of PERSONAGENS) {
  const falas = [];
  for (const [pers, textos] of Object.entries(ABERTURAS)) {
    textos.forEach((t, i) => falas.push({ id: `consulta.abertura.${pers}.${i + 1}`, texto: t.replace("{pre}", p.feminino ? "preocupada" : "preocupado") }));
  }
  const arquivo = join(raiz, "src", "data", "falas", `consulta-abertura-${p.id}.json`);
  writeFileSync(arquivo, JSON.stringify({ personagem: p.id, perfilVoicebox: p.perfil, falas }, null, 2) + "\n");
  console.log(`${arquivo}: ${falas.length} falas`);
}
