import { evaluateFormula, validateCalculoAnswer } from "../src/services/simuladorFormulaService.js";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FALHA: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ SUCESSO: ${message}`);
  }
}

console.log("--- TESTANDO SIMULADOR FORMULA SERVICE ---");

// Teste 1: Regra de três simples (Dose prescrita / concentração)
// Dipirona: 1000 mg prescrito / 500 mg/mL = 2 mL
{
  const res = evaluateFormula("dose_mg / concentracao_mg_ml", {
    dose_mg: 1000,
    concentracao_mg_ml: 500
  });
  assert(res === 2, `1000 / 500 deve ser 2 (obtido: ${res})`);

  const valid = validateCalculoAnswer({
    alunoResposta: "2",
    formula: "dose_mg / concentracao_mg_ml",
    variaveis: { dose_mg: 1000, concentracao_mg_ml: 500 },
    tolerancia: 0.01,
    unidade: "mL"
  });
  assert(valid.correta === true, "Resposta '2' deve ser aceita");

  const validComma = validateCalculoAnswer({
    alunoResposta: "2,0",
    formula: "dose_mg / concentracao_mg_ml",
    variaveis: { dose_mg: 1000, concentracao_mg_ml: 500 },
    tolerancia: 0.01
  });
  assert(validComma.correta === true, "Resposta '2,0' com vírgula deve ser aceita");

  const invalid = validateCalculoAnswer({
    alunoResposta: "3",
    formula: "dose_mg / concentracao_mg_ml",
    variaveis: { dose_mg: 1000, concentracao_mg_ml: 500 }
  });
  assert(invalid.correta === false, "Resposta '3' deve ser rejeitada");
}

// Teste 2: Dose por peso (peso_kg * dose_mg_kg)
// Paciente 62 kg, 15 mg/kg = 930 mg
{
  const res = evaluateFormula("peso_kg * dose_mg_kg", {
    peso_kg: 62,
    dose_mg_kg: 15
  });
  assert(res === 930, `62 * 15 deve ser 930 (obtido: ${res})`);
}

// Teste 3: Gotejamento macrogotas em gotas/min: (volume_ml * 20) / (tempo_horas * 60) ou V / (T * 3)
// 500 mL em 4 horas = 500 / 12 = 41.666 gotas/min
{
  const res = evaluateFormula("(volume_ml * 20) / (tempo_horas * 60)", {
    volume_ml: 500,
    tempo_horas: 4
  });
  assert(Math.abs(res - 41.6666) < 0.01, `Gotejamento esperado ~41.67 (obtido: ${res})`);

  // Aluno responde com arredondamento clínico 41.7
  const valid = validateCalculoAnswer({
    alunoResposta: "41,7",
    formula: "(volume_ml * 20) / (tempo_horas * 60)",
    variaveis: { volume_ml: 500, tempo_horas: 4 },
    tolerancia: 0.02 // 2% de tolerância
  });
  assert(valid.correta === true, "Gotejamento 41,7 deve ser aceito com tolerância de 2%");
}

// Teste 4: Taxa de infusão BIC em mL/h: volume_ml / tempo_horas
// 1000 mL em 8 horas = 125 mL/h
{
  const res = evaluateFormula("volume_ml / tempo_horas", {
    volume_ml: 1000,
    tempo_horas: 8
  });
  assert(res === 125, `1000 / 8 deve ser 125 (obtido: ${res})`);
}

// Teste 5: Precedência de operadores e parênteses
{
  const res = evaluateFormula("10 + 2 * (5 - 3)", {});
  assert(res === 14, `10 + 2 * (5 - 3) deve ser 14 (obtido: ${res})`);
}

console.log("🎉 TODOS OS TESTES DE CÁLCULO DETERMINÍSTICO PASSARAM COM SUCESSO!");
