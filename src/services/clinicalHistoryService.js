/**
 * clinicalHistoryService.js
 * Serviço unificado de persistência e gerenciamento do histórico de atividades clínicas do Enfere.
 * Suporta Atendimento por Voz (Videochamada), Passagem de Plantão SBAR, Montador de Casos,
 * Simulador Clínico (PE), Cálculo de Doses e Videoteca de Procedimentos.
 */

const STORAGE_KEY = 'enfere_clinical_history_v1';
const REVISAO_STORAGE_KEY = 'enfere_questoes_revisao_v1';

function resolveCurrentUserId(providedUserId = null) {
  if (providedUserId) return providedUserId;
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('enfermeiro_digital_local_user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.id) return u.id;
      }
    }
  } catch {}
  return null;
}

function getKey(userId) {
  userId = resolveCurrentUserId(userId);
  if (!userId) return STORAGE_KEY;
  const cleanId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${STORAGE_KEY}_${cleanId}`;
}

function getRevisaoKey(userId) {
  userId = resolveCurrentUserId(userId);
  if (!userId) return REVISAO_STORAGE_KEY;
  const cleanId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${REVISAO_STORAGE_KEY}_${cleanId}`;
}

export const MODULE_TYPES = {
  VIDEOCHAMADA: 'videochamada',
  SBAR: 'sbar',
  CASE_BUILDER: 'case_builder',
  CASE_SIMULATOR: 'case_simulator',
  DOSAGE: 'dosage',
  PROCEDURES: 'procedures',
  SYSTEMS_ASSESSMENT: 'systems_assessment',
};

export const MODULE_LABELS = {
  videochamada: 'Atendimento por Voz (Videochamada)',
  sbar: 'Passagem de Plantão SBAR',
  case_builder: 'Montador de Casos Clínicos',
  case_simulator: 'Simulador de Casos Clínicos (PE)',
  dosage: 'Cálculo de Medicamentos & Doses',
  procedures: 'Videoteca de Procedimentos',
  systems_assessment: 'Avaliação Clínica',
};

function getStorage(userId) {
  try {
    if (typeof localStorage === 'undefined') return [];
    userId = resolveCurrentUserId(userId);
    const k = getKey(userId);
    let raw = localStorage.getItem(k);
    let userItems = [];
    if (raw) {
      try {
        const p = JSON.parse(raw);
        if (Array.isArray(p)) userItems = p;
      } catch {}
    }

    // Se o usuário estiver logado, também verifica a chave global para importar itens realizados
    if (userId) {
      const globalRaw = localStorage.getItem(STORAGE_KEY);
      if (globalRaw) {
        try {
          const globalItems = JSON.parse(globalRaw);
          if (Array.isArray(globalItems) && globalItems.length > 0) {
            const mapById = new Map(userItems.map((it) => [it.id, it]));
            let changed = false;
            globalItems.forEach((it) => {
              if (!mapById.has(it.id)) {
                mapById.set(it.id, { ...it, userId });
                changed = true;
              }
            });
            if (changed) {
              userItems = Array.from(mapById.values()).sort(
                (a, b) => new Date(b.updatedAt || b.finishedAt).getTime() - new Date(a.updatedAt || a.finishedAt).getTime()
              );
              localStorage.setItem(k, JSON.stringify(userItems));
            }
          }
        } catch {}
      }
    }

    return userItems;
  } catch (err) {
    console.warn('[clinicalHistoryService] Falha ao ler histórico:', err);
    return [];
  }
}

function setStorage(items, userId) {
  try {
    if (typeof localStorage !== 'undefined') {
      const k = getKey(userId);
      localStorage.setItem(k, JSON.stringify(items));
      // Mantém chave global sincronizada como backup seguro
      if (userId) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      }
    }
  } catch (err) {
    console.warn('[clinicalHistoryService] Falha ao salvar histórico:', err);
  }
}

