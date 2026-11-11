import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_SEM_SALTO, novoSorteio, sortearSalto } from "./sorteioSalto.js";

test("sem sorte, não pula; depois de 3 acertos sem pulo, pula com certeza", () => {
  let e = novoSorteio();
  for (let i = 0; i < MAX_SEM_SALTO; i++) {
    const r = sortearSalto(e, () => 0.99);
    assert.equal(r.salto, null);
    e = r.estado;
  }
  const r = sortearSalto(e, () => 0.99);
  assert.ok(r.salto);
  assert.equal(r.estado.semSalto, 0);
});

test("com sorte, pula; e costuma trocar de variação", () => {
  const r1 = sortearSalto(novoSorteio(), () => 0);
  assert.equal(r1.salto, "giro-punho");
  const r2 = sortearSalto(r1.estado, () => (r2Chamadas++ === 0 ? 0 : 0.9));
  assert.equal(r2.salto, "giro");
});
let r2Chamadas = 0;

test("não altera o estado recebido", () => {
  const e = novoSorteio();
  sortearSalto(e, () => 0.99);
  assert.deepEqual(e, novoSorteio());
});
