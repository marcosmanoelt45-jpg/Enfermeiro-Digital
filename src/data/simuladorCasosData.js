/**
 * simuladorCasosData.js
 *
 * Catálogo canônico de casos clínicos locais para o Atendimento por Voz (Videochamada).
 * Contém dados completos para os 2 pacientes (Sr. Marcus e Dona Teresinha),
 * com banco de 44 passos clínicos (2 falas de abertura e 42 questões com 5 alternativas cada),
 * dicas clínicas para 1º erro (amarela), explicações detalhadas por alternativa (revisão com erros em vermelho e acerto em verde),
 * sincronização de fala/áudio neural e gerador de sessões inteligentes (Rápida 4-6, Normal 7-9, Revisão).
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
    "tipo": "fala",
    "texto": "Oi enfermeiro, que bom que você veio! Minha perna está doendo e estou sentindo um incômodo forte aqui no calcanhar.",
    "audioPath": "/pacientes/marcus/passo_0.wav"
  },
  {
    "tipo": "multipla_escolha",
    "tema": "AVALIAÇÃO E ESTADIAMENTO",
    "categoriaPratica": "curativo",
    "pergunta": "Ao avaliar a ferida no meu calcanhar com tecido fibrinoso e bordas maceradas, qual conduta primordial você adota primeiro?",
    "audioPath": "/pacientes/marcus/passo_1.wav",
    "dica": "A higiene inicial e a remoção atraumática de sujidades precedem qualquer tipo de desbridamento ou escolha de cobertura.",
    "opcoes": [
      "Irrigar a lesão em jato com soro fisiológico 0,9% aquecido para limpeza atraumática",
      "Aplicar álcool 70% diretamente sobre o leito para rápida desinfecção bacteriana",
      "Raspar imediatamente o tecido fibrinoso com lâmina de bisturi a seco",
      "Cobrir a ferida imediatamente com gaze seca sem realizar irrigação prévia",
      "Ocluir a ferida com esparadrapo comum diretamente sobre a pele lesada"
    ],
    "correta": 0,
    "explicacaoGeral": "A limpeza por irrigação com soro fisiológico 0,9% em temperatura morna/ambiente é a recomendação de padrão-ouro para preservar o tecido de granulação e remover exsudato sem causar dor excessiva ou trauma tecidual.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "Irrigar a lesão em jato com soro fisiológico 0,9% aquecido para limpeza atraumática",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): A irrigação com SF 0,9% morno preserva a temperatura local (37°C), favorece a atividade dos macrófagos e limpa sem agredir as células viáveis."
      },
      {
        "letra": "B",
        "texto": "Aplicar álcool 70% diretamente sobre o leito para rápida desinfecção bacteriana",
        "isCorreta": false,
        "explicacao": "Incorreta: O álcool é citotóxico, desidrata o leito, necrosa queratinócitos e provoca dor excruciante quando em contato com a derme exposta."
      },
      {
        "letra": "C",
        "texto": "Raspar imediatamente o tecido fibrinoso com lâmina de bisturi a seco",
        "isCorreta": false,
        "explicacao": "Incorreta: O desbridamento cortante a seco é contraindicado; exige preparo prévio, amolecimento do tecido e técnica asséptica rigorosa por profissional habilitado."
      },
      {
        "letra": "D",
        "texto": "Cobrir a ferida imediatamente com gaze seca sem realizar irrigação prévia",
        "isCorreta": false,
        "explicacao": "Incorreta: A gaze seca adere ao leito da ferida e arranca tecido de granulação na troca, além de manter o leito contaminado pela falta de limpeza."
      },
      {
        "letra": "E",
        "texto": "Ocluir a ferida com esparadrapo comum diretamente sobre a pele lesada",
        "isCorreta": false,
        "explicacao": "Incorreta: O adesivo comum causa lesão por fricção e desnudamento da epiderme frágil peri-lesional, além de não promover meio úmido cicatricial."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "MATERIAIS E BIOSSEGURANÇA",
    "categoriaPratica": "curativo",
    "pergunta": "Quais materiais você vai separar para limpar e proteger o meu machucado?",
    "audioPath": "/pacientes/marcus/passo_2.wav",
    "dica": "Pense na sequência asséptica: solução fisiológica, luvas, kit de curativo estéril e cobertura compatível com exsudato.",
    "opcoes": [
      "Kit estéril de curativo (pinças), soro fisiológico 0,9%, gaze estéril, cobertura primária e luvas",
      "Algodão hidrófilo em rama solto, álcool iodado, fita adesiva comum e espátula de madeira",
      "Soro glicosado 5%, micropore comum, atadura suja e luvas de procedimento não estéreis para manipular o leito",
      "Povidona tópica concentrada, pomada caseira de ervas, gaze não estéril e tesoura de uso geral",
      "Apenas esparadrapo e gaze seca, dispensando qualquer solução de limpeza ou kit de instrumental"
    ],
    "correta": 0,
    "explicacaoGeral": "A montagem de campo estéril com instrumental adequado e SF 0,9% assegura o cumprimento da técnica asséptica preconizada pelo Ministério da Saúde e ANVISA.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "Kit estéril de curativo (pinças), soro fisiológico 0,9%, gaze estéril, cobertura primária e luvas",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Conjunto completo que respeita a técnica asséptica, permitindo irrigação, secagem das bordas e aplicação de cobertura protetora."
      },
      {
        "letra": "B",
        "texto": "Algodão hidrófilo em rama solto, álcool iodado, fita adesiva comum e espátula de madeira",
        "isCorreta": false,
        "explicacao": "Incorreta: Algodão solta fibras estranhas no leito favorecendo infecção (granuloma); o iodo é citotóxico para tecido de granulação em fase inicial."
      },
      {
        "letra": "C",
        "texto": "Soro glicosado 5%, micropore comum, atadura suja e luvas de procedimento não estéreis para manipular o leito",
        "isCorreta": false,
        "explicacao": "Incorreta: Soro glicosado serve de meio de cultura para bactérias e atadura contaminada perpetua contaminação cruzada hospitalar."
      },
      {
        "letra": "D",
        "texto": "Povidona tópica concentrada, pomada caseira de ervas, gaze não estéril e tesoura de uso geral",
        "isCorreta": false,
        "explicacao": "Incorreta: Produtos caseiros não têm estabilidade nem aprovação pela ANVISA e povidona inibe proliferação de fibroblastos."
      },
      {
        "letra": "E",
        "texto": "Apenas esparadrapo e gaze seca, dispensando qualquer solução de limpeza ou kit de instrumental",
        "isCorreta": false,
        "explicacao": "Incorreta: A ausência de limpeza adequada e o uso de gaze seca desprotegida agravam o dano mecânico e a dor do paciente."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "CÁLCULO DE MEDICAMENTOS",
    "categoriaPratica": "calculo",
    "pergunta": "Quantos mL você prepara para o alívio da dor do paciente? Prescrição: Dipirona 500 mg EV. Disponível: ampola de 1 g em 2 mL.",
    "audioPath": "/pacientes/marcus/passo_3.wav",
    "dica": "Converta as unidades para a mesma grandeza: 1 g = 1000 mg. Depois monte a regra de três simples: 1000 mg estão em 2 mL, logo 500 mg estão em quantos mL?",
    "opcoes": [
      "1,0 mL (aspira-se exatamente 1 mL da ampola)",
      "0,5 mL (aspira-se meio mililitro da ampola)",
      "2,0 mL (aspira-se a ampola inteira de 1 g)",
      "1,5 mL (aspira-se um mililitro e meio)",
      "0,25 mL (aspira-se um quarto de mililitro)"
    ],
    "correta": 0,
    "explicacaoGeral": "1 g = 1000 mg. Se 1000 mg equivalem a 2 mL, então 500 mg equivalem a X. X = (500 * 2) / 1000 = 1000 / 1000 = 1,0 mL.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "1,0 mL (aspira-se exatamente 1 mL da ampola)",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Cálculo exato: 1000 mg em 2 mL -> 500 mg correspondem a 1,0 mL de solução concentrada."
      },
      {
        "letra": "B",
        "texto": "0,5 mL (aspira-se meio mililitro da ampola)",
        "isCorreta": false,
        "explicacao": "Incorreta: 0,5 mL conteria apenas 250 mg de Dipirona (subdose que não proporcionaria analgesia adequada)."
      },
      {
        "letra": "C",
        "texto": "2,0 mL (aspira-se a ampola inteira de 1 g)",
        "isCorreta": false,
        "explicacao": "Incorreta: 2,0 mL forneceria 1000 mg, o dobro da dose prescrita (risco de hipotensão súbita e reações adversas)."
      },
      {
        "letra": "D",
        "texto": "1,5 mL (aspira-se um mililitro e meio)",
        "isCorreta": false,
        "explicacao": "Incorreta: 1,5 mL administraria 750 mg, gerando superdosagem em relação à prescrição médica de 500 mg."
      },
      {
        "letra": "E",
        "texto": "0,25 mL (aspira-se um quarto de mililitro)",
        "isCorreta": false,
        "explicacao": "Incorreta: Quantidade ínfima de apenas 125 mg, mantendo o paciente em quadro álgico severo."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "TÉCNICA DE CURATIVO",
    "categoriaPratica": "curativo",
    "pergunta": "Qual técnica é preconizada pelo Ministério da Saúde para limpar a lesão sem traumatizar o tecido de granulação?",
    "audioPath": "/pacientes/marcus/passo_4.wav",
    "dica": "A pressão recomendada varia entre 4 a 15 psi, geralmente obtida com seringa de 20 mL e agulha 40x12 ou frasco perfurado.",
    "opcoes": [
      "Irrigação em jatos contínuos e suaves com seringa de 20 mL e agulha 40x12 mm a cerca de 10 cm da lesão",
      "Fricção vigorosa com gaze seca em movimentos circulares concêntricos sobre o centro da ferida",
      "Esfregar gaze embebida em clorexidina alcoólica com força para remover o biofilme rapidamente",
      "Compressas geladas com água oxigenada 10 volumes sob pressão manual contínua",
      "Imersão do pé inteiro do paciente em bacia plástica com água da torneira por 30 minutos"
    ],
    "correta": 0,
    "explicacaoGeral": "A pressão entre 4 e 15 psi remove debris bacterianos e exsudato solto sem destruir os novos capilares neoformados de tecido de granulação.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "Irrigação em jatos contínuos e suaves com seringa de 20 mL e agulha 40x12 mm a cerca de 10 cm da lesão",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Produz a pressão hidráulica ideal (8 a 12 psi), que desaloja bactérias e secreções sem sangramento ou quebra de células jovens."
      },
      {
        "letra": "B",
        "texto": "Fricção vigorosa com gaze seca em movimentos circulares concêntricos sobre o centro da ferida",
        "isCorreta": false,
        "explicacao": "Incorreta: A fricção mecânica rompe brotos endoteliais e capilares frágeis, reiniciando o ciclo de inflamação e atrasando a cicatrização."
      },
      {
        "letra": "C",
        "texto": "Esfregar gaze embebida em clorexidina alcoólica com força para remover o biofilme rapidamente",
        "isCorreta": false,
        "explicacao": "Incorreta: A clorexidina alcoólica nunca deve ser aplicada em mucosas ou feridas abertas, pois causa queimadura química severa."
      },
      {
        "letra": "D",
        "texto": "Compressas geladas com água oxigenada 10 volumes sob pressão manual contínua",
        "isCorreta": false,
        "explicacao": "Incorreta: O peróxido de hidrogênio e o frio excessivo geram vasoconstrição extrema e microtrombose nos vasos do leito tecidual."
      },
      {
        "letra": "E",
        "texto": "Imersão do pé inteiro do paciente em bacia plástica com água da torneira por 30 minutos",
        "isCorreta": false,
        "explicacao": "Incorreta: A maceração extrema e a água de torneira não estéril elevam criticamente a contaminação por Pseudomonas e bactérias aquáticas."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "PREVENÇÃO DE LESÕES",
    "categoriaPratica": "geral",
    "pergunta": "Quais condutas de enfermagem previnem a piora da lesão e protegem outras proeminências?",
    "audioPath": "/pacientes/marcus/passo_5.wav",
    "dica": "Alívio de pressão na região calcânea exige coxins sob a panturrilha para flutuação do calcanhar e mudança de decúbito.",
    "opcoes": [
      "Manter o calcanhar suspenso em flutuação com coxim sob a panturrilha e reposicionamento regular",
      "Colocar almofada em formato de anel ou roda d'água sob o calcanhar",
      "Massagear vigorosamente as proeminências ósseas avermelhadas com álcool",
      "Manter o paciente em decúbito dorsal horizontal permanente e estático",
      "Restringir a ingestão hídrica e proteica para reduzir o volume de urina"
    ],
    "correta": 0,
    "explicacaoGeral": "A flutuação de calcanhares através de travesseiro longitudinal sob o tendão de Aquiles/panturrilha alivia 100% da pressão do calcâneo contra o leito.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "Manter o calcanhar suspenso em flutuação com coxim sob a panturrilha e reposicionamento regular",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Prática recomendada internacionalmente (NPUAP/EPUAP): deixa o calcanhar livre de pressão e preserva o fluxo microvascular."
      },
      {
        "letra": "B",
        "texto": "Colocar almofada em formato de anel ou roda d'água sob o calcanhar",
        "isCorreta": false,
        "explicacao": "Incorreta: Almofadas em anel criam efeito torniquete periférico, reduzindo a perfusão no centro da área comprimida."
      },
      {
        "letra": "C",
        "texto": "Massagear vigorosamente as proeminências ósseas avermelhadas com álcool",
        "isCorreta": false,
        "explicacao": "Incorreta: A massagem em áreas avermelhadas (hiperemia não reativa) rompe capilares subcutâneos e piora a isquemia local."
      },
      {
        "letra": "D",
        "texto": "Manter o paciente em decúbito dorsal horizontal permanente e estático",
        "isCorreta": false,
        "explicacao": "Incorreta: A imobilidade sem mudança de decúbito a cada 2 horas multiplica a pressão contínua em sacro, ísquios e calcâneos."
      },
      {
        "letra": "E",
        "texto": "Restringir a ingestão hídrica e proteica para reduzir o volume de urina",
        "isCorreta": false,
        "explicacao": "Incorreta: A privação proteico-calórica desnutre o paciente e anula a síntese de colágeno necessária à reparação tecidual."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "CÁLCULO DE GOTEJAMENTO",
    "categoriaPratica": "calculo",
    "pergunta": "Quantas gotas por minuto (macrogotas) devem correr na hidratação prescrita? Prescrição: 500 mL de SF 0,9% para correr em 8 horas.",
    "audioPath": "/pacientes/marcus/passo_6.wav",
    "dica": "Fórmula de macrogotas por minuto: Gotas/min = Volume total (mL) / (Tempo em horas x 3). Calcule 500 / (8 x 3).",
    "opcoes": [
      "21 gotas por minuto (aproximadamente 20,8 gts/min)",
      "42 gotas por minuto (gotejamento em dobro)",
      "63 gotas por minuto (ritmo para microgotas)",
      "15 gotas por minuto (infusão excessivamente lenta)",
      "35 gotas por minuto (ritmo equivalente a 6 horas)"
    ],
    "correta": 0,
    "explicacaoGeral": "Fórmula: Gotas = V / (T x 3) = 500 / (8 x 3) = 500 / 24 = 20,83 gotas/minuto. Por convenção farmacológica, arredonda-se para 21 gotas/min.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "21 gotas por minuto (aproximadamente 20,8 gts/min)",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Cálculo preciso: 500 / 24 = 20,83 -> arredonda-se para 21 macrogotas por minuto."
      },
      {
        "letra": "B",
        "texto": "42 gotas por minuto (gotejamento em dobro)",
        "isCorreta": false,
        "explicacao": "Incorreta: Correria o volume em apenas 4 horas (metade do tempo planejado), gerando risco de sobrecarga circulatória no idoso."
      },
      {
        "letra": "C",
        "texto": "63 gotas por minuto (ritmo para microgotas)",
        "isCorreta": false,
        "explicacao": "Incorreta: 63 macrogotas/min infundiria 500 mL em menos de 3 horas, configurando erro grave de infusão rápida."
      },
      {
        "letra": "D",
        "texto": "15 gotas por minuto (infusão excessivamente lenta)",
        "isCorreta": false,
        "explicacao": "Incorreta: A 15 gts/min o frasco levaria mais de 11 horas para infundir, atrasando a hidratação e terapêutica prescrita."
      },
      {
        "letra": "E",
        "texto": "35 gotas por minuto (ritmo equivalente a 6 horas)",
        "isCorreta": false,
        "explicacao": "Incorreta: Taxa acelerada que finalizaria o soro em cerca de 4,7 horas em vez das 8 horas estipuladas."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "HIGIENIZAÇÃO DAS MÃOS",
    "categoriaPratica": "geral",
    "pergunta": "Antes de colocar as luvas e tocar no paciente, diga qual procedimento primordial você realiza.",
    "audioPath": "/pacientes/marcus/passo_7.wav",
    "dica": "As luvas de procedimento nunca substituem a higiene das mãos. A fricção com preparação alcoólica a 70% ou água e sabonete é mandatória.",
    "opcoes": [
      "Higienização rigorosa das mãos com água e sabonete líquido ou preparação alcoólica a 70%",
      "Calçar as luvas diretamente sobre as mãos sem qualquer higienização prévia",
      "Passar apenas uma toalha de papel seca sobre as palmas das mãos",
      "Umedecer os dedos com soro glicosado da bancada",
      "Aplicar talco neutro nas mãos sem lavar com água ou álcool"
    ],
    "correta": 0,
    "explicacaoGeral": "A higienização das mãos é a medida mais eficaz e de menor custo para prevenir infecções relacionadas à assistência à saúde (IRAS), segundo a OMS e ANVISA.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "Higienização rigorosa das mãos com água e sabonete líquido ou preparação alcoólica a 70%",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Medida essencial do 1º Momento da OMS ('Antes de tocar o paciente') para prevenir a contaminação cruzada."
      },
      {
        "letra": "B",
        "texto": "Calçar as luvas diretamente sobre as mãos sem qualquer higienização prévia",
        "isCorreta": false,
        "explicacao": "Incorreta: As luvas têm microporosidades e o contato das mãos contaminadas com o exterior da luva transporta patógenos ao paciente."
      },
      {
        "letra": "C",
        "texto": "Passar apenas uma toalha de papel seca sobre as palmas das mãos",
        "isCorreta": false,
        "explicacao": "Incorreta: O papel seco não tem nenhuma ação microbicida nem detergente sobre a microbiota transitória da pele."
      },
      {
        "letra": "D",
        "texto": "Umedecer os dedos com soro glicosado da bancada",
        "isCorreta": false,
        "explicacao": "Incorreta: A glicose alimenta microrganismos e favorece a colonização bacteriana das mãos do profissional."
      },
      {
        "letra": "E",
        "texto": "Aplicar talco neutro nas mãos sem lavar com água ou álcool",
        "isCorreta": false,
        "explicacao": "Incorreta: O talco não reduz a carga microbiana e resseca as mãos, gerando microfissuras cutâneas no enfermeiro."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "ESCALAS DE RISCO",
    "categoriaPratica": "geral",
    "pergunta": "Na Escala de Braden para a predição do risco de lesão por pressão, qual parâmetro avalia a sensibilidade a desconforto?",
    "audioPath": "/pacientes/marcus/passo_8.wav",
    "dica": "A escala avalia 6 subescalas: Percepção Sensorial, Umidade, Atividade, Mobilidade, Nutrição e Fricção/Cisalhamento.",
    "opcoes": [
      "Percepção Sensorial (capacidade de reagir significativamente ao desconforto relacionado à pressão)",
      "Nível de Consciência pela Escala de Coma de Glasgow",
      "Índice de Massa Corporal (IMC) e Espessura da Prega Cutânea",
      "Pressão Arterial Média em decúbito dorsal e ortostase",
      "Velocidade de Marcha e Equilíbrio pela Escala de Tinetti"
    ],
    "correta": 0,
    "explicacaoGeral": "A subescala 'Percepção Sensorial' pontua de 1 (completamente limitada) a 4 (sem limitação), avaliando se o paciente sente e responde ao incômodo de pressão.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "Percepção Sensorial (capacidade de reagir significativamente ao desconforto relacionado à pressão)",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): É o parâmetro exato da Escala de Braden que quantifica a capacidade do paciente perceber e verbalizar dor ou pressão."
      },
      {
        "letra": "B",
        "texto": "Nível de Consciência pela Escala de Coma de Glasgow",
        "isCorreta": false,
        "explicacao": "Incorreta: Glasgow é uma escala neurológica independente para trauma e coma, não sendo um dos seis domínios da Braden."
      },
      {
        "letra": "C",
        "texto": "Índice de Massa Corporal (IMC) e Espessura da Prega Cutânea",
        "isCorreta": false,
        "explicacao": "Incorreta: A Braden avalia padrão de refeições no domínio 'Nutrição', mas não afere pregas cutâneas ou antropometria métrica."
      },
      {
        "letra": "D",
        "texto": "Pressão Arterial Média em decúbito dorsal e ortostase",
        "isCorreta": false,
        "explicacao": "Incorreta: A PAM é um sinal hemodinâmico, não fazendo parte dos critérios de predição de risco de úlceras por pressão."
      },
      {
        "letra": "E",
        "texto": "Velocidade de Marcha e Equilíbrio pela Escala de Tinetti",
        "isCorreta": false,
        "explicacao": "Incorreta: Tinetti avalia risco de quedas em geriatria, enquanto Braden analisa atividade e mobilidade no leito/cadeira."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "COBERTURAS TERAPÊUTICAS",
    "categoriaPratica": "curativo",
    "pergunta": "Para manter o leito úmido favorável e estimular a epitelização de lesão estágio 2 sem infecção, qual cobertura é indicada?",
    "audioPath": "/pacientes/marcus/passo_9.wav",
    "dica": "Curativos hidrocoloides ou filmes transparentes mantêm o meio úmido e protegem contra bactérias externas em lesões limpas e com baixo exsudato.",
    "opcoes": [
      "Placa de Hidrocoloide ou Hidrogel estéril com cobertura secundária oclusiva",
      "Sulfadiazina de Prata 1% associada a carvão ativado triturado",
      "Pó de talco secativo com pomada de óxido de zinco pura",
      "Açúcar cristal hospitalar a seco sobre o calcanhar",
      "Gaze impregnada com solução de permanganato de potássio 1:4000"
    ],
    "correta": 0,
    "explicacaoGeral": "O Hidrocoloide promove desbridamento autolítico e proliferação de tecido de granulação e epitelização sob isolamento térmico e impermeabilidade externa.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "Placa de Hidrocoloide ou Hidrogel estéril com cobertura secundária oclusiva",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Mantém a umidade ótima fisiológica, não adere ao leito novo e permite trocas espaçadas a cada 3 a 7 dias."
      },
      {
        "letra": "B",
        "texto": "Sulfadiazina de Prata 1% associada a carvão ativado triturado",
        "isCorreta": false,
        "explicacao": "Incorreta: Indicada para lesões infectadas ou queimaduras com odor pútrido; é desnecessária e tóxica para tecidos em fase de epitelização limpa."
      },
      {
        "letra": "C",
        "texto": "Pó de talco secativo com pomada de óxido de zinco pura",
        "isCorreta": false,
        "explicacao": "Incorreta: Resseca o leito da ferida e cria crostas que impedem a migração celular e a reepitelização."
      },
      {
        "letra": "D",
        "texto": "Açúcar cristal hospitalar a seco sobre o calcanhar",
        "isCorreta": false,
        "explicacao": "Incorreta: Uso desatualizado que desidrata excessivamente as células teciduais jovens e não tem respaldo em diretrizes NPUAP."
      },
      {
        "letra": "E",
        "texto": "Gaze impregnada com solução de permanganato de potássio 1:4000",
        "isCorreta": false,
        "explicacao": "Incorreta: O permanganato é adstringente e dessecante, provocando necrose em bordas epiteliais sadias."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "DIAGNÓSTICO DE INFECÇÃO",
    "categoriaPratica": "curativo",
    "pergunta": "Quais alterações clínicas no leito ou bordas da ferida sugerem infecção bacteriana secundária?",
    "audioPath": "/pacientes/marcus/passo_10.wav",
    "dica": "Fique atento aos sinais cardinais: calor aumentado, eritema em expansão além das bordas, dor crescente e exsudato purulento.",
    "opcoes": [
      "Calor local aumentado, exsudato purulento com odor fétido e eritema perilesional expansivo",
      "Leito avermelhado brilhante, sangramento capilar mínimo ao toque e ausência de dor",
      "Tecido de granulação róseo, bordas aderidas e exsudato seroso transparente escasso",
      "Temperatura peri-ferida fria com pulsos periféricos normais e pele íntegra",
      "Epitelização contínua das margens avançando em direção ao centro da lesão"
    ],
    "correta": 0,
    "explicacaoGeral": "A presença de secreção purulenta, hipertermia local, hiperemia perilesional > 2 cm e odor caracterizam infecção localizada ou sistêmica.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "Calor local aumentado, exsudato purulento com odor fétido e eritema perilesional expansivo",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Sinais clássicos de infecção tecidual que exigem cultura, desbridamento cirúrgico/enzimático e antibioticoterapia sistêmica."
      },
      {
        "letra": "B",
        "texto": "Leito avermelhado brilhante, sangramento capilar mínimo ao toque e ausência de dor",
        "isCorreta": false,
        "explicacao": "Incorreta: Descreve tecido de granulação saudável e bem vascularizado em plena fase de proliferação cicatricial."
      },
      {
        "letra": "C",
        "texto": "Tecido de granulação róseo, bordas aderidas e exsudato seroso transparente escasso",
        "isCorreta": false,
        "explicacao": "Incorreta: Representa evolução fisiológica ideal sem contaminação bacteriana patológica."
      },
      {
        "letra": "D",
        "texto": "Temperatura peri-ferida fria com pulsos periféricos normais e pele íntegra",
        "isCorreta": false,
        "explicacao": "Incorreta: A infecção cursa com calor aumentado (vasodilatação inflamatória), e não com hipotermia tecidual."
      },
      {
        "letra": "E",
        "texto": "Epitelização contínua das margens avançando em direção ao centro da lesão",
        "isCorreta": false,
        "explicacao": "Incorreta: É o sinal objetivo de fechamento e regressão da ferida, oposto de um quadro infeccioso ativo."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "FARMACOLOGIA E DOSAGEM",
    "categoriaPratica": "farmaco",
    "pergunta": "Quantos mL de Enoxaparina você administra para a profilaxia de trombose venosa profunda? Prescrição: Enoxaparina 40 mg SC ao dia. Disponível: seringa preenchida com 40 mg em 0,4 mL.",
    "audioPath": "/pacientes/marcus/passo_11.wav",
    "dica": "Observe a graduação da seringa preenchida comercial. Se 40 mg correspondem ao volume total do dispositivo, quanto deve ser injetado?",
    "opcoes": [
      "0,4 mL (administração do volume total da seringa preenchida de 40 mg sem desprezar a bolha de ar)",
      "0,8 mL (duas seringas inteiras aplicadas simultaneamente)",
      "0,2 mL (desprezando metade do conteúdo antes da aplicação)",
      "1,0 mL (completando o volume com água destilada para diluição)",
      "0,04 mL (aspiração fracionada em seringa de insulina)"
    ],
    "correta": 0,
    "explicacaoGeral": "A seringa de enoxaparina vem pronta de fábrica com 40 mg/0,4 mL. Não se deve retirar a bolha de ar pré-existente para garantir a dose total sem refluxo.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "0,4 mL (administração do volume total da seringa preenchida de 40 mg sem desprezar a bolha de ar)",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Dose exata e técnica padrão: a bolha de ar sela o trajeto subcutâneo, evitando extravasamento e hematomas."
      },
      {
        "letra": "B",
        "texto": "0,8 mL (duas seringas inteiras aplicadas simultaneamente)",
        "isCorreta": false,
        "explicacao": "Incorreta: Administraria 80 mg (dose terapêutica Plena de anticoagulação para TEP/TVP estabelecida), gerando alto risco de hemorragia grave."
      },
      {
        "letra": "C",
        "texto": "0,2 mL (desprezando metade do conteúdo antes da aplicação)",
        "isCorreta": false,
        "explicacao": "Incorreta: Forneceria apenas 20 mg, dose profilática insuficiente para um paciente idoso acamado de alto risco."
      },
      {
        "letra": "D",
        "texto": "1,0 mL (completando o volume com água destilada para diluição)",
        "isCorreta": false,
        "explicacao": "Incorreta: A heparina de baixo peso molecular não deve ser diluída, pois altera a osmolalidade e cinética de absorção subcutânea."
      },
      {
        "letra": "E",
        "texto": "0,04 mL (aspiração fracionada em seringa de insulina)",
        "isCorreta": false,
        "explicacao": "Incorreta: Representa apenas 4 mg de fármaco (erro de 10 vezes a menos por confusão decimal)."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "MANEJO DA DOR",
    "categoriaPratica": "geral",
    "pergunta": "Em pacientes idosos com feridas dolorosas, qual conduta de enfermagem é prioritária antes de manipular o curativo?",
    "audioPath": "/pacientes/marcus/passo_12.wav",
    "dica": "A analgesia preventiva deve coincidir com o pico de ação do analgésico prescrito (cerca de 30 minutos antes do procedimento).",
    "opcoes": [
      "Administrar a analgesia prescrita cerca de 30 minutos antes do procedimento e explicar as etapas ao paciente",
      "Iniciar a retirada do curativo bruscamente para que a dor dure o menor tempo possível",
      "Dizer ao paciente que a dor é psicológica e pedir para que tolere sem medicação",
      "Aplicar gelo diretamente sobre o tecido aberto para congelar as terminações nervosas",
      "Restringir a comunicação durante o curativo para evitar distrações na técnica"
    ],
    "correta": 0,
    "explicacaoGeral": "O controle álgico pré-procedimento diminui a ansiedade, os picos hipertensivos e o trauma emocional, promovendo adesão e conforto ao paciente idoso.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "Administrar a analgesia prescrita cerca de 30 minutos antes do procedimento e explicar as etapas ao paciente",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Garante que a concentração plasmática do analgésico atinja o platô terapêutico no momento do manuseio da ferida."
      },
      {
        "letra": "B",
        "texto": "Iniciar a retirada do curativo bruscamente para que a dor dure o menor tempo possível",
        "isCorreta": false,
        "explicacao": "Incorreta: A avulsão traumática provoca pico paroxístico de dor, descarga adrenérgica e arrancamento de pele viável."
      },
      {
        "letra": "C",
        "texto": "Dizer ao paciente que a dor é psicológica e pedir para que tolere sem medicação",
        "isCorreta": false,
        "explicacao": "Incorreta: Prática antiética e contrária aos preceitos da dor como 5º sinal vital reconhecido pelas sociedades de saúde."
      },
      {
        "letra": "D",
        "texto": "Aplicar gelo diretamente sobre o tecido aberto para congelar as terminações nervosas",
        "isCorreta": false,
        "explicacao": "Incorreta: O gelo direto provoca queimadura térmica por congelamento e necrose isquêmica dos capilares no leito."
      },
      {
        "letra": "E",
        "texto": "Restringir a comunicação durante o curativo para evitar distrações na técnica",
        "isCorreta": false,
        "explicacao": "Incorreta: O diálogo empático e a orientação verbal diminuem a percepção dolorosa e tranquilizam o paciente idoso."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "POSICIONAMENTO NO LEITO",
    "categoriaPratica": "geral",
    "pergunta": "Diga qual cuidado físico de posicionamento você realiza para manter o calcanhar do paciente sem contato com o colchão.",
    "audioPath": "/pacientes/marcus/passo_13.wav",
    "dica": "O apoio deve ser distribuído ao longo da tíbia e panturrilha, mantendo o joelho ligeiramente fletido (5 a 10 graus) e o calcanhar no ar.",
    "opcoes": [
      "Posicionar um travesseiro macio sob a panturrilha do paciente, garantindo espaço livre entre o calcanhar e o lençol",
      "Amarrar uma faixa elástica tracionando o pé para cima na cabeceira da cama",
      "Colocar um saco de areia pesado diretamente sobre os dedos dos pés",
      "Pendurar o pé para fora da lateral da cama sem qualquer suporte na perna",
      "Apoiar o calcanhar diretamente em uma bacia metálica virada para baixo"
    ],
    "correta": 0,
    "explicacaoGeral": "O suporte na panturrilha eleva a proeminência óssea posterior do calcâneo, eliminando por completo a força normal de compressão tecidual.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "Posicionar um travesseiro macio sob a panturrilha do paciente, garantindo espaço livre entre o calcanhar e o lençol",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Padrão de ouro de flutuação de calcanhar (offloading calcâneo), com alívio total de pressão e sem estresse poplíteo."
      },
      {
        "letra": "B",
        "texto": "Amarrar uma faixa elástica tracionando o pé para cima na cabeceira da cama",
        "isCorreta": false,
        "explicacao": "Incorreta: Gera hiperextensão forçada articular, restrição circulatória e risco de lesão de nervo fibular comum."
      },
      {
        "letra": "C",
        "texto": "Colocar um saco de areia pesado diretamente sobre os dedos dos pés",
        "isCorreta": false,
        "explicacao": "Incorreta: Aumenta a pressão na região dorsal e predispõe ao pé equino por peso contínuo sobre o antepé."
      },
      {
        "letra": "D",
        "texto": "Pendurar o pé para fora da lateral da cama sem qualquer suporte na perna",
        "isCorreta": false,
        "explicacao": "Incorreta: Deixar o membro pendente provoca estase venosa profunda, edema maleolar e risco de luxação ou queda."
      },
      {
        "letra": "E",
        "texto": "Apoiar o calcanhar diretamente em uma bacia metálica virada para baixo",
        "isCorreta": false,
        "explicacao": "Incorreta: Superfície rígida e fria que potencializa a isquemia e produz novas lesões em minutos."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "REMOÇÃO DE CURATIVO ADERIDO",
    "categoriaPratica": "curativo",
    "pergunta": "Quando a gaze ou curativo antigo estiver firmemente aderido ao leito da lesão, quais condutas você adota?",
    "audioPath": "/pacientes/marcus/passo_14.wav",
    "dica": "Nunca puxe a gaze a seco. Umedeça abundantemente com soro fisiológico morno e aguarde o desprendimento espontâneo.",
    "opcoes": [
      "Umedecer a gaze abundantemente com soro fisiológico 0,9% morno e aguardar alguns minutos até o desprendimento espontâneo",
      "Puxar a gaze seca com força e rapidez usando uma pinça hemostática dente-de-rato",
      "Cortar a gaze com tesoura cirúrgica rente ao leito deixando fragmentos de tecido fibroso",
      "Jogar éter sulfúrico sobre o curativo para dissolver o exsudato seco",
      "Esfregar sabão em barra diretamente sobre a gaze presa até amolecer"
    ],
    "correta": 0,
    "explicacaoGeral": "A umectação com soro fisiológico solubiliza as pontes de fibrina e exsudato desidratado, descolando o curativo sem agredir os capilares neoformados.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "Umedecer a gaze abundantemente com soro fisiológico 0,9% morno e aguardar alguns minutos até o desprendimento espontâneo",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Preserva a integridade do leito tecidual, minimiza o sangramento e zera a dor por descolamento mecânico abrupto."
      },
      {
        "letra": "B",
        "texto": "Puxar a gaze seca com força e rapidez usando uma pinça hemostática dente-de-rato",
        "isCorreta": false,
        "explicacao": "Incorreta: Arranca camadas inteiras de células endoteliais e epidérmicas, retrocedendo a ferida a um estágio mais grave."
      },
      {
        "letra": "C",
        "texto": "Cortar a gaze com tesoura cirúrgica rente ao leito deixando fragmentos de tecido fibroso",
        "isCorreta": false,
        "explicacao": "Incorreta: Deixar fibras sintéticas ou de algodão no leito causa reação de corpo estranho e abcessos locais."
      },
      {
        "letra": "D",
        "texto": "Jogar éter sulfúrico sobre o curativo para dissolver o exsudato seco",
        "isCorreta": false,
        "explicacao": "Incorreta: O éter é extremamente tóxico, volátil, irritante e proibido para contato com tecidos humanos vivos."
      },
      {
        "letra": "E",
        "texto": "Esfregar sabão em barra diretamente sobre a gaze presa até amolecer",
        "isCorreta": false,
        "explicacao": "Incorreta: Sabão comum tem pH alcalino cáustico, destrói o manto ácido da pele e introduz contaminantes industriais na ferida."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "BOMBA DE INFUSÃO CONTÍNUA",
    "categoriaPratica": "calculo",
    "pergunta": "A quantos mL/h você programa a Bomba de Infusão Contínua para infundir o Ciprofloxacino prescrito? Prescrição: Ciprofloxacino 400 mg (bolsa de 200 mL pronta) para correr em 60 minutos.",
    "audioPath": "/pacientes/marcus/passo_15.wav",
    "dica": "A vazão da Bomba de Infusão (BIC) é calculada em mililitros por hora (mL/h). Se o volume é 200 mL e o tempo é de 1 hora (60 minutos), qual é a velocidade?",
    "opcoes": [
      "200 mL/h (velocidade exata para infundir 200 mL em 1 hora)",
      "100 mL/h (infusão que levaria 2 horas)",
      "400 mL/h (velocidade que infundiria a medicação em 30 minutos)",
      "50 mL/h (infusão excessivamente lenta de 4 horas)",
      "20 mL/h (programação incorreta por erro de escala)"
    ],
    "correta": 0,
    "explicacaoGeral": "Vazão em BIC (mL/h) = Volume total (mL) / Tempo total (horas). 200 mL / 1 h = 200 mL/h.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "200 mL/h (velocidade exata para infundir 200 mL em 1 hora)",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Cálculo direto e correto: 200 mL / 1 hora = 200 mL/h na bomba de infusão contínua."
      },
      {
        "letra": "B",
        "texto": "100 mL/h (infusão que levaria 2 horas)",
        "isCorreta": false,
        "explicacao": "Incorreta: A 100 mL/h, a dose de antimicrobiano demoraria o dobro do tempo prescrito para ser concluída."
      },
      {
        "letra": "C",
        "texto": "400 mL/h (velocidade que infundiria a medicação em 30 minutos)",
        "isCorreta": false,
        "explicacao": "Incorreta: Infundir quinolonas em 30 min acarreta flebite química intensa, hipotensão e queimação venosa."
      },
      {
        "letra": "D",
        "texto": "50 mL/h (infusão excessivamente lenta de 4 horas)",
        "isCorreta": false,
        "explicacao": "Incorreta: Atrasaria severamente a concentração bactericida pico no plasma do paciente idoso séptico."
      },
      {
        "letra": "E",
        "texto": "20 mL/h (programação incorreta por erro de escala)",
        "isCorreta": false,
        "explicacao": "Incorreta: Levaria 10 horas para infundir, ineficaz para o regime posológico do antibiótico."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "AVALIAÇÃO DE EXSUDATO",
    "categoriaPratica": "curativo",
    "pergunta": "Como você classifica um exsudato fluido, claro, de coloração amarelada tênue e sem odor desagradável?",
    "audioPath": "/pacientes/marcus/passo_16.wav",
    "dica": "Diferencie exsudato seroso (claro/palha), purulento (amarelo-esverdeado e espesso) e sanguinolento (vermelho vivo).",
    "opcoes": [
      "Exsudato Seroso (característico de fase inflamatória e proliferação fisiológica limpa)",
      "Exsudato Purulento (presença massiva de neutrófilos mortos e bactérias)",
      "Exsudato Hemático Puro (sangramento ativo de grandes vasos)",
      "Exsudato Quiloso (linfa com alta concentração de triglicerídeos e gorduras)",
      "Exsudato Gangrenoso (secreção acinzentada por necrose de Clostridium)"
    ],
    "correta": 0,
    "explicacaoGeral": "O exsudato seroso é límpido a amarelado pálido e de consistência aquosa, composto por proteínas séricas normais da resposta inflamatória de cura.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "Exsudato Seroso (característico de fase inflamatória e proliferação fisiológica limpa)",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Classificação precisa segundo as diretrizes de cuidados com a pele da NPUAP/SOBEST."
      },
      {
        "letra": "B",
        "texto": "Exsudato Purulento (presença massiva de neutrófilos mortos e bactérias)",
        "isCorreta": false,
        "explicacao": "Incorreta: O exsudato purulento é espesso, turvo, leitoso ou esverdeado e frequentemente fétido."
      },
      {
        "letra": "C",
        "texto": "Exsudato Hemático Puro (sangramento ativo de grandes vasos)",
        "isCorreta": false,
        "explicacao": "Incorreta: O exsudato hemático é avermelhado brilhante ou amarronzado por hemácias íntegras ou lisadas."
      },
      {
        "letra": "D",
        "texto": "Exsudato Quiloso (linfa com alta concentração de triglicerídeos e gorduras)",
        "isCorreta": false,
        "explicacao": "Incorreta: Apresenta aspecto leitoso branco opaco, típico de lesão de ductos linfáticos torácicos ou abdominais."
      },
      {
        "letra": "E",
        "texto": "Exsudato Gangrenoso (secreção acinzentada por necrose de Clostridium)",
        "isCorreta": false,
        "explicacao": "Incorreta: Cursa com crepitação tecidual por gás, odor pútrido fétido e coloração escura/acastanhada."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "PROTEÇÃO DA PELE PERI-LESIONAL",
    "categoriaPratica": "curativo",
    "pergunta": "Para proteger as bordas perilesionais contra a maceração causada pelo exsudato contínuo, qual produto é mais apropriado?",
    "audioPath": "/pacientes/marcus/passo_17.wav",
    "dica": "A película protetora sem álcool (spray ou swab de barreira de polímero de silicone) protege a pele intacta contra umidade e enzimas sem ardor.",
    "opcoes": [
      "Película protetora sem álcool (filme barreira não citotóxico à base de silicone/polímeros)",
      "Tintura de Benjoim alcoólica concentrada a 20%",
      "Pomada de ácido salicílico a 10% com enxofre",
      "Solução tópica de hipoclorito de sódio puro a 2,5%",
      "Álcool etílico a 70% com cânfora em fricção contínua"
    ],
    "correta": 0,
    "explicacaoGeral": "O filme barreira sem álcool forma uma película transparente impermeável à umidade do exsudato, prevenindo a maceração e perda de epiderme.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "Película protetora sem álcool (filme barreira não citotóxico à base de silicone/polímeros)",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Cria barreira hidrofóbica eficaz e flexível por até 72 horas, protegendo as bordas sem provocar ardor na aplicação."
      },
      {
        "letra": "B",
        "texto": "Tintura de Benjoim alcoólica concentrada a 20%",
        "isCorreta": false,
        "explicacao": "Incorreta: Contém álcool que resseca a pele, provoca dor intensa e predispõe a dermatite de contato alérgica."
      },
      {
        "letra": "C",
        "texto": "Pomada de ácido salicílico a 10% com enxofre",
        "isCorreta": false,
        "explicacao": "Incorreta: É um ceratolítico potente que desgasta o estrato córneo, agravando a fragilidade e descamação."
      },
      {
        "letra": "D",
        "texto": "Solução tópica de hipoclorito de sódio puro a 2,5%",
        "isCorreta": false,
        "explicacao": "Incorreta: Agente cáustico corrosivo que necrosa queratinócitos e amplia a extensão da lesão."
      },
      {
        "letra": "E",
        "texto": "Álcool etílico a 70% com cânfora em fricção contínua",
        "isCorreta": false,
        "explicacao": "Incorreta: Destrói os lipídios naturais da barreira cutânea, provocando fissuras profundas na pele perilesional."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "AVALIAÇÃO VASCULAR DO MEMBRO",
    "categoriaPratica": "sinais_vitais",
    "pergunta": "Quais parâmetros devem ser checados no pé do Sr. Marcus para descartar insuficiência arterial associada?",
    "audioPath": "/pacientes/marcus/passo_18.wav",
    "dica": "A palpação dos pulsos pedioso e tibial posterior, temperatura do pé e tempo de enchimento capilar (TEC) são cruciais.",
    "opcoes": [
      "Palpação dos pulsos pedioso e tibial posterior, temperatura do antepé e tempo de enchimento capilar (TEC)",
      "Aferição do diâmetro da coxa com fita métrica e teste de força de preensão manual",
      "Contagem do número de unhas encravadas e coloração dos pelos do joelho",
      "Aferição da pressão venosa central através de cateter venoso subclávio",
      "Medição do reflexo patelar com martelo neurológico em decúbito ventral"
    ],
    "correta": 0,
    "explicacaoGeral": "A presença de pulsos distais amplos e TEC < 3 segundos descarta doença arterial oclusiva periférica grave, assegurando fluxo sanguíneo para cicatrização.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "Palpação dos pulsos pedioso e tibial posterior, temperatura do antepé e tempo de enchimento capilar (TEC)",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Exame vascular essencial no pé: pulsos fortes, TEC normal (< 3s) e pele quente confirmam perfusão arterial adequada."
      },
      {
        "letra": "B",
        "texto": "Aferição do diâmetro da coxa com fita métrica e teste de força de preensão manual",
        "isCorreta": false,
        "explicacao": "Incorreta: Avalia perda muscular (sarcopenia) e edema proximal, mas não fornece dados de perfusão arterial distal no calcâneo."
      },
      {
        "letra": "C",
        "texto": "Contagem do número de unhas encravadas e coloração dos pelos do joelho",
        "isCorreta": false,
        "explicacao": "Incorreta: Não possui valor semiótico vascular sistemático para diagnosticar isquemia arterial aguda ou crônica."
      },
      {
        "letra": "D",
        "texto": "Aferição da pressão venosa central através de cateter venoso subclávio",
        "isCorreta": false,
        "explicacao": "Incorreta: Mede volemia central no átrio direito, não tendo relação direta com a rede arterial nutridora do pé."
      },
      {
        "letra": "E",
        "texto": "Medição do reflexo patelar com martelo neurológico em decúbito ventral",
        "isCorreta": false,
        "explicacao": "Incorreta: É teste neuromuscular de raiz L3-L4 medular, sem conexão com fluxo de sangue nas artérias do tornozelo."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "ÂNGULO DE CABECEIRA E CISALHAMENTO",
    "categoriaPratica": "geral",
    "pergunta": "Para prevenir o cisalhamento sacral e no calcâneo em pacientes acamados, qual o limite recomendado de inclinação da cabeceira?",
    "audioPath": "/pacientes/marcus/passo_19.wav",
    "dica": "Manter a cabeceira a 30 graus ou menos previne o escorregamento do corpo e as forças de atrito nos tecidos profundos.",
    "opcoes": [
      "Manter a elevação da cabeceira em até 30 graus, exceto durante as refeições ou por contraindicação médica",
      "Manter a cabeceira elevada a 90 graus continuamente durante o dia e a noite",
      "Elevar a cabeceira a 75 graus associada à hiperextensão das pernas",
      "Manter o paciente em posição de Trendelenburg invertida com inclinação de 45 graus",
      "Posicionar a cabeceira a 60 graus sem apoiar os pés na cama"
    ],
    "correta": 0,
    "explicacaoGeral": "A NPUAP orienta limitar a cabeceira a ≤ 30° para evitar que o esqueleto ósseo escorregue sobre a fáscia profunda, esmagando vasos perfurantes.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "Manter a elevação da cabeceira em até 30 graus, exceto durante as refeições ou por contraindicação médica",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Ângulo fisiológico ideal que minimiza as forças de cisalhamento e pressão na pelve e nos calcanhares."
      },
      {
        "letra": "B",
        "texto": "Manter a cabeceira elevada a 90 graus continuamente durante o dia e a noite",
        "isCorreta": false,
        "explicacao": "Incorreta: Posição fowler alta gera deslocamento gravitacional massivo do corpo para baixo, deformando a pele sobre os ossos."
      },
      {
        "letra": "C",
        "texto": "Elevar a cabeceira a 75 graus associada à hiperextensão das pernas",
        "isCorreta": false,
        "explicacao": "Incorreta: Aumenta o estiramento cutâneo e concentra todo o peso corporal sobre o sacro e ísquios."
      },
      {
        "letra": "D",
        "texto": "Manter o paciente em posição de Trendelenburg invertida com inclinação de 45 graus",
        "isCorreta": false,
        "explicacao": "Incorreta: Desloca o vetor de peso sobre as pernas e pés desprotegidos, potencializando fricção contínua."
      },
      {
        "letra": "E",
        "texto": "Posicionar a cabeceira a 60 graus sem apoiar os pés na cama",
        "isCorreta": false,
        "explicacao": "Incorreta: O paciente desliza rapidamente em direção à peseira, esfolando calcanhares no lençol."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "CÁLCULO DE MACROGOTAS",
    "categoriaPratica": "calculo",
    "pergunta": "Quantas gotas por minuto você regula para infundir 1000 mL de Soro Glicosado 5% em 12 horas?",
    "audioPath": "/pacientes/marcus/passo_20.wav",
    "dica": "Gotas/min = Volume (mL) / (Horas x 3). Calcule 1000 / (12 x 3) = 1000 / 36.",
    "opcoes": [
      "28 gotas por minuto (arredondamento de 27,7 gotas/min)",
      "56 gotas por minuto (ritmo equivalente a 6 horas)",
      "14 gotas por minuto (ritmo equivalente a 24 horas)",
      "83 gotas por minuto (ritmo de microgotas)",
      "36 gotas por minuto (número correspondente ao denominador)"
    ],
    "correta": 0,
    "explicacaoGeral": "Fórmula de Macrogotas: Gotas = V / (T x 3) = 1000 / (12 x 3) = 1000 / 36 = 27,77 gotas/minuto -> arredonda-se para 28 gotas/min.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "28 gotas por minuto (arredondamento de 27,7 gotas/min)",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Cálculo farmacológico exato: 1000 / 36 = 27,77 gts/min -> arredondado para 28 gotas por minuto."
      },
      {
        "letra": "B",
        "texto": "56 gotas por minuto (ritmo equivalente a 6 horas)",
        "isCorreta": false,
        "explicacao": "Incorreta: Velocidade em dobro que infundiria 1 litro de soro glicosado em apenas 6 horas (risco de hiperglicemia e diurese osmótica)."
      },
      {
        "letra": "C",
        "texto": "14 gotas por minuto (ritmo equivalente a 24 horas)",
        "isCorreta": false,
        "explicacao": "Incorreta: Velocidade pela metade que postergaria a hidratação por um dia inteiro."
      },
      {
        "letra": "D",
        "texto": "83 gotas por minuto (ritmo de microgotas)",
        "isCorreta": false,
        "explicacao": "Incorreta: 83 é o valor em microgotas por minuto (V / T = 1000 / 12), incompatível com o equipo de macrogotas solicitado."
      },
      {
        "letra": "E",
        "texto": "36 gotas por minuto (número correspondente ao denominador)",
        "isCorreta": false,
        "explicacao": "Incorreta: Confusão comum com o produto (12 x 3 = 36), que é o denominador da equação e não o resultado final."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "REGISTRO E ÉTICA PROFISSIONAL",
    "categoriaPratica": "geral",
    "pergunta": "Segundo o COFEN, qual elemento é obrigatório na anotação de enfermagem referente à troca de curativo?",
    "audioPath": "/pacientes/marcus/passo_21.wav",
    "dica": "A Resolução COFEN 543/2017 e Guia de Anotações exige registro de localização, características da ferida, produtos utilizados, tolerância e identificação profissional (nome e COREN).",
    "opcoes": [
      "Descrição das características da ferida (local, dimensões, tecido, exsudato), produtos aplicados, queixas do paciente, data, hora, assinatura e número do COREN",
      "Apenas a frase genérica 'Curativo realizado conforme rotina' sem data ou hora",
      "Anotação rubricada pelo familiar que acompanhou o atendimento",
      "Registro apenas do valor financeiro do curativo para faturamento do convênio",
      "Assinatura em branco no prontuário para o colega do plantão seguinte descrever"
    ],
    "correta": 0,
    "explicacaoGeral": "A anotação de enfermagem deve ser clara, objetiva e completa, contendo aspectos clínicos da lesão, conduta realizada e identificação legal com número de inscrição no COREN.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "Descrição das características da ferida (local, dimensões, tecido, exsudato), produtos aplicados, queixas do paciente, data, hora, assinatura e número do COREN",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Atende a todas as exigências ético-legais do Código de Deontologia e Resoluções COFEN para respaldo do paciente e da equipe."
      },
      {
        "letra": "B",
        "texto": "Apenas a frase genérica 'Curativo realizado conforme rotina' sem data ou hora",
        "isCorreta": false,
        "explicacao": "Incorreta: Registro vago e omisso que não comprova a evolução clínica do paciente nem os materiais administrados."
      },
      {
        "letra": "C",
        "texto": "Anotação rubricada pelo familiar que acompanhou o atendimento",
        "isCorreta": false,
        "explicacao": "Incorreta: A anotação técnica é ato privativo do profissional de enfermagem executor do cuidado."
      },
      {
        "letra": "D",
        "texto": "Registro apenas do valor financeiro do curativo para faturamento do convênio",
        "isCorreta": false,
        "explicacao": "Incorreta: O prontuário é documento assistencial de saúde, não uma mera planilha contábil."
      },
      {
        "letra": "E",
        "texto": "Assinatura em branco no prontuário para o colega do plantão seguinte descrever",
        "isCorreta": false,
        "explicacao": "Incorreta: Constitui infração ética grave (falsidade ideológica) punível com processo disciplinar ético pelo COREN."
      }
    ]
  }
]
  },
  teresinha: {
    id: "caso-teresinha-puncao-flebite",
    pacienteId: "teresinha",
    titulo: "Terapia Intravenosa, flebite e acesso venoso periférico",
    subtitulo: "Paciente simulada fala com você · Banco de 22 passos clínicos",
    chips: ["Atendimento por voz", "Caso simulado", "Terapia Infusional"],
    passos: [
  {
    "tipo": "fala",
    "texto": "Olá, enfermeiro! O meu braço tá ardendo um pouquinho onde colocaram esse soro, o que será que tá acontecendo?",
    "audioPath": "/pacientes/teresinha/passo_0.wav"
  },
  {
    "tipo": "multipla_escolha",
    "tema": "DIAGNÓSTICO CLÍNICO DE FLEBITE",
    "categoriaPratica": "acesso_venoso",
    "pergunta": "Dona Teresinha apresenta dor local, calor e cordão venoso palpável no antebraço direito. Qual diagnóstico de enfermagem prioritário?",
    "audioPath": "/pacientes/teresinha/passo_1.wav",
    "dica": "A presença de cordão venoso palpável associado a eritema e calor traduz inflamação da camada íntima endotelial da veia (Flebite Grau 3).",
    "opcoes": [
      "Flebite em acesso venoso periférico com necessidade de interrupção imediata da infusão e remoção do cateter",
      "Infiltração tecidual benigna sem necessidade de retirar o dispositivo",
      "Tromboflebite arterial profunda com indicação de torniquete imediato",
      "Reação alérgica alimentar sem relação com o cateterismo intravenoso",
      "Hiperemia fisiológica transitória comum a todas as punções venosas"
    ],
    "correta": 0,
    "explicacaoGeral": "A tríade dor, calor e cordão venoso palpável sela o diagnóstico de Flebite Grau 3 pela Escala da INS (Infusion Nurses Society), exigindo a descontinuação imediata do acesso.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "Flebite em acesso venoso periférico com necessidade de interrupção imediata da infusão e remoção do cateter",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Conduta prioritária mandatória: suspender a infusão e sacar o cateter previne bacteremia e trombose venosa ascendente."
      },
      {
        "letra": "B",
        "texto": "Infiltração tecidual benigna sem necessidade de retirar o dispositivo",
        "isCorreta": false,
        "explicacao": "Incorreta: A infiltração cursa com palidez e pele fria (edema frio), diferentemente do calor e cordão fibroso inflamatório da flebite."
      },
      {
        "letra": "C",
        "texto": "Tromboflebite arterial profunda com indicação de torniquete imediato",
        "isCorreta": false,
        "explicacao": "Incorreta: O cateter é venoso periférico e torniquetes são contraindicados por causarem isquemia de membro."
      },
      {
        "letra": "D",
        "texto": "Reação alérgica alimentar sem relação com o cateterismo intravenoso",
        "isCorreta": false,
        "explicacao": "Incorreta: Reações alimentares causam manifestações sistêmicas (urticária, prurido generalizado, broncoespasmo), não inflamação focal no trajeto da veia cateterizada."
      },
      {
        "letra": "E",
        "texto": "Hiperemia fisiológica transitória comum a todas as punções venosas",
        "isCorreta": false,
        "explicacao": "Incorreta: Cordão venoso palpável e dor intensa nunca são fisiológicos; representam dano endotelial instalado."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "RECONSTITUIÇÃO E CÁLCULO",
    "categoriaPratica": "calculo",
    "pergunta": "Quantos mL você aspira do frasco reconstituído para administrar a dose prescrita? Prescrição: Ceftriaxona 500 mg EV. Frasco-ampola de 1 g com pó liofilizado reconstituído em 10 mL de diluente.",
    "audioPath": "/pacientes/teresinha/passo_2.wav",
    "dica": "1 g = 1000 mg em 10 mL. Para obter 500 mg (metade da concentração), quantos mL você deve aspirar?",
    "opcoes": [
      "5,0 mL (metade do volume total reconstituído)",
      "2,5 mL (aspiração de 250 mg)",
      "10,0 mL (administração do frasco inteiro de 1 g)",
      "1,0 mL (aspiração correspondente a 100 mg)",
      "7,5 mL (administração de 750 mg)"
    ],
    "correta": 0,
    "explicacaoGeral": "1000 mg estão em 10 mL; 500 mg estão em X. X = (500 * 10) / 1000 = 5000 / 1000 = 5,0 mL.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "5,0 mL (metade do volume total reconstituído)",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Cálculo exato: 1000 mg em 10 mL -> 500 mg correspondem rigorosamente a 5,0 mL."
      },
      {
        "letra": "B",
        "texto": "2,5 mL (aspiração de 250 mg)",
        "isCorreta": false,
        "explicacao": "Incorreta: Administraria apenas metade da dose antimicrobiana prescrita, gerando falha terapêutica e resistência bacteriana."
      },
      {
        "letra": "C",
        "texto": "10,0 mL (administração do frasco inteiro de 1 g)",
        "isCorreta": false,
        "explicacao": "Incorreta: Dobraria a dose prescrita (1000 mg), sobrecarregando a depuração hepatorrenal da paciente idosa."
      },
      {
        "letra": "D",
        "texto": "1,0 mL (aspiração correspondente a 100 mg)",
        "isCorreta": false,
        "explicacao": "Incorreta: Quantidade ineficaz que administraria somente 1/5 da dose indicada."
      },
      {
        "letra": "E",
        "texto": "7,5 mL (administração de 750 mg)",
        "isCorreta": false,
        "explicacao": "Incorreta: Superdosagem de 50% em desacordo com a prescrição médica."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "CONDUTA EM FLEBITE",
    "categoriaPratica": "acesso_venoso",
    "pergunta": "Ao identificar sinais de flebite química no membro da paciente, quais ações imediatas a equipe de enfermagem deve executar?",
    "audioPath": "/pacientes/teresinha/passo_3.wav",
    "dica": "A prioridade número 1 é interromper a infusão e remover o dispositivo. Em seguida, aplicar compressa morna e notificar o evento.",
    "opcoes": [
      "Interromper a infusão imediatamente, retirar o cateter, aplicar compressa morna e puncionar novo sítio em membro contralateral",
      "Aumentar o gotejamento ao máximo para 'lavar' a veia rapidamente antes que ela entupa",
      "Injetar 20 mL de ar para desobstruir o cateter venoso",
      "Passar pomada aquecida diretamente na ponta do cateter sem retirá-lo",
      "Manter a infusão correndo e aplicar torniquete apertado acima do local da dor"
    ],
    "correta": 0,
    "explicacaoGeral": "Interromper e retirar o cateter remove a causa mecânica/química da agressão endotelial. A compressa morna promove vasodilatação e drenagem inflamatória.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "Interromper a infusão imediatamente, retirar o cateter, aplicar compressa morna e puncionar novo sítio em membro contralateral",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Conduta preconizada pelas diretrizes internacionais da INS e protocolo de segurança do paciente da ANVISA."
      },
      {
        "letra": "B",
        "texto": "Aumentar o gotejamento ao máximo para 'lavar' a veia rapidamente antes que ela entupa",
        "isCorreta": false,
        "explicacao": "Incorreta: Amplifica a agressão osmótica e a dor, aumentando a área endotelial lesionada."
      },
      {
        "letra": "C",
        "texto": "Injetar 20 mL de ar para desobstruir o cateter venoso",
        "isCorreta": false,
        "explicacao": "Incorreta: Prática gravíssima que causa embolia gasosa fatal no coração e circulação pulmonar."
      },
      {
        "letra": "D",
        "texto": "Passar pomada aquecida diretamente na ponta do cateter sem retirá-lo",
        "isCorreta": false,
        "explicacao": "Incorreta: Manter o corpo estranho na veia perpetua o foco de trombose e introduz infecção por contaminação externa."
      },
      {
        "letra": "E",
        "texto": "Manter a infusão correndo e aplicar torniquete apertado acima do local da dor",
        "isCorreta": false,
        "explicacao": "Incorreta: O torniquete interrompe o fluxo de retorno e estiola o membro, podendo causar necrose isquêmica distal."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "BOAS PRÁTICAS EM PUNÇÃO VENOSA",
    "categoriaPratica": "acesso_venoso",
    "pergunta": "Ao puncionar novo acesso venoso periférico na Dona Teresinha, qual a recomendação técnica de boas práticas?",
    "audioPath": "/pacientes/teresinha/passo_4.wav",
    "dica": "Em idosos com fragilidade capilar, selecione veias de maior calibre em antebraço, use cateter fino (22G ou 24G) e evite dobras articulares.",
    "opcoes": [
      "Selecionar veias do antebraço evitando áreas de flexão articular, usando cateter de menor calibre (22G ou 24G) e antissepsia rigorosa",
      "Puncionar preferencialmente as veias dos membros inferiores (veia safena do tornozelo)",
      "Puncionar na mesma veia logo abaixo do local onde houve a flebite",
      "Bater com força com os dedos sobre a veia da idosa para ela dilatar",
      "Reencapar a agulha com as duas mãos após o sucesso da punção"
    ],
    "correta": 0,
    "explicacaoGeral": "Veias de antebraço proporcionam melhor fixação, menor risco de deslocamento mecânico e preservam a mobilidade da paciente idosa.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "Selecionar veias do antebraço evitando áreas de flexão articular, usando cateter de menor calibre (22G ou 24G) e antissepsia rigorosa",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Melhores práticas da INS: cateter fino permite fluxo laminar ao redor do dispositivo, prevenindo novas flebites."
      },
      {
        "letra": "B",
        "texto": "Puncionar preferencialmente as veias dos membros inferiores (veia safena do tornozelo)",
        "isCorreta": false,
        "explicacao": "Incorreta: A punção em membros inferiores em adultos e idosos eleva exponencialmente o risco de trombose venosa profunda (TVP)."
      },
      {
        "letra": "C",
        "texto": "Puncionar na mesma veia logo abaixo do local onde houve a flebite",
        "isCorreta": false,
        "explicacao": "Incorreta: A infusão a jusante da veia inflamada levará os fármacos pelo segmento trombosado, piorando o quadro."
      },
      {
        "letra": "D",
        "texto": "Bater com força com os dedos sobre a veia da idosa para ela dilatar",
        "isCorreta": false,
        "explicacao": "Incorreta: O atrito traumático rompe capilares dérmicos de idosos formando hematomas volumosos instantâneos."
      },
      {
        "letra": "E",
        "texto": "Reencapar a agulha com as duas mãos após o sucesso da punção",
        "isCorreta": false,
        "explicacao": "Incorreta: Violação gravíssima da NR-32; o reencape manual é a maior causa de acidentes perfurocortantes com risco biológico."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "CÁLCULO DE MICROGOTAS",
    "categoriaPratica": "calculo",
    "pergunta": "Quantas microgotas por minuto devem ser reguladas para infundir a medicação no tempo prescrito? Prescrição: 100 mL de solução em 1 hora.",
    "audioPath": "/pacientes/teresinha/passo_5.wav",
    "dica": "A fórmula de microgotas é: Microgotas/min = Volume (mL) / Tempo (horas). Calcule 100 / 1.",
    "opcoes": [
      "100 microgotas por minuto (1 microgota/min = 1 mL/h)",
      "33 microgotas por minuto (valor correspondente a macrogotas)",
      "200 microgotas por minuto (dobro do ritmo prescrito)",
      "50 microgotas por minuto (ritmo para 2 horas)",
      "25 microgotas por minuto (ritmo para 4 horas)"
    ],
    "correta": 0,
    "explicacaoGeral": "Em equipo de microgotas, o número de microgotas por minuto é numericamente igual à vazão em mL por hora: 100 mL em 1 h = 100 microgotas/min.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "100 microgotas por minuto (1 microgota/min = 1 mL/h)",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Relação direta: Microgotas/min = V / T = 100 / 1 = 100 microgotas/min."
      },
      {
        "letra": "B",
        "texto": "33 microgotas por minuto (valor correspondente a macrogotas)",
        "isCorreta": false,
        "explicacao": "Incorreta: 33 seria a contagem se o equipo fosse de macrogotas (100 / (1 x 3) = 33,3 gts/min)."
      },
      {
        "letra": "C",
        "texto": "200 microgotas por minuto (dobro do ritmo prescrito)",
        "isCorreta": false,
        "explicacao": "Incorreta: Infundiria a solução na metade do tempo estipulado (30 minutos)."
      },
      {
        "letra": "D",
        "texto": "50 microgotas por minuto (ritmo para 2 horas)",
        "isCorreta": false,
        "explicacao": "Incorreta: Reduziria o ritmo pela metade, retardando a administração do fármaco para 2 horas."
      },
      {
        "letra": "E",
        "texto": "25 microgotas por minuto (ritmo para 4 horas)",
        "isCorreta": false,
        "explicacao": "Incorreta: Infusão quatro vezes mais lenta que a prescrita pela equipe médica."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "CUIDADOS TÓPICOS PÓS-FLEBITE",
    "categoriaPratica": "acesso_venoso",
    "pergunta": "Após a retirada do cateter venoso com flebite, qual o cuidado tópico com evidência científica auxilia no alívio da dor e edema?",
    "audioPath": "/pacientes/teresinha/passo_6.wav",
    "dica": "Compressas mornas úmidas aplicadas por 15 a 20 minutos várias vezes ao dia promovem vasodilatação, drenagem linfática e reabsorção do exsudato.",
    "opcoes": [
      "Aplicação de compressas mornas úmidas no trajeto venoso por 15 a 20 minutos, de 3 a 4 vezes ao dia",
      "Aplicação de gelo puro em contato direto por mais de 1 hora contínua",
      "Massagem com álcool canforado sobre o cordão venoso endurecido",
      "Aplicação de torniquete de borracha mantido no braço durante o repouso",
      "Exposição direta do braço a lâmpada infravermelha a 5 cm da pele"
    ],
    "correta": 0,
    "explicacaoGeral": "A compressa morna melhora a microcirculação colateral, relaxa o espasmo venoso e acelera a resolução do processo inflamatório agudo.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "Aplicação de compressas mornas úmidas no trajeto venoso por 15 a 20 minutos, de 3 a 4 vezes ao dia",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Conduta recomendada pela Infusion Nurses Society (INS) para acelerar a resolução da flebite pós-infusão."
      },
      {
        "letra": "B",
        "texto": "Aplicação de gelo puro em contato direto por mais de 1 hora contínua",
        "isCorreta": false,
        "explicacao": "Incorreta: O gelo direto e prolongado causa queimadura fria e vasoespasmo endotelial que agrava a trombose."
      },
      {
        "letra": "C",
        "texto": "Massagem com álcool canforado sobre o cordão venoso endurecido",
        "isCorreta": false,
        "explicacao": "Incorreta: A massagem mecânica sobre trombo venoso pode desprender êmbolos para o leito pulmonar (risco de TEP)."
      },
      {
        "letra": "D",
        "texto": "Aplicação de torniquete de borracha mantido no braço durante o repouso",
        "isCorreta": false,
        "explicacao": "Incorreta: Interrompe a perfusão arterial e o retorno venoso, com alto risco de síndrome compartimental."
      },
      {
        "letra": "E",
        "texto": "Exposição direta do braço a lâmpada infravermelha a 5 cm da pele",
        "isCorreta": false,
        "explicacao": "Incorreta: Calor radiante descontrolado causa queimadura de segundo grau na derme atrófica do idoso."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "MATERIAIS DE PUNÇÃO VENOSA",
    "categoriaPratica": "acesso_venoso",
    "pergunta": "Selecione todos os materiais necessários para realizar uma nova punção venosa periférica estéril e segura.",
    "audioPath": "/pacientes/teresinha/passo_7.wav",
    "dica": "Lembre-se: cateter sobre agulha de calibre adequado, algodão/swab com álcool 70%, torniquete limpo, curativo estéril transparente e luvas.",
    "opcoes": [
      "Cateter sobre agulha (22G/24G), algodão com álcool 70%, torniquete, curativo estéril transparente, luvas e conector estéril",
      "Agulha de aspiração 40x12, fita gomada comum de papel, tesoura de bancada e água da torneira",
      "Cateter venoso central de duplo lúmen, bisturi de incisão, fio de sutura e caixa de pequena cirurgia",
      "Seringa de 50 mL de vidro reutilizável, agulha de sutura curva e esparadrapo comum",
      "Scalp com asa de borboleta de metal para manter por 7 dias sem troca"
    ],
    "correta": 0,
    "explicacaoGeral": "A separação completa dos insumos estéreis e descartáveis previne quebras de técnica asséptica e múltiplas tentativas de punção dolorosas.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "Cateter sobre agulha (22G/24G), algodão com álcool 70%, torniquete, curativo estéril transparente, luvas e conector estéril",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Lista oficial do checklist de punção venosa periférica segura do Protocolo Nacional de Segurança do Paciente."
      },
      {
        "letra": "B",
        "texto": "Agulha de aspiração 40x12, fita gomada comum de papel, tesoura de bancada e água da torneira",
        "isCorreta": false,
        "explicacao": "Incorreta: A agulha 40x12 mm é exclusiva para reconstituição e aspiração de frascos; seu uso em veia rasga os tecidos e causa flebite imediata."
      },
      {
        "letra": "C",
        "texto": "Cateter venoso central de duplo lúmen, bisturi de incisão, fio de sutura e caixa de pequena cirurgia",
        "isCorreta": false,
        "explicacao": "Incorreta: Trata-se de procedimento médico cirúrgico de acesso central invasivo, incompatível com a punção periférica de enfermaria."
      },
      {
        "letra": "D",
        "texto": "Seringa de 50 mL de vidro reutilizável, agulha de sutura curva e esparadrapo comum",
        "isCorreta": false,
        "explicacao": "Incorreta: Materiais em desuso e inadequados para acesso intravascular periférico moderno."
      },
      {
        "letra": "E",
        "texto": "Scalp com asa de borboleta de metal para manter por 7 dias sem troca",
        "isCorreta": false,
        "explicacao": "Incorreta: Agulhas de metal (scalp) são rígidas e causam transfixação venosa, sendo indicadas apenas para coletas pontuais de sangue."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "DIAGNÓSTICO DIFERENCIAL",
    "categoriaPratica": "acesso_venoso",
    "pergunta": "Qual a principal diferença clínica observada entre flebite inflamatória e infiltração venosa?",
    "audioPath": "/pacientes/teresinha/passo_8.wav",
    "dica": "A flebite é inflamatória (apresenta calor e hiperemia); a infiltração é extravasamento de fluido (apresenta pele fria, pálida e edema tenso).",
    "opcoes": [
      "A flebite apresenta hiperemia, calor local e endurecimento da veia, enquanto a infiltração apresenta pele pálida, fria ao toque e edema perilesional",
      "A infiltração sempre tem pus e calor febril, enquanto a flebite tem temperatura fria",
      "Não há diferença clínica, ambas são exatamente o mesmo evento fisiopatológico",
      "A flebite ocorre apenas em artérias cerebrais e a infiltração ocorre exclusivamente nos ossos",
      "A infiltração cura espontaneamente em 2 minutos sem necessidade de interromper a bomba"
    ],
    "correta": 0,
    "explicacaoGeral": "O achado térmico e de coloração cutânea (hiperemia/calor na flebite versus palidez/frialdade na infiltração) é o pilar do exame físico de enfermagem.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "A flebite apresenta hiperemia, calor local e endurecimento da veia, enquanto a infiltração apresenta pele pálida, fria ao toque e edema perilesional",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Diferenciação fundamental: flebite é calor/vermelhidão; infiltração é frio/palidez por retenção intersticial de líquido infundido."
      },
      {
        "letra": "B",
        "texto": "A infiltração sempre tem pus e calor febril, enquanto a flebite tem temperatura fria",
        "isCorreta": false,
        "explicacao": "Incorreta: Inverte completamente os sinais fisiopatológicos básicos dos dois quadros."
      },
      {
        "letra": "C",
        "texto": "Não há diferença clínica, ambas são exatamente o mesmo evento fisiopatológico",
        "isCorreta": false,
        "explicacao": "Incorreta: Flebite é inflamação da túnica íntima; infiltração é saída de líquido não vesicante para o espaço extravascular."
      },
      {
        "letra": "D",
        "texto": "A flebite ocorre apenas em artérias cerebrais e a infiltração ocorre exclusivamente nos ossos",
        "isCorreta": false,
        "explicacao": "Incorreta: Ambas são complicações típicas e frequentes de acessos venosos periféricos."
      },
      {
        "letra": "E",
        "texto": "A infiltração cura espontaneamente em 2 minutos sem necessidade de interromper a bomba",
        "isCorreta": false,
        "explicacao": "Incorreta: A infiltração mantida pode evoluir para síndrome compartimental, necrose dérmica e perda de função motora do membro."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "ESTADIAMENTO DA FLEBITE",
    "categoriaPratica": "acesso_venoso",
    "pergunta": "Segundo a Infusion Nurses Society (INS), a presença de dor no local com eritema e/ou edema corresponde a qual grau de flebite?",
    "audioPath": "/pacientes/teresinha/passo_9.wav",
    "dica": "A escala INS classifica: Grau 1 (eritema sem dor), Grau 2 (dor com eritema e/ou edema), Grau 3 (dor, eritema e cordão venoso palpável), Grau 4 (cordão venoso > 2,5 cm com drenagem purulenta).",
    "opcoes": [
      "Grau 2 da Escala de Flebite da INS",
      "Grau 1 da Escala de Flebite da INS",
      "Grau 3 da Escala de Flebite da INS",
      "Grau 4 da Escala de Flebite da INS",
      "Grau 0 (ausência de qualquer sinal clínico)"
    ],
    "correta": 0,
    "explicacaoGeral": "O Grau 2 da Escala da INS é definido expressamente por: 'Dor no sítio de acesso com eritema e/ou edema'.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "Grau 2 da Escala de Flebite da INS",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Enquadramento exato conforme a tabela padronizada da Infusion Nurses Society."
      },
      {
        "letra": "B",
        "texto": "Grau 1 da Escala de Flebite da INS",
        "isCorreta": false,
        "explicacao": "Incorreta: O Grau 1 apresenta apenas eritema no sítio com ou sem dor, mas sem edema ou cordão palpável."
      },
      {
        "letra": "C",
        "texto": "Grau 3 da Escala de Flebite da INS",
        "isCorreta": false,
        "explicacao": "Incorreta: O Grau 3 requer a presença adicional de cordão venoso palpável sob a pele."
      },
      {
        "letra": "D",
        "texto": "Grau 4 da Escala de Flebite da INS",
        "isCorreta": false,
        "explicacao": "Incorreta: O Grau 4 é o mais severo, caracterizado por cordão venoso extenso (> 2,5 cm) e drenagem de pus."
      },
      {
        "letra": "E",
        "texto": "Grau 0 (ausência de qualquer sinal clínico)",
        "isCorreta": false,
        "explicacao": "Incorreta: O Grau 0 denota sítio de inserção saudável, pele sem dor e sem nenhuma alteração endotelial."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "FATORES DE RISCO PARA FLEBITE",
    "categoriaPratica": "farmaco",
    "pergunta": "Quais fatores farmacológicos e físicos favorecem o surgimento de flebite química durante infusões periféricas?",
    "audioPath": "/pacientes/teresinha/passo_10.wav",
    "dica": "Medicamentos com pH ácido (< 5) ou alcalino (> 9), alta osmolalidade (> 600 mOsm/L) e tempo de infusão muito rápido irritam o endotélio venoso.",
    "opcoes": [
      "Extremos de pH (< 5 ou > 9), alta osmolalidade da solução e velocidade de infusão rápida sem diluição",
      "Uso de soro fisiológico isotônico 0,9% em velocidade de 10 mL/h",
      "Seleção de cateter de fino calibre (24G) em veia de grosso calibre",
      "Higienização prévia das mãos e antissepsia com clorexidina alcoólica a 0,5%",
      "Infusão de água destilada isotônica em temperatura ambiente constante"
    ],
    "correta": 0,
    "explicacaoGeral": "Soluções com pH ácido (como antibióticos e quimioterápicos) e osmolaridade > 600 mOsm/L causam lesão celular direta na túnica íntima da veia periférica.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "Extremos de pH (< 5 ou > 9), alta osmolalidade da solução e velocidade de infusão rápida sem diluição",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Fatores comprovados de irritação endotelial química; quando presentes, a indicação preferencial é cateter venoso central."
      },
      {
        "letra": "B",
        "texto": "Uso de soro fisiológico isotônico 0,9% em velocidade de 10 mL/h",
        "isCorreta": false,
        "explicacao": "Incorreta: O SF 0,9% é isotônico (308 mOsm/L) e tem excelente tolerabilidade vascular venosa periférica."
      },
      {
        "letra": "C",
        "texto": "Seleção de cateter de fino calibre (24G) em veia de grosso calibre",
        "isCorreta": false,
        "explicacao": "Incorreta: Esta é uma prática protetora que reduz o risco de flebite mecânica ao permitir hemodiluição contínua."
      },
      {
        "letra": "D",
        "texto": "Higienização prévia das mãos e antissepsia com clorexidina alcoólica a 0,5%",
        "isCorreta": false,
        "explicacao": "Incorreta: Procedimento asséptico protetor que previne bacteremia e flebite infecciosa."
      },
      {
        "letra": "E",
        "texto": "Infusão de água destilada isotônica em temperatura ambiente constante",
        "isCorreta": false,
        "explicacao": "Incorreta: A água destilada é fortemente hipotônica (0 mOsm/L) e nunca deve ser infundida pura na corrente sanguínea (risco de hemólise maciça)."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "CÁLCULO EM MINUTOS",
    "categoriaPratica": "calculo",
    "pergunta": "Quantas microgotas por minuto devem ser reguladas para infundir 100 mL de solução em 45 minutos?",
    "audioPath": "/pacientes/teresinha/passo_11.wav",
    "dica": "Quando o tempo é dado em minutos: Microgotas/min = (Volume em mL x 60) / Tempo em minutos. Calcule (100 x 60) / 45.",
    "opcoes": [
      "133 microgotas por minuto (arredondamento de 133,3 microgotas/min)",
      "45 microgotas por minuto (confusão com o tempo da prescrição)",
      "75 microgotas por minuto (ritmo equivalente a 80 minutos)",
      "200 microgotas por minuto (ritmo excessivo de infusão rápida)",
      "60 microgotas por minuto (taxa padrão horária de 100 mL)"
    ],
    "correta": 0,
    "explicacaoGeral": "Fórmula de microgotas em minutos: Microgotas/min = (V x 60) / T (min) = (100 * 60) / 45 = 6000 / 45 = 133,33 microgotas por minuto.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "133 microgotas por minuto (arredondamento de 133,3 microgotas/min)",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Cálculo exato pela fórmula de tempo em minutos: 6000 / 45 = 133,33 microgotas/minuto."
      },
      {
        "letra": "B",
        "texto": "45 microgotas por minuto (confusão com o tempo da prescrição)",
        "isCorreta": false,
        "explicacao": "Incorreta: Erro de inversão utilizando o tempo da prescrição como valor da vazão em gotas."
      },
      {
        "letra": "C",
        "texto": "75 microgotas por minuto (ritmo equivalente a 80 minutos)",
        "isCorreta": false,
        "explicacao": "Incorreta: Vazão insuficiente que levaria quase o dobro do tempo prescrito pelo médico."
      },
      {
        "letra": "D",
        "texto": "200 microgotas por minuto (ritmo excessivo de infusão rápida)",
        "isCorreta": false,
        "explicacao": "Incorreta: Administraria a dose em apenas 30 minutos, acelerando a infusão de forma perigosa."
      },
      {
        "letra": "E",
        "texto": "60 microgotas por minuto (taxa padrão horária de 100 mL)",
        "isCorreta": false,
        "explicacao": "Incorreta: Velocidade que infundiria 100 mL em 100 minutos em vez dos 45 minutos ordenados."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "ANTISSEPSIA DE CONECTORES (SCRUB THE HUB)",
    "categoriaPratica": "acesso_venoso",
    "pergunta": "Qual o tempo mínimo recomendado de fricção mecânica com álcool 70% no conector sem agulha (hub) antes de conectar a linha venosa?",
    "audioPath": "/pacientes/teresinha/passo_12.wav",
    "dica": "A diretriz internacional 'Scrub the Hub' (CDC, INS e ANVISA) preconiza fricção vigorosa por no mínimo 5 a 15 segundos, deixando secar completamente por evaporação.",
    "opcoes": [
      "Fricção vigorosa de 5 a 15 segundos com álcool 70%, permitindo a secagem completa espontânea",
      "Passar o algodão rapidamente em menos de 1 segundo e conectar imediatamente com a superfície ainda molhada",
      "Soprar o conector com a boca para acelerar a secagem do álcool",
      "Lavar o conector com água boricada e sabonete comum",
      "Não é necessário desinfetar conectores fechados com tampa plástica"
    ],
    "correta": 0,
    "explicacaoGeral": "A fricção mecânica ('scrub the hub') durante 5 a 15 segundos remove o biofilme acumulado na válvula do conector, prevenindo infecção de corrente sanguínea (IPCS).",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "Fricção vigorosa de 5 a 15 segundos com álcool 70%, permitindo a secagem completa espontânea",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Medida padrão-ouro comprovada de desinfecção mecânica e química antes de qualquer acesso à linha venosa."
      },
      {
        "letra": "B",
        "texto": "Passar o algodão rapidamente em menos de 1 segundo e conectar imediatamente com a superfície ainda molhada",
        "isCorreta": false,
        "explicacao": "Incorreta: Toques fugazes não desorganizam o biofilme bacteriano aderido e introduzem álcool líquido na veia."
      },
      {
        "letra": "C",
        "texto": "Soprar o conector com a boca para acelerar a secagem do álcool",
        "isCorreta": false,
        "explicacao": "Incorreta: Prática anti-higiênica gravíssima que projeta gotículas de saliva e bactérias orais direto no lúmen do conector."
      },
      {
        "letra": "D",
        "texto": "Lavar o conector com água boricada e sabonete comum",
        "isCorreta": false,
        "explicacao": "Incorreta: Produtos não estéreis sem ação virucida/bactericida certificada em dispositivos intravasculares."
      },
      {
        "letra": "E",
        "texto": "Não é necessário desinfetar conectores fechados com tampa plástica",
        "isCorreta": false,
        "explicacao": "Incorreta: Mesmo tampas protetoras sofrem contaminação por manipulação externa e manuseio no leito."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "TÉCNICA DE FLUSHING",
    "categoriaPratica": "acesso_venoso",
    "pergunta": "Diga qual técnica você realiza com seringa de soro para checar se o acesso venoso está pérvio antes de aplicar o antibiótico.",
    "audioPath": "/pacientes/teresinha/passo_13.wav",
    "dica": "A técnica 'Push-Pause' (pressão pulsátil) com seringa de 10 mL cria turbulência no lúmen, removendo fibrina sem exercer pressão intraluminal excessiva.",
    "opcoes": [
      "Flushing pulsátil (técnica push-pause) com 5 a 10 mL de soro fisiológico 0,9% em seringa de 10 mL para avaliar fluxo e refluxo livre",
      "Injetar 1 mL de ar sob alta pressão para desobstruir o cateter",
      "Usar seringa pequena de 1 mL para injetar solução com força máxima",
      "Aspirar sangue com força até encher uma seringa de 20 mL",
      "Injetar água destilada gelada rapidamente em jato contínuo sem aspirar"
    ],
    "correta": 0,
    "explicacaoGeral": "O uso de seringa de 10 mL evita sobrepressão (> 40 psi que rompe o cateter). O flushing pulsátil gera fluxo turbulento que limpa as paredes internas da veia.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "Flushing pulsátil (técnica push-pause) com 5 a 10 mL de soro fisiológico 0,9% em seringa de 10 mL para avaliar fluxo e refluxo livre",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Técnica preconizada pela INS: avalia desobstrução, previne interação medicamentosa e não rompe veias frágeis."
      },
      {
        "letra": "B",
        "texto": "Injetar 1 mL de ar sob alta pressão para desobstruir o cateter",
        "isCorreta": false,
        "explicacao": "Incorreta: Risco severo de embolia aérea na circulação venosa central."
      },
      {
        "letra": "C",
        "texto": "Usar seringa pequena de 1 mL para injetar solução com força máxima",
        "isCorreta": false,
        "explicacao": "Incorreta: Seringas de 1 a 3 mL geram pressões mecânicas enormes (> 100 psi) que estouram o cateter intravascular."
      },
      {
        "letra": "D",
        "texto": "Aspirar sangue com força até encher uma seringa de 20 mL",
        "isCorreta": false,
        "explicacao": "Incorreta: Aspiração contínua em idosos colapsa a parede da veia frágil sobre o bisel, impedindo a visualização do refluxo."
      },
      {
        "letra": "E",
        "texto": "Injetar água destilada gelada rapidamente em jato contínuo sem aspirar",
        "isCorreta": false,
        "explicacao": "Incorreta: Provoca choque térmico local, dor aguda, queimação e hemólise osmótica imediata."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "PREPARO DO PACIENTE",
    "categoriaPratica": "acesso_venoso",
    "pergunta": "Selecione todos os materiais obrigatórios para realizar nova punção venosa periférica estéril.",
    "audioPath": "/pacientes/teresinha/passo_14.wav",
    "dica": "Além do cateter e luvas, o curativo transparente semipermeável é obrigatório para permitir a visualização diária contínua do sítio de inserção.",
    "opcoes": [
      "Luvas de procedimento, torniquete, antisséptico (álcool 70% ou clorexidina), cateter intravenoso periférico, curativo transparente e conector estéril",
      "Luvas estéreis de cirurgia cardíaca, avental impermeável de chumbo e máscara de solda",
      "Esparadrapo impermeável opaco que cubra totalmente a inserção do cateter impedindo a visualização",
      "Agulha de punção lombar de 15 cm e frascos de cultura para líquor",
      "Gaze com iodo povidona em pomada amarrada com atadura de crepom apertada"
    ],
    "correta": 0,
    "explicacaoGeral": "A ANVISA e o CDC exigem película transparente estéril para fixação do cateter porque ela permite inspecionar precocemente sinais de flebite ou infiltração.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "Luvas de procedimento, torniquete, antisséptico (álcool 70% ou clorexidina), cateter intravenoso periférico, curativo transparente e conector estéril",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Materiais preconizados pelo Protocolo de Terapia Infusional do Ministério da Saúde e ANVISA."
      },
      {
        "letra": "B",
        "texto": "Luvas estéreis de cirurgia cardíaca, avental impermeável de chumbo e máscara de solda",
        "isCorreta": false,
        "explicacao": "Incorreta: Equipamentos de proteção radiológica e de centro cirúrgico desnecessários para punção venosa periférica."
      },
      {
        "letra": "C",
        "texto": "Esparadrapo impermeável opaco que cubra totalmente a inserção do cateter impedindo a visualização",
        "isCorreta": false,
        "explicacao": "Incorreta: O esparadrapo opaco esconde a flebite em estágio inicial e acumula umidade proliferando bactérias."
      },
      {
        "letra": "D",
        "texto": "Agulha de punção lombar de 15 cm e frascos de cultura para líquor",
        "isCorreta": false,
        "explicacao": "Incorreta: Materiais de neurocirurgia e raquicentese, sem aplicação em acesso venoso periférico."
      },
      {
        "letra": "E",
        "texto": "Gaze com iodo povidona em pomada amarrada com atadura de crepom apertada",
        "isCorreta": false,
        "explicacao": "Incorreta: Pomadas na inserção causam maceração da pele e aumentam o risco de infecção fúngica local."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "CÁLCULO DE DIURÉTICO",
    "categoriaPratica": "calculo",
    "pergunta": "Quantos mL de Furosemida você aspira da ampola para administrar a dose prescrita? Prescrição: Furosemida 20 mg EV. Disponível: ampola de 20 mg em 2 mL.",
    "audioPath": "/pacientes/teresinha/passo_15.wav",
    "dica": "Apresentação: 20 mg em 2 mL. Se a prescrição é de 20 mg, qual o volume que contém essa dose exata?",
    "opcoes": [
      "2,0 mL (aspiração do conteúdo integral da ampola de 20 mg/2 mL)",
      "1,0 mL (administração de apenas 10 mg)",
      "4,0 mL (duas ampolas para perfazer 40 mg)",
      "0,5 mL (administração de apenas 5 mg)",
      "0,2 mL (erro de diluição de 10 vezes a menos)"
    ],
    "correta": 0,
    "explicacaoGeral": "Se 20 mg do fármaco estão dissolvidos em 2 mL de veículo na ampola, para ministrar 20 mg aspira-se exatamente os 2,0 mL.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "2,0 mL (aspiração do conteúdo integral da ampola de 20 mg/2 mL)",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Cálculo simples e direto: a ampola inteira de 2 mL contém exatamente os 20 mg prescritos."
      },
      {
        "letra": "B",
        "texto": "1,0 mL (administração de apenas 10 mg)",
        "isCorreta": false,
        "explicacao": "Incorreta: Subdose que não atingirá o limiar natriurético no túbulo renal da paciente."
      },
      {
        "letra": "C",
        "texto": "4,0 mL (duas ampolas para perfazer 40 mg)",
        "isCorreta": false,
        "explicacao": "Incorreta: Superdosagem que pode precipitar hipotensão severa e desidratação súbita na idosa."
      },
      {
        "letra": "D",
        "texto": "0,5 mL (administração de apenas 5 mg)",
        "isCorreta": false,
        "explicacao": "Incorreta: Forneceria apenas 1/4 da dose, sendo clinicamente inócua para alívio de congestão."
      },
      {
        "letra": "E",
        "texto": "0,2 mL (erro de diluição de 10 vezes a menos)",
        "isCorreta": false,
        "explicacao": "Incorreta: Erro grave de volume que administraria apenas 2 mg de princípio ativo."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "ESCOLHA DO CALIBRE DO CATETER",
    "categoriaPratica": "acesso_venoso",
    "pergunta": "Considerando a fragilidade capilar da paciente idosa e a infusão de antibiótico não vesicante, qual o calibre de cateter periférico é o mais indicado?",
    "audioPath": "/pacientes/teresinha/passo_16.wav",
    "dica": "Cateteres finos (22G ou 24G) minimizam o trauma de inserção e permitem fluxo de sangue desimpedido ao redor da cânula plástica.",
    "opcoes": [
      "22G (azul) ou 24G (amarelo), adequados para veias finas e terapia medicamentosa segura",
      "14G (laranja), indicado para infusões ultrarrápidas de grande calibre",
      "16G (cinza), de grosso calibre para ressuscitação volêmica maciça em politrauma",
      "18G (verde), de grande calibre indicado apenas para cirurgias de grande porte",
      "Qualquer agulha de injeção intramuscular de 30x7 mm"
    ],
    "correta": 0,
    "explicacaoGeral": "Em pacientes geriátricos com veias esclerosadas e frágeis, os calibres 22G e 24G são os padrões de excelência recomendados pela INS.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "22G (azul) ou 24G (amarelo), adequados para veias finas e terapia medicamentosa segura",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Reduz o atrito mecânico na túnica íntima e preserva a perviedade da rede venosa periférica frágil."
      },
      {
        "letra": "B",
        "texto": "14G (laranja), indicado para infusões ultrarrápidas de grande calibre",
        "isCorreta": false,
        "explicacao": "Incorreta: Cateter excessivamente espesso exclusivo para choque hemorrágico; em idosos rompe a veia instantaneamente."
      },
      {
        "letra": "C",
        "texto": "16G (cinza), de grosso calibre para ressuscitação volêmica maciça em politrauma",
        "isCorreta": false,
        "explicacao": "Incorreta: Provocaria transfixação venosa e dor intensa desnecessária em uma paciente clínica estável."
      },
      {
        "letra": "D",
        "texto": "18G (verde), de grande calibre indicado apenas para cirurgias de grande porte",
        "isCorreta": false,
        "explicacao": "Incorreta: Ocluira quase toda a luz da veia da Dona Teresinha, impedindo a hemodiluição e gerando nova flebite mecânica."
      },
      {
        "letra": "E",
        "texto": "Qualquer agulha de injeção intramuscular de 30x7 mm",
        "isCorreta": false,
        "explicacao": "Incorreta: Agulhas de injeção IM não são cateteres vasculares e nunca devem ser mantidas na circulação venosa."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "SOBRECARGA HÍDRICA NO IDOSO",
    "categoriaPratica": "sinais_vitais",
    "pergunta": "Quais sinais clínicos em paciente idoso indicam sobrecarga hídrica (hipervolemia) durante terapia intravenosa?",
    "audioPath": "/pacientes/teresinha/passo_17.wav",
    "dica": "A sobrecarga de volume no idoso sobrecarrega o ventrículo esquerdo: observe dispneia súbita, estertores crepitantes nos pulmões, tosse e turgência jugular.",
    "opcoes": [
      "Dispneia súbita, estertores crepitantes na ausculta pulmonar, turgência jugular patológica e tosse produtiva",
      "Boca seca, olhos fundos, sede intensa e diurese concentrada escura",
      "Pele desidratada com turgor lentificado e hipotensão arterial severa",
      "Hipertermia isolada com tremores sem qualquer alteração na respiração",
      "Fome intensa e aumento da acuidade visual durante a infusão"
    ],
    "correta": 0,
    "explicacaoGeral": "Idosos têm menor complacência cardíaca e vascular; o excesso de volume eleva a pressão capilar pulmonar, precipitando Congestão Pulmonar / Edema Agudo de Pulmão.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "Dispneia súbita, estertores crepitantes na ausculta pulmonar, turgência jugular patológica e tosse produtiva",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Sinais cardinais de hipervolemia e edema pulmonar incipiente; exige suspensão imediata da infusão e avaliação médica urgente."
      },
      {
        "letra": "B",
        "texto": "Boca seca, olhos fundos, sede intensa e diurese concentrada escura",
        "isCorreta": false,
        "explicacao": "Incorreta: Descreve quadro clássico de hipovolemia e desidratação hipertônica, o oposto de sobrecarga hídrica."
      },
      {
        "letra": "C",
        "texto": "Pele desidratada com turgor lentificado e hipotensão arterial severa",
        "isCorreta": false,
        "explicacao": "Incorreta: Sinais de depleção volêmica extrema (choque hipovolêmico), não de excesso de líquido."
      },
      {
        "letra": "D",
        "texto": "Hipertermia isolada com tremores sem qualquer alteração na respiração",
        "isCorreta": false,
        "explicacao": "Incorreta: Sugere bacteremia ou reação pirogênica por infusão contaminada, não sobrecarga de volume."
      },
      {
        "letra": "E",
        "texto": "Fome intensa e aumento da acuidade visual durante a infusão",
        "isCorreta": false,
        "explicacao": "Incorreta: Manifestações sem correlação clínica com a mecânica cardiopulmonar da sobrecarga hídrica."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "PRESERVAÇÃO DA PELE DO IDOSO (MARSI)",
    "categoriaPratica": "curativo",
    "pergunta": "Ao retirar o curativo transparente da pele frágil da Dona Teresinha, qual técnica previne lesão por fricção e desnudamento cutâneo?",
    "audioPath": "/pacientes/teresinha/passo_18.wav",
    "dica": "Puxe a película esticando-a paralelamente à pele (técnica de estiramento horizontal/stretch), nunca tracionando perpendicularmente para cima a 90 graus.",
    "opcoes": [
      "Tracionar o filme delicadamente paralelo à pele (técnica de estiramento horizontal), segurando a pele adjacente com a outra mão",
      "Arrancar o adesivo rapidamente para cima em ângulo reto de 90 graus",
      "Usar removedor com solvente de acetona pura direto sobre a ferida",
      "Esfregar gaze seca até descolar o filme com atrito mecânico",
      "Puxar a película com pinça dente-de-rato sem apoiar a pele"
    ],
    "correta": 0,
    "explicacaoGeral": "A técnica de descolamento horizontal (estiramento lateral paralelo) quebra a adesão molecular do polímero sem destacar a epiderme atrófica da idosa (prevenção de MARSI).",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "Tracionar o filme delicadamente paralelo à pele (técnica de estiramento horizontal), segurando a pele adjacente com a outra mão",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Prática recomendada para prevenir MARSI (Medical Adhesive-Related Skin Injury) em pacientes geriátricos."
      },
      {
        "letra": "B",
        "texto": "Arrancar o adesivo rapidamente para cima em ângulo reto de 90 graus",
        "isCorreta": false,
        "explicacao": "Incorreta: Arranca a epiderme (skin tear), gerando desnudamento cutâneo, dor intensa e sangramento capilar."
      },
      {
        "letra": "C",
        "texto": "Usar removedor com solvente de acetona pura direto sobre a ferida",
        "isCorreta": false,
        "explicacao": "Incorreta: A acetona causa dor excruciante, necrose celular e toxicidade dérmica química."
      },
      {
        "letra": "D",
        "texto": "Esfregar gaze seca até descolar o filme com atrito mecânico",
        "isCorreta": false,
        "explicacao": "Incorreta: O atrito repetido esfolia as camadas superficiais e amplia a vermelhidão inflamatória."
      },
      {
        "letra": "E",
        "texto": "Puxar a película com pinça dente-de-rato sem apoiar a pele",
        "isCorreta": false,
        "explicacao": "Incorreta: Concentra toda a tensão em um único ponto, rasgando o tecido cutâneo adelgaçado."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "PROGRAMAÇÃO DE BOMBA DE INFUSÃO",
    "categoriaPratica": "calculo",
    "pergunta": "A quantos mL/h deve ser programada a Bomba de Infusão para administrar 250 mL de Soro Fisiológico em 4 horas?",
    "audioPath": "/pacientes/teresinha/passo_19.wav",
    "dica": "Vazão da Bomba (mL/h) = Volume total (mL) / Tempo total (horas). Calcule 250 / 4.",
    "opcoes": [
      "62,5 mL/h (velocidade calculada exatamente pela divisão 250 mL / 4 horas)",
      "125 mL/h (ritmo acelerado que correria em 2 horas)",
      "31,25 mL/h (ritmo lento que demoraria 8 horas)",
      "25 mL/h (ritmo que demoraria 10 horas)",
      "250 mL/h (infusão do volume total em apenas 1 hora)"
    ],
    "correta": 0,
    "explicacaoGeral": "Vazão em mL/h = 250 mL / 4 horas = 62,5 mL/h. As bombas de infusão digitais aceitam decimais de 0,1 mL/h.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "62,5 mL/h (velocidade calculada exatamente pela divisão 250 mL / 4 horas)",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Cálculo preciso: 250 / 4 = 62,5 mL/h programados no painel digital da BIC."
      },
      {
        "letra": "B",
        "texto": "125 mL/h (ritmo acelerado que correria em 2 horas)",
        "isCorreta": false,
        "explicacao": "Incorreta: Dobraria a velocidade de entrada de sódio e água na circulação da paciente idosa."
      },
      {
        "letra": "C",
        "texto": "31,25 mL/h (ritmo lento que demoraria 8 horas)",
        "isCorreta": false,
        "explicacao": "Incorreta: Administraria a hidratação na metade da taxa estipulada, mantendo o balanço hídrico negativo."
      },
      {
        "letra": "D",
        "texto": "25 mL/h (ritmo que demoraria 10 horas)",
        "isCorreta": false,
        "explicacao": "Incorreta: Velocidade excessivamente lenta incompatível com o plano terapêutico prescrito."
      },
      {
        "letra": "E",
        "texto": "250 mL/h (infusão do volume total em apenas 1 hora)",
        "isCorreta": false,
        "explicacao": "Incorreta: Infundiria a bolsa inteira em 60 minutos, gerando pico hemodinâmico arriscado."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "COLETA DE EXAMES MICROBIOLÓGICOS",
    "categoriaPratica": "geral",
    "pergunta": "Para garantir a confiabilidade do diagnóstico microbiológico, quando deve ser colhida a urocultura da Dona Teresinha?",
    "audioPath": "/pacientes/teresinha/passo_20.wav",
    "dica": "A urocultura e antibiograma devem ser colhidos SEMPRE ANTES de iniciar a primeira dose do antimicrobiano.",
    "opcoes": [
      "Antes de iniciar a primeira dose do antibiótico na veia",
      "Após 3 dias de tratamento com antibiótico contínuo",
      "No momento da alta hospitalar da paciente",
      "Apenas se a paciente apresentar febre acima de 40 graus",
      "Uma semana após o término completo de todas as medicações"
    ],
    "correta": 0,
    "explicacaoGeral": "A administração prévia de antibiótico esteriliza transitoriamente a urina ou inibe o crescimento in vitro, falseando o resultado da cultura e atrasando o tratamento correto.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "Antes de iniciar a primeira dose do antibiótico na veia",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Regra de ouro da infectologia e microbiologia clínica: garante a identificação fidedigna do patógeno e do perfil de sensibilidade aos antibióticos."
      },
      {
        "letra": "B",
        "texto": "Após 3 dias de tratamento com antibiótico contínuo",
        "isCorreta": false,
        "explicacao": "Incorreta: O antibiótico já circulante matará as bactérias da amostra, gerando falso-negativo na urocultura."
      },
      {
        "letra": "C",
        "texto": "No momento da alta hospitalar da paciente",
        "isCorreta": false,
        "explicacao": "Incorreta: O exame serve para direcionar a terapia no início da internação, não como formalidade tardia."
      },
      {
        "letra": "D",
        "texto": "Apenas se a paciente apresentar febre acima de 40 graus",
        "isCorreta": false,
        "explicacao": "Incorreta: Idosos com infecção urinária grave frequentemente não desenvolvem picos febris altos por imunossenescência."
      },
      {
        "letra": "E",
        "texto": "Uma semana após o término completo de todas as medicações",
        "isCorreta": false,
        "explicacao": "Incorreta: Esse período avalia cura tardia, mas não permite escolher o antibiótico certo na admissão hospitalar."
      }
    ]
  },
  {
    "tipo": "multipla_escolha",
    "tema": "EDUCAÇÃO EM SAÚDE E ORIENTAÇÃO AO PACIENTE",
    "categoriaPratica": "acesso_venoso",
    "pergunta": "Quais orientações você fornece à Dona Teresinha sobre o cuidado com o novo sítio de punção venosa?",
    "audioPath": "/pacientes/teresinha/passo_21.wav",
    "dica": "Oriente a não molhar o curativo no banho, não tracionar a linha venosa e avisar imediatamente se sentir dor, queimação ou umidade no local.",
    "opcoes": [
      "Avisar imediatamente a enfermagem caso sinta dor, queimação ou umidade, proteger o curativo no banho e evitar movimentos bruscos com o braço",
      "Pedir para a paciente puxar o cateter caso sinta qualquer ardência sem chamar a equipe",
      "Lavar o local da punção com sabonete comum e bucha durante o banho de chuveiro",
      "Manter o braço imóvel engessado com tala rígida sem mexer os dedos",
      "Abrir a tampa do conector para conferir se o sangue está saindo livremente"
    ],
    "correta": 0,
    "explicacaoGeral": "A educação empática empodera o paciente como parceiro na sua própria segurança, permitindo identificar precocemente sinais de infiltração ou extravasamento.",
    "explicacaoAlternativas": [
      {
        "letra": "A",
        "texto": "Avisar imediatamente a enfermagem caso sinta dor, queimação ou umidade, proteger o curativo no banho e evitar movimentos bruscos com o braço",
        "isCorreta": true,
        "explicacao": "Correta (Gabarito): Orientações seguras, claras e preventivas preconizadas pelo Programa Nacional de Segurança do Paciente."
      },
      {
        "letra": "B",
        "texto": "Pedir para a paciente puxar o cateter caso sinta qualquer ardência sem chamar a equipe",
        "isCorreta": false,
        "explicacao": "Incorreta: A auto-remoção sem técnica estéril causa hemorragia venosa local e contaminação bacteriana da pele."
      },
      {
        "letra": "C",
        "texto": "Lavar o local da punção com sabonete comum e bucha durante o banho de chuveiro",
        "isCorreta": false,
        "explicacao": "Incorreta: A umidade sob o curativo favorece proliferação de fungos e bactérias e descola o adesivo."
      },
      {
        "letra": "D",
        "texto": "Manter o braço imóvel engessado com tala rígida sem mexer os dedos",
        "isCorreta": false,
        "explicacao": "Incorreta: A imobilização excessiva predispõe a rigidez articular, edema de estase e trombose venosa profunda."
      },
      {
        "letra": "E",
        "texto": "Abrir a tampa do conector para conferir se o sangue está saindo livremente",
        "isCorreta": false,
        "explicacao": "Incorreta: Abrir o circuito fechado sem técnica asséptica introduz ar e microrganismos diretamente na corrente sanguínea."
      }
    ]
  }
]
  }
};

/**
 * Algoritmo Fisher-Yates com alta entropia para embaralhamento imutável.
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
 * Embaralha as 5 alternativas de uma questão mantendo o gabarito
 * e reorganizando as explicações por alternativa.
 */
