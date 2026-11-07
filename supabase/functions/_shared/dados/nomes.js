// Nomes fictícios comuns (reserva quando o nome da IA cai na lista de bloqueio, e nomes da ficha de template).
export const NOMES_M = ["João", "Lucas", "Mateus", "Gabriel", "Rafael", "Pedro", "Carlos", "Antônio", "Francisco", "Luiz", "Paulo", "Marcos", "José", "Rodrigo", "Fernando"];
export const NOMES_F = ["Maria", "Ana", "Juliana", "Mariana", "Beatriz", "Camila", "Fernanda", "Larissa", "Aline", "Patrícia", "Helena", "Francisca", "Tereza", "Cláudia", "Renata"];
export const SOBRENOMES = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida"];

// sorteio1/2: números em [0,1) (injetáveis para testar).
export function nomeFicticio(sexo, sorteio1 = Math.random(), sorteio2 = Math.random()) {
  const primeiros = sexo === "F" ? NOMES_F : NOMES_M;
  return `${primeiros[Math.floor(sorteio1 * primeiros.length)]} ${SOBRENOMES[Math.floor(sorteio2 * SOBRENOMES.length)]}`;
}
