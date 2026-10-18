// Catálogo Canônico Oficial NANDA-I (13ª Edição 2024-2026), NIC e NOC
// Em conformidade com a Resolução Cofen nº 736/2024 e tradução oficial Dra. Camila Takáo Lopes

export const NANDA_CATALOG = [
  // ==========================================
  // DOMÍNIO 11: SEGURANÇA / PROTEÇÃO
  // ==========================================
  {
    code: "00205",
    title: "Risco de choque",
    domain: "Domínio 11: Segurança/Proteção",
    class: "Classe 2: Lesão física",
    edition: "NANDA-I 13ª Ed. (2024-2026)",
    risk_factors: [
      "Hipotensão severa (PAS <= 80 mmHg)",
      "Hipovolemia por hemorragia ativa ou perda de fluidos",
      "Bradicardia extrema ou arritmias ventriculares",
      "Sepse / Infecção sistêmica grave",
      "Disfunção miocárdica aguda"
    ],
    interventions: [
      {
        code: "4250",
        title: "Manejo do choque",
        description: "Monitorar sinais de choque iminente: PA invasiva ou não invasiva a cada 15 min, FC, perfusão periférica e tempo de enchimento capilar (> 3s). Manter 2 acessos venosos calibrosos (14G ou 16G). Infundir cristaloides aquecidos conforme prescrição e preparar drogas vasoativas (Noradrenalina)."
      },
      {
        code: "6680",
        title: "Monitorização dos sinais vitais",
        description: "Controle hemodinâmico estrito de PAM (alvo >= 65 mmHg), saturação de oxigênio contínua e débito urinário horário por sonda vesical de demora (alvo >= 0,5 mL/kg/h)."
      },
      {
        code: "4260",
        title: "Prevenção do choque",
        description: "Posicionar em Trendelenburg modificado se hipotensão sintomática (a menos que haja TCE com hipertensão intracraniana). Otimizar oxigenação e manter paciente normotérmico."
      }
    ],
    outcomes: [
      {
        code: "0400",
        title: "Efetividade da bomba cardíaca",
        scale: "1 (Gravemente comprometido) a 5 (Não comprometido)",
        target: "Alcançar nível 4 ou 5: PAS >= 90 mmHg, PAM >= 65 mmHg e FC entre 60 e 100 bpm.",
        indicators: ["Pressão arterial sistólica", "Frequência cardíaca", "Débito urinário", "Perfusão periférica"]
      },
      {
        code: "0413",
        title: "Gravidade do choque: hipovolêmico/distributivo",
        scale: "1 (Grave) a 5 (Nenhum)",
        target: "Evoluir de 1 para 4 ou 5 (sinais de choque controlados sem acidose lática).",
        indicators: ["Diminuição da pressão de pulso", "Palidez cutânea", "Bradicardia/Taquicardia patológica"]
      }
    ]
  },
  {
    code: "00206",
    title: "Risco de sangramento excessivo",
    domain: "Domínio 11: Segurança/Proteção",
    class: "Classe 2: Lesão física",
    edition: "NANDA-I 13ª Ed. (2024-2026 - Título Atualizado)",
    risk_factors: [
      "Trauma mecânico penetrante ou contuso",
      "Ferimento por arma de fogo (PAF) ou arma branca",
      "Coagulopatia ou plaquetopenia",
      "Uso de anticoagulantes ou antiagregantes",
      "Lesão vascular ativa"
    ],
    interventions: [
      {
        code: "4010",
        title: "Prevenção de sangramento",
        description: "Realizar compressão direta e curativo compressivo hemostático em sítio de sangramento ativo. Monitorar hematócrito, hemoglobina e coagulograma. Evitar punções desnecessárias."
      },
      {
        code: "4030",
        title: "Redução de sangramento: ferimentos",
        description: "Aplicar pressão direta firme na lesão com compressas estéreis; imobilizar a área afetada; elevar membro se apropriado e avaliar sinais de sangramento oculto."
      }
    ],
    outcomes: [
      {
        code: "0409",
        title: "Coagulação sanguínea",
        scale: "1 (Gravemente comprometido) a 5 (Não comprometido)",
        target: "Manter hemostasia estável, ausência de sangramento ativo e estabilidade de Hb/Ht.",
        indicators: ["Formação de coágulo", "Sangramento visível", "Níveis de hemoglobina"]
      }
    ]
  },
  {
    code: "00046",
    title: "Integridade da pele prejudicada",
    domain: "Domínio 11: Segurança/Proteção",
    class: "Classe 2: Lesão física",
    edition: "NANDA-I 13ª Ed. (2024-2026)",
    defining_characteristics: [
      "Solução de continuidade da epiderme e derme",
      "Laceração cutânea ou ferimento corto-contuso",
      "Sangramento cutâneo ou exsudato presente",
      "Dor ou sensibilidade no local da lesão"
    ],
    related_factors: [
      "Trauma físico contuso ou penetrante",
      "Cisalhamento ou fricção",
      "Procedimentos cirúrgicos ou invasivos",
      "Fatores mecânicos externos"
    ],
    interventions: [
      {
        code: "3660",
        title: "Cuidados com feridas",
        description: "Limpar a lesão com soro fisiológico 0,9% em jatos mornos; avaliar bordas, extensão, profundidade e presença de corpo estranho. Realizar curativo estéril apropriado com cobertura primária estéril."
      },
      {
        code: "3590",
        title: "Vigilância da pele",
        description: "Inspecionar diariamente sítios de lesão quanto a sinais de infecção (rubor, calor, edema, secreção purulenta e odor fétido)."
      }
    ],
    outcomes: [
      {
        code: "1101",
        title: "Integridade tissular: pele e mucosas",
        scale: "1 (Gravemente comprometido) a 5 (Não comprometido)",
        target: "Progressão da cicatrização de 2 para 4/5 com aproximação de bordas e ausência de infecção.",
        indicators: ["Regeneração da pele", "Eritema circundante", "Necrose tecidual", "Sangramento local"]
      }
    ]
  },
  {
    code: "00047",
    title: "Risco de lesão por pressão em adultos",
    domain: "Domínio 11: Segurança/Proteção",
    class: "Classe 2: Lesão física",
    edition: "NANDA-I 13ª Ed. (2024-2026 - Título Atualizado)",
    risk_factors: [
      "Imobilidade no leito / incapacidade de mudança de decúbito",
      "Percepção sensorial diminuída (paciente inconsciente, sedado ou com neuropatia)",
      "Exposição da pele à umidade contínua (incontinência, diaforese)",
      "Fricção e forças de cisalhamento ao posicionar no leito",
      "Estado nutricional inadequado ou hipoalbuminemia",
      "Escore da Escala de Braden <= 14"
    ],
    interventions: [
      {
        code: "3540",
        title: "Prevenção de lesão por pressão",
        description: "Alternar decúbito rigorosamente a cada 2 horas (lateral D, dorsal, lateral E). Usar colchão pneumático articulado. Proteger proeminências ósseas (calcâneos, trocânteres, sacro, occipício) com coxins e filmes de poliuretano. Não manter cabeceira elevada a mais de 30° por tempo prolongado."
      },
      {
        code: "0740",
        title: "Cuidados com a pele: tratamentos tópicos",
        description: "Aplicar Ácidos Graxos Hiperoxigenados (AGH) ou creme barreira nas zonas de pressão sem massagear proeminências ósseas hiperemiadas."
      },
      {
        code: "1100",
        title: "Manejo da nutrição",
        description: "Garantir aporte calórico-proteico adequado (1,2 a 1,5 g/kg/dia de proteínas) para favorecer a resiliência tecidual."
      }
    ],
    outcomes: [
      {
        code: "1101",
        title: "Integridade tissular: pele e mucosas",
        scale: "1 (Gravemente comprometido) a 5 (Não comprometido)",
        target: "Manter nível 5 (pele íntegra sem eritema não branqueável em proeminências ósseas).",
        indicators: ["Pele intacta", "Lesões por pressão em estágio 1 a 4 ausentes", "Eritema ausente"]
      }
    ]
  },
  {
    code: "00155",
    title: "Risco de quedas em adultos",
    domain: "Domínio 11: Segurança/Proteção",
    class: "Classe 2: Lesão física",
    edition: "NANDA-I 13ª Ed. (2024-2026 - Título Atualizado)",
    risk_factors: [
      "Déficit cognitivo, desorientação ou confusão aguda (delirium)",
      "Dificuldade de marcha, fraqueza em membros inferiores ou paresia",
      "Uso de medicamentos de alto risco (sedativos, diuréticos, anti-hipertensivos)",
      "Histórico de quedas prévias nos últimos 6 meses",
      "Escore de SAK >= 2"
    ],
    interventions: [
      {
        code: "6490",
        title: "Prevenção contra quedas",
        description: "Manter grades bilaterais elevadas no leito e leito na altura mínima com rodas travadas. Colocar pulseira amarela de identificação de risco de queda. Garantir campainha ao alcance. Acompanhar obrigatoriamente transferências e deambulação."
      },
      {
        code: "6610",
        title: "Identificação de risco",
        description: "Orientar o paciente e familiares a não se levantarem sem solicitar a equipe de enfermagem. Manter piso seco e ambiente iluminado."
      }
    ],
    outcomes: [
      {
        code: "1912",
        title: "Controle de risco: quedas",
        scale: "1 (Nunca demonstrado) a 5 (Consistentemente demonstrado)",
        target: "Pontuação 5: Paciente e equipe executam 100% das medidas preventivas sem ocorrência de incidentes.",
        indicators: ["Uso de dispositivos de assistência", "Solicitação de auxílio ao levantar", "Uso de calçados antiderrapantes"]
      }
    ]
  },
  {
    code: "00039",
    title: "Risco de aspiração",
    domain: "Domínio 11: Segurança/Proteção",
    class: "Classe 2: Lesão física",
    edition: "NANDA-I 13ª Ed. (2024-2026)",
    risk_factors: [
      "Nível de consciência rebaixado (Glasgow <= 12, desacordado, comatoso)",
      "Reflexo de tosse e vômito abolidos ou diminuídos",
      "Presença de sonda nasogástrica / enteral em infusão contínua",
      "Mobilidade física e posicionamento prejudicados no leito"
    ],
    interventions: [
      {
        code: "3200",
        title: "Precauções contra aspiração",
        description: "Manter cabeceira da cama elevada entre 30° e 45° de forma contínua. Pausar dieta enteral antes de aspiração traqueal ou decúbito horizontal. Manter material de aspiração montado e pronto para uso imediato no leito."
      },
      {
        code: "3160",
        title: "Aspiração de vias aéreas",
        description: "Aspirar cavidade oral e orofaringe em caso de acúmulo de secreções ou salivação abundante, evitando estímulo vagal excessivo."
      }
    ],
    outcomes: [
      {
        code: "0410",
        title: "Estado respiratório: permeabilidade das vias aéreas",
        scale: "1 (Gravemente comprometido) a 5 (Não comprometido)",
        target: "Manter nível 5: murmúrio vesicular simétrico, ausência de estertores e ausência de broncoaspiração.",
        indicators: ["Ruídos respiratórios adventícios", "Asfixia", "Taxa de respiração"]
      }
    ]
  },

  // ==========================================
  // DOMÍNIO 4: ATIVIDADE / REPOUSO
  // ==========================================
  {
    code: "00029",
    title: "Débito cardíaco diminuído",
    domain: "Domínio 4: Atividade/Repouso",
    class: "Classe 4: Respostas cardiovasculares/pulmonares",
    edition: "NANDA-I 13ª Ed. (2024-2026)",
    defining_characteristics: [
      "Bradicardia extrema (FC < 40 bpm) ou taquicardia descompensada",
      "Hipotensão arterial sistêmica (PAS < 90 mmHg)",
      "Pulsos periféricos filiformes ou diminuídos",
      "Tempo de enchimento capilar lentificado (> 3 segundos)",
      "Oligúria (< 0,5 mL/kg/h) e rebaixamento do sensório"
    ],
    related_factors: [
      "Alteração na frequência e no ritmo cardíaco (bloqueio atrioventricular, bradiarritmia)",
      "Alteração na contratilidade miocárdica ou pré-carga diminuída",
      "Isquemia coronariana aguda ou choque cardiogênico"
    ],
    interventions: [
      {
        code: "4040",
        title: "Cuidados cardíacos",
        description: "Instalar monitorização cardíaca contínua no leito (DII e V1). Monitorar traçado de ECG para bradicardia sinusal, BAV de 2º ou 3º grau. Deixar preparado carrinho de emergência com Atropina 0,5 mg e marcapasso transcutâneo."
      },
      {
        code: "4150",
        title: "Manejo da hemodinâmica",
        description: "Vigiar balanço hídrico rigoroso, pressão arterial a cada 15 a 30 minutos e perfusão das extremidades. Notificar imediatamente instabilidade hemodinâmica ao plantão médico."
      }
    ],
    outcomes: [
      {
        code: "0400",
        title: "Efetividade da bomba cardíaca",
        scale: "1 (Gravemente comprometido) a 5 (Não comprometido)",
        target: "Elevar para nível 4/5: restabelecer FC >= 50-60 bpm e PAM >= 65 mmHg.",
        indicators: ["Frequência cardíaca", "Pressão arterial sistólica e diastólica", "Pulsos periféricos", "Fração de ejeção"]
      }
    ]
  },
  {
    code: "00201",
    title: "Risco de perfusão tissular cerebral ineficaz",
    domain: "Domínio 4: Atividade/Repouso",
    class: "Classe 4: Respostas cardiovasculares/pulmonares",
    edition: "NANDA-I 13ª Ed. (2024-2026)",
    risk_factors: [
      "Traumatismo cranioencefálico (TCE) recente ou ferimento cefálico",
      "Hipotensão arterial sistêmica severa (pressão de perfusão cerebral diminuída)",
      "Rebaixamento súbito do nível de consciência (Glasgow <= 8)",
      "Acidente vascular cerebral (AVC isquêmico ou hemorrágico)"
    ],
    interventions: [
      {
        code: "2620",
        title: "Monitorização neurológica",
        description: "Avaliar Escala de Glasgow, simetria e reatividade pupilar a cada 1 hora. Detectar sinais de tríade de Cushing (hipertensão com pressão de pulso alargada, bradicardia e bradipneia irregular)."
      },
      {
        code: "2550",
        title: "Manejo do edema cerebral / PIC",
        description: "Manter cabeceira elevada a 30° centrada (sem rotação do pescoço para otimizar drenagem venosa jugular). Evitar hipóxia (manter SatO2 >= 95%) e evitar hipercapnia (manter PaCO2 35-40 mmHg se ventilado)."
      }
    ],
    outcomes: [
      {
        code: "0909",
        title: "Estado neurológico",
        scale: "1 (Gravemente comprometido) a 5 (Não comprometido)",
        target: "Evoluir para nível 4/5 com pupilas isocóricas e fotorreagentes e ausência de deterioração neurológica.",
        indicators: ["Abertura ocular", "Padrão de resposta motora", "Tamanho e resposta pupilar"]
      }
    ]
  },
  {
    code: "00030",
    title: "Troca de gases prejudicada",
    domain: "Domínio 4: Atividade/Repouso",
    class: "Classe 4: Respostas cardiovasculares/pulmonares",
    edition: "NANDA-I 13ª Ed. (2024-2026 - Domínio Atualizado)",
    defining_characteristics: [
      "Hipoxemia (SatO2 < 90% ou PaO2 diminuída)",
      "Taquipneia compensatória (FR > 22 irpm) ou bradipneia crítica",
      "Cianose perioral ou de extremidades",
      "Uso de musculatura acessória da respiração ou tiragem intercostal",
      "Agitação, confusão mental ou sonolência por hipercapnia"
    ],
    related_factors: [
      "Desequilíbrio na relação ventilação-perfusão (V/Q)",
      "Alterações na membrana alvéolo-capilar (edema pulmonar, pneumonia, SARA)",
      "Hipoventilação alveolar por rebaixamento neurológico"
    ],
    interventions: [
      {
        code: "3320",
        title: "Oxigenoterapia",
        description: "Instalar e titular oxigênio suplementar (cânula nasal de O2 1 a 5 L/min ou máscara de Venturi/não-reinalante) para manter SatO2 >= 94% (ou 88-92% em retentores crônicos de CO2)."
      },
      {
        code: "3350",
        title: "Monitorização respiratória",
        description: "Ausculta pulmonar nos 4 quadrantes a cada 2-4h; avaliar simetria torácica, frequência respiratória e presença de sibilos, roncos ou estertores crepitantes."
      }
    ],
    outcomes: [
      {
        code: "0402",
        title: "Estado respiratório: troca gasosa",
        scale: "1 (Gravemente comprometido) a 5 (Não comprometido)",
        target: "Alcançar nível 4/5 com SatO2 sustentada >= 94% e melhora da gasometria arterial.",
        indicators: ["Pressão parcial de oxigênio no sangue arterial (PaO2)", "Saturação de oxigênio", "Equilíbrio ventilação-perfusão"]
      }
    ]
  },
  {
    code: "00032",
    title: "Padrão respiratório ineficaz",
    domain: "Domínio 4: Atividade/Repouso",
    class: "Classe 4: Respostas cardiovasculares/pulmonares",
    edition: "NANDA-I 13ª Ed. (2024-2026)",
    defining_characteristics: [
      "Bradipneia (FR < 10 irpm) ou taquipneia acentuada",
      "Padrão respiratório irregular (Cheyne-Stokes, Biot)",
      "Uso excessivo de musculatura acessória",
      "Excursão torácica assimétrica ou superficial"
    ],
    related_factors: [
      "Disfunção neurológica central ou lesão encefálica",
      "Fadiga da musculatura respiratória",
      "Depressão respiratória induzida por opioides/sedativos"
    ],
    interventions: [
      {
        code: "3390",
        title: "Ajuda na ventilação",
        description: "Manter decúbito elevado (Fowler 30-45°); desobstruir vias aéreas superiores; fornecer suporte ventilatório manual (ambu com reservatório a 15 L/min) se bradipneia crítica."
      }
    ],
    outcomes: [
      {
        code: "0415",
        title: "Estado respiratório",
        scale: "1 (Gravemente comprometido) a 5 (Não comprometido)",
        target: "Padrão eupneico regular mantido com frequência respiratória entre 12 e 20 irpm.",
        indicators: ["Frequência respiratória", "Ritmo respiratório", "Profundidade da respiração"]
      }
    ]
  },
  {
    code: "00085",
    title: "Mobilidade física prejudicada",
    domain: "Domínio 4: Atividade/Repouso",
    class: "Classe 2: Atividade/exercício",
    edition: "NANDA-I 13ª Ed. (2024-2026)",
    defining_characteristics: [
      "Incapacidade de movimentar-se intencionalmente no leito ou deambular",
      "Força muscular diminuída ou paresia",
      "Amplitude de movimento articular diminuída"
    ],
    related_factors: [
      "Sensório rebaixado / coma / sedação",
      "Dor física ou trauma musculoesquelético",
      "Déficit neuromuscular ou repouso prescrito no leito"
    ],
    interventions: [
      {
        code: "0740",
        title: "Posicionamento",
        description: "Posicionar em alinhamento anatômico no leito com suporte para pés (evitar pé equino) e coxins articulares; mudar posição a cada 2 horas."
      },
      {
        code: "0224",
        title: "Terapia com exercícios: mobilidade articular",
        description: "Realizar movimentos passivos de amplitude articular suavemente 2 vezes ao dia para preservar função articular e circulação venosa."
      }
    ],
    outcomes: [
      {
        code: "0208",
        title: "Mobilidade",
        scale: "1 (Gravemente comprometido) a 5 (Não comprometido)",
        target: "Manutenção do tônus muscular e ausência de contraturas e deformidades adquiridas.",
        indicators: ["Manutenção da posição corporal", "Movimento muscular", "Movimento das articulações"]
      }
    ]
  },

  // ==========================================
  // DOMÍNIO 2: NUTRIÇÃO & METABOLISMO
  // ==========================================
  {
    code: "00179",
    title: "Risco de autogestão ineficaz do padrão de glicemia",
    domain: "Domínio 2: Nutrição",
    class: "Classe 4: Metabolismo",
    edition: "NANDA-I 13ª Ed. (2024-2026 - Título Atualizado)",
    risk_factors: [
      "Hiperglicemia aguda (HGT >= 200 a 300 mg/dL)",
      "Hipoglicemia grave (HGT <= 70 mg/dL)",
      "Diabetes mellitus descompensado",
      "Estado de jejum prolongado ou infusão glicosada inadequada"
    ],
    interventions: [
      {
        code: "2130",
        title: "Manejo da hipoglicemia",
        description: "Se HGT <= 70 mg/dL e consciente: ofertar 15g de carboidrato de rápida absorção. Se inconsciente ou jejum: infundir 40 a 50 mL de Glicose 50% EV em bólus; retestar HGT em 15 minutos."
      },
      {
        code: "2120",
        title: "Manejo da hiperglicemia",
        description: "Se HGT elevado: administrar insulina regular subcutânea ou em bomba de infusão contínua conforme protocolo médico; hidratar com solução salina 0,9% para prevenir cetoacidose diabética (CAD)."
      }
    ],
    outcomes: [
      {
        code: "2300",
        title: "Nível de glicemia",
        scale: "1 (Desvio grave) a 5 (Sem desvio)",
        target: "Glicemia capilar estabilizada na faixa alvo de 100 a 180 mg/dL em ambiente hospitalar.",
        indicators: ["Glicemia em jejum", "Glicemia capilar pós-prandial"]
      }
    ]
  },
  {
    code: "00027",
    title: "Volume de líquidos inadequado",
    domain: "Domínio 2: Nutrição",
    class: "Classe 5: Hidratação",
    edition: "NANDA-I 13ª Ed. (2024-2026 - Título Atualizado)",
    defining_characteristics: [
      "Hipotensão ortostática ou hipotensão postural",
      "Turgor cutâneo diminuído e mucosas ressecadas",
      "Diurese concentrada e débito urinário diminuído",
      "Perda ponderal aguda ou sede intensa"
    ],
    related_factors: [
      "Perda excessiva de fluidos por vômitos, diarreia, hemorragia ou sudorese",
      "Ingestão insuficiente de líquidos por rebaixamento neurológico"
    ],
    interventions: [
      {
        code: "4120",
        title: "Manejo de líquidos",
        description: "Controle rigoroso do balanço hídrico de 12/24h; reposição volêmica com soluções isotônicas conforme prescrição; vigilância de turgor de pele e hidratação de mucosas."
      }
    ],
    outcomes: [
      {
        code: "0601",
        title: "Equilíbrio hídrico",
        scale: "1 (Gravemente comprometido) a 5 (Não comprometido)",
        target: "Elevar para nível 4/5: diurese >= 0,5 mL/kg/h, mucosas úmidas e densidade urinária normal.",
        indicators: ["Pressão arterial", "Turgor da pele", "Umidade das membranas mucosas", "Balanço hídrico diário"]
      }
    ]
  },

  // ==========================================
  // DOMÍNIO 12: CONFORTO
  // ==========================================
  {
    code: "00132",
    title: "Dor aguda",
    domain: "Domínio 12: Conforto",
    class: "Classe 1: Conforto físico",
    edition: "NANDA-I 13ª Ed. (2024-2026)",
    defining_characteristics: [
      "Relato verbal da dor em escala numérica ou analógica (EVA 1 a 10)",
      "Expressão facial de dor (olhos cerrados, testa franzida)",
      "Comportamento de proteção ou postura antálgica",
      "Respostas simpáticas autonômicas (taquicardia, hipertensão reativa)"
    ],
    related_factors: [
      "Agentes lesivos biológicos, químicos ou físicos (trauma mecânico, queimadura, incisão cirúrgica)",
      "Inflamação tecidual aguda ou isquemia tecidual"
    ],
    interventions: [
      {
        code: "1400",
        title: "Manejo da dor",
        description: "Avaliar características da dor (localização, início, duração, intensidade 0-10, fatores desencadeantes e de alívio). Realizar intervenções não-farmacológicas de conforto (reposicionamento no leito, ambiente tranquilo)."
      },
      {
        code: "2210",
        title: "Administração de analgésicos",
        description: "Administrar analgesia prescrita no horário preconizado e reavaliar escore de dor em 30 a 60 minutos após a administração."
      }
    ],
    outcomes: [
      {
        code: "1605",
        title: "Controle da dor",
        scale: "1 (Nunca demonstrado) a 5 (Consistentemente demonstrado)",
        target: "Paciente relata dor controlada ou tolerável (escore EVA <= 3).",
        indicators: ["Reconhecimento do início da dor", "Utilização de medidas de alívio", "Relato de dor controlada"]
      },
      {
        code: "2102",
        title: "Nível de dor",
        scale: "1 (Grave) a 5 (Nenhum)",
        target: "Redução dos escores álgicos de 1/2 para 4/5.",
        indicators: ["Dor relatada", "Expressões faciais de dor", "Inquietação física"]
      }
    ]
  },

  // ==========================================
  // DOMÍNIO 5: PERCEPÇÃO / COGNIÇÃO
  // ==========================================
  {
    code: "00128",
    title: "Confusão aguda (Delirium)",
    domain: "Domínio 5: Percepção/Cognição",
    class: "Classe 4: Cognição",
    edition: "NANDA-I 13ª Ed. (2024-2026)",
    defining_characteristics: [
      "Flutuação aguda na atenção e nível de consciência (CAM positivo)",
      "Desorientação temporal, espacial e quanto a si mesmo",
      "Pensamento desorganizado e fala incoerente",
      "Agitação psicomotora ou sonolência patológica (delirium hipoativo)"
    ],
    related_factors: [
      "Alteração metabólica aguda (hipoglicemia, uremia, hiponatremia)",
      "Hipoperfusão cerebral decorrente de choque ou baixo débito cardíaco",
      "Privação de sono ou ambiente de UTI / emergência desorientador",
      "Infecção sistêmica aguda (sepse, ITU, pneumonia)"
    ],
    interventions: [
      {
        code: "4880",
        title: "Manejo do delirium",
        description: "Reorientar o paciente gentilmente com frequência de tempo e espaço; garantir iluminação cicladiana (luz natural de dia, escuro à noite); incentivar a presença de familiares conhecidos no leito; evitar amarras e restrições mecânicas sem indicação formal estrita."
      },
      {
        code: "6460",
        title: "Manejo da demência / confusão",
        description: "Manter ambiente calmo, sem excesso de ruídos de alarmes; identificar e tratar causas orgânicas de base (desidratação, dor, hipóxia)."
      }
    ],
    outcomes: [
      {
        code: "0901",
        title: "Orientação cognitiva",
        scale: "1 (Gravemente comprometido) a 5 (Não comprometido)",
        target: "Progressão de 2 para 4/5 com identificação correta de dia, local e familiares.",
        indicators: ["Identificação de si mesmo", "Identificação de pessoas significativas", "Identificação do local atual", "Identificação do dia e hora"]
      }
    ]
  },

  // ==========================================
  // DOMÍNIO 11: SEGURANÇA - TERMORREGULAÇÃO
  // ==========================================
  {
    code: "00006",
    title: "Temperatura corporal diminuída",
    domain: "Domínio 11: Segurança/Proteção",
    class: "Classe 6: Termorregulação",
    edition: "NANDA-I 13ª Ed. (2024-2026 - Título Atualizado)",
    defining_characteristics: [
      "Temperatura corporal axilar < 35,5 °C",
      "Extremidades frias e pele com palidez ou cianose",
      "Calafrios ou tremores musculares",
      "Tempo de enchimento capilar lentificado"
    ],
    related_factors: [
      "Exposição prolongada a ambiente frio ou intempéries",
      "Choque com má perfusão periférica",
      "Infusão de soluções endovenosas frias em grande volume",
      "Disfunção do centro termorregulador hipotalâmico"
    ],
    interventions: [
      {
        code: "3900",
        title: "Regulação da temperatura",
        description: "Aquecimento passivo externo com cobertores aquecidos e isolamento térmico cefálico; aquecimento ativo com mantas térmicas convectivas se necessário; aquecer soluções endovenosas prescritas; monitorar temperatura central ou axilar horária."
      }
    ],
    outcomes: [
      {
        code: "0800",
        title: "Termorregulação",
        scale: "1 (Desvio grave) a 5 (Sem desvio)",
        target: "Retorno e estabilização da temperatura axilar na faixa fisiológica (36,0 °C a 37,2 °C).",
        indicators: ["Temperatura corporal", "Coloração da pele", "Calafrios quando frio"]
      }
    ]
  },
  {
    code: "00007",
    title: "Hipertermia",
    domain: "Domínio 11: Segurança/Proteção",
    class: "Classe 6: Termorregulação",
    edition: "NANDA-I 13ª Ed. (2024-2026)",
    defining_characteristics: [
      "Temperatura axilar >= 37,8 °C (adulto)",
      "Pele quente e ruborizada",
      "Taquicardia e taquipneia reativas",
      "Sudorese ou desidratação associada"
    ],
    related_factors: [
      "Processo infeccioso ou inflamatório sistêmico",
      "Aumento da taxa metabólica"
    ],
    interventions: [
      {
        code: "3740",
        title: "Tratamento da febre",
        description: "Administrar antitérmicos conforme prescrição médica; aplicar compressas mornas nas regiões axilares e inguinais; afrouxar vestimentas e manter hidratação oral ou venosa."
      }
    ],
    outcomes: [
      {
        code: "0800",
        title: "Termorregulação",
        scale: "1 (Desvio grave) a 5 (Sem desvio)",
        target: "Temperatura normalizada entre 36,0 e 37,0 °C com conforto térmico preservado.",
        indicators: ["Temperatura corporal", "Frequência respiratória", "Frequência cardíaca"]
      }
    ]
  },

  // ==========================================
  // DOMÍNIO 1: PROMOÇÃO DA SAÚDE
  // ==========================================
  {
    code: "00276",
    title: "Autogestão ineficaz da saúde",
    domain: "Domínio 1: Promoção da Saúde",
    class: "Classe 2: Gestão da saúde",
    edition: "NANDA-I 13ª Ed. (2024-2026 - Título Atualizado)",
    defining_characteristics: [
      "Dificuldade para gerenciar regimes terapêuticos e farmacológicos",
      "Não comparecimento a consultas de seguimento",
      "Continuidade de comportamentos de risco e hábitos não saudáveis"
    ],
    related_factors: [
      "Letramento em saúde inadequado",
      "Regime terapêutico complexo",
      "Falta de rede de apoio socioeconômica"
    ],
    interventions: [
      {
        code: "5602",
        title: "Ensino: processo da doença",
        description: "Explicar a fisiopatologia, complicações e cuidados diários essenciais em linguagem acessível ao paciente e família."
      },
      {
        code: "5616",
        title: "Ensino: medicamentos prescritos",
        description: "Elaborar tabela visual com horários, doses e principais efeitos dos medicamentos contínuos."
      }
    ],
    outcomes: [
      {
        code: "1601",
        title: "Comportamento de adesão",
        scale: "1 (Nunca demonstrado) a 5 (Consistentemente demonstrado)",
        target: "Evoluir para nível 4/5 com compreensão das prescrições e autocuidado diário.",
        indicators: ["Autoadministração de medicamentos prescritos", "Monitoramento dos efeitos do tratamento"]
      }
    ]
  }
];

