// Motor de cálculo de risco clínico (frontend) - soma escores nativamente e deriva criticidade global.

export function computeBradenTotal(scores = {}) {
  const { perception = 0, moisture = 0, activity = 0, mobility = 0, nutrition = 0, friction = 0 } = scores;
  return Number(perception) + Number(moisture) + Number(activity) + Number(mobility) + Number(nutrition) + Number(friction);
}

export function computeCamPositive(items = {}) {
  const { acute = false, inattention = false, disorganized = false, altered_loc = false } = items;
  return Boolean(acute && inattention && (disorganized || altered_loc));
}

export function computeAuditTotal(items = {}) {
  let t = 0;
  for (let i = 1; i <= 10; i++) t += Number(items["audit_" + i] || 0);
  return t;
}

// Fórmula oficial da Escala SAK (Severo-Almeida-Kuchenbecker):
// Desorientado/confuso×5 + Micções frequentes×5 + Limitação para deambular×4 +
// Ausência de acompanhante×0,5 + Pós-operatório×0,5 + Nº medicamentos administrados(até 24h)×1 + Queda prévia×1
export function computeSakTotal(items = {}) {
  const meds = Number(items.sak_meds) || 0;
  return (
    (items.sak_disorientation ? 5 : 0) +
    (items.sak_urination ? 5 : 0) +
    (items.sak_walking ? 4 : 0) +
    (items.sak_caregiver ? 0.5 : 0) +
    (items.sak_postop ? 0.5 : 0) +
    meds * 1 +
    (items.sak_previous_falls ? 1 : 0)
  );
}

export const computeSakScore = computeSakTotal;

// CALOI = escala de dor. O escore é a intensidade da dor (0-10).
export function computeCaloiTotal(items = {}) {
  return Number(items.caloi_pain_intensity) || 0;
}

export function classifyVital(name, value) {
  if (value === undefined || value === null || Number.isNaN(value)) return "estavel";
  const v = Number(value);
  const rules = {
    pa_sistolica: v => v < 90 || v > 180 ? "critico" : v < 110 || v > 140 ? "alerta" : "estavel",
    pa_diastolica: v => v < 50 || v > 120 ? "critico" : v < 60 || v > 90 ? "alerta" : "estavel",
    fc: v => v < 40 || v > 130 ? "critico" : v < 50 || v > 110 ? "alerta" : "estavel",
    fr: v => v < 8 || v > 30 ? "critico" : v < 12 || v > 20 ? "alerta" : "estavel",
    tax: v => v < 35 || v > 39.5 ? "critico" : v < 36 || v > 38.5 ? "alerta" : "estavel",
    sat: v => v < 85 ? "critico" : v < 92 ? "alerta" : "estavel"
  };
  const r = rules[name];
  if (!r) return "estavel";
  return r(v);
}

// Classificação oficial BRADEN: ≤9 muito alto, 10-12 alto, 13-14 moderado, 15-18 brando, >18 sem risco.
function classifyBraden(total) {
  if (!total) return "estavel";
  if (total <= 12) return "critico";
  if (total <= 18) return "alerta";
  return "estavel";
}
function classifyAudit(total) {
  if (total == null) return "estavel";
  if (total >= 20) return "critico";
  if (total >= 8) return "alerta";
  return "estavel";
}
// Classes de risco oficiais da SAK: baixo ≤6, moderado 6,5-10, alto ≥10,5.
function classifySak(total) {
  if (total == null) return "estavel";
  if (total >= 10.5) return "critico";
  if (total >= 6.5) return "alerta";
  return "estavel";
}
// Classificação da dor CALOI: 0 sem dor, 1-3 leve, 4-6 moderada, 7-10 severa.
function classifyCaloi(total) {
  if (total == null) return "estavel";
  if (total >= 7) return "critico";
  if (total >= 4) return "alerta";
  return "estavel";
}

const RANK = { estavel: 0, alerta: 1, critico: 2 };

export function computeGlobalRisk(assessment = {}) {
  const statuses = [];
  ["pa_sistolica", "pa_diastolica", "fc", "fr", "tax", "sat"].forEach(k => statuses.push(classifyVital(k, assessment[k])));
  statuses.push(classifyBraden(assessment.braden_total));
  if (assessment.cam_positive) statuses.push("alerta");
  statuses.push(classifyAudit(assessment.audit_total));
  statuses.push(classifySak(assessment.sak_score));
  statuses.push(classifyCaloi(assessment.caloi_score));
  return statuses.reduce((acc, s) => (RANK[s] > RANK[acc] ? s : acc), "estavel");
}

export function computeAllScores(data = {}) {
  const braden_total = computeBradenTotal({
    perception: data.braden_perception,
    moisture: data.braden_moisture,
    activity: data.braden_activity,
    mobility: data.braden_mobility,
    nutrition: data.braden_nutrition,
    friction: data.braden_friction,
  });
  const cam_positive = computeCamPositive({
    acute: data.cam_acute,
    inattention: data.cam_inattention,
    disorganized: data.cam_disorganized,
    altered_loc: data.cam_altered_loc,
  });
  const audit_total = computeAuditTotal(data);
  const sak_score = computeSakTotal(data);
  const caloi_score = computeCaloiTotal(data);
  const risk_status = computeGlobalRisk({ ...data, braden_total, cam_positive, audit_total, sak_score, caloi_score });
  return { braden_total, cam_positive, audit_total, sak_score, caloi_score, risk_status };
}

export function classifyBradenLabel(total) {
  if (total === null || total === undefined) return "Não avaliado";
  const n = Number(total);
  if (n <= 9) return "Risco muito alto";
  if (n <= 12) return "Alto risco";
  if (n <= 14) return "Risco moderado";
  if (n <= 18) return "Risco brando";
  return "Sem risco";
}

export const RISK_META = {
  estavel: {
    label: "Estável",
    title: "Paciente estável",
    description: "Parâmetros dentro da faixa esperada e escalas assistenciais compensadas.",
    color: "emerald",
    dot: "bg-[#20D5B5]",
    text: "text-[#20D5B5]",
    bg: "bg-[#20D5B5]/10",
    surface: "bg-[#20D5B5]/10",
    border: "border-[#20D5B5]/30",
  },
  alerta: {
    label: "Alerta",
    title: "Atenção clínica necessária",
    description: "Parâmetro vital alterado ou pontuação moderada de risco assistencial.",
    color: "amber",
    dot: "bg-[#FFC247]",
    text: "text-[#FFC247]",
    bg: "bg-[#FFC247]/10",
    surface: "bg-[#FFC247]/10",
    border: "border-[#FFC247]/30",
  },
  critico: {
    label: "Crítico",
    title: "Condição crítica",
    description: "Descompensação hemodinâmica, delírium positivo ou alto risco iminente.",
    color: "red",
    dot: "bg-[#FF6B6B]",
    text: "text-[#FF6B6B]",
    bg: "bg-[#FF6B6B]/10",
    surface: "bg-[#FF6B6B]/10",
    border: "border-[#FF6B6B]/30",
  },
};
