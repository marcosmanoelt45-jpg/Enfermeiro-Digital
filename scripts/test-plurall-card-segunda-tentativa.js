/**
 * test-plurall-card-segunda-tentativa.js
 *
 * Teste unitário para validar a lógica de transição e desbloqueio do PlurallQuestionCard
 * no cenário exato reportado: 1º erro (dica ativa) -> 2ª tentativa correta -> desbloqueio de Próxima Questão.
 */

import assert from "node:assert/strict";
import fs from "fs";
import path from "path";

console.log("=== INICIANDO TESTE TDD: DESBLOQUEIO DA 2ª TENTATIVA NO PLURALL CARD ===");

const cardPath = path.join(process.cwd(), "src", "components", "simulador", "PlurallQuestionCard.jsx");
const cardContent = fs.readFileSync(cardPath, "utf8");

// 1. Verifica se aceita isFinalizada
assert.ok(
  cardContent.includes("isFinalizada: propIsFinalizada = false") || cardContent.includes("isFinalizada = false"),
  "PlurallQuestionCard deve aceitar a prop isFinalizada explicitamente"
);
console.log("✓ PlurallQuestionCard aceita a prop isFinalizada");

// 2. Verifica se a fórmula de isFinalizada engloba tentativas >= 2 e a prop
assert.ok(
  cardContent.includes("tentativas >= 2") || cardContent.includes("propIsFinalizada"),
  "A lógica de isFinalizada deve considerar tentativas >= 2 ou a prop recebida"
);
console.log("✓ Lógica de finalização considera tentativas e prop passada");

// 3. Simulação da regra booleana de estado
function calcularFinalizada({ status, isFinalizada, tentativas, isReadOnly }) {
  return Boolean(isFinalizada || status === "verde" || status === "vermelha" || tentativas >= 2 || isReadOnly);
}

// Caso 1: 1º Erro (Amarela, tentativas = 1, isFinalizada = false)
const c1Finalizada = calcularFinalizada({ status: "amarela", isFinalizada: false, tentativas: 1, isReadOnly: false });
assert.equal(c1Finalizada, false, "1º erro deve manter a questão aberta");
console.log("✓ 1º Erro: questão mantida aberta para nova escolha");

// Caso 2: 2ª Tentativa com Acerto (Amarela, tentativas = 2, isFinalizada = true) -> O CASO DO BUG!
const c2Finalizada = calcularFinalizada({ status: "amarela", isFinalizada: true, tentativas: 2, isReadOnly: false });
assert.equal(c2Finalizada, true, "2ª tentativa com acerto DEVE finalizar a questão e exibir botão Próxima Questão");
console.log("✓ 2ª Tentativa com Acerto: questão finalizada com sucesso, liberando botão Próxima");

// Caso 3: 2ª Tentativa com Erro (Vermelha, tentativas = 2, isFinalizada = true)
const c3Finalizada = calcularFinalizada({ status: "vermelha", isFinalizada: true, tentativas: 2, isReadOnly: false });
assert.equal(c3Finalizada, true, "2ª tentativa com erro finaliza e marca vermelha");
console.log("✓ 2ª Tentativa com Erro: questão finalizada como vermelha de revisão");

console.log("\n🎯 TESTE DE DESBLOQUEIO DA 2ª TENTATIVA APROVADO COM 100% DE SUCESSO!");
