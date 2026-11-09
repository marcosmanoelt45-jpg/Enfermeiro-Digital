import { test } from "node:test";
import assert from "node:assert/strict";
import { montarCaso, gerador, somNoPonto, dentroDoPulmao, achadoDoTexto, avaliarAusculta, pontoMaisProximo } from "./ausculta.js";

test("crepitantes: ponto de melhor ausculta na base de um pulmão, nas costas", () => {
  const caso = montarCaso("crepitantes_finos", { rng: gerador(3), vistas: ["costas"] });
  assert.equal(caso.pontos.length, 1);
  const p = caso.pontos[0];
  const campo = caso.pulmoes.costas.find((x) => x.lado === p.lado);
  assert.ok(p.y > campo.cy, "abaixo do meio do campo (base)");
  assert.ok(dentroDoPulmao(caso, "costas", p) > 0.5, "dentro do pulmão");
});

test("cada paciente tem anatomia um pouco diferente (semente muda o campo pulmonar)", () => {
  const a = montarCaso("normal", { rng: gerador(1) });
  const b = montarCaso("normal", { rng: gerador(99) });
  assert.notDeepEqual(a.pulmoes.costas[0], b.pulmoes.costas[0]);
});

test("som: no ponto máximo é nítido e marca; na coluna é abafado e sem o ruído", () => {
  const caso = montarCaso("crepitantes_finos", { rng: gerador(5) });
  const p = caso.pontos[0];
  const aqui = somNoPonto(caso, "costas", p);
  assert.equal(aqui.tipo, "crepitantes_finos");
  assert.equal(aqui.noMaximo, true);
  assert.ok(aqui.qualidade > 0.8);
  const coluna = somNoPonto(caso, "costas", { x: 448, y: 1000 });
  assert.equal(coluna.noMaximo, false);
  assert.ok(coluna.qualidade < 0.3);
});

test("sibilos nos dois lados; roncos perto do centro", () => {
  const sib = montarCaso("sibilos", { rng: gerador(2) });
  assert.equal(sib.pontos.length, 2);
  const ron = montarCaso("roncos", { rng: gerador(2) });
  assert.ok(Math.abs(ron.pontos[0].x - 448) < 90);
  assert.equal(pontoMaisProximo(ron, "frente", { x: 0, y: 0 }).ponto, null);
});

test("achado lido do texto do caso", () => {
  assert.equal(achadoDoTexto("crepitações finas em bases"), "crepitantes_finos");
  assert.equal(achadoDoTexto("sibilos expiratórios bilaterais e roncos esparsos"), "sibilos");
  assert.equal(achadoDoTexto("sem estridor, murmúrio vesicular livre e sem sibilos"), "normal");
  assert.equal(achadoDoTexto("estertores bolhosos"), "crepitantes_grossos");
});

test("avaliação: acerta o ruído (finos e grossos valem como crepitantes) e diz se achou o ponto", () => {
  const def = { ausculta: { achado: "crepitantes_finos" } };
  const certo = avaliarAusculta(def, { achouPonto: true, ruido: "crepitantes_grossos" });
  assert.equal(certo.concluido, true);
  assert.equal(certo.achouPonto, true);
  assert.equal(avaliarAusculta(def, { achouPonto: false, ruido: "sibilos" }).concluido, false);
});
