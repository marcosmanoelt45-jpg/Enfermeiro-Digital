import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { mulberry32 } from "./rng.js";
import { MODOS, montarRodada, lerValor, avaliarResposta, novoEstadoItem, aplicar, falaDaReacao, resumirRodada, sequenciaDePrimeira, xpDaRodada, notaDaRodada } from "./rodada.js";

const banco = JSON.parse(fs.readFileSync(new URL("../../../data/calculo/banco.json", import.meta.url), "utf8"));
const falas = JSON.parse(fs.readFileSync(new URL("../../../data/falas/medico-rui.json", import.meta.url), "utf8")).falas;
const normal = (extra = {}) => ({ id: "x", unidade: "mL", casas: 1, resposta: 7.5, tolerancia: 0.05, erroProposital: null, ...extra });
const inteiro = (extra = {}) => normal({ unidade: "gts/min", casas: 0, resposta: 42, tolerancia: 0.5, ...extra });
const comErro = (tipo = "dose10x") => ({ id: "e", unidade: null, casas: null, resposta: null, tolerancia: null, erroProposital: { tipo } });

test("montarRodada: tamanhos e quantidade de erros por modo", () => {
  for (let s = 1; s <= 40; s++) {
    const rotina = montarRodada(banco, "rotina", mulberry32(s));
    assert.equal(rotina.length, 10);
    assert.ok(rotina.every((i) => !i.erroProposital));
    const corrido = montarRodada(banco, "corrido", mulberry32(s));
    assert.equal(corrido.length, 8);
    assert.ok(corrido.every((i) => !i.erroProposital));
    const erro = montarRodada(banco, "erro", mulberry32(s));
    assert.equal(erro.length, 10);
    const nErros = erro.filter((i) => i.erroProposital).length;
    assert.ok(nErros === 3 || nErros === 4, `${nErros} erros`);
    assert.equal(new Set(erro.map((i) => i.id)).size, 10);
  }
  assert.equal(MODOS.corrido.tempoPorItemS, 90);
  assert.equal(MODOS.corrido.pressaAoS, 60);
});

test("montarRodada é reproduzível com a mesma semente e varia o assunto", () => {
  const a = montarRodada(banco, "erro", mulberry32(5)).map((i) => i.id);
  assert.deepEqual(a, montarRodada(banco, "erro", mulberry32(5)).map((i) => i.id));
  const tipos = new Set(montarRodada(banco, "rotina", mulberry32(9)).map((i) => i.tipo));
  assert.ok(tipos.size >= 4, `só ${tipos.size} tipos`);
  assert.throws(() => montarRodada(banco, "inexistente"));
});

test("lerValor aceita vírgula e ponto e recusa lixo", () => {
  assert.equal(lerValor("2,5"), 2.5);
  assert.equal(lerValor("2.5"), 2.5);
  assert.equal(lerValor(" 42 "), 42);
  assert.equal(lerValor(7), 7);
  for (const ruim of ["42abc", "", "abc", "1,2,3", "-3", ",5", null, undefined, NaN]) assert.equal(lerValor(ruim), null, String(ruim));
});

test("avaliarResposta: decimal usa tolerância, inteiro exige o inteiro", () => {
  assert.equal(avaliarResposta(normal(), "7,5").estado, "certo");
  assert.equal(avaliarResposta(normal(), "7,54").estado, "certo");
  assert.equal(avaliarResposta(normal(), "7,6").estado, "errado");
  assert.equal(avaliarResposta(normal({ resposta: 0.75 }), "0,8").estado, "certo"); // 0,05 do limite, sem ruído de float
  assert.equal(avaliarResposta(inteiro(), "42").estado, "certo");
  assert.equal(avaliarResposta(inteiro(), "41").estado, "errado");
  assert.equal(avaliarResposta(inteiro(), "41,67").estado, "quase");
  assert.equal(avaliarResposta(inteiro(), "40,5").estado, "errado");
  assert.equal(avaliarResposta(inteiro(), "42abc").estado, "invalido");
});

