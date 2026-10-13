/**
 * socraticTutorService.js
 * Motor Pedagógico de Tutoria Socrática para Estudantes de Enfermagem ("Professora Florence").
 *
 * Diretrizes Centrais:
 * 1. Não dar a resposta pronta mastigada.
 * 2. Método Socrático: Questionar, instigar correlações fisiopatológicas e apoiar o julgamento clínico.
 * 3. Scaffolding Pedagógico: Dicas progressivas em 3 níveis.
 * 4. Resolução COFEN nº 736/2024 (Processo de Enfermagem em 5 etapas) e Teoria de Wanda Horta.
 * 5. Conformidade com a LGPD: Sanitização de dados pré-inferência.
 */

import { sanitizeTextForLGPD } from "@/lib/dlpSanitizer";

/**
 * Obtém a chave do Gemini configurada no ambiente ou no LocalStorage.
 */
function getGeminiApiKey() {
  if (typeof localStorage !== "undefined") {
    const key = localStorage.getItem("enfermeiro_gemini_api_key");
    if (key && key.trim()) return key.trim();
  }
  return import.meta.env.VITE_GEMINI_API_KEY || "";
}

/**
 * Executa uma chamada à API do Gemini usando o modelo recomendado (3.8-flash com fallback).
 */
async function callGemini(systemPrompt, userPrompt) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return null; // Aciona o motor pedagógico offline estruturado
  }

  const savedModel = (typeof localStorage !== "undefined" && localStorage.getItem("enfermeiro_gemini_model")) || null;
  const models = [
    ...(savedModel ? [savedModel] : []),
    "gemini-3.8-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash"
  ].filter((v, i, a) => a.indexOf(v) === i);

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemPrompt}\n\n---\n\n${userPrompt}` }]
              }
            ],
            generationConfig: {
              temperature: 0.3,
              responseMimeType: "application/json"
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          try {
            return JSON.parse(text);
          } catch {
            // Se falhar o parse direto de JSON, retorna texto embrulhado
            return { rawResponse: text };
          }
        }
      }
    } catch (err) {
      console.warn(`[Tutora Socrática] Falha com modelo ${model}:`, err);
    }
  }

  return null;
}

/**
 * Avalia o raciocínio clínico formulado pelo estudante de enfermagem em um caso clínico.
 * @param {object} params
 * @param {object} params.caseData - Dados do caso simulado
 * @param {string} params.studentHypothesis - Hipótese diagnóstica proposta pelo aluno
 * @param {string} params.studentJustification - Justificativa clínica do aluno
 * @param {string} params.studentInterventions - Cuidados sugeridos pelo aluno
 * @returns {Promise<object>} Avaliação formativa e perguntas socráticas
 */
export async function evaluateClinicalReasoning({
  caseData,
  studentHypothesis,
  studentJustification,
  studentInterventions
}) {
  const cleanHypothesis = sanitizeTextForLGPD(studentHypothesis);
  const cleanJustification = sanitizeTextForLGPD(studentJustification);
  const cleanInterventions = sanitizeTextForLGPD(studentInterventions);

  const systemPrompt = `Você é a Professora Florence, uma Docente Sênior e Tutora de Enfermagem especialista em Raciocínio Clínico e no Processo de Enfermagem (Resolução COFEN nº 736/2024 e Teoria das Necessidades Humanas Básicas).

REGRAS PEDAGÓGICAS ABSOLUTAS:
1. NUNCA dê a resposta final nem o diagnóstico perfeito mastigado de mão beijada.
2. Seu papel é DESAFIAR e FOMENTAR a reflexão do estudante usando o MÉTODO SOCRÁTICO.
3. Se o aluno acertou o foco, elogie a acurácia dos dados correlacionados e faça uma pergunta reflexiva sobre o risco futuro ou priorização de cuidados.
4. Se o aluno errou ou foi superficial, aponte quais sinais vitais ou dados anamnésicos ele negligenciou e formule perguntas que o guiem a perceber o erro por si mesmo.
5. Seja encorajadora, ética e altamente científica.

