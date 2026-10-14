/**
 * diagnosticChallengeService.js
 * Motor de Desafios Clínicos de Alta Complexidade & Vivência Real da Enfermagem.
 * Inspirado nas metodologias de ensino de AMBOSS NextGen NCLEX, Osmosis, SimX, Whitebook/PEBMED e COFEN nº 736/2024.
 */

import { computeGlobalRisk, computeBradenTotal, computeCamPositive, computeCaloiTotal, computeSakTotal } from "@/lib/riskEngine";
import { formatToInitials } from "@/lib/sampleNames";

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

  const apiKey = getGeminiApiKey();

  if (apiKey) {
    try {
      const systemPrompt = `Você é um Preceptor e Docente Sênior de Enfermagem em Terapia Intensiva e Clínica Médica, especialista no método AMBOSS NextGen NCLEX e na Resolução COFEN nº 736/2024.
Sua missão: Criar uma BATERIA DE 4 QUESTÕES CLÍNICAS DE ALTA COMPLEXIDADE baseadas na vivência real do plantão hospitalar, com pegadinhas sutis da prática e análise profunda de distratores.
NÃO faça perguntas puramente teóricas ou óbvias. Crie dilemas reais de conduta que enfermeiros enfrentam à beira-leito.

DIRETRIZ MANDATÓRIA DE PRIVACIDADE E LGPD (Lei nº 13.709/2018):
É expressamente PROIBIDO gerar nomes completos de pessoas. Refira-se ao paciente EXCLUSIVAMENTE por suas iniciais ("Paciente ${patientInitials}") ou pelo leito hospitalar.

A bateria DEVE conter EXATAMENTE 4 QUESTÕES com estes eixos temáticos:
1. "Priorização & Conduta Imediata": O que o enfermeiro faz nos primeiros 5 minutos diante dos sinais vitais e achados, antes do médico chegar? (ex: posicionamento a 45-60°, verificação de permeabilidade de vias aéreas vs armadilha de oxigênio indiscriminado ou infusão rápida errada).
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
      "attendingTip": "Dica socrática de vivência (AMBOSS Tip) orientando o olhar sem dar a resposta",
      "options": [
        {
          "id": "A",
          "title": "Ação correta prioritária",
          "isCorrect": true,
          "whyCorrect": "Justificativa fisiopatológica e clínica da prioridade imediata",
          "whyDistractor": null
        },
        {
          "id": "B",
          "title": "Distrator plausível mas incorreto",
          "isCorrect": false,
          "whyCorrect": null,
          "whyDistractor": "Por que esta conduta é uma armadilha ou atrasa a intervenção prioritária"
        },
        {
          "id": "C",
          "title": "Distrator secundário",
          "isCorrect": false,
          "whyCorrect": null,
          "whyDistractor": "Por que esta conduta não é a primeira medida a ser tomada"
        },
        {
          "id": "D",
          "title": "Conduta contraindicada ou iatrogênica",
          "isCorrect": false,
          "whyCorrect": null,
          "whyDistractor": "Explicação do risco iatrogênico desta opção"
        }
      ]
    },
    {
      "id": 2,
      "category": "Fisiopatologia & Diagnóstico Crítico",
      "questionStem": "Enunciado sobre correlação fisiopatológica entre histórico e sinais",
      "attendingTip": "Dica orientadora de mecanismo de lesão / disfunção orgânica",
      "options": [ ... 4 opções A, B, C, D ... ]
    },
    {
      "id": 3,
      "category": "Farmacologia Clínica & Iatrogenia",
      "questionStem": "Enunciado sobre os riscos farmacoterapêuticos dos remédios do paciente",
      "attendingTip": "Dica sobre mecanismos de ação e farmacovigilância",
      "options": [ ... 4 opções A, B, C, D ... ]
    },
    {
      "id": 4,
      "category": "Segurança do Paciente & Legislação Ética (COFEN)",
      "questionStem": "Enunciado sobre competência privativa, delegação segura e prevenção de danos",
      "attendingTip": "Dica legal e assistencial sobre o escopo da enfermagem",
      "options": [ ... 4 opções A, B, C, D ... ]
    }
  ],
  "recommendedInterventions": [
    "Cuidados privativos de enfermagem prescritos com aprazamento de horário (COFEN nº 736/2024)"
  ]
}`;

      const userPrompt = `DADOS DO CASO CLÍNICO MONTADO PELO ESTUDANTE:
Paciente (LGPD): ${patientInitials}, ${profile.age || "65"} anos, Sexo: ${profile.gender === "M" ? "Masculino" : "Feminino"}
Histórico & Antecedentes: ${profile.previous_diseases || profile.medical_history || "Sem antecedentes relevantes"}
Medicações: ${profile.current_medications || "Nenhuma informada"}
Alergias: ${profile.allergies || "Nega alergias"}
Anamnese / Admissão: ${profile.previous_anamnesis || profile.notes || "Em observação clínica"}
Sinais Vitais: ${vitalsSummary}
Escores Clínicos: ${scoresSummary}
Relato da Avaliação: ${assessmentData.notes || "Avaliação regular"}

Gere a Bateria Completa com 4 questões complexas da vivência hospitalar real. Retorne exclusivamente JSON válido.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n---\n\n${userPrompt}` }] }],
            generationConfig: { temperature: 0.35, responseMimeType: "application/json" }
          })
        }
      );

      if (response.ok) {
        const json = await response.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          if (parsed.questions && parsed.questions.length >= 2) {
            // Garante compatibilidade plana com código anterior
            parsed.options = parsed.questions[0].options;
            parsed.attendingTip = parsed.questions[0].attendingTip;
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn("[Desafio Diagnóstico] Fallback para motor determinístico de alta complexidade:", e);
    }
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
  const q1 = isHypoxemic
    ? {
        id: 1,
        category: "Priorização & Conduta Imediata",
        questionStem: `Durante a ronda de enfermagem, o enfermeiro encontra o Paciente ${patientInitials} com padrão ventilatório dispneico, FR ${assessmentData.fr} irpm, SatO₂ ${assessmentData.sat}% em ar ambiente e queixa de cansaço intenso. Qual é a conduta privativa de enfermagem prioritária e imediata que deve anteceder qualquer outra intervenção?`,
        attendingTip: "Na hierarquia de emergência ventilatória, a mecânica diafragmática e a desobstrução postural precedem procedimentos invasivos ou administração medicamentosa.",
        options: [
          {
            id: "A",
            title: "Elevar imediatamente a cabeceira do leito a 45°-60° (Posição de Fowler alta) e ofertar oxigenoterapia em baixo fluxo (cânula nasal a 2-3 L/min) monitorando a curva pletismográfica.",
            isCorrect: true,
            whyCorrect: "Correto! A elevação da cabeceira reduz a pressão das vísceras abdominais sobre o músculo diafragma, aumentando a complacência pulmonar e a capacidade residual funcional de forma imediata e sem riscos de iatrogenia.",
            whyDistractor: null
          },
          {
            id: "B",
            title: "Instalar máscara com reservatório não reinalante a 15 L/min imediatamente antes de verificar o decúbito do paciente.",
            isCorrect: false,
            whyCorrect: null,
            whyDistractor: "Armadilha de Hiperoxigênio: O uso indiscriminado de altos fluxos sem adequação prévia da mecânica postural pode induzir atelectasia por absorção e narcose por hipercapnia caso o paciente seja retentor crônico de CO₂."
          },
          {
            id: "C",
            title: "Realizar aspiração traqueal vigorosa às cegas para remoção de possíveis rolhas de secreção brônquica.",
            isCorrect: false,
            whyCorrect: null,
            whyDistractor: "Procedimento Iatrogênico: A aspiração sem indicação de secreções em vias aéreas altas provoca broncoespasmo reflexo, hipóxia paradoxal e estímulo vagal grave com bradicardia."
          },
          {
            id: "D",
            title: "Afastar-se do leito para ligar para o médico plantonista solicitando prescrição de broncodilatador inalatório.",
            isCorrect: false,
            whyCorrect: null,
            whyDistractor: "Atraso Assistencial: O enfermeiro não deve abandonar o paciente hipoxêmico antes de estabilizar a postura no leito, ofertar oxigênio de suporte e delegar a comunicação à equipe de apoio."
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
            id: "A",
            title: "Avaliar detalhadamente as características da dor, checar se a dor está agindo como gatilho adrenérgico para a elevação pressórica e providenciar o manejo álgico prescrito antes de titulações excessivas de anti-hipertensivos.",
            isCorrect: true,
            whyCorrect: "Correto! O estímulo nociceptivo agudo provoca vasoconstrição reflexa mediada por catecolaminas. Tratar a dor reverte o pico adrenérgico e evita episódios graves de hipotensão rebote após sedação da dor.",
            whyDistractor: null
          },
          {
            id: "B",
            title: "Orientar o técnico a dobrar a dose do anti-hipertensivo imediatamente devido aos níveis de pressão arterial sistólica.",
            isCorrect: false,
            whyCorrect: null,
            whyDistractor: "Iatrogenia Farmacológica: Ajuste de dose sem ordem médica e sem avaliar a dor como causa precipitante é conduta antiética e expõe o paciente a choque hipotensivo."
          },
          {
            id: "C",
            title: "Colocar o paciente em posição de Trendelenburg para estabilizar a perfusão de órgãos nobres.",
            isCorrect: false,
            whyCorrect: null,
            whyDistractor: "Contraindicação Fisiológica: Trendelenburg eleva o retorno venoso e a pré-carga, sobrecarregando o miocárdio e aumentando o risco de edema agudo de pulmão em pacientes hipertensos."
          },
          {
            id: "D",
            title: "Suspender toda a hidratação e manter o paciente sem nenhuma intervenção até a visita médica da tarde.",
            isCorrect: false,
            whyCorrect: null,
            whyDistractor: "Omissão de Cuidado: A dor de 4/10 ou superior requer conduta ativa de alívio e reavaliação periódica em até 30 minutos."
          }
        ]
      };

  // QUESTÃO 2: FISIOPATOLOGIA & DIAGNÓSTICO CRÍTICO
  const q2 = hasDelirium
    ? {
        id: 2,
        category: "Fisiopatologia & Raciocínio Diagnóstico Crítico",
        questionStem: `O Paciente ${patientInitials} apresentou escore CAM Positivo na avaliação (início agudo, flutuação do sensório e desatenção). A acompanhante afirma: 'Ele é idoso, é normal ficar confuso e esquecido na idade dele'. Qual fundamentação fisiopatológica e julgamento diagnóstico o enfermeiro deve sustentar perante a equipe?`,
        attendingTip: "Diferenciar a instalação aguda do delirium de uma síndrome demencial crônica é o divisor de águas entre investigar uma emergência reversível e negligenciar sepse ou hipóxia.",
        options: [
          {
            id: "A",
            title: "Confusão Aguda (Delirium): Trata-se de uma disfunção encefálica aguda e potencialmente reversível, desencadeada por estressores orgânicos (infecção oculta, distúrbio metabólico, hipóxia ou toxicidade medicamentosa), exigindo investigação etiológica imediata.",
            isCorrect: true,
            whyCorrect: "Correto! O delirium NUNCA deve ser naturalizado como senescência. Ele reflete falência orgânica cerebral aguda com neuroinflamação e desbalanço colinérgico/dopaminérgico, sendo preditor independente de mortalidade hospitalar.",
            whyDistractor: null
          },
          {
            id: "B",
            title: "Confusão Crônica (Demência Senil): O quadro decorre de atrofia cortical progressiva típica do envelhecimento, sem relação com intercorrências clínicas agudas.",
            isCorrect: false,
            whyCorrect: null,
            whyDistractor: "Armadilha do Idadismo: Aceitar a confusão como 'demência senil' atrasa o diagnóstico de infecções graves (como ITU ou pneumonia) e distúrbios hidroeletrolíticos reversíveis."
          },
          {
            id: "C",
            title: "Déficit Cognitivo por Privação Sensorial Isolada: A alteração decorre exclusivamente da ausência de relógio e janelas no quarto, sem base neuroquímica sistêmica.",
            isCorrect: false,
            whyCorrect: null,
            whyDistractor: "Simplificação Errónea: Embora o ambiente hospitalar contribua como gatilho, o CAM positivo sinaliza falência neurofuncional que demanda rastreio laboratorial e clínico rigoroso."
          },
          {
            id: "D",
            title: "Psicose Hospitalar Refratária: O paciente desenvolveu distúrbio psiquiátrico primário incurável, cuja conduta isolada é sedação contínua com benzodiazepínicos.",
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
            id: "A",
            title: "Volume de Líquidos Excessivo relacionado ao comprometimento dos mecanismos reguladores de filtração e falência de bomba, evidenciado por edema periférico, congestão pulmonar incipiente e ortopneia.",
            isCorrect: true,
            whyCorrect: "Correto! A redução do débito cardíaco ativa o sistema renina-angiotensina-aldosterona gerando retenção hidrossalina crônica. O aumento da pré-carga extravasa para o interstício pulmonar e periférico, exigindo balanço hídrico rigoroso e diuréticos.",
            whyDistractor: null
          },
          {
            id: "B",
            title: "Débito Cardíaco Diminuído relacionado exclusivamente a hipovolemia absoluta por desidratação crônica evidenciada por sede.",
            isCorrect: false,
            whyCorrect: null,
            whyDistractor: "Erro Diagnóstico Grave: O paciente está com sobrecarga de volume intersticial (edema e congestão), e não em hipovolemia absoluta. Administrar volume aqui causaria edema agudo de pulmão fulminante."
          },
          {
            id: "C",
            title: "Troca de Gases Prejudicada decorrente exclusivamente de atelectasia lobar infecciosa com indicação imediata de aspiração brônquica.",
            isCorrect: false,
            whyCorrect: null,
            whyDistractor: "Confusão Etiológica: Os estertores em bases associados a ortopneia e edema em cardiopata são cardiogênicos (transudato capilar), e não pneumonia lobar primária bacteriana."
          },
          {
            id: "D",
            title: "Intolerância à Atividade decorrente de sarcopenia senil primária sem repercussão cardiopulmonar.",
            isCorrect: false,
            whyCorrect: null,
            whyDistractor: "Subestimação Clínica: A limitação funcional decorre da hipoxemia e sobrecarga hemodinâmica da insuficiência cardíaca descompensada, e não apenas de fraqueza muscular."
          }
        ]
      };

  // QUESTÃO 3: FARMACOLOGIA CLÍNICA, ELETRÓLITOS & IATROGENIA
  const q3 = {
    id: 3,
    category: "Farmacologia Clínica, Eletrólitos & Iatrogenia",
    questionStem: `O Paciente ${patientInitials} tem prescrição hospitalar de Furosemida 40mg IV de 12/12h e Enalapril 20mg VO de 12/12h. Durante o plantão matutino, você recebe o resultado de exames laboratoriais: Potássio sérico (K⁺) = 3,1 mEq/L (VR: 3,5 a 5,0) e Creatinina = 1,8 mg/dL. Qual é a conduta de enfermagem e o risco farmacoterapêutico crítico associado a esta associação medicamentosa?`,
    attendingTip: "Diuréticos de alça inibem o cotransportador Na-K-2Cl na alça de Henle, provocando espoliação massiva de potássio na urina, o que predispõe a arritmias cardíacas graves e potencializa toxicidade.",
    options: [
      {
        id: "A",
        title: "Identificar o risco iminente de arritmias cardíacas fatais induzidas por hipocalemia (K⁺ = 3,1 mEq/L), suspender temporariamente a administração da Furosemida até comunicação médica e checar no traçado eletrocardiográfico o prolongamento do intervalo QT ou ondas U.",
        isCorrect: true,
        whyCorrect: "Correto! A hipocalemia grave potencializa o automatismo cardíaco anômalo, desencadeando torsades de pointes e fibrilação ventricular. O enfermeiro deve alertar imediatamente a equipe para reposição IV guiada e ajuste do diurético.",
        whyDistractor: null
      },
      {
        id: "B",
        title: "Administrar a Furosemida em bolus rápido IV sem diluição e liberar dieta rica em sódio para compensar a perda renal.",
        isCorrect: false,
        whyCorrect: null,
        whyDistractor: "Dupla Iatrogenia: O bolus rápido de furosemida causa ototoxicidade irreversível (zumbido e surdez) e piora a hipocalemia crítica; dieta rica em sódio agrava a congestão cardíaca."
      },
      {
        id: "C",
        title: "Administrar cloreto de potássio concentrado a 19,1% diretamente em bolus intravenoso rápido na veia periférica para elevar o K⁺ rapidamente.",
        isCorrect: false,
        whyCorrect: null,
        whyDistractor: "ERRO FATAL (NUNCA FAZER): Cloreto de potássio IV em bolus causa parada cardíaca em assistolia imediata. Deve ser SEMPRE diluído em solução de infusão contínua em bomba e infundido lentamente com monitorização."
      },
      {
        id: "D",
        title: "Desconsiderar o valor de K⁺ de 3,1 mEq/L, pois o uso de Enalapril sempre neutraliza completamente as perdas eletrolíticas dos diuréticos em menos de 1 hora.",
        isCorrect: false,
        whyCorrect: null,
        whyDistractor: "Conhecimento Erróneo: Embora IECA retenha potássio a longo prazo, diuréticos de alça em fase aguda provocam quedas abruptas que superam o efeito retentor, mantendo o risco arritmogênico real."
      }
    ]
  };

  // QUESTÃO 4: SEGURANÇA DO PACIENTE & LEGISLAÇÃO ÉTICA (COFEN nº 736/2024 / LEI 7.498/86)
  const q4 = {
    id: 4,
    category: "Segurança do Paciente & Legislação Ética (COFEN)",
    questionStem: `O Paciente ${patientInitials} possui escore de Braden de ${bradenTotal} pontos (risco ${bradenTotal <= 14 ? "alto/moderado" : "presente"} de LPP), risco de queda (SAK = ${sakTotal}) e episódios de desorientação têmporo-espacial. Durante a passagem de plantão, o técnico de enfermagem relata que o paciente tentou sair do leito e pergunta se pode amarrá-lo na grade com ataduras de crepe. Conforme a Resolução COFEN nº 736/2024 e a Lei 7.498/86, qual é a decisão técnica e ético-legal privativa do enfermeiro?`,
    attendingTip: "A contenção mecânica é ato excepcional de emergência, regulamentada pelo COFEN com critérios estritos de prescrição, monitorização de perfusão e responsabilidade privativa do enfermeiro.",
    options: [
      {
        id: "A",
        title: "Não autorizar a contenção improvisada com ataduras de crepe; realizar avaliação clínica privativa, priorizar intervenções não farmacológicas (presença de familiar, reorientação verbal, iluminação adequada, abaixamento do leito), e, se estritamente necessária como último recurso de segurança física, aplicar dispositivo padronizado com prescrição privativa do enfermeiro e monitorização neurovascular distal documentada a cada 2 horas.",
        isCorrect: true,
        whyCorrect: "Correto! O COFEN determina que contenção mecânica é procedimento excepcional, jamais preventivo de rotina. Ataduras de crepe causam lesão tecidual por garroteamento e isquemia. O enfermeiro é o responsável técnico privativo pela prescrição e supervisão da perfusão.",
        whyDistractor: null
      },
      {
        id: "B",
        title: "Permitir que o técnico de enfermagem decida autonomamente o tipo e duração da amarração sem necessidade de prescrição ou evolução do enfermeiro.",
        isCorrect: false,
        whyCorrect: null,
        whyDistractor: "Infração Ética e Legal: O técnico de enfermagem não tem competência legal para prescrever contenções mecânicas. Trata-se de delegação ilegal de ato privativo com responsabilização do enfermeiro por negligência."
      },
      {
        id: "C",
        title: "Manter o paciente contido nos quatro membros por 24 horas consecutivas sem soltar os membros para evitar retrabalho da equipe de enfermagem.",
        isCorrect: false,
        whyCorrect: null,
        whyDistractor: "Violação Grave de Direitos e Iatrogenia: A contenção prolongada ininterrupta causa rabdomiólise, trombose venosa profunda (TVP), asfixia postural e necrose tecidual por pressão."
      },
      {
        id: "D",
        title: "Delegar a troca de curativo de lesão por pressão estágio 3 infectada e desbridamento autolítico ao técnico de enfermagem recém-admitido.",
        isCorrect: false,
        whyCorrect: null,
        whyDistractor: "Ilegalidade Assistencial: A avaliação tecidual, indicação de coberturas ativas e cuidados com feridas complexas (estágios 3 e 4) são atividades privativas do enfermeiro conforme pareceres normativos do COFEN."
      }
    ]
  };

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
