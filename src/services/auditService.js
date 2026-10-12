import { supabase, isSupabaseConfigured } from './supabaseClient';
import { authService } from './authService';

const LOCAL_STORAGE_AUDIT_KEY = 'enfermeiro_digital_audit_logs';

function getLocalAuditLogs() {
  const data = localStorage.getItem(LOCAL_STORAGE_AUDIT_KEY);
  if (!data) return [];
  try { return JSON.parse(data); } catch { return []; }
}

function saveLocalAuditLogs(list) {
  // Mantém apenas os últimos 500 registros localmente
  const trimmed = list.slice(0, 500);
  localStorage.setItem(LOCAL_STORAGE_AUDIT_KEY, JSON.stringify(trimmed));
}

export const auditService = {
  async log({ action, entity_type, entity_id, details = {} }) {
    try {
      const user = await authService.getCurrentUser();
      const payload = {
        action,
        entity_type,
        entity_id,
        org_id: user?.org_id || null,
        user_id: user?.id || null,
        details: {
          ...details,
          user_email: user?.email,
          user_role: user?.user_type || user?.role,
          coren: user?.coren,
        },
        created_at: new Date().toISOString(),
      };

      if (!isSupabaseConfigured()) {
        const list = getLocalAuditLogs();
        payload.id = 'audit-' + Math.random().toString(36).substring(2, 9);
        list.unshift(payload);
        saveLocalAuditLogs(list);
        return payload;
      }

      // No Supabase, a política é Append-Only (Apenas INSERT)
      const { data, error } = await supabase.from('audit_logs').insert(payload).select().single();
      if (error) {
        console.warn('Falha silenciosa ao registrar log de auditoria:', error);
      }
      return data;
    } catch (err) {
      console.warn('Erro ao processar auditoria:', err);
    }
  },

  async list(limit = 100) {
    if (!isSupabaseConfigured()) {
      return getLocalAuditLogs().slice(0, limit);
    }
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },
};
