import { computeBradenTotal, computeCamPositive, computeAuditTotal, computeSakScore, computeGlobalRisk } from "./riskEngine";
import { generateRandomAge } from "./sampleNames";
import { anonymizePatientName } from "./dlpSanitizer";

export const CASE_LIBRARY = [
  {
    id: "caso_1",
    title: "Idoso com Insuficiência Cardíaca Descompensada",
    category: "Cardiologia",
    difficulty: "critico",
    summary: "Paciente idoso admitido com dispneia em repouso, edema de MMII 3+/4+ e crepitações pulmonares bilaterais.",
    isSimulated: true,
    learningObjectives: [
      "Identificar sinais clínicos de congestão sistêmica e pulmonar",
      "Correlacionar sobrecarga de volume com o débito cardíaco",
      "Priorizar intervenções imediatas de posicionamento e oxigenação"
    ],
    guidingQuestions: [
      "Quais achados da avaliação física indicam retenção hídrica aguda?",
      "Por que a posição de Fowler alta alivia o desconforto ventilatório neste paciente?",
      "Qual é a conduta privativa do enfermeiro diante da saturação de 89%?"
    ],
    patient: {
      name: "Paciente S. S. (Caso Simulado #101)",
      age: 76,
      gender: "M",
      medical_history: "Hipertensão arterial sistêmica, insuficiência cardíaca crônica.",
      previous_diseases: "HAS, ICC FE reduzida (38%).",
      current_medications: "Carvedilol 12.5mg 12/12h, Enalapril 10mg 12/12h, Furosemida 40mg 1x/dia.",
      allergies: "Nenhuma conhecida.",
      previous_anamnesis: "Encaminhado com ganho de 4kg em 1 semana e piora progressiva da dispneia.",
      notes: "Aceitando dieta hipossódica. Acesso venoso periférico em MSD."
    },
    vitals: {
      pa_sistolica: 160,
      pa_diastolica: 95,
      fc: 104,
      fr: 26,
      tax: 36.4,
      sat: 89
    },
    braden: { perception: 3, moisture: 3, activity: 2, mobility: 2, nutrition: 2, friction: 2 },
    cam: { acute: false, inattention: false, disorganized: false, altered_loc: false },
    audit: {},
    sak: { disorientation: false, urination: true, walking: true, caregiver: false, postop: false, previous_falls: true, meds: 6 },
    caloi: { pain_intensity: 0, pain_location: [], pain_characteristics: [] }
  },
  {
    id: "caso_2",
    title: "Pneumonia Comunitária Grave em Adulto",
    category: "Pneumologia",
    difficulty: "alerta",
    summary: "Paciente com febre alta persistente, tosse produtiva mucopurulenta e dor torácica ventilatório-dependente.",
    isSimulated: true,
    learningObjectives: [
      "Avaliar o padrão respiratório e mecânica ventilatória",
      "Identificar riscos de sepse pulmonar através do escore qSOFA",
      "Planejar cuidados de higiene brônquica e hidratação"
    ],
    guidingQuestions: [
      "Qual a repercussão da febre (38.6°C) na frequência cardíaca e no consumo de oxigênio?",
      "Como você classificaria a dor torácica tipo pleurítica na escala analógica?",
      "Quais cuidados de enfermagem evitam o agravamento da troca gasosa?"
    ],
    patient: {
      name: "Paciente M. H. S. (Caso Simulado #102)",
      age: 62,
      gender: "F",
      medical_history: "Ex-tabagista (20 anos/maço), asma controlada.",
      previous_diseases: "Asma.",
      current_medications: "Salbutamol spray SOS, Formoterol + Budesonida.",
      allergies: "Dipirona (broncoespasmo severo).",
      previous_anamnesis: "Quadro iniciado há 4 dias com calafrios e expectoração ferruginosa.",
      notes: "Em uso de máscara de O2 a 3 L/min."
    },
    vitals: {
      pa_sistolica: 110,
      pa_diastolica: 70,
      fc: 98,
      fr: 24,
      tax: 38.6,
      sat: 93
    },
    braden: { perception: 4, moisture: 3, activity: 3, mobility: 3, nutrition: 3, friction: 3 },
    cam: { acute: false, inattention: false, disorganized: false, altered_loc: false },
    audit: {},
    sak: { disorientation: false, urination: false, walking: false, caregiver: true, postop: false, previous_falls: false, meds: 4 },
    caloi: { pain_intensity: 5, pain_location: ["Tórax"], pain_characteristics: ["Pontada"] }
  },
  {
    id: "caso_3",
    title: "Delirium Hiperativo Pós-Operatório",
    category: "Neurologia",
    difficulty: "critico",
    summary: "Idosa em 2º dia pós-artroplastia de quadril com flutuação de nível de consciência, agitação e desorientação temporal.",
    isSimulated: true,
    learningObjectives: [
      "Aplicar e interpretar a escala CAM (Confusion Assessment Method)",
      "Distinguir delirium hiperativo de demência preexistente",
      "Prevenir eventos adversos graves como quedas e autoextubação/tração de cateteres"
    ],
    guidingQuestions: [
      "Quais fatores predisponentes e precipitantes deflagraram o delirium?",
      "Qual o risco associado ao uso de opioides (Tramadol) no sensório do idoso?",
      "Quais medidas não-farmacológicas de reorientação devem ser instituídas de imediato?"
    ],
    patient: {
      name: "Paciente D. O. (Caso Simulado #103)",
      age: 82,
      gender: "F",
      medical_history: "Osteoartrose severa, declínio cognitivo leve.",
      previous_diseases: "Osteoporose, déficit cognitivo leve.",
      current_medications: "Cefazolina profilática, Enoxaparina 40mg, Tramadol 50mg.",
      allergies: "Penicilina.",
      previous_anamnesis: "Cirurgia transcorreu sem intercorrências. À noite apresentou agitação psicomotora.",
      notes: "Tenta puxar cateter venoso periférico e sonda vesical."
    },
    vitals: {
      pa_sistolica: 145,
      pa_diastolica: 85,
      fc: 112,
      fr: 20,
      tax: 37.1,
      sat: 95
    },
    braden: { perception: 2, moisture: 2, activity: 1, mobility: 1, nutrition: 2, friction: 1 },
    cam: { acute: true, inattention: true, disorganized: true, altered_loc: true },
    audit: {},
    sak: { disorientation: true, urination: true, walking: true, caregiver: false, postop: true, previous_falls: true, meds: 7 },
    caloi: { pain_intensity: 7, pain_location: ["Quadril direito"], pain_characteristics: ["Contínua", "Latejante"] }
  },
  {
    id: "caso_4",
    title: "Cetoacidose Diabética em Adulto Jovem",
    category: "Endocrinologia",
    difficulty: "critico",
    summary: "Paciente com náuseas, vômitos profusos, hálito cetônico, respiração de Kussmaul e hiperglicemia acentuada.",
    isSimulated: true,
    learningObjectives: [
      "Reconhecer o padrão respiratório de Kussmaul como mecanismo compensatório acidótico",
      "Monitorar balanço hidreletrolítico e reposição volêmica estrita",
      "Compreender a dinâmica de infusão de insulina regular e risco de hipocalemia"
    ],
    guidingQuestions: [
      "Por que a frequência respiratória aumentou para 28 irpm com respirações profundas?",
      "Qual é o risco de administrar insulina rápida sem verificar o potássio sérico?",
      "Como estruturar os cuidados de controle glicêmico e hídrico a cada hora?"
    ],
    patient: {
      name: "Paciente C. E. S. (Caso Simulado #104)",
      age: 27,
      gender: "M",
      medical_history: "Diabetes Mellitus Tipo 1 desde os 12 anos.",
      previous_diseases: "DM1.",
      current_medications: "Insulina Glargina 24UI, Insulina Lispro às refeições.",
      allergies: "Nenhuma conhecida.",
      previous_anamnesis: "Suspendeu insulina por 2 dias devido a gastroenterite aguda.",
      notes: "Glicemia capilar HI (> 500 mg/dL). Mucosas secas, turgor cutâneo diminuído."
    },
    vitals: {
      pa_sistolica: 95,
      pa_diastolica: 60,
      fc: 124,
      fr: 28,
      tax: 36.8,
      sat: 97
    },
    braden: { perception: 3, moisture: 4, activity: 2, mobility: 2, nutrition: 2, friction: 2 },
    cam: { acute: false, inattention: false, disorganized: false, altered_loc: false },
    audit: {},
    sak: { disorientation: false, urination: true, walking: true, caregiver: true, postop: false, previous_falls: false, meds: 5 },
    caloi: { pain_intensity: 6, pain_location: ["Abdômen difuso"], pain_characteristics: ["Cólicas"] }
  },
  {
    id: "caso_5",
    title: "Choque Séptico de Foco Urinário",
    category: "Infectologia",
    difficulty: "critico",
    summary: "Paciente idosa com febre, hipotensão refratária a volume, taquicardia e urina turva e fétida em cateter.",
    isSimulated: true,
    learningObjectives: [
      "Reconhecer a tríade de choque séptico e perfusão periférica lentificada",
      "Gerenciar o pacote de 1 hora da sepse (lactato, hemoculturas, antibiótico, cristaloides)",
      "Avaliar o débito urinário horário como marcador pericial de perfusão renal"
    ],
    guidingQuestions: [
      "Quais sinais vitais indicam falência circulatória iminente?",
      "Qual a ordem correta entre coleta de culturas e infusão do antimicrobiano?",
      "Como calcular o gotejamento ou vazão em bomba de infusão para ressuscitação volêmica a 30 mL/kg?"
    ],
    patient: {
      name: "Paciente A. P. L. (Caso Simulado #105)",
      age: 79,
      gender: "F",
      medical_history: "Bexiga neurogênica, uso crônico de cateter vesical de demora.",
      previous_diseases: "AVC prévio com sequela motora esquerda, HAS.",
      current_medications: "Losartana 50mg, AAS 100mg.",
      allergies: "Nenhuma conhecida.",
      previous_anamnesis: "Urina turva e fétida há 48h, evoluindo com sonolência e calafrios.",
      notes: "Extremidades frias e tempo de enchimento capilar > 3 segundos. Débito urinário de apenas 15 mL nas últimas 2 horas."
    },
    vitals: {
      pa_sistolica: 82,
      pa_diastolica: 48,
      fc: 130,
      fr: 26,
      tax: 38.9,
      sat: 91
    },
    braden: { perception: 2, moisture: 1, activity: 1, mobility: 1, nutrition: 2, friction: 1 },
    cam: { acute: true, inattention: true, disorganized: false, altered_loc: true },
    audit: {},
    sak: { disorientation: true, urination: true, walking: true, caregiver: false, postop: false, previous_falls: true, meds: 6 },
    caloi: { pain_intensity: 0, pain_location: [], pain_characteristics: [] }
  },
  {
    id: "caso_6",
    title: "Bronquiolite Viral Aguda em Lactente",
    category: "Pediatria",
    difficulty: "alerta",
    summary: "Lactente de 6 meses com esforço respiratório acentuado, tiragem subcostal, batimento de asa de nariz e recusa alimentar.",
    isSimulated: true,
    learningObjectives: [
      "Reconhecer sinais precoces de insuficiência respiratória pediátrica",
      "Calcular dosagens ponderais de medicamentos em mL/kg",
      "Orientar a família quanto à posição de conforto e desobstrução de vias aéreas"
    ],
    guidingQuestions: [
      "Quais são os sinais objetivos de tiragem e fadiga respiratória em pediatria?",
      "Por que o batimento de asa de nariz é um sinal de alerta vermelho no lactente?",
      "Quais cuidados evitam broncoaspiração durante episódios de taquipneia?"
    ],
    patient: {
      name: "Lactente B. M. (Caso Simulado #106)",
      age: 1,
      gender: "M",
      medical_history: "Nascido a termo, sem internações anteriores.",
      previous_diseases: "Nenhuma.",
      current_medications: "Paracetamol gotas se febre.",
      allergies: "Nega.",
      previous_anamnesis: "Coriza e tosse há 3 dias, evoluindo com dificuldade para mamar e cansaço visual.",
      notes: "Tiragem subcostal evidente. Gemência expiratória intermitente."
    },
    vitals: {
      pa_sistolica: 85,
      pa_diastolica: 50,
      fc: 156,
      fr: 58,
      tax: 37.8,
      sat: 90
    },
    braden: { perception: 4, moisture: 3, activity: 3, mobility: 3, nutrition: 2, friction: 3 },
    cam: { acute: false, inattention: false, disorganized: false, altered_loc: false },
    audit: {},
    sak: { disorientation: false, urination: false, walking: false, caregiver: true, postop: false, previous_falls: false, meds: 1 },
    caloi: { pain_intensity: 4, pain_location: ["Tórax"], pain_characteristics: ["Desconforto"] }
  }
];

