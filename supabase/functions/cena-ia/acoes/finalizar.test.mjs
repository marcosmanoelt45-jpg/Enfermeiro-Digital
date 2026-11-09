import test from "node:test";
import assert from "node:assert/strict";
import { finalizarConsulta, AVISO_SEM_COMUNICACAO } from "./finalizarConsulta.ts";
import { ErroApp } from "../../_shared/erros.ts";
import { ARQUETIPOS } from "../../_shared/dados/arquetipos.js";
import { fichaDeTemplate } from "../../_shared/logica/fichaDeTemplate.js";

const USER = "u1";
const ARQ = ARQUETIPOS.find((a) => a.id === "sc_icc_perfil_b");

// Sessão pronta: 3 turnos do aluno, com alguns fatos revelados.
function montar({ revelados = ["f1", "f2"], confianca = 48, contagem = { identificacao: 1, alergias: 1 }, status = "ativa" } = {}) {
  const ficha = fichaDeTemplate(ARQ, { personalidadeId: "desconfiado", dificuldade: "normal" });
  const falas = [
    ["Bom dia, eu sou o enfermeiro João. Qual é o seu nome completo?", "Antônio."],
    ["Entendo que isso deve ser difícil para você. Tem alguma alergia a remédio?", "Não que eu lembre."],
    ["O que mais o senhor está sentindo?", "Falta de ar."],
  ];
  const turnos = [];
  falas.forEach(([a, p], i) => {
    turnos.push({ id: `a${i}`, ordem: i * 2 + 1, autor: "aluno", texto: a });
    turnos.push({ id: `p${i}`, ordem: i * 2 + 2, autor: "paciente", texto: p, revelados: i === 0 ? revelados : [], confianca_depois: 30 + (i + 1) * 6 });
  });
  const sessao = { id: "s1", user_id: USER, personagem_id: "marcus", personalidade_publica: "surpresa", tema: "x", status, turnos_aluno: 3, confianca, contagem_temas: contagem, notas_memoria: [] };
  const salvos = [];
  const repo = {
    async carregarSessao(id, u) { return id === "s1" && u === USER ? structuredClone(sessao) : null; },
    async carregarFicha() { return structuredClone(ficha); },
    async carregarTurnos() { return structuredClone(turnos); },
    async finalizarSessao(id, u, relatorio) { if (sessao.status !== "ativa") return false; sessao.status = "encerrada"; salvos.push(relatorio); return true; },
  };
  return { repo, ficha, sessao, turnos, salvos };
}

const COM = (n) => Object.fromEntries(["apresentacao", "perguntas_abertas", "escuta", "empatia", "linguagem", "organizacao", "confianca", "fechamento"].map((k) => [k, { nota: n, turno: null, trecho: "" }]));
const RAC = (n) => Object.fromEntries(["achados_coerentes", "diagnosticos_sustentados", "intervencoes_seguras"].map((k) => [k, { nota: n, comentario: `ok ${k}` }]));
function avaliacaoIA(extra = {}) {
  return {
    comunicacao: { ...COM(1), apresentacao: { nota: 2, turno: 1, trecho: "eu sou o enfermeiro João" }, empatia: { nota: 2, turno: 2, trecho: "isso deve ser muito pior" } },
    raciocinio: RAC(1),
    pontos_fortes: [{ turno: 1, trecho: "Qual é o seu nome completo", porque: "conferiu a identificação" }, { turno: 2, trecho: "frase inventada pela IA", porque: "x" }],
    melhorar: [{ turno: 3, trecho: "O que mais o senhor está sentindo", sugestao: "Pode me contar mais sobre a falta de ar?", porque: "explorar a queixa" }],
    comentario_geral: "Boa abertura. Explore mais.",
    ...extra,
  };
}
const llmFalso = (...respostas) => {
  const f = async (o) => {
    f.chamadas.push(o);
    const r = respostas[Math.min(f.chamadas.length - 1, respostas.length - 1)];
    if (r instanceof Error) throw r;
    return { texto: typeof r === "string" ? r : JSON.stringify(r), modelo: "fake/m", truncado: false, uso: null };
  };
  f.chamadas = [];
  return f;
};
const registro = (extra = {}) => ({ achados: "Paciente com falta de ar.", diagnosticos: [], intervencoes: ["Monitorar sinais vitais"], ...extra });
const rodar = (m, llm, reg = registro(), cota) => finalizarConsulta(USER, { sessaoId: "s1", registro: reg }, { repo: m.repo, llm, cota });

