import test from "node:test";
import assert from "node:assert/strict";
import { detectarExame, ROTULO_EXAME } from "./exames.js";

test("reconhece pedidos de exame do jeito que o aluno fala", () => {
  const casos = [
    ["Vou tirar sua pressão, tá bom?", "medir-pa"],
    ["Posso medir sua pressão?", "medir-pa"],
    ["Deixa eu escutar seu pulmão", "ausculta-pulmonar"],
    ["Agora vou auscultar seu coração", "ausculta-cardiaca"],
    ["Pode fazer um teste de glicemia?", "glicemia-capilar"],
    ["Vamos ver sua glicemia, vou furar seu dedo", "glicemia-capilar"],
    ["Posso apalpar sua barriga?", "palpacao-abdominal"],
    ["Vou colocar o oxímetro no seu dedo", "oximetria"],
    ["Vamos medir sua saturação", "oximetria"],
    ["Me deixa ver sua temperatura", "medir-temperatura"],
    ["Vou contar seu pulso agora", "contar-pulso"],
    ["Posso ver se as pernas estão inchadas?", "avaliar-edema"],
    ["AGORA VOU MEDIR A PRESSAO", "medir-pa"],
    // jeitos de pedir que antes não disparavam
    ["Posso verificar seu pulmão?", "ausculta-pulmonar"],
    ["Posso examinar seu coração?", "ausculta-cardiaca"],
    ["Posso verificar seus pés?", "avaliar-edema"],
    ["Posso verificar seu eletrocardiograma?", "ecg"],
    ["Vou fazer um ECG no senhor", "ecg"],
    ["Posso examinar seus olhos?", "avaliar-pupilas"],
  ];
  for (const [frase, id] of casos) assert.equal(detectarExame(frase), id, frase);
});

test("perguntas da anamnese não viram pedido de exame", () => {
  for (const frase of ["Você tem febre?", "Sua pressão costuma ser alta?", "Você costuma medir a pressão em casa?", "Tem diabetes na família?", "Como está a dor?", ""]) {
    assert.equal(detectarExame(frase), null, frase);
  }
});

test("todo id reconhecido tem rótulo", () => {
  for (const frase of ["vou medir sua glicemia", "posso auscultar seu abdome", "vou avaliar suas pupilas"]) {
    const id = detectarExame(frase);
    assert.ok(id && ROTULO_EXAME[id], frase);
  }
});
