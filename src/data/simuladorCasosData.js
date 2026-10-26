/**
 * simuladorCasosData.js
 *
 * Catálogo canônico de casos clínicos locais para a Fase 1 do Atendimento por Voz.
 * Contém os dados dos 2 pacientes fictícios (Sr. Marcus e Dona Teresinha)
 * com 5 passos cada (Fala + 4 questões de tipos variados: Escolha, Seleção, Cálculo, Voz).
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
    subtitulo: "Paciente simulado fala com você · 5 questões",
    chips: ["Atendimento por voz", "Caso simulado"],
    passos: [
      {
        tipo: "fala",
        texto: "Bom dia! Essa ferida no meu calcanhar já está comigo há uns dez dias. Ela está molhada, solta um líquido amarelado e dói quando encosta no lençol. O que você vai fazer comigo?"
      },
      {
        tipo: "multipla_escolha",
        tema: "CONDUTA",
        pergunta: "Antes de escolher o curativo, qual é a primeira conduta?",
        opcoes: [
          "Avaliar a ferida (tamanho, leito, exsudato, bordas) e a pele ao redor",
          "Aplicar pomada em toda a área sem avaliar",
          "Cobrir com gaze seca e esparadrapo",
          "Esfregar a ferida com gaze e antisséptico forte"
        ],
        correta: 0,
        explicacao: "Toda conduta começa pela avaliação da lesão e da pele ao redor. Só depois se escolhe a limpeza e a cobertura."
      },
      {
        tipo: "multipla_selecao",
        tema: "MATERIAIS",
        pergunta: "Quais materiais você separa para o curativo?",
        opcoes: [
          "Soro fisiológico 0,9%",
          "Luvas de procedimento",
          "Gaze estéril",
          "Fita hipoalergênica",
          "Álcool 70% no leito da ferida",
          "Algodão (solta fiapos)"
        ],
        corretas: [0, 1, 2, 3],
        explicacao: "A limpeza é com soro fisiológico 0,9% e gaze estéril. Álcool no leito da ferida agride o tecido e algodão solta fiapos."
      },
      {
        tipo: "calculo",
        tema: "CÁLCULO DE DOSE",
        pergunta: "Quantos mL você prepara?",
        prescricao: "Dipirona 500 mg/mL, solução injetável. Prescrito: 1 g por via intravenosa.",
        dadosTabela: [
          ["Prescrito", "1 g (1000 mg)"],
          ["Frasco", "500 mg/mL"],
          ["Via", "IV"],
          ["Resposta", "em mL"]
        ],
        unidade: "mL",
        variaveis: {
          dose_mg: 1000,
          concentracao_mg_ml: 500
        },
        formula: "dose_mg / concentracao_mg_ml",
        respostaEsperada: 2,
        tolerancia: 0.01,
        explicacao: "Dose ÷ concentração = 1000 mg ÷ 500 mg/mL = 2 mL."
      },
      {
        tipo: "resposta_falada",
        tema: "RESPOSTA FALADA",
        pergunta: "Antes de tocar na ferida, diga qual passo você faz primeiro.",
        aceitas: [
          "higienizar as mãos",
          "lavar as mãos",
          "higiene das mãos",
          "higienizacao das maos",
          "lavagem das maos"
        ],
        respostaCertaTexto: "Higienizar as mãos",
        explicacao: "A higiene das mãos vem antes de qualquer contato com o paciente ou com a ferida."
      }
    ]
  },

  teresinha: {
    id: "caso-teresinha-antibiotico-flebite",
    pacienteId: "teresinha",
    titulo: "Administração de antibiótico intravenoso e prevenção de flebite",
    subtitulo: "Paciente simulado fala com você · 5 questões",
    chips: ["Atendimento por voz", "Caso simulado"],
    passos: [
      {
        tipo: "fala",
        texto: "Oi, filha! O médico disse que preciso tomar esse antibiótico na veia para a infecção urinária. Meu braço está meio dolorido perto do cateter e sinto um formigamento. Você pode olhar para mim antes de aplicar?"
      },
      {
        tipo: "multipla_escolha",
        tema: "AVALIAÇÃO DO ACESSO",
        pergunta: "Ao inspecionar o acesso venoso periférico, qual sinal indica necessidade de interrupção imediata?",
        opcoes: [
          "Presença de hiperemia, calor local e cordão fibroso palpável (flebite)",
          "Curativo seco, limpo e bem fixado com película transparente",
          "Fluxo livre de infusão e ausência de edema ou queixa álgica",
          "Retorno venoso positivo e pele ao redor normocorada"
        ],
        correta: 0,
        explicacao: "Hiperemia, dor e cordão venoso palpável indicam flebite. O acesso deve ser removido imediatamente e puncionado em outro sítio."
      },
      {
        tipo: "multipla_selecao",
        tema: "PREVENÇÃO E SEGURANÇA",
        pergunta: "Quais cuidados essenciais você adota na administração de antibiótico IV?",
        opcoes: [
          "Confirmar a identificação da paciente na pulseira com 2 identificadores",
          "Realizar antissepsia do conector (hub) com álcool 70% por 15 segundos",
          "Testar a permeabilidade do cateter venoso antes da infusão (flush)",
          "Checar alergias prévias relatadas pela paciente e no prontuário",
          "Infundir a medicação em bólus rápido de 5 segundos para agir mais rápido",
          "Utilizar a mesma agulha em pacientes diferentes se não encostar na pele"
        ],
        corretas: [0, 1, 2, 3],
        explicacao: "A segurança do paciente exige identificação correta, antissepsia de conectores, teste de permeabilidade e checagem de alergias. Bólus rápido é perigoso e agulhas são de uso único."
      },
      {
        tipo: "calculo",
        tema: "CÁLCULO DE DOSE",
        pergunta: "Quantos mL você aspira do frasco reconstituído?",
        prescricao: "Ceftriaxona 1 g frasco-ampola reconstituído com 10 mL de água destilada. Prescrito: 500 mg por via intravenosa.",
        dadosTabela: [
          ["Prescrito", "500 mg"],
          ["Frasco Reconstituído", "1000 mg em 10 mL"],
          ["Via", "IV"],
          ["Resposta", "em mL"]
        ],
        unidade: "mL",
        variaveis: {
          dose_prescrita_mg: 500,
          volume_total_ml: 10,
          dose_frasco_mg: 1000
        },
        formula: "(dose_prescrita_mg * volume_total_ml) / dose_frasco_mg",
        respostaEsperada: 5,
        tolerancia: 0.01,
        explicacao: "Regra de três: 1000 mg está para 10 mL, logo 500 mg está para 5 mL."
      },
      {
        tipo: "resposta_falada",
        tema: "RESPOSTA FALADA",
        pergunta: "Antes de conectar a seringa ao polifix, o que você faz no injetor lateral?",
        aceitas: [
          "antissepsia do hub",
          "antissepsia do conector",
          "desinfeccao com alcool 70",
          "limpar com alcool 70",
          "friccionar alcool 70",
          "alcool 70",
          "antissepsia com alcool"
        ],
        respostaCertaTexto: "Antissepsia com álcool 70%",
        explicacao: "A desinfecção passiva ou ativa com álcool 70% no hub/conector previne contaminação intraluminal e infecção de corrente sanguínea."
      }
    ]
  }
};
