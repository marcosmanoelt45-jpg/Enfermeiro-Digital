// Cliente das Edge Functions do Enfere: nenhuma chave de provedor passa pelo navegador.
import { supabase, isSupabaseConfigured, isLocalDemoSession } from "@/services/supabaseClient";
import { invocarFuncao } from "./logica/chamada.js";
import { aguardarTranscricao, estimarDuracaoSeg } from "./logica/transcricao.js";

import { ErroServidor } from "./logica/erroServidor.js";

export { ErroServidor, erroDeCorpo } from "./logica/erroServidor.js";

const invoke = (nome, corpo) => supabase.functions.invoke(nome, { body: corpo });

// Há sessão real do Supabase gravada neste navegador (a conta demo não conta).
export function temSessaoDoServidor() {
  try {
    if (!isSupabaseConfigured() || isLocalDemoSession()) return false;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || "";
      if (k.startsWith("sb-") && k.endsWith("-auth-token")) return true;
    }
  } catch {
    // localStorage bloqueado: sem sessão conhecida
  }
  return false;
}

// Envia o áudio ao servidor (que guarda a chave da AssemblyAI) e espera o texto.
export async function transcrever(audioBlob, { duracaoSeg, onEtapa = () => {} } = {}) {
  const form = new FormData();
  form.set("acao", "iniciar");
  form.set("duracaoSeg", String(estimarDuracaoSeg(audioBlob, duracaoSeg)));
  form.set("audio", audioBlob, "relato.webm");

  onEtapa("Enviando o áudio...");
  const { id } = await invocarFuncao(invoke, "transcrever", form, { timeoutMs: 60000, tentativas: 2 });

  return aguardarTranscricao({
    consultar: () => invocarFuncao(invoke, "transcrever", { acao: "status", id }, { timeoutMs: 15000, tentativas: 2 }),
    esperar: (ms) => new Promise((r) => setTimeout(r, ms)),
    onEtapa,
  });
}

// Token temporário da AssemblyAI para o streaming (consome 1 min da cota stt). O WebSocket e os parâmetros vêm do servidor.
export function sttToken() {
  return invocarFuncao(invoke, "stt-token", {}, { timeoutMs: 15000, tentativas: 2 });
}

// Voz ao vivo hospedada: devolve um Blob de áudio, ou null (204) quando não há voz hospedada.
// Áudios já recebidos nesta sessão: ouvir de novo não pede ao servidor outra vez.
const vozesDaSessao = new Map();
const MAX_VOZES_SESSAO = 60;

export async function gerarVoz({ texto, personagemId }) {
  const chave = `${personagemId}|${texto}`;
  if (vozesDaSessao.has(chave)) return vozesDaSessao.get(chave);
  const { data, error } = await supabase.functions.invoke("voz", { body: { texto, personagemId } });
  if (error) {
    // Falha de voz nunca atrapalha a cena: o chamador cai na voz do navegador.
    return null;
  }
  // O servidor manda octet-stream (único tipo que o supabase-js entrega como Blob); aqui vira áudio WAV.
  const blob = data instanceof Blob && data.size > 44 ? new Blob([data], { type: "audio/wav" }) : null;
  if (blob) {
    if (vozesDaSessao.size >= MAX_VOZES_SESSAO) vozesDaSessao.delete(vozesDaSessao.keys().next().value);
    vozesDaSessao.set(chave, blob);
  }
  return blob;
}

// Uma vez por sessão: pede ao servidor o lote do dia, que gera com a cota grátis do Gemini as falas fixas
// que ainda faltam e as guarda. O servidor roda no máximo uma vez por dia; aqui é só um aviso, sem esperar.
let loteDisparado = false;
export function dispararLoteVozes() {
  if (loteDisparado) return;
  loteDisparado = true;
  supabase.functions.invoke("voz", { body: { acao: "lote" } }).catch(() => {});
}

// Cliente das ações da cena-ia (Consulta ao Vivo). Cada função devolve os dados ou lança ErroServidor.
// criar usa timeout de 30 s (a IA monta a ficha); o turno, 15 s; um turnoId repetido é idempotente no servidor.
export const consulta = {
  criar: (dados) => invocarFuncao(invoke, "cena-ia", { acao: "criar_consulta", ...dados }, { timeoutMs: 30000, tentativas: 1 }),
  turno: ({ sessaoId, turnoId, texto, canal }) => invocarFuncao(invoke, "cena-ia", { acao: "turno_consulta", sessaoId, turnoId, texto, canal }, { timeoutMs: 15000, tentativas: 2 }),
  finalizar: ({ sessaoId, registro }) => invocarFuncao(invoke, "cena-ia", { acao: "finalizar_consulta", sessaoId, registro }, { timeoutMs: 30000, tentativas: 1 }),
  retomar: (sessaoId) => invocarFuncao(invoke, "cena-ia", { acao: "retomar_consulta", sessaoId }, { timeoutMs: 15000, tentativas: 2 }),
};

// Plantão com a Enfermeira: o servidor avalia as respostas (texto pela IA, números e lacunas por código).
export const plantao = {
  avaliar: ({ cenarioId, respostas, lacunas }) => invocarFuncao(invoke, "cena-ia", { acao: "avaliar_plantao", cenarioId, respostas, lacunas }, { timeoutMs: 30000, tentativas: 1 }),
};

// Relatório e conversa de uma consulta ENCERRADA, lidos direto das tabelas (a RLS só entrega o que é do aluno e,
// no caso dos turnos, só depois de encerrada; a ficha nunca é legível).
export async function obterRelatorioDaConsulta(sessaoId) {
  const { data: sessao, error } = await supabase.from("consulta_sessoes").select("id, status, personagem_id, personalidade_publica, relatorio, criado_em, encerrado_em").eq("id", sessaoId).maybeSingle();
  if (error || !sessao) throw new ErroServidor("ENTRADA_INVALIDA", "Consulta não encontrada.");
  if (sessao.status !== "encerrada" || !sessao.relatorio) throw new ErroServidor("ENTRADA_INVALIDA", "Esta consulta ainda não foi encerrada.");
  const { data: turnos } = await supabase.from("consulta_turnos").select("ordem, autor, texto").eq("sessao_id", sessaoId).order("ordem", { ascending: true });
  return { sessao, turnos: turnos ?? [] };
}
