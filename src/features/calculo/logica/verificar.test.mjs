// Verificação independente do banco do Cálculo (C12).
// As fórmulas abaixo foram escritas do zero a partir da auditoria (docs/auditoria/dosage.md): nenhuma reaproveita
// o código dos geradores. Qualquer divergência é bug do banco ou do gerador: corrija a origem.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const lerJson = (rel) => JSON.parse(fs.readFileSync(new URL(rel, import.meta.url), "utf8"));
const banco = lerJson("../../../data/calculo/banco.json");
const falasRui = lerJson("../../../data/falas/medico-rui.json");

// Constantes de equipo: 1 mL = 20 gts = 60 mcgts.
const GTS_POR_ML = 20;
const MCGTS_POR_ML = 60;

const FORMULAS = {
  // macrogotas por hora: gts/min = V / (T × 3)  (20 gts/mL ÷ 60 min/h)
  macro_h: (e) => e.volumeMl / (e.horas * 3),
  // macrogotas por minuto: gts/min = V × 20 / T(min)
  macro_min: (e) => (e.volumeMl * GTS_POR_ML) / e.minutos,
  // microgotas: mcgts/min = V × 60 / (T × 60) = V / T(h)
  micro_h: (e) => (e.volumeMl * MCGTS_POR_ML) / (e.horas * 60),
  // regra de três: frasco está para o volume, como o prescrito está para x
  regra3: (e) => (e.prescrito * e.volumeMl) / e.frasco,
  // dose diária por peso, dividida nas tomadas, convertida pela concentração (mg/mL)
  pediatrica_dia: (e) => (e.mgKgDia * e.kg) / e.tomadas / e.mgPorMl,
  // BIC: mL/h = dose por hora ÷ concentração (quantidade/volume)
  bic_conc: (e) => e.doseHora / (e.quantidade / e.volumeMl),
  // BIC com dose por minuto: converte mg → mcg e minuto → hora
  bic_mcgmin: (e) => (e.doseMcgMin * 60) / ((e.quantidadeMg * 1000) / e.volumeMl),
  bic_peso: (e) => (e.dosePorKgH * e.kg) / (e.quantidade / e.volumeMl),
  bic_peso_min: (e) => (e.mcgKgMin * e.kg * 60) / e.mcgPorMl,
  // inverso: dada a vazão, qual a dose em mcg/min
  mcgmin_da_vazao: (e) => (e.vazaoMlH * ((e.quantidadeMg * 1000) / e.volumeMl)) / 60,
  ampolas: (e) => e.dose / e.mgPorAmpola,
};
const UNIDADE_DA_FORMULA = {
  macro_h: "gts/min", macro_min: "gts/min", micro_h: "mcgts/min", regra3: "mL", pediatrica_dia: "mL",
  bic_conc: "mL/h", bic_mcgmin: "mL/h", bic_peso: "mL/h", bic_peso_min: "mL/h", mcgmin_da_vazao: "mcg/min", ampolas: "ampolas",
};
const CASAS_DA_UNIDADE = { "gts/min": 0, "mcgts/min": 0, ampolas: 0, mL: 1, "mL/h": 1, "mcg/min": 1 };

const normais = banco.filter((i) => !i.erroProposital);
const comErro = banco.filter((i) => i.erroProposital);
const arredonda = (x, casas) => (casas === 0 ? Math.round(x) : Number(x.toFixed(casas)));
const semAcento = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

test("o banco tem cerca de 130 a 160 itens, ids únicos e cerca de 20% com erro", () => {
  assert.ok(banco.length >= 125 && banco.length <= 170, `tamanho ${banco.length}`);
  assert.equal(new Set(banco.map((i) => i.id)).size, banco.length);
  const pct = comErro.length / banco.length;
  assert.ok(pct >= 0.15 && pct <= 0.25, `erros ${Math.round(pct * 100)}%`);
});

test("cada item normal bate com a recontagem independente, na unidade e nas casas certas", () => {
  for (const item of normais) {
    const { entrada } = item;
    assert.ok(entrada && FORMULAS[entrada.kind], `${item.id}: entrada desconhecida`);
    const calculado = FORMULAS[entrada.kind](entrada);
    assert.ok(Number.isFinite(calculado), `${item.id}: cálculo não finito`);
    assert.equal(item.unidade, UNIDADE_DA_FORMULA[entrada.kind], `${item.id}: unidade ${item.unidade}`);
    assert.equal(item.casas, CASAS_DA_UNIDADE[item.unidade], `${item.id}: casas ${item.casas} para ${item.unidade}`);
    assert.ok(Math.abs(calculado - item.resposta) <= item.tolerancia + 1e-9, `${item.id}: calculado ${calculado}, resposta ${item.resposta}`);
    assert.equal(item.resposta, arredonda(calculado, item.casas), `${item.id}: arredondamento (${calculado})`);
    // gts/min, mcgts/min e ampolas são inteiros; a tolerância de inteiro é meia unidade, a de mL e mL/h é 0,05
    if (item.casas === 0) assert.ok(Number.isInteger(item.resposta) && item.tolerancia === 0.5, `${item.id}: inteiro`);
    else assert.equal(item.tolerancia, 0.05, `${item.id}: tolerância decimal`);
  }
});

