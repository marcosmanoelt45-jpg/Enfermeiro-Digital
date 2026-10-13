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

// Detecta achados neurológicos, dor anatômica e contexto relatados no texto
function extractClinicalContext(text, vitals) {
  const t = text;

  // 1. Sensório & Consciência
  if (/(?:desacordad|inconsciente|n[ãa]o\s+responde|comatos|rebaixad\w*\s+grave)/i.test(t)) {
    vitals.cam_altered_loc = true;
    vitals.cam_acute = true;
    vitals.sak_disorientation = true;
    vitals.estado_consciencia = "Desacordado / Inconsciente";
  } else if (/(?:confus|desorientad|dificuldade\s+(?:para|de)\s+orienta|n[ãa]o\s+consegue\s+formular\s+frase|pensamento\s+desorganiz)/i.test(t)) {
    vitals.cam_altered_loc = true;
    vitals.cam_positive = true;
    vitals.cam_inattention = true;
    vitals.cam_disorganized = true;
    vitals.sak_disorientation = true;
    vitals.estado_consciencia = "Confuso / Desorientado";
  } else if (/(?:sonolent|torpor|let[aá]rgic|rebaixad)/i.test(t)) {
    vitals.cam_altered_loc = true;
    vitals.estado_consciencia = "Sonolento / Torporoso";
  } else if (/(?:l[uú]cid|orientad|lote|contactuando|alerta|consciente)/i.test(t)) {
    vitals.estado_consciencia = vitals.estado_consciencia || "Lúcido e Orientado";
  }

  // 2. Escala de Coma de Glasgow (3 a 15)
  const glasgowMatch = t.match(/\b(?:glasgow|ecg|escala\s+de\s+coma(?:\s+de\s+glasgow)?)\s*(?:de|:|=)?\s*(\d{1,2})\b/i);
  if (glasgowMatch && Number(glasgowMatch[1])) {
    const val = Number(glasgowMatch[1]);
    if (val >= 3 && val <= 15) {
      vitals.glasgow = val;
      if (!vitals.estado_consciencia) {
        vitals.estado_consciencia = val === 15 ? "Lúcido (Glasgow 15)" : `Glasgow ${val}/15`;
      }
    }
  }

  // 3. Localização Anatômica da Dor
  vitals.caloi_pain_location = vitals.caloi_pain_location || [];
  if (/(?:abdom|barriga|epig[aá]stri|flanco|est[oô]mago)/i.test(t)) {
    if (!vitals.caloi_pain_location.includes("Abdômen")) vitals.caloi_pain_location.push("Abdômen");
  }
  if (/(?:t[oó]rax|tor[aá]cic|peito)/i.test(t)) {
    if (!vitals.caloi_pain_location.includes("Tórax")) vitals.caloi_pain_location.push("Tórax");
  }
  if (/(?:dorso|costas|lombar)/i.test(t)) {
    if (!vitals.caloi_pain_location.includes("Dorso / Região Lombar")) vitals.caloi_pain_location.push("Dorso / Região Lombar");
  }
  if (/(?:cefale|cabe[çc]a)/i.test(t) && /(?:dor|algia|latej)/i.test(t)) {
    if (!vitals.caloi_pain_location.includes("Cabeça")) vitals.caloi_pain_location.push("Cabeça");
  }

  // 4. Características da Dor
  vitals.caloi_pain_characteristics = vitals.caloi_pain_characteristics || [];
  if (/pontada/i.test(t)) {
    if (!vitals.caloi_pain_characteristics.includes("Em pontadas")) vitals.caloi_pain_characteristics.push("Em pontadas");
  }
  if (/queima/i.test(t)) {
    if (!vitals.caloi_pain_characteristics.includes("Em queimação")) vitals.caloi_pain_characteristics.push("Em queimação");
  }
  if (/(?:aperto|opress)/i.test(t)) {
    if (!vitals.caloi_pain_characteristics.includes("Em aperto / Opressiva")) vitals.caloi_pain_characteristics.push("Em aperto / Opressiva");
  }
  if (/c[oó]lica/i.test(t)) {
    if (!vitals.caloi_pain_characteristics.includes("Em cólica")) vitals.caloi_pain_characteristics.push("Em cólica");
  }

  // 5. Queda vs Quase Queda & Marcha
  if (/(?:quase\s+caiu|quase\s+queda|risco\s+de\s+cair)/i.test(t)) {
    vitals.sak_walking = true;
    vitals.quase_caiu = true;
  } else if (/(?:p[óo]s[- ]?queda|sofreu\s+queda|teve\s+queda|caiu\s+(?:da\s+pr[óo]pria|no\s+ch[ãa]o|de\s+n[íi]vel|da\s+cama|em\s+casa))/i.test(t)) {
    vitals.sak_previous_falls = true;
    vitals.historico_queda = true;
  }

  if (/(?:dificuldade\s+para\s+deambular|marcha\s+inst[aá]vel|n[ãa]o\s+consegue\s+andar|instabilidade)/i.test(t)) {
    vitals.sak_walking = true;
    vitals.dificuldade_deambulacao = true;
  }

  // 6. Lesão na cabeça / TCE (somente se houver menção explícita de impacto/lesão craniana)
  if (/(?:les[ãa]o\s+na\s+cabe[çc]a|trauma\s+craniano|traumatismo\s+cranioencef[aá]lico|tce|bateu\s+a\s+cabe[çc]a|corte\s+na\s+cabe[çc]a|pancada\s+na\s+cabe[çc]a)/i.test(t)) {
    vitals.trauma_craniano = true;
  }

  // 7. Sem acompanhante
  if (/(?:sem\s+acompanhante|desacompanhad|sozinho)/i.test(t)) {
    vitals.sak_caregiver = true;
    vitals.sem_acompanhante = true;
  }

  // 8. Idade (ex: "75 anos", "idade 60", "com 35 anos")
  const ageMatch = t.match(/(?:idade\s*(?:de)?\s*|paciente\s+(?:com\s+)?|com\s+)(\d{1,3})\s*(?:anos|a\b)/i);
  if (ageMatch && toNum(ageMatch[1])) {
    const parsedAge = toNum(ageMatch[1]);
    if (parsedAge >= 0 && parsedAge <= 125) {
      vitals.age = parsedAge;
    }
  }

  // 9. Nome do paciente
  const nameMatch = t.match(/(?:paciente\s+chamad[oa]\s+|paciente\s+|sr\.\s+|sra\.\s+)([A-ZÁÉÍÓÚÂÊÔÃÕ][a-záéíóúâêôãõ]+(?:\s+[A-ZÁÉÍÓÚÂÊÔÃÕ][a-záéíóúâêôãõ]+){1,3})/);
  if (nameMatch && nameMatch[1]) {
    const candidate = nameMatch[1].trim();
    if (!/^(chega|com|apresenta|foi|teve|sem|aparentemente|desacordado|inconsciente|dispneico)$/i.test(candidate)) {
      vitals.patient_name = candidate;
    }
  }

  // 10. Gênero
  if (/(?:o\s+paciente|homem|masculino|idoso|senhor\b)/i.test(t)) {
    vitals.gender = "M";
  } else if (/(?:a\s+paciente|mulher|feminino|idosa|senhora\b)/i.test(t)) {
    vitals.gender = "F";
  }

  return vitals;
}

