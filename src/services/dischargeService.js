import { supabase, isSupabaseConfigured } from './supabaseClient';
import { authService } from './authService';

const LOCAL_STORAGE_DISCHARGE_KEY = 'enfermeiro_digital_discharge_plans';

function getLocalPlans() {
  const data = localStorage.getItem(LOCAL_STORAGE_DISCHARGE_KEY);
  if (!data) return [];
  try { return JSON.parse(data); } catch { return []; }
}

function saveLocalPlans(list) {
  localStorage.setItem(LOCAL_STORAGE_DISCHARGE_KEY, JSON.stringify(list));
}

export const dischargeService = {
  async filter(criteria = {}, orderBy = '-created_date', limit = 20) {
    if (!isSupabaseConfigured()) {
      let list = getLocalPlans();
      if (criteria.patient_id) {
        list = list.filter((p) => p.patient_id === criteria.patient_id);
      }
      return list.sort((a, b) => new Date(b.created_at || b.created_date || 0) - new Date(a.created_at || a.created_date || 0)).slice(0, limit);
    }

    try {
      let query = supabase.from('discharge_plans').select('*');
      if (criteria.patient_id) {
        query = query.eq('patient_id', criteria.patient_id);
      }
      query = query.order('created_at', { ascending: false }).limit(limit);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((p) => ({
        ...p,
        created_date: p.created_at,
        updated_date: p.updated_at,
      }));
    } catch {
      let list = getLocalPlans();
      if (criteria.patient_id) {
        list = list.filter((p) => p.patient_id === criteria.patient_id);
      }
      return list.sort((a, b) => new Date(b.created_at || b.created_date || 0) - new Date(a.created_at || a.created_date || 0)).slice(0, limit);
    }
  },

  async get(id) {
    if (!isSupabaseConfigured()) {
      const list = getLocalPlans();
      const plan = list.find((p) => p.id === id);
      if (!plan) throw new Error('Plano de alta não encontrado');
      return plan;
    }

    try {
      const { data, error } = await supabase
        .from('discharge_plans')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return {
        ...data,
        created_date: data.created_at,
        updated_date: data.updated_at,
      };
    } catch {
      const list = getLocalPlans();
      const plan = list.find((p) => p.id === id);
      if (!plan) throw new Error('Plano de alta não encontrado');
      return plan;
    }
  },

  async create(planData) {
    const user = await authService.getCurrentUser();
    const payload = {
      ...planData,
      org_id: user?.org_id || null,
      created_by_id: user?.id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };

    if (!isSupabaseConfigured()) {
      const list = getLocalPlans();
      payload.id = 'discharge-' + Math.random().toString(36).substring(2, 9);
      list.unshift(payload);
      saveLocalPlans(list);
      return payload;
    }

    try {
      const { data, error } = await supabase
        .from('discharge_plans')
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
      const list = getLocalPlans();
      payload.id = 'discharge-' + Math.random().toString(36).substring(2, 9);
      list.unshift(payload);
      saveLocalPlans(list);
      return payload;
    }
  },

  async update(id, updates) {
    if (!isSupabaseConfigured()) {
      const list = getLocalPlans();
      const idx = list.findIndex((p) => p.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString(), updated_date: new Date().toISOString() };
        saveLocalPlans(list);
        return list[idx];
      }
      throw new Error('Plano de alta não encontrado');
    }

    try {
      const { data, error } = await supabase
        .from('discharge_plans')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        created_date: data.created_at,
        updated_date: data.updated_at,
      };
    } catch {
      const list = getLocalPlans();
      const idx = list.findIndex((p) => p.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString(), updated_date: new Date().toISOString() };
        saveLocalPlans(list);
        return list[idx];
      }
      throw new Error('Plano de alta não encontrado');
    }
  },

  async delete(id) {
    if (!isSupabaseConfigured()) {
      let list = getLocalPlans();
      list = list.filter((p) => p.id !== id);
      saveLocalPlans(list);
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('discharge_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch {
      let list = getLocalPlans();
      list = list.filter((p) => p.id !== id);
      saveLocalPlans(list);
      return { success: true };
    }
  },

  async deleteMany(criteria = {}) {
    if (!isSupabaseConfigured()) {
      let list = getLocalPlans();
      if (criteria.patient_id) {
        list = list.filter((p) => p.patient_id !== criteria.patient_id);
      }
      saveLocalPlans(list);
      return { success: true };
    }

    try {
      let query = supabase.from('discharge_plans').delete();
      if (criteria.patient_id) {
        query = query.eq('patient_id', criteria.patient_id);
      }
      const { error } = await query;
      if (error) throw error;
      return { success: true };
    } catch {
      let list = getLocalPlans();
      if (criteria.patient_id) {
        list = list.filter((p) => p.patient_id !== criteria.patient_id);
      }
      saveLocalPlans(list);
      return { success: true };
    }
  },
};
