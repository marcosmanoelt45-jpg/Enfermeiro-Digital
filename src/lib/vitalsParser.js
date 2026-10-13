// Lê os sinais vitais de um relato clínico em português (texto transcrito ou digitado).
// Reconhece PA, FC, FR, Tax, SatO₂, HGT e a intensidade da dor (CALOI / EVA) nos formatos mais comuns de ditado,
// inclusive quando a transcrição cola o valor na sigla ("FR11", "FC12", "PA120x80").

const RANGES = {
  fc: { min: 5, max: 300 },
  fr: { min: 3, max: 80 },
  tax: { min: 25, max: 45 },
  sat: { min: 40, max: 100 },
  hgt: { min: 10, max: 800 },
  pain: { min: 0, max: 10 }
};

function normalize(text) {
  return String(text || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function toNum(raw) {
  const n = Number(String(raw).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

// Percorre todas as ocorrências do padrão e devolve o primeiro valor dentro da faixa plausível.
function pick(text, pattern, range = {}) {
  const flags = pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g";
  const re = new RegExp(pattern.source, flags);
  for (const match of text.matchAll(re)) {
    const value = toNum(match[1]);
    if (value === null) continue;
    if (range.min !== undefined && value < range.min) continue;
    if (range.max !== undefined && value > range.max) continue;
    return value;
  }
  return null;
}

function pickPressure(text) {
  const patterns = [
    /\b(?:pa|press[aã]o)(?:\s+arterial)?(?![a-záàâãéêíóôõúç])\D{0,12}?(\d{2,3})\s*(?:x|\/|por|e)\s*(\d{2,3})/g,
    /(\d{2,3})\s*(?:x|\/|por)\s*(\d{2,3})/g
  ];
  for (const re of patterns) {
    for (const match of text.matchAll(re)) {
      const systolic = toNum(match[1]);
      const diastolic = toNum(match[2]);
      const ok =
        systolic !== null && diastolic !== null &&
        systolic >= 60 && systolic <= 260 && diastolic >= 30 && diastolic <= 160;
      if (ok) return { pa_sistolica: systolic, pa_diastolica: diastolic };
    }
  }
  return {};
}

export function parseVitalsFromTranscript(text) {
  const t = normalize(text);
  if (!t) return {};

  const vitals = { ...pickPressure(t) };

  const fc = pick(
    t,
    /\b(?:fc|frequ[êe]ncia\s+card[íi]aca|batimentos(?:\s+card[íi]acos)?|pulso)(?![a-záàâãéêíóôõúç])\D{0,12}?(\d{2,3})/,
    RANGES.fc
  );
  if (fc !== null) vitals.fc = fc;

  const fr = pick(
    t,
    /\b(?:fr|frequ[êe]ncia\s+respirat[óo]ria|respira(?:ndo|ção|co)?|irpm|movimentos?\s+respirat[óo]rios?)(?![a-záàâãéêíóôõúç])\D{0,12}?(\d{1,3})/,
    RANGES.fr
  );
  if (fr !== null) vitals.fr = fr;

  const tax = pick(
    t,
    /\b(?:tax|temperatura(?:\s+axilar)?|temp)(?![a-záàâãéêíóôõúç])\D{0,12}?(\d{1,2}[.,]\d{1,2}|\d{2})/,
    RANGES.tax
  );
  if (tax !== null) vitals.tax = tax;

  const sat = pick(
    t,
    /\b(?:sat(?:ura[çc][ãa]o)?|sato2|spo2|saturando|o2)(?![a-záàâãéêíóôõúç])\D{0,12}?(\d{2,3})/,
    RANGES.sat
  );
  if (sat !== null) vitals.sat = sat;

  const hgt = pick(
    t,
    /\b(?:hgt|glicemia(?:\s+capilar)?|dextro|glic[êe]mia)(?![a-záàâãéêíóôõúç])\D{0,12}?(\d{2,3})/,
    RANGES.hgt
  );
  if (hgt !== null) vitals.hgt = hgt;

  const pain = pick(
    t,
    /\b(?:dor|algia|eva)(?![a-záàâãéêíóôõúç])\s*(?:de|em|n[íi]vel|nota|intensidade|escala|:|=)?\s*(\d{1,2})(?:\s*(?:\/\s*10|de\s*10))?/,
    RANGES.pain
  );
  if (pain !== null) {
    vitals.caloi_pain_intensity = pain;
  } else if (/(?:\bsem\b|\bnega\b|\bn[ãa]o\s+(?:refere|tem|apresenta|sente))\b[^.]{0,25}?\bdor\b/.test(t)) {
    vitals.caloi_pain_intensity = 0;
  }

  return vitals;
}

// Lista legível dos valores reconhecidos, para exibir na revisão do relato.
export function describeVitals(vitals = {}) {
  const items = [];
  if (vitals.pa_sistolica != null || vitals.pa_diastolica != null) {
    items.push({ label: "PA", value: `${vitals.pa_sistolica ?? "--"}x${vitals.pa_diastolica ?? "--"}`, unit: "mmHg" });
  }
  if (vitals.fc != null) items.push({ label: "FC", value: vitals.fc, unit: "bpm" });
  if (vitals.fr != null) items.push({ label: "FR", value: vitals.fr, unit: "irpm" });
  if (vitals.tax != null) items.push({ label: "Tax", value: vitals.tax, unit: "°C" });
  if (vitals.sat != null) items.push({ label: "SatO₂", value: vitals.sat, unit: "%" });
  if (vitals.hgt != null) items.push({ label: "HGT", value: vitals.hgt, unit: "mg/dL" });
  if (vitals.caloi_pain_intensity != null) items.push({ label: "Dor", value: vitals.caloi_pain_intensity, unit: "/10" });
  return items;
}
