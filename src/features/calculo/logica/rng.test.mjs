import test from "node:test";
import assert from "node:assert/strict";
import { mulberry32 } from "./rng.js";
import {
  generateProceduralDosageProblem, generateMacrogotasHoras, generateMicrogotasHoras, generateMacrogotasMinutos,
  generateBicInfusion, generatePenicilinaCristalina, generatePediatricRedilution,
} from "../../../services/proceduralDosageGenerator.js";

// O id usa Date.now(); o resto da saída precisa ser idêntico com a mesma semente.
const semId = (p) => ({ ...p, id: undefined });
const GERADORES = [generateMacrogotasHoras, generateMicrogotasHoras, generateMacrogotasMinutos, generateBicInfusion, generatePenicilinaCristalina, generatePediatricRedilution];

test("mulberry32: mesma semente, mesma sequência; sementes diferentes divergem", () => {
  const a = mulberry32(7), b = mulberry32(7), c = mulberry32(8);
  const sa = Array.from({ length: 20 }, a), sb = Array.from({ length: 20 }, b), sc = Array.from({ length: 20 }, c);
  assert.deepEqual(sa, sb);
  assert.notDeepEqual(sa, sc);
  assert.ok(sa.every((x) => x >= 0 && x < 1));
});

test("cada gerador é reproduzível com a mesma semente", () => {
  for (const gerar of GERADORES) {
    for (const semente of [1, 2, 3, 42]) {
      assert.deepEqual(semId(gerar(mulberry32(semente))), semId(gerar(mulberry32(semente))), `${gerar.name} semente ${semente}`);
    }
  }
});

test("gerador misto também é reproduzível", () => {
  for (let s = 1; s <= 30; s++) {
    assert.deepEqual(semId(generateProceduralDosageProblem(mulberry32(s))), semId(generateProceduralDosageProblem(mulberry32(s))));
  }
});

test("sem semente continua funcionando (100 chamadas)", () => {
  for (let i = 0; i < 100; i++) {
    const p = generateProceduralDosageProblem();
    assert.ok(p.answer && p.options.length === 4 && p.prescricao && p.tipo && p.disponivel);
    assert.equal(p.options.filter((o) => o.isCorrect).length, 1);
  }
});
