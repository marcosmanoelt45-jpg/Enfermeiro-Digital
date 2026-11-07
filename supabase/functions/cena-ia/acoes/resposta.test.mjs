import test from "node:test";
import assert from "node:assert/strict";
import { montarResposta } from "./resposta.ts";

const dados = { fala: "oi", rapport: "baixo", _debug: { revelados: ["f1"], confianca: 33, liberados: ["f1"] } };

test("sem CENA_IA_DEBUG (produção) o _debug nunca sai", () => {
  assert.deepEqual(montarResposta({}, dados), { fala: "oi", rapport: "baixo" });
  assert.deepEqual(montarResposta({ CENA_IA_DEBUG: undefined }, dados), { fala: "oi", rapport: "baixo" });
});

test("só o valor exatamente '1' liga o debug", () => {
  for (const v of ["0", "true", "", "yes", "01", " 1"]) assert.ok(!("_debug" in montarResposta({ CENA_IA_DEBUG: v }, dados)), JSON.stringify(v));
  assert.deepEqual(montarResposta({ CENA_IA_DEBUG: "1" }, dados)._debug, dados._debug);
});

test("sem _debug nos dados, nada é acrescentado", () => {
  assert.deepEqual(montarResposta({ CENA_IA_DEBUG: "1" }, { fala: "oi" }), { fala: "oi" });
});
