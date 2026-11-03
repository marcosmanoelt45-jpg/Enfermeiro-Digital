/**
 * proceduralDosageGenerator.js
 * 
 * Motor de Geração Procedural Infinito de Cálculos Farmacêuticos & Doses
 */

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function formatAndShuffleOptions(rawOptions) {
  const shuffled = shuffleArray(rawOptions);
  const letters = ["A", "B", "C", "D"];
  return shuffled.map((opt, idx) => ({
    ...opt,
    letter: letters[idx],
    id: `opt_${letters[idx].toLowerCase()}`
  }));
}

function ensureUniqueDistractors(correct, distractors, fallback) {
  const setVals = new Set([correct]);
  return distractors.map(d => {
    let curr = d;
    while (setVals.has(curr) || curr <= 0) {
      curr = Number((curr + fallback).toFixed(correct % 1 === 0 ? 0 : 2));
    }
    setVals.add(curr);
    return curr;
  });
}

/**
 * 1. Gerador de Macrogotas em Horas
 */
function generateMacrogotasHoras() {
  const cases = [
    { vol: 250, times: [4, 6] },
    { vol: 500, times: [6, 8, 12] },
    { vol: 1000, times: [8, 12, 24] }
  ];
  const c = cases[Math.floor(Math.random() * cases.length)];
  const time = c.times[Math.floor(Math.random() * c.times.length)];
  const solution = ["SF 0,9%", "SG 5%", "RL"][Math.floor(Math.random() * 3)];

  const rawResult = c.vol / (time * 3);
  const correct = Math.round(rawResult);

  const d = ensureUniqueDistractors(correct, [Math.round(c.vol / time), Math.round(c.vol / (time * 2)), Math.floor(rawResult) - 2], 5);

  return {
    id: `proc_macro_h_${Date.now()}`,
    category: "Macrogotas / Horas",
    title: `Infusão de ${solution} ${c.vol} mL`,
    description: `Prescrição: ${solution} ${c.vol} mL IV em ${time} horas via macrogotas.`,
    solutionName: solution,
    volume: `${c.vol} mL`,
    route: "IV",
    time: `${time} h`,
    device: "Macrogotas",
    question: "Gotas/min?",
    answerUnit: "gts/min",
    answer: { value: correct, unit: "gts/min", kind: "integer" },
    correctResult: String(correct),
    options: formatAndShuffleOptions([
      { value: String(correct), text: `${correct} gts/min`, isCorrect: true, rationale: `V / (T × 3) = ${c.vol} / ${time * 3} = ${rawResult.toFixed(1)} → ${correct}.` },
      { value: String(d[0]), text: `${d[0]} gts/min`, isCorrect: false, rationale: "Calculou como microgotas (V / T)." },
      { value: String(d[1]), text: `${d[1]} gts/min`, isCorrect: false, rationale: "Erro na constante do equipo." },
      { value: String(d[2]), text: `${d[2]} gts/min`, isCorrect: false, rationale: "Erro de arredondamento." }
    ]),
    explanationSteps: [
      `Volume: ${c.vol} mL | Tempo: ${time} h.`,
      `Fórmula Macrogotas: V / (T × 3)`,
      `Cálculo: ${c.vol} / (${time} × 3) = ${rawResult.toFixed(2)}`,
      `Resultado: ${correct} gotas/minuto.`
    ]
  };
}

/**
 * 2. Gerador de Microgotas em Horas
 */
