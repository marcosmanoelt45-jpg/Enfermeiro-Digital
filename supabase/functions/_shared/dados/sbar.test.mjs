import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { conteudoDoArquivo } from "../../../../scripts/plantao/exportar-cenarios.mjs";
import { CENARIOS_PLANTAO, buscarCenarioPlantao } from "./sbar.js";

test("a cópia do servidor está sincronizada com os cenários originais (rode scripts/plantao/exportar-cenarios.mjs)", () => {
  const atual = fs.readFileSync(new URL("./sbar.js", import.meta.url), "utf8").replaceAll("\r\n", "\n");
  assert.equal(atual, conteudoDoArquivo());
});

test("a cópia do servidor não leva o gabarito de tela das lacunas", () => {
  assert.equal(CENARIOS_PLANTAO.length, 20);
  for (const c of CENARIOS_PLANTAO) for (const l of c.lacunas) assert.equal(l.exame, undefined, `${c.id}.${l.campo}`);
});

test("buscarCenarioPlantao acha por id e devolve null se não existe", () => {
  assert.equal(buscarCenarioPlantao("icc").id, "icc");
  assert.equal(buscarCenarioPlantao("nao_existe"), null);
});
