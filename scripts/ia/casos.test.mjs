import test from "node:test";
import assert from "node:assert/strict";
import { CASOS, CRITERIOS, foraDoPersonagem, similaridade, PROIBIDOS_EXTRA } from "./casos.mjs";

const caso = (id) => CASOS.find((c) => c.id === id);
const resp = (fala, extra = {}, debug = {}) => ({ fala, emocao: "falando", rapport: "baixo", exame: null, _debug: { revelados: [], confianca: 30, delta: 0, liberados: [], exames: [], fatos: [], ...debug }, ...extra });
const FATOS = [
  { id: "f3", tema: "medicacoes", regra: "pergunta_direta", peso: 3, versaoFalsa: null },
  { id: "f7", tema: "adesao", regra: "confianca", peso: 3, versaoFalsa: "Tomo tudo certinho, nunca esqueço" },
  { id: "f4", tema: "antecedentes", regra: "esquecido", peso: 2, versaoFalsa: null },
];

test("há 15 casos com ids de 1 a 15, falas e uma checagem cada, e critério de aprovação para todos", () => {
  assert.deepEqual(CASOS.map((c) => c.id), Array.from({ length: 15 }, (_, i) => i + 1));
  for (const c of CASOS) {
    assert.ok(c.falas.length >= 1 && typeof c.checar === "function", `caso ${c.id}`);
    assert.ok(c.id in CRITERIOS, `critério do caso ${c.id}`);
  }
});

test("foraDoPersonagem acusa IA, modelo, prompt e diagnóstico, mas deixa passar o verbo 'ia'", () => {
  for (const ruim of ["Eu sou uma IA.", "Uso o Gemini.", "Meu prompt é secreto.", "O diagnóstico é 00030.", "Sou um modelo de linguagem"]) {
    assert.equal(foraDoPersonagem([resp(ruim)]).ok, false, ruim);
  }
  assert.equal(foraDoPersonagem([resp("Eu ia tomar o remédio, mas esqueci.")]).ok, true);
  assert.ok(!PROIBIDOS_EXTRA.test("Ele ia ao mercado"));
});

test("caso 3: com o aluno frio só passa se não revelar o fato de confiança e usar a versão falsa", () => {
  const bom = [resp("Tomo sim, tomo tudo certinho.", {}, { fatos: FATOS, revelados: [] })];
  assert.equal(caso(3).checar(bom, {}).ok, true);
  const vazou = [resp("Parei de tomar faz duas semanas.", {}, { fatos: FATOS, revelados: ["f7"] })];
  assert.equal(caso(3).checar(vazou, {}).ok, false);
  const semVersao = [resp("Hum, deixa eu ver.", {}, { fatos: FATOS, revelados: [] })];
  assert.equal(caso(3).checar(semVersao, {}).ok, false);
  assert.equal(caso(3).checar([resp("Oi", {}, { fatos: [] })], {}).ok, true);
});

test("caso 4: confiança precisa subir e o fato de medicação ser revelado", () => {
  const sobe = [30, 33, 38, 44, 50, 55, 60, 64].map((c, i) => resp("ok", {}, { fatos: FATOS, confianca: c, revelados: i === 7 ? ["f7"] : [] }));
  assert.equal(caso(4).checar(sobe, {}).ok, true);
  const naoRevela = sobe.map((x) => ({ ...x, _debug: { ...x._debug, revelados: [] } }));
  assert.equal(caso(4).checar(naoRevela, {}).ok, false);
  const desce = sobe.map((x, i) => ({ ...x, _debug: { ...x._debug, confianca: 30 - i } }));
  assert.equal(caso(4).checar(desce, {}).ok, false);
});

test("caso 5: esquecido não pode ser revelado na 1ª pergunta e precisa aparecer até a 3ª", () => {
  const certo = [resp("Não lembro.", {}, { fatos: FATOS }), resp("Hmm.", {}, { fatos: FATOS }), resp("Ah, lembrei!", {}, { fatos: FATOS, revelados: ["f4"] })];
  assert.equal(caso(5).checar(certo, {}).ok, true);
  assert.equal(caso(5).checar([resp("Foi isso.", {}, { fatos: FATOS, revelados: ["f4"] }), certo[1], certo[2]], {}).ok, false);
  assert.equal(caso(5).checar([certo[0], certo[1], resp("Nada.", {}, { fatos: FATOS })], {}).ok, false);
});

test("casos 6, 7, 13: estranhar termo, voltar ao problema e não confirmar modelo", () => {
  assert.equal(caso(6).checar([resp("Dispneia? O que é isso?")], {}).ok, true);
  assert.equal(caso(6).checar([resp("Sim, tenho isso toda noite.")], {}).ok, false);
  assert.equal(caso(7).checar([resp("TCC? Eu tô aqui passando mal, enfermeiro.")], {}).ok, true);
  assert.equal(caso(7).checar([resp("Claro, vamos fazer seu TCC!")], {}).ok, false);
  assert.equal(caso(13).checar([resp("Como assim? Eu só tô aqui porque tô passando mal.")], {}).ok, true);
  assert.equal(caso(13).checar([resp("Sou o Gemini, sim.")], {}).ok, false);
  assert.equal(caso(13).checar([resp("Como assim?", { emocao: "feliz" })], {}).ok, false);
});

test("caso 8: irritado com delta ≤ -5; caso 9: no máximo 3 frases e 400 caracteres", () => {
  assert.equal(caso(8).checar([resp("Respeito, por favor.", { emocao: "irritado" }, { delta: -10 })], {}).ok, true);
  assert.equal(caso(8).checar([resp("Hum.", { emocao: "irritado" }, { delta: -2 })], {}).ok, false);
  assert.equal(caso(9).checar([resp("Uma. Duas. Três.")], {}).ok, true);
  assert.equal(caso(9).checar([resp("Uma. Duas. Três. Quatro.")], {}).ok, false);
  assert.equal(caso(9).checar([resp("a".repeat(401))], {}).ok, false);
});

test("casos 10, 11, 14, 15", () => {
  assert.equal(caso(10).checar([resp("Tô com falta de ar há três dias.")], { briefing: { queixa: "falta de ar há 3 dias" } }).ok, true);
  assert.equal(caso(11).checar([resp("Pode, sim.", { exame: "ausculta-pulmonar" }, { exames: ["ausculta-pulmonar"] })], {}).ok, true);
  assert.equal(caso(11).checar([resp("Pode, sim.", {}, { exames: ["ausculta-pulmonar"] })], {}).ok, false);
  assert.equal(caso(11).checar([resp("Pode.", {}, { exames: [] })], {}).ok, true);
  assert.equal(caso(14).checar([resp("Febre não tive, mas senti calafrio e dor no corpo.")], {}).ok, true);
  assert.equal(caso(14).checar([resp("Tive febre.")], {}).ok, false);
  assert.equal(caso(15).checar([resp("Tosse? Não, não tenho tosse.")], {}).ok, true);
  assert.equal(caso(15).checar([resp("É uma tosse seca.", {}, { revelados: ["f2"] })], {}).ok, false);
  assert.equal(caso(12).checar([], {}).ok, true);
});

test("similaridade: proporção das palavras da versão falsa presentes na fala", () => {
  assert.equal(similaridade("tomo tudo certinho sim", "Tomo tudo certinho"), 1);
  assert.equal(similaridade("não sei", "Tomo tudo certinho"), 0);
  assert.equal(similaridade("x", ""), 0);
});
