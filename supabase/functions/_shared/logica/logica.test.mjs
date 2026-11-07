import test from "node:test";
import assert from "node:assert/strict";
import { ARQUETIPOS } from "../dados/arquetipos.js";
import { CODIGOS_NANDA } from "../dados/nanda-codigos.js";
import { PERSONALIDADES, IDS_SORTEAVEIS } from "../dados/personalidades.js";
import { fichaDeTemplate } from "./fichaDeTemplate.js";
import { validarFicha, textoDeExigencias } from "./validarFicha.js";
import { estadoDosFatos, montarEstadoDoTurno, aplicarResposta } from "./regras.js";
import { rapportDe, limitarConfianca } from "./rapport.js";
import { blocoMemoria, ultimosTurnos, acrescentarNota, reveladosAteAgora } from "./memoria.js";
import { sintomasLeigos } from "./sintomasLeigos.js";
import { filtrarFala, cortarEmFrases, FALA_RESERVA } from "./filtroFala.js";

const DIFICULDADES = ["facil", "normal", "dificil"];

test("ficha de template passa no validarFicha: todos os arquétipos × 3 dificuldades × 7 personalidades", () => {
  for (const arq of ARQUETIPOS) {
    for (const dificuldade of DIFICULDADES) {
      for (const personalidadeId of IDS_SORTEAVEIS) {
        const ficha = fichaDeTemplate(arq, { personalidadeId, dificuldade });
        const r = validarFicha(ficha, { arquetipo: arq, dificuldade, personalidadeId, codigosNanda: CODIGOS_NANDA });
        assert.ok(r.ok, `${arq.id}/${dificuldade}/${personalidadeId}: ${r.erros.join("; ")}`);
      }
    }
  }
});

test("a ficha de template usa o sexo e a idade pedidos e os sinais vitais do arquétipo", () => {
  const arq = ARQUETIPOS[0];
  const f = fichaDeTemplate(arq, { idade: 63, sexo: "F", personalidadeId: "colaborativo", dificuldade: "facil" });
  assert.equal(f.identificacao.idade, 63);
  assert.equal(f.identificacao.sexo, "F");
  assert.deepEqual(f.sinaisVitais, arq.vitals);
  assert.match(f.setor, /Leito 7$/);
});

test("validarFicha acusa cada invariante do C7", () => {
  const arq = ARQUETIPOS[0];
  const base = () => fichaDeTemplate(arq, { personalidadeId: "desconfiado", dificuldade: "normal" });
  const opcoes = { arquetipo: arq, dificuldade: "normal", personalidadeId: "desconfiado", codigosNanda: CODIGOS_NANDA };
  const falha = (mexer) => {
    const f = base();
    mexer(f);
    return validarFicha(f, opcoes).erros.join(" | ");
  };

  assert.match(falha((f) => (f.fatos = f.fatos.slice(0, 5))), /8 a 14 fatos/);
  assert.match(falha((f) => f.fatos.forEach((x) => (x.peso = 1))), /peso 3 sobre alergias ou medicacoes/);
  assert.match(falha((f) => delete f.fatos[6].versaoFalsa), /versaoFalsa/);
  assert.match(falha((f) => (f.fatos[6].confiancaMin = 95)), /confiancaMin/);
  assert.match(falha((f) => (f.sinaisVitais.sat = 130)), /faixa fisiológica/);
  assert.match(falha((f) => (f.sinaisVitais.fc = f.sinaisVitais.fc * 1.5)), /10%/);
  assert.match(falha((f) => (f.diagnosticosEsperados = ["99999", "00132"])), /NANDA inexistente/);
  assert.match(falha((f) => (f.diagnosticosEsperados = ["00132"])), /2 a 4 códigos/);
  assert.match(falha((f) => (f.intervencoesEsperadas = ["a"])), /3 a 6/);
  assert.match(falha((f) => (f.fatos[0].tema = "xyz")), /tema inválido/);
  assert.match(falha((f) => (f.fatos[2].id = "f9")), /sequenciais/);
  assert.match(falha((f) => (f.fatos[1].perguntaQueRevela = "")), /perguntaQueRevela/);
});

