-- ==============================================================================
-- SETUP COMPLETO - ENFERMEIRO DIGITAL (POSTGRESQL / SUPABASE)
-- Execute este script no SQL Editor do seu projeto Supabase:
-- https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- PARTE 1: EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- PARTE 2: TABELAS MULTI-TENANT E CLÍNICAS
-- 1. Organizações (Hospitais, Clínicas, Home Care, Faculdades)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    cnpj TEXT UNIQUE,
    cnes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Perfis de Usuários (RBAC) vinculados a auth.users
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    coren TEXT,
    role TEXT NOT NULL CHECK (role IN ('enfermeiro', 'supervisor', 'admin', 'professor', 'aluno')) DEFAULT 'enfermeiro',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Pacientes
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER,
    gender TEXT CHECK (gender IN ('M', 'F', 'Outro')),
    previous_diseases TEXT,
    medical_history TEXT,
    current_medications TEXT,
    allergies TEXT,
    previous_anamnesis TEXT,
    notes TEXT,
    created_by_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Avaliações Clínicas e Escalas (BRADEN, CAM, SAK, AUDIT, CALOI)
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    patient_name TEXT,
    pa_sistolica NUMERIC,
    pa_diastolica NUMERIC,
    fc NUMERIC,
    fr NUMERIC,
    tax NUMERIC,
    sat NUMERIC,
    braden_perception INTEGER,
    braden_moisture INTEGER,
    braden_activity INTEGER,
    braden_mobility INTEGER,
    braden_nutrition INTEGER,
    braden_friction INTEGER,
    braden_total INTEGER,
    cam_acute BOOLEAN,
    cam_inattention BOOLEAN,
    cam_disorganized BOOLEAN,
    cam_altered_loc BOOLEAN,
    cam_positive BOOLEAN,
    audit_1 INTEGER, audit_2 INTEGER, audit_3 INTEGER, audit_4 INTEGER, audit_5 INTEGER,
    audit_6 INTEGER, audit_7 INTEGER, audit_8 INTEGER, audit_9 INTEGER, audit_10 INTEGER,
    audit_total INTEGER,
    sak_disorientation BOOLEAN,
    sak_urination BOOLEAN,
    sak_walking BOOLEAN,
    sak_caregiver BOOLEAN,
    sak_postop BOOLEAN,
    sak_previous_falls BOOLEAN,
    sak_meds INTEGER,
    sak_score NUMERIC,
    caloi_pain_intensity INTEGER,
    caloi_pain_location JSONB DEFAULT '[]'::jsonb,
    caloi_pain_characteristics JSONB DEFAULT '[]'::jsonb,
    caloi_score INTEGER,
    risk_status TEXT CHECK (risk_status IN ('estavel', 'alerta', 'critico')) DEFAULT 'estavel',
    ai_status TEXT CHECK (ai_status IN ('pending', 'generated', 'error')) DEFAULT 'pending',
    ai_response JSONB,
    ai_raw TEXT,
    created_by_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Evoluções Clínicas Estruturadas (SOAP) e Assinatura Eletrônica Avançada
CREATE TABLE IF NOT EXISTS evolutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    subjective TEXT,
    objective TEXT,
    assessment TEXT,
    plan TEXT,
    signed BOOLEAN DEFAULT FALSE,
    signed_by UUID REFERENCES auth.users(id),
    signer_name TEXT,
    signer_coren TEXT,
    signed_at TIMESTAMPTZ,
    signature_hash_sha256 TEXT,
    ai_generated BOOLEAN DEFAULT FALSE,
    ai_approved_by UUID REFERENCES auth.users(id),
    created_by_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Diagnósticos de Enfermagem Vinculados ao Prontuário
