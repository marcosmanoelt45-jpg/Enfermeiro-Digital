import test from "node:test";
import assert from "node:assert/strict";
import { ErroApp, STATUS_POR_CODIGO, corpoDeErro, erro, erroDeExcecao, ok } from "./erros.ts";

test("cada código do contrato C5 tem o HTTP esperado", () => {
  assert.deepEqual(STATUS_POR_CODIGO, {
    NAO_AUTENTICADO: 401,
    SESSAO_DEMO: 403,
    COTA_EXCEDIDA: 429,
    ENTRADA_INVALIDA: 400,
    SESSAO_ENCERRADA: 409,
    TURNO_DUPLICADO: 200,
    IA_INDISPONIVEL: 503,
    ERRO_INTERNO: 500,
  });
});

test("ErroApp usa o status do código e aceita um status próprio", () => {
  const a = new ErroApp("COTA_EXCEDIDA", "limite");
  assert.equal(a.status, 429);
  assert.equal(a.codigo, "COTA_EXCEDIDA");
  assert.equal(a.message, "limite");
  assert.ok(a instanceof Error);
  assert.equal(new ErroApp("ENTRADA_INVALIDA", "x", 405).status, 405);
});

test("o corpo do erro segue o formato { erro: { codigo, mensagem } }", () => {
  assert.deepEqual(corpoDeErro("SESSAO_DEMO", "crie uma conta"), {
    erro: { codigo: "SESSAO_DEMO", mensagem: "crie uma conta" },
  });
});

test("erro() devolve JSON com o status do código e CORS", async () => {
  const r = erro("NAO_AUTENTICADO", "Sessão obrigatória.");
  assert.equal(r.status, 401);
  assert.equal(r.headers.get("Content-Type"), "application/json");
  assert.equal(r.headers.get("Access-Control-Allow-Origin"), "*");
  assert.deepEqual(await r.json(), { erro: { codigo: "NAO_AUTENTICADO", mensagem: "Sessão obrigatória." } });
});

test("ok() devolve os dados com 200 e CORS", async () => {
  const r = ok({ id: "abc" });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("Access-Control-Allow-Origin"), "*");
  assert.deepEqual(await r.json(), { id: "abc" });
});

test("erroDeExcecao mantém o ErroApp e esconde o detalhe de erro desconhecido", async () => {
  const conhecido = erroDeExcecao(new ErroApp("IA_INDISPONIVEL", "fora do ar"));
  assert.equal(conhecido.status, 503);
  assert.equal((await conhecido.json()).erro.codigo, "IA_INDISPONIVEL");

  const desconhecido = erroDeExcecao(new Error("segredo: senha do banco"));
  assert.equal(desconhecido.status, 500);
  const corpo = await desconhecido.json();
  assert.equal(corpo.erro.codigo, "ERRO_INTERNO");
  assert.ok(!JSON.stringify(corpo).includes("segredo"));
});