import nandaComplete from '../data/nanda_complete_2024_2026.json';

// Banco Integral com TODOS os 277 diagnósticos do livro oficial NANDA-I 13ª Edição (2024-2026)
export const NANDA_COMPLETE_CATALOG = nandaComplete;

export function findNandaByCode(code) {
  if (!code) return null;
  const cleanCode = String(code).trim().padStart(5, '0');
  const curated = NANDA_CATALOG.find((d) => d.code === cleanCode);
  if (curated) return curated;

  const fromComplete = NANDA_COMPLETE_CATALOG.find((d) => d.code === cleanCode);
  if (fromComplete) {
    return {
      ...fromComplete,
      edition: 'NANDA-I 13ª Ed. (2024-2026)',
      interventions: [
        { code: 'G01', title: 'Vigilância clínica e cuidados de enfermagem', description: 'Monitorar sinais clínicos relacionados a ' + fromComplete.title + ' e implementar protocolo institucional.' }
      ],
      outcomes: [
        { code: 'R01', title: 'Estabilização clínica', scale: '1 (Gravemente comprometido) a 5 (Não comprometido)', target: 'Manter estabilidade do padrão fisiológico e prevenir agravos.' }
      ]
    };
  }
  return null;
}

export function searchNandaCatalog(query) {
  if (!query) return NANDA_COMPLETE_CATALOG;
  const q = String(query).toLowerCase().trim();

  return NANDA_COMPLETE_CATALOG.filter(
    (d) =>
      d.code.includes(q) ||
      d.title.toLowerCase().includes(q) ||
      (d.domain && d.domain.toLowerCase().includes(q)) ||
      (d.class && d.class.toLowerCase().includes(q)) ||
      (d.definition && d.definition.toLowerCase().includes(q))
  ).map((d) => {
    const curated = NANDA_CATALOG.find((c) => c.code === d.code);
    return curated || d;
  });
}

