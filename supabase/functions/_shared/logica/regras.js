// Regras de revelação (tabela de ia/paciente.md): decide o que cada fato permite dizer neste turno e
// garante que o texto verdadeiro de um fato bloqueado NUNCA chega ao prompt.
import { limitarConfianca } from "./rapport.js";
import { acrescentarNota, blocoMemoria } from "./memoria.js";
import { TODOS_EXAMES } from "../dados/examesPorEspecialidade.js";

export const TEMAS_FATO = ["hda", "antecedentes", "medicacoes", "alergias", "habitos", "familia", "social", "sintomas_associados", "adesao", "sono", "eliminacoes", "alimentacao"];
export const TEMAS_DO_ALUNO = [...TEMAS_FATO, "identificacao", "dor", "outro"];
export const EMOCOES_VALIDAS = ["parado", "falando", "pensando", "feliz", "dor", "desconfiado", "confuso", "irritado"];

const LIMITE_ESQUECIDO = 2;

// O aluno pediu para conferir em outra fonte: receita, papel do posto, caixinha do remédio, pulseira, registro de
// internação anterior ou um familiar por telefone. Daí o que o paciente esqueceu pode ser confirmado.
// Fica guardado na contagem de temas da sessão como "fonte_externa" (vale até o fim da consulta).
export const CHAVE_FONTE_EXTERNA = "fonte_externa";
const FONTE_EXTERNA = /(receita|documento|papel|papelzinho|carteirinha|cartao do (posto|sus)|caderneta|pulseira|caixa(inha)? (do|de) remedio|embalage|bula|bolsa|sacola|prontuario|registro|internac(ao|oes) anterior|exames? antigos?|familia|filh[oa]s?|espos[ao]|marido|neta?o?s?|irma[os]?|acompanhante|cuidador|vizinh|ligar|ligacao|telefon|celular|whats|posto de saude|farmacia|ubs)/;
const semAcento = (t) => String(t ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
export function pedeFonteExterna(texto) {
  return FONTE_EXTERNA.test(semAcento(texto));
}

// Para cada fato: { id, tema, regra, liberado, texto (só se liberado), instrucao }.
export function estadoDosFatos(ficha, { confianca, contagemTemas = {} }) {
  return ficha.fatos.map((f) => {
    const base = { id: f.id, tema: f.tema, regra: f.revelacao };
    switch (f.revelacao) {
      case "livre":
        return { ...base, liberado: true, texto: f.texto, instrucao: "pode contar espontaneamente se o assunto surgir." };
      case "pergunta_direta":
        return { ...base, liberado: true, texto: f.texto, instrucao: `só conte se perguntarem sobre ${f.tema}.` };
      case "confianca":
        if (confianca >= f.confiancaMin) {
          return { ...base, liberado: true, texto: f.texto, instrucao: `agora você confia o suficiente: se perguntarem sobre ${f.tema}, conte a verdade, com algum constrangimento.` };
        }
        return { ...base, liberado: false, instrucao: `se perguntarem sobre ${f.tema}, conte a versão: "${f.versaoFalsa}".` };
      case "esquecido":
        if ((contagemTemas[CHAVE_FONTE_EXTERNA] ?? 0) > 0) {
          return { ...base, liberado: true, texto: f.texto, instrucao: `você não lembrava sozinho, mas a informação aparece na fonte que o aluno sugeriu (a receita ou o papel que você trouxe, a caixinha do remédio, o registro do hospital ou um familiar ao telefone): se o assunto for ${f.tema}, conte e diga de onde veio.` };
        }
        if ((contagemTemas[f.tema] ?? 0) >= LIMITE_ESQUECIDO) {
          return { ...base, liberado: true, texto: f.texto, instrucao: `agora você lembrou: se perguntarem sobre ${f.tema}, conte.` };
        }
        return { ...base, liberado: false, instrucao: "você não lembra direito disso. Se o aluno perguntar, diga que não lembra e, se fizer sentido, comente onde ele poderia ver (a receita na sua bolsa, o papel do posto, alguém da família)." };
      default:
        return { ...base, liberado: false, instrucao: "você não sabe sobre isso." };
    }
  });
}

// Texto do bloco ESTADO DO TURNO. Fato bloqueado entra só com tema e instrução (versão falsa ou "não lembra").
/**
 * @param {{ ficha: any, confianca: number, contagemTemas: Record<string, number>, reveladosIds?: string[], notas?: string[], turnosRestantes?: number, pediuFonte?: boolean }} p
 */
export function montarEstadoDoTurno({ ficha, confianca, contagemTemas, reveladosIds = [], notas = [], turnosRestantes = 99, pediuFonte = false }) {
  const fatos = estadoDosFatos(ficha, { confianca, contagemTemas });
  const linhasFatos = fatos.map((f) =>
    f.liberado ? `- [${f.id}] tema ${f.tema}: "${f.texto}". Instrução: ${f.instrucao}` : `- [${f.id}] tema ${f.tema}: ${f.instrucao}`
  );
  const partes = [
    "ESTADO DO TURNO",
    `Sua confiança no aluno agora: ${confianca}/100.`,
    "",
    "FATOS (siga a instrução de cada um):",
    ...linhasFatos,
    "",
    "MEMÓRIA (o que você já contou ou disse e precisa manter):",
    blocoMemoria({ ficha, reveladosIds, notas }),
  ];
  if (pediuFonte) {
    partes.push(
      "",
      "PEDIDO DO ALUNO AGORA: ele pediu para ver a sua receita, papéis, caixinha de remédio ou registro, ou para falar com alguém da família. " +
        "Responda a ISSO diretamente e colabore: diga o que você trouxe (a receita e o papel do posto estão na sua bolsa) ou dê o contato de um familiar, " +
        "e conte o que aparece lá entre os fatos liberados (alergias, nomes e doses de remédio). Não mude de assunto."
    );
  }
  if (turnosRestantes <= 3) {
    partes.push("", "O atendimento está chegando ao fim; se fizer sentido, demonstre cansaço ou pergunte o que vai acontecer agora.");
  }
  return partes.join("\n");
}

// Aplica a resposta da IA ao estado da sessão, sem confiar nela: descarta o que não estava liberado.
/**
 * @param {{ ficha: any, confianca: number, contagemTemas?: Record<string, number>, notas?: string[], liberadosIds: string[] }} estado
 * @param {any} resposta
 */
export function aplicarResposta({ ficha, confianca, contagemTemas = {}, notas = [], liberadosIds }, resposta) {
  const liberados = new Set(liberadosIds);
  const idsValidos = new Set(ficha.fatos.map((f) => f.id));

  const delta = Math.max(-10, Math.min(10, Math.trunc(Number(resposta.delta_confianca) || 0)));
  const novaConfianca = limitarConfianca(confianca + delta);

  const revelados = [...new Set((resposta.revelados ?? []).filter((id) => idsValidos.has(id) && liberados.has(id)))];

  const novaContagem = { ...contagemTemas };
  for (const t of new Set(resposta.temas_do_aluno ?? [])) {
    if (TEMAS_DO_ALUNO.includes(t)) novaContagem[t] = (novaContagem[t] ?? 0) + 1;
  }

  const emocao = EMOCOES_VALIDAS.includes(resposta.emocao) ? resposta.emocao : "falando";
  const examePedido = resposta.exame_solicitado;
  // Qualquer exame de beira de leito da lista vale (antes só os 0 a 2 sorteados para o caso).
  const exame = typeof examePedido === "string" && TODOS_EXAMES.includes(examePedido) ? examePedido : null;

  return {
    confianca: novaConfianca,
    contagemTemas: novaContagem,
    notas: acrescentarNota(notas, resposta.nota_memoria),
    revelados,
    emocao,
    exame,
  };
}
