import { test } from "node:test";
import assert from "node:assert/strict";
import { pontoDeCorte } from "./limparAudio.js";

const TAXA = 24000;
// "Voz": senoide de 200 Hz (poucos cruzamentos). "Ruído": aleatório (muitos cruzamentos).
const voz = (s) => Array.from({ length: Math.round(TAXA * s) }, (_, i) => Math.round(8000 * Math.sin((2 * Math.PI * 200 * i) / TAXA)));
const silencio = (s) => new Array(Math.round(TAXA * s)).fill(0);
let semente = 7;
const aleat = () => ((semente = (semente * 1103515245 + 12345) % 2147483648) / 2147483648) * 2 - 1;
const ruido = (s, amp = 6000) => Array.from({ length: Math.round(TAXA * s) }, () => Math.round(amp * aleat()));

test("corta o chiado no fim, depois de um silêncio", () => {
  const a = Int16Array.from([...voz(1), ...silencio(0.2), ...ruido(0.4)]);
  const fim = pontoDeCorte(a, TAXA);
  assert.ok(fim <= TAXA * 1.1, `fim ${fim}`);
  assert.ok(fim >= TAXA * 1.0);
});

test("corta o chiado colado na fala (sem silêncio)", () => {
  const a = Int16Array.from([...voz(1), ...ruido(0.3, 3000)]);
  assert.ok(pontoDeCorte(a, TAXA) <= TAXA * 1.1);
});

test("não mexe num áudio limpo nem num 's' curto no fim", () => {
  const limpo = Int16Array.from([...voz(1), ...silencio(0.2)]);
  assert.equal(pontoDeCorte(limpo, TAXA), limpo.length);
  const comS = Int16Array.from([...voz(1), ...ruido(0.08, 2000)]);
  assert.equal(pontoDeCorte(comS, TAXA), comS.length);
});
