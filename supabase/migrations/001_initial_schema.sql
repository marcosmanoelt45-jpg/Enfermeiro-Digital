-- ==============================================================================
-- 001_initial_schema.sql
-- Enfermeiro Digital - Banco de Dados PostgreSQL Multi-Tenant (Supabase)
-- ==============================================================================

-- 1. Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Organizações (Hospitais, Clínicas, Home Care, Universidades)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    cnpj TEXT UNIQUE,
    cnes TEXT, -- Cadastro Nacional de Estabelecimentos de Saúde
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Perfis de Usuários (RBAC) vinculados a auth.users
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    coren TEXT, -- Registro Profissional no Conselho Regional de Enfermagem
    role TEXT NOT NULL CHECK (role IN ('enfermeiro', 'supervisor', 'admin', 'professor', 'aluno')) DEFAULT 'enfermeiro',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Pacientes
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

-- 5. Avaliações Clínicas e Escalas (BRADEN, CAM, SAK, AUDIT, CALOI)
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
    -- Escala BRADEN (Risco de Lesão por Pressão)
    braden_perception INTEGER,
    braden_moisture INTEGER,
    braden_activity INTEGER,
    braden_mobility INTEGER,
    braden_nutrition INTEGER,
    braden_friction INTEGER,
    braden_total INTEGER,
    -- Escala CAM (Confusão Aguda / Delirium)
    cam_acute BOOLEAN,
    cam_inattention BOOLEAN,
    cam_disorganized BOOLEAN,
    cam_altered_loc BOOLEAN,
    cam_positive BOOLEAN,
    -- Escala AUDIT (Risco de Álcool)
    audit_1 INTEGER, audit_2 INTEGER, audit_3 INTEGER, audit_4 INTEGER, audit_5 INTEGER,
    audit_6 INTEGER, audit_7 INTEGER, audit_8 INTEGER, audit_9 INTEGER, audit_10 INTEGER,
    audit_total INTEGER,
    -- Escala SAK (Risco de Queda)
    sak_disorientation BOOLEAN,
    sak_urination BOOLEAN,
    sak_walking BOOLEAN,
    sak_caregiver BOOLEAN,
    sak_postop BOOLEAN,
    sak_previous_falls BOOLEAN,
    sak_meds INTEGER,
    sak_score NUMERIC,
    -- Escala CALOI (Dor)
    caloi_pain_intensity INTEGER,
    caloi_pain_location JSONB DEFAULT '[]'::jsonb,
    caloi_pain_characteristics JSONB DEFAULT '[]'::jsonb,
    caloi_score INTEGER,
    -- Status Clínico e IA
    risk_status TEXT CHECK (risk_status IN ('estavel', 'alerta', 'critico')) DEFAULT 'estavel',
    ai_status TEXT CHECK (ai_status IN ('pending', 'generated', 'error')) DEFAULT 'pending',
    ai_response JSONB,
    ai_raw TEXT,
    created_by_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Evoluções Clínicas Estruturadas (SOAP) e Assinatura Eletrônica Avançada
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
    signature_hash_sha256 TEXT, -- Hash SHA-256 (Lei nº 14.063/2020)
    ai_generated BOOLEAN DEFAULT FALSE,
    ai_approved_by UUID REFERENCES auth.users(id),
    created_by_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Diagnósticos de Enfermagem Vinculados ao Prontuário
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

-- 8. Catálogo Canônico NANDA-I, NIC e NOC
CREATE TABLE IF NOT EXISTS nanda_catalog (
    code TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    domain TEXT NOT NULL,
    class TEXT NOT NULL,
    interventions JSONB DEFAULT '[]'::jsonb,
    outcomes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Módulo Acadêmico: Turmas, Membros, Estudos de Caso e Respostas
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

-- 10. Trilha de Auditoria Imutável (Append-Only)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'SIGN', 'DELETE', 'VIEW'
    entity_type TEXT NOT NULL, -- 'evolution', 'assessment', 'patient', 'diagnosis'
    entity_id TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Registros de Cálculos e Administração de Medicamentos
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

-- 12. Planos de Alta Hospitalar e Continuidade do Cuidado
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
