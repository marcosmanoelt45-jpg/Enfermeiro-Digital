import test from "node:test";
import assert from "node:assert/strict";
import { getDosageProblems } from "./dosageProblems.js";
import {
  generateBicInfusion,
  generateMacrogotasHoras,
  generateMacrogotasMinutos,
  generateMicrogotasHoras,
  generatePediatricRedilution,
  generatePenicilinaCristalina,
  generateProceduralDosageProblem,
} from "../services/proceduralDosageGenerator.js";

// Unidades que a tela do Cálculo pode mostrar ao lado da resposta. "gotas/min" não está na lista de propósito:
// a unidade vem sempre do problema (dosage-1) e nunca de um padrão fixo.
const UNIDADES = ["gts/min", "mcgts/min", "mL/h", "mL", "mcg/min", "ampolas", "UI"];

const numero = (valor) => Number(String(valor).replace(",", "."));
const finitoEPositivo = (valor) => Number.isFinite(numero(valor)) && numero(valor) > 0;

const GERADORES = {
  generateMacrogotasHoras,
  generateMicrogotasHoras,
  generateMacrogotasMinutos,
  generateBicInfusion,
  generatePenicilinaCristalina,
  generatePediatricRedilution,
};

test("todo problema fixo tem unidade permitida e resultado finito e positivo", () => {
  const problemas = getDosageProblems();
  assert.equal(problemas.length, 20);
  for (const p of problemas) {
    assert.ok(UNIDADES.includes(p.answerUnit), `${p.id}: unidade inválida (${p.answerUnit})`);
    assert.ok(finitoEPositivo(p.correctResult), `${p.id}: resultado inválido (${p.correctResult})`);
  }
});

test("os problemas citados na auditoria mostram a unidade certa", () => {
  const porId = Object.fromEntries(getDosageProblems().map((p) => [p.id, p]));
  assert.equal(porId.prob_5.answerUnit, "mL/h"); // heparina
  assert.equal(porId.prob_7.answerUnit, "mcg/min"); // noradrenalina
  assert.equal(porId.prob_19.answerUnit, "ampolas"); // fenitoína
});

for (const [nome, gerar] of Object.entries(GERADORES)) {
  test(`${nome}: 200 sorteios com unidade permitida e resultado finito e positivo`, () => {
    for (let i = 0; i < 200; i++) {
      const p = gerar();
      assert.ok(UNIDADES.includes(p.answerUnit), `unidade inválida (${p.answerUnit})`);
      assert.ok(finitoEPositivo(p.correctResult), `resultado inválido (${p.correctResult})`);
    }
  });
}

test("o sorteador geral também devolve unidade permitida", () => {
  for (let i = 0; i < 200; i++) {
    const p = generateProceduralDosageProblem();
    assert.ok(UNIDADES.includes(p.answerUnit), `unidade inválida (${p.answerUnit})`);
  }
});
