import { test } from "node:test";
import assert from "node:assert/strict";
import { gerarCodigo, codigoValido, ofensivaJuntos, ordenarPodio, textoDoConvite, linkWhatsApp } from "./logicaSocial.js";

test("código de convite no formato da tabela", () => {
  for (let i = 0; i < 50; i++) assert.ok(codigoValido(gerarCodigo()));
  assert.ok(!codigoValido("ABC"));
  assert.ok(!codigoValido("ABCDEFG0"));
});

test("ofensiva juntos conta só os dias em que os dois estudaram", () => {
  const hoje = new Date(2026, 10, 12);
  const a = ["2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12"];
  const b = ["2026-11-10", "2026-11-11", "2026-11-12"];
  assert.equal(ofensivaJuntos(a, b, hoje), 3);
  // hoje só um estudou: conta até ontem
  assert.equal(ofensivaJuntos(a, ["2026-11-10", "2026-11-11"], hoje), 2);
  assert.equal(ofensivaJuntos(a, ["2026-11-01"], hoje), 0);
});

test("pódio ordena, empata e ignora PE de outra semana", () => {
  const p = ordenarPodio(
    [
      { nome: "Ana", ofensiva: 10, pe_semana: 50, semana: "2026-W46" },
      { nome: "Bia", ofensiva: 10, pe_semana: 90, semana: "2026-W45" },
      { nome: "Caio", ofensiva: 3, pe_semana: 70, semana: "2026-W46" },
    ],
    "pe_semana",
    "2026-W46"
  );
  assert.deepEqual(p.map((x) => [x.nome, x.valor, x.posicao]), [["Caio", 70, 1], ["Ana", 50, 2], ["Bia", 0, 3]]);
  const o = ordenarPodio([{ nome: "Bia", ofensiva: 5 }, { nome: "Ana", ofensiva: 5 }, { nome: "Caio", ofensiva: 1 }]);
  assert.deepEqual(o.map((x) => [x.nome, x.posicao]), [["Ana", 1], ["Bia", 1], ["Caio", 3]]);
});

test("texto e link do WhatsApp", () => {
  const t = textoDoConvite("Marcos Silva", "https://enfere.vercel.app/convite/ABCD2345");
  assert.match(t, /^Marcos te chamou/);
  assert.match(linkWhatsApp(t), /^https:\/\/wa\.me\/\?text=/);
});
