import { test } from "node:test";
import assert from "node:assert/strict";
import { LOJA_PE, MAX_BLOQUEIOS, aplicarCompra, bonusPorNota, calcularPE, dobroAtivo, minutosDeDobro, podeComprar } from "./regrasPE.js";

const item = (id) => LOJA_PE.find((i) => i.id === id);

test("PE por atividade, com bônus de nota", () => {
  assert.equal(calcularPE({ tipo: "consulta" }), 40);
  assert.equal(calcularPE({ tipo: "consulta", nota: 75 }), 50);
  assert.equal(calcularPE({ tipo: "consulta", nota: 95 }), 60);
  assert.equal(calcularPE({ tipo: "calculo_medico", valor: 30 }), 30);
  assert.equal(bonusPorNota(null), 0);
  assert.equal(calcularPE({ tipo: "send_support", nota: 100 }), 0); // sem base, sem bônus
});

test("PE em dobro dobra tudo enquanto vale", () => {
  const agora = 1_000_000;
  const estado = { dobroAte: agora + 60000 };
  assert.equal(dobroAtivo(estado, agora), true);
  assert.equal(calcularPE({ tipo: "consulta", nota: 95, estado, agora }), 120);
  assert.equal(calcularPE({ tipo: "consulta", estado, agora: agora + 120000 }), 40);
  assert.equal(minutosDeDobro(estado, agora), 1);
});

test("loja: saldo, limite de bloqueios e tempo do dobro somando", () => {
  const agora = 5_000_000;
  assert.equal(podeComprar(item("dobro_30"), { studyPoints: 50 }).ok, false);
  assert.equal(podeComprar(item("bloqueio_ofensiva"), { studyPoints: 999, streakFreezeAvailable: MAX_BLOQUEIOS }).ok, false);
  let e = { studyPoints: 500, spentStudyPoints: 0, streakFreezeAvailable: 1 };
  e = aplicarCompra(item("bloqueio_ofensiva"), e, agora);
  assert.equal(e.streakFreezeAvailable, 2);
  assert.equal(e.studyPoints, 350);
  e = aplicarCompra(item("dobro_30"), e, agora);
  e = aplicarCompra(item("dobro_30"), e, agora + 10 * 60000); // comprou de novo com 20 min restando
  assert.equal(minutosDeDobro(e, agora + 10 * 60000), 50);
  assert.equal(e.spentStudyPoints, 350);
  assert.equal(e.compras.length, 3);
});
