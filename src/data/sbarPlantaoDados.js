/**
 * sbarPlantaoDados.js
 * Dados do "Plantão com a Enfermeira" (C13): lacunas, perguntas e elementos-chave de cada cenário de
 * `sbarHandoffScenarios.js`. Ficam à parte para a página antiga de SBAR não ser tocada: o cenário completo
 * é montado por `cenarioDoPlantao(id)` / `PLANTAO_CENARIOS` (campos só acrescentados, nenhum removido).
 *
 * Lacuna: um campo do prontuário que o aluno só conhece depois de "examinar".
 *   - `minijogo`: id de um minijogo do registro (ex.: "ausculta-pulmonar") cujo `achado.valor` é o `valorEsperado`;
 *   - sem minijogo, `exame` é uma pergunta de múltipla escolha (a opção correta é o `valorEsperado`);
 *   - `gapKey` (radar da semiologia) fica como reserva, hoje sempre null.
 * Pergunta: `espera.tipo` "numero" confere os `campos` (chaves de `vitals`) por código; "texto" vai para a avaliação.
 * `dependeDe` aponta o `campo` de uma lacuna: sem avaliá-la, a enfermeira reage com "não avaliou".
 * Perguntas dos cenários seguem o id `plt.<cenario>.<codigo>`.
 */
import { PRESET_HANDOFF_SCENARIOS } from "./sbarHandoffScenarios.js";

const opcao = (texto, correta, feedback) => ({ texto, correta, feedback });
// Lacuna com exame de múltipla escolha. `erradas`: [[texto, feedback], ...] (3 distratores).
const lacuna = ({ campo, rotulo, valorEsperado, pergunta, feedbackCerto, erradas }) => ({
  campo, rotulo, minijogo: null, gapKey: null, valorEsperado,
  exame: { pergunta, opcoes: [opcao(valorEsperado, true, feedbackCerto), ...erradas.map(([t, f]) => opcao(t, false, f))] },
});
const lacunaMinijogo = ({ campo, rotulo, minijogo, valorEsperado }) => ({ campo, rotulo, minijogo, gapKey: null, valorEsperado });
const pergunta = (id, letra, texto, espera, dependeDe) => ({ id, letra, texto, espera, ...(dependeDe ? { dependeDe } : {}) });
const texto = { tipo: "texto" };
const numero = (...campos) => ({ tipo: "numero", campos });

