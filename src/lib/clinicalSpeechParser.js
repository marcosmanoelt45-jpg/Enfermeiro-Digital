// Extrator local de dados clínicos a partir de relato falado em pt-BR.
// Funciona 100% no navegador, sem custo e sem API externa.
// Extrai apenas o que for dito explicitamente; o que não for encontrado é omitido.

function normalize(text = "") {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/(\d)\s*(?:virgula|ponto)\s*(\d)/g, "$1.$2") // "36 virgula 5" -> 36.5
    .replace(/(\d),(\d)/g, "$1.$2") // "36,5" -> 36.5
    .replace(/\s+/g, " ");
}

function num(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : undefined;
}

// Procura o primeiro número após qualquer um dos rótulos informados
function findAfter(text, labels, maxGap = 25) {
  for (const label of labels) {
    const re = new RegExp(`(?:${label})[^0-9]{0,${maxGap}}(\\d{1,3}(?:\\.\\d)?)`);
    const m = text.match(re);
    if (m) return num(m[1]);
  }
  return undefined;
}

function has(text, patterns) {
  return patterns.some((p) => new RegExp(p).test(text));
}

export function parseClinicalSpeech(rawText = "") {
  const t = normalize(rawText);
  const out = {};
  if (!t.trim()) return out;

  // Pressão arterial: "pa 120 por 80", "pressao 120x80", "12 por 8" (abreviação comum)
  const pa = t.match(/(?:\bpa\b|pressao(?: arterial)?)[^0-9]{0,20}(\d{2,3})\s*(?:x|por|\/|sobre)\s*(\d{1,3})/);
  if (pa) {
    let sis = num(pa[1]);
    let dia = num(pa[2]);
    if (sis < 30 && dia < 20) { sis *= 10; dia *= 10; } // "12 por 8" => 120/80
    out.pa_sistolica = sis;
    out.pa_diastolica = dia;
  }

  const fc = findAfter(t, ["\\bfc\\b", "frequencia cardiaca", "batimentos", "pulso"]);
  if (fc !== undefined && fc >= 20 && fc <= 250) out.fc = fc;

  const fr = findAfter(t, ["\\bfr\\b", "frequencia respiratoria", "respiracao", "incursoes"]);
  if (fr !== undefined && fr >= 4 && fr <= 70) out.fr = fr;

  const tax = findAfter(t, ["\\btax\\b", "temperatura", "\\btemp\\b", "febre de"]);
  if (tax !== undefined && tax >= 30 && tax <= 43) out.tax = tax;

  const sat = findAfter(t, ["saturacao", "saturando", "\\bsat\\b", "spo2", "oximetria"]);
  if (sat !== undefined && sat >= 50 && sat <= 100) out.sat = sat;

  // Dor (CALOI): "dor 7", "dor nota 7", "dor intensidade 7 de 10"
  const dor = findAfter(t, ["\\bdor\\b(?: (?:nota|intensidade|grau))?", "escala de dor", "\\beva\\b"], 15);
  if (dor !== undefined && dor >= 0 && dor <= 10) out.caloi_pain_intensity = dor;
  if (has(t, ["sem dor", "nega dor", "nao refere dor"])) out.caloi_pain_intensity = 0;

  // SAK (risco de queda)
  if (has(t, ["desorientad", "confus"])) out.sak_disorientation = true;
  if (has(t, ["orientad[oa]"]) && !has(t, ["desorientad"])) out.sak_disorientation = false;
  if (has(t, ["mic(c)?ao frequente", "miccoes frequentes", "urina com frequencia"])) out.sak_urination = true;
  if (has(t, ["dificuldade (?:para|de) (?:deambular|andar)", "nao deambula", "acamad", "limitacao (?:para|de) deambular"])) out.sak_walking = true;
  if (has(t, ["sem acompanhante", "desacompanhad"])) out.sak_caregiver = true;
  if (has(t, ["pos[- ]?operatorio", "pos[- ]?op\\b"])) out.sak_postop = true;
  if (has(t, ["queda previa", "historico de queda", "ja caiu", "quedas anteriores"])) out.sak_previous_falls = true;
  const meds = findAfter(t, ["medicament(?:o|os) (?:administrad|em uso)?", "medicacoes"], 15);
  if (meds !== undefined && meds <= 30) out.sak_meds = meds;

  // CAM (delirium)
  if (has(t, ["inicio agudo", "alteracao aguda"])) out.cam_acute = true;
  if (has(t, ["desatent", "desatencao"])) out.cam_inattention = true;
  if (has(t, ["pensamento desorganizado", "discurso desorganizado"])) out.cam_disorganized = true;
  if (has(t, ["sonolent", "torpor", "rebaixamento", "letargic"])) out.cam_altered_loc = true;

  return out;
}

export function describeParsed(parsed = {}) {
  const labels = {
    pa_sistolica: "PA sistólica", pa_diastolica: "PA diastólica", fc: "FC", fr: "FR",
    tax: "Temperatura", sat: "SatO₂", caloi_pain_intensity: "Dor (0-10)", sak_meds: "Nº medicamentos",
  };
  return Object.entries(parsed)
    .filter(([k]) => labels[k])
    .map(([k, v]) => `${labels[k]}: ${v}`);
}
