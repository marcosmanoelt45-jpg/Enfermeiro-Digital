// Minijogo "Higienização das mãos" (ordenar). Técnica com água e sabonete, OMS / ANVISA.
export default {
  id: "higienizacao-maos",
  versao: 1,
  tipo: "ordenar",
  titulo: "Ordene: higienização das mãos com água e sabonete",
  instrucao: "Coloque as etapas na ordem da técnica da OMS.",
  categoria: "biosseguranca",
  fonte: { titulo: "OMS e ANVISA: Segurança do Paciente, Higienização das Mãos" },
  ordenar: {
    passos: [
      { id: "molhar", texto: "Retirar adornos e molhar as mãos" },
      { id: "sabonete", texto: "Aplicar sabonete suficiente para cobrir as mãos" },
      { id: "palmas", texto: "Friccionar palma contra palma" },
      { id: "dorso", texto: "Palma direita sobre o dorso esquerdo, entrelaçando os dedos, e vice-versa" },
      { id: "entre-dedos", texto: "Palma contra palma, friccionando os espaços entre os dedos" },
      { id: "dorso-dedos", texto: "Dorso dos dedos contra a palma oposta, com os dedos entrelaçados" },
      { id: "polegar", texto: "Friccionar o polegar com movimento circular" },
      { id: "pontas", texto: "Friccionar as polpas dos dedos e unhas contra a palma oposta" },
      { id: "punhos", texto: "Friccionar os punhos com movimento circular" },
      { id: "enxaguar", texto: "Enxaguar, secar com papel-toalha e fechar a torneira com o papel" },
    ],
  },
};
