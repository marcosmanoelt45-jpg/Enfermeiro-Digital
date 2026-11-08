// Minijogo "Monte a bandeja do curativo simples" (arrastar). Sem imagens por enquanto: o tipo funciona com ícone + rótulo.
export default {
  id: "bandeja-curativo-simples",
  versao: 1,
  tipo: "arrastar",
  titulo: "Monte a bandeja do curativo simples",
  instrucao: "Coloque na bandeja só o que você usa num curativo simples. O resto fica de fora.",
  categoria: "curativos",
  // Conferir se o POP de curativo do procedureService lista exatamente estes materiais (registrado no ESTADO.md).
  fonte: { titulo: "POP de curativo (Videoteca de Procedimentos): conferir fonte" },
  arrastar: {
    fundo: null,
    alvos: [{ id: "bandeja", label: "Bandeja do curativo", imagem: "/minijogos/bandeja.webp", area: { x: 4, y: 4, w: 92, h: 92 } }],
    itens: [
      { id: "pacote-curativo", label: "Pacote de curativo estéril", imagem: "/minijogos/pacote-curativo.webp", alvoCorreto: "bandeja", explicacao: "O pacote traz o instrumental estéril (pinças) para o curativo." },
      { id: "sf09", label: "Soro fisiológico 0,9%", imagem: "/minijogos/sf09.webp", alvoCorreto: "bandeja", explicacao: "Limpa a ferida sem agredir o tecido." },
      { id: "gazes", label: "Gazes estéreis", imagem: "/minijogos/gazes.webp", alvoCorreto: "bandeja", explicacao: "Limpam e secam a pele ao redor sem contaminar." },
      { id: "luvas", label: "Luvas de procedimento", imagem: "/minijogos/luvas.webp", alvoCorreto: "bandeja", explicacao: "Protegem você e o paciente." },
      { id: "cobertura", label: "Cobertura ou fita", imagem: "/minijogos/cobertura.webp", alvoCorreto: "bandeja", explicacao: "Fecha e protege a ferida depois do curativo." },
      { id: "saco-lixo", label: "Saco de lixo", imagem: "/minijogos/saco-lixo.webp", alvoCorreto: "bandeja", explicacao: "O material usado é descartado já ao lado do paciente." },
      { id: "bisturi", label: "Lâmina de bisturi", imagem: "/minijogos/bisturi.webp", alvoCorreto: null, explicacao: "Desbridamento cortante não faz parte do curativo simples e exige profissional habilitado." },
      { id: "seringa-insulina", label: "Seringa de insulina", imagem: "/minijogos/seringa-insulina.webp", alvoCorreto: null, explicacao: "É para aplicar insulina, não para o curativo." },
      { id: "garrote", label: "Garrote", imagem: "/minijogos/garrote.webp", alvoCorreto: null, explicacao: "Serve para punção venosa, não para curativo." },
      { id: "sonda-vesical", label: "Sonda vesical", imagem: "/minijogos/sonda-vesical.webp", alvoCorreto: null, explicacao: "É material de cateterismo, outro procedimento." },
      { id: "algodao-alcool", label: "Algodão com álcool para a ferida", imagem: "/minijogos/algodao-alcool.webp", alvoCorreto: null, explicacao: "O álcool agride o tecido da ferida e atrasa a cicatrização." },
    ],
  },
};