function generateMicrogotasHoras() {
  const cases = [
    { vol: 100, times: [4, 6] },
    { vol: 250, times: [6, 8, 12] },
    { vol: 500, times: [12, 24] }
  ];
  const c = cases[Math.floor(Math.random() * cases.length)];
  const time = c.times[Math.floor(Math.random() * c.times.length)];
  
  const rawResult = c.vol / time;
  const correct = Math.round(rawResult);

  const d = ensureUniqueDistractors(correct, [Math.round(c.vol / (time * 3)), Math.round(c.vol / 60), correct + 10], 4);

  return {
    id: `proc_micro_h_${Date.now()}`,
    category: "Microgotas / Horas",
    title: "Infusão em Microgotas",
    description: `Prescrição: Soro Pediátrico ${c.vol} mL IV em ${time} horas via microgotas.`,
    solutionName: "Soro Pediátrico",
    volume: `${c.vol} mL`,
    route: "IV",
    time: `${time} h`,
    device: "Microgotas",
    question: "Microgotas/min?",
    answerUnit: "mcgts/min",
    answer: { value: correct, unit: "mcgts/min", kind: "integer" },
    correctResult: String(correct),
    options: formatAndShuffleOptions([
      { value: String(correct), text: `${correct} mcgts/min`, isCorrect: true, rationale: `V / T = ${c.vol} / ${time} = ${rawResult.toFixed(1)} → ${correct}.` },
      { value: String(d[0]), text: `${d[0]} mcgts/min`, isCorrect: false, rationale: "Aplicou fórmula de macrogotas." },
      { value: String(d[1]), text: `${d[1]} mcgts/min`, isCorrect: false, rationale: "Confusão com minutos." },
      { value: String(d[2]), text: `${d[2]} mcgts/min`, isCorrect: false, rationale: "Erro de cálculo." }
    ]),
    explanationSteps: [
      `Volume: ${c.vol} mL | Tempo: ${time} h.`,
      `Fórmula Microgotas: V / T`,
      `Cálculo: ${c.vol} / ${time} = ${rawResult.toFixed(2)}`,
      `Resultado: ${correct} microgotas/minuto.`
    ]
  };
}

/**
 * 3. Gerador de Macrogotas em Minutos
 */
function generateMacrogotasMinutos() {
  const cases = [
    { drug: "Metronidazol", vol: 100, min: 30 },
    { drug: "Ciprofloxacino", vol: 200, min: 60 },
    { drug: "Paracetamol", vol: 100, min: 15 },
    { drug: "Ceftriaxona", vol: 100, min: 30 }
  ];
  const c = cases[Math.floor(Math.random() * cases.length)];
  const rawResult = (c.vol * 20) / c.min;
  const correct = Math.round(rawResult);

  const d = ensureUniqueDistractors(correct, [Math.round((c.vol * 60) / c.min), Math.round(c.vol / c.min), Math.round(c.vol / 3)], 10);

  return {
    id: `proc_macro_min_${Date.now()}`,
    category: "Macrogotas / Minutos",
    title: `${c.drug} em ${c.min} min`,
    description: `Prescrição: ${c.drug} ${c.vol} mL para infundir em ${c.min} minutos via macrogotas.`,
    solutionName: c.drug,
    volume: `${c.vol} mL`,
    route: "IV",
    time: `${c.min} min`,
    device: "Macrogotas",
    question: "Gotas/min?",
    answerUnit: "gts/min",
    answer: { value: correct, unit: "gts/min", kind: "integer" },
    correctResult: String(correct),
    options: formatAndShuffleOptions([
      { value: String(correct), text: `${correct} gts/min`, isCorrect: true, rationale: `(V × 20) / T = (${c.vol} × 20) / ${c.min} = ${rawResult.toFixed(1)} → ${correct}.` },
      { value: String(d[0]), text: `${d[0]} gts/min`, isCorrect: false, rationale: "Usou fator de microgotas (60)." },
      { value: String(d[1]), text: `${d[1]} gts/min`, isCorrect: false, rationale: "Esqueceu o fator 20." },
      { value: String(d[2]), text: `${d[2]} gts/min`, isCorrect: false, rationale: "Fórmula de horas aplicada em minutos." }
    ]),
    explanationSteps: [
      `Volume: ${c.vol} mL | Tempo: ${c.min} min.`,
      `Fórmula (minutos): (V × 20) / T`,
      `Cálculo: (${c.vol} × 20) / ${c.min} = ${rawResult.toFixed(2)}`,
      `Resultado: ${correct} gotas/minuto.`
    ]
  };
}

