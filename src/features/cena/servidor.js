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
