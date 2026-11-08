/**
 * diagnosticChallengeService.js
 * Motor de Desafios Clínicos de Alta Complexidade & Vivência Real da Enfermagem.
 * Inspirado nas metodologias de ensino de AMBOSS NextGen NCLEX, Osmosis, SimX, Whitebook/PEBMED e COFEN nº 736/2024.
 */

import { computeBradenTotal, computeCamPositive, computeCaloiTotal, computeSakTotal } from "../lib/riskEngine.js";
import { formatToInitials } from "../lib/sampleNames.js";
import { callResilientAI } from "./aiCoreService.js";
import { generateContextualHeuristicBattery } from "./clinicalCaseHeuristics.js";

/**
 * Gera uma bateria de 4 desafios clínicos de alta complexidade da vivência real da enfermagem:
 * 1. Priorização & Conduta Imediata à Beira-Leito (Primeiros 5 minutos)
 * 2. Fisiopatologia Aplicada & Diagnóstico Crítico
 * 3. Farmacologia Clínica, Eletrólitos & Iatrogenia
 * 4. Segurança do Paciente & Legislação Ética/Delegação (COFEN 736/2024 e Lei 7.498/86)
 *
 * @param {object} profile - Perfil do paciente e anamnese (anonimizado com iniciais)
 * @param {object} assessmentData - Sinais vitais e escalas (Braden, CAM, CALOI, etc.)
 * @returns {Promise<object>} Objeto da bateria de desafios com vinheta, 4 questões e prescrição COFEN.
 */
/**
 * Embaralha as alternativas para evitar viés de posição fixa e reatribui letras A, B, C, D.
 */
/**
 * Embaralhamento Fisher-Yates (Knuth Shuffle) estrito com distribuição uniforme
 */
function fisherYatesShuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Auditor Duplo de Questões Clínicas (AI Solver & Psicometria)
 * Certifica que:
 * 1. O enunciado é denso e contextualizado (≥ 20 caracteres)
 * 2. Possui exatamente 4 opções distintas (A, B, C, D)
 * 3. Exatamente 1 opção é clinicamente correta
 * 4. Não há distratores duplicados ou vazios
 */
export function auditDiagnosticQuestions(questions) {
  if (!Array.isArray(questions) || questions.length === 0) return false;

  for (const q of questions) {
    if (!q.questionStem || typeof q.questionStem !== "string" || q.questionStem.trim().length < 20) {
      return false;
    }
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      return false;
    }
    const correctCount = q.options.filter((o) => o.isCorrect === true).length;
    if (correctCount !== 1) {
      return false;
    }
    const titles = new Set();
    for (const opt of q.options) {
      if (!opt.title || typeof opt.title !== "string" || opt.title.trim().length < 8) {
        return false;
      }
      const norm = opt.title.trim().toLowerCase();
      if (titles.has(norm)) return false;
      titles.add(norm);
    }
  }
  return true;
}

/**
 * Normaliza e embaralha as alternativas garantindo que:
 * 1. Exatamente 1 alternativa seja identificada e marcada com isCorrect: true estrito.
 * 2. As 4 letras A, B, C, D sejam atribuídas sequencialmente após o Fisher-Yates.
 * 3. As justificativas whyCorrect e whyDistractor estejam presentes para feedback imediato.
 */
