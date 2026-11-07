import test from "node:test";
import assert from "node:assert/strict";
import { criarRoteiro, perguntaAtual, responder, preencherLacuna, lacunasAbertas, conferirNumeros, respostasParaAvaliacao, lacunasParaAvaliacao, falaDaEnfermeira } from "./roteiro.js";

const cenario = () => ({
  id: "teste",
  vitals: { pa_sistolica: 115, pa_diastolica: 72, fc: 84, fr: 17, sat: 98, tax: 36.6 },
  lacunas: [{ campo: "abdome", rotulo: "Abdome", valorEsperado: "flácido" }],
  perguntas: [
    { id: "plt.teste.s1", letra: "S", texto: "Quem é o paciente?", espera: { tipo: "texto" } },
    { id: "plt.teste.a1", letra: "A", texto: "Como estão os sinais vitais?", espera: { tipo: "numero", campos: ["pa_sistolica", "pa_diastolica", "fc", "sat"] } },
    { id: "plt.teste.a2", letra: "A", texto: "E o abdome?", espera: { tipo: "texto" }, dependeDe: "abdome" },
    { id: "plt.teste.r1", letra: "R", texto: "O que eu vigio?", espera: { tipo: "texto" } },
  ],
});

test("conferirNumeros respeita a tolerância de cada sinal", () => {
  const v = cenario().vitals;
  assert.deepEqual(conferirNumeros(["pa_sistolica", "fc", "sat"], { pa_sistolica: 120, fc: 89, sat: 99 }, v), { pa_sistolica: "ok", fc: "ok", sat: "ok" });
  assert.deepEqual(conferirNumeros(["pa_sistolica", "fc", "sat"], { pa_sistolica: 121, fc: 90, sat: 100 }, v), { pa_sistolica: "errado", fc: "errado", sat: "errado" });
  assert.deepEqual(conferirNumeros(["fr", "tax"], { fr: 19, tax: 36.8 }, v), { fr: "ok", tax: "ok" });
  assert.deepEqual(conferirNumeros(["fr", "tax"], { fr: 20, tax: 37 }, v), { fr: "errado", tax: "errado" });
  assert.deepEqual(conferirNumeros(["fc", "fr"], { fc: 84 }, v), { fc: "ok", fr: "nao_informado" });
});

test("resposta de texto avança para a próxima pergunta com a reação ok", () => {
  let e = criarRoteiro(cenario());
  assert.equal(perguntaAtual(e).id, "plt.teste.s1");
  const r = responder(e, "Paciente M.S.L., 58 anos, leito 12-A");
  assert.equal(r.reacao, "ok");
  assert.equal(perguntaAtual(r.estado).id, "plt.teste.a1");
  assert.equal(r.estado.respostas[0].texto, "Paciente M.S.L., 58 anos, leito 12-A");
});

test("resposta vazia não muda nada", () => {
  const e = criarRoteiro(cenario());
  for (const t of ["", "   ", null, undefined]) {
    const r = responder(e, t);
    assert.equal(r.reacao, null);
    assert.equal(r.estado, e);
  }
});

test("números certos por voz passam direto e ficam conferidos", () => {
  let e = responder(criarRoteiro(cenario()), "paciente").estado;
  const r = responder(e, "pressão cento e quinze por setenta e dois, frequência cardíaca oitenta e quatro, saturando noventa e oito");
  assert.equal(r.reacao, "ok");
  assert.deepEqual(r.estado.respostas[1].conferenciaNumerica, { pa_sistolica: "ok", pa_diastolica: "ok", fc: "ok", sat: "ok" });
});

test("faltou número: uma chance de complementar, depois segue", () => {
  let e = responder(criarRoteiro(cenario()), "paciente").estado;
  let r = responder(e, "PA 115 por 72 e FC 84");
  assert.equal(r.reacao, "faltou_numero");
  assert.equal(perguntaAtual(r.estado).id, "plt.teste.a1"); // continua na mesma pergunta
  r = responder(r.estado, "saturação 98");
  assert.equal(r.reacao, "ok");
  assert.deepEqual(r.estado.respostas[1].conferenciaNumerica, { pa_sistolica: "ok", pa_diastolica: "ok", fc: "ok", sat: "ok" });
  assert.match(r.estado.respostas[1].texto, /PA 115.*saturação 98/);
});

