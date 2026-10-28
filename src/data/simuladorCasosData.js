/**
 * simuladorCasosData.js
 *
 * Catálogo canônico de casos clínicos locais para o Atendimento por Voz (Videochamada).
 * Contém dados completos para os 2 pacientes (Sr. Marcus e Dona Teresinha),
 * com banco ampliado de 44 questões clínicas de alto padrão baseadas em evidências,
 * com cálculo de medicação, fórmulas guias, reconhecimento de voz e
 * suporte à geração/embaralhamento procedural com Fisher-Yates.
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
    titulo: "Curativo em lesão por pressão no calcanhar e clínica cirúrgica",
    subtitulo: "Paciente simulado fala com você · Banco de 22 passos clínicos",
    chips: ["Atendimento por voz", "Caso simulado", "Banco ampliado"],
    passos: [
      {
        tipo: "fala",
        texto: "Bom dia! Essa ferida no meu calcanhar já está comigo há uns dez dias. Ela está molhada, solta um líquido amarelado e dói quando encosta no lençol. O que você vai fazer comigo?",
        audioPath: "/pacientes/marcus/passo_0.wav"
      },
      {
        tipo: "multipla_escolha",
        tema: "AVALIAÇÃO E ESTADIAMENTO",
        pergunta: "Ao avaliar a ferida com perda parcial da espessura da pele e leito avermelhado sem esfacelo visível, como você a classifica segundo a NPUAP?",
        audioPath: "/pacientes/marcus/passo_1.wav",
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
        audioPath: "/pacientes/marcus/passo_2.wav",
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
        audioPath: "/pacientes/marcus/passo_3.wav",
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
        audioPath: "/pacientes/marcus/passo_4.wav",
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
        audioPath: "/pacientes/marcus/passo_5.wav",
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
        audioPath: "/pacientes/marcus/passo_6.wav",
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
        audioPath: "/pacientes/marcus/passo_7.wav",
        aceitas: [
          "higienizar as maos",
          "higienizar maos",
          "higiene das maos",
          "higiene de maos",
          "limpeza das maos",
          "limpeza de maos",
          "limpar as maos",
          "limpar maos",
          "lavar as maos",
          "lavar maos",
          "lavagem das maos",
          "lavagem de maos",
          "limpar a pele",
          "limpeza da pele",
          "higienizar a pele",
          "higienizar os dedos",
          "lavagem das maos com agua e sabao",
          "friccao alcoolica",
          "higienizacao com alcool",
          "higienizar com alcool",
          "passar alcool nas maos",
          "passar alcool em gel",
          "alcool em gel",
          "passar alcool 70",
          "higienizacao das maos",
          "higienizacao",
          "lavagem simples",
          "antissepsia das maos",
          "assepsia das maos"
        ],
        respostaCertaTexto: "Higienizar as mãos",
        explicacao: "A higienização das mãos (com água e sabão ou álcool 70%) antes do contato com o paciente é a principal meta de segurança internacional da OMS."
      },
      {
        tipo: "multipla_escolha",
        tema: "ESCALA DE BRADEN",
        pergunta: "Na Escala de Braden para predição do risco de lesão por pressão, qual parâmetro avalia a sensibilidade a desconforto?",
        audioPath: "/pacientes/marcus/passo_8.wav",
        opcoes: [
          "Percepção sensorial",
          "Fricção e cisalhamento",
          "Atividade física",
          "Mobilidade no leito"
        ],
        correta: 0,
        explicacao: "A Percepção Sensorial na Escala de Braden mensura a capacidade do paciente em perceber e reagir significativamente à pressão e dor."
      },
      {
        tipo: "multipla_escolha",
        tema: "SELEÇÃO DE COBERTURA",
        pergunta: "Para manter o leito úmido favorável e estimular a epitelização de lesão estágio 2 sem infecção, qual cobertura é indicada?",
        audioPath: "/pacientes/marcus/passo_9.wav",
        opcoes: [
          "Curativo hidrocoloide em placa ou hidrogel",
          "Gaze seca com fita adesiva simples",
          "Sulfadiazina de prata a 1% sem oclusão",
          "Carvão ativado com prata para odor fétido"
        ],
        correta: 0,
        explicacao: "O hidrocoloide ou hidrogel mantém o microambiente úmido fisiológico, promovendo a migração de queratinócitos e a regeneração tecidual sem trauma."
      },
      {
        tipo: "multipla_selecao",
        tema: "SINAIS DE INFECÇÃO LOCAL",
        pergunta: "Quais alterações clínicas no leito ou bordas da ferida sugerem infecção bacteriana secundária?",
        audioPath: "/pacientes/marcus/passo_10.wav",
        opcoes: [
          "Exsudato francamente purulento com odor fétido característico",
          "Hiperemia e calor perilesional estendendo-se por mais de 2 cm",
          "Piora súbita da intensidade da dor local",
          "Leito róseo brilhante com tecido de granulação saudável",
          "Bordas epiteliais com migração centrípeta visível"
        ],
        corretas: [0, 1, 2],
        explicacao: "Exsudato purulento, odor fétido, eritema perilesional expandido e dor exacerbada são sinais clássicos de infecção que exigem reavaliação médica e culturas."
      },
      {
        tipo: "calculo",
        tema: "PROFILAXIA DE TROMBOSE (TVP)",
        pergunta: "Quantos mL de Enoxaparina você administra para a profilaxia de trombose venosa profunda?",
        audioPath: "/pacientes/marcus/passo_11.wav",
        prescricao: "Enoxaparina sódica 40 mg/0,4 mL seringa preenchida. Prescrito: 40 mg por via subcutânea.",
        dadosTabela: [
          ["Prescrito", "40 mg"],
          ["Apresentação", "40 mg em 0,4 mL"],
          ["Via", "Subcutânea (SC)"],
          ["Unidade da Resposta", "em mL"]
        ],
        formulaGuia: "(Dose prescrita × Volume) ÷ Concentração",
        unidade: "mL",
        variaveis: {
          dose_mg: 40,
          vol_ml: 0.4,
          apresentacao_mg: 40
        },
        formula: "(dose_mg * vol_ml) / apresentacao_mg",
        respostaEsperada: 0.4,
        tolerancia: 0.01,
        explicacao: "Seringa pronta para uso: 40 mg equivale a exatamente 0,4 mL administrados por via subcutânea na prega abdominal."
      },
      {
        tipo: "multipla_escolha",
        tema: "MANEJO DE ANALGESIA",
        pergunta: "Em pacientes idosos com feridas dolorosas, qual conduta de enfermagem é prioritária antes de manipular o curativo?",
        audioPath: "/pacientes/marcus/passo_12.wav",
        opcoes: [
          "Administrar o analgésico prescrito cerca de 30 minutos antes do procedimento",
          "Realizar o curativo imediatamente para terminar o mais rápido possível",
          "Pedir ao paciente que tolere a dor para não mascarar a sensibilidade",
          "Aplicar anestésico em spray não estéril diretamente na ferida"
        ],
        correta: 0,
        explicacao: "A analgesia preemptiva 30 a 45 minutos antes do desbridamento ou troca de curativo garante conforto, reduz picos hipertensivos e melhora a cooperação do paciente."
      },
      {
        tipo: "resposta_falada",
        tema: "POSICIONAMENTO DE CALCANHAR",
        pergunta: "Diga qual cuidado físico de posicionamento você realiza para manter o calcanhar do paciente sem contato com o colchão.",
        audioPath: "/pacientes/marcus/passo_13.wav",
        aceitas: [
          "coxim na panturrilha",
          "coxim",
          "colocar coxim na panturrilha",
          "colocar coxim",
          "elevar o calcanhar",
          "elevacao do calcanhar",
          "elevar calcanhar",
          "suspensao do calcanhar",
          "suspender o calcanhar",
          "descarregar o calcanhar",
          "travesseiro na panturrilha",
          "almofada na panturrilha",
          "coxim sob a panturrilha",
          "coxim debaixo da perna",
          "alivio de pressao no calcanhar",
          "aliviar a pressao",
          "descarregar a pressao",
          "calcanhar livre",
          "manter calcanhar suspenso"
        ],
        respostaCertaTexto: "Coxim na panturrilha para elevação do calcanhar",
        explicacao: "Posicionar um coxim ao longo da panturrilha permite flutuação completa dos calcanhares, eliminando a pressão no calcâneo sem hiperextender os joelhos."
      },
      {
        tipo: "multipla_selecao",
        tema: "REMOÇÃO DE CURATIVO ADERIDO",
        pergunta: "Quando a gaze ou curativo antigo estiver firmemente aderido ao leito da lesão, quais condutas você adota?",
        audioPath: "/pacientes/marcus/passo_14.wav",
        opcoes: [
          "Umedecer abundantemente a gaze com soro fisiológico 0,9% estéril morno",
          "Aguardar alguns minutos para que a solução amoleça a crosta de fibrina",
          "Remover delicadamente pelas bordas sem tracionar bruscamente",
          "Puxar a gaze com força e de uma só vez para desbridar o leito",
          "Usar álcool puro para soltar a cola adesiva do leito ulcerado"
        ],
        corretas: [0, 1, 2],
        explicacao: "A hidratação abundante com SF 0,9% solta o curativo sem arrancar o tecido de granulação incipiente, prevenindo dor aguda e hemorragias."
      },
      {
        tipo: "calculo",
        tema: "ANTIBIÓTICO EM BIC",
        pergunta: "A quantos mL/h você programa a Bomba de Infusão Contínua para infundir o Ciprofloxacino prescrito?",
        audioPath: "/pacientes/marcus/passo_15.wav",
        prescricao: "Ciprofloxacino 200 mg em bolsa de 100 mL pronta para infusão em 60 minutos (1 hora).",
        dadosTabela: [
          ["Volume da Bolsa", "100 mL"],
          ["Tempo Prescrito", "60 minutos (1 hora)"],
          ["Dispositivo", "Bomba de Infusão (BIC)"],
          ["Unidade da Resposta", "em mL/h"]
        ],
        formulaGuia: "Volume (mL) ÷ Tempo (h)",
        unidade: "mL/h",
        variaveis: {
          volume_ml: 100,
          tempo_h: 1
        },
        formula: "volume_ml / tempo_h",
        respostaEsperada: 100,
        tolerancia: 0.01,
        explicacao: "Vazão da BIC = 100 mL ÷ 1 h = 100 mL/h."
      },
      {
        tipo: "multipla_escolha",
        tema: "CARACTERÍSTICAS DO EXSUDATO",
        pergunta: "Como você classifica um exsudato fluido, claro, de coloração amarelada tênue e sem odor desagradável?",
        audioPath: "/pacientes/marcus/passo_16.wav",
        opcoes: [
          "Exsudato seroso fisiológico",
          "Exsudato francamente purulento",
          "Exsudato hemorrágico ativo",
          "Biofilme bacteriano necrótico"
        ],
        correta: 0,
        explicacao: "O exsudato seroso é claro, translúcido e aquoso, resultante de exsudação proteica normal na fase inflamatória e proliferativa da cicatrização."
      },
      {
        tipo: "multipla_escolha",
        tema: "PROTEÇÃO DA PELE PERILESIONAL",
        pergunta: "Para proteger as bordas perilesionais contra a maceração causada pelo exsudato contínuo, qual produto é mais apropriado?",
        audioPath: "/pacientes/marcus/passo_17.wav",
        opcoes: [
          "Película protetora sem álcool (spray ou swab barreira)",
          "Tintura de benjoim pura aplicada na pele inflamada",
          "Pomada de neomicina em camada espessa",
          "Pó secativo à base de talco perfumado"
        ],
        correta: 0,
        explicacao: "Películas barreira poliméricas sem álcool formam um filme invisível que protege a epiderme contra a umidade e enzimas proteolíticas do exsudato."
      },
      {
        tipo: "multipla_selecao",
        tema: "AVALIAÇÃO VASCULAR DISTAL",
        pergunta: "Quais parâmetros devem ser checados no pé do Sr. Marcus para descartar insuficiência arterial associada?",
        audioPath: "/pacientes/marcus/passo_18.wav",
        opcoes: [
          "Palpação dos pulsos pedioso e tibial posterior",
          "Tempo de enchimento capilar (TEC normal até 3 segundos)",
          "Temperatura cutânea e coloração dos pododáctilos",
          "Aplicação de bolsa de gelo para anestesiar os artelhos",
          "Compressão elástica de alta compressão sem verificar pulsos"
        ],
        corretas: [0, 1, 2],
        explicacao: "Pulsos distais, tempo de enchimento capilar e temperatura térmica descartam isquemia arterial periférica crônica que impediria a cicatrização."
      },
      {
        tipo: "multipla_escolha",
        tema: "ÂNGULO DE CABECEIRA",
        pergunta: "Para prevenir o cisalhamento sacral e no calcâneo em pacientes acamados, qual o limite recomendado de inclinação da cabeceira?",
        audioPath: "/pacientes/marcus/passo_19.wav",
        opcoes: [
          "Máximo de 30 graus de elevação",
          "Elevação constante a 90 graus na posição sentada",
          "Elevação mínima de 60 graus durante todo o repouso",
          "Posição de Trendelenburg invertida permanente"
        ],
        correta: 0,
        explicacao: "Manter a cabeceira a no máximo 30 graus reduz forças de cisalhamento e pressão na região sacrococcígea e calcâneos."
      },
      {
        tipo: "calculo",
        tema: "SOROTERAPIA EM MACROGOTAS",
        pergunta: "Quantas gotas por minuto você regula para infundir 1000 mL de Soro Glicosado 5% em 12 horas?",
        audioPath: "/pacientes/marcus/passo_20.wav",
        prescricao: "Soro Glicosado 5% 1000 mL para infusão IV em 12 horas, equipo macrogotas.",
        dadosTabela: [
          ["Volume Total", "1000 mL"],
          ["Tempo de Infusão", "12 horas"],
          ["Equipo", "Macrogotas"],
          ["Unidade da Resposta", "gotas/min"]
        ],
        formulaGuia: "Volume ÷ (Tempo × 3)",
        unidade: "gotas/min",
        variaveis: {
          volume_ml: 1000,
          tempo_h: 12
        },
        formula: "volume_ml / (tempo_h * 3)",
        respostaEsperada: 28,
        tolerancia: 0.05,
        explicacao: "Gotas/min = 1000 ÷ (12 × 3) = 1000 ÷ 36 = 27,77... Arredondado = 28 gotas/minuto."
      },
      {
        tipo: "multipla_escolha",
        tema: "REGISTRO DE ENFERMAGEM",
        pergunta: "Segundo o COFEN, qual elemento é obrigatório na anotação de enfermagem referente à troca de curativo?",
        audioPath: "/pacientes/marcus/passo_21.wav",
        opcoes: [
          "Localização anatômica, dimensões, aspecto do leito, exsudato, produto aplicado e resposta do paciente",
          "Apenas escrever 'trocado curativo do calcanhar conforme prescrição'",
          "Anotar somente o horário e a assinatura do enfermeiro sem descrição da ferida",
          "Deixar para registrar apenas no relatório de passagem de plantão verbal"
        ],
        correta: 0,
        explicacao: "O registro deve ser fidedigno, descrevendo estadiamento, dimensões, tecido predominante, secreção, cobertura utilizada e tolerância do paciente."
      }
    ]
  },

  teresinha: {
    id: "caso-teresinha-antibiotico-flebite",
    pacienteId: "teresinha",
    titulo: "Terapia intravenosa, prevenção de flebite e farmacologia geriátrica",
    subtitulo: "Paciente simulado fala com você · Banco de 22 passos clínicos",
    chips: ["Atendimento por voz", "Caso simulado", "Banco ampliado"],
    passos: [
      {
        tipo: "fala",
        texto: "Oi, filha! O médico disse que preciso tomar esse antibiótico na veia para a infecção urinária. Meu braço está meio dolorido perto do cateter e sinto um formigamento. Você pode olhar para mim antes de aplicar?",
        audioPath: "/pacientes/teresinha/passo_0.wav"
      },
      {
        tipo: "multipla_escolha",
        tema: "AVALIAÇÃO DO ACESSO",
        pergunta: "Ao inspecionar o acesso venoso periférico, qual sinal clínico indica flebite e necessidade de retirada imediata?",
        audioPath: "/pacientes/teresinha/passo_1.wav",
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
        audioPath: "/pacientes/teresinha/passo_2.wav",
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
        audioPath: "/pacientes/teresinha/passo_3.wav",
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
        audioPath: "/pacientes/teresinha/passo_4.wav",
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
        audioPath: "/pacientes/teresinha/passo_5.wav",
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
        audioPath: "/pacientes/teresinha/passo_6.wav",
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
        audioPath: "/pacientes/teresinha/passo_7.wav",
        aceitas: [
          "antissepsia do hub",
          "antissepsia de hub",
          "antissepsia do conector",
          "antissepsia de conector",
          "desinfeccao com alcool 70",
          "desinfeccao do conector",
          "desinfeccao do hub",
          "limpar conector com alcool",
          "limpar hub com alcool",
          "limpar o conector",
          "limpar o hub",
          "limpar conector",
          "limpar hub",
          "friccao com alcool 70",
          "alcool 70",
          "passar alcool 70 no conector",
          "passar alcool no conector",
          "passar alcool no hub",
          "desinfeccao do conector com alcool 70",
          "friccao mecanica com alcool 70",
          "antissepsia",
          "desinfeccao"
        ],
        respostaCertaTexto: "Antissepsia do hub com álcool 70%",
        explicacao: "A fricção mecânica com álcool 70% por 15 segundos no hub/conector sem agulha é crucial para prevenir infecções de corrente sanguínea relacionadas a cateter (IPCS)."
      },
      {
        tipo: "multipla_escolha",
        tema: "DIAGNÓSTICO DIFERENCIAL",
        pergunta: "Qual achado clínico diferencia uma infiltração venosa de uma flebite?",
        audioPath: "/pacientes/teresinha/passo_8.wav",
        opcoes: [
          "Edema frio, palidez cutânea e redução do gotejamento por compressão mecânica",
          "Hiperemia intensa e calor local irradiado",
          "Endurecimento venoso com cordão palpável doloroso",
          "Eritema delimitado ao redor do cateter"
        ],
        correta: 0,
        explicacao: "A infiltração cursa com extravasamento extravascular de fluido não vesicante, gerando edema frio e pele pálida, ao contrário do calor e rubor da flebite inflamatória."
      },
      {
        tipo: "multipla_escolha",
        tema: "ESCALA DE FLEBITE (INS)",
        pergunta: "Segundo a Infusion Nurses Society (INS), a presença de dor no local com eritema e/ou edema corresponde a qual grau de flebite?",
        audioPath: "/pacientes/teresinha/passo_9.wav",
        opcoes: [
          "Grau 2",
          "Grau 1 (apenas eritema sem dor)",
          "Grau 3 (cordão venoso palpável)",
          "Grau 4 (drenagem purulenta)"
        ],
        correta: 0,
        explicacao: "Pela escala INS: Grau 1 tem eritema com ou sem dor; Grau 2 tem dor com eritema e/ou edema; Grau 3 cordão venoso palpável; Grau 4 drenagem purulenta franca."
      },
      {
        tipo: "multipla_selecao",
        tema: "FATORES DE FLEBITE QUÍMICA",
        pergunta: "Quais fatores farmacológicos e físicos favorecem o surgimento de flebite química durante infusões periféricas?",
        audioPath: "/pacientes/teresinha/passo_10.wav",
        opcoes: [
          "Medicamentos com osmolaridade elevada superior a 600 mOsm/L",
          "Soluções com pH extremo (ácido < 5 ou básico > 9)",
          "Velocidade de infusão rápida demais para o calibre do vaso",
          "Diluição adequada em grandes volumes de soro compatível",
          "Uso de cateter de fino calibre em veia de bom fluxo"
        ],
        corretas: [0, 1, 2],
        explicacao: "Osmolaridade alta, pH fora da faixa fisiológica e infusão rápida agridem o endotélio vascular íntimo, desencadeando flebite química."
      },
      {
        tipo: "calculo",
        tema: "GOTEJAMENTO EM MICROGOTAS",
        pergunta: "Quantas microgotas por minuto devem ser reguladas para infundir 100 mL de solução em 45 minutos?",
        audioPath: "/pacientes/teresinha/passo_11.wav",
        prescricao: "Ceftriaxona 500 mg em 100 mL de SF 0,9% para correr em 45 minutos em equipo microgotas.",
        dadosTabela: [
          ["Volume da Solução", "100 mL"],
          ["Tempo de Infusão", "45 minutos"],
          ["Tipo de Equipo", "Microgotas"],
          ["Unidade da Resposta", "microgotas/min"]
        ],
        formulaGuia: "(Volume × 60) ÷ Tempo em minutos",
        unidade: "microgotas/min",
        variaveis: {
          volume_ml: 100,
          tempo_min: 45
        },
        formula: "(volume_ml * 60) / tempo_min",
        respostaEsperada: 133,
        tolerancia: 0.02,
        explicacao: "Fórmula para tempo em minutos: Microgotas/min = (Volume × 60) ÷ Minutos = (100 × 60) ÷ 45 = 6000 ÷ 45 = 133,3... Arredondado = 133 microgotas/min."
      },
      {
        tipo: "multipla_escolha",
        tema: "TEMPO DE FRICÇÃO DO CONECTOR",
        pergunta: "Qual o tempo mínimo recomendado de fricção mecânica com álcool 70% no conector sem agulha (hub) antes de conectar a linha venosa?",
        audioPath: "/pacientes/teresinha/passo_12.wav",
        opcoes: [
          "15 segundos de fricção vigorosa com gaze alcoólica",
          "Apenas encostar a gaze por 2 segundos",
          "30 minutos de imersão em água sanitária",
          "Não há necessidade se o cateter estiver tampado"
        ],
        correta: 0,
        explicacao: "A fricção mecânica vigorosa por no mínimo 15 segundos remove o biofilme e bactérias aderidas ao septo do conector, prevenindo infecção de corrente sanguínea."
      },
      {
        tipo: "resposta_falada",
        tema: "PERMEABILIDADE DO CATETER",
        pergunta: "Diga qual técnica você realiza com seringa de soro para checar se o acesso venoso está pérvio antes de aplicar o antibiótico.",
        audioPath: "/pacientes/teresinha/passo_13.wav",
        aceitas: [
          "flush",
          "salinizacao",
          "salinizar o acesso",
          "salinizar o cateter",
          "fazer flush",
          "lavar com soro",
          "lavagem com soro fisiologico",
          "lavar o cateter com soro",
          "irrigacao com soro fisiologico",
          "lavar o cateter",
          "testar refluxo",
          "aspirar sangue",
          "aspirar o sangue",
          "teste de refluxo com seringa",
          "lavagem em bolus",
          "flush com soro fisiologico",
          "flush com soro",
          "salinizacao do cateter",
          "salinizar",
          "teste de permeabilidade"
        ],
        respostaCertaTexto: "Flush ou salinização com soro fisiológico",
        explicacao: "O flush (injeção em bólus pulsátil de 3 a 5 mL de SF 0,9%) confirma a permeabilidade venosa, ausência de extravasamento e limpa resíduos de fármacos incompatíveis."
      },
      {
        tipo: "multipla_selecao",
        tema: "PUNÇÃO VENOSA SEGURA",
        pergunta: "Selecione todos os materiais obrigatórios para realizar nova punção venosa periférica estéril.",
        audioPath: "/pacientes/teresinha/passo_14.wav",
        opcoes: [
          "Cateter intravenoso sobre agulha de calibre adequado",
          "Algodão embebido em álcool 70% ou clorexidina alcoólica 0,5%",
          "Garrote de borracha limpo e desinfetado",
          "Curativo estéril transparente com fita de estabilização",
          "Lâmina de bisturi número 11 para incisão de pele",
          "Agulha de aspiração 40x12 sem proteção"
        ],
        corretas: [0, 1, 2, 3],
        explicacao: "Cateter, antisséptico (clorexidina/álcool), garrote e cobertura estéril formam o kit básico seguro. Lâminas e agulhas calibrosas são contraindicadas na punção venosa simples."
      },
      {
        tipo: "calculo",
        tema: "CÁLCULO DE DIURÉTICO",
        pergunta: "Quantos mL de Furosemida você aspira da ampola para administrar a dose prescrita?",
        audioPath: "/pacientes/teresinha/passo_15.wav",
        prescricao: "Furosemida 20 mg/2 mL ampola. Prescrito: 10 mg por via intravenosa lenta.",
        dadosTabela: [
          ["Dose Prescrita", "10 mg"],
          ["Apresentação", "20 mg em 2 mL"],
          ["Via", "Intravenosa lenta"],
          ["Unidade da Resposta", "em mL"]
        ],
        formulaGuia: "(Dose prescrita × Volume total) ÷ Concentração",
        unidade: "mL",
        variaveis: {
          dose_prescrita_mg: 10,
          volume_ampola_ml: 2,
          dose_ampola_mg: 20
        },
        formula: "(dose_prescrita_mg * volume_ampola_ml) / dose_ampola_mg",
        respostaEsperada: 1,
        tolerancia: 0.01,
        explicacao: "Concentração é 20 mg em 2 mL (10 mg/mL). Logo, para administrar 10 mg, aspira-se exatamente 1 mL."
      },
      {
        tipo: "multipla_escolha",
        tema: "ESCOLHA DO CALIBRE DO CATETER",
        pergunta: "Considerando a fragilidade capilar da paciente idosa e a infusão de antibiótico não vesicante, qual calibre de cateter periférico é o mais indicado?",
        audioPath: "/pacientes/teresinha/passo_16.wav",
        opcoes: [
          "Cateter calibre 22G ou 24G",
          "Cateter calibroso 14G ou 16G para ressuscitação",
          "Cateter 18G obrigatório para qualquer infusão",
          "Agulha hipodérmica simples sem cateter plástico"
        ],
        correta: 0,
        explicacao: "Cateteres finos (22G e 24G) diminuem o traumatismo mecânico na túnica íntima venosa do idoso e asseguram fluxo sanguíneo periférico ao redor da cânula."
      },
      {
        tipo: "multipla_selecao",
        tema: "AVALIAÇÃO DE SOBRECARGA HÍDRICA",
        pergunta: "Quais sinais clínicos em paciente idoso indicam sobrecarga hídrica (hipervolemia) durante terapia intravenosa?",
        audioPath: "/pacientes/teresinha/passo_17.wav",
        opcoes: [
          "Surgimento de estertores crepitantes nas bases pulmonares à ausculta",
          "Ingurgitamento jugular patológico a 45 graus",
          "Dispneia progressiva e tosse seca ao deitar (ortopneia)",
          "Edema depressível importante em membros inferiores",
          "Pele extremamente seca com turgor acentuadamente diminuído",
          "Hipotensão ortostática com boca seca"
        ],
        corretas: [0, 1, 2, 3],
        explicacao: "Estertores creptantes, estase jugular, dispneia e edema gravitacional denunciam sobrecarga hídrica decorrente de taxa de infusão excessiva em idosos."
      },
      {
        tipo: "multipla_escolha",
        tema: "PREVENÇÃO DE LESÃO POR ADESIVO (MARSI)",
        pergunta: "Ao retirar o curativo transparente da pele frágil da Dona Teresinha, qual técnica previne lesão por fricção e desnudamento cutâneo?",
        audioPath: "/pacientes/teresinha/passo_18.wav",
        opcoes: [
          "Esticar a película paralelamente à pele (técnica pull and stretch) com removedor sem álcool",
          "Puxar para cima perpendicularmente em ângulo de 90 graus de forma rápida",
          "Friccionar com éter ou acetona hospitalar",
          "Arrancar bruscamente junto com os pelos do antebraço"
        ],
        correta: 0,
        explicacao: "A remoção de coberturas adesivas em idosos deve ser paralela à superfície cutânea com estabilização da pele e uso de spray removedor sem álcool."
      },
      {
        tipo: "calculo",
        tema: "INFUSÃO LENTA EM BIC",
        pergunta: "A quantos mL/h deve ser programada a Bomba de Infusão para administrar 250 mL de Soro Fisiológico em 4 horas?",
        audioPath: "/pacientes/teresinha/passo_19.wav",
        prescricao: "Soro Fisiológico 0,9% 250 mL para correr em 4 horas contínuas em BIC.",
        dadosTabela: [
          ["Volume Prescrito", "250 mL"],
          ["Tempo de Infusão", "4 horas"],
          ["Bomba", "BIC"],
          ["Unidade da Resposta", "em mL/h"]
        ],
        formulaGuia: "Volume ÷ Tempo em horas",
        unidade: "mL/h",
        variaveis: {
          volume_ml: 250,
          tempo_h: 4
        },
        formula: "volume_ml / tempo_h",
        respostaEsperada: 62.5,
        tolerancia: 0.1,
        explicacao: "Velocidade = 250 mL ÷ 4 horas = 62,5 mL/h."
      },
      {
        tipo: "multipla_escolha",
        tema: "COLETA DE UROCULTURA",
        pergunta: "Para garantir a confiabilidade do diagnóstico microbiológico, quando deve ser colhida a urocultura da Dona Teresinha?",
        audioPath: "/pacientes/teresinha/passo_20.wav",
        opcoes: [
          "Antes da administração da primeira dose do novo antibiótico",
          "Somente após completar 3 dias de tratamento com o antibiótico",
          "Imediatamente ao final da infusão da Ceftriaxona",
          "Qualquer momento, pois o antibiótico não altera o crescimento bacteriano"
        ],
        correta: 0,
        explicacao: "Culturas microbiológicas devem ser colhidas sempre antes do início da antibioticoterapia para evitar falso-negativos por inibição bacteriana precoce."
      },
      {
        tipo: "multipla_selecao",
        tema: "ORIENTAÇÕES AO PACIENTE",
        pergunta: "Quais orientações você fornece à Dona Teresinha sobre o cuidado com o novo sítio de punção venosa?",
        audioPath: "/pacientes/teresinha/passo_21.wav",
        opcoes: [
          "Avisar imediatamente a enfermagem se sentir dor, queimação ou umidade no curativo",
          "Evitar molhar o curativo durante o banho de leito ou chuveiro",
          "Não tracionar ou dobrar o braço excessivamente sobre a linha venosa",
          "Desconectar o equipo por conta própria caso queira ir ao banheiro",
          "Abrir a pinça do soro no máximo se achar que está pingando devagar"
        ],
        corretas: [0, 1, 2],
        explicacao: "Orientar o paciente a reconhecer dor, proteger a fixação da umidade e não manipular equipos é primordial para segurança e detecção precoce de extravasamento."
      }
    ]
  }
};

/**
 * Algoritmo Fisher-Yates para embaralhamento imutável.
 */
