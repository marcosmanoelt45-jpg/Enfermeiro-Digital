import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { PLANTAO_EXTRAS } from "../../../data/sbarPlantaoDados.js";
import { PISTAS_EXAMES } from "../dados/pistasExames.js";

// Exames de múltipla escolha (sem minijogo): os de ausculta abrem o minijogo de ausculta e ficam de fora.
const exames = Object.entries(PLANTAO_EXTRAS).flatMap(([id, c]) =>
  c.lacunas.filter((l) => l.exame && !/ausculta/i.test(`${l.campo} ${l.rotulo}`)).map((l) => ({ chave: `${id}.${l.campo}`, l }))
);

test("todo exame sem minijogo tem o que olhar", () => {
  const sem = exames.filter(({ chave }) => !PISTAS_EXAMES[chave]).map(({ chave }) => chave);
  assert.deepEqual(sem, []);
  for (const { chave } of exames) {
    const p = PISTAS_EXAMES[chave];
    assert.ok(p.imagem || p.monitor || p.medidas?.length || p.laudo?.length || p.notas?.length, `pista vazia: ${chave}`);
  }
});

test("nenhuma pista sobra sem exame", () => {
  const chaves = new Set(exames.map((e) => e.chave));
  assert.deepEqual(Object.keys(PISTAS_EXAMES).filter((k) => !chaves.has(k)), []);
});

test("as imagens das pistas existem em public/", () => {
  const faltam = Object.values(PISTAS_EXAMES)
    .map((p) => p.imagem)
    .filter(Boolean)
    .filter((src) => !existsSync(new URL(`../../../../public${src}`, import.meta.url)));
  assert.deepEqual(faltam, []);
});
