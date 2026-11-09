import test from "node:test";
import assert from "node:assert/strict";
import { avaliarArrastar, avaliarOrdenar, avaliarTocar, avaliarMedir, avaliarEscolher, AVALIADORES, notaDoResultado } from "./avaliar.js";
import { gerarOrdenarDeProcedimento, gerarTodosOsOrdenar, cortarTitulo } from "./doProcedimento.js";
import { gerarEscolherDeAchado, gerarTodosOsEscolher } from "./daSemiologia.js";
import { validarDefinicao } from "./validarDefinicao.js";
import { MINIJOGOS_ESTATICOS, montarCatalogo } from "../dados/index.js";
import bandeja from "../dados/bandeja-curativo-simples.js";
import ausculta from "../dados/ausculta-pulmonar.js";
import contarFr from "../dados/contar-fr.js";
import { SEMIOLOGY_KNOWLEDGE_BASE } from "../../../data/semiologyFindings.js";

// ---- arrastar ----
test("arrastar: acerto no alvo certo; distrator em qualquer alvo é erro; concluir = corretos dentro e nada a mais", () => {
  const certos = bandeja.arrastar.itens.filter((i) => i.alvoCorreto);
  const todos = Object.fromEntries(certos.map((i) => [i.id, "bandeja"]));
  const r = avaliarArrastar(bandeja, todos);
  assert.equal(r.acertos, certos.length);
  assert.equal(r.erros, 0);
  assert.equal(r.concluido, true);

  const comDistrator = avaliarArrastar(bandeja, { ...todos, bisturi: "bandeja" });
  assert.equal(comDistrator.erros, 1);
  assert.equal(comDistrator.concluido, false, "um item a mais na bandeja também é erro");
  assert.equal(comDistrator.detalhes.find((d) => d.id === "bisturi").estado, "errado");

  const faltando = avaliarArrastar(bandeja, { luvas: "bandeja" });
  assert.equal(faltando.concluido, false);
  assert.equal(faltando.acertos, 1);
  assert.equal(avaliarArrastar(bandeja, {}).concluido, false);
});

test("arrastar: item correto num alvo errado conta erro", () => {
  const def = { arrastar: { alvos: [{ id: "a" }, { id: "b" }], itens: [{ id: "x", alvoCorreto: "a" }, { id: "y", alvoCorreto: null, explicacao: "e" }] } };
  assert.deepEqual([avaliarArrastar(def, { x: "b" }).erros, avaliarArrastar(def, { x: "b" }).acertos], [1, 0]);
  assert.equal(avaliarArrastar(def, { x: "a", y: null }).concluido, true);
});

// ---- ordenar ----
const ORD = { ordenar: { passos: [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }] } };
test("ordenar: ordem certa conclui; erros são inversões; mostra só os passos fora de lugar", () => {
  assert.deepEqual(avaliarOrdenar(ORD, ["a", "b", "c", "d"]), { acertos: 4, erros: 0, concluido: true, detalhes: ["a", "b", "c", "d"].map((id) => ({ id, ok: true })), foraDeLugar: [] });
  const troca = avaliarOrdenar(ORD, ["b", "a", "c", "d"]);
  assert.equal(troca.erros, 1);
  assert.deepEqual(troca.foraDeLugar, ["b", "a"]);
  assert.equal(troca.concluido, false);
  assert.equal(avaliarOrdenar(ORD, ["d", "c", "b", "a"]).erros, 6);
  assert.equal(avaliarOrdenar(ORD, ["a", "b"]).concluido, false);
});

// ---- tocar ----
test("tocar (explorar): conclui só quando todas as regiões foram tocadas, sem erros", () => {
  const ids = ausculta["tocar-regiao"].regioes.map((r) => r.id);
  assert.equal(ids.length, 12);
  assert.equal(avaliarTocar(ausculta, ids.slice(0, 11)).concluido, false);
  const r = avaliarTocar(ausculta, [...ids, ids[0], "inexistente"]);
  assert.equal(r.concluido, true);
  assert.equal(r.acertos, 12);
  assert.equal(r.erros, 0);
});

test("tocar (encontrar): acerta a região correta; toque errado conta erro", () => {
  const def = { "tocar-regiao": { objetivo: "encontrar", regioes: [{ id: "r1", correta: true }, { id: "r2" }, { id: "r3" }] } };
  assert.deepEqual(avaliarTocar(def, ["r2", "r3"]).concluido, false);
  assert.equal(avaliarTocar(def, ["r2", "r3"]).erros, 2);
  const r = avaliarTocar(def, ["r2", "r1"]);
  assert.deepEqual([r.acertos, r.erros, r.concluido], [1, 1, true]);
});

