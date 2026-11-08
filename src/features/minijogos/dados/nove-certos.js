// Minijogo "Os 9 certos da medicação" (arrastar). Lista usada pelo COREN e pelo Protocolo de Segurança na
// Prescrição, Uso e Administração de Medicamentos (Ministério da Saúde/ANVISA, 2013).
export default {
  id: "nove-certos",
  versao: 1,
  tipo: "arrastar",
  titulo: "Os 9 certos da medicação",
  instrucao: "Arraste para o quadro só o que faz parte dos 9 certos. O resto fica de fora.",
  categoria: "medicacao",
  fonte: { titulo: "MS/ANVISA/Fiocruz: Protocolo de Segurança na Prescrição, Uso e Administração de Medicamentos (2013); o protocolo do HCPA não é público", url: "https://portaldeboaspraticas.iff.fiocruz.br/biblioteca/protocolo-de-seguranca-na-prescricao-uso-e-administracao-de-medicamentos/" },
  arrastar: {
    fundo: null,
    alvos: [{ id: "certos", label: "Os 9 certos", imagem: null, area: { x: 4, y: 4, w: 92, h: 92 } }],
    itens: [
      { id: "paciente", label: "Paciente certo", imagem: null, alvoCorreto: "certos", explicacao: "Confira nome completo e data de nascimento (pulseira)." },
      { id: "medicamento", label: "Medicamento certo", imagem: null, alvoCorreto: "certos", explicacao: "Compare o rótulo com a prescrição." },
      { id: "via", label: "Via certa", imagem: null, alvoCorreto: "certos", explicacao: "A via prescrita, compatível com a apresentação." },
      { id: "hora", label: "Hora certa", imagem: null, alvoCorreto: "certos", explicacao: "No horário prescrito, respeitando o intervalo." },
      { id: "dose", label: "Dose certa", imagem: null, alvoCorreto: "certos", explicacao: "Confira o cálculo; em alta vigilância, dupla checagem." },
      { id: "registro", label: "Registro certo", imagem: null, alvoCorreto: "certos", explicacao: "Registre o que foi feito, quando e por quem." },
      { id: "orientacao", label: "Orientação certa", imagem: null, alvoCorreto: "certos", explicacao: "Explique ao paciente o que ele vai receber e para quê." },
      { id: "forma", label: "Forma certa", imagem: null, alvoCorreto: "certos", explicacao: "A forma farmacêutica certa para a via e a condição do paciente." },
      { id: "resposta", label: "Resposta certa", imagem: null, alvoCorreto: "certos", explicacao: "Observe se o medicamento teve o efeito esperado e se houve reação." },
      { id: "marca", label: "Marca comercial certa", imagem: null, alvoCorreto: null, explicacao: "O que importa é o princípio ativo, não a marca." },
      { id: "preco", label: "Preço certo", imagem: null, alvoCorreto: null, explicacao: "Custo não é um dos certos da administração." },
      { id: "diagnostico", label: "Diagnóstico médico certo", imagem: null, alvoCorreto: null, explicacao: "Não é papel da checagem de administração; a indicação vem da prescrição." },
    ],
  },
};
