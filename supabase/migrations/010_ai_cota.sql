-- 010_ai_cota.sql (F1 do plano Cenas ao Vivo)
-- Cota diária por aluno e por tipo de uso de IA, no banco. Substitui o limite em memória da
-- clinical-ai-sanitize, que zerava a cada reinício da função e não valia entre instâncias.
-- O dia é calculado AQUI, no fuso America/Sao_Paulo, nunca no cliente.

create table if not exists public.ai_uso_diario (
  user_id  uuid not null references auth.users (id) on delete cascade,
  dia      date not null default (now() at time zone 'America/Sao_Paulo')::date,
  tipo     text not null,
  contagem int  not null default 0,
  primary key (user_id, dia, tipo)
);

-- Sem policies: o cliente não lê nem escreve a tabela. Só a função abaixo (security definer) mexe nela.
alter table public.ai_uso_diario enable row level security;
revoke all on table public.ai_uso_diario from anon, authenticated;

-- Tenta consumir p_qtd da cota de hoje. Devolve true se coube em p_limite; false se estouraria.
create or replace function public.consumir_cota(p_tipo text, p_limite int, p_qtd int default 1)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_dia  date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if v_user is null then
    raise exception 'sessão obrigatória' using errcode = '28000';
  end if;
  if p_qtd is null or p_qtd < 1 or p_qtd > 100 then
    raise exception 'p_qtd deve estar entre 1 e 100' using errcode = '22023';
  end if;
  if p_tipo is null or p_tipo not in ('llm', 'consulta', 'turno', 'stt', 'voz', 'avaliacao') then
    raise exception 'tipo de cota inválido' using errcode = '22023';
  end if;
  if p_limite is null or p_limite < 0 then
    raise exception 'p_limite inválido' using errcode = '22023';
  end if;

  -- Um pedido maior que o próprio limite nunca cabe, nem na primeira vez do dia (o insert não tem WHERE).
  if p_qtd > p_limite then
    return false;
  end if;

  -- Upsert atômico: soma só se continuar dentro do limite. Sem linha afetada, `found` fica false.
  insert into public.ai_uso_diario as u (user_id, dia, tipo, contagem)
  values (v_user, v_dia, p_tipo, p_qtd)
  on conflict (user_id, dia, tipo) do update
    set contagem = u.contagem + p_qtd
    where u.contagem + p_qtd <= p_limite;

  return found;
end;
$$;

revoke execute on function public.consumir_cota(text, int, int) from public, anon;
grant execute on function public.consumir_cota(text, int, int) to authenticated;
