-- 009_harden_helper_functions.sql
-- Ajustes apontados pelo Security Advisor do Supabase após a 008:
-- search_path fixo e a função de organização fora do alcance do papel anon.
ALTER FUNCTION public.is_client_request() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.get_auth_user_org_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_auth_user_org_id() TO authenticated;