CREATE TABLE IF NOT EXISTS nursing_diagnoses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    domain TEXT,
    class TEXT,
    status TEXT DEFAULT 'ativo',
    source_link TEXT,
    defining_characteristics JSONB DEFAULT '[]'::jsonb,
    related_factors JSONB DEFAULT '[]'::jsonb,
    interventions JSONB DEFAULT '[]'::jsonb,
    outcomes JSONB DEFAULT '[]'::jsonb,
    created_by_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Catálogo Canônico NANDA-I, NIC e NOC
CREATE TABLE IF NOT EXISTS nanda_catalog (
    code TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    domain TEXT NOT NULL,
    class TEXT NOT NULL,
    interventions JSONB DEFAULT '[]'::jsonb,
    outcomes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Módulo Acadêmico: Turmas, Membros, Estudos de Caso e Respostas
CREATE TABLE IF NOT EXISTS turmas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    teacher_id UUID REFERENCES auth.users(id),
    teacher_name TEXT,
    created_by_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS turma_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turma_id UUID REFERENCES turmas(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT,
    user_email TEXT,
    role TEXT CHECK (role IN ('professor', 'aluno')) DEFAULT 'aluno',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (turma_id, user_id)
);

CREATE TABLE IF NOT EXISTS case_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turma_id UUID REFERENCES turmas(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    clinical_case_data JSONB NOT NULL,
    created_by_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turma_id UUID REFERENCES turmas(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES case_assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    student_name TEXT,
    answer_data JSONB NOT NULL,
    feedback TEXT,
    grade NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Trilha de Auditoria Imutável (Append-Only)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Registros de Cálculos e Administração de Medicamentos
CREATE TABLE IF NOT EXISTS medication_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    drug_name TEXT NOT NULL,
    calc_type TEXT,
    concentration NUMERIC,
    prescribed_dose NUMERIC,
    calculated_volume NUMERIC,
    weight NUMERIC,
    dose_per_kg NUMERIC,
    volume_ml NUMERIC,
    drop_factor INTEGER,
    time_min NUMERIC,
    drip_rate NUMERIC,
    notes TEXT,
    created_by_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Planos de Alta Hospitalar e Continuidade do Cuidado
CREATE TABLE IF NOT EXISTS discharge_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    discharge_date DATE,
    destination TEXT,
    conditions TEXT,
    medications JSONB DEFAULT '[]'::jsonb,
    care_instructions JSONB DEFAULT '[]'::jsonb,
    warning_signs JSONB DEFAULT '[]'::jsonb,
    follow_up TEXT,
    responsible_nurse TEXT,
    status TEXT DEFAULT 'rascunho',
    notes TEXT,
    created_by_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- PARTE 3: ROW LEVEL SECURITY (RLS) MANDATÓRIO
-- ==============================================================================
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

-- Profiles
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
CREATE POLICY "profiles_select_policy" ON profiles FOR SELECT
USING (id = auth.uid() OR org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
CREATE POLICY "profiles_update_policy" ON profiles FOR UPDATE
USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
CREATE POLICY "profiles_insert_policy" ON profiles FOR INSERT
WITH CHECK (id = auth.uid());

-- Patients
DROP POLICY IF EXISTS "patients_all_policy" ON patients;
CREATE POLICY "patients_all_policy" ON patients FOR ALL
USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()) OR created_by_id = auth.uid());

-- Assessments
DROP POLICY IF EXISTS "assessments_all_policy" ON assessments;
CREATE POLICY "assessments_all_policy" ON assessments FOR ALL
USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()) OR created_by_id = auth.uid());

-- Evolutions
DROP POLICY IF EXISTS "evolutions_all_policy" ON evolutions;
CREATE POLICY "evolutions_all_policy" ON evolutions FOR ALL
USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()) OR created_by_id = auth.uid());

-- Nursing Diagnoses
DROP POLICY IF EXISTS "diagnoses_all_policy" ON nursing_diagnoses;
CREATE POLICY "diagnoses_all_policy" ON nursing_diagnoses FOR ALL
USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()) OR created_by_id = auth.uid());

