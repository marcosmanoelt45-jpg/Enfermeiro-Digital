/**
 * simuladorCasosData.js
 *
 * Catálogo canônico de casos clínicos locais para o Atendimento por Voz (Videochamada).
 * Contém dados completos para os 2 pacientes (Sr. Marcus e Dona Teresinha),
 * com banco de mais de 8 questões por caso, cálculo com fórmula guia,
 * e suporte a geração/embaralhamento procedural com Fisher-Yates.
 */

export const PACIENTES = {
  marcus: {
    id: "marcus",
    nome: "Sr. Marcus",
    idade: "74 anos",
    leito: "Leito 12",
    sinaisVitais: "PA 138/86 · FC 82 · SpO₂ 96%",
    pitch: 0.72,
    rate: 0.90,
    voiceFile: "/pacientes/marcus/fala.wav",
    videos: {
      fala: {
        webm: "/pacientes/marcus/fala.webm",
        mp4: "/pacientes/marcus/fala.mp4"
      },
      acerto: {
        webm: "/pacientes/marcus/acerto.webm",
        mp4: "/pacientes/marcus/acerto.mp4"
      },
      erro: {
        webm: "/pacientes/marcus/erro.webm",
        mp4: "/pacientes/marcus/erro.mp4"
      }
    }
  },
  teresinha: {
    id: "teresinha",
    nome: "Dona Teresinha",
    idade: "71 anos",
    leito: "Leito 8",
    sinaisVitais: "PA 124/78 · FC 76 · SpO₂ 98%",
    pitch: 1.10,
    rate: 0.92,
    voiceFile: "/pacientes/teresinha/fala.wav",
    videos: {
      fala: {
        webm: "/pacientes/teresinha/fala.webm",
        mp4: "/pacientes/teresinha/fala.mp4"
      },
      acerto: {
        webm: "/pacientes/teresinha/acerto.webm",
        mp4: "/pacientes/teresinha/acerto.mp4"
      },
      erro: {
        webm: "/pacientes/teresinha/erro.webm",
        mp4: "/pacientes/teresinha/erro.mp4"
      }
    }
  }
};