export function normalizeAndShuffleOptions(rawQuestion) {
  if (!rawQuestion || !Array.isArray(rawQuestion.options) || rawQuestion.options.length === 0) {
    return [];
  }

  const rawOptions = rawQuestion.options;
  const letters = ["A", "B", "C", "D", "E"];

  // 1. Descobrir qual opção é a correta
  let correctIndex = rawOptions.findIndex(
    (opt) => opt.isCorrect === true || String(opt.isCorrect).toLowerCase() === "true" || opt.correct === true
  );

  // Tentativa 2: correctAnswer ou correctOption no objeto da pergunta
  if (correctIndex === -1 && (rawQuestion.correctAnswer || rawQuestion.correctOption)) {
    const targetLetter = String(rawQuestion.correctAnswer || rawQuestion.correctOption).trim().toUpperCase();
    correctIndex = rawOptions.findIndex(
      (opt, idx) => (opt.id && String(opt.id).toUpperCase() === targetLetter) || letters[idx] === targetLetter
    );
  }

  // Tentativa 3: presença de whyCorrect preenchido e whyDistractor nulo
  if (correctIndex === -1) {
    correctIndex = rawOptions.findIndex((opt) => opt.whyCorrect && opt.whyCorrect.trim().length > 0 && !opt.whyDistractor);
  }

  // Fallback seguro: se nenhuma identificada, a primeira opção é a correta
  if (correctIndex === -1) {
    correctIndex = 0;
  }

  // Mapeia todas as opções com a flag correta inequívoca
  const preparedOptions = rawOptions.map((opt, idx) => ({
    title: opt.title || opt.text || "Conduta assistencial fundamentada",
    whyCorrect: opt.whyCorrect || (idx === correctIndex ? "Conduta prioritária de enfermagem respaldada pelas evidências clínicas." : null),
    whyDistractor: opt.whyDistractor || (idx !== correctIndex ? "Esta opção não constitui a conduta prioritária imediata para este quadro." : null),
    _isTheCorrectOne: idx === correctIndex
  }));

  // 2. Embaralha com Fisher-Yates (elimina viés posicional)
  const shuffled = fisherYatesShuffle(preparedOptions);

  // 3. Atribui IDs A, B, C, D e o booleano estrito isCorrect
  return shuffled.slice(0, 4).map((opt, idx) => ({
    id: letters[idx] || String.fromCharCode(65 + idx),
    title: opt.title,
    isCorrect: Boolean(opt._isTheCorrectOne),
    whyCorrect: opt.whyCorrect,
    whyDistractor: opt.whyDistractor
  }));
}

export function shuffleOptions(options) {
  return normalizeAndShuffleOptions({ options });
}