Retorne EXCLUSIVAMENTE um JSON válido com esta estrutura:
{
  "score": 0 a 100 (número inteiro da qualidade do raciocínio crítico),
  "feedbackTitle": "Título formativo acolhedor",
  "strengths": ["Ponto forte 1 identificado no raciocínio", "Ponto forte 2"],
  "gaps": ["Dado clínico ou sinal vital crítico que o aluno não mencionou"],
  "socraticQuestions": [
    "Pergunta socrática 1 instigando a correlação fisiopatológica",
    "Pergunta socrática 2 instigando a priorização do cuidado ou segurança do paciente"
  ],
  "pedagogicalHint": "Pista orientadora sem entregar a resposta completa",
  "cofenStepFocus": "Qual das 5 etapas da Resolução COFEN 736/2024 precisa de mais atenção do aluno agora"
}`;

  const userPrompt = `DADOS DO CASO SIMULADO:
Título: ${caseData.title}
Histórico Sintético: ${caseData.patient?.medical_history || caseData.summary}
Sinais Vitais: PA ${caseData.vitals?.pa_sistolica}/${caseData.vitals?.pa_diastolica} mmHg | FC ${caseData.vitals?.fc} bpm | FR ${caseData.vitals?.fr} irpm | Tax ${caseData.vitals?.tax} °C | SatO2 ${caseData.vitals?.sat}%
Escalas: Braden ${caseData.braden ? 'calculado' : 'N/A'}, Dor ${caseData.caloi?.pain_intensity || 0}/10

RESPOSTA SUBMETIDA PELO ESTUDANTE:
- Hipótese Diagnóstica: ${cleanHypothesis}
- Justificativa do Aluno: ${cleanJustification}
- Cuidados Sugeridos: ${cleanInterventions}`;

  const aiResult = await callGemini(systemPrompt, userPrompt);
  if (aiResult && aiResult.score !== undefined) {
    return aiResult;
  }

  // Motor Pedagógico Heurístico de Fallback (offline / sem chave configurada)
  return generateHeuristicFeedback(caseData, cleanHypothesis, cleanJustification);
}

/**
 * Fornece dicas progressivas (Scaffolding em 3 níveis) para o estudante.
 * @param {object} caseData
 * @param {number} level - 1 (pergunta guia), 2 (pista fisiopatológica), 3 (fundamentação conceitual)
 */
export async function getScaffoldingHint(caseData, level = 1) {
  const systemPrompt = `Você é a Tutora Socrática de Enfermagem Florence. O estudante está analisando um caso simulado e pediu uma Dica Pedagógica de Nível ${level}.

NÍVEIS DE ANDAIME PEDAGÓGICO:
- Nível 1 (Pergunta Guia): Faça uma pergunta orientando o olhar do aluno para o sinal vital ou achado mais crítico, sem citar diagnósticos.
- Nível 2 (Pista Fisiopatológica): Explique o mecanismo fisiológico alterado que o organismo do paciente está demonstrando, instigando o raciocínio.
- Nível 3 (Fundamentação Conceitual & Referência): Indique qual Necessidade Humana Básica (Wanda Horta) ou Domínio Taxonômico (CIPE / literatura oficial) está comprometido e como ele deve estruturar a resposta.

Retorne EXCLUSIVAMENTE um JSON:
{
  "level": ${level},
  "title": "Nível ${level}: ...",
  "content": "Texto da dica socrática..."
}`;

  const userPrompt = `Caso: ${caseData.title}. Sinais Vitais: PA ${caseData.vitals?.pa_sistolica}/${caseData.vitals?.pa_diastolica}, FC ${caseData.vitals?.fc}, FR ${caseData.vitals?.fr}, SatO2 ${caseData.vitals?.sat}%.`;

  const aiResult = await callGemini(systemPrompt, userPrompt);
  if (aiResult && aiResult.content) {
    return aiResult;
  }

  // Fallback heurístico imediato
  if (level === 1) {
    return {
      level: 1,
      title: "Nível 1: Orientação de Foco Clínico",
      content: `Observe atentamente os sinais vitais alterados. Quais parâmetros fogem da faixa de normalidade (eupneia, normotensão, normocárdia) e qual deles representa o risco mais agudo para a integridade celular nas próximas horas?`
    };
  } else if (level === 2) {
    return {
      level: 2,
      title: "Nível 2: Pista Fisiopatológica",
      content: `Pense nos mecanismos de compensação do paciente: quando a saturação periférica cai ou há sobrecarga vascular, como o sistema cardiovascular e respiratório tentam manter a perfusão dos órgãos nobres?`
    };
  } else {
    return {
      level: 3,
      title: "Nível 3: Estrutura da Resolução COFEN 736/2024",
      content: `Consulte as necessidades psicobiológicas de oxigenação ou circulação na literatura oficial (CIPE ou NANDA-I da sua universidade). Formule o diagnóstico relacionando a resposta humana alterada aos fatores de risco evidenciados na avaliação física.`
    };
  }
}

/**
 * Guia o estudante na resolução de um cálculo de medicação ou gotejamento de forma assistida.
 * @param {object} problem - Dados do problema matemático
 * @param {string} studentAnswer - Tentativa de resposta do aluno
 */
export async function guideMedicationCalculation(problem, studentAnswer) {
  const cleanAnswer = sanitizeTextForLGPD(studentAnswer);

  const systemPrompt = `Você é a Tutora Florence ensinando Cálculo de Medicamentos e Gotejamento em Enfermagem.