/**
 * Algoritmo Fisher-Yates aprimorado com alta entropia.
 */
export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    let rand = Math.random();
    if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
      const buf = new Uint32Array(1);
      window.crypto.getRandomValues(buf);
      rand = buf[0] / (0xffffffff + 1);
    }
    const j = Math.floor(rand * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Gera um caso clínico pronto para a lição, com:
 * 1. Fala inicial do paciente sempre no passo 0.
 * 2. Rotação estrita sem repetição via localStorage:
 *    Divide as 21 questões clínicas em 3 lotes de 7 questões 100% distintas.
 *    - Rodada 1: Lote 1 (7 questões inéditas)
 *    - Rodada 2: Lote 2 (7 questões inéditas)
 *    - Rodada 3: Lote 3 (7 questões inéditas)
 *    - Rodada 4+: Inicia novo ciclo com ordenação fresca reembaralhada.
 * 3. Embaralhamento dinâmico das alternativas recalculando os índices de gabarito.
 */
export function gerarCasoAleatorio(pacienteId = null, { shuffleQuestions = true, minQuestions = 7 } = {}) {
  const idsDisponiveis = Object.keys(CASOS_SIMULADOR);
  const idEscolhido = pacienteId || idsDisponiveis[Math.floor(Math.random() * idsDisponiveis.length)];
  const casoBase = CASOS_SIMULADOR[idEscolhido] || CASOS_SIMULADOR.marcus;

  const falaInicial = casoBase.passos.find((p) => p.tipo === "fala") || casoBase.passos[0];
  const todasQuestoes = casoBase.passos.filter((p) => p.tipo !== "fala");
  const totalDisponivel = todasQuestoes.length;
  const qtdPorRodada = Math.min(minQuestions || 7, totalDisponivel);

  const keyOrdem = `enfere_ciclo_ordem_${idEscolhido}`;
  const keyCursor = `enfere_ciclo_cursor_${idEscolhido}`;

  let indicesCiclo = [];
  let cursorAtual = 0;

  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const rawOrdem = window.localStorage.getItem(keyOrdem);
      const rawCursor = window.localStorage.getItem(keyCursor);
      if (rawOrdem) {
        indicesCiclo = JSON.parse(rawOrdem);
      }
      if (rawCursor !== null) {
        cursorAtual = parseInt(rawCursor, 10);
        if (isNaN(cursorAtual)) cursorAtual = 0;
      }
    }
  } catch {
    indicesCiclo = [];
    cursorAtual = 0;
  }

  // Se o ciclo não existe, tem tamanho incorreto ou o cursor esgotou as questões disponíveis:
  if (!indicesCiclo || indicesCiclo.length !== totalDisponivel || cursorAtual >= totalDisponivel) {
    const baseIndices = Array.from({ length: totalDisponivel }, (_, i) => i);
    indicesCiclo = shuffleArray(baseIndices);
    cursorAtual = 0;
  }

  // Fatura o lote atual estritamente sem sobreposição
  const fimLote = Math.min(cursorAtual + qtdPorRodada, totalDisponivel);
  const indicesLote = indicesCiclo.slice(cursorAtual, fimLote);

  // Se o lote final ficou menor que qtdPorRodada (ex: sobra 2 questões), completa com o início de um novo ciclo
  let indicesCompletos = [...indicesLote];
  let novoCursor = fimLote;

  if (indicesCompletos.length < qtdPorRodada) {
    const faltam = qtdPorRodada - indicesCompletos.length;
    const novosIndices = shuffleArray(Array.from({ length: totalDisponivel }, (_, i) => i));
    const complemento = novosIndices.slice(0, faltam);
    indicesCompletos = [...indicesCompletos, ...complemento];
    indicesCiclo = novosIndices;
    novoCursor = faltam;
  }

  // Atualiza o cursor persistente no localStorage
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(keyOrdem, JSON.stringify(indicesCiclo));
      window.localStorage.setItem(keyCursor, novoCursor.toString());
    }
  } catch {
    // Fallback silencioso
  }

  // Mapeia as questões do lote selecionado
  const questoesSelecionadas = indicesCompletos.map((idx) => todasQuestoes[idx]);

  // Embaralha as alternativas internamente de cada questão mantendo o gabarito
  const questoesEmbaralhadas = questoesSelecionadas.map((q, qIndex) => {
    const temaComProgresso = q.tema ? `${q.tema}` : `QUESTÃO ${qIndex + 1}`;

    if (q.tipo === "multipla_escolha") {
      const opcoesComIndex = q.opcoes.map((texto, originalIdx) => ({
        texto,
        isCorreta: originalIdx === q.correta
      }));
      const opcoesShuffled = shuffleArray(opcoesComIndex);
      const novaCorreta = opcoesShuffled.findIndex((item) => item.isCorreta);

      return {
        ...q,
        tema: temaComProgresso,
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
        tema: temaComProgresso,
        opcoes: opcoesShuffled.map((item) => item.texto),
        corretas: novasCorretas
      };
    }

    return { ...q, tema: temaComProgresso };
  });

  const totalQuestoes = questoesEmbaralhadas.length;
  const numLote = Math.min(3, Math.floor(cursorAtual / qtdPorRodada) + 1);

  return {
    ...casoBase,
    loteInfo: {
      loteAtual: numLote,
      totalLotes: 3,
      questoesNoLote: totalQuestoes,
      bancoTotal: totalDisponivel
    },
    subtitulo: `Paciente simulado fala com você · Sessão #${numLote} (${totalQuestoes} questões inéditas)`,
    passos: [falaInicial, ...questoesEmbaralhadas]
  };
}
