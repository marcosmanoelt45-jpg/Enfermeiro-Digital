import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { escolherAbertura } from "./escolherAbertura.js";

const ler = (p) => JSON.parse(readFileSync(new URL(`../../../data/falas/consulta-abertura-${p}.json`, import.meta.url), "utf8"));
const fontes = { marcus: ler("marcus"), teresinha: ler("teresinha") };
const PERSONALIDADES = ["colaborativo", "ansioso", "desconfiado", "esquecido", "minimizador", "poliqueixoso", "envergonhado", "surpresa"];

test("toda personalidade tem 2 aberturas para cada personagem, com ids únicos", () => {
  for (const [p, g] of Object.entries(fontes)) {
    assert.equal(g.personagem, p);
    assert.equal(new Set(g.falas.map((f) => f.id)).size, g.falas.length);
    for (const pers of PERSONALIDADES) assert.equal(g.falas.filter((f) => f.id.startsWith(`consulta.abertura.${pers}.`)).length, 2, `${p}/${pers}`);
  }
});

test("a abertura é uma fala fixa da personalidade e a mesma semente dá a mesma variação", () => {
  const a = escolherAbertura("marcus", "desconfiado", 0, fontes);
  assert.equal(a.length, 1);
  assert.equal(a[0].origem, "fixa");
  assert.match(a[0].id, /^consulta\.abertura\.desconfiado\.[12]$/);
  assert.deepEqual(escolherAbertura("marcus", "desconfiado", "sessao-x", fontes), escolherAbertura("marcus", "desconfiado", "sessao-x", fontes));
  assert.notEqual(escolherAbertura("marcus", "desconfiado", 0, fontes)[0].id, escolherAbertura("marcus", "desconfiado", 1, fontes)[0].id);
});

test("personalidade desconhecida cai na abertura neutra; personagem sem arquivo não tem abertura", () => {
  assert.match(escolherAbertura("teresinha", "inexistente", 0, fontes)[0].id, /surpresa/);
  assert.deepEqual(escolherAbertura("medico-rui", "desconfiado", 0, fontes), []);
});

test("a abertura da personagem feminina concorda no gênero", () => {
  const ansioso = fontes.teresinha.falas.find((f) => f.id === "consulta.abertura.ansioso.2").texto;
  assert.match(ansioso, /preocupada/);
  assert.match(fontes.marcus.falas.find((f) => f.id === "consulta.abertura.ansioso.2").texto, /preocupado\./);
});
