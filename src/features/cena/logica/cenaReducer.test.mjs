import test from "node:test";
import assert from "node:assert/strict";
import { cenaReducer, criarEstado } from "./cenaReducer.js";

const F = (texto) => ({ texto, origem: "fixa" });
const rodar = (estado, ...acoes) => acoes.reduce(cenaReducer, estado);
const emStatus = (status, extra = {}) => criarEstado({ status, ...extra });

test("INICIAR: ocioso -> personagem_falando com a primeira fala e o resto na fila", () => {
  const e = rodar(criarEstado(), { tipo: "INICIAR", falas: [F("Oi"), F("Tudo bem?")] });
  assert.equal(e.status, "personagem_falando");
  assert.equal(e.falaAtual.texto, "Oi");
  assert.deepEqual(e.filaFalas.map((f) => f.texto), ["Tudo bem?"]);
  assert.deepEqual(e.turnos.map((t) => t.texto), ["Oi", "Tudo bem?"]);
});

test("INICIAR sem falas vai direto para aguardando_aluno", () => {
  assert.equal(rodar(criarEstado(), { tipo: "INICIAR", falas: [] }).status, "aguardando_aluno");
});

test("FALA_TERMINOU avança a fila e, no fim, aguarda o aluno", () => {
  let e = rodar(criarEstado(), { tipo: "INICIAR", falas: [F("a"), F("b")] });
  e = cenaReducer(e, { tipo: "FALA_TERMINOU" });
  assert.equal(e.status, "personagem_falando");
  assert.equal(e.falaAtual.texto, "b");
  e = cenaReducer(e, { tipo: "FALA_TERMINOU" });
  assert.equal(e.status, "aguardando_aluno");
  assert.equal(e.falaAtual, null);
});

test("ALUNO_SEGUROU durante personagem_falando interrompe e limpa a fila", () => {
  const e = rodar(criarEstado(), { tipo: "INICIAR", falas: [F("a"), F("b"), F("c")] }, { tipo: "ALUNO_SEGUROU" });
  assert.equal(e.status, "aluno_falando");
  assert.equal(e.falaAtual, null);
  assert.deepEqual(e.filaFalas, []);
});

test("ALUNO_SEGUROU em aguardando_aluno abre o microfone", () => {
  assert.equal(cenaReducer(emStatus("aguardando_aluno"), { tipo: "ALUNO_SEGUROU" }).status, "aluno_falando");
});

test("SOLTOU com texto vai para revisando_texto e guarda o rascunho (sem espaços nas pontas)", () => {
  const e = cenaReducer(emStatus("aluno_falando"), { tipo: "SOLTOU", texto: "  dor no peito  " });
  assert.equal(e.status, "revisando_texto");
  assert.equal(e.rascunhoAluno, "dor no peito");
});

test("SOLTOU vazio ou só espaços volta para aguardando_aluno", () => {
  for (const texto of ["", "   ", undefined]) {
    assert.equal(cenaReducer(emStatus("aluno_falando"), { tipo: "SOLTOU", texto }).status, "aguardando_aluno");
  }
});

test("ENVIOU_TEXTO a partir de aguardando_aluno e de revisando_texto registra o turno e o id pendente", () => {
  for (const de of ["aguardando_aluno", "revisando_texto"]) {
    const e = cenaReducer(emStatus(de), { tipo: "ENVIOU_TEXTO", texto: "Bom dia", canal: "voz", turnoId: "t1" });
    assert.equal(e.status, "processando");
    assert.equal(e.turnoPendenteId, "t1");
    assert.deepEqual(e.turnos.at(-1), { autor: "aluno", texto: "Bom dia", canal: "voz" });
  }
});

test("ENVIOU_TEXTO durante a fala do personagem interrompe a fala e a fila", () => {
  const e = cenaReducer(emStatus("personagem_falando", { falaAtual: { texto: "a" }, filaFalas: [{ texto: "b" }] }), { tipo: "ENVIOU_TEXTO", texto: "Pode falar", turnoId: "t2" });
  assert.equal(e.status, "processando");
  assert.equal(e.falaAtual, null);
  assert.deepEqual(e.filaFalas, []);
  assert.equal(e.turnoPendenteId, "t2");
});

test("ENVIOU_TEXTO com texto vazio é ignorado; canal padrão é texto", () => {
  const base = emStatus("aguardando_aluno");
  assert.equal(cenaReducer(base, { tipo: "ENVIOU_TEXTO", texto: "  " }), base);
  assert.equal(cenaReducer(base, { tipo: "ENVIOU_TEXTO", texto: "oi" }).turnos.at(-1).canal, "texto");
});

test("RESPOSTA: processando -> personagem_falando, limpa rascunho e id pendente", () => {
  const e = rodar(emStatus("processando", { rascunhoAluno: "oi", turnoPendenteId: "t1" }), { tipo: "RESPOSTA", falas: [{ texto: "Olá, enfermeiro.", origem: "aovivo" }] });
  assert.equal(e.status, "personagem_falando");
  assert.equal(e.rascunhoAluno, "");
  assert.equal(e.turnoPendenteId, null);
  assert.equal(e.turnos.at(-1).texto, "Olá, enfermeiro.");
});

test("RESPOSTA sem falas aguarda o aluno", () => {
  assert.equal(cenaReducer(emStatus("processando"), { tipo: "RESPOSTA", falas: [] }).status, "aguardando_aluno");
});

test("FALHOU preserva o rascunho do aluno e guarda o erro", () => {
  const e = cenaReducer(emStatus("processando", { rascunhoAluno: "preciso disso", turnoPendenteId: "t9" }), { tipo: "FALHOU", erro: { codigo: "IA_INDISPONIVEL" } });
  assert.equal(e.status, "erro_recuperavel");
  assert.equal(e.rascunhoAluno, "preciso disso");
  assert.equal(e.erro.codigo, "IA_INDISPONIVEL");
});