test("macro e micro são consistentes entre si (1 mL = 20 gts = 60 mcgts)", () => {
  for (const [v, h] of [[1000, 8], [500, 12], [250, 6], [1200, 24]]) {
    const macro = FORMULAS.macro_h({ volumeMl: v, horas: h });
    const micro = FORMULAS.micro_h({ volumeMl: v, horas: h });
    assert.ok(Math.abs(micro - macro * 3) < 1e-9, `${v} mL em ${h} h`);
  }
  assert.equal(FORMULAS.macro_min({ volumeMl: 100, minutos: 60 }), (FORMULAS.macro_h({ volumeMl: 100, horas: 1 })));
});

test("gotejamentos têm valor que dá para contar e a unidade do equipo certo", () => {
  for (const item of normais) {
    if (item.entrada.kind === "macro_h" || item.entrada.kind === "macro_min") assert.ok(item.resposta <= 140, `${item.id}: ${item.resposta} gts/min`);
    if (item.entrada.kind === "micro_h") assert.ok(item.resposta <= 100, `${item.id}: ${item.resposta} mcgts/min`);
  }
});

test("os tipos estão balanceados e todos aparecem", () => {
  const contagem = {};
  for (const i of normais) contagem[i.tipo] = (contagem[i.tipo] ?? 0) + 1;
  for (const tipo of ["gotejamento_macro", "gotejamento_micro", "bic", "reconstituicao", "pediatrica", "diluicao", "ampolas"]) assert.ok(contagem[tipo] >= 1, `sem ${tipo}`);
  assert.ok(contagem.gotejamento_macro <= banco.length * 0.4, "macrogotas domina");
});

// ---------- prescrições com erro ----------
const DOSE_USUAL = { heparina: [5000, "UI"], enoxaparina: [40, "mg"], "insulina regular": [10, "UI"], dexametasona: [4, "mg"], morfina: [4, "mg"], furosemida: [20, "mg"], ondansetrona: [8, "mg"] };
const VIA_PROIBIDA = {
  kcl: /bolus|direto|\bim\b|\bsc\b/, benzatina: /\bev\b|\biv\b/, nph: /\bev\b|\biv\b/,
  vancomicina: /\bim\b/, heparina: /\bim\b/, fenitoina: /\bim\b/,
};
const NOME_NA_VIA = { kcl: /cloreto de potassio|kcl/, benzatina: /benzatina/, nph: /nph/, vancomicina: /vancomicina/, heparina: /heparina/, fenitoina: /fenitoina/ };
const UNIDADE_CERTA = { fentanil: "mcg", digoxina: "mcg", levotiroxina: "mcg", morfina: "mg", adrenalina: "mg", atropina: "mg", dexametasona: "mg" };
const CLASSE_DO_FARMACO = {
  dipirona: ["dipirona"], penicilina: ["penicilina", "amoxicilina", "ampicilina", "oxacilina", "benzatina"],
  cefalosporina: ["ceftriaxona", "cefalexina", "cefazolina"], aine: ["diclofenaco", "ibuprofeno", "cetoprofeno"], aas: ["aas"], sulfa: ["sulfametoxazol"],
};
const TEXTO_DA_ALERGIA = { dipirona: /dipirona/, penicilina: /penicilina/, cefalosporina: /cefalosporina/, aine: /anti-inflamat|aine/, aas: /aas/, sulfa: /sulfa/ };

test("os 4 tipos de erro proposital aparecem de forma balanceada", () => {
  const contagem = {};
  for (const i of comErro) contagem[i.erroProposital.tipo] = (contagem[i.erroProposital.tipo] ?? 0) + 1;
  for (const tipo of ["dose10x", "via", "unidade", "alergia"]) assert.ok(contagem[tipo] >= 5, `poucos ${tipo}: ${contagem[tipo]}`);
  const valores = Object.values(contagem);
  assert.ok(Math.max(...valores) - Math.min(...valores) <= 2, JSON.stringify(contagem));
});