test("relatório completo: notas por código, cobertura e fatos escondidos com motivo, do mais pesado ao mais leve", async () => {
  const m = montar();
  const { relatorio } = await rodar(m, llmFalso(avaliacaoIA()), registro({ diagnosticos: m.ficha.diagnosticosEsperados }));
  assert.equal(relatorio.notas.anamnese, 31); // f1 (peso 2) + f2 (peso 3) de 16
  assert.equal(relatorio.notas.seguranca, 60); // alergias 40 + identificou 20
  assert.equal(relatorio.notas.comunicacao, Math.round((100 * (8 + 2 + 2 - 2)) / 16)); // seis critérios 1 + dois 2 = 10/16
  assert.ok(relatorio.notas.raciocinio > 50);
  assert.equal(relatorio.notas.geral, Math.round(0.35 * relatorio.notas.anamnese + 0.25 * relatorio.notas.comunicacao + 0.2 * relatorio.notas.seguranca + 0.2 * relatorio.notas.raciocinio));
  assert.deepEqual(relatorio.cobertura.revelados.map((f) => f.id), ["f1", "f2"]);
  const esc = relatorio.cobertura.escondidos;
  assert.equal(esc.length, m.ficha.fatos.length - 2);
  for (let i = 1; i < esc.length; i++) assert.ok(esc[i - 1].peso >= esc[i].peso, "peso 3 vem primeiro");
  for (const e of esc) assert.ok(e.porque && e.perguntaQueRevela, e.id);
  const conf = esc.find((e) => e.id === "f7");
  assert.match(conf.porque, /Precisava de mais confiança \(chegou a 48, eram necessários 60\)/);
  assert.equal(relatorio.personalidadeRevelada, "desconfiado");
  assert.equal(relatorio.linhaConfianca.length, 4);
  assert.equal(relatorio.linhaConfianca[0], 30);
  assert.equal(relatorio.aviso, null);
  assert.deepEqual(relatorio.seguranca, { identificou: true, alergias: true, medicacoes: false });
});

test("citações inventadas somem e as notas ficam; as verdadeiras aparecem com a numeração do turno do aluno", async () => {
  const m = montar();
  const { relatorio } = await rodar(m, llmFalso(avaliacaoIA()));
  const c = relatorio.comunicacao;
  assert.equal(c.criterios.apresentacao.trecho, "eu sou o enfermeiro João");
  assert.equal(c.criterios.empatia.nota, 2);
  assert.equal(c.criterios.empatia.trecho, "");
  assert.deepEqual(c.pontosFortes.map((p) => p.trecho), ["Qual é o seu nome completo"]);
  assert.equal(c.pontosFortes[0].ordem, 1);
  assert.equal(c.melhorar[0].trecho, "O que mais o senhor está sentindo");
  assert.equal(c.melhorar[0].sugestao, "Pode me contar mais sobre a falta de ar?");
  assert.equal(c.comentarioGeral, "Boa abertura. Explore mais.");
});

test("se o texto do turno for alterado no banco, a citação some", async () => {
  const m = montar();
  m.turnos.find((t) => t.ordem === 1).texto = "Olá. Qual é o seu nome completo?";
  const { relatorio } = await rodar(m, llmFalso(avaliacaoIA()));
  assert.equal(relatorio.comunicacao.criterios.apresentacao.trecho, "");
  assert.equal(relatorio.comunicacao.criterios.apresentacao.nota, 2);
});

test("citação de turno do paciente é descartada", async () => {
  const m = montar();
  const av = avaliacaoIA({ pontos_fortes: [{ turno: 1, trecho: "Antônio", porque: "x" }] });
  const { relatorio } = await rodar(m, llmFalso(av));
  assert.deepEqual(relatorio.comunicacao.pontosFortes, []);
});

test("sem IA: o relatório sai sem comunicação, com o aviso, e o resto por código", async () => {
  const m = montar();
  const { relatorio } = await rodar(m, llmFalso(new ErroApp("IA_INDISPONIVEL", "fora")), registro({ diagnosticos: m.ficha.diagnosticosEsperados }));
  assert.equal(relatorio.comunicacao, null);
  assert.equal(relatorio.notas.comunicacao, null);
  assert.equal(relatorio.aviso, AVISO_SEM_COMUNICACAO);
  assert.equal(relatorio.notas.anamnese, 31);
  assert.equal(relatorio.notas.raciocinio, 100);
  assert.equal(relatorio.notas.geral, Math.round((0.35 * 31 + 0.2 * 60 + 0.2 * 100) / 0.75));
  assert.equal(m.sessao.status, "encerrada");
});

test("avaliação incompleta ou lixo conta como falha, depois de uma nova tentativa", async () => {
  const m = montar();
  const llm = llmFalso("lixo", { comunicacao: { apresentacao: { nota: 2 } }, raciocinio: {} });
  const { relatorio } = await rodar(m, llm);
  assert.equal(llm.chamadas.length, 2);
  assert.equal(relatorio.comunicacao, null);
  const m2 = montar();
  const llm2 = llmFalso("lixo", avaliacaoIA());
  assert.notEqual((await rodar(m2, llm2)).relatorio.comunicacao, null);
  assert.equal(llm2.chamadas.length, 2);
});

