/**
 * diagnosticChallengeService.js
 * Motor de Desafio Diagnóstico Lúdico e Interativo com Análise de Distratores.
 * Inspirado nas metodologias de ensino de AMBOSS, Osmosis, SimX e no Processo de Enfermagem (COFEN nº 736/2024).
 */

import { computeGlobalRisk, computeBradenTotal, computeCamPositive, computeCaloiTotal, computeSakTotal } from "@/lib/riskEngine";
import { sanitizeClinicalDataForAI } from "./aiService";

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
 * Gera um desafio de julgamento diagnóstico baseado no caso clínico montado pelo estudante.
 * @param {object} profile - Perfil do paciente e anamnese
 * @param {object} assessmentData - Sinais vitais e escalas (Braden, CAM, CALOI, etc.)
 * @returns {Promise<object>} Objeto do desafio com pergunta, dica orientadora, 4 opções e análise de distratores.
 */
export async function generateCaseDiagnosticChallenge(profile, assessmentData) {
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

  const apiKey = getGeminiApiKey();

  if (apiKey) {
    try {
      const systemPrompt = `Você é um Preceptor e Docente Sênior de Enfermagem especialista em Raciocínio Clínico (AMBOSS Qbank / Osmosis / SimX) e no Processo de Enfermagem (Resolução COFEN nº 736/2024).
Sua missão: Você NÃO deve dar o diagnóstico pronto de bandeja. Você deve criar um DESAFIO DIAGNÓSTICO LÚDICO DE MÚLTIPLA ESCOLHA para o estudante resolver, com 4 alternativas e análise detalhada de distratores.

Formato OBRIGATÓRIO de retorno: JSON estrito com esta estrutura:
{
  "questionTitle": "Título curto do desafio clínico",
  "clinicalVignette": "Breve vinheta resumindo o paciente e os sinais de alarme",
  "attendingTip": "Dica socrática orientadora (estilo AMBOSS Attending Tip) que instiga o olhar sem entregar a resposta",
  "options": [
    {
      "id": "A",
      "title": "Título do Diagnóstico de Enfermagem (com fator relacionado e evidência)",
      "isCorrect": true,
      "whyCorrect": "Explicação fisiopatológica profunda correlacionando diretamente com os valores reais inseridos pelo aluno (Braden, PA, SatO2, etc.)",
      "whyDistractor": null
    },
    {
      "id": "B",
      "title": "Título de um Diagnóstico Secundário ou Armadilha Comum",
      "isCorrect": false,
      "whyCorrect": null,
      "whyDistractor": "Explicação clínica de por que este diagnóstico é um distrator (ex: armadilha comum de confundir sintoma isolado com a resposta prioritária)"
    },
    {
      "id": "C",
      "title": "Título de outro Diagnóstico Alternativo Plausível",
      "isCorrect": false,
      "whyCorrect": null,
      "whyDistractor": "Explicação detalhada do porquê esta opção não é prioritária neste momento"
    },
    {
      "id": "D",
      "title": "Título de outro Diagnóstico Falso ou Não Sustentado",
      "isCorrect": false,
      "whyCorrect": null,
      "whyDistractor": "Explicação de por que as evidências do caso não sustentam esta hipótese"
    }
  ],
  "recommendedInterventions": [
    "Cuidados prioritários prescritos de enfermagem com aprazamento de horários (COFEN 736/2024)"
  ]
}`;

      const userPrompt = `DADOS DO CASO CLÍNICO MONTADO PELO ESTUDANTE:
Paciente: ${profile.name || "Paciente"}, ${profile.age || "60"} anos, Sexo: ${profile.gender === "M" ? "Masculino" : "Feminino"}
Histórico & Antecedentes: ${profile.previous_diseases || profile.medical_history || "Sem antecedentes relevantes"}
Medicações: ${profile.current_medications || "Nenhuma"}
Alergias: ${profile.allergies || "Nega"}
Anamnese / Admissão: ${profile.previous_anamnesis || profile.notes || "Em observação clínica"}
Sinais Vitais: ${vitalsSummary}
Escores Clínicos: ${scoresSummary}
Relato da Avaliação: ${assessmentData.notes || "Avaliação regular"}

Crie o Desafio Diagnóstico interativo com 1 opção prioritária correta e 3 distratores inteligentes. Retorne apenas JSON.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n---\n\n${userPrompt}` }] }],
            generationConfig: { temperature: 0.3, responseMimeType: "application/json" }
          })
        }
      );

      if (response.ok) {
        const json = await response.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          if (parsed.options?.length >= 4) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn("[Desafio Diagnóstico] Fallback para motor offline:", e);
    }
  }

  // MOTOR DETERMINÍSTICO OFFLINE DE ALTA FIDELIDADE (Garante funcionamento 100% sem falhas)
  return buildDeterministicChallenge(profile, assessmentData, bradenTotal, camPositive, caloiTotal, sakTotal);
}

