/**
 * diagnosticChallengeService.js
 * Motor de Desafios Clínicos de Alta Complexidade & Vivência Real da Enfermagem.
 * Inspirado nas metodologias de ensino de AMBOSS NextGen NCLEX, Osmosis, SimX, Whitebook/PEBMED e COFEN nº 736/2024.
 */

import { computeGlobalRisk, computeBradenTotal, computeCamPositive, computeCaloiTotal, computeSakTotal } from "@/lib/riskEngine";
import { formatToInitials } from "@/lib/sampleNames";
import { callResilientAI } from "./aiCoreService.js";

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
 * Normaliza e embaralha as alternativas garantindo que:
 * 1. Exatamente 1 alternativa seja identificada e marcada com isCorrect: true estrito.
 * 2. As letras A, B, C, D sejam atribuídas sequencialmente após o embaralhamento.
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

  // 2. Embaralha as alternativas para evitar viés posicional
  const shuffled = [...preparedOptions].sort(() => Math.random() - 0.5);

  // 3. Atribui IDs A, B, C, D e o booleano estrito isCorrect
  return shuffled.map((opt, idx) => ({
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

export async function generateCaseDiagnosticChallenge(profile, assessmentData) {
  const patientInitials = formatToInitials(profile?.initials || profile?.name);

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
    const systemPrompt = `Você é um Especialista e Docente Sênior de Enfermagem em Terapia Intensiva e Clínica Médica, especialista em julgamento clínico avançado e na Resolução COFEN nº 736/2024.
Sua missão: Criar uma BATERIA DE 4 QUESTÕES CLÍNICAS DE ALTA COMPLEXIDADE baseadas na vivência real do plantão hospitalar, com distratores de alta verossimilhança e raciocínio fisiopatológico profundo.
NÃO faça perguntas puramente teóricas ou óbvias. Crie dilemas reais de conduta que enfermeiros enfrentam à beira-leito.
NUNCA insira a palavra 'pegadinha' ou qualquer aviso/spoiler no texto das alternativas ou enunciados.

DIRETRIZ MANDATÓRIA DE PSICOMETRIA & BALANCEAMENTO DE ALTERNATIVAS:
1. HOMOGENEIDADE ABSOLUTA DE EXTENSÃO: Todas as 4 alternativas (A, B, C, D) DEVEM POSSUIR EXATAMENTE O MESMO NÚMERO DE PALAVRAS (entre 22 e 28 palavras cada). É TERMINANTEMENTE PROIBIDO fazer a alternativa correta mais longa ou mais detalhada do que os distratores!
2. DISTRATORES DE ALTO NÍVEL: Os distratores devem empregar terminologia clínica impecável e descrever ações que profissionais frequentemente cometem sob pressão de plantão (ex: priorizar gasometria antes de posicionar cabeceira; ofertar oxigênio em alto fluxo em retentor crônico de CO₂; infundir volume rápido em oligúria por disfunção cardíaca; delegar estadiamento de lesão por pressão).
3. DISTRIBUIÇÃO DA RESPOSTA CORRETA: Exatamente UMA alternativa por questão deve possuir "isCorrect": true, e as outras três "isCorrect": false.

DIRETRIZ MANDATÓRIA DE PRIVACIDADE E LGPD (Lei nº 13.709/2018):
É expressamente PROIBIDO gerar nomes completos de pessoas. Refira-se ao paciente EXCLUSIVAMENTE por suas iniciais ("Paciente ${patientInitials}") ou pelo leito hospitalar.

A bateria DEVE conter EXATAMENTE 4 QUESTÕES com estes eixos temáticos:
1. "Priorização & Conduta Imediata": O que o enfermeiro faz nos primeiros 5 minutos diante dos sinais vitais e achados, antes do médico chegar?
2. "Fisiopatologia & Diagnóstico Crítico": Raciocínio clínico sobre a causa raiz (ex: descompensação de ICC com congestão pulmonar vs EAP, choque séptico inicial vs hipovolemia, delirium hipoativo vs demência).
3. "Farmacologia Clínica & Iatrogenia": Vigilância dos medicamentos em uso pelo paciente (${profile.current_medications || "conforme caso"}), riscos hidroeletrolíticos (K+, Na+), interações perigosas, cuidados na administração intravenosa e riscos de toxicidade.
4. "Segurança do Paciente & Legislação Ética (COFEN 736/2024 / Lei 7.498/86)": Atribuições privativas do enfermeiro vs delegação ao técnico de enfermagem, prevenção de LPP grave com Braden alterado, contenção no delirium ou manejo de quedas.

Formato OBRIGATÓRIO de retorno: JSON estrito com esta estrutura:
{
  "questionTitle": "Bateria de Julgamento Clínico Avançado",
  "clinicalVignette": "Vinheta detalhada do caso clínico com contextualização de plantão",
  "questions": [
    {
      "id": 1,
      "category": "Priorização & Conduta Imediata",
      "questionStem": "Enunciado denso e situacional descrevendo o dilema nos primeiros 5 minutos à beira-leito",
      "attendingTip": "Dica socrática de vivência orientando o olhar sem dar a resposta",
      "options": [
        {
          "id": "A",
          "title": "Ação correta ou distrator com 22 a 28 palavras rigorosamente balanceadas",
          "isCorrect": true,
          "whyCorrect": "Justificativa fisiopatológica e clínica da prioridade imediata",
          "whyDistractor": null
        },
        {
          "id": "B",
          "title": "Distrator plausível com exatamente 22 a 28 palavras",
          "isCorrect": false,
          "whyCorrect": null,
          "whyDistractor": "Por que esta conduta é uma armadilha ou atrasa a intervenção prioritária"
        },
        {
          "id": "C",
          "title": "Distrator secundário com exatamente 22 a 28 palavras",
          "isCorrect": false,
          "whyCorrect": null,
          "whyDistractor": "Por que esta conduta não é a primeira medida a ser tomada"
        },
        {
          "id": "D",
          "title": "Conduta contraindicada ou iatrogênica com 22 a 28 palavras",
          "isCorrect": false,
          "whyCorrect": null,
          "whyDistractor": "Explicação do risco iatrogênico desta opção"
        }
      ]
    }
  ],
  "recommendedInterventions": [
    "Cuidados privativos de enfermagem prescritos com aprazamento de horário (COFEN nº 736/2024)"
  ]
}`;

    const randomSeed = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const userPrompt = `DADOS DO CASO CLÍNICO MONTADO PELO ESTUDANTE (Seed: ${randomSeed}):
Paciente (LGPD): ${patientInitials}, ${profile.age || "65"} anos, Sexo: ${profile.gender === "M" ? "Masculino" : "Feminino"}
Histórico & Antecedentes: ${profile.previous_diseases || profile.medical_history || "Sem antecedentes relevantes"}
Medicações: ${profile.current_medications || "Nenhuma informada"}
Alergias: ${profile.allergies || "Nega alergias"}
Anamnese / Admissão: ${profile.previous_anamnesis || profile.notes || "Em observação clínica"}
Sinais Vitais: ${vitalsSummary}
Escores Clínicos: ${scoresSummary}
Relato da Avaliação: ${assessmentData.notes || "Avaliação regular"}

Instrução especial de novidade: Crie uma bateria inédita para este plantão, com dilemas e perguntas variadas sobre a condição do paciente. Retorne exclusivamente JSON válido com 4 questões.`;

    const result = await callResilientAI(systemPrompt, userPrompt, {
      temperature: 0.4,
      responseMimeType: "application/json",
      maxTokens: 2500,
    });

    if (result?.text) {
      const parsed = JSON.parse(result.text);
      if (parsed.questions && parsed.questions.length >= 2) {
        // Normaliza e embaralha as opções garantindo isCorrect booleano estrito
        parsed.questions = parsed.questions.map((q) => ({
          ...q,
          options: normalizeAndShuffleOptions(q),
        }));
        parsed.options = parsed.questions[0].options;
        parsed.attendingTip = parsed.questions[0].attendingTip;
        return parsed;
      }
    }
  } catch (e) {
    console.warn("[Desafio Diagnóstico] Fallback para motor determinístico de alta complexidade:", e);
  }

  // MOTOR DETERMINÍSTICO OFFLINE DE ALTA FIDELIDADE & VIVÊNCIA HOSPITALAR REAL
  return buildDeterministicComplexBattery(patientInitials, profile, assessmentData, bradenTotal, camPositive, caloiTotal, sakTotal);
}

/**
 * Constrói uma bateria determinística de 4 questões da vivência real da enfermagem,
 * adaptada estritamente aos escores e dados inseridos pelo estudante.
 */
function buildDeterministicComplexBattery(patientInitials, profile, assessmentData, bradenTotal, camPositive, caloiTotal, sakTotal) {
  const isHypoxemic = assessmentData.sat < 92 || assessmentData.fr > 22;
  const isCardioOrHypertensive = assessmentData.pa_sistolica >= 140 || assessmentData.fc > 100;
  const isHighSkinRisk = bradenTotal <= 14;
  const hasDelirium = camPositive;

  const vignette = `Paciente ${patientInitials}, ${profile.age || 68} anos, internado na unidade de cuidados clínicos. PA ${assessmentData.pa_sistolica}/${assessmentData.pa_diastolica} mmHg, FC ${assessmentData.fc} bpm, FR ${assessmentData.fr} irpm, Tax ${assessmentData.tax}°C, SatO₂ ${assessmentData.sat}%. Escores: Braden ${bradenTotal} pts, CAM ${camPositive ? "Positivo (Delirium)" : "Negativo"}, Dor ${caloiTotal}/10, Risco de Queda (SAK) ${sakTotal} pts. Histórico: ${profile.previous_diseases || "HAS e cardiopatia"}. Medicações: ${profile.current_medications || "Furosemida, Enalapril, Carvedilol"}.`;

  // QUESTÃO 1: PRIORIZAÇÃO & CONDUTA IMEDIATA (PRIMEIROS 5 MINUTOS)
  const q1Raw = isHypoxemic
    ? {
        id: 1,
        category: "Priorização & Conduta Imediata",
        questionStem: `Durante a ronda de enfermagem, o enfermeiro encontra o Paciente ${patientInitials} com padrão ventilatório dispneico, FR ${assessmentData.fr} irpm, SatO₂ ${assessmentData.sat}% em ar ambiente e queixa de cansaço intenso. Qual é a conduta privativa de enfermagem prioritária e imediata que deve anteceder qualquer outra intervenção?`,
        attendingTip: "Na hierarquia de emergência ventilatória, a mecânica diafragmática e a desobstrução postural precedem procedimentos invasivos ou administração medicamentosa.",
        options: [
          {
            title: "Posicionar o paciente em decúbito de Fowler a 45°-60°, ofertar oxigenoterapia inicial em baixo fluxo por cânula nasal e monitorar a curva pletismográfica continuamente.",
            isCorrect: true,
            whyCorrect: "Correto! A elevação da cabeceira reduz a pressão das vísceras abdominais sobre o diafragma, aumentando a capacidade residual funcional e otimizando a troca gasosa imediatamente sem risco de iatrogenia.",
            whyDistractor: null
          },
          {
            title: "Instalar máscara facial com reservatório não reinalante a 15 L/min imediatamente, mantendo o decúbito dorsal horizontal para facilitar a expansão torácica durante a infusão do fluxo de oxigênio.",
            isCorrect: false,
            whyCorrect: null,
            whyDistractor: "Armadilha de Hiperoxigênio: O alto fluxo sem adequação prévia da mecânica postural induz atelectasia por absorção e risco de narcose por hipercapnia caso o paciente seja retentor crônico de CO₂."
          },
          {
            title: "Realizar aspiração traqueal vigorosa sob pressão negativa contínua para desobstrução imediata de secreções antes de proceder à aferição dos demais parâmetros hemodinâmicos e ventilatórios do leito.",
            isCorrect: false,
            whyCorrect: null,
            whyDistractor: "Procedimento Iatrogênico: A aspiração sem evidência auscultatória prévia de secreção em vias aéreas altas deflagra broncoespasmo reflexo, hipóxia paradoxal e estímulo vagal com bradicardia acentuada."
          },
          {
            title: "Coletar gasometria arterial e aguardar os resultados laboratoriais de pH e pO₂ para definir a conduta postural e a indicação precisa do suporte suplementar de oxigênio da prescrição.",
            isCorrect: false,
            whyCorrect: null,
            whyDistractor: "Atraso Assistencial: A intervenção imediata de posicionamento e suporte de baixo fluxo não pode ser postergada enquanto se aguarda o processamento de exames laboratoriais."
          }
        ]
      }
    : {
        id: 1,
        category: "Priorização & Conduta Imediata",
        questionStem: `Ao realizar a primeira avaliação do turno no leito do Paciente ${patientInitials}, você constata PA ${assessmentData.pa_sistolica}/${assessmentData.pa_diastolica} mmHg e dor de intensidade ${caloiTotal}/10. O técnico de enfermagem solicita autorização para administrar a medicação anti-hipertensiva do horário. Qual deve ser a sua conduta imediata como enfermeiro?`,
        attendingTip: "Dores agudas intensas ativam o sistema nervoso simpático com liberação maciça de catecolaminas, alterando fisiologicamente a pressão arterial.",
        options: [
          {
            title: "Investigar as características semiológicas da dor, reconhecer o gatilho adrenérgico na elevação pressórica e providenciar o manejo álgico prescrito antes de titular doses adicionais de anti-hipertensivos.",
            isCorrect: true,
            whyCorrect: "Correto! O estímulo nociceptivo agudo provoca vasoconstrição reflexa por catecolaminas. Tratar a dor reverte o pico adrenérgico e previne episódios de hipotensão severa rebote após analgesia.",
            whyDistractor: null
          },
          {
            title: "Orientar o técnico de enfermagem a duplicar a dose do anti-hipertensivo imediatamente devido ao nível crítico de pressão arterial sistólica registrado durante o atendimento matutino.",
            isCorrect: false,
            whyCorrect: null,
            whyDistractor: "Iatrogenia Farmacológica: Ajuste posológico sem ordem médica e sem tratar a dor como gatilho causal expõe o paciente a colapso hemodinâmico e choque hipotensivo após alívio da dor."
          },
          {
            title: "Posicionar o paciente em decúbito de Trendelenburg com membros inferiores elevados para estabilizar a perfusão dos órgãos nobres antes de verificar a escala de avaliação da dor.",
            isCorrect: false,
            whyCorrect: null,
            whyDistractor: "Contraindicação Fisiológica: Trendelenburg aumenta abruptamente o retorno venoso e a pré-carga cardíaca, agravando a sobrecarga miocárdica e elevando o risco de edema agudo de pulmão."
          },
          {
            title: "Manter o paciente em jejum estrito e sem intervenção terapêutica até a visita médica da tarde, suspendendo toda a hidratação e medicação analgésica previamente aprazada na prescrição.",
            isCorrect: false,
            whyCorrect: null,
            whyDistractor: "Omissão Assistencial: A presença de dor significativa exige intervenção ativa imediata e reavaliação sequencial de enfermagem em até trinta minutos."
          }
        ]
      };

  // QUESTÃO 2: FISIOPATOLOGIA & DIAGNÓSTICO CRÍTICO
  const q2Raw = hasDelirium
    ? {
        id: 2,
        category: "Fisiopatologia & Raciocínio Diagnóstico Crítico",
        questionStem: `O Paciente ${patientInitials} apresentou escore CAM Positivo na avaliação (início agudo, flutuação do sensório e desatenção). A acompanhante afirma: 'Ele é idoso, é normal ficar confuso e esquecido na idade dele'. Qual fundamentação fisiopatológica e julgamento diagnóstico o enfermeiro deve sustentar perante a equipe?`,
        attendingTip: "Diferenciar a instalação aguda do delirium de uma síndrome demencial crônica é o divisor de águas entre investigar uma emergência reversível e negligenciar sepse ou hipóxia.",
        options: [
          {
            title: "Confusão Aguda (Delirium): Trata-se de falência cerebral aguda reversível deflagrada por estressores orgânicos, exigindo investigação etiológica de infecção oculta, hipóxia ou distúrbios metabólicos descompensados.",
            isCorrect: true,
            whyCorrect: "Correto! O delirium NUNCA deve ser naturalizado como senescência. Ele reflete falência orgânica cerebral aguda com neuroinflamação e desbalanço colinérgico/dopaminérgico, sendo preditor independente de mortalidade hospitalar.",
            whyDistractor: null
          },
          {
            title: "Confusão Crônica (Demência Senil): O quadro decorre de degeneração cortical progressiva própria do envelhecimento, sendo esperado o esquecimento e a desorientação temporal sem necessidade de intervenção rápida.",
            isCorrect: false,
            whyCorrect: null,
            whyDistractor: "Armadilha do Idadismo: Aceitar a confusão como 'demência senil' atrasa o diagnóstico de infecções graves (como ITU ou pneumonia) e distúrbios hidroeletrolíticos reversíveis."
          },
          {
            title: "Privação Sensorial Hospitalar Isolada: A desorientação decorre exclusivamente do confinamento no quarto e da ausência de relógio de parede, sem alteração inflamatória ou neurotransmissora cerebral sistêmica.",
            isCorrect: false,
            whyCorrect: null,
            whyDistractor: "Simplificação Errónea: Embora o ambiente hospitalar contribua como gatilho, o CAM positivo sinaliza disfunção neurovascular grave que demanda rastreio laboratorial rigoroso."
          },
          {
            title: "Transtorno Psicótico Tardio: A agitação psicomotora manifesta surto psiquiátrico primário novo sem causa fisiopatológica subjacente, tendo como primeira escolha a contenção mecânica e sedação benzodiazepínica.",
            isCorrect: false,
            whyCorrect: null,
            whyDistractor: "Conduta Iatrogênica Grave: Benzodiazepínicos são os maiores precipitantes e agravantes de delirium em idosos (exceto na abstinência alcoólica), devendo ser evitados."
          }
        ]
      }
    : {
        id: 2,
        category: "Fisiopatologia & Raciocínio Diagnóstico Crítico",
        questionStem: `Correlacionando o histórico prévio de Insuficiência Cardíaca e Hipertensão do Paciente ${patientInitials} com os achados de edema de membros inferiores, estertores discretos em bases e dispneia ao deitar (ortopneia), qual hipótese diagnóstica de enfermagem fundamenta a prioridade fisiopatológica e o plano de cuidados?`,
        attendingTip: "Na falência da bomba cardíaca, o acúmulo retrógrado de pressão venosa capilar pulmonar descompensa a troca alvéolo-capilar ao assumir decúbito horizontal.",
        options: [
          {
            title: "Volume de Líquidos Excessivo: Congestão pulmonar e retenção hídrica secundárias à falência ventricular retrógrada e ativação neuro-humoral, exigindo controle de balanço hídrico rigoroso e restrição volêmica.",
            isCorrect: true,
            whyCorrect: "Correto! A redução do débito cardíaco ativa o sistema renina-angiotensina-aldosterona gerando retenção hidrossalina crônica. O aumento da pré-carga extravasa para o interstício pulmonar e periférico, exigindo balanço hídrico rigoroso e diuréticos.",
            whyDistractor: null
          },
          {
            title: "Débito Cardíaco Diminuído: Hipovolemia absoluta aguda por depleção hidroeletrolítica severa evidenciada por sede intensa, requerendo infusão rápida de cristaloides intravenosos em bolus na primeira hora.",
            isCorrect: false,
            whyCorrect: null,
            whyDistractor: "Erro Diagnóstico Grave: O paciente está com sobrecarga de volume intersticial (edema e congestão), e não em hipovolemia absoluta. Administrar volume aqui causaria edema agudo de pulmão fulminante."
          },
          {
            title: "Padrão Respiratório Ineficaz: Broncoespasmo primário isolado decorrente de hiper-reatividade de vias aéreas sem relação com insuficiência cardíaca congestiva ou pressões de enchimento ventricular elevadas.",
            isCorrect: false,
            whyCorrect: null,
            whyDistractor: "Confusão Fisiopatológica: Os estertores bibasais associados a ortopneia e edema em cardiopata são decorrentes de transudato capilar pulmonar, e não asma brônquica primária isolada."
          },
          {
            title: "Intolerância à Atividade: Perda de massa muscular esquelética por sarcopenia senil exclusiva sem nenhum impacto hemodinâmico, pressórico ou alteração na capacidade de troca de gases alveolares.",
            isCorrect: false,
            whyCorrect: null,
            whyDistractor: "Subestimação Clínica: A limitação funcional decorre da hipoxemia e sobrecarga hemodinâmica da insuficiência cardíaca descompensada, e não apenas de fraqueza muscular."
          }
        ]
      };

  // QUESTÃO 3: FARMACOLOGIA CLÍNICA, ELETRÓLITOS & IATROGENIA
  const q3Raw = {
    id: 3,
    category: "Farmacologia Clínica, Eletrólitos & Iatrogenia",
    questionStem: `O Paciente ${patientInitials} tem prescrição hospitalar de Furosemida 40mg IV de 12/12h e Enalapril 20mg VO de 12/12h. Durante o plantão matutino, você recebe o resultado de exames laboratoriais: Potássio sérico (K⁺) = 3,1 mEq/L (VR: 3,5 a 5,0) e Creatinina = 1,8 mg/dL. Qual é a conduta de enfermagem e o risco farmacoterapêutico crítico associado a esta associação medicamentosa?`,
    attendingTip: "Diuréticos de alça inibem o cotransportador Na-K-2Cl na alça de Henle, provocando espoliação massiva de potássio na urina, o que predispõe a arritmias cardíacas graves e potencializa toxicidade.",
    options: [
      {
        title: "Identificar o risco iminente de arritmias ventriculares por hipocalemia, suspender temporariamente a Furosemida, comunicar o médico e verificar traçado eletrocardiográfico para ondas U ou QT alargado.",
        isCorrect: true,
        whyCorrect: "Correto! A hipocalemia grave potencializa o automatismo cardíaco anômalo, desencadeando torsades de pointes e fibrilação ventricular. O enfermeiro deve alertar imediatamente a equipe para reposição IV guiada e ajuste do diurético.",
        whyDistractor: null
      },
      {
        title: "Administrar a dose prescrita de Furosemida em bolus rápido intravenoso e liberar oferta irrestrita de água potável para compensar as perdas renais decorrentes da diurese forçada.",
        isCorrect: false,
        whyCorrect: null,
        whyDistractor: "Dupla Iatrogenia: O bolus rápido de furosemida causa ototoxicidade irreversível (zumbido e surdez) e piora a hipocalemia crítica; dieta rica em sódio agrava a congestão cardíaca."
      },
      {
        title: "Infundir cloreto de potássio a 19,1% em bolus direto na veia periférica para rápida reposição eletrolítica antes que o paciente manifeste rebaixamento progressivo do nível de consciência.",
        isCorrect: false,
        whyCorrect: null,
        whyDistractor: "ERRO FATAL (NUNCA FAZER): Cloreto de potássio IV em bolus causa parada cardíaca em assistolia imediata. Deve ser SEMPRE diluído em solução de infusão contínua em bomba e infundido lentamente com monitorização."
      },
      {
        title: "Manter a conduta inalterada sem comunicação médica, pois a associação com Enalapril anula fisiologicamente a perda de potássio na urina nas próximas horas de observação clínica.",
        isCorrect: false,
        whyCorrect: null,
        whyDistractor: "Conhecimento Erróneo: Embora IECA retenha potássio a longo prazo, diuréticos de alça em fase aguda provocam quedas abruptas que superam o efeito retentor, mantendo o risco arritmogênico real."
      }
    ]
  };

  // QUESTÃO 4: SEGURANÇA DO PACIENTE & LEGISLAÇÃO ÉTICA (COFEN nº 736/2024 / LEI 7.498/86)
  const q4Raw = {
    id: 4,
    category: "Segurança do Paciente & Legislação Ética (COFEN)",
    questionStem: `O Paciente ${patientInitials} possui escore de Braden de ${bradenTotal} pontos (risco ${bradenTotal <= 14 ? "alto/moderado" : "presente"} de LPP), risco de queda (SAK = ${sakTotal}) e episódios de desorientação têmporo-espacial. Durante a passagem de plantão, o técnico de enfermagem relata que o paciente tentou sair do leito e pergunta se pode amarrá-lo na grade com ataduras de crepe. Conforme a Resolução COFEN nº 736/2024 e a Lei 7.498/86, qual é a decisão técnica e ético-legal privativa do enfermeiro?`,
    attendingTip: "A contenção mecânica é ato excepcional de emergência, regulamentada pelo COFEN com critérios estritos de prescrição, monitorização de perfusão e responsabilidade privativa do enfermeiro.",
    options: [
      {
        title: "Vetar a amarração improvisada com ataduras, instituir manejo não farmacológico e aplicar contenção mecânica padronizada apenas em último caso mediante prescrição privativa do enfermeiro e monitorização distal.",
        isCorrect: true,
        whyCorrect: "Correto! O COFEN determina que contenção mecânica é procedimento excepcional, jamais preventivo de rotina. Ataduras de crepe causam lesão tecidual por garroteamento e isquemia. O enfermeiro é o responsável técnico privativo pela prescrição e supervisão da perfusão.",
        whyDistractor: null
      },
      {
        title: "Autorizar o técnico de enfermagem a improvisar a amarração nos membros superiores com atadura de crepe para evitar sobrecarga de trabalho e quedas durante o turno noturno.",
        isCorrect: false,
        whyCorrect: null,
        whyDistractor: "Infração Ética e Legal: O técnico de enfermagem não tem competência legal para prescrever contenções mecânicas. Trata-se de delegação ilegal de ato privativo com responsabilização do enfermeiro por negligência."
      },
      {
        title: "Manter o paciente em contenção mecânica contínua nas quatro extremidades por vinte e quatro horas ininterruptas, sem necessidade de reavaliação periódica da perfusão ou integridade da pele periférica.",
        isCorrect: false,
        whyCorrect: null,
        whyDistractor: "Violação Grave de Direitos e Iatrogenia: A contenção prolongada ininterrupta causa rabdomiólise, trombose venosa profunda (TVP), asfixia postural e necrose tecidual por pressão."
      },
      {
        title: "Delegar ao técnico de enfermagem a tomada de decisão sobre necessidade e duração da contenção física, registrando apenas em prontuário caso ocorra lesão por fricção nas grades.",
        isCorrect: false,
        whyCorrect: null,
        whyDistractor: "Ilegalidade Assistencial: A avaliação de risco, indicação de contenção e supervisão são privativas do enfermeiro, não podendo ser transferidas para a equipe técnica sem prescrição formal."
      }
    ]
  };

  // Aplica normalizeAndShuffleOptions em cada uma das 4 questões determinísticas
  const q1 = { ...q1Raw, options: normalizeAndShuffleOptions(q1Raw) };
  const q2 = { ...q2Raw, options: normalizeAndShuffleOptions(q2Raw) };
  const q3 = { ...q3Raw, options: normalizeAndShuffleOptions(q3Raw) };
  const q4 = { ...q4Raw, options: normalizeAndShuffleOptions(q4Raw) };

  const questions = [q1, q2, q3, q4];

  return {
    questionTitle: "Bateria de Julgamento Clínico Avançado (Vivência Hospitalar)",
    clinicalVignette: vignette,
    patientInitials,
    options: q1.options, // Retrocompatibilidade
    attendingTip: q1.attendingTip,
    questions,
    recommendedInterventions: [
      "Instituir protocolo de cabeceira elevada a 45°-60° contínua para otimização da mecânica ventilatória;",
      "Manter monitorização eletrocardiográfica contínua e dosagem sérica urgente de eletrólitos (K⁺, Na⁺, Mg²⁺);",
      "Aplicar colchão pneumático piramidal e hidratação cutânea com AGE a cada mudança de decúbito (2/2h);",
      "Executar medidas de orientação ambiental diurna para manejo não farmacológico de confusão mental."
    ]
  };
}