test("registro: códigos NANDA inválidos são descartados; extras sem relação tiram 10 pontos cada", async () => {
  const esperados = montar().ficha.diagnosticosEsperados;
  const base = (await rodar(montar(), llmFalso(avaliacaoIA()), registro({ diagnosticos: esperados }))).relatorio.notas.raciocinio;
  const comLixo = await rodar(montar(), llmFalso(avaliacaoIA()), registro({ diagnosticos: [...esperados, "99999", "00000"] }));
  assert.equal(comLixo.relatorio.notas.raciocinio, base);
  assert.deepEqual(comLixo.relatorio.raciocinio.extras, []);
  const outroCodigo = ARQUETIPOS.flatMap((a) => a.nandaCandidatos.map((c) => c.codigo)).find((c) => !ARQ.nandaCandidatos.some((x) => x.codigo === c) && !esperados.includes(c));
  const comExtra = await rodar(montar(), llmFalso(avaliacaoIA()), registro({ diagnosticos: [...esperados, outroCodigo] }));
  assert.equal(comExtra.relatorio.raciocinio.extras.length, 1);
  assert.equal(comExtra.relatorio.notas.raciocinio, base - 10);
});

test("diagnósticos certos e faltando trazem o nome", async () => {
  const m = montar();
  const [um, ...resto] = m.ficha.diagnosticosEsperados;
  const { relatorio } = await rodar(m, llmFalso(avaliacaoIA()), registro({ diagnosticos: [um] }));
  assert.deepEqual(relatorio.raciocinio.diagnosticosCertos.map((d) => d.codigo), [um]);
  assert.deepEqual(relatorio.raciocinio.diagnosticosFaltando.map((d) => d.codigo), resto);
  for (const d of relatorio.raciocinio.diagnosticosCertos) assert.ok(d.nome && d.nome !== d.codigo);
});

test("o avaliador recebe a ficha INTEIRA (inclusive fatos escondidos), numerada por turno do aluno", async () => {
  const m = montar();
  m.ficha.fatos[6].texto = "TEXTO-ESCONDIDO-XYZ";
  const llm = llmFalso(avaliacaoIA());
  await rodar(m, llm);
  const user = llm.chamadas[0].mensagens.at(-1).content;
  assert.ok(user.includes("TEXTO-ESCONDIDO-XYZ"));
  assert.match(user, /T1 ALUNO: Bom dia/);
  assert.match(user, /T1 PACIENTE: Antônio\./);
  assert.match(user, /T3 ALUNO:/);
  assert.equal(llm.chamadas[0].temperatura, 0.2);
  assert.equal(llm.chamadas[0].maxTokens, 1200);
  assert.equal(llm.chamadas[0].timeoutMs, 25000);
});

test("sessão encerrada, alheia ou inexistente é recusada; a cota é consumida uma vez e, esgotada, nem chama a IA", async () => {
  const enc = montar({ status: "encerrada" });
  await assert.rejects(rodar(enc, llmFalso(avaliacaoIA())), (e) => e.codigo === "SESSAO_ENCERRADA");
  const m = montar();
  await assert.rejects(finalizarConsulta("outro", { sessaoId: "s1", registro: registro() }, { repo: m.repo, llm: llmFalso(avaliacaoIA()) }), (e) => e.codigo === "ENTRADA_INVALIDA");

  let cotas = 0;
  await rodar(montar(), llmFalso(avaliacaoIA()), registro(), async () => { cotas++; });
  assert.equal(cotas, 1);

  const llm = llmFalso(avaliacaoIA());
  await assert.rejects(rodar(montar(), llm, registro(), async () => { throw new ErroApp("COTA_EXCEDIDA", "limite"); }), (e) => e.codigo === "COTA_EXCEDIDA");
  assert.equal(llm.chamadas.length, 0);
});

test("finalizar duas vezes: a segunda é SESSAO_ENCERRADA e nada é regravado", async () => {
  const m = montar();
  await rodar(m, llmFalso(avaliacaoIA()));
  await assert.rejects(rodar(m, llmFalso(avaliacaoIA())), (e) => e.codigo === "SESSAO_ENCERRADA");
  assert.equal(m.salvos.length, 1);
});

test("conferência pelo sentido: fato dito pelo paciente conta como descoberto mesmo sem marcação no turno", async () => {
  const m = montar({ revelados: ["f1"] });
  const conferir = async () => ({ texto: JSON.stringify({ revelados: ["f2", "inexistente"] }), modelo: "t" });
  const r = await finalizarConsulta("u1", { sessaoId: "s1", registro: registro() }, { repo: m.repo, llm: llmFalso(avaliacaoIA()), llmConferir: conferir });
  assert.ok(r.relatorio.cobertura.revelados.some((f) => f.id === "f2"));
  assert.ok(!r.relatorio.cobertura.escondidos.some((f) => f.id === "f2"));
});
