import test from "node:test";
import assert from "node:assert/strict";
import { notaTexto, contarNumeros, completude, penalidadeDeLacunas, notaDaLetra, notaGeral, calcularNotas, PENALIDADE_POR_LACUNA } from "./pontuacaoPlantao.js";

const cenario = {
  perguntas: [
    { id: "p.s1", letra: "S", texto: "Quem?" },
    { id: "p.b1", letra: "B", texto: "Alergia?" },
    { id: "p.a1", letra: "A", texto: "Sinais?" },
    { id: "p.a2", letra: "A", texto: "Abdome?", dependeDe: "abdome" },
    { id: "p.r1", letra: "R", texto: "Vigiar?" },
  ],
  elementosChave: {
    S: ["identificação", "leito", "motivo"],
    B: ["alergias", "doenças de base", "uso de medicação"],
    A: ["sinais vitais", "dor", "dreno"],
    R: ["vigiar o dreno", "analgesia às 20h", "exame pendente"],
  },
};
const respostas = [
  { perguntaId: "p.s1", letra: "S", texto: "Paciente M.S.L., 58 anos, no leito 12-A, colectomia por diverticulite" },
  { perguntaId: "p.b1", letra: "B", texto: "Sem alergias, hipertenso usando losartana" },
  { perguntaId: "p.a1", letra: "A", texto: "PA 115 por 72, FC 84, saturando 98", conferenciaNumerica: { pa_sistolica: "ok", fc: "ok", sat: "errado", tax: "nao_informado" } },
  { perguntaId: "p.a2", letra: "A", texto: "abdome flácido", semAvaliacao: true },
  { perguntaId: "p.r1", letra: "R", texto: "vigiar o dreno a cada 4 horas e dar analgesia às 20h" },
];
const lacunas = { abdome: { avaliada: false } };
const el = (nome, presente, trecho) => ({ elemento: nome, presente, trecho });
const ia = () => ({
  S: { elementos: [el("identificação", true, "Paciente M.S.L., 58 anos"), el("leito", true, "no leito 12-A"), el("motivo", true, "colectomia por diverticulite")], clareza: 2, faltou: "" },
  B: { elementos: [el("alergias", true, "Sem alergias"), el("doenças de base", true, "hipertenso"), el("uso de medicação", true, "usando losartana")], clareza: 2, faltou: "" },
  A: { elementos: [el("sinais vitais", true, "PA 115 por 72"), el("dor", false, ""), el("dreno", false, "")], clareza: 1, faltou: "dor e dreno" },
  R: { elementos: [el("vigiar o dreno", true, "vigiar o dreno a cada 4 horas"), el("analgesia às 20h", true, "analgesia às 20h"), el("exame pendente", false, "")], clareza: 1, faltou: "exame" },
});

test("notaTexto: presença × clareza, no máximo 100", () => {
  const todos = [{ presente: true }, { presente: true }];
  assert.equal(notaTexto({ elementos: todos, clareza: 2 }), 100);
  assert.equal(notaTexto({ elementos: todos, clareza: 1 }), 90);
  assert.equal(notaTexto({ elementos: todos, clareza: 0 }), 80);
  assert.equal(notaTexto({ elementos: [{ presente: true }, { presente: false }], clareza: 2 }), 50);
  assert.equal(notaTexto({ elementos: [{ presente: false }], clareza: 2 }), 0);
  assert.equal(notaTexto({ elementos: [], clareza: 2 }), null);
  assert.equal(notaTexto({ elementos: todos, clareza: 9 }), 90); // clareza inválida vira 1
});

test("contarNumeros: só 'ok' conta; errado e não informado entram no total", () => {
  assert.deepEqual(contarNumeros(respostas.filter((r) => r.letra === "A")), { ok: 2, total: 4 });
  assert.deepEqual(contarNumeros([]), { ok: 0, total: 0 });
});

test("completude e penalidade das lacunas", () => {
  const A = cenario.perguntas.filter((p) => p.letra === "A");
  assert.equal(completude(A, respostas.filter((r) => r.letra === "A")), 50); // a2 é sem avaliação
  assert.equal(completude([], []), 0);
  assert.equal(completude(cenario.perguntas.filter((p) => p.letra === "S"), [{ perguntaId: "p.s1", texto: "sim" }]), 0); // menos de 3 palavras
  assert.equal(penalidadeDeLacunas(A, lacunas), PENALIDADE_POR_LACUNA);
  assert.equal(penalidadeDeLacunas(A, { abdome: { avaliada: true } }), 0);
  assert.equal(penalidadeDeLacunas(cenario.perguntas.filter((p) => p.letra === "S"), lacunas), 0);
});

