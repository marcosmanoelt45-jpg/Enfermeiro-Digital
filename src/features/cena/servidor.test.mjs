import test from "node:test";
import assert from "node:assert/strict";
import { ErroServidor, erroDeCorpo, MENSAGENS_PADRAO } from "./logica/erroServidor.js";
import { invocarFuncao } from "./logica/chamada.js";
import { aguardarTranscricao, estimarDuracaoSeg } from "./logica/transcricao.js";

const semEspera = async () => {};

// Imita o FunctionsHttpError do supabase-js: o corpo da resposta fica em error.context.
const erroHttp = (status, corpo) => ({ name: "FunctionsHttpError", context: { status, json: async () => corpo } });

test("erroDeCorpo traduz cada código do §C5", () => {
  const codigos = ["NAO_AUTENTICADO", "SESSAO_DEMO", "COTA_EXCEDIDA", "ENTRADA_INVALIDA", "SESSAO_ENCERRADA", "TURNO_DUPLICADO", "IA_INDISPONIVEL", "ERRO_INTERNO"];
  for (const codigo of codigos) {
    const e = erroDeCorpo({ erro: { codigo, mensagem: "msg " + codigo } }, 400);
    assert.ok(e instanceof ErroServidor);
    assert.equal(e.codigo, codigo);
    assert.equal(e.message, "msg " + codigo);
    assert.equal(e.status, 400);
  }
});

test("erroDeCorpo sem mensagem usa a padrão; corpo estranho vira ERRO_INTERNO", () => {
  assert.equal(erroDeCorpo({ erro: { codigo: "COTA_EXCEDIDA" } }).message, MENSAGENS_PADRAO.COTA_EXCEDIDA);
  assert.equal(erroDeCorpo(null).codigo, "ERRO_INTERNO");
  assert.equal(erroDeCorpo("texto").codigo, "ERRO_INTERNO");
  assert.equal(erroDeCorpo({ error: "formato antigo" }).message, "formato antigo");
});

test("todo código do §C5 tem mensagem padrão", () => {
  for (const c of ["NAO_AUTENTICADO", "SESSAO_DEMO", "COTA_EXCEDIDA", "ENTRADA_INVALIDA", "SESSAO_ENCERRADA", "TURNO_DUPLICADO", "IA_INDISPONIVEL", "ERRO_INTERNO", "REDE", "TIMEOUT"]) {
    assert.ok(MENSAGENS_PADRAO[c], c);
  }
});

test("invocarFuncao devolve os dados quando dá certo", async () => {
  const dados = await invocarFuncao(async () => ({ data: { id: "x" }, error: null }), "f", {}, { esperar: semEspera });
  assert.deepEqual(dados, { id: "x" });
});

test("invocarFuncao lança o código do servidor e não repete", async () => {
  for (const [status, codigo] of [[401, "NAO_AUTENTICADO"], [403, "SESSAO_DEMO"], [429, "COTA_EXCEDIDA"], [400, "ENTRADA_INVALIDA"], [409, "SESSAO_ENCERRADA"], [503, "IA_INDISPONIVEL"], [500, "ERRO_INTERNO"]]) {
    let chamadas = 0;
    const invoke = async () => { chamadas++; return { data: null, error: erroHttp(status, { erro: { codigo, mensagem: "m" } }) }; };
    await assert.rejects(invocarFuncao(invoke, "f", {}, { esperar: semEspera }), (e) => e.codigo === codigo && e.status === status);
    assert.equal(chamadas, 1, codigo + " não pode ser repetido");
  }
});

test("invocarFuncao repete só erro de rede e depois desiste com REDE", async () => {
  let chamadas = 0;
  const falha = async () => { chamadas++; return { data: null, error: { name: "FunctionsFetchError" } }; };
  await assert.rejects(invocarFuncao(falha, "f", {}, { esperar: semEspera, tentativas: 3 }), (e) => e.codigo === "REDE");
  assert.equal(chamadas, 3);

  chamadas = 0;
  const volta = async () => (++chamadas === 1 ? { data: null, error: { name: "FunctionsFetchError" } } : { data: { ok: 1 }, error: null });
  assert.deepEqual(await invocarFuncao(volta, "f", {}, { esperar: semEspera }), { ok: 1 });
  assert.equal(chamadas, 2);
});

