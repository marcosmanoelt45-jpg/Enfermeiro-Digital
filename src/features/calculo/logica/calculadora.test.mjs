import { test } from "node:test";
import assert from "node:assert/strict";
import { bombaInfusao, diluicao, dosePorPeso, doseVolume, gotejamento, num } from "./calculadora.js";

test("num aceita vírgula e ponto", () => {
  assert.equal(num("2,5"), 2.5);
  assert.equal(num("1.000"), 1000);
  assert.ok(Number.isNaN(num("abc")));
});

test("gotejamento: macro em horas e em minutos, micro", () => {
  assert.equal(gotejamento({ volume: 1000, tempo: 8 }).resultado, 42); // 41,67
  assert.equal(gotejamento({ volume: 100, tempo: 30, unidadeTempo: "min" }).resultado, 67); // 66,67
  assert.equal(gotejamento({ volume: 500, tempo: 12, equipo: "micro" }).resultado, 42);
  assert.equal(gotejamento({ volume: 0, tempo: 8 }).ok, false);
});

test("regra de três, dose por peso e diluição", () => {
  assert.equal(doseVolume({ prescrito: 150, disponivel: 500, volumeDisponivel: 5 }).resultado, 1.5);
  const p = dosePorPeso({ dosePorKg: 50, peso: 12, vezesAoDia: 3 });
  assert.equal(p.resultado, 600);
  assert.match(p.extra, /200/);
  // penicilina 5.000.000 UI, 8 mL de diluente + 2 mL do pó, dose 2.000.000 -> 4 mL
  assert.equal(diluicao({ quantidadeFrasco: 5000000, diluente: 8, volumePo: 2, prescrito: 2000000 }).resultado, 4);
});

test("bomba de infusão: heparina por hora e noradrenalina em mcg/min com mg no frasco", () => {
  assert.equal(bombaInfusao({ dose: 800, quantidade: 25000, volumeSolucao: 250 }).resultado, 8);
  // 10 mcg/min de nitroglicerina, 50 mg em 250 mL -> 3 mL/h
  assert.equal(bombaInfusao({ dose: 10, porMinuto: true, quantidade: 50, volumeSolucao: 250, doseEmMcg: true, quantidadeEmMg: true }).resultado, 3);
  // por kg: 0,5 mcg/kg/min, 60 kg, 200 mcg/mL (20 mg em 100 mL) -> 9 mL/h
  assert.equal(bombaInfusao({ dose: 0.5, porKg: true, peso: 60, porMinuto: true, quantidade: 20, volumeSolucao: 100, doseEmMcg: true, quantidadeEmMg: true }).resultado, 9);
});
