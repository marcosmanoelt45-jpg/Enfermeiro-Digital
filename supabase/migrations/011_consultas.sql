-- 011_consultas.sql (F3 do plano Cenas ao Vivo)
-- Sessões da Consulta ao Vivo: sessão, ficha-verdade (só servidor) e turnos.
-- O cliente só LÊ as próprias sessões, e só colunas seguras: nunca a confiança numérica, a contagem de temas
-- nem as notas de memória (C8). Escrita é só pelo service role (Edge Function) e pela função abaixo.

create table if not exists public.consulta_sessoes (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null default auth.uid() references auth.users (id) on delete cascade,
  personagem_id           text not null,
  personalidade_publica   text not null,                       -- "surpresa" fica "surpresa"
  tema                    text,
  status                  text not null default 'ativa' check (status in ('ativa', 'encerrada')),
  turnos_aluno            int  not null default 0,
  confianca               int  check (confianca between 0 and 100),
  contagem_temas          jsonb not null default '{}'::jsonb,
  notas_memoria           text[] not null default '{}',
  relatorio               jsonb,
  criado_em               timestamptz not null default now(),
  encerrado_em            timestamptz
);

-- A ficha-verdade nunca sai do servidor: RLS ligada, nenhuma policy, nenhuma permissão para o cliente.
create table if not exists public.consulta_fichas (
  sessao_id uuid primary key references public.consulta_sessoes (id) on delete cascade,
  ficha     jsonb not null
);

create table if not exists public.consulta_turnos (
  id                uuid primary key,
  sessao_id         uuid not null references public.consulta_sessoes (id) on delete cascade,
  ordem             int  not null,
  autor             text not null check (autor in ('aluno', 'paciente')),
  texto             text not null,
  canal             text,
  emocao            text,
  revelados         text[] not null default '{}',
  confianca_depois  int,
  criado_em         timestamptz not null default now(),
  unique (sessao_id, ordem)
);

create index if not exists consulta_sessoes_user_idx on public.consulta_sessoes (user_id, criado_em desc);

alter table public.consulta_sessoes enable row level security;
alter table public.consulta_fichas  enable row level security;
alter table public.consulta_turnos  enable row level security;

-- Nada de escrita para o cliente e nada de ficha.
revoke all on table public.consulta_sessoes from anon, authenticated;
revoke all on table public.consulta_fichas  from anon, authenticated;
revoke all on table public.consulta_turnos  from anon, authenticated;

-- Leitura por coluna: sem confianca, contagem_temas e notas_memoria.
grant select (id, user_id, personagem_id, personalidade_publica, tema, status, turnos_aluno, relatorio, criado_em, encerrado_em)
  on public.consulta_sessoes to authenticated;
grant select (id, sessao_id, ordem, autor, texto, canal, emocao, criado_em)
  on public.consulta_turnos to authenticated;

drop policy if exists consulta_sessoes_select_proprias on public.consulta_sessoes;
create policy consulta_sessoes_select_proprias on public.consulta_sessoes
  for select to authenticated
  using (user_id = auth.uid());

-- Rever a conversa só depois de encerrada (durante a sessão a conversa vem da função retomar_consulta).
drop policy if exists consulta_turnos_select_encerradas on public.consulta_turnos;
create policy consulta_turnos_select_encerradas on public.consulta_turnos
  for select to authenticated
  using (exists (
    select 1 from public.consulta_sessoes s
    where s.id = consulta_turnos.sessao_id and s.user_id = auth.uid() and s.status = 'encerrada'
  ));

-- Grava o turno do aluno e a resposta do paciente e atualiza a sessão, tudo numa transação.
-- Só o service role executa. Devolve false (sem gravar) se o turno do aluno já existe: idempotência.
create or replace function public.consulta_registrar_turno(
  p_sessao uuid,
  p_turno_aluno uuid,
  p_texto_aluno text,
  p_canal text,
  p_fala text,
  p_emocao text,
  p_revelados text[],
  p_confianca int,
  p_contagem jsonb,
  p_notas text[]
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ordem int;
  v_status text;
begin
  select status into v_status from public.consulta_sessoes where id = p_sessao for update;
  if v_status is null then
    raise exception 'sessão não encontrada' using errcode = 'P0002';
  end if;
  if v_status <> 'ativa' then
    raise exception 'sessão encerrada' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.consulta_turnos where id = p_turno_aluno) then
    return false;
  end if;

  select coalesce(max(ordem), 0) + 1 into v_ordem from public.consulta_turnos where sessao_id = p_sessao;

  insert into public.consulta_turnos (id, sessao_id, ordem, autor, texto, canal)
  values (p_turno_aluno, p_sessao, v_ordem, 'aluno', p_texto_aluno, p_canal);

  insert into public.consulta_turnos (id, sessao_id, ordem, autor, texto, emocao, revelados, confianca_depois)
  values (gen_random_uuid(), p_sessao, v_ordem + 1, 'paciente', p_fala, p_emocao, coalesce(p_revelados, '{}'), p_confianca);

  update public.consulta_sessoes
     set turnos_aluno = turnos_aluno + 1,
         confianca = p_confianca,
         contagem_temas = coalesce(p_contagem, contagem_temas),
         notas_memoria = coalesce(p_notas, notas_memoria)
   where id = p_sessao;

  return true;
end;
$$;

revoke execute on function public.consulta_registrar_turno(uuid, uuid, text, text, text, text, text[], int, jsonb, text[]) from public, anon, authenticated;
grant execute on function public.consulta_registrar_turno(uuid, uuid, text, text, text, text, text[], int, jsonb, text[]) to service_role;