-- Nanda Catalog
DROP POLICY IF EXISTS "nanda_catalog_select" ON nanda_catalog;
CREATE POLICY "nanda_catalog_select" ON nanda_catalog FOR SELECT
USING (auth.role() = 'authenticated');

-- Turmas e Módulo Acadêmico
DROP POLICY IF EXISTS "turmas_all_policy" ON turmas;
CREATE POLICY "turmas_all_policy" ON turmas FOR ALL
USING (
  org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  OR teacher_id = auth.uid()
  OR id IN (SELECT turma_id FROM turma_members WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "turma_members_all_policy" ON turma_members;
CREATE POLICY "turma_members_all_policy" ON turma_members FOR ALL
USING (user_id = auth.uid() OR turma_id IN (SELECT id FROM turmas WHERE teacher_id = auth.uid()));

DROP POLICY IF EXISTS "case_assignments_all_policy" ON case_assignments;
CREATE POLICY "case_assignments_all_policy" ON case_assignments FOR ALL
USING (turma_id IN (SELECT turma_id FROM turma_members WHERE user_id = auth.uid()) OR created_by_id = auth.uid());

DROP POLICY IF EXISTS "student_answers_all_policy" ON student_answers;
CREATE POLICY "student_answers_all_policy" ON student_answers FOR ALL
USING (student_id = auth.uid() OR turma_id IN (SELECT id FROM turmas WHERE teacher_id = auth.uid()));

-- Auditoria Append-Only (Apenas INSERT é permitido)
DROP POLICY IF EXISTS "audit_insert_only" ON audit_logs;
CREATE POLICY "audit_insert_only" ON audit_logs FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "audit_select_restricted" ON audit_logs;
CREATE POLICY "audit_select_restricted" ON audit_logs FOR SELECT
USING (
  org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'supervisor')
);

-- Medication Records
DROP POLICY IF EXISTS "medications_all_policy" ON medication_records;
CREATE POLICY "medications_all_policy" ON medication_records FOR ALL
USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()) OR created_by_id = auth.uid());

-- Discharge Plans
DROP POLICY IF EXISTS "discharge_plans_all_policy" ON discharge_plans;
CREATE POLICY "discharge_plans_all_policy" ON discharge_plans FOR ALL
USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()) OR created_by_id = auth.uid());

-- ==============================================================================
-- PARTE 4: TRIGGER AUTOMÁTICO DE AUDITORIA NO POSTGRESQL
-- ==============================================================================
CREATE OR REPLACE FUNCTION process_evolution_audit()
RETURNS TRIGGER AS $$
DECLARE
    v_action TEXT;
    v_details JSONB;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        v_action := 'CREATE';
        v_details := jsonb_build_object('patient_id', NEW.patient_id, 'signed', NEW.signed, 'ai_generated', NEW.ai_generated);
        INSERT INTO audit_logs (org_id, user_id, action, entity_type, entity_id, details)
        VALUES (NEW.org_id, NEW.created_by_id, v_action, 'evolution', NEW.id::text, v_details);
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.signed = FALSE AND NEW.signed = TRUE) THEN
            v_action := 'SIGN';
            v_details := jsonb_build_object(
                'patient_id', NEW.patient_id,
                'signer_name', NEW.signer_name,
                'signer_coren', NEW.signer_coren,
                'signed_at', NEW.signed_at,
                'hash_sha256', NEW.signature_hash_sha256
            );
        ELSE
            v_action := 'UPDATE';
            v_details := jsonb_build_object('patient_id', NEW.patient_id, 'signed', NEW.signed);
        END IF;
        INSERT INTO audit_logs (org_id, user_id, action, entity_type, entity_id, details)
        VALUES (NEW.org_id, COALESCE(NEW.signed_by, NEW.created_by_id, auth.uid()), v_action, 'evolution', NEW.id::text, v_details);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        v_action := 'DELETE';
        v_details := jsonb_build_object('patient_id', OLD.patient_id, 'deleted_at', NOW());
        INSERT INTO audit_logs (org_id, user_id, action, entity_type, entity_id, details)
        VALUES (OLD.org_id, auth.uid(), v_action, 'evolution', OLD.id::text, v_details);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_evolution_audit ON evolutions;
