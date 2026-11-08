// Minijogo "Monte a bandeja do curativo simples" (arrastar, cena "mesa"): a mesa vista de cima, a bandeja no centro
// e os materiais de verdade em volta (imagemTopo). A cada rodada entram todos os itens corretos e 5 distratores
// sorteados do banco abaixo (arrastar.sorteio).
//
// Itens corretos = lista do HCPA, p. 21 do manual citado em `fonte`: "Conforme rotina estabelecida pelo HCPA por
// meio do procedimento operacional padrão (POP), o material a ser preparado para o procedimento inclui: pacote de
// curativo, gazes estéreis, gaze não aderente e não impregnada, frasco de soro fisiológico morno, o produto ou
// cobertura prescrita, adesivo microporoso hipoalergênico, saco de lixo branco, luvas de procedimento, agulha 40x12
// e álcool 70%." (cobertura e adesivo aparecem juntos num item só).
export default {
  id: "bandeja-curativo-simples",
  versao: 2,
  tipo: "arrastar",
  titulo: "Monte a bandeja do curativo simples",
  instrucao: "Coloque na bandeja só o que você usa num curativo simples. O resto fica de fora.",
  categoria: "curativos",
  fonte: {
    titulo: "HCPA: Avaliação e tratamento de feridas: orientações aos profissionais de saúde (Echer IC, org.), p. 21",
    url: "https://lume.ufrgs.br/bitstream/handle/10183/34755/000790228.pdf",
  },
  arrastar: {
    fundo: null,
    cena: { tipo: "mesa", fundo: "/minijogos/mesa.webp", bandeja: "/minijogos/topo-bandeja.webp" },
    sorteio: { distratores: 5 },
    alvos: [{ id: "bandeja", label: "Bandeja do curativo", imagem: "/minijogos/bandeja.webp", area: { x: 4, y: 4, w: 92, h: 92 } }],
    itens: [
      // ---- Corretos (lista do POP do HCPA) ----
      { id: "pacote-curativo", label: "Pacote de curativo", imagem: "/minijogos/pacote-curativo.webp", imagemTopo: "/minijogos/topo-pacote-curativo.webp", alvoCorreto: "bandeja", explicacao: "Traz as pinças estéreis do curativo." },
      { id: "sf09", label: "Frasco de soro fisiológico 0,9% (morno)", imagem: "/minijogos/topo-sf-bolsa.webp", imagemTopo: "/minijogos/topo-sf-bolsa.webp", alvoCorreto: "bandeja", explicacao: "Limpa a ferida em jato, morno, sem agredir o tecido." },
      { id: "gazes", label: "Gazes estéreis", imagem: "/minijogos/gazes.webp", imagemTopo: "/minijogos/topo-gazes.webp", alvoCorreto: "bandeja", explicacao: "Limpam a pele ao redor e cobrem a ferida." },
      { id: "gaze-nao-aderente", label: "Gaze não aderente", imagem: "/minijogos/topo-gaze-nao-aderente.webp", imagemTopo: "/minijogos/topo-gaze-nao-aderente.webp", alvoCorreto: "bandeja", explicacao: "Cobertura primária: não gruda no leito da ferida." },
      { id: "cobertura", label: "Cobertura prescrita e adesivo microporoso", imagem: "/minijogos/cobertura.webp", imagemTopo: "/minijogos/topo-cobertura.webp", alvoCorreto: "bandeja", explicacao: "A cobertura indicada e o adesivo hipoalergênico que a fixa." },
      { id: "saco-lixo", label: "Saco de lixo branco", imagem: "/minijogos/saco-lixo.webp", imagemTopo: "/minijogos/topo-saco-lixo.webp", alvoCorreto: "bandeja", explicacao: "Fica preso abaixo do material limpo para receber o curativo sujo." },
      { id: "luvas", label: "Luvas de procedimento", imagem: "/minijogos/luvas.webp", imagemTopo: "/minijogos/topo-luvas.webp", alvoCorreto: "bandeja", explicacao: "Precaução padrão, sobretudo com exsudato." },
      { id: "agulha-40x12", label: "Agulha 40x12", imagem: "/minijogos/topo-agulha-40x12.webp", imagemTopo: "/minijogos/topo-agulha-40x12.webp", alvoCorreto: "bandeja", explicacao: "Fura o frasco de soro para fazer o jato de limpeza." },
      { id: "alcool-70", label: "Álcool 70%", imagem: "/minijogos/topo-alcool-70.webp", imagemTopo: "/minijogos/topo-alcool-70.webp", alvoCorreto: "bandeja", explicacao: "Desinfeta o frasco de soro onde entra a agulha (nunca vai na ferida)." },
      // ---- Banco de distratores (5 sorteados por rodada) ----
      { id: "bisturi", label: "Lâmina de bisturi", imagem: "/minijogos/bisturi.webp", imagemTopo: "/minijogos/topo-bisturi.webp", alvoCorreto: null, explicacao: "Desbridamento cortante não faz parte do curativo simples e exige avaliação da enfermeira." },
      { id: "seringa-insulina", label: "Seringa de insulina", imagem: "/minijogos/seringa-insulina.webp", imagemTopo: "/minijogos/topo-seringa-insulina.webp", alvoCorreto: null, explicacao: "É para aplicar insulina, não para o curativo." },
      { id: "garrote", label: "Garrote", imagem: "/minijogos/garrote.webp", imagemTopo: "/minijogos/topo-garrote.webp", alvoCorreto: null, explicacao: "Serve para punção venosa." },
      { id: "sonda-vesical", label: "Sonda vesical", imagem: "/minijogos/sonda-vesical.webp", imagemTopo: "/minijogos/topo-sonda-vesical.webp", alvoCorreto: null, explicacao: "É material de cateterismo, outro procedimento." },
      { id: "algodao", label: "Algodão para limpar a ferida", imagem: "/minijogos/topo-algodao.webp", imagemTopo: "/minijogos/topo-algodao.webp", alvoCorreto: null, explicacao: "Algodão solta fiapos no leito da ferida; a limpeza é com gaze e soro." },
      { id: "termometro", label: "Termômetro", imagem: "/minijogos/topo-termometro.webp", imagemTopo: "/minijogos/topo-termometro.webp", alvoCorreto: null, explicacao: "Serve para sinais vitais, não para o curativo." },
      { id: "cateter-venoso", label: "Cateter venoso periférico", imagem: "/minijogos/topo-cateter-venoso.webp", imagemTopo: "/minijogos/topo-cateter-venoso.webp", alvoCorreto: null, explicacao: "É para punção venosa." },
      { id: "equipo", label: "Equipo de soro", imagem: "/minijogos/topo-equipo.webp", imagemTopo: "/minijogos/topo-equipo.webp", alvoCorreto: null, explicacao: "É para infusão venosa; a limpeza usa agulha no frasco." },
      { id: "coletor-urina", label: "Coletor de urina", imagem: "/minijogos/topo-coletor-urina.webp", imagemTopo: "/minijogos/topo-coletor-urina.webp", alvoCorreto: null, explicacao: "É para coleta de exame, outro procedimento." },
      { id: "ampola", label: "Ampola de medicamento", imagem: "/minijogos/topo-ampola.webp", imagemTopo: "/minijogos/topo-ampola.webp", alvoCorreto: null, explicacao: "Medicação não faz parte da bandeja do curativo." },
    ],
  },
};
