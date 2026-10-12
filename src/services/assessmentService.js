import { supabase, isSupabaseConfigured } from './supabaseClient';
import { authService } from './authService';
import { computeAllScores } from '@/lib/riskEngine';
import { aiService } from './aiService';

const LOCAL_STORAGE_ASSESSMENTS_KEY = 'enfermeiro_digital_assessments';

function getLocalAssessments() {
  const data = localStorage.getItem(LOCAL_STORAGE_ASSESSMENTS_KEY);
  if (!data) return [];
  try { return JSON.parse(data); } catch { return []; }
}

function saveLocalAssessments(list) {
  localStorage.setItem(LOCAL_STORAGE_ASSESSMENTS_KEY, JSON.stringify(list));
}

export const assessmentService = {
  async list(orderBy = '-created_date', limit = 200) {
    if (!isSupabaseConfigured()) {
      const list = getLocalAssessments();
      return list.sort((a, b) => new Date(b.created_at || b.created_date || 0) - new Date(a.created_at || a.created_date || 0)).slice(0, limit);
    }

    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).map((a) => ({
        ...a,
        created_date: a.created_at,
        updated_date: a.updated_at,
      }));
    } catch {
      const list = getLocalAssessments();
      return list.sort((a, b) => new Date(b.created_at || b.created_date || 0) - new Date(a.created_at || a.created_date || 0)).slice(0, limit);
    }
  },

  async filter(criteria = {}, orderBy = '-created_date', limit = 100) {
    if (!isSupabaseConfigured()) {
      let list = getLocalAssessments();
      if (criteria.patient_id) {
        list = list.filter((a) => a.patient_id === criteria.patient_id);
      }
      return list.sort((a, b) => new Date(b.created_at || b.created_date || 0) - new Date(a.created_at || a.created_date || 0)).slice(0, limit);
    }

    try {
      let query = supabase.from('assessments').select('*');
      if (criteria.patient_id) {
        query = query.eq('patient_id', criteria.patient_id);
      }
      query = query.order('created_at', { ascending: false }).limit(limit);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((a) => ({
        ...a,
        created_date: a.created_at,
        updated_date: a.updated_at,
      }));
    } catch {
      let list = getLocalAssessments();
      if (criteria.patient_id) {
        list = list.filter((a) => a.patient_id === criteria.patient_id);
      }
      return list.sort((a, b) => new Date(b.created_at || b.created_date || 0) - new Date(a.created_at || a.created_date || 0)).slice(0, limit);
    }
  },

  async get(id) {
    if (!isSupabaseConfigured()) {
      const list = getLocalAssessments();
      const item = list.find((a) => a.id === id);
      if (item) return item;
      const fallback = {
        id,
        patient_id: 'patient-fallback',
        patient_name: 'Paciente em Avaliação',
        ai_status: 'generated',
        risk_status: 'alerta',
        created_at: new Date().toISOString(),
        created_date: new Date().toISOString(),
      };
      list.push(fallback);
      saveLocalAssessments(list);
      return fallback;
    }

    try {
      const { data, error } = await supabase
        .from('assessments')
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
      const list = getLocalAssessments();
      const item = list.find((a) => a.id === id);
      if (item) return item;
      const fallback = {
        id,
        patient_id: 'patient-fallback',
        patient_name: 'Paciente em Avaliação',
        ai_status: 'generated',
        risk_status: 'alerta',
        created_at: new Date().toISOString(),
        created_date: new Date().toISOString(),
      };
      list.push(fallback);
      saveLocalAssessments(list);
      return fallback;
    }
  },

  async create(assessmentData) {
    const user = await authService.getCurrentUser();
    const scores = computeAllScores(assessmentData);

    const record = {
      ...assessmentData,
      ...scores,
      ai_status: 'pending',
      org_id: user?.org_id || null,
      created_by_id: user?.id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };

    let createdId;
    if (!isSupabaseConfigured()) {
      const list = getLocalAssessments();
      record.id = 'assessment-' + Math.random().toString(36).substring(2, 9);
      list.unshift(record);
      saveLocalAssessments(list);
      createdId = record.id;
    } else {
      try {
        const { data, error } = await supabase
          .from('assessments')
          .insert(record)
          .select()
          .single();
        if (error) throw error;
        createdId = data.id;
        Object.assign(record, data);
      } catch {
        const list = getLocalAssessments();
        record.id = 'assessment-' + Math.random().toString(36).substring(2, 9);
        list.unshift(record);
        saveLocalAssessments(list);
        createdId = record.id;
      }
    }

    // Dispara a geração de IA em background de forma não bloqueante
    aiService.generateCarePlanAsync(createdId, record).catch((err) => {
      console.warn('Erro na geração assíncrona do plano de cuidados:', err);
    });

    return { id: createdId, ...record, ...scores };
  },

  async update(id, updates) {
    if (!isSupabaseConfigured()) {
      const list = getLocalAssessments();
      const idx = list.findIndex((a) => a.id === id);
      if (idx === -1) throw new Error('Avaliação não encontrada');
      list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString(), updated_date: new Date().toISOString() };
      saveLocalAssessments(list);
      return list[idx];
    }

    try {
      const { data, error } = await supabase
        .from('assessments')
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
      const list = getLocalAssessments();
      const idx = list.findIndex((a) => a.id === id);
      if (idx === -1) throw new Error('Avaliação não encontrada');
      list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString(), updated_date: new Date().toISOString() };
      saveLocalAssessments(list);
      return list[idx];
    }
  },

  async delete(id) {
    if (!isSupabaseConfigured()) {
      const list = getLocalAssessments().filter((a) => a.id !== id);
      saveLocalAssessments(list);
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('assessments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch {
      const list = getLocalAssessments().filter((a) => a.id !== id);
      saveLocalAssessments(list);
      return { success: true };
    }
  },

  async deleteMany(criteria = {}) {
    if (!isSupabaseConfigured()) {
      let list = getLocalAssessments();
      if (criteria.patient_id) {
        list = list.filter((a) => a.patient_id !== criteria.patient_id);
      }
      saveLocalAssessments(list);
      return { success: true };
    }

    try {
      let query = supabase.from('assessments').delete();
      if (criteria.patient_id) {
        query = query.eq('patient_id', criteria.patient_id);
      }
      const { error } = await query;
      if (error) throw error;
      return { success: true };
    } catch {
      let list = getLocalAssessments();
      if (criteria.patient_id) {
        list = list.filter((a) => a.patient_id !== criteria.patient_id);
      }
      saveLocalAssessments(list);
      return { success: true };
    }
  },
};
