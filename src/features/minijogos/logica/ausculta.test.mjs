import { test } from "node:test";
import assert from "node:assert/strict";
import { FOCOS, sequencia, qualidadeDoSom, ruidoNoFoco, achadoDoTexto, avaliarAusculta, dicaDeDirecao } from "./ausculta.js";

test("focos: frente tem 5 níveis e costas 9, sempre em par direito/esquerdo", () => {
  assert.equal(FOCOS.frente.length, 10);
  assert.equal(FOCOS.costas.length, 18);
  for (const v of ["frente", "costas"]) {
    const s = sequencia(v);
    assert.equal(s.length, FOCOS[v].length);
    // zigue-zague: nível 1 começa no direito, nível 2 no esquerdo
    assert.equal(s[0].lado, "direito");
    assert.equal(s[2].lado, "esquerdo");
  }
});

test("lado do paciente: na frente o direito fica à esquerda da tela; nas costas, à direita", () => {
  const f1 = FOCOS.frente.find((f) => f.id === "frente-1d");
  const c1 = FOCOS.costas.find((f) => f.id === "costas-1d");
  assert.ok(f1.x < 200);
  assert.ok(c1.x > 200);
});

test("som: perfeito em cima do foco, abafado longe", () => {
  assert.equal(qualidadeDoSom(0), 1);
  assert.ok(qualidadeDoSom(30) < 0.7);
  assert.equal(qualidadeDoSom(200), 0);
});

test("crepitantes só nas bases; sibilos e roncos em todos os focos", () => {
  const apice = FOCOS.costas.find((f) => f.nivel === 1);
  const base = FOCOS.costas.find((f) => f.nivel === 9);
  assert.equal(ruidoNoFoco("crepitantes_finos", apice), "normal");
  assert.equal(ruidoNoFoco("crepitantes_finos", base), "crepitantes_finos");
  assert.equal(ruidoNoFoco("sibilos", apice), "sibilos");
});

test("achado lido do texto do caso", () => {
  assert.equal(achadoDoTexto("crepitações finas em bases"), "crepitantes_finos");
  assert.equal(achadoDoTexto("sibilos expiratórios bilaterais e roncos esparsos"), "sibilos");
  assert.equal(achadoDoTexto("sem estridor, murmúrio vesicular livre e sem sibilos"), "normal");
  assert.equal(achadoDoTexto("estertores bolhosos"), "crepitantes_grossos");
});

test("avaliação: acerta o ruído (finos e grossos valem como crepitantes); errar dá dica", () => {
  const def = { ausculta: { achado: "crepitantes_finos" } };
  assert.equal(avaliarAusculta(def, { focosCertos: 18, ruido: "crepitantes_grossos" }).concluido, true);
  const r = avaliarAusculta(def, { focosCertos: 18, focosErros: 2, ruido: "sibilos" });
  assert.equal(r.concluido, false);
  assert.equal(r.erros, 3);
  assert.match(dicaDeDirecao({ x: 100, y: 100 }, { x: 140, y: 150 }), /cima/);
});
