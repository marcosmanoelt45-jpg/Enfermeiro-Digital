import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { ErroApp } from "./erros.ts";
import { MODELOS_PADRAO, chamarLLM, escolherProvedor, extrairJson, modelosConfigurados, ordenarModelosGemini } from "./llm.ts";

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

test("escolherProvedor: Gemini se há chave, OpenRouter senão, e LLM_PROVIDER força", () => {
  assert.equal(escolherProvedor(undefined, true), "gemini");
  assert.equal(escolherProvedor(undefined, false), "openrouter");
  assert.equal(escolherProvedor("openrouter", true), "openrouter");
  assert.equal(escolherProvedor(" GEMINI ", false), "gemini");
  assert.equal(escolherProvedor("outro", true), "gemini");
});

test("Gemini direto: endpoint do Google, modelo sem prefixo, raciocínio desligado e sem cabeçalhos do OpenRouter", async () => {
  const pedidos = [];
  const fetchImpl = async (url, init) => {
    pedidos.push({ url, headers: init.headers, corpo: JSON.parse(init.body) });
    return completa("oi");
  };
  const r = await chamarLLM({ mensagens: [{ role: "user", content: "x" }], apiKey: "g-key", provedor: "gemini", modelos: ["gemini-2.5-flash"], json: true, fetchImpl });
  assert.equal(r.texto, "oi");
  assert.equal(pedidos[0].url, "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions");
  assert.equal(pedidos[0].headers.Authorization, "Bearer g-key");
  assert.equal(pedidos[0].headers["HTTP-Referer"], undefined);
  assert.equal(pedidos[0].corpo.model, "gemini-2.5-flash");
  assert.equal(pedidos[0].corpo.reasoning_effort, "none");
  assert.deepEqual(pedidos[0].corpo.response_format, { type: "json_object" });
});

test("Gemini: se o primeiro modelo falha, tenta o seguinte; modelo que não é 2.5-flash não leva reasoning_effort", async () => {
  const corpos = [];
  const fetchImpl = async (_u, init) => {
    corpos.push(JSON.parse(init.body));
    return corpos.length === 1 ? resposta({}, 500) : completa("ok");
  };
  const r = await chamarLLM({ mensagens: [{ role: "user", content: "x" }], apiKey: "k", provedor: "gemini", modelos: ["gemini-2.5-flash", "gemini-1.5-pro"], fetchImpl });
  assert.equal(r.modelo, "gemini-1.5-pro");
  assert.equal(corpos[1].reasoning_effort, undefined);
});

test("com apiKey injetada e sem provedor, continua OpenRouter (comportamento antigo)", async () => {
  let url = "";
  await chamarLLM({ mensagens: [{ role: "user", content: "x" }], apiKey: "k", modelos: ["a/b"], fetchImpl: async (u) => { url = u; return completa("ok"); } });
  assert.equal(url, "https://openrouter.ai/api/v1/chat/completions");
});

test("ordenarModelosGemini: só texto estável, apelidos primeiro, mais novo antes, flash antes de lite", () => {
  const m = (name, metodos = ["generateContent"]) => ({ name: `models/${name}`, supportedGenerationMethods: metodos });
  const lista = [
    m("gemini-2.5-flash"), m("gemini-2.5-flash-lite"), m("gemini-3-flash"), m("gemini-flash-latest"), m("gemini-3-flash-preview"),
    m("gemini-2.5-flash-image"), m("gemini-2.5-flash-preview-tts"), m("gemini-2.5-pro"), m("embedding-001", ["embedContent"]), m("gemini-2.0-flash-exp"), m("gemma-3-27b-it"),
  ];
  assert.deepEqual(ordenarModelosGemini(lista), ["gemini-flash-latest", "gemini-3-flash", "gemini-2.5-flash", "gemini-2.5-flash-lite"]);
  assert.deepEqual(ordenarModelosGemini([]), []);
});

test("Gemini com 404 em tudo: lista os modelos da conta e usa um que existe", async () => {
  const urls = [];
  const fetchImpl = async (url, init) => {
    urls.push(String(url));
    if (String(url).includes("/models?")) return resposta({ models: [{ name: "models/gemini-9-flash", supportedGenerationMethods: ["generateContent"] }] });
    const corpo = JSON.parse(init.body);
    return corpo.model === "gemini-9-flash" ? completa("achou") : resposta({}, 404);
  };
  const prev = process.env.GEMINI_API_KEY;
  const r = await chamarLLM({ mensagens: [{ role: "user", content: "x" }], provedor: "gemini", apiKey: "k", fetchImpl });
  assert.equal(r.texto, "achou");
  assert.equal(r.modelo, "gemini-9-flash");
  assert.ok(urls.some((u) => u.includes("/models?")));
  void prev;
});

test("Gemini: se o modelo recusa reasoning_effort (400), repete sem ele", async () => {
  const corpos = [];
  const fetchImpl = async (_u, init) => {
    const c = JSON.parse(init.body);
    corpos.push(c);
    return c.reasoning_effort ? resposta({}, 400) : completa("ok");
  };
  const r = await chamarLLM({ mensagens: [{ role: "user", content: "x" }], provedor: "gemini", apiKey: "k", modelos: ["gemini-3-flash"], fetchImpl });
  assert.equal(r.texto, "ok");
  assert.equal(corpos.length, 2);
  assert.equal(corpos[1].reasoning_effort, undefined);
});

test("Gemini 503 (sobrecarregado): repete uma vez no mesmo modelo", async () => {
  let n = 0;
  const fetchImpl = async () => (++n === 1 ? resposta({}, 503) : completa("voltou"));
  const r = await chamarLLM({ mensagens: [{ role: "user", content: "x" }], provedor: "gemini", apiKey: "k", modelos: ["gemini-flash-lite-latest"], esperaRepeticaoMs: 1, fetchImpl });
  assert.equal(r.texto, "voltou");
  assert.equal(n, 2);
});

test("Gemini fora do ar: cai no OpenRouter com a chave reserva", async () => {
  const urls = [];
  const fetchImpl = async (url, init) => {
    urls.push(String(url));
    if (String(url).includes("generativelanguage")) return resposta({}, 503);
    assert.equal(init.headers.Authorization, "Bearer chave-or");
    return completa("pelo openrouter");
  };
  const r = await chamarLLM({ mensagens: [{ role: "user", content: "x" }], provedor: "gemini", apiKey: "k", modelos: ["gemini-flash-lite-latest"], chaveReserva: "chave-or", esperaRepeticaoMs: 1, fetchImpl });
  assert.equal(r.texto, "pelo openrouter");
  assert.equal(r.modelo, MODELOS_PADRAO[0]);
  assert.ok(urls.some((u) => u.includes("openrouter.ai")));
});

test("sem chave reserva, Gemini fora do ar dá IA_INDISPONIVEL", async () => {
  await assert.rejects(
    () => chamarLLM({ mensagens: [{ role: "user", content: "x" }], provedor: "gemini", apiKey: "k", modelos: ["gemini-flash-lite-latest"], esperaRepeticaoMs: 1, fetchImpl: async () => resposta({}, 503) }),
    (e) => e instanceof ErroApp && e.codigo === "IA_INDISPONIVEL",
  );
});