function getRevisaoStorage(userId) {
  try {
    if (typeof localStorage === 'undefined') return [];
    const k = getRevisaoKey(userId);
    let raw = localStorage.getItem(k);
    if (!raw && userId) {
      raw = localStorage.getItem(REVISAO_STORAGE_KEY);
      if (raw) {
        localStorage.setItem(k, raw);
      }
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setRevisaoStorage(items, userId) {
  try {
    if (typeof localStorage !== 'undefined') {
      const k = getRevisaoKey(userId);
      localStorage.setItem(k, JSON.stringify(items));
    }
  } catch {
    // Fallback silencioso
  }
}

export const clinicalHistoryService = {
  /**
   * Retorna a atividade em andamento mais recente de um usuário específico.
   * Usado pelo card "Continuar de onde parou" no StudentDashboard e EnfereVivoTrail.
   */
  getLatestInProgressActivity(userId = null) {
    const list = getStorage(userId);
    const inProgress = list
      .filter((it) => it.status === 'em_andamento')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return inProgress.length > 0 ? inProgress[0] : null;
  },

  /**
   * Salva ou atualiza um rascunho de atividade em andamento.
   */
  saveDraft({ id, moduleType, title, patientInfo, progress = 0, durationSeconds = 0, formData = {}, step = 0, userId = null }) {
    const list = getStorage(userId);
    const now = new Date().toISOString();
    const existingIndex = id ? list.findIndex((it) => it.id === id) : -1;

    const activityItem = {
      id: id || `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      moduleType,
      moduleLabel: MODULE_LABELS[moduleType] || moduleType,
      title: title || 'Caso Clínico em Andamento',
      patientInfo: patientInfo || 'Paciente Não Identificado',
      progressPercentage: Math.min(Math.max(progress, 0), 99),
      status: 'em_andamento',
      durationSeconds: Math.max(0, Math.round(durationSeconds)),
      startedAt: existingIndex >= 0 ? list[existingIndex].startedAt : now,
      updatedAt: now,
      step,
      formData,
      score: null,
      evaluation: null,
      userId: userId || null
    };

    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...activityItem };
    } else {
      list.unshift(activityItem);
    }

    setStorage(list, userId);
    return activityItem;
  },

  /**
   * Submete e finaliza formalmente uma atividade clínica com 100% de conclusão.
   */
  submitActivity({ id, moduleType, title, patientInfo, durationSeconds = 0, score = 100, evaluation = null, formData = {}, userId = null }) {
    const list = getStorage(userId);
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
      userId: userId || null
    };

    if (existingIndex >= 0) {
      list[existingIndex] = completedItem;
    } else {
      list.unshift(completedItem);
    }

    setStorage(list, userId);
    return completedItem;
  },

  /**
   * Atualiza campos de uma atividade existente (usado no SbarHandoffLab).
   */
  updateActivity(id, updates = {}, userId = null) {
    if (!id) return null;
    const list = getStorage(userId);
    const existingIndex = list.findIndex((it) => it.id === id);
    if (existingIndex < 0) return null;
    const now = new Date().toISOString();
    const updated = {
      ...list[existingIndex],
      ...updates,
      updatedAt: now
    };
    list[existingIndex] = updated;
    setStorage(list, userId);
    return updated;
  },

  /**
   * Salva uma sessão concluída de Videochamada no histórico unificado.
   */
  saveVideochamadaSession(sessionData, userId = null) {
    const list = getStorage(userId);
    const now = new Date().toISOString();

    const id = `act_vid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const novoItem = {
      id,
      moduleType: MODULE_TYPES.VIDEOCHAMADA,
      moduleLabel: MODULE_LABELS.videochamada,
      title: `Atendimento Clínico — ${sessionData.pacienteNome || 'Paciente Simulado'}`,
      patientInfo: `${sessionData.pacienteNome || 'Paciente'} · ${sessionData.modalidade || 'Normal'} (${sessionData.totalQuestoes} questões)`,
      progressPercentage: 100,
      status: 'concluido',
      durationSeconds: Math.max(0, Math.round(sessionData.tempoSegundos || 0)),
      startedAt: sessionData.startedAt || now,
      finishedAt: now,
      updatedAt: now,
      score: sessionData.precisao ?? Math.round((sessionData.acertos / (sessionData.totalQuestoes || 1)) * 100),
      evaluation: `Acertos: ${sessionData.acertos} | 1º Erro: ${sessionData.amarelas || 0} | 2º Erro/Revisão: ${sessionData.vermelhas || 0}`,
      dataDisplay: new Date().toLocaleDateString('pt-BR'),
      horaDisplay: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      details: {
        pacienteId: sessionData.pacienteId,
        pacienteNome: sessionData.pacienteNome,
        modalidade: sessionData.modalidade,
        totalQuestoes: sessionData.totalQuestoes,
        acertos: sessionData.acertos,
        amarelas: sessionData.amarelas || 0,
        vermelhas: sessionData.vermelhas || 0,
        questoes: sessionData.questoes || []
      },
      userId: userId || null
    };

    list.unshift(novoItem);
    setStorage(list, userId);

    // Também atualiza o banco de questões de revisão pendentes (Amarelas e Vermelhas)
    if (Array.isArray(sessionData.questoes)) {
      const erradas = sessionData.questoes.filter((q) => q.status === 'amarela' || q.status === 'vermelha');
      if (erradas.length > 0) {
        const revisaoList = getRevisaoStorage(userId);
        const mapExistentes = new Map(revisaoList.map((q) => [q.pergunta || q.id, q]));
        erradas.forEach((q) => {
          mapExistentes.set(q.pergunta || q.id, {
            ...q,
            dataErro: now
          });
        });
        setRevisaoStorage(Array.from(mapExistentes.values()), userId);
      }
    }

    return novoItem;
  },

  /**
   * Retorna a lista de questões pendentes de revisão (amarelas e vermelhas).
   */
  getQuestoesRevisao(userId = null) {
    return getRevisaoStorage(userId);
  },

  /**
   * Remove questões de revisão após o aluno refazê-las com acerto.
   */
  removerQuestoesRevisao(questoesAcertadas = [], userId = null) {
    const list = getRevisaoStorage(userId);
    const perguntasRemover = new Set(questoesAcertadas.map((q) => q.pergunta || q.id));
    const filtradas = list.filter((q) => !perguntasRemover.has(q.pergunta || q.id));
    setRevisaoStorage(filtradas, userId);
  },

  /**
   * Retorna todas as atividades ordenadas por data decrescente com filtros.
   */
  getAllActivities(moduleFilter = 'all', userId = null) {
    const list = getStorage(userId);
    if (moduleFilter && moduleFilter !== 'all') {
      return list.filter((item) => item.moduleType === moduleFilter);
    }
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  /**
   * Exclui todo o histórico de atividades (dupla verificação realizada na UI).
   */
  limparTodoHistorico(userId = null) {
    try {
      if (typeof localStorage !== 'undefined') {
        const k = getKey(userId);
        localStorage.removeItem(k);
        const rk = getRevisaoKey(userId);
        localStorage.removeItem(rk);
        // Também limpa chave legada se existir
        localStorage.removeItem('enfermeiro_historico_videochamadas');
      }
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Busca uma atividade específica pelo identificador.
   */
  getActivityById(id, userId = null) {
    if (!id) return null;
    const list = getStorage(userId);
    return list.find((it) => it.id === id) || null;
  },

  /**
   * Remove uma atividade específica do histórico.
   */
  deleteActivity(id, userId = null) {
    if (!id) return false;
    const list = getStorage(userId);
    const filtered = list.filter((it) => it.id !== id);
    setStorage(filtered, userId);
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
  getSummaryStats(userId = null) {
    const list = getStorage(userId);
    const completed = list.filter((it) => it.status === 'concluido');
    const inProgress = list.filter((it) => it.status === 'em_andamento');
    const totalDurationSeconds = list.reduce((acc, it) => acc + (it.durationSeconds || 0), 0);
    const avgScore = completed.length > 0
      ? Math.round(completed.reduce((acc, it) => acc + (it.score || 0), 0) / completed.length)
      : 0;

    let totalAcertos = 0;
    let totalAmarelas = 0;
    let totalVermelhas = 0;

    completed.forEach((it) => {
      if (it.details) {
        totalAcertos += it.details.acertos || 0;
        totalAmarelas += it.details.amarelas || 0;
        totalVermelhas += it.details.vermelhas || 0;
      }
    });

    return {
      total: list.length,
      completedCount: completed.length,
      inProgressCount: inProgress.length,
      totalDurationSeconds,
      avgScore,
      totalAcertos,
      totalAmarelas,
      totalVermelhas
    };
  }
};

export default clinicalHistoryService;
