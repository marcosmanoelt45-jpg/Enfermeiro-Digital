// Gera supabase/functions/_shared/dados/{arquetipos,temas,nanda-codigos}.js a partir de
// src/data/randomClinicalScenarios.js e src/lib/nandaCatalog.js. Rode de novo quando os arquétipos mudarem:
//   node scripts/consulta/exportar-arquetipos.mjs
// O teste `exportar-arquetipos.test.mjs` confere que o arquivo gerado bate com a fonte.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const destino = join(raiz, "supabase", "functions", "_shared", "dados");

// O catálogo NANDA importa um JSON sem atributo de tipo, que o Node recusa: carrega com o JSON lido à mão.
async function carregarCatalogo() {
  const fonte = readFileSync(join(raiz, "src", "lib", "nandaCatalog.js"), "utf8");
  const json = JSON.parse(readFileSync(join(raiz, "src", "data", "nanda_complete_2024_2026.json"), "utf8"));
  const ajustada = fonte.replace(/^import nandaComplete from .*$/m, `const nandaComplete = ${JSON.stringify(json)};`);
  if (ajustada === fonte) throw new Error("Não achei o import do JSON em nandaCatalog.js.");
  const pasta = join(tmpdir(), "enfere-export");
  mkdirSync(pasta, { recursive: true });
  const arquivo = join(pasta, `nandaCatalog-${Date.now()}.mjs`);
  writeFileSync(arquivo, ajustada);
  return import(pathToFileURL(arquivo).href);
}

const { CLINICAL_ARCHETYPES } = await import(pathToFileURL(join(raiz, "src", "data", "randomClinicalScenarios.js")).href);
const { NANDA_CATALOG, NANDA_COMPLETE_CATALOG } = await carregarCatalogo();

const sem = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const PALAVRAS_FRACAS = new Set(["de", "da", "do", "com", "para", "por", "em", "aguda", "agudo", "risco", "paciente", "dor", "uma", "que", "nao", "ou", "ao", "na", "no"]);
const palavras = (s) => new Set(sem(s).split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !PALAVRAS_FRACAS.has(w)));

// Candidatos NANDA: primeiro o catálogo curado (mais palavras em comum com o caso); se sobrarem menos de 6,
// completa com o catálogo completo, só pelo título.
function candidatosNanda(a) {
  const alvo = palavras(`${a.disease} ${a.anamnesis} ${a.notes}`);
  const pontuar = (d, extra) => {
    const base = palavras(`${d.title} ${extra}`);
    let pontos = 0;
    for (const w of base) if (alvo.has(w)) pontos++;
    return { codigo: d.code, nome: d.title, pontos };
  };
  const ordenar = (lista) => lista.filter((d) => d.pontos > 0).sort((x, y) => y.pontos - x.pontos || x.codigo.localeCompare(y.codigo));
  const curados = ordenar(NANDA_CATALOG.map((d) => pontuar(d, `${(d.defining_characteristics ?? []).join(" ")} ${(d.related_factors ?? []).join(" ")}`)));
  const resultado = curados.slice(0, 12);
  if (resultado.length < 6) {
    const ja = new Set(resultado.map((d) => d.codigo));
    const extras = ordenar(NANDA_COMPLETE_CATALOG.map((d) => pontuar(d, ""))).filter((d) => !ja.has(d.codigo));
    resultado.push(...extras.slice(0, 6 - resultado.length));
  }
  // Garantia: sempre sobram pelo menos 4 candidatos (a IA escolhe 2 a 4). Completa com diagnósticos gerais do catálogo curado.
  const GERAIS = ["00132", "00030", "00155", "00201"];
  for (const c of GERAIS) {
    if (resultado.length >= 4) break;
    const d = NANDA_CATALOG.find((x) => x.code === c);
    if (d && !resultado.some((r) => r.codigo === c)) resultado.push({ codigo: d.code, nome: d.title });
  }
  // Diagnósticos fixos do caso (campo `nanda`, códigos da NANDA-I 2024-2026): quando há 4 ou mais, são os únicos
  // candidatos. A busca por palavras sozinha sugeria coisas sem relação (no infarto, hipertermia e incontinência).
  const fixos = (a.nanda ?? []).map((c) => NANDA_COMPLETE_CATALOG.find((d) => d.code === c)).filter(Boolean).map((d) => ({ codigo: d.code, nome: d.title }));
  if (fixos.length >= 4) return fixos;
  return resultado.map(({ codigo, nome }) => ({ codigo, nome }));
}

const arquetipos = CLINICAL_ARCHETYPES.map((a) => ({
  id: a.id,
  specialty: a.specialty,
  disease: a.disease,
  anamnesis: a.anamnesis,
  medicalHistory: a.medicalHistory,
  medications: a.medications,
  allergies: a.allergies,
  notes: a.notes,
  ageRange: a.ageRange,
  preferredGender: a.preferredGender ?? null,
  vitals: a.vitals,
  nandaCandidatos: candidatosNanda(a),
}));

const ROTULOS = {
  cardiovascular: "Coração e circulação",
  respiratorio: "Respiração",
  neurologia: "Cérebro e nervos",
  sepse: "Infecção grave",
  metabolico_endocrino: "Diabetes e metabolismo",
  cirurgico_abdome: "Abdome cirúrgico",
  nefrologia: "Rins",
  obstetricia: "Gestação",
  trauma: "Trauma e queimaduras",
};
const porEspecialidade = {};
for (const a of arquetipos) (porEspecialidade[a.specialty] ??= []).push(a.id);
const temas = Object.entries(porEspecialidade).map(([id, ids]) => ({ id, rotulo: ROTULOS[id] ?? id, arquetipos: ids }));

const codigos = [...new Set([...NANDA_CATALOG.map((d) => d.code), ...NANDA_COMPLETE_CATALOG.map((d) => d.code)])].sort();

const cabecalho = (t) => `// GERADO por scripts/consulta/exportar-arquetipos.mjs. Não edite à mão.\n// ${t}\n`;
mkdirSync(destino, { recursive: true });
writeFileSync(join(destino, "arquetipos.js"), `${cabecalho("Arquétipos clínicos enxutos (só os campos usados na ficha), com candidatos NANDA.")}export const ARQUETIPOS = ${JSON.stringify(arquetipos, null, 2)};\n\nexport const buscarArquetipo = (id) => ARQUETIPOS.find((a) => a.id === id) ?? null;\n`);
writeFileSync(join(destino, "temas.js"), `${cabecalho("Temas de consulta: agrupam os arquétipos por especialidade.")}export const TEMAS = ${JSON.stringify(temas, null, 2)};\n\nexport const buscarTema = (id) => TEMAS.find((t) => t.id === id) ?? null;\n`);
writeFileSync(join(destino, "nanda-codigos.js"), `${cabecalho("Códigos NANDA-I válidos, para o servidor validar sem carregar o catálogo inteiro.")}export const CODIGOS_NANDA = new Set(${JSON.stringify(codigos)});\n`);

console.log(`${arquetipos.length} arquétipos, ${temas.length} temas, ${codigos.length} códigos NANDA.`);
for (const a of arquetipos) console.log(`  ${a.id}: ${a.nandaCandidatos.length} candidatos`);
