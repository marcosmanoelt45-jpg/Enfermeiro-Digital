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

// O aluno disse que vai fazer (ou pediu para fazer) um exame? Reserva sem IA, para quando a IA do paciente
// não marca o exame: palavra do exame + verbo de exame + intenção ("vou", "posso", "deixa eu"…). Sem a intenção,
// "você costuma medir a pressão em casa?" é anamnese, não pedido de exame. O texto é comparado sem acentos.
const ESCUTAR = "(auscult|escut|ouv)\\w*";
const PALAVRAS = [
  ["glicemia-capilar", /(glicemia|\bhgt\b|glicose|dextro|ponta do dedo|furar (o |seu )?dedo|furadinha|acucar no sangue|diabete)/],
  ["palpacao-abdominal", /(palp|apalp|examin|sentir|toc)\w*.{0,30}(barriga|abdome|abdomen|estomago)|(barriga|abdome|abdomen).{0,30}(palp|apalp)\w*/],
  ["ausculta-abdominal", new RegExp(`${ESCUTAR}.{0,30}(barriga|abdome|abdomen|intestino)|ruidos? (hidroaereos?|intestina)`)],
  ["ausculta-cardiaca", new RegExp(`${ESCUTAR}.{0,30}(coracao|cardiac)|bulhas?`)],
  ["ausculta-pulmonar", new RegExp(`${ESCUTAR}.{0,30}(pulmao|pulmoes|peito|costas|respira)|ausculta pulmonar`)],
  ["oximetria", /(saturacao|oximetro|oximetria|\bsat\b|oxigenio no sangue)/],
  ["medir-pa", /(pressao|\bpa\b)/],
  ["contar-pulso", /(pulso|frequencia cardiaca|batimentos|\bfc\b)/],
  ["contar-fr", /(frequencia respiratoria|contar (a |sua )?respira|\bfr\b)/],
  ["medir-temperatura", /(temperatura|febre|termometro)/],
  ["avaliar-pupilas", /pupila/],
  ["escala-glasgow", /glasgow/],
  ["avaliar-edema", /(edema|inchaco|inchad[oa])/],
  ["avaliar-pele", /(\bpele\b|mucosas?|turgor|perfusao|enchimento capilar)/],
  ["avaliar-dor", /(escala de dor|nota (para|da|pra) (a |sua )?dor|de 0 a 10|de zero a dez)/],
];
const VERBO = /\b(medir|meco|mede|aferir|afiro|afere|verificar|verifico|ver|vejo|avaliar|avalio|examinar|examino|auscultar|ausculto|escutar|escuto|ouvir|palpar|apalpar|checar|conferir|olhar|olho|fazer|faco|furar|colocar|coloco|testar|tirar|tiro|sentir|contar|conto|pegar|dar uma olhada)\b/;
const PEDIDO = /\b(vou|vamos|deixa|deixar|deixe|posso|pode|podemos|poderia|preciso|precisamos|quero|gostaria|irei|agora|permite|permitir|autoriza|consigo|tudo bem se|bora|me deixa)\b/;

export function detectarExame(texto) {
  const t = String(texto ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const intencao = (VERBO.test(t) && PEDIDO.test(t)) || /\b(ausculto|palpo|apalpo|meco|afiro|vou examinar)\b/.test(t);
  if (!intencao) return null;
  for (const [id, re] of PALAVRAS) if (re.test(t)) return id;
  return null;
}