// ---- medir ----
test("medir: dentro da tolerância acerta; aceita vírgula decimal; lixo erra", () => {
  assert.equal(avaliarMedir(contarFr, 28).concluido, true);
  assert.equal(avaliarMedir(contarFr, "30").concluido, true);
  assert.equal(avaliarMedir(contarFr, "26").concluido, true);
  assert.equal(avaliarMedir(contarFr, 31).concluido, false);
  assert.equal(avaliarMedir(contarFr, "").concluido, false);
  assert.equal(avaliarMedir(contarFr, "abc").concluido, false);
  assert.equal(avaliarMedir({ medir: { valorCorreto: 36.5, tolerancia: 0.1 } }, "36,5").concluido, true);
});

// ---- escolher ----
test("escolher: opção correta acerta e devolve o feedback da escolhida", () => {
  const def = { escolher: { opcoes: [{ id: "A", correta: false, feedback: "não" }, { id: "B", correta: true, feedback: "sim" }] } };
  assert.deepEqual(avaliarEscolher(def, "B"), { acertos: 1, erros: 0, concluido: true, detalhes: [{ id: "B", ok: true, feedback: "sim" }] });
  const errada = avaliarEscolher(def, "A");
  assert.deepEqual([errada.acertos, errada.erros, errada.detalhes[0].feedback], [0, 1, "não"]);
  assert.equal(avaliarEscolher(def, "Z").erros, 0);
});

test("os 5 tipos têm avaliador e a nota é round(100 × acertos / (acertos + erros))", () => {
  assert.deepEqual(Object.keys(AVALIADORES).sort(), ["arrastar", "escolher", "medir", "ordenar", "tocar-regiao"]);
  assert.equal(notaDoResultado({ acertos: 3, erros: 1 }), 75);
  assert.equal(notaDoResultado({ acertos: 0, erros: 0 }), 0);
  assert.equal(notaDoResultado({ acertos: 1, erros: 2 }), 33);
});

// ---- geradores ----
const proc = (id, n, extra = {}) => ({ id, title: `Procedimento ${id}`, category: "curativos", officialGuideUrl: "https://x", steps: Array.from({ length: n }, (_, i) => ({ id: `s${n - i}`, stepNumber: n - i, title: `Passo ${n - i}` })), ...extra });

test("gerarOrdenarDeProcedimento ordena por stepNumber, corta títulos longos e pula com menos de 4 passos", () => {
  const j = gerarOrdenarDeProcedimento(proc("p1", 5));
  assert.equal(j.tipo, "ordenar");
  assert.equal(j.id, "ordenar-p1");
  assert.deepEqual(j.ordenar.passos.map((p) => p.id), ["s1", "s2", "s3", "s4", "s5"]);
  assert.equal(j.ordenar.origem.procedimentoId, "p1");
  assert.equal(gerarOrdenarDeProcedimento(proc("p2", 3)), null);
  assert.equal(gerarOrdenarDeProcedimento(proc("p3", 4)).ordenar.passos.length, 4);
  const longo = proc("p4", 4);
  longo.steps[0].title = "x".repeat(200);
  const texto = gerarOrdenarDeProcedimento(longo).ordenar.passos.find((p) => p.id === "s4").texto;
  assert.equal(texto.length, 70);
  assert.ok(texto.endsWith("…"));
  assert.equal(cortarTitulo("curto"), "curto");
});

test("categoria do minijogo gerado: mapeada, com exceção dos sinais vitais e padrão 'procedimentos'", () => {
  assert.equal(gerarOrdenarDeProcedimento(proc("a", 4, { category: "curativos" })).categoria, "curativos");
  assert.equal(gerarOrdenarDeProcedimento(proc("b", 4, { category: "semiotecnica" })).categoria, "biosseguranca");
  assert.equal(gerarOrdenarDeProcedimento(proc("verificacao-sinais-vitais", 4, { category: "semiotecnica" })).categoria, "sinais_vitais");
  assert.equal(gerarOrdenarDeProcedimento(proc("c", 4, { category: "eliminacoes" })).categoria, "procedimentos");
  const { jogos, pulados } = gerarTodosOsOrdenar([proc("d", 6), proc("e", 2)]);
  assert.deepEqual([jogos.length, pulados], [1, ["e"]]);
});

test("um minijogo 'ordenar' gerado é concluível: a ordem original resolve e a embaralhada não", () => {
  const j = gerarOrdenarDeProcedimento(proc("p", 6));
  const certa = j.ordenar.passos.map((p) => p.id);
  assert.equal(avaliarOrdenar(j, certa).concluido, true);
  assert.equal(avaliarOrdenar(j, [...certa].reverse()).concluido, false);
});

