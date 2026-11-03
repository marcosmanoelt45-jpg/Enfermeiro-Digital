/**
 * dosageProblems.js
 * 
 * Banco Canônico de 20 Desafios de Cálculo de Doses, Soluções & Gotejamento
 * Cada desafio possui:
 * - 4 opções (A, B, C, D) embaralhadas via Fisher-Yates
 * - Memória de cálculo passo a passo
 * - Racional clínico e farmacológico para o Goti
 */

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildOptions(rawOptions) {
  const shuffled = shuffleArray(rawOptions);
  const letters = ["A", "B", "C", "D"];
  return shuffled.map((opt, idx) => ({
    ...opt,
    letter: letters[idx],
    id: `opt_${letters[idx].toLowerCase()}`
  }));
}

export function getDosageProblems() {
  return [
    {
      id: "prob_1",
      category: "Macrogotas / Horas",
      title: "Infusão de Soro Fisiológico em 8h",
      description: "Prescrição médica: Soro Fisiológico 0,9% 1000 mL para ser administrado por via intravenosa no período de 8 horas, utilizando equipo comum (macrogotas).",
      solutionName: "Soro Fisiológico 0,9%",
      volume: "1000 mL",
      route: "Intravenosa (IV)",
      time: "8 horas",
      device: "Equipo de Macrogotas",
      question: "Quantas gotas por minuto (gts/min) deverão ser administradas?",
      formulaHint: "Gotas/min = Volume (mL) ÷ (Tempo (h) × 3)",
      correctResult: "42",
      answerUnit: "gts/min",
      answer: { value: 42, unit: "gts/min", kind: "integer" },
      options: buildOptions([
        { value: "42", text: "42 gotas/minuto", isCorrect: true, rationale: "1000 ÷ (8 × 3) = 1000 ÷ 24 = 41,66... Arredondando: 42 gts/min." },
        { value: "125", text: "125 gotas/minuto", isCorrect: false, rationale: "1000 ÷ 8 = 125. Cálculo de microgotas ou mL/h, faltando a constante 3." },
        { value: "35", text: "35 gotas/minuto", isCorrect: false, rationale: "Taxa insuficiente, causará atraso na hidratação prescrita." },
        { value: "24", text: "24 gotas/minuto", isCorrect: false, rationale: "Confusão entre o denominador (24) e o resultado final." }
      ]),
      explanationSteps: [
        "Identifique as variáveis: Volume = 1000 mL | Tempo = 8 horas",
        "Utilize a fórmula de macrogotas: Gotas/min = V / (T × 3)",
        "Cálculo: 1000 ÷ (8 × 3) = 1000 ÷ 24 = 41,66...",
        "Arredondamento: 42 gotas/minuto."
      ]
    },
    {
      id: "prob_2",
      category: "Microgotas / Horas",
      title: "Infusão em Paciente Pediátrico / Cardiopata",
      description: "Prescrição médica: Soro Glicosado 5% 500 mL para infundir em 12 horas através de equipo de microgotas.",
      solutionName: "Soro Glicosado 5%",
      volume: "500 mL",
      route: "Intravenosa (IV)",
      time: "12 horas",
      device: "Equipo de Microgotas",
      question: "Qual deve ser a taxa de infusão em microgotas por minuto (mgts/min)?",
      formulaHint: "Microgotas/min = Volume (mL) ÷ Tempo (h)",
      correctResult: "42",
      answerUnit: "mcgts/min",
      answer: { value: 42, unit: "mcgts/min", kind: "integer" },
      options: buildOptions([
        { value: "42", text: "42 microgotas/minuto", isCorrect: true, rationale: "500 ÷ 12 = 41,66... Arredondando: 42 mgts/min (igual a 42 mL/h)." },
        { value: "14", text: "14 microgotas/minuto", isCorrect: false, rationale: "500 ÷ (12 × 3) = 13,88 → 14. Taxa para macrogotas, não microgotas." },
        { value: "60", text: "60 microgotas/minuto", isCorrect: false, rationale: "Confusão com a constante de 60 microgotas/mL." },
        { value: "28", text: "28 microgotas/minuto", isCorrect: false, rationale: "Subinfusão que comprometeria o aporte hídrico." }
      ]),
      explanationSteps: [
        "Variáveis: Volume = 500 mL | Tempo = 12 horas",
        "Fórmula de microgotas/h: Microgotas/min = Volume ÷ Tempo",
        "Cálculo: 500 ÷ 12 = 41,66...",
        "Arredondamento: 42 microgotas/minuto."
      ]
    },
    {
      id: "prob_3",
      category: "Macrogotas / Minutos",
      title: "Antibiótico em Infusão Rápida (30 minutos)",
      description: "Prescrição médica: Metronidazol 500mg em bolsa de 100 mL para correr em 30 minutos via equipo de macrogotas.",
      solutionName: "Metronidazol 500mg (100 mL)",
      volume: "100 mL",
      route: "Intravenosa (IV)",
      time: "30 minutos",
      device: "Equipo de Macrogotas",
      question: "Quantas gotas por minuto devem ser infundidas?",
      formulaHint: "Gotas/min = (Volume × 20) ÷ Tempo em minutos",
      correctResult: "67",
      answerUnit: "gts/min",
      answer: { value: 67, unit: "gts/min", kind: "integer" },
      options: buildOptions([
        { value: "67", text: "67 gotas/minuto", isCorrect: true, rationale: "(100 × 20) ÷ 30 = 2000 ÷ 30 = 66,66... Arredondando: 67 gts/min." },
        { value: "200", text: "200 gotas/minuto", isCorrect: false, rationale: "(100 × 60) ÷ 30 = 200. Taxa de microgotas/minuto, não macrogotas." },
        { value: "33", text: "33 gotas/minuto", isCorrect: false, rationale: "100 ÷ 3 = 33,3. Fórmula de horas aplicada sobre minutos." },
        { value: "50", text: "50 gotas/minuto", isCorrect: false, rationale: "Taxa insuficiente (correrria em 40 min)." }
      ]),
      explanationSteps: [
        "Tempo em minutos: a constante para macrogotas é 20.",
        "Fórmula: Gotas/min = (V × 20) ÷ T(min)",
        "Cálculo: (100 × 20) ÷ 30 = 2000 ÷ 30 = 66,66...",
        "Arredondamento: 67 gotas/minuto."
      ]
    },
    {
      id: "prob_4",
      category: "Diluição de Antibióticos",
      title: "Penicilina Cristalina (Frasco de 5.000.000 UI)",
      description: "Prescrição médica: Penicilina Cristalina 2.000.000 UI EV. Disponível: Frasco-ampola de 5.000.000 UI reconstituído com 8 mL de água destilada (o pó ocupa 2 mL, volume final de 10 mL).",
      solutionName: "Penicilina Cristalina 5.000.000 UI",
      volume: "Reconstituir p/ 10 mL",
      route: "Intravenosa (IV)",
      time: "Horário prescrito",
      device: "Seringa",
      question: "Se adicionarmos 8 mL de AD (totalizando 10 mL com os 2 mL do pó), quantos mL devemos aspirar para a dose de 2.000.000 UI?",
      formulaHint: "Regra de três: 5.000.000 UI = 10 mL, logo 2.000.000 UI = X.",
      correctResult: "4",
      answerUnit: "mL",
      answer: { value: 4, unit: "mL", kind: "decimal", decimals: 1 },
      options: buildOptions([
        { value: "4", text: "4,0 mL", isCorrect: true, rationale: "5.000.000 UI = 10 mL → 2.000.000 UI = 4 mL." },
        { value: "3.2", text: "3,2 mL", isCorrect: false, rationale: "Calculou sobre 8 mL ignorando que o pó ocupa 2 mL (subdosagem)." },
        { value: "2.5", text: "2,5 mL", isCorrect: false, rationale: "Erro na proporção de 5 por 2." },
        { value: "5", text: "5,0 mL", isCorrect: false, rationale: "Superdosagem (2.500.000 UI)." }
      ]),
      explanationSteps: [
        "Soluto (pó) = 2 mL. Adicionando 8 mL de diluente = 10 mL total.",
        "Proporção: 5.000.000 UI --- 10 mL | 2.000.000 UI --- X mL",
        "Cálculo: X = (2.000.000 × 10) ÷ 5.000.000 = 4 mL."
      ]
    },
    {
      id: "prob_5",
      category: "Anticoagulação & Alta Vigilância",
      highAlert: true,
      title: "Heparina Sódica Contínua em UTI",
      description: "Prescrição: Heparina 800 UI/h IV contínua. Preparo: SF 0,9% 245 mL + 25.000 UI Heparina (5 mL de 5.000 UI/mL) = 250 mL (100 UI/mL).",
      solutionName: "Heparina 25.000 UI em 250 mL SF 0,9%",
      volume: "250 mL (100 UI/mL)",
      route: "Intravenosa Contínua (IV)",
      time: "Contínuo",
      device: "Bomba de Infusão (BIC)",
      question: "Qual vazão em mL/h deve ser programada na BIC?",
      formulaHint: "Vazão (mL/h) = Dose (UI/h) ÷ Concentração (UI/mL)",
      correctResult: "8",
      answerUnit: "mL/h",
      answer: { value: 8, unit: "mL/h", kind: "decimal", decimals: 1 },
      options: buildOptions([
        { value: "8", text: "8,0 mL/h", isCorrect: true, rationale: "800 UI/h ÷ 100 UI/mL = 8 mL/h." },
        { value: "80", text: "80 mL/h", isCorrect: false, rationale: "Erro de 10x! Risco de hemorragia fatal." },
        { value: "12.5", text: "12,5 mL/h", isCorrect: false, rationale: "Inversão na razão da solução." },
        { value: "4", text: "4,0 mL/h", isCorrect: false, rationale: "Subdosagem com risco de trombose." }
      ]),
      explanationSteps: [
        "Concentração: 25.000 UI ÷ 250 mL = 100 UI/mL.",
        "Dose prescrita: 800 UI/h.",
        "Cálculo: 800 ÷ 100 = 8 mL/h."
      ]
    },
    {
      id: "prob_6",
      category: "Corticoterapia & Emergência",
      title: "Hidrocortisona em Crise Asmática",
      description: "Prescrição: Hidrocortisona 150 mg EV. Disponível: Frasco-ampola de 500 mg e diluente de 5 mL.",
      solutionName: "Hidrocortisona 500 mg",
      volume: "5 mL após reconstituição",
      route: "Intravenosa (IV)",
      time: "STAT",
      device: "Seringa",
      question: "Quantos mL devem ser aspirados para a dose de 150 mg?",
      formulaHint: "500 mg --- 5 mL | 150 mg --- X mL",
      correctResult: "1.5",
      answerUnit: "mL",
      answer: { value: 1.5, unit: "mL", kind: "decimal", decimals: 1 },
      options: buildOptions([
        { value: "1.5", text: "1,5 mL", isCorrect: true, rationale: "500 mg = 5 mL (100 mg/mL). 150 mg ÷ 100 mg/mL = 1,5 mL." },
        { value: "3", text: "3,0 mL", isCorrect: false, rationale: "Dose dobrada (300 mg)." },
        { value: "1", text: "1,0 mL", isCorrect: false, rationale: "Subdosagem (100 mg)." },
        { value: "0.75", text: "0,75 mL", isCorrect: false, rationale: "Erro na razão decimal." }
      ]),
      explanationSteps: [
        "Concentração: 500 mg em 5 mL = 100 mg/mL.",
        "Proporção: 500 mg = 5 mL | 150 mg = X mL",
        "Cálculo: X = (150 × 5) ÷ 500 = 1,5 mL."
      ]
    },
    {
      id: "prob_7",
      category: "Drogas Vasoativas",
      highAlert: true,
      title: "Noradrenalina em Choque Séptico",
      description: "Prescrição: Noradrenalina 16 mg em SF 0,9% 234 mL, total 250 mL (64 mcg/mL). Vazão atual: 12 mL/h em BIC.",
      solutionName: "Noradrenalina 16 mg em 250 mL",
      volume: "250 mL (64 mcg/mL)",
      route: "Intravenosa (Acesso Central)",
      time: "Contínuo",
      device: "BIC",
      question: "Quantos mcg/min o paciente está recebendo?",
      formulaHint: "Dose (mcg/min) = [Vazão (mL/h) × Conc (mcg/mL)] ÷ 60",
      correctResult: "12.8",
      answerUnit: "mcg/min",
      answer: { value: 12.8, unit: "mcg/min", kind: "decimal", decimals: 1 },
      options: buildOptions([
        { value: "12.8", text: "12,8 mcg/min", isCorrect: true, rationale: "12 mL/h × 64 mcg/mL = 768 mcg/h. 768 ÷ 60 = 12,8 mcg/min." },
        { value: "768", text: "768 mcg/min", isCorrect: false, rationale: "Dose por HORA, não por minuto." },
        { value: "6.4", text: "6,4 mcg/min", isCorrect: false, rationale: "Cálculo para metade da vazão." },
        { value: "25.6", text: "25,6 mcg/min", isCorrect: false, rationale: "Erro no fator de conversão temporal." }
      ]),
      explanationSteps: [
        "Concentração: 16.000 mcg ÷ 250 mL = 64 mcg/mL.",
        "Dose por hora: 12 mL/h × 64 mcg/mL = 768 mcg/h.",
        "Dose por minuto: 768 ÷ 60 = 12,8 mcg/min."
      ]
    },
    {
      id: "prob_8",
      category: "Eletrólitos",
      highAlert: true,
      title: "Cloreto de Potássio 10% (Reposição)",
      description: "Prescrição: KCl 10% 20 mL + SF 0,9% 500 mL para 4 horas. Apresentação: KCl 10% 10 mL (13,4 mEq K+).",
      solutionName: "SF 500 mL + KCl 10% 20 mL",
      volume: "520 mL total",
      route: "Intravenosa",
      time: "4 horas",
      device: "Macrogotas",
      question: "Qual o gotejamento em gotas/min?",
      formulaHint: "Gotas/min = Volume Total (mL) ÷ (Tempo (h) × 3)",
      correctResult: "43",
      answerUnit: "gts/min",
      answer: { value: 43, unit: "gts/min", kind: "integer" },
      options: buildOptions([
        { value: "43", text: "43 gotas/minuto", isCorrect: true, rationale: "520 ÷ (4 × 3) = 43,33 → 43 gts/min." },
        { value: "42", text: "42 gotas/minuto", isCorrect: false, rationale: "Esqueceu os 20 mL de KCl (calculou só 500 mL)." },
        { value: "130", text: "130 gotas/minuto", isCorrect: false, rationale: "Taxa em microgotas ou mL/h." },
        { value: "22", text: "22 gotas/minuto", isCorrect: false, rationale: "Cálculo para 8h." }
      ]),
      explanationSteps: [
        "Volume total = 500 mL SF + 20 mL KCl = 520 mL.",
        "Tempo = 4 horas. Fórmula: V / (T × 3)",
        "Cálculo: 520 ÷ 12 = 43,33...",
        "Resposta: 43 gotas/minuto."
      ]
    },
    {
      id: "prob_9",
      category: "Pediátrico",
      title: "Amoxicilina Suspensão",
      description: "Prescrição: Amoxicilina 50 mg/kg/dia em 3 tomadas (8/8h). Criança: 12 kg. Disponível: 250 mg / 5 mL.",
      solutionName: "Amoxicilina 250 mg / 5 mL",
      volume: "5 mL (50 mg/mL)",
      route: "Oral",
      time: "8/8h",
      device: "Seringa",
      question: "Quantos mL por tomada?",
      formulaHint: "Dose Unitária (mg) = (50 × 12) ÷ 3. Volume = Dose ÷ Conc.",
      correctResult: "4",
      answerUnit: "mL",
      answer: { value: 4, unit: "mL", kind: "decimal", decimals: 1 },
      options: buildOptions([
        { value: "4", text: "4,0 mL", isCorrect: true, rationale: "Dose unitária = 200 mg. 200 mg ÷ 50 mg/mL = 4,0 mL." },
        { value: "12", text: "12,0 mL", isCorrect: false, rationale: "Calculou a dose diária total em uma tomada (intoxicação)." },
        { value: "2.5", text: "2,5 mL", isCorrect: false, rationale: "Subdosagem (125 mg)." },
        { value: "6", text: "6,0 mL", isCorrect: false, rationale: "Dividiu a dose diária por 2 tomadas (300 mg) em vez de 3." }
      ]),
      explanationSteps: [
        "Dose diária: 50 mg/kg × 12 kg = 600 mg.",
        "Dose por tomada (3x): 600 ÷ 3 = 200 mg.",
        "Volume (50 mg/mL): 200 ÷ 50 = 4 mL."
      ]
    },
    {
      id: "prob_10",
      category: "Diluição",
      title: "Oxacilina 500mg EV",
      description: "Prescrição: Oxacilina 500 mg. Disponível: frasco de 1g e diluente de 5 mL.",
      solutionName: "Oxacilina 1g",
      volume: "5 mL",
      route: "IV",
      time: "4/4h",
      device: "Seringa",
      question: "Quantos mL para 500 mg?",
      formulaHint: "1000 mg --- 5 mL | 500 mg --- X mL",
      correctResult: "2.5",
      answerUnit: "mL",
      answer: { value: 2.5, unit: "mL", kind: "decimal", decimals: 1 },
      options: buildOptions([
        { value: "2.5", text: "2,5 mL", isCorrect: true, rationale: "1000 mg = 5 mL → 500 mg = 2,5 mL." },
        { value: "5", text: "5,0 mL", isCorrect: false, rationale: "Frasco inteiro (1000 mg)." },
        { value: "1.25", text: "1,25 mL", isCorrect: false, rationale: "Subdosagem (250 mg)." },
        { value: "3.5", text: "3,5 mL", isCorrect: false, rationale: "Erro de proporção." }
      ]),
      explanationSteps: [
        "Concentração: 1000 mg em 5 mL = 200 mg/mL.",
        "Dose prescrita: 500 mg.",
        "Cálculo: 500 ÷ 200 = 2,5 mL."
      ]
    },
    {
      id: "prob_11",
      category: "Gotejamento",
      title: "Paracetamol 15 min",
      description: "Prescrição: Paracetamol 100 mL para correr em 15 minutos via macrogotas.",
      solutionName: "Paracetamol 100 mL",
      volume: "100 mL",
      route: "IV",
      time: "15 min",
      device: "Macrogotas",
      question: "Gotas/min?",
      formulaHint: "Gotas/min = (V × 20) ÷ T(min)",
      correctResult: "133",
      answerUnit: "gts/min",
      answer: { value: 133, unit: "gts/min", kind: "integer" },
      options: buildOptions([
        { value: "133", text: "133 gotas/minuto", isCorrect: true, rationale: "(100 × 20) ÷ 15 = 133,33 → 133 gts/min." },
        { value: "400", text: "400 gotas/minuto", isCorrect: false, rationale: "Taxa em microgotas/min." },
        { value: "67", text: "67 gotas/minuto", isCorrect: false, rationale: "Cálculo para 30 min." },
        { value: "20", text: "20 gotas/minuto", isCorrect: false, rationale: "Fórmula incorreta." }
      ]),
      explanationSteps: [
        "Variáveis: 100 mL | 15 min | Fator 20 (macro).",
        "Cálculo: (100 × 20) ÷ 15 = 133,33.",
        "Resposta: 133 gotas/min."
      ]
    },
    {
      id: "prob_12",
      category: "Insulina",
      highAlert: true,
      title: "Insulina Regular (CAD)",
      description: "Dose: 0,1 UI/kg/h. Paciente: 70 kg. Solução: 100 UI em 100 mL (1 UI/mL).",
      solutionName: "Insulina 1 UI/mL",
      volume: "100 mL",
      route: "BIC",
      time: "Contínuo",
      device: "BIC",
      question: "Vazão em mL/h?",
      formulaHint: "mL/h = [0,1 × Peso] ÷ Conc (UI/mL)",
      correctResult: "7",
      answerUnit: "mL/h",
      answer: { value: 7, unit: "mL/h", kind: "decimal", decimals: 1 },
      options: buildOptions([
        { value: "7", text: "7,0 mL/h", isCorrect: true, rationale: "0,1 × 70 kg = 7 UI/h. 7 UI ÷ 1 UI/mL = 7 mL/h." },
        { value: "70", text: "70 mL/h", isCorrect: false, rationale: "Erro de 10x! Risco de hipoglicemia severa." },
        { value: "14", text: "14 mL/h", isCorrect: false, rationale: "Dose dobrada." },
        { value: "3.5", text: "3,5 mL/h", isCorrect: false, rationale: "Subinfusão prolongando acidose." }
      ]),
      explanationSteps: [
        "Dose necessária: 0,1 UI/kg/h × 70 kg = 7 UI/h.",
        "Concentração: 1 UI/mL.",
        "Vazão: 7 ÷ 1 = 7 mL/h."
      ]
    },
    {
      id: "prob_13",
      category: "Pediátrico",
      title: "Hidratação Holliday-Segar",
      description: "Prescrição: 1200 mL em 24h via microgotas.",
      solutionName: "Holliday-Segar",
      volume: "1200 mL",
      route: "IV",
      time: "24h",
      device: "Microgotas",
      question: "Taxa em mgts/min?",
      formulaHint: "Microgotas/min = Volume ÷ Tempo(h)",
      correctResult: "50",
      answerUnit: "mcgts/min",
      answer: { value: 50, unit: "mcgts/min", kind: "integer" },
      options: buildOptions([
        { value: "50", text: "50 microgotas/minuto", isCorrect: true, rationale: "1200 ÷ 24 = 50 mgts/min." },
        { value: "17", text: "17 microgotas/minuto", isCorrect: false, rationale: "Taxa para macrogotas." },
        { value: "25", text: "25 microgotas/minuto", isCorrect: false, rationale: "Cálculo para 48h." },
        { value: "100", text: "100 microgotas/minuto", isCorrect: false, rationale: "Hiperinfusão." }
      ]),
      explanationSteps: [
        "Volume: 1200 mL | Tempo: 24h | Microgotas.",
        "Fórmula: V / T",
        "Cálculo: 1200 ÷ 24 = 50 microgotas/min."
      ]
    },
    {
      id: "prob_14",
      category: "Vancomicina",
      highAlert: true,
      title: "Vancomicina 2h",
      description: "Prescrição: 1g em 200 mL SF para correr em 2 horas via macrogotas.",
      solutionName: "Vancomicina 1g",
      volume: "200 mL",
      route: "IV",
      time: "2h",
      device: "Macrogotas",
      question: "Gotas/min?",
      formulaHint: "Gotas/min = V ÷ (T × 3)",
      correctResult: "33",
      answerUnit: "gts/min",
      answer: { value: 33, unit: "gts/min", kind: "integer" },
      options: buildOptions([
        { value: "33", text: "33 gotas/minuto", isCorrect: true, rationale: "200 ÷ (2 × 3) = 33,33 → 33 gts/min." },
        { value: "100", text: "100 gotas/minuto", isCorrect: false, rationale: "Taxa em microgotas ou mL/h (infusão rápida perigosa)." },
        { value: "50", text: "50 gotas/minuto", isCorrect: false, rationale: "Erro no denominador." },
        { value: "17", text: "17 gotas/minuto", isCorrect: false, rationale: "Subinfusão (~4 horas)." }
      ]),
      explanationSteps: [
        "Volume: 200 mL | Tempo: 2h | Macrogotas.",
        "Cálculo: 200 ÷ (2 × 3) = 33,33.",
        "Resposta: 33 gotas/min."
      ]
    },
    {
      id: "prob_15",
      category: "Opioide",
      highAlert: true,
      title: "Morfina Pós-Op",
      description: "Dose: 4 mg EV. Disponível: 10 mg/mL. Rediluído p/ 10 mL (1 mg/mL).",
      solutionName: "Morfina 1 mg/mL",
      volume: "10 mL",
      route: "IV",
      time: "STAT",
      device: "Seringa",
      question: "Quantos mL para 4 mg?",
      formulaHint: "1 mg --- 1 mL → 4 mg --- X mL",
      correctResult: "4",
      answerUnit: "mL",
      answer: { value: 4, unit: "mL", kind: "decimal", decimals: 1 },
      options: buildOptions([
        { value: "4", text: "4,0 mL", isCorrect: true, rationale: "Solução 1 mg/mL: 4 mg = 4 mL." },
        { value: "0.4", text: "0,4 mL", isCorrect: false, rationale: "Volume puro sem rediluição." },
        { value: "8", text: "8,0 mL", isCorrect: false, rationale: "Dose de 8 mg (risco respiratório)." },
        { value: "2", text: "2,0 mL", isCorrect: false, rationale: "Subdose." }
      ]),
      explanationSteps: [
        "Concentração rediluída: 1 mg/mL.",
        "Dose prescrita: 4 mg.",
        "Cálculo: 4 ÷ 1 = 4 mL."
      ]
    },
    {
      id: "prob_16",
      category: "Opioide",
      highAlert: true,
      title: "Fentanil UTI",
      description: "Dose: 50 mcg/h. Solução: 2500 mcg em 250 mL (10 mcg/mL).",
      solutionName: "Fentanil 10 mcg/mL",
      volume: "250 mL",
      route: "IV",
      time: "Contínuo",
      device: "BIC",
      question: "Vazão em mL/h?",
      formulaHint: "mL/h = Dose (mcg/h) ÷ Conc (mcg/mL)",
      correctResult: "5",
      answerUnit: "mL/h",
      answer: { value: 5, unit: "mL/h", kind: "decimal", decimals: 1 },
      options: buildOptions([
        { value: "5", text: "5,0 mL/h", isCorrect: true, rationale: "50 mcg/h ÷ 10 mcg/mL = 5 mL/h." },
        { value: "50", text: "50 mL/h", isCorrect: false, rationale: "Erro de 10x! Parada respiratória." },
        { value: "2.5", text: "2,5 mL/h", isCorrect: false, rationale: "Metade da dose." },
        { value: "10", text: "10 mL/h", isCorrect: false, rationale: "Dose dobrada." }
      ]),
      explanationSteps: [
        "Concentração: 10 mcg/mL.",
        "Dose prescrita: 50 mcg/h.",
        "Vazão: 50 ÷ 10 = 5 mL/h."
      ]
    },
    {
      id: "prob_17",
      category: "Volume",
      title: "Expansão Rápida",
      description: "Prescrição: 1500 mL em 6h via macrogotas.",
      solutionName: "Ringer Lactato",
      volume: "1500 mL",
      route: "IV",
      time: "6h",
      device: "Macrogotas",
      question: "Gotas/min?",
      formulaHint: "Gotas/min = V ÷ (T × 3)",
      correctResult: "83",
      answerUnit: "gts/min",
      answer: { value: 83, unit: "gts/min", kind: "integer" },
      options: buildOptions([
        { value: "83", text: "83 gotas/minuto", isCorrect: true, rationale: "1500 ÷ 18 = 83,33 → 83 gts/min." },
        { value: "250", text: "250 gotas/minuto", isCorrect: false, rationale: "Taxa em microgotas ou mL/h." },
        { value: "63", text: "63 gotas/minuto", isCorrect: false, rationale: "1500 ÷ (8 × 3) = 62,5 → 63 (cálculo para 8h)." },
        { value: "125", text: "125 gotas/minuto", isCorrect: false, rationale: "Taxa para 4h." }
      ]),
      explanationSteps: [
        "Volume: 1500 mL | Tempo: 6h.",
        "Fórmula: 1500 ÷ (6 × 3) = 83,33.",
        "Resposta: 83 gotas/min."
      ]
    },
    {
      id: "prob_18",
      category: "Broncodilatador",
      title: "Aminofilina",
      description: "Dose: 120 mg EV. Ampola: 240 mg/10 mL (24 mg/mL).",
      solutionName: "Aminofilina 24 mg/mL",
      volume: "10 mL",
      route: "IV",
      time: "30 min",
      device: "Seringa",
      question: "Quantos mL para 120 mg?",
      formulaHint: "mL = Dose (mg) ÷ Conc (mg/mL)",
      correctResult: "5",
      answerUnit: "mL",
      answer: { value: 5, unit: "mL", kind: "decimal", decimals: 1 },
      options: buildOptions([
        { value: "5", text: "5,0 mL", isCorrect: true, rationale: "120 mg ÷ 24 mg/mL = 5,0 mL." },
        { value: "10", text: "10,0 mL", isCorrect: false, rationale: "Ampola inteira (240 mg - risco cardíaco)." },
        { value: "2.5", text: "2,5 mL", isCorrect: false, rationale: "Subdose." },
        { value: "4", text: "4,0 mL", isCorrect: false, rationale: "Erro aritmético." }
      ]),
      explanationSteps: [
        "Concentração: 24 mg/mL.",
        "Dose prescrita: 120 mg.",
        "Cálculo: 120 ÷ 24 = 5 mL."
      ]
    },
    {
      id: "prob_19",
      category: "Anticonvulsivante",
      highAlert: true,
      title: "Fenitoína (Ataque)",
      description: "Dose: 1000 mg EV. Ampola: 250 mg/5 mL.",
      solutionName: "Fenitoína 250 mg",
      volume: "5 mL",
      route: "IV",
      time: "30 min",
      device: "Ampolas",
      question: "Quantas ampolas?",
      formulaHint: "Ampolas = Dose (mg) ÷ Dose/ampola",
      correctResult: "4",
      answerUnit: "ampolas",
      answer: { value: 4, unit: "ampolas", kind: "integer" },
      options: buildOptions([
        { value: "4", text: "4 ampolas (20 mL)", isCorrect: true, rationale: "1000 mg ÷ 250 mg/ampola = 4 ampolas." },
        { value: "2", text: "2 ampolas", isCorrect: false, rationale: "Subdose (500 mg)." },
        { value: "5", text: "5 ampolas", isCorrect: false, rationale: "Superdosagem (1250 mg)." },
        { value: "3", text: "3 ampolas", isCorrect: false, rationale: "Subdose." }
      ]),
      explanationSteps: [
        "Dose por ampola: 250 mg.",
        "Dose total: 1000 mg.",
        "Cálculo: 1000 ÷ 250 = 4 ampolas."
      ]
    },
    {
      id: "prob_20",
      category: "Bipiridinas & Inotrópicos",
      highAlert: true,
      title: "Milrinona",
      description: "Dose: 0,5 mcg/kg/min. Peso: 60 kg. Solução: 200 mcg/mL.",
      solutionName: "Milrinona 200 mcg/mL",
      volume: "100 mL",
      route: "IV",
      time: "Contínuo",
      device: "BIC",
      question: "Vazão em mL/h?",
      formulaHint: "mL/h = [mcg/kg/min × Peso × 60] ÷ Conc (mcg/mL)",
      correctResult: "9",
      answerUnit: "mL/h",
      answer: { value: 9, unit: "mL/h", kind: "decimal", decimals: 1 },
      options: buildOptions([
        { value: "9", text: "9,0 mL/h", isCorrect: true, rationale: "0,5 × 60 × 60 = 1800 mcg/h. 1800 ÷ 200 = 9 mL/h." },
        { value: "18", text: "18,0 mL/h", isCorrect: false, rationale: "Dose dobrada (taquiarritmia)." },
        { value: "4.5", text: "4,5 mL/h", isCorrect: false, rationale: "Metade da dose." },
        { value: "1.5", text: "1,5 mL/h", isCorrect: false, rationale: "Esqueceu de multiplicar por 60 (min → h)." }
      ]),
      explanationSteps: [
        "Dose por minuto: 0,5 × 60 = 30 mcg/min.",
        "Dose por hora: 30 × 60 = 1800 mcg/h.",
        "Vazão: 1800 ÷ 200 = 9 mL/h."
      ]
    }
  ];
}
