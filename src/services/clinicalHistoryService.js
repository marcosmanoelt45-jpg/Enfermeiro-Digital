/**
 * clinicalHistoryService.js
 * Serviço unificado de persistência e gerenciamento do histórico de atividades clínicas do Enfere.
 * Suporta Passagem de Plantão SBAR, Montador de Casos, Simulador Clínico e Videoteca.
 */

const STORAGE_KEY = 'enfere_clinical_history_v1';

export const MODULE_TYPES = {
  SBAR: 'sbar',
  CASE_BUILDER: 'case_builder',
  CASE_SIMULATOR: 'case_simulator',
  PROCEDURES: 'procedures',
  SYSTEMS_ASSESSMENT: 'systems_assessment',
};

export const MODULE_LABELS = {
  sbar: 'Passagem de Plantão SBAR',
  case_builder: 'Montador de Casos Clínicos',
  case_simulator: 'Simulador de Casos Clínicos',
  procedures: 'Videoteca de Procedimentos',
  systems_assessment: 'Semiologia por Sistemas',
};

function getStorage() {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[clinicalHistoryService] Falha ao ler histórico:', err);
    return [];
  }
}

function setStorage(items) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  } catch (err) {
    console.warn('[clinicalHistoryService] Falha ao salvar histórico:', err);
  }
}

export const clinicalHistoryService = {
  /**
   * Retorna todas as atividades ordenadas por data decrescente.
   */
  getAllActivities(moduleFilter = 'all') {
    const list = getStorage();
    if (moduleFilter && moduleFilter !== 'all') {
      return list.filter((item) => item.moduleType === moduleFilter);
    }
    return list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  },

  /**
   * Salva ou atualiza um rascunho de atividade em andamento.
   */
  saveDraft({ id, moduleType, title, patientInfo, progress = 0, durationSeconds = 0, formData = {}, step = 0 }) {
    const list = getStorage();
    const now = new Date().toISOString();
    const existingIndex = id ? list.findIndex((it) => it.id === id) : -1;

    const activityItem = {
      id: id || `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      moduleType,
      moduleLabel: MODULE_LABELS[moduleType] || moduleType,
      title: title || 'Caso Clínico em Andamento',
      patientInfo: patientInfo || 'Paciente Não Identificado',
      progressPercentage: Math.min(Math.max(progress, 0), 99), // Rascunho não atinge 100%
      status: 'em_andamento',
      durationSeconds: Math.max(0, Math.round(durationSeconds)),
      startedAt: existingIndex >= 0 ? list[existingIndex].startedAt : now,
      updatedAt: now,
      step,
      formData,
      score: null,
      evaluation: null,
    };

    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...activityItem };
    } else {
      list.unshift(activityItem);
    }

    setStorage(list);
    return activityItem;
  },

  /**
   * Submete e finaliza formalmente uma atividade clínica com 100% de conclusão.
   */
  submitActivity({ id, moduleType, title, patientInfo, durationSeconds = 0, score = 100, evaluation = null, formData = {} }) {
    const list = getStorage();
    const now = new Date().toISOString();
    const existingIndex = id ? list.findIndex((it) => it.id === id) : -1;

    const completedItem = {
      id: id || `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      moduleType,
      moduleLabel: MODULE_LABELS[moduleType] || moduleType,
      title: title || 'Caso Clínico Concluído',
      patientInfo: patientInfo || 'Paciente Avaliado',
      progressPercentage: 100,
      status: 'concluido',
      durationSeconds: Math.max(0, Math.round(durationSeconds)),
      startedAt: existingIndex >= 0 ? list[existingIndex].startedAt : now,
      finishedAt: now,
      updatedAt: now,
      score: typeof score === 'number' ? score : 100,
      evaluation: evaluation || 'Atividade clínica concluída com conformidade aos protocolos de enfermagem.',
      formData,
    };

    if (existingIndex >= 0) {
      list[existingIndex] = completedItem;
    } else {
      list.unshift(completedItem);
    }

    setStorage(list);
    return completedItem;
  },

  /**
   * Busca uma atividade específica pelo identificador.
   */
  getActivityById(id) {
    if (!id) return null;
    const list = getStorage();
    return list.find((it) => it.id === id) || null;
  },

  /**
   * Remove uma atividade do histórico.
   */
  deleteActivity(id) {
    if (!id) return false;
    const list = getStorage();
    const filtered = list.filter((it) => it.id !== id);
    setStorage(filtered);
    return true;
  },

  /**
   * Formata a duração em segundos para mm:ss ou hh:mm:ss.
   */
  formatDuration(seconds = 0) {
    const s = Math.max(0, Math.round(seconds));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs}h ${remMins.toString().padStart(2, '0')}m`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} min`;
  },

  /**
   * Estatísticas resumidas de progresso clínico do estudante.
   */
  getSummaryStats() {
    const list = getStorage();
    const completed = list.filter((it) => it.status === 'concluido');
    const inProgress = list.filter((it) => it.status === 'em_andamento');
    const totalDurationSeconds = list.reduce((acc, it) => acc + (it.durationSeconds || 0), 0);
    const avgScore = completed.length > 0
      ? Math.round(completed.reduce((acc, it) => acc + (it.score || 0), 0) / completed.length)
      : 0;

    return {
      total: list.length,
      completedCount: completed.length,
      inProgressCount: inProgress.length,
      totalDurationSeconds,
      avgScore,
    };
  }
};
