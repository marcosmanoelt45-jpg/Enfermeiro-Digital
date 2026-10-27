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
      options: buildOptions([
        { value: "42", text: "42 gotas/minuto", isCorrect: true, rationale: "1000 ÷ (8 × 3) = 1000 ÷ 24 = 41,66... Arredondando: 42 gts/min." },
        { value: "125", text: "125 gotas/minuto", isCorrect: false, rationale: "1000 ÷ 8 = 125. Esse é o cálculo de microgotas/minuto ou mL/h, faltando aplicar a constante 3." },
        { value: "35", text: "35 gotas/minuto", isCorrect: false, rationale: "Taxa insuficiente, causará atraso na hidratação prescrita." },
        { value: "24", text: "24 gotas/minuto", isCorrect: false, rationale: "Confusão entre o denominador (8 × 3 = 24) e o resultado final da taxa." }
      ]),
      explanationSteps: [
        "Identifique as variáveis da prescrição: Volume = 1000 mL | Tempo = 8 horas",
        "Equipo de macrogotas com tempo em horas utiliza a fórmula: Gotas/min = V / (T × 3)",
        "Cálculo matemático: 1000 ÷ (8 × 3) = 1000 ÷ 24 = 41,66...",
        "Regra de arredondamento em gotas: como a fração é ≥ 0,5, arredondamos para 42 gotas/minuto."
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
      options: buildOptions([
        { value: "42", text: "42 microgotas/minuto", isCorrect: true, rationale: "500 ÷ 12 = 41,66... Arredondando: 42 mgts/min (numericamente igual a 42 mL/h)." },
        { value: "14", text: "14 microgotas/minuto", isCorrect: false, rationale: "500 ÷ (12 × 3) = 13,88 → 14. Essa seria a taxa para equipo de macrogotas, não microgotas." },
        { value: "60", text: "60 microgotas/minuto", isCorrect: false, rationale: "Confusão com a constante de 60 microgotas/mL." },
        { value: "28", text: "28 microgotas/minuto", isCorrect: false, rationale: "Subinfusão que comprometeria o aporte calórico e hídrico." }
      ]),
      explanationSteps: [
        "Identifique as variáveis da prescrição: Volume = 500 mL | Tempo = 12 horas",
        "Para microgotas com tempo em horas: Microgotas/min = Volume ÷ Tempo",
        "Cálculo matemático: 500 ÷ 12 = 41,66...",
        "Arredondamento: 42 microgotas/minuto (numericamente igual a 42 mL/h em bomba de infusão)."
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
      options: buildOptions([
        { value: "67", text: "67 gotas/minuto", isCorrect: true, rationale: "(100 × 20) ÷ 30 = 2000 ÷ 30 = 66,66... Arredondando: 67 gts/min." },
        { value: "200", text: "200 gotas/minuto", isCorrect: false, rationale: "(100 × 60) ÷ 30 = 200. Essa seria a taxa de microgotas/minuto, não macrogotas." },
        { value: "33", text: "33 gotas/minuto", isCorrect: false, rationale: "100 ÷ 3 = 33,3. Fórmula de horas aplicada erroneamente sobre minutos." },
        { value: "50", text: "50 gotas/minuto", isCorrect: false, rationale: "Taxa insuficiente, fazendo o antibiótico infundir em 40 minutos em vez de 30." }
      ]),
      explanationSteps: [
        "Quando o tempo é prescrito em minutos, a constante muda para 20!",
        "Fórmula: Gotas/min = (Volume em mL × 20) ÷ Tempo em minutos",
        "Cálculo matemático: (100 × 20) ÷ 30 = 2000 ÷ 30 = 66,66...",
        "Arredondamento: 67 gotas/minuto."
      ]
    },
    {
      id: "prob_4",
      category: "Diluição de Antibióticos",
      title: "Penicilina Cristalina (Frasco de 5.000.000 UI)",
      description: "Prescrição médica: Penicilina Cristalina 2.000.000 UI EV. Disponível na enfermaria: Frasco-ampola com pó liofilizado de 5.000.000 UI e ampolas de água destilada (AD) de 10 mL.",
      solutionName: "Penicilina Cristalina 5.000.000 UI",
      volume: "Reconstituir p/ 10 mL",
      route: "Intravenosa (IV)",
      time: "Horário prescrito",
      device: "Frasco-Ampola + Seringa",
      question: "Sabendo que o pó ocupa 2 mL de soluto, se adicionarmos 8 mL de AD (totalizando 10 mL), quantos mL devemos aspirar para administrar a dose prescrita?",
      formulaHint: "Soluto (2 mL) + solvente (8 mL) = 10 mL. Regra de três: 5.000.000 UI = 10 mL, logo 2.000.000 UI = X.",
      correctResult: "4",
      options: buildOptions([
        { value: "4", text: "4,0 mL", isCorrect: true, rationale: "5.000.000 UI = 10 mL → 2.000.000 UI = (2.000.000 × 10) ÷ 5.000.000 = 4 mL." },
        { value: "3.2", text: "3,2 mL", isCorrect: false, rationale: "Calculou sobre 8 mL ignorando que o soluto ocupa 2 mL, gerando subdosagem perigosa!" },
        { value: "2.5", text: "2,5 mL", isCorrect: false, rationale: "Erro ao dividir 5 por 2 sem considerar o volume de 10 mL." },
        { value: "5", text: "5,0 mL", isCorrect: false, rationale: "Superdosagem (administraria 2.500.000 UI em vez de 2.000.000 UI)." }
      ]),
      explanationSteps: [
        "No frasco de 5 milhões de UI, o soluto (pó) equivale a 2 mL de volume.",
        "Ao injetar 8 mL de diluente (AD), o volume total da solução reconstituída é 10 mL.",
        "Montagem da proporção direta: 5.000.000 UI --- 10 mL | 2.000.000 UI --- X mL",
        "Cálculo: X = (2.000.000 × 10) ÷ 5.000.000 = 20 ÷ 5 = 4 mL."
      ]
    },
    {
      id: "prob_5",
      category: "Anticoagulação & Alta Vigilância",
      title: "Heparina Sódica Contínua em UTI",
      description: "Prescrição médica: Heparina sódica 800 UI/h em infusão intravenosa contínua. Solução preparada: Frasco de SF 0,9% 250 mL + 25.000 UI de Heparina (5 mL da apresentação 5.000 UI/mL). Volume total = 250 mL.",
      solutionName: "Heparina 25.000 UI em 250 mL SF 0,9%",
      volume: "250 mL (100 UI/mL)",
      route: "Intravenosa Contínua (IV)",
      time: "Contínuo",
      device: "Bomba de Infusão Contínua (BIC)",
      question: "Qual vazão em mL/h deve ser programada na Bomba de Infusão Contínua (BIC) para administrar exatamente 800 UI/hora?",
      formulaHint: "Concentração: 25.000 UI ÷ 250 mL = 100 UI/mL. Vazão (mL/h) = Dose prescrita (UI/h) ÷ Concentração (UI/mL).",
      correctResult: "8",
      options: buildOptions([
        { value: "8", text: "8,0 mL/h", isCorrect: true, rationale: "25.000 UI ÷ 250 mL = 100 UI/mL. Vazão = 800 UI/h ÷ 100 UI/mL = 8 mL/h." },
        { value: "80", text: "80 mL/h", isCorrect: false, rationale: "Erro de 10x na concentração! Administraria 8.000 UI/h, risco de hemorragia fatal!" },
        { value: "12.5", text: "12,5 mL/h", isCorrect: false, rationale: "Inversão na razão de proporcionalidade da solução." },
        { value: "4", text: "4,0 mL/h", isCorrect: false, rationale: "Subdosagem resultaria em trombose de stent ou embolia pulmonar." }
      ]),
      explanationSteps: [
        "Determine a concentração da solução: 25.000 UI ÷ 250 mL = 100 UI por cada 1 mL.",
        "A dose prescrita é de 800 UI/h.",
        "Regra de três ou divisão direta: 100 UI --- 1 mL | 800 UI --- X mL.",
        "Cálculo: X = 800 ÷ 100 = 8 mL/h.",
        "Na Bomba de Infusão Contínua (BIC), programa-se a vazão de 8 mL/h."
      ]
    },
    {
      id: "prob_6",
      category: "Corticoterapia & Emergência",
      title: "Hidrocortisona em Crise Asmática",
      description: "Prescrição médica: Hidrocortisona 150 mg EV em bólus lento. Na farmácia hospitalar há frasco-ampola com pó liofilizado de Hidrocortisona 500 mg e ampola de diluente de 5 mL.",
      solutionName: "Hidrocortisona 500 mg (Frasco-Ampola)",
      volume: "5 mL após reconstituição",
      route: "Intravenosa (IV)",
      time: "Dose Imediata (STAT)",
      device: "Frasco-Ampola + Seringa de 5 mL",
      question: "Após reconstituir o pó de 500 mg com 5 mL de diluente (AD), quantos mL devem ser aspirados para administrar exatamente 150 mg?",
      formulaHint: "500 mg --- 5 mL | 150 mg --- X mL. X = (150 × 5) ÷ 500.",
      correctResult: "1.5",
      options: buildOptions([
        { value: "1.5", text: "1,5 mL", isCorrect: true, rationale: "500 mg = 5 mL (100 mg/mL). 150 mg ÷ 100 mg/mL = 1,5 mL." },
        { value: "3", text: "3,0 mL", isCorrect: false, rationale: "Dose dobrada (300 mg), provocaria pico glicêmico e retenção hidrossalina aguda." },
        { value: "1", text: "1,0 mL", isCorrect: false, rationale: "Subdosagem (100 mg), insuficiente para estancar o broncoespasmo grave." },
        { value: "0.75", text: "0,75 mL", isCorrect: false, rationale: "Erro ao dividir 750 por 1000 em vez de 500." }
      ]),
      explanationSteps: [
        "Volume e concentração: 500 mg reconstituídos em 5 mL resultam em 100 mg/mL.",
        "Montagem da proporção: 500 mg = 5 mL | 150 mg = X mL",
        "Cálculo: X = (150 × 5) ÷ 500 = 750 ÷ 500 = 1,5 mL.",
        "Aspire exatamente 1,5 mL da seringa graduada para administrar a dose de 150 mg."
      ]
    },
    {
      id: "prob_7",
      category: "Drogas Vasoativas em UTI",
      title: "Noradrenalina em Choque Séptico",
      description: "Prescrição: Noradrenalina 16 mg (4 ampolas de 4 mL com 1 mg/mL) diluída em SF 0,9% 234 mL, totalizando 250 mL de solução (64 mcg/mL). O médico prescreveu iniciar em 12 mL/h em BIC.",
      solutionName: "Noradrenalina 16 mg em 250 mL SF 0,9%",
      volume: "250 mL (64 mcg/mL)",
      route: "Intravenosa Contínua (Acesso Central)",
      time: "Contínuo",
      device: "Bomba de Infusão Contínua (BIC)",
      question: "Quantos microgramas por minuto (mcg/min) o paciente está recebendo quando a BIC está infundindo a 12 mL/h?",
      formulaHint: "Dose (mcg/h) = Vazão (mL/h) × Concentração (mcg/mL). Depois divida por 60 minutos.",
      correctResult: "12.8",
      options: buildOptions([
        { value: "12.8", text: "12,8 mcg/min", isCorrect: true, rationale: "12 mL/h × 64 mcg/mL = 768 mcg/h. Em minutos: 768 ÷ 60 = 12,8 mcg/min." },
        { value: "768", text: "768 mcg/min", isCorrect: false, rationale: "Esqueceu de converter horas para minutos (768 mcg é a dose por HORA, não por minuto)." },
        { value: "6.4", text: "6,4 mcg/min", isCorrect: false, rationale: "Cálculo correspondente a metade da vazão (6 mL/h)." },
        { value: "25.6", text: "25,6 mcg/min", isCorrect: false, rationale: "Dose dobrada por erro no fator de conversão temporal." }
      ]),
      explanationSteps: [
        "1. Concentração: 16 mg = 16.000 mcg. 16.000 mcg ÷ 250 mL = 64 mcg/mL.",
        "2. Vazão programada: 12 mL/h. Logo, por hora infunde: 12 × 64 = 768 mcg/hora.",
        "3. Como 1 hora tem 60 minutos: 768 ÷ 60 = 12,8 mcg/minuto."
      ]
    },
    {
      id: "prob_8",
      category: "Eletrólitos Concentrados",
      title: "Cloreto de Potássio 10% (Reposição de Hipocalemia)",
      description: "Prescrição: KCl 10% 20 mL adicionado a Soro Fisiológico 0,9% 500 mL para correr em 4 horas. Apresentação: ampolas de KCl 10% com 10 mL (cada 10 mL contém 1g de KCl = 13,4 mEq de K+).",
      solutionName: "SF 500 mL + KCl 10% 20 mL",
      volume: "520 mL total",
      route: "Intravenosa (Equipo Macrogotas)",
      time: "4 horas",
      device: "Equipo de Macrogotas",
      question: "Qual a taxa de gotejamento em gotas por minuto (gts/min) considerando o volume total de 520 mL?",
      formulaHint: "Gotas/min = Volume total (mL) ÷ (Tempo (h) × 3)",
      correctResult: "43",
      options: buildOptions([
        { value: "43", text: "43 gotas/minuto", isCorrect: true, rationale: "520 ÷ (4 × 3) = 520 ÷ 12 = 43,33... Arredondando: 43 gts/min." },
        { value: "42", text: "42 gotas/minuto", isCorrect: false, rationale: "Calculou apenas os 500 mL de SF, esquecendo os 20 mL de KCl adicionados!" },
        { value: "130", text: "130 gotas/minuto", isCorrect: false, rationale: "520 ÷ 4 = 130 (taxa em microgotas/min ou mL/h, faltando multiplicar por 3)." },
        { value: "22", text: "22 gotas/minuto", isCorrect: false, rationale: "Taxa com infusão de 8h em vez de 4h." }
      ]),
      explanationSteps: [
        "1. Calcule o volume total infundido: 500 mL de SF + 20 mL de KCl = 520 mL.",
        "2. Tempo de infusão: 4 horas.",
        "3. Gotas/min = 520 ÷ (4 × 3) = 520 ÷ 12 = 43,33...",
        "4. Arredondamento farmacotécnico: 43 gotas/minuto."
      ]
    },
    {
      id: "prob_9",
      category: "Dose Pediátrica por Peso",
      title: "Amoxicilina Suspensão Oral para Lactente",
      description: "Prescrição médica: Amoxicilina 50 mg/kg/dia dividida em 3 tomadas iguais (a cada 8 horas). A criança pesa 12 kg. Apresentação disponível: Frasco de suspensão oral 250 mg / 5 mL.",
      solutionName: "Amoxicilina 250 mg / 5 mL suspensão",
      volume: "Frasco 150 mL",
      route: "Oral (VO)",
      time: "A cada 8 horas (3x/dia)",
      device: "Seringa dosadora oral",
      question: "Quantos mL de suspensão devem ser administrados em CADA tomada (dose unitária de 8 em 8h)?",
      formulaHint: "Dose total diária = 50 × 12 = 600 mg. Dose por tomada = 600 ÷ 3 = 200 mg. Regra de três: 250 mg = 5 mL → 200 mg = X mL.",
      correctResult: "4",
      options: buildOptions([
        { value: "4", text: "4,0 mL", isCorrect: true, rationale: "Dose unitária = 200 mg. 250 mg --- 5 mL → 200 mg --- X. X = (200 × 5) ÷ 250 = 4,0 mL." },
        { value: "12", text: "12,0 mL", isCorrect: false, rationale: "Calculou a dose diária total (600 mg) em uma única tomada, risco de intoxicação!" },
        { value: "2.5", text: "2,5 mL", isCorrect: false, rationale: "Administraria apenas 125 mg por tomada (subdosagem antimicrobiana)." },
        { value: "6", text: "6,0 mL", isCorrect: false, rationale: "Erro ao multiplicar sem dividir pelas 3 tomadas diárias." }
      ]),
      explanationSteps: [
        "1. Dose diária total recomendada: 50 mg/kg × 12 kg = 600 mg/dia.",
        "2. Como são 3 tomadas ao dia: 600 mg ÷ 3 = 200 mg por dose.",
        "3. Concentração: 250 mg está em 5 mL (50 mg/mL).",
        "4. Volume por dose: 200 mg ÷ 50 mg/mL = 4 mL a cada 8 horas."
      ]
    },
    {
      id: "prob_10",
      category: "Diluição de Antibióticos",
      title: "Oxacilina Sódica 500mg EV",
      description: "Prescrição: Oxacilina 500 mg EV de 4/4h. Disponível na enfermaria: frasco-ampola com pó de 1g (1000 mg) e ampolas de água destilada de 5 mL.",
      solutionName: "Oxacilina 1g frasco-ampola",
      volume: "Reconstituir para 5 mL",
      route: "Intravenosa (IV)",
      time: "Horário prescrito",
      device: "Frasco-Ampola + Seringa",
      question: "Após reconstituir o frasco de 1g para um volume final de 5 mL, quantos mL devem ser aspirados para administrar 500 mg?",
      formulaHint: "1000 mg --- 5 mL | 500 mg --- X mL",
      correctResult: "2.5",
      options: buildOptions([
        { value: "2.5", text: "2,5 mL", isCorrect: true, rationale: "1000 mg = 5 mL → 500 mg = (500 × 5) ÷ 1000 = 2,5 mL." },
        { value: "5", text: "5,0 mL", isCorrect: false, rationale: "Administraria o frasco inteiro (1000 mg = dobro da dose prescrita)." },
        { value: "1.25", text: "1,25 mL", isCorrect: false, rationale: "Subdosagem (administraria apenas 250 mg)." },
        { value: "3.5", text: "3,5 mL", isCorrect: false, rationale: "Erro de cálculo na proporção direta." }
      ]),
      explanationSteps: [
        "1. Apresentação: 1g = 1000 mg.",
        "2. Reconstituído com diluente para 5 mL: 1000 mg em 5 mL = 200 mg/mL.",
        "3. Dose prescrita: 500 mg.",
        "4. Cálculo: 500 ÷ 200 = 2,5 mL."
      ]
    },
    {
      id: "prob_11",
      category: "Macrogotas / Minutos",
      title: "Paracetamol Solução para Infusão em 15 minutos",
      description: "Prescrição médica: Paracetamol 1000 mg (bolsa de 100 mL pronta para uso) para correr em 15 minutos em paciente em pós-operatório com dor aguda.",
      solutionName: "Paracetamol 1000 mg em 100 mL",
      volume: "100 mL",
      route: "Intravenosa (IV)",
      time: "15 minutos",
      device: "Equipo de Macrogotas",
      question: "Quantas gotas por minuto (gts/min) devem ser reguladas no equipo?",
      formulaHint: "Gotas/min = (Volume × 20) ÷ Tempo em minutos",
      correctResult: "133",
      options: buildOptions([
        { value: "133", text: "133 gotas/minuto", isCorrect: true, rationale: "(100 × 20) ÷ 15 = 2000 ÷ 15 = 133,33... Arredondando: 133 gts/min." },
        { value: "400", text: "400 gotas/minuto", isCorrect: false, rationale: "(100 × 60) ÷ 15 = 400. Essa é a taxa em microgotas/minuto." },
        { value: "67", text: "67 gotas/minuto", isCorrect: false, rationale: "Calculou para 30 minutos em vez de 15 minutos." },
        { value: "20", text: "20 gotas/minuto", isCorrect: false, rationale: "100 ÷ 5 = 20. Fórmula distorcida." }
      ]),
      explanationSteps: [
        "1. Volume: 100 mL | Tempo: 15 minutos | Equipo: Macrogotas (fator 20).",
        "2. Fórmula: Gotas/min = (V × 20) ÷ T(min)",
        "3. Gotas/min = (100 × 20) ÷ 15 = 2000 ÷ 15 = 133,33...",
        "4. Arredonda-se para 133 gotas/minuto."
      ]
    },
    {
      id: "prob_12",
      category: "Bomba de Infusão (BIC)",
      title: "Insulina Regular em Cetoacidose Diabética (CAD)",
      description: "Prescrição: Insulina Regular 100 UI em SF 0,9% 100 mL (1 UI/mL). Dose prescrita: 0,1 UI/kg/h para paciente de 70 kg.",
      solutionName: "Insulina Regular 100 UI em 100 mL SF",
      volume: "100 mL (1 UI/mL)",
      route: "Intravenosa Contínua (BIC)",
      time: "Contínuo",
      device: "Bomba de Infusão Contínua (BIC)",
      question: "Qual deve ser a vazão programada na Bomba de Infusão Contínua (BIC) em mL/h?",
      formulaHint: "Dose total (UI/h) = 0,1 × Peso (kg). Como a concentração é 1 UI/mL, Vazão (mL/h) = Dose (UI/h).",
      correctResult: "7",
      options: buildOptions([
        { value: "7", text: "7,0 mL/h", isCorrect: true, rationale: "0,1 UI/kg/h × 70 kg = 7 UI/h. Na solução de 1 UI/mL: 7 UI/h = 7 mL/h na BIC." },
        { value: "70", text: "70 mL/h", isCorrect: false, rationale: "Erro de 10x na taxa! Provocaria hipoglicemia severa e coma neurológico!" },
        { value: "14", text: "14 mL/h", isCorrect: false, rationale: "Dose dobrada (0,2 UI/kg/h)." },
        { value: "3.5", text: "3,5 mL/h", isCorrect: false, rationale: "Subinfusão que prolongaria a acidose metabólica grave." }
      ]),
      explanationSteps: [
        "1. Concentração da solução: 100 UI ÷ 100 mL = 1 UI por cada 1 mL.",
        "2. Cálculo da dose requerida: 0,1 UI/kg/h × 70 kg = 7 UI/h.",
        "3. Como 1 mL contém exatamente 1 UI, para infundir 7 UI por hora programam-se 7 mL/h na BIC."
      ]
    },
    {
      id: "prob_13",
      category: "Microgotas / Horas",
      title: "Hidratação de Manutenção em Pediatria (Regra de Holliday-Segar)",
      description: "Prescrição: Solução de Holliday-Segar 1200 mL para correr em 24 horas em equipo de microgotas em enfermaria de pediatria.",
      solutionName: "Solução de Manutenção Holliday-Segar",
      volume: "1200 mL",
      route: "Intravenosa (IV)",
      time: "24 horas",
      device: "Equipo de Microgotas",
      question: "Qual a taxa em microgotas por minuto (mgts/min)?",
      formulaHint: "Microgotas/min = Volume (mL) ÷ Tempo (h)",
      correctResult: "50",
      options: buildOptions([
        { value: "50", text: "50 microgotas/minuto", isCorrect: true, rationale: "1200 ÷ 24 = 50 microgotas/minuto (ou 50 mL/h)." },
        { value: "17", text: "17 microgotas/minuto", isCorrect: false, rationale: "1200 ÷ (24 × 3) = 16,66... Essa seria a taxa para macrogotas." },
        { value: "25", text: "25 microgotas/minuto", isCorrect: false, rationale: "Cálculo para 48h de infusão." },
        { value: "100", text: "100 microgotas/minuto", isCorrect: false, rationale: "Hiperinfusão com risco de sobrecarga hídrica pulmonar." }
      ]),
      explanationSteps: [
        "1. Identificação: Volume = 1200 mL | Tempo = 24 horas | Equipo = Microgotas.",
        "2. Fórmula: Microgotas/min = Volume ÷ Tempo",
        "3. 1200 ÷ 24 = 50 microgotas/minuto."
      ]
    },
    {
      id: "prob_14",
      category: "Diluição de Antibióticos",
      title: "Vancomicina 1g em Infusão Prolongada",
      description: "Prescrição médica: Vancomicina 1g (1000 mg) diluída em 200 mL de SF 0,9% para correr em 2 horas (para prevenir Síndrome do Homem Vermelho).",
      solutionName: "Vancomicina 1g em 200 mL SF",
      volume: "200 mL",
      route: "Intravenosa (IV)",
      time: "2 horas",
      device: "Equipo de Macrogotas",
      question: "Qual o gotejamento correto em gotas por minuto (gts/min)?",
      formulaHint: "Gotas/min = Volume ÷ (Tempo × 3)",
      correctResult: "33",
      options: buildOptions([
        { value: "33", text: "33 gotas/minuto", isCorrect: true, rationale: "200 ÷ (2 × 3) = 200 ÷ 6 = 33,33... Arredondando: 33 gts/min." },
        { value: "100", text: "100 gotas/minuto", isCorrect: false, rationale: "200 ÷ 2 = 100 (taxa em microgotas ou mL/h, infusão rápida de vancomicina desencadeia anafilactóide!)." },
        { value: "50", text: "50 gotas/minuto", isCorrect: false, rationale: "200 ÷ 4 = 50. Erro no denominador." },
        { value: "16", text: "16 gotas/minuto", isCorrect: false, rationale: "Subinfusão demoraria 4 horas." }
      ]),
      explanationSteps: [
        "1. Volume: 200 mL | Tempo: 2 horas | Equipo: Macrogotas.",
        "2. Fórmula: Gotas/min = V ÷ (T × 3) = 200 ÷ (2 × 3) = 200 ÷ 6 = 33,33...",
        "3. Arredondamento: 33 gotas por minuto."
      ]
    },
    {
      id: "prob_15",
      category: "Dose → Volume & Rediluição",
      title: "Morfina em Analgesia Pós-Operatória",
      description: "Prescrição: Sulfato de Morfina 4 mg EV em bólus lento. Apresentação: ampola de 1 mL contendo 10 mg/mL. Diluída com 9 mL de AD para perfazer 10 mL de solução (1 mg/mL).",
      solutionName: "Morfina 10 mg / 10 mL (1 mg/mL)",
      volume: "10 mL diluída",
      route: "Intravenosa (IV Lento)",
      time: "STAT",
      device: "Seringa de 10 mL",
      question: "Quantos mL da solução rediluída (1 mg/mL) devem ser administrados para entregar a dose de 4 mg?",
      formulaHint: "10 mg --- 10 mL (1 mg/mL) → 4 mg --- X mL",
      correctResult: "4",
      options: buildOptions([
        { value: "4", text: "4,0 mL", isCorrect: true, rationale: "Como cada 1 mL da solução rediluída contém 1 mg de morfina, para 4 mg administram-se exatamente 4 mL." },
        { value: "0.4", text: "0,4 mL", isCorrect: false, rationale: "0,4 mL seria o volume se aspirado direto da ampola pura de 10 mg/mL, sem rediluição." },
        { value: "8", text: "8,0 mL", isCorrect: false, rationale: "Dose de 8 mg, risco de depressão respiratória grave!" },
        { value: "2", text: "2,0 mL", isCorrect: false, rationale: "Subdose de 2 mg, insuficiente para alívio da dor moderada a severa." }
      ]),
      explanationSteps: [
        "1. Ampola pura: 10 mg em 1 mL.",
        "2. Rediluição de segurança: 1 mL de morfina + 9 mL de água destilada = 10 mL no total.",
        "3. Nova concentração: 10 mg ÷ 10 mL = 1 mg/mL.",
        "4. Para aplicar 4 mg, aspira-se 4 mL da seringa rediluída."
      ]
    },
    {
      id: "prob_16",
      category: "Sedação & Analgesia Contínua",
      title: "Fentanil em Ventilação Mecânica na UTI",
      description: "Prescrição: Fentanil 50 mcg/h em infusão intravenosa contínua. Solução preparada: 10 ampolas de Fentanil 50 mcg/mL (5 mL cada = 2500 mcg) + SF 0,9% 200 mL, volume final de 250 mL (10 mcg/mL).",
      solutionName: "Fentanil 2500 mcg em 250 mL SF",
      volume: "250 mL (10 mcg/mL)",
      route: "Intravenosa Contínua (IV)",
      time: "Contínuo",
      device: "Bomba de Infusão Contínua (BIC)",
      question: "Qual vazão em mL/h deve ser configurada na BIC?",
      formulaHint: "Vazão (mL/h) = Dose prescrita (mcg/h) ÷ Concentração (mcg/mL)",
      correctResult: "5",
      options: buildOptions([
        { value: "5", text: "5,0 mL/h", isCorrect: true, rationale: "Concentração = 2500 mcg ÷ 250 mL = 10 mcg/mL. Vazão = 50 mcg/h ÷ 10 mcg/mL = 5 mL/h." },
        { value: "50", text: "50 mL/h", isCorrect: false, rationale: "Erro de 10x na infusão de opioide, parada respiratória imediata se sem tubo!" },
        { value: "2.5", text: "2,5 mL/h", isCorrect: false, rationale: "Metade da dose (paciente pode acordar e brigar com o ventilador mecânico)." },
        { value: "10", text: "10 mL/h", isCorrect: false, rationale: "Dose dobrada (100 mcg/h)." }
      ]),
      explanationSteps: [
        "1. Dose total na bolsa: 2500 mcg em 250 mL = 10 mcg/mL.",
        "2. Prescrição: 50 mcg/h.",
        "3. Proporção: 10 mcg --- 1 mL | 50 mcg --- X mL.",
        "4. X = 50 ÷ 10 = 5 mL/h na BIC."
      ]
    },
    {
      id: "prob_17",
      category: "Macrogotas / Horas",
      title: "Expansão Volêmica Rápida em Desidratação Grave",
      description: "Prescrição: Ringer com Lactato 1500 mL para correr em 6 horas via equipo de macrogotas em paciente politraumatizado estável.",
      solutionName: "Ringer com Lactato 1500 mL",
      volume: "1500 mL",
      route: "Intravenosa (IV)",
      time: "6 horas",
      device: "Equipo de Macrogotas",
      question: "Quantas gotas por minuto (gts/min) devem ser reguladas?",
      formulaHint: "Gotas/min = Volume (mL) ÷ (Tempo (h) × 3)",
      correctResult: "83",
      options: buildOptions([
        { value: "83", text: "83 gotas/minuto", isCorrect: true, rationale: "1500 ÷ (6 × 3) = 1500 ÷ 18 = 83,33... Arredondando: 83 gts/min." },
        { value: "250", text: "250 gotas/minuto", isCorrect: false, rationale: "1500 ÷ 6 = 250 (cálculo de microgotas/min ou mL/h)." },
        { value: "62", text: "62 gotas/minuto", isCorrect: false, rationale: "1500 ÷ 24 (cálculo como se fossem 8 horas)." },
        { value: "125", text: "125 gotas/minuto", isCorrect: false, rationale: "Taxa correspondente a infusão em 4 horas." }
      ]),
      explanationSteps: [
        "1. Volume: 1500 mL | Tempo: 6 horas | Equipo: Macrogotas.",
        "2. Fórmula: Gotas/min = V ÷ (T × 3) = 1500 ÷ (6 × 3) = 1500 ÷ 18 = 83,33...",
        "3. Taxa arredondada: 83 gotas/minuto."
      ]
    },
    {
      id: "prob_18",
      category: "Dose → Volume & Rediluição",
      title: "Aminofilina em Crise Broncoespástica",
      description: "Prescrição: Aminofilina 120 mg EV em infusão lenta de 30 minutos. Apresentação: ampola de 10 mL contendo 24 mg/mL (total 240 mg/ampola).",
      solutionName: "Aminofilina 24 mg/mL ampola 10 mL",
      volume: "10 mL ampola",
      route: "Intravenosa (IV)",
      time: "30 minutos",
      device: "Seringa graduada",
      question: "Quantos mL devem ser aspirados da ampola para obter exatamente 120 mg?",
      formulaHint: "Volume (mL) = Dose prescrita (mg) ÷ Concentração (mg/mL)",
      correctResult: "5",
      options: buildOptions([
        { value: "5", text: "5,0 mL", isCorrect: true, rationale: "120 mg ÷ 24 mg/mL = 5,0 mL (metade da ampola de 10 mL)." },
        { value: "10", text: "10,0 mL", isCorrect: false, rationale: "Aspiraria a ampola inteira (240 mg = risco de taquiarritmia ventricular grave!)." },
        { value: "2.5", text: "2,5 mL", isCorrect: false, rationale: "Subdose de 60 mg, insuficiente para broncodilatação." },
        { value: "4", text: "4,0 mL", isCorrect: false, rationale: "Administraria 96 mg por erro aritmético." }
      ]),
      explanationSteps: [
        "1. Concentração da ampola: 24 mg por mL.",
        "2. Dose prescrita: 120 mg.",
        "3. Regra de três: 24 mg --- 1 mL | 120 mg --- X mL.",
        "4. X = 120 ÷ 24 = 5 mL."
      ]
    },
    {
      id: "prob_19",
      category: "Anticonvulsivantes & Emergência",
      title: "Fenitoína Sódica (Dose de Ataque no Estado de Mal Epiléptico)",
      description: "Prescrição: Fenitoína sódica 1000 mg EV diluída em SF 0,9% 100 mL para correr em 30 minutos (máximo de 50 mg/min para evitar arritmia e hipotensão). Apresentação: ampolas de 5 mL a 50 mg/mL (250 mg/ampola).",
      solutionName: "Fenitoína 50 mg/mL ampolas 5 mL",
      volume: "Ampolas de 5 mL",
      route: "Intravenosa (IV)",
      time: "30 minutos",
      device: "Ampolas + Seringa",
      question: "Quantas ampolas inteiras de Fenitoína (250 mg cada) são necessárias para atingir a dose prescrita de 1000 mg?",
      formulaHint: "Número de ampolas = Dose prescrita (mg) ÷ Dose por ampola (mg)",
      correctResult: "4",
      options: buildOptions([
        { value: "4", text: "4 ampolas (20 mL)", isCorrect: true, rationale: "1000 mg ÷ 250 mg/ampola = 4 ampolas completas (4 × 5 mL = 20 mL de fármaco)." },
        { value: "2", text: "2 ampolas (10 mL)", isCorrect: false, rationale: "500 mg apenas (metade da dose de ataque preconizada para cessar as convulsões)." },
        { value: "5", text: "5 ampolas (25 mL)", isCorrect: false, rationale: "1250 mg, superdosagem com risco de bloqueio atrioventricular." },
        { value: "3", text: "3 ampolas (15 mL)", isCorrect: false, rationale: "750 mg (subdosagem)." }
      ]),
      explanationSteps: [
        "1. Cada ampola tem 5 mL a 50 mg/mL = 250 mg por ampola.",
        "2. Dose prescrita: 1000 mg.",
        "3. Cálculo: 1000 ÷ 250 = 4 ampolas.",
        "4. Volume total a aspirar das 4 ampolas: 4 × 5 mL = 20 mL."
      ]
    },
    {
      id: "prob_20",
      category: "Bipiramidinas & Inotrópicos",
      title: "Milrinona em Choque Cardiogênico",
      description: "Prescrição médica: Milrinona 0,5 mcg/kg/min em infusão contínua para paciente de 60 kg com insuficiência cardíaca descompensada. Solução preparada: Milrinona 20 mg em SF 0,9% 80 mL, totalizando 100 mL (200 mcg/mL).",
      solutionName: "Milrinona 20 mg em 100 mL SF",
      volume: "100 mL (200 mcg/mL)",
      route: "Intravenosa Contínua (BIC)",
      time: "Contínuo",
      device: "Bomba de Infusão Contínua (BIC)",
      question: "Qual a vazão em mL/h que deve ser programada na Bomba de Infusão Contínua (BIC)?",
      formulaHint: "Dose (mcg/min) = 0,5 × 60 = 30 mcg/min. Dose por hora = 30 × 60 = 1800 mcg/h. Vazão = 1800 ÷ 200 mcg/mL.",
      correctResult: "9",
      options: buildOptions([
        { value: "9", text: "9,0 mL/h", isCorrect: true, rationale: "0,5 × 60 kg = 30 mcg/min. Em 1 hora: 30 × 60 = 1800 mcg/h. Vazão = 1800 ÷ 200 = 9 mL/h." },
        { value: "18", text: "18,0 mL/h", isCorrect: false, rationale: "Dose dobrada (1,0 mcg/kg/min), provocando taquiarritmia e hipotensão refratária." },
        { value: "4.5", text: "4,5 mL/h", isCorrect: false, rationale: "Metade da dose (0,25 mcg/kg/min)." },
        { value: "1.5", text: "1,5 mL/h", isCorrect: false, rationale: "Esqueceu de multiplicar por 60 para converter minutos em horas." }
      ]),
      explanationSteps: [
        "1. Concentração: 20 mg = 20.000 mcg em 100 mL = 200 mcg/mL.",
        "2. Dose requerida por minuto: 0,5 mcg/kg/min × 60 kg = 30 mcg/min.",
        "3. Dose por hora: 30 mcg/min × 60 min = 1800 mcg/h.",
        "4. Vazão na BIC = 1800 mcg/h ÷ 200 mcg/mL = 9 mL/h."
      ]
    }
  ];
}
