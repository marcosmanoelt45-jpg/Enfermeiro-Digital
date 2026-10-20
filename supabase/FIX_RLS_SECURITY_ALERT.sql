-- ==============================================================================
-- FIX_RLS_SECURITY_ALERT.sql
-- RESOLUÇÃO DEFINITIVA DO ALERTA: "Table publicly accessible (rls_disabled_in_public)"
-- Projeto: twkewezpqiksjjvrzsas
--
-- COMO EXECUTAR:
-- 1. Acesse o SQL Editor do Supabase:
--    https://supabase.com/dashboard/project/twkewezpqiksjjvrzsas/sql/new
-- 2. Cole este script completo e clique em "RUN".
-- ==============================================================================

-- PARTE 1: ATIVAR ROW LEVEL SECURITY (RLS) DINAMICAMENTE EM TODAS AS TABELAS DO SCHEMA PUBLIC
DO $$ 
DECLARE 
    tbl RECORD;
BEGIN 
    FOR tbl IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    ) 
    LOOP 
        EXECUTE 'ALTER TABLE public.' || quote_ident(tbl.tablename) || ' ENABLE ROW LEVEL SECURITY;';
        RAISE NOTICE 'RLS ativado com sucesso para a tabela: public.%', tbl.tablename;
    END LOOP; 
END $$;

-- PARTE 2: GARANTIR POLÍTICAS DE ACESSO ROBUSTAS (IDEMPOTENTES)

-- 1. TABELA ORGANIZATIONS
ALTER TABLE IF EXISTS public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso a organizacoes autenticadas" ON public.organizations;
CREATE POLICY "Acesso a organizacoes autenticadas"
ON public.organizations FOR SELECT
TO authenticated
USING (true);

-- 2. TABELA PROFILES
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuarios podem ver perfis da sua organizacao" ON public.profiles;
CREATE POLICY "Usuarios podem ver perfis da sua organizacao"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid() OR org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Usuarios podem atualizar proprio perfil" ON public.profiles;
CREATE POLICY "Usuarios podem atualizar proprio perfil"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS "Insercao de perfil autenticado" ON public.profiles;
CREATE POLICY "Insercao de perfil autenticado"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- 3. TABELA PATIENTS
ALTER TABLE IF EXISTS public.patients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Isolamento por organizacao em pacientes" ON public.patients;
CREATE POLICY "Isolamento por organizacao em pacientes"
ON public.patients FOR ALL
TO authenticated
USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    OR created_by_id = auth.uid()
)
WITH CHECK (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    OR created_by_id = auth.uid()
);

-- 4. TABELA ASSESSMENTS (AVALIAÇÕES CLÍNICAS)
ALTER TABLE IF EXISTS public.assessments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Isolamento por organizacao em avaliacoes" ON public.assessments;
CREATE POLICY "Isolamento por organizacao em avaliacoes"
ON public.assessments FOR ALL
TO authenticated
USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    OR created_by_id = auth.uid()
)
WITH CHECK (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    OR created_by_id = auth.uid()
);

-- 5. TABELA EVOLUTIONS (EVOLUÇÕES SOAP)
ALTER TABLE IF EXISTS public.evolutions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Isolamento por organizacao em evolucoes" ON public.evolutions;
CREATE POLICY "Isolamento por organizacao em evolucoes"
ON public.evolutions FOR ALL
TO authenticated
USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    OR created_by_id = auth.uid()
)
WITH CHECK (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    OR created_by_id = auth.uid()
);

-- 6. TABELA NURSING_DIAGNOSES
ALTER TABLE IF EXISTS public.nursing_diagnoses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Isolamento por organizacao em diagnosticos" ON public.nursing_diagnoses;
CREATE POLICY "Isolamento por organizacao em diagnosticos"
ON public.nursing_diagnoses FOR ALL
TO authenticated
USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    OR created_by_id = auth.uid()
)
WITH CHECK (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    OR created_by_id = auth.uid()
);

-- 7. TABELA NANDA_CATALOG (CATÁLOGO CLÍNICO 277)
ALTER TABLE IF EXISTS public.nanda_catalog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura de catalogo NANDA para todos" ON public.nanda_catalog;
CREATE POLICY "Leitura de catalogo NANDA para todos"
ON public.nanda_catalog FOR SELECT
USING (true);

-- 8. TABELAS ACADÊMICAS (TURMAS, MEMBROS, CASOS, RESPOSTAS)
ALTER TABLE IF EXISTS public.turmas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso a turmas" ON public.turmas;
CREATE POLICY "Acesso a turmas"
ON public.turmas FOR ALL
TO authenticated
USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    OR teacher_id = auth.uid()
    OR id IN (SELECT turma_id FROM public.turma_members WHERE user_id = auth.uid())
);

ALTER TABLE IF EXISTS public.turma_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso a membros da turma" ON public.turma_members;
CREATE POLICY "Acesso a membros da turma"
ON public.turma_members FOR ALL
TO authenticated
USING (
    user_id = auth.uid()
    OR turma_id IN (SELECT id FROM public.turmas WHERE teacher_id = auth.uid())
);

ALTER TABLE IF EXISTS public.case_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso a atividades de caso" ON public.case_assignments;
CREATE POLICY "Acesso a atividades de caso"
ON public.case_assignments FOR ALL
TO authenticated
USING (
    turma_id IN (SELECT turma_id FROM public.turma_members WHERE user_id = auth.uid())
    OR created_by_id = auth.uid()
);

ALTER TABLE IF EXISTS public.student_answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso a respostas de alunos" ON public.student_answers;
CREATE POLICY "Acesso a respostas de alunos"
ON public.student_answers FOR ALL
TO authenticated
USING (
    student_id = auth.uid()
    OR turma_id IN (SELECT id FROM public.turmas WHERE teacher_id = auth.uid())
);

-- 9. TABELA AUDIT_LOGS (AUDITORIA IMUTÁVEL APPEND-ONLY)
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Apenas insercao em auditoria" ON public.audit_logs;
CREATE POLICY "Apenas insercao em auditoria"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Leitura de auditoria restrita a gestores" ON public.audit_logs;
CREATE POLICY "Leitura de auditoria restrita a gestores"
ON public.audit_logs FOR SELECT
TO authenticated
USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'supervisor')
);

-- 10. TABELA MEDICATION_RECORDS
ALTER TABLE IF EXISTS public.medication_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Isolamento por organizacao em calculos" ON public.medication_records;
CREATE POLICY "Isolamento por organizacao em calculos"
ON public.medication_records FOR ALL
TO authenticated
USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    OR created_by_id = auth.uid()
);

-- 11. TABELA DISCHARGE_PLANS
ALTER TABLE IF EXISTS public.discharge_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Isolamento por organizacao em planos de alta" ON public.discharge_plans;
CREATE POLICY "Isolamento por organizacao em planos de alta"
ON public.discharge_plans FOR ALL
TO authenticated
USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    OR created_by_id = auth.uid()
);

-- PARTE 3: RELATÓRIO DE VERIFICAÇÃO DE RLS
-- Esta query retornará todas as tabelas do schema public e confirmará que rowsecurity = true
SELECT 
    schemaname, 
    tablename, 
    rowsecurity AS rls_habilitado,
    CASE WHEN rowsecurity THEN '✅ PROTEGIDO' ELSE '❌ VULNERÁVEL' END AS status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
