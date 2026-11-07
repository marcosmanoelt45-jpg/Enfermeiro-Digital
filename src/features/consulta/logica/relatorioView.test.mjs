import test from "node:test";
import assert from "node:assert/strict";
import { pontosDaLinha, tomDaNota, frasePontoDeMelhoria, resumoParaHistorico } from "./relatorioView.js";

test("pontosDaLinha: vazio, um ponto e a escala 0–100 de baixo para cima", () => {
  assert.equal(pontosDaLinha([]), "");
  assert.equal(pontosDaLinha(undefined), "");
  assert.equal(pontosDaLinha([50], 100, 100, 0), "50,50");
  const [a, b] = pontosDaLinha([0, 100], 100, 100, 0).split(" ");
  assert.equal(a, "0,100"); // 0 fica embaixo
  assert.equal(b, "100,0"); // 100 fica em cima
});

test("pontosDaLinha: valores fora de 0–100 são limitados e o número de pontos é o da linha", () => {
  const pts = pontosDaLinha([-20, 150, 40, 60], 200, 100, 10).split(" ");
  assert.equal(pts.length, 4);
  assert.equal(pts[0].split(",")[1], "90"); // 0 -> altura - margem
  assert.equal(pts[1].split(",")[1], "10"); // 100 -> margem
});

test("tom da nota", () => {
  assert.equal(tomDaNota(85), "success");
  assert.equal(tomDaNota(70), "success");
  assert.equal(tomDaNota(55), "warning");
  assert.equal(tomDaNota(10), "danger");
  assert.equal(tomDaNota(null), "brand");
});

test("frase do ponto de melhoria só existe com citação válida", () => {
  assert.equal(frasePontoDeMelhoria({ ordem: 4, trecho: "tem dor?" }), "No turno 4 você disse: “tem dor?”");
  assert.equal(frasePontoDeMelhoria({ ordem: null, trecho: "" }), null);
  assert.equal(frasePontoDeMelhoria({ ordem: 2, trecho: "" }), null);
});

test("resumo para o histórico", () => {
  const r = resumoParaHistorico({ briefing: { nome: "Antônio Pereira", idade: 71 }, tema: "Coração", personalidadePublica: "surpresa" });
  assert.equal(r.title, "Antônio Pereira · Coração");
  assert.equal(r.patientInfo, "Antônio Pereira, 71 anos · Surpresa");
  assert.equal(resumoParaHistorico({ briefing: { nome: "A", idade: 1 }, tema: null, personalidadePublica: "x" }).title, "A");
});