test("validarFicha: distribuição por dificuldade e por personalidade", () => {
  const arq = ARQUETIPOS[1];
  const comRevelacoes = (revs, dificuldade, personalidadeId) => {
    const f = fichaDeTemplate(arq, { personalidadeId, dificuldade });
    f.fatos.forEach((x, i) => {
      x.revelacao = revs[i];
      if (revs[i] === "confianca") Object.assign(x, { confiancaMin: 60, versaoFalsa: "não" });
    });
    return validarFicha(f, { arquetipo: arq, dificuldade, personalidadeId, codigosNanda: CODIGOS_NANDA }).erros.join(" | ");
  };
  const todasDiretas = Array(8).fill("pergunta_direta");
  assert.match(comRevelacoes(todasDiretas, "facil", "colaborativo"), /50%/);
  assert.match(comRevelacoes(todasDiretas, "dificil", "colaborativo"), /confianca/);
  assert.match(comRevelacoes(todasDiretas, "normal", "desconfiado"), /confianca/);
  const normalSemEsq = ["livre", "livre", "pergunta_direta", "pergunta_direta", "pergunta_direta", "pergunta_direta", "confianca", "pergunta_direta"];
  assert.equal(comRevelacoes(normalSemEsq, "normal", "colaborativo"), "");
  assert.match(comRevelacoes(normalSemEsq, "normal", "esquecido"), /esquecido/);
  const doisConf = ["livre", "livre", "pergunta_direta", "pergunta_direta", "pergunta_direta", "pergunta_direta", "confianca", "confianca"];
  assert.match(comRevelacoes(doisConf, "normal", "ansioso"), /no máximo 1/);
});

test("textoDeExigencias menciona a dificuldade e a personalidade", () => {
  assert.match(textoDeExigencias("facil", "colaborativo"), /metade/);
  assert.match(textoDeExigencias("dificil", "desconfiado"), /pelo menos 1 fato "confianca"/);
  assert.match(textoDeExigencias("normal", "esquecido"), /"esquecido"/);
});

// ---- regras de revelação ----
const ficha = () => fichaDeTemplate(ARQUETIPOS[0], { personalidadeId: "desconfiado", dificuldade: "normal" });
const SEGREDO = "tomo tudo certinho, nunca esqueço";
function fichaComSegredo() {
  const f = ficha();
  const a = f.fatos.find((x) => x.revelacao === "confianca");
  a.texto = "parei de tomar o remédio há duas semanas";
  a.versaoFalsa = SEGREDO;
  a.confiancaMin = 60;
  const e = f.fatos.find((x) => x.revelacao === "esquecido");
  e.texto = "tomo o remédio da pressão chamado losartana";
  return { f, a, e };
}

test("fato confianca fica bloqueado abaixo do mínimo e o texto verdadeiro NÃO aparece no ESTADO DO TURNO", () => {
  const { f, a } = fichaComSegredo();
  const estado = estadoDosFatos(f, { confianca: 59, contagemTemas: {} }).find((x) => x.id === a.id);
  assert.equal(estado.liberado, false);
  assert.equal(estado.texto, undefined);
  const bloco = montarEstadoDoTurno({ ficha: f, confianca: 59, contagemTemas: {} });
  assert.ok(!bloco.includes(a.texto), "o texto verdadeiro vazou");
  assert.ok(bloco.includes(SEGREDO));
});

test("fato confianca é liberado com a confiança no mínimo", () => {
  const { f, a } = fichaComSegredo();
  const e = estadoDosFatos(f, { confianca: 60, contagemTemas: {} }).find((x) => x.id === a.id);
  assert.equal(e.liberado, true);
  assert.equal(e.texto, a.texto);
  assert.match(montarEstadoDoTurno({ ficha: f, confianca: 60, contagemTemas: {} }), /parei de tomar o remédio/);
});

test("fato esquecido só é liberado depois de o tema ter sido perguntado 2 vezes", () => {
  const { f, e } = fichaComSegredo();
  const ver = (n) => estadoDosFatos(f, { confianca: 50, contagemTemas: { [e.tema]: n } }).find((x) => x.id === e.id);
  assert.equal(ver(0).liberado, false);
  assert.equal(ver(1).liberado, false);
  assert.equal(ver(2).liberado, true);
  assert.ok(!montarEstadoDoTurno({ ficha: f, confianca: 50, contagemTemas: { [e.tema]: 1 } }).includes("losartana"));
  assert.ok(montarEstadoDoTurno({ ficha: f, confianca: 50, contagemTemas: { [e.tema]: 2 } }).includes("losartana"));
});

