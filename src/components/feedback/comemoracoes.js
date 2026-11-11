// Comemorações de sequência (a cada 5 acertos seguidos) e de ofensiva (1ª resposta do dia).
// As telas que têm respostas (Questões, Revisão, Cálculo) chamam `registrarResposta`; o componente
// <Comemoracoes /> (montado uma vez no App) ouve o evento e mostra a animação.
import { clinicalGamificationService } from "@/services/clinicalGamificationService";

export const EVENTO_COMEMORACAO = "enfere:comemoracao";
export const SEQUENCIA_A_CADA = 5;

const DIAS = ["D", "S", "T", "Q", "Q", "S", "S"];
const data = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Os 7 últimos dias (hoje por último) com o que conta na ofensiva: PE no dia, dia iniciado ou congelado. */
export function semanaDaOfensiva(estado, hoje = new Date()) {
  const ativos = new Set([...(estado?.diasAtivos ?? []), ...(estado?.frozenDates ?? [])]);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - (6 - i));
    const dia = data(d);
    return { dia, letra: DIAS[d.getDay()], ativo: ativos.has(dia) || (Number(estado?.dailyXpMap?.[dia]) || 0) > 0, hoje: i === 6 };
  });
}

/** Quantos acertos seguidos merecem comemoração (5, 10, 15…). */
export const comemoraSequencia = (n) => n > 0 && n % SEQUENCIA_A_CADA === 0;

function avisar(detalhe) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENTO_COMEMORACAO, { detail: detalhe }));
}

/**
 * Registra uma resposta e dispara as comemorações.
 * `resultado`: "acerto" (de primeira ou de segunda), "primeiro_erro" (o amarelo: não zera a sequência) ou "erro"
 * (o erro final: zera). A 1ª resposta do dia acende a ofensiva.
 */
export function registrarResposta({ userId = null, resultado }) {
  const svc = clinicalGamificationService;
  const dia = svc.iniciarDiaDeEstudo(userId);
  if (dia.novo) avisar({ tipo: "ofensiva", de: dia.de, para: dia.para, semana: semanaDaOfensiva(svc.getState(userId)) });
  if (resultado === "acerto") {
    const n = svc.registrarAcertoQuestao(userId)?.acertosSeguidos ?? 0;
    if (comemoraSequencia(n)) avisar({ tipo: "sequencia", n });
  } else if (resultado === "erro") {
    svc.registrarErroVermelhoQuestao(userId);
  }
}