/**
 * Obtém sugestões contextuais inteligentes de Fatores Relacionados / Risco e Características Definidoras
 * a partir do título ou código do diagnóstico NANDA-I informado pelo estudante.
 */
export function getNandaContextualSuggestions(diagnosisNameOrCode) {
  if (!diagnosisNameOrCode || typeof diagnosisNameOrCode !== 'string') {
    return {
      matchedDiagnosis: null,
      isRiskDiagnosis: false,
      etiologies: [],
      evidences: []
    };
  }

  const query = diagnosisNameOrCode.toLowerCase().trim();

  // Tentar encontrar no catálogo curado oficial
  const matched = NANDA_CATALOG.find((d) => {
    const t = d.title.toLowerCase();
    const c = d.code;
    return query.includes(t) || t.includes(query) || (c && query.includes(c));
  }) || null;

  if (matched) {
    const isRisk = matched.title.toLowerCase().startsWith('risco de') || Boolean(matched.risk_factors?.length);
    const etiologies = isRisk
      ? (matched.risk_factors || [])
      : (matched.related_factors || []);
    const evidences = matched.defining_characteristics || [];

    return {
      matchedDiagnosis: matched,
      isRiskDiagnosis: isRisk,
      etiologies,
      evidences
    };
  }

  // Se não encontrar exato, verificar se a hipótese é um diagnóstico de risco
  const isRisk = query.startsWith('risco de') || query.includes('risco');
  return {
    matchedDiagnosis: null,
    isRiskDiagnosis: isRisk,
    etiologies: [],
    evidences: []
  };
}

