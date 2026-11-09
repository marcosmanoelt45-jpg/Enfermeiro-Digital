import { callResilientAI } from "@/services/aiCoreService.js";
import { sanitizeTextForLGPD } from "@/lib/dlpSanitizer.js";
import { filtrarRespostaGoti } from "@/services/gotiFiltro.js";

// Ajuda do Goti na Consulta (anotações e intervenções): lê o caso atual (dados do paciente e a conversa até aqui)
// e o rascunho do aluno, e ajuda a formular SEM dar a resposta.

const ETAPAS = {
  anotacao: "a evolução/anotação de enfermagem da consulta (o que registrar e como escrever)",
  intervencoes: "as intervenções de enfermagem para este paciente",
};

const limpar = (t, max) => sanitizeTextForLGPD(String(t ?? "")).replace(/[<>]/g, "").slice(0, max);

export function montarPedidoAjuda({ etapa, briefing, turnos = [], rascunho = "", diagnosticos = [], pergunta = "" }) {
  const conversa = turnos
    .slice(-24)
    .map((t) => `${t.autor === "aluno" || t.papel === "aluno" ? "Estudante" : "Paciente"}: ${limpar(t.texto, 300)}`)
    .join("\n");
  const paciente = briefing ? `${briefing.nome ?? ""}, ${briefing.idade ?? ""} anos, ${briefing.setor ?? ""}. ${briefing.queixa ?? briefing.motivo ?? ""}` : "";
  return [
    `Tarefa: o estudante está escrevendo ${ETAPAS[etapa] ?? etapa} numa simulação de consulta.`,
    "Regras desta ajuda: NÃO escreva a evolução nem as intervenções por ele, NÃO liste a resposta pronta e NÃO diga qual é o diagnóstico.",
    "Aponte o que ele ainda não registrou ou perguntou, sugira a estrutura (ex.: dados subjetivos, objetivos, sinais vitais, conduta) e faça até 3 perguntas que o levem a completar. No máximo 120 palavras, em PT-BR.",
    `<paciente>${limpar(paciente, 400)}</paciente>`,
    conversa ? `<conversa>\n${conversa}\n</conversa>` : "<conversa>(ainda sem conversa)</conversa>",
    diagnosticos.length ? `<diagnosticos_do_estudante>${limpar(diagnosticos.join("; "), 400)}</diagnosticos_do_estudante>` : "",
    `<rascunho_do_estudante>\n${limpar(rascunho, 1500) || "(vazio)"}\n</rascunho_do_estudante>`,
    pergunta ? `<pergunta>${limpar(pergunta, 400)}</pergunta>` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

const RESERVA = {
  anotacao:
    "Vamos organizar: comece pelos dados subjetivos (o que o paciente contou: queixa, início, intensidade, o que piora ou melhora), depois os objetivos (o que você observou e mediu) e feche com o que você fez ou orientou. O que ele contou sobre medicações e alergias? E sobre há quanto tempo isso começou?",
  intervencoes:
    "Pense em cada problema que você identificou: o que a enfermagem pode monitorar, fazer e orientar para ele? Escreva com verbo no infinitivo e com frequência quando couber (ex.: \"a cada 4 horas\"). Qual problema do paciente é o mais urgente agora?",
};

export async function pedirAjudaGoti(dados, { timeoutMs = 12000 } = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await callResilientAI(null, montarPedidoAjuda(dados), { tarefa: "goti", maxTokens: 500, temperature: 0.35, signal: controller.signal });
    // A folha mostra texto puro: tira a marcação de negrito e títulos do markdown.
    const texto = r?.text ? filtrarRespostaGoti(r.text).replace(/\*\*(.+?)\*\*/g, "$1").replace(/^#+\s*/gm, "") : "";
    return { texto: texto || RESERVA[dados.etapa], offline: !texto };
  } catch {
    return { texto: RESERVA[dados.etapa], offline: true };
  } finally {
    clearTimeout(t);
  }
}
