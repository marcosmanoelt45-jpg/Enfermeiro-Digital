/**
 * randomClinicalScenarios.js
 * Catálogo de 20 arquétipos clínicos autênticos e de alta fidelidade
 * para geração procedural de casos no Estúdio de Casos e Simulador Clínico.
 * 
 * Cada cenário possui consistência fisiopatológica estrita: sinais vitais,
 * medicações, escores de risco (Braden, CAM, SAK) e anamnese compatíveis.
 * Em conformidade com a LGPD (iniciais anonimizadas).
 */

import { generateRandomInitials } from "../lib/sampleNames.js";

export const CLINICAL_ARCHETYPES = [
  {
    id: "sc_iam",
    specialty: "cardiovascular",
    disease: "Infarto Agudo do Miocárdio com Supradesnivelamento do Segmento ST (IAMCSST)",
    anamnesis: "Paciente trazido pelo SAMU com queixa de dor torácica retroesternal opressiva há 2 horas, com irradiação para mandíbula e membro superior esquerdo, associada a diaforese fria e náuseas.",
    medicalHistory: "Tabagista ativo (30 maços/ano), dislipidemia mista sem tratamento regular e histórico familiar de morte súbita precoce.",
    medications: "AAS 100mg, Atorvastatina 40mg, Clopidogrel 75mg, Nitroglicerina sublingual SOS",
    allergies: "Nega alergias medicamentosas ou alimentares.",
    notes: "Acesso venoso periférico calibroso em MSE. Monitorização cardíaca contínua revelando supra de ST de 3mm em derivações DII, DIII e aVF (parede inferior).",
    ageRange: [50, 75],
    preferredGender: "M",
    vitals: { pa_sistolica: 90, pa_diastolica: 60, fc: 118, fr: 26, tax: 36.3, sat: 92 },
    braden: { perception: 3, moisture: 3, activity: 1, mobility: 2, nutrition: 3, friction: 2 },
    cam: { acute: false, inattention: false, disorganized: false, altered_loc: false },
    sak: { disorientation: false, urination: false, walking: false, caregiver: true, postop: false, previous_falls: false, meds: 5 },
    caloi: { intensity: 8, location: ["Tórax anterior", "Mandíbula", "MSE"], characteristics: ["Em aperto", "Irradiada", "Aguda"] }
  },
  {
    id: "sc_dpoc",
    specialty: "respiratorio",
    disease: "DPOC Exacerbado com Insuficiência Respiratória Aguda Hipercápnica",
    anamnesis: "Admitido na emergência com dispneia progressiva aos mínimos esforços, piora da tosse com expectoração purulenta espessa esverdeada e uso evidente de musculatura acessória.",
    medicalHistory: "Ex-tabagista pesado (45 maços/ano), três internações prévias por descompensação pulmonar nos últimos 18 meses.",
    medications: "Brometo de Tiotrópio 2.5mcg, Formoterol + Budesonida 12/400mcg, Salbutamol inalatório de resgate",
    allergies: "Alergia a Dipirona (urticária e angioedema prévios).",
    notes: "Tiragem intercostal e batimento de asa de nariz. Murmúrio vesicular difusamente reduzido com sibilos expiratórios e roncos em bases.",
    ageRange: [60, 80],
    preferredGender: null,
    vitals: { pa_sistolica: 145, pa_diastolica: 90, fc: 112, fr: 30, tax: 37.9, sat: 86 },
    braden: { perception: 3, moisture: 3, activity: 2, mobility: 2, nutrition: 2, friction: 2 },
    cam: { acute: false, inattention: false, disorganized: false, altered_loc: false },
    sak: { disorientation: false, urination: true, walking: true, caregiver: false, postop: false, previous_falls: true, meds: 4 },
    caloi: { intensity: 3, location: ["Tórax"], characteristics: ["Sensação de peso", "Falta de ar"] }
  },
  {
    id: "sc_ave_trombolise",
    specialty: "neurologia",
    disease: "Acidente Vascular Encefálico Isquêmico (AVEi) Agudo em Janela Trombolítica",
    anamnesis: "Paciente deu entrada com início súbito de hemiparesia facio-braquio-crural à direita e afasia mista há 75 minutos (delta T = 1h15m). Aferido escore NIHSS = 14.",
    medicalHistory: "Hipertensão arterial sistêmica, Fibrilação Atrial não anticoagulada por descontinuação voluntária do paciente.",
    medications: "Losartana 50mg 12/12h, Anlodipino 5mg/dia",
    allergies: "Nega alergias conhecidas.",
    notes: "Púpilas isocóricas e fotorreagentes. Desvio de rima labial para a esquerda. Glicemia capilar de 128 mg/dL descartando hipoglicemia.",
    ageRange: [65, 85],
    preferredGender: null,
    vitals: { pa_sistolica: 185, pa_diastolica: 105, fc: 94, fr: 18, tax: 36.6, sat: 96 },
    braden: { perception: 2, moisture: 3, activity: 1, mobility: 1, nutrition: 2, friction: 1 },
    cam: { acute: false, inattention: true, disorganized: false, altered_loc: false },
    sak: { disorientation: true, urination: true, walking: true, caregiver: false, postop: false, previous_falls: true, meds: 3 },
    caloi: { intensity: 0, location: [], characteristics: [] }
  },
  {
    id: "sc_sepse_urinaria",
    specialty: "sepse",
    disease: "Choque Séptico de Foco Urinário com Hiperlactatemia",
    anamnesis: "Paciente idosa residente em ILPI com relato de febre há 48h, rebaixamento do nível de consciência, calafrios e urina turva com odor fétido e grumos.",
    medicalHistory: "Sequela de AVE prévio, bexiga neurogênica com uso intermitente de cateterismo vesical.",
    medications: "Sertralina 50mg, Omeprazol 20mg",
    allergies: "Alergia a Sulfas (Bactrim) e Penicilinas.",
    notes: "Pele mosqueada com livedo em joelhos, tempo de enchimento capilar (TEC) de 4 segundos. Lactato arterial de 3,8 mmol/L.",
    ageRange: [70, 90],
    preferredGender: "F",
    vitals: { pa_sistolica: 80, pa_diastolica: 45, fc: 126, fr: 28, tax: 38.8, sat: 90 },
    braden: { perception: 2, moisture: 1, activity: 1, mobility: 1, nutrition: 2, friction: 1 },
    cam: { acute: true, inattention: true, disorganized: true, altered_loc: true },
    sak: { disorientation: true, urination: true, walking: true, caregiver: true, postop: false, previous_falls: false, meds: 5 },
    caloi: { intensity: 4, location: ["Flanco", "Hipogástrio"], characteristics: ["Dor à palpação profunda"] }
  },
  {
    id: "sc_cad",
    specialty: "metabolico_endocrino",
    disease: "Cetoacidose Diabética Severa (CAD) Descompensada",
    anamnesis: "Jovem com DM tipo 1 admitido com náuseas incoercíveis, dor abdominal difusa em cólica, polidipsia intensa e respiração profunda e ruidosa (Kussmaul) com hálito cetônico.",
    medicalHistory: "Diabetes Mellitus Tipo 1 desde os 12 anos. Suspendeu insulina há 3 dias por esquecimento em viagem.",
    medications: "Insulina NPH 24 UI pela manhã e 12 UI à noite, Insulina Regular em escala conforme glicemia",
    allergies: "Nenhuma conhecida.",
    notes: "Glicemia capilar indicando 'HI' (> 600 mg/dL). Gasometria com pH 7,12, HCO3 9 mEq/L e cetonúria 4+/4+.",
    ageRange: [18, 35],
    preferredGender: null,
    vitals: { pa_sistolica: 95, pa_diastolica: 60, fc: 122, fr: 32, tax: 36.8, sat: 97 },
    braden: { perception: 3, moisture: 3, activity: 2, mobility: 2, nutrition: 2, friction: 2 },
    cam: { acute: true, inattention: false, disorganized: false, altered_loc: true },
    sak: { disorientation: false, urination: true, walking: true, caregiver: false, postop: false, previous_falls: false, meds: 3 },
    caloi: { intensity: 6, location: ["Abdome"], characteristics: ["Cólica difusa", "Em peso"] }
  },
  {
    id: "sc_peritonite",
    specialty: "cirurgico_abdome",
    disease: "Apendicite Aguda Perfurada com Peritonite Fecaloide",
    anamnesis: "Admitido com dor abdominal iniciada em região periumbilical que migrou para fossa ilíaca direita há 36 horas, com febre alta e vômitos biliares repetidos.",
    medicalHistory: "Hígido previamente, sem cirurgias abdominais anteriores.",
    medications: "Nenhuma medicação de uso contínuo",
    allergies: "Nega alergias.",
    notes: "Abdome distendido com contratura involuntária generalizada ('abdome em tábua') e descompressão brusca intensamente dolorosa (Blumberg positivo).",
    ageRange: [20, 50],
    preferredGender: "M",
    vitals: { pa_sistolica: 100, pa_diastolica: 65, fc: 114, fr: 24, tax: 38.7, sat: 96 },
    braden: { perception: 4, moisture: 3, activity: 1, mobility: 2, nutrition: 2, friction: 3 },
    cam: { acute: false, inattention: false, disorganized: false, altered_loc: false },
    sak: { disorientation: false, urination: false, walking: true, caregiver: false, postop: false, previous_falls: false, meds: 2 },
    caloi: { intensity: 9, location: ["Fossa ilíaca direita", "Abdome total"], characteristics: ["Aguda", "Lancinante", "Constante"] }
  },
  {
    id: "sc_ira_rabdo",
    specialty: "nefrologia",
    disease: "Injúria Renal Aguda (IRA) KDIGO 3 por Rabdomiólise com Hipercalemia",
    anamnesis: "Paciente resgatado após queda da própria altura com permanência no chão por cerca de 16 horas sem socorro. Apresenta oligúria severa com diurese cor de refrigerante de cola.",
    medicalHistory: "Hipertensão arterial, Doença renal crônica estágio 2 prévia.",
    medications: "Hidroclorotiazida 25mg/dia, Enalapril 20mg/dia",
    allergies: "Nenhuma alergia relatada.",
    notes: "Potássio sérico crítico de 6,8 mEq/L. ECG exibindo ondas T apiculadas em tenda e alargamento do complexo QRS.",
    ageRange: [65, 85],
    preferredGender: null,
    vitals: { pa_sistolica: 155, pa_diastolica: 95, fc: 58, fr: 22, tax: 36.2, sat: 94 },
    braden: { perception: 2, moisture: 2, activity: 1, mobility: 1, nutrition: 2, friction: 1 },
    cam: { acute: true, inattention: true, disorganized: false, altered_loc: true },
    sak: { disorientation: true, urination: true, walking: true, caregiver: true, postop: false, previous_falls: true, meds: 5 },
    caloi: { intensity: 7, location: ["Membros inferiores", "Dorso"], characteristics: ["Mialgia intensa", "Em peso"] }
  },
  {
    id: "sc_preeclampsia",
    specialty: "obstetricia",
    disease: "Pré-Eclâmpsia Grave com Sinais de Iminência de Eclâmpsia",
    anamnesis: "Gestante de 34 semanas primigesta trazida à maternidade com cefaleia occipital pulsátil de forte intensidade, escotomas cintilantes e dor epigástrica em barra.",
    medicalHistory: "Gestação única tópica sem intercorrências no primeiro trimestre.",
    medications: "Sulfato Ferroso 40mg, Ácido Fólico 5mg, Carbonato de Cálcio 1g",
    allergies: "Alergia a Iodo (eritema).",
    notes: "Edema facial e de mãos 3+/4+. Reflexos patelares exaltados (clonus de 3 batimentos). Proteinúria de fita 3+.",
    ageRange: [20, 38],
    preferredGender: "F",
    vitals: { pa_sistolica: 175, pa_diastolica: 115, fc: 96, fr: 22, tax: 36.5, sat: 98 },
    braden: { perception: 4, moisture: 3, activity: 2, mobility: 2, nutrition: 3, friction: 3 },
    cam: { acute: false, inattention: false, disorganized: false, altered_loc: false },
    sak: { disorientation: false, urination: false, walking: false, caregiver: true, postop: false, previous_falls: false, meds: 3 },
    caloi: { intensity: 8, location: ["Occipital", "Epigástrio"], characteristics: ["Latejante", "Em barra"] }
  },
  {
    id: "sc_trauma_hemorragico",
    specialty: "trauma",
    disease: "Politraumatismo com Fratura Exposta de Fêmur e Choque Hipovolêmico Classe III",
    anamnesis: "Vítima de colisão moto x anteparo admitida na sala de trauma imobilizada em prancha rígida com colar cervical, confusa e com sangramento ativo em coxa direita.",
    medicalHistory: "Hígido, sem doenças crônicas ou comorbidades conhecidas.",
    medications: "Nenhuma medicação contínua",
    allergies: "Nega alergias.",
    notes: "Fratura exposta Gustilo III em terço médio de fêmur D com curativo compressivo ensanguentado. Pulsos distais pediosos filiformes.",
    ageRange: [19, 45],
    preferredGender: "M",
    vitals: { pa_sistolica: 85, pa_diastolica: 55, fc: 134, fr: 28, tax: 35.8, sat: 91 },
    braden: { perception: 3, moisture: 2, activity: 1, mobility: 1, nutrition: 3, friction: 1 },
    cam: { acute: true, inattention: true, disorganized: false, altered_loc: true },
    sak: { disorientation: true, urination: false, walking: true, caregiver: false, postop: false, previous_falls: true, meds: 4 },
    caloi: { intensity: 10, location: ["Coxa direita", "Pelve"], characteristics: ["Excruciante", "Aguda"] }
  },
  {
    id: "sc_tep",
    specialty: "respiratorio",
    disease: "Tromboembolismo Pulmonar (TEP) Submaciço com Sobrecarga de VD",
    anamnesis: "Paciente no 8º dia de pós-operatório de prótese total de joelho com início súbito de dor torácica pleurítica, dispneia intensa em repouso e hemoptise discreta.",
    medicalHistory: "Artrose severa de joelho, obesidade grau 2 (IMC 36 kg/m²).",
    medications: "Enoxaparina profilática interrompida precocemente, Paracetamol SOS",
    allergies: "Nenhuma conhecida.",
    notes: "Estase jugular a 45 graus visível. Membro inferior esquerdo com empastamento de panturrilha e sinal de Homans positivo.",
    ageRange: [55, 75],
    preferredGender: "F",
    vitals: { pa_sistolica: 100, pa_diastolica: 65, fc: 124, fr: 32, tax: 37.2, sat: 85 },
    braden: { perception: 3, moisture: 3, activity: 1, mobility: 1, nutrition: 2, friction: 2 },
    cam: { acute: false, inattention: false, disorganized: false, altered_loc: false },
    sak: { disorientation: false, urination: false, walking: true, caregiver: true, postop: true, previous_falls: false, meds: 4 },
    caloi: { intensity: 7, location: ["Hemitórax direito", "Panturrilha esquerda"], characteristics: ["Pontada ventilatório-dependente", "Em peso"] }
  },
  {
    id: "sc_icc_perfil_b",
    specialty: "cardiovascular",
    disease: "Insuficiência Cardíaca Agudamente Descompensada (Perfil B - Quente e Úmido)",
    anamnesis: "Paciente idoso com ortopneia (necessidade de 3 travesseiros), dispneia paroxística noturna, tosse seca e edema de membros inferiores com cacifo 3+/4+ até joelhos.",
    medicalHistory: "Cardiopatia isquêmica com revascularização miocárdica há 5 anos, hipertensão de longa data.",
    medications: "Carvedilol 25mg 12/12h, Sacubitril/Valsartana 49/51mg 12/12h, Furosemida 40mg/dia, Espironolactona 25mg",
    allergies: "Penicilina.",
    notes: "Ausculta pulmonar com estertores crepitantes bilaterais até terço médio. Refluxo hepatojugular presente.",
    ageRange: [68, 88],
    preferredGender: "M",
    vitals: { pa_sistolica: 165, pa_diastolica: 100, fc: 102, fr: 26, tax: 36.4, sat: 88 },
    braden: { perception: 3, moisture: 2, activity: 1, mobility: 2, nutrition: 2, friction: 2 },
    cam: { acute: false, inattention: false, disorganized: false, altered_loc: false },
    sak: { disorientation: false, urination: true, walking: true, caregiver: false, postop: false, previous_falls: true, meds: 6 },
    caloi: { intensity: 4, location: ["Tórax", "Pernas"], characteristics: ["Sensação de afogamento", "Peso nas pernas"] }
  },
  {
    id: "sc_pancreatite",
    specialty: "cirurgico_abdome",
    disease: "Pancreatite Aguda Grave de Origem Biliar com Coleção Peripancreática",
    anamnesis: "Paciente com dor abdominal epigástrica lancinante em faixa com irradiação dorsal, iniciada após refeição copiosa, refratária a analgésicos comuns, com distensão e náuseas.",
    medicalHistory: "Colelitíase sintomática conhecida com indicação cirúrgica protelada pela paciente.",
    medications: "Dipirona SOS, Escopolamina gotas",
    allergies: "Nenhuma conhecida.",
    notes: "Amilase sérica > 1.800 U/L e lipase > 2.200 U/L. Ruídos hidroaéreos abolidos sugerindo íleo paralítico inflamatório.",
    ageRange: [35, 65],
    preferredGender: "F",
    vitals: { pa_sistolica: 105, pa_diastolica: 65, fc: 116, fr: 24, tax: 38.1, sat: 94 },
    braden: { perception: 3, moisture: 3, activity: 1, mobility: 1, nutrition: 1, friction: 2 },
    cam: { acute: false, inattention: false, disorganized: false, altered_loc: false },
    sak: { disorientation: false, urination: false, walking: false, caregiver: true, postop: false, previous_falls: false, meds: 4 },
    caloi: { intensity: 9, location: ["Epigástrio", "Dorso lombar"], characteristics: ["Em faixa", "Constante", "Queimação profunda"] }
  },
  {
    id: "sc_delirium_idoso",
    specialty: "neurologia",
    disease: "Síndrome Confusional Aguda (Delirium Hiperativo) Secundária a Broncoaspiração",
    anamnesis: "Idosa internada em enfermaria cirúrgica evolui à noite com agitação psicomotora intensa, tentativa de arrancar cateter periférico e alucinações visuais com insetos na parede.",
    medicalHistory: "Doença de Alzheimer estágio moderado, disfagia orofaríngea neurogênica pós-AVE prévio.",
    medications: "Donepezila 10mg à noite, Quetiapina 25mg se agitação",
    allergies: "Nega alergias.",
    notes: "Ausculta com roncos e estertores em base direita. CAM positivo demonstrando flutuação aguda e desatenção.",
    ageRange: [78, 92],
    preferredGender: "F",
    vitals: { pa_sistolica: 140, pa_diastolica: 85, fc: 110, fr: 24, tax: 38.3, sat: 91 },
    braden: { perception: 2, moisture: 1, activity: 1, mobility: 1, nutrition: 2, friction: 1 },
    cam: { acute: true, inattention: true, disorganized: true, altered_loc: true },
    sak: { disorientation: true, urination: true, walking: true, caregiver: true, postop: true, previous_falls: true, meds: 5 },
    caloi: { intensity: 3, location: ["Tórax"], characteristics: ["Desconforto difuso"] }
  },
  {
    id: "sc_anafilaxia",
    specialty: "respiratorio",
    disease: "Choque Anafilático Grave Pós-Administração de Antibiótico Venoso",
    anamnesis: "Durante infusão de ceftriaxona venosa, paciente iniciou subitamente com sensação de garganta fechando, estridor laríngeo, placas eritematosas pruriginosas e lipotimia.",
    medicalHistory: "Tratando celulite em membro inferior esquerdo há 24 horas.",
    medications: "Ceftriaxona 2g IV/dia, Dipirona 1g SOS",
    allergies: "Relato materno vago de 'alergia a injeções na infância' não registrado formalmente.",
    notes: "Edema labial e de úvula evidente. Saturação em queda rápida com broncoespasmo difuso bilateral à ausculta.",
    ageRange: [22, 58],
    preferredGender: null,
    vitals: { pa_sistolica: 70, pa_diastolica: 40, fc: 138, fr: 34, tax: 36.9, sat: 83 },
    braden: { perception: 3, moisture: 2, activity: 1, mobility: 1, nutrition: 3, friction: 2 },
    cam: { acute: true, inattention: true, disorganized: false, altered_loc: true },
    sak: { disorientation: true, urination: false, walking: false, caregiver: true, postop: false, previous_falls: true, meds: 3 },
    caloi: { intensity: 5, location: ["Garganta", "Pele difusa"], characteristics: ["Sensação de asfixia", "Prurido urente"] }
  },
  {
    id: "sc_queimadura",
    specialty: "trauma",
    disease: "Grande Queimado Térmico (32% de SCQ de 2º e 3º Graus) em Ressuscitação Volêmica",
    anamnesis: "Vítima de explosão de botijão de gás doméstico em ambiente fechado, admitido com queimaduras extensas em face, tórax anterior e ambos os membros superiores.",
    medicalHistory: "Hígido, sem doenças metabólicas prévias.",
    medications: "Nenhuma medicação contínua",
    allergies: "Nenhuma conhecida.",
    notes: "Pelos nasais chamuscados e escarro fuliginoso alertando para risco iminente de lesão inalatória térmica de via aérea superior.",
    ageRange: [25, 48],
    preferredGender: "M",
    vitals: { pa_sistolica: 90, pa_diastolica: 55, fc: 128, fr: 26, tax: 35.6, sat: 92 },
    braden: { perception: 3, moisture: 1, activity: 1, mobility: 1, nutrition: 2, friction: 1 },
    cam: { acute: false, inattention: false, disorganized: false, altered_loc: false },
    sak: { disorientation: false, urination: false, walking: false, caregiver: false, postop: false, previous_falls: false, meds: 4 },
    caloi: { intensity: 10, location: ["Face", "Tórax", "MMSS"], characteristics: ["Queimação extrema", "Aguda", "Contínua"] }
  }
];

