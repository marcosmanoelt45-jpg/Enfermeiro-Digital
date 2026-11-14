// Minijogo "Os 9 certos da medicação" (arrastar). Lista e explicações pelo cartaz da Anvisa/GGTES "Práticas seguras
// para prevenção de erros na administração de medicamentos" (usado na disciplina ENF01015 da UFRGS) e pelo Protocolo
// de Segurança na Prescrição, Uso e Administração de Medicamentos (MS/Anvisa, 2013).
export default {
  id: "nove-certos",
  versao: 2,
  tipo: "arrastar",
  titulo: "Os 9 certos da medicação",
  instrucao: "Arraste para o quadro só o que faz parte dos 9 certos. O resto fica de fora.",
  categoria: "medicacao",
  fonte: { titulo: "Anvisa/GGTES: Práticas seguras para prevenção de erros na administração de medicamentos (os nove certos); MS/Anvisa/Fiocruz: Protocolo de Segurança na Prescrição, Uso e Administração de Medicamentos (2013)", url: "https://portaldeboaspraticas.iff.fiocruz.br/biblioteca/protocolo-de-seguranca-na-prescricao-uso-e-administracao-de-medicamentos/" },
  arrastar: {
    fundo: null,
    alvos: [{ id: "certos", label: "Os 9 certos", imagem: null, area: { x: 4, y: 4, w: 92, h: 92 } }],
    itens: [
      { id: "paciente", label: "Paciente certo", imagem: null, alvoCorreto: "certos", explicacao: "Use pelo menos dois identificadores (nome completo e outro dado), conferidos na pulseira, no leito e no prontuário." },
      { id: "medicamento", label: "Medicamento certo", imagem: null, alvoCorreto: "certos", explicacao: "Compare o rótulo com a prescrição e confira se o paciente não tem alergia a ele." },
      { id: "via", label: "Via certa", imagem: null, alvoCorreto: "certos", explicacao: "A via prescrita; confira diluente, velocidade de infusão e compatibilidade com seringa, sonda ou equipo." },
      { id: "hora", label: "Hora certa", imagem: null, alvoCorreto: "certos", explicacao: "No horário prescrito; antecipar ou atrasar só com o aval do enfermeiro ou do prescritor." },
      { id: "dose", label: "Dose certa", imagem: null, alvoCorreto: "certos", explicacao: "Confira a dose e a unidade; prescrição vaga (\"se necessário\" sem critério) não se administra. Alta vigilância: dupla checagem." },
      { id: "registro", label: "Registro certo", imagem: null, alvoCorreto: "certos", explicacao: "Cheque o horário a cada dose e registre adiamentos, recusas e eventos adversos." },
      { id: "orientacao", label: "Orientação certa", imagem: null, alvoCorreto: "certos", explicacao: "Esclareça dúvidas com o prescritor e explique ao paciente o nome, o motivo e os efeitos esperados." },
      { id: "forma", label: "Forma certa", imagem: null, alvoCorreto: "certos", explicacao: "A forma farmacêutica certa para a via e a condição do paciente." },
      { id: "resposta", label: "Resposta certa", imagem: null, alvoCorreto: "certos", explicacao: "Observe se o medicamento teve o efeito esperado e se houve reação." },
      { id: "marca", label: "Marca comercial certa", imagem: null, alvoCorreto: null, explicacao: "O que importa é o princípio ativo, não a marca." },
      { id: "preco", label: "Preço certo", imagem: null, alvoCorreto: null, explicacao: "Custo não é um dos certos da administração." },
      { id: "diagnostico", label: "Diagnóstico médico certo", imagem: null, alvoCorreto: null, explicacao: "Não é papel da checagem de administração; a indicação vem da prescrição." },
    ],
  },
};
