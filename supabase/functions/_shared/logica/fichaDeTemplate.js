// Ficha-verdade SEM IA, derivada do arquétipo. É a reserva quando a IA falha duas vezes em gerar uma ficha válida.
// Os textos vêm do caso clínico (em linguagem de caso, não de leigo), mas as regras de revelação, os pesos
// e os sinais vitais seguem o contrato C7 e passam em validarFicha.
import { nomeFicticio } from "../dados/nomes.js";
import { examesCandidatos, setorDe } from "../dados/examesPorEspecialidade.js";

// Revelação de cada fato (f1..f8) por dificuldade. Contagens (n=8) cumprem a tabela de distribuição.
const REVELACAO = {
  facil: ["livre", "pergunta_direta", "pergunta_direta", "livre", "livre", "pergunta_direta", "confianca", "livre"],
  normal: ["livre", "pergunta_direta", "pergunta_direta", "pergunta_direta", "pergunta_direta", "esquecido", "confianca", "livre"],
  dificil: ["livre", "pergunta_direta", "pergunta_direta", "esquecido", "pergunta_direta", "confianca", "confianca", "confianca"],
};

const CONFIANCA_MIN = { f6: 50, f7: 60, f8: 55 };
const VERSAO_FALSA = {
  f6: "Não, não tenho esse costume.",
  f7: "Tomo tudo certinho, nunca esqueço.",
  f8: "Tá tudo bem em casa, não tenho preocupação.",
};

function frases(texto) {
  return String(texto ?? "").split(/(?<=[.!?])\s+/).map((f) => f.trim()).filter(Boolean);
}

function ate(texto, maxPalavras) {
  return String(texto).split(/\s+/).slice(0, maxPalavras).join(" ").replace(/[,;:\s]+$/, "");
}

// Queixa e história nas palavras do paciente (a ficha de reserva usava o texto técnico do caso, no masculino:
// "Admitido na emergência com dispneia..." aparecia como motivo da internação da Dona Teresinha).
const QUEIXA_LEIGA = {
  sc_iam: ["Uma dor forte no peito, que aperta e vai pro braço.", "Começou há umas duas horas, do nada, com suor frio e enjoo."],
  sc_dpoc: ["Tô com muita falta de ar e tossindo catarro verde.", "Foi piorando nos últimos dias, agora canso até pra falar."],
  sc_ave_trombolise: ["Meu braço e minha perna do lado direito ficaram fracos.", "Foi de repente, faz pouco mais de uma hora, e a fala embolou."],
  sc_sepse_urinaria: ["Tô com febre, calafrio e a urina tá com cheiro forte.", "Faz uns dois dias que tô assim, cada vez mais fraco e confuso."],
  sc_cad: ["Muita sede, enjoo e uma dor na barriga que não passa.", "Faz uns dias que bebo água o tempo todo e respiro meio fundo."],
  sc_peritonite: ["Uma dor forte na barriga, do lado direito embaixo.", "Começou perto do umbigo, desceu pro lado, e tô vomitando com febre."],
  sc_ira_rabdo: ["Caí em casa e fiquei muito tempo no chão sem conseguir levantar.", "Agora quase não faço xixi e o pouco que sai é escuro."],
  sc_preeclampsia: ["Uma dor de cabeça muito forte e a vista embaçando.", "Começou hoje, com dor no estômago também."],
  sc_trauma_hemorragico: ["Me machuquei feio na perna num acidente.", "Tá sangrando e tô me sentindo tonto."],
  sc_tep: ["Uma dor no peito que piora quando respiro fundo.", "Começou de repente, com falta de ar, uns dias depois da cirurgia do joelho."],
  sc_icc_perfil_b: ["Falta de ar, principalmente quando deito.", "Preciso de três travesseiros pra dormir e as pernas tão inchadas."],
  sc_pancreatite: ["Uma dor muito forte no alto da barriga, que vai pras costas.", "Começou depois de um almoço pesado, com enjoo, e remédio não resolve."],
  sc_delirium_idoso: ["Não tô entendendo onde eu tô, tem uns bichos na parede.", "À noite fico agitado e querem me segurar na cama."],
  sc_anafilaxia: ["Minha garganta tá fechando e o corpo todo coçando.", "Começou logo que puseram o remédio na veia."],
  sc_queimadura: ["Me queimei no rosto, no peito e nos braços.", "O botijão de gás explodiu em casa, e tá doendo muito."],
};

