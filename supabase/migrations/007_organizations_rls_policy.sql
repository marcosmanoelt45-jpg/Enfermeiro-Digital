-- ==============================================================================
-- 007_organizations_rls_policy.sql
-- Isolamento Multitenant Seguro em public.organizations
-- Correção de Vulnerabilidade: RLS habilitado sem políticas de acesso
-- ==============================================================================

-- 1. Garante que o Row Level Security (RLS) esteja devidamente ativado
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Remove política com mesmo nome caso já exista (idempotência de migração)
DROP POLICY IF EXISTS "Usuarios autenticados podem ver sua propria organizacao" ON public.organizations;

-- 3. Cria política de SELECT estrita: apenas usuários autenticados vinculados à organização
CREATE POLICY "Usuarios autenticados podem ver sua propria organizacao"
ON public.organizations
FOR SELECT
TO authenticated
USING (
    id IN (
        SELECT org_id
        FROM public.profiles
        WHERE id = (SELECT auth.uid())
    )
);

-- NOTA DE ARQUITETURA E SEGURANÇA:
-- Nenhuma política de INSERT, UPDATE ou DELETE é criada para o cliente (role 'authenticated' ou 'anon').
-- Operações de mutação em organizations são restritas estritamente ao servidor com service_role key.
