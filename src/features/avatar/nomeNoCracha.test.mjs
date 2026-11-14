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
  assert.equal(primeiroNome("Maximilianoooo"), "Maximilianoooo");
  assert.equal(primeiroNome("Maximilianooooooo"), "Maximilianooo.");
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
  // nome grande: estreita em vez de cortar
  const grande = ajustarTexto("Fernanda", 30, 17, medir);
  assert.equal(grande.texto, "Fernanda");
  assert.ok(grande.escalaX >= 0.7 && grande.escalaX < 1);
  assert.ok(medir(grande.texto, grande.tamanho) * grande.escalaX <= 30.001);
  // enorme: abrevia só no fim, e o que sobra cabe
  const longo = ajustarTexto("Maximilianooooooo", 30, 17, medir);
  assert.ok(longo.texto.endsWith("."));
  assert.ok(medir(longo.texto, longo.tamanho) * longo.escalaX <= 30.001);
});