O estudante está tentando resolver um problema de cálculo farmacológico.
NUNCA diga o resultado numérico final direto de mão beijada se o aluno tiver errado.
Se o aluno acertou, confirme o cálculo, comente a segurança da dose e valide a dupla checagem.
Se errou, mostre onde pode ter ocorrido a falha (ex: conversão de unidades, tempo em horas vs minutos, ou fórmula de macrogotas vs microgotas).

Retorne EXCLUSIVAMENTE um JSON:
{
  "isCorrect": true/false,
  "feedback": "Comentário pedagógico detalhado",
  "stepClarification": "Explicação do raciocínio matemático das etapas",
  "safetyAlert": "Dica de segurança do paciente na administração desse medicamento"
}`;

  const userPrompt = `PROBLEMA DE CÁLCULO:
Prescrição: ${problem.description}
Fórmula Aplicável: ${problem.formulaHint}
Resposta do Estudante: ${cleanAnswer}
Resposta Correta Esperada: ${problem.correctResult}`;

  const aiResult = await callGemini(systemPrompt, userPrompt);
  if (aiResult && aiResult.feedback) {
    return aiResult;
  }

  // Fallback offline
  const isMatch = cleanAnswer.includes(String(problem.numericAnswer || problem.correctResult));
  return {
    isCorrect: isMatch,
    feedback: isMatch
      ? `Excelente raciocínio! Você aplicou corretamente a fórmula e obteve a dosagem exata. Lembre-se sempre de realizar a dupla checagem à beira-leito.`
      : `Vamos revisar as etapas! Verifique se você converteu corretamente as unidades (mg para g, ou horas para minutos) e se utilizou a constante correta para o equipo prescrito.`,
    stepClarification: `Fórmula recomendada: ${problem.formulaHint}`,
    safetyAlert: `Segurança farmacológica: Confira sempre os 9 certos da administração de medicamentos antes da punção ou infusão.`
  };
}

/**
 * Fallback heurístico inteligente para avaliação de raciocínio clínico sem chave do Gemini.
 */
function generateHeuristicFeedback(caseData, hypothesis, justification) {
  const hasVitalsMention = /press[aã]o|pa|frequ[eê]ncia|fc|fr|sat|satura[cç][aã]o|temperatura|tax/i.test(justification);
  const textLength = (hypothesis + " " + justification).trim().length;

  let score = 50;
  const strengths = [];
  const gaps = [];

  if (textLength > 30) {
    score += 20;
    strengths.push("Elaborou uma justificativa clínica com argumentação contextualizada.");
  } else {
    gaps.push("A justificativa clínica foi muito sucinta. Desenvolva os argumentos com dados objetivos.");
  }

  if (hasVitalsMention) {
    score += 20;
    strengths.push("Correlacionou a hipótese diagnóstica com os parâmetros de sinais vitais.");
  } else {
    gaps.push("Não citou especificamente os sinais vitais alterados que sustentam a sua hipótese.");
  }

  return {
    score: Math.min(score, 95),
    feedbackTitle: "Análise Formativa do Raciocínio Clínico",
    strengths: strengths.length > 0 ? strengths : ["Iniciou a formulação de hipótese diagnóstica para o caso."],
    gaps: gaps.length > 0 ? gaps : ["Continue refinando a priorização dos cuidados de acordo com a gravidade."],
    socraticQuestions: [
      `Qual necessidade humana básica (conforme Wanda Horta) está prioritariamente em risco no momento atual?`,
      `Se a equipe não intervir nas próximas 2 horas sobre esse achado clínico, qual é a complicação fisiopatológica esperada?`
    ],
    pedagogicalHint: `Lembre-se de seguir as etapas da Resolução COFEN nº 736/2024: Avaliação -> Diagnóstico -> Planejamento -> Implementação -> Evolução.`,
    cofenStepFocus: "Etapa 2 - Diagnóstico de Enfermagem fundamentado em evidências"
  };
}
