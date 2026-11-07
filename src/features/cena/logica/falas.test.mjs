import test from "node:test";
import assert from "node:assert/strict";
import { dividirEmFrases, tempoPorPalavra, resolverFala } from "./falas.js";
import { aplicarPronuncia } from "./pronuncia.js";
import { resolverClipe, caminhoDoClipe } from "./clipes.js";
import { buscarPersonagem, PERSONAGENS } from "../dados/personagens.js";

test("dividirEmFrases corta em . ! ? …", () => {
  assert.deepEqual(dividirEmFrases("Oi. Tudo bem? Que bom! Vamos…"), ["Oi.", "Tudo bem?", "Que bom!", "Vamos…"]);
});

test("dividirEmFrases não quebra Dr., Sra. nem números", () => {
  assert.deepEqual(dividirEmFrases("O Dr. Rui pediu 2,5 mL e 0.9 de soro. A Sra. Ana confere."), ["O Dr. Rui pediu 2,5 mL e 0.9 de soro.", "A Sra. Ana confere."]);
});

test("dividirEmFrases junta pontuação repetida e trata texto sem pontuação", () => {
  assert.deepEqual(dividirEmFrases("Sério?! Sim..."), ["Sério?!", "Sim..."]);
  assert.deepEqual(dividirEmFrases("sem ponto final"), ["sem ponto final"]);
  assert.deepEqual(dividirEmFrases("   "), []);
  assert.deepEqual(dividirEmFrases(undefined), []);
});

test("tempoPorPalavra cobre a duração inteira, em ordem, proporcional ao tamanho", () => {
  const t = tempoPorPalavra("um tresloucado dia", 1000);
  assert.equal(t.length, 3);
  assert.equal(t[0].inicioMs, 0);
  assert.equal(t.at(-1).fimMs, 1000);
  for (let i = 1; i < t.length; i++) assert.equal(t[i].inicioMs, t[i - 1].fimMs);
  assert.ok(t[1].fimMs - t[1].inicioMs > t[0].fimMs - t[0].inicioMs, "palavra maior dura mais");
  assert.deepEqual(tempoPorPalavra("", 500), []);
});

test("resolverFala: fixa com id no manifesto -> mp3; sem id no manifesto -> navegador; aovivo -> aovivo", () => {
  const manifesto = { falas: { "a.b.c": { arquivo: "a.b.c.1234abcd.mp3", duracaoMs: 900 } } };
  assert.deepEqual(resolverFala({ id: "a.b.c", texto: "x", origem: "fixa" }, manifesto, "/vozes/marcus"), { tipo: "mp3", url: "/vozes/marcus/a.b.c.1234abcd.mp3", duracaoMs: 900 });
  assert.deepEqual(resolverFala({ id: "z", texto: "x", origem: "fixa" }, manifesto), { tipo: "navegador" });
  assert.deepEqual(resolverFala({ texto: "x", origem: "fixa" }, manifesto), { tipo: "navegador" });
  assert.deepEqual(resolverFala({ texto: "x", origem: "aovivo" }, manifesto), { tipo: "aovivo" });
  assert.deepEqual(resolverFala({ id: "a.b.c", texto: "x", origem: "fixa" }, null), { tipo: "navegador" });
});

test("aplicarPronuncia troca siglas por palavra inteira, sem diferenciar maiúsculas", () => {
  assert.equal(aplicarPronuncia("Faça 500 mL EV em 8 h."), "Faça 500 mililitros endovenoso em 8 h.");
  assert.equal(aplicarPronuncia("ev e Ev"), "endovenoso e endovenoso");
});

test("aplicarPronuncia não mexe dentro de outras palavras", () => {
  assert.equal(aplicarPronuncia("A MGM e o gato"), "A MGM e o gato");
  assert.equal(aplicarPronuncia("PAciente"), "PAciente");
});

test("aplicarPronuncia: a chave mais longa vence (mL/h antes de mL; SF 0,9% inteiro)", () => {
  assert.equal(aplicarPronuncia("Correr a 21 mL/h"), "Correr a 21 mililitros por hora");
  assert.equal(aplicarPronuncia("SF 0,9% 500 mL"), "soro fisiológico zero vírgula nove por cento 500 mililitros");
});

test("aplicarPronuncia mantém números com vírgula e aceita dicionário próprio", () => {
  assert.equal(aplicarPronuncia("2,5 mg"), "2,5 miligramas");
  assert.equal(aplicarPronuncia("foo bar", { foo: "baz" }), "baz bar");
  assert.equal(aplicarPronuncia(undefined), "");
});

test("resolverClipe: emoção existente vence", () => {
  const p = { clipes: ["parado", "falando", "pensando", "acerto", "erro", "feliz"] };
  for (const e of p.clipes) assert.equal(resolverClipe(p, e), e);
});

test("resolverClipe: fallback de cada emoção ausente", () => {
  const completo = { clipes: ["parado", "falando", "pensando", "acerto"] };
  assert.equal(resolverClipe(completo, "feliz"), "acerto");
  for (const e of ["dor", "irritado", "desconfiado", "confuso"]) assert.equal(resolverClipe(completo, e), "pensando", e);
  assert.equal(resolverClipe(completo, "erro"), "parado");

  const semPensando = { clipes: ["parado", "falando"] };
  for (const e of ["dor", "irritado", "desconfiado", "confuso", "feliz"]) assert.equal(resolverClipe(semPensando, e), "falando", e);
  assert.equal(resolverClipe(semPensando, "acerto"), "parado");
});

test("resolverClipe: só falando ou nenhum clipe", () => {
  assert.equal(resolverClipe({ clipes: ["falando"] }, "parado"), "falando");
  assert.equal(resolverClipe({ clipes: ["falando", "acerto", "erro"] }, "pensando"), "falando");
  assert.equal(resolverClipe({ clipes: [] }, "parado"), null);
  assert.equal(resolverClipe(null, "parado"), null);
});

test("personagens: ids únicos, marcus e teresinha usam os clipes antigos", () => {
  const ids = PERSONAGENS.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(ids, ["marcus", "teresinha", "medico-rui", "enfermeira-ana", "goti"]);
  assert.equal(caminhoDoClipe(buscarPersonagem("marcus"), "falando"), "/pacientes/marcus/fala");
  assert.equal(caminhoDoClipe(buscarPersonagem("marcus"), "acerto"), "/pacientes/marcus/acerto");
  assert.equal(caminhoDoClipe({ id: "novo", clipes: [] }, "parado"), "/personagens/novo/parado");
  assert.equal(buscarPersonagem("nao-existe"), null);
});
