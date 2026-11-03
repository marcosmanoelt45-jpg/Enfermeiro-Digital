/**
 * sbarTutorService.js
 * Motor Pedagógico de Avaliação da Passagem de Plantão (Metodologia SBAR) pelo Goti IA.
 * 
 * Foco Central na Aprendizagem do Estudante de Enfermagem:
 * - Meta Internacional de Segurança do Paciente nº 2 (Comunicação Efetiva).
 * - Resolução COFEN nº 736/2024.
 * - Simulação de Consequências de Evento Sentinela (O que aconteceria na vida real se um dado for omitido).
 * - Debriefing Interativo do Goti IA.
 */

import { sanitizeTextForLGPD } from "../lib/dlpSanitizer.js";

import { callResilientAI } from "./aiCoreService.js";

/**
 * Executa avaliação pedagógica SBAR usando callResilientAI.
 */
async function callGemini(systemPrompt, userPrompt) {
  try {
    const result = await callResilientAI(systemPrompt, userPrompt, {
      temperature: 0.3,
      responseMimeType: "application/json",
      maxTokens: 1500,
    });

    if (result?.text) {
      try {
        return JSON.parse(result.text);
      } catch {
        return { rawResponse: result.text };
      }
    }
  } catch (err) {
    console.warn("[Goti IA SBAR] Falha ao invocar motor de IA resiliente:", err);
  }

  return null;
}

/**
 * Heurística pedagógica estruturada para avaliação offline ou fallback da IA.
 */
/**
 * Normaliza string para comparação semântica tolerante a acentos e maiúsculas.
 */