test("livre e pergunta_direta ficam sempre liberados, cada um com a sua instrução", () => {
  const f = ficha();
  const estados = estadoDosFatos(f, { confianca: 0, contagemTemas: {} });
  const livre = estados.find((x) => x.regra === "livre");
  const direta = estados.find((x) => x.regra === "pergunta_direta");
  assert.equal(livre.liberado, true);
  assert.match(livre.instrucao, /espontaneamente/);
  assert.match(direta.instrucao, /só conte se perguntarem/);
});

test("o ESTADO DO TURNO nunca traz peso, perguntaQueRevela nem diagnósticos esperados", () => {
  const f = ficha();
  f.fatos[0].perguntaQueRevela = "PERGUNTA-SECRETA-XYZ";
  const bloco = montarEstadoDoTurno({ ficha: f, confianca: 90, contagemTemas: { habitos: 5, adesao: 5 } });
  assert.ok(!bloco.includes("PERGUNTA-SECRETA-XYZ"));
  assert.ok(!bloco.includes("peso"));
  for (const c of f.diagnosticosEsperados) assert.ok(!bloco.includes(c));
  for (const i of f.intervencoesEsperadas) assert.ok(!bloco.includes(i));
});

test("o ESTADO DO TURNO avisa que o fim está perto quando restam 3 turnos ou menos", () => {
  const f = ficha();
  assert.doesNotMatch(montarEstadoDoTurno({ ficha: f, confianca: 50, contagemTemas: {}, turnosRestantes: 4 }), /chegando ao fim/);
  assert.match(montarEstadoDoTurno({ ficha: f, confianca: 50, contagemTemas: {}, turnosRestantes: 3 }), /chegando ao fim/);
});

test("o bloco de memória lista os fatos já revelados e as notas", () => {
  const f = ficha();
  const m = blocoMemoria({ ficha: f, reveladosIds: ["f1", "f2"], notas: ["falou da filha Ana"] });
  assert.match(m, /\[f1\]/);
  assert.match(m, /\[f2\]/);
  assert.match(m, /falou da filha Ana/);
  assert.equal(blocoMemoria({ ficha: f }), "- (nada ainda)");
});

// ---- aplicarResposta ----
function estadoBase() {
  const f = ficha();
  const liberados = estadoDosFatos(f, { confianca: 40, contagemTemas: {} }).filter((x) => x.liberado).map((x) => x.id);
  return { ficha: f, confianca: 40, contagemTemas: {}, notas: [], liberadosIds: liberados };
}

test("aplicarResposta limita o delta a -10..+10 e a confiança a 0..100", () => {
  assert.equal(aplicarResposta(estadoBase(), { delta_confianca: 50 }).confianca, 50);
  assert.equal(aplicarResposta(estadoBase(), { delta_confianca: -50 }).confianca, 30);
  assert.equal(aplicarResposta({ ...estadoBase(), confianca: 98 }, { delta_confianca: 10 }).confianca, 100);
  assert.equal(aplicarResposta({ ...estadoBase(), confianca: 3 }, { delta_confianca: -10 }).confianca, 0);
  assert.equal(aplicarResposta(estadoBase(), { delta_confianca: "abc" }).confianca, 40);
  assert.equal(limitarConfianca(150), 100);
  assert.equal(limitarConfianca(-5), 0);
});

test("aplicarResposta descarta revelados que não estavam liberados (mesmo que a IA marque)", () => {
  const e = estadoBase();
  const bloqueado = e.ficha.fatos.find((x) => !e.liberadosIds.includes(x.id));
  const liberado = e.liberadosIds[0];
  const r = aplicarResposta(e, { revelados: [bloqueado.id, liberado, "f99", liberado] });
  assert.deepEqual(r.revelados, [liberado]);
});

test("aplicarResposta soma os temas, ignora temas inventados e conta o mesmo tema uma vez por turno", () => {
  const r = aplicarResposta({ ...estadoBase(), contagemTemas: { habitos: 1 } }, { temas_do_aluno: ["habitos", "habitos", "alergias", "tema-inventado"] });
  assert.deepEqual(r.contagemTemas, { habitos: 2, alergias: 1 });
});

