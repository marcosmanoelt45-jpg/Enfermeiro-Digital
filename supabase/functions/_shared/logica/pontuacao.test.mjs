import test from "node:test";
import assert from "node:assert/strict";
import { notaAnamnese, notaSeguranca, segurancaDaSessao, notaComunicacao, notaIaRaciocinio, classificarDiagnosticos, notaRaciocinio, notaGeral, motivoNaoRevelado, citacaoValida, limparCitacoes } from "./pontuacao.js";

const fatos = [
  { id: "f1", tema: "hda", peso: 2 },
  { id: "f2", tema: "alergias", peso: 3 },
  { id: "f3", tema: "medicacoes", peso: 3 },
  { id: "f4", tema: "habitos", peso: 1 },
  { id: "f5", tema: "adesao", peso: 2, revelacao: "confianca", confiancaMin: 60 },
];

test("anamnese: 0 fatos = 0, todos = 100, e os pesos contam", () => {
  assert.equal(notaAnamnese(fatos, []), 0);
  assert.equal(notaAnamnese(fatos, fatos.map((f) => f.id)), 100);
  assert.equal(notaAnamnese(fatos, ["f2"]), 27); // 3 de 11
  assert.equal(notaAnamnese(fatos, ["f4"]), 9); // 1 de 11: peso 1 vale menos que peso 3
  assert.ok(notaAnamnese(fatos, ["f2"]) > notaAnamnese(fatos, ["f4"]));
  assert.equal(notaAnamnese([], ["f1"]), 0);
});

test("segurança: as combinações de 40 + 40 + 20", () => {
  assert.equal(notaSeguranca({}), 0);
  assert.equal(notaSeguranca({ alergias: true }), 40);
  assert.equal(notaSeguranca({ medicacoes: true }), 40);
  assert.equal(notaSeguranca({ identificou: true }), 20);
  assert.equal(notaSeguranca({ alergias: true, medicacoes: true }), 80);
  assert.equal(notaSeguranca({ alergias: true, medicacoes: true, identificou: true }), 100);
  assert.equal(notaSeguranca({ alergias: true, identificou: true }), 60);
});

test("segurança da sessão: alergias, medicações (ou adesão) revelados e identificação perguntada", () => {
  assert.deepEqual(segurancaDaSessao(fatos, ["f2", "f5"], { identificacao: 1 }), { identificou: true, alergias: true, medicacoes: true });
  assert.deepEqual(segurancaDaSessao(fatos, [], {}), { identificou: false, alergias: false, medicacoes: false });
  assert.equal(segurancaDaSessao(fatos, ["f3"], {}).medicacoes, true);
});

test("comunicação e nota da IA no raciocínio", () => {
  const oito = (n) => Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`c${i}`, { nota: n }]));
  assert.equal(notaComunicacao(oito(2)), 100);
  assert.equal(notaComunicacao(oito(0)), 0);
  assert.equal(notaComunicacao(oito(1)), 50);
  assert.equal(notaIaRaciocinio({ a: { nota: 2 }, b: { nota: 1 }, c: { nota: 0 } }), 50);
  assert.equal(notaComunicacao({}), 0);
});

test("diagnósticos: certos, faltando, extras e extras sem relação", () => {
  const r = classificarDiagnosticos({ esperados: ["A", "B"], escolhidos: ["A", "C", "D", "A"], candidatos: ["A", "B", "C"] });
  assert.deepEqual(r, { certos: ["A"], faltando: ["B"], extras: ["C", "D"], extrasSemRelacao: ["D"] });
  assert.deepEqual(classificarDiagnosticos({ esperados: ["A"], escolhidos: [] }).faltando, ["A"]);
});

test("raciocínio: 70% código + 30% IA, penalidade por extra sem relação, nunca negativo", () => {
  assert.equal(notaRaciocinio({ certos: 2, esperados: 2, notaIA: 100 }), 100);
  assert.equal(notaRaciocinio({ certos: 1, esperados: 2, notaIA: 50 }), 50); // 35 + 15
  assert.equal(notaRaciocinio({ certos: 2, esperados: 2, notaIA: 100, extrasSemRelacao: 2 }), 80);
  assert.equal(notaRaciocinio({ certos: 0, esperados: 3, notaIA: 0, extrasSemRelacao: 4 }), 0);
  assert.equal(notaRaciocinio({ certos: 1, esperados: 0, notaIA: 80 }), 24);
  assert.equal(notaRaciocinio({ certos: 1, esperados: 2, notaIA: null }), 50);
});

