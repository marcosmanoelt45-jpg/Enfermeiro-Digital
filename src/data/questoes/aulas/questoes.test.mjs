import { test } from "node:test";
import assert from "node:assert/strict";
import { QUESTOES_CRUAS, QUESTOES_AULAS } from "./index.js";
import { TOPICOS_PRATICA } from "../temas.js";

test("questões das aulas: estrutura completa e ids únicos", () => {
  const ids = new Set();
  const temas = new Set(TOPICOS_PRATICA.map((t) => t.id));
  for (const q of QUESTOES_CRUAS) {
    assert.ok(!ids.has(q.id), `id repetido: ${q.id}`);
    ids.add(q.id);
    assert.ok(q.p && q.dica && q.exp && q.fonte, `campos faltando em ${q.id}`);
    assert.ok(q.o.length >= 4 && q.o.length <= 5, `alternativas em ${q.id}`);
    assert.equal(q.por.length, q.o.length, `explicações por alternativa em ${q.id}`);
    assert.ok(q.c >= 0 && q.c < q.o.length, `gabarito em ${q.id}`);
    assert.equal(new Set(q.o).size, q.o.length, `alternativa repetida em ${q.id}`);
    assert.ok(temas.has(q.cat), `tema desconhecido em ${q.id}: ${q.cat}`);
  }
  assert.ok(QUESTOES_AULAS.length >= 90);
});

test("formato normalizado igual ao do banco antigo", () => {
  const q = QUESTOES_AULAS[0];
  assert.equal(q.explicacaoAlternativas.length, q.opcoes.length);
  assert.equal(q.explicacaoAlternativas[q.correta].isCorreta, true);
  assert.match(q.explicacaoGeral, /Fonte:/);
});
