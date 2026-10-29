/**
 * clinicalGamificationService.js
 * Motor de Gamificação Pedagógica & Infraestrutura Multiplayer do Enfere.
 * Mecânicas de motivação diária e interação social colaborativa,
 * com identidade e rigor clínico autênticos de Enfermagem (COFEN nº 736/2024).
 */

const STORAGE_KEY = 'enfermeiro_digital_gamification_state';

// Patentes e Níveis Clínicos Nightingale
export const NIGHTINGALE_LEVELS = [
  {
    level: 1,
    title: 'Recruta de Enfermagem',
    minXp: 0,
    maxXp: 250,
    badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    description: 'Iniciando a jornada em semiotécnica e cuidados fundamentais à beira-leito.',
  },
  {
    level: 2,
    title: 'Praticante de Semiotécnica',
    minXp: 251,
    maxXp: 600,
    badgeColor: 'text-teal-700 bg-teal-50 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
    description: 'Aferição de sinais vitais, aplicação de escalas e preparo seguro de soluções.',
  },
  {
    level: 3,
    title: 'Interno de Clínica Médica',
    minXp: 601,
    maxXp: 1200,
    badgeColor: 'text-cyan-700 bg-cyan-50 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800',
    description: 'Formulação diagnóstica NANDA-I assertiva e priorização em enfermarias.',
  },
  {
    level: 4,
    title: 'Residente de Terapia Intensiva',
    minXp: 1201,
    maxXp: 2200,
    badgeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    description: 'Manejo de pacientes críticos, vigilância de drogas vasoativas e passagem SBAR.',
  },
  {
    level: 5,
    title: 'Especialista Nightingale',
    minXp: 2201,
    maxXp: 99999,
    badgeColor: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    description: 'Liderança de equipe, excelência no Processo de Enfermagem e julgamento clínico pleno.',
  },
];

// Modelo de Conquistas (Badges) Clínicos com Níveis Progressivos
export const INITIAL_ACHIEVEMENTS = [
  {
    id: 'safe_dosage',
    title: 'Guardião da Dose Certa',
    description: 'Acerte cálculos de dosagem e gotejamento sem risco de iatrogenia.',
    icon: 'Pill',
    target: 20,
    unit: 'cálculos',
    tiers: [
      { level: 1, target: 5, label: 'Bronze' },
      { level: 2, target: 15, label: 'Prata' },
      { level: 3, target: 30, label: 'Ouro' },
    ],
  },
  {
    id: 'nanda_master',
    title: 'Olho Clínico Nightingale',
    description: 'Formule diagnósticos NANDA-I corretos com fatores relacionados fundamentados.',
    icon: 'Stethoscope',
    target: 15,
    unit: 'diagnósticos',
    tiers: [
      { level: 1, target: 5, label: 'Bronze' },
      { level: 2, target: 15, label: 'Prata' },
      { level: 3, target: 35, label: 'Ouro' },
    ],
  },
  {
    id: 'streak_titan',
    title: 'Plantonista de Ferro',
    description: 'Mantenha sua ofensiva de raciocínio clínico viva por dias seguidos.',
    icon: 'Flame',
    target: 7,
    unit: 'dias seguidos',
    tiers: [
      { level: 1, target: 3, label: 'Bronze' },
      { level: 2, target: 7, label: 'Prata' },
      { level: 3, target: 30, label: 'Ouro' },
    ],
  },
  {
    id: 'sbar_clarity',
    title: 'Comunicação Sem Ruído',
    description: 'Complete passagens de plantão no protocolo estruturado SBAR à beira-leito.',
    icon: 'Radio',
    target: 10,
    unit: 'plantões SBAR',
    tiers: [
      { level: 1, target: 2, label: 'Bronze' },
      { level: 2, target: 6, label: 'Prata' },
      { level: 3, target: 15, label: 'Ouro' },
    ],
  },
  {
    id: 'team_spirit',
    title: 'Cultura de Equipe',
    description: 'Envie incentivos e apoie seus colegas de turma no mural de plantão.',
    icon: 'Users',
    target: 10,
    unit: 'incentivos',
    tiers: [
      { level: 1, target: 2, label: 'Bronze' },
      { level: 2, target: 5, label: 'Prata' },
      { level: 3, target: 12, label: 'Ouro' },
    ],
  },
];

