import test from "node:test";
import assert from "node:assert/strict";
import { criarConsulta, variarSinais } from "./criarConsulta.ts";
import { turnoConsulta } from "./turnoConsulta.ts";
import { retomarConsulta } from "./retomarConsulta.ts";
import { montarResposta } from "./resposta.ts";
import { REGRAS_FIXAS } from "../../_shared/prompts/paciente.ts";
import { ErroApp } from "../../_shared/erros.ts";
import { ARQUETIPOS } from "../../_shared/dados/arquetipos.js";
import { fichaDeTemplate } from "../../_shared/logica/fichaDeTemplate.js";

const USER = "u1";
const OUTRO = "u2";

// ---- repositório em memória, com a mesma semântica do SQL ----
function repoEmMemoria() {
  const db = { sessoes: new Map(), fichas: new Map(), turnos: [] };
  let n = 0;
  return {
    db,
    async criarSessao(d) {
      const id = `s${++n}`;
      db.sessoes.set(id, { id, user_id: d.userId, personagem_id: d.personagemId, personalidade_publica: d.personalidadePublica, tema: d.tema, status: "ativa", turnos_aluno: 0, confianca: d.confianca, contagem_temas: {}, notas_memoria: [] });
      return { id };
    },
    async salvarFicha(id, ficha) { db.fichas.set(id, structuredClone(ficha)); },
    async carregarSessao(id, userId) { const s = db.sessoes.get(id); return s && s.user_id === userId ? structuredClone(s) : null; },
    async carregarFicha(id) { return structuredClone(db.fichas.get(id) ?? null); },
    async carregarTurnos(id) { return structuredClone(db.turnos.filter((t) => t.sessao_id === id).sort((a, b) => a.ordem - b.ordem)); },
    async respostaSalva(turnoId, sessaoId) {
      const a = db.turnos.find((t) => t.id === turnoId && t.sessao_id === sessaoId);
      if (!a) return null;
      const p = db.turnos.find((t) => t.sessao_id === sessaoId && t.ordem === a.ordem + 1);
      return p ? { fala: p.texto, emocao: p.emocao, confianca: p.confianca_depois, turnosAluno: db.sessoes.get(sessaoId).turnos_aluno } : null;
    },
    async registrarTurno(r) {
      if (db.turnos.some((t) => t.id === r.turnoAlunoId)) return false;
      const s = db.sessoes.get(r.sessaoId);
      if (s.status !== "ativa") throw new ErroApp("SESSAO_ENCERRADA", "encerrada");
      const ordem = db.turnos.filter((t) => t.sessao_id === r.sessaoId).length + 1;
      db.turnos.push({ id: r.turnoAlunoId, sessao_id: r.sessaoId, ordem, autor: "aluno", texto: r.textoAluno, canal: r.canal });
      db.turnos.push({ id: `p${db.turnos.length}`, sessao_id: r.sessaoId, ordem: ordem + 1, autor: "paciente", texto: r.fala, emocao: r.emocao, revelados: r.revelados, confianca_depois: r.confianca });
      Object.assign(s, { turnos_aluno: s.turnos_aluno + 1, confianca: r.confianca, contagem_temas: r.contagemTemas, notas_memoria: r.notas });
      return true;
    },
  };
}

// ---- IA falsa: devolve respostas roteirizadas e guarda o que recebeu ----
function llmFalso(...respostas) {
  const f = async (opcoes) => {
    f.chamadas.push(opcoes);
    const r = respostas[Math.min(f.chamadas.length - 1, respostas.length - 1)];
    const texto = typeof r === "function" ? r(opcoes) : typeof r === "string" ? r : JSON.stringify(r);
    return { texto, modelo: "fake/modelo", truncado: false, uso: { entrada: 100, saida: 20 } };
  };
  f.chamadas = [];
  return f;
}

const sorteioFixo = () => 0.5;
const ARQ = ARQUETIPOS.find((a) => a.id === "sc_icc_perfil_b");
const entradaCriar = (extra = {}) => ({ arquetipoId: ARQ.id, tema: null, idade: 68, sexo: "M", personagemId: "marcus", personalidadeId: "desconfiado", dificuldade: "normal", ...extra });