test("depois do complemento, o que ainda falta fica 'não informado' e o roteiro segue", () => {
  let e = responder(criarRoteiro(cenario()), "paciente").estado;
  let r = responder(e, "não sei");
  assert.equal(r.reacao, "faltou_numero");
  r = responder(r.estado, "também não anotei");
  assert.equal(r.reacao, "ok");
  assert.deepEqual(Object.values(r.estado.respostas[1].conferenciaNumerica), ["nao_informado", "nao_informado", "nao_informado", "nao_informado"]);
});

test("número errado é marcado errado, sem nova chance", () => {
  let e = responder(criarRoteiro(cenario()), "paciente").estado;
  const r = responder(e, "PA 150 por 90, FC 120, saturação 90");
  assert.equal(r.reacao, "ok");
  assert.deepEqual(r.estado.respostas[1].conferenciaNumerica, { pa_sistolica: "errado", pa_diastolica: "errado", fc: "errado", sat: "errado" });
});

test("pergunta que depende de lacuna não preenchida: 'não avaliou' e resposta sem avaliação", () => {
  let e = criarRoteiro(cenario());
  e = responder(e, "paciente").estado;
  e = responder(e, "PA 115 por 72, FC 84, sat 98").estado;
  assert.equal(lacunasAbertas(e).length, 1);
  const r = responder(e, "o abdome está bem");
  assert.equal(r.reacao, "nao_avaliou");
  assert.equal(r.estado.respostas[2].semAvaliacao, true);
  assert.equal(r.estado.respostas[2].dependeDe, "abdome");
});

test("lacuna preenchida pelo exame libera a pergunta dependente", () => {
  let e = criarRoteiro(cenario());
  e = preencherLacuna(e, "abdome", "flácido");
  assert.equal(lacunasAbertas(e).length, 0);
  e = responder(e, "paciente").estado;
  e = responder(e, "PA 115 por 72, FC 84, sat 98").estado;
  const r = responder(e, "abdome flácido, dor só na incisão");
  assert.equal(r.reacao, "ok");
  assert.equal(r.estado.respostas[2].semAvaliacao, undefined);
});

test("campo de lacuna inexistente é ignorado", () => {
  const e = criarRoteiro(cenario());
  assert.equal(preencherLacuna(e, "inexistente", "x"), e);
});

test("última pergunta encerra o roteiro e gera o pacote da avaliação", () => {
  let e = criarRoteiro(cenario());
  e = preencherLacuna(e, "abdome", "flácido");
  e = responder(e, "paciente").estado;
  e = responder(e, "PA 115 por 72, FC 84, sat 98").estado;
  e = responder(e, "abdome flácido").estado;
  const r = responder(e, "vigiar o dreno");
  assert.equal(r.reacao, "encerrar");
  assert.ok(r.concluida && r.estado.finalizado);
  assert.equal(perguntaAtual(r.estado), null);
  assert.equal(responder(r.estado, "mais uma").reacao, null);
  const pacote = respostasParaAvaliacao(r.estado);
  assert.equal(pacote.length, 4);
  assert.deepEqual(Object.keys(pacote[1]).sort(), ["conferenciaNumerica", "letra", "perguntaId", "texto"]);
  assert.deepEqual(lacunasParaAvaliacao(r.estado), { abdome: { avaliada: true, achado: "flácido" } });
});

test("lacunasParaAvaliacao marca as não avaliadas", () => {
  assert.deepEqual(lacunasParaAvaliacao(criarRoteiro(cenario())), { abdome: { avaliada: false } });
});

test("falaDaEnfermeira escolhe fala fixa e não repete a anterior", () => {
  const falas = [{ id: "plt.r.ok.1", texto: "Certo." }, { id: "plt.r.ok.2", texto: "Entendi." }, { id: "plt.r.encerrar.1", texto: "Obrigada." }];
  const a = falaDaEnfermeira("ok", falas, () => 0);
  assert.equal(a.origem, "fixa");
  const b = falaDaEnfermeira("ok", falas, () => 0, { ok: a.id });
  assert.notEqual(b.id, a.id);
  assert.equal(falaDaEnfermeira("encerrar", falas, () => 0, { encerrar: "plt.r.encerrar.1" }).id, "plt.r.encerrar.1");
  assert.equal(falaDaEnfermeira("inexistente", falas), null);
});
