import test from "node:test";
import assert from "node:assert/strict";
import { ehUuid, filtrarContas, motivoParaRecusarDelecao, ordenarContas, resumirAtividades, resumirConta } from "./regras.ts";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

test("ehUuid aceita só uuid", () => {
  assert.equal(ehUuid(A), true);
  assert.equal(ehUuid("abc"), false);
  assert.equal(ehUuid(null), false);
  assert.equal(ehUuid(`${A}' or 1=1`), false);
});

test("resumirConta usa o nome público, depois o do provedor", () => {
  const u = { id: A, email: "a@x.com", created_at: "2026-01-01", last_sign_in_at: null, user_metadata: { full_name: "Ana G" }, app_metadata: { provider: "google" } };
  assert.equal(resumirConta(u).nome, "Ana G");
  assert.equal(resumirConta(u, { [A]: "Aninha" }).nome, "Aninha");
  assert.equal(resumirConta(u).provedor, "google");
});

test("filtrarContas busca por e-mail ou nome sem acento", () => {
  const contas = [
    { id: A, email: "joao@x.com", nome: "João Silva" },
    { id: B, email: "maria@y.com", nome: "Maria" },
  ];
  assert.deepEqual(filtrarContas(contas, "joao").map((c) => c.id), [A]);
  assert.deepEqual(filtrarContas(contas, "Y.COM").map((c) => c.id), [B]);
  assert.equal(filtrarContas(contas, "  ").length, 2);
  assert.equal(filtrarContas(contas, undefined).length, 2);
});

test("ordenarContas põe o acesso mais recente primeiro", () => {
  const contas = [
    { id: A, ultimoAcesso: "2026-01-01", criadoEm: "2025-01-01" },
    { id: B, ultimoAcesso: null, criadoEm: "2026-05-01" },
  ];
  assert.deepEqual(ordenarContas(contas).map((c) => c.id), [B, A]);
});

test("resumirAtividades não leva o formulário preenchido", () => {
  const r = resumirAtividades([{ id: "x", moduleType: "caso", title: "T", score: 80, formData: { segredo: 1 }, updatedAt: "2026-01-01" }]);
  assert.deepEqual(r, [{ id: "x", modulo: "caso", titulo: "T", status: null, nota: 80, em: "2026-01-01" }]);
  assert.deepEqual(resumirAtividades(null), []);
});

test("deleção: recusa a própria conta, outro admin e e-mail que não confere", () => {
  const base = { adminId: A, alvoId: B, alvoEmail: "b@x.com", emailDigitado: " B@x.com ", alvoEhAdmin: false };
  assert.equal(motivoParaRecusarDelecao(base), null);
  assert.match(motivoParaRecusarDelecao({ ...base, alvoId: A }), /própria conta/);
  assert.match(motivoParaRecusarDelecao({ ...base, alvoEhAdmin: true }), /administrador/);
  assert.match(motivoParaRecusarDelecao({ ...base, emailDigitado: "c@x.com" }), /não confere/);
  assert.match(motivoParaRecusarDelecao({ ...base, emailDigitado: undefined }), /não confere/);
});