// Ficha como a IA a devolveria (sem os campos do servidor).
function fichaDaIa(extra = {}) {
  const t = fichaDeTemplate(ARQ, { personalidadeId: "desconfiado", dificuldade: "normal" });
  const { identificacao, queixaPrincipal, fatos, examesDisponiveis, diagnosticosEsperados, intervencoesEsperadas } = t;
  return { identificacao: { ...identificacao, nome: "Antônio Pereira" }, queixaPrincipal, fatos, examesDisponiveis, diagnosticosEsperados, intervencoesEsperadas, ...extra };
}

async function novaConsulta(repo, extra = {}, llm = llmFalso(fichaDaIa())) {
  return criarConsulta(USER, entradaCriar(extra), { repo, llm, sorteio: sorteioFixo });
}

const TURNO = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const respostaIA = (extra = {}) => ({ fala: "Tô com falta de ar, enfermeiro.", emocao: "dor", revelados: [], temas_do_aluno: ["hda"], delta_confianca: 3, nota_memoria: "", exame_solicitado: null, ...extra });

async function preparar() {
  const repo = repoEmMemoria();
  const { sessaoId } = await novaConsulta(repo);
  return { repo, sessaoId };
}
const turno = (repo, sessaoId, llm, extra = {}, cota) =>
  turnoConsulta(USER, { sessaoId, turnoId: TURNO(extra.n ?? 1), texto: extra.texto ?? "Bom dia, como o senhor está?", canal: "texto" }, { repo, llm, cota });

// ================= criar_consulta =================
test("criar: IA válida -> sessão, ficha salva e briefing sem nenhum fato", async () => {
  const repo = repoEmMemoria();
  const r = await novaConsulta(repo);
  assert.equal(r.personagemId, "marcus");
  assert.deepEqual(Object.keys(r.briefing).sort(), ["idade", "nome", "queixa", "setor", "sexo", "sinaisVitais"]);
  assert.ok(!JSON.stringify(r).includes("fatos"));
  const ficha = repo.db.fichas.get(r.sessaoId);
  assert.equal(ficha.origem, "ia");
  assert.equal(ficha.arquetipoId, ARQ.id);
  assert.equal(repo.db.sessoes.get(r.sessaoId).user_id, USER);
});

test("criar: sinais vitais vêm do arquétipo (±5%), nunca da IA", async () => {
  const repo = repoEmMemoria();
  const llm = llmFalso(fichaDaIa({ sinaisVitais: { fc: 999 } }));
  const { sessaoId } = await novaConsulta(repo, {}, llm);
  const v = repo.db.fichas.get(sessaoId).sinaisVitais;
  for (const [campo, base] of Object.entries(ARQ.vitals)) assert.ok(Math.abs(v[campo] - base) <= Math.abs(base) * 0.05 + 0.1, `${campo}: ${v[campo]} vs ${base}`);
  const alto = variarSinais({ fc: 100, tax: 36.5 }, () => 1);
  const baixo = variarSinais({ fc: 100, tax: 36.5 }, () => 0);
  assert.deepEqual([baixo.fc, alto.fc, baixo.tax, alto.tax], [95, 105, 34.7, 38.3]);
});

test("criar: 'surpresa' vira personalidade real só no servidor", async () => {
  const repo = repoEmMemoria();
  const { sessaoId } = await novaConsulta(repo, { personalidadeId: "surpresa" }, llmFalso((o) => (o.mensagens[1].content.includes("PERSONALIDADE:") ? fichaDaIa() : fichaDaIa())));
  assert.equal(repo.db.sessoes.get(sessaoId).personalidade_publica, "surpresa");
  assert.notEqual(repo.db.fichas.get(sessaoId).personalidadeId, "surpresa");
});

