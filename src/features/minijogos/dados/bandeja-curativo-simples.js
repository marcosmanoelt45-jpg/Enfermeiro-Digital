// Minijogo "Monte a bandeja do curativo simples" (arrastar, cena "mesa"): a mesa vista de cima, a bandeja no centro
// e os materiais de verdade em volta (imagemTopo). A imagem antiga (3/4) segue como reserva.
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
    cena: { tipo: "mesa", fundo: "/minijogos/mesa.webp", bandeja: "/minijogos/topo-bandeja.webp" },
    alvos: [{ id: "bandeja", label: "Bandeja do curativo", imagem: "/minijogos/bandeja.webp", area: { x: 4, y: 4, w: 92, h: 92 } }],
    itens: [
      { id: "pacote-curativo", label: "Pacote de curativo estéril", imagem: "/minijogos/pacote-curativo.webp", imagemTopo: "/minijogos/topo-pacote-curativo.webp", alvoCorreto: "bandeja", explicacao: "O pacote traz o instrumental estéril (pinças) para o curativo." },
      { id: "sf09", label: "Soro fisiológico 0,9%", imagem: "/minijogos/sf09.webp", imagemTopo: "/minijogos/topo-sf09.webp", alvoCorreto: "bandeja", explicacao: "Limpa a ferida sem agredir o tecido." },
      { id: "gazes", label: "Gazes estéreis", imagem: "/minijogos/gazes.webp", imagemTopo: "/minijogos/topo-gazes.webp", alvoCorreto: "bandeja", explicacao: "Limpam e secam a pele ao redor sem contaminar." },
      { id: "luvas", label: "Luvas de procedimento", imagem: "/minijogos/luvas.webp", imagemTopo: "/minijogos/topo-luvas.webp", alvoCorreto: "bandeja", explicacao: "Protegem você e o paciente." },
      { id: "cobertura", label: "Cobertura ou fita", imagem: "/minijogos/cobertura.webp", imagemTopo: "/minijogos/topo-cobertura.webp", alvoCorreto: "bandeja", explicacao: "Fecha e protege a ferida depois do curativo." },
      { id: "saco-lixo", label: "Saco de lixo", imagem: "/minijogos/saco-lixo.webp", imagemTopo: "/minijogos/topo-saco-lixo.webp", alvoCorreto: "bandeja", explicacao: "O material usado é descartado já ao lado do paciente." },
      { id: "bisturi", label: "Lâmina de bisturi", imagem: "/minijogos/bisturi.webp", imagemTopo: "/minijogos/topo-bisturi.webp", alvoCorreto: null, explicacao: "Desbridamento cortante não faz parte do curativo simples e exige profissional habilitado." },
      { id: "seringa-insulina", label: "Seringa de insulina", imagem: "/minijogos/seringa-insulina.webp", imagemTopo: "/minijogos/topo-seringa-insulina.webp", alvoCorreto: null, explicacao: "É para aplicar insulina, não para o curativo." },
      { id: "garrote", label: "Garrote", imagem: "/minijogos/garrote.webp", imagemTopo: "/minijogos/topo-garrote.webp", alvoCorreto: null, explicacao: "Serve para punção venosa, não para curativo." },
      { id: "sonda-vesical", label: "Sonda vesical", imagem: "/minijogos/sonda-vesical.webp", imagemTopo: "/minijogos/topo-sonda-vesical.webp", alvoCorreto: null, explicacao: "É material de cateterismo, outro procedimento." },
      { id: "algodao-alcool", label: "Algodão com álcool para a ferida", imagem: "/minijogos/algodao-alcool.webp", imagemTopo: "/minijogos/topo-algodao-alcool.webp", alvoCorreto: null, explicacao: "O álcool agride o tecido da ferida e atrasa a cicatrização." },
    ],
  },
};
