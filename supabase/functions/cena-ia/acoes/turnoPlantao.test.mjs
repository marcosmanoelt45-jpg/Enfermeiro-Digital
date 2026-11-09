import test from "node:test";
import assert from "node:assert/strict";
import { turnoPlantao, limparFala } from "./turnoPlantao.ts";
import { ErroApp } from "../../_shared/erros.ts";

const llm = (resposta) => {
  const f = async (o) => {
    f.chamadas.push(o);
    if (resposta instanceof Error) throw resposta;
    return { texto: typeof resposta === "string" ? resposta : JSON.stringify(resposta), modelo: "fake/m", truncado: false, uso: null };
  };
  f.chamadas = [];
  return f;
};
const entrada = (extra = {}) => ({ cenarioId: "pos_op", perguntaId: "plt.pos_op.s1", texto: "não sei", tentativa: 0, ...extra });

test("turno_plantao: devolve a situação e a fala da IA", async () => {
  const f = llm({ situacao: "nao_sabe", fala: "Tranquilo, olha a identificação no prontuário. Quem é ele?" });
  const r = await turnoPlantao("u", entrada(), { llm: f });
  assert.equal(r.situacao, "nao_sabe");
  assert.match(r.fala, /prontuário/);
  const user = f.chamadas[0].mensagens[1].content;
  assert.match(user, /RESPOSTA DO ALUNO: <<<não sei>>>/);
  assert.match(user, /colectomia/i);
});

test("turno_plantao: na segunda tentativa sempre segue em frente", async () => {
  const r = await turnoPlantao("u", entrada({ tentativa: 1 }), { llm: llm({ situacao: "nao_sabe", fala: "Tudo bem, vamos seguir." }) });
  assert.equal(r.situacao, "respondeu");
});

test("turno_plantao: situação desconhecida vira respondeu; IA com erro devolve fala null", async () => {
  const a = await turnoPlantao("u", entrada(), { llm: llm({ situacao: "outra", fala: "Ok." }) });
  assert.equal(a.situacao, "respondeu");
  const b = await turnoPlantao("u", entrada(), { llm: llm(new Error("x")) });
  assert.deepEqual(b, { situacao: "respondeu", fala: null, cobreProxima: false });
});

test("turno_plantao: manda o que o aluno já disse e a próxima pergunta; cobre_proxima volta como cobreProxima", async () => {
  let msgs = null;
  const espiao = async ({ mensagens }) => {
    msgs = mensagens;
    return { texto: JSON.stringify({ situacao: "respondeu", fala: "Certo.", cobre_proxima: true }), modelo: "t" };
  };
  const e = entrada();
  const r = await turnoPlantao("u", { ...e, historico: [{ perguntaId: e.perguntaId, texto: "Leito 12, 58 anos" }] }, { llm: espiao });
  assert.equal(r.cobreProxima, true);
  assert.match(msgs[1].content, /Leito 12, 58 anos/);
  assert.match(msgs[1].content, /PRÓXIMA PERGUNTA/);
});

test("turno_plantao: cenário ou pergunta que não existem são recusados", async () => {
  await assert.rejects(turnoPlantao("u", entrada({ cenarioId: "nao_existe" }), { llm: llm({}) }), ErroApp);
  await assert.rejects(turnoPlantao("u", entrada({ perguntaId: "plt.pos_op.zz" }), { llm: llm({}) }), ErroApp);
});

test("limparFala: tira marcação e corta tamanho", () => {
  assert.equal(limparFala("**Oi**  tudo\nbem"), "Oi tudo bem");
  assert.equal(limparFala(""), null);
  assert.equal(limparFala("a".repeat(400)).length, 260);
});
