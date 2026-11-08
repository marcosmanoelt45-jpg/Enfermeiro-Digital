-- Corrige o erro 500 ao ler o perfil ("infinite recursion detected in policy for relation profiles").
-- As duas políticas de SELECT consultavam a própria tabela profiles dentro da regra, o que faz o Postgres
-- reaplicar a regra sem fim. A função get_auth_user_org_id() (008, SECURITY DEFINER) lê o org_id do usuário
-- sem passar pela RLS, então a regra nova não recursa. Mesma permissão de antes: o próprio perfil e os da
-- mesma organização.
drop policy if exists "Usuarios podem ver perfis da sua organizacao" on public.profiles;
drop policy if exists "profiles_select_policy" on public.profiles;

create policy "profiles_select_policy" on public.profiles
  for select
  using (id = auth.uid() or (org_id is not null and org_id = public.get_auth_user_org_id()));
