/**
 * proceduralDosageGenerator.js
 * 
 * Motor de Geração Procedural Infinito de Cálculos Farmacêuticos & Doses
 * Padrão Duolingo Nursing Engine:
 * - Algoritmo Fisher-Yates para embaralhamento das alternativas (A, B, C, D)
 * - Distratores matemáticos baseados em erros cognitivos reais da enfermagem
 * - Memória de cálculo detalhada passo a passo para o Preceptor Goti
 */

/**
 * Embaralhamento Fisher-Yates (Knuth Shuffle) com garantia de distribuição uniforme
 */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Atribui as letras A, B, C, D e identifica a opção correta
 */
function formatAndShuffleOptions(rawOptions) {
  const shuffled = shuffleArray(rawOptions);
  const letters = ["A", "B", "C", "D"];
  return shuffled.map((opt, idx) => ({
    ...opt,
    letter: letters[idx],
    id: `opt_${letters[idx].toLowerCase()}`
  }));
}

/**
 * 1. Gerador de Macrogotas em Horas
 * Fórmula: Gotas/min = Volume (mL) / (Tempo (h) * 3)
 */
function generateMacrogotasHoras() {
  const volumes = [250, 500, 1000, 1500, 2000];
  const times = [4, 6, 8, 12, 24];
  const solutions = [
    "Soro Fisiológico 0,9%",
    "Soro Glicosado 5%",
    "Ringer com Lactato",
    "Soro Glicofisiológico"
  ];

  const vol = volumes[Math.floor(Math.random() * volumes.length)];
  const time = times[Math.floor(Math.random() * times.length)];
  const solution = solutions[Math.floor(Math.random() * solutions.length)];

  const rawResult = vol / (time * 3);
  const correct = Math.round(rawResult);

  // Distratores baseados em falhas cognitivas reais:
  // 1. Esqueceu a constante 3 (calculou microgotas = V / T)
  const distractor1 = Math.round(vol / time);
  // 2. Errou a constante (usou 2 ou multiplicou por 20 como se fosse minutos)
  const distractor2 = Math.round(vol / (time * 2));
  // 3. Arredondou truncando sem arredondar para cima ou pequena variação
  let distractor3 = Math.floor(rawResult);
  if (distractor3 === correct || distractor3 === distractor1 || distractor3 === distractor2) {
    distractor3 = correct + (correct > 10 ? 3 : 2);
  }

  // Garantir que todos os distratores sejam distintos do correto e entre si
  const setVals = new Set([correct]);
  const ensureUnique = (val, fallback) => {
    let curr = val;
    while (setVals.has(curr) || curr <= 0) {
      curr += fallback;
    }
    setVals.add(curr);
    return curr;
  };

  const d1 = ensureUnique(distractor1, 5);
  const d2 = ensureUnique(distractor2, 3);
  const d3 = ensureUnique(distractor3, 4);

  const rawOptions = [
    {
      value: String(correct),
      text: `${correct} gotas/minuto`,
      isCorrect: true,
      rationale: `Correto! V ÷ (T × 3) = ${vol} ÷ (${time} × 3) = ${vol} ÷ ${time * 3} = ${rawResult.toFixed(2)} → arredonda para ${correct} gts/min.`
    },
    {
      value: String(d1),
      text: `${d1} gotas/minuto`,
      isCorrect: false,
      rationale: `Incorreto. Esse valor corresponde ao cálculo de microgotas (V ÷ T), sem aplicar a constante 3 para macrogotas.`
    },
    {
      value: String(d2),
      text: `${d2} gotas/minuto`,
      isCorrect: false,
      rationale: `Incorreto. Constante de equipo incorreta aplicada no denominador.`
    },
    {
      value: String(d3),
      text: `${d3} gotas/minuto`,
      isCorrect: false,
      rationale: `Incorreto. Erro na regra de arredondamento ou na divisão do tempo.`
    }
  ];

  const options = formatAndShuffleOptions(rawOptions);

  return {
    id: `proc_macro_h_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    category: "Macrogotas / Horas",
    title: `Infusão de ${solution} ${vol} mL em ${time}h`,
    description: `Prescrição médica: ${solution} ${vol} mL para correr por via intravenosa durante ${time} horas, utilizando equipo comum de macrogotas.`,
    solutionName: solution,
    volume: `${vol} mL`,
    route: "Intravenosa (IV)",
    time: `${time} horas`,
    device: "Equipo de Macrogotas",
    question: "Quantas gotas por minuto (gts/min) deverão ser administradas?",
    formulaHint: "Gotas/min = Volume (mL) ÷ (Tempo (h) × 3)",
    correctResult: String(correct),
    options,
    explanationSteps: [
      `Variáveis identificadas: Volume = ${vol} mL | Tempo = ${time} horas`,
      `Equipo macrogotas com tempo em horas: Gotas/min = V ÷ (T × 3)`,
      `Cálculo: ${vol} ÷ (${time} × 3) = ${vol} ÷ ${time * 3} = ${rawResult.toFixed(2)}...`,
      `Regra de arredondamento: Arredonda-se para ${correct} gotas/minuto.`
    ]
  };
}

/**
 * 2. Gerador de Microgotas em Horas
 * Fórmula: Microgotas/min = Volume (mL) / Tempo (h)
 */
function generateMicrogotasHoras() {
  const volumes = [100, 250, 500, 750, 1000];
  const times = [4, 6, 8, 12, 24];
  const solutions = [
    "Soro Glicosado 5%",
    "Soro Fisiológico 0,9%",
    "Soro Glicofisiológico 1:1"
  ];

  const vol = volumes[Math.floor(Math.random() * volumes.length)];
  const time = times[Math.floor(Math.random() * times.length)];
  const solution = solutions[Math.floor(Math.random() * solutions.length)];

  const rawResult = vol / time;
  const correct = Math.round(rawResult);

  // Distratores:
  // 1. Calculou macrogotas: V / (T * 3)
  const distractor1 = Math.round(vol / (time * 3));
  // 2. Dividiu por 60 (confundiu com minutos)
  const distractor2 = Math.round(vol / 60) || (correct + 12);
  // 3. Multiplicou ou erro numérico
  const distractor3 = correct + (correct > 20 ? 8 : 4);

  const setVals = new Set([correct]);
  const ensureUnique = (val, fallback) => {
    let curr = val;
    while (setVals.has(curr) || curr <= 0) {
      curr += fallback;
    }
    setVals.add(curr);
    return curr;
  };

  const d1 = ensureUnique(distractor1, 4);
  const d2 = ensureUnique(distractor2, 6);
  const d3 = ensureUnique(distractor3, 5);

  const rawOptions = [
    {
      value: String(correct),
      text: `${correct} microgotas/minuto`,
      isCorrect: true,
      rationale: `Correto! Para microgotas com tempo em horas: Microgotas/min = Volume ÷ Tempo = ${vol} ÷ ${time} = ${rawResult.toFixed(2)} → ${correct} mgts/min.`
    },
    {
      value: String(d1),
      text: `${d1} microgotas/minuto`,
      isCorrect: false,
      rationale: `Incorreto. Você aplicou a fórmula de macrogotas (V ÷ (T × 3)) em vez da fórmula de microgotas.`
    },
    {
      value: String(d2),
      text: `${d2} microgotas/minuto`,
      isCorrect: false,
      rationale: `Incorreto. Confusão com fator de conversão de minutos.`
    },
    {
      value: String(d3),
      text: `${d3} microgotas/minuto`,
      isCorrect: false,
      rationale: `Incorreto. Valor fora da taxa correta de infusão.`
    }
  ];

  const options = formatAndShuffleOptions(rawOptions);

  return {
    id: `proc_micro_h_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    category: "Microgotas / Horas",
    title: `Infusão Pediátrica/Cardiológica: ${solution} ${vol} mL em ${time}h`,
    description: `Prescrição médica: ${solution} ${vol} mL EV para correr em ${time} horas contínuas em equipo de microgotas.`,
    solutionName: solution,
    volume: `${vol} mL`,
    route: "Intravenosa (IV)",
    time: `${time} horas`,
    device: "Equipo de Microgotas",
    question: "Qual deve ser a taxa de infusão em microgotas por minuto (mgts/min)?",
    formulaHint: "Microgotas/min = Volume (mL) ÷ Tempo (h)",
    correctResult: String(correct),
    options,
    explanationSteps: [
      `Variáveis: Volume = ${vol} mL | Tempo = ${time} horas`,
      `Fórmula de microgotas/hora: Microgotas/min = V ÷ T`,
      `Cálculo: ${vol} ÷ ${time} = ${rawResult.toFixed(2)}...`,
      `Taxa final: ${correct} microgotas/minuto (numericamente igual a ${correct} mL/h em BIC).`
    ]
  };
}

