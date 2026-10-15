/**
 * sbarTutorService.js
 * Motor Pedagógico de Avaliação e Preceptoria da Passagem de Plantão (Metodologia SBAR).
 * 
 * Foco Central na Aprendizagem do Estudante de Enfermagem:
 * - Meta Internacional de Segurança do Paciente nº 2 (Comunicação Efetiva).
 * - Resolução COFEN nº 736/2024.
 * - Simulação de Consequências de Evento Sentinela (O que aconteceria na vida real se um dado for omitido).
 * - Debriefing Socrático Interativo da Preceptora Florence.
 */

import { sanitizeTextForLGPD } from "../lib/dlpSanitizer.js";

function getGeminiApiKey() {
  if (typeof localStorage !== "undefined") {
    const key = localStorage.getItem("enfermeiro_gemini_api_key");
    if (key && key.trim()) return key.trim();
  }
  try {
    if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
      return import.meta.env.VITE_GEMINI_API_KEY;
    }
  } catch {}
  if (typeof process !== "undefined" && process.env && process.env.VITE_GEMINI_API_KEY) {
    return process.env.VITE_GEMINI_API_KEY;
  }
  return "";
}

async function callGemini(systemPrompt, userPrompt) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const savedModel = (typeof localStorage !== "undefined" && localStorage.getItem("enfermeiro_gemini_model")) || null;
  const models = [
    ...(savedModel ? [savedModel] : []),
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash-latest",
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
            return { rawResponse: text };
          }
        }
      }
    } catch (err) {
      console.warn(`[Preceptoria SBAR] Falha com modelo ${model}:`, err);
    }
  }

  return null;
}

/**
 * Heurística pedagógica estruturada para avaliação offline ou fallback da IA.
 */
