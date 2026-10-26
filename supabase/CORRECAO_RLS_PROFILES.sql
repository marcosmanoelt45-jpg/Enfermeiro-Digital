-- ==============================================================================
-- CORRECAO_RLS_PROFILES.sql
-- Solução para o erro: "infinite recursion detected in policy for relation profiles"
-- Executar no SQL Editor do Supabase (https://supabase.com/dashboard/project/xwqgyvqofxdqdbhltdzf/sql)
-- ==============================================================================

-- 1. Criar função auxiliar SECURITY DEFINER
-- O modificador SECURITY DEFINER executa a query com privilégios de superusuário/owner,
-- contornando o RLS de SELECT na tabela profiles e evitando o ciclo de recursão infinita.
CREATE OR REPLACE FUNCTION public.get_auth_user_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. Recriar política de SELECT em profiles sem recursão
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil e perfis da sua organização" ON public.profiles;

CREATE POLICY "Usuários podem ver seu próprio perfil e perfis da sua organização"
ON public.profiles FOR SELECT
USING (
  id = auth.uid() 
  OR (org_id IS NOT NULL AND org_id = public.get_auth_user_org_id())
);

-- 3. Atualizar políticas de tabelas clínicas para utilizar a função otimizada
DROP POLICY IF EXISTS "Isolamento por organizacao em pacientes" ON public.patients;
CREATE POLICY "Isolamento por organizacao em pacientes"
ON public.patients FOR ALL
USING (
  org_id = public.get_auth_user_org_id()
  OR created_by_id = auth.uid()
);

DROP POLICY IF EXISTS "Isolamento por organizacao em avaliacoes" ON public.assessments;
CREATE POLICY "Isolamento por organizacao em avaliacoes"
ON public.assessments FOR ALL
USING (
  org_id = public.get_auth_user_org_id()
  OR created_by_id = auth.uid()
);

DROP POLICY IF EXISTS "Isolamento por organizacao em evolucoes" ON public.evolutions;
CREATE POLICY "Isolamento por organizacao em evolucoes"
ON public.evolutions FOR ALL
USING (
  org_id = public.get_auth_user_org_id()
  OR created_by_id = auth.uid()
);

-- 4. Garantir permissões de execução da função para usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_auth_user_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_user_org_id() TO anon;