export const PLANTAO_EXTRAS = {
  pos_op: {
    lacunas: [
      lacuna({
        campo: "ferida_dreno", rotulo: "Ferida operatória e dreno",
        valorEsperado: "curativo limpo e seco; dreno de Portovac com 120 mL serossanguinolento em 12 horas",
        pergunta: "Você inspeciona a incisão e o dreno de Portovac. O que encontra?",
        feedbackCerto: "Isso. Curativo limpo e seco e dreno serossanguinolento, com 120 mL em 12 horas, é o esperado no 1º dia.",
        erradas: [
          ["curativo com secreção purulenta e hiperemia ao redor da incisão", "Não há sinal de infecção de ferida neste paciente."],
          ["dreno com sangue vivo e 400 mL em 12 horas", "Esse débito seria hemorragia. O débito aqui é de 120 mL, serossanguinolento."],
          ["dreno sem débito, com saída de líquido pelo curativo", "O dreno está funcionante e o curativo, seco."],
        ],
      }),
      lacuna({
        campo: "abdome", rotulo: "Abdome",
        valorEsperado: "flácido, doloroso só na incisão (EVA 4/10), sem sinais de peritonite",
        pergunta: "Você palpa o abdome do paciente. O que encontra?",
        feedbackCerto: "Isso. Abdome flácido, com dor restrita à incisão e EVA 4/10, sem sinais de irritação peritoneal.",
        erradas: [
          ["rígido, em tábua, com dor à descompressão brusca", "Isso sugeriria peritonite, o que não é o caso."],
          ["muito distendido, timpânico e sem ruídos hidroaéreos", "O paciente não apresenta distensão nem íleo."],
          ["globoso, com macicez e piora progressiva da dor", "Não há sinais de coleção ou piora da dor."],
        ],
      }),
    ],
    perguntas: [
      pergunta("plt.pos_op.s1", "S", "Quem é o paciente e por que ele está internado?", texto),
      pergunta("plt.pos_op.s2", "S", "Qual o leito e em que dia de pós-operatório ele está?", texto),
      pergunta("plt.pos_op.b1", "B", "Ele tem alergia ou alguma doença de base que eu precise saber?", texto),
      pergunta("plt.pos_op.a1", "A", "Como estão os sinais vitais?", numero("pa_sistolica", "pa_diastolica", "fc", "sat")),
      pergunta("plt.pos_op.a2", "A", "E a ferida e o dreno? Quanto saiu?", texto, "ferida_dreno"),
      pergunta("plt.pos_op.a3", "A", "Como está o abdome? Ele tem dor?", texto, "abdome"),
      pergunta("plt.pos_op.r1", "R", "O que eu preciso vigiar no meu plantão?", texto),
      pergunta("plt.pos_op.r2", "R", "Tem medicação ou exame com horário pra eu checar?", texto),
    ],
    elementosChave: {
      S: ["identificação (iniciais e idade)", "leito e setor", "colectomia por diverticulite", "1º dia de pós-operatório"],
      B: ["diverticulite aguda como motivo", "hipertenso, usa losartana", "sem alergias medicamentosas"],
      A: ["PA, FC e saturação", "dor na escala (EVA 4/10)", "dreno com 120 mL em 12 horas", "curativo limpo e seco"],
      R: ["vigiar o dreno a cada 4 horas", "analgesia às 20h", "conferir o hematócrito de controle"],
    },
  },

  icc: {
    lacunas: [
      lacunaMinijogo({ campo: "ausculta_pulmonar", rotulo: "Ausculta pulmonar", minijogo: "ausculta-pulmonar", valorEsperado: "crepitações finas em bases" }),
      lacuna({
        campo: "edema_mmii", rotulo: "Membros inferiores",
        valorEsperado: "edema bilateral com cacifo (+++/4+)",
        pergunta: "Você examina as pernas do paciente. O que encontra?",
        feedbackCerto: "Isso. Edema bilateral com cacifo, de +++/4+, combina com a congestão.",
        erradas: [
          ["sem edema e com pulsos pediosos cheios", "O paciente está congesto, com edema importante."],
          ["edema só na perna esquerda, com dor e calor local", "Edema assimétrico com dor sugere trombose, e não é o quadro."],
          ["edema discreto (+/4+), sem cacifo", "O edema é mais intenso: +++/4+."],
        ],
      }),
      lacuna({
        campo: "turgencia_jugular", rotulo: "Veias do pescoço",
        valorEsperado: "turgência jugular patológica a 45 graus",
        pergunta: "Com a cabeceira a 45 graus, como estão as jugulares?",
        feedbackCerto: "Isso. A turgência jugular a 45 graus indica pressão venosa elevada, típica da descompensação.",
        erradas: [
          ["jugulares colabadas, sem turgência", "Colabadas indicariam hipovolemia, o oposto deste caso."],
          ["turgência apenas à esquerda, com refluxo hepatojugular negativo", "A turgência é bilateral e o quadro é de congestão."],
          ["pulsos jugulares ausentes, com pescoço edemaciado e rígido", "Não é o achado deste paciente."],
        ],
      }),
    ],
    perguntas: [
      pergunta("plt.icc.s1", "S", "Quem é o paciente e por que ele está na UTI?", texto),
      pergunta("plt.icc.b1", "B", "Ele tem alguma alergia que eu precise saber?", texto),
      pergunta("plt.icc.b2", "B", "Quais são as doenças de base dele?", texto),
      pergunta("plt.icc.a1", "A", "Como estão os sinais vitais?", numero("pa_sistolica", "pa_diastolica", "fc", "fr", "sat")),
      pergunta("plt.icc.a2", "A", "Como está o pulmão? Você auscultou?", texto, "ausculta_pulmonar"),
      pergunta("plt.icc.a3", "A", "E as pernas, tem edema?", texto, "edema_mmii"),
      pergunta("plt.icc.a4", "A", "E o pescoço, como estão as jugulares?", texto, "turgencia_jugular"),
      pergunta("plt.icc.r1", "R", "O que eu preciso fazer neste plantão?", texto),
      pergunta("plt.icc.r2", "R", "Tem medicação com horário?", texto),
    ],
    elementosChave: {
      S: ["identificação (iniciais e idade)", "leito e setor", "descompensação de ICC", "admitido há 6 horas"],
      B: ["ICC com fração de ejeção de 32%", "hipertensão e diabetes", "alergia a contraste iodado"],
      A: ["PA, FC, FR e saturação", "saturação de 92% para 96% com 3 L/min", "estertores bibasais", "edema de membros inferiores"],
      R: ["furosemida 40 mg IV às 20h", "balanço hídrico de 6 em 6 horas", "peso em jejum amanhã cedo"],
    },
  },

  bronquiolite_lactente: {
    lacunas: [
      lacuna({
        campo: "tiragem", rotulo: "Esforço respiratório",
        valorEsperado: "tiragem intercostal e subcostal evidentes, sem gemência",
        pergunta: "Você expõe o tórax do lactente e observa a respiração. O que vê?",
        feedbackCerto: "Isso. Tiragem intercostal e subcostal evidentes mostram esforço moderado, ainda sem gemência.",
        erradas: [
          ["respiração tranquila, sem tiragem nem uso de musculatura acessória", "O bebê tem esforço respiratório evidente."],
          ["gemência contínua e cianose de extremidades", "Isso seria sinal de gravidade, que o bebê ainda não tem."],
          ["pausas respiratórias longas, com apneia", "Não há apneia neste quadro."],
        ],
      }),
      lacuna({
        campo: "alimentacao_diurese", rotulo: "Alimentação e diurese",
        valorEsperado: "aceitou 60 mL de leite materno na colher; 4 fraldas pesadas em 12 horas",
        pergunta: "Você confere o balanço de alimentação e diurese do bebê. O que encontra?",
        feedbackCerto: "Isso. Aceitou 60 mL na colher e fez 4 fraldas pesadas em 12 horas, sem sinal de desidratação grave.",
        erradas: [
          ["recusou toda a alimentação e não urina há 12 horas", "O bebê aceitou parte da dieta e urinou."],
          ["mamou normalmente e fez 10 fraldas pesadas", "Aceitou menos do que o normal; a diurese foi de 4 fraldas."],
          ["vomitou todas as mamadas e tem fontanela deprimida", "Não houve vômitos nem sinais de desidratação importante."],
        ],
      }),
    ],
    perguntas: [
      pergunta("plt.bronquiolite_lactente.s1", "S", "Quem é o bebê e por que ele está internado?", texto),
      pergunta("plt.bronquiolite_lactente.s2", "S", "Qual o leito e há quanto tempo ele está aqui?", texto),
      pergunta("plt.bronquiolite_lactente.b1", "B", "Ele tem alguma alergia? Nasceu a termo? Tem asma na família?", texto),
      pergunta("plt.bronquiolite_lactente.a1", "A", "Como estão os sinais vitais?", numero("fc", "fr", "sat", "tax")),
      pergunta("plt.bronquiolite_lactente.a2", "A", "E o esforço respiratório, como está?", texto, "tiragem"),
      pergunta("plt.bronquiolite_lactente.a3", "A", "Ele está mamando? E as fraldas?", texto, "alimentacao_diurese"),
      pergunta("plt.bronquiolite_lactente.a4", "A", "Ele está com oxigênio? Quanto?", texto),
      pergunta("plt.bronquiolite_lactente.r1", "R", "O que eu faço no meu plantão?", texto),
      pergunta("plt.bronquiolite_lactente.r2", "R", "Quando eu devo chamar o médico?", texto),
    ],
    elementosChave: {
      S: ["identificação (iniciais e idade)", "leito e setor", "bronquiolite viral", "internado há 18 horas"],
      B: ["nascido a termo", "sem asma na família", "sem alergias"],
      A: ["FR, FC e saturação", "saturação de 92% para 96% com 1 L/min", "tiragem intercostal e subcostal", "dieta de 60 mL e 4 fraldas"],
      R: ["lavagem nasal antes das mamadas", "cabeceira a 30 graus", "avisar se gemência ou saturação abaixo de 92%"],
    },
  },

  pre_eclampsia_grave: {
    lacunas: [
      lacuna({
        campo: "reflexo_patelar", rotulo: "Reflexo patelar",
        valorEsperado: "reflexos patelares presentes e simétricos (+2/+4)",
        pergunta: "Você testa o reflexo patelar da paciente. O que encontra?",
        feedbackCerto: "Isso. Reflexos presentes e simétricos (+2/+4) mostram que o magnésio está em faixa segura.",
        erradas: [
          ["reflexos abolidos bilateralmente", "Reflexo abolido seria sinal de intoxicação por magnésio."],
          ["reflexos exaltados com clônus", "Reflexos exaltados indicariam risco de convulsão, não é o caso."],
          ["reflexo presente só à direita", "Os reflexos estão simétricos."],
        ],
      }),
      lacuna({
        campo: "diurese", rotulo: "Diurese",
        valorEsperado: "diurese clara por sonda, 90 mL nas últimas 2 horas",
        pergunta: "Você confere o coletor da sonda vesical. O que encontra?",
        feedbackCerto: "Isso. 90 mL em 2 horas é uma diurese adequada (acima de 25 mL/h).",
        erradas: [
          ["20 mL nas últimas 4 horas, concentrada", "Isso seria oligúria, o que ela não tem."],
          ["400 mL nas últimas 2 horas, com sangue", "Não há hematúria nem esse volume."],
          ["coletor vazio, sonda sem débito", "A sonda funciona e tem débito de 90 mL."],
        ],
      }),
      lacuna({
        campo: "bcf", rotulo: "Batimentos do bebê",
        valorEsperado: "BCF de 144 bpm com boa variabilidade",
        pergunta: "Você ausculta os batimentos cardíacos fetais. O que encontra?",
        feedbackCerto: "Isso. BCF de 144 bpm com boa variabilidade é tranquilizador.",
        erradas: [
          ["BCF de 90 bpm, com desacelerações", "Isso indicaria sofrimento fetal."],
          ["BCF de 190 bpm, com taquicardia", "Os batimentos estão em faixa normal."],
          ["BCF não audível", "Os batimentos são audíveis e normais."],
        ],
      }),
    ],
    perguntas: [
      pergunta("plt.pre_eclampsia_grave.s1", "S", "Quem é a paciente e por que ela está aqui?", texto),
      pergunta("plt.pre_eclampsia_grave.s2", "S", "Que medicação ela está recebendo e há quanto tempo?", texto),
      pergunta("plt.pre_eclampsia_grave.b1", "B", "Ela tem alergia ou pressão alta de antes?", texto),
      pergunta("plt.pre_eclampsia_grave.a1", "A", "Como estão os sinais vitais?", numero("pa_sistolica", "pa_diastolica", "fc", "fr")),
      pergunta("plt.pre_eclampsia_grave.a2", "A", "E os reflexos, como estão?", texto, "reflexo_patelar"),
      pergunta("plt.pre_eclampsia_grave.a3", "A", "Como está a diurese?", texto, "diurese"),
      pergunta("plt.pre_eclampsia_grave.a4", "A", "E o bebê? Como estão os batimentos?", texto, "bcf"),
      pergunta("plt.pre_eclampsia_grave.r1", "R", "O que eu monitoro e quando aviso o médico?", texto),
      pergunta("plt.pre_eclampsia_grave.r2", "R", "Tem algum antídoto que eu deva deixar pronto?", texto),
    ],
    elementosChave: {
      S: ["identificação (iniciais e idade)", "leito e setor", "pré-eclâmpsia grave com 35 semanas", "sulfato de magnésio a 1 g/h há 6 horas"],
      B: ["primigesta", "sem hipertensão prévia", "sem alergias"],
      A: ["PA após hidralazina", "reflexos patelares presentes", "diurese de 90 mL em 2 horas", "BCF de 144 bpm"],
      R: ["reflexo patelar e FR a cada hora", "avisar se FR abaixo de 12 ou diurese abaixo de 25 mL/h", "gluconato de cálcio 10% preparado e identificado"],
    },
  },

  avc_isquemico: {
    lacunas: [
      lacuna({
        campo: "glasgow", rotulo: "Nível de consciência",
        valorEsperado: "Glasgow 14, desperta e colabora, com leve confusão",
        pergunta: "Você avalia o nível de consciência do paciente. O que encontra?",
        feedbackCerto: "Isso. Glasgow 14 mostra leve alteração, estável para o pós-trombólise.",
        erradas: [
          ["Glasgow 8, sem abertura ocular", "Isso indicaria piora grave, e não é o caso."],
          ["Glasgow 15, sem nenhuma alteração", "Há leve confusão, então o Glasgow é 14."],
          ["Glasgow 11, sonolento e com vômitos", "Sonolência com vômitos seria alerta de sangramento, ausente aqui."],
        ],
      }),
      lacuna({
        campo: "forca_motora", rotulo: "Força motora",
        valorEsperado: "hemiparesia braquial direita em melhora (força 3/5)",
        pergunta: "Você testa a força do braço do paciente. O que encontra?",
        feedbackCerto: "Isso. Hemiparesia braquial direita com força 3/5, já em melhora.",
        erradas: [
          ["força 5/5 nos quatro membros", "Ainda há déficit, com força 3/5 no braço."],
          ["plegia total do braço direito, sem melhora", "O déficit está melhorando, com força 3/5."],
          ["perda de força em perna esquerda, com piora em 1 hora", "Não houve piora e o déficit é braquial."],
        ],
      }),
      lacuna({
        campo: "sangramento", rotulo: "Sinais de sangramento",
        valorEsperado: "sem sangramento gengival ou no sítio de punção, sem cefaleia súbita",
        pergunta: "Você inspeciona gengivas, punções e pergunta sobre dor de cabeça. O que encontra?",
        feedbackCerto: "Isso. Sem sangramento e sem cefaleia súbita: nenhum sinal de hemorragia pós-trombólise.",
        erradas: [
          ["sangramento gengival e hematoma no sítio de punção", "Isso seria alerta de sangramento pós-alteplase, que não ocorreu."],
          ["cefaleia súbita intensa, com náuseas", "Seria sinal de hemorragia intracraniana. O paciente não relata isso."],
          ["urina com sangue e melena", "Não há sangramento urinário ou digestivo."],
        ],
      }),
    ],
    perguntas: [
      pergunta("plt.avc_isquemico.s1", "S", "Quem é o paciente e por que ele está na UTI?", texto),
      pergunta("plt.avc_isquemico.s2", "S", "Que tratamento ele fez e há quanto tempo?", texto),
      pergunta("plt.avc_isquemico.b1", "B", "Quais as doenças de base e alergias dele?", texto),
      pergunta("plt.avc_isquemico.a1", "A", "Como estão os sinais vitais?", numero("pa_sistolica", "pa_diastolica", "fc", "sat")),
      pergunta("plt.avc_isquemico.a2", "A", "E o nível de consciência, como está?", texto, "glasgow"),
      pergunta("plt.avc_isquemico.a3", "A", "E a força? Ele tem déficit?", texto, "forca_motora"),
      pergunta("plt.avc_isquemico.a4", "A", "Teve sangramento ou dor de cabeça?", texto, "sangramento"),
      pergunta("plt.avc_isquemico.r1", "R", "Qual o limite de pressão e de quanto em quanto tempo eu meço?", texto),
      pergunta("plt.avc_isquemico.r2", "R", "O que eu não posso fazer com ele nas próximas horas?", texto),
    ],
    elementosChave: {
      S: ["identificação (iniciais e idade)", "leito e setor", "AVC isquêmico tratado com trombólise", "vigilância de 24 horas"],
      B: ["hipertenso", "tabagista", "sem alergias"],
      A: ["PA em 160/95 com alvo abaixo de 180/105", "Glasgow 14", "hemiparesia braquial direita com força 3/5", "sem sinais hemorrágicos"],
      R: ["PA e escore neurológico a cada 30 minutos", "jejum absoluto", "sem sondagem vesical nem punção arterial nas próximas 20 horas"],
    },
  },

  delirium: {
    lacunas: [
      lacuna({
        campo: "cam", rotulo: "Atenção e orientação (CAM)",
        valorEsperado: "CAM positivo: atenção que flutua e desorientação no tempo",
        pergunta: "Você avalia a atenção e a orientação da paciente. O que encontra?",
        feedbackCerto: "Isso. CAM positivo, com flutuação da atenção e desorientação no tempo, confirma o delirium.",
        erradas: [
          ["CAM negativo, atenta e orientada em tempo e espaço", "A paciente tem flutuação do sensório, e o CAM é positivo."],
          ["inconsciente, sem resposta a estímulo verbal", "Ela desperta e conversa; o quadro é de flutuação, não de coma."],
          ["agitação constante sem períodos de lucidez", "O sensório flutua, com momentos de melhora."],
        ],
      }),
      lacuna({
        campo: "acesso_venoso", rotulo: "Acesso venoso periférico",
        valorEsperado: "acesso pérvio, protegido com bandagem, sem sinais de flebite",
        pergunta: "Você inspeciona o acesso venoso da paciente. O que encontra?",
        feedbackCerto: "Isso. Acesso pérvio e protegido, sem flebite, mesmo com as tentativas de retirada.",
        erradas: [
          ["acesso já retirado pela paciente, com sangramento local", "O acesso está no lugar e protegido."],
          ["hiperemia, calor e cordão doloroso no trajeto da veia", "Seriam sinais de flebite, que ela não tem."],
          ["acesso infiltrado, com edema no antebraço", "O acesso está pérvio, sem infiltração."],
        ],
      }),
      lacuna({
        campo: "seguranca_leito", rotulo: "Segurança no leito",
        valorEsperado: "grades elevadas dos dois lados e acompanhante presente",
        pergunta: "Você confere as medidas de segurança no leito. O que encontra?",
        feedbackCerto: "Isso. Grades elevadas e acompanhante presente reduzem o risco de queda sem contenção.",
        erradas: [
          ["contenção mecânica nos punhos e grades abaixadas", "Não há contenção, e as grades devem ficar elevadas."],
          ["sem grades, cama alta e sem acompanhante", "O leito está protegido e há acompanhante."],
          ["grades elevadas só do lado direito, campainha fora do alcance", "As grades estão elevadas dos dois lados."],
        ],
      }),
    ],
    perguntas: [
      pergunta("plt.delirium.s1", "S", "Quem é a paciente e por que ela está internada?", texto),
      pergunta("plt.delirium.s2", "S", "Qual o leito e em que dia de internação ela está?", texto),
      pergunta("plt.delirium.b1", "B", "Ela tem alergia ou doença de base que eu precise saber?", texto),
      pergunta("plt.delirium.b2", "B", "Ela já caiu antes?", texto),
      pergunta("plt.delirium.a1", "A", "Como estão os sinais vitais?", numero("pa_sistolica", "pa_diastolica", "fc", "sat")),
      pergunta("plt.delirium.a2", "A", "Como está a atenção e a orientação dela?", texto, "cam"),
      pergunta("plt.delirium.a3", "A", "E o acesso venoso, como está?", texto, "acesso_venoso"),
      pergunta("plt.delirium.a4", "A", "Como está a segurança no leito?", texto, "seguranca_leito"),
      pergunta("plt.delirium.r1", "R", "O que eu preciso fazer pra evitar queda neste plantão?", texto),
    ],
    elementosChave: {
      S: ["identificação (iniciais e idade)", "leito e setor", "pneumonia comunitária", "3º dia de antibiótico venoso"],
      B: ["Alzheimer leve e osteoartrose", "sem alergias", "queda em casa há 2 meses"],
      A: ["PA 132/78, FC 76 e saturação 95%", "CAM positivo (sensório flutuante)", "tentou se levantar sem ajuda", "acesso periférico pérvio"],
      R: ["grades elevadas dos dois lados", "orientar e apoiar o acompanhante", "proteger o acesso periférico", "evitar contenção mecânica"],
    },
  },

  dpoc: {
    lacunas: [
      lacuna({
        campo: "ausculta", rotulo: "Ausculta pulmonar",
        valorEsperado: "sibilos expiratórios bilaterais e roncos esparsos",
        pergunta: "Você ausculta o pulmão do paciente. O que encontra?",
        feedbackCerto: "Isso. Sibilos expiratórios bilaterais e roncos esparsos combinam com broncoespasmo e secreção.",
        erradas: [
          ["murmúrio vesicular normal, sem ruídos adventícios", "O paciente tem broncoespasmo, com sibilos."],
          ["crepitações finas em bases, sem sibilos", "Crepitações finas sugerem congestão, e o quadro é de sibilos."],
          ["abolição do murmúrio vesicular à direita", "Isso sugeriria pneumotórax ou derrame, o que não há."],
        ],
      }),
      lacuna({
        campo: "esforco_resp", rotulo: "Esforço respiratório",
        valorEsperado: "tiragem intercostal leve, falando frases curtas",
        pergunta: "Você observa o esforço respiratório do paciente. O que vê?",
        feedbackCerto: "Isso. Tiragem intercostal leve e fala em frases curtas mostram esforço moderado.",
        erradas: [
          ["respiração tranquila, sem tiragem e falando frases completas", "Ele tem tiragem e se cansa ao falar."],
          ["respiração paradoxal e incapacidade de falar", "Seria insuficiência respiratória iminente, que ele não apresenta."],
          ["uso intenso de musculatura acessória e cianose central", "O esforço é leve, e a cianose não está presente."],
        ],
      }),
      lacuna({
        campo: "oxigenoterapia", rotulo: "Oxigenoterapia",
        valorEsperado: "máscara de Venturi a 28%, com SatO2 de 92%",
        pergunta: "Você confere o oxigênio e a saturação do paciente. O que encontra?",
        feedbackCerto: "Isso. Venturi a 28% com SatO2 de 92%, dentro do alvo de 88 a 92%.",
        erradas: [
          ["máscara com reservatório a 15 L/min, com SatO2 de 100%", "Oxigênio alto causa hipercapnia no DPOC. O alvo é 88 a 92%."],
          ["em ar ambiente, com SatO2 de 89%", "Ele já está com Venturi, e a saturação subiu para 92%."],
          ["cateter nasal a 6 L/min, com SatO2 de 97%", "Isso passa do alvo e arrisca hipercapnia."],
        ],
      }),
    ],
    perguntas: [
      pergunta("plt.dpoc.s1", "S", "Quem é o paciente e por que ele está internado?", texto),
      pergunta("plt.dpoc.s2", "S", "Qual o leito e há quanto tempo ele está aqui?", texto),
      pergunta("plt.dpoc.b1", "B", "Ele tem alergia a algum medicamento?", texto),
      pergunta("plt.dpoc.b2", "B", "Qual o grau do DPOC e o que ele usa em casa?", texto),
      pergunta("plt.dpoc.a1", "A", "Como estão os sinais vitais?", numero("fc", "fr", "sat", "tax")),
      pergunta("plt.dpoc.a2", "A", "Como está o pulmão? Você auscultou?", texto, "ausculta"),
      pergunta("plt.dpoc.a3", "A", "E o esforço respiratório, como está?", texto, "esforco_resp"),
      pergunta("plt.dpoc.a4", "A", "Ele está com oxigênio? Quanto e qual a saturação?", texto, "oxigenoterapia"),
      pergunta("plt.dpoc.r1", "R", "Qual o alvo de saturação e o que eu devo vigiar?", texto),
    ],
    elementosChave: {
      S: ["identificação (iniciais e idade)", "leito e setor", "exacerbação infecciosa de DPOC", "internado há 12 horas"],
      B: ["DPOC GOLD 3", "usa broncodilatadores em casa", "alergia a dipirona (urticária)"],
      A: ["FC 104 e FR 26", "SatO2 89% em ar ambiente e 92% com Venturi 28%", "sibilos bilaterais e roncos", "tiragem intercostal leve"],
      R: ["alvo de SatO2 de 88 a 92%", "nebulização com broncodilatador às 22h", "vigiar o padrão ventilatório"],
    },
  },

  sepse_urinaria: {
    lacunas: [
      lacuna({
        campo: "perfusao", rotulo: "Perfusão periférica",
        valorEsperado: "pele fria e pegajosa, enchimento capilar de 4 segundos",
        pergunta: "Você avalia a pele e o enchimento capilar da paciente. O que encontra?",
        feedbackCerto: "Isso. Pele fria e pegajosa com enchimento capilar lento, de 4 segundos, combina com a hipotensão e a má perfusão da sepse.",
        erradas: [
          ["pele quente e ruborizada, enchimento capilar de 1 segundo", "Com hipotensão e taquicardia, a perfusão está ruim: o enchimento está lento."],
          ["pele seca, com enchimento capilar de 2 segundos", "O enchimento é de 4 segundos, e a pele está fria e pegajosa."],
          ["cianose de extremidades, com enchimento imediato", "Não há cianose, e o enchimento está lento."],
        ],
      }),
      lacuna({
        campo: "diurese", rotulo: "Diurese",
        valorEsperado: "40 mL em 2 horas, concentrada e de odor fétido",
        pergunta: "Você confere o volume e o aspecto da urina da paciente. O que encontra?",
        feedbackCerto: "Isso. 40 mL em 2 horas, concentrada e fétida, é oligúria com foco urinário provável.",
        erradas: [
          ["200 mL em 2 horas, clara e sem odor", "A diurese está baixa e a urina, concentrada."],
          ["sem diurese nenhuma desde a admissão", "Houve 40 mL nas últimas 2 horas."],
          ["urina com sangue vivo e coágulos", "A urina é concentrada e fétida, sem sangue."],
        ],
      }),
      lacuna({
        campo: "nivel_consciencia", rotulo: "Nível de consciência",
        valorEsperado: "sonolenta, desperta ao chamado, mas confusa",
        pergunta: "Você chama a paciente e avalia a consciência. O que encontra?",
        feedbackCerto: "Isso. Sonolenta e confusa é o rebaixamento do sensório que a família percebeu.",
        erradas: [
          ["alerta e orientada, conversando normalmente", "Ela chegou com rebaixamento do sensório."],
          ["sem resposta a estímulo doloroso", "Ela desperta ao chamado, então não está em coma."],
          ["agitada, com convulsão tônico-clônica", "Não há convulsão."],
        ],
      }),
    ],
    perguntas: [
      pergunta("plt.sepse_urinaria.s1", "S", "Quem é a paciente e por que ela está na emergência?", texto),
      pergunta("plt.sepse_urinaria.s2", "S", "Qual o leito e há quanto tempo ela chegou?", texto),
      pergunta("plt.sepse_urinaria.b1", "B", "Ela tem alergia ou alguma doença de base?", texto),
      pergunta("plt.sepse_urinaria.a1", "A", "Como estão os sinais vitais?", numero("pa_sistolica", "pa_diastolica", "fc", "fr", "tax")),
      pergunta("plt.sepse_urinaria.a2", "A", "Como está a perfusão? Pele e enchimento capilar?", texto, "perfusao"),
      pergunta("plt.sepse_urinaria.a3", "A", "Como está a diurese?", texto, "diurese"),
      pergunta("plt.sepse_urinaria.a4", "A", "E o nível de consciência dela?", texto, "nivel_consciencia"),
      pergunta("plt.sepse_urinaria.r1", "R", "Quanto de volume ela precisa receber e em quanto tempo?", texto),
      pergunta("plt.sepse_urinaria.r2", "R", "O antibiótico pode ser dado já? O que vem antes?", texto),
    ],
    elementosChave: {
      S: ["identificação (iniciais e idade)", "leito e setor", "sepse grave de foco urinário", "admitida há 2 horas"],
      B: ["diabética", "ITU de repetição", "sem alergias medicamentosas"],
      A: ["PA 90/55 (PAM 66) e FC 112", "FR 24 e temperatura de 38,7 °C", "diurese de 40 mL em 2 horas", "enchimento capilar de 4 segundos"],
      R: ["Ringer Lactato 30 mL/kg em 2 horas", "ceftriaxona IV após as culturas", "vigiar pressão e diurese"],
    },
  },

  iam_st: {
    lacunas: [
      lacuna({
        campo: "sitio_puncao", rotulo: "Sítio de punção femoral",
        valorEsperado: "curativo compressivo seco, sem sangramento nem hematoma expansivo",
        pergunta: "Você inspeciona o curativo e a região da virilha direita. O que encontra?",
        feedbackCerto: "Isso. Curativo seco, sem sangramento nem hematoma expansivo, é o esperado.",
        erradas: [
          ["curativo encharcado de sangue vivo", "Não há sangramento no sítio de punção."],
          ["hematoma expansivo e endurecido na coxa", "Hematoma expansivo seria complicação, e não há."],
          ["sopro audível sobre a punção, com massa pulsátil", "Isso sugeriria pseudoaneurisma, e não é o caso."],
        ],
      }),
      lacuna({
        campo: "pulso_pedioso", rotulo: "Pulso pedioso direito",
        valorEsperado: "pulso pedioso direito palpável e cheio, pé aquecido",
        pergunta: "Você palpa o pulso pedioso do pé direito. O que encontra?",
        feedbackCerto: "Isso. Pulso palpável e cheio mostra boa perfusão do membro puncionado.",
        erradas: [
          ["pulso pedioso ausente, pé frio e pálido", "Isso seria isquemia do membro, e o pulso está presente."],
          ["pulso fraco, com parestesia no pé", "O pulso está cheio, sem parestesia."],
          ["pulso presente só no pé esquerdo", "O pulso direito está palpável e cheio."],
        ],
      }),
      lacuna({
        campo: "dor_toracica", rotulo: "Dor torácica",
        valorEsperado: "sem dor torácica, ritmo sinusal no monitor",
        pergunta: "Você pergunta sobre dor no peito e olha o monitor. O que encontra?",
        feedbackCerto: "Isso. Sem dor torácica e com ritmo sinusal, sem sinal de reoclusão.",
        erradas: [
          ["dor em aperto no peito, com supra de ST no monitor", "Isso sugeriria reoclusão do stent, e não há dor."],
          ["fibrilação ventricular no monitor", "O ritmo é sinusal."],
          ["bloqueio atrioventricular total, com FC de 38", "A FC é de 74 e o ritmo é sinusal."],
        ],
      }),
    ],
    perguntas: [
      pergunta("plt.iam_st.s1", "S", "Quem é o paciente e o que ele fez?", texto),
      pergunta("plt.iam_st.s2", "S", "Qual o leito e há quanto tempo ele chegou da hemodinâmica?", texto),
      pergunta("plt.iam_st.b1", "B", "Ele tem alergia ou doença de base?", texto),
      pergunta("plt.iam_st.a1", "A", "Como estão os sinais vitais?", numero("pa_sistolica", "pa_diastolica", "fc", "sat")),
      pergunta("plt.iam_st.a2", "A", "Ele tem dor no peito? E o ritmo no monitor?", texto, "dor_toracica"),
      pergunta("plt.iam_st.a3", "A", "Como está o local da punção na virilha?", texto, "sitio_puncao"),
      pergunta("plt.iam_st.a4", "A", "E o pulso do pé direito, está presente?", texto, "pulso_pedioso"),
      pergunta("plt.iam_st.r1", "R", "Quanto tempo ele fica deitado e com a perna esticada?", texto),
      pergunta("plt.iam_st.r2", "R", "Que medicação eu dou e de quanto em quanto tempo olho a punção?", texto),
    ],
    elementosChave: {
      S: ["identificação (iniciais e idade)", "leito e setor", "pós-angioplastia primária com 1 stent", "stent em artéria descendente anterior"],
      B: ["dislipidêmico", "hipertenso", "sem alergias"],
      A: ["PA 125/80 e FC 74 sinusal", "sem dor torácica", "curativo femoral sem sangramento", "pulso pedioso direito cheio"],
      R: ["repouso absoluto por mais 4 horas", "punção a cada 15 minutos na 1ª hora", "AAS e clopidogrel prescritos"],
    },
  },

  trauma_cranio: {
    lacunas: [
      lacuna({
        campo: "glasgow", rotulo: "Escala de Glasgow",
        valorEsperado: "Glasgow 13 (AO 3, RV 4, RM 6)",
        pergunta: "Você avalia o Glasgow do paciente. Qual o resultado?",
        feedbackCerto: "Isso. Glasgow 13, com abertura ocular ao chamado, fala confusa e obediência a comandos.",
        erradas: [
          ["Glasgow 15 (AO 4, RV 5, RM 6)", "Ele está sonolento e confuso, então o Glasgow é 13."],
          ["Glasgow 9 (AO 2, RV 3, RM 4)", "Isso seria piora importante, que ele não apresenta."],
          ["Glasgow 6 (AO 1, RV 2, RM 3)", "Seria um coma profundo, e ele desperta com facilidade."],
        ],
      }),
      lacuna({
        campo: "pupilas", rotulo: "Pupilas",
        valorEsperado: "isocóricas e fotorreagentes, 3 mm",
        pergunta: "Você avalia as pupilas com a lanterna. O que encontra?",
        feedbackCerto: "Isso. Pupilas isocóricas e fotorreagentes de 3 mm, sem sinal de herniação.",
        erradas: [
          ["anisocoria, com pupila direita dilatada e fixa", "Anisocoria seria alerta de herniação, ausente aqui."],
          ["miose puntiforme bilateral", "As pupilas medem 3 mm, e não são puntiformes."],
          ["midríase bilateral sem fotorreação", "As pupilas reagem à luz."],
        ],
      }),
      lacuna({
        campo: "cefaleia_vomito", rotulo: "Cefaleia e vômitos",
        valorEsperado: "cefaleia moderada controlada com dipirona, sem vômitos há 3 horas",
        pergunta: "Você pergunta sobre dor de cabeça e vômitos. O que ele relata?",
        feedbackCerto: "Isso. Cefaleia moderada controlada e sem vômitos há 3 horas, sem sinal de hipertensão intracraniana.",
        erradas: [
          ["cefaleia intensa e progressiva, com vômitos em jato", "Isso sugeriria hipertensão intracraniana, que não há."],
          ["sem cefaleia nenhuma, com vômitos repetidos", "Ele tem cefaleia moderada e não vomita há 3 horas."],
          ["cefaleia que piora mesmo com analgesia, com convulsão", "A dor está controlada, e não houve convulsão."],
        ],
      }),
    ],
    perguntas: [
      pergunta("plt.trauma_cranio.s1", "S", "Quem é o paciente e o que aconteceu?", texto),
      pergunta("plt.trauma_cranio.s2", "S", "Qual o leito e o que a tomografia mostrou?", texto),
      pergunta("plt.trauma_cranio.b1", "B", "Ele tem alergia, doença de base ou usa algum remédio?", texto),
      pergunta("plt.trauma_cranio.a1", "A", "Como estão os sinais vitais?", numero("pa_sistolica", "pa_diastolica", "fc", "sat")),
      pergunta("plt.trauma_cranio.a2", "A", "Quanto está o Glasgow dele?", texto, "glasgow"),
      pergunta("plt.trauma_cranio.a3", "A", "Como estão as pupilas?", texto, "pupilas"),
      pergunta("plt.trauma_cranio.a4", "A", "Ele tem dor de cabeça ou vomitou?", texto, "cefaleia_vomito"),
      pergunta("plt.trauma_cranio.r1", "R", "De quanto em quanto tempo eu avalio o Glasgow e as pupilas?", texto),
      pergunta("plt.trauma_cranio.r2", "R", "Quando devo chamar o neurocirurgião?", texto),
    ],
    elementosChave: {
      S: ["identificação (iniciais e idade)", "leito e setor", "TCE moderado há 5 horas", "contusão temporal direita sem desvio"],
      B: ["hígido, sem doenças crônicas", "sem medicações em uso", "sem alergias"],
      A: ["PA 135/80, FC 68 e saturação 97%", "Glasgow 13 (AO 3, RV 4, RM 6)", "pupilas isocóricas de 3 mm", "sem vômitos há 3 horas"],
      R: ["Glasgow e pupilas de hora em hora", "avisar se queda de 2 pontos ou anisocoria", "cabeceira a 30 graus e cabeça centrada"],
    },
  },

  cetoacidose_pediatrica: {
    lacunas: [
      lacunaMinijogo({ campo: "freq_resp", rotulo: "Frequência respiratória", minijogo: "contar-fr", valorEsperado: "28 irpm" }),
      lacuna({
        campo: "glicemia", rotulo: "Glicemia capilar",
        valorEsperado: "260 mg/dL, em queda gradual de 60 mg/dL por hora",
        pergunta: "Você confere o último HGT da paciente. O que encontra?",
        feedbackCerto: "Isso. 260 mg/dL, caindo cerca de 60 mg/dL por hora, é uma redução segura.",
        erradas: [
          ["490 mg/dL, sem queda desde a admissão", "490 foi a glicemia inicial. Agora ela está em 260."],
          ["80 mg/dL, com sudorese e tremor", "Seria hipoglicemia, e ela está em 260."],
          ["150 mg/dL, com queda de 200 mg/dL em 1 hora", "A queda é de 60 mg/dL por hora, e uma queda rápida arrisca edema cerebral."],
        ],
      }),
      lacuna({
        campo: "potassio", rotulo: "Potássio sérico",
        valorEsperado: "potássio de 4,2 mEq/L, em reposição com KCl",
        pergunta: "Você confere o último potássio da paciente. Qual o valor?",
        feedbackCerto: "Isso. Potássio de 4,2 mEq/L, normal, sob reposição com KCl na hidratação.",
        erradas: [
          ["potássio de 2,5 mEq/L, com fraqueza e arritmia", "Seria hipocalemia grave, e o valor é 4,2."],
          ["potássio de 6,8 mEq/L, com onda T apiculada", "Seria hipercalemia, e o valor é 4,2."],
          ["potássio ainda não dosado desde a admissão", "O potássio está dosado, em 4,2 mEq/L."],
        ],
      }),
    ],
    perguntas: [
      pergunta("plt.cetoacidose_pediatrica.s1", "S", "Quem é a paciente e por que ela está na UTI?", texto),
      pergunta("plt.cetoacidose_pediatrica.s2", "S", "Qual era a glicemia e a gasometria quando chegou?", texto),
      pergunta("plt.cetoacidose_pediatrica.b1", "B", "Ela tem alergia ou doença de base?", texto),
      pergunta("plt.cetoacidose_pediatrica.a1", "A", "Como estão os sinais vitais?", numero("pa_sistolica", "pa_diastolica", "fc", "fr", "sat")),
      pergunta("plt.cetoacidose_pediatrica.a2", "A", "Como está a respiração dela? Pode contar a frequência?", texto, "freq_resp"),
      pergunta("plt.cetoacidose_pediatrica.a3", "A", "Como está a glicemia agora?", texto, "glicemia"),
      pergunta("plt.cetoacidose_pediatrica.a4", "A", "E o potássio, como está?", texto, "potassio"),
      pergunta("plt.cetoacidose_pediatrica.r1", "R", "Quando eu coloco glicose no soro?", texto),
      pergunta("plt.cetoacidose_pediatrica.r2", "R", "Que exames e controles eu faço neste plantão?", texto),
    ],
    elementosChave: {
      S: ["identificação (iniciais e idade)", "leito e setor", "cetoacidose diabética há 4 horas", "glicemia inicial 490 e pH 7,18"],
      B: ["diabetes tipo 1", "diagnóstico há 3 anos", "sem alergias"],
      A: ["FC 116 e FR 28", "glicemia de 260 mg/dL (queda de 60/h)", "potássio de 4,2 mEq/L", "diurese de 1,8 mL/kg/h"],
      R: ["glicose 5% quando glicemia chegar a 250", "HGT de hora em hora", "gasometria venosa às 22h"],
    },
  },

  pancreatite_aguda: {
    lacunas: [
      lacuna({
        campo: "abdome", rotulo: "Abdome",
        valorEsperado: "tenso e distendido, com ruídos hidroaéreos diminuídos",
        pergunta: "Você examina o abdome do paciente. O que encontra?",
        feedbackCerto: "Isso. Abdome tenso e distendido, com ruídos diminuídos, é esperado na pancreatite.",
        erradas: [
          ["plano e flácido, com ruídos hidroaéreos normais", "O abdome está tenso e distendido."],
          ["escavado, com hiperperistaltismo", "Não há escavação, e os ruídos estão diminuídos."],
          ["massa pulsátil e sopro abdominal", "Não há massa pulsátil neste quadro."],
        ],
      }),
      lacuna({
        campo: "sng", rotulo: "Sonda nasogástrica",
        valorEsperado: "SNG aberta, débito bilioso de 350 mL em 12 horas",
        pergunta: "Você confere a sonda nasogástrica e o frasco. O que encontra?",
        feedbackCerto: "Isso. SNG aberta, com 350 mL de débito bilioso em 12 horas.",
        erradas: [
          ["SNG fechada, sem débito", "A sonda está aberta, descomprimindo."],
          ["débito de sangue vivo, de 800 mL em 12 horas", "O débito é bilioso, sem sangue."],
          ["débito fecaloide, com odor intenso", "O débito é bilioso."],
        ],
      }),
      lacuna({
        campo: "diurese", rotulo: "Diurese",
        valorEsperado: "320 mL nas últimas 6 horas, em torno de 53 mL/h",
        pergunta: "Você soma a diurese das últimas 6 horas. Qual o total?",
        feedbackCerto: "Isso. 320 mL em 6 horas, cerca de 53 mL/h, é a meta acima de 0,5 mL/kg/h.",
        erradas: [
          ["60 mL nas últimas 6 horas, em oligúria", "O total foi de 320 mL, e não de 60."],
          ["1.200 mL nas últimas 6 horas", "O total foi de 320 mL."],
          ["sem diurese, com anúria", "Há diurese de 320 mL em 6 horas."],
        ],
      }),
    ],
    perguntas: [
      pergunta("plt.pancreatite_aguda.s1", "S", "Quem é o paciente e por que ele está na UTI?", texto),
      pergunta("plt.pancreatite_aguda.s2", "S", "Qual o leito e em que dia da pancreatite ele está?", texto),
      pergunta("plt.pancreatite_aguda.b1", "B", "Ele tem alergia, bebe ou tem doença de base?", texto),
      pergunta("plt.pancreatite_aguda.a1", "A", "Como estão os sinais vitais?", numero("pa_sistolica", "pa_diastolica", "fc", "fr", "tax")),
      pergunta("plt.pancreatite_aguda.a2", "A", "Como está a dor? E o abdome?", texto, "abdome"),
      pergunta("plt.pancreatite_aguda.a3", "A", "Quanto saiu pela sonda nasogástrica?", texto, "sng"),
      pergunta("plt.pancreatite_aguda.a4", "A", "Quanto ele urinou nas últimas horas?", texto, "diurese"),
      pergunta("plt.pancreatite_aguda.r1", "R", "Quais exames eu colho amanhã cedo?", texto),
      pergunta("plt.pancreatite_aguda.r2", "R", "Quando eu faço analgesia de resgate?", texto),
    ],
    elementosChave: {
      S: ["identificação (iniciais e idade)", "leito e setor", "pancreatite aguda biliar", "Ranson de 3 pontos"],
      B: ["colelitíase sem cirurgia", "nega etilismo", "sem alergias"],
      A: ["PA 105/68 e FC 110", "temperatura de 38,1 °C", "dor EVA 6/10 e abdome tenso", "SNG com 350 mL e diurese de 320 mL em 6 horas"],
      R: ["volume guiado por diurese acima de 0,5 mL/kg/h", "amilase, lipase e cálcio pela manhã", "resgate se dor acima de 4"],
    },
  },

  choque_anafilatico: {
    lacunas: [
      lacuna({
        campo: "via_aerea", rotulo: "Via aérea e ausculta",
        valorEsperado: "sem estridor, murmúrio vesicular livre e sem sibilos",
        pergunta: "Você escuta a respiração da paciente. O que encontra?",
        feedbackCerto: "Isso. Sem estridor e sem sibilos, a via aérea está livre após a adrenalina.",
        erradas: [
          ["estridor laríngeo persistente, com sibilos difusos", "O estridor desapareceu após a adrenalina."],
          ["voz rouca e edema de língua progressivo", "Não há edema de via aérea agora."],
          ["murmúrio abolido em hemitórax direito", "O murmúrio é livre, e os dois pulmões ventilam."],
        ],
      }),
      lacuna({
        campo: "pele", rotulo: "Pele",
        valorEsperado: "lesões de urticária em regressão",
        pergunta: "Você examina a pele da paciente. O que encontra?",
        feedbackCerto: "Isso. A urticária está em regressão, sinal de boa resposta ao tratamento.",
        erradas: [
          ["urticária disseminada, em piora", "As lesões estão em regressão."],
          ["pele totalmente limpa, sem nenhuma lesão", "Ainda há lesões, mas diminuindo."],
          ["bolhas e descolamento da pele", "Isso sugeriria reação cutânea grave, que não é o caso."],
        ],
      }),
      lacuna({
        campo: "alergia_registro", rotulo: "Registro de alergia",
        valorEsperado: "pulseira vermelha colocada e alergia a beta-lactâmicos no prontuário",
        pergunta: "Você confere a pulseira e o prontuário da paciente. O que encontra?",
        feedbackCerto: "Isso. Pulseira vermelha e alergia registrada evitam nova exposição a beta-lactâmicos.",
        erradas: [
          ["sem pulseira, e o prontuário diz sem alergias", "A alergia precisa estar identificada, e ela é confirmada."],
          ["pulseira azul, com alergia só a dipirona", "A alergia é a cefalosporinas e penicilinas, com pulseira vermelha."],
          ["alergia registrada só a ceftriaxona, sem pulseira", "A alergia vale para todos os beta-lactâmicos, e a pulseira é obrigatória."],
        ],
      }),
    ],
    perguntas: [
      pergunta("plt.choque_anafilatico.s1", "S", "Quem é a paciente e o que aconteceu com ela?", texto),
      pergunta("plt.choque_anafilatico.s2", "S", "Qual o leito e há quanto tempo foi o episódio?", texto),
      pergunta("plt.choque_anafilatico.b1", "B", "Ela já sabia de alguma alergia?", texto),
      pergunta("plt.choque_anafilatico.a1", "A", "Como estão os sinais vitais?", numero("pa_sistolica", "pa_diastolica", "fc", "sat")),
      pergunta("plt.choque_anafilatico.a2", "A", "Como está a respiração? Ainda tem estridor?", texto, "via_aerea"),
      pergunta("plt.choque_anafilatico.a3", "A", "E a pele, como estão as lesões?", texto, "pele"),
      pergunta("plt.choque_anafilatico.a4", "A", "O que foi dado de medicação no atendimento?", texto),
      pergunta("plt.choque_anafilatico.r1", "R", "Quanto tempo ela fica em observação e por quê?", texto),
      pergunta("plt.choque_anafilatico.r2", "R", "Já identificamos a alergia dela? O que não pode ser usado?", texto, "alergia_registro"),
    ],
    elementosChave: {
      S: ["identificação (iniciais e idade)", "leito e setor", "choque anafilático há 90 minutos", "após 1ª dose de ceftriaxona"],
      B: ["internada por pielonefrite", "sem alergia conhecida antes", "agora alérgica a cefalosporinas e penicilinas"],
      A: ["PA 118/74 e saturação 98%", "adrenalina IM, hidrocortisona e difenidramina", "estridor resolvido, sem sibilos", "urticária em regressão"],
      R: ["observação por no mínimo 12 horas", "risco de anafilaxia bifásica", "pulseira vermelha e registro", "suspender beta-lactâmicos"],
    },
  },

  queimado_agudo: {
    lacunas: [
      lacuna({
        campo: "diurese_horaria", rotulo: "Diurese horária",
        valorEsperado: "55 mL/h pela sonda vesical (0,8 mL/kg/h), na meta",
        pergunta: "Você confere a diurese da última hora na sonda vesical. Qual o valor?",
        feedbackCerto: "Isso. 55 mL/h, ou 0,8 mL/kg/h, está dentro da meta de 35 a 70 mL/h.",
        erradas: [
          ["15 mL/h, concentrada e escura", "Isso exigiria aumentar o volume, e a diurese está em 55 mL/h."],
          ["150 mL/h, em poliúria", "Seria excesso de volume, e o valor é de 55 mL/h."],
          ["sem diurese há 2 horas", "A diurese está presente e na meta."],
        ],
      }),
      lacuna({
        campo: "extremidades", rotulo: "Extremidades",
        valorEsperado: "extremidades aquecidas, com enchimento capilar normal",
        pergunta: "Você toca as extremidades do paciente e avalia a perfusão. O que encontra?",
        feedbackCerto: "Isso. Extremidades aquecidas mostram boa perfusão sob a ressuscitação.",
        erradas: [
          ["extremidades frias e pálidas, com enchimento lento", "Isso indicaria choque, e as extremidades estão aquecidas."],
          ["extremidades cianóticas e sem pulsos", "A perfusão está preservada."],
          ["extremidades edemaciadas, com garroteamento por escara", "Não há sinais de síndrome compartimental."],
        ],
      }),
      lacuna({
        campo: "face_via_aerea", rotulo: "Face e via aérea",
        valorEsperado: "edema de face discreto, sem rouquidão nem estridor",
        pergunta: "Você avalia o rosto e a voz do paciente. O que encontra?",
        feedbackCerto: "Isso. Edema de face discreto, sem rouquidão nem estridor, mas precisa de vigilância contínua.",
        erradas: [
          ["rouquidão, estridor e escarro carbonáceo", "Isso sugeriria lesão inalatória, que não há."],
          ["face sem nenhum edema, mesmo com queimadura facial", "Ele tem edema discreto, e deve ser vigiado."],
          ["edema maciço de face, com voz abafada e dispneia", "O edema é discreto, sem dificuldade respiratória."],
        ],
      }),
    ],
    perguntas: [
      pergunta("plt.queimado_agudo.s1", "S", "Quem é o paciente e o que aconteceu?", texto),
      pergunta("plt.queimado_agudo.s2", "S", "Qual o leito e quanto da pele foi queimada?", texto),
      pergunta("plt.queimado_agudo.b1", "B", "Qual o peso, e ele tem alergia ou doença de base?", texto),
      pergunta("plt.queimado_agudo.a1", "A", "Como estão os sinais vitais?", numero("pa_sistolica", "pa_diastolica", "fc", "sat")),
      pergunta("plt.queimado_agudo.a2", "A", "Quanto ele está urinando por hora?", texto, "diurese_horaria"),
      pergunta("plt.queimado_agudo.a3", "A", "Como estão as extremidades?", texto, "extremidades"),
      pergunta("plt.queimado_agudo.a4", "A", "E o rosto e a respiração, como estão?", texto, "face_via_aerea"),
      pergunta("plt.queimado_agudo.r1", "R", "Quanto de Ringer ele recebe e como eu ajusto a vazão?", texto),
      pergunta("plt.queimado_agudo.r2", "R", "O que eu faço antes do curativo?", texto),
    ],
    elementosChave: {
      S: ["identificação (iniciais e idade)", "leito e setor", "queimadura por chama em 38% da SCQ", "primeiras 6 horas de tratamento"],
      B: ["hígido, sem doenças prévias", "peso de 70 kg", "sem alergias"],
      A: ["PA 108/68 e FC 114", "Parkland de 10.640 mL em 24 horas", "diurese de 55 mL/h (0,8 mL/kg/h)", "extremidades aquecidas"],
      R: ["ajustar o Ringer de hora em hora pela diurese", "alvo de diurese de 35 a 70 mL/h", "cabeceira a 30 graus e vigiar face", "opioide antes do curativo"],
    },
  },

  politrauma_bacia: {
    lacunas: [
      lacuna({
        campo: "contencao_pelvica", rotulo: "Contenção pélvica",
        valorEsperado: "contenção ao nível dos grandes trocânteres, íntegra e sem folga",
        pergunta: "Você confere a contenção pélvica, sem soltá-la. O que encontra?",
        feedbackCerto: "Isso. Ao nível dos grandes trocânteres, íntegra e firme, estabiliza a pelve sem ser mexida.",
        erradas: [
          ["posicionada na cintura, sobre as cristas ilíacas", "O correto é na altura dos grandes trocânteres."],
          ["solta, com folga e deslocada para os joelhos", "Ela está firme e bem posicionada."],
          ["aberta e retirada para higiene do paciente", "Ela não pode ser aberta sem a ortopedia."],
        ],
      }),
      lacuna({
        campo: "pulsos", rotulo: "Pulsos femorais e distais",
        valorEsperado: "pulsos femorais e distais palpáveis e simétricos",
        pergunta: "Você palpa os pulsos das duas pernas. O que encontra?",
        feedbackCerto: "Isso. Pulsos palpáveis e simétricos mostram boa perfusão dos membros.",
        erradas: [
          ["pulso femoral esquerdo ausente, com perna fria", "Os pulsos estão presentes dos dois lados."],
          ["pulsos distais fracos e assimétricos", "Os pulsos são simétricos e palpáveis."],
          ["pulsos ausentes nos dois pés", "Há pulsos palpáveis nos membros."],
        ],
      }),
      lacuna({
        campo: "hematocrito", rotulo: "Hematócrito de controle",
        valorEsperado: "hematócrito de 28%, após 2 concentrados de hemácias",
        pergunta: "Você olha o hematócrito de controle do paciente. Qual o valor?",
        feedbackCerto: "Isso. Hematócrito de 28% após 2 concentrados de hemácias, exigindo vigilância de novo sangramento.",
        erradas: [
          ["hematócrito de 42%, sem necessidade de vigilância", "O valor é de 28%, baixo para a perda de sangue."],
          ["hematócrito de 12%, com choque descompensado", "O valor é 28%, e o paciente está controlado."],
          ["hematócrito ainda não coletado desde a admissão", "O controle foi colhido e está em 28%."],
        ],
      }),
    ],
    perguntas: [
      pergunta("plt.politrauma_bacia.s1", "S", "Quem é o paciente e o que ele tem?", texto),
      pergunta("plt.politrauma_bacia.s2", "S", "Qual o leito e há quanto tempo ele chegou?", texto),
      pergunta("plt.politrauma_bacia.b1", "B", "Ele tem alergia ou doença de base?", texto),
      pergunta("plt.politrauma_bacia.a1", "A", "Como estão os sinais vitais?", numero("pa_sistolica", "pa_diastolica", "fc", "tax")),
      pergunta("plt.politrauma_bacia.a2", "A", "Como está a contenção da pelve?", texto, "contencao_pelvica"),
      pergunta("plt.politrauma_bacia.a3", "A", "E os pulsos das pernas, como estão?", texto, "pulsos"),
      pergunta("plt.politrauma_bacia.a4", "A", "Como está o hematócrito dele?", texto, "hematocrito"),
      pergunta("plt.politrauma_bacia.r1", "R", "Posso mexer na contenção pélvica?", texto),
      pergunta("plt.politrauma_bacia.r2", "R", "O que eu controlo e que exame vem a seguir?", texto),
    ],
    elementosChave: {
      S: ["identificação (iniciais e idade)", "leito e setor", "fratura instável de pelve", "choque hemorrágico controlado há 3 horas"],
      B: ["jovem hígido", "atleta", "sem histórico clínico prévio"],
      A: ["PA 102/64 e FC 118", "temperatura de 35,7 °C", "hematócrito de 28%", "pulsos femorais e distais simétricos"],
      R: ["não mexer na contenção sem a ortopedia", "aquecer para manter acima de 36 °C", "diurese rigorosa", "gasometria às 21h"],
    },
  },

  hemorragia_digestiva: {
    lacunas: [
      lacuna({
        campo: "sangramento", rotulo: "Sangramento",
        valorEsperado: "sem nova hematêmese na última hora; melena presente",
        pergunta: "Você pergunta sobre vômitos e vê as fezes do paciente. O que encontra?",
        feedbackCerto: "Isso. Sem nova hematêmese há 1 hora, mas com melena, o que pede vigilância contínua.",
        erradas: [
          ["hematêmese de sangue vivo há 10 minutos", "Não houve novo vômito de sangue na última hora."],
          ["fezes normais, sem melena", "Ele tem melena."],
          ["enterorragia com sangue vermelho vivo e coágulos", "O sangramento é melena, e não sangue vivo nas fezes."],
        ],
      }),
      lacuna({
        campo: "nivel_consciencia", rotulo: "Nível de consciência",
        valorEsperado: "sonolento, mas orientado",
        pergunta: "Você conversa com o paciente. Como está a consciência dele?",
        feedbackCerto: "Isso. Sonolento, mas orientado, e vale ficar atento à encefalopatia e à aspiração.",
        erradas: [
          ["torporoso, sem resposta a comandos", "Ele responde e está orientado."],
          ["agitado, com flapping e desorientação total", "Ele está sonolento, mas orientado."],
          ["totalmente alerta, sem sonolência", "Ele está sonolento."],
        ],
      }),
      lacuna({
        campo: "acesso_central", rotulo: "Acesso venoso central",
        valorEsperado: "cateter em subclávia direita pérvio, curativo íntegro",
        pergunta: "Você confere o acesso venoso central do paciente. O que encontra?",
        feedbackCerto: "Isso. Cateter em subclávia direita, pérvio e com curativo íntegro.",
        erradas: [
          ["cateter em jugular esquerda, obstruído", "O acesso é em subclávia direita e está pérvio."],
          ["cateter tracionado, com sangramento no sítio", "O cateter está bem fixado, com curativo íntegro."],
          ["sem acesso central, só um acesso periférico fino", "Ele tem cateter em subclávia direita."],
        ],
      }),
    ],
    perguntas: [
      pergunta("plt.hemorragia_digestiva.s1", "S", "Quem é o paciente e por que ele está aqui?", texto),
      pergunta("plt.hemorragia_digestiva.s2", "S", "Qual o leito e há quanto tempo ele chegou?", texto),
      pergunta("plt.hemorragia_digestiva.b1", "B", "Ele tem alergia ou doença de base?", texto),
      pergunta("plt.hemorragia_digestiva.a1", "A", "Como estão os sinais vitais?", numero("pa_sistolica", "pa_diastolica", "fc", "sat")),
      pergunta("plt.hemorragia_digestiva.a2", "A", "Ele sangrou de novo? Como estão as fezes?", texto, "sangramento"),
      pergunta("plt.hemorragia_digestiva.a3", "A", "Como está a consciência dele?", texto, "nivel_consciencia"),
      pergunta("plt.hemorragia_digestiva.a4", "A", "O acesso central está funcionando?", texto, "acesso_central"),
      pergunta("plt.hemorragia_digestiva.r1", "R", "Como eu posiciono e o que ele pode comer?", texto),
      pergunta("plt.hemorragia_digestiva.r2", "R", "Para onde ele vai e quando?", texto),
    ],
    elementosChave: {
      S: ["identificação (iniciais e idade)", "leito e setor", "HDA por ruptura de varizes", "internado há 3 horas"],
      B: ["cirrose alcoólica Child-Pugh B", "sangramento prévio há 8 meses", "sem alergias"],
      A: ["PA de 78/42 para 95/58 após volume", "FC 106 e saturação 94%", "sem hematêmese na última hora", "cateter em subclávia direita pérvio"],
      R: ["jejum absoluto", "decúbito elevado a 30 graus", "vigiar a via aérea", "endoscopia assim que a equipe chegar"],
    },
  },

  tep_pos_op: {
    lacunas: [
      lacuna({
        campo: "panturrilha", rotulo: "Panturrilha esquerda",
        valorEsperado: "edema e empastamento muscular na panturrilha esquerda",
        pergunta: "Você examina as panturrilhas do paciente. O que encontra?",
        feedbackCerto: "Isso. Edema e empastamento na panturrilha esquerda sugerem a trombose de origem.",
        erradas: [
          ["panturrilhas simétricas, sem edema nem dor", "Há edema e empastamento à esquerda."],
          ["edema e empastamento na panturrilha direita", "O achado é na perna esquerda, do lado da cirurgia."],
          ["pele fria e pálida, com pulsos ausentes", "Isso sugeriria oclusão arterial, não é o caso."],
        ],
      }),
      lacuna({
        campo: "oxigenacao", rotulo: "Oxigenação",
        valorEsperado: "SatO2 de 95% sob Venturi a 35%",
        pergunta: "Você confere a saturação e o oxigênio do paciente. O que encontra?",
        feedbackCerto: "Isso. SatO2 de 95% sob Venturi a 35%, com necessidade de oxigênio suplementar.",
        erradas: [
          ["SatO2 de 99% em ar ambiente", "Ele precisa de oxigênio para chegar a 95%."],
          ["SatO2 de 82% mesmo com máscara com reservatório", "Seria hipoxemia grave, e ele está em 95%."],
          ["SatO2 de 95% com ventilação mecânica invasiva", "Ele respira espontaneamente com Venturi."],
        ],
      }),
      lacuna({
        campo: "sangramento", rotulo: "Sinais de sangramento",
        valorEsperado: "curativo cirúrgico seco e gengivas sem sangramento",
        pergunta: "Você inspeciona o curativo do joelho e as gengivas. O que encontra?",
        feedbackCerto: "Isso. Curativo seco e gengivas sem sangramento, sem sinais de excesso de heparina.",
        erradas: [
          ["curativo encharcado de sangue e hematoma no joelho", "Não há sangramento no curativo."],
          ["gengivorragia e equimoses espalhadas", "Não há sinais de sangramento."],
          ["sangue na urina e nas fezes", "Não há sangramento urinário ou digestivo."],
        ],
      }),
    ],
    perguntas: [
      pergunta("plt.tep_pos_op.s1", "S", "Quem é o paciente e por que ele está na UTI?", texto),
      pergunta("plt.tep_pos_op.s2", "S", "Qual o leito e há quanto tempo ele chegou?", texto),
      pergunta("plt.tep_pos_op.b1", "B", "Qual foi a cirurgia dele? Tem alergia?", texto),
      pergunta("plt.tep_pos_op.a1", "A", "Como estão os sinais vitais?", numero("pa_sistolica", "pa_diastolica", "fc", "sat")),
      pergunta("plt.tep_pos_op.a2", "A", "Como está o oxigênio dele?", texto, "oxigenacao"),
      pergunta("plt.tep_pos_op.a3", "A", "E as panturrilhas, como estão?", texto, "panturrilha"),
      pergunta("plt.tep_pos_op.a4", "A", "Ele tem algum sangramento?", texto, "sangramento"),
      pergunta("plt.tep_pos_op.r1", "R", "Qual a dose da heparina e quando colho o TTPA?", texto),
      pergunta("plt.tep_pos_op.r2", "R", "Ele pode sair do leito?", texto),
    ],
    elementosChave: {
      S: ["identificação (iniciais e idade)", "leito e setor", "TEP submaciço confirmado por angiotomografia", "chegou há 2 horas"],
      B: ["artroplastia de joelho esquerdo", "pós-operatório recente", "sem alergias"],
      A: ["PA 112/70, FC 98 e FR 20", "SatO2 95% com Venturi a 35%", "panturrilha esquerda com edema", "heparina a 18 UI/kg/h"],
      R: ["TTPA de controle em 4 horas", "repouso absoluto no leito", "vigiar sangramento no curativo e gengivas"],
    },
  },

  falciforme_toracica: {
    lacunas: [
      lacuna({
        campo: "oxigenacao", rotulo: "Oxigenação",
        valorEsperado: "SatO2 de 91% em ar ambiente e 95% com cateter a 2 L/min",
        pergunta: "Você confere a saturação do paciente com e sem oxigênio. O que encontra?",
        feedbackCerto: "Isso. 91% em ar ambiente e 95% com 2 L/min, o que mostra hipoxemia que responde ao oxigênio.",
        erradas: [
          ["SatO2 de 99% em ar ambiente, sem oxigênio", "A saturação em ar ambiente é de 91%."],
          ["SatO2 de 80% mesmo com cateter a 2 L/min", "Ele sobe para 95% com o cateter."],
          ["SatO2 de 91% com cateter a 6 L/min", "Ele chega a 95% só com 2 L/min."],
        ],
      }),
      lacuna({
        campo: "dor", rotulo: "Dor",
        valorEsperado: "dor torácica ao respirar; dor nos fêmures EVA 3/10 com morfina",
        pergunta: "Você pergunta onde dói e quanto. O que ele relata?",
        feedbackCerto: "Isso. Dor torácica ao respirar e dor óssea controlada em EVA 3/10 sob morfina.",
        erradas: [
          ["sem dor nenhuma, nem no tórax nem nos ossos", "Ele tem dor torácica ao respirar e dor óssea leve."],
          ["dor em aperto no peito, que irradia para o braço, sem relação com a respiração", "A dor torácica piora ao respirar."],
          ["dor óssea insuportável, EVA 10/10", "A dor óssea está controlada, em 3/10."],
        ],
      }),
      lacuna({
        campo: "radiografia", rotulo: "Radiografia de tórax",
        valorEsperado: "infiltrado alveolar novo na base esquerda",
        pergunta: "Você olha o laudo do RX de tórax do paciente. O que mostra?",
        feedbackCerto: "Isso. Infiltrado alveolar novo na base esquerda fecha o diagnóstico da síndrome torácica aguda.",
        erradas: [
          ["RX normal, sem infiltrado", "O RX mostra um infiltrado novo."],
          ["pneumotórax à direita", "Não há pneumotórax."],
          ["derrame pleural volumoso bilateral", "O achado é um infiltrado na base esquerda."],
        ],
      }),
    ],
    perguntas: [
      pergunta("plt.falciforme_toracica.s1", "S", "Quem é o paciente e o que aconteceu hoje?", texto),
      pergunta("plt.falciforme_toracica.s2", "S", "Qual o leito e há quanto tempo piorou?", texto),
      pergunta("plt.falciforme_toracica.b1", "B", "Ele tem alergia? Como são as crises dele?", texto),
      pergunta("plt.falciforme_toracica.a1", "A", "Como estão os sinais vitais?", numero("fc", "fr", "sat", "tax")),
      pergunta("plt.falciforme_toracica.a2", "A", "Como está o oxigênio dele?", texto, "oxigenacao"),
      pergunta("plt.falciforme_toracica.a3", "A", "Como está a dor dele?", texto, "dor"),
      pergunta("plt.falciforme_toracica.a4", "A", "O que mostrou o RX de tórax?", texto, "radiografia"),
      pergunta("plt.falciforme_toracica.r1", "R", "Que antibióticos ele recebe?", texto),
      pergunta("plt.falciforme_toracica.r2", "R", "O que eu faço de hora em hora e que exame sai amanhã?", texto),
    ],
    elementosChave: {
      S: ["identificação (iniciais e idade)", "leito e setor", "síndrome torácica aguda iniciada hoje", "evolução de crise álgica há 6 horas"],
      B: ["anemia falciforme", "crises vaso-oclusivas frequentes", "sem alergias"],
      A: ["FC 104, FR 24 e temperatura 38,3 °C", "SatO2 91% em ar e 95% com 2 L/min", "infiltrado em base esquerda", "dor em fêmures EVA 3/10"],
      R: ["ceftriaxona e claritromicina", "espirometria de incentivo de hora em hora", "hemograma pela manhã"],
    },
  },

  paliativos_terminal: {
    lacunas: [
      lacuna({
        campo: "conforto", rotulo: "Sinais de dor ou desconforto",
        valorEsperado: "sem fácies de dor nem gemência, em repouso",
        pergunta: "Você observa o rosto e o corpo da paciente. O que encontra?",
        feedbackCerto: "Isso. Sem fácies de dor nem gemência, o controle de sintomas está adequado.",
        erradas: [
          ["fácies de dor, com gemência e agitação", "A paciente está confortável, sem sinais de dor."],
          ["inquieta, tentando sair do leito", "Ela está em repouso, sem agitação."],
          ["suor frio, com rigidez e punhos cerrados", "Não há sinais de sofrimento."],
        ],
      }),
      lacuna({
        campo: "hipodermoclise", rotulo: "Acesso subcutâneo",
        valorEsperado: "hipodermóclise no deltoide esquerdo, funcionante, sem hiperemia",
        pergunta: "Você inspeciona o local da hipodermóclise. O que encontra?",
        feedbackCerto: "Isso. Hipodermóclise funcionando, sem hiperemia, garante a infusão de morfina e hioscina.",
        erradas: [
          ["área vermelha, endurecida e dolorosa", "Não há sinal de irritação no local."],
          ["agulha solta, com a infusão extravasando", "O acesso funciona bem."],
          ["acesso em coxa direita, com hematoma", "O acesso é no deltoide esquerdo e está íntegro."],
        ],
      }),
      lacuna({
        campo: "respiracao", rotulo: "Respiração",
        valorEsperado: "estertor leve de vias aéreas altas, sem esforço respiratório",
        pergunta: "Você escuta a respiração da paciente. O que encontra?",
        feedbackCerto: "Isso. Estertor leve de vias aéreas altas, sem esforço. Posicionar e hidratar a boca basta.",
        erradas: [
          ["respiração tranquila, sem ruído nenhum", "Ela tem um estertor leve de vias altas."],
          ["tiragem intensa e uso de musculatura acessória", "Ela não tem esforço respiratório."],
          ["estertor intenso, com muita secreção e engasgos", "O estertor é leve, e não exige aspiração."],
        ],
      }),
    ],
    perguntas: [
      pergunta("plt.paliativos_terminal.s1", "S", "Quem é a paciente e qual o plano de cuidado?", texto),
      pergunta("plt.paliativos_terminal.s2", "S", "Qual o quarto e quem está com ela?", texto),
      pergunta("plt.paliativos_terminal.b1", "B", "Qual a doença dela e há diretivas de vontade?", texto),
      pergunta("plt.paliativos_terminal.a1", "A", "Como estão os sinais vitais?", numero("pa_sistolica", "pa_diastolica", "fc", "fr", "sat")),
      pergunta("plt.paliativos_terminal.a2", "A", "Ela parece sentir dor ou desconforto?", texto, "conforto"),
      pergunta("plt.paliativos_terminal.a3", "A", "Como está o acesso da hipodermóclise?", texto, "hipodermoclise"),
      pergunta("plt.paliativos_terminal.a4", "A", "Como está a respiração dela?", texto, "respiracao"),
      pergunta("plt.paliativos_terminal.r1", "R", "Que cuidados eu mantenho no plantão?", texto),
      pergunta("plt.paliativos_terminal.r2", "R", "Quando eu dou a dose de resgate de morfina?", texto),
    ],
    elementosChave: {
      S: ["identificação (iniciais e idade)", "quarto e setor", "plano exclusivo de conforto", "filha acompanhando"],
      B: ["câncer metastático refratário", "diretivas antecipadas assinadas", "assinadas pela paciente e família"],
      A: ["PA 80/45, FC 62 e FR 12", "hipodermóclise funcionando", "morfina 20 mg e hioscina 60 mg em 24 horas", "sem fácies de dor, estertor leve"],
      R: ["decúbito lateral com coxins", "hidratação labial frequente", "sem aspiração dolorosa", "resgate de morfina se taquipneia ou agitação"],
    },
  },

  crise_tireotoxica: {
    lacunas: [
      lacuna({
        campo: "temperatura_pele", rotulo: "Temperatura e pele",
        valorEsperado: "Tax 39,8 °C, pele quente e sudoreica",
        pergunta: "Você mede a temperatura e toca a pele da paciente. O que encontra?",
        feedbackCerto: "Isso. Tax 39,8 °C, com pele quente e sudoreica, é a hipertermia da tempestade tireoidiana.",
        erradas: [
          ["Tax 36,5 °C, pele fria e seca", "Ela tem hipertermia importante."],
          ["Tax 35,0 °C, com calafrios e pele pálida", "Seria hipotermia, o oposto do caso."],
          ["Tax 38,0 °C, pele seca e sem sudorese", "A temperatura é maior, e a pele sua."],
        ],
      }),
      lacuna({
        campo: "ritmo_cardiaco", rotulo: "Ritmo cardíaco",
        valorEsperado: "taquicardia sinusal de 158 bpm no monitor",
        pergunta: "Você olha o monitor cardíaco da paciente. O que mostra?",
        feedbackCerto: "Isso. Taquicardia sinusal de 158 bpm, sob propranolol venoso.",
        erradas: [
          ["bradicardia de 42 bpm", "A FC está em 158."],
          ["fibrilação ventricular", "O ritmo é de taquicardia sinusal, sem parada."],
          ["ritmo sinusal de 72 bpm", "A FC é muito maior, de 158."],
        ],
      }),
      lacuna({
        campo: "neuro_pulmao", rotulo: "Tremor e pulmão",
        valorEsperado: "tremores finos de extremidades, sem sinais de edema pulmonar",
        pergunta: "Você observa as mãos e escuta o pulmão da paciente. O que encontra?",
        feedbackCerto: "Isso. Tremores finos e pulmão limpo, sem sinais de edema pulmonar agudo.",
        erradas: [
          ["sem tremor, com pulmão limpo e paciente sonolenta", "Ela está agitada, com tremores finos."],
          ["crepitações até os ápices, com escarro rosado", "Seria edema pulmonar, que ela não tem."],
          ["rigidez muscular e hiporreflexia", "Ela tem tremores finos."],
        ],
      }),
    ],
    perguntas: [
      pergunta("plt.crise_tireotoxica.s1", "S", "Quem é a paciente e por que ela está na UTI?", texto),
      pergunta("plt.crise_tireotoxica.s2", "S", "Qual o leito e quanto deu o escore de Burch-Wartofsky?", texto),
      pergunta("plt.crise_tireotoxica.b1", "B", "Qual a doença de base? Tem alergia?", texto),
      pergunta("plt.crise_tireotoxica.a1", "A", "Como estão os sinais vitais?", numero("pa_sistolica", "fc", "fr", "tax")),
      pergunta("plt.crise_tireotoxica.a2", "A", "Como está a temperatura e a pele?", texto, "temperatura_pele"),
      pergunta("plt.crise_tireotoxica.a3", "A", "E o ritmo cardíaco no monitor?", texto, "ritmo_cardiaco"),
      pergunta("plt.crise_tireotoxica.a4", "A", "Ela tem tremor? E o pulmão, como está?", texto, "neuro_pulmao"),
      pergunta("plt.crise_tireotoxica.r1", "R", "Que medicações eu dou e em que ordem?", texto),
      pergunta("plt.crise_tireotoxica.r2", "R", "Tem algum remédio que eu não posso dar a ela?", texto),
    ],
    elementosChave: {
      S: ["identificação (iniciais e idade)", "leito e setor", "tempestade tireoidiana há 4 horas", "Burch-Wartofsky de 65 pontos"],
      B: ["doença de Graves", "sem tratamento regular há 2 meses", "sem alergias"],
      A: ["PA 165/70, FC 158 e FR 26", "Tax 39,8 °C com resfriamento", "propranolol venoso iniciado", "sem edema pulmonar"],
      R: ["PTU por sonda nasogástrica", "Lugol 1 hora após o PTU", "proibido AAS", "monitorização cardíaca contínua"],
    },
  },
  srpa_colectomia: {
    lacunas: [
      lacuna({
        campo: "via_aerea_respiracao", rotulo: "Via aérea e respiração",
        valorEsperado: "respiração lenta e superficial, roncos leves, FR 8 irpm e SpO2 89% em ar ambiente",
        pergunta: "Você observa a respiração e o oxímetro do paciente. O que encontra?",
        feedbackCerto: "Isso. Respiração lenta e superficial com dessaturação: hipoventilação, provavelmente pelo opioide.",
        erradas: [
          ["respiração rápida, com sibilos e expiração prolongada", "Isso sugeriria broncoespasmo; aqui a respiração está lenta."],
          ["estridor alto com tiragem e agitação", "Estridor é obstrução alta (laringoespasmo); o paciente está sonolento e lento."],
          ["respiração regular, FR 16 irpm e SpO2 97%", "A respiração não está normal: FR 8 e SpO2 89%."],
        ],
      }),
      lacuna({
        campo: "consciencia_aldrete", rotulo: "Consciência e escore de Aldrete",
        valorEsperado: "desperta só ao chamado; Aldrete e Kroulik 5, sem critério de alta",
        pergunta: "Você chama o paciente e pontua a escala de Aldrete e Kroulik. Qual o resultado?",
        feedbackCerto: "Isso. Atividade 2, respiração 1, circulação 1, consciência 1 e SpO2 0: total 5, sem critério de alta.",
        erradas: [
          ["acordado e orientado; Aldrete 10, pronto para a alta", "Ele desperta só ao chamado e dessatura: não tem critério de alta."],
          ["não responde a estímulo doloroso; Aldrete 2", "Ele desperta ao chamado; a consciência pontua 1."],
          ["desperta ao chamado; Aldrete 9, com alta liberada", "Com SpO2 de 89% em ar ambiente, a saturação pontua 0: o total é 5."],
        ],
      }),
    ],
    perguntas: [
      pergunta("plt.srpa_colectomia.s1", "S", "Quem é o paciente e que cirurgia ele fez?", texto),
      pergunta("plt.srpa_colectomia.s2", "S", "Que anestesia ele recebeu e há quanto tempo está aqui?", texto),
      pergunta("plt.srpa_colectomia.b1", "B", "Qual o ASA dele? Tem alergia?", texto),
      pergunta("plt.srpa_colectomia.a1", "A", "Como estão os sinais vitais?", numero("pa_sistolica", "pa_diastolica", "fr", "sat")),
      pergunta("plt.srpa_colectomia.a2", "A", "E a respiração, como está?", texto, "via_aerea_respiracao"),
      pergunta("plt.srpa_colectomia.a3", "A", "Ele está acordado? Quanto deu o Aldrete?", texto, "consciencia_aldrete"),
      pergunta("plt.srpa_colectomia.r1", "R", "O que eu faço agora com ele?", texto),
      pergunta("plt.srpa_colectomia.r2", "R", "Quem eu aviso e o que deixo pronto?", texto),
    ],
    elementosChave: {
      S: ["identificação (iniciais e idade)", "SRPA, leito 3", "colectomia sob anestesia geral", "chegou há 30 minutos"],
      B: ["ASA III", "hipertensão e DPOC", "morfina no fim da cirurgia", "sem alergias"],
      A: ["FR 8 e SpO2 89% em ar ambiente", "PA 92/54, cerca de 30% abaixo da basal", "sonolento, desperta ao chamado", "Aldrete 5"],
      R: ["O2 e cabeceira elevada", "estimular a respirar e reavaliar a cada 5 minutos", "naloxona pronta", "avisar o anestesiologista", "aquecer com manta"],
    },
  },

  caso2_apendicectomia_dm: {
    lacunas: [
      lacuna({
        campo: "glicemia", rotulo: "Glicemia capilar",
        valorEsperado: "238 mg/dL antes do almoço",
        pergunta: "Você faz a glicemia capilar antes do almoço. Quanto deu?",
        feedbackCerto: "Isso. 238 mg/dL: pela escala da prescrição, insulina regular com a dose usual + 2 UI.",
        erradas: [
          ["62 mg/dL, com sudorese e tremor", "Seria hipoglicemia; o paciente está hiperglicêmico."],
          ["110 mg/dL", "A glicemia está bem mais alta que isso."],
          ["450 mg/dL com cetonúria", "Está alta, mas não nesse nível de cetoacidose."],
        ],
      }),
      lacuna({
        campo: "abdome", rotulo: "Abdome",
        valorEsperado: "distendido, ruídos hidroaéreos diminuídos, sem flatos desde a cirurgia; curativo limpo e seco",
        pergunta: "Você examina o abdome e o curativo. O que encontra?",
        feedbackCerto: "Isso. Distensão com ruídos diminuídos e sem flatos: vigie o íleo pós-operatório.",
        erradas: [
          ["rígido, em tábua, com dor à descompressão brusca", "Isso sugeriria peritonite, o que não é o quadro."],
          ["flácido, com ruídos normais e flatos presentes", "Ele ainda não eliminou flatos e o abdome está distendido."],
          ["curativo com secreção purulenta e hiperemia", "O curativo está limpo e seco."],
        ],
      }),
    ],
    perguntas: [
      pergunta("plt.caso2_apendicectomia_dm.s1", "S", "Quem é o paciente e por que ele operou?", texto),
      pergunta("plt.caso2_apendicectomia_dm.s2", "S", "Qual o leito e o dia de pós-operatório?", texto),
      pergunta("plt.caso2_apendicectomia_dm.b1", "B", "Quais as doenças de base? Tem alergia?", texto),
      pergunta("plt.caso2_apendicectomia_dm.a1", "A", "Como estão os sinais vitais?", numero("pa_sistolica", "pa_diastolica", "fc", "tax")),
      pergunta("plt.caso2_apendicectomia_dm.a2", "A", "E a glicemia, quanto deu?", texto, "glicemia"),
      pergunta("plt.caso2_apendicectomia_dm.a3", "A", "Como está o abdome? Já eliminou flatos?", texto, "abdome"),
      pergunta("plt.caso2_apendicectomia_dm.r1", "R", "Que horários de glicemia e insulina eu preciso cumprir?", texto),
      pergunta("plt.caso2_apendicectomia_dm.r2", "R", "O que eu vigio e o que oriento para a alta?", texto),
    ],
    elementosChave: {
      S: ["identificação (iniciais e idade)", "leito 7-B", "apendicectomia por apendicite", "1º dia de pós-operatório"],
      B: ["diabetes tipo 2", "uso irregular de metformina", "hipertensão", "sem alergias"],
      A: ["PA, FC e temperatura", "glicemia de 238 mg/dL", "náusea", "abdome distendido sem flatos", "curativo limpo e seco"],
      R: ["glicemia antes das refeições e às 22h", "insulina regular pela escala e NPH antes da janta", "antiemético se náusea", "vigiar flatos e distensão", "orientar a metformina para a alta"],
    },
  },
};

export function cenarioDoPlantao(id) {
  const base = PRESET_HANDOFF_SCENARIOS.find((c) => c.id === id);
  const extra = PLANTAO_EXTRAS[id];
  return base && extra ? { ...base, ...extra } : null;
}

// Só os cenários que já têm os dados do Plantão.
export const PLANTAO_CENARIOS = PRESET_HANDOFF_SCENARIOS.filter((c) => PLANTAO_EXTRAS[c.id]).map((c) => ({ ...c, ...PLANTAO_EXTRAS[c.id] }));
