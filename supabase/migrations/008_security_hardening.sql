-- ==============================================================================
-- 008_security_hardening.sql
-- Correções da varredura Claude Security (02/11/2026): F23, F26, F31, F32, F33, F34.
--
-- Estratégia: políticas RESTRICTIVE + triggers. Políticas RESTRICTIVE são combinadas com AND
-- às permissivas que já existem (002, CORRECAO_RLS_PROFILES, FIX_RLS_SECURITY_ALERT), então
-- esta migration endurece o banco sem depender de qual variante das policies está em produção.
--
-- Os triggers só atuam quando quem escreve é o cliente (roles anon/authenticated do PostgREST).
-- Funções SECURITY DEFINER e o service_role continuam livres para gerenciar org/role/auditoria.
--
-- APLICAR PRIMEIRO EM UM BRANCH/STAGING DO SUPABASE e testar cadastro, login, casos e assinatura.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.get_auth_user_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_client_request()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT current_user IN ('anon', 'authenticated');
$$;

-- ------------------------------------------------------------------------------
-- F23 / F31: o cliente não escolhe a própria organização nem o próprio papel.
-- Em vez de falhar (o login atual reenvia `role` a cada acesso), o trigger fixa os valores.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_client_request() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    NEW.org_id := OLD.org_id;
    NEW.role := OLD.role;
  ELSE
    NEW.org_id := NULL;
    IF NEW.role IS NULL OR NEW.role NOT IN ('aluno', 'professor', 'enfermeiro') THEN
      NEW.role := 'aluno';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_privileges ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileges
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileges();

-- ------------------------------------------------------------------------------
-- F32: escrita em tabelas clínicas só dentro da própria organização (ou registro pessoal, org NULL),
-- e o autor de um INSERT é sempre quem está logado.
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['patients', 'assessments', 'evolutions', 'nursing_diagnoses', 'medication_records', 'discharge_plans']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "restrict_insert_own_org" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "restrict_insert_own_org" ON public.%I AS RESTRICTIVE FOR INSERT TO anon, authenticated
         WITH CHECK (
           (org_id IS NULL OR org_id = public.get_auth_user_org_id())
           AND (created_by_id IS NULL OR created_by_id = auth.uid())
         )', t);

    EXECUTE format('DROP POLICY IF EXISTS "restrict_update_own_org" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "restrict_update_own_org" ON public.%I AS RESTRICTIVE FOR UPDATE TO anon, authenticated
         USING (true)
         WITH CHECK (org_id IS NULL OR org_id = public.get_auth_user_org_id())', t);
  END LOOP;
END;
$$;

-- ------------------------------------------------------------------------------
-- F26: a trilha de auditoria não aceita entradas forjadas pelo cliente.
-- (Triggers SECURITY DEFINER de auditoria rodam como dono da tabela e não são afetados.)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "restrict_audit_insert_self" ON public.audit_logs;
CREATE POLICY "restrict_audit_insert_self" ON public.audit_logs
AS RESTRICTIVE FOR INSERT TO anon, authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND org_id IS NOT DISTINCT FROM public.get_auth_user_org_id()
);

-- ------------------------------------------------------------------------------
-- F33 / F34: assinatura de evolução definida pelo servidor e imutável depois de assinada.
-- - signed_by / signed_at / signer_* vêm do perfil de quem está logado, nunca do cliente;
-- - o hash é recalculado no banco sobre o conteúdo SOAP;
-- - evolução assinada não pode ser alterada nem apagada pelo cliente.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_evolution_signature()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
DECLARE
  signer record;
BEGIN
  IF NOT public.is_client_request() THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP IN ('UPDATE', 'DELETE') AND OLD.signed IS TRUE THEN
    RAISE EXCEPTION 'Evolução assinada é imutável.' USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.created_by_id := auth.uid();
  ELSE
    NEW.created_by_id := OLD.created_by_id;
  END IF;

  IF NEW.signed IS TRUE THEN
    SELECT full_name, coren INTO signer FROM public.profiles WHERE id = auth.uid();
    NEW.signed_by := auth.uid();
    NEW.signer_name := COALESCE(signer.full_name, NEW.signer_name);
    NEW.signer_coren := COALESCE(signer.coren, NEW.signer_coren);
    NEW.signed_at := now();
    NEW.signature_hash_sha256 := encode(
      digest(
        concat_ws('|', NEW.id::text, NEW.patient_id::text, NEW.subjective, NEW.objective, NEW.assessment, NEW.plan,
                  auth.uid()::text, to_char(NEW.signed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')),
        'sha256'
      ),
      'hex'
    );
  ELSE
    NEW.signed_by := NULL;
    NEW.signed_at := NULL;
    NEW.signature_hash_sha256 := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_evolution_signature ON public.evolutions;
CREATE TRIGGER trg_enforce_evolution_signature
BEFORE INSERT OR UPDATE OR DELETE ON public.evolutions
FOR EACH ROW EXECUTE FUNCTION public.enforce_evolution_signature();

-- Observação: o trigger de auditoria da 006 (process_evolution_audit) usa COALESCE(NEW.signed_by, NEW.created_by_id, ...).
-- Com o trigger acima, ambos passam a ser sempre auth.uid() em escritas do cliente, então a autoria registrada fica correta.
