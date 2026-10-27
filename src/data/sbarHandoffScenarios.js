/**
 * sbarHandoffScenarios.js
 * Banco Canônico de 20 Cenários Completos de Passagem de Plantão SBAR.
 * Padrão Duolingo de Alta Densidade para Enfermagem Interprofissional.
 * Abrange diversas especialidades: Clínica Cirúrgica, UTI Adulto e Pediátrica,
 * Emergência, Obstetrícia, Nefrologia, Cuidados Paliativos, Toxicologia e Queimados.
 */

export const PRESET_HANDOFF_SCENARIOS = [
  {
    id: "pos_op",
    title: "1º DPO de Colectomia Parcial",
    sector: "Clínica Cirúrgica • Leito 12-A",
    bed: "Leito 12-A",
    age: 58,
    name: "M.S.L.",
    diagnosis: "Pós-operatório imediato de colectomia por diverticulite aguda",
    vitals: { pa_sistolica: 115, pa_diastolica: 72, fc: 84, fr: 17, sat: 98, tax: 36.6 },
    clinicalSummary: "Paciente lúcido no 1º DPO de colectomia parcial, queixando-se de dor moderada em incisão cirúrgica. Dreno tubular ativo em flanco direito com débito serossanguinolento.",
    goldenSbar: {
      situation: "Paciente M.S.L., 58 anos, no Leito 12-A da Clínica Cirúrgica, no 1º DPO de colectomia parcial por diverticulite.",
      background: "Hipertenso controlado com Losartana. Nega alergias medicamentosas e cirurgias abdominais prévias.",
      assessment: "PA 115/72 mmHg, FC 84 bpm, afebril, SatO2 98% em ar ambiente. Abdome flácido, doloroso à palpação na incisão (EVA 4/10). Dreno de Portovac com débito serossanguinolento de 120 mL em 12h. Curativo cirúrgico limpo e seco.",
      recommendation: "Vigiar aspecto e volume do dreno a cada 4 horas; administrar analgesia prescrita às 20h; checar resultado do hematócrito de controle colhido nesta tarde."
    },
    educationalPointers: {
      situation: "Diga quem é, o leito e o motivo cirúrgico em 15 segundos.",
      background: "Confirme categoricamente que o paciente NÃO tem alergias medicamentosas.",
      assessment: "Fale números exatos de PA, débito do dreno e nota da dor na escala EVA.",
      recommendation: "Deixe horários claros de analgesia e exames laboratoriais a checar."
    }
  },
  {
    id: "icc",
    title: "ICC Descompensada & Congestão Pulmonar",
    sector: "UTI Cardiológica • Leito 04",
    bed: "Leito 04 - UTI",
    age: 67,
    name: "J.A.P.",
    diagnosis: "Insuficiência Cardíaca Congestiva perfil B (úmido e quente)",
    vitals: { pa_sistolica: 148, pa_diastolica: 94, fc: 96, fr: 23, sat: 92, tax: 36.4 },
    clinicalSummary: "Admitido por piora progressiva da dispneia aos mínimos esforços e ortopneia. Estertores crepitantes bibasais em terços inferiores e turgência jugular patológica.",
    goldenSbar: {
      situation: "Paciente J.A.P., 67 anos, no Leito 04 da UTI Cardiológica, admitido há 6 horas por descompensação de ICC com congestão pulmonar aguda.",
      background: "Histórico de ICC com fração de ejeção de 32%, HAS e DM2. Relata alergia severa a contraste iodado.",
      assessment: "PA 148/94 mmHg, FC 96 bpm, FR 23 irpm, SatO2 92% em ar ambiente que subiu para 96% sob cateter nasal a 3 L/min. Estertores crepitantes finos bibasais e edema de MMII +++/4+.",
      recommendation: "Administrar Furosemida 40 mg IV prescrita para as 20h; realizar balanço hídrico rigoroso de 6 em 6 horas e registrar peso em jejum amanhã cedo."
    },
    educationalPointers: {
      situation: "Identifique o tempo de admissão (6 horas) e o motivo da descompensação.",
      background: "Obrigatoriamente avise sobre a alergia a contraste iodado antes de qualquer tomografia.",
      assessment: "Informe a resposta da saturação ao oxigênio (de 92% para 96% a 3 L/min).",
      recommendation: "Prescreva o controle de diurese e o balanço hídrico rigoroso."
    }
  },
  {
    id: "delirium",
    title: "Idoso com Delirium & Risco de Queda",
    sector: "Enfermaria Geriátrica • Leito 21-B",
    bed: "Leito 21-B",
    age: 82,
    name: "A.B.C.",
    diagnosis: "Pneumonia Comunitária associada a Delirium Misto",
    vitals: { pa_sistolica: 132, pa_diastolica: 78, fc: 76, fr: 19, sat: 95, tax: 37.1 },
    clinicalSummary: "Paciente idoso com flutuação do nível de consciência, desorientação temporal e tentativa recorrente de retirada de punção venosa e evasão do leito.",
    goldenSbar: {
      situation: "Paciente A.B.C., 82 anos, Leito 21-B da Geriatria, no 3º dia de internação por pneumonia comunitária em antibioticoterapia venosa.",
      background: "Diagnóstico prévio de Alzheimer leve e osteoartrose. Nega alergias medicamentosas conhecidas. Histórico de queda no domicílio há 2 meses com contusão em quadril.",
      assessment: "Sinais vitais estáveis (PA 132/78 mmHg, FC 76 bpm, SatO2 95%). Apresenta flutuação do sensório (CAM positivo), agitou-se no início da tarde tentando levantar-se sem auxílio.",
      recommendation: "Manter grades do leito sempre elevadas bilateralmente; orientar e apoiar o acompanhante familiar; manter acesso periférico protegido e evitar contenção física mecânica desnecessária."
    },
    educationalPointers: {
      situation: "Informe o dia do antibiótico e a enfermaria geriátrica.",
      background: "Alerte sobre a queda recente no domicílio para acionar o protocolo de quedas.",
      assessment: "Descreva a flutuação do CAM e a tentativa de evasão do leito.",
      recommendation: "Foque nas grades elevadas e na segurança física do paciente sem contenção abusiva."
    }
  },
  {
    id: "dpoc",
    title: "Exacerbação de DPOC & Broncoespasmo",
    sector: "Clínica Médica • Leito 08",
    bed: "Leito 08",
    age: 64,
    name: "R.F.M.",
    diagnosis: "Doença Pulmonar Obstrutiva Crônica agudizada por infecção traqueobrônquica",
    vitals: { pa_sistolica: 138, pa_diastolica: 85, fc: 104, fr: 26, sat: 89, tax: 37.8 },
    clinicalSummary: "Paciente tabagista de longa data admitido com dispneia progressiva, tosse produtiva com escarro amarelado espesso e sibilos expiratórios difusos.",
    goldenSbar: {
      situation: "Paciente R.F.M., 64 anos, no Leito 08 da Clínica Médica, internado há 12 horas por exacerbação de DPOC infecciosa.",
      background: "DPOC estágio GOLD 3 com uso domiciliar de broncodilatadores. Alergia prévia a dipirona com urticária.",
      assessment: "PA 138/85 mmHg, FC 104 bpm, FR 26 irpm com tiragem intercostal leve, SatO2 89% em ar ambiente que subiu para 92% com Venturi a 28%. Sibilos expiratórios bilaterais e roncos esparsos.",
      recommendation: "Manter oxigenoterapia com alvo estrito de SatO2 entre 88-92% para evitar hipercapnia; realizar nebulização com broncodilatador prescrito às 22h e vigiar padrão ventilatório."
    },
    educationalPointers: {
      situation: "Informe o estágio do DPOC e tempo de admissão.",
      background: "Alerte categoricamente sobre a alergia à dipirona.",
      assessment: "Ressalte o alvo específico de oxigênio de 88-92% no retentor de CO2.",
      recommendation: "Prescreva a vigilância da frequência respiratória e horários da nebulização."
    }
  },
  {
    id: "sepse_urinaria",
    title: "Sepse de Foco Urinário & Hipotensão",
    sector: "Emergência / Sala Amarela • Leito 15",
    bed: "Leito 15 - Emergência",
    age: 71,
    name: "D.M.S.",
    diagnosis: "Sepse de foco urinário (ITU complicada) e resposta inflamatória sistêmica",
    vitals: { pa_sistolica: 90, pa_diastolica: 55, fc: 112, fr: 24, sat: 94, tax: 38.7 },
    clinicalSummary: "Idosa trazida pela família com rebaixamento do sensório, calafrios, febre e oligúria nas últimas 18 horas. Pele quente e ruborizada, tempo de enchimento capilar de 4 segundos.",
    goldenSbar: {
      situation: "Paciente D.M.S., 71 anos, Leito 15 da Sala Amarela da Emergência, admitida há 2 horas com sepse grave de provável foco urinário.",
      background: "Diabética e com histórico de ITU de repetição. Sem alergias medicamentosas registradas.",
      assessment: "Hipotensa (PA 90/55 mmHg, PAM 66 mmHg), taquicárdica (FC 112 bpm), taquipneica (FR 24 irpm) e febril (Tax 38,7 °C). Diurese concentrada e fétida de 40 mL nas últimas 2 horas.",
      recommendation: "Concluir a ressuscitação volêmica com Ringer Lactato a 30 mL/kg nas próximas 2 horas; administrar ceftriaxona IV prescrita imediatamente após colheita de culturas."
    },
    educationalPointers: {
      situation: "Enfatize a urgência da sepse nas primeiras horas do pacote de sobrevida.",
      background: "Confirme a ausência de alergias a betalactâmicos.",
      assessment: "Informe a PAM limítrofe (66 mmHg) e a oligúria crítica.",
      recommendation: "Priorize o término rápido da hidratação venosa e início precoce do antibiótico."
    }
  },
  {
    id: "avc_isquemico",
    title: "AVC Isquêmico Pós-Trombólise",
    sector: "UTI Neurológica • Leito 02",
    bed: "Leito 02 - Neuro",
    age: 63,
    name: "E.C.S.",
    diagnosis: "Acidente Vascular Cerebral Isquêmico submetido a trombólise com Alteplase há 4 horas",
    vitals: { pa_sistolica: 160, pa_diastolica: 95, fc: 82, fr: 18, sat: 97, tax: 36.8 },
    clinicalSummary: "Paciente em protocolo pós-trombolítico, recuperando parcialmente déficit motor em MSE. Sem sangramentos gengivais ou em sítio de punção.",
    goldenSbar: {
      situation: "Paciente E.C.S., 63 anos, Leito 02 da UTI Neurológica, em vigilância de 24 horas pós-trombólise com rTPA por AVCI.",
      background: "Hipertenso e tabagista. Sem alergias registradas.",
      assessment: "PA controlada em 160/95 mmHg sob vigilância para manter < 180/105 mmHg. Glasgow 14, hemiparesia braquial direita em melhora (força 3/5). Ausência de cefaleia súbita, náuseas ou sinais hemorrágicos.",
      recommendation: "Aferir PA e escore neurológico a cada 30 minutos; manter jejum absoluto e não realizar sondagem vesical ou punção arterial nas próximas 20 horas."
    },
    educationalPointers: {
      situation: "Destaque as horas decorridas desde o término do trombolítico.",
      background: "Confirme a ausência de anticoagulantes prévios.",
      assessment: "Alerte sobre a meta de PA < 180/105 mmHg para evitar sangramento cerebral.",
      recommendation: "Proíba procedimentos invasivos nas primeiras 24 horas pós-rTPA."
    }
  },
  {
    id: "iam_st",
    title: "Pós-Angioplastia Primária por IAM com Supra",
    sector: "Unidade Coronariana • Leito 06",
    bed: "Leito 06 - UCO",
    age: 56,
    name: "F.G.A.",
    diagnosis: "Infarto Agudo do Miocárdio de parede anterior submetido a angioplastia com stent farmacológico",
    vitals: { pa_sistolica: 125, pa_diastolica: 80, fc: 74, fr: 16, sat: 98, tax: 36.5 },
    clinicalSummary: "Paciente transferido do setor de Hemodinâmica com curativo compressivo oclusivo em artéria femoral direita.",
    goldenSbar: {
      situation: "Paciente F.G.A., 56 anos, Leito 06 da UCO, admitido há 1 hora pós-angioplastia com implante de 1 stent em artéria descendente anterior.",
      background: "Dislipidêmico e hipertenso. Nega alergias.",
      assessment: "Estável hemodinamicamente (PA 125/80 mmHg, FC 74 bpm sinusal). Sem queixa de dor torácica residual. Curativo femoral sem sangramento ou hematoma expansivo; pulso pedioso palpável e cheio à direita.",
      recommendation: "Manter repouso absoluto com membro inferior estendido por mais 4 horas; vigiar sítio de punção femoral a cada 15 minutos na primeira hora; administrar Dupla Antiagregação (AAS + Clopidogrel) prescrita."
    },
    educationalPointers: {
      situation: "Informe a artéria tratada e tempo de retorno da hemodinâmica.",
      background: "Confirme adesão à terapia antiplaquetária dupla.",
      assessment: "Verifique pulso pedioso ipsilateral e ausência de hematoma.",
      recommendation: "Reforce o repouso do membro puncionado para evitar pseudoaneurisma."
    }
  },
  {
    id: "trauma_cranio",
    title: "Traumatismo Cranioencefálico Moderado",
    sector: "Observação do Trauma • Leito 03",
    bed: "Leito 03 - Trauma",
    age: 29,
    name: "L.H.R.",
    diagnosis: "TCE moderado com contusão hemorrágica temporal direita após queda de bicicleta",
    vitals: { pa_sistolica: 135, pa_diastolica: 80, fc: 68, fr: 16, sat: 97, tax: 36.9 },
    clinicalSummary: "Paciente jovem em observação com colar cervical mantido, sonolento mas facilmente despertável.",
    goldenSbar: {
      situation: "Paciente L.H.R., 29 anos, Leito 03 do Trauma, internado há 5 horas por TCE moderado com TC mostrando contusão temporal direita sem desvio de linha média.",
      background: "Hígido, sem doenças crônicas ou medicações em uso. Nega alergias.",
      assessment: "Glasgow 13 (AO: 3, RV: 4, RM: 6), pupilas isocóricas e fotorreagentes (3 mm). Cefaleia moderada controlada com dipirona. Não apresentou vômitos nas últimas 3 horas.",
      recommendation: "Monitorar escala de coma de Glasgow e tamanho pupilar de hora em hora; comunicar imediatamente ao neurocirurgião de plantão se queda de 2 pontos no Glasgow ou anisocoria; manter cabeceira elevada a 30° centrada."
    },
    educationalPointers: {
      situation: "Cite o achado da tomografia computadorizada e o mecanismo do trauma.",
      background: "Verifique ausência de anticoagulantes prévios.",
      assessment: "Fale o valor de Glasgow e diâmetro pupilar.",
      recommendation: "Defina o gatilho exato de acionamento do neurocirurgião (queda ≥ 2 pts ou anisocoria)."
    }
  },
  {
    id: "cetoacidose_pediatrica",
    title: "Cetoacidose Diabética em Adolescente",
    sector: "UTI Pediátrica • Leito 05",
    bed: "Leito 05 - UTIP",
    age: 14,
    name: "K.O.N.",
    diagnosis: "Cetoacidose Diabética descompensada por omissão de dose insulínica",
    vitals: { pa_sistolica: 105, pa_diastolica: 65, fc: 116, fr: 28, tax: 36.6, sat: 99 },
    clinicalSummary: "Adolescente em hidratação venosa e bomba de insulina regular contínua a 0,05 UI/kg/h. Hálito cetônico e desidratação moderada.",
    goldenSbar: {
      situation: "Paciente K.O.N., 14 anos, no Leito 05 da UTI Pediátrica, admitida há 4 horas com cetoacidose diabética (glicemia inicial 490 mg/dL, pH 7,18, HCO3 11).",
      background: "Diagnóstico de DM1 há 3 anos. Sem alergias.",
      assessment: "Glicemia atual em queda gradual para 260 mg/dL (redução segura de 60 mg/dL/h). Potássio sérico atual de 4,2 mEq/L sob reposição com KCl na hidratação. Respiração de Kussmaul menos ruidosa, diurese preservada de 1,8 mL/kg/h.",
      recommendation: "Adicionar glicose 5% ao soro de manutenção quando a glicemia atingir 250 mg/dL para prevenir hipoglicemia e edema cerebral; realizar HGT horário e gasometria venosa às 22h."
    },
    educationalPointers: {
      situation: "Relate o pH inicial e a gravidade da acidose.",
      background: "Identifique o motivo da descompensação.",
      assessment: "Informe a velocidade de queda da glicemia (ideal 50-70 mg/dL/h) e o potássio.",
      recommendation: "Prescreva a adição de glicose para evitar queda abrupta da osmolaridade plasmática."
    }
  },
  {
    id: "pre_eclampsia_grave",
    title: "Pré-Eclâmpsia Grave & Sulfato de Magnésio",
    sector: "Maternidade de Alto Risco • Leito 08",
    bed: "Leito 08 - Maternidade",
    age: 31,
    name: "V.S.P.",
    diagnosis: "Pré-Eclâmpsia Grave com 35 semanas de gestação em infusão de Sulfato de Magnésio",
    vitals: { pa_sistolica: 155, pa_diastolica: 98, fc: 86, fr: 16, sat: 98, tax: 36.7 },
    clinicalSummary: "Gestante admitida por picos hipertensivos de 180/115 mmHg, queixando-se de dor epigástrica e cefaleia frontal.",
    goldenSbar: {
      situation: "Paciente V.S.P., 31 anos, primigesta de 35 semanas, Leito 08 da Maternidade de Alto Risco, recebendo infusão de manutenção de Sulfato de Magnésio a 1 g/h há 6 horas.",
      background: "Sem antecedentes de hipertensão prévia. Nega alergias conhecidas.",
      assessment: "PA controlada após Hidralazina (atual 155/98 mmHg). Reflexos patelares presentes e simétricos (+2/+4), FR estável em 16 irpm. Diurese por sonda vesical de demora clara com 90 mL nas últimas 2 horas. BCF feto 144 bpm com boa variabilidade.",
      recommendation: "Testar reflexo patelar e FR a cada hora rigorosamente; comunicar se FR < 12 ou diurese < 25 mL/h; manter Gluconato de Cálcio a 10% preparado e identificado à beira-leito."
    },
    educationalPointers: {
      situation: "Cite a idade gestacional e o esquema de magnésio em curso.",
      background: "Confirme ausência de hipertensão crônica.",
      assessment: "Comprove a presença do reflexo patelar e a diurese horária.",
      recommendation: "Exija a presença do antídoto (Gluconato de Cálcio) à cabeceira."
    }
  },
  {
    id: "pancreatite_aguda",
    title: "Pancreatite Aguda Biliar em UTI",
    sector: "UTI Geral • Leito 11",
    bed: "Leito 11 - UTI",
    age: 49,
    name: "H.L.C.",
    diagnosis: "Pancreatite Aguda Necrosante com SIRS",
    vitals: { pa_sistolica: 105, pa_diastolica: 68, fc: 110, fr: 22, tax: 38.1, sat: 94 },
    clinicalSummary: "Paciente internado no 2º dia de pancreatite aguda litiásica, em jejum com sonda nasogástrica descompressiva aberta e hidratação venosa vigorosa.",
    goldenSbar: {
      situation: "Paciente H.L.C., 49 anos, Leito 11 da UTI Geral, com diagnóstico de pancreatite aguda biliar com escore de Ranson 3 pontos.",
      background: "Colelitíase diagnosticada há 1 ano sem cirurgia prévia. Nega etilismo e alergias.",
      assessment: "Dor abdominal em barra difusa no andar superior (EVA 6/10 sob bomba de analgesia com opioide). Sonda nasogástrica com débito bilioso de 350 mL em 12h. Abdome tenso e distendido, ruídos hidroaéreos diminuídos. Diurese nas últimas 6h totalizou 320 mL.",
      recommendation: "Manter ressuscitação volêmica guiada por débito urinário (> 0,5 mL/kg/h); dosar amilase, lipase e cálcio sérico no mapa da manhã; checar analgesia de resgate se dor EVA > 4."
    },
    educationalPointers: {
      situation: "Informe o escore de gravidade (Ranson) e o foco biliar.",
      background: "Descarte etilismo como etiologia.",
      assessment: "Informe o débito da sonda nasogástrica e o balanço hídrico.",
      recommendation: "Priorize metas de ressuscitação volêmica sem sobrecarga pulmonar."
    }
  },
  {
    id: "choque_anafilatico",
    title: "Pós-Choque Anafilático em Sala de Emergência",
    sector: "Sala Vermelha / Emergência • Leito 01",
    bed: "Leito 01 - Vermelha",
    age: 38,
    name: "E.S.K.",
    diagnosis: "Choque anafilático grave após infusão de Ceftriaxona, revertido com Adrenalina IM",
    vitals: { pa_sistolica: 118, pa_diastolica: 74, fc: 94, fr: 18, sat: 98, tax: 36.7 },
    clinicalSummary: "Paciente apresentou broncoespasmo severo, estridor e hipotensão logo após antibiótico venoso. Recebeu Adrenalina 0,5 mg IM no vasto lateral com melhora expressiva.",
    goldenSbar: {
      situation: "Paciente E.S.K., 38 anos, Leito 01 da Sala Vermelha, internada para pielonefrite, apresentou choque anafilático agudo há 90 minutos após primeira dose de ceftriaxona.",
      background: "Desconhecia alergias prévias. Agora alérgica confirmada a cefalosporinas e penicilinas.",
      assessment: "Hemodinamicamente estabilizada após Adrenalina IM, Hidrocortisona e Difenidramina. PA 118/74 mmHg, estridor laríngeo desapareceu, murmúrio vesicular livre sem sibilos. Lesões de urticária em regressão.",
      recommendation: "Manter observação rigorosa por no mínimo 12 horas pelo risco de anafilaxia bifásica; colocar pulseira vermelha de alergia e registrar no prontuário; suspender qualquer beta-lactâmico."
    },
    educationalPointers: {
      situation: "Relate a gravidade do evento e a reversão imediata pela adrenalina.",
      background: "Garanta que a nova alergia seja registrada em prontuário e pulseira.",
      assessment: "Fale sobre a ausência de estridor e estabilidade pressórica.",
      recommendation: "Enfatize o risco de anafilaxia bifásica nas próximas 6 a 12 horas."
    }
  },
  {
    id: "queimado_agudo",
    title: "Grande Queimado Térmico em Parkland",
    sector: "Centro de Tratamento de Queimados • Leito 03",
    bed: "Leito 03 - CTQ",
    age: 32,
    name: "F.R.S.",
    diagnosis: "Queimadura térmica de 2º e 3º graus em 38% de superfície corporal",
    vitals: { pa_sistolica: 108, pa_diastolica: 68, fc: 114, fr: 20, tax: 36.2, sat: 96 },
    clinicalSummary: "Paciente vítima de explosão de botijão, com queimaduras em tórax anterior, membros superiores e face. Em hidratação venosa segundo fórmula de Parkland.",
    goldenSbar: {
      situation: "Paciente F.R.S., 32 anos, Leito 03 do CTQ, nas primeiras 6 horas de tratamento de queimaduras em 38% SCQ por chama direta.",
      background: "Sem doenças prévias, peso 70 kg. Nega alergias.",
      assessment: "Volume previsto de Parkland: 10.640 mL de Ringer Lactato em 24h, correndo primeira metade (5.320 mL) nas primeiras 8h. Débito urinário atual por cateter vesical em 55 mL/h (0,8 mL/kg/h, dentro da meta). Extremidades aquecidas.",
      recommendation: "Ajustar vazão do Ringer Lactato de hora em hora guiado pela diurese (alvo 35 a 70 mL/h); manter cabeceira elevada a 30° e vigiar edema de face e vias aéreas; administrar analgesia com opioide antes de qualquer manipulação de curativo."
    },
    educationalPointers: {
      situation: "Informe a porcentagem exata de SCQ e o agente causal.",
      background: "Confirme o peso do paciente para a fórmula de Parkland.",
      assessment: "Diga a diurese horária em mL/kg/h (marcador número 1 de perfusão no queimado).",
      recommendation: "Planeje analgesia prévia às trocas de curativo."
    }
  },
  {
    id: "politrauma_bacia",
    title: "Politrauma com Fratura Instável de Pelve",
    sector: "UTI do Trauma • Leito 08",
    bed: "Leito 08 - Trauma",
    age: 24,
    name: "G.P.V.",
    diagnosis: "Politraumatizado por atropelamento com fratura de bacia em livro aberto contida com lençol",
    vitals: { pa_sistolica: 102, pa_diastolica: 64, fc: 118, fr: 22, sat: 95, tax: 35.7 },
    clinicalSummary: "Paciente jovem com contenção pélvica temporária, pós-transfusão de 2 concentrados de hemácias na sala de emergência.",
    goldenSbar: {
      situation: "Paciente G.P.V., 24 anos, Leito 08 da UTI do Trauma, admitido há 3 horas com fratura instável de pelve e choque hemorrágico controlado.",
      background: "Jovem hígido, atleta, sem histórico clínico prévio.",
      assessment: "PA 102/64 mmHg sob infusão de cristaloide aquecido e ácido tranexâmico. Contenção pélvica ajustada no nível dos grandes trocânteres. Hematócrito de controle 28%. Extremidades com pulsos femorais e distais palpáveis e simétricos.",
      recommendation: "Proibido desatar ou manipular a contenção pélvica sem equipe de ortopedia; aquecer ativamente o paciente para manter temperatura > 36°C; controlar débito urinário rigorosamente e checar nova gasometria às 21h."
    },
    educationalPointers: {
      situation: "Descreva a fratura pélvica instável e a transfusão recente.",
      background: "Confirme ausência de comorbidades prévias.",
      assessment: "Verifique a posição correta da cinta pélvica e a temperatura corporal.",
      recommendation: "Proíba explicitamente a mobilização da bacia para evitar novo sangramento retroperitoneal."
    }
  },
  {
    id: "hemorragia_digestiva",
    title: "Hemorragia Digestiva Alta Maciça",
    sector: "Emergência Clínica • Leito 04",
    bed: "Leito 04 - Emergência",
    age: 52,
    name: "G.B.L.",
    diagnosis: "Hemorragia Digestiva Alta por Varizes Esofágicas em cirrótico",
    vitals: { pa_sistolica: 95, pa_diastolica: 58, fc: 106, fr: 22, sat: 94, tax: 36.3 },
    clinicalSummary: "Paciente cirrótico com hematêmese e melena, em infusão de Terlipressina e aguardando endoscopia digestiva de urgência.",
    goldenSbar: {
      situation: "Paciente G.B.L., 52 anos, Leito 04 da Emergência Clínica, internado há 3 horas com HDA por ruptura de varizes de esôfago.",
      background: "Cirrose hepática alcoólica Child-Pugh B, com sangramento prévio há 8 meses. Nega alergias.",
      assessment: "Após infusão de 1500 mL de cristaloides e Terlipressina venosa, PA subiu de 78/42 para 95/58 mmHg. Sem novos episódios de hematêmese na última hora. Sonolento, mas orientado. Acesso venoso central em subclávia direita pérvio.",
      recommendation: "Manter jejum absoluto e decúbito elevado a 30°; vigiar via aérea contra broncoaspiração de sangue; encaminhar imediatamente para Endoscopia Digestiva Alta assim que a equipe de sobreaviso chegar."
    },
    educationalPointers: {
      situation: "Destaque a etiologia por varizes e o tempo de admissão.",
      background: "Informe a classificação Child-Pugh e episódios prévios.",
      assessment: "Apresente a resposta hemodinâmica à terlipressina e ausência de ressangramento ativo.",
      recommendation: "Prepare o encaminhamento seguro para a endoscopia de urgência."
    }
  },
  {
    id: "tep_pos_op",
    title: "Tromboembolismo Pulmonar no Pós-Operatório",
    sector: "UTI Geral • Leito 14",
    bed: "Leito 14 - UTI",
    age: 59,
    name: "P.T.C.",
    diagnosis: "Tromboembolismo Pulmonar agudo no 3º DPO de prótese total de joelho",
    vitals: { pa_sistolica: 112, pa_diastolica: 70, fc: 98, fr: 20, sat: 95, tax: 36.6 },
    clinicalSummary: "Paciente apresentou dispneia súbita e dor torácica no leito da enfermaria, confirmado TEP por angiotomografia e transferido para a UTI sob Heparina Não Fracionada em BIC.",
    goldenSbar: {
      situation: "Paciente P.T.C., 59 anos, Leito 14 da UTI Geral, transferido da enfermaria ortopédica há 2 horas por TEP submaciço.",
      background: "Pós-operatório de artroplastia de joelho esquerdo. Sem alergias.",
      assessment: "Infundindo Heparina Não Fracionada a 18 UI/kg/h em bomba de infusão. SatO2 95% sob máscara de Venturi a 35%. Panturrilha esquerda com edema e empastamento muscular. Sem hipotensão ou dor precordial aguda.",
      recommendation: "Coletar TTPA de controle em 4 horas para ajuste do nomograma de heparina; manter repouso absoluto no leito; vigiar sinais de sangramento em curativo cirúrgico e gengivas."
    },
    educationalPointers: {
      situation: "Identifique a cirurgia prévia e a confirmação do TEP por angiotomografia.",
      background: "Confirme ausência de úlcera péptica ativa ou contraindicação à heparina.",
      assessment: "Informe a vazão da heparina em BIC e a estabilidade da SatO2.",
      recommendation: "Apraze o horário exato da coleta do TTPA para titulação da anticoagulação."
    }
  },
  {
    id: "falciforme_toracica",
    title: "Síndrome Torácica Aguda em Anemia Falciforme",
    sector: "Enfermaria de Hematologia • Leito 07",
    bed: "Leito 07 - Hemato",
    age: 20,
    name: "W.A.P.",
    diagnosis: "Doença Falciforme (HbSS) complicada com Síndrome Torácica Aguda",
    vitals: { pa_sistolica: 110, pa_diastolica: 70, fc: 104, fr: 24, sat: 91, tax: 38.3 },
    clinicalSummary: "Paciente internado por crise álgica que evoluiu há 6 horas com tosse, febre e queda de saturação de oxigênio.",
    goldenSbar: {
      situation: "Paciente W.A.P., 20 anos, Leito 07 da Hematologia, em tratamento de Síndrome Torácica Aguda iniciada hoje.",
      background: "Portador de anemia falciforme com histórico de crises vaso-oclusivas frequentes. Sem alergias.",
      assessment: "Apresenta dor torácica ventilatório-dependente, SatO2 91% em ar ambiente que sobe para 95% com cateter a 2 L/min. RX de tórax mostra infiltrado alveolar novo em base esquerda. Dor óssea em fêmures controlada (EVA 3/10 sob morfina de horário).",
      recommendation: "Iniciar antibiótico de amplo espectro prescrito (Ceftriaxona + Claritromicina); realizar espirometria de incentivo (Respiron) de hora em hora enquanto acordado; checar hemograma matutino para avaliação de transfusão simples."
    },
    educationalPointers: {
      situation: "Diferencie a dor puramente óssea da Síndrome Torácica Aguda.",
      background: "Informe a adesão prévia à hidroxiureia.",
      assessment: "Destaque a imagem do RX e a necessidade de oxigenoterapia contínua.",
      recommendation: "Enfatize a fisioterapia respiratória de incentivo para evitar atelectasias."
    }
  },
  {
    id: "bronquiolite_lactente",
    title: "Bronquiolite Viral Aguda & Desidratação",
    sector: "Enfermaria Pediátrica • Leito 10",
    bed: "Leito 10 - Pediatria",
    age: 1,
    name: "B.M.",
    diagnosis: "Bronquiolite Viral Aguda por VSR em lactente de 7 meses",
    vitals: { pa_sistolica: 88, pa_diastolica: 52, fc: 148, fr: 54, tax: 37.6, sat: 92 },
    clinicalSummary: "Lactente com esforço respiratório, tiragem subcostal e recusa parcial do aleitamento materno.",
    goldenSbar: {
      situation: "Lactente B.M., 7 meses, no Leito 10 da Pediatria, internado há 18 horas por bronquiolite viral com esforço moderado.",
      background: "Nascido a termo, sem histórico de asma na família. Nega alergias.",
      assessment: "FR 54 irpm com tiragem intercostal e subcostal evidentes. SatO2 92% em ar ambiente mantida em 96% sob cateter de oxigênio a 1 L/min umidificado. Aceitou 60 mL de leite materno ordenhado na colher. Diurese com 4 fraldas pesadas nas últimas 12 horas.",
      recommendation: "Realizar lavagem nasal com soro fisiológico 0,9% antes das mamadas; manter cabeceira elevada a 30° em decúbito dorsal; comunicar imediatamente se gemência contínua ou queda de SatO2 < 92%."
    },
    educationalPointers: {
      situation: "Informe a idade em meses e o tempo de sintomas respiratórios.",
      background: "Verifique prematuridade ou cardiopatia congênita associada.",
      assessment: "Descreva a frequência respiratória, os sinais de tiragem e o número de fraldas molhadas.",
      recommendation: "Oriente a técnica de aspiração e higienização nasal com soro."
    }
  },
  {
    id: "paliativos_terminal",
    title: "Paciente Oncológico em Cuidados de Conforto",
    sector: "Unidade de Cuidados Paliativos • Quarto 05",
    bed: "Quarto 05 - Paliativos",
    age: 74,
    name: "C.M.R.",
    diagnosis: "Neoplasia de cólon metastática em fase de fim de vida (declínio funcional avançado)",
    vitals: { pa_sistolica: 80, pa_diastolica: 45, fc: 62, fr: 12, sat: 86, tax: 35.5 },
    clinicalSummary: "Paciente em coma vigil sem sofrimento aparente, acompanhada pela filha no quarto privativo.",
    goldenSbar: {
      situation: "Paciente C.M.R., 74 anos, Quarto 05 da Unidade de Cuidados Paliativos, em plano exclusivo de cuidados de conforto e controle de sintomas.",
      background: "Câncer metastático refratário, com diretivas antecipadas de vontade assinadas pela paciente e família.",
      assessment: "Hipodermóclise em deltoide esquerdo funcionando adequadamente, sem hiperemia local. Infusão contínua de Morfina 20 mg/24h e Hioscina 60 mg/24h. Paciente sem fácies de dor ou gemência; respiração com estertor leve em vias aéreas altas.",
      recommendation: "Manter decúbito lateralizado com coxins e hidratação labial frequente; não realizar aspiração traqueal dolorosa desnecessária; acolher a filha presente e aprazar dose de resgate de morfina se taquipneia ou agitação."
    },
    educationalPointers: {
      situation: "Esclareça com serenidade o plano exclusivo de conforto e dignidade.",
      background: "Confirme o alinhamento com as diretrizes da família.",
      assessment: "Avalie escalas de dor comportamental no paciente não comunicativo.",
      recommendation: "Priorize medidas não invasivas de carinho, hidratação labial e conforto."
    }
  },
  {
    id: "crise_tireotoxica",
    title: "Tempestade Tireoidiana em Sala Vermelha",
    sector: "UTI / Emergência • Leito 05",
    bed: "Leito 05 - UTI",
    age: 35,
    name: "V.R.F.",
    diagnosis: "Crise Tireotóxica (Tempestade Tireoidiana) descompensada por infecção",
    vitals: { pa_sistolica: 165, pa_diastolica: 70, fc: 158, fr: 26, tax: 39.8, sat: 97 },
    clinicalSummary: "Paciente jovem com hipertireoidismo apresentando hipertermia maligna, taquicardia sinusal extrema e agitação psicomotora.",
    goldenSbar: {
      situation: "Paciente V.R.F., 35 anos, Leito 05 da UTI, internada há 4 horas com tempestade tireoidiana (escore de Burch-Wartofsky = 65 pontos).",
      background: "Doença de Graves sem tratamento regular há 2 meses. Nega alergias.",
      assessment: "Tax 39,8°C sob medidas de resfriamento físico e dipirona. FC 158 bpm com Propranolol venoso iniciado. Pele quente e sudoreica, tremores finos de extremidades. Sem sinais de edema pulmonar agudo.",
      recommendation: "Administrar Propiltiouracil (PTU) por sonda nasogástrica conforme prescrito; administrar Solução de Lugol 1 hora após o PTU; proibir expressamente o uso de ácido acetilsalicílico (AAS); manter monitorização cardíaca contínua."
    },
    educationalPointers: {
      situation: "Cite a pontuação de Burch-Wartofsky confirmando a tempestade tireoidiana.",
      background: "Alerte sobre a interrupção do antitireoidiano.",
      assessment: "Informe a temperatura axilar e o controle do ritmo cardíaco.",
      recommendation: "Enfatize o intervalo obrigatório de 1h entre PTU e Lugol e a contraindicação do AAS."
    }
  }
];