/**
 * 4. Gerador de BIC
 */
function generateBicInfusion() {
  const cases = [
    { drug: "Heparina", dose: 25000, unit: "UI", vol: 250, rates: [800, 1000, 1200] },
    { drug: "Nitroglicerina", dose: 50, unit: "mg", vol: 250, rates: [5, 10, 20], mode: "mcg/min" },
    { drug: "KCl 10%", dose: 40, unit: "mEq", vol: 500, rates: [10], safety: "Máx 10 mEq/h em veia periférica." }
  ];

  const c = cases[Math.floor(Math.random() * cases.length)];
  const rate = c.rates[Math.floor(Math.random() * c.rates.length)];
  
  let correct, explanation;
  const concentration = c.dose / c.vol;

  if (c.mode === "mcg/min") {
    // rate is mcg/min. ml/h = (rate * 60) / concentration_mcg_ml
    const concMcg = (c.dose * 1000) / c.vol;
    correct = Number(((rate * 60) / concMcg).toFixed(1));
    explanation = [
      `Concentração: ${c.dose} mg em ${c.vol} mL = ${concMcg} mcg/mL.`,
      `Dose: ${rate} mcg/min × 60 = ${rate * 60} mcg/h.`,
      `Vazão: ${rate * 60} / ${concMcg} = ${correct} mL/h.`
    ];
  } else {
    correct = Number((rate / concentration).toFixed(1));
    explanation = [
      `Concentração: ${c.dose} ${c.unit} em ${c.vol} mL = ${concentration} ${c.unit}/mL.`,
      `Dose prescrita: ${rate} ${c.unit}/h.`,
      `Vazão: ${rate} / ${concentration} = ${correct} mL/h.`,
      c.safety || ""
    ].filter(Boolean);
  }

  const d = ensureUniqueDistractors(correct, [correct * 10, correct * 0.5, correct + 5], 2);

  return {
    id: `proc_bic_${Date.now()}`,
    category: "Bomba de Infusão (BIC)",
    highAlert: true,
    title: `Infusão de ${c.drug}`,
    description: `Prescrição: ${c.drug} ${rate} ${c.mode || c.unit + "/h"}. Solução: ${c.dose}${c.unit} em ${c.vol}mL.`,
    solutionName: c.drug, volume: `${c.vol} mL`, route: "IV Contínua", time: "Contínuo", device: "BIC",
    question: "Vazão em mL/h?",
    answerUnit: "mL/h",
    answer: { value: correct, unit: "mL/h", kind: "decimal", decimals: 1 },
    correctResult: String(correct),
    options: formatAndShuffleOptions([
      { value: String(correct), text: `${correct} mL/h`, isCorrect: true, rationale: "Cálculo correto da vazão na BIC." },
      { value: String(d[0]), text: `${d[0]} mL/h`, isCorrect: false, rationale: "Erro de casa decimal (10x)." },
      { value: String(d[1]), text: `${d[1]} mL/h`, isCorrect: false, rationale: "Subdosagem (metade)." },
      { value: String(d[2]), text: `${d[2]} mL/h`, isCorrect: false, rationale: "Erro na razão da solução." }
    ]),
    explanationSteps: explanation
  };
}

/**
 * 5. Gerador de Penicilina
 */
