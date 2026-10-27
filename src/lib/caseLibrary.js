import { computeBradenTotal, computeCamPositive, computeAuditTotal, computeSakScore, computeGlobalRisk } from "./riskEngine.js";
import { generateRandomAge } from "./sampleNames.js";
import { generateProceduralClinicalCase } from "../data/randomClinicalScenarios.js";

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
    vitals: { pa_sistolica: 160, pa_diastolica: 95, fc: 104, fr: 26, tax: 36.4, sat: 89 },
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
    vitals: { pa_sistolica: 110, pa_diastolica: 70, fc: 98, fr: 24, tax: 38.6, sat: 93 },
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
    vitals: { pa_sistolica: 145, pa_diastolica: 85, fc: 112, fr: 20, tax: 37.1, sat: 95 },
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
    vitals: { pa_sistolica: 95, pa_diastolica: 60, fc: 124, fr: 28, tax: 36.8, sat: 97 },
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
    vitals: { pa_sistolica: 82, pa_diastolica: 48, fc: 130, fr: 26, tax: 38.9, sat: 91 },
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
    vitals: { pa_sistolica: 85, pa_diastolica: 50, fc: 156, fr: 58, tax: 37.8, sat: 90 },
    braden: { perception: 4, moisture: 3, activity: 3, mobility: 3, nutrition: 2, friction: 3 },
    cam: { acute: false, inattention: false, disorganized: false, altered_loc: false },
    audit: {},
    sak: { disorientation: false, urination: false, walking: false, caregiver: true, postop: false, previous_falls: false, meds: 1 },
    caloi: { pain_intensity: 4, pain_location: ["Tórax"], pain_characteristics: ["Desconforto"] }
  },
  {
    id: "caso_7",
    title: "AVC Isquêmico Agudo em Janela Terapêutica",
    category: "Neurologia",
    difficulty: "critico",
    summary: "Paciente masculino de 64 anos admitido com hemiparesia súbita à direita e afasia mista há 90 minutos.",
    isSimulated: true,
    learningObjectives: [
      "Aplicar a Escala Pré-Hospitalar de Cincinnati e apoiar a escala de NIHSS",
      "Controlar rigorosamente a pressão arterial antes e durante a trombólise",
      "Identificar sinais precoces de transformação hemorrágica"
    ],
    guidingQuestions: [
      "Qual é o tempo limite da janela terapêutica para infusão de trombolítico (Alteplase)?",
      "Por que a PA deve ser mantida estritamente abaixo de 185/110 mmHg?",
      "Quais cuidados de enfermagem são indispensáveis durante a infusão contínua em BIC?"
    ],
    patient: {
      name: "Paciente R. N. G. (Caso Simulado #107)",
      age: 64,
      gender: "M",
      medical_history: "Hipertensão mal controlada, fibrilação atrial sem anticoagulação.",
      previous_diseases: "HAS, FA paroxística.",
      current_medications: "Atenolol 50mg/dia.",
      allergies: "Nega.",
      previous_anamnesis: "Estava almoçando quando subitamente perdeu a força no braço direito e a fala travou.",
      notes: "Acesso calibroso em MSE. Monitorização multiparamétrica e TC de crânio sem contraste solicitada."
    },
    vitals: { pa_sistolica: 190, pa_diastolica: 115, fc: 88, fr: 18, tax: 36.5, sat: 96 },
    braden: { perception: 3, moisture: 4, activity: 1, mobility: 1, nutrition: 2, friction: 1 },
    cam: { acute: true, inattention: false, disorganized: false, altered_loc: false },
    audit: {},
    sak: { disorientation: true, urination: true, walking: true, caregiver: false, postop: false, previous_falls: false, meds: 5 },
    caloi: { pain_intensity: 0, pain_location: [], pain_characteristics: [] }
  },
  {
    id: "caso_8",
    title: "Infarto Agudo do Miocárdio com Supra de ST",
    category: "Cardiologia",
    difficulty: "critico",
    summary: "Paciente de 55 anos com dor precordial opressiva irradiada para mandíbula e MSE associada a sudorese fria há 40 minutos.",
    isSimulated: true,
    learningObjectives: [
      "Executar e interpretar o eletrocardiograma de 12 derivações em menos de 10 minutos (Porta-ECG)",
      "Instituir a terapia inicial e preparar o paciente para angioplastia primária",
      "Identificar arritmias ventriculares malignas na monitorização contínua"
    ],
    guidingQuestions: [
      "Quais medicações compõem a abordagem inicial padrão e quais são contraindicadas em infarto de VD?",
      "Por que a morfina deve ser usada com cautela e qual sua repercussão no débito cardíaco?",
      "Como orientar o paciente para reduzir o consumo miocárdico de oxigênio?"
    ],
    patient: {
      name: "Paciente J. C. F. (Caso Simulado #108)",
      age: 55,
      gender: "M",
      medical_history: "Tabagista ativo (30 anos/maço), dislipidemia, pai falecido de IAM aos 50 anos.",
      previous_diseases: "Dislipidemia mista.",
      current_medications: "Nenhuma de uso contínuo.",
      allergies: "Nega.",
      previous_anamnesis: "Início súbito de aperto retroesternal intenso após discussão familiar.",
      notes: "Pele pálida, sudorese pegajosa e náusea persistente."
    },
    vitals: { pa_sistolica: 155, pa_diastolica: 98, fc: 108, fr: 22, tax: 36.2, sat: 95 },
    braden: { perception: 4, moisture: 2, activity: 2, mobility: 2, nutrition: 3, friction: 2 },
    cam: { acute: false, inattention: false, disorganized: false, altered_loc: false },
    audit: {},
    sak: { disorientation: false, urination: false, walking: true, caregiver: false, postop: false, previous_falls: false, meds: 4 },
    caloi: { pain_intensity: 9, pain_location: ["Precórdio", "Mandíbula", "Braço E"], pain_characteristics: ["Opressão", "Queimação"] }
  },
  {
    id: "caso_9",
    title: "Pré-Eclâmpsia Grave com Iminência de Eclâmpsia",
    category: "Obstetrícia",
    difficulty: "critico",
    summary: "Primigesta de 34 semanas com PA 175/110 mmHg, cefaleia occipital pulsátil, escotomas cintilantes e hiperreflexia patelar.",
    isSimulated: true,
    learningObjectives: [
      "Reconhecer a síndrome de iminência de eclâmpsia e risco de convulsão tônico-clônica",
      "Administrar e monitorar a infusão de Sulfato de Magnésio (Esquema de Pritchard/Zuspan)",
      "Avaliar reflexo patelar, frequência respiratória e diurese para detecção de intoxicação magnesiana"
    ],
    guidingQuestions: [
      "Qual é o antídoto imediato do Sulfato de Magnésio que deve estar à beira-leito?",
      "Quais parâmetros obrigam a interrupção imediata da infusão de magnésio?",
      "Como manter o ambiente para redução de estímulos deflagradores de convulsão?"
    ],
    patient: {
      name: "Gestante L. M. T. (Caso Simulado #109)",
      age: 26,
      gender: "F",
      medical_history: "Primigesta, idade gestacional 34 semanas pelo ultrassom de 1º trimestre.",
      previous_diseases: "Sem comorbidades prévias.",
      current_medications: "Sulfato ferroso, ácido fólico.",
      allergies: "Nega.",
      previous_anamnesis: "Refere cefaleia refratária a analgésicos e visão com pontos brilhantes nas últimas 6h.",
      notes: "Edema de face e mãos 3+/4+. Fita urinária com proteinúria 3+."
    },
    vitals: { pa_sistolica: 175, pa_diastolica: 110, fc: 92, fr: 18, tax: 36.7, sat: 98 },
    braden: { perception: 4, moisture: 4, activity: 2, mobility: 2, nutrition: 3, friction: 3 },
    cam: { acute: false, inattention: false, disorganized: false, altered_loc: false },
    audit: {},
    sak: { disorientation: false, urination: false, walking: true, caregiver: true, postop: false, previous_falls: false, meds: 3 },
    caloi: { pain_intensity: 8, pain_location: ["Cabeça (Occipital)", "Epigástrio"], pain_characteristics: ["Pulsátil", "Barra"] }
  },
  {
    id: "caso_10",
    title: "Politrauma Grave por Colisão com Choque Hemorrágico",
    category: "Emergência / Trauma",
    difficulty: "critico",
    summary: "Vítima de colisão moto x caminhão admitida em prancha rígida com fratura exposta de fêmur e abdome distendido e doloroso.",
    isSimulated: true,
    learningObjectives: [
      "Aplicar a mnemônica XABCDE do trauma com controle imediato de hemorragias exsanguinantes",
      "Instalar acessos venosos periféricos calibrosos (Abocath 14G ou 16G) e protocolo de transfusão maciça",
      "Prevenir a Tríade Letal do Trauma (Hipotermia, Acidose e Coagulopatia)"
    ],
    guidingQuestions: [
      "Por que o torniquete ou curativo compressivo em X é prioridade absoluta antes do A?",
      "Quais são os sinais clínicos precoces do Choque Classe III segundo o ATLS?",
      "Quais cuidados preservam a integridade da coluna cervical durante a intubação orotraqueal?"
    ],
    patient: {
      name: "Paciente T. K. L. (Caso Simulado #110)",
      age: 23,
      gender: "M",
      medical_history: "Jovem hígido, motociclista sem histórico de patologias prévias.",
      previous_diseases: "Nenhuma.",
      current_medications: "Nenhuma.",
      allergies: "Desconhecida.",
      previous_anamnesis: "Colisão de alta energia cinemática há 30 minutos.",
      notes: "Fratura exposta grau III de fêmur direito com sangramento ativo e abdome tenso."
    },
    vitals: { pa_sistolica: 80, pa_diastolica: 45, fc: 138, fr: 32, tax: 35.4, sat: 91 },
    braden: { perception: 2, moisture: 3, activity: 1, mobility: 1, nutrition: 2, friction: 1 },
    cam: { acute: true, inattention: true, disorganized: false, altered_loc: true },
    audit: {},
    sak: { disorientation: true, urination: true, walking: true, caregiver: false, postop: false, previous_falls: false, meds: 6 },
    caloi: { pain_intensity: 10, pain_location: ["Fêmur D", "Abdômen", "Pelve"], pain_characteristics: ["Lancinante"] }
  },
  {
    id: "caso_11",
    title: "Grande Queimado em Fase Aguda de Ressuscitação",
    category: "Queimaduras",
    difficulty: "critico",
    summary: "Adulto jovem vítima de explosão de botijão de gás com queimaduras de 2º e 3º graus em 38% da superfície corporal.",
    isSimulated: true,
    learningObjectives: [
      "Calcular a Superfície Corporal Queimada (SCQ) pela Regra dos Nove de Wallace",
      "Aplicar a Fórmula de Parkland para reposição volêmica em 24 horas",
      "Monitorar diurese horária estrita com meta de 0,5 a 1,0 mL/kg/h em adultos"
    ],
    guidingQuestions: [
      "Qual o perigo imediato de queimaduras circunferenciais de tórax e membros?",
      "Por que metade do volume total de Ringer Lactato deve correr nas primeiras 8 horas a partir da hora do acidente?",
      "Quais sinais indicam lesão inalatória térmica exigindo intubação antes do edema de glote?"
    ],
    patient: {
      name: "Paciente F. R. S. (Caso Simulado #111)",
      age: 32,
      gender: "M",
      medical_history: "Trabalhador da construção civil sem doenças crônicas.",
      previous_diseases: "Nega.",
      current_medications: "Nega.",
      allergies: "Nega.",
      previous_anamnesis: "Explosão ocorrida há 1 hora em ambiente fechado. Cílios chamuscados e rouquidão.",
      notes: "Queimadura em tronco anterior, membros superiores bilaterais e face. Peso estimado: 70 kg."
    },
    vitals: { pa_sistolica: 100, pa_diastolica: 60, fc: 122, fr: 24, tax: 35.8, sat: 94 },
    braden: { perception: 3, moisture: 1, activity: 1, mobility: 1, nutrition: 2, friction: 1 },
    cam: { acute: false, inattention: false, disorganized: false, altered_loc: false },
    audit: {},
    sak: { disorientation: false, urination: true, walking: true, caregiver: true, postop: false, previous_falls: false, meds: 6 },
    caloi: { pain_intensity: 9, pain_location: ["Tórax", "Braços", "Face"], pain_characteristics: ["Queimação extrema"] }
  },
  {
    id: "caso_12",
    title: "Crise Vaso-Oclusiva em Anemia Falciforme",
    category: "Hematologia",
    difficulty: "alerta",
    summary: "Jovem de 19 anos com anemia falciforme admitido com dor óssea dilacerante em membros inferiores e tórax após infecção viral.",
    isSimulated: true,
    learningObjectives: [
      "Compreender a fisiopatologia da falcização das hemácias deflagrada por hipóxia, frio ou desidratação",
      "Manejar analgesia multimodal escalonada rápida com opioides fortes (protocolo de dor aguda)",
      "Vigiar sinais de Síndrome Torácica Aguda (infiltrado novo, febre e queda de SatO2)"
    ],
    guidingQuestions: [
      "Por que a hidratação venosa criteriosa sem sobrecarga reduz a viscosidade sanguínea?",
      "Qual o papel da oxigenoterapia mesmo em pacientes com saturação basal limítrofe?",
      "Quais cuidados na administração de morfina previnem sedação excessiva e depressão respiratória?"
    ],
    patient: {
      name: "Paciente W. A. P. (Caso Simulado #112)",
      age: 19,
      gender: "M",
      medical_history: "Anemia falciforme (HbSS) com histórico de múltiplas crises e colecistectomia aos 14 anos.",
      previous_diseases: "Doença falciforme homozigótica.",
      current_medications: "Hidroxiureia 1000mg/dia, Ácido Fólico 5mg/dia.",
      allergies: "Nega.",
      previous_anamnesis: "Resfriado há 2 dias, evoluindo hoje com dores insuportáveis em fêmures e arcos costais.",
      notes: "Icterícia conjuntival 2+/4+. Palidez cutâneo-mucosa evidente."
    },
    vitals: { pa_sistolica: 115, pa_diastolica: 75, fc: 110, fr: 22, tax: 37.9, sat: 92 },
    braden: { perception: 4, moisture: 3, activity: 2, mobility: 2, nutrition: 3, friction: 3 },
    cam: { acute: false, inattention: false, disorganized: false, altered_loc: false },
    audit: {},
    sak: { disorientation: false, urination: false, walking: true, caregiver: true, postop: false, previous_falls: false, meds: 5 },
    caloi: { pain_intensity: 10, pain_location: ["Membros inferiores", "Arcos costais"], pain_characteristics: ["Pontada profunda", "Ossos quebrando"] }
  },
  {
    id: "caso_13",
    title: "Hemorragia Digestiva Alta por Varizes Esofágicas",
    category: "Gastroenterologia",
    difficulty: "critico",
    summary: "Paciente cirrótico com hematêmese volumosa, melena, palidez acentuada e sudorese fria em choque hipovolêmico.",
    isSimulated: true,
    learningObjectives: [
      "Priorizar cuidados de proteção das vias aéreas contra broncoaspiração de sangue vivo",
      "Executar reposição volêmica imediata e administração de vasoconstritores esplâncnicos (Octreotida/Terlipressina)",
      "Auxiliar na passagem e manutenção do Balão de Sengstaken-Blakemore se sangramento incoercível"
    ],
    guidingQuestions: [
      "Qual a posição do leito mais segura para evitar broncoaspiração durante vômitos com sangue vivo?",
      "Por que a sonda nasogástrica comum deve ser evitada ou passada com extrema cautela neste caso?",
      "Como monitorar a pressão dos balonetes gástrico e esofágico do Sengstaken para evitar necrose?"
    ],
    patient: {
      name: "Paciente G. B. L. (Caso Simulado #113)",
      age: 51,
      gender: "M",
      medical_history: "Cirrose hepática por álcool Child-Pugh B, histórico de varizes esofágicas de médio calibre.",
      previous_diseases: "Cirrose, hipertensão portal.",
      current_medications: "Propranolol 40mg 12/12h, Espironolactona 100mg/dia.",
      allergies: "Nega.",
      previous_anamnesis: "Apresentou 3 episódios de hematêmese volumosa nas últimas 2 horas com síncope.",
      notes: "Aranha vasculares em tórax, ascite moderada e pele fria e pegajosa."
    },
    vitals: { pa_sistolica: 78, pa_diastolica: 42, fc: 134, fr: 26, tax: 36.1, sat: 90 },
    braden: { perception: 2, moisture: 2, activity: 1, mobility: 1, nutrition: 2, friction: 1 },
    cam: { acute: true, inattention: true, disorganized: false, altered_loc: true },
    audit: {},
    sak: { disorientation: true, urination: true, walking: true, caregiver: false, postop: false, previous_falls: true, meds: 6 },
    caloi: { pain_intensity: 3, pain_location: ["Epigástrio"], pain_characteristics: ["Queimação"] }
  },
  {
    id: "caso_14",
    title: "Insuficiência Renal Aguda com Hipercalemia Crítica",
    category: "Nefrologia",
    difficulty: "critico",
    summary: "Paciente com DRC oligúrico apresentando potássio sérico de 7,4 mEq/L e alterações eletrocardiográficas com onda T apiculada.",
    isSimulated: true,
    learningObjectives: [
      "Reconhecer alterações eletrocardiográficas da hipercalemia (onda T tendada, perda de onda P, alargamento de QRS)",
      "Administrar Gluconato de Cálcio 10% para estabilização de membrana miocárdica em menos de 5 minutos",
      "Instalar solução polarizante (Glicose + Insulina Regular) e resinas de troca iônica"
    ],
    guidingQuestions: [
      "O Gluconato de Cálcio reduz o potássio sérico ou apenas protege o miocárdio contra parada cardíaca?",
      "Como preparar e infundir a solução polarizante com segurança prevenindo hipoglicemia?",
      "Quais cuidados na fístula arteriovenosa (FAV) devem ser mantidos durante a urgência dialítica?"
    ],
    patient: {
      name: "Paciente E. R. M. (Caso Simulado #114)",
      age: 69,
      gender: "F",
      medical_history: "Diabetes Mellitus de longa data, DRC estágio 4, nefropatia diabética.",
      previous_diseases: "DM2, HAS, DRC.",
      current_medications: "Insulina NPH, Losartana 100mg, Furosemida 80mg.",
      allergies: "Nega.",
      previous_anamnesis: "Ficou anúrica nas últimas 24h após uso inadvertido de anti-inflamatório (Diclofenaco).",
      notes: "Fraqueza muscular intensa em membros inferiores e parestesias peri-orais."
    },
    vitals: { pa_sistolica: 170, pa_diastolica: 100, fc: 52, fr: 20, tax: 36.4, sat: 94 },
    braden: { perception: 3, moisture: 3, activity: 1, mobility: 1, nutrition: 2, friction: 2 },
    cam: { acute: false, inattention: false, disorganized: false, altered_loc: false },
    audit: {},
    sak: { disorientation: false, urination: true, walking: true, caregiver: true, postop: false, previous_falls: true, meds: 6 },
    caloi: { pain_intensity: 2, pain_location: ["Membros inferiores"], pain_characteristics: ["Parestesia"] }
  },
  {
    id: "caso_15",
    title: "Abdome Agudo Perfurativo por Úlcera Gástrica",
    category: "Cirurgia Geral",
    difficulty: "critico",
    summary: "Homem de 48 anos com dor abdominal súbita de início em pontada 'como facada', abdome em tábua e descompressão brusca positiva.",
    isSimulated: true,
    learningObjectives: [
      "Identificar sinais de peritonite generalizada e pneumoperitônio à beira-leito",
      "Executar descompressão gástrica com sonda nasogástrica calibrosa aberta em frasco",
      "Preparar o paciente em caráter emergencial para laparotomia exploradora"
    ],
    guidingQuestions: [
      "O que significa o sinal de Blumberg e o abdome com contratura involuntária em tábua?",
      "Por que analgésicos opioides fortes não devem ser retidos após o diagnóstico médico estabelecido?",
      "Quais precauções de jejum absoluto e reposição hidroeletrolítica vigorosa devem ser iniciadas?"
    ],
    patient: {
      name: "Paciente M. V. A. (Caso Simulado #115)",
      age: 48,
      gender: "M",
      medical_history: "Uso abusivo de AINEs para dor lombar crônica, tabagista e etilista.",
      previous_diseases: "Gastrite erosiva prévia não tratada.",
      current_medications: "Ibuprofeno 600mg diário.",
      allergies: "Nega.",
      previous_anamnesis: "Dor iniciada há 2 horas com intensidade máxima súbita no epigástrio, generalizando-se para todo o abdome.",
      notes: "Paciente imóvel no leito, com flexão das pernas para reduzir a tensão parietal."
    },
    vitals: { pa_sistolica: 100, pa_diastolica: 60, fc: 118, fr: 26, tax: 38.2, sat: 95 },
    braden: { perception: 4, moisture: 3, activity: 1, mobility: 1, nutrition: 3, friction: 2 },
    cam: { acute: false, inattention: false, disorganized: false, altered_loc: false },
    audit: {},
    sak: { disorientation: false, urination: false, walking: false, caregiver: false, postop: false, previous_falls: false, meds: 4 },
    caloi: { pain_intensity: 10, pain_location: ["Abdômen difuso"], pain_characteristics: ["Como facada", "Contínua"] }
  },
  {
    id: "caso_16",
    title: "Tromboembolismo Pulmonar Maciço Pós-Cirúrgico",
    category: "Cuidados Críticos",
    difficulty: "critico",
    summary: "Paciente no 3º DPO de cirurgia ortopédica com dispneia súbita, dor torácica pleurítica, taquipneia severa e dessaturação.",
    isSimulated: true,
    learningObjectives: [
      "Reconhecer o quadro agudo de TEP com repercussão hemodinâmica e dilatação aguda do ventrículo direito",
      "Instalar suporte imediato de oxigênio de alto fluxo e monitorização com capnografia",
      "Monitorar infusão de heparina não fracionada em BIC guiada pelo TTPA a cada 6 horas"
    ],
    guidingQuestions: [
      "Qual a correlação entre imobilidade prolongada no pós-operatório e trombose venosa profunda (Tríade de Virchow)?",
      "Por que a queda do débito urinário e a hipotensão súbita definem TEP maciço de alto risco?",
      "Quais cuidados na punção arterial para gasometria devem ser adotados em paciente sob anticoagulação plena?"
    ],
    patient: {
      name: "Paciente P. T. C. (Caso Simulado #116)",
      age: 58,
      gender: "M",
      medical_history: "Pós-operatório de prótese total de joelho esquerdo, obesidade grau 2 (IMC 36).",
      previous_diseases: "Varizes de membros inferiores.",
      current_medications: "Profilaxia mecânica com meias elásticas, analgesia comum.",
      allergies: "Nega.",
      previous_anamnesis: "Ao tentar levantar para ir ao banheiro pela primeira vez, apresentou tontura e falta de ar súbita extrema.",
      notes: "Panturrilha esquerda com edema assimétrico de 4 cm em relação à direita e dor à dorsiflexão (Sinal de Homans positivo)."
    },
    vitals: { pa_sistolica: 85, pa_diastolica: 55, fc: 126, fr: 30, tax: 36.5, sat: 86 },
    braden: { perception: 3, moisture: 3, activity: 1, mobility: 1, nutrition: 2, friction: 1 },
    cam: { acute: true, inattention: false, disorganized: false, altered_loc: false },
    audit: {},
    sak: { disorientation: false, urination: true, walking: true, caregiver: false, postop: true, previous_falls: true, meds: 6 },
    caloi: { pain_intensity: 7, pain_location: ["Tórax D", "Panturrilha E"], pain_characteristics: ["Pleurítica", "Peso"] }
  },
  {
    id: "caso_17",
    title: "Intoxicação Exógena Aguda por Organofosforados",
    category: "Toxicologia",
    difficulty: "critico",
    summary: "Trabalhador rural trazido inconsciente com sialorreia abundante, broncorreia, miose puntiforme e fasciculações musculares.",
    isSimulated: true,
    learningObjectives: [
      "Identificar os sinais da Síndrome Colinérgica aguda (DUMBELS: Diarreia, Urina, Miose, Bradicardia, Broncorreia, Êmese, Lacrimejamento, Salivação)",
      "Realizar a descontaminação cutânea imediata retirando roupas contaminadas com proteção individual da equipe (EPI)",
      "Administrar Atropina em doses repetidas dobradas guiada pelo parâmetro clínico de secagem dos pulmões"
    ],
    guidingQuestions: [
      "Por que a equipe de saúde deve usar avental impermeável e luvas nitrílicas antes de tocar no paciente?",
      "Qual é o objetivo terapêutico da atropinização e quando parar de administrar?",
      "Por que a lavagem gástrica deve ser avaliada com extremo critério de tempo e proteção de via aérea?"
    ],
    patient: {
      name: "Paciente L. C. M. (Caso Simulado #117)",
      age: 41,
      gender: "M",
      medical_history: "Agricultor sem doenças prévias, manipulação de defensivos agrícolas sem EPI.",
      previous_diseases: "Nenhuma.",
      current_medications: "Nenhuma.",
      allergies: "Nega.",
      previous_anamnesis: "Encontrado caído na lavoura com odor químico pungente há cerca de 45 minutos.",
      notes: "Secreção fluida abundante saindo pelo nariz e boca. Pupilas puntiformes arreativas (miose)."
    },
    vitals: { pa_sistolica: 90, pa_diastolica: 50, fc: 44, fr: 28, tax: 35.6, sat: 84 },
    braden: { perception: 1, moisture: 1, activity: 1, mobility: 1, nutrition: 1, friction: 1 },
    cam: { acute: true, inattention: true, disorganized: true, altered_loc: true },
    audit: {},
    sak: { disorientation: true, urination: true, walking: true, caregiver: false, postop: false, previous_falls: true, meds: 5 },
    caloi: { pain_intensity: 0, pain_location: [], pain_characteristics: [] }
  },
  {
    id: "caso_18",
    title: "Cuidados Paliativos Oncológicos em Fase Final de Vida",
    category: "Cuidados Paliativos",
    difficulty: "alerta",
    summary: "Paciente idosa com neoplasia de mama metastática em respiração ruidosa (estertor da morte), dor e agitação psicomotora terminal.",
    isSimulated: true,
    learningObjectives: [
      "Manejar o estertor de fim de vida com medidas posturais (decúbito lateral) e anticolinérgicos sem aspiração traqueal agressiva",
      "Controlar a dor e o desconforto respiratório via subcutânea contínua (hipodermóclise)",
      "Oferecer acolhimento, escuta ativa e suporte emocional empático à família à beira-leito"
    ],
    guidingQuestions: [
      "Por que a aspiração traqueal profunda é desaconselhada no paciente em últimas horas de vida?",
      "Como orientar a família de que o estertor não causa sofrimento ou asfixia na paciente em coma terminal?",
      "Quais medicações podem ser associadas com segurança na mesma via de hipodermóclise?"
    ],
    patient: {
      name: "Paciente C. M. R. (Caso Simulado #118)",
      age: 77,
      gender: "F",
      medical_history: "Câncer de mama com metástases ósseas e pulmonares múltiplas, em plano de cuidados exclusivos de conforto.",
      previous_diseases: "Neoplasia avançada.",
      current_medications: "Morfina SC contínua, Midazolam SOS, Hioscina (Butilescopolamina) SC.",
      allergies: "Nega.",
      previous_anamnesis: "Evolução natural de declínio funcional (PPS 20%). A família está reunida no quarto.",
      notes: "Acesso por hipodermóclise em região deltoide esquerda. Pele marmórea em extremidades distais."
    },
    vitals: { pa_sistolica: 75, pa_diastolica: 40, fc: 64, fr: 10, tax: 35.2, sat: 82 },
    braden: { perception: 1, moisture: 2, activity: 1, mobility: 1, nutrition: 1, friction: 1 },
    cam: { acute: true, inattention: true, disorganized: true, altered_loc: true },
    audit: {},
    sak: { disorientation: true, urination: true, walking: true, caregiver: true, postop: false, previous_falls: true, meds: 4 },
    caloi: { pain_intensity: 3, pain_location: ["Ossos generalizados"], pain_characteristics: ["Contínua"] }
  },
  {
    id: "caso_19",
    title: "Choque Anafilático Pós-Antibiótico Intravenoso",
    category: "Emergência / Alergia",
    difficulty: "critico",
    summary: "Paciente desenvolve subitamente placas eritematosas pruriginosas, estridor laríngeo, broncoespasmo e hipotensão 5 minutos após infusão de Ceftriaxona.",
    isSimulated: true,
    learningObjectives: [
      "Interromper imediatamente a infusão do alérgeno sem perder o acesso venoso",
      "Administrar Epinefrina (Adrenalina) 1:1.000 intramuscular na face anterolateral da coxa sem demora",
      "Posicionar em decúbito dorsal com membros inferiores elevados e instituir oxigênio com fração inspirada máxima"
    ],
    guidingQuestions: [
      "Por que a epinefrina IM é a droga de 1ª linha insubstituível e corticoides/anti-histamínicos são apenas 2ª linha tardia?",
      "Qual é o perigo de tentar administrar adrenalina intravenosa direta em bólus não titulado?",
      "Qual o período mínimo de observação hospitalar pelo risco de reação bifásica?"
    ],
    patient: {
      name: "Paciente E. S. K. (Caso Simulado #119)",
      age: 38,
      gender: "F",
      medical_history: "Internada para tratamento de pielonefrite aguda sem histórico de atopia prévia.",
      previous_diseases: "Nenhuma conhecida.",
      current_medications: "Ceftriaxona 1g EV (primeira dose recém-iniciada).",
      allergies: "Negou na admissão.",
      previous_anamnesis: "Cinco minutos após o início do gotejamento, queixou-se de 'garganta fechando' e calor facial intenso.",
      notes: "Edema labial e periorbitário evidente com tiragem supraesternal e estridor audível sem estetoscópio."
    },
    vitals: { pa_sistolica: 70, pa_diastolica: 40, fc: 142, fr: 34, tax: 36.6, sat: 87 },
    braden: { perception: 3, moisture: 2, activity: 2, mobility: 2, nutrition: 3, friction: 3 },
    cam: { acute: true, inattention: false, disorganized: false, altered_loc: false },
    audit: {},
    sak: { disorientation: false, urination: false, walking: true, caregiver: false, postop: false, previous_falls: false, meds: 4 },
    caloi: { pain_intensity: 6, pain_location: ["Garganta", "Tórax"], pain_characteristics: ["Aperto e sufocamento"] }
  },
  {
    id: "caso_20",
    title: "Crise Tireotóxica / Tempestade Tireoidiana",
    category: "Endocrinologia / UTI",
    difficulty: "critico",
    summary: "Paciente com Doença de Graves descompensada apresentando febre de 40,2°C, taquiarritmia supraventricular a 168 bpm, náuseas e delírios.",
    isSimulated: true,
    learningObjectives: [
      "Calcular o Escore de Burch-Wartofsky para confirmação de tempestade tireoidiana",
      "Instituir resfriamento corporal ativo com medidas físicas e evitar o uso de salicilatos (AAS)",
      "Coordenar a terapia quadrupla sequencial: betabloqueador, tionamida (PTU), iodo inorgânico e glicocorticoide"
    ],
    guidingQuestions: [
      "Por que o AAS é formalmente contraindicado para baixar a temperatura nesta emergência tireoidiana?",
      "Qual o intervalo de tempo obrigatório entre a administração do PTU e as gotas de Lugol?",
      "Quais cuidados na monitorização contínua do ritmo cardíaco evitam parada por colapso cardiovascular?"
    ],
    patient: {
      name: "Paciente V. R. F. (Caso Simulado #120)",
      age: 35,
      gender: "F",
      medical_history: "Diagnóstico de hipertireoidismo por Doença de Graves há 1 ano, interrompeu uso de metimazol há 1 mês.",
      previous_diseases: "Doença de Graves, bócio difuso.",
      current_medications: "Uso irregular de Tapazol.",
      allergies: "Nega.",
      previous_anamnesis: "Teve infecção dentária há 3 dias e evoluiu com prostração, agitação extrema e palpitações intensas.",
      notes: "Exoftalmia evidente, tremor fino de extremidades e pele intensamente quente e hiperemiada."
    },
    vitals: { pa_sistolica: 168, pa_diastolica: 68, fc: 168, fr: 28, tax: 40.2, sat: 96 },
    braden: { perception: 2, moisture: 1, activity: 1, mobility: 1, nutrition: 2, friction: 1 },
    cam: { acute: true, inattention: true, disorganized: true, altered_loc: true },
    audit: {},
    sak: { disorientation: true, urination: true, walking: true, caregiver: false, postop: false, previous_falls: true, meds: 6 },
    caloi: { pain_intensity: 5, pain_location: ["Pescoço", "Tórax"], pain_characteristics: ["Palpitações angustiantes"] }
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
  const proc = generateProceduralClinicalCase();
  const categoryMap = {
    cardiovascular: "Cardiologia",
    respiratorio: "Pneumologia",
    neurologia: "Neurologia",
    metabolico_endocrino: "Endocrinologia",
    sepse: "Infectologia",
    cirurgico_abdome: "Cirurgia",
    nefrologia: "Nefrologia",
    obstetricia: "Obstetrícia",
    trauma: "Trauma"
  };

  const categoryName = categoryMap[proc.specialty] || "Geral";

  return {
    id: proc.id,
    title: `${proc.disease} (${proc.profile.initials})`,
    category: categoryName,
    difficulty: proc.vitals.sat < 90 || proc.vitals.pa_sistolica < 90 || proc.caloi.intensity >= 8 ? "critico" : "alerta",
    summary: proc.profile.previous_anamnesis,
    isSimulated: true,
    patient: {
      name: `Paciente ${proc.profile.initials}`,
      age: Number(proc.profile.age),
      gender: proc.profile.gender,
      medical_history: proc.profile.medical_history,
      previous_diseases: proc.profile.previous_diseases,
      current_medications: proc.profile.current_medications,
      allergies: proc.profile.allergies,
      previous_anamnesis: proc.profile.previous_anamnesis,
      notes: proc.profile.notes
    },
    vitals: { ...proc.vitals },
    braden: { ...proc.braden },
    cam: { ...proc.cam },
    audit: {},
    sak: { ...proc.sak },
    caloi: {
      pain_intensity: proc.caloi.intensity,
      pain_location: proc.caloi.location,
      pain_characteristics: proc.caloi.characteristics
    }
  };
}