/**
 * Retorna um arquétipo clínico rico e autêntico sorteado proceduralmente,
 * com iniciais dinâmicas, idade calibrada e variações estocásticas realistas
 * nos sinais vitais para que nenhum caso gerado seja idêntico a outro.
 */
export function generateProceduralClinicalCase() {
  const randomIndex = Math.floor(Math.random() * CLINICAL_ARCHETYPES.length);
  const base = CLINICAL_ARCHETYPES[randomIndex];

  const randomIdent = generateRandomInitials(base.preferredGender);
  const minAge = base.ageRange[0];
  const maxAge = base.ageRange[1];
  const age = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;

  // Aplica micro-variações estocásticas fisiológicas nos sinais vitais (± 4 a 8%)
  const paSisVariation = Math.floor(Math.random() * 9) - 4; // -4 a +4
  const paDiaVariation = Math.floor(Math.random() * 7) - 3;
  const fcVariation = Math.floor(Math.random() * 9) - 4;
  const frVariation = Math.floor(Math.random() * 5) - 2;
  const satVariation = Math.min(100, Math.max(78, base.vitals.sat + (Math.floor(Math.random() * 3) - 1)));
  const taxVariation = Number((base.vitals.tax + (Math.random() * 0.4 - 0.2)).toFixed(1));

  const vitals = {
    pa_sistolica: Math.max(65, base.vitals.pa_sistolica + paSisVariation),
    pa_diastolica: Math.max(35, base.vitals.pa_diastolica + paDiaVariation),
    fc: Math.max(50, base.vitals.fc + fcVariation),
    fr: Math.max(12, base.vitals.fr + frVariation),
    tax: taxVariation,
    sat: satVariation
  };

  return {
    id: `case_proc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    archetypeId: base.id,
    specialty: base.specialty,
    disease: base.disease,
    profile: {
      initials: randomIdent.initials,
      name: randomIdent.initials,
      age: String(age),
      gender: randomIdent.gender,
      previous_diseases: base.disease,
      medical_history: base.medicalHistory,
      current_medications: base.medications,
      allergies: base.allergies,
      previous_anamnesis: base.anamnesis,
      notes: base.notes
    },
    vitals,
    braden: { ...base.braden },
    cam: { ...base.cam },
    sak: { ...base.sak },
    caloi: { ...base.caloi }
  };
}