export function embaralharQuestao(questao) {
  if (!questao || !Array.isArray(questao.opcoes) || questao.opcoes.length !== 5) {
    return { ...questao };
  }

  const indices = [0, 1, 2, 3, 4];
  const shuffledIndices = shuffleArray(indices);
  const letras = ['A', 'B', 'C', 'D', 'E'];

  const novasOpcoes = shuffledIndices.map(oldIdx => questao.opcoes[oldIdx]);
  const novaCorreta = shuffledIndices.indexOf(questao.correta);

  // Remapeia explicacaoAlternativas
  let novasExplicacoes = [];
  if (Array.isArray(questao.explicacaoAlternativas)) {
    novasExplicacoes = shuffledIndices.map((oldIdx, newIdx) => {
      const orig = questao.explicacaoAlternativas[oldIdx];
      return {
        ...orig,
        letra: letras[newIdx],
        texto: questao.opcoes[oldIdx],
        isCorreta: oldIdx === questao.correta
      };
    });
  }

  return {
    ...questao,
    opcoes: novasOpcoes,
    correta: novaCorreta >= 0 ? novaCorreta : 0,
    explicacaoAlternativas: novasExplicacoes
  };
}

/**
 * Gera um caso clínico pronto para a lição, suportando:
 * - mode: 'rapida' (4 a 6 questões, default 5)
 * - mode: 'normal' (7 a 9 questões, default 8)
 * - mode: 'revisao' (carrega questões marcadas amarelas e vermelhas)
 * - categoria: filtro opcional ('calculo', 'curativo', 'farmaco', 'acesso_venoso', 'sinais_vitais', 'geral', 'todos')
 * - pacienteId: 'marcus' ou 'teresinha' (se null, sorteia aleatoriamente)
 */
