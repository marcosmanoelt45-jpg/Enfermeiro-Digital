// Questões escritas a partir das aulas da disciplina (UFRGS ENF01015) e das diretrizes que elas citam.
// Formato curto (p, o, c, por, fonte); normalizarQuestao monta o formato do banco antigo (opcoes, correta,
// explicacaoAlternativas...) que o cartão de questão usa.
import seguranca from "./seguranca.js";
import rcp from "./rcp.js";
import cardio from "./cardio.js";
import exames from "./exames.js";
import perioperatorio from "./perioperatorio.js";
import medicacao from "./medicacao.js";
import processo from "./processo.js";
import fundamentos from "./fundamentos.js";

const LETRAS = ["A", "B", "C", "D", "E"];

export function normalizarQuestao(q) {
  return {
    id: q.id,
    tipo: "multipla_escolha",
    tema: q.tema,
    categoriaPratica: q.cat,
    pergunta: q.p,
    dica: q.dica,
    opcoes: q.o,
    correta: q.c,
    explicacaoGeral: q.fonte ? `${q.exp} Fonte: ${q.fonte}.` : q.exp,
    explicacaoAlternativas: q.o.map((texto, i) => ({
      letra: LETRAS[i],
      texto,
      isCorreta: i === q.c,
      explicacao: `${i === q.c ? "Correta" : "Incorreta"}: ${q.por[i]}`,
    })),
    fonte: q.fonte ?? null,
  };
}

export const QUESTOES_CRUAS = [...seguranca, ...rcp, ...cardio, ...exames, ...perioperatorio, ...medicacao, ...processo, ...fundamentos];
export const QUESTOES_AULAS = QUESTOES_CRUAS.map(normalizarQuestao);
