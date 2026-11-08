// Minijogo "Preparar e purgar o equipo" (ordenar).
export default {
  id: "purgar-equipo",
  versao: 1,
  tipo: "ordenar",
  titulo: "Ordene: preparar o soro e purgar o equipo",
  instrucao: "Coloque as etapas na ordem certa para o equipo ficar sem ar.",
  categoria: "medicacao",
  fonte: { titulo: "POP de preparo de soroterapia (técnica usual em serviços de saúde): conferir com o POP da instituição" },
  ordenar: {
    passos: [
      { id: "conferir", texto: "Conferir a prescrição, o soro e a validade (9 certos)" },
      { id: "maos", texto: "Higienizar as mãos e separar o material" },
      { id: "fechar", texto: "Fechar a pinça rolete do equipo" },
      { id: "conectar", texto: "Conectar o equipo ao frasco sem contaminar a ponta" },
      { id: "camara", texto: "Pendurar o frasco e encher metade da câmara de gotejamento" },
      { id: "abrir", texto: "Abrir a pinça devagar até o soro chegar à ponta, sem bolhas" },
      { id: "fechar2", texto: "Fechar a pinça e proteger a ponta do equipo" },
      { id: "identificar", texto: "Identificar o frasco (paciente, solução, gotejamento, horário)" },
    ],
  },
};
