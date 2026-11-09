// Rótulos dos exames de beira de leito (os mesmos ids do servidor: _shared/dados/examesPorEspecialidade.js).
export const ROTULO_EXAME = {
  "ausculta-pulmonar": "Ausculta pulmonar",
  "contar-fr": "Contar a respiração",
  "contar-pulso": "Contar o pulso",
  "medir-pa": "Medir a pressão",
  "medir-temperatura": "Medir a temperatura",
  "glicemia-capilar": "Glicemia capilar (HGT)",
  "escala-glasgow": "Escala de Glasgow",
  "palpacao-abdominal": "Palpação do abdome",
  "ausculta-cardiaca": "Ausculta cardíaca",
  oximetria: "Oximetria de pulso",
  "avaliar-pupilas": "Avaliação das pupilas",
  "avaliar-pele": "Pele, mucosas e perfusão",
  "ausculta-abdominal": "Ausculta abdominal",
  "avaliar-edema": "Pesquisa de edema",
  "avaliar-dor": "Escala de dor",
};

// O aluno disse que vai fazer um exame? (reserva sem IA: verbo de exame + palavra do exame)
const PALAVRAS = [
  ["glicemia-capilar", /(glicemia|hgt|glicose|dextro|ponta do dedo|furar o dedo|açúcar no sangue|acucar no sangue)/],
  ["palpacao-abdominal", /(palp\w*|apalp\w*).*(barriga|abd[oô]me|abdomen|est[oô]mago)|(barriga|abd[oô]me|abdomen).*(palp\w*|apalp\w*)/],
  ["ausculta-abdominal", /auscult\w*.*(barriga|abd[oô]me|abdomen|intestino)|ru[ií]dos? (hidroa[eé]reos?|intestina)/],
  ["ausculta-cardiaca", /auscult\w*.*(cora[cç][aã]o|card[ií]ac)|bulhas?/],
  ["ausculta-pulmonar", /auscult\w*.*(pulm[aã]o|pulm[oõ]es|peito|costas|respira)|ouvir (seu|o) (pulm|peito)/],
  ["medir-pa", /(press[aã]o|\bpa\b)/],
  ["contar-pulso", /(pulso|frequ[eê]ncia card[ií]aca|batimentos)/],
  ["contar-fr", /(frequ[eê]ncia respirat[oó]ria|contar (a |sua )?respira)/],
  ["medir-temperatura", /(temperatura|febre|term[oô]metro)/],
  ["oximetria", /(satura[cç][aã]o|ox[ií]metro|oximetria)/],
  ["avaliar-pupilas", /pupila/],
  ["escala-glasgow", /glasgow/],
  ["avaliar-edema", /(edema|incha[cç]o|inchad[oa])/],
  ["avaliar-pele", /(pele|mucosas?|turgor|perfus[aã]o|enchimento capilar)/],
  ["avaliar-dor", /(escala de dor|nota (para|da|pra) (a |sua )?dor|de 0 a 10|de zero a dez)/],
];
const VERBO = /(vou|vamos|deixa eu|posso|preciso|irei|agora|me deixa|permit)\b.*\b(medir|verificar|ver|avaliar|examinar|auscultar|palpar|apalpar|checar|conferir|olhar|fazer|furar|colocar|testar)/;

export function detectarExame(texto) {
  const t = String(texto ?? "").toLowerCase();
  if (!VERBO.test(t) && !/\b(auscult|palp|apalp|me[cç]o|afiro|aferir)/.test(t)) return null;
  for (const [id, re] of PALAVRAS) if (re.test(t)) return id;
  return null;
}