test("FALHOU sem erro usa ERRO_INTERNO", () => {
  assert.equal(cenaReducer(emStatus("processando"), { tipo: "FALHOU" }).erro.codigo, "ERRO_INTERNO");
});

test("REENVIAR reaproveita o turnoPendenteId e limpa o erro", () => {
  const e = cenaReducer(emStatus("erro_recuperavel", { turnoPendenteId: "t9", erro: { codigo: "REDE" }, rascunhoAluno: "x" }), { tipo: "REENVIAR" });
  assert.equal(e.status, "processando");
  assert.equal(e.turnoPendenteId, "t9");
  assert.equal(e.erro, null);
  assert.equal(e.rascunhoAluno, "x");
});

test("ENCERRAR vale em qualquer estado ativo e esvazia a fila", () => {
  for (const s of ["ocioso", "personagem_falando", "aguardando_aluno", "aluno_falando", "revisando_texto", "processando", "erro_recuperavel"]) {
    const e = cenaReducer(emStatus(s, { filaFalas: [F("x")] }), { tipo: "ENCERRAR" });
    assert.equal(e.status, "encerrada", s);
    assert.deepEqual(e.filaFalas, []);
  }
});

test("COTA_EXCEDIDA bloqueia a cena com o erro", () => {
  for (const s of ["personagem_falando", "aguardando_aluno", "processando"]) {
    const e = cenaReducer(emStatus(s), { tipo: "COTA_EXCEDIDA", mensagem: "limite" });
    assert.equal(e.status, "bloqueada", s);
    assert.equal(e.erro.codigo, "COTA_EXCEDIDA");
  }
});

test("encerrada e bloqueada são finais: nada as tira de lá", () => {
  for (const s of ["encerrada", "bloqueada"]) {
    const base = emStatus(s);
    for (const acao of [{ tipo: "INICIAR", falas: [F("a")] }, { tipo: "RESPOSTA", falas: [F("a")] }, { tipo: "ALUNO_SEGUROU" }, { tipo: "ENVIOU_TEXTO", texto: "a" }, { tipo: "ENCERRAR" }, { tipo: "COTA_EXCEDIDA" }, { tipo: "REENVIAR" }, { tipo: "FALHOU" }]) {
      assert.equal(cenaReducer(base, acao), base, `${s} + ${acao.tipo}`);
    }
  }
});

test("transições inválidas devolvem o mesmo estado (RESPOSTA fora de processando, etc.)", () => {
  const invalidas = [
    ["ocioso", "FALA_TERMINOU"],
    ["ocioso", "ALUNO_SEGUROU"],
    ["aguardando_aluno", "RESPOSTA"],
    ["aguardando_aluno", "SOLTOU"],
    ["aguardando_aluno", "FALA_TERMINOU"],
    ["personagem_falando", "REENVIAR"],
    ["aluno_falando", "ENVIOU_TEXTO"],
    ["aluno_falando", "RESPOSTA"],
    ["processando", "ALUNO_SEGUROU"],
    ["processando", "SOLTOU"],
    ["processando", "REENVIAR"],
    ["erro_recuperavel", "RESPOSTA"],
    ["revisando_texto", "RESPOSTA"],
  ];
  for (const [s, tipo] of invalidas) {
    const base = emStatus(s);
    assert.equal(cenaReducer(base, { tipo, falas: [F("a")], texto: "a" }), base, `${s} + ${tipo}`);
  }
});

test("ação desconhecida não muda nada", () => {
  const base = emStatus("aguardando_aluno");
  assert.equal(cenaReducer(base, { tipo: "XYZ" }), base);
});

test("o reducer não altera o estado recebido (imutável)", () => {
  const base = emStatus("processando", { turnos: [{ autor: "aluno", texto: "oi" }] });
  const copia = JSON.stringify(base);
  cenaReducer(base, { tipo: "RESPOSTA", falas: [F("a")] });
  assert.equal(JSON.stringify(base), copia);
});

test("conversa completa: abertura, voz, revisão, envio, falha, nova tentativa e resposta", () => {
  let e = rodar(criarEstado(), { tipo: "INICIAR", falas: [F("Bom dia")] }, { tipo: "FALA_TERMINOU" });
  e = rodar(e, { tipo: "ALUNO_SEGUROU" }, { tipo: "SOLTOU", texto: "como o senhor está?" }, { tipo: "ENVIOU_TEXTO", texto: "como o senhor está?", canal: "voz", turnoId: "t1" });
  e = rodar(e, { tipo: "FALHOU", erro: { codigo: "REDE" } }, { tipo: "REENVIAR" });
  assert.equal(e.turnoPendenteId, "t1");
  e = cenaReducer(e, { tipo: "RESPOSTA", falas: [{ texto: "Tô meio cansado.", origem: "aovivo" }] });
  assert.equal(e.status, "personagem_falando");
  assert.deepEqual(e.turnos.map((t) => t.autor), ["personagem", "aluno", "personagem"]);
});

test("gravar de novo enquanto revisa o texto: ALUNO_SEGUROU e SOLTOU funcionam (2ª gravação antes de enviar)", () => {
  const revisando = rodar(criarEstado({ status: "aguardando_aluno" }), { tipo: "ALUNO_SEGUROU" }, { tipo: "SOLTOU", texto: "primeira" });
  assert.equal(revisando.status, "revisando_texto");
  const de_novo = rodar(revisando, { tipo: "ALUNO_SEGUROU" }, { tipo: "SOLTOU", texto: "segunda" });
  assert.equal(de_novo.status, "revisando_texto");
  assert.equal(de_novo.rascunhoAluno, "segunda");
});
