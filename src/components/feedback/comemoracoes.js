// Comemorações de sequência (a cada 5 acertos seguidos) e de ofensiva (1ª atividade concluída do dia).
// As telas que têm respostas (Questões, Revisão, Cálculo) chamam `registrarResposta`; o componente
// <Comemoracoes /> (montado uma vez no App) ouve o evento e mostra a animação.
import { clinicalGamificationService } from "@/services/clinicalGamificationService";

export const EVENTO_COMEMORACAO = "enfere:comemoracao";
export const SEQUENCIA_A_CADA = 5;

const DIAS = ["D", "S", "T", "Q", "Q", "S", "S"];
const data = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Os 7 últimos dias (hoje por último) com o que conta na ofensiva: PE no dia, dia iniciado ou congelado. */
export function semanaDaOfensiva(estado, hoje = new Date()) {
  const estudados = new Set(estado?.diasAtivos ?? []);
  const congelados = new Set(estado?.frozenDates ?? []);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - (6 - i));
    const dia = data(d);
    const estudou = estudados.has(dia) || (Number(estado?.dailyXpMap?.[dia]) || 0) > 0;
    const congelado = !estudou && congelados.has(dia);
    return { dia, letra: DIAS[d.getDay()], ativo: estudou || congelado, congelado, hoje: i === 6 };
  });
}

/** Se a pessoa já estudou hoje (o foguinho do topo fica cinza até isso acontecer, como no Duolingo). */
export function estudouHoje(estado, hoje = new Date()) {
  const dia = data(hoje);
  return (estado?.diasAtivos ?? []).includes(dia) || (Number(estado?.dailyXpMap?.[dia]) || 0) > 0;
}

export const MARCOS_DA_OFENSIVA = new Set([7, 14, 30, 50, 100, 200, 365, 500, 1000]);

/** Quantos acertos seguidos merecem comemoração (5, 10, 15…). */
export const comemoraSequencia = (n) => n > 0 && n % SEQUENCIA_A_CADA === 0;

function avisar(detalhe) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENTO_COMEMORACAO, { detail: detalhe }));
}

/**
 * Registra uma resposta e dispara a comemoração de sequência.
 * `resultado`: "acerto" (de primeira ou de segunda), "primeiro_erro" (o amarelo: não zera a sequência) ou "erro"
 * (o erro final: zera). A ofensiva NÃO sobe aqui: ela acende ao terminar a atividade (recordActivity ou
 * concluirAtividadeDoDia no serviço), como no Duolingo.
 */
export function registrarResposta({ userId = null, resultado }) {
  const svc = clinicalGamificationService;
  if (resultado === "acerto") {
    const n = svc.registrarAcertoQuestao(userId)?.acertosSeguidos ?? 0;
    if (comemoraSequencia(n)) avisar({ tipo: "sequencia", n });
  } else if (resultado === "erro") {
    svc.registrarErroVermelhoQuestao(userId);
  }
}