test("a unidade dita errada vale como erro, a certa não atrapalha", () => {
  assert.equal(avaliarResposta(normal(), "7,5", "mL/h").estado, "unidade_errada");
  assert.equal(avaliarResposta(normal(), "7,5", "mL").estado, "certo");
  assert.equal(avaliarResposta(normal(), "7,5", null).estado, "certo");
});

test("fluxo normal: acerto de primeira, acerto de segunda, dois erros", () => {
  let r = aplicar(novoEstadoItem(normal()), { tipo: "resposta", valor: "7,5" });
  assert.equal(r.reacao, "acerto");
  assert.ok(r.estado.finalizado && r.estado.primeira && r.estado.resultado === "acerto");

  r = aplicar(novoEstadoItem(normal()), { tipo: "resposta", valor: "9" });
  assert.equal(r.reacao, "erro1");
  assert.ok(!r.estado.finalizado && !r.estado.mostrarMemoria);
  r = aplicar(r.estado, { tipo: "resposta", valor: "7,5" });
  assert.ok(r.estado.finalizado && !r.estado.primeira && r.estado.resultado === "acerto");

  r = aplicar(novoEstadoItem(normal()), { tipo: "resposta", valor: "1" });
  r = aplicar(r.estado, { tipo: "resposta", valor: "2" });
  assert.equal(r.reacao, "erro2");
  assert.ok(r.estado.finalizado && r.estado.mostrarMemoria && r.estado.resultado === "erro" && !r.estado.grave);
});

test("resposta quase certa ou inválida não gasta tentativa", () => {
  let r = aplicar(novoEstadoItem(inteiro()), { tipo: "resposta", valor: "41,8" });
  assert.equal(r.aviso, "quase");
  assert.equal(r.estado.erros, 0);
  r = aplicar(r.estado, { tipo: "resposta", valor: "abc" });
  assert.equal(r.aviso, "invalido");
  assert.equal(r.estado.erros, 0);
});

test("questionar uma prescrição correta conta 1 erro e o médico diz que está certa", () => {
  let r = aplicar(novoEstadoItem(normal()), { tipo: "questionar", motivo: "dose10x" });
  assert.equal(r.reacao, "questionou_sem_motivo");
  assert.ok(!r.estado.finalizado && r.estado.erros === 1 && r.estado.questionouSemMotivo && !r.estado.primeira);
  r = aplicar(r.estado, { tipo: "resposta", valor: "7,5" });
  assert.ok(r.estado.finalizado && r.estado.resultado === "acerto" && !r.estado.primeira);
});

test("prescrição com erro: questionar pelo motivo certo é acerto", () => {
  for (const tipo of ["dose10x", "via", "unidade", "alergia"]) {
    const r = aplicar(novoEstadoItem(comErro(tipo)), { tipo: "questionar", motivo: tipo });
    assert.equal(r.reacao, "questionou_certo");
    assert.ok(r.estado.finalizado && r.estado.resultado === "acerto" && r.estado.primeira && !r.estado.grave);
  }
});

test("prescrição com erro: motivo errado dá segunda chance, depois fecha como erro", () => {
  let r = aplicar(novoEstadoItem(comErro("via")), { tipo: "questionar", motivo: "outro" });
  assert.equal(r.reacao, "erro1");
  assert.ok(!r.estado.finalizado);
  r = aplicar(r.estado, { tipo: "questionar", motivo: "alergia" });
  assert.equal(r.reacao, "erro2");
  assert.ok(r.estado.finalizado && r.estado.resultado === "erro" && r.estado.mostrarMemoria && !r.estado.grave);
});

