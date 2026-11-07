import test from "node:test";
import assert from "node:assert/strict";
import { criarAcumulador } from "./acumuladorTurnos.js";
import { montarUrl, abrirStream } from "../stt/assemblyStream.js";

const turno = (transcript, end_of_turn) => ({ type: "Turn", transcript, end_of_turn });

test("acumulador: parcial muda a cada mensagem e o final só acumula no fechamento do turno", () => {
  const a = criarAcumulador();
  a.aplicar(turno("dor", false));
  assert.equal(a.texto(), "dor");
  a.aplicar(turno("dor no peito", false));
  assert.equal(a.textoParcial(), "dor no peito");
  assert.equal(a.textoFinal(), "");
  assert.equal(a.aplicar(turno("Dor no peito.", true)), true);
  assert.equal(a.textoFinal(), "Dor no peito.");
  assert.equal(a.textoParcial(), "");
  a.aplicar(turno("desde ontem", false));
  assert.equal(a.texto(), "Dor no peito. desde ontem");
  a.aplicar(turno("Desde ontem.", true));
  assert.equal(a.texto(), "Dor no peito. Desde ontem.");
});

test("acumulador ignora mensagens que não são Turn e turno final vazio", () => {
  const a = criarAcumulador();
  assert.equal(a.aplicar({ type: "Begin", id: "x" }), false);
  assert.equal(a.aplicar(turno("", true)), true);
  assert.equal(a.texto(), "");
  a.limpar();
  assert.equal(a.texto(), "");
});

test("montarUrl junta parâmetros do servidor e o token", () => {
  const url = montarUrl({ wsUrl: "wss://s.example/v3/ws", parametros: { sample_rate: "16000", language_codes: '["pt"]' }, token: "tmp" });
  const u = new URL(url);
  assert.equal(u.origin + u.pathname, "wss://s.example/v3/ws");
  assert.equal(u.searchParams.get("sample_rate"), "16000");
  assert.equal(u.searchParams.get("language_codes"), '["pt"]');
  assert.equal(u.searchParams.get("token"), "tmp");
});

function wsFalso() {
  const ws = { enviados: [], fechado: false, listeners: {} };
  ws.send = (d) => ws.enviados.push(d);
  ws.close = () => {
    ws.fechado = true;
    ws.onclose?.();
  };
  ws.addEventListener = (n, f) => (ws.listeners[n] = f);
  return ws;
}
const cred = { wsUrl: "wss://s/ws", parametros: {}, token: "t" };

test("stream: quadros antes de abrir ficam na fila e saem na ordem", async () => {
  const ws = wsFalso();
  const s = abrirStream({ credencial: cred, criarWebSocket: () => ws });
  s.enviar(new ArrayBuffer(4));
  s.enviar(new ArrayBuffer(8));
  assert.equal(ws.enviados.length, 0);
  ws.onopen();
  await s.pronto;
  assert.deepEqual(ws.enviados.map((b) => b.byteLength), [4, 8]);
  s.enviar(new ArrayBuffer(2));
  assert.equal(ws.enviados.length, 3);
});

test("stream: concluir manda ForceEndpoint, espera o último final e manda Terminate", async () => {
  const ws = wsFalso();
  const vistos = [];
  const s = abrirStream({ credencial: cred, criarWebSocket: () => ws, onTexto: (t) => vistos.push(t.texto) });
  ws.onopen();
  await s.pronto;
  ws.onmessage({ data: JSON.stringify(turno("preciso de ajuda", false)) });
  const p = s.concluir();
  assert.equal(JSON.parse(ws.enviados.at(-1)).type, "ForceEndpoint");
  ws.onmessage({ data: JSON.stringify(turno("Preciso de ajuda.", true)) });
  assert.equal(await p, "Preciso de ajuda.");
  assert.ok(ws.enviados.some((m) => typeof m === "string" && JSON.parse(m).type === "Terminate"));
  assert.ok(ws.fechado);
  assert.deepEqual(vistos, ["preciso de ajuda", "Preciso de ajuda."]);
});

test("stream: se o último final não vem, devolve o parcial depois do tempo-limite", async () => {
  const ws = wsFalso();
  const s = abrirStream({ credencial: cred, criarWebSocket: () => ws, esperaFinalMs: 30 });
  ws.onopen();
  await s.pronto;
  ws.onmessage({ data: JSON.stringify(turno("quase lá", false)) });
  assert.equal(await s.concluir(), "quase lá");
});

test("stream: erro do socket rejeita 'pronto' e mensagens inválidas são ignoradas", async () => {
  const ws = wsFalso();
  const s = abrirStream({ credencial: cred, criarWebSocket: () => ws });
  ws.onmessage({ data: "isto não é json" });
  ws.onerror();
  await assert.rejects(s.pronto);
  assert.equal(s.falhou(), true);
});