/**
 * Gera um desafio clínico determinístico baseado nas regras clínicas dos escores.
 */
function buildDeterministicChallenge(profile, assessmentData, bradenTotal, camPositive, caloiTotal, sakTotal) {
  // Identifica a prioridade com base nos escores clínicos reais
  const isHypoxemic = assessmentData.sat < 92 || assessmentData.fr > 22;
  const isHypertensiveOrCardio = assessmentData.pa_sistolica >= 140 || assessmentData.fc > 100;
  const isHighSkinRisk = bradenTotal <= 14;
  const hasDelirium = camPositive;
  const hasSeverePain = caloiTotal >= 7;

  let correctId = "A";
  let title = "Desafio de Julgamento Diagnóstico";
  let vignette = `Paciente ${profile.name || "A. B."}, ${profile.age || 65} anos. PA ${assessmentData.pa_sistolica}/${assessmentData.pa_diastolica} mmHg, FC ${assessmentData.fc} bpm, FR ${assessmentData.fr} irpm, SatO2 ${assessmentData.sat}%. Braden: ${bradenTotal}.`;
  let tip = "Analise qual alteração clínica representa risco iminente de deterioração funcional ou ameaça imediata à integridade orgânica.";

  let options = [];
  let interventions = [];

  if (isHypoxemic) {
    title = "Prioridade Ventilatória & Troca Gasosa";
    tip = "Observe a correlação entre a frequência respiratória elevada e a oximetria de pulso no ar ambiente.";
    options = [
      {
        id: "A",
        title: "Padrão respiratório ineficaz relacionado à fadiga da musculatura ventilatória evidenciado por taquipneia e saturação subótima",
        isCorrect: true,
        whyCorrect: `Correto! O paciente apresenta FR de ${assessmentData.fr} irpm e SatO2 de ${assessmentData.sat}%, configurando resposta ventilatória de alta prioridade segundo a Hierarquia de Necessidades Humanas Básicas.`,
        whyDistractor: null
      },
      {
        id: "B",
        title: "Ansiedade relacionada à internação hospitalar evidenciada por taquicardia",
        isCorrect: false,
        whyCorrect: null,
        whyDistractor: "Armadilha Comum: Embora a taquicardia possa acompanhar a ansiedade, atribuir sintomas hipoxêmicos primariamente à ansiedade atrasa o suporte ventilatório imediato."
      },
      {
        id: "C",
        title: "Risco de infecção relacionado à quebra da barreira cutânea",
        isCorrect: false,
        whyCorrect: null,
        whyDistractor: "Distrator Secundário: O risco de infecção é uma preocupação contínua, mas não representa a prioridade imediata frente à hipóxia/taquipneia aguda."
      },
      {
        id: "D",
        title: "Intolerância à atividade relacionada ao desbalanço entre oferta e demanda de oxigênio",
        isCorrect: false,
        whyCorrect: null,
        whyDistractor: "Diagnóstico Secundário: A intolerância à atividade é uma consequência do padrão respiratório ineficaz, e não o diagnóstico primário a ser estabilizado primeiro."
      }
    ];
    interventions = [
      "Elevar cabeceira do leito a 45° (Posição de Fowler) imediatamente;",
      "Instalar oxigenoterapia sob cânula nasal a 2 L/min conforme protocolo e monitorar SatO2 contínua;",
      "Aferir sinais vitais com ênfase no padrão ventilatório a cada 1 hora até estabilização."
    ];
  } else if (isHighSkinRisk) {
    title = "Integridade Tissular & Prevenção de Lesão por Pressão";
    tip = "O escore da Escala de Braden é o preditor central para antecipar a quebra do estrato córneo antes que ela se instale.";
    options = [
      {
        id: "A",
        title: "Risco de lesão por pressão relacionado à mobilidade física prejudicada e escore de Braden crítico",
        isCorrect: true,
        whyCorrect: `Correto! O escore de Braden de ${bradenTotal} estratifica o paciente em alto risco. Na enfermagem, o diagnóstico de risco antecipa o dano irreversível e é a prioridade assistencial na admissão.`,
        whyDistractor: null
      },
      {
        id: "B",
        title: "Déficit no autocuidado para banho relacionado ao desconforto articular",
        isCorrect: false,
        whyCorrect: null,
        whyDistractor: "Distrator de Conforto: Embora o paciente necessite de auxílio para o banho, a proteção contra isquemia tecidual e necrose sacra tem prioridade de segurança biológica."
      },
      {
        id: "C",
        title: "Risco de glicemia instável relacionado ao estresse metabólico",
        isCorrect: false,
        whyCorrect: null,
        whyDistractor: "Distrator Inespecífico: Não há dados no caso montado que justifiquem priorizar o controle glicêmico sobre a prevenção de lesão por pressão com Braden diminuído."
      },
      {
        id: "D",
        title: "Integridade da pele prejudicada relacionada ao atrito mecânico",
        isCorrect: false,
        whyCorrect: null,
        whyDistractor: "Armadilha Conceitual: Se a lesão ainda não abriu (estágio 1 ou pele íntegra), o diagnóstico correto é 'Risco de Lesão por Pressão', e não 'Integridade prejudicada'."
      }
    ];
    interventions = [
      "Instituir protocolo de mudança de decúbito com aprazamento rigoroso de 2 em 2 horas;",
      "Aplicar colchão pneumático piramidal e protetores de calcâneo;",
      "Manter pele limpa, hidratada com ácidos graxos essenciais (AGE) e aplicar creme barreira nas zonas de umidade."
    ];
  } else if (hasDelirium) {
    title = "Segurança Neurológica & Rastreio de Delirium";
    tip = "Flutuação aguda do sensório no ambiente hospitalar deve ser tratada como urgência clínica multifatorial.";
    options = [
      {
        id: "A",
        title: "Confusão aguda (Delirium) relacionada à privação do sono e estresse ambiental evidenciada por início flutuante e desatenção",
        isCorrect: true,
        whyCorrect: `Correto! A positividade na escala CAM confirma o diagnóstico de Confusão Aguda. Exige intervenções ambientais imediatas para proteger a segurança física do paciente.`,
        whyDistractor: null
      },
      {
        id: "B",
        title: "Confusão crônica relacionada à demência senil progressiva",
        isCorrect: false,
        whyCorrect: null,
        whyDistractor: "Armadilha Geriátrica: Nunca rotule um quadro agudo e flutuante como 'demência da idade'. O CAM positivo define instalação aguda e potencialmente reversível."
      },
      {
        id: "C",
        title: "Padrão de sono prejudicado relacionado a ruídos na enfermaria",
        isCorrect: false,
        whyCorrect: null,
        whyDistractor: "Distrator Sintomático: O distúrbio do sono é apenas um dos fatores precipitantes, não o diagnóstico prioritário que ameaça a integridade do paciente."
      },
      {
        id: "D",
        title: "Comunicação verbal prejudicada relacionada à sonolência diurna",
        isCorrect: false,
        whyCorrect: null,
        whyDistractor: "Distrator Secundário: O déficit de comunicação é reflexo da desatenção do delirium, demandando manejo etiológico e ambiental prioritário."
      }
    ];
    interventions = [
      "Implementar protocolo de prevenção de quedas e manter grades do leito elevadas;",
      "Promover reorientação têmporo-espacial com presença de familiar e iluminação diurna adequada;",
      "Investigar causas orgânicas precipitantes (retenção urinária aguda, constipação, dor ou infecção subclínica)."
    ];
  } else {
    title = "Estabilidade Hemodinâmica & Conforto";
    tip = "Avalie a relação entre os níveis pressóricos aferidos e o alívio da dor do paciente.";
    options = [
      {
        id: "A",
        title: "Dor aguda relacionada a lesão tissular ou processo inflamatório evidenciada por escore de dor elevado e autorrelato",
        isCorrect: true,
        whyCorrect: `Correto! O escore de dor de ${caloiTotal}/10 demanda controle analgésico e intervenções não farmacológicas prioritárias para redução do estresse autonômico.`,
        whyDistractor: null
      },
      {
        id: "B",
        title: "Disposição para bem-estar espiritual aumentada",
        isCorrect: false,
        whyCorrect: null,
        whyDistractor: "Distrator de Promoção de Saúde: Diagnósticos de bem-estar são pertinentes em pacientes estabilizados, não em momentos de dor aguda descompensada."
      },
      {
        id: "C",
        title: "Risco de desequilíbrio do volume de líquidos",
        isCorrect: false,
        whyCorrect: null,
        whyDistractor: "Distrator Sem Evidências: Não há sinais no caso montado que justifiquem colocar a volemia à frente do alívio álgico imediato."
      },
      {
        id: "D",
        title: "Nutrição desequilibrada menor do que as necessidades corporais",
        isCorrect: false,
        whyCorrect: null,
        whyDistractor: "Distrator Crônico: Avaliações nutricionais são metas de médio prazo e não competem com a urgência do alívio da dor aguda."
      }
    ];
    interventions = [
      "Avaliar características da dor com escala numérica antes e 30 minutos após intervenções;",
      "Administrar analgesia prescrita conforme aprazamento médico com dupla checagem;",
      "Aplicar medidas não farmacológicas de conforto (posicionamento anatômico e ambiente calmo)."
    ];
  }

  return {
    questionTitle: title,
    clinicalVignette: vignette,
    attendingTip: tip,
    options,
    recommendedInterventions: interventions
  };
}
