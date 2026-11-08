// Minijogo "Glicemia capilar" (ordenar).
export default {
  id: "glicemia-capilar",
  versao: 1,
  tipo: "ordenar",
  titulo: "Ordene: verificação da glicemia capilar",
  instrucao: "Coloque as etapas da glicemia capilar na ordem certa.",
  categoria: "sinais_vitais",
  fonte: { titulo: "POP de glicemia capilar (técnica usual em serviços de saúde): conferir com o POP da instituição" },
  ordenar: {
    passos: [
      { id: "maos", texto: "Higienizar as mãos e separar o material" },
      { id: "orientar", texto: "Identificar e orientar o paciente" },
      { id: "luvas", texto: "Calçar as luvas de procedimento" },
      { id: "fita", texto: "Colocar a fita no glicosímetro" },
      { id: "limpar", texto: "Limpar a lateral da polpa digital e esperar secar" },
      { id: "puncionar", texto: "Puncionar a lateral do dedo com a lanceta" },
      { id: "gota", texto: "Encostar a gota de sangue na fita" },
      { id: "comprimir", texto: "Comprimir o local com algodão seco" },
      { id: "descartar", texto: "Descartar a lanceta na caixa de perfurocortante" },
      { id: "registrar", texto: "Ler o resultado, registrar e comunicar alterações" },
    ],
  },
};
