// GERADO por scripts/consulta/exportar-arquetipos.mjs. Não edite à mão.
// Arquétipos clínicos enxutos (só os campos usados na ficha), com candidatos NANDA.
export const ARQUETIPOS = [
  {
    "id": "sc_iam",
    "specialty": "cardiovascular",
    "disease": "Infarto Agudo do Miocárdio com Supradesnivelamento do Segmento ST (IAMCSST)",
    "anamnesis": "Paciente trazido pelo SAMU com queixa de dor torácica retroesternal opressiva há 2 horas, com irradiação para mandíbula e membro superior esquerdo, associada a diaforese fria e náuseas.",
    "medicalHistory": "Tabagista ativo (30 maços/ano), dislipidemia mista sem tratamento regular e histórico familiar de morte súbita precoce.",
    "medications": "AAS 100mg, Atorvastatina 40mg, Clopidogrel 75mg, Nitroglicerina sublingual SOS",
    "allergies": "Nega alergias medicamentosas ou alimentares.",
    "notes": "Acesso venoso periférico calibroso em MSE. Monitorização cardíaca contínua revelando supra de ST de 3mm em derivações DII, DIII e aVF (parede inferior).",
    "ageRange": [
      50,
      75
    ],
    "preferredGender": "M",
    "vitals": {
      "pa_sistolica": 90,
      "pa_diastolica": 60,
      "fc": 118,
      "fr": 26,
      "tax": 36.3,
      "sat": 92
    },
    "nandaCandidatos": [
      {
        "codigo": "00132",
        "nome": "Dor aguda"
      },
      {
        "codigo": "00240",
        "nome": "Risco de débito cardíaco diminuído"
      },
      {
        "codigo": "00400",
        "nome": "Ansiedade excessiva"
      },
      {
        "codigo": "00205",
        "nome": "Risco de choque"
      }
    ]
  },
  {
    "id": "sc_dpoc",
    "specialty": "respiratorio",
    "disease": "DPOC Exacerbado com Insuficiência Respiratória Aguda Hipercápnica",
    "anamnesis": "Admitido na emergência com dispneia progressiva aos mínimos esforços, piora da tosse com expectoração purulenta espessa esverdeada e uso evidente de musculatura acessória.",
    "medicalHistory": "Ex-tabagista pesado (45 maços/ano), três internações prévias por descompensação pulmonar nos últimos 18 meses.",
    "medications": "Brometo de Tiotrópio 2.5mcg, Formoterol + Budesonida 12/400mcg, Salbutamol inalatório de resgate",
    "allergies": "Alergia a Dipirona (urticária e angioedema prévios).",
    "notes": "Tiragem intercostal e batimento de asa de nariz. Murmúrio vesicular difusamente reduzido com sibilos expiratórios e roncos em bases.",
    "ageRange": [
      60,
      80
    ],
    "preferredGender": null,
    "vitals": {
      "pa_sistolica": 145,
      "pa_diastolica": 90,
      "fc": 112,
      "fr": 30,
      "tax": 37.9,
      "sat": 86
    },
    "nandaCandidatos": [
      {
        "codigo": "00030",
        "nome": "Troca de gases prejudicada"
      },
      {
        "codigo": "00032",
        "nome": "Padrão respiratório ineficaz"
      },
      {
        "codigo": "00128",
        "nome": "Confusão aguda (Delirium)"
      },
      {
        "codigo": "00132",
        "nome": "Dor aguda"
      }
    ]
  },
  {
    "id": "sc_ave_trombolise",
    "specialty": "neurologia",
    "disease": "Acidente Vascular Encefálico Isquêmico (AVEi) Agudo em Janela Trombolítica",
    "anamnesis": "Paciente deu entrada com início súbito de hemiparesia facio-braquio-crural à direita e afasia mista há 75 minutos (delta T = 1h15m). Aferido escore NIHSS = 14.",
    "medicalHistory": "Hipertensão arterial sistêmica, Fibrilação Atrial não anticoagulada por descontinuação voluntária do paciente.",
    "medications": "Losartana 50mg 12/12h, Anlodipino 5mg/dia",
    "allergies": "Nega alergias conhecidas.",
    "notes": "Púpilas isocóricas e fotorreagentes. Desvio de rima labial para a esquerda. Glicemia capilar de 128 mg/dL descartando hipoglicemia.",
    "ageRange": [
      65,
      85
    ],
    "preferredGender": null,
    "vitals": {
      "pa_sistolica": 185,
      "pa_diastolica": 105,
      "fc": 94,
      "fr": 18,
      "tax": 36.6,
      "sat": 96
    },
    "nandaCandidatos": [
      {
        "codigo": "00006",
        "nome": "Temperatura corporal diminuída"
      },
      {
        "codigo": "00029",
        "nome": "Débito cardíaco diminuído"
      },
      {
        "codigo": "00030",
        "nome": "Troca de gases prejudicada"
      },
      {
        "codigo": "00128",
        "nome": "Confusão aguda (Delirium)"
      },
      {
        "codigo": "00179",
        "nome": "Risco de autogestão ineficaz do padrão de glicemia"
      },
      {
        "codigo": "00310",
        "nome": "Incontinência urinária mista"
      }
    ]
  },
  {
    "id": "sc_sepse_urinaria",
    "specialty": "sepse",
    "disease": "Choque Séptico de Foco Urinário com Hiperlactatemia",
    "anamnesis": "Paciente idosa residente em ILPI com relato de febre há 48h, rebaixamento do nível de consciência, calafrios e urina turva com odor fétido e grumos.",
    "medicalHistory": "Sequela de AVE prévio, bexiga neurogênica com uso intermitente de cateterismo vesical.",
    "medications": "Sertralina 50mg, Omeprazol 20mg",
    "allergies": "Alergia a Sulfas (Bactrim) e Penicilinas.",
    "notes": "Pele mosqueada com livedo em joelhos, tempo de enchimento capilar (TEC) de 4 segundos. Lactato arterial de 3,8 mmol/L.",
    "ageRange": [
      70,
      90
    ],
    "preferredGender": "F",
    "vitals": {
      "pa_sistolica": 80,
      "pa_diastolica": 45,
      "fc": 126,
      "fr": 28,
      "tax": 38.8,
      "sat": 90
    },
    "nandaCandidatos": [
      {
        "codigo": "00029",
        "nome": "Débito cardíaco diminuído"
      },
      {
        "codigo": "00006",
        "nome": "Temperatura corporal diminuída"
      },
      {
        "codigo": "00128",
        "nome": "Confusão aguda (Delirium)"
      },
      {
        "codigo": "00027",
        "nome": "Volume de líquidos inadequado"
      },
      {
        "codigo": "00030",
        "nome": "Troca de gases prejudicada"
      },
      {
        "codigo": "00007",
        "nome": "Hipertermia"
      },
      {
        "codigo": "00046",
        "nome": "Integridade da pele prejudicada"
      },
      {
        "codigo": "00132",
        "nome": "Dor aguda"
      },
      {
        "codigo": "00205",
        "nome": "Risco de choque"
      }
    ]
  },
  {
    "id": "sc_cad",
    "specialty": "metabolico_endocrino",
    "disease": "Cetoacidose Diabética Severa (CAD) Descompensada",
    "anamnesis": "Jovem com DM tipo 1 admitido com náuseas incoercíveis, dor abdominal difusa em cólica, polidipsia intensa e respiração profunda e ruidosa (Kussmaul) com hálito cetônico.",
    "medicalHistory": "Diabetes Mellitus Tipo 1 desde os 12 anos. Suspendeu insulina há 3 dias por esquecimento em viagem.",
    "medications": "Insulina NPH 24 UI pela manhã e 12 UI à noite, Insulina Regular em escala conforme glicemia",
    "allergies": "Nenhuma conhecida.",
    "notes": "Glicemia capilar indicando 'HI' (> 600 mg/dL). Gasometria com pH 7,12, HCO3 9 mEq/L e cetonúria 4+/4+.",
    "ageRange": [
      18,
      35
    ],
    "preferredGender": null,
    "vitals": {
      "pa_sistolica": 95,
      "pa_diastolica": 60,
      "fc": 122,
      "fr": 32,
      "tax": 36.8,
      "sat": 97
    },
    "nandaCandidatos": [
      {
        "codigo": "00029",
        "nome": "Débito cardíaco diminuído"
      },
      {
        "codigo": "00030",
        "nome": "Troca de gases prejudicada"
      },
      {
        "codigo": "00006",
        "nome": "Temperatura corporal diminuída"
      },
      {
        "codigo": "00027",
        "nome": "Volume de líquidos inadequado"
      },
      {
        "codigo": "00179",
        "nome": "Risco de autogestão ineficaz do padrão de glicemia"
      },
      {
        "codigo": "00489",
        "nome": "Risco de autogestão ineficaz do padrão de glicemia"
      }
    ]
  },
  {
    "id": "sc_peritonite",
    "specialty": "cirurgico_abdome",
    "disease": "Apendicite Aguda Perfurada com Peritonite Fecaloide",
    "anamnesis": "Admitido com dor abdominal iniciada em região periumbilical que migrou para fossa ilíaca direita há 36 horas, com febre alta e vômitos biliares repetidos.",
    "medicalHistory": "Hígido previamente, sem cirurgias abdominais anteriores.",
    "medications": "Nenhuma medicação de uso contínuo",
    "allergies": "Nega alergias.",
    "notes": "Abdome distendido com contratura involuntária generalizada ('abdome em tábua') e descompressão brusca intensamente dolorosa (Blumberg positivo).",
    "ageRange": [
      20,
      50
    ],
    "preferredGender": "M",
    "vitals": {
      "pa_sistolica": 100,
      "pa_diastolica": 65,
      "fc": 114,
      "fr": 24,
      "tax": 38.7,
      "sat": 96
    },
    "nandaCandidatos": [
      {
        "codigo": "00027",
        "nome": "Volume de líquidos inadequado"
      },
      {
        "codigo": "00128",
        "nome": "Confusão aguda (Delirium)"
      },
      {
        "codigo": "00132",
        "nome": "Dor aguda"
      },
      {
        "codigo": "00030",
        "nome": "Troca de gases prejudicada"
      }
    ]
  },
  {
    "id": "sc_ira_rabdo",
    "specialty": "nefrologia",
    "disease": "Injúria Renal Aguda (IRA) KDIGO 3 por Rabdomiólise com Hipercalemia",
    "anamnesis": "Paciente resgatado após queda da própria altura com permanência no chão por cerca de 16 horas sem socorro. Apresenta oligúria severa com diurese cor de refrigerante de cola.",
    "medicalHistory": "Hipertensão arterial, Doença renal crônica estágio 2 prévia.",
    "medications": "Hidroclorotiazida 25mg/dia, Enalapril 20mg/dia",
    "allergies": "Nenhuma alergia relatada.",
    "notes": "Potássio sérico crítico de 6,8 mEq/L. ECG exibindo ondas T apiculadas em tenda e alargamento do complexo QRS.",
    "ageRange": [
      65,
      85
    ],
    "preferredGender": null,
    "vitals": {
      "pa_sistolica": 155,
      "pa_diastolica": 95,
      "fc": 58,
      "fr": 22,
      "tax": 36.2,
      "sat": 94
    },
    "nandaCandidatos": [
      {
        "codigo": "00027",
        "nome": "Volume de líquidos inadequado"
      },
      {
        "codigo": "00029",
        "nome": "Débito cardíaco diminuído"
      },
      {
        "codigo": "00276",
        "nome": "Autogestão ineficaz da saúde"
      },
      {
        "codigo": "00461",
        "nome": "Integridade do complexo mamilo-areolar prejudicada"
      },
      {
        "codigo": "00462",
        "nome": "Risco de integridade do complexo mamilo-areolar prejudicada"
      }
    ]
  },
  {
    "id": "sc_preeclampsia",
    "specialty": "obstetricia",
    "disease": "Pré-Eclâmpsia Grave com Sinais de Iminência de Eclâmpsia",
    "anamnesis": "Gestante de 34 semanas primigesta trazida à maternidade com cefaleia occipital pulsátil de forte intensidade, escotomas cintilantes e dor epigástrica em barra.",
    "medicalHistory": "Gestação única tópica sem intercorrências no primeiro trimestre.",
    "medications": "Sulfato Ferroso 40mg, Ácido Fólico 5mg, Carbonato de Cálcio 1g",
    "allergies": "Alergia a Iodo (eritema).",
    "notes": "Edema facial e de mãos 3+/4+. Reflexos patelares exaltados (clonus de 3 batimentos). Proteinúria de fita 3+.",
    "ageRange": [
      20,
      38
    ],
    "preferredGender": "F",
    "vitals": {
      "pa_sistolica": 175,
      "pa_diastolica": 115,
      "fc": 96,
      "fr": 22,
      "tax": 36.5,
      "sat": 98
    },
    "nandaCandidatos": [
      {
        "codigo": "00030",
        "nome": "Troca de gases prejudicada"
      },
      {
        "codigo": "00132",
        "nome": "Dor aguda"
      },
      {
        "codigo": "00155",
        "nome": "Risco de quedas em adultos"
      },
      {
        "codigo": "00201",
        "nome": "Risco de perfusão tissular cerebral ineficaz"
      }
    ]
  },
  {
    "id": "sc_trauma_hemorragico",
    "specialty": "trauma",
    "disease": "Politraumatismo com Fratura Exposta de Fêmur e Choque Hipovolêmico Classe III",
    "anamnesis": "Vítima de colisão moto x anteparo admitida na sala de trauma imobilizada em prancha rígida com colar cervical, confusa e com sangramento ativo em coxa direita.",
    "medicalHistory": "Hígido, sem doenças crônicas ou comorbidades conhecidas.",
    "medications": "Nenhuma medicação contínua",
    "allergies": "Nega alergias.",
    "notes": "Fratura exposta Gustilo III em terço médio de fêmur D com curativo compressivo ensanguentado. Pulsos distais pediosos filiformes.",
    "ageRange": [
      19,
      45
    ],
    "preferredGender": "M",
    "vitals": {
      "pa_sistolica": 85,
      "pa_diastolica": 55,
      "fc": 134,
      "fr": 28,
      "tax": 35.8,
      "sat": 91
    },
    "nandaCandidatos": [
      {
        "codigo": "00029",
        "nome": "Débito cardíaco diminuído"
      },
      {
        "codigo": "00046",
        "nome": "Integridade da pele prejudicada"
      },
      {
        "codigo": "00006",
        "nome": "Temperatura corporal diminuída"
      },
      {
        "codigo": "00085",
        "nome": "Mobilidade física prejudicada"
      },
      {
        "codigo": "00128",
        "nome": "Confusão aguda (Delirium)"
      },
      {
        "codigo": "00132",
        "nome": "Dor aguda"
      },
      {
        "codigo": "00205",
        "nome": "Risco de choque"
      },
      {
        "codigo": "00206",
        "nome": "Risco de sangramento excessivo"
      }
    ]
  },
  {
    "id": "sc_tep",
    "specialty": "respiratorio",
    "disease": "Tromboembolismo Pulmonar (TEP) Submaciço com Sobrecarga de VD",
    "anamnesis": "Paciente no 8º dia de pós-operatório de prótese total de joelho com início súbito de dor torácica pleurítica, dispneia intensa em repouso e hemoptise discreta.",
    "medicalHistory": "Artrose severa de joelho, obesidade grau 2 (IMC 36 kg/m²).",
    "medications": "Enoxaparina profilática interrompida precocemente, Paracetamol SOS",
    "allergies": "Nenhuma conhecida.",
    "notes": "Estase jugular a 45 graus visível. Membro inferior esquerdo com empastamento de panturrilha e sinal de Homans positivo.",
    "ageRange": [
      55,
      75
    ],
    "preferredGender": "F",
    "vitals": {
      "pa_sistolica": 100,
      "pa_diastolica": 65,
      "fc": 124,
      "fr": 32,
      "tax": 37.2,
      "sat": 85
    },
    "nandaCandidatos": [
      {
        "codigo": "00027",
        "nome": "Volume de líquidos inadequado"
      },
      {
        "codigo": "00030",
        "nome": "Troca de gases prejudicada"
      },
      {
        "codigo": "00032",
        "nome": "Padrão respiratório ineficaz"
      },
      {
        "codigo": "00085",
        "nome": "Mobilidade física prejudicada"
      },
      {
        "codigo": "00128",
        "nome": "Confusão aguda (Delirium)"
      }
    ]
  },
  {
    "id": "sc_icc_perfil_b",
    "specialty": "cardiovascular",
    "disease": "Insuficiência Cardíaca Agudamente Descompensada (Perfil B - Quente e Úmido)",
    "anamnesis": "Paciente idoso com ortopneia (necessidade de 3 travesseiros), dispneia paroxística noturna, tosse seca e edema de membros inferiores com cacifo 3+/4+ até joelhos.",
    "medicalHistory": "Cardiopatia isquêmica com revascularização miocárdica há 5 anos, hipertensão de longa data.",
    "medications": "Carvedilol 25mg 12/12h, Sacubitril/Valsartana 49/51mg 12/12h, Furosemida 40mg/dia, Espironolactona 25mg",
    "allergies": "Penicilina.",
    "notes": "Ausculta pulmonar com estertores crepitantes bilaterais até terço médio. Refluxo hepatojugular presente.",
    "ageRange": [
      68,
      88
    ],
    "preferredGender": "M",
    "vitals": {
      "pa_sistolica": 165,
      "pa_diastolica": 100,
      "fc": 102,
      "fr": 26,
      "tax": 36.4,
      "sat": 88
    },
    "nandaCandidatos": [
      {
        "codigo": "00030",
        "nome": "Troca de gases prejudicada"
      },
      {
        "codigo": "00007",
        "nome": "Hipertermia"
      },
      {
        "codigo": "00029",
        "nome": "Débito cardíaco diminuído"
      },
      {
        "codigo": "00046",
        "nome": "Integridade da pele prejudicada"
      },
      {
        "codigo": "00352",
        "nome": "Autogestão ineficaz da boca seca"
      },
      {
        "codigo": "00353",
        "nome": "Síndrome da fragilidade do idoso"
      }
    ]
  },
  {
    "id": "sc_pancreatite",
    "specialty": "cirurgico_abdome",
    "disease": "Pancreatite Aguda Grave de Origem Biliar com Coleção Peripancreática",
    "anamnesis": "Paciente com dor abdominal epigástrica lancinante em faixa com irradiação dorsal, iniciada após refeição copiosa, refratária a analgésicos comuns, com distensão e náuseas.",
    "medicalHistory": "Colelitíase sintomática conhecida com indicação cirúrgica protelada pela paciente.",
    "medications": "Dipirona SOS, Escopolamina gotas",
    "allergies": "Nenhuma conhecida.",
    "notes": "Amilase sérica > 1.800 U/L e lipase > 2.200 U/L. Ruídos hidroaéreos abolidos sugerindo íleo paralítico inflamatório.",
    "ageRange": [
      35,
      65
    ],
    "preferredGender": "F",
    "vitals": {
      "pa_sistolica": 105,
      "pa_diastolica": 65,
      "fc": 116,
      "fr": 24,
      "tax": 38.1,
      "sat": 94
    },
    "nandaCandidatos": [
      {
        "codigo": "00007",
        "nome": "Hipertermia"
      },
      {
        "codigo": "00132",
        "nome": "Dor aguda"
      },
      {
        "codigo": "00030",
        "nome": "Troca de gases prejudicada"
      },
      {
        "codigo": "00155",
        "nome": "Risco de quedas em adultos"
      }
    ]
  },
  {
    "id": "sc_delirium_idoso",
    "specialty": "neurologia",
    "disease": "Síndrome Confusional Aguda (Delirium Hiperativo) Secundária a Broncoaspiração",
    "anamnesis": "Idosa internada em enfermaria cirúrgica evolui à noite com agitação psicomotora intensa, tentativa de arrancar cateter periférico e alucinações visuais com insetos na parede.",
    "medicalHistory": "Doença de Alzheimer estágio moderado, disfagia orofaríngea neurogênica pós-AVE prévio.",
    "medications": "Donepezila 10mg à noite, Quetiapina 25mg se agitação",
    "allergies": "Nega alergias.",
    "notes": "Ausculta com roncos e estertores em base direita. CAM positivo demonstrando flutuação aguda e desatenção.",
    "ageRange": [
      78,
      92
    ],
    "preferredGender": "F",
    "vitals": {
      "pa_sistolica": 140,
      "pa_diastolica": 85,
      "fc": 110,
      "fr": 24,
      "tax": 38.3,
      "sat": 91
    },
    "nandaCandidatos": [
      {
        "codigo": "00128",
        "nome": "Confusão aguda (Delirium)"
      },
      {
        "codigo": "00027",
        "nome": "Volume de líquidos inadequado"
      },
      {
        "codigo": "00030",
        "nome": "Troca de gases prejudicada"
      },
      {
        "codigo": "00132",
        "nome": "Dor aguda"
      },
      {
        "codigo": "00141",
        "nome": "Síndrome pós-trauma"
      },
      {
        "codigo": "00145",
        "nome": "Risco de síndrome pós-trauma"
      }
    ]
  },
  {
    "id": "sc_anafilaxia",
    "specialty": "respiratorio",
    "disease": "Choque Anafilático Grave Pós-Administração de Antibiótico Venoso",
    "anamnesis": "Durante infusão de ceftriaxona venosa, paciente iniciou subitamente com sensação de garganta fechando, estridor laríngeo, placas eritematosas pruriginosas e lipotimia.",
    "medicalHistory": "Tratando celulite em membro inferior esquerdo há 24 horas.",
    "medications": "Ceftriaxona 2g IV/dia, Dipirona 1g SOS",
    "allergies": "Relato materno vago de 'alergia a injeções na infância' não registrado formalmente.",
    "notes": "Edema labial e de úvula evidente. Saturação em queda rápida com broncoespasmo difuso bilateral à ausculta.",
    "ageRange": [
      22,
      58
    ],
    "preferredGender": null,
    "vitals": {
      "pa_sistolica": 70,
      "pa_diastolica": 40,
      "fc": 138,
      "fr": 34,
      "tax": 36.9,
      "sat": 83
    },
    "nandaCandidatos": [
      {
        "codigo": "00006",
        "nome": "Temperatura corporal diminuída"
      },
      {
        "codigo": "00029",
        "nome": "Débito cardíaco diminuído"
      },
      {
        "codigo": "00030",
        "nome": "Troca de gases prejudicada"
      },
      {
        "codigo": "00128",
        "nome": "Confusão aguda (Delirium)"
      },
      {
        "codigo": "00205",
        "nome": "Risco de choque"
      }
    ]
  },
  {
    "id": "sc_queimadura",
    "specialty": "trauma",
    "disease": "Grande Queimado Térmico (32% de SCQ de 2º e 3º Graus) em Ressuscitação Volêmica",
    "anamnesis": "Vítima de explosão de botijão de gás doméstico em ambiente fechado, admitido com queimaduras extensas em face, tórax anterior e ambos os membros superiores.",
    "medicalHistory": "Hígido, sem doenças metabólicas prévias.",
    "medications": "Nenhuma medicação contínua",
    "allergies": "Nenhuma conhecida.",
    "notes": "Pelos nasais chamuscados e escarro fuliginoso alertando para risco iminente de lesão inalatória térmica de via aérea superior.",
    "ageRange": [
      25,
      48
    ],
    "preferredGender": "M",
    "vitals": {
      "pa_sistolica": 90,
      "pa_diastolica": 55,
      "fc": 128,
      "fr": 26,
      "tax": 35.6,
      "sat": 92
    },
    "nandaCandidatos": [
      {
        "codigo": "00006",
        "nome": "Temperatura corporal diminuída"
      },
      {
        "codigo": "00032",
        "nome": "Padrão respiratório ineficaz"
      },
      {
        "codigo": "00046",
        "nome": "Integridade da pele prejudicada"
      },
      {
        "codigo": "00047",
        "nome": "Risco de lesão por pressão em adultos"
      },
      {
        "codigo": "00128",
        "nome": "Confusão aguda (Delirium)"
      },
      {
        "codigo": "00087",
        "nome": "Risco de lesão por posicionamento perioperatório"
      }
    ]
  },
  {
    "id": "sc_pos_apendicectomia_dm",
    "specialty": "cirurgico_abdome",
    "disease": "Pós-operatório imediato de apendicectomia em paciente com diabetes mellitus tipo 2",
    "anamnesis": "Paciente no 1º dia de pós-operatório de apendicectomia por apendicite aguda. Refere dor na ferida operatória, náusea desde a manhã e ainda não eliminou flatos. Conta que costuma esquecer a metformina nos dias de trabalho.",
    "medicalHistory": "Diabetes mellitus tipo 2 há 8 anos, em uso irregular de metformina; hipertensão arterial. Trabalha como motorista em turnos longos.",
    "medications": "Em casa: metformina 850 mg duas vezes ao dia (usa de forma irregular, esquece nos dias de trabalho) e losartana 50 mg uma vez ao dia.",
    "allergies": "Nega alergias.",
    "notes": "Ferida operatória abdominal com curativo seco e limpo. Abdome distendido, ruídos hidroaéreos diminuídos. Glicemia capilar antes do almoço: 238 mg/dL. Acesso venoso periférico em MSD.",
    "ageRange": [
      55,
      70
    ],
    "preferredGender": null,
    "vitals": {
      "pa_sistolica": 138,
      "pa_diastolica": 86,
      "fc": 96,
      "fr": 18,
      "tax": 37.6,
      "sat": 96
    },
    "nandaCandidatos": [
      {
        "codigo": "00132",
        "nome": "Dor aguda"
      },
      {
        "codigo": "00489",
        "nome": "Risco de autogestão ineficaz do padrão de glicemia"
      },
      {
        "codigo": "00004",
        "nome": "Risco de infecção"
      },
      {
        "codigo": "00422",
        "nome": "Risco de motilidade gastrintestinal prejudicada"
      },
      {
        "codigo": "00464",
        "nome": "Risco de recuperação cirúrgica prejudicada"
      },
      {
        "codigo": "00435",
        "nome": "Conhecimento de saúde inadequado"
      }
    ]
  }
];

export const buscarArquetipo = (id) => ARQUETIPOS.find((a) => a.id === id) ?? null;
