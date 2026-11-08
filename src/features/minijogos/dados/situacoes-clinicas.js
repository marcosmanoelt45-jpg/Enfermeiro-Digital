// Minijogos de decisão rápida (escolher): flebite e lesão por pressão.
export const flebite = {
  id: "conduta-flebite",
  versao: 1,
  tipo: "escolher",
  titulo: "Flebite no acesso periférico",
  instrucao: "Leia a situação e escolha a conduta.",
  categoria: "procedimentos",
  fonte: { titulo: "ANVISA: Medidas de Prevenção de Infecção Relacionada à Assistência à Saúde (cateter periférico)" },
  escolher: {
    pergunta: "O acesso venoso periférico do paciente está com dor, vermelhidão ao longo da veia e um cordão endurecido palpável. O que você faz primeiro?",
    opcoes: [
      { id: "retirar", texto: "Interromper a infusão, retirar o cateter e avaliar outro local", correta: true, feedback: "Isso. Com sinais de flebite o cateter sai; depois compressa, registro (escala de flebite) e comunicação." },
      { id: "lavar", texto: "Lavar o cateter com soro e manter a infusão", correta: false, feedback: "Manter o cateter piora a inflamação e o risco de infecção." },
      { id: "aumentar", texto: "Aumentar o gotejamento para terminar logo o soro", correta: false, feedback: "Aumenta a agressão à veia. A infusão tem de parar." },
      { id: "curativo", texto: "Trocar só o curativo e reavaliar no próximo plantão", correta: false, feedback: "O problema é a veia, não o curativo. Adiar a retirada piora o quadro." },
    ],
    perola: "Registre o grau da flebite e notifique: é um evento de segurança do paciente.",
  },
};

export const lppEstagio1 = {
  id: "lpp-estagio",
  versao: 1,
  tipo: "escolher",
  titulo: "Classifique a lesão por pressão",
  instrucao: "Leia a descrição e escolha o estágio.",
  categoria: "curativos",
  fonte: { titulo: "NPIAP 2016 / SOBEST: classificação das lesões por pressão" },
  escolher: {
    pergunta: "Na região sacral, a pele está íntegra, com eritema que não embranquece quando você pressiona. Qual é a classificação?",
    opcoes: [
      { id: "e1", texto: "Lesão por pressão estágio 1", correta: true, feedback: "Isso: pele íntegra com eritema que não embranquece." },
      { id: "e2", texto: "Lesão por pressão estágio 2", correta: false, feedback: "No estágio 2 já há perda parcial da pele (derme exposta ou bolha)." },
      { id: "tissular", texto: "Lesão tissular profunda", correta: false, feedback: "Na tissular profunda a cor é vermelho-escura, marrom ou púrpura, persistente." },
      { id: "normal", texto: "Pele normal, só reposicionar", correta: false, feedback: "Eritema que não embranquece já é lesão. Reposicionar é parte do cuidado, mas a classificação é estágio 1." },
    ],
    perola: "Alivie a pressão, mude o decúbito com frequência e avalie com a escala de Braden.",
  },
};
