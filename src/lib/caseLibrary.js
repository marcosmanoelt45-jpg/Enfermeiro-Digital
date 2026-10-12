import { computeBradenTotal, computeCamPositive, computeAuditTotal, computeSakScore, computeGlobalRisk } from "./riskEngine";
import { generateRandomName, generateRandomAge } from "./sampleNames";

export const CASE_LIBRARY = [
  {
    id: "caso_1",
    title: "Idoso com Insuficiência Cardíaca Descompensada",
    category: "Cardiologia",
    difficulty: "critico",
    summary: "Paciente idoso admitido com dispneia em repouso, edema de MMII e crepitações pulmonares bilaterais.",
    patient: {
      name: "Seu Sebastião da Silva",
      age: 76,
      gender: "M",
      medical_history: "Hipertensão arterial sistêmica, insuficiência cardíaca crônica.",
      previous_diseases: "HAS, ICC FE reduzida (38%).",
      current_medications: "Carvedilol 12.5mg 12/12h, Enalapril 10mg 12/12h, Furosemida 40mg 1x/dia.",
      allergies: "Nenhuma conhecida.",
      previous_anamnesis: "Encaminhado da UPA com ganho de 4kg em 1 semana e piora progressiva da dispneia.",
      notes: "Aceitando dieta hipossódica. Acesso venoso em MSD."
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
    patient: {
      name: "Dona Maria Helena Santos",
      age: 62,
      gender: "F",
      medical_history: "Ex-tabagista (20 anos/maço), asma controlada.",
      previous_diseases: "Asma.",
      current_medications: "Salbutamol spray SOS, Formoterol + Budesonida.",
      allergies: "Dipirona (broncoespasmo).",
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
    patient: {
      name: "Dona Dirce de Oliveira",
      age: 82,
      gender: "F",
      medical_history: "Osteoartrose severa, declínio cognitivo leve.",
      previous_diseases: "Osteoporose, déficit cognitivo leve.",
      current_medications: "Cefazolina profilática, Enoxaparina 40mg, Tramadol 50mg.",
      allergies: "Penicilina.",
      previous_anamnesis: "Cirurgia transcorreu sem intercorrências. À noite apresentou agitação psicomotora.",
      notes: "Tenta puxar cateter venoso e sonda vesical."
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
    patient: {
      name: "Carlos Eduardo Souza",
      age: 27,
      gender: "M",
      medical_history: "Diabetes Mellitus Tipo 1 desde os 12 anos.",
      previous_diseases: "DM1.",
      current_medications: "Insulina Glargina 24UI, Insulina Lispro às refeições.",
      allergies: "Nenhuma conhecida.",
      previous_anamnesis: "Suspendeu insulina por 2 dias devido a gastroenterite aguda.",
      notes: "Glicemia capilar HI (> 500 mg/dL). Mucosas secas."
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
    patient: {
      name: "Antônia Pereira Lima",
      age: 79,
      gender: "F",
      medical_history: "Bexiga neurogênica, uso crônico de cateter vesical de demora.",
      previous_diseases: "AVC prévio com sequela motora esquerda, HAS.",
      current_medications: "Losartana 50mg, AAS 100mg.",
      allergies: "Sulfas.",
      previous_anamnesis: "Rebaixamento do sensório e prostração desde a manhã de hoje.",
      notes: "Iniciado protocolo institucional de sepse."
    },
    vitals: {
      pa_sistolica: 82,
      pa_diastolica: 48,
      fc: 128,
      fr: 26,
      tax: 38.9,
      sat: 91
    },
    braden: { perception: 2, moisture: 1, activity: 1, mobility: 1, nutrition: 2, friction: 1 },
    cam: { acute: true, inattention: true, disorganized: false, altered_loc: true },
    audit: {},
    sak: { disorientation: true, urination: true, walking: true, caregiver: true, postop: false, previous_falls: false, meds: 6 },
    caloi: { pain_intensity: 0, pain_location: [], pain_characteristics: [] }
  },
  {
    id: "caso_6",
    title: "Pós-Operatório Imediato de Apendicectomia",
    category: "Cirurgia",
    difficulty: "estavel",
    summary: "Jovem no 1º dia PO de apendicectomia videolaparoscópica, afebril, tolerando líquidos e deambulando.",
    patient: {
      name: "Lucas Ramos Martins",
      age: 23,
      gender: "M",
      medical_history: "Prévio hígido.",
      previous_diseases: "Nenhuma.",
      current_medications: "Dipirona 1g IV 6/6h, Cetoprofeno 100mg IV 12/12h.",
      allergies: "Nenhuma.",
      previous_anamnesis: "Dor em fossa ilíaca direita iniciada há 24h, operado com sucesso.",
      notes: "Feridas operatórias limpas e secas, sem sinais flogísticos."
    },
    vitals: {
      pa_sistolica: 118,
      pa_diastolica: 74,
      fc: 76,
      fr: 16,
      tax: 36.6,
      sat: 98
    },
    braden: { perception: 4, moisture: 4, activity: 3, mobility: 3, nutrition: 4, friction: 3 },
    cam: { acute: false, inattention: false, disorganized: false, altered_loc: false },
    audit: {},
    sak: { disorientation: false, urination: false, walking: false, caregiver: false, postop: true, previous_falls: false, meds: 2 },
    caloi: { pain_intensity: 3, pain_location: ["Abdômen - Incisões"], pain_characteristics: ["Pulsátil", "Localizada"] }
  }
];

export function buildAssessmentFromCase(c, patientId, patientName) {
  const bradenTotal = computeBradenTotal(c.braden || {});
  const camPositive = computeCamPositive(c.cam || {});
  const auditTotal = computeAuditTotal(c.audit || {});
  const sakScore = computeSakScore(c.sak || {});
  const caloiScore = Number(c.caloi?.pain_intensity || 0);

  const assessmentData = {
    ...c.vitals,
    braden_perception: c.braden?.perception || 4,
    braden_moisture: c.braden?.moisture || 4,
    braden_activity: c.braden?.activity || 4,
    braden_mobility: c.braden?.mobility || 4,
    braden_nutrition: c.braden?.nutrition || 4,
    braden_friction: c.braden?.friction || 4,
    braden_total: bradenTotal,
    cam_acute: Boolean(c.cam?.acute),
    cam_inattention: Boolean(c.cam?.inattention),
    cam_disorganized: Boolean(c.cam?.disorganized),
    cam_altered_loc: Boolean(c.cam?.altered_loc),
    cam_positive: camPositive,
    audit_total: auditTotal,
    sak_disorientation: Boolean(c.sak?.disorientation),
    sak_urination: Boolean(c.sak?.urination),
    sak_walking: Boolean(c.sak?.walking),
    sak_caregiver: Boolean(c.sak?.caregiver),
    sak_postop: Boolean(c.sak?.postop),
    sak_previous_falls: Boolean(c.sak?.previous_falls),
    sak_meds: Number(c.sak?.meds || 0),
    sak_score: sakScore,
    caloi_pain_intensity: caloiScore,
    caloi_pain_location: c.caloi?.pain_location || [],
    caloi_pain_characteristics: c.caloi?.pain_characteristics || [],
    caloi_score: caloiScore
  };

  const riskStatus = c.difficulty || computeGlobalRisk(assessmentData);

  return {
    patient_id: patientId,
    patient_name: patientName,
    ...assessmentData,
    risk_status: riskStatus,
    ai_status: "pending"
  };
}

export function generateRandomFullCase() {
  const rnd = CASE_LIBRARY[Math.floor(Math.random() * CASE_LIBRARY.length)];
  const randomPerson = generateRandomName();
  const randomAge = generateRandomAge(22, 85);

  return {
    ...rnd,
    id: "random_" + Date.now(),
    title: `Simulação de ${rnd.category} — ${randomPerson.name}`,
    patient: {
      ...rnd.patient,
      name: randomPerson.name,
      gender: randomPerson.gender,
      age: randomAge
    }
  };
}
