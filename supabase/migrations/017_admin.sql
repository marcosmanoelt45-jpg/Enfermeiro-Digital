-- 017: acesso de administrador (Edge Function `admin`).
-- Quem é admin fica só no banco: tabela fechada, sem policy e sem permissão para anon/authenticated.
-- Só o service role (dentro da Edge Function) lê. O cliente nunca define quem é admin.

create table if not exists public.admins (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now()
);

-- Registro das ações do admin: só ids e o nome da ação, nunca texto de mensagem.
-- Sem FK no alvo de propósito: a linha continua depois que a conta é apagada.
create table if not exists public.admin_log (
  id        bigint generated always as identity primary key,
  admin_id  uuid not null,
  acao      text not null check (acao in ('ver_historico', 'deletar_conta')),
  alvo_id   uuid not null,
  criado_em timestamptz not null default now()
);

alter table public.admins    enable row level security;
alter table public.admin_log enable row level security;
revoke all on table public.admins    from anon, authenticated;
revoke all on table public.admin_log from anon, authenticated;

-- O admin é a conta principal do dono.
insert into public.admins (user_id)
select id from auth.users where lower(email) = lower('mxmine45@gmail.com')
on conflict do nothing;