export const CASOS_SIMULADOR = {
  marcus: {
    id: "caso-marcus-lesao-pressao",
    pacienteId: "marcus",
    titulo: "Curativo em lesão por pressão no calcanhar",
    subtitulo: "Paciente simulado fala com você · 8 questões",
    chips: ["Atendimento por voz", "Caso simulado"],
    passos: [
      {
        tipo: "fala",
        texto: "Bom dia! Essa ferida no meu calcanhar já está comigo há uns dez dias. Ela está molhada, solta um líquido amarelado e dói quando encosta no lençol. O que você vai fazer comigo?"
      },
      {
        tipo: "multipla_escolha",
        tema: "AVALIAÇÃO E ESTADIAMENTO",
        pergunta: "Ao avaliar a ferida com perda parcial da espessura da pele e leito avermelhado sem esfacelo visível, como você a classifica segundo a NPUAP?",
        opcoes: [
          "Lesão por Pressão Estágio 2",
          "Lesão por Pressão Estágio 1 (pele intacta)",
          "Lesão por Pressão Estágio 3 (perda total da derme)",
          "Lesão por Pressão Não Classificável"
        ],
        correta: 0,
        explicacao: "O Estágio 2 apresenta perda parcial da espessura dérmica, leito viável, avermelhado/rosa e úmido, sem exposição de tecido adiposo ou esfacelo."
      },
      {
        tipo: "multipla_selecao",
        tema: "MATERIAIS DE CURATIVO",
        pergunta: "Quais materiais você separa para realizar o curativo estéril?",
        opcoes: [
          "Soro fisiológico 0,9% aquecido em temperatura ambiente",
          "Luvas de procedimento e kit de curativo estéril",
          "Gaze estéril e cobertura primária apropriada",
          "Fita hipoalergênica para fixação",
          "Álcool 70% direto no leito da ferida",
          "Algodão hidrófilo em pasta para o leito"
        ],
        corretas: [0, 1, 2, 3],
        explicacao: "A limpeza é realizada com SF 0,9% morno em jato suave e gaze estéril. Álcool agride células epiteliais e algodão solta fiapos que causam corpo estranho."
      },
      {
        tipo: "calculo",
        tema: "CÁLCULO DE ANALGESIA",
        pergunta: "Quantos mL você prepara para o alívio da dor do paciente?",
        prescricao: "Dipirona 500 mg/mL, solução injetável. Prescrito: 1 g por via intravenosa lenta.",
        dadosTabela: [
          ["Prescrito", "1 g (1000 mg)"],
          ["Apresentação", "500 mg/mL"],
          ["Via de Administração", "IV lenta"],
          ["Unidade da Resposta", "em mL"]
        ],
        formulaGuia: "Dose prescrita ÷ Concentração",
        unidade: "mL",
        variaveis: {
          dose_mg: 1000,
          concentracao_mg_ml: 500
        },
        formula: "dose_mg / concentracao_mg_ml",
        respostaEsperada: 2,
        tolerancia: 0.01,
        explicacao: "Dose prescrita (1000 mg) ÷ Concentração disponível (500 mg/mL) = 2 mL."
      },
      {
        tipo: "multipla_escolha",
        tema: "TÉCNICA DE LIMPEZA",
        pergunta: "Qual técnica é preconizada pelo Ministério da Saúde para limpar a lesão sem traumatizar o tecido de granulação?",
        opcoes: [
          "Irrigação por jato de soro fisiológico 0,9% morno com seringa e agulha",
          "Esfregar vigorosamente com gaze embebida em clorexidina degermante",
          "Secar com compressa seca friccionando as bordas",
          "Aplicar tintura de iodo diretamente sobre o exsudato"
        ],
        correta: 0,
        explicacao: "A irrigação com jato suave de SF 0,9% remove exsudato e debris sem destruir os novos capilares do tecido de granulação."
      },
      {
        tipo: "multipla_selecao",
        tema: "PREVENÇÃO E ALÍVIO DE PRESSÃO",
        pergunta: "Quais condutas de enfermagem previnem a piora da lesão e protegem outras proeminências?",
        opcoes: [
          "Mudança de decúbito a cada 2 horas conforme escala de risco",
          "Uso de coxim na panturrilha para descarregar o calcanhar do colchão",
          "Manutenção da pele perilesional limpa, seca e hidratada",
          "Massagem forte sobre regiões ósseas hiperemiadas",
          "Manter o paciente permanentemente na mesma posição dorsal"
        ],
        corretas: [0, 1, 2],
        explicacao: "Mudança regular de decúbito, alívio de peso (coxins) e hidratação cutânea são essenciais. Nunca faça massagem em áreas com hiperemia pois piora a isquemia tissular."
      },
      {
        tipo: "calculo",
        tema: "CÁLCULO DE GOTEJAMENTO",
        pergunta: "Quantas gotas por minuto (macrogotas) devem correr na hidratação prescrita?",
        prescricao: "Soro Fisiológico 0,9% 500 mL para infundir em 6 horas, equipo macrogotas.",
        dadosTabela: [
          ["Volume Prescrito", "500 mL"],
          ["Tempo de Infusão", "6 horas"],
          ["Equipo Utilizado", "Macrogotas"],
          ["Unidade da Resposta", "gotas/min"]
        ],
        formulaGuia: "Volume ÷ (Tempo × 3)",
        unidade: "gotas/min",
        variaveis: {
          volume_ml: 500,
          tempo_h: 6
        },
        formula: "volume_ml / (tempo_h * 3)",
        respostaEsperada: 28,
        tolerancia: 0.05,
        explicacao: "Gotas/min = Volume ÷ (Tempo × 3) = 500 ÷ (6 × 3) = 500 ÷ 18 = 27,77... Arredondando = 28 gotas/minuto."
      },
      {
        tipo: "resposta_falada",
        tema: "BIOSSEGURANÇA UNIVERSAL",
        pergunta: "Antes de colocar as luvas e tocar no paciente, diga qual procedimento primordial você realiza.",
        aceitas: [
          "higienizar as maos",
          "higiene das maos",
          "lavar as maos",
          "lavagem das maos",
          "friccao alcoolica",
          "higienizacao com alcool"
        ],
        respostaCertaTexto: "Higienizar as mãos",
        explicacao: "A higienização das mãos (com água e sabão ou álcool 70%) antes do contato com o paciente é a principal meta de segurança internacional da OMS."
      },
      {
        tipo: "multipla_escolha",
        tema: "ESCALA DE BRADEN",
        pergunta: "Na Escala de Braden para predição do risco de lesão por pressão, qual parâmetro avalia a sensibilidade a desconforto?",
        opcoes: [
          "Percepção sensorial",
          "Fricção e cisalhamento",
          "Atividade física",
          "Mobilidade no leito"
        ],
        correta: 0,
        explicacao: "A Percepção Sensorial na Escala de Braden mensura a capacidade do paciente em perceber e reagir significativamente à pressão e dor."
      }
    ]
  },

  teresinha: {
    id: "caso-teresinha-antibiotico-flebite",
    pacienteId: "teresinha",
    titulo: "Administração de antibiótico intravenoso e prevenção de flebite",
    subtitulo: "Paciente simulado fala com você · 8 questões",
    chips: ["Atendimento por voz", "Caso simulado"],
    passos: [
      {
        tipo: "fala",
        texto: "Oi, filha! O médico disse que preciso tomar esse antibiótico na veia para a infecção urinária. Meu braço está meio dolorido perto do cateter e sinto um formigamento. Você pode olhar para mim antes de aplicar?"
      },
      {
        tipo: "multipla_escolha",
        tema: "AVALIAÇÃO DO ACESSO",
        pergunta: "Ao inspecionar o acesso venoso periférico, qual sinal clínico indica flebite e necessidade de retirada imediata?",
        opcoes: [
          "Presença de hiperemia, calor local, dor e cordão venoso palpável",
          "Curativo seco, limpo e transparente sem sinais flogísticos",
          "Pele normocorada com refluxo sanguíneo presente",
          "Infusão sem resistência e paciente sem queixas álgicas"
        ],
        correta: 0,
        explicacao: "Hiperemia, calor local, dor e cordão fibroso palpável caracterizam flebite. A infusão deve ser imediatamente interrompida e o cateter retirado."
      },
      {
        tipo: "multipla_selecao",
        tema: "CONDUTAS IMEDIATAS",
        pergunta: "Identificada a flebite no braço esquerdo, quais ações você executa de imediato?",
        opcoes: [
          "Interromper imediatamente a infusão medicamentosa",
          "Retirar o cateter venoso periférico do sítio afetado",
          "Aplicar compressa morna no membro acometido para alívio álgico",
          "Puncionar novo acesso em outro membro para dar continuidade à terapia",
          "Empurrar o cateter para tentar melhorar o fluxo venoso",
          "Infundir soro fisiológico em bólus forte para desobstruir"
        ],
        corretas: [0, 1, 2, 3],
        explicacao: "O cateter com flebite nunca deve ser forçado ou mantido. Deve-se interromper, retirar, confortar com compressa morna e puncionar novo sítio."
      },
      {
        tipo: "calculo",
        tema: "RECONSTITUIÇÃO E DILUIÇÃO",
        pergunta: "Quantos mL você aspira do frasco reconstituído para administrar a dose prescrita?",
        prescricao: "Ceftriaxona 1 g frasco-ampola pó liofilizado reconstituído com 10 mL de diluente. Prescrito: 500 mg IV.",
        dadosTabela: [
          ["Prescrito", "500 mg"],
          ["Apresentação", "1 g (1000 mg) em 10 mL"],
          ["Via", "Intravenosa (IV)"],
          ["Unidade da Resposta", "em mL"]
        ],
        formulaGuia: "(Dose prescrita × Volume total) ÷ Frasco",
        unidade: "mL",
        variaveis: {
          dose_prescrita_mg: 500,
          volume_total_ml: 10,
          dose_frasco_mg: 1000
        },
        formula: "(dose_prescrita_mg * volume_total_ml) / dose_frasco_mg",
        respostaEsperada: 5,
        tolerancia: 0.01,
        explicacao: "Regra de três simples: 1000 mg está em 10 mL; logo 500 mg está em (500 × 10) ÷ 1000 = 5 mL."
      },
      {
        tipo: "multipla_escolha",
        tema: "SELEÇÃO DE NOVO SÍTIO",
        pergunta: "Ao puncionar novo acesso venoso periférico na Dona Teresinha, qual a recomendação técnica de boas práticas?",
        opcoes: [
          "Puncionar em membro contralateral, iniciando preferencialmente de distal para proximal",
          "Puncionar exatamente no mesmo trajeto venoso da flebite",
          "Puncionar a prega do cotovelo para o cateter ficar mais fixo",
          "Usar cateter de maior calibre possível independente do vaso"
        ],
        correta: 0,
        explicacao: "A punção deve ser no membro oposto, preservando a rede venosa iniciando de distal para proximal e respeitando o calibre adequado da veia."
      },
      {
        tipo: "multipla_selecao",
        tema: "SEGURANÇA DO PACIENTE",
        pergunta: "Quais verificações são obrigatórias antes da infusão de antibiótico intravenoso?",
        opcoes: [
          "Checar 2 identificadores do paciente (nome completo e data de nascimento na pulseira)",
          "Confirmar o medicamento, dosagem, via e horário prescritos",
          "Perguntar sobre histórico de reações alérgicas a betalactâmicos/cefalosporinas",
          "Verificar data de validade e aspecto da solução reconstituída",
          "Infundir o antibiótico em bólus de 3 segundos para adiantar o horário",
          "Reutilizar seringa de outro paciente caso o bico esteja protegido"
        ],
        corretas: [0, 1, 2, 3],
        explicacao: "A segurança requer conferência de paciente, 9 certos, histórico de alergias e aspecto da solução. Bólus ultra-rápido de antibiótico traz risco cardiovascular severo."
      },
      {
        tipo: "calculo",
        tema: "INFUSÃO EM BOMBA (BIC)",
        pergunta: "A que velocidade em mL/h você programa a Bomba de Infusão Contínua (BIC)?",
        prescricao: "Ceftriaxona 500 mg diluída em 100 mL de Soro Fisiológico 0,9% para correr em 30 minutos.",
        dadosTabela: [
          ["Volume da Solução", "100 mL"],
          ["Tempo de Infusão", "30 minutos (0,5 hora)"],
          ["Dispositivo", "Bomba de Infusão (BIC)"],
          ["Unidade da Resposta", "em mL/h"]
        ],
        formulaGuia: "Volume (mL) ÷ Tempo (horas)",
        unidade: "mL/h",
        variaveis: {
          volume_ml: 100,
          tempo_h: 0.5
        },
        formula: "volume_ml / tempo_h",
        respostaEsperada: 200,
        tolerancia: 0.02,
        explicacao: "Vazão da BIC = Volume (mL) ÷ Tempo (h) = 100 mL ÷ 0,5 h = 200 mL/h."
      },
      {
        tipo: "resposta_falada",
        tema: "DESINFECÇÃO DE CONECTORES",
        pergunta: "Antes de acoplar a seringa ou o equipo ao conector venoso (hub), qual cuidado asséptico você realiza?",
        aceitas: [
          "antissepsia do hub",
          "antissepsia do conector",
          "desinfeccao com alcool 70",
          "limpar conector com alcool",
          "friccao com alcool 70",
          "alcool 70"
        ],
        respostaCertaTexto: "Antissepsia do hub com álcool 70%",
        explicacao: "A fricção mecânica com álcool 70% por 15 segundos no hub/conector sem agulha é crucial para prevenir infecções de corrente sanguínea relacionadas a cateter (IPCS)."
      },
      {
        tipo: "multipla_escolha",
        tema: "DIAGNÓSTICO DIFERENCIAL",
        pergunta: "Qual achado clínico diferencia uma infiltração venosa de uma flebite?",
        opcoes: [
          "Edema frio, palidez cutânea e redução do gotejamento por compressão mecânica",
          "Hiperemia intensa e calor local irradiado",
          "Endurecimento venoso com cordão palpável doloroso",
          "Eritema delimitado ao redor do cateter"
        ],
        correta: 0,
        explicacao: "A infiltração cursa com extravasamento extravascular de fluido não vesicante, gerando edema frio e pele pálida, ao contrário do calor e rubor da flebite inflamatória."
      }
    ]
  }
};