test("criar: ficha inválida da IA -> uma nova tentativa com os problemas; depois, template", async () => {
  const repo = repoEmMemoria();
  const ruim = fichaDaIa({ fatos: [] });
  const llm = llmFalso(ruim, ruim);
  const r = await novaConsulta(repo, {}, llm);
  assert.equal(llm.chamadas.length, 2);
  const segunda = llm.chamadas[1].mensagens;
  assert.equal(segunda.at(-2).role, "assistant");
  assert.match(segunda.at(-1).content, /A ficha tem estes problemas/);
  assert.match(segunda.at(-1).content, /8 a 14 fatos/);
  assert.equal(repo.db.fichas.get(r.sessaoId).origem, "template");
});

test("criar: erra na 1ª, acerta na 2ª -> usa a ficha da IA", async () => {
  const repo = repoEmMemoria();
  const llm = llmFalso(fichaDaIa({ fatos: [] }), fichaDaIa());
  const r = await novaConsulta(repo, {}, llm);
  assert.equal(llm.chamadas.length, 2);
  assert.equal(repo.db.fichas.get(r.sessaoId).origem, "ia");
});

test("criar: IA que lança erro ou devolve lixo cai no template sem falhar", async () => {
  for (const resposta of ["isto não é json", () => { throw new ErroApp("IA_INDISPONIVEL", "x"); }]) {
    const repo = repoEmMemoria();
    const r = await novaConsulta(repo, {}, llmFalso(resposta));
    assert.equal(repo.db.fichas.get(r.sessaoId).origem, "template");
  }
});

test("criar: nome bloqueado é trocado por um nome comum", async () => {
  const repo = repoEmMemoria();
  const llm = llmFalso(fichaDaIa({ identificacao: { ...fichaDaIa().identificacao, nome: "Neymar da Silva" } }));
  const { sessaoId } = await novaConsulta(repo, {}, llm);
  assert.notEqual(repo.db.fichas.get(sessaoId).identificacao.nome, "Neymar da Silva");
});

test("criar: idade e sexo são os pedidos (não os da IA); tema sorteia caso do tema; ids inválidos dão ENTRADA_INVALIDA", async () => {
  const repo = repoEmMemoria();
  const { sessaoId } = await novaConsulta(repo, { sexo: "F", idade: 71 }, llmFalso(fichaDaIa({ identificacao: { ...fichaDaIa().identificacao, idade: 20, sexo: "M" } })));
  const f = repo.db.fichas.get(sessaoId);
  assert.equal(f.identificacao.idade, 71);
  assert.equal(f.identificacao.sexo, "F");

  const r2 = await criarConsulta(USER, entradaCriar({ arquetipoId: null, tema: "respiratorio" }), { repo, llm: llmFalso("lixo"), sorteio: () => 0 });
  assert.equal(repo.db.fichas.get(r2.sessaoId).arquetipoId, "sc_dpoc");
  await assert.rejects(criarConsulta(USER, entradaCriar({ arquetipoId: "nao_existe" }), { repo, llm: llmFalso("x") }), (e) => e.codigo === "ENTRADA_INVALIDA");
  await assert.rejects(criarConsulta(USER, entradaCriar({ arquetipoId: null, tema: "nao_existe" }), { repo, llm: llmFalso("x") }), (e) => e.codigo === "ENTRADA_INVALIDA");
});

// ================= turno_consulta =================
test("turno: resposta válida é gravada e a resposta tem só fala, emoção, rapport e turnos restantes", async () => {
  const { repo, sessaoId } = await preparar();
  const r = montarResposta({}, await turno(repo, sessaoId, llmFalso(respostaIA())));
  assert.deepEqual(Object.keys(r).sort(), ["emocao", "exame", "fala", "rapport", "turnosRestantes"]);
  assert.equal(r.fala, "Tô com falta de ar, enfermeiro.");
  assert.equal(r.emocao, "dor");
  assert.equal(r.turnosRestantes, 39);
  assert.ok(["baixo", "medio", "alto"].includes(r.rapport));
  assert.equal(repo.db.turnos.length, 2);
  assert.equal(repo.db.sessoes.get(sessaoId).turnos_aluno, 1);
  assert.equal(repo.db.sessoes.get(sessaoId).confianca, 33); // desconfiado começa em 30 (+3)
});