// Colegas de Plantão Iniciais (Mock Realista para Multiplayer Imediato)
export const INITIAL_COLLEAGUES = [
  {
    id: 'colleague-1',
    name: 'Mariana Duarte',
    role: 'Aluna do 7º Período',
    level: 3,
    levelTitle: 'Interno de Clínica Médica',
    streak: 6,
    xp: 890,
    isOnline: true,
    following: true,
    avatar: 'https://images.unsplash.com/photo-1594824813583-0952939d8928?auto=format&fit=crop&q=80&w=150',
    initials: 'MD',
  },
  {
    id: 'colleague-2',
    name: 'Carlos Eduardo Silveira',
    role: 'Aluno do 5º Período',
    level: 2,
    levelTitle: 'Praticante de Semiotécnica',
    streak: 4,
    xp: 520,
    isOnline: true,
    following: true,
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150',
    initials: 'CS',
  },
  {
    id: 'colleague-3',
    name: 'Dra. Camila Nogueira',
    role: 'Docente Especialista UTI',
    level: 5,
    levelTitle: 'Especialista Nightingale',
    streak: 19,
    xp: 2840,
    isOnline: false,
    following: true,
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150',
    initials: 'CN',
  },
  {
    id: 'colleague-4',
    name: 'Beatriz Vasconcelos',
    role: 'Aluna do 6º Período',
    level: 3,
    levelTitle: 'Interno de Clínica Médica',
    streak: 7,
    xp: 940,
    isOnline: false,
    following: false,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
    initials: 'BV',
  },
];

// Feed Inicial de Atividades da Equipe
export const INITIAL_FEED_EVENTS = [
  {
    id: 'feed-1',
    colleagueId: 'colleague-1',
    colleagueName: 'Mariana Duarte',
    action: 'resolveu um caso de Sepse de Foco Urinário',
    detail: 'Acertou 100% das condutas dos primeiros 5 minutos!',
    timeAgo: 'há 15 minutos',
    reactions: { highFive: 3, energy: 5, trophy: 2 },
    myReaction: null,
  },
  {
    id: 'feed-2',
    colleagueId: 'colleague-2',
    colleagueName: 'Carlos Eduardo Silveira',
    action: 'alcançou 4 dias seguidos de ofensiva',
    detail: 'Praticou cálculo de microgotas sem erro de infusão.',
    timeAgo: 'há 1 hora',
    reactions: { highFive: 4, energy: 2, trophy: 1 },
    myReaction: null,
  },
  {
    id: 'feed-3',
    colleagueId: 'colleague-3',
    colleagueName: 'Dra. Camila Nogueira',
    action: 'subiu para a Liga Diamante Nightingale',
    detail: 'Acumulou 650 XP nesta rodada semanal!',
    timeAgo: 'há 3 horas',
    reactions: { highFive: 8, energy: 7, trophy: 6 },
    myReaction: 'trophy',
  },
];

