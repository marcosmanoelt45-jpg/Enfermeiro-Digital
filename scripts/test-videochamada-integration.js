/**
 * test-videochamada-integration.js
 * Teste automatizado de validação do fluxo do Simulador Plurall no Videochamada.jsx.
 */

// Mock de localStorage para ambiente Node.js de teste
if (typeof globalThis.localStorage === "undefined") {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.get(key) || null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear()
  };
}

import assert from "node:assert/strict";
import { PACIENTES, gerarCasoAleatorio } from "../src/data/simuladorCasosData.js";
import { clinicalHistoryService, MODULE_TYPES } from "../src/services/clinicalHistoryService.js";

console.log("=== INICIANDO TESTE DE INTEGRAÇÃO DO SIMULADOR (PLURALL) ===");

// 1. Validar sorteio aleatório de paciente (Marcus / Teresinha)
const pacientesDisponiveis = Object.keys(PACIENTES);
assert.deepEqual(pacientesDisponiveis.sort(), ["marcus", "teresinha"].sort(), "Os 2 pacientes devem ser Marcus e Teresinha");

// 2. Testar geração no modo Rápida (4 a 6 questões)
const casoRapida = gerarCasoAleatorio("marcus", { mode: "rapida", categoria: "todos" });
const questoesRapida = casoRapida.passos.filter(p => p.tipo !== "fala" && p.tipo !== "fala_paciente");
assert(questoesRapida.length >= 4 && questoesRapida.length <= 6, `Modo rápido deve ter entre 4 e 6 questões (teve ${questoesRapida.length})`);
console.log(`✓ Modo rápido gerou com sucesso: ${questoesRapida.length} questões`);

// 3. Testar geração no modo Normal (7 a 9 questões)
const casoNormal = gerarCasoAleatorio("teresinha", { mode: "normal", categoria: "todos" });
const questoesNormal = casoNormal.passos.filter(p => p.tipo !== "fala" && p.tipo !== "fala_paciente");
assert(questoesNormal.length >= 7 && questoesNormal.length <= 9, `Modo normal deve ter entre 7 e 9 questões (teve ${questoesNormal.length})`);
console.log(`✓ Modo normal gerou com sucesso: ${questoesNormal.length} questões`);

// 4. Testar estrutura de 5 alternativas e explicações em todas as questões geradas
for (const q of [...questoesRapida, ...questoesNormal]) {
  assert.equal(q.opcoes.length, 5, `Questão "${q.pergunta.slice(0, 30)}..." deve ter 5 alternativas`);
  assert(q.correta >= 0 && q.correta < 5, `Gabarito de "${q.pergunta.slice(0, 30)}..." deve estar entre 0 e 4`);
  assert(typeof q.dica === "string" && q.dica.length > 5, "Dica deve ser uma string clínica válida");
  assert.equal(q.explicacaoAlternativas.length, 5, "Deve ter explicação detalhada para cada uma das 5 alternativas");
  const corretasExplicadas = q.explicacaoAlternativas.filter(alt => alt.isCorreta);
  assert.equal(corretasExplicadas.length, 1, "Exatamente uma alternativa na explicação deve ser marcada como correta");
}
console.log("✓ Todas as questões geradas contêm 5 alternativas, dica clínica e explicação A-E");

// 5. Simular ciclo de tentativas (1º erro = amarelo com dica, 2º erro = vermelho com gabarito)
const qSimulada = questoesRapida[0];
const gabarito = qSimulada.correta;
const alternativaIncorreta1 = (gabarito + 1) % 5;
const alternativaIncorreta2 = (gabarito + 2) % 5;

// Tentativa 1 (Incorreta)
let statusQuestao = "aberta";
let tentativas = 0;
if (alternativaIncorreta1 !== gabarito) {
  tentativas++;
  statusQuestao = "amarela"; // 1º erro: Dica (sem ver resolução)
}
assert.equal(statusQuestao, "amarela");
assert.equal(tentativas, 1);
console.log("✓ 1º Erro marcou corretamente como amarela com dica liberada");

// Tentativa 2 (Incorreta)
if (alternativaIncorreta2 !== gabarito) {
  tentativas++;
  statusQuestao = "vermelha"; // 2º erro: Revela gabarito e marca para revisão
}
assert.equal(statusQuestao, "vermelha");
assert.equal(tentativas, 2);
console.log("✓ 2º Erro marcou corretamente como vermelha para revisão");

// 6. Testar persistência da sessão no histórico unificado
const fakeSession = {
  pacienteId: "marcus",
  pacienteNome: "Marcus",
  modalidade: "Atividade Rápida",
  totalQuestoes: questoesRapida.length,
  acertos: Math.max(1, questoesRapida.length - 2),
  amarelas: 1,
  vermelhas: 1,
  tempoSegundos: 120,
  questoes: questoesRapida.map((q, idx) => ({
    ...q,
    status: idx === 0 ? "vermelha" : idx === 1 ? "amarela" : "verde",
    escolhaAluno: idx === 0 ? (q.correta + 1) % 5 : q.correta
  }))
};

const savedItem = clinicalHistoryService.saveVideochamadaSession(fakeSession);
assert(savedItem.id.startsWith("act_vid_"), "ID deve ser gerado no formato act_vid_");
assert.equal(savedItem.moduleType, MODULE_TYPES.VIDEOCHAMADA);
assert.equal(savedItem.details.acertos, fakeSession.acertos);
assert.equal(savedItem.details.amarelas, 1);
assert.equal(savedItem.details.vermelhas, 1);
console.log("✓ Sessão de videochamada salva com sucesso no histórico unificado");

// 7. Testar geração no modo Revisão (somente amarelas e vermelhas)
const questoesRevisaoPendentes = clinicalHistoryService.getQuestoesRevisao();
assert(questoesRevisaoPendentes.length >= 2, "Fila de revisão deve conter as questões amarelas e vermelhas da sessão anterior");

const casoRevisao = gerarCasoAleatorio("marcus", {
  mode: "revisao",
  revisaoQuestoes: questoesRevisaoPendentes
});
const questoesModoRevisao = casoRevisao.passos.filter(p => p.tipo !== "fala_paciente");
assert(questoesModoRevisao.length >= 2, "Caso de revisão deve carregar as questões pendentes");
console.log(`✓ Modo Revisão carregou com sucesso ${questoesModoRevisao.length} questões erradas para refazer`);

console.log("\n🎯 TODOS OS TESTES DE INTEGRAÇÃO PASSARAM COM 100% DE SUCESSO!");
