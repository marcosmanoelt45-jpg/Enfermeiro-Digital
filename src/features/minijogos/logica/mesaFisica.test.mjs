import test from "node:test";
import assert from "node:assert/strict";
import { aplicarParede, dentroDaBandeja, emRepouso, fundoDa, haConflito, layoutDaMesa, passo, vagaNaBandeja, vagasIniciais } from "./mesaFisica.js";

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
  // O que está na mão empurra os outros (é arrastado pela mesa) e não é empurrado.
  const mao = obj({ id: "m", x: 0.5, arrastando: true, h: 1 });
  const c = obj({ id: "c", x: 0.52 });
  for (let i = 0; i < 20; i++) passo([mao, c], { proporcao: 1, alvo: { x: 0.5, y: 0.5 } });
  assert.ok(Math.abs(mao.x - 0.5) < 0.01);
  assert.ok(c.x - mao.x > 0.09, "afasta quem está encostado");
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

test("parede da bandeja: quem caiu dentro fica inteiro no fundo; quem está fora sai de cima da borda", () => {
  const l = layoutDaMesa(900);
  const b = l.bandeja;
  const f = fundoDa(b);
  // Solto quase na borda, por dentro.
  const dentro = obj({ x: b.x + b.w / 2 - 0.005, y: b.y, raio: l.lado / 2 });
  // Encostado por fora, invadindo a borda.
  const fora = obj({ id: "f", x: b.x - b.w / 2 - 0.01, y: b.y + 0.05, raio: l.lado / 2 });
  for (let i = 0; i < 120; i++) passo([dentro, fora], { proporcao: l.proporcao, bandeja: b });
  assert.ok(dentro.x + dentro.raio <= f.x + f.w / 2 + 1e-6, "inteiro dentro do fundo");
  assert.ok(dentroDaBandeja(dentro, b));
  assert.ok(fora.x + fora.raio <= b.x - b.w / 2 + 1e-6, "fora não fica em cima da borda");
  assert.equal(haConflito([dentro, fora], { proporcao: l.proporcao, bandeja: b }), false);
  assert.ok(emRepouso([dentro, fora], { proporcao: l.proporcao, bandeja: b }));
});

test("aplicarParede não mexe em quem já está bem", () => {
  const l = layoutDaMesa(900);
  const o = obj({ x: l.bandeja.x, y: l.bandeja.y, raio: l.lado / 2 });
  assert.deepEqual(aplicarParede(o, l.bandeja, l.proporcao), { x: o.x, y: o.y });
  const longe = obj({ x: 0.05, y: 0.1, raio: l.lado / 2 });
  assert.deepEqual(aplicarParede(longe, l.bandeja, l.proporcao), { x: 0.05, y: 0.1 });
});

test("dez objetos cabem no fundo da bandeja sem sobrar nada encostado", () => {
  const l = layoutDaMesa(900);
  const os = [];
  for (let i = 0; i < 10; i++) {
    const v = vagaNaBandeja(os, l.bandeja, l.lado / 2, l.proporcao);
    os.push(obj({ id: `o${i}`, ...v, raio: l.lado / 2 }));
  }
  for (let i = 0; i < 600; i++) passo(os, { proporcao: l.proporcao, bandeja: l.bandeja });
  assert.ok(os.every((o) => dentroDaBandeja(o, l.bandeja)));
});
