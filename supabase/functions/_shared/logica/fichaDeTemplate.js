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
    { tema: "hda", peso: 2, texto: ate(anam[0] ?? arq.anamnesis, 22), pergunta: "O que trouxe o senhor aqui hoje e como começou?" },
    { tema: "alergias", peso: 3, texto: ate(arq.allergies, 20), pergunta: "O senhor tem alergia a algum remédio ou alimento?" },
    { tema: "medicacoes", peso: 3, texto: ate(`Uso: ${arq.medications}`, 22), pergunta: "Quais remédios o senhor toma, e como toma?" },
    { tema: "antecedentes", peso: 2, texto: ate(hist[0] ?? arq.medicalHistory, 22), pergunta: "O senhor tem alguma doença ou já se internou antes?" },
    { tema: "sintomas_associados", peso: 2, texto: ate(anam[1] ?? arq.notes, 22), pergunta: "Está sentindo mais alguma coisa junto com isso?" },
    { tema: "habitos", peso: 1, texto: ate(hist[1] ?? "Não tenho hábitos que me preocupem.", 22), pergunta: "Como são seus hábitos, como cigarro, bebida e alimentação?" },
    { tema: "adesao", peso: 2, texto: "Às vezes esqueço de tomar os remédios no horário.", pergunta: "O senhor tem tomado os remédios todo dia, do jeito que o médico passou?" },
    { tema: "social", peso: 1, texto: "Moro com a família, mas me preocupo com a rotina de casa.", pergunta: "Com quem o senhor mora e como está em casa?" },
  ];

  const regras = REVELACAO[dificuldade] ?? REVELACAO.normal;
  const fatos = textos.map((t, i) => {
    const id = `f${i + 1}`;
    const revelacao = regras[i];
    const fato = { id, tema: t.tema, texto: t.texto, peso: t.peso, revelacao, perguntaQueRevela: t.pergunta };
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
      ocupacao: "aposentado(a)",
      escolaridade: "fundamental",
      mora_com: "a família",
    },
    setor: setorDe(arq.specialty, leito),
    queixaPrincipal: ate(anam[0] ?? arq.anamnesis, 15),
    sinaisVitais: { ...arq.vitals },
    fatos,
    examesDisponiveis: examesCandidatos(arq.specialty).slice(0, 2),
    diagnosticosEsperados: dxCodigos,
    intervencoesEsperadas: ["Monitorar os sinais vitais", "Avaliar a queixa principal e a dor", "Orientar o paciente e a família", "Manter o ambiente seguro"],
    personalidadeId,
    dificuldade,
  };
}