export function gerarCasoAleatorio(pacienteId = null, options = {}) {
  const {
    mode = "normal", // 'rapida' | 'normal' | 'revisao'
    categoria = "todos",
    shuffleQuestions = true,
    revisaoQuestoes = []
  } = options;

  // 1. Sorteio de Paciente se não fornecido
  const idsDisponiveis = Object.keys(CASOS_SIMULADOR);
  const idEscolhido = pacienteId || idsDisponiveis[Math.floor(Math.random() * idsDisponiveis.length)];
  const casoBase = CASOS_SIMULADOR[idEscolhido] || CASOS_SIMULADOR.marcus;
  const falaInicial = casoBase.passos.find((p) => p.tipo === "fala") || casoBase.passos[0];

  // 2. Coleta de questões elegíveis
  let bancoGeral = casoBase.passos.filter((p) => p.tipo !== "fala");

  // Filtro por categoria se especificado
  if (categoria && categoria !== "todos") {
    const filtradas = bancoGeral.filter(q => q.categoriaPratica === categoria);
    if (filtradas.length >= 4) {
      bancoGeral = filtradas;
    }
  }

  // 3. Determinação da quantidade por modo
  let qtdDesejada = 8;
  if (mode === "rapida") {
    // 4 a 6 questões (padrão 5)
    qtdDesejada = Math.min(bancoGeral.length, Math.floor(Math.random() * 3) + 4);
  } else if (mode === "normal") {
    // 7 a 9 questões (padrão 8)
    qtdDesejada = Math.min(bancoGeral.length, Math.floor(Math.random() * 3) + 7);
  } else if (mode === "revisao" && Array.isArray(revisaoQuestoes) && revisaoQuestoes.length > 0) {
    bancoGeral = revisaoQuestoes;
    qtdDesejada = revisaoQuestoes.length;
  }

  // Embaralha o banco de questões
  const questoesEmbaralhadasOrdem = shuffleQuestions ? shuffleArray(bancoGeral) : [...bancoGeral];
  const selecionadas = questoesEmbaralhadasOrdem.slice(0, qtdDesejada);

  // Embaralha as 5 alternativas de cada questão mantendo o gabarito
  const questoesComAlternativasShuffled = selecionadas.map((q, idx) => {
    const qEmbaralhada = embaralharQuestao(q);
    // Limpeza mandatória de propriedades residuais para garantir questão 100% nova e sem travas
    delete qEmbaralhada.status;
    delete qEmbaralhada.escolhaAluno;
    delete qEmbaralhada.alternativaEscolhidaTexto;
    delete qEmbaralhada.gabaritoTexto;
    delete qEmbaralhada.opcoesFalhadas;
    return {
      ...qEmbaralhada,
      numQuestao: idx + 1,
      totalQuestoes: selecionadas.length
    };
  });

  return {
    ...casoBase,
    pacienteId: idEscolhido,
    modoAtividade: mode,
    subtitulo: `Paciente simulado fala com você · Atividade ${mode === 'rapida' ? 'Rápida' : mode === 'revisao' ? 'de Revisão' : 'Normal'} (${questoesComAlternativasShuffled.length} questões)`,
    passos: [falaInicial, ...questoesComAlternativasShuffled]
  };
}
