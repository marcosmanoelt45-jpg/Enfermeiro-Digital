import { supabase, isSupabaseConfigured } from './supabaseClient';
import { authService } from './authService';
import { computeAllScores } from '@/lib/riskEngine';
import { aiService } from './aiService';

const LOCAL_STORAGE_ASSESSMENTS_KEY = 'enfermeiro_digital_assessments';

function buildDefaultAssessment(customId = 'assessment-demo') {
  const now = new Date().toISOString();
  return {
    id: customId || 'assessment-demo',
    patient_id: 'patient-demo-01',
    patient_name: 'Carlos Eduardo Mendes (Leito 04 · Clínica Médica)',
    pa_sistolica: 138,
    pa_diastolica: 86,
    fc: 94,
    fr: 21,
    tax: 37.4,
    sat: 93,
    braden_total: 13,
    braden_level: 'Risco Moderado',
    cam_positive: false,
    audit_total: 2,
    sak_score: 7.5,
    sak_level: 'Moderado',
    caloi_score: 4,
    risk_status: 'alerta',
    notes: 'Paciente consciente, orientado no tempo e espaço, refere dispneia aos médios esforços e mobilidade reduzida no leito após 4º DIH. Hiperemia não branqueável em região sacral.',
    ai_status: 'generated',
    ai_response: {
      ai_engine: 'Motor Clínico NANDA-I (Demonstração)',
      prioridade: 'alta',
      resumo: 'Paciente apresenta risco moderado para lesão por pressão (Braden 13) associado a mobilidade física prejudicada no leito, risco moderado de quedas (SAK 7,5) e padrão respiratório limítrofe (FR 21 irpm, SpO2 93% em ar ambiente). Priorizar proteção tegumentar, vigilância respiratória e prevenção de quedas.',
      diagnosticos: [
        {
          code: '00312',
          title: 'Integridade tissular prejudicada / Risco de lesão por pressão no adulto',
          domain: 'Domínio 11 · Segurança/Proteção',
          class: 'Classe 2 · Lesão Física',
          defining_characteristics: ['Hiperemia em proeminência óssea sacral', 'Escore de Braden 13 (Risco Moderado)'],
          related_factors: ['Mobilidade física diminuída no leito', 'Pressão sobre proeminência óssea'],
          interventions: [
            'NIC 3540 — Prevenção de Lesão por Pressão: reposicionamento a cada 2h com alívio de pressão sacral',
            'Aplicar cobertura preventiva multicamadas de espuma de silicone em região sacral',
            'Inspecionar pele em proeminências ósseas a cada turno e manter hidratação com ácidos graxos essenciais'
          ],
          outcomes: [
            'NOC 1101 — Integridade Tissular: Pele e Mucosas mantida sem evolução para estágio 2 em 48h',
            'Ausência de novas áreas de hiperemia não branqueável'
          ]
        },
        {
          code: '00303',
          title: 'Risco de quedas no adulto',
          domain: 'Domínio 11 · Segurança/Proteção',
          class: 'Classe 2 · Lesão Física',
          defining_characteristics: ['Escore SAK 7,5 (Risco Moderado)'],
          related_factors: ['Limitação para deambular sem auxílio', 'Uso de dispositivos e fraqueza muscular'],
          interventions: [
            'NIC 6490 — Prevenção de Quedas: manter grades elevadas, leito travado em posição baixa e campainha ao alcance',
            'Orientar paciente e acompanhante a solicitar auxílio da equipe antes de levantar do leito'
          ],
          outcomes: [
            'NOC 1909 — Comportamento de Prevenção de Quedas: zero episódios de queda durante a internação'
          ]
        }
      ]
    },
    created_at: now,
    updated_at: now,
    created_date: now,
    updated_date: now,
  };
}

function getLocalAssessments() {
  const data = localStorage.getItem(LOCAL_STORAGE_ASSESSMENTS_KEY);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    // Filtra registros corrompidos sem id ou sem sinais vitais criados anteriormente
    const valid = parsed.filter((a) => a && typeof a.id === 'string' && a.id !== 'undefined' && a.pa_sistolica !== undefined);
    if (valid.length !== parsed.length) {
      localStorage.setItem(LOCAL_STORAGE_ASSESSMENTS_KEY, JSON.stringify(valid));
    }
    return valid;
  } catch {
    return [];
  }
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
    const list = getLocalAssessments();

    if (!id || id === 'undefined') {
      if (list.length > 0) {
        return list[0];
      }
      const demo = buildDefaultAssessment('assessment-demo');
      list.push(demo);
      saveLocalAssessments(list);
      return demo;
    }

    if (!isSupabaseConfigured()) {
      const item = list.find((a) => a.id === id);
      if (item) return item;
      const fallback = buildDefaultAssessment(id);
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
      const item = list.find((a) => a.id === id);
      if (item) return item;
      const fallback = buildDefaultAssessment(id);
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
