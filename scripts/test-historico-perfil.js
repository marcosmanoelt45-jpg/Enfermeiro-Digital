/**
 * test-historico-perfil.js
 * Teste unitário e de integração para a aba de Histórico de Atividades no Perfil.
 */

// Mock de localStorage
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
import { clinicalHistoryService, MODULE_TYPES } from "../src/services/clinicalHistoryService.js";

console.log("=== INICIANDO TESTES DO HISTÓRICO DE ATIVIDADES NO PERFIL ===");

// 1. Limpar storage inicial
clinicalHistoryService.limparTodoHistorico();
let initialList = clinicalHistoryService.getAllActivities();
assert.equal(initialList.length, 0, "Histórico deve iniciar vazio");
console.log("✓ Histórico inicial vazio confirmado");

// 2. Inserir sessões simuladas de diferentes módulos
const sessaoVideochamada = {
  pacienteId: "teresinha",
  pacienteNome: "Dona Teresinha",
  modalidade: "Atividade Normal (7 a 9)",
  totalQuestoes: 8,
  acertos: 5,
  amarelas: 2,
  vermelhas: 1,
  tempoSegundos: 240,
  questoes: [
    { id: "q1", pergunta: "Pergunta 1", status: "verde" },
    { id: "q2", pergunta: "Pergunta 2", status: "amarela" },
    { id: "q3", pergunta: "Pergunta 3", status: "vermelha" }
  ]
};

const sessaoSalva = clinicalHistoryService.saveVideochamadaSession(sessaoVideochamada);
assert(sessaoSalva.id, "Sessão salva deve ter ID gerado");

// 3. Verificar listagem com filtro
const todas = clinicalHistoryService.getAllActivities();
assert.equal(todas.length, 1, "Deve conter 1 atividade no histórico");
assert.equal(todas[0].moduleType, MODULE_TYPES.VIDEOCHAMADA);
console.log("✓ Sessão listada no histórico com tipo 'videochamada'");

// 4. Testar fila de revisão (amarelas e vermelhas)
const filaRevisao = clinicalHistoryService.getQuestoesRevisao();
assert.equal(filaRevisao.length, 2, "Fila de revisão deve conter exatamente as 2 questões erradas (q2 amarela e q3 vermelha)");
console.log("✓ Fila de revisão de erradas possui exatamente 2 itens");

// 5. Testar remoção de questão após refazimento com acerto
clinicalHistoryService.removerQuestoesRevisao([{ id: "q2", pergunta: "Pergunta 2" }]);
const filaAposAcerto = clinicalHistoryService.getQuestoesRevisao();
assert.equal(filaAposAcerto.length, 1, "Após acertar q2, fila de revisão deve conter apenas 1 questão restante");
assert.equal(filaAposAcerto[0].id, "q3", "A questão restante deve ser a q3");
console.log("✓ Remoção cirúrgica de questão acertada na revisão validada com sucesso");

// 6. Testar exclusão com dupla confirmação
clinicalHistoryService.limparTodoHistorico();
const listaAposLimpeza = clinicalHistoryService.getAllActivities();
assert.equal(listaAposLimpeza.length, 0, "Histórico deve estar completamente limpo");
const filaAposLimpeza = clinicalHistoryService.getQuestoesRevisao();
assert.equal(filaAposLimpeza.length, 0, "Fila de revisão deve estar completamente limpa");
console.log("✓ Exclusão total do histórico e fila de revisão validada");

console.log("\n🎯 TODOS OS TESTES DO HISTÓRICO DE ATIVIDADES PASSARAM COM SUCESSO!");