test("invocarFuncao: TypeError do fetch conta como rede; outro erro vira ERRO_INTERNO", async () => {
  await assert.rejects(invocarFuncao(async () => { throw new TypeError("Failed to fetch"); }, "f", {}, { esperar: semEspera, tentativas: 1 }), (e) => e.codigo === "REDE");
  await assert.rejects(invocarFuncao(async () => { throw new Error("boom"); }, "f", {}, { esperar: semEspera }), (e) => e.codigo === "ERRO_INTERNO");
});

test("invocarFuncao: estouro de tempo vira TIMEOUT sem repetir", async () => {
  let chamadas = 0;
  const lento = () => { chamadas++; return new Promise(() => {}); };
  await assert.rejects(invocarFuncao(lento, "f", {}, { timeoutMs: 20, esperar: semEspera }), (e) => e.codigo === "TIMEOUT");
  assert.equal(chamadas, 1);
});

test("invocarFuncao: corpo de erro ilegível vira ERRO_INTERNO", async () => {
  const invoke = async () => ({ data: null, error: { name: "FunctionsHttpError", context: { status: 502, json: async () => { throw new Error("html"); } } } });
  await assert.rejects(invocarFuncao(invoke, "f", {}, { esperar: semEspera }), (e) => e.codigo === "ERRO_INTERNO" && e.status === 502);
});

test("estimarDuracaoSeg usa a duração do gravador, arredonda para cima e limita a 1 h", () => {
  assert.equal(estimarDuracaoSeg({ size: 1 }, 12.2), 13);
  assert.equal(estimarDuracaoSeg({ size: 1 }, 99999), 3600);
  assert.equal(estimarDuracaoSeg({ size: 160000 }, 0), 10);
  assert.equal(estimarDuracaoSeg(null, undefined), 1);
});

function relogioFalso() {
  let t = 0;
  return { agora: () => t, esperar: async (ms) => { t += ms; } };
}

test("aguardarTranscricao consulta a cada 3 s até ficar pronta", async () => {
  const { agora, esperar } = relogioFalso();
  const respostas = [{ status: "processando" }, { status: "processando" }, { status: "pronto", texto: "  olá  " }];
  const etapas = [];
  const texto = await aguardarTranscricao({ consultar: async () => respostas.shift(), esperar, agora, onEtapa: (e) => etapas.push(e) });
  assert.equal(texto, "olá");
  assert.equal(agora(), 9000);
  assert.deepEqual(etapas, ["Transcrevendo o áudio... 3s", "Transcrevendo o áudio... 6s", "Transcrição concluída."]);
});

test("aguardarTranscricao: erro do serviço vira IA_INDISPONIVEL", async () => {
  const { agora, esperar } = relogioFalso();
  await assert.rejects(aguardarTranscricao({ consultar: async () => ({ status: "erro" }), esperar, agora }), (e) => e.codigo === "IA_INDISPONIVEL");
});

test("aguardarTranscricao: passou de 4 min vira TIMEOUT", async () => {
  const { agora, esperar } = relogioFalso();
  let consultas = 0;
  await assert.rejects(aguardarTranscricao({ consultar: async () => { consultas++; return { status: "processando" }; }, esperar, agora }), (e) => e.codigo === "TIMEOUT");
  assert.equal(consultas, 80);
});

test("aguardarTranscricao deixa passar o erro do servidor (ex.: COTA_EXCEDIDA)", async () => {
  const { agora, esperar } = relogioFalso();
  const consultar = async () => { throw new ErroServidor("COTA_EXCEDIDA"); };
  await assert.rejects(aguardarTranscricao({ consultar, esperar, agora }), (e) => e.codigo === "COTA_EXCEDIDA");
});
