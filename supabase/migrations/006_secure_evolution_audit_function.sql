-- ==============================================================================
-- 006_secure_evolution_audit_function.sql
-- Blindagem de Segurança da Função de Auditoria de Evoluções Clínicas
-- Correção de Vulnerabilidade: SECURITY DEFINER sem search_path e RPC pública exposta
-- ==============================================================================

-- 1. Recria a função de auditoria com search_path vazio e nomes totalmente qualificados
CREATE OR REPLACE FUNCTION public.process_evolution_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_action TEXT;
    v_details JSONB;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        v_action := 'CREATE';
        v_details := pg_catalog.jsonb_build_object(
            'patient_id', NEW.patient_id,
            'signed', NEW.signed,
            'ai_generated', NEW.ai_generated
        );
        INSERT INTO public.audit_logs (org_id, user_id, action, entity_type, entity_id, details)
        VALUES (NEW.org_id, NEW.created_by_id, v_action, 'evolution', NEW.id::text, v_details);
        RETURN NEW;

    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.signed = FALSE AND NEW.signed = TRUE) THEN
            v_action := 'SIGN';
            v_details := pg_catalog.jsonb_build_object(
                'patient_id', NEW.patient_id,
                'signer_name', NEW.signer_name,
                'signer_coren', NEW.signer_coren,
                'signed_at', NEW.signed_at,
                'hash_sha256', NEW.signature_hash_sha256
            );
        ELSE
            v_action := 'UPDATE';
            v_details := pg_catalog.jsonb_build_object(
                'patient_id', NEW.patient_id,
                'signed', NEW.signed
            );
        END IF;

        INSERT INTO public.audit_logs (org_id, user_id, action, entity_type, entity_id, details)
        VALUES (
            NEW.org_id,
            pg_catalog.coalesce(NEW.signed_by, NEW.created_by_id, auth.uid()),
            v_action,
            'evolution',
            NEW.id::text,
            v_details
        );
        RETURN NEW;

    ELSIF (TG_OP = 'DELETE') THEN
        v_action := 'DELETE';
        v_details := pg_catalog.jsonb_build_object(
            'patient_id', OLD.patient_id,
            'deleted_at', pg_catalog.now()
        );
        INSERT INTO public.audit_logs (org_id, user_id, action, entity_type, entity_id, details)
        VALUES (OLD.org_id, auth.uid(), v_action, 'evolution', OLD.id::text, v_details);
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$;

-- 2. Revoga estritamente permissões de execução via RPC (PostgREST / API pública)
REVOKE EXECUTE ON FUNCTION public.process_evolution_audit() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_evolution_audit() FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_evolution_audit() FROM authenticated;

-- 3. Assegura que o trigger na tabela evolutions permaneça vinculado e ativo
DROP TRIGGER IF EXISTS trg_evolution_audit ON public.evolutions;
CREATE TRIGGER trg_evolution_audit
AFTER INSERT OR UPDATE OR DELETE ON public.evolutions
FOR EACH ROW EXECUTE FUNCTION public.process_evolution_audit();