/**
 * 3. Gerador de Macrogotas em Minutos
 * Fórmula: Gotas/min = (Volume * 20) / Tempo (min)
 */
function generateMacrogotasMinutos() {
  const volumes = [50, 100, 150, 200, 250];
  const minutes = [15, 20, 30, 40, 45, 60];
  const drugs = [
    "Metronidazol 500mg",
    "Ciprofloxacino 400mg",
    "Paracetamol 1000mg",
    "Ceftriaxona 1g em SF 100mL"
  ];

  const vol = volumes[Math.floor(Math.random() * volumes.length)];
  const min = minutes[Math.floor(Math.random() * minutes.length)];
  const drug = drugs[Math.floor(Math.random() * drugs.length)];

  const rawResult = (vol * 20) / min;
  const correct = Math.round(rawResult);

  // Distratores:
  // 1. Usou microgotas: (vol * 60) / min
  const distractor1 = Math.round((vol * 60) / min);
  // 2. Esqueceu a constante 20: vol / min
  const distractor2 = Math.round(vol / min);
  // 3. Misturou fórmula de horas: vol / (min * 3)
  const distractor3 = Math.round((vol * 20) / (min * 3)) || (correct + 14);

  const setVals = new Set([correct]);
  const ensureUnique = (val, fallback) => {
    let curr = val;
    while (setVals.has(curr) || curr <= 0) {
      curr += fallback;
    }
    setVals.add(curr);
    return curr;
  };

  const d1 = ensureUnique(distractor1, 8);
  const d2 = ensureUnique(distractor2, 6);
  const d3 = ensureUnique(distractor3, 7);

  const rawOptions = [
    {
      value: String(correct),
      text: `${correct} gotas/minuto`,
      isCorrect: true,
      rationale: `Correto! Tempo em minutos com macrogotas: Gotas/min = (V × 20) ÷ T(min) = (${vol} × 20) ÷ ${min} = ${vol * 20} ÷ ${min} = ${rawResult.toFixed(2)} → ${correct} gts/min.`
    },
    {
      value: String(d1),
      text: `${d1} gotas/minuto`,
      isCorrect: false,
      rationale: `Incorreto. Você multiplicou por 60 (fator de microgotas) em vez de 20 (macrogotas).`
    },
    {
      value: String(d2),
      text: `${d2} gotas/minuto`,
      isCorrect: false,
      rationale: `Incorreto. Esqueceu de multiplicar o volume por 20 (cada mL tem 20 gotas).`
    },
    {
      value: String(d3),
      text: `${d3} gotas/minuto`,
      isCorrect: false,
      rationale: `Incorreto. Fórmula de tempo em minutos aplicada incorretamente.`
    }
  ];

  const options = formatAndShuffleOptions(rawOptions);

  return {
    id: `proc_macro_min_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    category: "Macrogotas / Minutos",
    title: `Infusão Curta: ${drug} em ${min} minutos`,
    description: `Prescrição médica: ${drug} diluído em bolsa com volume total de ${vol} mL para infundir rapidamente em ${min} minutos via equipo de macrogotas.`,
    solutionName: drug,
    volume: `${vol} mL`,
    route: "Intravenosa (IV)",
    time: `${min} minutos`,
    device: "Equipo de Macrogotas",
    question: "Quantas gotas por minuto devem ser reguladas no equipo?",
    formulaHint: "Gotas/min = (Volume × 20) ÷ Tempo (minutos)",
    correctResult: String(correct),
    options,
    explanationSteps: [
      `Atenção: o tempo foi prescrito em MINUTOS (${min} min).`,
      `Fórmula para tempo em minutos: Gotas/min = (V × 20) ÷ T(min)`,
      `Cálculo: (${vol} × 20) ÷ ${min} = ${vol * 20} ÷ ${min} = ${rawResult.toFixed(2)}...`,
      `Taxa arredondada: ${correct} gotas/minuto.`
    ]
  };
}

/**
 * 4. Gerador de Bomba de Infusão Contínua (BIC) e Drogas Críticas
 * Exemplo: Heparina, Noradrenalina, Nitroglicerina
 */
function generateBicInfusion() {
  const cases = [
    {
      drug: "Heparina Sódica",
      totalDose: 25000, // UI
      totalUnit: "UI",
      bagVolume: 250, // mL
      prescribedDoses: [500, 750, 800, 1000, 1250], // UI/h
      unitRate: "UI/h"
    },
    {
      drug: "Nitroglicerina (Tridil)",
      totalDose: 50, // mg
      totalUnit: "mg",
      bagVolume: 250, // mL
      prescribedDoses: [5, 10, 15, 20], // mg/h (ou vazão direta)
      unitRate: "mg/h"
    },
    {
      drug: "Cloreto de Potássio (KCl 10%) em SF",
      totalDose: 40, // mEq
      totalUnit: "mEq",
      bagVolume: 500, // mL
      prescribedDoses: [10, 20], // mEq/h
      unitRate: "mEq/h"
    }
  ];

  const selectedCase = cases[Math.floor(Math.random() * cases.length)];
  const prescribed = selectedCase.prescribedDoses[Math.floor(Math.random() * selectedCase.prescribedDoses.length)];

  // Concentração por mL: totalDose / bagVolume
  const concentration = selectedCase.totalDose / selectedCase.bagVolume;
  // Vazão em mL/h: prescribed / concentration
  const rawMlPerHour = prescribed / concentration;
  const correct = Number(rawMlPerHour.toFixed(1));

  // Distratores:
  // 1. Inverteu divisão: concentration / prescribed
  const distractor1 = Number((concentration / prescribed * 100).toFixed(1)) || 5;
  // 2. Errou a concentração em 10x
  const distractor2 = Number((correct * 10).toFixed(1));
  // 3. Metade ou dobro
  const distractor3 = Number((correct * 0.5).toFixed(1));

  const setVals = new Set([correct]);
  const ensureUnique = (val, fallback) => {
    let curr = val;
    while (setVals.has(curr) || curr <= 0) {
      curr = Number((curr + fallback).toFixed(1));
    }
    setVals.add(curr);
    return curr;
  };

  const d1 = ensureUnique(distractor1, 2.5);
  const d2 = ensureUnique(distractor2, 4);
  const d3 = ensureUnique(distractor3, 3);

  const rawOptions = [
    {
      value: String(correct),
      text: `${correct} mL/h`,
      isCorrect: true,
      rationale: `Correto! Concentração = ${selectedCase.totalDose} ${selectedCase.totalUnit} ÷ ${selectedCase.bagVolume} mL = ${concentration} ${selectedCase.totalUnit}/mL. Vazão = ${prescribed} ÷ ${concentration} = ${correct} mL/h.`
    },
    {
      value: String(d1),
      text: `${d1} mL/h`,
      isCorrect: false,
      rationale: `Incorreto. Erro na montagem da proporção direta ou inversão da razão concentração/dose.`
    },
    {
      value: String(d2),
      text: `${d2} mL/h`,
      isCorrect: false,
      rationale: `Incorreto. Erro de casa decimal na concentração (risco de superdosagem de 10x!).`
    },
    {
      value: String(d3),
      text: `${d3} mL/h`,
      isCorrect: false,
      rationale: `Incorreto. Vazão resultaria em subdosagem terapêutica do fármaco.`
    }
  ];

  const options = formatAndShuffleOptions(rawOptions);

  return {
    id: `proc_bic_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    category: "Bomba de Infusão (BIC)",
    title: `Infusão Contínua: ${selectedCase.drug} (${prescribed} ${selectedCase.unitRate})`,
    description: `Prescrição médica: ${selectedCase.drug} na dose de ${prescribed} ${selectedCase.unitRate} em infusão contínua. Solução preparada: ${selectedCase.totalDose} ${selectedCase.totalUnit} diluídos em volume total de ${selectedCase.bagVolume} mL.`,
    solutionName: `${selectedCase.drug} em ${selectedCase.bagVolume} mL`,
    volume: `${selectedCase.bagVolume} mL`,
    route: "Intravenosa Contínua (IV)",
    time: "Contínuo",
    device: "Bomba de Infusão Contínua (BIC)",
    question: `Qual vazão em mL/h deve ser programada na Bomba de Infusão Contínua (BIC)?`,
    formulaHint: `Concentração = Dose total ÷ Volume total. Vazão (mL/h) = Dose prescrita ÷ Concentração.`,
    correctResult: String(correct),
    options,
    explanationSteps: [
      `1. Determine a concentração: ${selectedCase.totalDose} ${selectedCase.totalUnit} ÷ ${selectedCase.bagVolume} mL = ${concentration} ${selectedCase.totalUnit}/mL.`,
      `2. Dose prescrita pelo médico: ${prescribed} ${selectedCase.unitRate}.`,
      `3. Regra de três: se 1 mL contém ${concentration} ${selectedCase.totalUnit}, quantos mL contêm ${prescribed} ${selectedCase.totalUnit}?`,
      `4. Vazão = ${prescribed} ÷ ${concentration} = ${correct} mL/h.`
    ]
  };
}

