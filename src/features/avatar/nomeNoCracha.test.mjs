import { test } from "node:test";
import assert from "node:assert/strict";
import { ajustarTexto, primeiroNome } from "./nomeNoCracha.js";

test("primeiroNome pega só o primeiro nome, arrumado", () => {
  assert.equal(primeiroNome("maria clara souza"), "Maria");
  assert.equal(primeiroNome("  JOÃO   Pedro "), "João");
  assert.equal(primeiroNome("ana.paula@exemplo.com"), "Ana");
  assert.equal(primeiroNome("D'Ávila Costa"), "D'ávila");
  assert.equal(primeiroNome("Shika"), "Shika");
});

test("primeiroNome limita o tamanho e ignora lixo", () => {
  assert.equal(primeiroNome("Maximilianoooo"), "Maximilia.");
  assert.equal(primeiroNome("123 !!!"), "");
  assert.equal(primeiroNome(""), "");
  assert.equal(primeiroNome(null), "");
});

test("ajustarTexto diminui a letra e, se precisar, abrevia", () => {
  const medir = (t, tam) => [...t].length * tam * 0.6;
  const curto = ajustarTexto("Ana", 40, 20, medir);
  assert.equal(curto.texto, "Ana");
  assert.ok(curto.tamanho > 15);
  const medio = ajustarTexto("Gabriela", 60, 20, medir);
  assert.equal(medio.texto, "Gabriela");
  assert.ok(medio.tamanho < 16.4 && medio.tamanho >= 11);
  const longo = ajustarTexto("Maximilia.", 40, 20, medir);
  assert.ok(longo.texto.endsWith("."));
  assert.ok(medir(longo.texto, longo.tamanho) <= 40);
});
