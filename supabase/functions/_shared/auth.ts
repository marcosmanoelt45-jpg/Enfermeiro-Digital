// Autenticação das Edge Functions: exige uma SESSÃO de usuário válida.
// A chave anon é pública (vai no bundle). Aceitar só "um header presente" transformaria as chaves pagas
// do servidor num proxy aberto, por isso a sessão é conferida no Supabase Auth.
import { createClient } from "npm:@supabase/supabase-js@2";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { ErroApp } from "./erros.ts";

export interface Usuario {
  userId: string;
  // Cliente com o JWT do usuário: as regras de RLS e o auth.uid() valem para ele.
  supabaseUsuario: SupabaseClient;
  // Cliente com a service role, criado só na primeira vez que alguém usa. Nunca o exponha ao cliente.
  readonly supabaseAdmin: SupabaseClient;
}

export async function exigirUsuario(req: Request): Promise<Usuario> {
  const cabecalho = req.headers.get("Authorization");
  if (!cabecalho?.startsWith("Bearer ")) {
    throw new ErroApp("NAO_AUTENTICADO", "Sessão obrigatória.");
  }
  const token = cabecalho.slice("Bearer ".length).trim();

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const opcoes = { auth: { persistSession: false, autoRefreshToken: false } };

  const supabaseUsuario = createClient(url, anon, {
    ...opcoes,
    global: { headers: { Authorization: cabecalho } },
  });
  const { data, error } = await supabaseUsuario.auth.getUser(token);
  if (error || !data?.user?.id) {
    throw new ErroApp("NAO_AUTENTICADO", "Sessão inválida ou expirada.");
  }

  let admin: SupabaseClient | null = null;
  return {
    userId: data.user.id,
    supabaseUsuario,
    get supabaseAdmin() {
      if (!admin) admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", opcoes);
      return admin;
    },
  };
}
