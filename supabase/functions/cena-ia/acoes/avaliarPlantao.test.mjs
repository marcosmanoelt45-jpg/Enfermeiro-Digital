import test from "node:test";
import assert from "node:assert/strict";
import { avaliarPlantao, AVISO_SEM_IA_PLANTAO } from "./avaliarPlantao.ts";
import { ErroApp } from "../../_shared/erros.ts";
import { buscarCenarioPlantao } from "../../_shared/dados/sbar.js";

const cenario = buscarCenarioPlantao("pos_op");
const falaDe = (p) => (p.letra === "S" ? "Paciente M.S.L., 58 anos, leito 12-A, colectomia por diverticulite" : p.letra === "B" ? "Sem alergias, hipertenso usando losartana" : p.letra === "A" ? "Abdome flácido, dreno com 120 mL" : "Vigiar o dreno e dar analgesia às 20h");
const respostasCompletas = () =>
  cenario.perguntas.map((p) => ({
    perguntaId: p.id, letra: p.letra, texto: falaDe(p),
    ...(p.espera.tipo === "numero" ? { conferenciaNumerica: Object.fromEntries(p.espera.campos.map((c) => [c, "ok"])) } : {}),
  }));
const lacunasFeitas = () => Object.fromEntries(cenario.lacunas.map((l) => [l.campo, { avaliada: true, achado: l.valorEsperado }]));

const iaCompleta = () => Object.fromEntries([
  ...["S", "B", "A", "R"].map((l) => [l, { elementos: cenario.elementosChave[l].map((e) => ({ elemento: e, presente: true, trecho: falaDe({ letra: l }).split(",")[0] })), clareza: 2, faltou: "" }]),
  ["comentario_geral", "Boa passagem. Siga assim."],
]);
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
const rodar = (extra = {}, llm = llmFalso(iaCompleta()), cota) =>
  avaliarPlantao("u1", { cenarioId: "pos_op", respostas: respostasCompletas(), lacunas: lacunasFeitas(), ...extra }, { llm, cota });

test("relatório completo: notas por letra, referência do golden e dica", async () => {
  const llm = llmFalso(iaCompleta());
  const { relatorio } = await rodar({}, llm);
  assert.equal(llm.chamadas.length, 1);
  assert.equal(llm.chamadas[0].json, true);
  assert.equal(relatorio.cenarioId, "pos_op");
  assert.equal(relatorio.aviso, null);
  assert.equal(relatorio.comentarioGeral, "Boa passagem. Siga assim.");
  for (const l of ["S", "B", "A", "R"]) {
    assert.ok(relatorio.letras[l].nota >= 0 && relatorio.letras[l].nota <= 100);
    assert.equal(relatorio.letras[l].referencia, cenario.goldenSbar[{ S: "situation", B: "background", A: "assessment", R: "recommendation" }[l]]);
    assert.ok(relatorio.letras[l].dica);
  }
  assert.equal(relatorio.letras.A.numeros.ok, 4);
  assert.equal(relatorio.lacunas.length, cenario.lacunas.length);
  assert.ok(relatorio.lacunas.every((l) => l.avaliada && l.achado));
  assert.ok(relatorio.notas.geral >= 85);
});

