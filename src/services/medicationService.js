import { supabase, isSupabaseConfigured } from './supabaseClient';
import { authService } from './authService';

const LOCAL_STORAGE_MEDS_KEY = 'enfermeiro_digital_medication_records';

function getLocalMeds() {
  const data = localStorage.getItem(LOCAL_STORAGE_MEDS_KEY);
  if (!data) return [];
  try { return JSON.parse(data); } catch { return []; }
}

function saveLocalMeds(list) {
  localStorage.setItem(LOCAL_STORAGE_MEDS_KEY, JSON.stringify(list));
}

export const medicationService = {
  async list(orderBy = '-created_date', limit = 100) {
    if (!isSupabaseConfigured()) {
      const list = getLocalMeds();
      return list.sort((a, b) => new Date(b.created_at || b.created_date || 0) - new Date(a.created_at || a.created_date || 0)).slice(0, limit);
    }

    try {
      const { data, error } = await supabase
        .from('medication_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).map((m) => ({
        ...m,
        created_date: m.created_at,
        updated_date: m.updated_at,
      }));
    } catch {
      const list = getLocalMeds();
      return list.sort((a, b) => new Date(b.created_at || b.created_date || 0) - new Date(a.created_at || a.created_date || 0)).slice(0, limit);
    }
  },

  async filter(criteria = {}, orderBy = '-created_date', limit = 100) {
    if (!isSupabaseConfigured()) {
      let list = getLocalMeds();
      if (criteria.patient_id) {
        list = list.filter((m) => m.patient_id === criteria.patient_id);
      }
      return list.sort((a, b) => new Date(b.created_at || b.created_date || 0) - new Date(a.created_at || a.created_date || 0)).slice(0, limit);
    }

    try {
      let query = supabase.from('medication_records').select('*');
      if (criteria.patient_id) {
        query = query.eq('patient_id', criteria.patient_id);
      }
      query = query.order('created_at', { ascending: false }).limit(limit);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((m) => ({
        ...m,
        created_date: m.created_at,
        updated_date: m.updated_at,
      }));
    } catch {
      let list = getLocalMeds();
      if (criteria.patient_id) {
        list = list.filter((m) => m.patient_id === criteria.patient_id);
      }
      return list.sort((a, b) => new Date(b.created_at || b.created_date || 0) - new Date(a.created_at || a.created_date || 0)).slice(0, limit);
    }
  },

  async create(recordData) {
    const user = await authService.getCurrentUser();
    const payload = {
      ...recordData,
      org_id: user?.org_id || null,
      created_by_id: user?.id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };

    if (!isSupabaseConfigured()) {
      const list = getLocalMeds();
      payload.id = 'med-' + Math.random().toString(36).substring(2, 9);
      list.unshift(payload);
      saveLocalMeds(list);
      return payload;
    }

    try {
      const { data, error } = await supabase
        .from('medication_records')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        created_date: data.created_at,
        updated_date: data.updated_at,
      };
    } catch {
      const list = getLocalMeds();
      payload.id = 'med-' + Math.random().toString(36).substring(2, 9);
      list.unshift(payload);
      saveLocalMeds(list);
      return payload;
    }
  },

  async delete(id) {
    if (!isSupabaseConfigured()) {
      let list = getLocalMeds();
      list = list.filter((m) => m.id !== id);
      saveLocalMeds(list);
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('medication_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch {
      let list = getLocalMeds();
      list = list.filter((m) => m.id !== id);
      saveLocalMeds(list);
      return { success: true };
    }
  },

  async deleteMany(criteria = {}) {
    if (!isSupabaseConfigured()) {
      let list = getLocalMeds();
      if (criteria.patient_id) {
        list = list.filter((m) => m.patient_id !== criteria.patient_id);
      }
      saveLocalMeds(list);
      return { success: true };
    }

    try {
      let query = supabase.from('medication_records').delete();
      if (criteria.patient_id) {
        query = query.eq('patient_id', criteria.patient_id);
      }
      const { error } = await query;
      if (error) throw error;
      return { success: true };
    } catch {
      let list = getLocalMeds();
      if (criteria.patient_id) {
        list = list.filter((m) => m.patient_id !== criteria.patient_id);
      }
      saveLocalMeds(list);
      return { success: true };
    }
  },
};
