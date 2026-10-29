/**
 * test-tentativas-dica.js
 * Teste unitário TDD para a máquina de estados de tentativas, dica e revisão do simulador.
 */

import assert from "node:assert/strict";

console.log("=== INICIANDO TESTE TDD: MÁQUINA DE ESTADOS DE TENTATIVAS & DICA ===");

// Simulação da máquina de estados refinada
function processarTentativa({
  estadoAnterior = { status: "aberta", tentativas: 0, selectedChoice: null, opcoesFalhadas: [] },
  escolha,
  gabarito
}) {
  const tentativasAtuais = estadoAnterior.tentativas || 0;
  const isCorreta = escolha === gabarito;

  if (isCorreta) {
    if (tentativasAtuais === 0) {
      // Acerto de 1ª
      return {
        status: "verde",
        tentativas: 1,
        selectedChoice: escolha,
        isFinalizada: true,
        opcoesFalhadas: estadoAnterior.opcoesFalhadas || [],
        resultadoGamificacao: "acerto"
      };
    } else {
      // Acerto na 2ª tentativa (após a dica)
      return {
        status: "amarela",
        tentativas: 2,
        selectedChoice: escolha,
        isFinalizada: true,
        opcoesFalhadas: estadoAnterior.opcoesFalhadas || [],
        resultadoGamificacao: "acerto"
      };
    }
  } else {
    if (tentativasAtuais === 0) {
      // 1º Erro: Dica ativada, questão amarela aberta, desmarca opção para o aluno escolher outra
      return {
        status: "amarela",
        tentativas: 1,
        selectedChoice: null, // Limpa para obrigar nova escolha consciente
        isFinalizada: false, // NÃO finaliza, permite 2ª tentativa
        opcoesFalhadas: [...(estadoAnterior.opcoesFalhadas || []), escolha],
        resultadoGamificacao: "dica_sem_zerar" // NÃO zera acertos seguidos
      };
    } else {
      // 2º Erro: Finaliza como vermelha para revisão
      return {
        status: "vermelha",
        tentativas: 2,
        selectedChoice: escolha,
        isFinalizada: true,
        opcoesFalhadas: [...(estadoAnterior.opcoesFalhadas || []), escolha],
        resultadoGamificacao: "erro_vermelho_zerar" // ZERA acertos seguidos
      };
    }
  }
}

// 1. Cenário: Acerto direto na 1ª tentativa
const r1 = processarTentativa({ escolha: 2, gabarito: 2 });
assert.equal(r1.status, "verde");
assert.equal(r1.tentativas, 1);
assert.equal(r1.isFinalizada, true);
assert.equal(r1.resultadoGamificacao, "acerto");
console.log("✓ Cenário 1: Acerto na 1ª tentativa validado (verde + finalizada)");

// 2. Cenário: 1º Erro (Dica ativada, sem finalizar)
const r2 = processarTentativa({ escolha: 1, gabarito: 2 });
assert.equal(r2.status, "amarela");
assert.equal(r2.tentativas, 1);
assert.equal(r2.isFinalizada, false, "1º erro NÃO deve finalizar a questão");
assert.equal(r2.selectedChoice, null, "Opção deve ser resetada para liberar nova escolha");
assert.deepEqual(r2.opcoesFalhadas, [1], "Opção 1 deve ser gravada na lista de falhas");
assert.equal(r2.resultadoGamificacao, "dica_sem_zerar");
console.log("✓ Cenário 2: 1º Erro ativa dica, reseta selectedChoice e mantém questão aberta");

// 3. Cenário: 2ª Tentativa com Acerto
const r3 = processarTentativa({ estadoAnterior: r2, escolha: 2, gabarito: 2 });
assert.equal(r3.status, "amarela");
assert.equal(r3.tentativas, 2);
assert.equal(r3.isFinalizada, true, "2ª tentativa resolvida finaliza a questão");
assert.equal(r3.resultadoGamificacao, "acerto");
console.log("✓ Cenário 3: 2ª tentativa com acerto finaliza como amarela resolvida");

// 4. Cenário: 2ª Tentativa com Erro (Vermelha)
const r4 = processarTentativa({ estadoAnterior: r2, escolha: 3, gabarito: 2 });
assert.equal(r4.status, "vermelha");
assert.equal(r4.tentativas, 2);
assert.equal(r4.isFinalizada, true);
assert.equal(r4.resultadoGamificacao, "erro_vermelho_zerar");
console.log("✓ Cenário 4: 2ª tentativa com erro finaliza como vermelha e aciona zeramento de acertos seguidos");

console.log("\n🎯 TODOS OS TESTES DA MÁQUINA DE TENTATIVAS PASSARAM!");
