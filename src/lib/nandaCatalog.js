// Catálogo canônico NANDA-I, NIC e NOC para consulta rápida e fallback offline
export const NANDA_CATALOG = [
  {
    code: "00047",
    title: "Risco de lesão por pressão",
    domain: "Domínio 11: Segurança/Proteção",
    class: "Classe 2: Lesão física",
    interventions: [
      { code: "3540", title: "Prevenção de lesão por pressão", description: "Mudança de decúbito a cada 2h e aplicação de ácidos graxos hiperoxigenados (AGH)." },
      { code: "0740", title: "Cuidados com a pele: tratamentos tópicos", description: "Inspeção diária e hidratação cutânea." },
      { code: "1100", title: "Manejo da nutrição", description: "Avaliação do aporte proteico e hidratação adequada." }
    ],
    outcomes: [
      { code: "1101", title: "Integridade tissular: pele e mucosas", description: "Pele íntegra e sem solução de continuidade." }
    ]
  },
  {
    code: "00155",
    title: "Risco de quedas em adultos",
    domain: "Domínio 11: Segurança/Proteção",
    class: "Classe 2: Lesão física",
    interventions: [
      { code: "6490", title: "Prevenção contra quedas", description: "Manter grades do leito elevadas, campainha de fácil alcance e iluminação adequada." },
      { code: "6610", title: "Identificação de risco", description: "Colocação de pulseira e sinalização visual de alerta de queda no leito." },
      { code: "1800", title: "Ajuda no autocuidado", description: "Apoiar a deambulação e transferências seguras." }
    ],
    outcomes: [
      { code: "1912", title: "Controle de risco: quedas", description: "Adoção de precauções ambientais e adesão do paciente." }
    ]
  },
  {
    code: "00132",
    title: "Dor aguda",
    domain: "Domínio 12: Conforto",
    class: "Classe 1: Conforto físico",
    interventions: [
      { code: "1400", title: "Manejo da dor", description: "Avaliar intensidade da dor (0 a 10) e características antes e após analgesia." },
      { code: "2210", title: "Administração de analgésicos", description: "Administrar analgesia prescrita e verificar eficácia em 30 a 60 minutos." }
    ],
    outcomes: [
      { code: "1605", title: "Controle da dor", description: "Paciente reconhece o início da dor e expressa alívio satisfatório." },
      { code: "2102", title: "Nível de dor", description: "Redução do escore na escala de dor para níveis toleráveis (<= 3)." }
    ]
  },
  {
    code: "00128",
    title: "Confusão aguda (Delirium)",
    domain: "Domínio 5: Percepção/Cognição",
    class: "Classe 4: Cognição",
    interventions: [
      { code: "4880", title: "Manejo do delirium", description: "Orientar o paciente no tempo e espaço e manter relógio e calendário visíveis." },
      { code: "6460", title: "Manejo da demência/confusão", description: "Evitar restrições mecânicas desnecessárias e envolver familiares nos cuidados." }
    ],
    outcomes: [
      { code: "0901", title: "Orientação cognitiva", description: "Identifica tempo, espaço e pessoas de maneira consistente." }
    ]
  },
  {
    code: "00030",
    title: "Troca de gases prejudicada",
    domain: "Domínio 3: Eliminação e Troca",
    class: "Classe 4: Função respiratória",
    interventions: [
      { code: "3320", title: "Oxigenoterapia", description: "Administrar oxigênio suplementar conforme prescrição médica e monitorar oximetria contínua." },
      { code: "3350", title: "Monitorização respiratória", description: "Avaliar padrão ventilatório, frequência respiratória e ausculta pulmonar." }
    ],
    outcomes: [
      { code: "0402", title: "Estado respiratório: troca gasosa", description: "Saturação de O2 mantida >= 94% em ar ambiente ou oxigenoterapia." }
    ]
  },
  {
    code: "00004",
    title: "Risco de infecção",
    domain: "Domínio 11: Segurança/Proteção",
    class: "Classe 1: Infecção",
    interventions: [
      { code: "6550", title: "Proteção contra infecção", description: "Higienização rigorosa das mãos e manutenção de técnica asséptica em procedimentos invasivos." },
      { code: "6540", title: "Controle de infecção", description: "Monitorar sinais flogísticos em sítios cirúrgicos, cateteres e drenos." }
    ],
    outcomes: [
      { code: "1902", title: "Controle de risco: processo infeccioso", description: "Ausência de hipertermia, leucocitose ou secreção purulenta." }
    ]
  },
  {
    code: "00085",
    title: "Padrão respiratório ineficaz",
    domain: "Domínio 4: Atividade/Repouso",
    class: "Classe 4: Respostas cardiovasculares/pulmonares",
    interventions: [
      { code: "3390", title: "Ajuda na ventilação", description: "Manter cabeceira elevada a 30-45° e incentivar respirações profundas." },
      { code: "3230", title: "Fisioterapia respiratória", description: "Auxiliar em exercícios de tosse e padrões ventilatórios eficazes." }
    ],
    outcomes: [
      { code: "0415", title: "Estado respiratório", description: "Frequência respiratória entre 12 e 20 irpm e expansibilidade simétrica." }
    ]
  },
  {
    code: "00027",
    title: "Volume de líquidos deficiente",
    domain: "Domínio 2: Nutrição",
    class: "Classe 5: Hidratação",
    interventions: [
      { code: "4120", title: "Manejo de líquidos", description: "Controle rigoroso do balanço hídrico, hidratação venosa e avaliação de turgor cutâneo." },
      { code: "6680", title: "Monitorização dos sinais vitais", description: "Vigiar pressão arterial e frequência cardíaca para detecção precoce de hipovolemia." }
    ],
    outcomes: [
      { code: "0601", title: "Equilíbrio hídrico", description: "Diurese adequada (> 0,5 mL/kg/h) e mucosas coradas e úmidas." }
    ]
  },
  {
    code: "00146",
    title: "Ansiedade",
    domain: "Domínio 9: Enfrentamento/Tolerância ao Estresse",
    class: "Classe 2: Respostas de enfrentamento",
    interventions: [
      { code: "5820", title: "Redução da ansiedade", description: "Explicar todos os procedimentos com antecedência e oferecer escuta ativa empática." },
      { code: "5270", title: "Apoio emocional", description: "Incentivar a presença da rede de apoio e técnicas de respiração orientada." }
    ],
    outcomes: [
      { code: "1402", title: "Autocontrole da ansiedade", description: "Relata redução dos sintomas de ansiedade e demonstra tranquilidade." }
    ]
  },
  {
    code: "00168",
    title: "Estilo de vida sedentário / Risco de intolerância à atividade",
    domain: "Domínio 4: Atividade/Repouso",
    class: "Classe 4: Respostas cardiovasculares/pulmonares",
    interventions: [
      { code: "0180", title: "Manejo da energia", description: "Estimular deambulação assistida e exercícios leves no leito." },
      { code: "4310", title: "Terapia de atividade", description: "Planejar rotina diária equilibrando repouso e mobilização progressiva." }
    ],
    outcomes: [
      { code: "0005", title: "Tolerância à atividade", description: "Realiza atividades cotidianas básicas sem desconforto cardiorrespiratório." }
    ]
  }
];
