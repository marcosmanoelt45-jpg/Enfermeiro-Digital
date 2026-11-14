import test from "node:test";
import assert from "node:assert/strict";
import { conteudoDaFonte, pedeFonteExterna } from "./regras.js";

const ficha = {
  fatos: [
    { id: "f1", tema: "medicacoes", texto: "Uso: salbutamol spray (resgate), budesonida 2x/dia", revelacao: "esquecido" },
    { id: "f2", tema: "alergias", texto: "Alergia a dipirona", revelacao: "pergunta_direta" },
    { id: "f3", tema: "antecedentes", texto: "Asma desde a infância", revelacao: "livre" },
    { id: "f4", tema: "medicacoes", texto: "Não usa a bombinha todo dia", revelacao: "confianca", confiancaMin: 80, versaoFalsa: "Uso certinho" },
    { id: "f5", tema: "habitos", texto: "Fuma 10 cigarros/dia", revelacao: "livre" },
  ],
};
// o turno conta a fonte externa quando o aluno pede (como faz turnoConsulta)
const comFonte = { confianca: 40, contagemTemas: { fonte_externa: 1 } };

test("pedir ao filho mostra os remédios e as alergias liberados", () => {
  assert.equal(pedeFonteExterna("Vou pegar os remédios com seu filho"), true);
  const r = conteudoDaFonte(ficha, comFonte, "Vou pegar os remédios com seu filho");
  assert.equal(r.origem, "Lista e caixas de remédio trazidas pelo acompanhante");
  assert.deepEqual(r.itens.map((i) => i.id), ["f1", "f2"]);
});

test("versão falsa (falta de confiança) e outros temas não aparecem", () => {
  const r = conteudoDaFonte(ficha, comFonte, "posso ver a receita na sua bolsa?");
  assert.equal(r.origem, "Receita e caixas de remédio da bolsa");
  assert.ok(!r.itens.some((i) => i.id === "f4" || i.id === "f5"));
});

test("registro anterior traz também os antecedentes", () => {
  const r = conteudoDaFonte(ficha, comFonte, "tem algum registro de internação anterior?");
  assert.ok(r.itens.some((i) => i.id === "f3"));
});

test("sem nada liberado, não há cartão", () => {
  const vazia = { fatos: [{ id: "x", tema: "medicacoes", texto: "Losartana", revelacao: "confianca", confiancaMin: 90, versaoFalsa: "nenhum" }] };
  assert.equal(conteudoDaFonte(vazia, comFonte, "posso ver a receita?"), null);
});
