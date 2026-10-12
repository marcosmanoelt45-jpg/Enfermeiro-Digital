import { supabase, isSupabaseConfigured } from './supabaseClient';
import { authService } from './authService';
import { auditService } from './auditService';

const LOCAL_STORAGE_EVOLUTIONS_KEY = 'enfermeiro_digital_evolutions';

function getLocalEvolutions() {
  const data = localStorage.getItem(LOCAL_STORAGE_EVOLUTIONS_KEY);
  if (!data) return [];
  try { return JSON.parse(data); } catch { return []; }
}

function saveLocalEvolutions(list) {
  localStorage.setItem(LOCAL_STORAGE_EVOLUTIONS_KEY, JSON.stringify(list));
}

// Gera o Hash criptográfico SHA-256 a partir do conteúdo SOAP e metadados
export async function generateEvolutionHash({ subjective, objective, assessment, plan, patientId, signerCoren, timestamp }) {
  const rawString = JSON.stringify({
    patient_id: patientId,
    s: subjective || '',
    o: objective || '',
    a: assessment || '',
    p: plan || '',
    coren: signerCoren,
    timestamp: timestamp,
  });

  const encoder = new TextEncoder();
  const data = encoder.encode(rawString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const evolutionService = {
  async filter(criteria = {}, orderBy = '-created_date', limit = 100) {
    if (!isSupabaseConfigured()) {
      let list = getLocalEvolutions();
      if (criteria.patient_id) {
        list = list.filter((e) => e.patient_id === criteria.patient_id);
      }
      return list.sort((a, b) => new Date(b.created_at || b.created_date || 0) - new Date(a.created_at || a.created_date || 0)).slice(0, limit);
    }

    try {
      let query = supabase.from('evolutions').select('*');
      if (criteria.patient_id) {
        query = query.eq('patient_id', criteria.patient_id);
      }
      query = query.order('created_at', { ascending: false }).limit(limit);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((e) => ({
        ...e,
        created_date: e.created_at,
        updated_date: e.updated_at,
      }));
    } catch {
      let list = getLocalEvolutions();
      if (criteria.patient_id) {
        list = list.filter((e) => e.patient_id === criteria.patient_id);
      }
      return list.sort((a, b) => new Date(b.created_at || b.created_date || 0) - new Date(a.created_at || a.created_date || 0)).slice(0, limit);
    }
  },

  async create(evolutionData) {
    const user = await authService.getCurrentUser();
    const payload = {
      ...evolutionData,
      org_id: user?.org_id || null,
      created_by_id: user?.id || null,
      signed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };

    let createdRecord;
    if (!isSupabaseConfigured()) {
      const list = getLocalEvolutions();
      payload.id = 'evolution-' + Math.random().toString(36).substring(2, 9);
      list.unshift(payload);
      saveLocalEvolutions(list);
      createdRecord = payload;
    } else {
      try {
        const { data, error } = await supabase
          .from('evolutions')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        createdRecord = {
          ...data,
          created_date: data.created_at,
          updated_date: data.updated_at,
        };
      } catch {
        const list = getLocalEvolutions();
        payload.id = 'evolution-' + Math.random().toString(36).substring(2, 9);
        list.unshift(payload);
        saveLocalEvolutions(list);
        createdRecord = payload;
      }
    }

    await auditService.log({
      action: 'CREATE',
      entity_type: 'evolution',
      entity_id: createdRecord.id,
      details: { patient_id: createdRecord.patient_id },
    }).catch(() => {});

    return createdRecord;
  },

  async update(id, updates) {
    if (!isSupabaseConfigured()) {
      const list = getLocalEvolutions();
      const idx = list.findIndex((e) => e.id === id);
      if (idx === -1) throw new Error('Evolução não encontrada');
      list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString(), updated_date: new Date().toISOString() };
      saveLocalEvolutions(list);
      return list[idx];
    }

    try {
      const { data, error } = await supabase
        .from('evolutions')
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
      const list = getLocalEvolutions();
      const idx = list.findIndex((e) => e.id === id);
      if (idx === -1) throw new Error('Evolução não encontrada');
      list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString(), updated_date: new Date().toISOString() };
      saveLocalEvolutions(list);
      return list[idx];
    }
  },

  // Fluxo de Assinatura Eletrônica Avançada (Lei 14.063/2020 & COFEN 736/2024)
  async signEvolution(evolutionId, customCoren = null) {
    const user = await authService.getCurrentUser();
    const signerCoren = customCoren || user?.coren || 'COREN NÃO INFORMADO';
    const signerName = user?.name || user?.full_name || 'Enfermeiro Responsável';
    const timestamp = new Date().toISOString();

    // Obter dados da evolução para cálculo do hash
    let evolution;
    if (!isSupabaseConfigured()) {
      const list = getLocalEvolutions();
      evolution = list.find((e) => e.id === evolutionId);
    } else {
      try {
        const { data } = await supabase.from('evolutions').select('*').eq('id', evolutionId).single();
        evolution = data;
      } catch {
        const list = getLocalEvolutions();
        evolution = list.find((e) => e.id === evolutionId);
      }
    }

    if (!evolution) throw new Error('Evolução não encontrada');

    const hash = await generateEvolutionHash({
      subjective: evolution.subjective,
      objective: evolution.objective,
      assessment: evolution.assessment,
      plan: evolution.plan,
      patientId: evolution.patient_id,
      signerCoren,
      timestamp,
    });

    const signatureUpdates = {
      signed: true,
      signed_by: user?.id || null,
      signer_name: signerName,
      signer_coren: signerCoren,
      signed_at: timestamp,
      signature_hash_sha256: hash,
    };

    const updated = await this.update(evolutionId, signatureUpdates);

    await auditService.log({
      action: 'SIGN',
      entity_type: 'evolution',
      entity_id: evolutionId,
      details: {
        hash,
        signer_coren: signerCoren,
        timestamp,
      },
    }).catch(() => {});

    return updated;
  },

  async delete(id) {
    if (!isSupabaseConfigured()) {
      const list = getLocalEvolutions().filter((e) => e.id !== id);
      saveLocalEvolutions(list);
    } else {
      try {
        const { error } = await supabase.from('evolutions').delete().eq('id', id);
        if (error) throw error;
      } catch {
        const list = getLocalEvolutions().filter((e) => e.id !== id);
        saveLocalEvolutions(list);
      }
    }

    await auditService.log({
      action: 'DELETE',
      entity_type: 'evolution',
      entity_id: id,
    }).catch(() => {});

    return { success: true };
  },

  async deleteMany(criteria = {}) {
    if (!isSupabaseConfigured()) {
      let list = getLocalEvolutions();
      if (criteria.patient_id) {
        list = list.filter((e) => e.patient_id !== criteria.patient_id);
      }
      saveLocalEvolutions(list);
      return { success: true };
    }

    try {
      let query = supabase.from('evolutions').delete();
      if (criteria.patient_id) {
        query = query.eq('patient_id', criteria.patient_id);
      }
      const { error } = await query;
      if (error) throw error;
      return { success: true };
    } catch {
      let list = getLocalEvolutions();
      if (criteria.patient_id) {
        list = list.filter((e) => e.patient_id !== criteria.patient_id);
      }
      saveLocalEvolutions(list);
      return { success: true };
    }
  },
};
