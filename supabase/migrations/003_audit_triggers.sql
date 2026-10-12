-- ==============================================================================
-- 003_audit_triggers.sql
-- Triggers Automáticos de Auditoria no PostgreSQL para Evoluções Clínicas
-- ==============================================================================

-- Função de disparo de auditoria para evoluções
CREATE OR REPLACE FUNCTION process_evolution_audit()
RETURNS TRIGGER AS $$
DECLARE
    v_action TEXT;
    v_details JSONB;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        v_action := 'CREATE';
        v_details := jsonb_build_object(
            'patient_id', NEW.patient_id,
            'signed', NEW.signed,
            'ai_generated', NEW.ai_generated
        );
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
            v_details := jsonb_build_object(
                'patient_id', NEW.patient_id,
                'signed', NEW.signed
            );
        END IF;

        INSERT INTO audit_logs (org_id, user_id, action, entity_type, entity_id, details)
        VALUES (NEW.org_id, COALESCE(NEW.signed_by, NEW.created_by_id, auth.uid()), v_action, 'evolution', NEW.id::text, v_details);
        RETURN NEW;

    ELSIF (TG_OP = 'DELETE') THEN
        v_action := 'DELETE';
        v_details := jsonb_build_object(
            'patient_id', OLD.patient_id,
            'deleted_at', NOW()
        );
        INSERT INTO audit_logs (org_id, user_id, action, entity_type, entity_id, details)
        VALUES (OLD.org_id, auth.uid(), v_action, 'evolution', OLD.id::text, v_details);
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger atrelado à tabela evolutions
DROP TRIGGER IF EXISTS trg_evolution_audit ON evolutions;
CREATE TRIGGER trg_evolution_audit
AFTER INSERT OR UPDATE OR DELETE ON evolutions
FOR EACH ROW EXECUTE FUNCTION process_evolution_audit();
