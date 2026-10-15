/**
 * demoTurma.js
 * Dados simulados de demonstração para o Módulo de Turmas do Enfermeiro Digital.
 * Permite que novos usuários, docentes e estudantes visualizem imediatamente
 * o fluxo pedagógico completo de turmas, alunos, estudos de caso atribuídos e avaliações.
 */

export const DEMO_TURMA = {
  id: "demo-turma-enf-2026",
  name: "Enfermagem Clínica & Terapia Intensiva — Turma Modelo 2026",
  description: "Turma de demonstração do Enfermeiro Digital. Explore estudos de caso clínicos atribuídos, acompanhamento de alunos matriculados e correção de planos de cuidado.",
  code: "ENF2026",
  teacher_id: "teacher-demo",
  teacher_name: "Coordenação de Preceptoria Clínica",
  is_demo: true,
  created_date: new Date().toISOString(),
};

export const DEMO_MEMBERSHIP = {
  id: "membership-demo-1",
  turma_id: "demo-turma-enf-2026",
  turma_name: "Enfermagem Clínica & Terapia Intensiva — Turma Modelo 2026",
  turma_code: "ENF2026",
  role: "professor",
  is_demo: true
};

export const DEMO_MEMBERS = [
  { id: "mem-prof", user_id: "teacher-demo", user_name: "Coordenação de Preceptoria Clínica", user_email: "preceptoria@exemplo.edu", role: "professor", turma_id: "demo-turma-enf-2026" },
  { id: "mem-1", user_id: "u-1", user_name: "M. H. S. (Estudante)", user_email: "aluno.mhs@exemplo.edu", role: "aluno", turma_id: "demo-turma-enf-2026" },
  { id: "mem-2", user_id: "u-2", user_name: "L. C. R. (Estudante)", user_email: "aluno.lcr@exemplo.edu", role: "aluno", turma_id: "demo-turma-enf-2026" },
  { id: "mem-3", user_id: "u-3", user_name: "B. A. P. (Estudante)", user_email: "aluno.bap@exemplo.edu", role: "aluno", turma_id: "demo-turma-enf-2026" },
  { id: "mem-4", user_id: "u-4", user_name: "G. V. N. (Estudante)", user_email: "aluno.gvn@exemplo.edu", role: "aluno", turma_id: "demo-turma-enf-2026" },
  { id: "mem-5", user_id: "u-5", user_name: "J. S. F. (Estudante)", user_email: "aluno.jsf@exemplo.edu", role: "aluno", turma_id: "demo-turma-enf-2026" },
  { id: "mem-6", user_id: "u-6", user_name: "K. R. T. (Estudante)", user_email: "aluno.krt@exemplo.edu", role: "aluno", turma_id: "demo-turma-enf-2026" },
];

