const FIRST_NAMES_M = [
  "João", "Lucas", "Mateus", "Gabriel", "Rafael", "Pedro", "Carlos", "Antônio",
  "Francisco", "Luiz", "Paulo", "Marcos", "José", "Rodrigo", "Fernando"
];

const FIRST_NAMES_F = [
  "Maria", "Ana", "Juliana", "Mariana", "Beatriz", "Camila", "Fernanda", "Larissa",
  "Aline", "Patrícia", "Helena", "Francisca", "Tereza", "Cláudia", "Renata"
];

const LAST_NAMES = [
  "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves",
  "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida"
];

export function generateRandomName(preferredGender = null) {
  const gender = preferredGender || (Math.random() > 0.5 ? "M" : "F");
  const firstList = gender === "M" ? FIRST_NAMES_M : FIRST_NAMES_F;
  const first = firstList[Math.floor(Math.random() * firstList.length)];
  const last1 = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const last2 = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return {
    name: `${first} ${last1} ${last2}`,
    gender
  };
}

export function generateRandomAge(min = 18, max = 88) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
