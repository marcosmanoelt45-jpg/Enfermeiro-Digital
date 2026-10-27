/**
 * socraticTutorService.js
 * Motor Pedagógico do Goti IA para Estudantes de Enfermagem.
 *
 * Diretrizes Centrais:
 * 1. Não dar a resposta pronta mastigada.
 * 2. Método Socrático: Questionar, instigar correlações fisiopatológicas e apoiar o julgamento clínico.
 * 3. Scaffolding Pedagógico: Dicas progressivas em 3 níveis.
 * 4. Resolução COFEN nº 736/2024 (Processo de Enfermagem em 5 etapas) e Teoria de Wanda Horta.
 * 5. Conformidade com a LGPD: Sanitização de dados pré-inferência.
 */

import { sanitizeTextForLGPD } from "../lib/dlpSanitizer.js";

import { callResilientAI } from "./aiCoreService.js";

/**
 * Executa uma chamada à IA usando callResilientAI (chave pessoal do aluno ou Edge Function do Supabase).
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
    console.warn("[Goti IA] Falha ao invocar motor de IA resiliente:", err);
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
  studentInterventions,
  studentEvolution,
  hypothesis,
  justification,
  interventions,
  evolution
}) {
  const actualHypothesis = studentHypothesis || hypothesis || "";
  const actualJustification = studentJustification || justification || "";
  const actualInterventions = studentInterventions || interventions || "";
  const actualEvolution = studentEvolution || evolution || "";

  const cleanHypothesis = sanitizeTextForLGPD(actualHypothesis);
  const cleanJustification = sanitizeTextForLGPD(actualJustification);
  const cleanInterventions = sanitizeTextForLGPD(actualInterventions);
  const cleanEvolution = sanitizeTextForLGPD(actualEvolution);

  const systemPrompt = `Você é o Goti IA, o enfermeiro digital especialista em Raciocínio Clínico e no Processo de Enfermagem (Resolução COFEN nº 736/2024 e Teoria das Necessidades Humanas Básicas) da plataforma Enfere.

REGRAS PEDAGÓGICAS E DE PONTUAÇÃO CRITERIOSA (RESOLUÇÃO COFEN nº 736/2024):
1. O Processo de Enfermagem é composto por 5 etapas indissociáveis (Coleta, Diagnóstico, Planejamento/Metas, Implementação/Prescrição e Evolução).
2. REGRA MANDATÓRIA DE BLOQUEIO POR OMISSÃO DE ETAPAS:
   - Se o estudante NÃO preencheu cuidados, metas e evolução (etapas 3, 4 e 5 ausentes ou "(Não preenchido)"), A NOTA MÁXIMA TOTAL NÃO PODE ULTRAPASSAR 25 PONTOS (Score entre 10 e 25). É TERMINANTEMENTE PROIBIDO atribuir notas como 50%, 60% ou 65% para formulações sem plano de cuidados!
   - Se houver contradição clínica flagrante entre as evidências citadas e os sinais vitais reais do caso (ex: citar "bradipneia" quando o paciente tem FR > 20 taquipneico, ou citar "hipotensão" em paciente hipertenso), DEDUZA 10 a 15 pontos adicionais por erro iatrogênico de avaliação.
3. CRITÉRIO RIGOROSO DE NOTAS:
   - Spam, repetição de letras ou texto sem sentido: NOTA ZERO (0 a 10).
   - Somente Diagnóstico e Evidências preenchidas, mas sem intervenções/metas: NOTA ENTRE 15 e 25 (Reprovado por Processo Incompleto).
   - Diagnóstico correto com intervenções vagas sem aprazamento de horário ou metas: NOTA ENTRE 40 e 55.
   - Diagnóstico correto, evidências coerentes e prescrições com aprazamento de horários: NOTA ENTRE 75 e 89.
   - Excelência de padrão ouro em todas as 5 etapas com evolução e metas NOC quantificadas: NOTA ENTRE 90 e 100.
4. Explique no campo "reasoningAnalysis" com total transparência o motivo da pontuação, detalhando a falta de intervenções e eventuais contradições encontradas.

Retorne EXCLUSIVAMENTE um JSON válido com esta estrutura:
{
  "score": number (0 a 100, calibrado rigorosamente conforme os critérios acima),
  "feedbackTitle": string (título formativo acolhedor),
  "reasoningAnalysis": string (análise detalhada do julgamento clínico explicando com transparência por que a nota foi atribuída e quais pontos foram deduzidos),
  "reflectiveQuestion": string (pergunta socrática principal instigando a reflexão profunda do aluno),
  "pointsToConsider": string[] (2 a 3 pontos práticos essenciais para a assistência segura),
  "strengths": string[] (aspectos positivos identificados),
  "gaps": string[] (lacunas, dados clínicos ou sinais vitais omitidos),
  "socraticQuestions": string[] (perguntas socráticas instigando fisiopatologia e segurança),
  "pedagogicalHint": string (pista orientadora sem entregar a resposta completa),
  "cofenStepFocus": string (etapa da Resolução COFEN 736/2024 que requer atenção)
}`;

  const userPrompt = `DADOS DO CASO SIMULADO:
Título: ${caseData.title}
Histórico Sintético: ${caseData.patient?.medical_history || caseData.patient?.previous_anamnesis || caseData.summary}
Sinais Vitais: PA ${caseData.vitals?.pa_sistolica}/${caseData.vitals?.pa_diastolica} mmHg | FC ${caseData.vitals?.fc} bpm | FR ${caseData.vitals?.fr} irpm | Tax ${caseData.vitals?.tax} °C | SatO2 ${caseData.vitals?.sat}%
Escalas: Braden ${caseData.braden ? 'calculado' : 'N/A'}, Dor ${caseData.caloi?.pain_intensity || 0}/10

RESPOSTA SUBMETIDA PELO ESTUDANTE:
- Hipótese Diagnóstica NANDA-I/CIPE: ${cleanHypothesis || "(Não preenchido)"}
- Justificativa, Etiologia e Evidências: ${cleanJustification || "(Não preenchido)"}
- Cuidados e Metas Sugeridos: ${cleanInterventions || "(Não preenchido)"}
- Evolução de Enfermagem: ${cleanEvolution || "(Não preenchido)"}

Avalie criteriosamente o raciocínio clínico. Se o texto for genérico ou vago, deduza pontos e explique o motivo.`;

  const aiResult = await callGemini(systemPrompt, userPrompt);
  if (aiResult && (aiResult.score !== undefined || aiResult.reasoningAnalysis)) {
    const finalScore = typeof aiResult.score === 'number' ? Math.max(0, Math.min(100, Math.round(aiResult.score))) : 70;
    const reasoningAnalysis = aiResult.reasoningAnalysis ||
      `Você formulou a hipótese diagnóstica "${cleanHypothesis}". ${aiResult.feedbackTitle || ''} ${aiResult.strengths?.join(' ') || ''} ${aiResult.gaps?.length ? 'Lacunas observadas: ' + aiResult.gaps.join(' ') : ''}`;

    return {
      score: finalScore,
      overallScore: finalScore,
      feedbackTitle: aiResult.feedbackTitle || "Análise do Julgamento Clínico",
      reasoningAnalysis: reasoningAnalysis.trim(),
      reflectiveQuestion: aiResult.reflectiveQuestion || aiResult.socraticQuestions?.[0] || "Como os sinais vitais alterados sustentam ou descartam essa hipótese?",
      pointsToConsider: aiResult.pointsToConsider || aiResult.gaps || ["Priorizar a estabilização ventilatória e hemodinâmica", "Monitorizar a resposta terapêutica em intervalos regulares"],
      strengths: aiResult.strengths || ["Iniciou o raciocínio diagnóstico baseado em dados do paciente."],
      gaps: aiResult.gaps || ["Aprofundar a correlação fisiopatológica com os sinais vitais."],
      socraticQuestions: aiResult.socraticQuestions || [aiResult.reflectiveQuestion || "Qual complicação aguda deve ser prevenida?"],
      pedagogicalHint: aiResult.pedagogicalHint || "Consulte as taxonomias NANDA-I e NIC/NOC para refinar as intervenções.",
      cofenStepFocus: aiResult.cofenStepFocus || "Etapa 2 - Diagnóstico de Enfermagem"
    };
  }

  // Motor Pedagógico Heurístico de Fallback (offline / sem chave configurada)
  return generateHeuristicFeedback(caseData, cleanHypothesis, cleanJustification, cleanInterventions);
}

/**
 * Fornece dicas progressivas (Scaffolding em 3 níveis) para o estudante.
 * @param {object} caseData
 * @param {number} level - 1 (pergunta guia), 2 (pista fisiopatológica), 3 (fundamentação conceitual)
 */