// Banco Canônico de Etiologias e Fatores Relacionados Frequentes (NANDA-I 2024-2026)
export const COMMON_ETIOLOGIES = [
  "Fadiga da musculatura respiratória",
  "Hipervolemia e congestão pulmonar secundária",
  "Mobilidade física prejudicada",
  "Idade avançada (senescência e fragilidade fisiológica)",
  "Mecanismos reguladores hemodinâmicos comprometidos",
  "Fraqueza muscular generalizada e instabilidade motora",
  "Efeitos adversos de sedativos, diuréticos ou hipotensores",
  "Trauma mecânico penetrante ou cirúrgico recente",
  "Fricção e forças de cisalhamento sobre a pele",
  "Imobilidade prolongada no leito hospitalar",
  "Exposição contínua da pele à umidade e efluentes",
  "Processo inflamatório ou infeccioso sistêmico"
];

// Banco Canônico de Características Definidoras e Evidências Clínicas (NANDA-I 2024-2026)
export const COMMON_EVIDENCES = [
  "Taquipneia (FR > 24 irpm) com respiração superficial",
  "SpO2 < 90% em ar ambiente com dessaturação ao repouso",
  "Uso de musculatura acessória (tiragem intercostal/supraclavicular)",
  "Estertores crepitantes bibasais à ausculta pulmonar",
  "Edema periférico de membros inferiores (+2/+3/4+)",
  "Turgência jugular patológica a 45 graus",
  "Dor aguda de forte intensidade relatada à avaliação",
  "Tempo de enchimento capilar periférico lentificado (> 3 segundos)",
  "Pele pálida, fria, diaforética ou com má perfusão",
  "Instabilidade postural, marcha claudicante ou tremores"
];


