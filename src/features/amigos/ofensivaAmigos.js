// Ofensiva com amigos (como o "Friend Streak" do Duolingo): duas pessoas dividem um foguinho, que só sobe no
// dia em que AS DUAS estudam. Cada um continua fazendo só o próprio estudo; a cobrança vem do outro.
// - Até 5 ofensivas com amigos ao mesmo tempo (se uma quebra, as outras seguem).
// - Ao começar, a dupla combina uma meta (7, 14, 30 ou 50 dias).
// - Quem já estudou pode "cutucar" quem falta (vira uma notificação vinda do amigo, não do app).
// O servidor (amizades, ofensivas compartilhadas e cutucadas) é o próximo passo, o multiplayer. Até lá a lista
// vem vazia e a tela fica atrás da chave `amigos` em src/features/flags.js.

export const MAX_OFENSIVAS_AMIGOS = 5;

export const METAS_AMIGOS = [
  { dias: 7, nome: "Bons colegas" },
  { dias: 14, nome: "Colegas de turma" },
  { dias: 30, nome: "Dupla de plantão" },
  { dias: 50, nome: "Parceiros de profissão" },
];

/** Situação de hoje de uma ofensiva a dois. */
export function estadoDoPar({ euFiz, amigoFez }) {
  if (euFiz && amigoFez) return "acesa";
  if (euFiz) return "falta_amigo";
  if (amigoFez) return "falta_voce";
  return "apagada";
}

/** A próxima meta depois de `dias` (ou a última, se já passou de todas). */
export function proximaMeta(dias) {
  return METAS_AMIGOS.find((m) => m.dias > dias) ?? METAS_AMIGOS[METAS_AMIGOS.length - 1];
}

/** Se `dias` acabou de bater uma meta. */
export const bateuMeta = (dias) => METAS_AMIGOS.some((m) => m.dias === dias);

/** Iniciais para o avatar redondo quando não há foto. */
export function iniciais(nome = "") {
  const partes = String(nome).trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return "?";
  return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}

/** Lista das ofensivas com amigos. Vazia até o servidor do multiplayer existir. */
export async function listarOfensivasDeAmigos() {
  return [];
}

/** Dados de exemplo, só para a vitrine de desenvolvimento (/dev/ofensivas). */
export const EXEMPLOS_AMIGOS = [
  { id: "a1", nome: "Ana Lúcia", cor: "#8B5CF6", dias: 23, meta: 30, euFiz: true, amigoFez: true },
  { id: "a2", nome: "Bruno Reis", cor: "#3B82F6", dias: 6, meta: 7, euFiz: true, amigoFez: false },
  { id: "a3", nome: "Carla Mendes", cor: "#EC4899", dias: 12, meta: 14, euFiz: false, amigoFez: true },
  { id: "a4", nome: "Diego", cor: "#F59E0B", dias: 1, meta: 7, euFiz: false, amigoFez: false },
];