// Concordância de gênero nos textos do caso e nas perguntas (o caso-base costuma estar no masculino).
const FEMININO = [
  [/\bo senhor\b/g, "a senhora"], [/\bO senhor\b/g, "A senhora"], [/\bdo senhor\b/g, "da senhora"],
  [/\bAdmitido\b/g, "Admitida"], [/\badmitido\b/g, "admitida"], [/\btrazido\b/g, "trazida"], [/\bresgatado\b/g, "resgatada"],
  [/\bidoso\b/g, "idosa"], [/\bHígido\b/g, "Hígida"], [/\bhígido\b/g, "hígida"], [/\bEx-tabagista pesado\b/g, "Ex-tabagista pesada"],
  [/\btonto\b/g, "tonta"], [/\bfraco\b/g, "fraca"], [/\bconfuso\b/g, "confusa"], [/\bagitado\b/g, "agitada"],
  [/\baposentado\(a\)/g, "aposentada"],
];
export function concordar(texto, sexo) {
  let t = String(texto ?? "");
  if (sexo === "F") for (const [re, troca] of FEMININO) t = t.replace(re, troca);
  else t = t.replace(/aposentado\(a\)/g, "aposentado");
  return t;
}

// opcoes: { idade, sexo, personalidadeId, dificuldade, leito, sorteio1, sorteio2 }
/**
 * @param {any} arq
 * @param {any} [opcoes]
 */
export function fichaDeTemplate(arq, opcoes = {}) {
  const { idade, sexo, personalidadeId, dificuldade = "normal", leito = 7, sorteio1, sorteio2 } = opcoes;
  const sexoFinal = sexo ?? arq.preferredGender ?? "M";
  const idadeFinal = idade ?? Math.round((arq.ageRange[0] + arq.ageRange[1]) / 2);
  const dxCodigos = arq.nandaCandidatos.slice(0, 3).map((c) => c.codigo);
  const anam = frases(arq.anamnesis);
  const hist = frases(arq.medicalHistory);

  const textos = [
    { tema: "hda", peso: 2, texto: QUEIXA_LEIGA[arq.id]?.[1] ?? ate(anam[0] ?? arq.anamnesis, 22), pergunta: "O que trouxe o senhor aqui hoje e como começou?" },
    { tema: "alergias", peso: 3, texto: ate(arq.allergies, 20), pergunta: "O senhor tem alergia a algum remédio ou alimento?" },
    { tema: "medicacoes", peso: 3, texto: ate(`Uso: ${arq.medications}`, 22), pergunta: "Quais remédios o senhor toma, e como toma?" },
    { tema: "antecedentes", peso: 2, texto: ate(hist[0] ?? arq.medicalHistory, 22), pergunta: "O senhor tem alguma doença ou já se internou antes?" },
    { tema: "sintomas_associados", peso: 2, texto: ate(anam[1] ?? arq.notes, 22), pergunta: "Está sentindo mais alguma coisa junto com isso?" },
    { tema: "habitos", peso: 1, texto: ate(hist[1] ?? "Não tenho hábitos que me preocupem.", 22), pergunta: "Como são seus hábitos, como cigarro, bebida e alimentação?" },
    { tema: "adesao", peso: 2, texto: "Às vezes esqueço de tomar os remédios no horário.", pergunta: "O senhor tem tomado os remédios todo dia, do jeito que o médico passou?" },
    { tema: "social", peso: 1, texto: "Moro com a família. Trouxe na bolsa a receita e o papel do posto, e minha filha tem tudo anotado.", pergunta: "Com quem o senhor mora e como está em casa?" },
  ];

  const regras = REVELACAO[dificuldade] ?? REVELACAO.normal;
  const fatos = textos.map((t, i) => {
    const id = `f${i + 1}`;
    const revelacao = regras[i];
    const fato = { id, tema: t.tema, texto: concordar(t.texto, sexoFinal), peso: t.peso, revelacao, perguntaQueRevela: concordar(t.pergunta, sexoFinal) };
    if (revelacao === "confianca") {
      fato.confiancaMin = CONFIANCA_MIN[id] ?? 60;
      fato.versaoFalsa = VERSAO_FALSA[id] ?? "Não, está tudo certo.";
    }
    return fato;
  });

  return {
    origem: "template",
    arquetipoId: arq.id,
    identificacao: {
      nome: nomeFicticio(sexoFinal, sorteio1, sorteio2),
      idade: idadeFinal,
      sexo: sexoFinal,
      ocupacao: concordar("aposentado(a)", sexoFinal),
      escolaridade: "fundamental",
      mora_com: "a família",
    },
    setor: setorDe(arq.specialty, leito),
    queixaPrincipal: concordar(QUEIXA_LEIGA[arq.id]?.[0] ?? ate(anam[0] ?? arq.anamnesis, 15), sexoFinal),
    sinaisVitais: { ...arq.vitals },
    fatos,
    examesDisponiveis: examesCandidatos(arq.specialty).slice(0, 2),
    diagnosticosEsperados: dxCodigos,
    intervencoesEsperadas: ["Monitorar os sinais vitais", "Avaliar a queixa principal e a dor", "Orientar o paciente e a família", "Manter o ambiente seguro"],
    personalidadeId,
    dificuldade,
  };
}