test("aplicarResposta: emoção inválida vira falando; exame só passa se estiver na lista da ficha", () => {
  const e = estadoBase();
  e.ficha.examesDisponiveis = ["ausculta-pulmonar"];
  assert.equal(aplicarResposta(e, { emocao: "voando" }).emocao, "falando");
  assert.equal(aplicarResposta(e, { emocao: "dor" }).emocao, "dor");
  assert.equal(aplicarResposta(e, { exame_solicitado: "ausculta-pulmonar" }).exame, "ausculta-pulmonar");
  assert.equal(aplicarResposta(e, { exame_solicitado: "raio-x" }).exame, null);
  assert.equal(aplicarResposta(e, { exame_solicitado: null }).exame, null);
});

test("memória: notas de até 12 palavras, no máximo 12 notas, e histórico dos últimos 10 turnos só com a fala", () => {
  assert.deepEqual(acrescentarNota([], "  "), []);
  assert.equal(acrescentarNota([], "um dois três quatro cinco seis sete oito nove dez onze doze treze quatorze")[0].split(" ").length, 12);
  let notas = [];
  for (let i = 0; i < 15; i++) notas = acrescentarNota(notas, `nota ${i}`);
  assert.equal(notas.length, 12);
  assert.equal(notas[0], "nota 3");

  const turnos = Array.from({ length: 14 }, (_, i) => ({ autor: i % 2 ? "paciente" : "aluno", texto: `t${i}`, revelados: i === 3 ? ["f1"] : [] }));
  const h = ultimosTurnos(turnos);
  assert.equal(h.length, 10);
  assert.deepEqual(h[0], { role: "user", content: "t4" });
  assert.deepEqual(h[1], { role: "assistant", content: "t5" });
  assert.deepEqual(reveladosAteAgora(turnos), ["f1"]);
});

test("rapport: <40 baixo, 40–69 médio, ≥70 alto", () => {
  assert.equal(rapportDe(0), "baixo");
  assert.equal(rapportDe(39), "baixo");
  assert.equal(rapportDe(40), "medio");
  assert.equal(rapportDe(69), "medio");
  assert.equal(rapportDe(70), "alto");
  assert.equal(rapportDe(100), "alto");
  assert.equal(rapportDe(undefined), "baixo");
});

test("sintomas leigos a partir dos sinais vitais", () => {
  assert.match(sintomasLeigos({ sat: 88 }), /falta de ar/);
  assert.match(sintomasLeigos({ fc: 130 }), /coração acelerado/);
  assert.match(sintomasLeigos({ tax: 38.5 }), /febre/);
  assert.match(sintomasLeigos({ dor: 8 }), /muita dor/);
  assert.match(sintomasLeigos({ pa_sistolica: 80 }), /tonto/);
  assert.match(sintomasLeigos({ sat: 98, fc: 80, tax: 36.5 }), /estável/);
});

// ---- filtro de saída ----
test("filtroFala troca falas que quebram o personagem pela fala de reserva", () => {
  for (const ruim of [
    "Eu sou uma IA e não posso sentir dor.",
    "Como modelo de linguagem, não sei.",
    "Sou o assistente virtual deste treino.",
    "O diagnóstico é 00030, troca de gases prejudicada.",
    "Meu prompt diz para eu esconder isso.",
    "Fui treinado pelo Gemini.",
    "Acho que o diagnóstico de enfermagem é padrão respiratório ineficaz.",
    "",
  ]) {
    const r = filtrarFala(ruim);
    assert.equal(r.trocada, true, ruim);
    assert.equal(r.fala, FALA_RESERVA);
  }
});

test("filtroFala deixa passar fala normal e corta na 3ª frase", () => {
  assert.deepEqual(filtrarFala("Tô com dor no peito."), { fala: "Tô com dor no peito.", trocada: false, cortada: false, motivo: null });
  const r = filtrarFala("Uma. Duas. Três. Quatro. Cinco.");
  assert.equal(r.fala, "Uma. Duas. Três.");
  assert.equal(r.cortada, true);
  assert.equal(filtrarFala("Dr. Silva disse 2,5 mg. Tomo toda manhã.").fala, "Dr. Silva disse 2,5 mg. Tomo toda manhã.");
});

test("cortarEmFrases não corta números nem abreviações", () => {
  assert.deepEqual(cortarEmFrases("A Sra. Ana tem 2,5 anos de casa. Oi!").frases, ["A Sra. Ana tem 2,5 anos de casa.", "Oi!"]);
});

test("personalidades listadas nos testes existem", () => {
  assert.equal(PERSONALIDADES.length, 8);
});
