import { test } from "node:test";
import assert from "node:assert/strict";

// localStorage e window mínimos para o serviço rodar no node.
const mem = new Map();
globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
const eventos = [];
globalThis.CustomEvent = class { constructor(tipo, init) { this.type = tipo; this.detail = init?.detail; } };
globalThis.window = { dispatchEvent: (e) => eventos.push(e), addEventListener() {}, removeEventListener() {} };

const { clinicalGamificationService: svc, computeStreak, melhorOfensiva } =await import("./clinicalGamificationService.js");

const dia = (offset) => {
  const d = new Date();
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

test("conta nova começa com 0 dias e sem gastar o congelamento", () => {
  const s = svc.getState("conta-nova-1");
  assert.equal(s.streak, 0);
  assert.deepEqual(s.frozenDates, []);
  assert.equal(s.streakFreezeAvailable, 1);
});

test("a 1ª atividade concluída leva a conta nova de 0 para 1 (não 2) e avisa uma vez", () => {
  eventos.length = 0;
  svc.recordActivity("case_solved", 25, "conta-nova-2");
  assert.equal(svc.getState("conta-nova-2").streak, 1);
  const ofensivas = eventos.filter((e) => e.detail?.tipo === "ofensiva");
  assert.equal(ofensivas.length, 1);
  assert.deepEqual([ofensivas[0].detail.de, ofensivas[0].detail.para], [0, 1]);
  svc.recordActivity("case_solved", 25, "conta-nova-2");
  svc.concluirAtividadeDoDia("conta-nova-2");
  assert.equal(eventos.filter((e) => e.detail?.tipo === "ofensiva").length, 1, "só a 1ª conclusão do dia comemora");
});

test("congelado mantém a corrente, mas não a começa", () => {
  assert.equal(computeStreak({ dailyXpMap: {}, frozenDates: [dia(1)] }), 0);
  assert.equal(computeStreak({ dailyXpMap: { [dia(0)]: 10 }, frozenDates: [dia(1)] }), 1);
  // o dia protegido liga as pontas, mas não soma
  assert.equal(computeStreak({ dailyXpMap: { [dia(0)]: 10, [dia(2)]: 10 }, frozenDates: [dia(1)] }), 2);
  assert.equal(computeStreak({ dailyXpMap: { [dia(1)]: 10 }, diasAtivos: [dia(2)] }), 2);
});

test("congelamento órfão de contas antigas é removido e devolvido", () => {
  mem.set(
    Object.keys(Object.fromEntries(mem)).find((k) => k.includes("conta-nova-1")),
    JSON.stringify({ ...svc.getState("conta-nova-1"), frozenDates: [dia(1)], streakFreezeAvailable: 0, lastFreezeUsedDate: dia(1) })
  );
  const s = svc.getState("conta-nova-1");
  assert.equal(s.streak, 0);
  assert.deepEqual(s.frozenDates, []);
  assert.equal(s.streakFreezeAvailable, 1);
});

test("sem estudo ontem, o congelamento protege uma ofensiva que existia", () => {
  const chave = "conta-antiga";
  svc.getState(chave);
  const k = [...mem.keys()].find((x) => x.includes(chave));
  mem.set(k, JSON.stringify({ ...JSON.parse(mem.get(k)), dailyXpMap: { [dia(2)]: 20, [dia(3)]: 20 }, frozenDates: [], streakFreezeAvailable: 1 }));
  const s = svc.getState(chave);
  assert.deepEqual(s.frozenDates, [dia(1)]);
  assert.equal(s.streak, 2);
  assert.equal(s.streakFreezeAvailable, 0);
});

test("sem estudo ontem e sem bloqueio, a ofensiva zera e o recorde sai do histórico", () => {
  const chave = "conta-sem-bloqueio";
  svc.getState(chave);
  const k = [...mem.keys()].find((x) => x.includes(chave));
  mem.set(k, JSON.stringify({ ...JSON.parse(mem.get(k)), dailyXpMap: { [dia(2)]: 20, [dia(3)]: 20 }, frozenDates: [], streakFreezeAvailable: 0, bestStreak: 9 }));
  const s = svc.getState(chave);
  assert.deepEqual(s.frozenDates, []);
  assert.equal(s.streak, 0);
  assert.equal(s.bestStreak, 2);
});

test("melhorOfensiva conta só dias estudados e quebra em buraco", () => {
  assert.equal(melhorOfensiva({ dailyXpMap: { [dia(5)]: 1, [dia(4)]: 1, [dia(2)]: 1 }, frozenDates: [dia(3)] }), 3);
  assert.equal(melhorOfensiva({ dailyXpMap: { [dia(5)]: 1, [dia(2)]: 1 }, frozenDates: [] }), 1);
});
