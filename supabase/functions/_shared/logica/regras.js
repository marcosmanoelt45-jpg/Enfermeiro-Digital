// Regras de revelação (tabela de ia/paciente.md): decide o que cada fato permite dizer neste turno e
// garante que o texto verdadeiro de um fato bloqueado NUNCA chega ao prompt.
import { limitarConfianca } from "./rapport.js";
import { acrescentarNota, blocoMemoria } from "./memoria.js";

export const TEMAS_FATO = ["hda", "antecedentes", "medicacoes", "alergias", "habitos", "familia", "social", "sintomas_associados", "adesao", "sono", "eliminacoes", "alimentacao"];
export const TEMAS_DO_ALUNO = [...TEMAS_FATO, "identificacao", "dor", "outro"];
export const EMOCOES_VALIDAS = ["parado", "falando", "pensando", "feliz", "dor", "desconfiado", "confuso", "irritado"];

const LIMITE_ESQUECIDO = 2;

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
        if ((contagemTemas[f.tema] ?? 0) >= LIMITE_ESQUECIDO) {
          return { ...base, liberado: true, texto: f.texto, instrucao: `agora você lembrou: se perguntarem sobre ${f.tema}, conte.` };
        }
        return { ...base, liberado: false, instrucao: "você não lembra direito disso." };
      default:
        return { ...base, liberado: false, instrucao: "você não sabe sobre isso." };
    }
  });
}

// Texto do bloco ESTADO DO TURNO. Fato bloqueado entra só com tema e instrução (versão falsa ou "não lembra").
/**
 * @param {{ ficha: any, confianca: number, contagemTemas: Record<string, number>, reveladosIds?: string[], notas?: string[], turnosRestantes?: number }} p
 */
export function montarEstadoDoTurno({ ficha, confianca, contagemTemas, reveladosIds = [], notas = [], turnosRestantes = 99 }) {
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
  const exame = typeof examePedido === "string" && (ficha.examesDisponiveis ?? []).includes(examePedido) ? examePedido : null;

  return {
    confianca: novaConfianca,
    contagemTemas: novaContagem,
    notas: acrescentarNota(notas, resposta.nota_memoria),
    revelados,
    emocao,
    exame,
  };
}
