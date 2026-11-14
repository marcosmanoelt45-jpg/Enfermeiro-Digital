// Mescla o progresso do aparelho com o da conta (Supabase), sem perder nada dos dois lados. Puro, testável.
// Usado ao entrar (baixa da conta, junta com o que o aparelho tem, grava nos dois) e ao subir mudanças.
//
// Regras:
// - Dias: a união dos dias estudados/ativos/congelados; o PE de cada dia é o MAIOR dos dois (o mesmo dia
//   estudado em dois aparelhos não soma duas vezes o mesmo PE, mas também não perde o de nenhum).
// - Totais acumulados (PE total, gasto, casos): o maior dos dois.
// - Recordes (melhor ofensiva, melhor sequência): o maior.
// - O resto (sequência de acertos atual, congelamentos disponíveis, preferências): o lado salvo por último.
// - Histórico de atividades: união por id; se as duas versões existem, fica a atualizada por último.

const uniao = (a = [], b = []) => [...new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])])];
const maior = (a, b) => Math.max(Number(a) || 0, Number(b) || 0);
const quando = (x) => {
  const t = Date.parse(x?.atualizadoEm ?? x?.updatedAt ?? x?.finishedAt ?? "");
  return Number.isFinite(t) ? t : 0;
};

export function mesclarGamificacao(local, remoto) {
  if (!remoto || typeof remoto !== "object") return local ?? null;
  if (!local || typeof local !== "object") return remoto;
  const novo = quando(remoto) > quando(local) ? remoto : local;
  const mapa = { ...(local.dailyXpMap || {}) };
  for (const [dia, pe] of Object.entries(remoto.dailyXpMap || {})) mapa[dia] = maior(mapa[dia], pe);
  const totalXp = maior(local.totalXp, remoto.totalXp);
  const gasto = maior(local.spentStudyPoints, remoto.spentStudyPoints);
  return {
    ...novo,
    dailyXpMap: mapa,
    diasAtivos: uniao(local.diasAtivos, remoto.diasAtivos).sort().slice(-180),
    frozenDates: uniao(local.frozenDates, remoto.frozenDates).sort().slice(-60),
    processedActivityIds: uniao(local.processedActivityIds, remoto.processedActivityIds).slice(-2000),
    unlockedItems: uniao(local.unlockedItems, remoto.unlockedItems),
    totalXp,
    spentStudyPoints: gasto,
    studyPoints: Math.max(0, totalXp - gasto),
    solvedCases: maior(local.solvedCases, remoto.solvedCases),
    bestStreak: maior(local.bestStreak, remoto.bestStreak),
    melhorAcertosSeguidos: maior(local.melhorAcertosSeguidos, remoto.melhorAcertosSeguidos),
    achievements: mesclarConquistas(local.achievements, remoto.achievements),
    atualizadoEm: new Date(Math.max(quando(local), quando(remoto), 0) || Date.now()).toISOString(),
  };
}

function mesclarConquistas(a = [], b = []) {
  if (!Array.isArray(a) || !a.length) return b ?? [];
  if (!Array.isArray(b) || !b.length) return a;
  const porId = new Map(b.map((x) => [x.id, x]));
  return a.map((x) => {
    const y = porId.get(x.id);
    if (!y) return x;
    return { ...x, current: maior(x.current, y.current), completedLevel: maior(x.completedLevel, y.completedLevel) };
  });
}

/** União de listas de itens com `id`; com o mesmo id, fica o atualizado por último. */
export function mesclarPorId(local = [], remoto = []) {
  const m = new Map();
  for (const item of [...(Array.isArray(remoto) ? remoto : []), ...(Array.isArray(local) ? local : [])]) {
    if (!item || item.id == null) continue;
    const atual = m.get(item.id);
    if (!atual || quando(item) >= quando(atual)) m.set(item.id, item);
  }
  return [...m.values()].sort((x, y) => quando(y) - quando(x));
}

/** Pacote completo guardado na conta: { gamificacao, historico, revisao }. */
export function mesclarPacote(local = {}, remoto = {}) {
  return {
    versao: 1,
    gamificacao: mesclarGamificacao(local.gamificacao, remoto.gamificacao),
    historico: mesclarPorId(local.historico, remoto.historico).slice(0, 600),
    revisao: mesclarPorId(local.revisao, remoto.revisao).slice(0, 400),
  };
}

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Semana ISO no formato "2026-W46" (para zerar o PE da semana no pódio). */
export function semanaIso(data = new Date()) {
  const d = new Date(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()));
  const dia = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dia);
  const inicioAno = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const semana = Math.ceil(((d - inicioAno) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(semana).padStart(2, "0")}`;
}

/** PE de cada um dos últimos 28 dias (só os dias com PE), para o calendário do perfil do amigo. */
export function peDosUltimosDias(estado, hoje = new Date()) {
  const mapa = estado?.dailyXpMap || {};
  const limite = iso(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 27));
  const fora = {};
  for (const [d, v] of Object.entries(mapa)) {
    const pe = Math.round(Number(v) || 0);
    if (d >= limite && d <= iso(hoje) && pe > 0) fora[d] = Math.min(pe, 100000);
  }
  return fora;
}

/** Números do perfil público (o que amigos e o pódio veem) a partir do estado de gamificação. */
export function numerosDoPerfil(estado, hoje = new Date()) {
  const mapa = estado?.dailyXpMap || {};
  const dias = new Set([...(estado?.diasAtivos || []), ...Object.keys(mapa).filter((d) => (Number(mapa[d]) || 0) > 0)]);
  // PE da semana: de segunda até hoje
  const segunda = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - (((hoje.getDay() || 7) - 1)));
  let peSemana = 0;
  for (let d = new Date(segunda); d <= hoje; d.setDate(d.getDate() + 1)) peSemana += Number(mapa[iso(d)]) || 0;
  const limite = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 89);
  return {
    ofensiva: Number(estado?.streak) || 0,
    melhor_ofensiva: Number(estado?.bestStreak) || 0,
    pe_total: Number(estado?.studyPoints ?? estado?.totalXp) || 0,
    pe_semana: peSemana,
    semana: semanaIso(hoje),
    dias_estudados: [...dias].filter((d) => d >= iso(limite)).sort().slice(-90),
  };
}