test("item com erro nunca tem resposta de cálculo e sempre explica a conduta", () => {
  for (const i of comErro) {
    assert.equal(i.resposta, null, i.id);
    assert.equal(i.unidade, null, i.id);
    assert.ok(i.erroProposital.correcao && i.erroProposital.explicacao, i.id);
  }
});

test("cada prescrição com erro está de fato errada pela regra do seu tipo", () => {
  for (const i of comErro) {
    const { tipo } = i.erroProposital;
    const farmaco = semAcento(i.prescricao.farmaco);
    if (tipo === "dose10x") {
      const chave = Object.keys(DOSE_USUAL).find((k) => farmaco.startsWith(k));
      assert.ok(chave, `${i.id}: fármaco sem dose usual (${farmaco})`);
      const [usual, unidade] = DOSE_USUAL[chave];
      assert.equal(i.prescricao.unidadeDose, unidade, i.id);
      assert.equal(i.prescricao.dose / usual, 10, `${i.id}: não é 10 vezes a dose usual`);
    } else if (tipo === "via") {
      const chave = Object.keys(VIA_PROIBIDA).find((k) => NOME_NA_VIA[k].test(farmaco));
      assert.ok(chave, `${i.id}: fármaco sem regra de via (${farmaco})`);
      assert.match(semAcento(i.prescricao.via), VIA_PROIBIDA[chave], `${i.id}: via ${i.prescricao.via} não é proibida para ${chave}`);
    } else if (tipo === "unidade") {
      const chave = Object.keys(UNIDADE_CERTA).find((k) => farmaco.startsWith(k));
      assert.ok(chave, `${i.id}: fármaco sem unidade certa (${farmaco})`);
      assert.ok(["mg", "mcg"].includes(i.prescricao.unidadeDose), i.id);
      assert.notEqual(i.prescricao.unidadeDose, UNIDADE_CERTA[chave], `${i.id}: unidade já é a certa`);
    } else if (tipo === "alergia") {
      const classe = i.erroProposital.regra.classe;
      assert.ok(CLASSE_DO_FARMACO[classe]?.some((f) => farmaco.includes(f)), `${i.id}: ${farmaco} não é da classe ${classe}`);
      const alergias = (i.paciente?.alergias ?? []).map(semAcento);
      assert.ok(alergias.some((a) => TEXTO_DA_ALERGIA[classe].test(a)), `${i.id}: alergia não registrada para ${classe}`);
    } else {
      assert.fail(`${i.id}: tipo de erro desconhecido ${tipo}`);
    }
  }
});

test("nenhum item normal é perigoso: via proibida, dose 10x ou alergia registrada", () => {
  for (const i of normais) {
    const farmaco = semAcento(i.prescricao.farmaco);
    const via = semAcento(i.prescricao.via);
    for (const [chave, regex] of Object.entries(VIA_PROIBIDA)) {
      if (NOME_NA_VIA[chave].test(farmaco)) assert.doesNotMatch(via, regex, `${i.id}: ${farmaco} por ${via}`);
    }
    assert.equal(i.paciente?.alergias?.length ?? 0, 0, `${i.id}: item normal com alergia`);
    const usual = Object.keys(DOSE_USUAL).find((k) => farmaco.startsWith(k));
    if (usual && i.prescricao.unidadeDose === DOSE_USUAL[usual][1] && !/\/(h|kg)/.test(i.prescricao.unidadeDose)) {
      assert.ok(i.prescricao.dose / DOSE_USUAL[usual][0] < 10, `${i.id}: dose acima de 10x a usual`);
    }
  }
});

// ---------- falas ----------
test("todo item tem a fala do enunciado e a dica no arquivo de falas do médico", () => {
  const textos = new Map(falasRui.falas.map((f) => [f.id, f.texto]));
  assert.equal(falasRui.personagem, "medico-rui");
  for (const i of banco) {
    assert.ok((textos.get(i.falas.enunciado) ?? "").length > 20, `${i.id}: sem enunciado`);
    assert.ok((textos.get(i.falas.dica) ?? "").length > 10, `${i.id}: sem dica`);
  }
  for (const base of ["calc.r.acerto", "calc.r.erro1", "calc.r.erro2", "calc.r.questionou_certo", "calc.r.questionou_sem_motivo", "calc.r.pressa", "calc.r.erro_grave"]) {
    assert.ok(textos.has(`${base}.1`) && textos.has(`${base}.2`), `faltam reações ${base}`);
  }
});
