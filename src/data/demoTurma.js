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
  },
  {
    id: "assign-2",
    turma_id: "demo-turma-enf-2026",
    title: "Caso Clínico 2: Manejo de Hiperemia Sacra & Escala de Braden",
    description: "Avaliar parâmetros de mobilidade, nutrição e fricção (Braden = 11 pts), instituir protocolo de rotação de decúbito 2/2h e prescrever creme barreira hidrofóbico.",
    patient_name: "Paciente A. P. L. (79 anos)",
    due_date: "2026-11-15",
    created_date: "2026-10-12",
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
