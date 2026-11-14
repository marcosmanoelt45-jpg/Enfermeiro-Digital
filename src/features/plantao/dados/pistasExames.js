// O que o aluno encontra ao examinar, em cada exame do Plantão que ainda não tem minijogo interativo.
// Sem isso a pergunta de múltipla escolha não tinha de onde tirar a resposta (ex.: "Pupilas" com 4 opções e nada
// para olhar). Cada pista mostra o ACHADO BRUTO, sem a conclusão: o aluno interpreta e escolhe.
//   imagem:  foto/ilustração do achado (feita no Flow; public/plantao/exames/<cenario>-<campo>.webp)
//   monitor: tela do monitor multiparamétrico ({ fc, ritmo: "sinusal" | "taquicardia", spo2, o2 })
//   medidas: números medidos à beira-leito ([rótulo, valor])
//   laudo:   resultado de laboratório ([exame, valor, referência])
//   notas:   o que você vê, ouve ou o paciente diz
// Chave: "<cenario>.<campo>" (o mesmo `campo` da lacuna em src/data/sbarPlantaoDados.js).
const img = (chave) => `/plantao/exames/${chave.replace(".", "-")}.webp`;

export const PISTAS_EXAMES = {
  "pos_op.ferida_dreno": {
    imagem: img("pos_op.ferida_dreno"),
    medidas: [["Reservatório do Portovac", "120 mL"], ["Desde o esvaziamento", "12 horas"]],
    notas: ["A gaze sobre a incisão está branca, sem manchas.", "O líquido do reservatório é rosado-avermelhado, sem coágulos."],
  },
  "pos_op.abdome": {
    notas: [
      "À palpação superficial e profunda, o abdome cede fácil sob a mão.",
      "Ele só reclama quando você chega perto dos pontos: \"dói uns 4 de 10\".",
      "Descompressão brusca: sem dor.",
      "Ruídos hidroaéreos presentes.",
    ],
  },
  "icc.edema_mmii": {
    imagem: img("icc.edema_mmii"),
    notas: [
      "Você aperta por 5 segundos sobre a tíbia: a marca do dedo fica funda (cerca de 6 mm) e demora a sumir.",
      "Acontece igual nas duas pernas.",
      "Pele sem vermelhidão e sem calor.",
    ],
  },
  "icc.turgencia_jugular": {
    imagem: img("icc.turgencia_jugular"),
    notas: ["Cabeceira a 45 graus.", "A veia do pescoço fica cheia e pulsando bem acima da clavícula, dos dois lados."],
  },
  "bronquiolite_lactente.tiragem": {
    imagem: img("bronquiolite_lactente.tiragem"),
    notas: [
      "A pele afunda entre as costelas e logo abaixo delas a cada inspiração.",
      "Na expiração não há gemido.",
      "Lábios e dedos rosados.",
    ],
  },
  "bronquiolite_lactente.alimentacao_diurese": {
    medidas: [["Leite materno aceito na colher", "60 mL"], ["Fraldas pesadas em 12 h", "4"]],
    notas: ["Fontanela plana, nem funda nem abaulada."],
  },
  "pre_eclampsia_grave.reflexo_patelar": {
    notas: [
      "Com o martelo no tendão patelar, a perna estende num chute normal.",
      "A resposta é igual dos dois lados.",
      "Ao dorsifletir o pé com força, não aparecem abalos repetidos.",
    ],
  },
  "pre_eclampsia_grave.diurese": {
    medidas: [["Bolsa coletora", "90 mL"], ["Período", "últimas 2 horas"]],
    notas: ["Urina amarelo-clara, sem sangue.", "A sonda está drenando."],
  },
  "pre_eclampsia_grave.bcf": {
    monitor: { titulo: "Sonar Doppler", bcf: 144 },
    notas: ["Durante 1 minuto, o batimento varia entre 138 e 150 bpm, sem quedas."],
  },
  "avc_isquemico.glasgow": {
    notas: [
      "Ele já está de olhos abertos quando você entra.",
      "Responde às perguntas, mas diz que está \"em casa\" e erra o mês.",
      "Aperta a sua mão e mostra a língua quando você pede.",
    ],
  },
  "avc_isquemico.forca_motora": {
    notas: [
      "Braço direito: levanta contra a gravidade, mas não vence a sua resistência.",
      "Pelo registro do plantão anterior, ontem ele não saía do lençol.",
      "Braço esquerdo e pernas vencem a resistência normalmente.",
    ],
  },
  "avc_isquemico.sangramento": {
    notas: ["Gengivas e escova de dentes sem sangue.", "Sítio de punção no antebraço sem roxo.", "Ele nega dor de cabeça."],
  },
  "delirium.cam": {
    notas: [
      "Ora acompanha a conversa, ora desvia o olhar e perde o fio.",
      "Diz que estamos em 1998 e que é de manhã (são 20h).",
      "Contando de 20 para trás, para no 17.",
      "Tem momentos de calma e momentos de inquietação.",
    ],
  },
  "delirium.acesso_venoso": {
    imagem: img("delirium.acesso_venoso"),
    notas: ["O soro goteja bem.", "A pele ao redor está sem vermelhidão, sem inchaço e sem dor ao toque."],
  },
  "delirium.seguranca_leito": {
    imagem: img("delirium.seguranca_leito"),
    notas: ["Você confere o outro lado da cama: a grade também está levantada.", "A campainha está presa no lençol, ao alcance da mão dele."],
  },
  "dpoc.esforco_resp": {
    notas: [
      "Os espaços entre as costelas afundam um pouco ao inspirar.",
      "Ele fala \"tô... com... falta... de ar\", em frases de 3 a 4 palavras.",
      "Lábios rosados.",
    ],
  },
  "dpoc.oxigenoterapia": { monitor: { spo2: 92, fc: 98, ritmo: "sinusal", o2: "Máscara de Venturi · válvula 28%" } },
  "sepse_urinaria.perfusao": {
    notas: ["Ao tocar as mãos, a pele está fria e úmida.", "Você aperta a unha por 5 segundos: a cor demora 4 segundos para voltar."],
  },
  "sepse_urinaria.diurese": {
    medidas: [["Bolsa coletora", "40 mL"], ["Período", "últimas 2 horas"]],
    notas: ["Urina escura, cor de chá.", "Cheiro forte e desagradável."],
  },
  "sepse_urinaria.nivel_consciencia": {
    notas: [
      "Está de olhos fechados e abre quando você chama o nome dela.",
      "Responde devagar e não sabe onde está.",
      "Volta a cochilar quando ninguém fala com ela.",
    ],
  },
  "iam_st.sitio_puncao": {
    imagem: img("iam_st.sitio_puncao"),
    notas: ["Ao redor do curativo, a coxa está macia, sem endurecimento nem aumento.", "Com o estetoscópio sobre o local: sem sopro."],
  },
  "iam_st.pulso_pedioso": {
    notas: ["No dorso do pé direito, o pulso bate forte e regular, igual ao do esquerdo.", "Pé quente e rosado; ele mexe os dedos sem formigamento."],
  },
  "iam_st.dor_toracica": {
    monitor: { fc: 76, ritmo: "sinusal", spo2: 97 },
    notas: ["Você pergunta da dor no peito: \"nada, tô bem\"."],
  },
  "trauma_cranio.glasgow": {
    notas: [
      "Abre os olhos só quando você chama o nome dele em voz alta.",
      "Responde, mas confuso: diz que está no trabalho.",
      "Obedece: aperta a sua mão e levanta o braço.",
    ],
  },
  "trauma_cranio.pupilas": {
    imagem: img("trauma_cranio.pupilas"),
    notas: ["Com a lanterna, as duas pupilas contraem rápido e por igual.", "Na régua pupilar, as duas medem 3 mm."],
  },
  "trauma_cranio.cefaleia_vomito": {
    notas: [
      "Ele diz que a dor de cabeça é \"uns 5 de 10\" e melhorou depois da dipirona das 16h.",
      "Último vômito registrado às 15h; agora são 18h.",
    ],
  },
  "cetoacidose_pediatrica.glicemia": {
    medidas: [["Glicemia capilar agora", "260 mg/dL"], ["Há 1 hora", "320 mg/dL"], ["Há 2 horas", "380 mg/dL"]],
  },
  "cetoacidose_pediatrica.potassio": {
    laudo: [["Potássio sérico", "4,2 mEq/L", "3,5 a 5,0"]],
    notas: ["Na bomba de infusão: SF 0,9% com KCl 19,1% correndo."],
  },
  "pancreatite_aguda.abdome": {
    imagem: img("pancreatite_aguda.abdome"),
    notas: ["O abdome está tenso ao toque.", "Na ausculta, você ouve só um ruído a cada minuto, mais ou menos."],
  },
  "pancreatite_aguda.sng": {
    imagem: img("pancreatite_aguda.sng"),
    medidas: [["Frasco da SNG", "350 mL"], ["Período", "12 horas"]],
    notas: ["A sonda está aberta, em drenagem."],
  },
  "pancreatite_aguda.diurese": { medidas: [["Bolsa coletora", "320 mL"], ["Período", "últimas 6 horas"]] },
  "choque_anafilatico.pele": {
    imagem: img("choque_anafilatico.pele"),
    notas: ["Comparando com a foto da admissão, as placas estão menores e mais claras."],
  },
  "choque_anafilatico.alergia_registro": {
    imagem: img("choque_anafilatico.alergia_registro"),
    notas: ["No prontuário, campo Alergias: \"amoxicilina e penicilinas (beta-lactâmicos): anafilaxia\"."],
  },
  "queimado_agudo.diurese_horaria": { medidas: [["Diurese na última hora", "55 mL"], ["Peso", "70 kg"]] },
  "queimado_agudo.extremidades": {
    notas: ["Mãos e pés quentes.", "Você aperta a unha: a cor volta em 2 segundos."],
  },
  "queimado_agudo.face_via_aerea": {
    notas: [
      "Pálpebras e lábios um pouco inchados.",
      "Voz normal, sem rouquidão.",
      "Respiração silenciosa, sem ruído ao inspirar.",
      "Sem fuligem na boca nem no escarro.",
    ],
  },
  "politrauma_bacia.contencao_pelvica": { imagem: img("politrauma_bacia.contencao_pelvica") },
  "politrauma_bacia.pulsos": {
    notas: ["Pulsos femorais fortes e iguais.", "Pediosos palpáveis dos dois lados.", "Pés quentes."],
  },
  "politrauma_bacia.hematocrito": { laudo: [["Hematócrito", "28%", "homem: 40 a 52%"]], notas: ["Coletado após o 2º concentrado de hemácias."] },
  "hemorragia_digestiva.sangramento": {
    notas: ["A cuba ao lado do leito está vazia desde a última troca, há 1 hora.", "Na fralda: fezes pretas, pegajosas e de cheiro forte."],
  },
  "hemorragia_digestiva.nivel_consciencia": {
    notas: ["Está cochilando e abre os olhos quando chamado.", "Sabe o próprio nome, onde está e o dia de hoje."],
  },
  "hemorragia_digestiva.acesso_central": {
    imagem: img("hemorragia_digestiva.acesso_central"),
    notas: ["Ao lavar com soro, o cateter flui sem resistência.", "O curativo transparente está íntegro, sem sangue."],
  },
  "tep_pos_op.panturrilha": {
    imagem: img("tep_pos_op.panturrilha"),
    notas: ["A panturrilha esquerda está 3 cm mais grossa que a direita.", "O músculo está endurecido ao apertar e dói."],
  },
  "tep_pos_op.oxigenacao": { monitor: { spo2: 95, fc: 104, ritmo: "sinusal", o2: "Máscara de Venturi · válvula 35%" } },
  "tep_pos_op.sangramento": {
    notas: ["Curativo da cirurgia seco.", "Gengivas sem sangue e sem manchas roxas na pele."],
  },
  "falciforme_toracica.oxigenacao": {
    medidas: [["SatO2 em ar ambiente (1 min sem cateter)", "91%"], ["SatO2 com cateter nasal a 2 L/min", "95%"]],
  },
  "falciforme_toracica.dor": {
    notas: [
      "Ele põe a mão no lado esquerdo do peito ao inspirar fundo: \"dói quando eu respiro\".",
      "Sobre as pernas: \"dói uns 3, depois da morfina\".",
    ],
  },
  "falciforme_toracica.radiografia": { imagem: img("falciforme_toracica.radiografia"), notas: ["Compare com o RX da admissão, que estava limpo."] },
  "paliativos_terminal.conforto": {
    notas: ["Rosto relaxado, testa sem franzir.", "Respira com calma, sem gemido.", "Mãos abertas sobre o lençol."],
  },
  "paliativos_terminal.hipodermoclise": {
    imagem: img("paliativos_terminal.hipodermoclise"),
    notas: ["O soro goteja.", "A pele ao redor da agulha está sem vermelhidão e macia."],
  },
  "paliativos_terminal.respiracao": {
    notas: ["Há um ruído leve de \"ronco\" na garganta a cada respiração.", "Respiração lenta e regular, sem afundar entre as costelas."],
  },
  "crise_tireotoxica.temperatura_pele": { medidas: [["Termômetro axilar", "39,8 °C"]], notas: ["Pele quente e molhada de suor."] },
  "crise_tireotoxica.ritmo_cardiaco": { monitor: { fc: 158, ritmo: "taquicardia", spo2: 96 } },
  "crise_tireotoxica.neuro_pulmao": {
    notas: ["Com as mãos estendidas, aparece um tremor fino e rápido.", "Na ausculta, murmúrio presente, sem crepitações.", "Alerta e agitada."],
  },
  "srpa_colectomia.via_aerea_respiracao": {
    monitor: { spo2: 89, fc: 104, ritmo: "taquicardia", o2: "Ar ambiente" },
    notas: ["Você conta 8 respirações em 1 minuto, curtas e superficiais.", "Há um ronco leve quando ele cochila.", "A pele dos lábios está levemente arroxeada."],
  },
  "srpa_colectomia.consciencia_aldrete": {
    medidas: [["Atividade", "move os 4 membros quando pedido"], ["PA agora × basal", "92/54 × 135/80 mmHg"]],
    notas: ["Ele só abre os olhos quando você chama alto o nome dele e volta a cochilar.", "Quando acordado, respira fundo se você pede, mas logo fica superficial de novo."],
  },
  "caso2_apendicectomia_dm.glicemia": {
    laudo: [["Glicemia capilar (antes do almoço)", "238 mg/dL", "70 a 180 mg/dL no paciente internado"]],
    notas: ["Ele diz que tomou só metade do café por causa da náusea."],
  },
  "caso2_apendicectomia_dm.abdome": {
    notas: ["O abdome está abaulado e um pouco tenso, mas cede à palpação.", "Na ausculta, poucos ruídos hidroaéreos em 1 minuto.", "Ele diz que não soltou gases desde a cirurgia.", "A gaze do curativo está branca e seca."],
  },
};

export const pistaDoExame = (cenarioId, campo) => PISTAS_EXAMES[`${cenarioId}.${campo}`] ?? null;