test("turno: a ficha, os fatos e a confiança numérica não aparecem na resposta", async () => {
  const { repo, sessaoId } = await preparar();
  const r = montarResposta({}, await turno(repo, sessaoId, llmFalso(respostaIA())));
  const texto = JSON.stringify(r);
  for (const proibido of ["fatos", "diagnosticosEsperados", "intervencoesEsperadas", "perguntaQueRevela", "confianca", "revelados"]) assert.ok(!texto.includes(proibido), proibido);
  const ficha = repo.db.fichas.get(sessaoId);
  const r2 = await retomarConsulta(USER, { sessaoId }, { repo });
  assert.ok(!JSON.stringify(r2).includes(ficha.fatos[2].texto));
});

test("turno: o texto verdadeiro de fato bloqueado NÃO chega à IA, em nenhuma mensagem", async () => {
  const { repo, sessaoId } = await preparar();
  const ficha = repo.db.fichas.get(sessaoId);
  const bloqueado = ficha.fatos.find((f) => f.revelacao === "confianca");
  const esquecido = ficha.fatos.find((f) => f.revelacao === "esquecido");
  bloqueado.texto = "TEXTO-SECRETO-NAO-ADESAO-XYZ";
  esquecido.texto = "TEXTO-SECRETO-ESQUECIDO-ABC";
  repo.db.fichas.set(sessaoId, ficha);
  const llm = llmFalso(respostaIA());
  await turno(repo, sessaoId, llm);
  const tudo = llm.chamadas.flatMap((c) => c.mensagens.map((m) => m.content)).join("\n");
  assert.ok(!tudo.includes("TEXTO-SECRETO-NAO-ADESAO-XYZ"));
  assert.ok(!tudo.includes("TEXTO-SECRETO-ESQUECIDO-ABC"));
  assert.ok(tudo.includes(bloqueado.versaoFalsa));
});

test("turno: o prompt vai na ordem certa e as REGRAS FIXAS são idênticas entre sessões", async () => {
  const a = await preparar();
  const b = { repo: a.repo, sessaoId: (await novaConsulta(a.repo, { personalidadeId: "ansioso", sexo: "F" })).sessaoId };
  const llmA = llmFalso(respostaIA());
  const llmB = llmFalso(respostaIA());
  await turno(a.repo, a.sessaoId, llmA);
  await turno(b.repo, b.sessaoId, llmB);
  const ma = llmA.chamadas[0].mensagens;
  const mb = llmB.chamadas[0].mensagens;
  assert.equal(ma[0].content, REGRAS_FIXAS);
  assert.equal(ma[0].content, mb[0].content);
  assert.deepEqual(ma.slice(0, 3).map((m) => m.role), ["system", "system", "system"]);
  assert.match(ma[1].content, /^CASO/);
  assert.match(ma[2].content, /^ESTADO DO TURNO/);
  assert.deepEqual(ma.at(-1), { role: "user", content: "Bom dia, como o senhor está?" });
  assert.equal(llmA.chamadas[0].temperatura, 0.8);
  assert.equal(llmA.chamadas[0].maxTokens, 220);
  assert.equal(llmA.chamadas[0].timeoutMs, 12000);
  assert.equal(llmA.chamadas[0].json, true);
  assert.ok(!ma[0].content.includes("Antônio"), "REGRAS FIXAS não pode ter nome nem dado da sessão");
});

test("turno: o histórico enviado tem no máximo os últimos 10 turnos, com o paciente só pela fala", async () => {
  const { repo, sessaoId } = await preparar();
  for (let i = 1; i <= 8; i++) await turno(repo, sessaoId, llmFalso(respostaIA({ fala: `fala ${i}` })), { n: i, texto: `pergunta ${i}` });
  const llm = llmFalso(respostaIA());
  await turno(repo, sessaoId, llm, { n: 9, texto: "pergunta 9" });
  const m = llm.chamadas[0].mensagens;
  const historico = m.slice(3, -1);
  assert.equal(historico.length, 10);
  assert.deepEqual(historico[0], { role: "user", content: "pergunta 4" });
  assert.deepEqual(historico.at(-1), { role: "assistant", content: "fala 8" });
});