export function buildAssessmentFromCase(caseItem, patientId, patientName) {
  const braden_total = computeBradenTotal(caseItem.braden);
  const cam_positive = computeCamPositive(caseItem.cam);
  const audit_total = computeAuditTotal(caseItem.audit);
  const sak_score = computeSakScore(caseItem.sak);

  const risk_status = computeGlobalRisk({
    vitals: caseItem.vitals,
    braden_total,
    cam_positive,
    audit_total,
    sak_score,
    caloi_score: caseItem.caloi?.pain_intensity || 0,
    age: caseItem.patient.age
  });

  return {
    patient_id: patientId,
    patient_name: patientName,
    pa_sistolica: caseItem.vitals.pa_sistolica,
    pa_diastolica: caseItem.vitals.pa_diastolica,
    fc: caseItem.vitals.fc,
    fr: caseItem.vitals.fr,
    tax: caseItem.vitals.tax,
    sat: caseItem.vitals.sat,
    braden_perception: caseItem.braden.perception,
    braden_moisture: caseItem.braden.moisture,
    braden_activity: caseItem.braden.activity,
    braden_mobility: caseItem.braden.mobility,
    braden_nutrition: caseItem.braden.nutrition,
    braden_friction: caseItem.braden.friction,
    braden_total,
    cam_acute: caseItem.cam.acute,
    cam_inattention: caseItem.cam.inattention,
    cam_disorganized: caseItem.cam.disorganized,
    cam_altered_loc: caseItem.cam.altered_loc,
    cam_positive,
    audit_total,
    sak_disorientation: caseItem.sak.disorientation,
    sak_urination: caseItem.sak.urination,
    sak_walking: caseItem.sak.walking,
    sak_caregiver: caseItem.sak.caregiver,
    sak_postop: caseItem.sak.postop,
    sak_previous_falls: caseItem.sak.previous_falls,
    sak_meds: caseItem.sak.meds,
    sak_score,
    caloi_pain_intensity: caseItem.caloi?.pain_intensity || 0,
    caloi_pain_location: caseItem.caloi?.pain_location || [],
    caloi_pain_characteristics: caseItem.caloi?.pain_characteristics || [],
    risk_status,
    notes: `Caso simulado: ${caseItem.title}. ${caseItem.summary}`
  };
}

