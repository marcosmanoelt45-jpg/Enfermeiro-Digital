// GERADO por scripts/plantao/exportar-cenarios.mjs. Não edite à mão.
// Cenários do Plantão para o servidor (avaliar_plantao). A fonte é src/data/sbarPlantaoDados.js.
export const CENARIOS_PLANTAO = [
 {
  "id": "pos_op",
  "title": "1º DPO de Colectomia Parcial",
  "sector": "Clínica Cirúrgica • Leito 12-A",
  "diagnosis": "Pós-operatório imediato de colectomia por diverticulite aguda",
  "vitals": {
   "pa_sistolica": 115,
   "pa_diastolica": 72,
   "fc": 84,
   "fr": 17,
   "sat": 98,
   "tax": 36.6
  },
  "goldenSbar": {
   "situation": "Paciente M.S.L., 58 anos, no Leito 12-A da Clínica Cirúrgica, no 1º DPO de colectomia parcial por diverticulite.",
   "background": "Hipertenso controlado com Losartana. Nega alergias medicamentosas e cirurgias abdominais prévias.",
   "assessment": "PA 115/72 mmHg, FC 84 bpm, afebril, SatO2 98% em ar ambiente. Abdome flácido, doloroso à palpação na incisão (EVA 4/10). Dreno de Portovac com débito serossanguinolento de 120 mL em 12h. Curativo cirúrgico limpo e seco.",
   "recommendation": "Vigiar aspecto e volume do dreno a cada 4 horas; administrar analgesia prescrita às 20h; checar resultado do hematócrito de controle colhido nesta tarde."
  },
  "educationalPointers": {
   "situation": "Diga quem é, o leito e o motivo cirúrgico em 15 segundos.",
   "background": "Confirme categoricamente que o paciente NÃO tem alergias medicamentosas.",
   "assessment": "Fale números exatos de PA, débito do dreno e nota da dor na escala EVA.",
   "recommendation": "Deixe horários claros de analgesia e exames laboratoriais a checar."
  },
  "lacunas": [
   {
    "campo": "ferida_dreno",
    "rotulo": "Ferida operatória e dreno",
    "valorEsperado": "curativo limpo e seco; dreno de Portovac com 120 mL serossanguinolento em 12 horas"
   },
   {
    "campo": "abdome",
    "rotulo": "Abdome",
    "valorEsperado": "flácido, doloroso só na incisão (EVA 4/10), sem sinais de peritonite"
   }
  ],
  "perguntas": [
   {
    "id": "plt.pos_op.s1",
    "letra": "S",
    "texto": "Quem é o paciente e por que ele está internado?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.pos_op.s2",
    "letra": "S",
    "texto": "Qual o leito e em que dia de pós-operatório ele está?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.pos_op.b1",
    "letra": "B",
    "texto": "Ele tem alergia ou alguma doença de base que eu precise saber?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.pos_op.a1",
    "letra": "A",
    "texto": "Como estão os sinais vitais?",
    "espera": {
     "tipo": "numero",
     "campos": [
      "pa_sistolica",
      "pa_diastolica",
      "fc",
      "sat"
     ]
    }
   },
   {
    "id": "plt.pos_op.a2",
    "letra": "A",
    "texto": "E a ferida e o dreno? Quanto saiu?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "ferida_dreno"
   },
   {
    "id": "plt.pos_op.a3",
    "letra": "A",
    "texto": "Como está o abdome? Ele tem dor?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "abdome"
   },
   {
    "id": "plt.pos_op.r1",
    "letra": "R",
    "texto": "O que eu preciso vigiar no meu plantão?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.pos_op.r2",
    "letra": "R",
    "texto": "Tem medicação ou exame com horário pra eu checar?",
    "espera": {
     "tipo": "texto"
    }
   }
  ],
  "elementosChave": {
   "S": [
    "identificação (iniciais e idade)",
    "leito e setor",
    "colectomia por diverticulite",
    "1º dia de pós-operatório"
   ],
   "B": [
    "diverticulite aguda como motivo",
    "hipertenso, usa losartana",
    "sem alergias medicamentosas"
   ],
   "A": [
    "PA, FC e saturação",
    "dor na escala (EVA 4/10)",
    "dreno com 120 mL em 12 horas",
    "curativo limpo e seco"
   ],
   "R": [
    "vigiar o dreno a cada 4 horas",
    "analgesia às 20h",
    "conferir o hematócrito de controle"
   ]
  }
 },
 {
  "id": "icc",
  "title": "ICC Descompensada & Congestão Pulmonar",
  "sector": "UTI Cardiológica • Leito 04",
  "diagnosis": "Insuficiência Cardíaca Congestiva perfil B (úmido e quente)",
  "vitals": {
   "pa_sistolica": 148,
   "pa_diastolica": 94,
   "fc": 96,
   "fr": 23,
   "sat": 92,
   "tax": 36.4
  },
  "goldenSbar": {
   "situation": "Paciente J.A.P., 67 anos, no Leito 04 da UTI Cardiológica, admitido há 6 horas por descompensação de ICC com congestão pulmonar aguda.",
   "background": "Histórico de ICC com fração de ejeção de 32%, HAS e DM2. Relata alergia severa a contraste iodado.",
   "assessment": "PA 148/94 mmHg, FC 96 bpm, FR 23 irpm, SatO2 92% em ar ambiente que subiu para 96% sob cateter nasal a 3 L/min. Estertores crepitantes finos bibasais e edema de MMII +++/4+.",
   "recommendation": "Administrar Furosemida 40 mg IV prescrita para as 20h; realizar balanço hídrico rigoroso de 6 em 6 horas e registrar peso em jejum amanhã cedo."
  },
  "educationalPointers": {
   "situation": "Identifique o tempo de admissão (6 horas) e o motivo da descompensação.",
   "background": "Obrigatoriamente avise sobre a alergia a contraste iodado antes de qualquer tomografia.",
   "assessment": "Informe a resposta da saturação ao oxigênio (de 92% para 96% a 3 L/min).",
   "recommendation": "Prescreva o controle de diurese e o balanço hídrico rigoroso."
  },
  "lacunas": [
   {
    "campo": "ausculta_pulmonar",
    "rotulo": "Ausculta pulmonar",
    "valorEsperado": "crepitações finas em bases"
   },
   {
    "campo": "edema_mmii",
    "rotulo": "Membros inferiores",
    "valorEsperado": "edema bilateral com cacifo (+++/4+)"
   },
   {
    "campo": "turgencia_jugular",
    "rotulo": "Veias do pescoço",
    "valorEsperado": "turgência jugular patológica a 45 graus"
   }
  ],
  "perguntas": [
   {
    "id": "plt.icc.s1",
    "letra": "S",
    "texto": "Quem é o paciente e por que ele está na UTI?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.icc.b1",
    "letra": "B",
    "texto": "Ele tem alguma alergia que eu precise saber?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.icc.b2",
    "letra": "B",
    "texto": "Quais são as doenças de base dele?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.icc.a1",
    "letra": "A",
    "texto": "Como estão os sinais vitais?",
    "espera": {
     "tipo": "numero",
     "campos": [
      "pa_sistolica",
      "pa_diastolica",
      "fc",
      "fr",
      "sat"
     ]
    }
   },
   {
    "id": "plt.icc.a2",
    "letra": "A",
    "texto": "Como está o pulmão? Você auscultou?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "ausculta_pulmonar"
   },
   {
    "id": "plt.icc.a3",
    "letra": "A",
    "texto": "E as pernas, tem edema?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "edema_mmii"
   },
   {
    "id": "plt.icc.a4",
    "letra": "A",
    "texto": "E o pescoço, como estão as jugulares?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "turgencia_jugular"
   },
   {
    "id": "plt.icc.r1",
    "letra": "R",
    "texto": "O que eu preciso fazer neste plantão?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.icc.r2",
    "letra": "R",
    "texto": "Tem medicação com horário?",
    "espera": {
     "tipo": "texto"
    }
   }
  ],
  "elementosChave": {
   "S": [
    "identificação (iniciais e idade)",
    "leito e setor",
    "descompensação de ICC",
    "admitido há 6 horas"
   ],
   "B": [
    "ICC com fração de ejeção de 32%",
    "hipertensão e diabetes",
    "alergia a contraste iodado"
   ],
   "A": [
    "PA, FC, FR e saturação",
    "saturação de 92% para 96% com 3 L/min",
    "estertores bibasais",
    "edema de membros inferiores"
   ],
   "R": [
    "furosemida 40 mg IV às 20h",
    "balanço hídrico de 6 em 6 horas",
    "peso em jejum amanhã cedo"
   ]
  }
 },
 {
  "id": "delirium",
  "title": "Idoso com Delirium & Risco de Queda",
  "sector": "Enfermaria Geriátrica • Leito 21-B",
  "diagnosis": "Pneumonia Comunitária associada a Delirium Misto",
  "vitals": {
   "pa_sistolica": 132,
   "pa_diastolica": 78,
   "fc": 76,
   "fr": 19,
   "sat": 95,
   "tax": 37.1
  },
  "goldenSbar": {
   "situation": "Paciente A.B.C., 82 anos, Leito 21-B da Geriatria, no 3º dia de internação por pneumonia comunitária em antibioticoterapia venosa.",
   "background": "Diagnóstico prévio de Alzheimer leve e osteoartrose. Nega alergias medicamentosas conhecidas. Histórico de queda no domicílio há 2 meses com contusão em quadril.",
   "assessment": "Sinais vitais estáveis (PA 132/78 mmHg, FC 76 bpm, SatO2 95%). Apresenta flutuação do sensório (CAM positivo), agitou-se no início da tarde tentando levantar-se sem auxílio.",
   "recommendation": "Manter grades do leito sempre elevadas bilateralmente; orientar e apoiar o acompanhante familiar; manter acesso periférico protegido e evitar contenção física mecânica desnecessária."
  },
  "educationalPointers": {
   "situation": "Informe o dia do antibiótico e a enfermaria geriátrica.",
   "background": "Alerte sobre a queda recente no domicílio para acionar o protocolo de quedas.",
   "assessment": "Descreva a flutuação do CAM e a tentativa de evasão do leito.",
   "recommendation": "Foque nas grades elevadas e na segurança física do paciente sem contenção abusiva."
  },
  "lacunas": [
   {
    "campo": "cam",
    "rotulo": "Atenção e orientação (CAM)",
    "valorEsperado": "CAM positivo: atenção que flutua e desorientação no tempo"
   },
   {
    "campo": "acesso_venoso",
    "rotulo": "Acesso venoso periférico",
    "valorEsperado": "acesso pérvio, protegido com bandagem, sem sinais de flebite"
   },
   {
    "campo": "seguranca_leito",
    "rotulo": "Segurança no leito",
    "valorEsperado": "grades elevadas dos dois lados e acompanhante presente"
   }
  ],
  "perguntas": [
   {
    "id": "plt.delirium.s1",
    "letra": "S",
    "texto": "Quem é a paciente e por que ela está internada?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.delirium.s2",
    "letra": "S",
    "texto": "Qual o leito e em que dia de internação ela está?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.delirium.b1",
    "letra": "B",
    "texto": "Ela tem alergia ou doença de base que eu precise saber?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.delirium.b2",
    "letra": "B",
    "texto": "Ela já caiu antes?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.delirium.a1",
    "letra": "A",
    "texto": "Como estão os sinais vitais?",
    "espera": {
     "tipo": "numero",
     "campos": [
      "pa_sistolica",
      "pa_diastolica",
      "fc",
      "sat"
     ]
    }
   },
   {
    "id": "plt.delirium.a2",
    "letra": "A",
    "texto": "Como está a atenção e a orientação dela?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "cam"
   },
   {
    "id": "plt.delirium.a3",
    "letra": "A",
    "texto": "E o acesso venoso, como está?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "acesso_venoso"
   },
   {
    "id": "plt.delirium.a4",
    "letra": "A",
    "texto": "Como está a segurança no leito?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "seguranca_leito"
   },
   {
    "id": "plt.delirium.r1",
    "letra": "R",
    "texto": "O que eu preciso fazer pra evitar queda neste plantão?",
    "espera": {
     "tipo": "texto"
    }
   }
  ],
  "elementosChave": {
   "S": [
    "identificação (iniciais e idade)",
    "leito e setor",
    "pneumonia comunitária",
    "3º dia de antibiótico venoso"
   ],
   "B": [
    "Alzheimer leve e osteoartrose",
    "sem alergias",
    "queda em casa há 2 meses"
   ],
   "A": [
    "PA 132/78, FC 76 e saturação 95%",
    "CAM positivo (sensório flutuante)",
    "tentou se levantar sem ajuda",
    "acesso periférico pérvio"
   ],
   "R": [
    "grades elevadas dos dois lados",
    "orientar e apoiar o acompanhante",
    "proteger o acesso periférico",
    "evitar contenção mecânica"
   ]
  }
 },
 {
  "id": "dpoc",
  "title": "Exacerbação de DPOC & Broncoespasmo",
  "sector": "Clínica Médica • Leito 08",
  "diagnosis": "Doença Pulmonar Obstrutiva Crônica agudizada por infecção traqueobrônquica",
  "vitals": {
   "pa_sistolica": 138,
   "pa_diastolica": 85,
   "fc": 104,
   "fr": 26,
   "sat": 89,
   "tax": 37.8
  },
  "goldenSbar": {
   "situation": "Paciente R.F.M., 64 anos, no Leito 08 da Clínica Médica, internado há 12 horas por exacerbação de DPOC infecciosa.",
   "background": "DPOC estágio GOLD 3 com uso domiciliar de broncodilatadores. Alergia prévia a dipirona com urticária.",
   "assessment": "PA 138/85 mmHg, FC 104 bpm, FR 26 irpm com tiragem intercostal leve, SatO2 89% em ar ambiente que subiu para 92% com Venturi a 28%. Sibilos expiratórios bilaterais e roncos esparsos.",
   "recommendation": "Manter oxigenoterapia com alvo estrito de SatO2 entre 88-92% para evitar hipercapnia; realizar nebulização com broncodilatador prescrito às 22h e vigiar padrão ventilatório."
  },
  "educationalPointers": {
   "situation": "Informe o estágio do DPOC e tempo de admissão.",
   "background": "Alerte categoricamente sobre a alergia à dipirona.",
   "assessment": "Ressalte o alvo específico de oxigênio de 88-92% no retentor de CO2.",
   "recommendation": "Prescreva a vigilância da frequência respiratória e horários da nebulização."
  },
  "lacunas": [
   {
    "campo": "ausculta",
    "rotulo": "Ausculta pulmonar",
    "valorEsperado": "sibilos expiratórios bilaterais e roncos esparsos"
   },
   {
    "campo": "esforco_resp",
    "rotulo": "Esforço respiratório",
    "valorEsperado": "tiragem intercostal leve, falando frases curtas"
   },
   {
    "campo": "oxigenoterapia",
    "rotulo": "Oxigenoterapia",
    "valorEsperado": "máscara de Venturi a 28%, com SatO2 de 92%"
   }
  ],
  "perguntas": [
   {
    "id": "plt.dpoc.s1",
    "letra": "S",
    "texto": "Quem é o paciente e por que ele está internado?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.dpoc.s2",
    "letra": "S",
    "texto": "Qual o leito e há quanto tempo ele está aqui?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.dpoc.b1",
    "letra": "B",
    "texto": "Ele tem alergia a algum medicamento?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.dpoc.b2",
    "letra": "B",
    "texto": "Qual o grau do DPOC e o que ele usa em casa?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.dpoc.a1",
    "letra": "A",
    "texto": "Como estão os sinais vitais?",
    "espera": {
     "tipo": "numero",
     "campos": [
      "fc",
      "fr",
      "sat",
      "tax"
     ]
    }
   },
   {
    "id": "plt.dpoc.a2",
    "letra": "A",
    "texto": "Como está o pulmão? Você auscultou?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "ausculta"
   },
   {
    "id": "plt.dpoc.a3",
    "letra": "A",
    "texto": "E o esforço respiratório, como está?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "esforco_resp"
   },
   {
    "id": "plt.dpoc.a4",
    "letra": "A",
    "texto": "Ele está com oxigênio? Quanto e qual a saturação?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "oxigenoterapia"
   },
   {
    "id": "plt.dpoc.r1",
    "letra": "R",
    "texto": "Qual o alvo de saturação e o que eu devo vigiar?",
    "espera": {
     "tipo": "texto"
    }
   }
  ],
  "elementosChave": {
   "S": [
    "identificação (iniciais e idade)",
    "leito e setor",
    "exacerbação infecciosa de DPOC",
    "internado há 12 horas"
   ],
   "B": [
    "DPOC GOLD 3",
    "usa broncodilatadores em casa",
    "alergia a dipirona (urticária)"
   ],
   "A": [
    "FC 104 e FR 26",
    "SatO2 89% em ar ambiente e 92% com Venturi 28%",
    "sibilos bilaterais e roncos",
    "tiragem intercostal leve"
   ],
   "R": [
    "alvo de SatO2 de 88 a 92%",
    "nebulização com broncodilatador às 22h",
    "vigiar o padrão ventilatório"
   ]
  }
 },
 {
  "id": "sepse_urinaria",
  "title": "Sepse de Foco Urinário & Hipotensão",
  "sector": "Emergência / Sala Amarela • Leito 15",
  "diagnosis": "Sepse de foco urinário (ITU complicada) e resposta inflamatória sistêmica",
  "vitals": {
   "pa_sistolica": 90,
   "pa_diastolica": 55,
   "fc": 112,
   "fr": 24,
   "sat": 94,
   "tax": 38.7
  },
  "goldenSbar": {
   "situation": "Paciente D.M.S., 71 anos, Leito 15 da Sala Amarela da Emergência, admitida há 2 horas com sepse grave de provável foco urinário.",
   "background": "Diabética e com histórico de ITU de repetição. Sem alergias medicamentosas registradas.",
   "assessment": "Hipotensa (PA 90/55 mmHg, PAM 66 mmHg), taquicárdica (FC 112 bpm), taquipneica (FR 24 irpm) e febril (Tax 38,7 °C). Diurese concentrada e fétida de 40 mL nas últimas 2 horas.",
   "recommendation": "Concluir a ressuscitação volêmica com Ringer Lactato a 30 mL/kg nas próximas 2 horas; administrar ceftriaxona IV prescrita imediatamente após colheita de culturas."
  },
  "educationalPointers": {
   "situation": "Enfatize a urgência da sepse nas primeiras horas do pacote de sobrevida.",
   "background": "Confirme a ausência de alergias a betalactâmicos.",
   "assessment": "Informe a PAM limítrofe (66 mmHg) e a oligúria crítica.",
   "recommendation": "Priorize o término rápido da hidratação venosa e início precoce do antibiótico."
  },
  "lacunas": [
   {
    "campo": "perfusao",
    "rotulo": "Perfusão periférica",
    "valorEsperado": "pele quente e ruborizada, enchimento capilar de 4 segundos"
   },
   {
    "campo": "diurese",
    "rotulo": "Diurese",
    "valorEsperado": "40 mL em 2 horas, concentrada e de odor fétido"
   },
   {
    "campo": "nivel_consciencia",
    "rotulo": "Nível de consciência",
    "valorEsperado": "sonolenta, desperta ao chamado, mas confusa"
   }
  ],
  "perguntas": [
   {
    "id": "plt.sepse_urinaria.s1",
    "letra": "S",
    "texto": "Quem é a paciente e por que ela está na emergência?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.sepse_urinaria.s2",
    "letra": "S",
    "texto": "Qual o leito e há quanto tempo ela chegou?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.sepse_urinaria.b1",
    "letra": "B",
    "texto": "Ela tem alergia ou alguma doença de base?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.sepse_urinaria.a1",
    "letra": "A",
    "texto": "Como estão os sinais vitais?",
    "espera": {
     "tipo": "numero",
     "campos": [
      "pa_sistolica",
      "pa_diastolica",
      "fc",
      "fr",
      "tax"
     ]
    }
   },
   {
    "id": "plt.sepse_urinaria.a2",
    "letra": "A",
    "texto": "Como está a perfusão? Pele e enchimento capilar?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "perfusao"
   },
   {
    "id": "plt.sepse_urinaria.a3",
    "letra": "A",
    "texto": "Como está a diurese?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "diurese"
   },
   {
    "id": "plt.sepse_urinaria.a4",
    "letra": "A",
    "texto": "E o nível de consciência dela?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "nivel_consciencia"
   },
   {
    "id": "plt.sepse_urinaria.r1",
    "letra": "R",
    "texto": "Quanto de volume ela precisa receber e em quanto tempo?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.sepse_urinaria.r2",
    "letra": "R",
    "texto": "O antibiótico pode ser dado já? O que vem antes?",
    "espera": {
     "tipo": "texto"
    }
   }
  ],
  "elementosChave": {
   "S": [
    "identificação (iniciais e idade)",
    "leito e setor",
    "sepse grave de foco urinário",
    "admitida há 2 horas"
   ],
   "B": [
    "diabética",
    "ITU de repetição",
    "sem alergias medicamentosas"
   ],
   "A": [
    "PA 90/55 (PAM 66) e FC 112",
    "FR 24 e temperatura de 38,7 °C",
    "diurese de 40 mL em 2 horas",
    "enchimento capilar de 4 segundos"
   ],
   "R": [
    "Ringer Lactato 30 mL/kg em 2 horas",
    "ceftriaxona IV após as culturas",
    "vigiar pressão e diurese"
   ]
  }
 },
 {
  "id": "avc_isquemico",
  "title": "AVC Isquêmico Pós-Trombólise",
  "sector": "UTI Neurológica • Leito 02",
  "diagnosis": "Acidente Vascular Cerebral Isquêmico submetido a trombólise com Alteplase há 4 horas",
  "vitals": {
   "pa_sistolica": 160,
   "pa_diastolica": 95,
   "fc": 82,
   "fr": 18,
   "sat": 97,
   "tax": 36.8
  },
  "goldenSbar": {
   "situation": "Paciente E.C.S., 63 anos, Leito 02 da UTI Neurológica, em vigilância de 24 horas pós-trombólise com rTPA por AVCI.",
   "background": "Hipertenso e tabagista. Sem alergias registradas.",
   "assessment": "PA controlada em 160/95 mmHg sob vigilância para manter < 180/105 mmHg. Glasgow 14, hemiparesia braquial direita em melhora (força 3/5). Ausência de cefaleia súbita, náuseas ou sinais hemorrágicos.",
   "recommendation": "Aferir PA e escore neurológico a cada 30 minutos; manter jejum absoluto e não realizar sondagem vesical ou punção arterial nas próximas 20 horas."
  },
  "educationalPointers": {
   "situation": "Destaque as horas decorridas desde o término do trombolítico.",
   "background": "Confirme a ausência de anticoagulantes prévios.",
   "assessment": "Alerte sobre a meta de PA < 180/105 mmHg para evitar sangramento cerebral.",
   "recommendation": "Proíba procedimentos invasivos nas primeiras 24 horas pós-rTPA."
  },
  "lacunas": [
   {
    "campo": "glasgow",
    "rotulo": "Nível de consciência",
    "valorEsperado": "Glasgow 14, desperta e colabora, com leve confusão"
   },
   {
    "campo": "forca_motora",
    "rotulo": "Força motora",
    "valorEsperado": "hemiparesia braquial direita em melhora (força 3/5)"
   },
   {
    "campo": "sangramento",
    "rotulo": "Sinais de sangramento",
    "valorEsperado": "sem sangramento gengival ou no sítio de punção, sem cefaleia súbita"
   }
  ],
  "perguntas": [
   {
    "id": "plt.avc_isquemico.s1",
    "letra": "S",
    "texto": "Quem é o paciente e por que ele está na UTI?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.avc_isquemico.s2",
    "letra": "S",
    "texto": "Que tratamento ele fez e há quanto tempo?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.avc_isquemico.b1",
    "letra": "B",
    "texto": "Quais as doenças de base e alergias dele?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.avc_isquemico.a1",
    "letra": "A",
    "texto": "Como estão os sinais vitais?",
    "espera": {
     "tipo": "numero",
     "campos": [
      "pa_sistolica",
      "pa_diastolica",
      "fc",
      "sat"
     ]
    }
   },
   {
    "id": "plt.avc_isquemico.a2",
    "letra": "A",
    "texto": "E o nível de consciência, como está?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "glasgow"
   },
   {
    "id": "plt.avc_isquemico.a3",
    "letra": "A",
    "texto": "E a força? Ele tem déficit?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "forca_motora"
   },
   {
    "id": "plt.avc_isquemico.a4",
    "letra": "A",
    "texto": "Teve sangramento ou dor de cabeça?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "sangramento"
   },
   {
    "id": "plt.avc_isquemico.r1",
    "letra": "R",
    "texto": "Qual o limite de pressão e de quanto em quanto tempo eu meço?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.avc_isquemico.r2",
    "letra": "R",
    "texto": "O que eu não posso fazer com ele nas próximas horas?",
    "espera": {
     "tipo": "texto"
    }
   }
  ],
  "elementosChave": {
   "S": [
    "identificação (iniciais e idade)",
    "leito e setor",
    "AVC isquêmico tratado com trombólise",
    "vigilância de 24 horas"
   ],
   "B": [
    "hipertenso",
    "tabagista",
    "sem alergias"
   ],
   "A": [
    "PA em 160/95 com alvo abaixo de 180/105",
    "Glasgow 14",
    "hemiparesia braquial direita com força 3/5",
    "sem sinais hemorrágicos"
   ],
   "R": [
    "PA e escore neurológico a cada 30 minutos",
    "jejum absoluto",
    "sem sondagem vesical nem punção arterial nas próximas 20 horas"
   ]
  }
 },
 {
  "id": "iam_st",
  "title": "Pós-Angioplastia Primária por IAM com Supra",
  "sector": "Unidade Coronariana • Leito 06",
  "diagnosis": "Infarto Agudo do Miocárdio de parede anterior submetido a angioplastia com stent farmacológico",
  "vitals": {
   "pa_sistolica": 125,
   "pa_diastolica": 80,
   "fc": 74,
   "fr": 16,
   "sat": 98,
   "tax": 36.5
  },
  "goldenSbar": {
   "situation": "Paciente F.G.A., 56 anos, Leito 06 da UCO, admitido há 1 hora pós-angioplastia com implante de 1 stent em artéria descendente anterior.",
   "background": "Dislipidêmico e hipertenso. Nega alergias.",
   "assessment": "Estável hemodinamicamente (PA 125/80 mmHg, FC 74 bpm sinusal). Sem queixa de dor torácica residual. Curativo femoral sem sangramento ou hematoma expansivo; pulso pedioso palpável e cheio à direita.",
   "recommendation": "Manter repouso absoluto com membro inferior estendido por mais 4 horas; vigiar sítio de punção femoral a cada 15 minutos na primeira hora; administrar Dupla Antiagregação (AAS + Clopidogrel) prescrita."
  },
  "educationalPointers": {
   "situation": "Informe a artéria tratada e tempo de retorno da hemodinâmica.",
   "background": "Confirme adesão à terapia antiplaquetária dupla.",
   "assessment": "Verifique pulso pedioso ipsilateral e ausência de hematoma.",
   "recommendation": "Reforce o repouso do membro puncionado para evitar pseudoaneurisma."
  },
  "lacunas": [
   {
    "campo": "sitio_puncao",
    "rotulo": "Sítio de punção femoral",
    "valorEsperado": "curativo compressivo seco, sem sangramento nem hematoma expansivo"
   },
   {
    "campo": "pulso_pedioso",
    "rotulo": "Pulso pedioso direito",
    "valorEsperado": "pulso pedioso direito palpável e cheio, pé aquecido"
   },
   {
    "campo": "dor_toracica",
    "rotulo": "Dor torácica",
    "valorEsperado": "sem dor torácica, ritmo sinusal no monitor"
   }
  ],
  "perguntas": [
   {
    "id": "plt.iam_st.s1",
    "letra": "S",
    "texto": "Quem é o paciente e o que ele fez?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.iam_st.s2",
    "letra": "S",
    "texto": "Qual o leito e há quanto tempo ele chegou da hemodinâmica?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.iam_st.b1",
    "letra": "B",
    "texto": "Ele tem alergia ou doença de base?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.iam_st.a1",
    "letra": "A",
    "texto": "Como estão os sinais vitais?",
    "espera": {
     "tipo": "numero",
     "campos": [
      "pa_sistolica",
      "pa_diastolica",
      "fc",
      "sat"
     ]
    }
   },
   {
    "id": "plt.iam_st.a2",
    "letra": "A",
    "texto": "Ele tem dor no peito? E o ritmo no monitor?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "dor_toracica"
   },
   {
    "id": "plt.iam_st.a3",
    "letra": "A",
    "texto": "Como está o local da punção na virilha?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "sitio_puncao"
   },
   {
    "id": "plt.iam_st.a4",
    "letra": "A",
    "texto": "E o pulso do pé direito, está presente?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "pulso_pedioso"
   },
   {
    "id": "plt.iam_st.r1",
    "letra": "R",
    "texto": "Quanto tempo ele fica deitado e com a perna esticada?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.iam_st.r2",
    "letra": "R",
    "texto": "Que medicação eu dou e de quanto em quanto tempo olho a punção?",
    "espera": {
     "tipo": "texto"
    }
   }
  ],
  "elementosChave": {
   "S": [
    "identificação (iniciais e idade)",
    "leito e setor",
    "pós-angioplastia primária com 1 stent",
    "stent em artéria descendente anterior"
   ],
   "B": [
    "dislipidêmico",
    "hipertenso",
    "sem alergias"
   ],
   "A": [
    "PA 125/80 e FC 74 sinusal",
    "sem dor torácica",
    "curativo femoral sem sangramento",
    "pulso pedioso direito cheio"
   ],
   "R": [
    "repouso absoluto por mais 4 horas",
    "punção a cada 15 minutos na 1ª hora",
    "AAS e clopidogrel prescritos"
   ]
  }
 },
 {
  "id": "trauma_cranio",
  "title": "Traumatismo Cranioencefálico Moderado",
  "sector": "Observação do Trauma • Leito 03",
  "diagnosis": "TCE moderado com contusão hemorrágica temporal direita após queda de bicicleta",
  "vitals": {
   "pa_sistolica": 135,
   "pa_diastolica": 80,
   "fc": 68,
   "fr": 16,
   "sat": 97,
   "tax": 36.9
  },
  "goldenSbar": {
   "situation": "Paciente L.H.R., 29 anos, Leito 03 do Trauma, internado há 5 horas por TCE moderado com TC mostrando contusão temporal direita sem desvio de linha média.",
   "background": "Hígido, sem doenças crônicas ou medicações em uso. Nega alergias.",
   "assessment": "Glasgow 13 (AO: 3, RV: 4, RM: 6), pupilas isocóricas e fotorreagentes (3 mm). Cefaleia moderada controlada com dipirona. Não apresentou vômitos nas últimas 3 horas.",
   "recommendation": "Monitorar escala de coma de Glasgow e tamanho pupilar de hora em hora; comunicar imediatamente ao neurocirurgião de plantão se queda de 2 pontos no Glasgow ou anisocoria; manter cabeceira elevada a 30° centrada."
  },
  "educationalPointers": {
   "situation": "Cite o achado da tomografia computadorizada e o mecanismo do trauma.",
   "background": "Verifique ausência de anticoagulantes prévios.",
   "assessment": "Fale o valor de Glasgow e diâmetro pupilar.",
   "recommendation": "Defina o gatilho exato de acionamento do neurocirurgião (queda ≥ 2 pts ou anisocoria)."
  },
  "lacunas": [
   {
    "campo": "glasgow",
    "rotulo": "Escala de Glasgow",
    "valorEsperado": "Glasgow 13 (AO 3, RV 4, RM 6)"
   },
   {
    "campo": "pupilas",
    "rotulo": "Pupilas",
    "valorEsperado": "isocóricas e fotorreagentes, 3 mm"
   },
   {
    "campo": "cefaleia_vomito",
    "rotulo": "Cefaleia e vômitos",
    "valorEsperado": "cefaleia moderada controlada com dipirona, sem vômitos há 3 horas"
   }
  ],
  "perguntas": [
   {
    "id": "plt.trauma_cranio.s1",
    "letra": "S",
    "texto": "Quem é o paciente e o que aconteceu?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.trauma_cranio.s2",
    "letra": "S",
    "texto": "Qual o leito e o que a tomografia mostrou?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.trauma_cranio.b1",
    "letra": "B",
    "texto": "Ele tem alergia, doença de base ou usa algum remédio?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.trauma_cranio.a1",
    "letra": "A",
    "texto": "Como estão os sinais vitais?",
    "espera": {
     "tipo": "numero",
     "campos": [
      "pa_sistolica",
      "pa_diastolica",
      "fc",
      "sat"
     ]
    }
   },
   {
    "id": "plt.trauma_cranio.a2",
    "letra": "A",
    "texto": "Quanto está o Glasgow dele?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "glasgow"
   },
   {
    "id": "plt.trauma_cranio.a3",
    "letra": "A",
    "texto": "Como estão as pupilas?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "pupilas"
   },
   {
    "id": "plt.trauma_cranio.a4",
    "letra": "A",
    "texto": "Ele tem dor de cabeça ou vomitou?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "cefaleia_vomito"
   },
   {
    "id": "plt.trauma_cranio.r1",
    "letra": "R",
    "texto": "De quanto em quanto tempo eu avalio o Glasgow e as pupilas?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.trauma_cranio.r2",
    "letra": "R",
    "texto": "Quando devo chamar o neurocirurgião?",
    "espera": {
     "tipo": "texto"
    }
   }
  ],
  "elementosChave": {
   "S": [
    "identificação (iniciais e idade)",
    "leito e setor",
    "TCE moderado há 5 horas",
    "contusão temporal direita sem desvio"
   ],
   "B": [
    "hígido, sem doenças crônicas",
    "sem medicações em uso",
    "sem alergias"
   ],
   "A": [
    "PA 135/80, FC 68 e saturação 97%",
    "Glasgow 13 (AO 3, RV 4, RM 6)",
    "pupilas isocóricas de 3 mm",
    "sem vômitos há 3 horas"
   ],
   "R": [
    "Glasgow e pupilas de hora em hora",
    "avisar se queda de 2 pontos ou anisocoria",
    "cabeceira a 30 graus e cabeça centrada"
   ]
  }
 },
 {
  "id": "cetoacidose_pediatrica",
  "title": "Cetoacidose Diabética em Adolescente",
  "sector": "UTI Pediátrica • Leito 05",
  "diagnosis": "Cetoacidose Diabética descompensada por omissão de dose insulínica",
  "vitals": {
   "pa_sistolica": 105,
   "pa_diastolica": 65,
   "fc": 116,
   "fr": 28,
   "tax": 36.6,
   "sat": 99
  },
  "goldenSbar": {
   "situation": "Paciente K.O.N., 14 anos, no Leito 05 da UTI Pediátrica, admitida há 4 horas com cetoacidose diabética (glicemia inicial 490 mg/dL, pH 7,18, HCO3 11).",
   "background": "Diagnóstico de DM1 há 3 anos. Sem alergias.",
   "assessment": "Glicemia atual em queda gradual para 260 mg/dL (redução segura de 60 mg/dL/h). Potássio sérico atual de 4,2 mEq/L sob reposição com KCl na hidratação. Respiração de Kussmaul menos ruidosa, diurese preservada de 1,8 mL/kg/h.",
   "recommendation": "Adicionar glicose 5% ao soro de manutenção quando a glicemia atingir 250 mg/dL para prevenir hipoglicemia e edema cerebral; realizar HGT horário e gasometria venosa às 22h."
  },
  "educationalPointers": {
   "situation": "Relate o pH inicial e a gravidade da acidose.",
   "background": "Identifique o motivo da descompensação.",
   "assessment": "Informe a velocidade de queda da glicemia (ideal 50-70 mg/dL/h) e o potássio.",
   "recommendation": "Prescreva a adição de glicose para evitar queda abrupta da osmolaridade plasmática."
  },
  "lacunas": [
   {
    "campo": "freq_resp",
    "rotulo": "Frequência respiratória",
    "valorEsperado": "28 irpm"
   },
   {
    "campo": "glicemia",
    "rotulo": "Glicemia capilar",
    "valorEsperado": "260 mg/dL, em queda gradual de 60 mg/dL por hora"
   },
   {
    "campo": "potassio",
    "rotulo": "Potássio sérico",
    "valorEsperado": "potássio de 4,2 mEq/L, em reposição com KCl"
   }
  ],
  "perguntas": [
   {
    "id": "plt.cetoacidose_pediatrica.s1",
    "letra": "S",
    "texto": "Quem é a paciente e por que ela está na UTI?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.cetoacidose_pediatrica.s2",
    "letra": "S",
    "texto": "Qual era a glicemia e a gasometria quando chegou?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.cetoacidose_pediatrica.b1",
    "letra": "B",
    "texto": "Ela tem alergia ou doença de base?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.cetoacidose_pediatrica.a1",
    "letra": "A",
    "texto": "Como estão os sinais vitais?",
    "espera": {
     "tipo": "numero",
     "campos": [
      "pa_sistolica",
      "pa_diastolica",
      "fc",
      "fr",
      "sat"
     ]
    }
   },
   {
    "id": "plt.cetoacidose_pediatrica.a2",
    "letra": "A",
    "texto": "Como está a respiração dela? Pode contar a frequência?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "freq_resp"
   },
   {
    "id": "plt.cetoacidose_pediatrica.a3",
    "letra": "A",
    "texto": "Como está a glicemia agora?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "glicemia"
   },
   {
    "id": "plt.cetoacidose_pediatrica.a4",
    "letra": "A",
    "texto": "E o potássio, como está?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "potassio"
   },
   {
    "id": "plt.cetoacidose_pediatrica.r1",
    "letra": "R",
    "texto": "Quando eu coloco glicose no soro?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.cetoacidose_pediatrica.r2",
    "letra": "R",
    "texto": "Que exames e controles eu faço neste plantão?",
    "espera": {
     "tipo": "texto"
    }
   }
  ],
  "elementosChave": {
   "S": [
    "identificação (iniciais e idade)",
    "leito e setor",
    "cetoacidose diabética há 4 horas",
    "glicemia inicial 490 e pH 7,18"
   ],
   "B": [
    "diabetes tipo 1",
    "diagnóstico há 3 anos",
    "sem alergias"
   ],
   "A": [
    "FC 116 e FR 28",
    "glicemia de 260 mg/dL (queda de 60/h)",
    "potássio de 4,2 mEq/L",
    "diurese de 1,8 mL/kg/h"
   ],
   "R": [
    "glicose 5% quando glicemia chegar a 250",
    "HGT de hora em hora",
    "gasometria venosa às 22h"
   ]
  }
 },
 {
  "id": "pre_eclampsia_grave",
  "title": "Pré-Eclâmpsia Grave & Sulfato de Magnésio",
  "sector": "Maternidade de Alto Risco • Leito 08",
  "diagnosis": "Pré-Eclâmpsia Grave com 35 semanas de gestação em infusão de Sulfato de Magnésio",
  "vitals": {
   "pa_sistolica": 155,
   "pa_diastolica": 98,
   "fc": 86,
   "fr": 16,
   "sat": 98,
   "tax": 36.7
  },
  "goldenSbar": {
   "situation": "Paciente V.S.P., 31 anos, primigesta de 35 semanas, Leito 08 da Maternidade de Alto Risco, recebendo infusão de manutenção de Sulfato de Magnésio a 1 g/h há 6 horas.",
   "background": "Sem antecedentes de hipertensão prévia. Nega alergias conhecidas.",
   "assessment": "PA controlada após Hidralazina (atual 155/98 mmHg). Reflexos patelares presentes e simétricos (+2/+4), FR estável em 16 irpm. Diurese por sonda vesical de demora clara com 90 mL nas últimas 2 horas. BCF feto 144 bpm com boa variabilidade.",
   "recommendation": "Testar reflexo patelar e FR a cada hora rigorosamente; comunicar se FR < 12 ou diurese < 25 mL/h; manter Gluconato de Cálcio a 10% preparado e identificado à beira-leito."
  },
  "educationalPointers": {
   "situation": "Cite a idade gestacional e o esquema de magnésio em curso.",
   "background": "Confirme ausência de hipertensão crônica.",
   "assessment": "Comprove a presença do reflexo patelar e a diurese horária.",
   "recommendation": "Exija a presença do antídoto (Gluconato de Cálcio) à cabeceira."
  },
  "lacunas": [
   {
    "campo": "reflexo_patelar",
    "rotulo": "Reflexo patelar",
    "valorEsperado": "reflexos patelares presentes e simétricos (+2/+4)"
   },
   {
    "campo": "diurese",
    "rotulo": "Diurese",
    "valorEsperado": "diurese clara por sonda, 90 mL nas últimas 2 horas"
   },
   {
    "campo": "bcf",
    "rotulo": "Batimentos do bebê",
    "valorEsperado": "BCF de 144 bpm com boa variabilidade"
   }
  ],
  "perguntas": [
   {
    "id": "plt.pre_eclampsia_grave.s1",
    "letra": "S",
    "texto": "Quem é a paciente e por que ela está aqui?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.pre_eclampsia_grave.s2",
    "letra": "S",
    "texto": "Que medicação ela está recebendo e há quanto tempo?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.pre_eclampsia_grave.b1",
    "letra": "B",
    "texto": "Ela tem alergia ou pressão alta de antes?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.pre_eclampsia_grave.a1",
    "letra": "A",
    "texto": "Como estão os sinais vitais?",
    "espera": {
     "tipo": "numero",
     "campos": [
      "pa_sistolica",
      "pa_diastolica",
      "fc",
      "fr"
     ]
    }
   },
   {
    "id": "plt.pre_eclampsia_grave.a2",
    "letra": "A",
    "texto": "E os reflexos, como estão?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "reflexo_patelar"
   },
   {
    "id": "plt.pre_eclampsia_grave.a3",
    "letra": "A",
    "texto": "Como está a diurese?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "diurese"
   },
   {
    "id": "plt.pre_eclampsia_grave.a4",
    "letra": "A",
    "texto": "E o bebê? Como estão os batimentos?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "bcf"
   },
   {
    "id": "plt.pre_eclampsia_grave.r1",
    "letra": "R",
    "texto": "O que eu monitoro e quando aviso o médico?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.pre_eclampsia_grave.r2",
    "letra": "R",
    "texto": "Tem algum antídoto que eu deva deixar pronto?",
    "espera": {
     "tipo": "texto"
    }
   }
  ],
  "elementosChave": {
   "S": [
    "identificação (iniciais e idade)",
    "leito e setor",
    "pré-eclâmpsia grave com 35 semanas",
    "sulfato de magnésio a 1 g/h há 6 horas"
   ],
   "B": [
    "primigesta",
    "sem hipertensão prévia",
    "sem alergias"
   ],
   "A": [
    "PA após hidralazina",
    "reflexos patelares presentes",
    "diurese de 90 mL em 2 horas",
    "BCF de 144 bpm"
   ],
   "R": [
    "reflexo patelar e FR a cada hora",
    "avisar se FR abaixo de 12 ou diurese abaixo de 25 mL/h",
    "gluconato de cálcio 10% preparado e identificado"
   ]
  }
 },
 {
  "id": "pancreatite_aguda",
  "title": "Pancreatite Aguda Biliar em UTI",
  "sector": "UTI Geral • Leito 11",
  "diagnosis": "Pancreatite Aguda Necrosante com SIRS",
  "vitals": {
   "pa_sistolica": 105,
   "pa_diastolica": 68,
   "fc": 110,
   "fr": 22,
   "tax": 38.1,
   "sat": 94
  },
  "goldenSbar": {
   "situation": "Paciente H.L.C., 49 anos, Leito 11 da UTI Geral, com diagnóstico de pancreatite aguda biliar com escore de Ranson 3 pontos.",
   "background": "Colelitíase diagnosticada há 1 ano sem cirurgia prévia. Nega etilismo e alergias.",
   "assessment": "Dor abdominal em barra difusa no andar superior (EVA 6/10 sob bomba de analgesia com opioide). Sonda nasogástrica com débito bilioso de 350 mL em 12h. Abdome tenso e distendido, ruídos hidroaéreos diminuídos. Diurese nas últimas 6h totalizou 320 mL.",
   "recommendation": "Manter ressuscitação volêmica guiada por débito urinário (> 0,5 mL/kg/h); dosar amilase, lipase e cálcio sérico no mapa da manhã; checar analgesia de resgate se dor EVA > 4."
  },
  "educationalPointers": {
   "situation": "Informe o escore de gravidade (Ranson) e o foco biliar.",
   "background": "Descarte etilismo como etiologia.",
   "assessment": "Informe o débito da sonda nasogástrica e o balanço hídrico.",
   "recommendation": "Priorize metas de ressuscitação volêmica sem sobrecarga pulmonar."
  },
  "lacunas": [
   {
    "campo": "abdome",
    "rotulo": "Abdome",
    "valorEsperado": "tenso e distendido, com ruídos hidroaéreos diminuídos"
   },
   {
    "campo": "sng",
    "rotulo": "Sonda nasogástrica",
    "valorEsperado": "SNG aberta, débito bilioso de 350 mL em 12 horas"
   },
   {
    "campo": "diurese",
    "rotulo": "Diurese",
    "valorEsperado": "320 mL nas últimas 6 horas, em torno de 53 mL/h"
   }
  ],
  "perguntas": [
   {
    "id": "plt.pancreatite_aguda.s1",
    "letra": "S",
    "texto": "Quem é o paciente e por que ele está na UTI?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.pancreatite_aguda.s2",
    "letra": "S",
    "texto": "Qual o leito e em que dia da pancreatite ele está?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.pancreatite_aguda.b1",
    "letra": "B",
    "texto": "Ele tem alergia, bebe ou tem doença de base?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.pancreatite_aguda.a1",
    "letra": "A",
    "texto": "Como estão os sinais vitais?",
    "espera": {
     "tipo": "numero",
     "campos": [
      "pa_sistolica",
      "pa_diastolica",
      "fc",
      "fr",
      "tax"
     ]
    }
   },
   {
    "id": "plt.pancreatite_aguda.a2",
    "letra": "A",
    "texto": "Como está a dor? E o abdome?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "abdome"
   },
   {
    "id": "plt.pancreatite_aguda.a3",
    "letra": "A",
    "texto": "Quanto saiu pela sonda nasogástrica?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "sng"
   },
   {
    "id": "plt.pancreatite_aguda.a4",
    "letra": "A",
    "texto": "Quanto ele urinou nas últimas horas?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "diurese"
   },
   {
    "id": "plt.pancreatite_aguda.r1",
    "letra": "R",
    "texto": "Quais exames eu colho amanhã cedo?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.pancreatite_aguda.r2",
    "letra": "R",
    "texto": "Quando eu faço analgesia de resgate?",
    "espera": {
     "tipo": "texto"
    }
   }
  ],
  "elementosChave": {
   "S": [
    "identificação (iniciais e idade)",
    "leito e setor",
    "pancreatite aguda biliar",
    "Ranson de 3 pontos"
   ],
   "B": [
    "colelitíase sem cirurgia",
    "nega etilismo",
    "sem alergias"
   ],
   "A": [
    "PA 105/68 e FC 110",
    "temperatura de 38,1 °C",
    "dor EVA 6/10 e abdome tenso",
    "SNG com 350 mL e diurese de 320 mL em 6 horas"
   ],
   "R": [
    "volume guiado por diurese acima de 0,5 mL/kg/h",
    "amilase, lipase e cálcio pela manhã",
    "resgate se dor acima de 4"
   ]
  }
 },
 {
  "id": "choque_anafilatico",
  "title": "Pós-Choque Anafilático em Sala de Emergência",
  "sector": "Sala Vermelha / Emergência • Leito 01",
  "diagnosis": "Choque anafilático grave após infusão de Ceftriaxona, revertido com Adrenalina IM",
  "vitals": {
   "pa_sistolica": 118,
   "pa_diastolica": 74,
   "fc": 94,
   "fr": 18,
   "sat": 98,
   "tax": 36.7
  },
  "goldenSbar": {
   "situation": "Paciente E.S.K., 38 anos, Leito 01 da Sala Vermelha, internada para pielonefrite, apresentou choque anafilático agudo há 90 minutos após primeira dose de ceftriaxona.",
   "background": "Desconhecia alergias prévias. Agora alérgica confirmada a cefalosporinas e penicilinas.",
   "assessment": "Hemodinamicamente estabilizada após Adrenalina IM, Hidrocortisona e Difenidramina. PA 118/74 mmHg, estridor laríngeo desapareceu, murmúrio vesicular livre sem sibilos. Lesões de urticária em regressão.",
   "recommendation": "Manter observação rigorosa por no mínimo 12 horas pelo risco de anafilaxia bifásica; colocar pulseira vermelha de alergia e registrar no prontuário; suspender qualquer beta-lactâmico."
  },
  "educationalPointers": {
   "situation": "Relate a gravidade do evento e a reversão imediata pela adrenalina.",
   "background": "Garanta que a nova alergia seja registrada em prontuário e pulseira.",
   "assessment": "Fale sobre a ausência de estridor e estabilidade pressórica.",
   "recommendation": "Enfatize o risco de anafilaxia bifásica nas próximas 6 a 12 horas."
  },
  "lacunas": [
   {
    "campo": "via_aerea",
    "rotulo": "Via aérea e ausculta",
    "valorEsperado": "sem estridor, murmúrio vesicular livre e sem sibilos"
   },
   {
    "campo": "pele",
    "rotulo": "Pele",
    "valorEsperado": "lesões de urticária em regressão"
   },
   {
    "campo": "alergia_registro",
    "rotulo": "Registro de alergia",
    "valorEsperado": "pulseira vermelha colocada e alergia a beta-lactâmicos no prontuário"
   }
  ],
  "perguntas": [
   {
    "id": "plt.choque_anafilatico.s1",
    "letra": "S",
    "texto": "Quem é a paciente e o que aconteceu com ela?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.choque_anafilatico.s2",
    "letra": "S",
    "texto": "Qual o leito e há quanto tempo foi o episódio?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.choque_anafilatico.b1",
    "letra": "B",
    "texto": "Ela já sabia de alguma alergia?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.choque_anafilatico.a1",
    "letra": "A",
    "texto": "Como estão os sinais vitais?",
    "espera": {
     "tipo": "numero",
     "campos": [
      "pa_sistolica",
      "pa_diastolica",
      "fc",
      "sat"
     ]
    }
   },
   {
    "id": "plt.choque_anafilatico.a2",
    "letra": "A",
    "texto": "Como está a respiração? Ainda tem estridor?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "via_aerea"
   },
   {
    "id": "plt.choque_anafilatico.a3",
    "letra": "A",
    "texto": "E a pele, como estão as lesões?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "pele"
   },
   {
    "id": "plt.choque_anafilatico.a4",
    "letra": "A",
    "texto": "O que foi dado de medicação no atendimento?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.choque_anafilatico.r1",
    "letra": "R",
    "texto": "Quanto tempo ela fica em observação e por quê?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.choque_anafilatico.r2",
    "letra": "R",
    "texto": "Já identificamos a alergia dela? O que não pode ser usado?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "alergia_registro"
   }
  ],
  "elementosChave": {
   "S": [
    "identificação (iniciais e idade)",
    "leito e setor",
    "choque anafilático há 90 minutos",
    "após 1ª dose de ceftriaxona"
   ],
   "B": [
    "internada por pielonefrite",
    "sem alergia conhecida antes",
    "agora alérgica a cefalosporinas e penicilinas"
   ],
   "A": [
    "PA 118/74 e saturação 98%",
    "adrenalina IM, hidrocortisona e difenidramina",
    "estridor resolvido, sem sibilos",
    "urticária em regressão"
   ],
   "R": [
    "observação por no mínimo 12 horas",
    "risco de anafilaxia bifásica",
    "pulseira vermelha e registro",
    "suspender beta-lactâmicos"
   ]
  }
 },
 {
  "id": "queimado_agudo",
  "title": "Grande Queimado Térmico em Parkland",
  "sector": "Centro de Tratamento de Queimados • Leito 03",
  "diagnosis": "Queimadura térmica de 2º e 3º graus em 38% de superfície corporal",
  "vitals": {
   "pa_sistolica": 108,
   "pa_diastolica": 68,
   "fc": 114,
   "fr": 20,
   "tax": 36.2,
   "sat": 96
  },
  "goldenSbar": {
   "situation": "Paciente F.R.S., 32 anos, Leito 03 do CTQ, nas primeiras 6 horas de tratamento de queimaduras em 38% SCQ por chama direta.",
   "background": "Sem doenças prévias, peso 70 kg. Nega alergias.",
   "assessment": "Volume previsto de Parkland: 10.640 mL de Ringer Lactato em 24h, correndo primeira metade (5.320 mL) nas primeiras 8h. Débito urinário atual por cateter vesical em 55 mL/h (0,8 mL/kg/h, dentro da meta). Extremidades aquecidas.",
   "recommendation": "Ajustar vazão do Ringer Lactato de hora em hora guiado pela diurese (alvo 35 a 70 mL/h); manter cabeceira elevada a 30° e vigiar edema de face e vias aéreas; administrar analgesia com opioide antes de qualquer manipulação de curativo."
  },
  "educationalPointers": {
   "situation": "Informe a porcentagem exata de SCQ e o agente causal.",
   "background": "Confirme o peso do paciente para a fórmula de Parkland.",
   "assessment": "Diga a diurese horária em mL/kg/h (marcador número 1 de perfusão no queimado).",
   "recommendation": "Planeje analgesia prévia às trocas de curativo."
  },
  "lacunas": [
   {
    "campo": "diurese_horaria",
    "rotulo": "Diurese horária",
    "valorEsperado": "55 mL/h pela sonda vesical (0,8 mL/kg/h), na meta"
   },
   {
    "campo": "extremidades",
    "rotulo": "Extremidades",
    "valorEsperado": "extremidades aquecidas, com enchimento capilar normal"
   },
   {
    "campo": "face_via_aerea",
    "rotulo": "Face e via aérea",
    "valorEsperado": "edema de face discreto, sem rouquidão nem estridor"
   }
  ],
  "perguntas": [
   {
    "id": "plt.queimado_agudo.s1",
    "letra": "S",
    "texto": "Quem é o paciente e o que aconteceu?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.queimado_agudo.s2",
    "letra": "S",
    "texto": "Qual o leito e quanto da pele foi queimada?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.queimado_agudo.b1",
    "letra": "B",
    "texto": "Qual o peso, e ele tem alergia ou doença de base?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.queimado_agudo.a1",
    "letra": "A",
    "texto": "Como estão os sinais vitais?",
    "espera": {
     "tipo": "numero",
     "campos": [
      "pa_sistolica",
      "pa_diastolica",
      "fc",
      "sat"
     ]
    }
   },
   {
    "id": "plt.queimado_agudo.a2",
    "letra": "A",
    "texto": "Quanto ele está urinando por hora?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "diurese_horaria"
   },
   {
    "id": "plt.queimado_agudo.a3",
    "letra": "A",
    "texto": "Como estão as extremidades?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "extremidades"
   },
   {
    "id": "plt.queimado_agudo.a4",
    "letra": "A",
    "texto": "E o rosto e a respiração, como estão?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "face_via_aerea"
   },
   {
    "id": "plt.queimado_agudo.r1",
    "letra": "R",
    "texto": "Quanto de Ringer ele recebe e como eu ajusto a vazão?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.queimado_agudo.r2",
    "letra": "R",
    "texto": "O que eu faço antes do curativo?",
    "espera": {
     "tipo": "texto"
    }
   }
  ],
  "elementosChave": {
   "S": [
    "identificação (iniciais e idade)",
    "leito e setor",
    "queimadura por chama em 38% da SCQ",
    "primeiras 6 horas de tratamento"
   ],
   "B": [
    "hígido, sem doenças prévias",
    "peso de 70 kg",
    "sem alergias"
   ],
   "A": [
    "PA 108/68 e FC 114",
    "Parkland de 10.640 mL em 24 horas",
    "diurese de 55 mL/h (0,8 mL/kg/h)",
    "extremidades aquecidas"
   ],
   "R": [
    "ajustar o Ringer de hora em hora pela diurese",
    "alvo de diurese de 35 a 70 mL/h",
    "cabeceira a 30 graus e vigiar face",
    "opioide antes do curativo"
   ]
  }
 },
 {
  "id": "politrauma_bacia",
  "title": "Politrauma com Fratura Instável de Pelve",
  "sector": "UTI do Trauma • Leito 08",
  "diagnosis": "Politraumatizado por atropelamento com fratura de bacia em livro aberto contida com lençol",
  "vitals": {
   "pa_sistolica": 102,
   "pa_diastolica": 64,
   "fc": 118,
   "fr": 22,
   "sat": 95,
   "tax": 35.7
  },
  "goldenSbar": {
   "situation": "Paciente G.P.V., 24 anos, Leito 08 da UTI do Trauma, admitido há 3 horas com fratura instável de pelve e choque hemorrágico controlado.",
   "background": "Jovem hígido, atleta, sem histórico clínico prévio.",
   "assessment": "PA 102/64 mmHg sob infusão de cristaloide aquecido e ácido tranexâmico. Contenção pélvica ajustada no nível dos grandes trocânteres. Hematócrito de controle 28%. Extremidades com pulsos femorais e distais palpáveis e simétricos.",
   "recommendation": "Proibido desatar ou manipular a contenção pélvica sem equipe de ortopedia; aquecer ativamente o paciente para manter temperatura > 36°C; controlar débito urinário rigorosamente e checar nova gasometria às 21h."
  },
  "educationalPointers": {
   "situation": "Descreva a fratura pélvica instável e a transfusão recente.",
   "background": "Confirme ausência de comorbidades prévias.",
   "assessment": "Verifique a posição correta da cinta pélvica e a temperatura corporal.",
   "recommendation": "Proíba explicitamente a mobilização da bacia para evitar novo sangramento retroperitoneal."
  },
  "lacunas": [
   {
    "campo": "contencao_pelvica",
    "rotulo": "Contenção pélvica",
    "valorEsperado": "contenção ao nível dos grandes trocânteres, íntegra e sem folga"
   },
   {
    "campo": "pulsos",
    "rotulo": "Pulsos femorais e distais",
    "valorEsperado": "pulsos femorais e distais palpáveis e simétricos"
   },
   {
    "campo": "hematocrito",
    "rotulo": "Hematócrito de controle",
    "valorEsperado": "hematócrito de 28%, após 2 concentrados de hemácias"
   }
  ],
  "perguntas": [
   {
    "id": "plt.politrauma_bacia.s1",
    "letra": "S",
    "texto": "Quem é o paciente e o que ele tem?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.politrauma_bacia.s2",
    "letra": "S",
    "texto": "Qual o leito e há quanto tempo ele chegou?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.politrauma_bacia.b1",
    "letra": "B",
    "texto": "Ele tem alergia ou doença de base?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.politrauma_bacia.a1",
    "letra": "A",
    "texto": "Como estão os sinais vitais?",
    "espera": {
     "tipo": "numero",
     "campos": [
      "pa_sistolica",
      "pa_diastolica",
      "fc",
      "tax"
     ]
    }
   },
   {
    "id": "plt.politrauma_bacia.a2",
    "letra": "A",
    "texto": "Como está a contenção da pelve?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "contencao_pelvica"
   },
   {
    "id": "plt.politrauma_bacia.a3",
    "letra": "A",
    "texto": "E os pulsos das pernas, como estão?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "pulsos"
   },
   {
    "id": "plt.politrauma_bacia.a4",
    "letra": "A",
    "texto": "Como está o hematócrito dele?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "hematocrito"
   },
   {
    "id": "plt.politrauma_bacia.r1",
    "letra": "R",
    "texto": "Posso mexer na contenção pélvica?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.politrauma_bacia.r2",
    "letra": "R",
    "texto": "O que eu controlo e que exame vem a seguir?",
    "espera": {
     "tipo": "texto"
    }
   }
  ],
  "elementosChave": {
   "S": [
    "identificação (iniciais e idade)",
    "leito e setor",
    "fratura instável de pelve",
    "choque hemorrágico controlado há 3 horas"
   ],
   "B": [
    "jovem hígido",
    "atleta",
    "sem histórico clínico prévio"
   ],
   "A": [
    "PA 102/64 e FC 118",
    "temperatura de 35,7 °C",
    "hematócrito de 28%",
    "pulsos femorais e distais simétricos"
   ],
   "R": [
    "não mexer na contenção sem a ortopedia",
    "aquecer para manter acima de 36 °C",
    "diurese rigorosa",
    "gasometria às 21h"
   ]
  }
 },
 {
  "id": "hemorragia_digestiva",
  "title": "Hemorragia Digestiva Alta Maciça",
  "sector": "Emergência Clínica • Leito 04",
  "diagnosis": "Hemorragia Digestiva Alta por Varizes Esofágicas em cirrótico",
  "vitals": {
   "pa_sistolica": 95,
   "pa_diastolica": 58,
   "fc": 106,
   "fr": 22,
   "sat": 94,
   "tax": 36.3
  },
  "goldenSbar": {
   "situation": "Paciente G.B.L., 52 anos, Leito 04 da Emergência Clínica, internado há 3 horas com HDA por ruptura de varizes de esôfago.",
   "background": "Cirrose hepática alcoólica Child-Pugh B, com sangramento prévio há 8 meses. Nega alergias.",
   "assessment": "Após infusão de 1500 mL de cristaloides e Terlipressina venosa, PA subiu de 78/42 para 95/58 mmHg. Sem novos episódios de hematêmese na última hora. Sonolento, mas orientado. Acesso venoso central em subclávia direita pérvio.",
   "recommendation": "Manter jejum absoluto e decúbito elevado a 30°; vigiar via aérea contra broncoaspiração de sangue; encaminhar imediatamente para Endoscopia Digestiva Alta assim que a equipe de sobreaviso chegar."
  },
  "educationalPointers": {
   "situation": "Destaque a etiologia por varizes e o tempo de admissão.",
   "background": "Informe a classificação Child-Pugh e episódios prévios.",
   "assessment": "Apresente a resposta hemodinâmica à terlipressina e ausência de ressangramento ativo.",
   "recommendation": "Prepare o encaminhamento seguro para a endoscopia de urgência."
  },
  "lacunas": [
   {
    "campo": "sangramento",
    "rotulo": "Sangramento",
    "valorEsperado": "sem nova hematêmese na última hora; melena presente"
   },
   {
    "campo": "nivel_consciencia",
    "rotulo": "Nível de consciência",
    "valorEsperado": "sonolento, mas orientado"
   },
   {
    "campo": "acesso_central",
    "rotulo": "Acesso venoso central",
    "valorEsperado": "cateter em subclávia direita pérvio, curativo íntegro"
   }
  ],
  "perguntas": [
   {
    "id": "plt.hemorragia_digestiva.s1",
    "letra": "S",
    "texto": "Quem é o paciente e por que ele está aqui?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.hemorragia_digestiva.s2",
    "letra": "S",
    "texto": "Qual o leito e há quanto tempo ele chegou?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.hemorragia_digestiva.b1",
    "letra": "B",
    "texto": "Ele tem alergia ou doença de base?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.hemorragia_digestiva.a1",
    "letra": "A",
    "texto": "Como estão os sinais vitais?",
    "espera": {
     "tipo": "numero",
     "campos": [
      "pa_sistolica",
      "pa_diastolica",
      "fc",
      "sat"
     ]
    }
   },
   {
    "id": "plt.hemorragia_digestiva.a2",
    "letra": "A",
    "texto": "Ele sangrou de novo? Como estão as fezes?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "sangramento"
   },
   {
    "id": "plt.hemorragia_digestiva.a3",
    "letra": "A",
    "texto": "Como está a consciência dele?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "nivel_consciencia"
   },
   {
    "id": "plt.hemorragia_digestiva.a4",
    "letra": "A",
    "texto": "O acesso central está funcionando?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "acesso_central"
   },
   {
    "id": "plt.hemorragia_digestiva.r1",
    "letra": "R",
    "texto": "Como eu posiciono e o que ele pode comer?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.hemorragia_digestiva.r2",
    "letra": "R",
    "texto": "Para onde ele vai e quando?",
    "espera": {
     "tipo": "texto"
    }
   }
  ],
  "elementosChave": {
   "S": [
    "identificação (iniciais e idade)",
    "leito e setor",
    "HDA por ruptura de varizes",
    "internado há 3 horas"
   ],
   "B": [
    "cirrose alcoólica Child-Pugh B",
    "sangramento prévio há 8 meses",
    "sem alergias"
   ],
   "A": [
    "PA de 78/42 para 95/58 após volume",
    "FC 106 e saturação 94%",
    "sem hematêmese na última hora",
    "cateter em subclávia direita pérvio"
   ],
   "R": [
    "jejum absoluto",
    "decúbito elevado a 30 graus",
    "vigiar a via aérea",
    "endoscopia assim que a equipe chegar"
   ]
  }
 },
 {
  "id": "tep_pos_op",
  "title": "Tromboembolismo Pulmonar no Pós-Operatório",
  "sector": "UTI Geral • Leito 14",
  "diagnosis": "Tromboembolismo Pulmonar agudo no 3º DPO de prótese total de joelho",
  "vitals": {
   "pa_sistolica": 112,
   "pa_diastolica": 70,
   "fc": 98,
   "fr": 20,
   "sat": 95,
   "tax": 36.6
  },
  "goldenSbar": {
   "situation": "Paciente P.T.C., 59 anos, Leito 14 da UTI Geral, transferido da enfermaria ortopédica há 2 horas por TEP submaciço.",
   "background": "Pós-operatório de artroplastia de joelho esquerdo. Sem alergias.",
   "assessment": "Infundindo Heparina Não Fracionada a 18 UI/kg/h em bomba de infusão. SatO2 95% sob máscara de Venturi a 35%. Panturrilha esquerda com edema e empastamento muscular. Sem hipotensão ou dor precordial aguda.",
   "recommendation": "Coletar TTPA de controle em 4 horas para ajuste do nomograma de heparina; manter repouso absoluto no leito; vigiar sinais de sangramento em curativo cirúrgico e gengivas."
  },
  "educationalPointers": {
   "situation": "Identifique a cirurgia prévia e a confirmação do TEP por angiotomografia.",
   "background": "Confirme ausência de úlcera péptica ativa ou contraindicação à heparina.",
   "assessment": "Informe a vazão da heparina em BIC e a estabilidade da SatO2.",
   "recommendation": "Apraze o horário exato da coleta do TTPA para titulação da anticoagulação."
  },
  "lacunas": [
   {
    "campo": "panturrilha",
    "rotulo": "Panturrilha esquerda",
    "valorEsperado": "edema e empastamento muscular na panturrilha esquerda"
   },
   {
    "campo": "oxigenacao",
    "rotulo": "Oxigenação",
    "valorEsperado": "SatO2 de 95% sob Venturi a 35%"
   },
   {
    "campo": "sangramento",
    "rotulo": "Sinais de sangramento",
    "valorEsperado": "curativo cirúrgico seco e gengivas sem sangramento"
   }
  ],
  "perguntas": [
   {
    "id": "plt.tep_pos_op.s1",
    "letra": "S",
    "texto": "Quem é o paciente e por que ele está na UTI?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.tep_pos_op.s2",
    "letra": "S",
    "texto": "Qual o leito e há quanto tempo ele chegou?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.tep_pos_op.b1",
    "letra": "B",
    "texto": "Qual foi a cirurgia dele? Tem alergia?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.tep_pos_op.a1",
    "letra": "A",
    "texto": "Como estão os sinais vitais?",
    "espera": {
     "tipo": "numero",
     "campos": [
      "pa_sistolica",
      "pa_diastolica",
      "fc",
      "sat"
     ]
    }
   },
   {
    "id": "plt.tep_pos_op.a2",
    "letra": "A",
    "texto": "Como está o oxigênio dele?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "oxigenacao"
   },
   {
    "id": "plt.tep_pos_op.a3",
    "letra": "A",
    "texto": "E as panturrilhas, como estão?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "panturrilha"
   },
   {
    "id": "plt.tep_pos_op.a4",
    "letra": "A",
    "texto": "Ele tem algum sangramento?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "sangramento"
   },
   {
    "id": "plt.tep_pos_op.r1",
    "letra": "R",
    "texto": "Qual a dose da heparina e quando colho o TTPA?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.tep_pos_op.r2",
    "letra": "R",
    "texto": "Ele pode sair do leito?",
    "espera": {
     "tipo": "texto"
    }
   }
  ],
  "elementosChave": {
   "S": [
    "identificação (iniciais e idade)",
    "leito e setor",
    "TEP submaciço confirmado por angiotomografia",
    "chegou há 2 horas"
   ],
   "B": [
    "artroplastia de joelho esquerdo",
    "pós-operatório recente",
    "sem alergias"
   ],
   "A": [
    "PA 112/70, FC 98 e FR 20",
    "SatO2 95% com Venturi a 35%",
    "panturrilha esquerda com edema",
    "heparina a 18 UI/kg/h"
   ],
   "R": [
    "TTPA de controle em 4 horas",
    "repouso absoluto no leito",
    "vigiar sangramento no curativo e gengivas"
   ]
  }
 },
 {
  "id": "falciforme_toracica",
  "title": "Síndrome Torácica Aguda em Anemia Falciforme",
  "sector": "Enfermaria de Hematologia • Leito 07",
  "diagnosis": "Doença Falciforme (HbSS) complicada com Síndrome Torácica Aguda",
  "vitals": {
   "pa_sistolica": 110,
   "pa_diastolica": 70,
   "fc": 104,
   "fr": 24,
   "sat": 91,
   "tax": 38.3
  },
  "goldenSbar": {
   "situation": "Paciente W.A.P., 20 anos, Leito 07 da Hematologia, em tratamento de Síndrome Torácica Aguda iniciada hoje.",
   "background": "Portador de anemia falciforme com histórico de crises vaso-oclusivas frequentes. Sem alergias.",
   "assessment": "Apresenta dor torácica ventilatório-dependente, SatO2 91% em ar ambiente que sobe para 95% com cateter a 2 L/min. RX de tórax mostra infiltrado alveolar novo em base esquerda. Dor óssea em fêmures controlada (EVA 3/10 sob morfina de horário).",
   "recommendation": "Iniciar antibiótico de amplo espectro prescrito (Ceftriaxona + Claritromicina); realizar espirometria de incentivo (Respiron) de hora em hora enquanto acordado; checar hemograma matutino para avaliação de transfusão simples."
  },
  "educationalPointers": {
   "situation": "Diferencie a dor puramente óssea da Síndrome Torácica Aguda.",
   "background": "Informe a adesão prévia à hidroxiureia.",
   "assessment": "Destaque a imagem do RX e a necessidade de oxigenoterapia contínua.",
   "recommendation": "Enfatize a fisioterapia respiratória de incentivo para evitar atelectasias."
  },
  "lacunas": [
   {
    "campo": "oxigenacao",
    "rotulo": "Oxigenação",
    "valorEsperado": "SatO2 de 91% em ar ambiente e 95% com cateter a 2 L/min"
   },
   {
    "campo": "dor",
    "rotulo": "Dor",
    "valorEsperado": "dor torácica ao respirar; dor nos fêmures EVA 3/10 com morfina"
   },
   {
    "campo": "radiografia",
    "rotulo": "Radiografia de tórax",
    "valorEsperado": "infiltrado alveolar novo na base esquerda"
   }
  ],
  "perguntas": [
   {
    "id": "plt.falciforme_toracica.s1",
    "letra": "S",
    "texto": "Quem é o paciente e o que aconteceu hoje?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.falciforme_toracica.s2",
    "letra": "S",
    "texto": "Qual o leito e há quanto tempo piorou?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.falciforme_toracica.b1",
    "letra": "B",
    "texto": "Ele tem alergia? Como são as crises dele?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.falciforme_toracica.a1",
    "letra": "A",
    "texto": "Como estão os sinais vitais?",
    "espera": {
     "tipo": "numero",
     "campos": [
      "fc",
      "fr",
      "sat",
      "tax"
     ]
    }
   },
   {
    "id": "plt.falciforme_toracica.a2",
    "letra": "A",
    "texto": "Como está o oxigênio dele?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "oxigenacao"
   },
   {
    "id": "plt.falciforme_toracica.a3",
    "letra": "A",
    "texto": "Como está a dor dele?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "dor"
   },
   {
    "id": "plt.falciforme_toracica.a4",
    "letra": "A",
    "texto": "O que mostrou o RX de tórax?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "radiografia"
   },
   {
    "id": "plt.falciforme_toracica.r1",
    "letra": "R",
    "texto": "Que antibióticos ele recebe?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.falciforme_toracica.r2",
    "letra": "R",
    "texto": "O que eu faço de hora em hora e que exame sai amanhã?",
    "espera": {
     "tipo": "texto"
    }
   }
  ],
  "elementosChave": {
   "S": [
    "identificação (iniciais e idade)",
    "leito e setor",
    "síndrome torácica aguda iniciada hoje",
    "evolução de crise álgica há 6 horas"
   ],
   "B": [
    "anemia falciforme",
    "crises vaso-oclusivas frequentes",
    "sem alergias"
   ],
   "A": [
    "FC 104, FR 24 e temperatura 38,3 °C",
    "SatO2 91% em ar e 95% com 2 L/min",
    "infiltrado em base esquerda",
    "dor em fêmures EVA 3/10"
   ],
   "R": [
    "ceftriaxona e claritromicina",
    "espirometria de incentivo de hora em hora",
    "hemograma pela manhã"
   ]
  }
 },
 {
  "id": "bronquiolite_lactente",
  "title": "Bronquiolite Viral Aguda & Desidratação",
  "sector": "Enfermaria Pediátrica • Leito 10",
  "diagnosis": "Bronquiolite Viral Aguda por VSR em lactente de 7 meses",
  "vitals": {
   "pa_sistolica": 88,
   "pa_diastolica": 52,
   "fc": 148,
   "fr": 54,
   "tax": 37.6,
   "sat": 92
  },
  "goldenSbar": {
   "situation": "Lactente B.M., 7 meses, no Leito 10 da Pediatria, internado há 18 horas por bronquiolite viral com esforço moderado.",
   "background": "Nascido a termo, sem histórico de asma na família. Nega alergias.",
   "assessment": "FR 54 irpm com tiragem intercostal e subcostal evidentes. SatO2 92% em ar ambiente mantida em 96% sob cateter de oxigênio a 1 L/min umidificado. Aceitou 60 mL de leite materno ordenhado na colher. Diurese com 4 fraldas pesadas nas últimas 12 horas.",
   "recommendation": "Realizar lavagem nasal com soro fisiológico 0,9% antes das mamadas; manter cabeceira elevada a 30° em decúbito dorsal; comunicar imediatamente se gemência contínua ou queda de SatO2 < 92%."
  },
  "educationalPointers": {
   "situation": "Informe a idade em meses e o tempo de sintomas respiratórios.",
   "background": "Verifique prematuridade ou cardiopatia congênita associada.",
   "assessment": "Descreva a frequência respiratória, os sinais de tiragem e o número de fraldas molhadas.",
   "recommendation": "Oriente a técnica de aspiração e higienização nasal com soro."
  },
  "lacunas": [
   {
    "campo": "tiragem",
    "rotulo": "Esforço respiratório",
    "valorEsperado": "tiragem intercostal e subcostal evidentes, sem gemência"
   },
   {
    "campo": "alimentacao_diurese",
    "rotulo": "Alimentação e diurese",
    "valorEsperado": "aceitou 60 mL de leite materno na colher; 4 fraldas pesadas em 12 horas"
   }
  ],
  "perguntas": [
   {
    "id": "plt.bronquiolite_lactente.s1",
    "letra": "S",
    "texto": "Quem é o bebê e por que ele está internado?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.bronquiolite_lactente.s2",
    "letra": "S",
    "texto": "Qual o leito e há quanto tempo ele está aqui?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.bronquiolite_lactente.b1",
    "letra": "B",
    "texto": "Ele tem alguma alergia? Nasceu a termo? Tem asma na família?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.bronquiolite_lactente.a1",
    "letra": "A",
    "texto": "Como estão os sinais vitais?",
    "espera": {
     "tipo": "numero",
     "campos": [
      "fc",
      "fr",
      "sat",
      "tax"
     ]
    }
   },
   {
    "id": "plt.bronquiolite_lactente.a2",
    "letra": "A",
    "texto": "E o esforço respiratório, como está?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "tiragem"
   },
   {
    "id": "plt.bronquiolite_lactente.a3",
    "letra": "A",
    "texto": "Ele está mamando? E as fraldas?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "alimentacao_diurese"
   },
   {
    "id": "plt.bronquiolite_lactente.a4",
    "letra": "A",
    "texto": "Ele está com oxigênio? Quanto?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.bronquiolite_lactente.r1",
    "letra": "R",
    "texto": "O que eu faço no meu plantão?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.bronquiolite_lactente.r2",
    "letra": "R",
    "texto": "Quando eu devo chamar o médico?",
    "espera": {
     "tipo": "texto"
    }
   }
  ],
  "elementosChave": {
   "S": [
    "identificação (iniciais e idade)",
    "leito e setor",
    "bronquiolite viral",
    "internado há 18 horas"
   ],
   "B": [
    "nascido a termo",
    "sem asma na família",
    "sem alergias"
   ],
   "A": [
    "FR, FC e saturação",
    "saturação de 92% para 96% com 1 L/min",
    "tiragem intercostal e subcostal",
    "dieta de 60 mL e 4 fraldas"
   ],
   "R": [
    "lavagem nasal antes das mamadas",
    "cabeceira a 30 graus",
    "avisar se gemência ou saturação abaixo de 92%"
   ]
  }
 },
 {
  "id": "paliativos_terminal",
  "title": "Paciente Oncológico em Cuidados de Conforto",
  "sector": "Unidade de Cuidados Paliativos • Quarto 05",
  "diagnosis": "Neoplasia de cólon metastática em fase de fim de vida (declínio funcional avançado)",
  "vitals": {
   "pa_sistolica": 80,
   "pa_diastolica": 45,
   "fc": 62,
   "fr": 12,
   "sat": 86,
   "tax": 35.5
  },
  "goldenSbar": {
   "situation": "Paciente C.M.R., 74 anos, Quarto 05 da Unidade de Cuidados Paliativos, em plano exclusivo de cuidados de conforto e controle de sintomas.",
   "background": "Câncer metastático refratário, com diretivas antecipadas de vontade assinadas pela paciente e família.",
   "assessment": "Hipodermóclise em deltoide esquerdo funcionando adequadamente, sem hiperemia local. Infusão contínua de Morfina 20 mg/24h e Hioscina 60 mg/24h. Paciente sem fácies de dor ou gemência; respiração com estertor leve em vias aéreas altas.",
   "recommendation": "Manter decúbito lateralizado com coxins e hidratação labial frequente; não realizar aspiração traqueal dolorosa desnecessária; acolher a filha presente e aprazar dose de resgate de morfina se taquipneia ou agitação."
  },
  "educationalPointers": {
   "situation": "Esclareça com serenidade o plano exclusivo de conforto e dignidade.",
   "background": "Confirme o alinhamento com as diretrizes da família.",
   "assessment": "Avalie escalas de dor comportamental no paciente não comunicativo.",
   "recommendation": "Priorize medidas não invasivas de carinho, hidratação labial e conforto."
  },
  "lacunas": [
   {
    "campo": "conforto",
    "rotulo": "Sinais de dor ou desconforto",
    "valorEsperado": "sem fácies de dor nem gemência, em repouso"
   },
   {
    "campo": "hipodermoclise",
    "rotulo": "Acesso subcutâneo",
    "valorEsperado": "hipodermóclise no deltoide esquerdo, funcionante, sem hiperemia"
   },
   {
    "campo": "respiracao",
    "rotulo": "Respiração",
    "valorEsperado": "estertor leve de vias aéreas altas, sem esforço respiratório"
   }
  ],
  "perguntas": [
   {
    "id": "plt.paliativos_terminal.s1",
    "letra": "S",
    "texto": "Quem é a paciente e qual o plano de cuidado?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.paliativos_terminal.s2",
    "letra": "S",
    "texto": "Qual o quarto e quem está com ela?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.paliativos_terminal.b1",
    "letra": "B",
    "texto": "Qual a doença dela e há diretivas de vontade?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.paliativos_terminal.a1",
    "letra": "A",
    "texto": "Como estão os sinais vitais?",
    "espera": {
     "tipo": "numero",
     "campos": [
      "pa_sistolica",
      "pa_diastolica",
      "fc",
      "fr",
      "sat"
     ]
    }
   },
   {
    "id": "plt.paliativos_terminal.a2",
    "letra": "A",
    "texto": "Ela parece sentir dor ou desconforto?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "conforto"
   },
   {
    "id": "plt.paliativos_terminal.a3",
    "letra": "A",
    "texto": "Como está o acesso da hipodermóclise?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "hipodermoclise"
   },
   {
    "id": "plt.paliativos_terminal.a4",
    "letra": "A",
    "texto": "Como está a respiração dela?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "respiracao"
   },
   {
    "id": "plt.paliativos_terminal.r1",
    "letra": "R",
    "texto": "Que cuidados eu mantenho no plantão?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.paliativos_terminal.r2",
    "letra": "R",
    "texto": "Quando eu dou a dose de resgate de morfina?",
    "espera": {
     "tipo": "texto"
    }
   }
  ],
  "elementosChave": {
   "S": [
    "identificação (iniciais e idade)",
    "quarto e setor",
    "plano exclusivo de conforto",
    "filha acompanhando"
   ],
   "B": [
    "câncer metastático refratário",
    "diretivas antecipadas assinadas",
    "assinadas pela paciente e família"
   ],
   "A": [
    "PA 80/45, FC 62 e FR 12",
    "hipodermóclise funcionando",
    "morfina 20 mg e hioscina 60 mg em 24 horas",
    "sem fácies de dor, estertor leve"
   ],
   "R": [
    "decúbito lateral com coxins",
    "hidratação labial frequente",
    "sem aspiração dolorosa",
    "resgate de morfina se taquipneia ou agitação"
   ]
  }
 },
 {
  "id": "crise_tireotoxica",
  "title": "Tempestade Tireoidiana em Sala Vermelha",
  "sector": "UTI / Emergência • Leito 05",
  "diagnosis": "Crise Tireotóxica (Tempestade Tireoidiana) descompensada por infecção",
  "vitals": {
   "pa_sistolica": 165,
   "pa_diastolica": 70,
   "fc": 158,
   "fr": 26,
   "tax": 39.8,
   "sat": 97
  },
  "goldenSbar": {
   "situation": "Paciente V.R.F., 35 anos, Leito 05 da UTI, internada há 4 horas com tempestade tireoidiana (escore de Burch-Wartofsky = 65 pontos).",
   "background": "Doença de Graves sem tratamento regular há 2 meses. Nega alergias.",
   "assessment": "Tax 39,8°C sob medidas de resfriamento físico e dipirona. FC 158 bpm com Propranolol venoso iniciado. Pele quente e sudoreica, tremores finos de extremidades. Sem sinais de edema pulmonar agudo.",
   "recommendation": "Administrar Propiltiouracil (PTU) por sonda nasogástrica conforme prescrito; administrar Solução de Lugol 1 hora após o PTU; proibir expressamente o uso de ácido acetilsalicílico (AAS); manter monitorização cardíaca contínua."
  },
  "educationalPointers": {
   "situation": "Cite a pontuação de Burch-Wartofsky confirmando a tempestade tireoidiana.",
   "background": "Alerte sobre a interrupção do antitireoidiano.",
   "assessment": "Informe a temperatura axilar e o controle do ritmo cardíaco.",
   "recommendation": "Enfatize o intervalo obrigatório de 1h entre PTU e Lugol e a contraindicação do AAS."
  },
  "lacunas": [
   {
    "campo": "temperatura_pele",
    "rotulo": "Temperatura e pele",
    "valorEsperado": "Tax 39,8 °C, pele quente e sudoreica"
   },
   {
    "campo": "ritmo_cardiaco",
    "rotulo": "Ritmo cardíaco",
    "valorEsperado": "taquicardia sinusal de 158 bpm no monitor"
   },
   {
    "campo": "neuro_pulmao",
    "rotulo": "Tremor e pulmão",
    "valorEsperado": "tremores finos de extremidades, sem sinais de edema pulmonar"
   }
  ],
  "perguntas": [
   {
    "id": "plt.crise_tireotoxica.s1",
    "letra": "S",
    "texto": "Quem é a paciente e por que ela está na UTI?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.crise_tireotoxica.s2",
    "letra": "S",
    "texto": "Qual o leito e quanto deu o escore de Burch-Wartofsky?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.crise_tireotoxica.b1",
    "letra": "B",
    "texto": "Qual a doença de base? Tem alergia?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.crise_tireotoxica.a1",
    "letra": "A",
    "texto": "Como estão os sinais vitais?",
    "espera": {
     "tipo": "numero",
     "campos": [
      "pa_sistolica",
      "fc",
      "fr",
      "tax"
     ]
    }
   },
   {
    "id": "plt.crise_tireotoxica.a2",
    "letra": "A",
    "texto": "Como está a temperatura e a pele?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "temperatura_pele"
   },
   {
    "id": "plt.crise_tireotoxica.a3",
    "letra": "A",
    "texto": "E o ritmo cardíaco no monitor?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "ritmo_cardiaco"
   },
   {
    "id": "plt.crise_tireotoxica.a4",
    "letra": "A",
    "texto": "Ela tem tremor? E o pulmão, como está?",
    "espera": {
     "tipo": "texto"
    },
    "dependeDe": "neuro_pulmao"
   },
   {
    "id": "plt.crise_tireotoxica.r1",
    "letra": "R",
    "texto": "Que medicações eu dou e em que ordem?",
    "espera": {
     "tipo": "texto"
    }
   },
   {
    "id": "plt.crise_tireotoxica.r2",
    "letra": "R",
    "texto": "Tem algum remédio que eu não posso dar a ela?",
    "espera": {
     "tipo": "texto"
    }
   }
  ],
  "elementosChave": {
   "S": [
    "identificação (iniciais e idade)",
    "leito e setor",
    "tempestade tireoidiana há 4 horas",
    "Burch-Wartofsky de 65 pontos"
   ],
   "B": [
    "doença de Graves",
    "sem tratamento regular há 2 meses",
    "sem alergias"
   ],
   "A": [
    "PA 165/70, FC 158 e FR 26",
    "Tax 39,8 °C com resfriamento",
    "propranolol venoso iniciado",
    "sem edema pulmonar"
   ],
   "R": [
    "PTU por sonda nasogástrica",
    "Lugol 1 hora após o PTU",
    "proibido AAS",
    "monitorização cardíaca contínua"
   ]
  }
 }
];

export function buscarCenarioPlantao(id) {
  return CENARIOS_PLANTAO.find((c) => c.id === id) ?? null;
}
