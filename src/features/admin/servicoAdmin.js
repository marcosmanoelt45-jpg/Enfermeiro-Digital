// Cliente da Edge Function `admin`. Quem decide se a conta é admin é o servidor (tabela public.admins);
// aqui só se pergunta, para mostrar ou esconder o link.
import { supabase, isSupabaseConfigured } from "@/services/supabaseClient";
import { invocarFuncao } from "@/features/cena/logica/chamada.js";

const invoke = (nome, corpo) => supabase.functions.invoke(nome, { body: corpo });
const chamar = (corpo, timeoutMs = 20000) => invocarFuncao(invoke, "admin", corpo, { timeoutMs, tentativas: 1 });

export async function souAdmin() {
  if (!isSupabaseConfigured()) return false;
  try {
    const r = await chamar({ acao: "sou_admin" }, 10000);
    return r?.admin === true;
  } catch {
    return false;
  }
}

export const listarContas = (busca = "") => chamar({ acao: "listar", busca });
export const historicoDaConta = (userId) => chamar({ acao: "historico", userId });
export const deletarConta = (userId, confirmarEmail) => chamar({ acao: "deletar", userId, confirmarEmail });