test("notaDaLetra: com IA combina 50/50; sem IA vale o código; lacuna não zera abaixo de 0", () => {
  assert.deepEqual(notaDaLetra({ texto: 100, numeros: { ok: 1, total: 2 }, completude: 100, penalidade: 0 }), { nota: 75, codigo: 50 });
  assert.deepEqual(notaDaLetra({ texto: null, numeros: { ok: 1, total: 2 }, completude: 100, penalidade: 0 }), { nota: 50, codigo: 50 });
  // sem números, o código usa o texto
  assert.deepEqual(notaDaLetra({ texto: 80, numeros: { ok: 0, total: 0 }, completude: 100, penalidade: 20 }), { nota: 70, codigo: 60 });
  // sem números e sem IA, o código usa a completude
  assert.deepEqual(notaDaLetra({ texto: null, numeros: { ok: 0, total: 0 }, completude: 66, penalidade: 20 }), { nota: 46, codigo: 46 });
  assert.equal(notaDaLetra({ texto: null, numeros: { ok: 0, total: 2 }, completude: 0, penalidade: 40 }).nota, 0);
});

test("notaGeral é a média das 4 letras", () => {
  assert.equal(notaGeral({ S: 100, B: 80, A: 60, R: 40 }), 70);
  assert.equal(notaGeral({ S: 0, B: 0, A: 0, R: 1 }), 0);
});

test("calcularNotas com IA: letras, citações válidas e penalidade de lacuna", () => {
  const r = calcularNotas({ cenario, respostas, lacunas, avaliacaoIA: ia() });
  assert.equal(r.iaUsada, true);
  assert.equal(r.citacoesInvalidas, 0);
  assert.equal(r.letras.S.texto, 100);
  assert.equal(r.letras.S.nota, 100); // sem números: código = texto
  assert.equal(r.letras.A.numeros.ok, 2);
  assert.equal(r.letras.A.penalidade, 20);
  // A: texto = 1/3 × 0.9 = 30; código = 50 − 20 = 30; nota = 30
  assert.equal(r.letras.A.texto, 30);
  assert.equal(r.letras.A.nota, 30);
  assert.equal(r.notas.geral, Math.round((r.notas.S + r.notas.B + r.notas.A + r.notas.R) / 4));
  assert.equal(r.letras.R.elementos.find((e) => e.elemento === "exame pendente").presente, false);
});

test("citação inventada derruba a presença do elemento", () => {
  const falsa = ia();
  falsa.B.elementos[0] = el("alergias", true, "alérgico a dipirona e iodo");
  const r = calcularNotas({ cenario, respostas, lacunas, avaliacaoIA: falsa });
  assert.equal(r.citacoesInvalidas, 1);
  const e = r.letras.B.elementos.find((x) => x.elemento === "alergias");
  assert.equal(e.presente, false);
  assert.equal(e.trecho, "");
  assert.equal(r.letras.B.texto, Math.round(100 * (2 / 3) * 1.0)); // 2 de 3, clareza 2
});

test("elementos devolvidos fora de ordem ou com nome diferente ainda casam", () => {
  const embaralhada = ia();
  embaralhada.S.elementos = [...embaralhada.S.elementos].reverse();
  assert.equal(calcularNotas({ cenario, respostas, lacunas, avaliacaoIA: embaralhada }).letras.S.texto, 100);
  const semNome = ia();
  semNome.S.elementos = semNome.S.elementos.map((e) => ({ ...e, elemento: "x" }));
  assert.equal(calcularNotas({ cenario, respostas, lacunas, avaliacaoIA: semNome }).letras.S.texto, 100); // casa por posição
});

test("sem IA: tudo sai por código e a avaliação é marcada como não usada", () => {
  const r = calcularNotas({ cenario, respostas, lacunas, avaliacaoIA: null });
  assert.equal(r.iaUsada, false);
  assert.equal(r.letrasSemIA, 4);
  assert.equal(r.letras.S.texto, null);
  assert.equal(r.letras.S.nota, 100); // 1 de 1 pergunta respondida
  assert.equal(r.letras.A.nota, 30); // 2 de 4 números certos = 50, menos 20 da lacuna
  assert.deepEqual(r.letras.S.elementos, []);
});

test("IA que devolve só algumas letras: as outras caem para o código", () => {
  const parcial = { S: ia().S };
  const r = calcularNotas({ cenario, respostas, lacunas, avaliacaoIA: parcial });
  assert.equal(r.iaUsada, true);
  assert.equal(r.letrasSemIA, 3);
  assert.equal(r.letras.B.texto, null);
});
