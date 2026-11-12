import { test } from "node:test";
import assert from "node:assert/strict";
import { faixaPorIdade, linhasSinaisVitais } from "./sinaisVitais.js";

test("faixa por idade", () => {
  assert.equal(faixaPorIdade(0, 7), "lactente");
  assert.equal(faixaPorIdade(6), "crianca");
  assert.equal(faixaPorIdade(45), "adulto");
});

test("marca o que está fora da faixa do adulto", () => {
  const l = linhasSinaisVitais({ pa_sistolica: 88, pa_diastolica: 50, fc: 118, fr: 24, sat: 91, tax: 38.4 }, 70);
  const estado = Object.fromEntries(l.map(([r, , , e]) => [r, e]));
  assert.deepEqual(estado, { PA: "baixo", FC: "alto", FR: "alto", "SatO₂": "baixo", Tax: "alto" });
  assert.equal(l[4][1], "38,4 °C");
});

test("lactente: FC 140 é normal", () => {
  const l = linhasSinaisVitais({ pa_sistolica: 90, pa_diastolica: 55, fc: 140, fr: 40, sat: 97, tax: 36.8 }, 0, 7);
  assert.ok(l.every(([, , , e]) => e === null));
});

test("sem sinais vitais, sem linhas", () => {
  assert.deepEqual(linhasSinaisVitais(null, 30), []);
});
