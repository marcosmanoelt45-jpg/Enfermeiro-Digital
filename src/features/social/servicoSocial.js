// Social no Supabase: perfil público, convites, amizades e pódio (tabelas da migration 015).
// As regras de quem vê o quê ficam no banco (RLS): o app só pede e o banco filtra.
import { supabase, isSupabaseConfigured } from "@/services/supabaseClient";
import { gerarCodigo } from "./logicaSocial.js";
import { semanaIso } from "@/features/conta/mesclarProgresso.js";

export class SocialIndisponivel extends Error {
  constructor() {
    super("O social ainda não está disponível.");
    this.name = "SocialIndisponivel";
  }
}

const CAMPOS = "user_id, nome, avatar, ofensiva, melhor_ofensiva, pe_total, pe_semana, semana, dias_estudados, no_ranking_geral, criado_em";

function falhou(error) {
  if (!error) return;
  if (error.code === "42P01" || error.code === "PGRST205" || error.code === "PGRST202" || /does not exist|schema cache/i.test(error.message || "")) {
    throw new SocialIndisponivel();
  }
  throw error;
}

async function eu() {
  if (!isSupabaseConfigured()) throw new SocialIndisponivel();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) throw new Error("Entre na sua conta para usar o social.");
  return data.user.id;
}

// ---------------------------------------------------------------- perfil
export async function meuPerfil() {
  const id = await eu();
  const { data, error } = await supabase.from("perfil_publico").select(CAMPOS).eq("user_id", id).maybeSingle();
  falhou(error);
  return data;
}

export async function perfilDe(userId) {
  const { data, error } = await supabase.from("perfil_publico").select(CAMPOS).eq("user_id", userId).maybeSingle();
  falhou(error);
  if (data) {
    // PE de cada dia (migration 018): se a coluna ainda não existe, o perfil abre sem os pontos por dia
    const extra = await supabase.from("perfil_publico").select("pe_dias").eq("user_id", userId).maybeSingle();
    if (!extra.error && extra.data?.pe_dias && Object.keys(extra.data.pe_dias).length) data.pe_dias = extra.data.pe_dias;
  }
  return data;
}

/** Atualiza nome, avatar ou a opção de aparecer no ranking geral. */
export async function atualizarMeuPerfil(campos) {
  const id = await eu();
  const permitido = {};
  if (typeof campos.nome === "string") permitido.nome = campos.nome.trim().slice(0, 40) || "Estudante";
  if (campos.avatar && typeof campos.avatar === "object") permitido.avatar = campos.avatar;
  if (typeof campos.no_ranking_geral === "boolean") permitido.no_ranking_geral = campos.no_ranking_geral;
  const { error } = await supabase.from("perfil_publico").upsert({ user_id: id, ...permitido, atualizado_em: new Date().toISOString() });
  falhou(error);
}

// ---------------------------------------------------------------- convites
/** O convite ativo da pessoa (cria um se não tiver). */
export async function meuConvite() {
  const id = await eu();
  const { data, error } = await supabase
    .from("convites")
    .select("codigo, expira_em")
    .eq("dono", id)
    .gt("expira_em", new Date(Date.now() + 3 * 864e5).toISOString())
    .order("criado_em", { ascending: false })
    .limit(1);
  falhou(error);
  if (data?.[0]) return data[0].codigo;
  for (let tentativa = 0; tentativa < 4; tentativa++) {
    const codigo = gerarCodigo();
    const { error: e2 } = await supabase.from("convites").insert({ codigo, dono: id });
    if (!e2) return codigo;
    if (e2.code !== "23505") falhou(e2);
  }
  throw new Error("Não foi possível criar o convite agora.");
}

export const linkDoConvite = (codigo) => `${typeof window !== "undefined" ? window.location.origin : "https://enfere.vercel.app"}/convite/${codigo}`;