/**
 * 5. Gerador de Penicilina Cristalina (Soluto 2 mL vs 4 mL)
 */
function generatePenicilinaCristalina() {
  const is5M = Math.random() > 0.5;
  const totalUI = is5M ? 5000000 : 10000000;
  const soluteVolume = is5M ? 2 : 4; // mL ocupados pelo pó
  const addedDiluent = is5M ? 8 : 6; // mL de AD adicionados
  const totalSolution = soluteVolume + addedDiluent; // 10 mL

  const prescribedDoses = is5M
    ? [1000000, 1500000, 2000000, 2500000, 3000000]
    : [2000000, 2500000, 4000000, 5000000];

  const prescribed = prescribedDoses[Math.floor(Math.random() * prescribedDoses.length)];

  // Cálculo correto considerando soluto (volume final = 10 mL):
  // totalUI --- 10 mL
  // prescribed --- X mL
  const correctRaw = (prescribed * totalSolution) / totalUI;
  const correct = Number(correctRaw.toFixed(1));

  // Distrator 1: Esqueceu o soluto de 2 mL e considerou só a água adicionada (8 mL ou 6 mL)
  const distractor1 = Number(((prescribed * addedDiluent) / totalUI).toFixed(1));
  // Distrator 2: Considerou que o pó somou aos 10 mL de AD (volume total = 12 mL ou 14 mL)
  const distractor2 = Number(((prescribed * (10 + soluteVolume)) / totalUI).toFixed(1));
  // Distrator 3: Dobro ou metade
  const distractor3 = Number((correct * 1.5).toFixed(1));

  const setVals = new Set([correct]);
  const ensureUnique = (val, fallback) => {
    let curr = val;
    while (setVals.has(curr) || curr <= 0) {
      curr = Number((curr + fallback).toFixed(1));
    }
    setVals.add(curr);
    return curr;
  };

  const d1 = ensureUnique(distractor1, 1);
  const d2 = ensureUnique(distractor2, 1.5);
  const d3 = ensureUnique(distractor3, 2);

  const rawOptions = [
    {
      value: String(correct),
      text: `${correct} mL`,
      isCorrect: true,
      rationale: `Correto! O pó liofilizado de Penicilina ${is5M ? "5.000.000 UI" : "10.000.000 UI"} ocupa ${soluteVolume} mL de soluto. Ao adicionar ${addedDiluent} mL de AD, o volume total fica em 10 mL. Proporção: ${totalUI.toLocaleString("pt-BR")} UI = 10 mL → ${prescribed.toLocaleString("pt-BR")} UI = ${correct} mL.`
    },
    {
      value: String(d1),
      text: `${d1} mL`,
      isCorrect: false,
      rationale: `Incorreto. Você calculou considerando apenas os ${addedDiluent} mL de diluente adicionado, esquecendo que o pó ocupa ${soluteVolume} mL de soluto!`
    },
    {
      value: String(d2),
      text: `${d2} mL`,
      isCorrect: false,
      rationale: `Incorreto. Erro ao somar o volume do soluto à água destilada.`
    },
    {
      value: String(d3),
      text: `${d3} mL`,
      isCorrect: false,
      rationale: `Incorreto. Volume aspirado incorreto para a dose prescrita.`
    }
  ];

  const options = formatAndShuffleOptions(rawOptions);

  return {
    id: `proc_penicilina_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    category: "Diluição de Antibióticos",
    title: `Penicilina Cristalina (${prescribed.toLocaleString("pt-BR")} UI EV)`,
    description: `Prescrição médica: Penicilina Cristalina ${prescribed.toLocaleString("pt-BR")} UI por via intravenosa. Na enfermaria há frasco-ampola com pó liofilizado de ${totalUI.toLocaleString("pt-BR")} UI e ampolas de água destilada. Foi adicionado ${addedDiluent} mL de diluente.`,
    solutionName: `Penicilina Cristalina ${totalUI.toLocaleString("pt-BR")} UI`,
    volume: "10 mL após reconstituição",
    route: "Intravenosa (IV)",
    time: "Horário prescrito",
    device: "Frasco-Ampola + Seringa",
    question: `Sabendo que o pó ocupa exatamente ${soluteVolume} mL de soluto (volume final = 10 mL), quantos mL devem ser aspirados da solução para administrar a dose prescrita?`,
    formulaHint: `Volume total = Soluto (${soluteVolume} mL) + Solvente (${addedDiluent} mL) = 10 mL. Proporção: ${totalUI.toLocaleString("pt-BR")} UI --- 10 mL | ${prescribed.toLocaleString("pt-BR")} UI --- X mL.`,
    correctResult: String(correct),
    options,
    explanationSteps: [
      `1. O frasco de ${totalUI.toLocaleString("pt-BR")} UI possui ${soluteVolume} mL de soluto (pó liofilizado).`,
      `2. Adicionando ${addedDiluent} mL de água destilada, o volume total é 10 mL.`,
      `3. Montagem da proporção direta: ${totalUI.toLocaleString("pt-BR")} UI --- 10 mL | ${prescribed.toLocaleString("pt-BR")} UI --- X mL`,
      `4. X = (${prescribed} × 10) ÷ ${totalUI} = ${correct} mL.`
    ]
  };
}

/**
 * 6. Gerador de Rediluição Pediátrica & Corticoides
 */
function generatePediatricRedilution() {
  const cases = [
    {
      drug: "Hidrocortisona",
      vialDose: 500, // mg
      diluentVolume: 5, // mL
      prescribedDoses: [50, 75, 125, 150, 250],
      unit: "mg"
    },
    {
      drug: "Ceftriaxona Pediátrica",
      vialDose: 1000, // mg (1g)
      diluentVolume: 10, // mL
      prescribedDoses: [200, 250, 400, 500, 750],
      unit: "mg"
    },
    {
      drug: "Dipirona EV",
      vialDose: 1000, // mg (2 mL ampola 500mg/mL)
      diluentVolume: 10, // diluída para 10 mL
      prescribedDoses: [250, 300, 400, 500],
      unit: "mg"
    }
  ];

  const selected = cases[Math.floor(Math.random() * cases.length)];
  const prescribed = selected.prescribedDoses[Math.floor(Math.random() * selected.prescribedDoses.length)];

  // X = (prescribed * diluentVolume) / vialDose
  const correctRaw = (prescribed * selected.diluentVolume) / selected.vialDose;
  const correct = Number(correctRaw.toFixed(2));

  // Distratores:
  // 1. Inverteu: (vialDose * diluentVolume) / prescribed
  const distractor1 = Number(((selected.vialDose * selected.diluentVolume) / (prescribed * 10)).toFixed(2)) || 1.2;
  // 2. Errou em 10x
  const distractor2 = Number((correct * 2).toFixed(2));
  // 3. Metade
  const distractor3 = Number((correct * 0.5).toFixed(2));

  const setVals = new Set([correct]);
  const ensureUnique = (val, fallback) => {
    let curr = val;
    while (setVals.has(curr) || curr <= 0) {
      curr = Number((curr + fallback).toFixed(2));
    }
    setVals.add(curr);
    return curr;
  };

  const d1 = ensureUnique(distractor1, 0.8);
  const d2 = ensureUnique(distractor2, 1.2);
  const d3 = ensureUnique(distractor3, 0.5);

  const rawOptions = [
    {
      value: String(correct),
      text: `${correct} mL`,
      isCorrect: true,
      rationale: `Correto! Proporção direta: ${selected.vialDose} mg --- ${selected.diluentVolume} mL | ${prescribed} mg --- X mL. X = (${prescribed} × ${selected.diluentVolume}) ÷ ${selected.vialDose} = ${correct} mL.`
    },
    {
      value: String(d1),
      text: `${d1} mL`,
      isCorrect: false,
      rationale: `Incorreto. Erro no cruzamento da regra de três.`
    },
    {
      value: String(d2),
      text: `${d2} mL`,
      isCorrect: false,
      rationale: `Incorreto. Dose resultaria em hiperdosagem com risco de toxicidade.`
    },
    {
      value: String(d3),
      text: `${d3} mL`,
      isCorrect: false,
      rationale: `Incorreto. Aspiração insuficiente resultando em subdosagem.`
    }
  ];

  const options = formatAndShuffleOptions(rawOptions);

  return {
    id: `proc_ped_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    category: "Dose → Volume & Rediluição",
    title: `${selected.drug} (${prescribed} ${selected.unit})`,
    description: `Prescrição médica: ${selected.drug} ${prescribed} ${selected.unit} EV. Apresentação disponível: ${selected.vialDose} ${selected.unit} reconstituído/diluído para um volume total de ${selected.diluentVolume} mL.`,
    solutionName: `${selected.drug} ${selected.vialDose} ${selected.unit}`,
    volume: `${selected.diluentVolume} mL`,
    route: "Intravenosa (IV)",
    time: "Dose prescrita",
    device: "Seringa graduada",
    question: `Quantos mL devem ser aspirados para administrar exatamente a dose de ${prescribed} ${selected.unit}?`,
    formulaHint: `${selected.vialDose} ${selected.unit} --- ${selected.diluentVolume} mL | ${prescribed} ${selected.unit} --- X mL`,
    correctResult: String(correct),
    options,
    explanationSteps: [
      `1. Concentração da solução: ${selected.vialDose} ${selected.unit} em ${selected.diluentVolume} mL = ${selected.vialDose / selected.diluentVolume} ${selected.unit}/mL.`,
      `2. Dose prescrita: ${prescribed} ${selected.unit}.`,
      `3. Montagem da regra de três simples: X = (${prescribed} × ${selected.diluentVolume}) ÷ ${selected.vialDose}`,
      `4. Volume a aspirar: exatamente ${correct} mL.`
    ]
  };
}

/**
 * Ponto de entrada universal: gera um novo problema de dosagem procedural e infinito
 */
export function generateProceduralDosageProblem() {
  const generators = [
    generateMacrogotasHoras,
    generateMicrogotasHoras,
    generateMacrogotasMinutos,
    generateBicInfusion,
    generatePenicilinaCristalina,
    generatePediatricRedilution
  ];

  const pick = generators[Math.floor(Math.random() * generators.length)];
  return pick();
}
