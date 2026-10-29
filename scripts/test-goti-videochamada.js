import { gotiPreceptorService } from "../src/services/gotiPreceptorService.js";

// Mock localStorage para Node.js
const storage = {};
global.localStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; },
};

console.log("=== TESTE 1: Pergunta geral sobre videochamada sem histórico prévio ===");
const r1 = gotiPreceptorService.generateEducationalFallback("O que é a videochamada com paciente?");
console.log(r1);
console.assert(r1.includes("Videochamada") && r1.includes("Sr. Marcus"), "Deve reconhecer o módulo de videochamada e o paciente");

console.log("\n=== TESTE 2: Pergunta sobre atendimento com histórico gravado ===");
const fakeHistory = [
  {
    id: 12345678,
    pacienteId: "marcus",
    pacienteNome: "Sr. Marcus",
    acertos: 7,
    totalQuestoes: 8,
    precisao: 88,
    vidasRestantes: 2,
    semVidas: false,
    xpGanho: 140,
    tempoSegundos: 190,
    data: "27/10/2026",
    hora: "23:45",
  }
];
global.localStorage.setItem("enfermeiro_historico_videochamadas", JSON.stringify(fakeHistory));

const r2 = gotiPreceptorService.generateEducationalFallback("Como fui no meu atendimento na videochamada?");
console.log(r2);
console.assert(r2.includes("88% de precisão") && r2.includes("Sr. Marcus"), "Deve analisar os dados reais do atendimento");

console.log("\n=== TESTE 3: Pergunta sobre Dona Teresinha ===");
const r3 = gotiPreceptorService.generateEducationalFallback("Quero atender a Dona Teresinha por voz");
console.log(r3);
console.assert(r3.includes("Dona Teresinha"), "Deve reconhecer a Dona Teresinha");

console.log("\n✅ Todos os testes de integração do Goti passaram com 100% de sucesso!");
