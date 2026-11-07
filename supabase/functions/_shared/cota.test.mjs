import test from "node:test";
import assert from "node:assert/strict";
import { ErroApp } from "./erros.ts";
import { TIPOS_DE_COTA, consumirCota as consumirCotaReal, cotasAtivas, limiteDe, mensagemDaCota } from "./cota.ts";

// Nos testes de limite a cota está ligada; o padrão do servidor é desligada (app gratuito).
const consumirCota = (c, tipo, limite, qtd = 1) => consumirCotaReal(c, tipo, limite, qtd, true);

const semEnv = () => undefined;

test("os limites padrão seguem a decisão D6 do plano", () => {
  assert.equal(limiteDe("consulta", semEnv), 5);
  assert.equal(limiteDe("stt", semEnv), 20);
  assert.equal(limiteDe("llm", semEnv), 60);
  assert.equal(limiteDe("avaliacao", semEnv), 10);
  for (const tipo of TIPOS_DE_COTA) assert.ok(Number.isInteger(limiteDe(tipo, semEnv)));
});

test("COTA_<TIPO> troca o limite; valor inválido é ignorado", () => {
  assert.equal(limiteDe("llm", (n) => (n === "COTA_LLM" ? "3" : undefined)), 3);
  assert.equal(limiteDe("llm", (n) => (n === "COTA_LLM" ? "0" : undefined)), 0);
  for (const ruim of ["abc", "-1", "2.5", "", "  "]) {
    assert.equal(limiteDe("llm", () => ruim), 60, `valor ${JSON.stringify(ruim)}`);
  }
  // só o env do próprio tipo vale
  assert.equal(limiteDe("stt", (n) => (n === "COTA_LLM" ? "3" : undefined)), 20);
});

function clienteQueResponde(resposta) {
  const chamadas = [];
  return {
    chamadas,
    rpc: (nome, args) => {
      chamadas.push({ nome, args });
      return Promise.resolve(resposta);
    },
  };
}

test("consumirCota chama o RPC com os argumentos certos e aceita quando volta true", async () => {
  const c = clienteQueResponde({ data: true, error: null });
  await consumirCota(c, "stt", 20, 3);
  assert.deepEqual(c.chamadas, [{ nome: "consumir_cota", args: { p_tipo: "stt", p_limite: 20, p_qtd: 3 } }]);
  await consumirCota(c, "llm", 60);
  assert.equal(c.chamadas[1].args.p_qtd, 1);
});

test("consumirCota lança COTA_EXCEDIDA quando o RPC devolve false", async () => {
  const c = clienteQueResponde({ data: false, error: null });
  await assert.rejects(
    () => consumirCota(c, "consulta", 5),
    (e) => e instanceof ErroApp && e.codigo === "COTA_EXCEDIDA" && e.status === 429 && e.message.includes("5 consultas")
  );
});

test("consumirCota lança IA_INDISPONIVEL quando o banco falha (e nunca libera)", async () => {
  const c = clienteQueResponde({ data: null, error: { message: "function consumir_cota does not exist" } });
  await assert.rejects(
    () => consumirCota(c, "llm", 60),
    (e) => e instanceof ErroApp && e.codigo === "IA_INDISPONIVEL" && e.status === 503 && !e.message.includes("consumir_cota")
  );
});

test("só um true estrito libera a cota", async () => {
  for (const data of [null, undefined, 1, "true", {}]) {
    await assert.rejects(() => consumirCota(clienteQueResponde({ data, error: null }), "llm", 60), ErroApp);
  }
});

test("a mensagem muda conforme o tipo", () => {
  assert.match(mensagemDaCota("consulta", 5), /5 consultas/);
  assert.match(mensagemDaCota("stt", 20), /transcrição/);
  assert.match(mensagemDaCota("llm", 60), /IA/);
  assert.match(mensagemDaCota("voz", 200), /limite de hoje/);
});

test("sem COTAS_ATIVAS o app é gratuito: nada é cobrado e o banco nem é chamado", async () => {
  assert.equal(cotasAtivas(() => undefined), false);
  assert.equal(cotasAtivas(() => ""), false);
  assert.equal(cotasAtivas(() => "0"), false);
  assert.equal(cotasAtivas(() => "1"), true);
  let chamadas = 0;
  const c = { rpc: () => { chamadas++; return Promise.resolve({ data: false, error: null }); } };
  await consumirCotaReal(c, "consulta", 5, 1, false);
  await consumirCotaReal(c, "stt", 0, 99, false);
  assert.equal(chamadas, 0);
});
