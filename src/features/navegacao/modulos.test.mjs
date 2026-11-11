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

test("menus finais (D2): header, dock, gaveta Prática e trilha", () => {
  assert.deepEqual(
    modulosDoHeader(nenhuma).map((m) => [m.id, m.rotulo, m.rota, m.briefingId]),
    [
      ["hub", "Início", "/", null],
      ["consulta", "Consulta ao Vivo", "/consulta", "consulta"],
      ["sbar", "Plantão", "/passagem-plantao", "sbar"],
      ["calculos", "Cálculo", "/laboratorio-calculos", "calculos"],
      ["tecnicas", "Vídeos", "/tecnicas", "tecnicas"],
      ["minijogos", "Minijogos", "/minijogos", null],
      ["questoes", "Questões", "/questoes", null],
      ["casos", "Casos Clínicos", "/simulador-casos", "casos"],
    ]
  );
  assert.deepEqual(
    itensDoDock(nenhuma).map((m) => [m.rotulo, m.rota, m.gaveta]),
    [
      ["Início", "/", false],
      ["Menu", "/simulador-casos", true],
      ["Cálculo", "/laboratorio-calculos", false],
      ["Vídeos", "/tecnicas", false],
      ["Perfil", "/conta", false],
    ]
  );
  assert.deepEqual(
    opcoesDaGavetaPratica(nenhuma).map((o) => o.id),
    ["consulta", "plantao", "questoes", "minijogos", "pe_simulator", "continue", "history"]
  );
  // Plantão aparece uma vez só no Menu e traz as duas maneiras de fazer; Semiologia saiu.
  const plantao = opcoesDaGavetaPratica(nenhuma).find((o) => o.id === "plantao");
  assert.deepEqual(plantao.escolhas.map((e) => e.rota), ["/passagem-plantao", "/plantao/gravacao"]);
  assert.ok(!opcoesDaGavetaPratica(nenhuma).some((o) => /semiolog|gravacao/i.test(o.id + o.rota)));
  assert.deepEqual(
    modulosDaTrilha(nenhuma).map((m) => [m.id, m.destaque]),
    [["consulta", true], ["sbar", false], ["calculos", false], ["tecnicas", false], ["minijogos", false], ["questoes", false]]
  );
});

test("nenhum menu aponta mais para a Videochamada nem para o Montar Caso", () => {
  const rotas = [
    ...modulosDoHeader(nenhuma), ...itensDoDock(nenhuma), ...opcoesDaGavetaPratica(nenhuma), ...modulosDaTrilha(nenhuma),
  ].map((m) => m.rota);
  for (const r of rotas) assert.ok(!/videochamada|montar-caso|procedimentos/.test(r), r);
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
