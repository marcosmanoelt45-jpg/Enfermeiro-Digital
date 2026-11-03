/**
 * sbarSpeechMatcher.js
 * Motor Clínico de Análise de Fala e Texto para Metodologia SBAR em Português (pt-BR).
 * 
 * Processa dados digitados ou transcritos por voz (Web Speech / Gemini / AssemblyAI),
 * com normalização fonética, tratamento de numerais por extenso, variações clínicas
 * e cruzamento com o caso clínico ativo.
 */

function normalizeText(str = "") {
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[,.;:!?()[\]{}"'`~^]/g, " ") // pontuação vira espaço
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normaliza números falados por extenso comuns em passagem de plantão para dígitos numéricos
 */
function normalizeSpokenNumbers(text = "") {
  let t = text;

  // Pressão arterial falada: "doze por oito" -> "120/80", "cento e vinte por oitenta" -> "120/80"
  t = t.replace(/\bdoze\s*(?:por|x|\/)\s*oito\b/gi, "120/80");
  t = t.replace(/\bonze\s*(?:por|x|\/)\s*sete\b/gi, "110/70");
  t = t.replace(/\btreze\s*(?:por|x|\/)\s*oito\b/gi, "130/80");
  t = t.replace(/\bquatorze\s*(?:por|x|\/)\s*nove\b/gi, "140/90");
  t = t.replace(/\bcento e quinze\s*(?:por|x|\/)\s*setenta e dois\b/gi, "115/72");
  t = t.replace(/\bcento e vinte\s*(?:por|x|\/)\s*oitenta\b/gi, "120/80");
  t = t.replace(/\bcento e quarenta e oito\s*(?:por|x|\/)\s*noventa e quatro\b/gi, "148/94");
  t = t.replace(/\bcento e trinta e dois\s*(?:por|x|\/)\s*setenta e oito\b/gi, "132/78");

  // Iniciais faladas: "m s l" ou "m s l." -> "msl"
  t = t.replace(/\bm\s+s\s+l\b/gi, "msl");
  t = t.replace(/\bj\s+a\s+p\b/gi, "jap");
  t = t.replace(/\ba\s+b\s+c\b/gi, "abc");

  // Idades e numerais clínicos
  t = t.replace(/\bcinquenta e oito\b/gi, "58");
  t = t.replace(/\bsessenta e sete\b/gi, "67");
  t = t.replace(/\boitenta e dois\b/gi, "82");
  t = t.replace(/\boitenta e quatro\b/gi, "84");
  t = t.replace(/\bnoventa e seis\b/gi, "96");
  t = t.replace(/\bnoventa e oito\b/gi, "98");
  t = t.replace(/\bnoventa e dois\b/gi, "92");
  t = t.replace(/\bnoventa e cinco\b/gi, "95");

  return t;
}

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Termos de até 3 letras ("pa", "dm", "uti") só valem como palavra inteira;
// termos maiores funcionam como radical no início da palavra ("hipertens" casa com "hipertensao").
function termRegex(term) {
  const body = escapeRegExp(term);
  return term.length <= 3
    ? new RegExp(`(?:^|[^a-z0-9])${body}(?![a-z0-9])`)
    : new RegExp(`(?:^|[^a-z0-9])${body}`);
}

function matchesAny(text, patterns) {
  return patterns.some((pat) => {
    if (pat instanceof RegExp) return pat.test(text);
    if (!pat) return false;
    return termRegex(String(pat)).test(text);
  });
}

/**
 * Avalia de forma inteligente se cada um dos 12 itens pedagógicos do SBAR foi contemplado.
 * @param {object} sbarData - Objeto { situation, background, assessment, recommendation }
 * @param {object} currentCase - Caso clínico ativo (opcional, para enriquecer o vocabulário)
 * @returns {object} Estado booleano de cada item por pilar
 */
export function evaluateSbarChecklists(sbarData = {}, currentCase = null) {
  const rawSituation = sbarData.situation || "";
  const rawBackground = sbarData.background || "";
  const rawAssessment = sbarData.assessment || "";
  const rawRecommendation = sbarData.recommendation || "";

  const s = normalizeText(normalizeSpokenNumbers(rawSituation));
  const b = normalizeText(normalizeSpokenNumbers(rawBackground));
  const a = normalizeText(normalizeSpokenNumbers(rawAssessment));
  const r = normalizeText(normalizeSpokenNumbers(rawRecommendation));
  const allText = `${s} ${b} ${a} ${r}`;

  // Termos dinâmicos do caso
  const caseBed = currentCase?.bed ? normalizeText(currentCase.bed) : "";
  const caseSector = currentCase?.sector ? normalizeText(currentCase.sector) : "";
  const caseName = currentCase?.name ? normalizeText(currentCase.name).replace(/\s+/g, "") : "";
  const caseAge = currentCase?.age ? String(currentCase.age) : "";

  // ==========================================
  // PILAR 1: SITUAÇÃO (S)
  // ==========================================
  // 1. Leito / Enfermaria / Setor
  const bedPatterns = [
    "leito", "box", "quarto", "enfermaria", "uti", "ala", "cama", "apartamento", "apto",
    "clinica cirurgica", "clinica medica", "geriatria", "posto", "setor", "internado no", "admitido no",
    /\b(?:leito|quarto|box|apto)\s*\d+/i
  ];
  if (caseBed) bedPatterns.push(caseBed);
  if (caseSector) bedPatterns.push(caseSector);
  const situationBed = matchesAny(s, bedPatterns) || (caseBed && allText.includes(caseBed));

  // 2. Identificação do Paciente / Iniciais / Idade
  const idPatterns = [
    "anos", "idade", "msl", "jap", "abc", "m s l", "j a p", "a b c",
    "senhor", "senhora", "sr", "sra", "idoso", "homem", "mulher",
    /\b\d{1,3}\s*anos\b/i
  ];
  if (caseName) idPatterns.push(caseName);
  if (caseAge) idPatterns.push(caseAge);
  const situationId = matchesAny(s, idPatterns);

  // 3. Motivo da Admissão / Procedimento Cirúrgico
  const reasonPatterns = [
    "dpo", "colectomia", "diverticulite", "cirurgia", "cirurgico", "operado", "pos op", "pos-op",
    "icc", "insuficiencia cardiaca", "congestao", "pulmonar", "ortopneia", "dispneia", "falta de ar",
    "pneumonia", "delirium", "queda", "contusao", "fratura", "admissao", "admitido", "internado",
    "internacao", "queixa", "diagnostico", "motivo", "apresentando", "quadro de", "procedimento",
    "dor", "febre", "tosse", "descompensacao", "infeccao"
  ];
  if (currentCase?.diagnosis) {
    reasonPatterns.push(normalizeText(currentCase.diagnosis).slice(0, 15));
  }
  const situationReason = matchesAny(s, reasonPatterns);

  // ==========================================
  // PILAR 2: HISTÓRICO (B - BACKGROUND)
  // ==========================================
  // 1. Status Alérgico Expressamente Confirmado (CRÍTICO)
  const allergyPatterns = [
    "alergia", "alergico", "alergica", "alergias", "alergicos", "nega alergia", "sem alergia",
    "nao tem alergia", "nao possui alergia", "sem historico alergico", "alergia medicamentosa",
    "contraste", "iodo", "iodado", "dipirona", "penicilina", "anti-inflamatorio", "sensibilidade",
    "reacao adversa", "hipersensibilidade", "alergica a nada", "nega alergias"
  ];
  // Alergia pode ser falada no Background ou em qualquer pilar (Meta 2 de Segurança)
  const backgroundAllergy = matchesAny(b, allergyPatterns) || matchesAny(allText, allergyPatterns);

  // 2. Comorbidades Relevantes de Base
  const comorbPatterns = [
    "has", "hipertens", "pressao alta", "dm", "dm2", "diabetes", "diabetico",
    "icc", "insuficiencia cardiaca", "cardiopatia", "fracao de ejecao",
    "alzheimer", "demencia", "osteoartrose", "artrose", "avc", "renal", "asma", "dpoc",
    "queda previa", "historico de queda", "ja caiu", "comorbidade", "comorbidades",
    "doenca previa", "antecedente", "patologia", "historico", "cirurgia abdominal previa",
    "nega cirurgia"
  ];
  const backgroundComorbidities = matchesAny(b, comorbPatterns);

  // 3. Medicações Contínuas de Uso Domiciliar ou Histórico Farmacológico
  const medsPatterns = [
    "losartana", "furosemida", "insulina", "anti-hipertensivo", "diuretico", "antibiotico",
    "medicamento", "medicamentos", "medicacao", "medicacoes", "remedio", "remedios", "droga",
    "drogas", "toma", "tomando", "uso", "faz uso", "prescricao", "posologia", "dose",
    "tratamento", "antibioticoterapia", "farmaco", "farmacos", "domicilio", "domiciliar",
    "sem medicac", "nega medicac", "nao toma", "nao usa", "sem remedio", "fracao de ejecao",
    "terapia", "uso continuo", "medicamentosa"
  ];
  const backgroundMeds = matchesAny(b, medsPatterns);

  // ==========================================
  // PILAR 3: AVALIAÇÃO ATUAL (A - ASSESSMENT)
  // ==========================================
  // 1. Sinais Vitais Numéricos (PA e FC)
  // Sinal vital só conta com número: o rótulo sozinho ("pa", "pulso") não basta.
  const vitalsPatterns = [
    /\b(?:pa|pressao(?: arterial)?)\b\D{0,10}\d{1,3}\s*(?:\/|x|por)\s*\d{1,3}/, // "pa 120x80", "pressao 12 por 8"
    /\b\d{2,3}\s*(?:\/|x)\s*\d{2,3}\b/, // "115/72", "120x80"
    /\b(?:fc|frequencia cardiaca|pulso)\b\D{0,10}\d{2,3}/, /\b\d{2,3}\s*bpm\b/,
    /\b(?:fr|frequencia respiratoria)\b\D{0,10}\d{1,2}/, /\b\d{1,2}\s*(?:irpm|rpm)\b/,
    /\b(?:tax|temperatura)\b\D{0,10}\d{2}/
  ];
  const assessmentVitals = matchesAny(a, vitalsPatterns);

  // 2. Oximetria de Pulso (SatO2) e Suporte Ventilatório
  const satPatterns = [
    "sat", "sato2", "saturacao", "saturando", "oxigenio", "oximetro", "oximetria", "spo2",
    "ar ambiente", "cateter", "mascara", "canula", "suporte de o2", "litros por minuto", "l min",
    /\b\d{2,3}\s*%/
  ];
  const assessmentSato2 = matchesAny(a, satPatterns);

  // 3. Exame Físico Objetivo (Dor, Drenos, Curativos, Ausculta, Sensório)
  const examPatterns = [
    "dor", "eva", "escala de dor", "incisao", "cirurgico", "curativo", "limpo", "seco",
    "dreno", "portovac", "tubular", "debito", "ml", "serossanguinolento", "drenagem",
    "estertor", "estertores", "crepitante", "crepitantes", "bibasais", "murmurio",
    "edema", "mmii", "membros", "turgencia", "jugular",
    "sensorio", "consciencia", "cam", "delirium", "agitado", "desorientado", "lucido", "orientado",
    "evasao", "puncao", "acesso", "abdome", "flacido"
  ];
  const assessmentExam = matchesAny(a, examPatterns);

  // ==========================================
  // PILAR 4: RECOMENDAÇÃO (R)
  // ==========================================
  // 1. Aprazamentos e Horários Definidos
  const timePatterns = [
    "noite", "amanha", "madrugada", "jejum", "proximo plantao", "aprazado", "horario", "intervalo",
    /\b(?:as\s*)?\d{1,2}\s*(?:h|hs|horas)\b/, /\ba cada \d+/, /\bde \d+ em \d+/, /\b\d{1,2}h\d{2}\b/
  ];
  const recommendationTime = matchesAny(r, timePatterns);

  // 2. Medicações Prescritas e Pendentes
  const recMedsPatterns = [
    "administrar", "aplicar", "infundir", "iniciar", "manter",
    "analgesia", "analgesico", "dipirona", "furosemida", "antibiotico", "soro", "hidratacao",
    "medicamento", "medicacao", "remedio", "dose", "prescrita", "prescricao", /\b\d+\s*mg\b/
  ];
  const recommendationMeds = matchesAny(r, recMedsPatterns);

  // 3. Vigilância de Drenos, Balanço Hídrico, Exames e Segurança
  const monitoringPatterns = [
    "vigiar", "observar", "monitorar", "checar", "verificar", "atentar", "acompanhar",
    "balanco", "hidrico", "diurese", "peso", "grades", "leito", "resultado", "hematocrito",
    "exame", "coleta", "laboratorio", "acesso", "dreno", "debito", "queda", "risco", "contencao",
    "seguranca", "acompanhante"
  ];
  const recommendationMonitoring = matchesAny(r, monitoringPatterns);

  return {
    situation: {
      bed: Boolean(situationBed),
      id: Boolean(situationId),
      reason: Boolean(situationReason)
    },
    background: {
      allergy: Boolean(backgroundAllergy),
      comorbidities: Boolean(backgroundComorbidities),
      meds: Boolean(backgroundMeds)
    },
    assessment: {
      vitals: Boolean(assessmentVitals),
      sato2: Boolean(assessmentSato2),
      exam: Boolean(assessmentExam)
    },
    recommendation: {
      time: Boolean(recommendationTime),
      meds: Boolean(recommendationMeds),
      monitoring: Boolean(recommendationMonitoring)
    }
  };
}