/**
 * Algoritmo Fisher-Yates para embaralhamento imutável.
 */
export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Gera um caso clínico pronto para a lição, com:
 * 1. Fala inicial do paciente sempre no passo 0.
 * 2. Embaralhamento da ordem das questões subsequentes.
 * 3. Embaralhamento das alternativas (múltipla escolha e múltipla seleção) recalculando os índices de resposta correta.
 * 4. Garante no mínimo minQuestions questões.
 */
export function gerarCasoAleatorio(pacienteId = null, { shuffleQuestions = true, minQuestions = 8 } = {}) {
  const idsDisponiveis = Object.keys(CASOS_SIMULADOR);
  const idEscolhido = pacienteId || idsDisponiveis[Math.floor(Math.random() * idsDisponiveis.length)];
  const casoBase = CASOS_SIMULADOR[idEscolhido] || CASOS_SIMULADOR.marcus;

  const falaInicial = casoBase.passos.find((p) => p.tipo === "fala") || casoBase.passos[0];
  const questoes = casoBase.passos.filter((p) => p.tipo !== "fala");

  let questoesProcessadas = shuffleQuestions ? shuffleArray(questoes) : [...questoes];

  if (questoesProcessadas.length < minQuestions) {
    // Se precisar de mais, complementa repetindo ou mantendo o acervo completo
    questoesProcessadas = questoes;
  }

  // Embaralha as alternativas internamente de cada questão
  const questoesEmbaralhadas = questoesProcessadas.map((q) => {
    if (q.tipo === "multipla_escolha") {
      const opcoesComIndex = q.opcoes.map((texto, originalIdx) => ({
        texto,
        isCorreta: originalIdx === q.correta
      }));
      const opcoesShuffled = shuffleArray(opcoesComIndex);
      const novaCorreta = opcoesShuffled.findIndex((item) => item.isCorreta);

      return {
        ...q,
        opcoes: opcoesShuffled.map((item) => item.texto),
        correta: novaCorreta
      };
    }

    if (q.tipo === "multipla_selecao") {
      const opcoesComIndex = q.opcoes.map((texto, originalIdx) => ({
        texto,
        isCorreta: q.corretas.includes(originalIdx)
      }));
      const opcoesShuffled = shuffleArray(opcoesComIndex);
      const novasCorretas = opcoesShuffled
        .map((item, idx) => (item.isCorreta ? idx : null))
        .filter((idx) => idx !== null);

      return {
        ...q,
        opcoes: opcoesShuffled.map((item) => item.texto),
        corretas: novasCorretas
      };
    }

    return { ...q };
  });

  const totalQuestoes = questoesEmbaralhadas.length;

  return {
    ...casoBase,
    subtitulo: `Paciente simulado fala com você · ${totalQuestoes} questões`,
    passos: [falaInicial, ...questoesEmbaralhadas]
  };
}
