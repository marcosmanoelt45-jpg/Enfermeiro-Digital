// Filtro de saída: se a resposta citar provedor/modelo ou falar das próprias instruções, troca por uma
// resposta fixa. Recusar no prompt não basta (em 06/11 o Goti confirmou o modelo e resumiu o prompt).
const VAZAMENTO_GOTI = [
  /\b(gemini|gpt|chatgpt|openai|anthropic|claude|deepseek|openrouter|llama|mistral)\b/i,
  /\b(google|flash|lite)\b.{0,40}\b(modelo|ia|vers[aã]o|tecnologia)\b|\b(modelo|ia|vers[aã]o|tecnologia)\b.{0,40}\b(google|flash|lite)\b/i,
  /\b(system prompt|meu prompt|o prompt|minhas instru[cç][oõ]es|instru[cç][oõ]es (do|de) sistema|minhas regras)\b/i,
  /modelo de linguagem/i,
];
export const RESPOSTA_SEM_VAZAMENTO = 'Eu sou o Goti, o preceptor do Enfere 🩺 Os bastidores ficam com a equipe! Vamos voltar ao estudo: qual dúvida de enfermagem você quer destrinchar agora?';
export function filtrarRespostaGoti(texto) {
  const t = String(texto || '');
  return VAZAMENTO_GOTI.some((r) => r.test(t)) ? RESPOSTA_SEM_VAZAMENTO : t;
}
