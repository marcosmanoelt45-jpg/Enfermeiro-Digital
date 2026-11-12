import { test } from "node:test";
import assert from "node:assert/strict";
import { estadoDoPar, proximaMeta, bateuMeta, iniciais, METAS_AMIGOS } from "./ofensivaAmigos.js";

test("o foguinho da dupla só acende quando os dois estudam", () => {
  assert.equal(estadoDoPar({ euFiz: true, amigoFez: true }), "acesa");
  assert.equal(estadoDoPar({ euFiz: true, amigoFez: false }), "falta_amigo");
  assert.equal(estadoDoPar({ euFiz: false, amigoFez: true }), "falta_voce");
  assert.equal(estadoDoPar({ euFiz: false, amigoFez: false }), "apagada");
});

test("metas em ordem e a próxima meta", () => {
  assert.deepEqual(METAS_AMIGOS.map((m) => m.dias), [7, 14, 30, 50]);
  assert.equal(proximaMeta(0).dias, 7);
  assert.equal(proximaMeta(7).dias, 14);
  assert.equal(proximaMeta(49).dias, 50);
  assert.equal(proximaMeta(80).dias, 50);
  assert.ok(bateuMeta(30));
  assert.ok(!bateuMeta(31));
});

test("iniciais do avatar", () => {
  assert.equal(iniciais("Ana Lúcia Souza"), "AS");
  assert.equal(iniciais("diego"), "D");
  assert.equal(iniciais(""), "?");
});
