import { supabase, isSupabaseConfigured } from './supabaseClient';
import { authService } from './authService';
import { NANDA_CATALOG } from '@/lib/nandaCatalog';

const LOCAL_STORAGE_DIAGNOSES_KEY = 'enfermeiro_digital_diagnoses';

function getLocalDiagnoses() {
  const data = localStorage.getItem(LOCAL_STORAGE_DIAGNOSES_KEY);
  if (!data) return [];
  try { return JSON.parse(data); } catch { return []; }
}

function saveLocalDiagnoses(list) {
  localStorage.setItem(LOCAL_STORAGE_DIAGNOSES_KEY, JSON.stringify(list));
}

export const diagnosisService = {
  async filter(criteria = {}, orderBy = '-created_date', limit = 100) {
    if (!isSupabaseConfigured()) {
      let list = getLocalDiagnoses();
      if (criteria.patient_id) {
        list = list.filter((d) => d.patient_id === criteria.patient_id);
      }
      return list.sort((a, b) => new Date(b.created_at || b.created_date || 0) - new Date(a.created_at || a.created_date || 0)).slice(0, limit);
    }

    try {
      let query = supabase.from('nursing_diagnoses').select('*');
      if (criteria.patient_id) {
        query = query.eq('patient_id', criteria.patient_id);
      }
      query = query.order('created_at', { ascending: false }).limit(limit);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((d) => ({
        ...d,
        created_date: d.created_at,
        updated_date: d.updated_at,
      }));
    } catch {
      let list = getLocalDiagnoses();
      if (criteria.patient_id) {
        list = list.filter((d) => d.patient_id === criteria.patient_id);
      }
      return list.sort((a, b) => new Date(b.created_at || b.created_date || 0) - new Date(a.created_at || a.created_date || 0)).slice(0, limit);
    }
  },

  async create(diagnosisData) {
    const user = await authService.getCurrentUser();
    const payload = {
      ...diagnosisData,
      org_id: user?.org_id || null,
      created_by_id: user?.id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };

    if (!isSupabaseConfigured()) {
      const list = getLocalDiagnoses();
      payload.id = 'diagnosis-' + Math.random().toString(36).substring(2, 9);
      list.unshift(payload);
      saveLocalDiagnoses(list);
      return payload;
    }

    try {
      const { data, error } = await supabase
        .from('nursing_diagnoses')
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
      const list = getLocalDiagnoses();
      payload.id = 'diagnosis-' + Math.random().toString(36).substring(2, 9);
      list.unshift(payload);
      saveLocalDiagnoses(list);
      return payload;
    }
  },

  async bulkCreate(records = []) {
    const user = await authService.getCurrentUser();
    const prepared = records.map((r) => ({
      ...r,
      org_id: user?.org_id || null,
      created_by_id: user?.id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    }));

    if (!isSupabaseConfigured()) {
      const list = getLocalDiagnoses();
      prepared.forEach((p) => {
        p.id = 'diagnosis-' + Math.random().toString(36).substring(2, 9);
        list.unshift(p);
      });
      saveLocalDiagnoses(list);
      return prepared;
    }

    try {
      const { data, error } = await supabase
        .from('nursing_diagnoses')
        .insert(prepared)
        .select();

      if (error) throw error;
      return (data || []).map((d) => ({
        ...d,
        created_date: d.created_at,
        updated_date: d.updated_at,
      }));
    } catch {
      const list = getLocalDiagnoses();
      prepared.forEach((p) => {
        p.id = 'diagnosis-' + Math.random().toString(36).substring(2, 9);
        list.unshift(p);
      });
      saveLocalDiagnoses(list);
      return prepared;
    }
  },

  async update(id, updates) {
    if (!isSupabaseConfigured()) {
      const list = getLocalDiagnoses();
      const idx = list.findIndex((d) => d.id === id);
      if (idx === -1) throw new Error('Diagnóstico não encontrado');
      list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString(), updated_date: new Date().toISOString() };
      saveLocalDiagnoses(list);
      return list[idx];
    }

    try {
      const { data, error } = await supabase
        .from('nursing_diagnoses')
        .update({ ...updates, updated_at: new Date().toISOString() })
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
      const list = getLocalDiagnoses();
      const idx = list.findIndex((d) => d.id === id);
      if (idx === -1) throw new Error('Diagnóstico não encontrado');
      list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString(), updated_date: new Date().toISOString() };
      saveLocalDiagnoses(list);
      return list[idx];
    }
  },

  async delete(id) {
    if (!isSupabaseConfigured()) {
      const list = getLocalDiagnoses().filter((d) => d.id !== id);
      saveLocalDiagnoses(list);
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('nursing_diagnoses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch {
      const list = getLocalDiagnoses().filter((d) => d.id !== id);
      saveLocalDiagnoses(list);
      return { success: true };
    }
  },

  async deleteMany(criteria = {}) {
    if (!isSupabaseConfigured()) {
      let list = getLocalDiagnoses();
      if (criteria.patient_id) {
        list = list.filter((d) => d.patient_id !== criteria.patient_id);
      }
      saveLocalDiagnoses(list);
      return { success: true };
    }

    try {
      let query = supabase.from('nursing_diagnoses').delete();
      if (criteria.patient_id) {
        query = query.eq('patient_id', criteria.patient_id);
      }
      const { error } = await query;
      if (error) throw error;
      return { success: true };
    } catch {
      let list = getLocalDiagnoses();
      if (criteria.patient_id) {
        list = list.filter((d) => d.patient_id !== criteria.patient_id);
      }
      saveLocalDiagnoses(list);
      return { success: true };
    }
  },

  async listNandaCatalog(limit = 500) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('nanda_catalog')
          .select('*')
          .limit(limit);

        if (!error && data && data.length > 0) {
          return data;
        }
      } catch {
        // Fallback silencioso para o catálogo canônico local
      }
    }
    return NANDA_CATALOG.slice(0, limit);
  },

  async searchNandaCatalog(query = '') {
    if (!query) return this.listNandaCatalog(12);

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('nanda_catalog')
          .select('*')
          .or(`title.ilike.%${query}%,code.ilike.%${query}%,domain.ilike.%${query}%`)
          .limit(20);

        if (!error && data && data.length > 0) {
          return data;
        }
      } catch {
        // Fallback para filtro local
      }
    }

    const q = query.trim().toLowerCase();
    return NANDA_CATALOG.filter(
      (d) =>
        (d.title || '').toLowerCase().includes(q) ||
        (d.code || '').toLowerCase().includes(q) ||
        (d.domain || '').toLowerCase().includes(q)
    ).slice(0, 20);
  },
};
