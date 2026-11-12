// Progresso na conta: o que antes ficava só no aparelho (ofensiva, PE, histórico, revisão) passa a ir para o
// Supabase (tabela progresso_conta) e volta em qualquer aparelho em que a pessoa entrar.
// Fluxo: ao entrar, baixa da conta, mescla com o aparelho (mesclarProgresso.js), grava nos dois. Depois, cada
// mudança local avisa (evento EVENTO_PROGRESSO) e a subida acontece agrupada, alguns segundos depois.
// Também atualiza o perfil público (perfil_publico), que amigos e o pódio leem.
// Se as tabelas ainda não existem (migration 015 não aplicada) ou não há rede, tudo continua no aparelho.
import { supabase, isSupabaseConfigured } from "@/services/supabaseClient";
import { mesclarPacote, numerosDoPerfil } from "./mesclarProgresso.js";

export const EVENTO_PROGRESSO = "enfere:progresso-alterado";
export const EVENTO_SINCRONIZADO = "enfere:progresso-sincronizado";

const limpa = (id) => String(id).replace(/[^a-zA-Z0-9_-]/g, "_");
const CHAVES = {
  gamificacao: (id) => `enfermeiro_digital_gamification_state_${limpa(id)}`,
  historico: (id) => `enfere_clinical_history_v1_${limpa(id)}`,
  revisao: (id) => `enfere_questoes_revisao_v1_${limpa(id)}`,
};

function ler(chave, padrao) {
  try {
    const raw = localStorage.getItem(chave);
    return raw ? JSON.parse(raw) : padrao;
  } catch {
    return padrao;
  }
}

export function lerPacoteLocal(id) {
  return {
    gamificacao: ler(CHAVES.gamificacao(id), null),
    historico: ler(CHAVES.historico(id), []),
    revisao: ler(CHAVES.revisao(id), []),
  };
}

function gravarPacoteLocal(id, pacote) {
  try {
    if (pacote.gamificacao) localStorage.setItem(CHAVES.gamificacao(id), JSON.stringify(pacote.gamificacao));
    localStorage.setItem(CHAVES.historico(id), JSON.stringify(pacote.historico ?? []));
    localStorage.setItem(CHAVES.revisao(id), JSON.stringify(pacote.revisao ?? []));
  } catch {
    /* aparelho sem espaço: segue com o que tem */
  }
}

let disponivel = true; // vira false se a tabela não existe (migration ainda não aplicada)
let perfilGarantido = null;

async function garantirPerfilPublico(id, nome) {
  if (perfilGarantido === id) return;
  const { data, error } = await supabase.from("perfil_publico").select("user_id").eq("user_id", id).maybeSingle();
  if (error) throw error;
  if (!data) {
    const { error: e2 } = await supabase.from("perfil_publico").insert({ user_id: id, nome: (nome || "Estudante").slice(0, 40) });
    if (e2 && e2.code !== "23505") throw e2;
  }
  perfilGarantido = id;
}

async function subir(id, pacote) {
  if (!disponivel || !isSupabaseConfigured() || !id) return;
  const agora = new Date().toISOString();
  const { error } = await supabase.from("progresso_conta").upsert({ user_id: id, dados: pacote, atualizado_em: agora });
  if (error) throw error;
  if (pacote.gamificacao) {
    const { error: e2 } = await supabase
      .from("perfil_publico")
      .update({ ...numerosDoPerfil(pacote.gamificacao), atualizado_em: agora })
      .eq("user_id", id);
    if (e2) throw e2;
  }
}

const tabelaFaltando = (e) => e && (e.code === "42P01" || e.code === "PGRST205" || /does not exist|schema cache/i.test(e.message || ""));

/** Ao entrar: baixa, mescla com o aparelho, grava nos dois lados. */
export async function sincronizarAoEntrar(usuario) {
  const id = usuario?.id;
  if (!id || !isSupabaseConfigured() || !disponivel) return { ok: false };
  try {
    await garantirPerfilPublico(id, usuario.full_name || usuario.name);
    const { data, error } = await supabase.from("progresso_conta").select("dados").eq("user_id", id).maybeSingle();
    if (error) throw error;
    const mesclado = mesclarPacote(lerPacoteLocal(id), data?.dados || {});
    gravarPacoteLocal(id, mesclado);
    await subir(id, mesclado);
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENTO_SINCRONIZADO, { detail: { id } }));
    return { ok: true };
  } catch (e) {
    if (tabelaFaltando(e)) disponivel = false;
    else console.warn("[sincronizacao] não foi possível sincronizar agora:", e?.message || e);
    return { ok: false, erro: e };
  }
}

let timer = null;
let pendente = null;
/** Agrupa as mudanças e sobe alguns segundos depois. */
export function agendarSubida(id, espera = 4000) {
  if (!id || !disponivel) return;
  pendente = id;
  clearTimeout(timer);
  timer = setTimeout(descarregar, espera);
}

/** Sobe já o que estiver pendente (ao sair da aba, por exemplo). */
export async function descarregar() {
  clearTimeout(timer);
  const id = pendente;
  pendente = null;
  if (!id) return;
  try {
    await subir(id, lerPacoteLocal(id));
  } catch (e) {
    if (tabelaFaltando(e)) disponivel = false;
  }
}

/** Avisa que o progresso local mudou (chamado pelos serviços que gravam no aparelho). */
export function avisarProgressoAlterado() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENTO_PROGRESSO));
}
