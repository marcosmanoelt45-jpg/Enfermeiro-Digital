import { PACIENTES, CASOS_SIMULADOR, gerarCasoAleatorio } from "../src/data/simuladorCasosData.js";
import { validateCalculoAnswer } from "../src/services/simuladorFormulaService.js";

console.log("🔍 INICIANDO AUDITORIA DO BANCO DE QUESTÕES DA VIDEOCHAMADA...\n");

let errosEncontrados = 0;

// 1. Validar estrutura dos pacientes
const pacientesEsperados = ["marcus", "teresinha"];
for (const pId of pacientesEsperados) {
  const p = PACIENTES[pId];
  if (!p) {
    console.error(`❌ Paciente ${pId} não encontrado em PACIENTES!`);
    errosEncontrados++;
  } else {
    console.log(`✅ Paciente validado: ${p.nome} (${p.idade}) - Pitch ${p.pitch}`);
  }
}

// 2. Validar casos clínicos e contagem de questões
let totalPassosGlobal = 0;
let totalQuestoesGlobal = 0;

for (const pId of pacientesEsperados) {
  const caso = CASOS_SIMULADOR[pId];
  if (!caso) {
    console.error(`❌ Caso clínico para ${pId} não encontrado!`);
    errosEncontrados++;
    continue;
  }

  const passos = caso.passos;
  totalPassosGlobal += passos.length;
  const questoes = passos.filter((p) => p.tipo !== "fala");
  totalQuestoesGlobal += questoes.length;

  console.log(`\n📋 Caso ${caso.titulo} (${pId}):`);
  console.log(`   - Total de passos: ${passos.length}`);
  console.log(`   - Questões interativas: ${questoes.length}`);

  if (passos.length < 22) {
    console.error(`❌ Esperado no mínimo 22 passos para ${pId}, encontrado ${passos.length}`);
    errosEncontrados++;
  }

  // Validar cada passo
  passos.forEach((p, idx) => {
    if (!p.audioPath) {
      console.error(`❌ Passo ${idx} (${pId}) sem audioPath!`);
      errosEncontrados++;
    }

    if (p.tipo === "fala") {
      if (!p.texto || typeof p.texto !== "string") {
        console.error(`❌ Passo ${idx} (fala) sem texto válido!`);
        errosEncontrados++;
      }
    } else if (p.tipo === "multipla_escolha") {
      if (!p.pergunta || !Array.isArray(p.opcoes) || p.opcoes.length < 2) {
        console.error(`❌ Passo ${idx} (ME) sem pergunta ou opções suficientes!`);
        errosEncontrados++;
      }
      if (typeof p.correta !== "number" || p.correta < 0 || p.correta >= p.opcoes.length) {
        console.error(`❌ Passo ${idx} (ME) com índice de resposta correta inválido: ${p.correta}`);
        errosEncontrados++;
      }
      if (!p.explicacao) {
        console.error(`❌ Passo ${idx} (ME) sem explicação!`);
        errosEncontrados++;
      }
    } else if (p.tipo === "multipla_selecao") {
      if (!p.pergunta || !Array.isArray(p.opcoes) || p.opcoes.length < 2) {
        console.error(`❌ Passo ${idx} (MS) sem pergunta ou opções suficientes!`);
        errosEncontrados++;
      }
      if (!Array.isArray(p.corretas) || p.corretas.length === 0) {
        console.error(`❌ Passo ${idx} (MS) sem array de corretas válido!`);
        errosEncontrados++;
      }
      p.corretas.forEach((cIdx) => {
        if (cIdx < 0 || cIdx >= p.opcoes.length) {
          console.error(`❌ Passo ${idx} (MS) com índice de correta fora do limite: ${cIdx}`);
          errosEncontrados++;
        }
      });
      if (!p.explicacao) {
        console.error(`❌ Passo ${idx} (MS) sem explicação!`);
        errosEncontrados++;
      }
    } else if (p.tipo === "calculo") {
      if (!p.pergunta || !p.prescricao || !p.formulaGuia || typeof p.respostaEsperada !== "number") {
        console.error(`❌ Passo ${idx} (cálculo) com campos obrigatórios ausentes!`);
        errosEncontrados++;
      }
      // Testa o validador numérico de cálculo
      const resultadoTeste = validateCalculoAnswer({
        alunoResposta: p.respostaEsperada,
        formula: p.formula,
        variaveis: p.variaveis,
        valorEsperado: p.respostaEsperada,
        tolerancia: p.tolerancia || 0.05,
        unidade: p.unidade
      });
      if (!resultadoTeste.correta) {
        console.error(`❌ Passo ${idx} (cálculo) falhou na validação matemática interna!`, resultadoTeste);
        errosEncontrados++;
      }
    } else if (p.tipo === "resposta_falada") {
      if (!p.pergunta || !Array.isArray(p.aceitas) || p.aceitas.length < 5 || !p.respostaCertaTexto) {
        console.error(`❌ Passo ${idx} (fala) com dicionário de aceitas insuficiente!`);
        errosEncontrados++;
      }
    } else {
      console.error(`❌ Tipo desconhecido no passo ${idx}: ${p.tipo}`);
      errosEncontrados++;
    }
  });
}

// 3. Teste procedural de geração aleatória
console.log("\n🎲 TESTANDO GERAÇÃO PROCEDURAL (Fisher-Yates)...");
for (let i = 0; i < 5; i++) {
  const casoAleatorio = gerarCasoAleatorio("marcus", { shuffleQuestions: true, minQuestions: 10 });
  if (casoAleatorio.passos.length !== 11) { // 1 fala + 10 questões
    console.error(`❌ gerarCasoAleatorio retornou ${casoAleatorio.passos.length} passos, esperado 11`);
    errosEncontrados++;
  }
}

console.log(`\n========================================`);
console.log(`📊 TOTAL DE PASSOS NO BANCO: ${totalPassosGlobal} (Meta >= 40)`);
console.log(`🎯 TOTAL DE QUESTÕES INTERATIVAS: ${totalQuestoesGlobal}`);
console.log(`⚡ ERROS ENCONTRADOS: ${errosEncontrados}`);
console.log(`========================================\n`);

if (errosEncontrados > 0) {
  process.exit(1);
} else {
  console.log("🎉 AUDITORIA CONCLUÍDA COM 100% DE SUCESSO!");
}
