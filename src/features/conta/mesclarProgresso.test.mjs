import { test } from "node:test";
import assert from "node:assert/strict";
import { mesclarGamificacao, mesclarPorId, mesclarPacote, numerosDoPerfil, semanaIso } from "./mesclarProgresso.js";

test("dias: união; PE do mesmo dia não soma duas vezes", () => {
  const local = { dailyXpMap: { "2026-11-10": 30, "2026-11-11": 10 }, diasAtivos: ["2026-11-11"], totalXp: 40, atualizadoEm: "2026-11-11T10:00:00Z" };
  const remoto = { dailyXpMap: { "2026-11-09": 20, "2026-11-11": 25 }, diasAtivos: ["2026-11-09"], totalXp: 45, atualizadoEm: "2026-11-11T09:00:00Z" };
  const m = mesclarGamificacao(local, remoto);
  assert.deepEqual(m.dailyXpMap, { "2026-11-09": 20, "2026-11-10": 30, "2026-11-11": 25 });
  assert.deepEqual(m.diasAtivos, ["2026-11-09", "2026-11-11"]);
  assert.equal(m.totalXp, 45);
});

test("recordes pegam o maior; o resto vem do lado mais novo", () => {
  const local = { bestStreak: 12, acertosSeguidos: 3, streakFreezeAvailable: 0, atualizadoEm: "2026-11-11T10:00:00Z" };
  const remoto = { bestStreak: 20, acertosSeguidos: 9, streakFreezeAvailable: 1, atualizadoEm: "2026-11-10T10:00:00Z" };
  const m = mesclarGamificacao(local, remoto);
  assert.equal(m.bestStreak, 20);
  assert.equal(m.acertosSeguidos, 3);
  assert.equal(m.streakFreezeAvailable, 0);
});

test("um lado vazio devolve o outro", () => {
  assert.deepEqual(mesclarGamificacao(null, { a: 1 }), { a: 1 });
  assert.deepEqual(mesclarGamificacao({ a: 1 }, null), { a: 1 });
});

test("histórico: união por id, fica a versão mais nova", () => {
  const local = [{ id: "x", status: "rascunho", updatedAt: "2026-11-10T00:00:00Z" }, { id: "y", updatedAt: "2026-11-11T00:00:00Z" }];
  const remoto = [{ id: "x", status: "concluido", updatedAt: "2026-11-11T05:00:00Z" }, { id: "z", updatedAt: "2026-11-09T00:00:00Z" }];
  const m = mesclarPorId(local, remoto);
  assert.equal(m.length, 3);
  assert.equal(m.find((i) => i.id === "x").status, "concluido");
});

test("pacote completo", () => {
  const p = mesclarPacote({ historico: [{ id: 1 }] }, { historico: [{ id: 2 }], gamificacao: { totalXp: 5 } });
  assert.equal(p.historico.length, 2);
  assert.equal(p.gamificacao.totalXp, 5);
});

test("números do perfil público", () => {
  const hoje = new Date(2026, 10, 12); // quinta
  const n = numerosDoPerfil({ streak: 3, bestStreak: 7, studyPoints: 90, dailyXpMap: { "2026-11-09": 10, "2026-11-12": 15, "2026-11-01": 50 }, diasAtivos: ["2026-11-11"] }, hoje);
  assert.equal(n.ofensiva, 3);
  assert.equal(n.pe_semana, 25);
  assert.equal(n.semana, semanaIso(hoje));
  assert.deepEqual(n.dias_estudados, ["2026-11-01", "2026-11-09", "2026-11-11", "2026-11-12"]);
  assert.match(n.semana, /^\d{4}-W\d{2}$/);
});