export async function getScaffoldingHint(caseData, level = 1) {
  const systemPrompt = `Você é o Goti IA, enfermeiro digital da plataforma Enfere. O estudante está analisando um caso simulado e pediu uma Dica Pedagógica de Nível ${level}.

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

  const systemPrompt = `Você é o Goti IA ensinando Cálculo de Medicamentos e Gotejamento em Enfermagem na plataforma Enfere.
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
 * Normaliza string removendo acentuação e caracteres especiais para tolerar variações ortográficas.
 */
function normalizeText(str = "") {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function isGibberish(text) {
  if (!text || typeof text !== "string") return false;
  const clean = text.trim().toLowerCase();
  if (clean.length < 3) return false;
  // Repetição contínua da mesma letra/número 4 ou mais vezes (ex: aaaa, zzzz, 9999)
  if (/([a-z0-9])\1{3,}/i.test(clean)) return true;
  // Sequência com menos de 4 caracteres únicos diferentes (ex: asdasdasd, abababab, qwqwqw)
  const lettersOnly = clean.replace(/[^a-z0-9]/g, "");
  if (lettersOnly.length >= 8) {
    const uniqueCount = new Set(lettersOnly).size;
    if (uniqueCount <= 3) return true;
  }
  return false;
}

/**
 * Fallback heurístico inteligente e criterioso para avaliação de raciocínio clínico.
 * Avalia a qualidade real por eixos de pontuação, tolerando erros menores de digitação e acentuação.
 */
function generateHeuristicFeedback(caseData, hypothesis, justification, interventions = "") {
  const normHypothesis = normalizeText(hypothesis);
  const normJustification = normalizeText(justification);
  const normInterventions = normalizeText(interventions);
  const totalLength = normHypothesis.length + normJustification.length + normInterventions.length;

  // 1. Caso de Spam, Gibberish ou Letras Repetidas (ex: "aaaaaaaaaaa")
  if (isGibberish(hypothesis) || isGibberish(justification) || isGibberish(interventions)) {
    return {
      score: 0,
      overallScore: 0,
      feedbackTitle: "Formulação Inválida / Conteúdo Sem Sentido Clínico",
      reasoningAnalysis: "A formulação enviada contém repetição de caracteres, termos desconexos ou ausência de embasamento técnico em enfermagem. Para obter parecer positivo do Goti, formule diagnósticos e prescrições com termos clínicos padronizados.",
      reflectiveQuestion: "Qual é o problema prioritário do paciente e qual conduta imediata você tomaria para garantir sua segurança?",
      pointsToConsider: [
        "Utilizar termos padronizados da taxonomia NANDA-I / CIPE",
        "Prescrever ações assistenciais claras com aprazamento de horário"
      ],
      strengths: [],
      gaps: [
        "A resposta enviada não continha vocabulário clínico compreensível.",
        "Não foram descritas intervenções assistenciais válidas."
      ],
      socraticQuestions: [
        "Quais sinais vitais do paciente justificam intervenção imediata?",
        "Qual conduta de enfermagem previne piora do quadro clínico?"
      ],
      pedagogicalHint: "Dúvidas sobre termos? Use as opções sugeridas pelo Goti ou tire dúvidas pelo chat!",
      cofenStepFocus: "Etapa 2 e 3 - Diagnóstico e Prescrição de Enfermagem (COFEN nº 736/2024)"
    };
  }

  // 2. Caso de resposta vazia ou extremamente curta
  if (totalLength < 15) {
    return {
      score: 15,
      overallScore: 15,
      feedbackTitle: "Formulação Insuficiente para Avaliação",
      reasoningAnalysis: "A formulação enviada foi muito breve ou incompleta (15/100 pontos). Para o exercício ter validade e ser aprovado pelo Goti, descreva o título do diagnóstico e correlacione os sinais vitais alterados do paciente.",
      reflectiveQuestion: "Quais são os sinais vitais alterados que você identificou neste caso?",
      pointsToConsider: [
        "Identificar o sinal vital com maior desvio da normalidade",
        "Formular o diagnóstico conforme a resposta humana do paciente"
      ],
      strengths: ["Iniciou a tela de resolução de casos clínicos."],
      gaps: [
        "Hipótese diagnóstica não fundamentada.",
        "Não indicou os parâmetros fisiopatológicos observados."
      ],
      socraticQuestions: [
        "Qual é a queixa principal e o diagnóstico médico de base deste paciente?",
        "Qual necessidade humana básica está prioritariamente afetada?"
      ],
      pedagogicalHint: "Dúvidas sobre como estruturar? Fale com o Goti para ver um exemplo metodológico modelo!",
      cofenStepFocus: "Etapa 2 - Diagnóstico de Enfermagem (COFEN nº 736/2024)"
    };
  }

  let score = 0;
  const strengths = [];
  const gaps = [];
  const scoreBreakdown = [];

  // EIXO 1: Diagnóstico / Taxonomia NANDA-I (Etapa 2 - até 25 pontos)
  const isGenericHypothesis = normHypothesis.length < 8 || ["dor", "doente", "ruim", "mal", "cuidar", "paciente"].includes(normHypothesis);
  const hasTaxonomyKeywords = /risco|padrao|troca|gas|integridade|pele|perfusao|volume|liquido|glicemia|infeccao|mobilidade|ansiedade|ventilac|respirat|desobstru|choque|dor/i.test(normHypothesis);

  if (hasTaxonomyKeywords || normHypothesis.length >= 15) {
    score += 25;
    scoreBreakdown.push("Diagnóstico clínico bem delineado (+25 pts)");
    strengths.push("Formulou uma hipótese diagnóstica coerente e contextualizada.");
  } else if (!isGenericHypothesis && normHypothesis.length >= 8) {
    score += 15;
    scoreBreakdown.push("Diagnóstico parcialmente estruturado (+15 pts)");
    strengths.push("Identificou a área clínica prioritária.");
    gaps.push("Refine o título diagnóstico utilizando termos padronizados (ex: NANDA-I ou CIPE).");
  } else {
    score += 5;
    scoreBreakdown.push("Diagnóstico genérico ou vago (+5 pts)");
    gaps.push("O diagnóstico proposto foi excessivamente vago.");
  }

  // EIXO 2: Justificativa & Evidências Clínicas (Etapa 2 - até 25 pontos)
  const hasVitalsPa = /press[aã]o|pa|\d{2,3}\s*\/\s*\d{2,3}|normotens|hipertens/i.test(justification);
  const hasVitalsSat = /sat|satura[cç][aã]o|oxigen|spo2|hipox/i.test(justification);
  const hasVitalsFc = /fc|frequ[eê]ncia|bpm|card[ií]ac|pulso|taquicard/i.test(justification);
  const hasExamFinding = /dor|ausculta|estertor|sibilo|edema|curativo|dreno|lesao|febre|sudorese/i.test(justification);

  const vitalsMatches = [hasVitalsPa, hasVitalsSat, hasVitalsFc, hasExamFinding].filter(Boolean).length;

  if (vitalsMatches >= 3) {
    score += 25;
    scoreBreakdown.push("Fundamentação robusta com múltiplos sinais vitais (+25 pts)");
    strengths.push("Correlacionou o raciocínio com diversos dados objetivos do exame físico.");
  } else if (vitalsMatches >= 1) {
    score += 15;
    scoreBreakdown.push("Fundamentação parcial de sinais vitais (+15 pts)");
    strengths.push("Mencionou parâmetros vitais do caso na justificativa.");
    gaps.push("Aprofunde a correlação citando outros sinais vitais alterados (ex: PA, SatO2, FC).");
  } else if (normJustification.length > 25) {
    score += 8;
    scoreBreakdown.push("Argumentação descritiva sem dados numéricos (+8 pts)");
    gaps.push("A justificativa não citou parâmetros numéricos objetivos dos sinais vitais.");
  } else {
    scoreBreakdown.push("Justificativa e evidências ausentes (0 pts)");
    gaps.push("Faltou fundamentar a etiologia e as características definidoras observadas.");
  }

  // EIXO 3: Prescrição de Cuidados NIC & Metas NOC (Etapas 3 e 4 - até 50 pontos)
  const hasTiming = /h|hora|\d{1,2}:\d{2}|de \d+ em \d+|minuto|aprazamento|plantao|turno/i.test(interventions);
  const hasSpecificAction = /administrar|oxigenio|posicion|decurbito|grade|balanco|glicemia|curativo|monitor|ausculta|aspirar/i.test(interventions);

  if (hasTiming && hasSpecificAction && normInterventions.length >= 35) {
    score += 50;
    scoreBreakdown.push("Intervenções completas com aprazamento de horário e condutas seguras (+50 pts)");
    strengths.push("Prescreveu intervenções de enfermagem com aprazamento e foco preventivo.");
  } else if (hasSpecificAction || normInterventions.length >= 20) {
    score += 25;
    scoreBreakdown.push("Intervenções identificadas porém sem aprazamento de horários (+25 pts)");
    strengths.push("Definiu ações assistenciais voltadas ao problema principal.");
    gaps.push("Defina o aprazamento das condutas (ex: monitorar de 2 em 2 horas, checar saturação a cada 30 min).");
  } else {
    scoreBreakdown.push("Processo de Enfermagem Incompleto: Prescrição de cuidados ausente (0 pts)");
    gaps.push("Omissão grave: o estudante não prescreveu cuidados (NIC) nem estabeleceu metas terapêuticas (NOC).");
  }

  // TRAVA MANDATÓRIA COFEN nº 736/2024: Se não preencheu prescrição/intervenções, nota MÁXIMA é 25%
  const hasNoInterventions = normInterventions.length < 15;
  if (hasNoInterventions) {
    score = Math.min(score, 25);
    scoreBreakdown.push("Trava COFEN 736/2024: Caso sem prescrição de cuidados não pode ultrapassar 25% da nota global.");
  }

  // DETECÇÃO DE CONTRADIÇÕES CLÍNICAS GRAVES (Penalização rigorosa)
  const caseFr = caseData.vitals?.fr || 0;
  if (caseFr > 20 && /bradipneia|fr\s*<\s*1[02]/i.test(justification)) {
    score = Math.max(5, score - 15);
    scoreBreakdown.push("Contradição clínica grave: citou bradipneia para paciente com taquipneia de " + caseFr + " irpm (-15 pts)");
    gaps.push("Atenção crítica: você selecionou 'bradipneia', mas o paciente apresenta taquipneia real.");
  }

  const casePa = caseData.vitals?.pa_sistolica || 0;
  if (casePa >= 140 && /hipotens[aã]o|choque hipovol/i.test(justification)) {
    score = Math.max(5, score - 10);
    scoreBreakdown.push("Contradição clínica: citou hipotensão para paciente com PAS elevada de " + casePa + " mmHg (-10 pts)");
    gaps.push("Incoerência pressórica: o paciente está hipertenso, e não hipotenso.");
  }

  const finalScore = Math.max(5, Math.min(100, score));
  const reasoningAnalysis = `Sua pontuação foi de ${finalScore}/100 baseada na auditoria do Goti:\n• ${scoreBreakdown.join("\n• ")}\n\n${
    finalScore >= 80
      ? "Excelente julgamento clínico! Você demonstrou sólida capacidade de correlação fisiopatológica e completude nas 5 etapas do Processo de Enfermagem."
      : finalScore >= 50
      ? "Bom início de raciocínio, mas há pontos cegos assistenciais ou falta de aprazamento de condutas."
      : "Atenção: A formulação foi insuficiente, incompleta ou apresentou contradições clínicas graves perante o exame físico."
  }`;

  return {
    score: finalScore,
    overallScore: finalScore,
    feedbackTitle: finalScore >= 80 ? "Julgamento Clínico Assertivo" : finalScore >= 50 ? "Julgamento Clínico em Desenvolvimento" : "Processo de Enfermagem Incompleto / Risco Assistencial",
    reasoningAnalysis,
    reflectiveQuestion: `Considerando o diagnóstico de "${hypothesis || 'enfermagem'}" e a fisiopatologia deste caso, qual intervenção privativa imediata previne descompensação nas próximas horas?`,
    pointsToConsider: [
      "Verificar sinais vitais em intervalos rigorosos conforme o risco clínico",
      "Garantir a implementação das metas com prazos bem definidos de reavaliação",
      ...(gaps.length ? gaps : ["Reavaliar a resposta terapêutica do paciente após o cuidado"])
    ],
    strengths: strengths.length > 0 ? strengths : ["Iniciou a formulação de hipótese diagnóstica para o caso."],
    gaps: gaps.length > 0 ? gaps : ["Continue refinando a priorização dos cuidados de acordo com a gravidade."],
    socraticQuestions: [
      "Qual necessidade humana básica (conforme Wanda Horta) está prioritariamente em risco no momento atual?",
      "Se a equipe não intervir nas próximas 2 horas sobre esse achado clínico, qual é a complicação fisiopatológica esperada?"
    ],
    pedagogicalHint: "Lembre-se de seguir as etapas da Resolução COFEN nº 736/2024: Avaliação -> Diagnóstico -> Planejamento -> Implementação -> Evolução.",
    cofenStepFocus: "Etapa 2 - Diagnóstico de Enfermagem fundamentado em evidências"
  };
}
