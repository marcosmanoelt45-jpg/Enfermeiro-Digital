import test from "node:test";
import assert from "node:assert/strict";
import { sortearItens } from "./sorteio.js";

const def = {
  tipo: "arrastar",
  arrastar: {
    sorteio: { distratores: 2 },
    alvos: [{ id: "b" }],
    itens: [
      { id: "c1", alvoCorreto: "b" },
      { id: "c2", alvoCorreto: "b" },
      { id: "d1", alvoCorreto: null },
      { id: "d2", alvoCorreto: null },
      { id: "d3", alvoCorreto: null },
      { id: "d4", alvoCorreto: null },
    ],
  },
};

const rngDe = (semente) => {
  let s = semente;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
};

test("sorteio: todos os corretos e só N distratores", () => {
  const r = sortearItens(def, rngDe(1));
  const ids = r.arrastar.itens.map((i) => i.id);
  assert.ok(ids.includes("c1") && ids.includes("c2"));
  assert.equal(ids.filter((id) => id.startsWith("d")).length, 2);
  assert.equal(def.arrastar.itens.length, 6, "não altera a definição original");
});

test("sorteio: rodadas diferentes trazem distratores diferentes", () => {
  const vistos = new Set();
  for (let s = 1; s < 30; s++) sortearItens(def, rngDe(s)).arrastar.itens.forEach((i) => vistos.add(i.id));
  assert.equal(vistos.size, 6);
});

test("sem sorteio, devolve a mesma definição", () => {
  const semSorteio = { ...def, arrastar: { ...def.arrastar, sorteio: undefined } };
  assert.equal(sortearItens(semSorteio), semSorteio);
  assert.equal(sortearItens({ tipo: "ordenar" }).tipo, "ordenar");
});