test("turno: o texto do aluno é sanitizado (CPF, telefone, leito) antes da IA e antes de gravar", async () => {
  const { repo, sessaoId } = await preparar();
  const llm = llmFalso(respostaIA());
  await turno(repo, sessaoId, llm, { texto: "Meu CPF é 123.456.789-09, ligue 11 98765-4321, estou no leito 12" });
  const enviado = llm.chamadas[0].mensagens.at(-1).content;
  assert.ok(!/123\.456\.789-09|98765-4321|leito 12/i.test(enviado));
  assert.match(enviado, /CPF_MASCARADO/);
  assert.ok(!/123\.456\.789-09/.test(repo.db.turnos[0].texto));
});

test("turno: revelados que a IA marca sem estar liberados são descartados; confiança e temas atualizam", async () => {
  const { repo, sessaoId } = await preparar();
  const ficha = repo.db.fichas.get(sessaoId);
  const bloqueado = ficha.fatos.find((f) => f.revelacao === "confianca");
  const livre = ficha.fatos.find((f) => f.revelacao === "livre");
  await turno(repo, sessaoId, llmFalso(respostaIA({ revelados: [bloqueado.id, livre.id], temas_do_aluno: ["adesao", "habitos"], delta_confianca: 10, nota_memoria: "falou da filha Ana" })));
  const turnoPaciente = repo.db.turnos.find((t) => t.autor === "paciente");
  assert.deepEqual(turnoPaciente.revelados, [livre.id]);
  const s = repo.db.sessoes.get(sessaoId);
  assert.equal(s.confianca, 40); // 30 + 10
  assert.deepEqual(s.contagem_temas, { adesao: 1, habitos: 1 });
  assert.deepEqual(s.notas_memoria, ["falou da filha Ana"]);
});

test("turno: com confiança suficiente o fato confianca é liberado e entra no prompt", async () => {
  const { repo, sessaoId } = await preparar();
  repo.db.sessoes.get(sessaoId).confianca = 70;
  const ficha = repo.db.fichas.get(sessaoId);
  const f = ficha.fatos.find((x) => x.revelacao === "confianca");
  f.texto = "TEXTO-VERDADEIRO-LIBERADO";
  repo.db.fichas.set(sessaoId, ficha);
  const llm = llmFalso(respostaIA({ revelados: [f.id] }));
  await turno(repo, sessaoId, llm);
  assert.ok(llm.chamadas[0].mensagens.map((m) => m.content).join("\n").includes("TEXTO-VERDADEIRO-LIBERADO"));
  assert.deepEqual(repo.db.turnos.find((t) => t.autor === "paciente").revelados, [f.id]);
});

test("turno: o mesmo turnoId devolve a resposta salva sem chamar a IA nem a cota", async () => {
  const { repo, sessaoId } = await preparar();
  let cotas = 0;
  const cota = async () => { cotas++; };
  const llm1 = llmFalso(respostaIA());
  const r1 = await turno(repo, sessaoId, llm1, {}, cota);
  const llm2 = llmFalso(respostaIA({ fala: "outra coisa" }));
  const r2 = await turno(repo, sessaoId, llm2, {}, cota);
  assert.equal(llm2.chamadas.length, 0);
  assert.equal(cotas, 1);
  assert.equal(r2.fala, r1.fala);
  assert.equal(repo.db.turnos.length, 2);
  assert.equal(repo.db.sessoes.get(sessaoId).turnos_aluno, 1);
});

test("turno: sessão encerrada dá SESSAO_ENCERRADA; 40 falas dá COTA_EXCEDIDA; sessão de outro usuário não existe", async () => {
  const { repo, sessaoId } = await preparar();
  repo.db.sessoes.get(sessaoId).turnos_aluno = 40;
  await assert.rejects(turno(repo, sessaoId, llmFalso(respostaIA()), { n: 2 }), (e) => e.codigo === "COTA_EXCEDIDA");
  repo.db.sessoes.get(sessaoId).turnos_aluno = 3;
  repo.db.sessoes.get(sessaoId).status = "encerrada";
  await assert.rejects(turno(repo, sessaoId, llmFalso(respostaIA()), { n: 3 }), (e) => e.codigo === "SESSAO_ENCERRADA");
  await assert.rejects(turnoConsulta(OUTRO, { sessaoId, turnoId: TURNO(4), texto: "oi", canal: "texto" }, { repo, llm: llmFalso(respostaIA()) }), (e) => e.codigo === "ENTRADA_INVALIDA");
});

