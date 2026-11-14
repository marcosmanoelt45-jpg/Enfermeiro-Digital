-- PE de cada dia (últimos 28 dias) no perfil público, para o calendário "Últimas 4 semanas" do perfil do amigo.
-- Formato: { "AAAA-MM-DD": PE }. Escrito pelo próprio dono (RLS de update já exige user_id = auth.uid()).
alter table public.perfil_publico
  add column if not exists pe_dias jsonb not null default '{}'::jsonb;

alter table public.perfil_publico
  drop constraint if exists perfil_publico_pe_dias_tamanho;
alter table public.perfil_publico
  add constraint perfil_publico_pe_dias_tamanho
  check (jsonb_typeof(pe_dias) = 'object' and pg_column_size(pe_dias) < 2000);