// Mock da Liga Semanal (Ranking da Turma)
export const INITIAL_LEADERBOARD = [
  { rank: 1, name: 'Dra. Camila Nogueira', xp: 2840, isMe: false, streak: 19, avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150', tag: 'Top 1' },
  { rank: 2, name: 'Beatriz Vasconcelos', xp: 940, isMe: false, streak: 7, avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150', tag: 'Zona de Subida' },
  { rank: 3, name: 'Mariana Duarte', xp: 890, isMe: false, streak: 6, avatar: 'https://images.unsplash.com/photo-1594824813583-0952939d8928?auto=format&fit=crop&q=80&w=150', tag: 'Zona de Subida' },
  { rank: 4, name: 'Você', xp: 480, isMe: true, streak: 3, avatar: null, tag: 'Zona Segura' },
  { rank: 5, name: 'Carlos Eduardo Silveira', xp: 520, isMe: false, streak: 4, avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150', tag: 'Zona Segura' },
  { rank: 6, name: 'Lucas Albuquerque', xp: 390, isMe: false, streak: 2, avatar: null, tag: 'Zona Segura' },
  { rank: 7, name: 'Fernanda Meirelles', xp: 260, isMe: false, streak: 1, avatar: null, tag: 'Zona Neutra' },
  { rank: 8, name: 'Rodrigo Paiva', xp: 190, isMe: false, streak: 0, avatar: null, tag: 'Risco de Queda' },
];

function getTodayString() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function getDayOfWeekShort(date) {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return days[date.getDay()];
}

function getPast7Days() {
  const result = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    result.push({
      date: dateStr,
      dayShort: getDayOfWeekShort(d),
      isToday: i === 0,
      completed: i === 0 || i === 1 || i === 2, // mock realista com os últimos dias concluídos
      xp: i === 0 ? 90 : i === 1 ? 120 : i === 2 ? 80 : 0,
    });
  }
  return result;
}

// Catálogo de Utilidades Pedagógicas para Pontos de Estudo (PE)
export const STUDY_POINTS_STORE_ITEMS = [
  {
    id: 'goti_hint',
    title: 'Dica Clínica do Goti IA',
    cost: 15,
    icon: 'Lightbulb',
    category: 'Suporte Clínico',
    description: 'Desbloqueia pista analítica fundamentada no COFEN/NANDA para resolver cálculos ou casos difíceis.',
    benefit: 'Dica avançada liberada no próximo desafio.',
  },
  {
    id: 'rare_simulation',
    title: 'Simulação Rara de Alta Complexidade',
    cost: 40,
    icon: 'Flame',
    category: 'Desafio Avançado',
    description: 'Acesso prioritário a cenários graves (Choque Séptico Refratário, PCR em Gestante, EAP Hipertensivo).',
    benefit: 'Desbloqueia caso especial no simulador.',
  },
  {
    id: 'streak_freeze',
    title: 'Seguro de Plantão (Congelar Ofensiva)',
    cost: 30,
    icon: 'Shield',
    category: 'Rotina de Estudos',
    description: 'Protege seus dias consecutivos de estudo caso sua escala hospitalar fique sobrecarregada.',
    benefit: '+1 Congelamento de Plantão em sua conta.',
  },
  {
    id: 'ai_deep_audit',
    title: 'Auditoria de Conduta com Goti IA',
    cost: 20,
    icon: 'Sparkles',
    category: 'Debriefing IA',
    description: 'Relatório aprofundado com análise de raciocínio diagnóstico e recomendações de estudo da IA.',
    benefit: 'Debriefing minucioso no SBAR ou caso clínico.',
  },
  {
    id: 'skill_badge_seal',
    title: 'Emissão de Laudo de Proficiência',
    cost: 75,
    icon: 'Award',
    category: 'Certificação',
    description: 'Gera laudo formativo com chancela do Goti IA e memorial descritivo em PDF.',
    benefit: 'Exportação de atestado de competência simulada.',
  },
];

function getStorageKey(userId) {
  if (!userId) return STORAGE_KEY;
  const cleanId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${STORAGE_KEY}_${cleanId}`;
}

function isDemoUser(userId) {
  if (!userId) return false;
  return String(userId).startsWith('aluno-demo') || String(userId).startsWith('prof-demo');
}

function getDefaultState(userId = null) {
  const isDemo = isDemoUser(userId);
  if (isDemo) {
    return {
      streak: 3,
      bestStreak: 12,
      streakFreezeAvailable: 1,
      acertosSeguidos: 0,
      melhorAcertosSeguidos: 0,
      lastActiveDate: getTodayString(),
      weeklyDays: getPast7Days(),
      totalXp: 480, // Mantido para compatibilidade
      studyPoints: 480, // Pontos de Estudo (PE)
      spentStudyPoints: 0,
      unlockedItems: ['goti_hint'],
      solvedCases: 7,
      accuracyRate: 88, // %
      safeDosagesCount: 14,
      sbarHandoffsCount: 4,
      encouragementsSent: 3,
      encouragementsReceived: 6,
      achievements: INITIAL_ACHIEVEMENTS.map((a) => ({
        ...a,
        current: a.id === 'safe_dosage' ? 14 : a.id === 'nanda_master' ? 11 : a.id === 'streak_titan' ? 3 : a.id === 'sbar_clarity' ? 4 : 3,
        completedLevel: a.id === 'safe_dosage' ? 1 : a.id === 'nanda_master' ? 1 : a.id === 'streak_titan' ? 1 : a.id === 'sbar_clarity' ? 1 : 1,
      })),
      colleagues: INITIAL_COLLEAGUES,
      feedEvents: INITIAL_FEED_EVENTS,
      weeklyLeaderboard: INITIAL_LEADERBOARD,
      friendQuest: {
        id: 'quest-weekly-1',
        title: 'Mãos Dadas no Plantão',
        description: 'Resolvam juntos 8 casos clínicos simulados nesta semana.',
        partnerName: 'Mariana Duarte',
        partnerAvatar: 'https://images.unsplash.com/photo-1594824813583-0952939d8928?auto=format&fit=crop&q=80&w=150',
        current: 5,
        target: 8,
        rewardXp: 150,
        rewardBadge: 'Sinergia Clínica',
        expiresInDays: 3,
      },
    };
  }

  // Conta Individual Real: inicia limpa e autêntica
  return {
    streak: 0,
    bestStreak: 0,
    streakFreezeAvailable: 1,
    acertosSeguidos: 0,
    melhorAcertosSeguidos: 0,
    lastActiveDate: getTodayString(),
    weeklyDays: getPast7Days(),
    totalXp: 0,
    studyPoints: 0,
    spentStudyPoints: 0,
    unlockedItems: [],
    solvedCases: 0,
    accuracyRate: 100, // Inicia em 100% até a 1ª atividade
    safeDosagesCount: 0,
    sbarHandoffsCount: 0,
    encouragementsSent: 0,
    encouragementsReceived: 0,
    achievements: INITIAL_ACHIEVEMENTS.map((a) => ({
      ...a,
      current: 0,
      completedLevel: 0,
    })),
    colleagues: INITIAL_COLLEAGUES,
    feedEvents: [],
    weeklyLeaderboard: INITIAL_LEADERBOARD,
    friendQuest: null,
  };
}

export const clinicalGamificationService = {
  /**
   * Obtém todo o estado gamificado consolidado (mesclando storage local com dados reais se houver).
   */
  getState(userId = null) {
    const def = getDefaultState(userId);
    try {
      const key = getStorageKey(userId);
      let raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...def,
          ...parsed,
          achievements: def.achievements.map((defAch) => {
            const saved = (parsed.achievements || []).find((a) => a.id === defAch.id);
            return saved ? { ...defAch, ...saved, tiers: defAch.tiers } : defAch;
          }),
        };
      }
    } catch (e) {
      console.warn('Erro ao carregar estado de gamificação:', e);
    }
    this.saveState(def, userId);
    return def;
  },

  /**
   * Salva o estado gamificado no storage local.
   */

  /**
   * Incrementa a sequência ininterrupta de acertos da conta (+1).
   */
  registrarAcertoQuestao(userId = null) {
    const state = this.getState(userId);
    const atual = (state.acertosSeguidos || 0) + 1;
    const melhor = Math.max(state.melhorAcertosSeguidos || 0, atual);
    state.acertosSeguidos = atual;
    state.melhorAcertosSeguidos = melhor;
    this.saveState(state, userId);
    return state;
  },

  /**
   * Zera a sequência de acertos exclusivamente no erro vermelho (2º erro/revisão).
   */
  registrarErroVermelhoQuestao(userId = null) {
    const state = this.getState(userId);
    state.acertosSeguidos = 0;
    this.saveState(state, userId);
    return state;
  },

  saveState(state, userId = null) {
    try {
      const key = getStorageKey(userId);
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.warn('Erro ao salvar estado de gamificação:', e);
    }
  },

  /**
   * Retorna o nível Nightingale atual com base no XP acumulado.
   */
  getLevelInfo(xp) {
    const safeXp = Number(xp) || 0;
    const current =
      NIGHTINGALE_LEVELS.slice().reverse().find((lvl) => safeXp >= lvl.minXp) ||
      NIGHTINGALE_LEVELS[0];

    const next = NIGHTINGALE_LEVELS.find((lvl) => lvl.level === current.level + 1);

    let progressPercent = 100;
    let xpToNext = 0;

    if (next) {
      const range = next.minXp - current.minXp;
      const progress = safeXp - current.minXp;
      progressPercent = Math.min(100, Math.max(0, Math.round((progress / range) * 100)));
      xpToNext = next.minXp - safeXp;
    }

    return {
      current,
      next,
      progressPercent,
      xpToNext,
    };
  },

  /**
   * Registra uma atividade clínica realizada pelo usuário (adiciona XP, atualiza streak e checa conquistas).
   * @param {string} type - 'case_solved' | 'dosage_safe' | 'sbar_completed' | 'systems_assessment' | 'send_support'
   * @param {number} customXp - XP customizado opcional
   */
  recordActivity(type, customXp = null) {
    const state = this.getState();
    const today = getTodayString();

    let earnedXp = customXp || 20;

    if (type === 'case_solved') {
      earnedXp = customXp || 50;
      state.solvedCases = (state.solvedCases || 0) + 1;
    } else if (type === 'dosage_safe') {
      earnedXp = customXp || 25;
      state.safeDosagesCount = (state.safeDosagesCount || 0) + 1;
    } else if (type === 'sbar_completed') {
      earnedXp = customXp || 35;
      state.sbarHandoffsCount = (state.sbarHandoffsCount || 0) + 1;
    } else if (type === 'send_support') {
      earnedXp = customXp || 10;
      state.encouragementsSent = (state.encouragementsSent || 0) + 1;
    }

    state.totalXp = (state.totalXp || 0) + earnedXp;
    state.studyPoints = (state.studyPoints ?? state.totalXp ?? 0) + earnedXp;

    // Atualiza streak se for a primeira atividade do dia
    if (state.lastActiveDate !== today) {
      state.streak = (state.streak || 0) + 1;
      if (state.streak > (state.bestStreak || 0)) {
        state.bestStreak = state.streak;
      }
      state.lastActiveDate = today;
    }

    // Atualiza o dia no gráfico semanal
    state.weeklyDays = (state.weeklyDays || getPast7Days()).map((item) => {
      if (item.isToday) {
        return {
          ...item,
          completed: true,
          xp: (item.xp || 0) + earnedXp,
        };
      }
      return item;
    });

    // Se estiver em missão em dupla, avança a meta compartilhada
    if (type === 'case_solved' && state.friendQuest) {
      state.friendQuest.current = Math.min(
        state.friendQuest.target,
        (state.friendQuest.current || 0) + 1
      );
    }

    // Atualiza progresso nas conquistas
    state.achievements = state.achievements.map((ach) => {
      let currentVal = ach.current || 0;
      if (ach.id === 'safe_dosage' && type === 'dosage_safe') currentVal += 1;
      if (ach.id === 'nanda_master' && type === 'case_solved') currentVal += 2;
      if (ach.id === 'streak_titan') currentVal = state.streak;
      if (ach.id === 'sbar_clarity' && type === 'sbar_completed') currentVal += 1;
      if (ach.id === 'team_spirit' && type === 'send_support') currentVal += 1;

      // Determina o tier completado
      let compLevel = 0;
      ach.tiers.forEach((t) => {
        if (currentVal >= t.target) compLevel = t.level;
      });

      return {
        ...ach,
        current: currentVal,
        completedLevel: compLevel,
      };
    });

    // Atualiza a posição do usuário na liga semanal
    state.weeklyLeaderboard = state.weeklyLeaderboard.map((item) => {
      if (item.isMe) {
        return {
          ...item,
          xp: (item.xp || 0) + earnedXp,
          streak: state.streak,
        };
      }
      return item;
    }).sort((a, b) => b.xp - a.xp).map((item, idx) => ({ ...item, rank: idx + 1 }));

    this.saveState(state);
    return {
      state,
      earnedXp,
      earnedPe: earnedXp,
    };
  },

  /**
   * Envia uma reação / incentivo rápido em 1 clique para um colega no feed de atividades.
   */
  reactToFeedEvent(eventId, reactionType = 'highFive') {
    const state = this.getState();
    let reacted = false;

    state.feedEvents = state.feedEvents.map((evt) => {
      if (evt.id === eventId) {
        const reactions = { ...(evt.reactions || { highFive: 0, energy: 0, trophy: 0 }) };
        if (evt.myReaction === reactionType) {
          // Desfaz a reação
          reactions[reactionType] = Math.max(0, (reactions[reactionType] || 1) - 1);
          evt.myReaction = null;
        } else {
          // Aplica nova reação
          if (evt.myReaction && reactions[evt.myReaction] > 0) {
            reactions[evt.myReaction] -= 1;
          }
          reactions[reactionType] = (reactions[reactionType] || 0) + 1;
          evt.myReaction = reactionType;
          reacted = true;
        }
        return { ...evt, reactions };
      }
      return evt;
    });

    if (reacted) {
      state.encouragementsSent = (state.encouragementsSent || 0) + 1;
      state.totalXp = (state.totalXp || 0) + 10;
      state.studyPoints = (state.studyPoints ?? state.totalXp ?? 0) + 10;
    }

    this.saveState(state);
    return state;
  },

  /**
   * Alterna o status de seguir/conectar com um colega de plantão.
   */
  toggleFollowColleague(colleagueId) {
    const state = this.getState();
    state.colleagues = state.colleagues.map((c) => {
      if (c.id === colleagueId) {
        return { ...c, following: !c.following };
      }
      return c;
    });
    this.saveState(state);
    return state;
  },

  /**
   * Ativa o "Congelamento de Plantão" para proteger o streak em um dia de escala pesada.
   */
  useStreakFreeze() {
    const state = this.getState();
    if ((state.streakFreezeAvailable || 0) > 0) {
      state.streakFreezeAvailable -= 1;
      this.saveState(state);
      return { success: true, remaining: state.streakFreezeAvailable };
    }
    return { success: false, reason: 'Sem congelamentos disponíveis no momento.' };
  },

  /**
   * Retorna o saldo atual de Pontos de Estudo (PE).
   */
  getStudyPoints() {
    const state = this.getState();
    return state.studyPoints ?? state.totalXp ?? 0;
  },

  /**
   * Gasta Pontos de Estudo (PE) em uma funcionalidade pedagógica ou benefício.
   * @param {number} cost - Custo em PE
   * @param {string} itemId - Identificador do item (ex: 'goti_hint', 'rare_simulation', 'streak_freeze')
   */
  spendStudyPoints(cost, itemId) {
    const state = this.getState();
    const currentPe = state.studyPoints ?? state.totalXp ?? 0;

    if (currentPe < cost) {
      return {
        success: false,
        reason: `Saldo insuficiente de Pontos de Estudo. Você tem ${currentPe} PE e necessita de ${cost} PE. Complete casos clínicos para ganhar mais PE!`,
        currentPe,
      };
    }

    // Debita o saldo de PE
    state.studyPoints = currentPe - cost;
    state.spentStudyPoints = (state.spentStudyPoints || 0) + cost;

    // Se for streak_freeze, adiciona 1 congelamento
    if (itemId === 'streak_freeze') {
      state.streakFreezeAvailable = (state.streakFreezeAvailable || 0) + 1;
    }

    // Registra item desbloqueado se já não tiver
    if (!state.unlockedItems) state.unlockedItems = [];
    if (!state.unlockedItems.includes(itemId)) {
      state.unlockedItems.push(itemId);
    }

    this.saveState(state);
    return {
      success: true,
      remainingPe: state.studyPoints,
      itemId,
      streakFreezeAvailable: state.streakFreezeAvailable,
    };
  },
};
