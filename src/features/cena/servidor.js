// Cliente das Edge Functions do Enfere: nenhuma chave de provedor passa pelo navegador.
import { supabase, isSupabaseConfigured, isLocalDemoSession } from "@/services/supabaseClient";
import { invocarFuncao } from "./logica/chamada.js";
import { aguardarTranscricao, estimarDuracaoSeg } from "./logica/transcricao.js";

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
export async function gerarVoz({ texto, personagemId }) {
  const { data, error } = await supabase.functions.invoke("voz", { body: { texto, personagemId } });
  if (error) {
    // Falha de voz nunca atrapalha a cena: o chamador cai na voz do navegador.
    return null;
  }
  return data instanceof Blob && data.size > 0 ? data : null;
}

// Cliente das ações da cena-ia (Consulta ao Vivo). Cada função devolve os dados ou lança ErroServidor.
// criar usa timeout de 30 s (a IA monta a ficha); o turno, 15 s; um turnoId repetido é idempotente no servidor.
export const consulta = {
  criar: (dados) => invocarFuncao(invoke, "cena-ia", { acao: "criar_consulta", ...dados }, { timeoutMs: 30000, tentativas: 1 }),
  turno: ({ sessaoId, turnoId, texto, canal }) => invocarFuncao(invoke, "cena-ia", { acao: "turno_consulta", sessaoId, turnoId, texto, canal }, { timeoutMs: 15000, tentativas: 2 }),
  retomar: (sessaoId) => invocarFuncao(invoke, "cena-ia", { acao: "retomar_consulta", sessaoId }, { timeoutMs: 15000, tentativas: 2 }),
};