export const DEMO_ASSIGNMENTS = [
  {
    id: "assign-1",
    turma_id: "demo-turma-enf-2026",
    title: "Caso Clínico 1: Insuficiência Respiratória Aguda & Oximetria",
    description: "Identificar taquipneia compensatória, calcular oximetria de pulso, selecionar posicionamento de Fowler e prescrever intervenções privativas de enfermagem (COFEN nº 736/2024).",
    patient_name: "Paciente M. H. S. (62 anos)",
    due_date: "2026-10-30",
    created_date: "2026-10-10",
    scenario: `Paciente M. H. S., 62 anos, sexo masculino, histórico de tabagismo ativo (40 anos/maço) e portador de Doença Pulmonar Obstrutiva Crônica (DPOC) descompensada por infecção bacteriana do trato respiratório inferior. Foi admitido na enfermaria de clínica médica apresentando dispneia moderada a grave em repouso, uso evidente de musculatura acessória intercostal e esternal, batimento de asa de nariz e padrão respiratório superficial taquipneico.

Ao exame físico direcionado:
• Inspeção: Fácies de sofrimento respiratório agudo, sudorese fria em fronte e cianose perioral discreta.
• Ausculta pulmonar: Murmúrio vesicular diminuído bilateralmente, com presença de estertores crepitantes em bases e sibilos expiratórios difusos.
• Sinais vitais de admissão:
  - PA: 155/95 mmHg
  - FC: 118 bpm (taquicardia sinusal compensatória)
  - FR: 32 irpm (taquipneia acentuada)
  - Tax: 37,8 °C
  - SpO₂: 86% em ar ambiente

O paciente refere intensa angústia e sensação iminente de asfixia ("sinto que o ar não entra nos pulmões"). Gasometria arterial colhida em ar ambiente revela pH 7,31, PaO₂ 54 mmHg, PaCO₂ 52 mmHg e HCO₃⁻ 25 mEq/L.`,
    question: "Considerando o raciocínio diagnóstico baseado na NANDA-I 2024-2026 e a atuação privativa do enfermeiro (Resolução COFEN nº 736/2024), qual é o Diagnóstico de Enfermagem PRIORITÁRIO e a respectiva conduta imediata no leito?",
    options: [
      "Troca de gases prejudicada (00030) relacionada a desequilíbrio na ventilação-perfusão evidenciada por hipoxemia (SpO₂ 86%) e hipercapnia; Ação imediata: Elevar imediatamente a cabeceira do leito a 45°-60° (Posição de Fowler) e iniciar oxigenoterapia titulada de baixo fluxo (cateter nasal a 1-2 L/min) sob protocolo institucional.",
      "Padrão respiratório ineficaz (00032) relacionado a fadiga dos músculos respiratórios; Ação imediata: Manter o paciente em decúbito dorsal plano horizontal para repouso absoluto e aguardar visita médica para intubação orotraqueal eletiva.",
      "Desobstrução ineficaz de vias aéreas (00031) relacionada a exsudato nos alvéolos; Ação imediata: Realizar aspiração nasotraqueal vigorosa imediata com sonda número 14 Fr antes de qualquer suporte ventilatório ou oxigênio.",
      "Ansiedade aguda (00146) relacionada a sensação de asfixia; Ação imediata: Solicitar prescrição médica de sedativo intravenoso de ação rápida para tranquilizar o paciente antes de avaliar a mecânica ventilatória."
    ],
    correct_answer: "Troca de gases prejudicada (00030) relacionada a desequilíbrio na ventilação-perfusão evidenciada por hipoxemia (SpO₂ 86%) e hipercapnia; Ação imediata: Elevar imediatamente a cabeceira do leito a 45°-60° (Posição de Fowler) e iniciar oxigenoterapia titulada de baixo fluxo (cateter nasal a 1-2 L/min) sob protocolo institucional."
  },
  {
    id: "assign-2",
    turma_id: "demo-turma-enf-2026",
    title: "Caso Clínico 2: Manejo de Hiperemia Sacra & Escala de Braden",
    description: "Avaliar parâmetros de mobilidade, nutrição e fricção (Braden = 11 pts), instituir protocolo de rotação de decúbito 2/2h e prescrever creme barreira hidrofóbico.",
    patient_name: "Paciente A. P. L. (79 anos)",
    due_date: "2026-11-15",
    created_date: "2026-10-12",
    scenario: `Paciente A. P. L., 79 anos, sexo feminino, admitida há 5 dias na enfermaria clínica para reabilitação após Acidente Vascular Cerebral Isquêmico (AVCi) em hemisfério cerebral esquerdo, com sequela de hemiparesia e hemihipoestesia à direita, além de afasia mista e disfagia moderada a líquidos. A paciente permanece acamada por tempo prolongado e apresenta dependência total para transferências e mudanças de decúbito.

Durante o exame físico tegumentar céfalo-caudal do plantão matutino, o enfermeiro identifica eritema avermelhado bem delimitado sobre a proeminência óssea sacral (diâmetro aproximado de 4 × 3 cm). À digitopressão local, o eritema não esbranquiça (eritema não branqueável), porém não há perda de continuidade da epiderme ou formação de flictenas (Lesão por Pressão em Estágio 1).

Aplicação da Escala de Braden de Risco de LPP:
• Percepção sensorial: 2 (Muito limitada — responde apenas a estímulos dolorosos)
• Umidade da pele: 2 (Muito úmida — fralda com episódios frequentes de incontinência urinária)
• Atividade: 1 (Acamada — confinada ao leito)
• Mobilidade: 2 (Muito limitada — não realiza mudanças de decúbito sem auxílio total)
• Nutrição: 2 (Provavelmente inadequada — aceita menos de metade da dieta oferecida)
• Fricção & Cisalhamento: 2 (Problema em potencial — desliza frequentemente no leito)
• Escore Total de Braden = 11 pontos (Classificação: ALTO RISCO de LPP).`,
    question: "De acordo com as diretrizes internacionais (NPIAP/EPUAP) e a taxonomia NANDA-I 2024-2026, qual é o Diagnóstico de Enfermagem prioritário e o plano de cuidados privativo a ser prescrito pelo enfermeiro?",
    options: [
      "Integridade da pele prejudicada (00046) relacionada a pressão sobre proeminência óssea e cisalhamento evidenciada por eritema não branqueável em região sacra; Cuidados: Instituir protocolo de reposicionamento a cada 2 horas (decúbitos laterais a 30° evitando compressão do trocânter), instalar colchão pneumático de pressão alternada e aplicar filme transparente ou creme barreira polimérico sem friccionar.",
      "Risco de lesão por pressão (00249) relacionado a imobilidade física; Cuidados: Realizar massagem circular vigorosa com álcool a 70% sobre a área hiperemiada do sacro para estimular a circulação local.",
      "Mobilidade física prejudicada (00085) relacionada a déficit neuromuscular; Cuidados: Estimular a paciente a sentar-se na poltrona por 6 horas ininterruptas e suspender o uso de travesseiros e coxins para não sobrecarregar as articulações.",
      "Déficit no autocuidado para banho (00108) relacionado a sequela de AVC; Cuidados: Higienizar a pele apenas a cada 48 horas para manter o manto lipídico natural e suspender a mudança de decúbito no período noturno para assegurar o repouso."
    ],
    correct_answer: "Integridade da pele prejudicada (00046) relacionada a pressão sobre proeminência óssea e cisalhamento evidenciada por eritema não branqueável em região sacra; Cuidados: Instituir protocolo de reposicionamento a cada 2 horas (decúbitos laterais a 30° evitando compressão do trocânter), instalar colchão pneumático de pressão alternada e aplicar filme transparente ou creme barreira polimérico sem friccionar."
  }
];

export const DEMO_ANSWERS = [
  {
    id: "ans-1",
    assignment_id: "assign-1",
    turma_id: "demo-turma-enf-2026",
    user_id: "u-1",
    user_name: "M. H. S. (Estudante)",
    status: "graded",
    grade: "9.5",
    feedback: "Excelente raciocínio na priorização de Fowler a 45° antes do suporte de oxigênio de baixo fluxo.",
    updated_date: "2026-10-12"
  },
  {
    id: "ans-2",
    assignment_id: "assign-1",
    turma_id: "demo-turma-enf-2026",
    user_id: "u-2",
    user_name: "L. C. R. (Estudante)",
    status: "submitted",
    grade: null,
    feedback: null,
    updated_date: "2026-10-13"
  }
];
