// Minijogo "Conte a respiração" (medir). Basta este arquivo para existir um minijogo novo.
export default {
  id: "contar-fr",
  versao: 1,
  tipo: "medir",
  titulo: "Conte a respiração",
  instrucao: "Observe o tórax por 15 segundos, conte as respirações e informe quantas por minuto.",
  categoria: "sinais_vitais",
  fonte: { titulo: "POP de verificação de sinais vitais (frequência respiratória)" },
  achado: { campo: "fr", valor: "28 irpm", texto: "Frequência respiratória" },
  medir: { instrumento: "contar-fr", valorCorreto: 28, unidade: "irpm", tolerancia: 2, duracaoSeg: 15 },
};