function normalizeSbar(str = "") {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Heurística pedagógica estruturada para avaliação offline ou fallback da IA.
 */
export function buildOfflineSbarEvaluation(caseData, sbar) {
  const normS = normalizeSbar(sbar?.situation || "");
  const normB = normalizeSbar(sbar?.background || "");
  const normA = normalizeSbar(sbar?.assessment || "");
  const normR = normalizeSbar(sbar?.recommendation || "");
  const totalLength = normS.length + normB.length + normA.length + normR.length;
  const fullText = `${normS} ${normB} ${normA} ${normR}`;

  // Resposta vazia ou curtíssima
  if (totalLength < 20) {
    return {
      safetyScore: 15,
      grade: "Requer Atenção (Risco Crítico)",
      summaryFeedback: "A passagem de plantão enviada foi extremamente sucinta ou incompleta (15/100). A omissão de dados estruturados na transição de cuidados representa a principal causa de eventos sentinela em hospitais.",
      pillarScores: {
        situation: { score: 15, feedback: "Identificação do leito e motivo imediato da internação não informados." },
        background: { score: 10, feedback: "Histórico prévio, comorbidades e status de alergias omitidos." },
        assessment: { score: 15, feedback: "Nenhum sinal vital objetivo (PA, FC, SatO2) foi informado." },
        recommendation: { score: 20, feedback: "Pendências assistenciais e metas de monitorização ausentes." }
      },
      sentinelConsequence: "⚠️ Risco Crítico de Evento Sentinela: Sem identificação de alergias, parâmetros vitais e pendências, a equipe entrante fica totalmente às cegas, aumentando drasticamente o risco de erros de medicação e descompensação não detectada.",
      criticalOmissions: [
        "Status alérgico não foi categoricamente confirmado.",
        "Sinais vitais objetivos (PA, FC, SatO2, FR) não foram passados.",
        "Pendências com aprazamento ausentes."
      ],
      strengths: ["Iniciou a simulação de transição de cuidados SBAR."],
      socraticQuestions: [
        "Qual é o primeiro dado de segurança que você deve comunicar ao passar o plantão de um paciente?",
        "Como a equipe da noite saberá se a pressão arterial ou saturação do paciente piorou se você não informou os números atuais?"
      ],
      florenceMentorship: "A clareza e a precisão da passagem de plantão salvam vidas. Nunca entregue um paciente sem dados vitais consolidados.",
      gotiMentorship: "A clareza e a precisão da passagem de plantão salvam vidas. Nunca entregue um paciente sem dados vitais consolidados."
    };
  }

  // Verificações do Eixo S (Situação) - 0 a 100
  // Regras com limite de palavra e número onde a rubrica pede número ("pa" não casa com "paciente").
  const hasBed = /\b(?:leito|quarto|box|enfermaria|apto|uti)\b/i.test(normS);
  const hasAdmissionReason = /dpo|admi|interna|queixa|cirurg|crise|dor|pos-op|diagnost/i.test(normS);
  const situationScore = hasBed && hasAdmissionReason ? (normS.length > 25 ? 95 : 80) : hasBed || hasAdmissionReason ? 60 : 30;

  // Verificações do Eixo B (Histórico) - 0 a 100
  const hasAllergy = /alergia|alergic|sem alergia|nega alergia/i.test(fullText);
  const hasComorbidities = /\b(?:has|dm2?|icc|dpoc|avc)\b|hipertens|diabet|asma|alzheimer|demencia|comorbidade|remedio|medicac|historico/i.test(normB);
  const backgroundScore = hasAllergy && hasComorbidities ? (normB.length > 30 ? 95 : 80) : hasAllergy || hasComorbidities ? 60 : 25;

  // Verificações do Eixo A (Avaliação) - 0 a 100
  const hasVitalsPa = /\b(?:pa|pressao(?: arterial)?)\b\D{0,10}\d{1,3}\s*(?:\/|x|por)\s*\d{1,3}|\b\d{2,3}\s*(?:\/|x)\s*\d{2,3}\b/i.test(normA);
  const hasVitalsSat = /\b(?:sat(?:o2)?|spo2|saturacao|saturando)\b\D{0,10}\d{2,3}|\b\d{2,3}\s*%/i.test(normA);
  const hasVitalsFc = /\b(?:fc|pulso|frequencia cardiaca)\b\D{0,10}\d{2,3}|\b\d{2,3}\s*bpm\b/i.test(normA);
  const hasExamFinding = /\b(?:dor|dreno|curativo|eva|glasgow|diurese|edema)\b|estertor|sibil|consciencia|ausculta|orientad/i.test(normA);
  const vitalsCount = [hasVitalsPa, hasVitalsSat, hasVitalsFc, hasExamFinding].filter(Boolean).length;
  const assessmentScore = vitalsCount >= 3 ? 95 : vitalsCount === 2 ? 75 : vitalsCount === 1 ? 50 : 25;

  // Verificações do Eixo R (Recomendação) - 0 a 100
  const hasActionTiming = /\b(?:as\s*)?\d{1,2}\s*(?:h|hs|horas)\b|\ba cada \d+|\bde \d+ em \d+|\bproximo plantao\b|\bapraz/i.test(normR);
  const hasSpecificAction = /administrar|dreno|exame|balanco|decubito|grade|analgesia|oxigenio|reavaliar|colher/i.test(normR);
  const recommendationScore = hasActionTiming && hasSpecificAction ? 95 : hasActionTiming || hasSpecificAction ? 70 : 30;

  // Cálculo Geral do Índice de Segurança
  let overallScore = Math.round((situationScore + backgroundScore + assessmentScore + recommendationScore) / 4);
  if (!hasAllergy) {
    overallScore = Math.min(overallScore, 65); // Penalidade pedagógica rigorosa por omissão de alergias (Meta 2 OMS)
  }

  // Simulação de Consequência de Evento Sentinela
  let sentinelConsequence = "";
  if (!hasAllergy) {
    sentinelConsequence = "⚠️ Risco Crítico de Evento Sentinela: A omissão do status alérgico pode induzir a equipe noturna a administrar fármacos contraindicados (ex.: dipirona, AINEs ou penicilinas), deflagrando choque anafilático à beira-leito.";
  } else if (!hasVitalsSat && !hasVitalsPa) {
    sentinelConsequence = "⚠️ Risco Assistencial: Sem parâmetros numéricos de PA e SatO2, a equipe entrante não perceberá se o paciente estiver evoluindo com hipoxemia silenciosa ou choque compensado nas próximas horas.";
  } else if (!hasSpecificAction) {
    sentinelConsequence = "⚠️ Risco de Omissão de Cuidado: Uma recomendação vaga sem horários ou metas definidas faz com que drenagens, analgesias de resgate e exames de controle sejam atrasados no plantão noturno.";
  } else {
    sentinelConsequence = "🛡️ Alta Proteção Assistencial: A passagem de plantão foi precisa e segura. A equipe que assume possui clareza total das prioridades e nenhum ponto cego foi identificado.";
  }

  return {
    safetyScore: overallScore,
    grade: overallScore >= 85 ? "Excelente (Padrão Ouro)" : overallScore >= 70 ? "Adequado (Seguro)" : "Requer Atenção (Risco)",
    summaryFeedback: overallScore >= 85
      ? "Parabéns, acadêmico! Sua comunicação foi cirúrgica, priorizando a segurança do paciente e fornecendo à equipe entrante tudo o que é necessário para a continuidade do cuidado."
      : overallScore >= 70
      ? "Sua passagem de plantão foi aceitável, mas incluiu lacunas que você deve aperfeiçoar para garantir padrão ouro de segurança hospitalar."
      : "Atenção: A passagem de plantão apresentou omissões críticas que colocariam o paciente em risco assistencial. Revise os pontos apontados pelo Goti.",
    pillarScores: {
      situation: {
        score: situationScore,
        feedback: hasBed
          ? "Identificação de leito e motivo imediato da internação informados."
          : "Lembre-se de sempre iniciar pelo número do leito e tempo de pós-operatório ou internação."
      },
      background: {
        score: backgroundScore,
        feedback: hasAllergy
          ? "Status alérgico e comorbidades devidamente confirmados."
          : "Crítico: Você não confirmou expressamente o status alérgico do paciente no histórico."
      },
      assessment: {
        score: assessmentScore,
        feedback: vitalsCount >= 2
          ? "Sinais vitais objetivos e dados do exame físico bem comunicados."
          : "Evite termos subjetivos como 'está bem'. Crie o hábito de citar PA, SatO2, FC e aspectos de drenos/ferida."
      },
      recommendation: {
        score: recommendationScore,
        feedback: hasSpecificAction
          ? "Condutas e pendências com metas claras para o próximo turno."
          : "Seja mais proativo na recomendação: defina o que precisa ser administrado, vigiado ou colhido com horários."
      }
    },
    sentinelConsequence,
    criticalOmissions: [
      !hasAllergy ? "Status alérgico não foi categoricamente confirmado na transição de cuidados." : null,
      !hasVitalsPa ? "Pressão arterial (PA) numérica não foi informada na avaliação." : null,
      !hasVitalsSat ? "Saturação de oxigênio (SatO2) e uso de suporte ventilatório não citados." : null,
      !hasSpecificAction ? "Recomendações sem aprazamento ou pendências laboratoriais específicas." : null
    ].filter(Boolean),
    strengths: [
      hasBed ? "Identificação topográfica precisa (leito/setor)." : null,
      hasComorbidities ? "Reconhecimento das comorbidades de base que impactam o plano terapêutico." : null,
      hasExamFinding ? "Valorização de queixas álgicas e achados do exame físico à beira-leito." : null,
      hasActionTiming ? "Atenção à linha do tempo e pendências assistenciais." : null
    ].filter(Boolean),
    socraticQuestions: [
      `Considerando a hipótese clínica de ${caseData?.diagnosis || caseData?.title || "descompensação"}, qual parâmetro vital você acompanharia de hora em hora para prever instabilidade hemodinâmica?`,
      "Se o paciente apresentar piora súbita no meio da noite, qual seria a primeira conduta da enfermagem antes de acionar a equipe médica?"
    ],
    florenceMentorship: "O segredo de um enfermeiro respeitado no hospital é a clareza da sua passagem de plantão. Quem ouve o seu SBAR deve conseguir visualizar o paciente perfeitamente em 60 segundos.",
    gotiMentorship: "O segredo de um enfermeiro respeitado no hospital é a clareza da sua passagem de plantão. Quem ouve o seu SBAR deve conseguir visualizar o paciente perfeitamente em 60 segundos."
  };
}

/**
 * Avalia a Passagem de Plantão SBAR do estudante com o Goti IA.
 * @param {object} params
 * @param {object} params.caseData - Dados do paciente e do caso
 * @param {object} params.sbar - Objeto com { situation, background, assessment, recommendation }
 * @returns {Promise<object>} Avaliação formativa do Goti IA
 */
const PILLARS = ["situation", "background", "assessment", "recommendation"];
const clampScore = (v) => Math.min(100, Math.max(0, Math.round(v)));

function describeCaseVitals(v = {}) {
  const pa = v.pa_sistolica && v.pa_diastolica ? `PA ${v.pa_sistolica}/${v.pa_diastolica} mmHg` : "PA não registrada";
  const fc = v.fc ? `FC ${v.fc} bpm` : "FC não registrada";
  const sat = v.sat ? `SatO2 ${v.sat}%` : "SatO2 não registrada";
  const fr = v.fr ? `FR ${v.fr} irpm` : "FR não registrada";
  return [pa, fc, sat, fr].join(", ");
}

// Só aceita a resposta da IA com nota numérica válida. Pilar ausente usa a nota calculada
// sobre o mesmo texto, nunca um valor fixo.
export function normalizeEvaluation(ai, offline) {
  const score = Number(ai?.safetyScore);
  if (!ai || !Number.isFinite(score)) return offline;
  const pillarScores = {};
  for (const key of PILLARS) {
    const p = ai.pillarScores?.[key];
    const n = Number(p?.score);
    pillarScores[key] = Number.isFinite(n)
      ? { score: clampScore(n), feedback: typeof p.feedback === "string" && p.feedback ? p.feedback : offline.pillarScores[key].feedback }
      : offline.pillarScores[key];
  }
  const list = (v, fallback) => (Array.isArray(v) ? v.filter((x) => typeof x === "string") : fallback);
  return {
    ...offline,
    ...ai,
    safetyScore: clampScore(score),
    pillarScores,
    criticalOmissions: list(ai.criticalOmissions, offline.criticalOmissions),
    strengths: list(ai.strengths, offline.strengths),
    socraticQuestions: list(ai.socraticQuestions, offline.socraticQuestions)
  };
}

export async function evaluateSbarHandoff({ caseData, sbar }) {
  const sanitizedSituation = sanitizeTextForLGPD(sbar?.situation || "");
  const sanitizedBackground = sanitizeTextForLGPD(sbar?.background || "");
  const sanitizedAssessment = sanitizeTextForLGPD(sbar?.assessment || "");
  const sanitizedRecommendation = sanitizeTextForLGPD(sbar?.recommendation || "");

  const systemPrompt = `Você é o "Goti IA", enfermeiro digital especialista em Prática Clínica, Terapia Intensiva e Segurança do Paciente da plataforma Enfere.
Sua missão é realizar uma avaliação formativa construtiva avaliando a passagem de plantão (metodologia SBAR) feita por um estudante de enfermagem.
Diretrizes: Meta Internacional de Segurança do Paciente nº 2 (Comunicação Efetiva) e Resolução COFEN nº 736/2024.

CRITÉRIOS RIGOROSOS DE AVALIAÇÃO DE NOTAS (safetyScore de 0 a 100):
- Se o estudante enviou respostas evasivas, textos curtos (menos de 1 linha por campo) ou respostas genéricas tipo "tudo bem", "dar remédio": safetyScore DEVE ficar entre 15 e 45.
- Se o estudante omitiu o status de ALERGIA expressamente: penalize a nota (máximo 65).
- Se faltarem sinais vitais numéricos (PA, SatO2, FC): penalize o pilar assessment (máximo 60).
- Se a recomendação não tiver horários ou ações concretas: penalize o pilar recommendation (máximo 60).
- Notas acima de 85 são EXCLUSIVAS para comunicações completas com leito, dados vitais numéricos, alergia e condutas aprazadas.
- TOLERÂNCIA ORTOGRÁFICA: Ignore erros menores de digitação ou ausência de acentuação se os dados clínicos estiverem compreensíveis.
- Detalhe com transparência na síntese por que a nota foi atribuída e quais pontos foram deduzidos.

Retorne ESTRITAMENTE um JSON no seguinte formato:
{
  "safetyScore": number (0 a 100 calibrado com rigor),
  "grade": string ("Excelente (Padrão Ouro)" | "Adequado (Seguro)" | "Requer Atenção (Risco)"),
  "summaryFeedback": string (síntese construtiva e transparente explicando a nota e perdas de pontos),
  "pillarScores": {
    "situation": { "score": number, "feedback": string },
    "background": { "score": number, "feedback": string },
    "assessment": { "score": number, "feedback": string },
    "recommendation": { "score": number, "feedback": string }
  },
  "sentinelConsequence": string (explicação viva do que aconteceria na vida real se os dados omitidos pelo aluno fossem esquecidos num hospital real),
  "criticalOmissions": string[] (lista de dados ou riscos omitidos),
  "strengths": string[] (aspectos positivos identificados),
  "socraticQuestions": string[] (2 perguntas clínicas que estimulam o raciocínio fisiopatológico),
  "florenceMentorship": string (mensagem de mentoria profissional do Goti para o estudante),
  "gotiMentorship": string (mensagem de mentoria profissional do Goti para o estudante)
}`;

  const userPrompt = `DADOS DO CASO CLÍNICO:
Paciente: ${caseData?.name || "não informado"} (${caseData?.age ? `${caseData.age} anos` : "idade não informada"}) • Leito: ${caseData?.bed || "não informado"}
Diagnóstico: ${caseData?.diagnosis || caseData?.title || "não informado"}
Sinais Vitais Registrados: ${describeCaseVitals(caseData?.vitals)}

RELATÓRIO SBAR ELABORADO PELO ESTUDANTE:
- S (Situação): ${sanitizedSituation || "Não informada"}
- B (Breve Histórico): ${sanitizedBackground || "Não informado"}
- A (Avaliação Atual): ${sanitizedAssessment || "Não informada"}
- R (Recomendação): ${sanitizedRecommendation || "Não informada"}

Avalie o raciocínio clínico com foco no rigor de segurança do paciente. Deduza pontos se faltarem dados objetivos e explique o motivo.`;

  const offline = buildOfflineSbarEvaluation(caseData, {
    situation: sanitizedSituation,
    background: sanitizedBackground,
    assessment: sanitizedAssessment,
    recommendation: sanitizedRecommendation
  });

  try {
    const aiResponse = await callGemini(systemPrompt, userPrompt);
    return normalizeEvaluation(aiResponse, offline);
  } catch (error) {
    console.warn("[sbarTutorService] Fallback para motor heurístico estruturado:", error);
  }

  return offline;
}
