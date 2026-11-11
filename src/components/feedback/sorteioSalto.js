// Quando o Goti pula num acerto, e qual pulo. Não pula sempre (cansaria): a chance é de 40%, mas depois de
// 3 acertos sem pulo ele pula com certeza. O pulo repete o anterior só 1 vez em 4, para variar.
export const SALTOS = ["vertical", "lateral"];
export const CHANCE_DE_SALTO = 0.4;
export const MAX_SEM_SALTO = 3;

export function novoSorteio() {
  return { semSalto: 0, ultimo: null };
}

/** Devolve { salto: "vertical" | "lateral" | null, estado } sem mexer no estado recebido. */
export function sortearSalto(estado = novoSorteio(), aleatorio = Math.random) {
  const pula = estado.semSalto >= MAX_SEM_SALTO || aleatorio() < CHANCE_DE_SALTO;
  if (!pula) return { salto: null, estado: { ...estado, semSalto: estado.semSalto + 1 } };
  const outro = SALTOS.find((s) => s !== estado.ultimo) ?? SALTOS[0];
  const salto = estado.ultimo && aleatorio() < 0.25 ? estado.ultimo : estado.ultimo ? outro : SALTOS[Math.floor(aleatorio() * SALTOS.length)];
  return { salto, estado: { semSalto: 0, ultimo: salto } };
}
