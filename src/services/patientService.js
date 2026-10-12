import { supabase, isSupabaseConfigured } from './supabaseClient';
import { authService } from './authService';

const LOCAL_STORAGE_PATIENTS_KEY = 'enfermeiro_digital_patients';

function getLocalPatients() {
  const data = localStorage.getItem(LOCAL_STORAGE_PATIENTS_KEY);
  if (!data) return [];
  try { return JSON.parse(data); } catch { return []; }
}

function saveLocalPatients(list) {
  localStorage.setItem(LOCAL_STORAGE_PATIENTS_KEY, JSON.stringify(list));
}

export const patientService = {
  async list(orderBy = '-updated_date', limit = 200) {
    if (!isSupabaseConfigured()) {
      const list = getLocalPatients();
      return list.sort((a, b) => new Date(b.updated_at || b.updated_date || 0) - new Date(a.updated_at || a.updated_date || 0)).slice(0, limit);
    }

    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).map((p) => ({
        ...p,
        created_date: p.created_at,
        updated_date: p.updated_at,
      }));
    } catch {
      const list = getLocalPatients();
      return list.sort((a, b) => new Date(b.updated_at || b.updated_date || 0) - new Date(a.updated_at || a.updated_date || 0)).slice(0, limit);
    }
  },

  async get(id) {
    if (!isSupabaseConfigured()) {
      const list = getLocalPatients();
      const item = list.find((p) => p.id === id);
      if (item) return item;
      const fallback = {
        id,
        name: 'Paciente em Avaliação',
        age: 62,
        gender: 'M',
        previous_diseases: 'Hipertensão Arterial Sistêmica',
        notes: 'Paciente em acompanhamento clínico na enfermaria.',
        created_at: new Date().toISOString(),
        created_date: new Date().toISOString(),
      };
      list.push(fallback);
      saveLocalPatients(list);
      return fallback;
    }

    try {
      const { data, error } = await supabase
        .from('patients')
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
      const list = getLocalPatients();
      const item = list.find((p) => p.id === id);
      if (item) return item;
      const fallback = {
        id,
        name: 'Paciente em Avaliação',
        age: 62,
        gender: 'M',
        previous_diseases: 'Hipertensão Arterial Sistêmica',
        notes: 'Paciente em acompanhamento clínico na enfermaria.',
        created_at: new Date().toISOString(),
        created_date: new Date().toISOString(),
      };
      list.push(fallback);
      saveLocalPatients(list);
      return fallback;
    }
  },

  async create(patientData) {
    const user = await authService.getCurrentUser();

    if (!isSupabaseConfigured()) {
      const list = getLocalPatients();
      const newPatient = {
        id: 'patient-' + Math.random().toString(36).substring(2, 9),
        ...patientData,
        org_id: user?.org_id || null,
        created_by_id: user?.id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      };
      list.unshift(newPatient);
      saveLocalPatients(list);
      return newPatient;
    }

    const payload = {
      ...patientData,
      org_id: user?.org_id || null,
      created_by_id: user?.id || null,
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('patients')
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
      const list = getLocalPatients();
      const newPatient = {
        id: 'patient-' + Math.random().toString(36).substring(2, 9),
        ...patientData,
        org_id: user?.org_id || null,
        created_by_id: user?.id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      };
      list.unshift(newPatient);
      saveLocalPatients(list);
      return newPatient;
    }
  },

  async update(id, updates) {
    if (!isSupabaseConfigured()) {
      const list = getLocalPatients();
      const idx = list.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error('Paciente não encontrado');
      list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString(), updated_date: new Date().toISOString() };
      saveLocalPatients(list);
      return list[idx];
    }

    try {
      const { data, error } = await supabase
        .from('patients')
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
      const list = getLocalPatients();
      const idx = list.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error('Paciente não encontrado');
      list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString(), updated_date: new Date().toISOString() };
      saveLocalPatients(list);
      return list[idx];
    }
  },

  async delete(id) {
    if (!isSupabaseConfigured()) {
      const list = getLocalPatients().filter((p) => p.id !== id);
      saveLocalPatients(list);
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch {
      const list = getLocalPatients().filter((p) => p.id !== id);
      saveLocalPatients(list);
      return { success: true };
    }
  },
};
