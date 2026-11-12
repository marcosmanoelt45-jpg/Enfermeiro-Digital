-- Progresso na conta, perfil público, convites e amizades (o começo do multiplayer).
--
-- progresso_conta: o que antes ficava só no aparelho (ofensiva, PE, histórico de atividades, fila de revisão).
--   Só o dono lê e escreve. O app mescla com o que está no aparelho ao entrar e sobe as mudanças.
-- perfil_publico: o que amigos e o pódio enxergam (nome, avatar, ofensiva, PE). Nada de e-mail, COREN ou papel.
--   Quem vê: o próprio dono, os amigos, e qualquer conta logada se o dono ligou "aparecer no ranking geral".
-- convites: código curto que vira link (enfere.vercel.app/convite/CODIGO), mandado por WhatsApp etc.
-- amizades: um par por amizade (usuario_a < usuario_b). Só nasce pela função aceitar_convite (sem INSERT direto),
--   então ninguém se "adiciona" na conta de outro sem o convite dele.

-- ---------------------------------------------------------------- progresso na conta
create table if not exists public.progresso_conta (
  user_id uuid primary key references auth.users (id) on delete cascade,
  dados jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now(),
  constraint progresso_conta_tamanho check (pg_column_size(dados) < 2000000)
);
alter table public.progresso_conta enable row level security;

drop policy if exists progresso_conta_dono on public.progresso_conta;
create policy progresso_conta_dono on public.progresso_conta
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------- amizades
create table if not exists public.amizades (
  usuario_a uuid not null references auth.users (id) on delete cascade,
  usuario_b uuid not null references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (usuario_a, usuario_b),
  constraint amizades_ordem check (usuario_a < usuario_b)
);
create index if not exists amizades_usuario_b_idx on public.amizades (usuario_b);
alter table public.amizades enable row level security;

drop policy if exists amizades_ver on public.amizades;
create policy amizades_ver on public.amizades
  for select to authenticated
  using ((select auth.uid()) in (usuario_a, usuario_b));

drop policy if exists amizades_desfazer on public.amizades;
create policy amizades_desfazer on public.amizades
  for delete to authenticated
  using ((select auth.uid()) in (usuario_a, usuario_b));

-- Usada pela RLS do perfil público. SECURITY DEFINER para não depender da RLS de amizades (sem recursão).
create or replace function public.sao_amigos(outro uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.amizades
    where usuario_a = least((select auth.uid()), outro)
      and usuario_b = greatest((select auth.uid()), outro)
  );
$$;
revoke all on function public.sao_amigos(uuid) from public, anon;
grant execute on function public.sao_amigos(uuid) to authenticated;

-- ---------------------------------------------------------------- perfil público
create table if not exists public.perfil_publico (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default 'Estudante' check (char_length(nome) between 1 and 40),
  avatar jsonb not null default '{}'::jsonb check (pg_column_size(avatar) < 4000),
  ofensiva integer not null default 0 check (ofensiva between 0 and 100000),
  melhor_ofensiva integer not null default 0 check (melhor_ofensiva between 0 and 100000),
  pe_total integer not null default 0 check (pe_total between 0 and 100000000),
  pe_semana integer not null default 0 check (pe_semana between 0 and 10000000),
  semana text check (semana ~ '^\d{4}-W\d{2}$'),
  dias_estudados date[] not null default '{}' check (cardinality(dias_estudados) <= 90),
  no_ranking_geral boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists perfil_publico_ranking_idx on public.perfil_publico (no_ranking_geral, ofensiva desc);
alter table public.perfil_publico enable row level security;

drop policy if exists perfil_publico_ver on public.perfil_publico;
create policy perfil_publico_ver on public.perfil_publico
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or no_ranking_geral
    or public.sao_amigos(user_id)
  );

drop policy if exists perfil_publico_criar on public.perfil_publico;
create policy perfil_publico_criar on public.perfil_publico
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists perfil_publico_editar on public.perfil_publico;
create policy perfil_publico_editar on public.perfil_publico
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------- convites
create table if not exists public.convites (
  codigo text primary key check (codigo ~ '^[A-Z2-9]{8}$'),
  dono uuid not null references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null default (now() + interval '30 days'),
  usos integer not null default 0
);
create index if not exists convites_dono_idx on public.convites (dono);
alter table public.convites enable row level security;

drop policy if exists convites_dono_ver on public.convites;
create policy convites_dono_ver on public.convites
  for select to authenticated
  using (dono = (select auth.uid()));

drop policy if exists convites_dono_criar on public.convites;
create policy convites_dono_criar on public.convites
  for insert to authenticated
  with check (dono = (select auth.uid()) and usos = 0);

drop policy if exists convites_dono_apagar on public.convites;
create policy convites_dono_apagar on public.convites
  for delete to authenticated
  using (dono = (select auth.uid()));

-- Quem abre o link vê de quem é o convite (nome e avatar) antes de entrar. Funciona sem login.
create or replace function public.ver_convite(p_codigo text)
returns table (nome text, avatar jsonb, valido boolean)
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(p.nome, 'Um colega'), coalesce(p.avatar, '{}'::jsonb), (c.expira_em > now())
  from public.convites c
  left join public.perfil_publico p on p.user_id = c.dono
  where c.codigo = upper(p_codigo);
$$;
revoke all on function public.ver_convite(text) from public;
grant execute on function public.ver_convite(text) to anon, authenticated;

-- Aceitar: cria a amizade entre quem abriu o link e o dono do convite. Devolve o id do novo amigo.
create or replace function public.aceitar_convite(p_codigo text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  eu uuid := auth.uid();
  c public.convites%rowtype;
  total integer;
begin
  if eu is null then
    raise exception 'precisa_entrar';
  end if;
  select * into c from public.convites where codigo = upper(p_codigo) for update;
  if not found then
    raise exception 'convite_inexistente';
  end if;
  if c.expira_em <= now() then
    raise exception 'convite_expirado';
  end if;
  if c.dono = eu then
    raise exception 'convite_proprio';
  end if;
  select count(*) into total from public.amizades where eu in (usuario_a, usuario_b);
  if total >= 300 then
    raise exception 'limite_de_amigos';
  end if;
  insert into public.amizades (usuario_a, usuario_b)
  values (least(eu, c.dono), greatest(eu, c.dono))
  on conflict do nothing;
  update public.convites set usos = usos + 1 where codigo = c.codigo;
  return c.dono;
end;
$$;
revoke all on function public.aceitar_convite(text) from public, anon;
grant execute on function public.aceitar_convite(text) to authenticated;