CREATE TRIGGER trg_evolution_audit
AFTER INSERT OR UPDATE OR DELETE ON evolutions
FOR EACH ROW EXECUTE FUNCTION process_evolution_audit();

-- ==============================================================================
-- PARTE 5: CARGA INICIAL DO CATÁLOGO CANÔNICO NANDA-I, NIC E NOC
-- ==============================================================================
INSERT INTO nanda_catalog (code, title, domain, class, interventions, outcomes)
VALUES
(
    '00047',
    'Risco de lesão por pressão',
    'Domínio 11: Segurança/Proteção',
    'Classe 2: Lesão física',
    '[
        {"code": "3540", "title": "Prevenção de lesão por pressão", "description": "Mudança de decúbito a cada 2h e aplicação de AGH."},
        {"code": "0740", "title": "Cuidados com a pele: tratamentos tópicos", "description": "Inspeção diária e hidratação cutânea."}
    ]'::jsonb,
    '[
        {"code": "1101", "title": "Integridade tissular: pele e mucosas", "description": "Pele íntegra e sem solução de continuidade."}
    ]'::jsonb
),
(
    '00155',
    'Risco de quedas em adultos',
    'Domínio 11: Segurança/Proteção',
    'Classe 2: Lesão física',
    '[
        {"code": "6490", "title": "Prevenção contra quedas", "description": "Elevação de grades, campainha acessível e piso desobstruído."},
        {"code": "6610", "title": "Identificação de risco", "description": "Sinalização visual de alerta de queda no leito."}
    ]'::jsonb,
    '[
        {"code": "1912", "title": "Controle de risco: quedas", "description": "Adoção de precauções ambientais e adesão do paciente."}
    ]'::jsonb
),
(
    '00132',
    'Dor aguda',
    'Domínio 12: Conforto',
    'Classe 1: Conforto físico',
    '[
        {"code": "1400", "title": "Manejo da dor", "description": "Avaliação de intensidade (0-10) e administração de analgésicos."},
        {"code": "2210", "title": "Administração de analgésicos", "description": "Monitorização de eficácia e eventos adversos."}
    ]'::jsonb,
    '[
        {"code": "1605", "title": "Controle da dor", "description": "Reconhecimento e alívio documentado da dor."},
        {"code": "2102", "title": "Nível de dor", "description": "Redução do escore na escala CALOI."}
    ]'::jsonb
),
(
    '00128',
    'Confusão aguda (Delirium)',
    'Domínio 5: Percepção/Cognição',
    'Classe 4: Cognição',
    '[
        {"code": "4880", "title": "Manejo do delirium", "description": "Orientação temporoespacial e regulação de ciclo circadiano."}
    ]'::jsonb,
    '[
        {"code": "0901", "title": "Orientação cognitiva", "description": "Identificação de tempo, espaço e acompanhantes."}
    ]'::jsonb
),
(
    '00030',
    'Troca de gases prejudicada',
    'Domínio 3: Eliminação e Troca',
    'Classe 4: Função respiratória',
    '[
        {"code": "3320", "title": "Oxigenoterapia", "description": "Administração de O2 suplementar e vigilância da saturação."},
        {"code": "3350", "title": "Monitorização respiratória", "description": "Ausculta pulmonar e frequência respiratória."}
    ]'::jsonb,
    '[
        {"code": "0402", "title": "Estado respiratório: troca gasosa", "description": "SatO2 >= 94% e ausência de cianose."}
    ]'::jsonb
)
ON CONFLICT (code) DO NOTHING;
