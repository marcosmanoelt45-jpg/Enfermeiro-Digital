import { test } from "node:test";
import assert from "node:assert/strict";
import { MODELO_SBAR, MODELO_SOAP, anotarNoObjetivo, semModeloVazio, soModelo } from "./modelosAnotacao.js";

test("modelo intocado não conta como anotação", () => {
  assert.equal(soModelo(MODELO_SOAP, MODELO_SOAP), true);
  assert.equal(soModelo(`${MODELO_SOAP}  \n`, MODELO_SOAP), true);
  assert.equal(semModeloVazio(MODELO_SBAR, MODELO_SBAR), "");
});

test("anotar exame entra na linha do Objetivo", () => {
  const um = anotarNoObjetivo(MODELO_SOAP, "Glicemia capilar: 112 mg/dL");
  assert.match(um, /^O \(Objetivo\): Glicemia capilar: 112 mg\/dL$/m);
  const dois = anotarNoObjetivo(um, "PA: 130/80 mmHg");
  assert.match(dois, /^O \(Objetivo\): Glicemia capilar: 112 mg\/dL; PA: 130\/80 mmHg$/m);
  assert.match(dois, /^P \(Plano\): $/m);
  assert.equal(anotarNoObjetivo("", "X: 1"), "X: 1");
  assert.equal(anotarNoObjetivo("livre", "X: 1"), "livre\nX: 1");
});

test("com algo escrito, o texto vai inteiro", () => {
  const t = MODELO_SOAP.replace("S (Subjetivo): ", "S (Subjetivo): dor no peito há 2 h");
  assert.equal(soModelo(t, MODELO_SOAP), false);
  assert.equal(semModeloVazio(t, MODELO_SOAP), t);
});
