// Extrai do livro NANDA-I 2024-2026 (docs/referencias/NANDA_2024_2026_13ed.pdf) as características definidoras,
// os fatores relacionados e os fatores de risco de cada diagnóstico, para a busca do registro da Consulta.
//   node scripts/nanda/extrair-indicadores.mjs   (precisa do pdftotext no PATH)
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const pdf = path.join(raiz, "docs/referencias/NANDA_2024_2026_13ed.pdf");
const r = spawnSync("pdftotext", ["-enc", "UTF-8", "-layout", pdf, "-"], { maxBuffer: 1 << 28, encoding: "utf8" });
if (r.status !== 0) throw new Error(r.stderr || "pdftotext falhou");
const linhas = r.stdout.replace(/\r/g, "").split("\n");

const SECOES = {
  "Características definidoras": "cd",
  "Fatores relacionados": "fr",
  "Fatores de risco": "risco",
  "Característica definidora": "cd",
  "Fator relacionado": "fr",
  "Fator de risco": "risco",
};
const FIM = /^(Populações em risco|População em risco|Condições associadas|Condição associada|Este diagnóstico será retirado|Literatura de apoio|Domínio \d+ •|Classe \d+ •|Código do diagnóstico|Problemas associados|Sugestões de uso|Problemas com o diagnóstico)/;

const catalogo = JSON.parse(readFileSync(path.join(raiz, "src/data/nanda_complete_2024_2026.json"), "utf8"));
const validos = new Set(catalogo.map((d) => d.code));
const saida = {};
let codigo = null;
let secao = null;
let atual = null;

const fechar = () => {
  if (atual && codigo && secao) {
    const t = atual.replace(/\s+/g, " ").trim();
    if (t) saida[codigo][secao].push(t);
  }
  atual = null;
};

for (const bruta of linhas) {
  const l = bruta.trim();
  const m = l.match(/^Código do diagnóstico (\d{5})/);
  if (m) {
    fechar();
    codigo = validos.has(m[1]) ? m[1] : null;
    secao = null;
    if (codigo && !saida[codigo]) saida[codigo] = { cd: [], fr: [], risco: [] };
    continue;
  }
  if (!codigo) continue;
  if (SECOES[l]) {
    fechar();
    secao = SECOES[l];
    continue;
  }
  if (FIM.test(l) || /^HERDMAN|^\d+\s*$/.test(l)) {
    fechar();
    if (!/^\d+\s*$/.test(l)) secao = null;
    continue;
  }
  if (!secao) continue;
  if (l.startsWith("•")) {
    fechar();
    atual = l.slice(1);
  } else if (l && atual != null) {
    atual += ` ${l}`; // item quebrado em duas linhas
  } else if (!l) {
    // linha em branco: o item termina, mas a seção continua
    fechar();
  }
}
fechar();

for (const v of Object.values(saida)) for (const k of Object.keys(v)) v[k] = [...new Set(v[k])];
const com = Object.values(saida).filter((v) => v.cd.length || v.fr.length || v.risco.length).length;
writeFileSync(path.join(raiz, "src/data/nanda_indicadores_2024_2026.json"), JSON.stringify(saida));
console.log(`${Object.keys(saida).length} diagnósticos, ${com} com indicadores, de ${validos.size} no catálogo`);
