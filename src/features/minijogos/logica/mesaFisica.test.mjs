import test from "node:test";
import assert from "node:assert/strict";
import { dentroDaBandeja, emRepouso, layoutDaMesa, passo, vagaNaBandeja, vagasIniciais } from "./mesaFisica.js";

const obj = (extra = {}) => ({ id: "a", x: 0.5, y: 0.5, vx: 0, vy: 0, rot: 0, vrot: 0, h: 0, vh: 0, arrastando: false, raio: 0.06, rotRepouso: 0, ...extra });

test("layout: paisagem a partir de 560 px, retrato abaixo", () => {
  assert.equal(layoutDaMesa(800).paisagem, true);
  assert.equal(layoutDaMesa(400).paisagem, false);
});

test("vagas iniciais ficam fora da bandeja e são determinísticas", () => {
  for (const largura of [900, 380]) {
    const l = layoutDaMesa(largura);
    const v = vagasIniciais(11, l, 3);
    assert.equal(v.length, 11);
    for (const p of v) assert.equal(dentroDaBandeja(p, l.bandeja), false);
    assert.deepEqual(v, vagasIniciais(11, l, 3));
  }
});

test("objeto arrastado segue o ponteiro, fica no ar e inclina para o lado do movimento", () => {
  const o = obj({ arrastando: true });
  for (let i = 0; i < 4; i++) passo([o], { proporcao: 1.6, alvo: { x: 0.8, y: 0.5 } });
  assert.ok(o.x > 0.6);
  assert.ok(o.h > 0.5);
  assert.ok(o.rot > 0, "inclina para a direita ao ir para a direita");
});

test("ao soltar, cai com gravidade, quica e para", () => {
  const o = obj({ h: 1 });
  let quicou = false;
  let subiu = false;
  for (let i = 0; i < 400; i++) {
    const antes = o.h;
    passo([o], { proporcao: 1.6 });
    if (o.h === 0 && antes > 0) quicou = true;
    if (quicou && o.h > 0) subiu = true;
  }
  assert.ok(quicou && subiu, "quica pelo menos uma vez");
  assert.equal(o.h, 0);
  assert.ok(emRepouso([o]));
});

test("objetos apoiados que se sobrepõem se afastam; o que está na mão não é empurrado", () => {
  const a = obj({ id: "a", x: 0.5 });
  const b = obj({ id: "b", x: 0.51 });
  for (let i = 0; i < 60; i++) passo([a, b], { proporcao: 1 });
  assert.ok(Math.abs(b.x - a.x) > 0.1);
  // Erguido, passa por cima; ao pousar em cima de outro, os dois se afastam.
  const mao = obj({ id: "m", x: 0.5, arrastando: true, h: 1 });
  const c = obj({ id: "c", x: 0.52 });
  for (let i = 0; i < 10; i++) passo([mao, c], { proporcao: 1, alvo: { x: 0.5, y: 0.5 } });
  assert.ok(Math.abs(c.x - 0.52) < 1e-9, "não empurra enquanto está no ar");
  mao.arrastando = false;
  for (let i = 0; i < 200; i++) passo([mao, c], { proporcao: 1 });
  assert.ok(Math.abs(c.x - mao.x) > 0.1, "afasta depois de pousar");
});

test("ninguém sai da mesa", () => {
  const o = obj({ x: 0.99, vx: 0.2 });
  passo([o], { proporcao: 1.6 });
  assert.ok(o.x <= 1 - o.raio + 1e-9);
});

test("vaga na bandeja cai dentro dela e longe dos que já estão lá", () => {
  const l = layoutDaMesa(900);
  const ocupado = obj({ x: l.bandeja.x, y: l.bandeja.y });
  const v = vagaNaBandeja([ocupado], l.bandeja, 0.06, 1.6);
  assert.ok(dentroDaBandeja(v, l.bandeja));
  assert.ok(Math.hypot(v.x - ocupado.x, v.y - ocupado.y) > 0.05);
});
