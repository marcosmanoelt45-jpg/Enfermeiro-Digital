import { supabase, isSupabaseConfigured } from './supabaseClient';
import { authService } from './authService';

const LOCAL_STORAGE_TURMAS_KEY = 'enfermeiro_digital_turmas';
const LOCAL_STORAGE_MEMBERS_KEY = 'enfermeiro_digital_turma_members';
const LOCAL_STORAGE_ASSIGNMENTS_KEY = 'enfermeiro_digital_assignments';
const LOCAL_STORAGE_ANSWERS_KEY = 'enfermeiro_digital_student_answers';

function getStored(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function setStored(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

export const turmaService = {
  // Turmas
  async listTurmas(limit = 200) {
    if (!isSupabaseConfigured()) {
      return getStored(LOCAL_STORAGE_TURMAS_KEY).slice(0, limit);
    }
    try {
      const { data, error } = await supabase.from('turmas').select('*').order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return (data || []).map((t) => ({ ...t, created_date: t.created_at, updated_date: t.updated_at }));
    } catch {
      return getStored(LOCAL_STORAGE_TURMAS_KEY).slice(0, limit);
    }
  },

  async getTurma(id) {
    if (!isSupabaseConfigured()) {
      const t = getStored(LOCAL_STORAGE_TURMAS_KEY).find((x) => x.id === id);
      if (!t) throw new Error('Turma não encontrada');
      return t;
    }
    try {
      const { data, error } = await supabase.from('turmas').select('*').eq('id', id).single();
      if (error) throw error;
      return { ...data, created_date: data.created_at, updated_date: data.updated_at };
    } catch {
      const t = getStored(LOCAL_STORAGE_TURMAS_KEY).find((x) => x.id === id);
      if (!t) throw new Error('Turma não encontrada');
      return t;
    }
  },

  async filterTurmas(criteria = {}) {
    if (!isSupabaseConfigured()) {
      let list = getStored(LOCAL_STORAGE_TURMAS_KEY);
      if (criteria.code) list = list.filter((t) => t.code === criteria.code);
      if (criteria.teacher_id) list = list.filter((t) => t.teacher_id === criteria.teacher_id);
      return list;
    }
    try {
      let query = supabase.from('turmas').select('*');
      if (criteria.code) query = query.eq('code', criteria.code);
      if (criteria.teacher_id) query = query.eq('teacher_id', criteria.teacher_id);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((t) => ({ ...t, created_date: t.created_at, updated_date: t.updated_at }));
    } catch {
      let list = getStored(LOCAL_STORAGE_TURMAS_KEY);
      if (criteria.code) list = list.filter((t) => t.code === criteria.code);
      if (criteria.teacher_id) list = list.filter((t) => t.teacher_id === criteria.teacher_id);
      return list;
    }
  },

  async createTurma(data) {
    const user = await authService.getCurrentUser();
    const payload = {
      ...data,
      teacher_id: user?.id || null,
      teacher_name: user?.name || user?.full_name || 'Professor',
      org_id: user?.org_id || null,
      created_by_id: user?.id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };

    if (!isSupabaseConfigured()) {
      const list = getStored(LOCAL_STORAGE_TURMAS_KEY);
      payload.id = 'turma-' + Math.random().toString(36).substring(2, 9);
      list.unshift(payload);
      setStored(LOCAL_STORAGE_TURMAS_KEY, list);
      return payload;
    }

    try {
      const { data: created, error } = await supabase.from('turmas').insert(payload).select().single();
      if (error) throw error;
      return { ...created, created_date: created.created_at, updated_date: created.updated_at };
    } catch {
      const list = getStored(LOCAL_STORAGE_TURMAS_KEY);
      payload.id = 'turma-' + Math.random().toString(36).substring(2, 9);
      list.unshift(payload);
      setStored(LOCAL_STORAGE_TURMAS_KEY, list);
      return payload;
    }
  },

  async updateTurma(id, updates) {
    if (!isSupabaseConfigured()) {
      const list = getStored(LOCAL_STORAGE_TURMAS_KEY);
      const idx = list.findIndex((t) => t.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString(), updated_date: new Date().toISOString() };
        setStored(LOCAL_STORAGE_TURMAS_KEY, list);
        return list[idx];
      }
      throw new Error('Turma não encontrada');
    }

    try {
      const { data, error } = await supabase.from('turmas').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw error;
      return { ...data, created_date: data.created_at, updated_date: data.updated_at };
    } catch {
      const list = getStored(LOCAL_STORAGE_TURMAS_KEY);
      const idx = list.findIndex((t) => t.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString(), updated_date: new Date().toISOString() };
        setStored(LOCAL_STORAGE_TURMAS_KEY, list);
        return list[idx];
      }
      throw new Error('Turma não encontrada');
    }
  },

  async updateManyTurmas(criteria = {}, updates = {}) {
    const fieldsToUpdate = updates.$set || updates;
    const list = getStored(LOCAL_STORAGE_TURMAS_KEY);
    const updated = list.map((t) => {
      let matches = true;
      if (criteria.teacher_id && t.teacher_id !== criteria.teacher_id) matches = false;
      return matches ? { ...t, ...fieldsToUpdate } : t;
    });
    setStored(LOCAL_STORAGE_TURMAS_KEY, updated);

    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('turmas').update(fieldsToUpdate);
        if (criteria.teacher_id) query = query.eq('teacher_id', criteria.teacher_id);
        await query;
      } catch {}
    }
    return { success: true };
  },

  async deleteTurma(id) {
    setStored(LOCAL_STORAGE_TURMAS_KEY, getStored(LOCAL_STORAGE_TURMAS_KEY).filter((t) => t.id !== id));
    setStored(LOCAL_STORAGE_MEMBERS_KEY, getStored(LOCAL_STORAGE_MEMBERS_KEY).filter((m) => m.turma_id !== id));
    setStored(LOCAL_STORAGE_ASSIGNMENTS_KEY, getStored(LOCAL_STORAGE_ASSIGNMENTS_KEY).filter((a) => a.turma_id !== id));
    setStored(LOCAL_STORAGE_ANSWERS_KEY, getStored(LOCAL_STORAGE_ANSWERS_KEY).filter((ans) => ans.turma_id !== id));

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('student_answers').delete().eq('turma_id', id);
        await supabase.from('case_assignments').delete().eq('turma_id', id);
        await supabase.from('turma_members').delete().eq('turma_id', id);
        await supabase.from('turmas').delete().eq('id', id);
      } catch {}
    }
    return { success: true };
  },

  // Membros da turma
  async filterTurmaMembers(criteria = {}, orderBy = '-updated_date', limit = 200) {
    if (!isSupabaseConfigured()) {
      let list = getStored(LOCAL_STORAGE_MEMBERS_KEY);
      if (criteria.turma_id) list = list.filter((m) => m.turma_id === criteria.turma_id);
      if (criteria.user_id) list = list.filter((m) => m.user_id === criteria.user_id);
      return list;
    }

    try {
      let query = supabase.from('turma_members').select('*');
      if (criteria.turma_id) query = query.eq('turma_id', criteria.turma_id);
      if (criteria.user_id) query = query.eq('user_id', criteria.user_id);
      const { data, error } = await query.limit(limit);
      if (error) throw error;
      return (data || []).map((m) => ({ ...m, created_date: m.created_at, updated_date: m.updated_at }));
    } catch {
      let list = getStored(LOCAL_STORAGE_MEMBERS_KEY);
      if (criteria.turma_id) list = list.filter((m) => m.turma_id === criteria.turma_id);
      if (criteria.user_id) list = list.filter((m) => m.user_id === criteria.user_id);
      return list;
    }
  },

  async addTurmaMember(memberData) {
    const payload = {
      ...memberData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };

    if (!isSupabaseConfigured()) {
      const list = getStored(LOCAL_STORAGE_MEMBERS_KEY);
      payload.id = 'member-' + Math.random().toString(36).substring(2, 9);
      list.push(payload);
      setStored(LOCAL_STORAGE_MEMBERS_KEY, list);
      return payload;
    }

    try {
      const { data, error } = await supabase.from('turma_members').insert(payload).select().single();
      if (error) throw error;
      return { ...data, created_date: data.created_at, updated_date: data.updated_at };
    } catch {
      const list = getStored(LOCAL_STORAGE_MEMBERS_KEY);
      payload.id = 'member-' + Math.random().toString(36).substring(2, 9);
      list.push(payload);
      setStored(LOCAL_STORAGE_MEMBERS_KEY, list);
      return payload;
    }
  },

  async removeTurmaMember(memberId) {
    setStored(LOCAL_STORAGE_MEMBERS_KEY, getStored(LOCAL_STORAGE_MEMBERS_KEY).filter((m) => m.id !== memberId));

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('turma_members').delete().eq('id', memberId);
      } catch {}
    }
    return { success: true };
  },

  async deleteManyTurmaMembers(criteria = {}) {
    let list = getStored(LOCAL_STORAGE_MEMBERS_KEY);
    if (criteria.turma_id) list = list.filter((m) => m.turma_id !== criteria.turma_id);
    if (criteria.user_id) list = list.filter((m) => m.user_id !== criteria.user_id);
    setStored(LOCAL_STORAGE_MEMBERS_KEY, list);

    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('turma_members').delete();
        if (criteria.turma_id) query = query.eq('turma_id', criteria.turma_id);
        if (criteria.user_id) query = query.eq('user_id', criteria.user_id);
        await query;
      } catch {}
    }
    return { success: true };
  },

  async updateManyTurmaMembers(criteria = {}, updates = {}) {
    const fieldsToUpdate = updates.$set || updates;
    const list = getStored(LOCAL_STORAGE_MEMBERS_KEY);
    const updated = list.map((m) => {
      let matches = true;
      if (criteria.turma_id && m.turma_id !== criteria.turma_id) matches = false;
      if (criteria.user_id && m.user_id !== criteria.user_id) matches = false;
      return matches ? { ...m, ...fieldsToUpdate } : m;
    });
    setStored(LOCAL_STORAGE_MEMBERS_KEY, updated);

    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('turma_members').update(fieldsToUpdate);
        if (criteria.turma_id) query = query.eq('turma_id', criteria.turma_id);
        if (criteria.user_id) query = query.eq('user_id', criteria.user_id);
        await query;
      } catch {}
    }
    return { success: true };
  },

  // Atividades / Estudos de Caso
  async filterCaseAssignments(criteria = {}, orderBy = '-created_date', limit = 200) {
    if (!isSupabaseConfigured()) {
      let list = getStored(LOCAL_STORAGE_ASSIGNMENTS_KEY);
      if (criteria.turma_id) list = list.filter((a) => a.turma_id === criteria.turma_id);
      return list;
    }

    try {
      let query = supabase.from('case_assignments').select('*');
      if (criteria.turma_id) query = query.eq('turma_id', criteria.turma_id);
      query = query.order('created_at', { ascending: false }).limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((a) => ({ ...a, created_date: a.created_at, updated_date: a.updated_at }));
    } catch {
      let list = getStored(LOCAL_STORAGE_ASSIGNMENTS_KEY);
      if (criteria.turma_id) list = list.filter((a) => a.turma_id === criteria.turma_id);
      return list;
    }
  },

  async getCaseAssignment(id) {
    if (!isSupabaseConfigured()) {
      const item = getStored(LOCAL_STORAGE_ASSIGNMENTS_KEY).find((a) => a.id === id);
      if (!item) throw new Error('Atividade não encontrada');
      return item;
    }
    try {
      const { data, error } = await supabase.from('case_assignments').select('*').eq('id', id).single();
      if (error) throw error;
      return { ...data, created_date: data.created_at, updated_date: data.updated_at };
    } catch {
      const item = getStored(LOCAL_STORAGE_ASSIGNMENTS_KEY).find((a) => a.id === id);
      if (!item) throw new Error('Atividade não encontrada');
      return item;
    }
  },

  async createCaseAssignment(data) {
    const user = await authService.getCurrentUser();
    const payload = {
      ...data,
      created_by_id: user?.id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };

    if (!isSupabaseConfigured()) {
      const list = getStored(LOCAL_STORAGE_ASSIGNMENTS_KEY);
      payload.id = 'assign-' + Math.random().toString(36).substring(2, 9);
      list.unshift(payload);
      setStored(LOCAL_STORAGE_ASSIGNMENTS_KEY, list);
      return payload;
    }

    try {
      const { data: created, error } = await supabase.from('case_assignments').insert(payload).select().single();
      if (error) throw error;
      return { ...created, created_date: created.created_at, updated_date: created.updated_at };
    } catch {
      const list = getStored(LOCAL_STORAGE_ASSIGNMENTS_KEY);
      payload.id = 'assign-' + Math.random().toString(36).substring(2, 9);
      list.unshift(payload);
      setStored(LOCAL_STORAGE_ASSIGNMENTS_KEY, list);
      return payload;
    }
  },

  async deleteCaseAssignment(id) {
    setStored(LOCAL_STORAGE_ASSIGNMENTS_KEY, getStored(LOCAL_STORAGE_ASSIGNMENTS_KEY).filter((a) => a.id !== id));
    setStored(LOCAL_STORAGE_ANSWERS_KEY, getStored(LOCAL_STORAGE_ANSWERS_KEY).filter((ans) => ans.assignment_id !== id));

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('student_answers').delete().eq('assignment_id', id);
        await supabase.from('case_assignments').delete().eq('id', id);
      } catch {}
    }
    return { success: true };
  },

  async deleteManyCaseAssignments(criteria = {}) {
    let list = getStored(LOCAL_STORAGE_ASSIGNMENTS_KEY);
    if (criteria.turma_id) list = list.filter((a) => a.turma_id !== criteria.turma_id);
    setStored(LOCAL_STORAGE_ASSIGNMENTS_KEY, list);

    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('case_assignments').delete();
        if (criteria.turma_id) query = query.eq('turma_id', criteria.turma_id);
        await query;
      } catch {}
    }
    return { success: true };
  },

  // Respostas de alunos
  async filterStudentAnswers(criteria = {}, orderBy = '-created_date', limit = 200) {
    if (!isSupabaseConfigured()) {
      let list = getStored(LOCAL_STORAGE_ANSWERS_KEY);
      if (criteria.turma_id) list = list.filter((a) => a.turma_id === criteria.turma_id);
      if (criteria.assignment_id) list = list.filter((a) => a.assignment_id === criteria.assignment_id);
      if (criteria.student_id) list = list.filter((a) => a.student_id === criteria.student_id);
      return list;
    }

    try {
      let query = supabase.from('student_answers').select('*');
      if (criteria.turma_id) query = query.eq('turma_id', criteria.turma_id);
      if (criteria.assignment_id) query = query.eq('assignment_id', criteria.assignment_id);
      if (criteria.student_id) query = query.eq('student_id', criteria.student_id);
      const { data, error } = await query.limit(limit);
      if (error) throw error;
      return (data || []).map((a) => ({ ...a, created_date: a.created_at, updated_date: a.updated_at }));
    } catch {
      let list = getStored(LOCAL_STORAGE_ANSWERS_KEY);
      if (criteria.turma_id) list = list.filter((a) => a.turma_id === criteria.turma_id);
      if (criteria.assignment_id) list = list.filter((a) => a.assignment_id === criteria.assignment_id);
      if (criteria.student_id) list = list.filter((a) => a.student_id === criteria.student_id);
      return list;
    }
  },

  async createStudentAnswer(data) {
    const user = await authService.getCurrentUser();
    const payload = {
      ...data,
      student_id: user?.id || null,
      student_name: user?.name || user?.full_name || 'Estudante',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };

    if (!isSupabaseConfigured()) {
      const list = getStored(LOCAL_STORAGE_ANSWERS_KEY);
      payload.id = 'answer-' + Math.random().toString(36).substring(2, 9);
      list.unshift(payload);
      setStored(LOCAL_STORAGE_ANSWERS_KEY, list);
      return payload;
    }

    try {
      const { data: created, error } = await supabase.from('student_answers').insert(payload).select().single();
      if (error) throw error;
      return { ...created, created_date: created.created_at, updated_date: created.updated_at };
    } catch {
      const list = getStored(LOCAL_STORAGE_ANSWERS_KEY);
      payload.id = 'answer-' + Math.random().toString(36).substring(2, 9);
      list.unshift(payload);
      setStored(LOCAL_STORAGE_ANSWERS_KEY, list);
      return payload;
    }
  },

  async deleteManyStudentAnswers(criteria = {}) {
    let list = getStored(LOCAL_STORAGE_ANSWERS_KEY);
    if (criteria.turma_id) list = list.filter((a) => a.turma_id !== criteria.turma_id);
    if (criteria.assignment_id) list = list.filter((a) => a.assignment_id !== criteria.assignment_id);
    setStored(LOCAL_STORAGE_ANSWERS_KEY, list);

    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('student_answers').delete();
        if (criteria.turma_id) query = query.eq('turma_id', criteria.turma_id);
        if (criteria.assignment_id) query = query.eq('assignment_id', criteria.assignment_id);
        await query;
      } catch {}
    }
    return { success: true };
  },

  async syncAssignmentMembers(turmaId) {
    return { ok: true };
  },
};
