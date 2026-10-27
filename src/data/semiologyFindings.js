/**
 * semiologyFindings.js
 * Banco de dados propedêutico para Exame Físico Guiado Interativo à Beira-Leito.
 * Padrão Duolingo: No mínimo 4 alternativas (A, B, C, D) por parâmetro clínico,
 * distratores de alta relevância formativa e suporte a embaralhamento dinâmico (Fisher-Yates)
 * para eliminar qualquer vício posicional de resposta.
 */

export const SEMIOLOGY_KNOWLEDGE_BASE = {
  tiragem: {
    title: "Inspeção Dinâmica da Mecânica Ventilatória",
    maneuver: "Você se posiciona à beira-leito, eleva a cabeceira a 45° e expõe o tórax do paciente para avaliar a excursão respiratória durante a fase inspiratória.",
    prompt: "Qual padrão semiológico você identifica na dinâmica respiratória do paciente?",
    options: [
      {
        id: "opt_1",
        label: "Expansibilidade torácica simétrica em repouso, sem retração intercostal ou recrutamento de musculatura acessória cervical.",
        isCorrect: false,
        feedback: "Incorreto: O paciente está taquipneico (FR > 20 irpm) e hipoxêmico, o que fisiologicamente já exige sobrecarga compensatória da musculatura respiratória."
      },
      {
        id: "opt_2",
        label: "Tiragem intercostal baixa presente com retração subcostal e discreto batimento de asa de nariz aos esforços inspiratórios.",
        isCorrect: true,
        feedback: "Correto! O recrutamento de músculos intercostais e o batimento de asa nasal sinalizam aumento acentuado do trabalho respiratório decorrente de secreção alveolar e consolidação inflamatória."
      },
      {
        id: "opt_3",
        label: "Padrão de Kussmaul com respirações profundas, ruidosas e rápidas, sem tiragem ou estridor laríngeo.",
        isCorrect: false,
        feedback: "Incorreto: A respiração de Kussmaul é típica de acidose metabólica grave (como cetoacidose diabética ou uremia), não de consolidação infecciosa pulmonar localizada."
      },
      {
        id: "opt_4",
        label: "Padrão de Cheyne-Stokes com períodos alternados de hiperpneia crescente seguidos de apneia central prolongada.",
        isCorrect: false,
        feedback: "Incorreto: A respiração de Cheyne-Stokes decorre de lesão neurológica central ou insuficiência cardíaca crônica terminal com retardo circulatório cerebral, ausente neste quadro agudo."
      }
    ],
    pearl: "A tiragem intercostal e o batimento de asa nasal são sinais precoces de iminência de fadiga diafragmática. A intervenção com cabeceira elevada e oxigenoterapia precoce previne a intubação de emergência.",
    resultingItem: {
      label: "Tiragem Intercostal",
      value: "Presente (retração baixa + batimento de asa nasal)",
      status: "critical"
    }
  },

  aspecto_secrecao: {
    title: "Caracterização Semiológica da Expectoração",
    maneuver: "Você solicita ao paciente que tussa profundamente ou inspeciona o conteúdo expelido em cuba rim durante a higiene brônquica.",
    prompt: "Qual é o aspecto macroscópico da secreção traqueobrônquica observada?",
    options: [
      {
        id: "opt_1",
        label: "Expectoração serosa, translúcida, fluida e sem grumos de leucócitos ou odor.",
        isCorrect: false,
        feedback: "Incorreto: A expectoração serosa translúcida é compatível com irritação alérgica ou transudato incipiente, incompatível com febre e estertores localizados em base."
      },
      {
        id: "opt_2",
        label: "Expectoração mucopurulenta espessa, coloração amarelada-esverdeada em quantidade moderada.",
        isCorrect: true,
        feedback: "Correto! A secreção mucopurulenta verde-amarelada reflete migração maciça de neutrófilos e lise celular bacteriana (pneumonia comunitária), orientando a coleta imediata de antibiograma."
      },
      {
        id: "opt_3",
        label: "Hemoptise volumosa com sangue vivo rutilante e coágulos obstrutivos.",
        isCorrect: false,
        feedback: "Incorreto: A hemoptise maciça indica lesão vascular brônquica grave (caverna tuberculosa, neoplasia ou embolia pulmonar extensa), não presente neste quadro inicial."
      },
      {
        id: "opt_4",
        label: "Expectoração rósea, espumosa, abundante e fluida com saída pelas vias aéreas.",
        isCorrect: false,
        feedback: "Incorreto: Escarro róseo espumoso é achado patognomônico de edema agudo de pulmão cardiogênico com transudação capilar maciça, e não de secreção infecciosa espessa."
      }
    ],
    pearl: "A coloração mucopurulenta decorre da enzima mieloperoxidase dos neutrófilos em combate à infecção bacteriana. O registro da viscosidade e cor é indispensável para monitorar a resposta ao antimicrobiano.",
    resultingItem: {
      label: "Expectoração",
      value: "Mucopurulenta, amarelo-esverdeada, espessa",
      status: "altered"
    }
  },

  glasgow: {
    title: "Avaliação do Escore de Coma de Glasgow com Reatividade Pupilar (Glasgow-P)",
    maneuver: "Você se aproxima do leito, chama o paciente pelo nome, testa o diálogo e solicita que aperte a sua mão, avaliando em seguida o reflexo fotomotor.",
    prompt: "Qual combinação de respostas neurológicas você pontua?",
    options: [
      {
        id: "opt_1",
        label: "Abertura ocular espontânea (4), resposta verbal orientada (5), obedece comandos motores (6), pupilas fotorreagentes (-0). Total: 15 pontos.",
        isCorrect: false,
        feedback: "Incorreto: O paciente tem histórico de flutuação e sonolência, com desatenção evidente na triagem matutina, impossibilitando escore 15/15 espontâneo."
      },
      {
        id: "opt_2",
        label: "Abertura ocular ao chamado verbal (3), resposta verbal desorientada e confusa (4), obedece comandos (6), pupilas fotorreagentes (-0). Total: 13 pontos.",
        isCorrect: true,
        feedback: "Correto! Glasgow 13 com perda na orientação verbal reflete delirium flutuante sem rebaixamento comatoso, exigindo proteção contra quedas e reavaliação periódica."
      },
      {
        id: "opt_3",
        label: "Abertura ocular à dor (2), sons incompreensíveis (2), flexão anormal/decorticação (3), pupilas arreativas (-2). Total: 5 pontos.",
        isCorrect: false,
        feedback: "Incorreto: Postura de decorticação com rebaixamento grave a 5 pontos sinaliza herniação cerebral encefálica catastrófica, incompatível com o quadro da enfermaria."
      },
      {
        id: "opt_4",
        label: "Sem abertura ocular (1), nenhuma resposta verbal (1), extensão anormal/descerebração (2), pupilas reagentes (-0). Total: 4 pontos.",
        isCorrect: false,
        feedback: "Incorreto: Padrão comatoso profundo compatível com lesão grave de tronco encefálico (descerebração), não condizente com paciente consciente sob chamada verbal."
      }
    ],
    pearl: "A perda na resposta verbal (4/5) em paciente com CAM positivo é a chave para identificar delirium. A aplicação seriada da escala detecta precocemente a piora do sensório.",
    resultingItem: {
      label: "Escala Glasgow-P",
      value: "13 pts (AO: 3, RV: 4, RM: 6, Pupilas: -0)",
      status: "altered"
    }
  },

  forca_motora: {
    title: "Exame de Força Muscular e Simetria Facial",
    maneuver: "Você solicita que o paciente sorria, mostre os dentes e aperte as suas mãos simultaneamente com a força máxima.",
    prompt: "Qual achado semiológico do sistema neuromuscular é verificado?",
    options: [
      {
        id: "opt_1",
        label: "Força muscular grau 5/5 simétrica nos quatro membros, sem desvio de rima labial ou apagamento do sulco nasogeniano.",
        isCorrect: true,
        feedback: "Correto! A força simétrica e a ausência de paresia facial afastam déficit focal agudo (como AVC isquêmico), direcionando o raciocínio para delirium metabólico ou pós-operatório reversível."
      },
      {
        id: "opt_2",
        label: "Hemiplegia flácida em dimídio direito com desvio acentuado da rima labial para a esquerda.",
        isCorrect: false,
        feedback: "Incorreto: A presença de hemiplegia e desvio de rima indicaria síndrome piramidal por AVC isquêmico agudo extenso com indicação de protocolo de trombólise imediato."
      },
      {
        id: "opt_3",
        label: "Fraqueza distal isolada em membro inferior direito com anestesia em bota, sem repercussão proximal.",
        isCorrect: false,
        feedback: "Incorreto: Padrão típico de polineuropatia periférica diabética crônica, sem relação com a queixa neurológica flutuante aguda pós-operatória."
      },
      {
        id: "opt_4",
        label: "Tetraparesia flácida arrefléxica ascendente com perda de reflexos miotáticos profundos em membros inferiores.",
        isCorrect: false,
        feedback: "Incorreto: Este padrão de paralisia flácida simétrica e ascendente sugere Síndrome de Guillain-Barré, descompassado com o histórico clínico avaliado."
      }
    ],
    pearl: "A constatação de força simétrica e ausência de assimetria facial é indispensável para tranquilizar a equipe quanto a eventos vasculares focais (AVC), mantendo o foco na investigação de gatilhos clínicos do delirium.",
    resultingItem: {
      label: "Força Motora & Face",
      value: "Grau 5/5 simétrico, sem assimetria facial",
      status: "normal"
    }
  },

  turgencia_jugular: {
    title: "Inspeção Venosa Cervical a 45° (Turgência Jugular)",
    maneuver: "Você posiciona a cabeceira em inclinação exata de 45°, pede ao paciente para lateralizar suavemente a cabeça para a esquerda e inspeciona o trajeto da veia jugular interna direita com iluminação tangencial.",
    prompt: "O que você visualiza no pulso venoso cervical do paciente cardiopata?",
    options: [
      {
        id: "opt_1",
        label: "Ingurgitamento jugular patológico evidente com oscilação pulsátil a mais de 4 cm acima do ângulo esternal e refluxo hepatojugular positivo.",
        isCorrect: true,
        feedback: "Correto! A turgência jugular a 45° com refluxo hepatojugular positivo reflete hipertensão venosa central e sobrecarga de câmaras direitas por insuficiência cardíaca congestiva descompensada."
      },
      {
        id: "opt_2",
        label: "Ausência total de pulsações venosas, veias jugulares colabadas e colapsadas mesmo com compressão no quadrante superior direito.",
        isCorrect: false,
        feedback: "Incorreto: Jugulares colabadas indicam depleção intravascular e hipovolemia severa, o oposto do paciente hipertenso com edema 3+/4+ e ganho ponderal."
      },
      {
        id: "opt_3",
        label: "Sopro carotídeo sistólico audível na bifurcação carotídea sem pulsação venosa superficial.",
        isCorrect: false,
        feedback: "Incorreto: O sopro carotídeo é achado arterial de estenose aterosclerótica, e não avaliação do pulso venoso de retorno ao átrio direito."
      },
      {
        id: "opt_4",
        label: "Pulso jugular unidirecional de baixa frequência e colapso inspiratório completo imediato.",
        isCorrect: false,
        feedback: "Incorreto: O colapso inspiratório total do pulso venoso cervical reflete complacência venosa normal sem congestão sistêmica."
      }
    ],
    pearl: "A turgência jugular a 45° é o marcador físico mais confiável de sobrecarga volêmica à beira-leito. Indica que qualquer reposição líquida intravenosa causará piora imediata da congestão pulmonar.",
    resultingItem: {
      label: "Turgência Jugular",
      value: "Patológica a 45° com refluxo hepatojugular (+)",
      status: "critical"
    }
  },

  tec: {
    title: "Avaliação da Perfusão Periférica (Tempo de Enchimento Capilar)",
    maneuver: "Você pressiona a polpa digital do dedo indicador do paciente durante 5 segundos até o branqueamento tecidual e cronometra o tempo de retorno da coloração normal.",
    prompt: "Qual o tempo de reperfusão microvascular constatado?",
    options: [
      {
        id: "opt_1",
        label: "Reperfusão rápida em 1,5 segundos (TEC menor que 2 segundos), extremidades aquecidas e pulsos radiais cheios.",
        isCorrect: true,
        feedback: "Correto! O TEC menor que 2 segundos demonstra que, apesar da hipertensão e do edema periférico, o paciente ainda não se encontra em baixo débito com vasoconstrição compensatória periférica severa."
      },
      {
        id: "opt_2",
        label: "Tempo de enchimento capilar lentificado superior a 4,5 segundos, acompanhado de extremidades frias e livedo reticular nos joelhos.",
        isCorrect: false,
        feedback: "Incorreto: TEC > 4,5s com livedo sinaliza choque descompensado com hipoperfusão grave e acidose láctica iminente, exigindo aminas vasoativas imediatas."
      },
      {
        id: "opt_3",
        label: "Ausência total de pulso e enchimento capilar impossibilitado por cianose periférica fixa irreversível.",
        isCorrect: false,
        feedback: "Incorreto: Cianose fixa com TEC ausente indica isquemia arterial aguda grave ou necrose tecidual periférica, ausente no caso."
      },
      {
        id: "opt_4",
        label: "Enchimento capilar instantâneo inferior a 0,3 segundo com rubor difuso associado a pulso amplo martelo d'água.",
        isCorrect: false,
        feedback: "Incorreto: TEC hiperdinâmico ultrarrápido com pulso célere ocorre em choque distributivo hiperdinâmico (sepse inicial) ou regurgitação aórtica severa."
      }
    ],
    pearl: "O TEC é um parâmetro hemodinâmico não invasivo de alta sensibilidade para estratificar a gravidade da perfusão sistêmica. Sua normalidade (< 2s) confirma estabilidade tecidual periférica.",
    resultingItem: {
      label: "Enchimento Capilar (TEC)",
      value: "1,5 segundos (perfusão tecidual preservada)",
      status: "normal"
    }
  },

  glicemia: {
    title: "Glicemia Capilar (HGT) à Beira-Leito",
    maneuver: "Você realiza a desinfecção da face lateral da polpa digital com álcool a 70%, aguarda secagem completa e realiza punção com lanceta retrátil estéril, desprezando a primeira gota e aplicando a segunda gota na fita reagente do glicosímetro.",
    prompt: "Qual valor e interpretação clínica você obtém no glicosímetro?",
    options: [
      {
        id: "opt_1",
        label: "HGT de 54 mg/dL — Hipoglicemia severa que exige bólus imediato de glicose hipertônica a 50%.",
        isCorrect: false,
        feedback: "Incorreto: Hipoglicemia causaria rebaixamento agudo do sensório, sudorese fria profusa e taquicardia reflexa, achados ausentes no quadro atual."
      },
      {
        id: "opt_2",
        label: "HGT de 148 mg/dL — Hiperglicemia pós-prandial moderada compatível com resposta ao estresse inflamatório agudo.",
        isCorrect: true,
        feedback: "Correto! O valor de 148 mg/dL reflete elevação glicêmica reacional ao estresse fisiológico (cortisol e adrenalina), necessitando monitoramento seriado sem insulina rápida de urgência."
      },
      {
        id: "opt_3",
        label: "HGT de 480 mg/dL — Hiperglicemia crítica com risco iminente de cetoacidose ou estado hiperosmolar hiperglicêmico.",
        isCorrect: false,
        feedback: "Incorreto: Glicemia > 400 mg/dL exigiria protocolo institucional de bomba de infusão contínua de insulina regular e hidratação vigorosa imediata."
      },
      {
        id: "opt_4",
        label: "HGT de 85 mg/dL — Glicemia basal estritamente em jejum, sem qualquer alteração metabólica.",
        isCorrect: false,
        feedback: "Incorreto: Pacientes em admissão hospitalar aguda com dor e estresse fisiológico raramente mantêm glicemia de jejum estrita de 85 mg/dL sem resposta glicídica."
      }
    ],
    pearl: "A hiperglicemia de estresse é frequente em infecções agudas e internações. A antissepsia deve secar completamente antes da punção para que o álcool residual não altere quimicamente o valor da fita.",
    resultingItem: {
      label: "Glicemia Capilar",
      value: "148 mg/dL (Hiperglicemia leve por estresse inflamatório)",
      status: "altered"
    }
  },

  alergias: {
    title: "Investigação Detalhada de Alergias e Hipersensibilidades",
    maneuver: "Você entrevista detalhadamente o paciente e seu acompanhante, revisa o histórico prévio de internações, checa prontuário e inspeciona a colocação da pulseira de identificação de alergia.",
    prompt: "Qual é o status de segurança identificado na investigação de alergias?",
    options: [
      {
        id: "opt_1",
        label: "Alergia grave conhecida e confirmada a Penicilinas e Derivados com histórico de anafilaxia prévia.",
        isCorrect: false,
        feedback: "Incorreto: Não há histórico registrado ou relato familiar de hipersensibilidade prévia a antibióticos beta-lactâmicos."
      },
      {
        id: "opt_2",
        label: "Nega alergias medicamentosas, alimentares ou a látex. Ausência de reações adversas conhecidas e pulseira verde de identificação checada.",
        isCorrect: true,
        feedback: "Correto! A confirmação ativa e documentada da ausência de histórico alérgico autoriza a administração segura das medicações prescritas conforme o protocolo de Metas Internacionais de Segurança do Paciente."
      },
      {
        id: "opt_3",
        label: "Hipersensibilidade documentada a anti-inflamatórios não esteroidais (AINEs) com broncoespasmo prévio.",
        isCorrect: false,
        feedback: "Incorreto: O paciente relata uso esporádico prévio de analgésicos e anti-inflamatórios orais comuns sem qualquer intercorrência respiratória ou cutânea."
      },
      {
        id: "opt_4",
        label: "Alergia de contato grave a fita adesiva microporosa com dermatite vesicante disseminada.",
        isCorrect: false,
        feedback: "Incorreto: Não foi observada ou relatada qualquer reação tópica de dermatite de contato em curativos ou fixações prévias."
      }
    ],
    pearl: "A investigação ativa de alergias no momento da admissão é barreira fundamental da Meta 1 e Meta 3 de Segurança do Paciente. Nunca presuma que 'não refere' no prontuário signifique ausência de alergia sem confirmação direta.",
    resultingItem: {
      label: "Alergias & Hipersensibilidade",
      value: "Nega histórico de alergias medicamentosas ou látex (Checado e Documentado)",
      status: "normal"
    }
  },

  pulsos: {
    title: "Palpação de Pulsos Periféricos e Perfusão Distal",
    maneuver: "Você realiza a palpação bimanual simultânea dos pulsos radiais, pediosos e tibiais posteriores, analisando frequência, ritmo, amplitude (escala de 0 a 4+) e simetria bilateral.",
    prompt: "Qual característica semiológica dos pulsos arteriais periféricos é constatada?",
    options: [
      {
        id: "opt_1",
        label: "Pulsos radiais e pediosos cheios (+3/+4), rítmicos, simétricos bilateralmente e com boa amplitude de onda.",
        isCorrect: true,
        feedback: "Correto! Pulsos periféricos amplos e simétricos indicam volemia preservada, débito cardíaco satisfatório e ausência de oclusão arterial periférica aguda."
      },
      {
        id: "opt_2",
        label: "Pulsos periféricos filiformes (+1/+4), taquisfigmia acentuada e assimetria entre membros inferiores.",
        isCorrect: false,
        feedback: "Incorreto: Pulsos filiformes seriam encontrados em choque hipovolêmico ou cardiogênico severo com colapso circulatório, o que não condiz com a hemodinâmica compensada."
      },
      {
        id: "opt_3",
        label: "Pulsos distais ausentes em membro inferior esquerdo com palidez cutânea e frialdade localizada.",
        isCorrect: false,
        feedback: "Incorreto: A ausência unilateral de pulso distal caracterizaria trombose arterial aguda (6 Ps de Pratt), um quadro de urgência cirúrgica vascular não presente."
      },
      {
        id: "opt_4",
        label: "Pulso paradoxal com queda acentuada da amplitude de pulso superior a 15 mmHg durante a inspiração espontânea.",
        isCorrect: false,
        feedback: "Incorreto: O pulso paradoxal clássico indica tamponamento cardíaco agudo, crise asmática hipeinsuflativa gravíssima ou pericardite constritiva."
      }
    ],
    pearl: "A palpação simétrica e comparativa de pulsos previne diagnósticos errôneos de hipoperfusão sistêmica quando na verdade há variação anatômica ou ateromatose segmentar.",
    resultingItem: {
      label: "Pulsos Periféricos",
      value: "Cheios, rítmicos e simétricos bilateralmente (+3/+4)",
      status: "normal"
    }
  },

  braden: {
    title: "Aplicação da Escala Preditiva de Braden para LPP",
    maneuver: "Você avalia sistematicamente os 6 subfatores de risco preditivo da Escala de Braden: percepção sensorial, umidade, atividade, mobilidade, nutrição e fricção/cisalhamento.",
    prompt: "Qual é a pontuação total da Escala de Braden e a respectiva estratificação de risco?",
    options: [
      {
        id: "opt_1",
        label: "Braden = 8 pontos (Risco Altíssimo de Lesão por Pressão com indicação de colchão de ar alternado).",
        isCorrect: false,
        feedback: "Incorreto: 8 pontos representa paciente com paralisia total, completamente imóvel, inconsciente e com nutrição severamente deficitária."
      },
      {
        id: "opt_2",
        label: "Braden = 14 pontos (Risco Moderado) — Exige medidas preventivas ativas imediatas como alívio mecânico e proteção tópica.",
        isCorrect: true,
        feedback: "Correto! A pontuação de 14 pontos enquadra o paciente na faixa de Risco Moderado (13 a 14 pontos), tornando mandatória a instituição imediata do pacote de prevenção de LPP (mudança de decúbito de 2/2h e hidratação de pele)."
      },
      {
        id: "opt_3",
        label: "Braden = 22 pontos (Sem Risco de Lesão por Pressão, dispensando cuidados posturais).",
        isCorrect: false,
        feedback: "Incorreto: A pontuação de 22 indicaria paciente plenamente ativo, com mobilidade total e deambulação independente."
      },
      {
        id: "opt_4",
        label: "Braden = 18 pontos (Baixo Risco sem necessidade de registro em prontuário).",
        isCorrect: false,
        feedback: "Incorreto: Mesmo em baixo risco o registro é obrigatório, e as limitações observadas no paciente com restrição no leito geram pontuação inferior a 18."
      }
    ],
    pearl: "Na Escala de Braden, menor pontuação significa MAIOR risco (escala inversa de 6 a 23). Pacientes com pontuação ≤ 14 devem ter intervenções profiláticas prioritárias já na admissão.",
    resultingItem: {
      label: "Escala de Braden",
      value: "14 pontos — Risco Moderado (Plano de prevenção instituído)",
      status: "altered"
    }
  }
};

/**
 * Embaralha as alternativas de um achado semiológico utilizando o algoritmo Fisher-Yates,
 * garantindo que a resposta correta tenha 25% de probabilidade equiprovável em A, B, C ou D.
 * Atribui letras sequenciais [A, B, C, D] a cada abertura.
 *
 * @param {string} gapKey
 * @returns {object|null}
 */
export function getShuffledSemiologyFinding(gapKey) {
  const base = SEMIOLOGY_KNOWLEDGE_BASE[gapKey];
  if (!base || !Array.isArray(base.options)) return null;

  const letters = ["A", "B", "C", "D", "E"];
  // Cria cópia profunda das opções
  const optionsCopy = base.options.map((opt) => ({ ...opt }));

  // Fisher-Yates shuffle
  for (let i = optionsCopy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [optionsCopy[i], optionsCopy[j]] = [optionsCopy[j], optionsCopy[i]];
  }

  // Atribui nova letra A, B, C, D
  const shuffledOptions = optionsCopy.map((opt, idx) => ({
    ...opt,
    letter: letters[idx] || String.fromCharCode(65 + idx),
    id: `opt_shuffled_${idx}_${opt.id}`
  }));

  return {
    ...base,
    options: shuffledOptions
  };
}
