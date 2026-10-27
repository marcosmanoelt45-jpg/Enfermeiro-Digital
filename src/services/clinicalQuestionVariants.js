/**
 * clinicalQuestionVariants.js
 * Banco de Múltiplas Variantes de Questões Clínicas por Especialidade.
 * Garante que a cada ciclo de bateria ("Nova Bateria de Questões") ou
 * troca de paciente ("Sortear Novo Caso"), o estudante receba perguntas
 * e abordagens fisiopatológicas totalmente diferentes e aprofundadas.
 * 
 * Em conformidade com o Processo de Enfermagem (COFEN nº 736/2024).
 */

export function getClinicalQuestionPair(category, patientInitials, userDiagnosis, vitalsText, vitals, variantIndex = 0) {
  const { paSis, paDia, fc, fr, tax, sat } = vitals;

  switch (category) {
    case "cardiovascular": {
      const variants = [
        // Variante 0: Isquemia Miocárdica Aguda / IAM / Dor Torácica
        {
          q1: {
            id: 1,
            category: "Priorização & Julgamento Imediato",
            questionStem: `O Paciente ${patientInitials}, com diagnóstico de ${userDiagnosis}, apresenta dor torácica retroesternal com ${vitalsText}. Qual intervenção de enfermagem nos primeiros 10 minutos de admissão é mandatória?`,
            attendingTip: "Na suspeita de Síndrome Coronariana Aguda, a realização e interpretação do ECG de 12 derivações em até 10 minutos é meta de qualidade internacional.",
            options: [
              {
                title: "Realizar eletrocardiograma (ECG) de 12 derivações em até 10 minutos da admissão, monitorizar traçado continuamente e instalar acesso venoso calibroso.",
                isCorrect: true,
                whyCorrect: "Correto! O ECG em até 10 minutos (tempo porta-ECG) define se há supradesnivelamento de ST para terapia de reperfusão imediata, salvando miocárdio isquêmico.",
                whyDistractor: null
              },
              {
                title: "Encaminhar o paciente imediatamente deambulando até o setor de radiologia para radiografia de tórax antes de registrar o traçado eletrocardiográfico.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Iatrogenia por Atraso: Deslocar paciente com dor torácica aguda aumenta o consumo miocárdico de oxigênio e posterga o diagnóstico de infarto com supra de ST."
              },
              {
                title: "Administrar oxigenoterapia sob máscara com reservatório a 15 L/min rotineiramente mesmo com saturação periférica preservada em 98%.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Iatrogenia Hiperóxica: Oxigênio suplementar em normóxia causa vasoconstrição coronariana paradoxal e aumento da produção de radicais livres de oxigênio."
              },
              {
                title: "Oferecer analgesia com anti-inflamatório não esteroidal (AINE) via oral para relaxamento musculoesquelético da parede torácica antes de qualquer monitorização.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Contraindicação Formal: AINEs são contraindicados no infarto agudo pois elevam o risco de ruptura de parede livre ventricular, hipertensão e trombose de stent."
              }
            ]
          },
          q2: {
            id: 2,
            category: "Fisiopatologia & Diagnóstico Crítico",
            questionStem: `Frente à dor isquêmica e ao quadro de ${userDiagnosis} no Paciente ${patientInitials}, qual mecanismo fisiopatológico fundamenta o raciocínio diagnóstico e as metas assistenciais?`,
            attendingTip: "A oclusão coronariana aguda gera descompasso crítico entre a oferta de oxigênio e a demanda metabólica miocárdica.",
            options: [
              {
                title: "Diminuição do Débito Cardíaco e Dor Aguda: Desproporção entre oferta e demanda miocárdica de oxigênio por trombose coronariana, exigindo repouso, analgesia e vasodilatação.",
                isCorrect: true,
                whyCorrect: "Correto! O diagnóstico de Dor Aguda associado à Diminuição do Débito Cardíaco norteia a assistência para reduzir a pós-carga miocárdica e preservar músculo cardíaco viável.",
                whyDistractor: null
              },
              {
                title: "Padrão Respiratório Ineficaz Primário: Broncoespasmo obstrutivo asmático decorrente de hiper-reatividade de vias aéreas sem relação com perfusão coronariana.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Confusão Diagnóstica: A taquipneia na síndrome coronariana aguda decorre de estresse adrenérgico e congestão pulmonar retrógrada, e não de broncoespasmo alérgico."
              },
              {
                title: "Volume de Líquidos Deficiente: Hipovolemia desidratante profunda que demanda infusão rápida de 3.000 mL de soro fisiológico em bolus nos primeiros minutos.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Risco de Edema Pulmonar: A sobrecarga hídrica rápida no ventrículo isquêmico precipita edema agudo de pulmão e choque cardiogênico fatal."
              },
              {
                title: "Intolerância à Atividade Fisiológica Benigna: Cansaço rotineiro esperado pelo envelhecimento natural sem qualquer repercussão hemodinâmica ou risco de arritmias ventriculares.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Subestimação Perigosa: Infarto do miocárdio é emergência médica com alto risco de fibrilação ventricular nas primeiras horas de evolução."
              }
            ]
          }
        },
        // Variante 1: Descompensação Congestiva / ICC / Edema Agudo de Pulmão
        {
          q1: {
            id: 1,
            category: "Priorização & Julgamento Imediato",
            questionStem: `O Paciente ${patientInitials}, admitido com descompensação de ${userDiagnosis}, apresenta ortopneia severa, tosse com secreção serosa rósea e ${vitalsText}. Qual intervenção postural e privativa de enfermagem é imediata?`,
            attendingTip: "Na congestão pulmonar maciça, o posicionamento em Fowler alta com membros inferiores pendentes reduz a pré-carga por represamento venoso.",
            options: [
              {
                title: "Posicionar imediatamente o paciente em Fowler alta (90 graus) com membros inferiores pendentes, instalar oxigenoterapia para manter SatO₂ > 92% e restringir esforço físico.",
                isCorrect: true,
                whyCorrect: "Correto! A posição de Fowler alta reduz o retorno venoso (pré-carga) pela gravidade, diminuindo a pressão capilar pulmonar e melhorando a mecânica ventilatória diafragmática.",
                whyDistractor: null
              },
              {
                title: "Colocar o paciente em decúbito dorsal horizontal estrito com cabeceira zerada e pernas elevadas em Trendelenburg para melhorar a perfusão renal.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "ERRO CRÍTICO FATAL: O decúbito dorsal ou Trendelenburg aumenta abruptamente o retorno venoso ao coração insuficiente, afogando os alvéolos em edema e causando asfixia."
              },
              {
                title: "Iniciar hidratação venosa rápida com 1.000 mL de ringer lactato aberto em bolus para corrigir a pressão de pulso antes de ofertar oxigênio.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Iatrogenia Hipervolêmica: Infundir volume rápido em paciente com edema pulmonar congestivo agrava o colapso respiratório e causa parada cardiorrespiratória."
              },
              {
                title: "Administrar sedação profunda intramuscular imediata e aguardar a transferência para enfermaria sem monitorização da oximetria de pulso.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Negligência e Risco: A sedação cega deprime o drive respiratório em paciente com hipoxemia crítica sem suporte ventilatório assegurado."
              }
            ]
          },
          q2: {
            id: 2,
            category: "Fisiopatologia & Diagnóstico Crítico",
            questionStem: `Na evolução da sobrecarga volêmica associada a ${userDiagnosis} no Paciente ${patientInitials}, qual fundamento fisiopatológico explica a congestão pulmonar e define o diagnóstico de enfermagem prioritário?`,
            attendingTip: "A elevação retrógrada da pressão diastólica final do VE supera a pressão oncótica capilar, extravasando plasma para os alvéolos.",
            options: [
              {
                title: "Excesso de Volume de Líquidos e Troca de Gases Prejudicada: Aumento da pressão hidrostática capilar pulmonar superando a pressão oncótica, gerando transudato alveolar e hipoxemia.",
                isCorrect: true,
                whyCorrect: "Correto! A falência ventricular esquerda eleva a pressão capilar pulmonar (> 20 mmHg), extravasando líquido para os alvéolos e comprometendo a difusão do oxigênio.",
                whyDistractor: null
              },
              {
                title: "Perfusão Tissular Gastrointestinal Interrompida Isolada: Isquemia mesentérica pura sem nenhuma repercussão na circulação pulmonar ou nas câmaras cardíacas esquerdas.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Erro Anatômico: A ortopneia e estertoração pulmonar localizam a falência primária no coração esquerdo e leito vascular pulmonar, e não no trato digestivo."
              },
              {
                title: "Hipertermia Maligna Infecciosa: Febre central induzida por anestésicos inalatórios sem qualquer alteração na hemodinâmica cardíaca ou nos volumes circulantes.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Diagnóstico Incompatível: O quadro é de congestão mecânica hemodinâmica ventricular, sem sinais ou histórico de exposição a gatilhos de hipertermia maligna."
              },
              {
                title: "Integridade Tissular Prejudicada Primária: Fricção cutânea sacral isolada sem qualquer impacto sistêmico na respiração, circulação ou transporte gasoso sanguíneo.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Inversão de Gravidade: A congestão alveolar aguda com hipoxemia é uma emergência de risco iminente de morte que antecede queixas tegumentares isoladas."
              }
            ]
          }
        }
      ];
      const selected = variants[variantIndex % variants.length];
      return selected;
    }

    case "respiratorio": {
      const variants = [
        // Variante 0: DPOC / Asma / Broncoespasmo Agudo
        {
          q1: {
            id: 1,
            category: "Priorização & Julgamento Imediato",
            questionStem: `O Paciente ${patientInitials}, em crise aguda de ${userDiagnosis}, apresenta sibilos expiratórios difusos, tiragem intercostal e ${vitalsText}. Qual conduta privativa de enfermagem na titulação da oxigenoterapia é prioritária?`,
            attendingTip: "Em pacientes com retenção crônica de CO2, a hiperóxia descontrolada pode inibir o drive respiratório hipóxico bulbar e agravar a acidose respiratória.",
            options: [
              {
                title: "Titular oxigenoterapia criteriosa para manter SatO₂ entre 88% e 92%, instalar nebulização com broncodilatador prescrito e manter vigilância do padrão respiratório.",
                isCorrect: true,
                whyCorrect: "Correto! O alvo de saturação de 88% a 92% em retentores crônicos previne hipercapnia grave induzida por oxigênio e abolição do drive hipóxico, assegurando broncodilatação eficaz.",
                whyDistractor: null
              },
              {
                title: "Instalar máscara com reservatório a 15 L/min sem válvula para forçar SatO₂ em 100% de forma ininterrupta nas próximas 12 horas.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Iatrogenia Ventilatoria Crítica: O oxigênio em alto fluxo irrestrito em pneumopatas crônicos agrava a hipercapnia (efeito Haldane e perda de vasoconstrição hipóxica), induzindo narcose por CO2 e coma."
              },
              {
                title: "Administrar sedativo opioide intravenoso imediatamente para acalmar a ansiedade provocada pela falta de ar e induzir sono reparador.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "ERRO CRÍTICO FATAL: Opioides em crise obstrutiva respiratória deprimem o centro respiratório, levando rapidamente à apneia e parada cardiorrespiratória."
              },
              {
                title: "Posicionar o paciente em decúbito dorsal plano e orientá-lo a prender a respiração para reduzir o trabalho dos músculos intercostais.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Conduta Agravante: O decúbito dorsal reduz a excursão diafragmática pelo peso das vísceras abdominais, precipitando fadiga muscular respiratória aguda."
              }
            ]
          },
          q2: {
            id: 2,
            category: "Fisiopatologia & Diagnóstico Crítico",
            questionStem: `Na exacerbação de ${userDiagnosis} no Paciente ${patientInitials}, qual fundamento fisiopatológico explica o aprisionamento aéreo e orienta o diagnóstico de enfermagem prioritário?`,
            attendingTip: "A limitação crônica ao fluxo aéreo com colapso prematuro das vias aéreas distais na expiração causa hiperinsuflação dinâmica.",
            options: [
              {
                title: "Padrão Respiratório Ineficaz e Troca de Gases Prejudicada: Edema e broncoconstrição com aprisionamento aéreo expiratório, fadiga da musculatura e desproporção V/Q.",
                isCorrect: true,
                whyCorrect: "Correto! O estreitamento das vias aéreas na expiração dificulta o esvaziamento alveolar, gerando auto-PEEP, hiperinsuflação e aumento do trabalho ventilatório.",
                whyDistractor: null
              },
              {
                title: "Débito Cardíaco Elevado Primário: Hipervolemia funcional decorrente de estenose aórtica com sobrecarga de ejeção sistólica sem qualquer relação com a árvore brônquica.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Erro Fisiopatológico: O quadro primário é respiratório obstrutivo pulmonar com retenção de gás, e não hipervolemia vascular aórtica primária."
              },
              {
                title: "Motilidade Gastrointestinal Disfuncional: Paralisia estomacal isolada sem repercussão na hematose alveolar ou nos gases sanguíneos arteriais.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Incompatibilidade Clínica: A dispneia, taquipneia e sibilos atestam comprometimento exclusivo do sistema respiratório como prioridade imediata."
              },
              {
                title: "Hipotermia Acidental Grave: Redução patológica da temperatura corporal abaixo de 32°C com congelamento celular tecidual generalizado.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Incompatibilidade Térmica: A temperatura aferida não indica hipotermia severa; o foco patológico central reside na insuficiência ventilatória."
              }
            ]
          }
        },
        // Variante 1: Tromboembolismo Pulmonar / Desproporção Espaço Morto
        {
          q1: {
            id: 1,
            category: "Priorização & Julgamento Imediato",
            questionStem: `O Paciente ${patientInitials}, com diagnóstico de ${userDiagnosis}, apresenta início súbito de dor torácica pleurítica, taquipneia de ${fr} irpm e ${vitalsText}. Qual intervenção de enfermagem de urgência é prioritária?`,
            attendingTip: "Na suspeita de embolia pulmonar aguda, a estabilização hemodinâmica, repouso absoluto no leito e preparação para anticoagulação imediata salvam vidas.",
            options: [
              {
                title: "Manter repouso absoluto no leito para evitar desprendimento de novos êmbolos, ofertar oxigênio suplementar sob cânula/máscara e viabilizar acesso venoso calibroso.",
                isCorrect: true,
                whyCorrect: "Correto! O repouso absoluto reduz o risco de embolização adicional a partir de trombose venosa profunda; o oxigênio combate a hipoxemia induzida pelo shunt e espaço morto.",
                whyDistractor: null
              },
              {
                title: "Estimular o paciente a realizar deambulação imediata no quarto para estimular a circulação dos membros inferiores e desobstruir vasos pulmonares.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "ERRO CRÍTICO FATAL: Deambular ou massagear membros inferiores na vigência de trombose desaloja trombos maciços para a artéria pulmonar, causando colapso e morte súbita."
              },
              {
                title: "Realizar massagem circular profunda nas panturrilhas com pomada anti-inflamatória para dissolver coágulos periféricos palpáveis.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Prática Iatrogênica Proibida: Massagear sítios com suspeita de trombose venosa profunda fragmenta o trombo e provoca embolia pulmonar maciça."
              },
              {
                title: "Aguardar a realização de angiotomografia ambulatorial programada nos próximos dias antes de monitorizar a oximetria de pulso ou aferir novos sinais vitais.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Negligência Assistencial: O TEP agudo com taquicardia e hipoxemia é emergência com risco de choque obstrutivo e parada em AESP a qualquer minuto."
              }
            ]
          },
          q2: {
            id: 2,
            category: "Fisiopatologia & Diagnóstico Crítico",
            questionStem: `Correlacionando a taquicardia (${fc} bpm) e a hipoxemia (${sat}%) no quadro de ${userDiagnosis} do Paciente ${patientInitials}, qual mecanismo fisiopatológico fundamenta o raciocínio diagnóstico?`,
            attendingTip: "A oclusão do leito vascular arterial pulmonar cria alvéolos ventilados porém não perfundidos (aumento do espaço morto alveolar).",
            options: [
              {
                title: "Troca de Gases Prejudicada e Risco de Choque Cardiogênico Obstrutivo: Oclusão mecânica vascular gerando espaço morto alveolar, hipoxemia e sobrecarga aguda do ventrículo direito.",
                isCorrect: true,
                whyCorrect: "Correto! A obstrução arterial pulmonar eleva subitamente a pós-carga do VD (cor pulmonale agudo), desviando o septo interventricular e reduzindo o débito cardíaco sistêmico.",
                whyDistractor: null
              },
              {
                title: "Sobrecarga Volêmica Renal Primária: Retenção urinária de ureia e creatinina gerando ascite e compressão extrínseca primária do diafragma.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Erro Fisiopatológico: O TEP é um evento vascular embólico intratorácico obstrutivo agudo, e não uma insuficiência renal crônica com ascite."
              },
              {
                title: "Termorregulação Ineficaz Isolada: Febre de origem hospitalar simples por exposição ambiental a correntes de ar sem nenhuma alteração pulmonar.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Subestimação Clínica: A taquicardia e a hipoxemia súbitas atestam comprometimento hemodinâmico vascular pulmonar grave."
              },
              {
                title: "Dentição Prejudicada: Dificuldade na mastigação de alimentos sólidos gerando cansaço muscular facial sem envolvimento cardiorrespiratório.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Diagnóstico Incoerente: Não guarda relação com a emergência tromboembólica pulmonar em curso."
              }
            ]
          }
        }
      ];
      const selected = variants[variantIndex % variants.length];
      return selected;
    }

    case "neurologia": {
      const variants = [
        // Variante 0: AVE Isquêmico em Janela Trombolítica
        {
          q1: {
            id: 1,
            category: "Priorização & Julgamento Imediato",
            questionStem: `O Paciente ${patientInitials}, admitido com déficit neurológico focal agudo (${userDiagnosis}) e ${vitalsText}, está dentro da janela terapêutica de 4,5 horas. Qual é o cuidado privativo do enfermeiro no manejo hemodinâmico pré-trombólise?`,
            attendingTip: "A pressão arterial deve ser rigorosamente mantida abaixo de 185/110 mmHg antes da infusão de trombolítico (rtPA) para evitar hemorragia intracraniana catastrófica.",
            options: [
              {
                title: "Monitorar a PA a cada 15 minutos, assegurar que os níveis estejam estritamente < 185/110 mmHg antes do trombolítico e puncionar dois acessos venosos periféricos antes da droga.",
                isCorrect: true,
                whyCorrect: "Correto! Níveis pressóricos ≥ 185/110 mmHg durante a trombólise elevam drasticamente o risco de transformação hemorrágica fatal. Punções vasculares invasivas devem ser feitas antes do rtPA.",
                whyDistractor: null
              },
              {
                title: "Administrar dose plena de heparina não fracionada em bolus simultaneamente com o trombolítico na primeira hora para acelerar a reperfusão.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "ERRO CRÍTICO FATAL: O uso de anticoagulantes ou antiagregantes plaquetários é formalmente contraindicado nas primeiras 24 horas após o rtPA pelo risco hemorrágico maciço."
              },
              {
                title: "Manter a cabeceira do leito elevada a 90 graus e restringir totalmente a ingestão de oxigênio mesmo se saturação cair abaixo de 90%.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Iatrogenia Postural e Hipóxica: Cabeceira muito alta reduz a perfusão da penumbra isquêmica; hipoxemia agrava a morte neuronal irreversível."
              },
              {
                title: "Puncionar punção lombar e passagem de sonda nasoentérica com guia metálico durante a infusão do trombolítico para agilizar a rotina da unidade.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Risco Hemorrágico Severo: Procedimentos invasivos não compressíveis durante a trombólise causam hematomas expansivos e hemorragias incontroláveis."
              }
            ]
          },
          q2: {
            id: 2,
            category: "Fisiopatologia & Diagnóstico Crítico",
            questionStem: `No quadro de ${userDiagnosis} do Paciente ${patientInitials}, qual mecanismo fisiopatológico fundamenta a preservação da 'Área de Penumbra Isquêmica' e norteia a assistência?`,
            attendingTip: "A área de penumbra consiste em tecido cerebral hipoperfundido, funcionalmente inativo mas reversível se o fluxo for restabelecido prontamente.",
            options: [
              {
                title: "Perfusão Tissular Cerebral Ineficaz: Oclusão arterial focal gerando núcleo necrótico cercado por área de penumbra viável que depende de pressão de perfusão cerebral e oxigenação adequadas.",
                isCorrect: true,
                whyCorrect: "Correto! O diagnóstico de Perfusão Tissular Cerebral Ineficaz orienta o controle da glicemia, temperatura e PA para evitar a expansão do infarto cerebral para a penumbra viável.",
                whyDistractor: null
              },
              {
                title: "Integridade da Membrana Mucosa Oral Prejudicada: Úlcera aftosa labial superficial que causa dormência facial reflexa sem nenhum déficit circulatório nas artérias cerebrais.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Erro Grosseiro de Diagnóstico: Subestimar um AVE isquêmico agudo como lesão aftosa impede o tratamento trombolítico no tempo hábil, gerando incapacidade permanente."
              },
              {
                title: "Volume de Líquidos Excessivo Puro: Excesso de líquido intra-articular no joelho que gera dor referida no córtex cerebral sem dano vascular.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Incompatibilidade Anatômica: O AVE é evento cerebrovascular encefálico isquêmico focal primário com perda de função motora e sensitiva contralaterais."
              },
              {
                title: "Desobstrução Ineficaz de Vias Aéreas Isolada: Presença exclusiva de rolha de cerúmen no conduto auditivo externo sem repercussão na fala ou força muscular.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Diagnóstico Incoerente: Os sintomas neurológicos decorrem da isquemia cortical e subcortical, e não de obstrução mecânica do ouvido."
              }
            ]
          }
        },
        // Variante 1: Delirium Agudo / Síndrome Confusional no Idoso
        {
          q1: {
            id: 1,
            category: "Priorização & Julgamento Imediato",
            questionStem: `O Paciente ${patientInitials}, admitido com ${userDiagnosis}, apresenta flutuação aguda do nível de consciência, agitação noturna, desorientação temporal e ${vitalsText}. Qual intervenção de enfermagem não-farmacológica é prioritária?`,
            attendingTip: "O manejo de primeira linha no delirium é ambiental e não farmacológico: reorientação, presença da família, adequação de luz e redução de ruídos.",
            options: [
              {
                title: "Implementar medidas de reorientação têmporo-espacial com relógios e iluminação adequada, favorecer a presença de familiar e evitar contenções físicas desnecessárias.",
                isCorrect: true,
                whyCorrect: "Correto! As diretrizes de geriatria e segurança do paciente priorizam a abordagem não-farmacológica no delirium; a presença de familiares e a iluminação circadiana reduzem a morbidade.",
                whyDistractor: null
              },
              {
                title: "Realizar contenção mecânica leito-tronco imediata com faixas rígidas e apagar todas as luzes do quarto para obrigar o paciente a permanecer imóvel no leito.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Prática Iatrogênica e Traumática: Contenção física no delirium aumenta a agitação psicomotora, eleva o risco de estrangulamento, trauma e lesões por fricção."
              },
              {
                title: "Administrar doses altas de benzodiazepínicos (Diazepam) por via venosa para sedar profundamente o paciente até o término do plantão.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Agravamento de Delirium: Benzodiazepínicos são gatilhos clássicos de piora e cronificação do delirium no idoso, com efeito paradoxal de agitação e depressão respiratória."
              },
              {
                title: "Isolar o paciente em quarto escuro sem estímulos verbais e suspender a oferta de óculos e aparelhos auditivos de uso habitual.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Privação Sensorial Iatrogênica: Retirar próteses visuais e auditivas agrava a desorientação e as alucinações perceptivas do idoso confuso."
              }
            ]
          },
          q2: {
            id: 2,
            category: "Fisiopatologia & Diagnóstico Crítico",
            questionStem: `Analisando a flutuação do estado mental no quadro de ${userDiagnosis} do Paciente ${patientInitials}, qual mecanismo fisiopatológico e diagnóstico de enfermagem direcionam o cuidado?`,
            attendingTip: "O delirium resulta de neuroinflamação sistêmica, estresse oxidativo e desequilíbrio colinérgico/dopaminérgico central.",
            options: [
              {
                title: "Confusão Mental Aguda: Disfunção transitória da neurotransmissão cerebral deflagrada por estresse biológico, privação de sono ou infecção subjacente, com início súbito e curso flutuante.",
                isCorrect: true,
                whyCorrect: "Correto! O diagnóstico de Confusão Mental Aguda NANDA-I diferencia o delirium reversível de quadros demenciais crônicos, orientando a identificação e tratamento do gatilho biológico.",
                whyDistractor: null
              },
              {
                title: "Déficit de Volume de Líquidos Isolado Sem Repercussão: Variação fisiológica insignificante da volemia que não guarda relação com a cognição humana.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Erro Clínico: Distúrbios hidroeletrolíticos e infecções são causas primárias frequentes de delirium no idoso hospitalizado."
              },
              {
                title: "Memória Prejudicada Crônica Pura: Demência avançada irreversível de início insidioso ao longo de décadas sem qualquer componente agudo flutuante.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Confusão Conceitual: O delirium tem instalação aguda (horas/dias) e flutuação circadiana, ao contrário da instalação progressiva e lenta da demência."
              },
              {
                title: "Processamento de Informação Perfeito: Estado de lucidez completa sem nenhuma alteração da atenção ou vigília do paciente.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Negação do Quadro Clínico: O paciente apresenta CAM positivo e desorientação evidentes no relato admissional."
              }
            ]
          }
        }
      ];
      const selected = variants[variantIndex % variants.length];
      return selected;
    }

    case "sepse": {
      const variants = [
        // Variante 0: Pacote da Primeira Hora (Golden Hour)
        {
          q1: {
            id: 1,
            category: "Priorização & Julgamento Imediato",
            questionStem: `O Paciente ${patientInitials} é avaliado na enfermaria com suspeita de Sepse e apresenta ${vitalsText}. Conforme as diretrizes do Surviving Sepsis Campaign e protocolos de segurança, qual intervenção do enfermeiro é prioritária na primeira hora?`,
            attendingTip: "A cada hora de atraso na administração do antimicrobiano adequado após o reconhecimento da sepse, a mortalidade sobe exponencialmente.",
            options: [
              {
                title: "Coletar duas amostras de hemoculturas de sítios distintos imediatamente e assegurar o início da antibioticoterapia prescrita dentro da primeira hora do reconhecimento.",
                isCorrect: true,
                whyCorrect: "Correto! A coleta de hemoculturas antes do antimicrobiano viabiliza a identificação do agente, e o antibiótico na 1ª hora (Golden Hour) reduz criticamente a mortalidade por choque séptico.",
                whyDistractor: null
              },
              {
                title: "Aguardar o resultado das hemoculturas e antibiograma laboratorial ao longo das próximas 24 a 48 horas para só então administrar a primeira dose de antibiótico.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Atraso Fatal: Postergar antimicrobianos à espera do crescimento bacteriano em cultura eleva drasticamente a taxa de letalidade por falência de múltiplos órgãos."
              },
              {
                title: "Iniciar infusão contínua de noradrenalina em cateter periférico fino antes de infundir qualquer volume cristaloide ou aferir nova pressão arterial média.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Iatrogenia Crítica: Vasopressores em acesso venoso periférico fino provocam necrose tecidual por extravasamento; devem ser precedidos por ressuscitação volêmica (30 mL/kg) se hipotensão."
              },
              {
                title: "Realizar banho de aspersão com água gelada imediato para reduzir a febre e suspender toda hidratação parenteral prescrita.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Conduta Equivocada: Banhos frios causam tremores musculares intensos, aumentando o consumo metabólico de oxigênio celular sem tratar a fonte infecciosa."
              }
            ]
          },
          q2: {
            id: 2,
            category: "Fisiopatologia & Diagnóstico Crítico",
            questionStem: `Considerando o quadro de ${userDiagnosis} no Paciente ${patientInitials} com taquicardia de ${fc} bpm e hipotensão, qual mecanismo fisiopatológico fundamenta o choque distributivo séptico?`,
            attendingTip: "A resposta imune desregulada deflagra tempestade de citocinas inflamatórias com vasodilatação patológica sistêmica e perda da barreira endotelial.",
            options: [
              {
                title: "Risco de Choque Séptico e Perfusão Tissular Prejudicada: Liberação desregulada de mediadores inflamatórios gerando vasodilatação periférica profunda, aumento da permeabilidade capilar e hipoperfusão celular.",
                isCorrect: true,
                whyCorrect: "Correto! O choque séptico é distributivo: há perda do tônus vascular periférico e extravasamento plasmático para o terceiro espaço, exigindo ressuscitação volêmica e monitoramento de lactato e diurese.",
                whyDistractor: null
              },
              {
                title: "Sobrecarga Volêmica Hipertensiva Pura: Retenção hídrica generalizada que eleva a resistência vascular periférica de forma descontrolada sem infecção.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Inversão Hemodinâmica: Na sepse ocorre vasoplegia com resistência vascular diminuída e hipotensão, e não sobrecarga hipertensiva."
              },
              {
                title: "Reação Alérgica Tipo I Isolada: Hipersensibilidade imediata a pólen ambiental sem proliferação bacteriana ou sepse de foco infeccioso.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Confusão Etiológica: O quadro decorre de disfunção orgânica ameaçadora à vida por infecção documentada, e não atopia alérgica ambiental pura."
              },
              {
                title: "Constipação Funcional Simples: Acúmulo fisiológico de fezes no cólon sem qualquer repercussão inflamatória ou hemodinâmica no organismo.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Subestimação Extrema: Sepse é emergência médica tempo-dependente com risco iminente de disfunção de múltiplos órgãos e morte."
              }
            ]
          }
        }
      ];
      const selected = variants[variantIndex % variants.length];
      return selected;
    }

    case "metabolico_endocrino": {
      const variants = [
        // Variante 0: Cetoacidose Diabética (CAD)
        {
          q1: {
            id: 1,
            category: "Priorização & Julgamento Imediato",
            questionStem: `O Paciente ${patientInitials}, com diagnóstico de ${userDiagnosis}, apresenta glicemia capilar crítica, respiração profunda de Kussmaul e ${vitalsText}. Qual intervenção hidroeletrolítica de enfermagem antecede a insulina regular intravenosa?`,
            attendingTip: "Na Cetoacidose Diabética, a expansão volêmica vigorosa com solução salina a 0,9% e a verificação do potássio sérico (K⁺ > 3.3 mEq/L) devem preceder a insulinoterapia.",
            options: [
              {
                title: "Iniciar expansão volêmica rápida com Solução Fisiológica a 0,9% intravenosa e verificar o nível de Potássio sérico antes de iniciar a infusão contínua de Insulina Regular.",
                isCorrect: true,
                whyCorrect: "Correto! A insulina desloca o potássio extracelular para dentro das células; infundir insulina com hipocalemia prévia pode deflagrar arritmias ventriculares fatais e parada cardíaca.",
                whyDistractor: null
              },
              {
                title: "Administrar imediatamente insulina regular em bolus intravenoso de 50 UI sem hidratação venosa prévia e sem checar eletrólitos séricos.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "ERRO CRÍTICO FATAL: Insulina em altas doses sem volume colapsa o leito vascular e induz hipocalemia letal com assistolia."
              },
              {
                title: "Administrar solução hipertônica de bicarbonato de sódio em infusão rápida como primeira conduta para todos os pacientes com CAD.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Iatrogenia Metabólica: Bicarbonato rotineiro sem indicação precisa causa acidose paradoxal no sistema nervoso central e hipocalemia severa."
              },
              {
                title: "Oferecer suco concentrado de frutas açucarado por via oral para acalmar a polidipsia e repor os estoques glicêmicos do paciente.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Conduta Agravante: Ofertar carboidratos simples em vigência de hiperglicemia extrema agrava a diurese osmótica e o coma hiperosmolar."
              }
            ]
          },
          q2: {
            id: 2,
            category: "Fisiopatologia & Diagnóstico Crítico",
            questionStem: `Na evolução de ${userDiagnosis} no Paciente ${patientInitials}, qual fundamento fisiopatológico explica a respiração de Kussmaul e orienta o diagnóstico de enfermagem prioritário?`,
            attendingTip: "A oxidação incompleta de ácidos graxos produz cetoácidos que deprimem o bicarbonato; a taquipneia profunda tenta eliminar CO2 como compensação respiratória.",
            options: [
              {
                title: "Déficit de Volume de Líquidos e Desequilíbrio Eletrolítico: Diurese osmótica maciça gerada pela glicosúria associada a acidose metabólica com hiato aniônico elevado por corpos cetônicos.",
                isCorrect: true,
                whyCorrect: "Correto! A carência de insulina força a lipólise e cetogênese gerando acidose metabólica; a hiperventilação de Kussmaul é a resposta compensatória respiratória para lavar CO2.",
                whyDistractor: null
              },
              {
                title: "Padrão Respiratório Ineficaz por Asma Alérgica: Broncoespasmo primário por ácaros domiciliares sem qualquer alteração do metabolismo dos carboidratos.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Confusão Diagnóstica: O padrão ruidoso e profundo é a respiração acidótica de Kussmaul, e não broncoespasmo asmático com sibilos."
              },
              {
                title: "Volume de Líquidos Excessivo Maciço: Hiperidratação sistêmica com anasarca e insuficiência renal anúrica primária.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Inversão Hemodinâmica: Na cetoacidose há desidratação severa (perda de 5 a 8 litros de água livre pela diurese osmótica), e não sobrecarga volêmica."
              },
              {
                title: "Fadiga Muscular Isolada Benigna: Cansaço rotineiro após esforço esportivo sem necessidade de controle laboratorial ou venóclise.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Subestimação de Emergência: A CAD não tratada evolui rapidamente para coma cetoacidótico, choque hipovolêmico e óbito."
              }
            ]
          }
        }
      ];
      const selected = variants[variantIndex % variants.length];
      return selected;
    }

    case "cirurgico_abdome": {
      const variants = [
        // Variante 0: Apendicite / Peritonite Aguda
        {
          q1: {
            id: 1,
            category: "Priorização & Julgamento Imediato",
            questionStem: `O Paciente ${patientInitials}, internado com quadro de ${userDiagnosis} e queixa de dor abdominal com ${vitalsText}, apresenta abdome em tábua e descompressão dolorosa (Blumberg positivo). Qual conduta imediata do enfermeiro é prioritária?`,
            attendingTip: "Sinais de peritonite e abdome cirúrgico iminente demandam jejum estrito para cirurgia de emergência e suspensão de qualquer estímulo entérico.",
            options: [
              {
                title: "Instituir jejum oral absoluto imediatamente, puncionar acesso venoso calibroso para hidratação/antibiótico e comunicar a equipe cirúrgica de urgência.",
                isCorrect: true,
                whyCorrect: "Correto! O abdome agudo peritonítico exige preparo imediato para laparotomia ou videolaparoscopia de urgência, jejum absoluto para anestesia e reposição volêmica precoce.",
                whyDistractor: null
              },
              {
                title: "Oferecer dieta sólida rica em fibras e administrar laxativo via oral para estimular a eliminação de fezes e aliviar a distensão.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "ERRO CRÍTICO FATAL: Laxativos aumentam a pressão intraluminal de alça inflamada e precipitam perfuração bacteriana com peritonite fecal catastrófica."
              },
              {
                title: "Aplicar compressas de bolsa térmica com água fervente diretamente sobre o quadrante doloroso para relaxar o peritônio inflamado.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Iatrogenia Grave: O calor local estimula hiperemia na víscera inflamada, acelerando necrose isquêmica tecidual e ruptura cavitária."
              },
              {
                title: "Orientar o paciente a realizar corridas pelo corredor do hospital para favorecer a motilidade gastrointestinal antes da consulta médica.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Conduta Agravante: O esforço físico agrava a dor peritonítica e pode precipitar síncope hemodinâmica."
              }
            ]
          },
          q2: {
            id: 2,
            category: "Fisiopatologia & Diagnóstico Crítico",
            questionStem: `Na evolução do abdome agudo peritonítico no Paciente ${patientInitials}, qual fundamento fisiopatológico explica a contratura involuntária da musculatura abdominal?`,
            attendingTip: "A irritação bacteriana ou química do peritônio parietal dispara arco reflexo espinhal motor com espasmo defensivo incontrolável da parede abdominal.",
            options: [
              {
                title: "Dor Aguda e Risco de Choque Séptico: Irritação do peritônio parietal por exsudato inflamatório ou secreção entérica deflagrando espasmo reflexo defensivo e risco de contaminação bacteriana cavitária.",
                isCorrect: true,
                whyCorrect: "Correto! O sinal de Blumberg e a rigidez abdominal atestam inflamação parietal transmural; o diagnóstico de Dor Aguda associado a Risco de Choque Séptico fundamenta o ato cirúrgico.",
                whyDistractor: null
              },
              {
                title: "Eliminação Intestinal Prejudicada Isolada: Constipação dietética benigna por baixa ingesta de frutas e verduras sem envolvimento peritoneal inflamatório.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Erro Diagnóstico Grave: Descartar peritonite bacteriana como simples constipação atrasa a cirurgia curativa e leva a sepse abdominal refratária."
              },
              {
                title: "Padrão Respiratório Ineficaz Primário: Crise de hiperventilação psicogênica pura sem substrato patológico na cavidade abdominal.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Confusão Clínica: A taquipneia no abdome cirúrgico é superficial para evitar o atrito doloroso diafragmático com as vísceras inflamadas."
              },
              {
                title: "Integridade Cutânea Comprometida: Escoriação dérmica leve na cicatriz umbilical sem penetração muscular ou visceral interna.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Incompatibilidade Anatômica: A lesão encontra-se no espaço peritoneal intra-abdominal profundo, e não na pele externa."
              }
            ]
          }
        }
      ];
      const selected = variants[variantIndex % variants.length];
      return selected;
    }

    case "nefrologia": {
      const variants = [
        // Variante 0: Injúria Renal Aguda / Hipercalemia Crítica
        {
          q1: {
            id: 1,
            category: "Priorização & Julgamento Imediato",
            questionStem: `O Paciente ${patientInitials}, com ${userDiagnosis}, apresenta oligúria severa, ${vitalsText} e Potássio sérico (K⁺) de 6,8 mEq/L com ondas T apiculadas no monitor. Qual conduta de enfermagem e terapêutica imediata estabiliza a membrana cardíaca?`,
            attendingTip: "Na hipercalemia severa com alterações eletrocardiográficas, a administração imediata de Gluconato de Cálcio a 10% IV estabiliza o potencial de membrana dos cardiomiócitos sem alterar o K+ sérico.",
            options: [
              {
                title: "Monitorização cardíaca contínua ininterrupta, preparo imediato de Gluconato de Cálcio 10% intravenoso para estabilização da membrana miocárdica e suspensão de drogas espoliadoras.",
                isCorrect: true,
                whyCorrect: "Correto! O Gluconato de Cálcio antagoniza a toxicidade cardíaca do potássio elevado em 1 a 3 minutos, prevenindo fibrilação ventricular e assistolia iminente.",
                whyDistractor: null
              },
              {
                title: "Infundir solução de Cloreto de Potássio a 10% em bolus venoso direto para testar a permeabilidade do acesso venoso periférico.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "ERRO CRÍTICO FATAL: Cloreto de potássio em bolus direto é tóxico e causa parada cardíaca instantânea em assistolia irreversível."
              },
              {
                title: "Administrar suplemento mineral de potássio por via oral com água para compensar a oligúria apresentada pelo paciente.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Agravamento Crítico: Adicionar potássio a paciente em hipercalemia severa acelera a parada cardiorrespiratória."
              },
              {
                title: "Encaminhar o paciente para caminhar na rampa do hospital para estimular a eliminação transpiratória de eletrólitos pela pele.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Negligência e Risco Extremo: O paciente com hipercalemia e alterações no ECG está em risco iminente de colapso circulatório súbito."
              }
            ]
          },
          q2: {
            id: 2,
            category: "Fisiopatologia & Diagnóstico Crítico",
            questionStem: `Correlacionando a retenção nitrogenada e a hipercalemia no quadro de ${userDiagnosis} do Paciente ${patientInitials}, qual fundamento fisiopatológico norteia o plano assistencial de enfermagem?`,
            attendingTip: "A queda abrupta da taxa de filtração glomerular impede a excreção renal de potássio, hidrogênio e metabólitos tóxicos.",
            options: [
              {
                title: "Eliminação Urinária Prejudicada e Risco de Desequilíbrio Eletrolítico: Perda aguda da taxa de filtração glomerular com retenção de potássio, escórias nitrogenadas e risco iminente de arritmias ventriculares fatais.",
                isCorrect: true,
                whyCorrect: "Correto! O diagnóstico orienta o balanço hídrico rigoroso, restrição estrita de potássio dietético/parenteral e vigilância do débito urinário horário visando terapia dialítica se necessário.",
                whyDistractor: null
              },
              {
                title: "Padrão Respiratório Ineficaz Isolado: Hipoventilação alveolar pura por sonolência sem nenhum envolvimento da função renal ou dos eletrólitos séricos.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Erro Fisiopatológico: O dano primário reside na filtração glomerular renal com repercussão eletrolítica cardiovascular crítica."
              },
              {
                title: "Déficit de Volume de Líquidos Primário: Desidratação transitória simples tratada exclusivamente com ingestão de água mineral sem necessidade de exames.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Subestimação Grave: Em IRA oligúrica com hipercalemia, a administração indiscriminada de líquidos pode precipitar edema agudo de pulmão hipertensivo."
              },
              {
                title: "Integridade da Membrana Mucosa Prejudicada: Ressecamento labial simples sem correlação com a homeostase corpórea ou ritmos cardíacos.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Inversão de Prioridades: A toxicidade do potássio no miocárdio é risco vital imediato que sobrepuja queixas mucosas menores."
              }
            ]
          }
        }
      ];
      const selected = variants[variantIndex % variants.length];
      return selected;
    }

    default: {
      // clinica_geral / casos gerais
      const variants = [
        // Variante 0: Deterioração Hemodinâmica & Escore MEWS
        {
          q1: {
            id: 1,
            category: "Priorização & Julgamento Imediato",
            questionStem: `Ao realizar a primeira avaliação do turno no leito do Paciente ${patientInitials}, admitido com diagnóstico de ${userDiagnosis} e apresentando ${vitalsText}, qual conduta privativa e imediata de enfermagem deve anteceder as demais intervenções?`,
            attendingTip: "A verificação sistematizada dos sinais vitais e a correlação clínica com a queixa permitem identificar deterioração clínica precoce pelo escore MEWS.",
            options: [
              {
                title: "Realizar exame físico direcionado, correlacionar os parâmetros hemodinâmicos alterados com a queixa do paciente e assegurar posicionamento seguro no leito com grades elevadas.",
                isCorrect: true,
                whyCorrect: "Correto! O exame físico à beira-leito integrado aos parâmetros vitais permite estratificar a gravidade clínica e planejar intervenções de enfermagem imediatas com respaldo do COFEN nº 736/2024.",
                whyDistractor: null
              },
              {
                title: "Priorizar a punção de novo acesso venoso periférico calibroso antes de aferir os sinais vitais basais ou verificar o nível de consciência do paciente admitido.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Inversão de Prioridades: A avaliação clínica do estado de consciência e dos sinais vitais precede punções venosas desnecessárias."
              },
              {
                title: "Administrar analgesia intravenosa em dose plena imediatamente para alívio dos sintomas sem realizar o exame físico segmentar prévio e sem checar a pressão arterial.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Prática Iatrogênica: Administrar analgésicos maiores sem avaliação hemodinâmica prévia pode precipitar hipotensão severa e mascarar sinais de abdome agudo."
              },
              {
                title: "Instalar suporte de oxigenoterapia em alto fluxo sob máscara com reservatório a 15 L/min sem avaliar previamente a mecânica ventilatória ou saturação basal.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Iatrogenia por Oxigênio: Oxigenoterapia em alto fluxo sem indicação oximétrica comprovada causa vasoconstrição coronariana reflexa e atelectasias por absorção."
              }
            ]
          },
          q2: {
            id: 2,
            category: "Fisiopatologia & Diagnóstico Crítico",
            questionStem: `Analisando a evolução do quadro de ${userDiagnosis} no Paciente ${patientInitials} frente aos sinais vitais aferidos, qual hipótese diagnóstica de enfermagem fundamenta a prioridade fisiopatológica e o plano assistencial?`,
            attendingTip: "Identificar se a prioridade reside no padrão hemodinâmico, respiratório ou metabólico depende da resposta humana mais ameaçadora à homeostase.",
            options: [
              {
                title: "Risco de Instabilidade Hemodinâmica e Resposta Inflamatória Sistêmica: Descompensação da homeostase corporal demandando monitoramento sequencial dos parâmetros vitais, balanço hídrico rigoroso e vigilância.",
                isCorrect: true,
                whyCorrect: "Correto! O reconhecimento das alterações hemodinâmicas precoces viabiliza medidas preventivas antes do colapso de órgãos-alvo, alinhado à taxonomia NANDA-I e à Resolução COFEN nº 736/2024.",
                whyDistractor: null
              },
              {
                title: "Intolerância à Atividade Fisiológica Benigna: Fadiga muscular passageira esperada sem necessidade de controle rigoroso de sinais vitais ou vigilância da equipe multidisciplinar.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Subestimação Clínica: Ignorar alterações de sinais vitais em paciente hospitalizado atrasa o reconhecimento de deterioração clínica e choque."
              },
              {
                title: "Sobrecarga Volêmica Maciça Pura: Retenção hídrica primária com anasarca requerendo restrição hídrica drástica e diurético em bolus antes de qualquer investigação hemodinâmica.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Erro Fisiopatológico: A conduta desidratante sem confirmação de congestão volêmica efetiva pode precipitar choque hipovolêmico iatrogênico."
              },
              {
                title: "Padrão de Sono Prejudicado Isolado: Cansaço unicamente associado a ruídos ambientais noturnos sem qualquer repercussão inflamatória, hemodinâmica ou metabólica no organismo.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Simplificação Inadequada: Parâmetros vitais alterados refletem estresse biológico e resposta autonômica real que não pode ser tratada como simples queixa de insônia."
              }
            ]
          }
        },
        // Variante 1: Desidratação / Hipovolemia / Balanço Hídrico
        {
          q1: {
            id: 1,
            category: "Priorização & Julgamento Imediato",
            questionStem: `Durante a assistência de enfermagem ao Paciente ${patientInitials} (${userDiagnosis}), observa-se mucosas desidratadas, turgor cutâneo diminuído e ${vitalsText}. Qual intervenção sistematizada de enfermagem garante a segurança hídrica e postural do paciente?`,
            attendingTip: "A desidratação em pacientes hospitalizados predispõe à hipotensão ortostática, síncope e lesão renal pré-renal se não manejada com balanço hídrico rigoroso.",
            options: [
              {
                title: "Instituir registro de balanço hídrico rigoroso, verificar a pressão arterial em decúbito e ortostatismo (pesquisa de hipotensão postural) e auxiliar toda mobilização do leito.",
                isCorrect: true,
                whyCorrect: "Correto! O balanço hídrico quantifica as perdas e ganhos, enquanto a pesquisa de hipotensão ortostática e a assistência na deambulação previnem quedas graves por síncope hipovolêmica.",
                whyDistractor: null
              },
              {
                title: "Infundir 2.000 mL de água destilada pura intravenosa em bolus para acelerar a reidratação celular dos tecidos.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "ERRO CRÍTICO FATAL: Água destilada intravenosa não é isotônica; sua infusão direta causa hemólise intravascular maciça, insuficiência renal aguda e choque fatal."
              },
              {
                title: "Suspender totalmente a ingesta hídrica oral e manter o paciente em jejum estrito para evitar episódios de vômito.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Conduta Agravante: Proibir líquidos orais em paciente desidratado e capaz de ingerir agrava a hipovolemia e a injúria renal pré-renal."
              },
              {
                title: "Encaminhar o paciente desacompanhado para o banheiro da enfermaria para realizar banho de imersão quente prolongado.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Risco Crítico de Queda: Banhos quentes provocam vasodilatação periférica que, somada à hipovolemia, deflagra síncope imediata e trauma cranioencefálico."
              }
            ]
          },
          q2: {
            id: 2,
            category: "Fisiopatologia & Diagnóstico Crítico",
            questionStem: `Frente aos achados de desidratação e parâmetros vitais do Paciente ${patientInitials} no manejo de ${userDiagnosis}, qual diagnóstico NANDA-I fundamenta o raciocínio clínico da SAE?`,
            attendingTip: "A perda hídrica sem reposição proporcional diminui o volume intravascular circulante, ativando o sistema renina-angiotensina-aldosterona.",
            options: [
              {
                title: "Volume de Líquidos Deficiente: Perda ativa de fluidos corporais associada a ingesta insuficiente, evidenciada por ressecamento de mucosas, taquicardia compensatória e turgor reduzido.",
                isCorrect: true,
                whyCorrect: "Correto! O diagnóstico de Volume de Líquidos Deficiente guia a meta de restaurar a homeostase volêmica através de hidratação orientada e prevenção de choque hipovolêmico.",
                whyDistractor: null
              },
              {
                title: "Sobrecarga Circulatória Maciça: Retenção hídrica severa com anasarca, ingurgitamento jugular patológico e estertoração em ápices pulmonares.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Incompatibilidade Semiológica: Os achados físicos indicam desidratação e perda volêmica, sendo o oposto de hipervolemia congestiva."
              },
              {
                title: "Mobilidade Física Prejudicada Secundária a Fratura: Perda total da capacidade motora por fratura óssea sem repercussão hidroeletrolítica.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Incompatibilidade de Queixa: O caso clínico versa sobre quadro clínico e metabólico de desidratação, e não trauma ortopédico."
              },
              {
                title: "Nutrição Desequilibrada: Ingestão Maior que as Necessidades Corporais: Obesidade hipercalórica simples sem relação com o balanço hídrico agudo.",
                isCorrect: false,
                whyCorrect: null,
                whyDistractor: "Diagnóstico Incoerente: Não responde à necessidade clínica premente de reposição hidroeletrolítica e prevenção de instabilidade postural."
              }
            ]
          }
        }
      ];
      const selected = variants[variantIndex % variants.length];
      return selected;
    }
  }
}
