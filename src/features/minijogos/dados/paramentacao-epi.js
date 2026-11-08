// Minijogos de EPI (ordenar): colocar e retirar. Sequência da Nota Técnica GVIMS/GGTES/ANVISA nº 04/2020.
export const paramentacao = {
  id: "paramentacao-epi",
  versao: 1,
  tipo: "ordenar",
  titulo: "Ordene: colocar os EPIs (paramentação)",
  instrucao: "Coloque a sequência de paramentação na ordem certa.",
  categoria: "biosseguranca",
  fonte: { titulo: "Nota Técnica GVIMS/GGTES/ANVISA nº 04/2020 (sequência de paramentação)" },
  ordenar: {
    passos: [
      { id: "maos1", texto: "Higienizar as mãos" },
      { id: "avental", texto: "Vestir o avental" },
      { id: "mascara", texto: "Colocar a máscara e testar a vedação" },
      { id: "oculos", texto: "Colocar os óculos ou o protetor facial" },
      { id: "gorro", texto: "Colocar o gorro" },
      { id: "luvas", texto: "Calçar as luvas por cima do punho do avental" },
    ],
  },
};

export const desparamentacao = {
  id: "desparamentacao-epi",
  versao: 1,
  tipo: "ordenar",
  titulo: "Ordene: retirar os EPIs (desparamentação)",
  instrucao: "Retirar na ordem errada contamina você. Ordene a desparamentação.",
  categoria: "biosseguranca",
  fonte: { titulo: "Nota Técnica GVIMS/GGTES/ANVISA nº 04/2020 (sequência de desparamentação)" },
  ordenar: {
    passos: [
      { id: "luvas", texto: "Retirar as luvas" },
      { id: "avental", texto: "Retirar o avental, enrolando pelo lado de dentro" },
      { id: "maos1", texto: "Higienizar as mãos" },
      { id: "gorro", texto: "Retirar o gorro" },
      { id: "oculos", texto: "Retirar os óculos ou o protetor facial pela parte de trás" },
      { id: "mascara", texto: "Retirar a máscara pelos elásticos, sem tocar a frente" },
      { id: "maos2", texto: "Higienizar as mãos de novo" },
    ],
  },
};
