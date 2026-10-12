-- ==============================================================================
-- 002_row_level_security.sql
-- Row Level Security (RLS) Mandatório e Políticas de Auditoria Imutável
-- ==============================================================================

-- 1. Habilitar RLS em todas as tabelas clínicas e organizacionais
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nursing_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE nanda_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE turma_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE discharge_plans ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para profiles
CREATE POLICY "Usuários podem ver seu próprio perfil e perfis da sua organização"
ON profiles FOR SELECT
USING (id = auth.uid() OR org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
ON profiles FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "Inserção de perfil autenticado"
ON profiles FOR INSERT
WITH CHECK (id = auth.uid());

-- 3. Políticas para patients (Isolamento por organização)
CREATE POLICY "Isolamento por organizacao em pacientes"
ON patients FOR ALL
USING (
  org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  OR created_by_id = auth.uid()
);

-- 4. Políticas para assessments (Isolamento por organização)
CREATE POLICY "Isolamento por organizacao em avaliacoes"
ON assessments FOR ALL
USING (
  org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  OR created_by_id = auth.uid()
);

-- 5. Políticas para evolutions (Isolamento por organização)
CREATE POLICY "Isolamento por organizacao em evolucoes"
ON evolutions FOR ALL
USING (
  org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  OR created_by_id = auth.uid()
);

-- 6. Políticas para nursing_diagnoses
CREATE POLICY "Isolamento por organizacao em diagnosticos"
ON nursing_diagnoses FOR ALL
USING (
  org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  OR created_by_id = auth.uid()
);

-- 7. Catálogo canônico NANDA-I (Leitura pública para autenticados, escrita apenas admin)
CREATE POLICY "Leitura de catalogo NANDA para usuarios autenticados"
ON nanda_catalog FOR SELECT
USING (auth.role() = 'authenticated');

-- 8. Políticas para módulo acadêmico (turmas e atividades)
CREATE POLICY "Acesso a turmas por organizacao ou membros"
ON turmas FOR ALL
USING (
  org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  OR teacher_id = auth.uid()
  OR id IN (SELECT turma_id FROM turma_members WHERE user_id = auth.uid())
);

CREATE POLICY "Acesso a membros da turma"
ON turma_members FOR ALL
USING (
  user_id = auth.uid()
  OR turma_id IN (SELECT id FROM turmas WHERE teacher_id = auth.uid())
);

CREATE POLICY "Acesso a atividades de caso"
ON case_assignments FOR ALL
USING (
  turma_id IN (SELECT turma_id FROM turma_members WHERE user_id = auth.uid())
  OR created_by_id = auth.uid()
);

CREATE POLICY "Acesso a respostas de alunos"
ON student_answers FOR ALL
USING (
  student_id = auth.uid()
  OR turma_id IN (SELECT id FROM turmas WHERE teacher_id = auth.uid())
);

-- 9. AUDITORIA MANDATÓRIA IMUTÁVEL (APPEND-ONLY)
-- Apenas INSERT é permitido para qualquer usuário autenticado ou serviço
CREATE POLICY "Apenas insercao em auditoria"
ON audit_logs FOR INSERT
WITH CHECK (true);

-- Leitura de logs restrita a auditores, administradores ou supervisores da mesma organização
CREATE POLICY "Leitura de auditoria restrita a gestores da organizacao"
ON audit_logs FOR SELECT
USING (
  org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'supervisor')
);

-- ATENÇÃO: Nenhuma política de UPDATE ou DELETE é criada para audit_logs!
-- O PostgreSQL rejeitará categoricamente qualquer tentativa de modificação ou expurgo.

-- 10. Políticas para medication_records
CREATE POLICY "Isolamento por organizacao em calculos de medicamentos"
ON medication_records FOR ALL
USING (
  org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  OR created_by_id = auth.uid()
);

-- 11. Políticas para discharge_plans
CREATE POLICY "Isolamento por organizacao em planos de alta"
ON discharge_plans FOR ALL
USING (
  org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  OR created_by_id = auth.uid()
);