test("NENHUMA prescrição com erro aceita cálculo como correto (qualquer valor é erro grave)", () => {
  const erros = banco.filter((i) => i.erroProposital);
  assert.ok(erros.length >= 20);
  for (const item of erros) {
    for (const valor of ["0", "1", "2,5", "10", "42", "7,5", "1000", "abc", ""]) {
      const r = aplicar(novoEstadoItem(item), { tipo: "resposta", valor, unidadeDita: null });
      assert.ok(r.estado.finalizado, `${item.id} aceitou ${valor} como andamento`);
      assert.equal(r.estado.resultado, "erro", `${item.id} ${valor}`);
      assert.equal(r.estado.grave, true, `${item.id} ${valor}`);
      assert.equal(r.reacao, "erro_grave");
    }
  }
});

test("tempo esgotado fecha o item como erro e mostra a memória", () => {
  const r = aplicar(novoEstadoItem(normal()), { tipo: "tempo" });
  assert.ok(r.estado.finalizado && r.estado.resultado === "erro" && r.estado.mostrarMemoria);
});

test("item finalizado ignora novos eventos", () => {
  const fim = aplicar(novoEstadoItem(normal()), { tipo: "resposta", valor: "7,5" }).estado;
  const r = aplicar(fim, { tipo: "resposta", valor: "1" });
  assert.equal(r.reacao, null);
  assert.equal(r.estado, fim);
});

test("falaDaReacao: toda reação tem fala fixa e não repete a anterior", () => {
  for (const reacao of ["acerto", "erro1", "erro2", "questionou_certo", "questionou_sem_motivo", "pressa", "erro_grave"]) {
    const a = falaDaReacao(reacao, falas, mulberry32(1));
    assert.ok(a && a.origem === "fixa" && a.texto && a.id.startsWith(`calc.r.${reacao}.`), reacao);
    const b = falaDaReacao(reacao, falas, mulberry32(1), { [reacao]: a.id });
    assert.notEqual(b.id, a.id, `${reacao} repetiu`);
  }
  assert.equal(falaDaReacao("inexistente", falas), null);
  assert.equal(falaDaReacao("acerto", falas).emocao, "acerto");
  assert.equal(falaDaReacao("erro_grave", falas).emocao, "erro");
});

test("resumo da rodada: acertos, de primeira, graves, tempo médio e sequência", () => {
  const ok = (primeira) => ({ resultado: "acerto", primeira, grave: false });
  const estados = [ok(true), ok(true), ok(false), ok(true), ok(true), ok(true), ok(true), ok(true), { resultado: "erro", primeira: false, grave: true }, { resultado: "erro", primeira: false, grave: false }];
  const r = resumirRodada(estados, [10000, 20000, 30000]);
  assert.deepEqual({ total: r.total, acertos: r.acertos, primeira: r.primeira, graves: r.graves, erros: r.erros, tempoMedioS: r.tempoMedioS }, { total: 10, acertos: 8, primeira: 7, graves: 1, erros: 2, tempoMedioS: 20 });
  assert.equal(r.melhorSequenciaPrimeira, 5);
  assert.equal(sequenciaDePrimeira([ok(true), ok(true), ok(true), ok(true)]), 4);
  assert.equal(sequenciaDePrimeira([]), 0);
  assert.equal(resumirRodada([], []).tempoMedioS, 0);
});

test("pontos e nota da rodada", () => {
  const r = { total: 10, acertos: 8, primeira: 6, graves: 1 };
  assert.equal(xpDaRodada(r), 10 + 24 + 12 - 5);
  assert.equal(xpDaRodada({ total: 10, acertos: 0, primeira: 0, graves: 3 }), 10);
  assert.equal(notaDaRodada(r), 70);
  assert.equal(notaDaRodada({ total: 0, acertos: 0, primeira: 0, graves: 0 }), 0);
  assert.equal(notaDaRodada({ total: 10, acertos: 10, primeira: 10, graves: 0 }), 100);
  assert.equal(notaDaRodada({ total: 10, acertos: 1, primeira: 0, graves: 5 }), 0);
});
