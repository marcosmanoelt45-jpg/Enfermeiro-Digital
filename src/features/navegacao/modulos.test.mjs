import test from "node:test";
import assert from "node:assert/strict";
import {
  GAVETA_PRATICA,
  MODULOS,
  ROTAS_CONHECIDAS,
  itensDoDock,
  modulosDaTrilha,
  modulosDoHeader,
  opcoesDaGavetaPratica,
} from "./modulos.js";

const nenhuma = () => false;
const semQuery = (rota) => rota.split("?")[0];

// Módulo de mentira com lugar em todas as superfícies e uma flag própria.
const MODULO_TESTE = {
  id: "teste",
  rota: "/",
  grupo: "pratica",
  flag: "flagDeTeste",
  header: { rotulo: "Teste", icone: "Mic", ordem: 1 },
  dock: { rotulo: "Teste", icone: "Mic", ordem: 1 },
  trilha: { titulo: "Teste", subtitulo: "x", selo: "x", icone: "Mic", ordem: 1 },
};
const OPCAO_TESTE = { id: "opcao_teste", modulo: "teste", rota: "/", titulo: "Teste", subtitulo: "x", icone: "Mic", ordem: 1 };

test("os ids dos módulos são únicos", () => {
  const ids = MODULOS.map((m) => m.id);
  assert.equal(new Set(ids).size, ids.length);
  const gavetas = GAVETA_PRATICA.map((o) => o.id);
  assert.equal(new Set(gavetas).size, gavetas.length);
});

test("toda rota de todas as listas existe na lista de rotas conhecidas", () => {
  const rotas = [
    ...MODULOS.map((m) => m.rota),
    ...GAVETA_PRATICA.map((o) => o.rota),
    ...modulosDoHeader(nenhuma).map((m) => m.rota),
    ...itensDoDock(nenhuma).map((m) => m.rota),
    ...opcoesDaGavetaPratica(nenhuma).map((o) => o.rota),
    ...modulosDaTrilha(nenhuma).map((m) => m.rota),
  ];
  for (const rota of rotas) assert.ok(ROTAS_CONHECIDAS.includes(semQuery(rota)), `rota desconhecida: ${rota}`);
});

test("cada opção da gaveta aponta para um módulo que existe", () => {
  const ids = new Set(MODULOS.map((m) => m.id));
  for (const o of GAVETA_PRATICA) assert.ok(ids.has(o.modulo), `módulo inexistente: ${o.modulo}`);
});

test("as listas de hoje têm o mesmo conteúdo e a mesma ordem de antes do registro", () => {
  assert.deepEqual(
    modulosDoHeader(nenhuma).map((m) => [m.id, m.rotulo, m.rota, m.icone, m.briefingId, m.novo]),
    [
      ["hub", "Início", "/", "LayoutGrid", null, false],
      ["videochamada", "Videochamada", "/videochamada", "PhoneCall", null, true],
      ["procedimentos", "Procedimentos", "/procedimentos", "Video", null, false],
      ["montar", "Montar Caso", "/montar-caso", "PlusCircle", "montar", false],
      ["casos", "Casos Clínicos", "/simulador-casos", "BookOpen", "casos", false],
      ["sbar", "Plantão SBAR", "/passagem-plantao", "ArrowRightLeft", "sbar", false],
      ["calculos", "Cálculo de Doses", "/laboratorio-calculos", "Calculator", "calculos", false],
    ]
  );
  assert.deepEqual(
    itensDoDock(nenhuma).map((m) => [m.rotulo, m.rota, m.icone, m.exato, m.gaveta]),
    [
      ["Início", "/", "Home", true, false],
      ["Casos", "/simulador-casos", "ClipboardList", false, true],
      ["Doses", "/laboratorio-calculos", "Calculator", false, false],
      ["Vídeos", "/procedimentos", "Video", false, false],
      ["Perfil", "/conta", "User", false, false],
    ]
  );
  assert.deepEqual(
    opcoesDaGavetaPratica(nenhuma).map((o) => [o.id, o.rota]),
    [
      ["atendimento_voz", "/videochamada"],
      ["continue", "/simulador-casos"],
      ["pe_simulator", "/simulador-casos"],
      ["case_studio", "/montar-caso"],
      ["sbar_handoff", "/passagem-plantao"],
      ["semiology", "/simulador-casos?mode=semiology"],
      ["history", "/simulador-casos?action=history"],
    ]
  );
  assert.deepEqual(
    modulosDaTrilha(nenhuma).map((m) => [m.id, m.rota, m.selo, m.destaque]),
    [
      ["videochamada", "/videochamada", "NOVO", true],
      ["calculos", "/laboratorio-calculos", "4 Modos", false],
      ["sbar", "/passagem-plantao", "Preceptoria IA", false],
      ["procedimentos", "/procedimentos", "Checklists", false],
      ["montar", "/montar-caso", "Escores + Voz", false],
    ]
  );
});

test("módulo com a flag desligada não aparece em nenhuma lista", () => {
  const modulos = [...MODULOS, MODULO_TESTE];
  const opcoes = [...GAVETA_PRATICA, OPCAO_TESTE];
  assert.ok(!modulosDoHeader(nenhuma, modulos).some((m) => m.id === "teste"));
  assert.ok(!itensDoDock(nenhuma, modulos).some((m) => m.id === "teste"));
  assert.ok(!modulosDaTrilha(nenhuma, modulos).some((m) => m.id === "teste"));
  assert.ok(!opcoesDaGavetaPratica(nenhuma, modulos, opcoes).some((o) => o.id === "opcao_teste"));
});

test("módulo com a flag ligada aparece em todas as listas, na ordem pedida", () => {
  const modulos = [...MODULOS, MODULO_TESTE];
  const opcoes = [...GAVETA_PRATICA, OPCAO_TESTE];
  const ativa = (nome) => nome === "flagDeTeste";
  assert.equal(modulosDoHeader(ativa, modulos)[0].id, "teste");
  assert.equal(itensDoDock(ativa, modulos)[0].id, "teste");
  assert.equal(modulosDaTrilha(ativa, modulos)[0].id, "teste");
  assert.equal(opcoesDaGavetaPratica(ativa, modulos, opcoes)[0].id, "opcao_teste");
});

test("as flags de hoje deixam o app igual ao de antes (tudo desligado)", () => {
  assert.equal(modulosDoHeader().length, 7);
  assert.equal(itensDoDock().length, 5);
  assert.equal(opcoesDaGavetaPratica().length, 7);
  assert.equal(modulosDaTrilha().length, 5);
});

test("com a flag tecnicas, o dock troca Vídeos por Técnicas na mesma posição", () => {
  const sem = itensDoDock(nenhuma);
  const com = itensDoDock((n) => n === "tecnicas");
  assert.ok(sem.some((i) => i.rota === "/procedimentos"));
  assert.ok(!sem.some((i) => i.rota === "/tecnicas"));
  assert.ok(!com.some((i) => i.rota === "/procedimentos"));
  const tec = com.find((i) => i.rota === "/tecnicas");
  assert.equal(tec.ordem, sem.find((i) => i.rota === "/procedimentos").ordem);
  assert.equal(com.length, sem.length);
});
