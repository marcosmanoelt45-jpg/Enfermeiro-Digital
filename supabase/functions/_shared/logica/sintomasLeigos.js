// Sinais vitais -> frase leiga de como o paciente se sente. Gerado por código para a IA não inventar o quadro.
export function sintomasLeigos(v = {}) {
  const frases = [];
  if (v.sat != null && v.sat < 92) frases.push("com falta de ar");
  if (v.fr != null && v.fr > 24) frases.push("respirando rápido");
  if (v.fc != null && v.fc > 110) frases.push("com o coração acelerado");
  if (v.tax != null && v.tax >= 37.8) frases.push("com febre e calafrio");
  if (v.pa_sistolica != null && v.pa_sistolica < 90) frases.push("tonto e fraco");
  if (v.dor != null && v.dor >= 7) frases.push("com muita dor");
  else if (v.dor != null && v.dor >= 4) frases.push("com dor moderada");
  return frases.length ? frases.join(", ") : "um pouco cansado, mas estável";
}
