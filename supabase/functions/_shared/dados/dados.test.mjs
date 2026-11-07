import test from "node:test";
import assert from "node:assert/strict";
import { CLINICAL_ARCHETYPES } from "../../../../src/data/randomClinicalScenarios.js";
import { ARQUETIPOS } from "./arquetipos.js";
import { TEMAS } from "./temas.js";
import { CODIGOS_NANDA } from "./nanda-codigos.js";
import { PERSONALIDADES, IDS_SORTEAVEIS, resolverPersonalidade, tendenciasEmTexto } from "./personalidades.js";
import { nomeBloqueado } from "./bloqueioNomes.js";
import { nomeFicticio } from "./nomes.js";
import { EXAMES_POR_ESPECIALIDADE, EXAMES_ROTULOS, setorDe } from "./examesPorEspecialidade.js";

test("o export dos arquétipos bate com a fonte (rode scripts/consulta/exportar-arquetipos.mjs se falhar)", () => {
  assert.deepEqual(ARQUETIPOS.map((a) => a.id), CLINICAL_ARCHETYPES.map((a) => a.id));
  for (const fonte of CLINICAL_ARCHETYPES) {
    const a = ARQUETIPOS.find((x) => x.id === fonte.id);
    for (const campo of ["specialty", "disease", "anamnesis", "medicalHistory", "medications", "allergies", "notes"]) assert.equal(a[campo], fonte[campo], `${fonte.id}.${campo}`);
    assert.deepEqual(a.vitals, fonte.vitals);
    assert.deepEqual(a.ageRange, fonte.ageRange);
  }
});

test("todo arquétipo tem de 4 a 12 candidatos NANDA e todos os códigos existem", () => {
  for (const a of ARQUETIPOS) {
    assert.ok(a.nandaCandidatos.length >= 4 && a.nandaCandidatos.length <= 12, `${a.id}: ${a.nandaCandidatos.length}`);
    for (const c of a.nandaCandidatos) assert.ok(CODIGOS_NANDA.has(c.codigo), `${a.id}: ${c.codigo}`);
  }
});

test("temas cobrem todos os arquétipos, sem repetir, e só citam ids existentes", () => {
  const ids = TEMAS.flatMap((t) => t.arquetipos);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual([...ids].sort(), ARQUETIPOS.map((a) => a.id).sort());
});

test("todo arquétipo tem exames, rótulo de exame e setor", () => {
  for (const a of ARQUETIPOS) {
    const exames = EXAMES_POR_ESPECIALIDADE[a.specialty];
    assert.ok(exames?.length, a.specialty);
    for (const e of exames) assert.ok(EXAMES_ROTULOS[e], e);
    assert.match(setorDe(a.specialty), /Leito 7$/);
  }
});

test("personalidades: 8, ids únicos, campos do C6 e tendências de 0 a 1", () => {
  assert.equal(PERSONALIDADES.length, 8);
  assert.equal(new Set(PERSONALIDADES.map((p) => p.id)).size, 8);
  for (const p of PERSONALIDADES) {
    assert.ok(p.confiancaInicial >= 0 && p.confiancaInicial <= 100);
    for (const v of Object.values(p.tendencias)) assert.ok(v >= 0 && v <= 1);
    if (p.id !== "surpresa") assert.ok(p.tracos.length && p.gatilhosPositivos.length && p.gatilhosNegativos.length, p.id);
  }
});

test("surpresa vira uma personalidade real e nunca ela mesma", () => {
  assert.equal(IDS_SORTEAVEIS.length, 7);
  for (let i = 0; i < 20; i++) assert.notEqual(resolverPersonalidade("surpresa", i / 20).id, "surpresa");
  assert.equal(resolverPersonalidade("surpresa", 0).id, IDS_SORTEAVEIS[0]);
  assert.equal(resolverPersonalidade("surpresa", 0.999).id, IDS_SORTEAVEIS.at(-1));
  assert.equal(resolverPersonalidade("desconfiado").id, "desconfiado");
});

test("tendenciasEmTexto descreve só o que passa de 0,3", () => {
  assert.match(tendenciasEmTexto({ minimiza: 0.8, esquece: 0, confunde: 0, mente: 0 }), /minimizar/);
  assert.doesNotMatch(tendenciasEmTexto({ minimiza: 0.8, esquece: 0, confunde: 0, mente: 0 }), /esquece/);
  assert.equal(tendenciasEmTexto({ minimiza: 0, esquece: 0, confunde: 0, mente: 0 }), "Sem tendências marcantes.");
});

test("lista de bloqueio de nomes ignora acento e caixa", () => {
  assert.equal(nomeBloqueado("Neymar da Silva"), true);
  assert.equal(nomeBloqueado("Pelé"), true);
  assert.equal(nomeBloqueado("Faustão Souza"), true);
  assert.equal(nomeBloqueado("Silvio Santos"), true);
  assert.equal(nomeBloqueado(""), true);
  assert.equal(nomeBloqueado("Maria Aparecida Lima"), false);
  assert.equal(nomeBloqueado("Gilberto Costa"), false);
});

test("nomeFicticio respeita o sexo e o sorteio", () => {
  assert.equal(nomeFicticio("F", 0, 0), "Maria Silva");
  assert.equal(nomeFicticio("M", 0, 0), "João Silva");
  assert.equal(nomeBloqueado(nomeFicticio("M", 0.5, 0.5)), false);
});
