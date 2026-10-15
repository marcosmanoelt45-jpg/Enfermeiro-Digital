/**
 * sbarTutorService.js
 * Motor Pedagógico de Avaliação e Preceptoria da Passagem de Plantão (Metodologia SBAR).
 * 
 * Alinhamento Clínico:
 * - Meta Internacional de Segurança do Paciente nº 2 (Comunicação Efetiva).
 * - Resolução COFEN nº 736/2024 (Processo de Enfermagem).
 * - Debriefing Socrático da Preceptora Florence.
 */

import { sanitizeTextForLGPD } from "@/lib/dlpSanitizer";

function getGeminiApiKey() {
  if (typeof localStorage !== "undefined") {
    const key = localStorage.getItem("enfermeiro_gemini_api_key");
    if (key && key.trim()) return key.trim();
  }
  return import.meta.env.VITE_GEMINI_API_KEY || "";
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
 * Heurística de avaliação offline caso a IA não esteja disponível.
 */
function buildOfflineSbarEvaluation(caseData, sbar) {
  const textSituation = (sbar?.situation || "").toLowerCase();
  const textBackground = (sbar?.background || "").toLowerCase();
  const textAssessment = (sbar?.assessment || "").toLowerCase();
  const textRecommendation = (sbar?.recommendation || "").toLowerCase();
  const fullText = `${textSituation} ${textBackground} ${textAssessment} ${textRecommendation}`;

  const hasBed = textSituation.includes("leito") || textSituation.includes("quarto") || textSituation.includes("box");
  const hasVitals = textAssessment.includes("pa") || textAssessment.includes("pressão") || textAssessment.includes("fc") || textAssessment.includes("sat") || textAssessment.includes("sinais");
  const hasAllergy = fullText.includes("alergia") || fullText.includes("alérgico") || fullText.includes("sem alergias");
  const hasRecommendation = textRecommendation.length > 25;

  let score = 70;
  if (hasBed) score += 8;
  if (hasVitals) score += 10;
  if (hasAllergy) score += 7;
  if (hasRecommendation) score += 5;
  score = Math.min(100, Math.max(45, score));

  return {
    safetyScore: score,
    grade: score >= 85 ? "Excelente" : score >= 70 ? "Adequado" : "Requer Atenção",
    summaryFeedback: "Sua passagem de plantão demonstrou compreensão do quadro geral do paciente, permitindo continuidade da assistência segura.",
    pillarScores: {
      situation: {
        score: hasBed ? 90 : 70,
        feedback: hasBed ? "Identificação de leito e motivo de admissão claros." : "Lembre-se de sempre iniciar pelo número do leito e tempo de internação."
      },
      background: {
        score: hasAllergy ? 90 : 65,
        feedback: hasAllergy ? "Histórico mórbido e status alérgico bem cobertos." : "Não se esqueça de enfatizar histórico alérgico e cirurgias prévias no Background."
      },
      assessment: {
        score: hasVitals ? 92 : 68,
        feedback: hasVitals ? "Sinais vitais e achados de exame físico foram sinalizados." : "Importante citar parâmetros vitais numéricos (PA, SatO2, FC) na Avaliação."
      },
      recommendation: {
        score: hasRecommendation ? 92 : 65,
        feedback: hasRecommendation ? "Condutas e pendências objetivas para o próximo plantão." : "Seja mais específico sobre quais exames, medicações ou drenagens estão pendentes."
      }
    },
    criticalOmissions: [
      !hasAllergy ? "Status alérgico não foi categoricamente confirmado." : null,
      !hasVitals ? "Parâmetros vitais objetivos (PA e SatO2) não foram explicitados." : null,
      "Previsão de alta ou critérios de transferência de setor não abordados."
    ].filter(Boolean),
    strengths: [
      "Boa organização mental na estruturação dos tópicos assistenciais.",
      "Linguagem profissional alinhada aos termos da enfermagem hospitalar."
    ],
    socraticQuestions: [
      `Considerando a hipótese clínica de ${caseData?.title || "descompensação"}, qual sinal de alerta exigiria intervenção imediata da equipe antes da prescrição médica?`,
      "De que forma o posicionamento no leito e a cabeceira elevada a 30°-45° impactam a saturação e a prevenção de broncoaspiração neste caso?"
    ],
    florenceComment: "Muito bem, acadêmico! Uma boa passagem de plantão é o maior escudo de segurança que você pode dar ao seu paciente na transição de cuidados."
  };
}

/**
 * Avalia a Passagem de Plantão SBAR do estudante.
 * @param {object} params
 * @param {object} params.caseData - Dados do paciente e do caso
 * @param {object} params.sbar - Objeto com { situation, background, assessment, recommendation } ou transcript completo
 * @returns {Promise<object>} Avaliação formativa socrática de Florence
 */
export async function evaluateSbarHandoff({ caseData, sbar }) {
  const sanitizedSituation = sanitizeTextForLGPD(sbar?.situation || "");
  const sanitizedBackground = sanitizeTextForLGPD(sbar?.background || "");
  const sanitizedAssessment = sanitizeTextForLGPD(sbar?.assessment || "");
  const sanitizedRecommendation = sanitizeTextForLGPD(sbar?.recommendation || "");

  const systemPrompt = `Você é a "Professora Florence", enfermeira especialista em Preceptoria Clínica, Terapia Intensiva e Segurança do Paciente.
Sua missão é realizar uma tutoria socrática formativa avaliando a passagem de plantão (metodologia SBAR) feita por um estudante de enfermagem.
Baseie-se na Meta Internacional de Segurança do Paciente nº 2 (Comunicação Efetiva) e na Resolução COFEN nº 736/2024.

Retorne ESTRITAMENTE um JSON no seguinte formato:
{
  "safetyScore": number (0 a 100, baseado no rigor da segurança do paciente),
  "grade": string ("Excelente" | "Adequado" | "Requer Atenção"),
  "summaryFeedback": string (síntese acolhedora e construtiva da tutora),
  "pillarScores": {
    "situation": { "score": number, "feedback": string },
    "background": { "score": number, "feedback": string },
    "assessment": { "score": number, "feedback": string },
    "recommendation": { "score": number, "feedback": string }
  },
  "criticalOmissions": string[] (lista de riscos ou dados que faltaram e que colocam o paciente em risco caso omitidos na vida real),
  "strengths": string[] (aspectos positivos identificados),
  "socraticQuestions": string[] (2 perguntas clínicas socráticas e reflexivas que fazem o aluno pensar na fisiopatologia e na segurança),
  "florenceComment": string (mensagem motivacional e de mentoria profissional para o estudante)
}`;

  const userPrompt = `DADOS DO PACIENTE:
Título do Caso: ${caseData?.title || "Paciente em Internação"}
Perfil: Idade ${caseData?.age || "N/A"}, Leito ${caseData?.bed || "Leito 14-B"}, Admissão: ${caseData?.admissionDiagnosis || caseData?.description || "Avaliação Clínica"}
Sinais Vitais Registrados: PA ${caseData?.vitals?.pa_sistolica || "120"}/${caseData?.vitals?.pa_diastolica || "80"} mmHg, FC ${caseData?.vitals?.fc || "80"} bpm, SatO2 ${caseData?.vitals?.sat || "96"}%, FR ${caseData?.vitals?.fr || "18"} irpm

PASSAGEM DE PLANTÃO FEITA PELO ESTUDANTE (SBAR):
- S (Situação): ${sanitizedSituation || "Não informada"}
- B (Breve Histórico): ${sanitizedBackground || "Não informado"}
- A (Avaliação Atual): ${sanitizedAssessment || "Não informada"}
- R (Recomendação): ${sanitizedRecommendation || "Não informada"}

Avalie a precisão, a segurança e a clareza da comunicação com rigor pedagógico de enfermagem.`;

  try {
    const aiResponse = await callGemini(systemPrompt, userPrompt);
    if (aiResponse && aiResponse.safetyScore !== undefined) {
      return aiResponse;
    }
  } catch (error) {
    console.error("[sbarTutorService] Erro na inferência da IA:", error);
  }

  // Fallback estruturado garantido
  return buildOfflineSbarEvaluation(caseData, {
    situation: sanitizedSituation,
    background: sanitizedBackground,
    assessment: sanitizedAssessment,
    recommendation: sanitizedRecommendation
  });
}