test("turno: JSON inválido -> uma tentativa de reparo; inválido de novo -> IA_INDISPONIVEL e nada é gravado", async () => {
  const { repo, sessaoId } = await preparar();
  const llm = llmFalso("não é json", respostaIA());
  const r = await turno(repo, sessaoId, llm);
  assert.equal(llm.chamadas.length, 2);
  assert.equal(llm.chamadas[1].mensagens.at(-1).content, "Responda apenas o JSON no formato pedido");
  assert.equal(r.fala, "Tô com falta de ar, enfermeiro.");

  const llmRuim = llmFalso("lixo", { fala: "", delta_confianca: 0 });
  await assert.rejects(turno(repo, sessaoId, llmRuim, { n: 2 }), (e) => e.codigo === "IA_INDISPONIVEL");
  assert.equal(repo.db.turnos.length, 2);
});

test("turno: fala vazia ou ausente conta como inválida e dispara o reparo", async () => {
  for (const ruim of [{ ...respostaIA(), fala: "" }, { ...respostaIA(), fala: undefined }, "texto solto sem json"]) {
    const { repo, sessaoId } = await preparar();
    const llm = llmFalso(ruim, respostaIA({ fala: "Tudo bem." }));
    const r = await turno(repo, sessaoId, llm);
    assert.equal(llm.chamadas.length, 2);
    assert.equal(r.fala, "Tudo bem.");
  }
});

test("turno: leitura tolerante (modelo menor): delta ausente ou fora da faixa, objeto em lista, fala longa ou com outro nome", async () => {
  const casos = [
    [{ ...respostaIA({ fala: "Estou bem." }), delta_confianca: 15 }, "Estou bem."],
    [{ ...respostaIA({ fala: "Estou bem." }), delta_confianca: "abc" }, "Estou bem."],
    [[respostaIA({ fala: "Na lista." })], "Na lista."],
    [{ ...respostaIA(), fala: undefined, resposta: "Com outro nome." }, "Com outro nome."],
  ];
  for (const [bruto, esperado] of casos) {
    const { repo, sessaoId } = await preparar();
    const llm = llmFalso(bruto);
    const r = await turno(repo, sessaoId, llm);
    assert.equal(llm.chamadas.length, 1, JSON.stringify(bruto).slice(0, 60));
    assert.equal(r.fala, esperado);
  }
  const { repo, sessaoId } = await preparar();
  const longa = "Eu sinto uma dor forte. ".repeat(30);
  const r = await turno(repo, sessaoId, llmFalso({ ...respostaIA(), fala: longa }));
  assert.ok(r.fala.length <= 400 && r.fala.length > 0);
});

test("turno: fala que quebra o personagem vira a fala de reserva, sem revelar nada e com emoção confusa", async () => {
  const { repo, sessaoId } = await preparar();
  const ficha = repo.db.fichas.get(sessaoId);
  const livre = ficha.fatos.find((f) => f.revelacao === "livre");
  const r = await turno(repo, sessaoId, llmFalso(respostaIA({ fala: "Eu sou uma IA treinada para isso.", revelados: [livre.id] })));
  assert.equal(r.fala, "Desculpa, me perdi… o que você perguntou?");
  assert.equal(r.emocao, "confuso");
  assert.deepEqual(repo.db.turnos.find((t) => t.autor === "paciente").revelados, []);
});

test("turno: fala com mais de 3 frases é cortada na 3ª", async () => {
  const { repo, sessaoId } = await preparar();
  const r = await turno(repo, sessaoId, llmFalso(respostaIA({ fala: "Um. Dois. Três. Quatro." })));
  assert.equal(r.fala, "Um. Dois. Três.");
});

