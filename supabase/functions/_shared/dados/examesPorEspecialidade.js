// Exames (ids de minijogo, com hífen) que fazem sentido por especialidade, e o setor de cada uma.
// Os minijogos nascem na F5; até lá a lista é a intenção e o servidor só repassa ids dela.
/** @type {Record<string, string[]>} */
export const EXAMES_POR_ESPECIALIDADE = {
  cardiovascular: ["ausculta-pulmonar", "contar-pulso"],
  respiratorio: ["ausculta-pulmonar", "contar-fr"],
  neurologia: ["escala-glasgow"],
  sepse: ["medir-temperatura", "contar-fr"],
  metabolico_endocrino: ["glicemia-capilar"],
  cirurgico_abdome: ["palpacao-abdominal"],
  nefrologia: ["medir-pa"],
  obstetricia: ["medir-pa"],
  trauma: ["contar-pulso", "medir-pa"],
};

/** @type {Record<string, string>} */
export const EXAMES_ROTULOS = {
  "ausculta-pulmonar": "Ausculta pulmonar",
  "contar-fr": "Contar a respiração",
  "contar-pulso": "Contar o pulso",
  "medir-pa": "Medir a pressão",
  "medir-temperatura": "Medir a temperatura",
  "glicemia-capilar": "Glicemia capilar",
  "escala-glasgow": "Escala de Glasgow",
  "palpacao-abdominal": "Palpação do abdome",
  "ausculta-cardiaca": "Ausculta cardíaca",
  "oximetria": "Oximetria de pulso",
  "avaliar-pupilas": "Avaliação das pupilas",
  "avaliar-pele": "Pele, mucosas e perfusão",
  "ausculta-abdominal": "Ausculta abdominal",
  "avaliar-edema": "Pesquisa de edema",
  "avaliar-dor": "Escala de dor",
};

// Todos os exames de beira de leito que o aluno pode pedir em qualquer consulta.
export const TODOS_EXAMES = Object.keys(EXAMES_ROTULOS);

/** @type {Record<string, string>} */
export const SETOR_POR_ESPECIALIDADE = {
  cardiovascular: "Clínica Médica",
  respiratorio: "Clínica Médica",
  neurologia: "Unidade de AVC",
  sepse: "Pronto-Socorro",
  metabolico_endocrino: "Clínica Médica",
  cirurgico_abdome: "Clínica Cirúrgica",
  nefrologia: "Clínica Médica",
  obstetricia: "Maternidade",
  trauma: "Pronto-Socorro",
};

export const setorDe = (especialidade, leito = 7) => `${SETOR_POR_ESPECIALIDADE[especialidade] ?? "Clínica Médica"} • Leito ${leito}`;
export const examesCandidatos = (especialidade) => EXAMES_POR_ESPECIALIDADE[especialidade] ?? [];