export function parseVitalsFromTranscript(text) {
  const t = normalize(text);
  if (!t) return {};

  const vitals = { ...pickPressure(t) };

  const fc = pick(
    t,
    /\b(?:fc|frequ[êe]ncia\s+card[íi]aca|batimentos(?:\s+card[íi]acos)?|pulso)(?![a-záàâãéêíóôõúç])\D{0,12}?(\d{1,3})/,
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
    /\b(?:hgt|glicemia(?:\s+capilar)?|dextro|glic[êe]mia)(?![a-záàâãéêíóôõúç])\D{0,12}?(\d{1,3})/,
    RANGES.hgt
  );
  if (hgt !== null) vitals.hgt = hgt;

  // Reconhecimento abrangente da Dor (EVA 0 a 10)
  const pain = pick(
    t,
    /\b(?:dor|algia|eva|intensidade(?:\s+da\s+dor)?)\s*(?:de|em|n[íi]vel|nota|:|#)?\s*(\d{1,2})(?:\s*(?:\/\s*10|de\s*10|em\s*10))?/,
    RANGES.pain
  );
  if (pain !== null) {
    vitals.caloi_pain_intensity = pain;
  } else if (/(?:\bsem\b|\bnega\b|\bn[ãa]o\s+(?:refere|tem|apresenta|sente))\b[^.]{0,25}?\bdor\b/.test(t)) {
    vitals.caloi_pain_intensity = 0;
  }

  // Extrai achados de contexto (consciência, glasgow, queda, lesões, sem acompanhante)
  extractClinicalContext(t, vitals);

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
  if (vitals.sat != null) items.push({ label: "SatO₂", value: vitals.sat, unit: "%" });
  if (vitals.tax != null) items.push({ label: "Tax", value: vitals.tax, unit: "°C" });
  if (vitals.hgt != null) items.push({ label: "HGT", value: vitals.hgt, unit: "mg/dL" });
  if (vitals.caloi_pain_intensity != null) {
    const loc = vitals.caloi_pain_location?.[0] ? ` (${vitals.caloi_pain_location[0]})` : "";
    items.push({ label: "Dor", value: `${vitals.caloi_pain_intensity}/10${loc}`, unit: "" });
  } else if (vitals.estado_consciencia === "Desacordado / Inconsciente") {
    items.push({ label: "Dor", value: "Inavaliável (Inconsciente)", unit: "" });
  }
  if (vitals.glasgow != null) {
    items.push({ label: "Glasgow", value: `${vitals.glasgow}/15`, unit: "" });
  }
  if (vitals.estado_consciencia) {
    items.push({ label: "Sensório", value: vitals.estado_consciencia, unit: "" });
  }
  return items;
}

// Identifica parâmetros essenciais que NÃO foram informados no relato, para alertar o profissional
export function getMissingVitals(vitals = {}, text = "") {
  const missing = [];
  const raw = String(text || "").toLowerCase();

  if (vitals.pa_sistolica == null || vitals.pa_diastolica == null) {
    missing.push({
      key: "pa",
      label: "PA (Pressão Arterial)",
      desc: "Pressão sistólica/diastólica não informada",
      snippet: ", PA 120x80 mmHg",
      urgency: "alta"
    });
  }
  if (vitals.fc == null) {
    missing.push({
      key: "fc",
      label: "FC (Frequência Cardíaca)",
      desc: "Pulso/frequência cardíaca não informada",
      snippet: ", FC 75 bpm",
      urgency: "alta"
    });
  }
  if (vitals.fr == null) {
    missing.push({
      key: "fr",
      label: "FR (Frequência Respiratória)",
      desc: "Incursões ventilatórias não informadas",
      snippet: ", FR 16 irpm",
      urgency: "media"
    });
  }
  if (vitals.tax == null) {
    missing.push({
      key: "tax",
      label: "Tax (Temperatura Axilar)",
      desc: "Temperatura não informada (risco de hipotermia pós-trauma ou febre)",
      snippet: ", Tax 36.5 °C",
      urgency: "alta"
    });
  }
  if (vitals.sat == null) {
    missing.push({
      key: "sat",
      label: "SatO₂ (Oximetria)",
      desc: "Saturação de oxigênio não informada",
      snippet: ", SatO2 96%",
      urgency: "alta"
    });
  }
  if (vitals.hgt == null) {
    missing.push({
      key: "hgt",
      label: "HGT (Glicemia Capilar)",
      desc: "Glicemia capilar não informada",
      snippet: ", HGT 100 mg/dL",
      urgency: "media"
    });
  }
  // 7. Avaliação da Dor (Somente aplicável se o paciente estiver consciente/responsivo)
  const isUnconscious =
    vitals.estado_consciencia === "Desacordado / Inconsciente" ||
    Boolean(vitals.cam_altered_loc && /(?:desacordad|inconsciente|desmaiad|comatos|n[ãa]o\s+responde)/i.test(raw)) ||
    /(?:desacordad|inconsciente|desmaiad|comatos|n[ãa]o\s+responde|torpor\s+profundo)/i.test(raw);

  if (vitals.caloi_pain_intensity == null && !isUnconscious) {
    missing.push({
      key: "dor",
      label: "Dor (Escala 0 a 10)",
      desc: "Intensidade álgica não mencionada (ou 'sem dor')",
      snippet: ", dor 0 de 10",
      urgency: "media"
    });
  }

  // Verifica se o estado mental ou Glasgow já foi fornecido no relato
  const hasNeuro =
    Boolean(vitals.estado_consciencia) ||
    Boolean(vitals.glasgow) ||
    /(?:glasgow|ecg|l[uú]cid|orientad|confus|desorientad|sonolent|torpor|inconsciente|desacordad|consciente|contactuando)/i.test(raw);

  if (!hasNeuro) {
    missing.push({
      key: "neuro",
      label: "Nível de Consciência / Glasgow",
      desc: "Estado neurológico ou escala de Glasgow não detalhado",
      snippet: ", lúcido e orientado",
      urgency: "alta"
    });
  }

  if (!vitals.age && !/(?:\d{1,3}\s*anos)/i.test(raw)) {
    missing.push({
      key: "idade",
      label: "Idade do Paciente",
      desc: "Idade não identificada no relato",
      snippet: ", 65 anos",
      urgency: "baixa"
    });
  }

  return missing;
}