function generatePenicilinaCristalina() {
  const totalUI = 5000000;
  const solute = 2; // mL do pó
  const water = 8; // mL AD
  const prescribed = [1000000, 2000000, 2500000][Math.floor(Math.random() * 3)];
  const correct = (prescribed * 10) / totalUI;
  // Alternativas sempre diferentes da resposta: um valor fixo podia coincidir com ela (ex.: 2.500.000 UI = 5 mL).
  const pd = ensureUniqueDistractors(correct, [(prescribed * 8) / totalUI, correct * 2, correct / 2], 0.5);

  return {
    id: `proc_pen_${Date.now()}`,
    category: "Diluição",
    title: "Penicilina Cristalina",
    description: `Prescrição: Penicilina ${prescribed.toLocaleString()} UI. Frasco: 5M UI (pó = 2mL) + 8mL AD.`,
    solutionName: "Penicilina 5M", volume: "10 mL", route: "IV", time: "Horário", device: "Seringa",
    question: "Aspirar quantos mL?",
    answerUnit: "mL",
    answer: { value: correct, unit: "mL", kind: "decimal", decimals: 1 },
    correctResult: String(correct),
    options: formatAndShuffleOptions([
      { value: String(correct), text: `${correct} mL`, isCorrect: true, rationale: "Considerou o volume final de 10 mL (8 AD + 2 pó)." },
      { value: String(pd[0]), text: `${pd[0]} mL`, isCorrect: false, rationale: "Ignorou o volume do soluto (pó)." },
      { value: String(pd[1]), text: `${pd[1]} mL`, isCorrect: false, rationale: "Dose dobrada." },
      { value: String(pd[2]), text: `${pd[2]} mL`, isCorrect: false, rationale: "Subdosagem (metade da dose)." }
    ]),
    explanationSteps: [
      "O pó de 5M ocupa 2 mL. Com 8 mL de AD, o total é 10 mL.",
      `Proporção: 5.000.000 --- 10 mL | ${prescribed} --- X`,
      `X = (${prescribed} × 10) / 5.000.000 = ${correct} mL.`
    ]
  };
}

/**
 * 6. Gerador Pediátrico / Rediluição
 */
function generatePediatricRedilution() {
  const cases = [
    { drug: "Hidrocortisona", vial: 500, dil: 5, doses: [50, 100, 150] },
    { drug: "Ceftriaxona", vial: 1000, dil: 10, doses: [200, 250, 500] }
  ];
  const c = cases[Math.floor(Math.random() * cases.length)];
  const dose = c.doses[Math.floor(Math.random() * c.doses.length)];
  const correct = (dose * c.dil) / c.vial;
  const dd = ensureUniqueDistractors(correct, [correct * 2, correct * 0.5, correct * 10], 0.5);

  return {
    id: `proc_ped_${Date.now()}`,
    category: "Pediátrico / Rediluição",
    title: c.drug,
    description: `Prescrição: ${c.drug} ${dose} mg. Disponível: ${c.vial} mg em ${c.dil} mL.`,
    solutionName: c.drug, volume: `${c.dil} mL`, route: "IV", time: "Dose", device: "Seringa",
    question: "Aspirar quantos mL?",
    answerUnit: "mL",
    answer: { value: correct, unit: "mL", kind: "decimal", decimals: 1 },
    correctResult: String(correct),
    options: formatAndShuffleOptions([
      { value: String(correct), text: `${correct} mL`, isCorrect: true, rationale: "Cálculo correto via regra de três." },
      { value: String(dd[0]), text: `${dd[0]} mL`, isCorrect: false, rationale: "Dose dobrada." },
      { value: String(dd[1]), text: `${dd[1]} mL`, isCorrect: false, rationale: "Subdosagem." },
      { value: String(dd[2]), text: `${dd[2]} mL`, isCorrect: false, rationale: "Erro de casa decimal (10x)." }
    ]),
    explanationSteps: [
      `Concentração: ${c.vial} mg em ${c.dil} mL.`,
      `Cálculo: (${dose} × ${c.dil}) / ${c.vial} = ${correct} mL.`
    ]
  };
}

export function generateProceduralDosageProblem() {
  const generators = [
    generateMacrogotasHoras, generateMicrogotasHoras, generateMacrogotasMinutos,
    generateBicInfusion, generatePenicilinaCristalina, generatePediatricRedilution
  ];
  return generators[Math.floor(Math.random() * generators.length)]();
}
