// Segurança das conversas com as IAs (paciente, Ana, Goti). Módulo JS puro: o servidor e o app usam o mesmo.
// - riscoDeVida: o ALUNO diz que pensa em se matar ou em se machucar. Isso não é parte da simulação: o app pausa
//   e mostra onde pedir ajuda (CVV 188, SAMU 192), seja qual for o personagem.
// - pedidoDeDano: o aluno pede um jeito de ferir alguém escondido (ex.: dose que mata sem ninguém perceber).
//   Dose máxima, toxicidade e intoxicação seguem permitidas: é conteúdo de estudo.
// Só a 1ª pessoa conta ("me matar", "quero morrer"): na anamnese, "o senhor já pensou em se matar?" é pergunta clínica.

const sem = (t) =>
  String(t ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ");

const RISCO = [
  /\bme matar\b/,
  /\bme suicidar\b/,
  /\b(penso|pensei|pensando|vontade|ideia|ideias) (em|de) (me matar|suicidio|me suicidar|acabar com tudo|sumir pra sempre)\b/,
  /\b(tirar|acabar com) (a )?minha (propria )?vida\b/,
  /\b(eu )?(quero|queria|vou) morrer\b/,
  /\bnao (quero|aguento) mais viver\b/,
  /\bnao vejo (mais )?sentido (em|na) (viver|vida)\b/,
  /\bme (cortar|machucar|jogar (da|de|do|na|no|em))\b/,
];

const DANO = [
  /\bsem (que )?(ninguem|ngm) (perceb|saber|descobr|notar|desconfi)/,
  /\b(quero|vou|como|jeito de|forma de|maneira de|da pra)\b.{0,25}\b(matar|envenenar|machucar|prejudicar|dopar)\b.{0,25}\b(paciente|alguem|pessoa|ele|ela|minha|meu|colega|crianca|idoso|idosa)\b/,
  /\bdose\b.{0,20}\b(pra|para) (matar|apagar)\b/,
];

/** O texto do aluno indica risco à própria vida? */
export function riscoDeVida(texto) {
  const t = sem(texto);
  return RISCO.some((r) => r.test(t));
}

/** O texto pede um jeito de ferir alguém (com intenção ou escondido)? */
export function pedidoDeDano(texto) {
  const t = sem(texto);
  return DANO.some((r) => r.test(t));
}

export const APOIO = {
  titulo: "Pausa na simulação",
  texto:
    "O que você escreveu importa mais que qualquer treino. Se você está pensando em se machucar, fale agora com alguém: o CVV atende 24 horas, de graça, pelo 188 ou pelo chat. Em perigo imediato, ligue 192.",
  contatos: [
    { rotulo: "Ligar 188 (CVV)", href: "tel:188" },
    { rotulo: "Chat do CVV", href: "https://cvv.org.br" },
    { rotulo: "Ligar 192 (SAMU)", href: "tel:192" },
  ],
};

/** Resposta do Goti quando o aluno fala em se matar (texto corrido, para o chat). */
export const RESPOSTA_APOIO_GOTI =
  "Ei, vou pausar o estudo um pouquinho, porque você importa mais que qualquer prova. Se você está pensando em se machucar, fala agora com alguém: o CVV atende 24 horas, de graça, pelo 188 ou pelo chat em cvv.org.br. Se for perigo imediato, liga 192. Quer me contar o que está pesando? Eu fico aqui.";

/** Resposta do Goti a um pedido para ferir alguém. */
export const RESPOSTA_DANO_GOTI =
  "Isso eu não ensino: a enfermagem existe para proteger o paciente. Se a sua dúvida é de segurança, posso explicar dose máxima, sinais de intoxicação e o que fazer quando ela acontece. Qual desses você quer ver?";
