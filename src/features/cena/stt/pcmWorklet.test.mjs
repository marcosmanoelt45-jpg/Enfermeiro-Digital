import test from "node:test";
import assert from "node:assert/strict";

// Harness: carrega o worklet de verdade com os globais que o navegador fornece.
let contador = 0;
async function carregar(taxa) {
  globalThis.sampleRate = taxa;
  let Classe;
  globalThis.AudioWorkletProcessor = class {
    constructor() {
      this.port = { enviados: [], postMessage: (b) => this.port.enviados.push(new Int16Array(b)) };
    }
  };
  globalThis.registerProcessor = (_nome, c) => (Classe = c);
  await import(`./pcm-worklet.js?n=${++contador}`);
  return new Classe();
}

const bloco = (n, valor) => [new Float32Array(n).fill(valor)];

test("48 kHz -> 16 kHz: 128 amostras viram ~43 e saem em quadros de 800 (50 ms)", async () => {
  const p = await carregar(48000);
  // 48000 amostras = 1 s de áudio -> 16000 amostras de saída -> 20 quadros de 800
  for (let i = 0; i < 375; i++) p.process([bloco(128, 0.5)]);
  const total = p.port.enviados.reduce((s, q) => s + q.length, 0);
  assert.ok(p.port.enviados.every((q) => q.length === 800));
  assert.ok(Math.abs(total - 16000) <= 800, `total ${total}`);
});

test("converte float para PCM16 com saturação e sinal corretos", async () => {
  const p = await carregar(16000);
  const entrada = new Float32Array(800);
  entrada.fill(1, 0, 200);
  entrada.fill(-1, 200, 400);
  entrada.fill(0, 400);
  p.process([[entrada]]);
  const q = p.port.enviados[0];
  assert.equal(q[0], 32767);
  assert.equal(q[250], -32768);
  assert.equal(q[500], 0);
});

test("sem entrada o processador continua vivo e não envia nada", async () => {
  const p = await carregar(16000);
  assert.equal(p.process([[]]), true);
  assert.equal(p.process([]), true);
  assert.equal(p.port.enviados.length, 0);
});
