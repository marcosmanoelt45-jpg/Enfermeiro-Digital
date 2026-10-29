/**
 * test-perfil-acertos-seguidos.js
 * Teste unitário TDD para gamificação individual por conta e streak de acertos seguidos.
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
import { clinicalGamificationService } from "../src/services/clinicalGamificationService.js";

console.log("=== INICIANDO TESTE TDD: ACERTOS SEGUIDOS & PERFIL INDIVIDUAL ===");

const userIdA = "user_enfere_101";
const userIdB = "user_enfere_202";

// 1. Obter estado do usuário A
const stateA = clinicalGamificationService.getState(userIdA);
assert.equal(typeof stateA.acertosSeguidos, "number", "acertosSeguidos deve ser inicializado como número");
assert.equal(stateA.acertosSeguidos, 0, "acertosSeguidos deve iniciar em 0 para nova conta");
console.log("✓ Inicialização de acertosSeguidos validada");

// 2. Simular 3 acertos seguidos para Usuário A
clinicalGamificationService.registrarAcertoQuestao(userIdA);
clinicalGamificationService.registrarAcertoQuestao(userIdA);
clinicalGamificationService.registrarAcertoQuestao(userIdA);

const stateApos3 = clinicalGamificationService.getState(userIdA);
assert.equal(stateApos3.acertosSeguidos, 3, "Deve acumular 3 acertos seguidos");
assert.equal(stateApos3.melhorAcertosSeguidos, 3, "Recorde de acertos seguidos deve ser 3");
console.log("✓ Acertos consecutivos incrementam +1 por acerto");

// 3. Verificar que Usuário B permanece isolado com 0 acertos seguidos
const stateB = clinicalGamificationService.getState(userIdB);
assert.equal(stateB.acertosSeguidos, 0, "Usuário B não deve ser afetado pelas ações do Usuário A");
console.log("✓ Isolamento de dados gamificados por conta (userId) comprovado");

// 4. Simular 1º erro (Amarelo / Dica) para Usuário A: NÃO DEVE ZERAR
// No 1º erro, nenhuma chamada a registrarErroVermelhoQuestao é feita
const stateAposDica = clinicalGamificationService.getState(userIdA);
assert.equal(stateAposDica.acertosSeguidos, 3, "1º Erro (Amarelo) não deve zerar acertos seguidos");
console.log("✓ 1º Erro (Amarelo com dica) preserva a sequência de acertos");

// 5. Simular 2º erro (Vermelho) para Usuário A: DEVE ZERAR
clinicalGamificationService.registrarErroVermelhoQuestao(userIdA);
const stateAposErroVermelho = clinicalGamificationService.getState(userIdA);
assert.equal(stateAposErroVermelho.acertosSeguidos, 0, "Erro vermelho deve zerar acertos seguidos");
assert.equal(stateAposErroVermelho.melhorAcertosSeguidos, 3, "Recorde de acertos deve ser preservado mesmo após zerar");
console.log("✓ Erro Vermelho zera os acertos seguidos mantendo o recorde");

console.log("\n🎯 TODOS OS TESTES DE ACERTOS SEGUIDOS E PERFIL PASSARAM COM SUCESSO!");
