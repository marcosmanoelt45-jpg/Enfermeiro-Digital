// ==============================================================================
// admin/index.ts
// Acesso de administrador: listar contas, ver o histórico de uma conta e apagar uma conta.
// Quem é admin vem da tabela public.admins (migration 017), lida com a service role. Nada que o cliente
// mande decide isso: qualquer outra conta recebe 403 em toda ação, exceto `sou_admin`, que só responde false.
// Log: só ids e o nome da ação (tabela admin_log e logEvento), nunca o texto das conversas.
// ==============================================================================
import { responderOptions } from "../_shared/cors.ts";
import { exigirUsuario } from "../_shared/auth.ts";
import { ErroApp, erroDeExcecao, ok } from "../_shared/erros.ts";
import { logEvento } from "../_shared/log.ts";
import {
  ehUuid,
  filtrarContas,
  motivoParaRecusarDelecao,
  ordenarContas,
  resumirAtividades,
  resumirConta,
} from "./regras.ts";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

const MAX_SESSOES = 50;

async function ehAdmin(admin: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await admin.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (error) {
    logEvento("admin_tabela_falhou", { codigo: error.code ?? "?" });
    return false; // sem a tabela (migration não aplicada) ninguém é admin
  }
  return Boolean(data);
}

async function registrar(admin: SupabaseClient, adminId: string, acao: string, alvoId: string) {
  const { error } = await admin.from("admin_log").insert({ admin_id: adminId, acao, alvo_id: alvoId });
  if (error) logEvento("admin_log_falhou", { codigo: error.code ?? "?" });
  logEvento("admin_acao", { admin: adminId, acao, alvo: alvoId });
}

async function todasAsContas(admin: SupabaseClient) {
  // deno-lint-ignore no-explicit-any
  const usuarios: any[] = [];
  for (let pagina = 1; pagina <= 50; pagina++) {
    const { data, error } = await admin.auth.admin.listUsers({ page: pagina, perPage: 1000 });
    if (error) throw new ErroApp("ERRO_INTERNO", "Não foi possível listar as contas.");
    usuarios.push(...data.users);
    if (data.users.length < 1000) break;
  }
  return usuarios;
}

async function nomesPublicos(admin: SupabaseClient, ids: string[]): Promise<Record<string, string>> {
  if (!ids.length) return {};
  const { data } = await admin.from("perfil_publico").select("user_id, nome").in("user_id", ids);
  const nomes: Record<string, string> = {};
  for (const p of data ?? []) if (p.nome) nomes[p.user_id] = p.nome;
  return nomes;
}

async function buscarConta(admin: SupabaseClient, alvoId: unknown) {
  if (!ehUuid(alvoId)) throw new ErroApp("ENTRADA_INVALIDA", "Conta inválida.");
  const { data, error } = await admin.auth.admin.getUserById(alvoId);
  if (error || !data?.user) throw new ErroApp("NAO_ENCONTRADO", "Conta não encontrada.");
  return data.user;
}

Deno.serve(async (req) => {
  const preVoo = responderOptions(req);
  if (preVoo) return preVoo;

  try {
    if (req.method !== "POST") throw new ErroApp("ENTRADA_INVALIDA", "Use POST.");
    const usuario = await exigirUsuario(req);
    const admin = usuario.supabaseAdmin;
    const corpo = await req.json().catch(() => ({}));
    const acao = corpo?.acao;

    const souAdmin = await ehAdmin(admin, usuario.userId);
    if (acao === "sou_admin") return ok({ admin: souAdmin });
    if (!souAdmin) {
      logEvento("admin_negado", { usuario: usuario.userId });
      throw new ErroApp("SEM_PERMISSAO", "Acesso restrito ao administrador.");
    }

    switch (acao) {
      case "listar": {
        const usuarios = await todasAsContas(admin);
        const nomes = await nomesPublicos(admin, usuarios.map((u) => u.id));
        const contas = ordenarContas(filtrarContas(usuarios.map((u) => resumirConta(u, nomes)), corpo.busca));
        return ok({ contas, total: usuarios.length, voceId: usuario.userId });
      }

      case "historico": {
        const conta = await buscarConta(admin, corpo.userId);
        const nomes = await nomesPublicos(admin, [conta.id]);

        const { data: sessoes, error: e1 } = await admin
          .from("consulta_sessoes")
          .select("id, personagem_id, tema, status, turnos_aluno, criado_em, encerrado_em")
          .eq("user_id", conta.id)
          .order("criado_em", { ascending: false })
          .limit(MAX_SESSOES);
        if (e1) throw new ErroApp("ERRO_INTERNO", "Não foi possível ler as consultas.");

        const ids = (sessoes ?? []).map((s) => s.id);
        // deno-lint-ignore no-explicit-any
        let turnos: any[] = [];
        if (ids.length) {
          const { data, error } = await admin
            .from("consulta_turnos")
            .select("sessao_id, ordem, autor, texto, criado_em")
            .in("sessao_id", ids)
            .order("ordem", { ascending: true });
          if (error) throw new ErroApp("ERRO_INTERNO", "Não foi possível ler as conversas.");
          turnos = data ?? [];
        }

        const { data: progresso } = await admin
          .from("progresso_conta")
          .select("dados, atualizado_em")
          .eq("user_id", conta.id)
          .maybeSingle();

        await registrar(admin, usuario.userId, "ver_historico", conta.id);
        return ok({
          conta: resumirConta(conta, nomes),
          consultas: (sessoes ?? []).map((s) => ({
            id: s.id,
            personagem: s.personagem_id,
            tema: s.tema,
            status: s.status,
            turnosAluno: s.turnos_aluno,
            criadoEm: s.criado_em,
            encerradoEm: s.encerrado_em,
            mensagens: turnos
              .filter((t) => t.sessao_id === s.id)
              .map((t) => ({ ordem: t.ordem, autor: t.autor, texto: t.texto, em: t.criado_em })),
          })),
          atividades: resumirAtividades(progresso?.dados?.historico),
          progressoAtualizadoEm: progresso?.atualizado_em ?? null,
        });
      }

      case "deletar": {
        const conta = await buscarConta(admin, corpo.userId);
        const motivo = motivoParaRecusarDelecao({
          adminId: usuario.userId,
          alvoId: conta.id,
          alvoEmail: conta.email ?? "",
          emailDigitado: corpo.confirmarEmail,
          alvoEhAdmin: await ehAdmin(admin, conta.id),
        });
        if (motivo) throw new ErroApp(conta.id === usuario.userId ? "SEM_PERMISSAO" : "ENTRADA_INVALIDA", motivo);

        // As tabelas do aluno (consultas, progresso, perfil, amizades, convites, cota) saem em cascata.
        const { error } = await admin.auth.admin.deleteUser(conta.id);
        if (error) {
          logEvento("admin_deletar_falhou", { alvo: conta.id, status: error.status ?? 0 });
          throw new ErroApp(
            "CONFLITO",
            "Não foi possível apagar: a conta tem registros ligados (pacientes, turmas ou evoluções).",
          );
        }
        await registrar(admin, usuario.userId, "deletar_conta", conta.id);
        return ok({ apagada: true });
      }

      default:
        throw new ErroApp("ENTRADA_INVALIDA", "Ação desconhecida.");
    }
  } catch (e) {
    return erroDeExcecao(e);
  }
});