test("turno: exame pedido só passa se estiver na ficha; a cota é consumida uma vez por turno novo", async () => {
  const { repo, sessaoId } = await preparar();
  const ficha = repo.db.fichas.get(sessaoId);
  ficha.examesDisponiveis = ["ausculta-pulmonar"];
  repo.db.fichas.set(sessaoId, ficha);
  let cotas = 0;
  const cota = async () => { cotas++; };
  assert.equal((await turno(repo, sessaoId, llmFalso(respostaIA({ exame_solicitado: "ausculta-pulmonar" })), { n: 1 }, cota)).exame, "ausculta-pulmonar");
  assert.equal((await turno(repo, sessaoId, llmFalso(respostaIA({ exame_solicitado: "raio-x" })), { n: 2 }, cota)).exame, null);
  assert.equal(cotas, 2);
});

test("turno: a cota esgotada interrompe antes de chamar a IA", async () => {
  const { repo, sessaoId } = await preparar();
  const llm = llmFalso(respostaIA());
  await assert.rejects(turno(repo, sessaoId, llm, {}, async () => { throw new ErroApp("COTA_EXCEDIDA", "limite"); }), (e) => e.codigo === "COTA_EXCEDIDA");
  assert.equal(llm.chamadas.length, 0);
  assert.equal(repo.db.turnos.length, 0);
});

test("turno: avisa do fim da consulta quando restam 3 falas ou menos", async () => {
  const { repo, sessaoId } = await preparar();
  repo.db.sessoes.get(sessaoId).turnos_aluno = 36;
  const llm = llmFalso(respostaIA());
  const r = await turno(repo, sessaoId, llm);
  assert.equal(r.turnosRestantes, 3);
  assert.match(llm.chamadas[0].mensagens[2].content, /chegando ao fim/);
});

// ================= retomar_consulta =================
test("retomar: devolve a conversa e o briefing de uma sessão ativa; encerrada ou alheia não", async () => {
  const { repo, sessaoId } = await preparar();
  await turno(repo, sessaoId, llmFalso(respostaIA()), { texto: "Oi" });
  const r = await retomarConsulta(USER, { sessaoId }, { repo });
  assert.deepEqual(r.turnos.map((t) => t.autor), ["aluno", "paciente"]);
  assert.equal(r.turnosRestantes, 39);
  assert.equal(r.briefing.nome, "Antônio Pereira");
  assert.ok(["baixo", "medio", "alto"].includes(r.rapport));
  await assert.rejects(retomarConsulta(OUTRO, { sessaoId }, { repo }), (e) => e.codigo === "ENTRADA_INVALIDA");
  repo.db.sessoes.get(sessaoId).status = "encerrada";
  await assert.rejects(retomarConsulta(USER, { sessaoId }, { repo }), (e) => e.codigo === "SESSAO_ENCERRADA");
});

test("criar: IA lenta passa do prazo e a consulta sai na hora com o modelo pronto", async () => {
  const repoLento = repoEmMemoria();
  const llmLento = async () => new Promise((r) => setTimeout(() => r({ texto: "{}", modelo: "lento", truncado: false, uso: null }), 5000));
  const inicio = Date.now();
  const r = await criarConsulta(USER, { arquetipoId: null, tema: null, idade: 70, sexo: "M", personagemId: "marcus", personalidadeId: "colaborativo", dificuldade: "normal" }, { repo: repoLento, llm: llmLento, sorteio: () => 0.3, prazoFichaMs: 300 });
  assert.ok(Date.now() - inicio < 2000, `demorou ${Date.now() - inicio} ms`);
  assert.ok(r.sessaoId);
});

test("turno: fala em campo com outro nome, aninhada ou só como maior texto também é aceita", async () => {
  const casos = [
    [{ speech: "Em inglês.", emocao: "falando", delta_confianca: 1 }, "Em inglês."],
    [{ resposta: { fala: "Aninhada.", emocao: "falando" }, delta_confianca: 0 }, "Aninhada."],
    [{ x: "Campo estranho com a fala.", emocao: "dor" }, "Campo estranho com a fala."],
  ];
  for (const [bruto, esperado] of casos) {
    const { repo, sessaoId } = await preparar();
    const r = await turno(repo, sessaoId, llmFalso(bruto));
    assert.equal(r.fala, esperado);
  }
});