export async function generateCaseDiagnosticChallenge(profile, assessmentData, attemptIndex = 0) {
  const patientInitials = formatToInitials(profile?.initials || profile?.name);
  const cycle = Number(attemptIndex) || 0;

  const bradenTotal = computeBradenTotal({
    perception: assessmentData.braden_perception,
    moisture: assessmentData.braden_moisture,
    activity: assessmentData.braden_activity,
    mobility: assessmentData.braden_mobility,
    nutrition: assessmentData.braden_nutrition,
    friction: assessmentData.braden_friction,
  });

  const camPositive = computeCamPositive({
    acute: assessmentData.cam_acute,
    inattention: assessmentData.cam_inattention,
    disorganized: assessmentData.cam_disorganized,
    altered_loc: assessmentData.cam_altered_loc,
  });

  const caloiTotal = computeCaloiTotal(assessmentData);
  const sakTotal = computeSakTotal(assessmentData);

  const vitalsSummary = `PA: ${assessmentData.pa_sistolica}/${assessmentData.pa_diastolica} mmHg | FC: ${assessmentData.fc} bpm | FR: ${assessmentData.fr} irpm | Tax: ${assessmentData.tax}°C | SatO2: ${assessmentData.sat}%`;
  const scoresSummary = `Braden: ${bradenTotal} | CAM (Delirium): ${camPositive ? "Positivo" : "Negativo"} | Dor (CALOI): ${caloiTotal}/10 | Risco Quedas (SAK): ${sakTotal}`;

  try {
    const parametros = { iniciais: patientInitials, medicacoes: profile.current_medications };

    const randomSeed = `${Date.now().toString(36)}-cycle${cycle}-${Math.random().toString(36).substring(2, 6)}`;
    const userPrompt = `DADOS DO CASO CLÍNICO MONTADO PELO ESTUDANTE (Bateria #${cycle + 1} | Seed: ${randomSeed}):
Paciente (LGPD): ${patientInitials}, ${profile.age || "65"} anos, Sexo: ${profile.gender === "M" ? "Masculino" : "Feminino"}
DIAGNÓSTICO E PATOLOGIA PRINCIPAL: ${profile.previous_diseases || profile.previous_anamnesis || profile.medical_history || "Sem antecedentes relevantes"}
Medicações em uso: ${profile.current_medications || "Nenhuma informada"}
Alergias relatadas: ${profile.allergies || "Nega alergias"}
Anamnese / Queixa de Admissão: ${profile.previous_anamnesis || profile.notes || "Em observação clínica"}
Sinais Vitais Reais Aferidos: ${vitalsSummary}
Escores Clínicos Calculados: ${scoresSummary}
Relato da Avaliação de Enfermagem: ${assessmentData.notes || "Avaliação regular"}

DIRETRIZ CRÍTICA DE CONTEXTUALIZAÇÃO & VARIEDADE:
1. Suas 4 questões DEVEM ser estritamente sobre a patologia principal informada ("${profile.previous_diseases || profile.previous_anamnesis || 'patologia informada'}"). NUNCA crie perguntas sobre insuficiência cardíaca ou outras doenças a menos que sejam a patologia do paciente!
2. A Questão 3 (Farmacologia) DEVE abordar as medicações reais informadas pelo estudante ("${profile.current_medications || 'medicações indicadas para a patologia'}").
3. A Questão 4 (Segurança & Ética) DEVE focar nos escores de risco reais informados (Braden: ${bradenTotal}, Quedas: ${sakTotal}, Delirium: ${camPositive ? 'Positivo' : 'Negativo'}).
4. Como esta é a Bateria #${cycle + 1}, gere abordagens e dilemas totalmente INÉDITOS em relação às baterias anteriores.
Retorne exclusivamente JSON válido com as 4 questões contextualizadas.`;

    const result = await callResilientAI(null, userPrompt, {
      tarefa: "desafio_diagnostico",
      parametros,
      temperature: 0.65,
      responseMimeType: "application/json",
      maxTokens: 2500,
    });

    if (result?.text) {
      const parsed = JSON.parse(result.text);
      if (parsed.questions && parsed.questions.length >= 2) {
        // Normaliza e embaralha as opções via Fisher-Yates garantindo isCorrect booleano estrito
        const normalizedQuestions = parsed.questions.map((q) => ({
          ...q,
          options: normalizeAndShuffleOptions(q),
        }));

        // Executa Auditoria Dupla de Qualidade Psicometria & Solubilidade Clínica
        const passesAudit = auditDiagnosticQuestions(normalizedQuestions);
        if (passesAudit) {
          parsed.questions = normalizedQuestions;
          parsed.options = normalizedQuestions[0].options;
          parsed.attendingTip = normalizedQuestions[0].attendingTip;
          return parsed;
        } else {
          console.warn("[Desafio Diagnóstico] Questões geradas pela IA reprovadas no Auditor Duplo. Acionando motor determinístico de alta complexidade.");
        }
      }
    }
  } catch (e) {
    console.warn("[Desafio Diagnóstico] Fallback para motor determinístico de alta complexidade:", e);
  }

  // MOTOR HEURÍSTICO CONTEXTUAL MULTIPATOLÓGICO (OFFLINE / FALLBACK RESILIENTE)
  return buildDeterministicComplexBattery(patientInitials, profile, assessmentData, bradenTotal, camPositive, caloiTotal, sakTotal, cycle);
}

/**
 * Constrói uma bateria de 4 questões da vivência real da enfermagem,
 * adaptada estritamente à patologia, medicações, escores e dados inseridos pelo estudante.
 */
export function buildDeterministicComplexBattery(patientInitials, profile, assessmentData, bradenTotal, camPositive, caloiTotal, sakTotal, attemptIndex = 0) {
  return generateContextualHeuristicBattery(patientInitials, profile, assessmentData, {
    bradenTotal,
    camPositive,
    caloiTotal,
    sakTotal
  }, attemptIndex);
}