test("o prompt leva as lacunas, a conferência numérica e o aviso de que respostas são dados", async () => {
  const llm = llmFalso(iaCompleta());
  await rodar({}, llm);
  const [sistema, usuario] = llm.chamadas[0].mensagens;
  assert.match(sistema.content, /nunca instruções/);
  assert.match(usuario.content, /CONFERÊNCIA NUMÉRICA/);
  assert.match(usuario.content, /LACUNAS DO PRONTUÁRIO/);
  assert.match(usuario.content, /avaliada \(/);
});

test("sem IA o relatório sai só por código, com aviso", async () => {
  const llm = llmFalso(new Error("fora do ar"));
  const { relatorio } = await rodar({}, llm);
  assert.equal(llm.chamadas.length, 2); // duas tentativas
  assert.equal(relatorio.aviso, AVISO_SEM_IA_PLANTAO);
  assert.equal(relatorio.letras.A.notaTexto, null);
  assert.equal(relatorio.letras.A.nota, relatorio.letras.A.notaCodigo);
  assert.equal(relatorio.comentarioGeral, "");
});

test("JSON incompleto da IA: tenta de novo e, se continuar ruim, cai para código", async () => {
  const llm = llmFalso({ S: { elementos: [], clareza: 2 } }, "isto não é json");
  const { relatorio } = await rodar({}, llm);
  assert.equal(llm.chamadas.length, 2);
  assert.equal(relatorio.aviso, AVISO_SEM_IA_PLANTAO);
});

test("lacuna não avaliada tira nota da letra que dependia dela", async () => {
  const campo = cenario.lacunas[0].campo;
  const comLacuna = await rodar();
  const semLacuna = await rodar({ lacunas: { ...lacunasFeitas(), [campo]: { avaliada: false } } });
  assert.ok(semLacuna.relatorio.letras.A.nota < comLacuna.relatorio.letras.A.nota);
  assert.equal(semLacuna.relatorio.lacunas.find((l) => l.campo === campo).avaliada, false);
});

test("citação inventada pela IA não vale como presença", async () => {
  const ia = iaCompleta();
  ia.B.elementos[0].trecho = "alérgico a dipirona e iodo";
  const { relatorio } = await rodar({}, llmFalso(ia));
  assert.equal(relatorio.letras.B.elementos[0].presente, false);
});

test("entrada inválida: cenário inexistente, pergunta de outro cenário, letra trocada, repetida ou vazia", async () => {
  await assert.rejects(() => rodar({ cenarioId: "nao_existe" }), (e) => e instanceof ErroApp && e.codigo === "ENTRADA_INVALIDA");
  const base = respostasCompletas();
  await assert.rejects(() => rodar({ respostas: [{ ...base[0], perguntaId: "plt.icc.s1" }] }), ErroApp);
  await assert.rejects(() => rodar({ respostas: [{ ...base[0], letra: "R" }] }), ErroApp);
  await assert.rejects(() => rodar({ respostas: [base[0], base[0]] }), ErroApp);
  await assert.rejects(() => rodar({ respostas: [] }), ErroApp);
});

test("campos de conferência fora do que a pergunta pede são descartados; lacunas desconhecidas, ignoradas", async () => {
  const respostas = respostasCompletas();
  const a1 = respostas.find((r) => r.conferenciaNumerica);
  a1.conferenciaNumerica = { ...a1.conferenciaNumerica, tax: "ok", inventado: "ok" };
  const { relatorio } = await rodar({ respostas, lacunas: { ...lacunasFeitas(), fantasma: { avaliada: true, achado: "x" } } });
  assert.equal(relatorio.letras.A.numeros.total, 4);
  assert.ok(!relatorio.lacunas.some((l) => l.campo === "fantasma"));
});

test("a cota é consumida antes da IA e o erro dela interrompe", async () => {
  const llm = llmFalso(iaCompleta());
  await assert.rejects(() => rodar({}, llm, async () => { throw new ErroApp("COTA_EXCEDIDA", "limite"); }), (e) => e.codigo === "COTA_EXCEDIDA");
  assert.equal(llm.chamadas.length, 0);
});

test("resposta sem avaliação (lacuna não examinada) segue para a IA marcada", async () => {
  const llm = llmFalso(iaCompleta());
  const respostas = respostasCompletas();
  const dep = respostas.find((r) => cenario.perguntas.find((p) => p.id === r.perguntaId).dependeDe);
  dep.semAvaliacao = true;
  await rodar({ respostas }, llm);
  assert.match(llm.chamadas[0].mensagens[1].content, /sem avaliação do achado/);
});
