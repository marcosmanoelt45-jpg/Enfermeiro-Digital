-- Perfil criado pelo banco no cadastro. Antes o app tentava criar o perfil logo depois do signUp, mas sem
-- sessão (confirmação de e-mail) a RLS recusava e o erro era engolido: nenhum usuário tinha perfil.
-- O gatilho roda como dono da tabela, lê só nome, COREN e tipo dos metadados do cadastro e aplica a mesma
-- lista de papéis permitidos do 008 (aluno, professor, enfermeiro; padrão aluno). org_id nunca vem do cliente.
create or replace function public.criar_perfil_do_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  nome text := left(coalesce(nullif(trim(meta->>'full_name'), ''), nullif(trim(meta->>'name'), ''), split_part(coalesce(new.email, ''), '@', 1), 'Estudante de Enfermagem'), 120);
  papel text := coalesce(meta->>'user_type', 'aluno');
begin
  if papel not in ('aluno', 'professor', 'enfermeiro') then
    papel := 'aluno';
  end if;
  if nome = '' then
    nome := 'Estudante de Enfermagem';
  end if;
  insert into public.profiles (id, full_name, coren, role)
  values (new.id, nome, left(nullif(trim(meta->>'coren'), ''), 40), papel)
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.criar_perfil_do_usuario() from public, anon, authenticated;

drop trigger if exists trg_criar_perfil_do_usuario on auth.users;
create trigger trg_criar_perfil_do_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil_do_usuario();

-- Usuários que já existem e ficaram sem perfil.
insert into public.profiles (id, full_name, coren, role)
select
  u.id,
  left(coalesce(nullif(trim(u.raw_user_meta_data->>'full_name'), ''), nullif(trim(u.raw_user_meta_data->>'name'), ''), nullif(split_part(coalesce(u.email, ''), '@', 1), ''), 'Estudante de Enfermagem'), 120),
  left(nullif(trim(u.raw_user_meta_data->>'coren'), ''), 40),
  case when u.raw_user_meta_data->>'user_type' in ('aluno', 'professor', 'enfermeiro') then u.raw_user_meta_data->>'user_type' else 'aluno' end
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);
