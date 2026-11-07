// Repositório do banco para a cena-ia: sempre com a service role (as tabelas não aceitam escrita do cliente).
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { ErroApp } from "../_shared/erros.ts";
import type { Repositorio, SessaoDb, TurnoDb } from "./acoes/tipos.ts";

function falhou(e: { message?: string; code?: string } | null, contexto: string): never {
  console.error(`[cena-ia] ${contexto}:`, e?.code ?? "sem código");
  throw new ErroApp("ERRO_INTERNO", "Erro ao acessar os dados da consulta.");
}

export function criarRepositorio(admin: SupabaseClient): Repositorio {
  return {
    async criarSessao(d) {
      const { data, error } = await admin
        .from("consulta_sessoes")
        .insert({ user_id: d.userId, personagem_id: d.personagemId, personalidade_publica: d.personalidadePublica, tema: d.tema, confianca: d.confianca })
        .select("id")
        .single();
      if (error || !data) falhou(error, "criarSessao");
      return { id: data.id as string };
    },

    async salvarFicha(sessaoId, ficha) {
      const { error } = await admin.from("consulta_fichas").insert({ sessao_id: sessaoId, ficha });
      if (error) falhou(error, "salvarFicha");
    },

    async carregarSessao(sessaoId, userId) {
      const { data, error } = await admin.from("consulta_sessoes").select("*").eq("id", sessaoId).eq("user_id", userId).maybeSingle();
      if (error) falhou(error, "carregarSessao");
      return (data as SessaoDb | null) ?? null;
    },

    async carregarFicha(sessaoId) {
      const { data, error } = await admin.from("consulta_fichas").select("ficha").eq("sessao_id", sessaoId).maybeSingle();
      if (error) falhou(error, "carregarFicha");
      return data?.ficha ?? null;
    },

    async carregarTurnos(sessaoId) {
      const { data, error } = await admin
        .from("consulta_turnos")
        .select("id, ordem, autor, texto, canal, emocao, revelados, confianca_depois")
        .eq("sessao_id", sessaoId)
        .order("ordem", { ascending: true });
      if (error) falhou(error, "carregarTurnos");
      return (data ?? []) as TurnoDb[];
    },

    async respostaSalva(turnoId, sessaoId) {
      const { data: aluno, error: e1 } = await admin.from("consulta_turnos").select("ordem").eq("id", turnoId).eq("sessao_id", sessaoId).maybeSingle();
      if (e1) falhou(e1, "respostaSalva.aluno");
      if (!aluno) return null;
      const { data: paciente, error: e2 } = await admin
        .from("consulta_turnos")
        .select("texto, emocao, confianca_depois")
        .eq("sessao_id", sessaoId)
        .eq("ordem", aluno.ordem + 1)
        .maybeSingle();
      if (e2) falhou(e2, "respostaSalva.paciente");
      if (!paciente) return null;
      const { data: sessao, error: e3 } = await admin.from("consulta_sessoes").select("turnos_aluno").eq("id", sessaoId).single();
      if (e3 || !sessao) falhou(e3, "respostaSalva.sessao");
      return { fala: paciente.texto as string, emocao: (paciente.emocao as string) ?? "falando", confianca: (paciente.confianca_depois as number) ?? 0, turnosAluno: sessao.turnos_aluno as number };
    },

    async registrarTurno(r) {
      const { data, error } = await admin.rpc("consulta_registrar_turno", {
        p_sessao: r.sessaoId,
        p_turno_aluno: r.turnoAlunoId,
        p_texto_aluno: r.textoAluno,
        p_canal: r.canal,
        p_fala: r.fala,
        p_emocao: r.emocao,
        p_revelados: r.revelados,
        p_confianca: r.confianca,
        p_contagem: r.contagemTemas,
        p_notas: r.notas,
      });
      if (error) {
        if (error.code === "P0001") throw new ErroApp("SESSAO_ENCERRADA", "Esta consulta já foi encerrada.");
        falhou(error, "registrarTurno");
      }
      return data === true;
    },
  };
}
