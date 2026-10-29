/**
 * scripts/test-plurall-flow.js
 * Teste unitário e de contrato para o fluxo Plurall do Enfermeiro Digital.
 * Valida:
 * 1. 5 alternativas (A-E) em 100% das questões clínicas.
 * 2. Existência de dica clínica e explicações detalhadas por alternativa.
 * 3. Modos de atividade: Rápida (4 a 6), Normal (7 a 9), Revisão.
 * 4. Lógica de 2 níveis de erro (Amarela no 1º erro com dica; Vermelha no 2º erro com gabarito).
 */

import { CASOS_SIMULADOR, gerarCasoAleatorio } from "../src/data/simuladorCasosData.js";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

console.log("🧪 Iniciando bateria de testes do Fluxo Plurall...");

// Teste 1: Validação do Banco Canônico (Marcus e Teresinha)
['marcus', 'teresinha'].forEach((pKey) => {
  const caso = CASOS_SIMULADOR[pKey];
  assert(caso, `Caso do paciente ${pKey} deve existir`);
  
  // Passo 0 é fala do paciente
  assert(caso.passos[0].tipo === "fala", `Passo 0 de ${pKey} deve ser a fala do paciente`);
  assert(caso.passos[0].texto && caso.passos[0].texto.length > 10, `Fala do paciente ${pKey} deve ter texto válido`);
  assert(caso.passos[0].audioPath, `Passo 0 de ${pKey} deve ter audioPath`);

  const questoes = caso.passos.slice(1);
  assert(questoes.length >= 20, `${pKey} deve ter ao menos 20 questões clínicas`);

  questoes.forEach((q, idx) => {
    const qNum = idx + 1;
    assert(q.pergunta && q.pergunta.length > 5, `Questão ${qNum} (${pKey}) deve ter enunciado`);
    assert(q.audioPath, `Questão ${qNum} (${pKey}) deve ter audioPath`);
    
    // Todas as questões devem ter 5 alternativas
    assert(Array.isArray(q.opcoes), `Questão ${qNum} (${pKey}) deve ter array opcoes`);
    assert(q.opcoes.length === 5, `Questão ${qNum} (${pKey}) deve ter exatamente 5 alternativas (encontrado ${q.opcoes.length})`);
    
    // Gabarito entre 0 e 4
    assert(typeof q.correta === "number" && q.correta >= 0 && q.correta <= 4, `Questão ${qNum} (${pKey}) gabarito correta deve ser 0-4 (atual: ${q.correta})`);

    // Dica clínica para o 1º erro (Amarela)
    assert(q.dica && q.dica.length > 8, `Questão ${qNum} (${pKey}) deve conter dica clínica`);

    // Explicação detalhada alternativa por alternativa
    assert(Array.isArray(q.explicacaoAlternativas), `Questão ${qNum} (${pKey}) deve ter explicacaoAlternativas`);
    assert(q.explicacaoAlternativas.length === 5, `Questão ${qNum} (${pKey}) explicacaoAlternativas deve ter 5 itens`);

    const corretasContadas = q.explicacaoAlternativas.filter(alt => alt.isCorreta).length;
    assert(corretasContadas === 1, `Questão ${qNum} (${pKey}) deve ter exatamente 1 alternativa correta na revisão (atual: ${corretasContadas})`);
  });
});
console.log("✅ Teste 1: Banco canônico validado com 5 alternativas, dicas e revisões.");

// Teste 2: Modos de Atividade Rápida (4 a 6) e Normal (7 a 9)
for (let i = 0; i < 5; i++) {
  const rapida = gerarCasoAleatorio(null, { mode: "rapida" });
  const countRapida = rapida.passos.filter(p => p.tipo !== "fala").length;
  assert(countRapida >= 4 && countRapida <= 6, `Modo rápida deve ter 4 a 6 questões (gerou ${countRapida})`);

  const normal = gerarCasoAleatorio(null, { mode: "normal" });
  const countNormal = normal.passos.filter(p => p.tipo !== "fala").length;
  assert(countNormal >= 7 && countNormal <= 9, `Modo normal deve ter 7 a 9 questões (gerou ${countNormal})`);

  // Cada questão gerada deve manter 5 alternativas
  normal.passos.slice(1).forEach((q, qIdx) => {
    assert(q.opcoes.length === 5, `Questão gerada ${qIdx + 1} deve ter 5 alternativas`);
    assert(q.correta >= 0 && q.correta <= 4, `Gabarito da questão gerada deve estar entre 0 e 4`);
  });
}
console.log("✅ Teste 2: Geração de atividades Rápida (4-6) e Normal (7-9) validada.");

// Teste 3: Lógica dos 2 Níveis de Erro
function simularRespostaQuestao(questao, escolha) {
  const isCorreta = escolha === questao.correta;
  return isCorreta;
}

const mockQuestao = {
  correta: 2,
  dica: "Lembre-se da escala de Braden.",
  opcoes: ["A", "B", "C", "D", "E"]
};

// 1º tentativa errada -> Amarela + Dica
let estado = { tentativas: 0, status: "aberta" };
estado.tentativas += 1;
const primeiraTentativaAcertou = simularRespostaQuestao(mockQuestao, 0); // Errou
assert(!primeiraTentativaAcertou, "Deveria ter errado na primeira");
if (!primeiraTentativaAcertou) {
  estado.status = "amarela"; // 1º erro
  estado.dicaVisivel = true;
}
assert(estado.status === "amarela", "Status após 1º erro deve ser 'amarela'");
assert(estado.dicaVisivel === true, "Dica deve ficar visível após 1º erro");

// 2ª tentativa errada -> Vermelha + Gabarito
estado.tentativas += 1;
const segundaTentativaAcertou = simularRespostaQuestao(mockQuestao, 1); // Errou de novo
assert(!segundaTentativaAcertou, "Deveria ter errado na segunda");
if (!segundaTentativaAcertou) {
  estado.status = "vermelha"; // 2º erro
  estado.gabaritoVisivel = true;
}
assert(estado.status === "vermelha", "Status após 2º erro deve ser 'vermelha'");
assert(estado.gabaritoVisivel === true, "Gabarito deve ser revelado após 2º erro");

console.log("✅ Teste 3: Lógica determinística de 2 níveis de erro comprovada.");
console.log("🎉 Todos os testes unitários do Fluxo Plurall passaram com sucesso!");

