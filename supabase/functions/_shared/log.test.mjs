import test from "node:test";
import assert from "node:assert/strict";
import { montarLinhaDeLog } from "./log.ts";

const ler = (nome, dados) => JSON.parse(montarLinhaDeLog(nome, dados));

test("a linha de log é um JSON com o nome do evento e a hora", () => {
  const l = ler("llm_ok", { modelo: "google/gemini-2.5-flash", ms: 840, truncado: false });
  assert.equal(l.evento, "llm_ok");
  assert.equal(l.modelo, "google/gemini-2.5-flash");
  assert.equal(l.ms, 840);
  assert.equal(l.truncado, false);
  assert.ok(!Number.isNaN(Date.parse(l.em)));
});

test("chaves que carregam texto do aluno ou prompt nunca entram, em qualquer caixa", () => {
  const l = ler("x", { texto: "oi", Prompt: "p", MENSAGENS: "m", content: "c", conteudo: "c", fala: "f", resposta: "r", systemPrompt: "s", userPrompt: "u", id: "abc" });
  assert.deepEqual(Object.keys(l).sort(), ["em", "evento", "id"]);
});

test("texto com espaço, texto longo, objeto e lista são descartados", () => {
  const l = ler("x", {
    sintoma: "estou com muita dor no peito",
    longo: "a".repeat(65),
    objeto: { a: 1 },
    lista: [1, 2],
    sessao: "6f9c2b1e-0d3a-4b7e-9a11-2f1c8e5d7a90",
    ok: "OPENROUTER_FALHOU",
    nulo: null,
  });
  assert.deepEqual(Object.keys(l).sort(), ["em", "evento", "nulo", "ok", "sessao"]);
});
