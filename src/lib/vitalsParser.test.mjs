import test from "node:test";
import assert from "node:assert/strict";
import { parseVitalsFromTranscript } from "./vitalsParser.js";
import { extensoParaDigitos } from "./numerosPorExtenso.js";

// [fala, campos esperados]
const CASOS = [
  // pressão arterial
  ["PA 120 por 80", { pa_sistolica: 120, pa_diastolica: 80 }],
  ["pressão arterial 130/90", { pa_sistolica: 130, pa_diastolica: 90 }],
  ["PA doze por oito", { pa_sistolica: 120, pa_diastolica: 80 }],
  ["pressão cento e trinta por noventa", { pa_sistolica: 130, pa_diastolica: 90 }],
  ["12x8", { pa_sistolica: 120, pa_diastolica: 80 }],
  ["PA 12 por 8", { pa_sistolica: 120, pa_diastolica: 80 }],
  ["pressão 14 por 9", { pa_sistolica: 140, pa_diastolica: 90 }],
  ["PA cento e vinte por oitenta", { pa_sistolica: 120, pa_diastolica: 80 }],
  ["pressao 90x60", { pa_sistolica: 90, pa_diastolica: 60 }],
  ["PA 160 x 100", { pa_sistolica: 160, pa_diastolica: 100 }],
  ["PA de 100 por 60 mmHg", { pa_sistolica: 100, pa_diastolica: 60 }],
  ["pressão doze e oito", { pa_sistolica: 120, pa_diastolica: 80 }],
  // frequência cardíaca
  ["FC 98", { fc: 98 }],
  ["frequência cardíaca de noventa e oito", { fc: 98 }],
  ["pulso 98", { fc: 98 }],
  ["FC noventa e oito bpm", { fc: 98 }],
  ["88 bpm", { fc: 88 }],
  ["batimentos 72", { fc: 72 }],
  ["FC120", { fc: 120 }],
  // saturação
  ["saturando 92", { sat: 92 }],
  ["sat 92% em ar ambiente", { sat: 92 }],
  ["SpO2 de 89 com cateter a 2 litros", { sat: 89 }],
  ["saturação de noventa e cinco por cento", { sat: 95 }],
  ["SatO2 98", { sat: 98 }],
  ["sat 90 com O2 a 3 litros", { sat: 90 }],
  // frequência respiratória
  ["FR 24", { fr: 24 }],
  ["respirando 24 por minuto", { fr: 24 }],
  ["frequência respiratória vinte", { fr: 20 }],
  ["FR 18 irpm", { fr: 18 }],
  ["22 irpm", { fr: 22 }],
  // temperatura
  ["temperatura 38 e meio", { tax: 38.5 }],
  ["Tax 37,8", { tax: 37.8 }],
  ["temperatura trinta e seis vírgula cinco", { tax: 36.5 }],
  ["TAX 36.5", { tax: 36.5 }],
  ["temperatura trinta e oito", { tax: 38 }],
  ["temperatura trinta e oito e meio", { tax: 38.5 }],
  // dor
  ["dor 6 de 10", { caloi_pain_intensity: 6 }],
  ["EVA 6", { caloi_pain_intensity: 6 }],
  ["dor seis", { caloi_pain_intensity: 6 }],
  ["sem dor", { caloi_pain_intensity: 0 }],
  ["dor torácica 7", { caloi_pain_intensity: 7 }],
  // glicemia
  ["HGT 110", { hgt: 110 }],
  ["glicemia capilar cento e oitenta", { hgt: 180 }],
  // frases completas
  ["PA 130 por 80, FC 92, FR 20, sat 96%, Tax 36,8", { pa_sistolica: 130, pa_diastolica: 80, fc: 92, fr: 20, sat: 96, tax: 36.8 }],
  ["pressão doze por oito, frequência cardíaca setenta e dois, saturando noventa e sete", { pa_sistolica: 120, pa_diastolica: 80, fc: 72, sat: 97 }],
  ["paciente com 65 anos, PA 12 por 7, FC 88, dor 3 de 10", { age: 65, pa_sistolica: 120, pa_diastolica: 70, fc: 88, caloi_pain_intensity: 3 }],
];

test("parseVitalsFromTranscript lê as falas reais de sinais vitais", () => {
  assert.ok(CASOS.length >= 40, `só ${CASOS.length} casos`);
  for (const [fala, esperado] of CASOS) {
    const v = parseVitalsFromTranscript(fala);
    for (const [campo, valor] of Object.entries(esperado)) assert.equal(v[campo], valor, `"${fala}": ${campo} = ${v[campo]}`);
  }
});

const CAMPOS_VITAIS = ["pa_sistolica", "pa_diastolica", "fc", "fr", "sat", "tax", "hgt", "caloi_pain_intensity", "glasgow", "age"];

test("palavras parecidas com siglas não geram valores", () => {
  for (const fala of ["paciente", "palpação", "administrado", "pacientes estáveis", "saturado de trabalho", "respirando bem, sem queixas", "tem um comprimido por dia", "2 por 8 horas", "dieta 1 por 1"]) {
    const v = parseVitalsFromTranscript(fala);
    for (const c of CAMPOS_VITAIS) assert.equal(v[c], undefined, `"${fala}" gerou ${c} = ${v[c]}`);
  }
});

test("dor com duração não vira intensidade", () => {
  assert.equal(parseVitalsFromTranscript("dor há 3 dias").caloi_pain_intensity, undefined);
});

test("texto vazio ou inválido devolve objeto vazio", () => {
  for (const x of ["", "   ", null, undefined]) assert.deepEqual(parseVitalsFromTranscript(x), {});
});

test("extensoParaDigitos troca só números por extenso e preserva o resto", () => {
  assert.equal(extensoParaDigitos("pressão doze por oito"), "pressão 12 por 8");
  assert.equal(extensoParaDigitos("cento e vinte e cinco"), "125");
  assert.equal(extensoParaDigitos("mil e duzentos"), "1200");
  assert.equal(extensoParaDigitos("doze e oito"), "12 e 8");
  assert.equal(extensoParaDigitos("trinta e oito e meio"), "38.5");
  assert.equal(extensoParaDigitos("um paciente com uma queixa"), "um paciente com uma queixa");
  assert.equal(extensoParaDigitos("trinta e seis vírgula cinco graus"), "36.5 graus");
  assert.equal(extensoParaDigitos("sem números aqui"), "sem números aqui");
});
