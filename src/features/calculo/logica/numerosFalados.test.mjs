import test from "node:test";
import assert from "node:assert/strict";
import { lerNumeroFalado } from "./numerosFalados.js";

// [fala, valor esperado, unidade esperada]
const CASOS = [
  ["dois vírgula cinco", 2.5, null],
  ["dois e meio", 2.5, null],
  ["sete e meio mililitros", 7.5, "mL"],
  ["vinte e oito gotas", 28, "gts/min"],
  ["cento e vinte e cinco", 125, null],
  ["0,5", 0.5, null],
  ["0.5", 0.5, null],
  ["meio", 0.5, null],
  ["meia", 0.5, null],
  ["zero vírgula cinco", 0.5, null],
  ["zero vírgula vinte e cinco", 0.25, null],
  ["zero vírgula zero cinco", 0.05, null],
  ["um vírgula cinco mililitros", 1.5, "mL"],
  ["um e meio", 1.5, null],
  ["quarenta e dois gotas por minuto", 42, "gts/min"],
  ["quarenta e dois microgotas", 42, "mcgts/min"],
  ["oito mililitros por hora", 8, "mL/h"],
  ["8 ml/h", 8, "mL/h"],
  ["doze vírgula oito microgramas por minuto", 12.8, "mcg/min"],
  ["12,8 mcg/min", 12.8, "mcg/min"],
  ["quatro ampolas", 4, "ampolas"],
  ["quatro mililitros", 4, "mL"],
  ["4 ml", 4, "mL"],
  ["mil", 1000, null],
  ["mil e duzentos", 1200, null],
  ["dois mil", 2000, null],
  ["1.000", 1000, null],
  ["1.200 mL", 1200, "mL"],
  ["duzentos e cinquenta", 250, null],
  ["noventa e nove", 99, null],
  ["dezesseis", 16, null],
  ["dezenove gotas", 19, "gts/min"],
  ["trezentos e trinta e três", 333, null],
  ["sete ponto cinco", 7.5, null],
  ["133 gotas", 133, "gts/min"],
  ["83", 83, null],
  ["3 e meio", 3.5, null],
  ["acho que são sessenta e sete gotas por minuto", 67, "gts/min"],
  ["cem", 100, null],
  ["um milhão", 1000000, null],
  ["dois milhões", 2000000, null],
  ["zero", 0, null],
];

test("lerNumeroFalado reconhece os casos falados e digitados", () => {
  assert.ok(CASOS.length >= 30);
  for (const [fala, valor, unidade] of CASOS) {
    const r = lerNumeroFalado(fala);
    assert.ok(r, `"${fala}" não foi lido`);
    assert.equal(r.valor, valor, `"${fala}": valor ${r.valor}`);
    assert.equal(r.unidade, unidade, `"${fala}": unidade ${r.unidade}`);
  }
});

test("lerNumeroFalado devolve null quando não há número", () => {
  for (const fala of ["", "   ", "não sei", "pode repetir", null, undefined, 42]) assert.equal(lerNumeroFalado(fala), null, String(fala));
});

test("ruído de ponto flutuante não aparece no valor", () => {
  assert.equal(lerNumeroFalado("zero vírgula trinta e três").valor, 0.33);
  assert.equal(lerNumeroFalado("doze vírgula oito").valor, 12.8);
});