test("semiologia: os 10 achados viram 'escolher' válidos, com exatamente 1 opção correta", () => {
  const todos = gerarTodosOsEscolher(SEMIOLOGY_KNOWLEDGE_BASE);
  assert.equal(todos.length, 10);
  for (const j of todos) {
    assert.deepEqual(validarDefinicao(j), [], j.id);
    assert.equal(j.escolher.opcoes.filter((o) => o.correta).length, 1, j.id);
    assert.ok(j.escolher.opcoes.length >= 4, j.id);
    const certa = j.escolher.opcoes.find((o) => o.correta);
    assert.equal(avaliarEscolher(j, certa.id).concluido, true);
  }
  assert.equal(gerarEscolherDeAchado("inexistente", SEMIOLOGY_KNOWLEDGE_BASE), null);
  assert.ok(gerarEscolherDeAchado("tiragem", SEMIOLOGY_KNOWLEDGE_BASE).achado.campo === "tiragem");
});

// ---- registro e validação ----
test("os minijogos estáticos são válidos e o catálogo não repete ids", () => {
  for (const m of MINIJOGOS_ESTATICOS) assert.deepEqual(validarDefinicao(m), [], m.id);
  const cat = montarCatalogo({ procedimentos: [proc("p1", 5), proc("p2", 8), proc("p3", 2)], semiologia: SEMIOLOGY_KNOWLEDGE_BASE });
  const ids = cat.todos.map((m) => m.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(cat.todos.length, MINIJOGOS_ESTATICOS.length + 2 + 10);
  assert.ok(MINIJOGOS_ESTATICOS.length >= 11);
  assert.deepEqual(cat.pulados, ["p3"]);
  assert.equal(cat.porId["contar-fr"].tipo, "medir");
});

test("validarDefinicao acusa os erros mais comuns", () => {
  const ok = JSON.parse(JSON.stringify(contarFr));
  assert.deepEqual(validarDefinicao(ok), []);
  assert.match(validarDefinicao({ ...ok, id: "Maiúscula" }).join(), /id deve ter/);
  assert.match(validarDefinicao({ ...ok, tipo: "voar" }).join(), /tipo inválido/);
  assert.match(validarDefinicao({ ...ok, categoria: "x" }).join(), /categoria inválida/);
  assert.match(validarDefinicao({ ...ok, medir: { ...ok.medir, instrumento: "raio-x" } }).join(), /instrumento inválido/);
  const sem = { ...ok };
  delete sem.medir;
  assert.match(validarDefinicao(sem).join(), /campo obrigatório ausente: medir/);
  const bandejaRuim = JSON.parse(JSON.stringify(bandeja));
  bandejaRuim.arrastar.itens.find((i) => i.alvoCorreto === null).explicacao = "";
  assert.match(validarDefinicao(bandejaRuim).join(), /sem explicação/);
  assert.match(validarDefinicao(null).join(), /vazia/);
});

test("bandeja: 9 itens certos (POP do HCPA), banco de 10 distratores com 5 sorteados, todos com explicação", () => {
  assert.equal(bandeja.arrastar.itens.filter((i) => i.alvoCorreto).length, 9);
  const distratores = bandeja.arrastar.itens.filter((i) => !i.alvoCorreto);
  assert.equal(distratores.length, 10);
  assert.equal(bandeja.arrastar.sorteio.distratores, 5);
  for (const d of distratores) assert.ok(d.explicacao.length > 10);
  assert.ok(bandeja.fonte.url.startsWith("https://"));
  for (const i of bandeja.arrastar.itens) assert.ok(i.imagemTopo, `${i.id} sem imagem vista de cima`);
});

test("ausculta: 6 focos anteriores e 6 posteriores, todos com achado e sem áudio sem licença", () => {
  const r = ausculta["tocar-regiao"].regioes;
  assert.equal(r.filter((x) => x.vista === "anterior").length, 6);
  assert.equal(r.filter((x) => x.vista === "posterior").length, 6);
  for (const x of r) {
    assert.ok(x.achado.startsWith("Som:"));
    assert.equal(x.audio, undefined, "áudio só com licença registrada");
  }
});

test("2 chances: avisos específicos da bandeja (vazia, falta um, sobra)", async () => {
  const { avisoDoErro } = await import("./chances.js");
  const certos = bandeja.arrastar.itens.filter((i) => i.alvoCorreto);
  const todos = Object.fromEntries(certos.map((i) => [i.id, "bandeja"]));
  assert.equal(avisoDoErro(bandeja, {}, null).vazio, true);
  assert.match(avisoDoErro(bandeja, {}, null).mensagem, /vazia/);
  const menosUm = { ...todos };
  delete menosUm[certos[0].id];
  assert.match(avisoDoErro(bandeja, menosUm, null).mensagem, /quase/i);
  assert.match(avisoDoErro(bandeja, { ...todos, bisturi: "bandeja" }, null).mensagem, /não é usado/);
});