export function generateRandomFullCase() {
  const categories = ["Cardiologia", "Pneumologia", "Neurologia", "Endocrinologia", "Infectologia", "Pediatria"];
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  const randomAge = generateRandomAge();
  const idNumber = Math.floor(Math.random() * 900) + 100;
  const anonName = `Paciente Simulado #${idNumber}`;

  return {
    id: `caso_sim_${Date.now()}`,
    title: `Simulação Clínica: Caso #${idNumber} (${randomCategory})`,
    category: randomCategory,
    difficulty: Math.random() > 0.5 ? "critico" : "alerta",
    summary: `Cenário didático simulado para treino de raciocínio clínico diagnóstico e priorização de intervenções de enfermagem.`,
    isSimulated: true,
    patient: {
      name: anonName,
      age: randomAge,
      gender: Math.random() > 0.5 ? "M" : "F",
      medical_history: "Histórico clínico simulado para estudo.",
      previous_diseases: "Condição crônica em acompanhamento ambulatorial.",
      current_medications: "Medicações de rotina prescritas.",
      allergies: "Nenhuma conhecida.",
      previous_anamnesis: "Admitido na unidade de simulação para avaliação de enfermagem.",
      notes: "Caso didático gerado com dados sintéticos em conformidade com a LGPD."
    },
    vitals: {
      pa_sistolica: Math.floor(Math.random() * 60) + 100,
      pa_diastolica: Math.floor(Math.random() * 40) + 60,
      fc: Math.floor(Math.random() * 60) + 65,
      fr: Math.floor(Math.random() * 16) + 14,
      tax: Number((Math.random() * 2.5 + 36.2).toFixed(1)),
      sat: Math.floor(Math.random() * 10) + 90
    },
    braden: { perception: 3, moisture: 3, activity: 2, mobility: 2, nutrition: 3, friction: 2 },
    cam: { acute: false, inattention: false, disorganized: false, altered_loc: false },
    audit: {},
    sak: { disorientation: false, urination: true, walking: false, caregiver: true, postop: false, previous_falls: false, meds: 4 },
    caloi: { pain_intensity: Math.floor(Math.random() * 6), pain_location: ["Geral"], pain_characteristics: [] }
  };
}