test("geral: 0,35 / 0,25 / 0,2 / 0,2 arredondado; sem comunicação renormaliza", () => {
  assert.equal(notaGeral({ anamnese: 100, comunicacao: 100, seguranca: 100, raciocinio: 100 }), 100);
  assert.equal(notaGeral({ anamnese: 0, comunicacao: 0, seguranca: 0, raciocinio: 0 }), 0);
  assert.equal(notaGeral({ anamnese: 80, comunicacao: 60, seguranca: 100, raciocinio: 50 }), 73); // 28 + 15 + 20 + 10
  assert.equal(notaGeral({ anamnese: 80, seguranca: 100, raciocinio: 50 }), 77); // (28+20+10)/0,75
  assert.equal(notaGeral({ anamnese: 100, seguranca: 100, raciocinio: 100 }), 100);
});

test("motivo de um fato escondido, gerado por código", () => {
  const conf = { tema: "adesao", revelacao: "confianca", confiancaMin: 60 };
  assert.match(motivoNaoRevelado(conf, { confiancaFinal: 45 }), /chegou a 45, eram necessários 60/);
  assert.match(motivoNaoRevelado(conf, { confiancaFinal: 70, contagemTemas: {} }), /Você não perguntou sobre como toma os remédios/);
  assert.match(motivoNaoRevelado(conf, { confiancaFinal: 70, contagemTemas: { adesao: 1 } }), /não foi específica/);
  const esq = { tema: "alergias", revelacao: "esquecido" };
  assert.match(motivoNaoRevelado(esq, { confiancaFinal: 50, contagemTemas: { alergias: 1 } }), /insistir.*outra fonte/);
  assert.match(motivoNaoRevelado(esq, { confiancaFinal: 50, contagemTemas: { alergias: 2 } }), /faltou perguntar de novo/);
  assert.match(motivoNaoRevelado({ tema: "medicacoes", revelacao: "pergunta_direta" }, { confiancaFinal: 50 }), /Você não perguntou sobre medicações/);
});

const turnos = [
  { ordem: 1, autor: "aluno", texto: "Bom dia, eu sou o enfermeiro João.  Como o senhor está?" },
  { ordem: 2, autor: "paciente", texto: "Tô cansado." },
  { ordem: 3, autor: "aluno", texto: "Entendo. Isso deve ser difícil para você." },
];

test("citação só vale se for do aluno e estiver no texto do turno (sem acento, caixa ou espaço duplo)", () => {
  assert.equal(citacaoValida(turnos, 1, "eu sou o enfermeiro joão"), true);
  assert.equal(citacaoValida(turnos, 1, "EU SOU O ENFERMEIRO JOAO."), true); // caixa, acento e pontuação do original
  assert.equal(citacaoValida(turnos, 1, "joao. como o senhor"), true);
  assert.equal(citacaoValida(turnos, 1, "frase que não existe"), false);
  assert.equal(citacaoValida(turnos, 2, "tô cansado"), false); // fala do paciente
  assert.equal(citacaoValida(turnos, 99, "bom dia"), false);
  assert.equal(citacaoValida(turnos, 1, ""), false);
});

test("limparCitacoes remove as inventadas, mantém as notas e conta as ruins", () => {
  const av = {
    comunicacao: {
      apresentacao: { nota: 2, turno: 1, trecho: "eu sou o enfermeiro João" },
      empatia: { nota: 2, turno: 3, trecho: "isso deve ser muito pior" },
      linguagem: { nota: 0, turno: null, trecho: "" },
    },
    pontos_fortes: [{ turno: 1, trecho: "bom dia", porque: "x" }, { turno: 1, trecho: "inventado", porque: "y" }],
    melhorar: [{ turno: 3, trecho: "Entendo", sugestao: "s", porque: "p" }, { turno: 3, trecho: "falso", sugestao: "s2", porque: "p2" }],
  };
  const { avaliacao, total, invalidas } = limparCitacoes(av, turnos);
  assert.equal(avaliacao.comunicacao.apresentacao.trecho, "eu sou o enfermeiro João");
  assert.equal(avaliacao.comunicacao.empatia.nota, 2);
  assert.equal(avaliacao.comunicacao.empatia.trecho, "");
  assert.equal(avaliacao.comunicacao.empatia.turno, null);
  assert.deepEqual(avaliacao.pontos_fortes.map((p) => p.trecho), ["bom dia"]);
  assert.equal(avaliacao.melhorar[1].trecho, "");
  assert.equal(avaliacao.melhorar[1].sugestao, "s2");
  assert.equal(total, 6);
  assert.equal(invalidas, 3);
});