/** De quem é o convite (funciona sem login). */
export async function verConvite(codigo) {
  const { data, error } = await supabase.rpc("ver_convite", { p_codigo: codigo });
  falhou(error);
  return data?.[0] ?? null;
}

const ERROS_CONVITE = {
  convite_inexistente: "Esse convite não existe. Peça um link novo para quem te convidou.",
  convite_expirado: "Esse convite expirou. Peça um link novo para quem te convidou.",
  convite_proprio: "Esse é o seu próprio convite. Mande para um colega!",
  limite_de_amigos: "Você chegou ao limite de amigos.",
  precisa_entrar: "Entre na sua conta para aceitar o convite.",
};

/** Aceita o convite: vira amigo do dono. Devolve o id do novo amigo. */
export async function aceitarConvite(codigo) {
  const { data, error } = await supabase.rpc("aceitar_convite", { p_codigo: codigo });
  if (error) {
    const chave = Object.keys(ERROS_CONVITE).find((k) => (error.message || "").includes(k));
    if (chave) throw new Error(ERROS_CONVITE[chave]);
    falhou(error);
  }
  return data;
}

// ---------------------------------------------------------------- amigos
export async function idsDosAmigos() {
  const id = await eu();
  const { data, error } = await supabase.from("amizades").select("usuario_a, usuario_b, criado_em");
  falhou(error);
  return (data ?? []).map((a) => ({ id: a.usuario_a === id ? a.usuario_b : a.usuario_a, desde: a.criado_em }));
}

/** Amigos com o perfil público de cada um. */
export async function listarAmigos() {
  const amizades = await idsDosAmigos();
  if (!amizades.length) return [];
  const { data, error } = await supabase.from("perfil_publico").select(CAMPOS).in("user_id", amizades.map((a) => a.id));
  falhou(error);
  const desde = new Map(amizades.map((a) => [a.id, a.desde]));
  return (data ?? []).map((p) => ({ ...p, amigos_desde: desde.get(p.user_id) }));
}

export async function desfazerAmizade(outroId) {
  const id = await eu();
  const [a, b] = [id, outroId].sort();
  const { error } = await supabase.from("amizades").delete().eq("usuario_a", a).eq("usuario_b", b);
  falhou(error);
}

// ---------------------------------------------------------------- pódio
export const LIMITE_GERAL = 100;
const COLUNA_DA_METRICA = { ofensiva: "ofensiva", melhor_ofensiva: "melhor_ofensiva", pe_semana: "pe_semana" };

/**
 * Perfis do pódio: "amigos" (eu + amigos) ou "geral" (quem ligou o ranking geral, mais eu).
 * No geral, o servidor já ordena pela métrica escolhida e devolve os 100 primeiros (antes vinham os 100 de maior
 * ofensiva, e com muita gente quem liderava em PE ou recorde ficava de fora). PE da semana: só desta semana.
 * Se eu não estou entre os 100, entro no fim marcado com `_fora` (a tela mostra "100+" em vez de uma posição).
 */
export async function perfisDoPodio(escopo = "amigos", metrica = "ofensiva") {
  const id = await eu();
  if (escopo === "geral") {
    const coluna = COLUNA_DA_METRICA[metrica] ?? "ofensiva";
    let q = supabase.from("perfil_publico").select(CAMPOS).eq("no_ranking_geral", true);
    if (coluna === "pe_semana") q = q.eq("semana", semanaAtual());
    const { data, error } = await q.order(coluna, { ascending: false }).order("ofensiva", { ascending: false }).limit(LIMITE_GERAL);
    falhou(error);
    const lista = data ?? [];
    if (!lista.some((p) => p.user_id === id)) {
      const meu = await meuPerfil();
      if (meu) lista.push({ ...meu, _fora: lista.length >= LIMITE_GERAL });
    }
    return lista;
  }
  const amigos = await listarAmigos();
  const meu = await meuPerfil();
  return meu ? [meu, ...amigos] : amigos;
}

export const semanaAtual = () => semanaIso(new Date());