export function buildOfflineSbarEvaluation(caseData, sbar) {
  const textSituation = (sbar?.situation || "").toLowerCase();
  const textBackground = (sbar?.background || "").toLowerCase();
  const textAssessment = (sbar?.assessment || "").toLowerCase();
  const textRecommendation = (sbar?.recommendation || "").toLowerCase();
  const fullText = `${textSituation} ${textBackground} ${textAssessment} ${textRecommendation}`;

  // Verificações do Eixo S (Situação)
  const hasBed = textSituation.includes("leito") || textSituation.includes("quarto") || textSituation.includes("box") || textSituation.includes("enfermaria");
  const hasAdmissionReason = textSituation.includes("dpo") || textSituation.includes("admi") || textSituation.includes("interna") || textSituation.includes("queixa") || textSituation.includes("cirurgia") || textSituation.includes("crise");
  const situationScore = hasBed && hasAdmissionReason ? 95 : hasBed || hasAdmissionReason ? 75 : 55;

  // Verificações do Eixo B (Histórico)
  const hasAllergy = fullText.includes("alergia") || fullText.includes("alérgic") || fullText.includes("sem alergia") || fullText.includes("nega alergia");
  const hasComorbidities = textBackground.includes("has") || textBackground.includes("hiperten") || textBackground.includes("dm") || textBackground.includes("diab") || textBackground.includes("icc") || textBackground.includes("asma") || textBackground.includes("alzheimer") || textBackground.includes("comorbidade") || textBackground.includes("remédio") || textBackground.includes("medica");
  const backgroundScore = hasAllergy && hasComorbidities ? 95 : hasAllergy || hasComorbidities ? 70 : 50;

  // Verificações do Eixo A (Avaliação)
  const hasVitalsPa = textAssessment.includes("pa") || textAssessment.includes("pressão") || /\d{2,3}\s*\/\s*\d{2,3}/.test(textAssessment);
  const hasVitalsSat = textAssessment.includes("sat") || textAssessment.includes("oxim") || textAssessment.includes("%");
  const hasVitalsFc = textAssessment.includes("fc") || textAssessment.includes("bpm") || textAssessment.includes("cardíac") || textAssessment.includes("pulso");
  const hasExamFinding = textAssessment.includes("dor") || textAssessment.includes("dreno") || textAssessment.includes("curativo") || textAssessment.includes("estertor") || textAssessment.includes("sibil") || textAssessment.includes("consciência") || textAssessment.includes("eva");
  const vitalsCount = [hasVitalsPa, hasVitalsSat, hasVitalsFc, hasExamFinding].filter(Boolean).length;
  const assessmentScore = vitalsCount >= 3 ? 95 : vitalsCount === 2 ? 75 : 55;

  // Verificações do Eixo R (Recomendação)
  const hasActionTiming = textRecommendation.includes("às") || textRecommendation.includes("h") || textRecommendation.includes("horas") || textRecommendation.includes("noite") || textRecommendation.includes("amanhã") || textRecommendation.includes("próximo") || textRecommendation.includes("vigiar") || textRecommendation.includes("checar");
  const hasSpecificAction = textRecommendation.includes("administrar") || textRecommendation.includes("dreno") || textRecommendation.includes("exame") || textRecommendation.includes("balanço") || textRecommendation.includes("decúbito") || textRecommendation.includes("grade") || textRecommendation.includes("analgesia") || textRecommendation.includes("oxigênio");
  const recommendationScore = hasActionTiming && hasSpecificAction ? 95 : hasActionTiming || hasSpecificAction ? 75 : 55;

  // Cálculo Geral do Índice de Segurança
  let overallScore = Math.round((situationScore + backgroundScore + assessmentScore + recommendationScore) / 4);
  if (!hasAllergy) {
    overallScore = Math.min(overallScore, 75); // Penalidade pedagógica por omissão de alergias (Meta 2 OMS)
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
      : "Sua passagem de plantão teve boa intenção, mas apresentou lacunas que poderiam comprometer a segurança do paciente no plantão seguinte. Veja as recomendações abaixo.",
    pillarScores: {
      situation: {
        score: situationScore,
        feedback: hasBed
          ? "Excelente identificação de leito e motivo imediato da internação."
          : "Lembre-se de sempre iniciar pelo número do leito e tempo de pós-operatório ou internação."
      },
      background: {
        score: backgroundScore,
        feedback: hasAllergy
          ? "Status alérgico e comorbidades bem explicitados."
          : "Crítico: Você não confirmou expressamente as alergias do paciente no histórico."
      },
      assessment: {
        score: assessmentScore,
        feedback: vitalsCount >= 2
          ? "Sinais vitais objetivos e dados de semiologia bem comunicados."
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
      hasExamFinding ? "Valorização de queixas álgicas e achados de semiologia à beira-leito." : null,
      hasActionTiming ? "Atenção à linha do tempo e pendências assistenciais." : null
    ].filter(Boolean),
    socraticQuestions: [
      `Considerando a hipótese clínica de ${caseData?.diagnosis || caseData?.title || "descompensação"}, qual parâmetro vital você acompanharia de hora em hora para prever instabilidade hemodinâmica?`,
      "Se o paciente apresentar piora súbita no meio da noite, qual seria a primeira conduta da enfermagem antes de acionar a equipe médica?"
    ],
    florenceMentorship: "O segredo de um enfermeiro respeitado no hospital é a clareza da sua passagem de plantão. Quem ouve o seu SBAR deve conseguir visualizar o paciente perfeitamente em 60 segundos."
  };
}

/**
 * Avalia a Passagem de Plantão SBAR do estudante com a Tutora Florence.
 * @param {object} params
 * @param {object} params.caseData - Dados do paciente e do caso
 * @param {object} params.sbar - Objeto com { situation, background, assessment, recommendation }
 * @returns {Promise<object>} Avaliação formativa socrática de Florence
 */
export async function evaluateSbarHandoff({ caseData, sbar }) {
  const sanitizedSituation = sanitizeTextForLGPD(sbar?.situation || "");
  const sanitizedBackground = sanitizeTextForLGPD(sbar?.background || "");
  const sanitizedAssessment = sanitizeTextForLGPD(sbar?.assessment || "");
  const sanitizedRecommendation = sanitizeTextForLGPD(sbar?.recommendation || "");

  const systemPrompt = `Você é a "Professora Florence", enfermeira especialista em Preceptoria Clínica, Terapia Intensiva e Segurança do Paciente.
Sua missão é realizar uma tutoria socrática formativa avaliando a passagem de plantão (metodologia SBAR) feita por um estudante de enfermagem.
Diretrizes: Meta Internacional de Segurança do Paciente nº 2 (Comunicação Efetiva) e Resolução COFEN nº 736/2024.

Retorne ESTRITAMENTE um JSON no seguinte formato:
{
  "safetyScore": number (0 a 100),
  "grade": string ("Excelente (Padrão Ouro)" | "Adequado (Seguro)" | "Requer Atenção (Risco)"),
  "summaryFeedback": string (síntese acolhedora e construtiva da tutora),
  "pillarScores": {
    "situation": { "score": number, "feedback": string },
    "background": { "score": number, "feedback": string },
    "assessment": { "score": number, "feedback": string },
    "recommendation": { "score": number, "feedback": string }
  },
  "sentinelConsequence": string (explicação viva do que aconteceria na vida real se os dados omitidos pelo aluno fossem esquecidos num hospital real),
  "criticalOmissions": string[] (lista de dados ou riscos omitidos),
  "strengths": string[] (aspectos positivos identificados),
  "socraticQuestions": string[] (2 perguntas clínicas socráticas que estimulam o raciocínio fisiopatológico),
  "florenceMentorship": string (mensagem de mentoria profissional para o estudante)
}`;

  const userPrompt = `DADOS DO CASO CLÍNICO:
Paciente: ${caseData?.name || "J.S."} (${caseData?.age || "50"} anos) • Leito: ${caseData?.bed || "Leito 12"}
Diagnóstico: ${caseData?.diagnosis || caseData?.title || "Pós-operatório / Descompensação Clínica"}
Sinais Vitais Registrados: PA ${caseData?.vitals?.pa_sistolica || "120"}/${caseData?.vitals?.pa_diastolica || "80"} mmHg, FC ${caseData?.vitals?.fc || "80"} bpm, SatO2 ${caseData?.vitals?.sat || "96"}%, FR ${caseData?.vitals?.fr || "18"} irpm

RELATÓRIO SBAR ELABORADO PELO ESTUDANTE:
- S (Situação): ${sanitizedSituation || "Não informada"}
- B (Breve Histórico): ${sanitizedBackground || "Não informado"}
- A (Avaliação Atual): ${sanitizedAssessment || "Não informada"}
- R (Recomendação): ${sanitizedRecommendation || "Não informada"}

Avalie o raciocínio clínico com foco no aprendizado do aluno e na prevenção de erros hospitalares.`;

  try {
    const aiResponse = await callGemini(systemPrompt, userPrompt);
    if (aiResponse && aiResponse.safetyScore !== undefined) {
      return aiResponse;
    }
  } catch (error) {
    console.warn("[sbarTutorService] Fallback para motor heurístico estruturado:", error);
  }

  // Fallback estruturado garantido
  return buildOfflineSbarEvaluation(caseData, {
    situation: sanitizedSituation,
    background: sanitizedBackground,
    assessment: sanitizedAssessment,
    recommendation: sanitizedRecommendation
  });
}
