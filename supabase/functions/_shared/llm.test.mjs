import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { ErroApp } from "./erros.ts";
import { MODELOS_PADRAO, chamarLLM, extrairJson, modelosConfigurados } from "./llm.ts";

// O módulo registra eventos com console.log; silencia durante os testes.
const logOriginal = console.log;
before(() => {
  console.log = () => {};
});
after(() => {
  console.log = logOriginal;
});

const resposta = (corpo, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => corpo });
const completa = (texto, extra = {}) => resposta({ choices: [{ message: { content: texto }, finish_reason: "stop", ...extra }], usage: { prompt_tokens: 10, completion_tokens: 4 } });

test("extrairJson lê JSON puro, com cerca de código e com texto em volta", () => {
  assert.deepEqual(extrairJson('{"a":1}'), { a: 1 });
  assert.deepEqual(extrairJson('```json\n{"a":{"b":2}}\n```'), { a: { b: 2 } });
  assert.deepEqual(extrairJson('Claro! Aqui está: {"ok":true} Espero ter ajudado.'), { ok: true });
});

test("extrairJson lança IA_INDISPONIVEL quando não há JSON legível", () => {
  for (const ruim of ["", "sem chaves", "{ quebrado", "}{", "{a:1}"]) {
    assert.throws(() => extrairJson(ruim), (e) => e instanceof ErroApp && e.codigo === "IA_INDISPONIVEL", JSON.stringify(ruim));
  }
});

test("a ordem dos modelos vem do CSV e cai no padrão quando vazio", () => {
  assert.deepEqual(modelosConfigurados(" a/b , c/d ,, "), ["a/b", "c/d"]);
  assert.deepEqual(modelosConfigurados(""), MODELOS_PADRAO);
  assert.deepEqual(modelosConfigurados(undefined), MODELOS_PADRAO);
});

test("chamarLLM aceita várias mensagens, limita os tokens e leva timeout por modelo", async () => {
  const pedidos = [];
  const fetchImpl = async (url, init) => {
    pedidos.push({ url, init, corpo: JSON.parse(init.body) });
    return completa("olá");
  };
  const mensagens = [
    { role: "system", content: "S" },
    { role: "user", content: "U1" },
    { role: "assistant", content: "A1" },
    { role: "user", content: "U2" },
  ];
  const r = await chamarLLM({ mensagens, maxTokens: 50, json: true, apiKey: "k", modelos: ["m/1"], fetchImpl });
  assert.equal(r.texto, "olá");
  assert.equal(r.modelo, "m/1");
  assert.equal(r.truncado, false);
  assert.deepEqual(r.uso, { entrada: 10, saida: 4 });

  const p = pedidos[0];
  assert.equal(p.url, "https://openrouter.ai/api/v1/chat/completions");
  assert.equal(p.init.headers.Authorization, "Bearer k");
  assert.deepEqual(p.corpo.messages, mensagens);
  assert.equal(p.corpo.max_tokens, 400); // mínimo
  assert.deepEqual(p.corpo.response_format, { type: "json_object" });
  assert.ok(p.init.signal instanceof AbortSignal);

  await chamarLLM({ mensagens, maxTokens: 99999, apiKey: "k", modelos: ["m/1"], fetchImpl });
  assert.equal(pedidos[1].corpo.max_tokens, 3000); // máximo
  assert.equal(pedidos[1].corpo.response_format, undefined);
});

test("quando um modelo falha, tenta o próximo", async () => {
  const chamados = [];
  const fetchImpl = async (_url, init) => {
    const modelo = JSON.parse(init.body).model;
    chamados.push(modelo);
    if (modelo === "m/1") return resposta({}, 500);
    if (modelo === "m/2") throw new DOMException("tempo esgotado", "TimeoutError");
    if (modelo === "m/3") return completa("   ");
    return completa("deu certo");
  };
  const r = await chamarLLM({ mensagens: [{ role: "user", content: "oi" }], apiKey: "k", modelos: ["m/1", "m/2", "m/3", "m/4"], fetchImpl });
  assert.deepEqual(chamados, ["m/1", "m/2", "m/3", "m/4"]);
  assert.equal(r.texto, "deu certo");
  assert.equal(r.modelo, "m/4");
});

test("resposta truncada só marca truncado e não acrescenta nota ao texto", async () => {
  const fetchImpl = async () => completa("texto cortado", { finish_reason: "length" });
  const r = await chamarLLM({ mensagens: [{ role: "user", content: "oi" }], apiKey: "k", modelos: ["m/1"], fetchImpl });
  assert.equal(r.truncado, true);
  assert.equal(r.texto, "texto cortado");
});

test("quando todos os modelos falham, lança IA_INDISPONIVEL", async () => {
  const fetchImpl = async () => resposta({}, 502);
  await assert.rejects(
    () => chamarLLM({ mensagens: [{ role: "user", content: "oi" }], apiKey: "k", modelos: ["m/1", "m/2"], fetchImpl }),
    (e) => e instanceof ErroApp && e.codigo === "IA_INDISPONIVEL" && e.status === 503
  );
});

test("sem chave da IA no servidor, lança IA_INDISPONIVEL sem tentar a rede", async () => {
  let chamou = false;
  const fetchImpl = async () => {
    chamou = true;
    return completa("x");
  };
  await assert.rejects(
    () => chamarLLM({ mensagens: [{ role: "user", content: "oi" }], modelos: ["m/1"], fetchImpl }),
    (e) => e instanceof ErroApp && e.codigo === "IA_INDISPONIVEL"
  );
  assert.equal(chamou, false);
});
