// Minijogo "Descarte certo" (arrastar com 4 destinos). Grupos da RDC ANVISA nº 222/2018.
export default {
  id: "descarte-residuos",
  versao: 1,
  tipo: "arrastar",
  titulo: "Descarte certo dos resíduos",
  instrucao: "Arraste cada resíduo para o recipiente certo.",
  categoria: "biosseguranca",
  fonte: { titulo: "RDC ANVISA nº 222/2018: grupos A4, D e E (Anexo I); o PGRSS do HCPA não é público", url: "https://bvsms.saude.gov.br/bvs/saudelegis/anvisa/2018/rdc0222_28_03_2018.pdf" },
  arrastar: {
    fundo: null,
    alvos: [
      { id: "perfuro", label: "Caixa de perfurocortante (grupo E)", imagem: "/minijogos/perfuro.webp", area: { x: 2, y: 2, w: 47, h: 47 } },
      { id: "infectante", label: "Saco branco leitoso (infectante, grupo A)", imagem: "/minijogos/infectante.webp", area: { x: 51, y: 2, w: 47, h: 47 } },
      { id: "comum", label: "Lixo comum (grupo D)", imagem: "/minijogos/comum.webp", area: { x: 2, y: 51, w: 47, h: 47 } },
      { id: "reciclavel", label: "Reciclável (grupo D)", imagem: "/minijogos/reciclavel.webp", area: { x: 51, y: 51, w: 47, h: 47 } },
    ],
    itens: [
      { id: "agulha", label: "Agulha usada", imagem: "/minijogos/agulha.webp", alvoCorreto: "perfuro", explicacao: "Agulha vai direto na caixa rígida de perfurocortante, sem reencapar." },
      { id: "lanceta", label: "Lanceta da glicemia", imagem: "/minijogos/lanceta.webp", alvoCorreto: "perfuro", explicacao: "Lanceta perfura: caixa de perfurocortante." },
      { id: "ampola", label: "Ampola de vidro quebrada", imagem: "/minijogos/ampola.webp", alvoCorreto: "perfuro", explicacao: "Vidro quebrado corta: também é perfurocortante." },
      { id: "gaze-sangue", label: "Gaze com sangue", imagem: "/minijogos/gaze-sangue.webp", alvoCorreto: "infectante", explicacao: "Material com sangue ou secreção é infectante: saco branco leitoso." },
      { id: "luva-usada", label: "Luva usada no curativo", imagem: "/minijogos/luva-usada.webp", alvoCorreto: "infectante", explicacao: "Teve contato com secreção da ferida: saco branco leitoso (grupo A4). Luva sem contato com sangue ou secreção iria no lixo comum." },
      { id: "papel-toalha", label: "Papel-toalha da higiene das mãos", imagem: "/minijogos/papel-toalha.webp", alvoCorreto: "comum", explicacao: "Sem contato com material biológico: lixo comum." },
      { id: "copo-cafe", label: "Copo de café", imagem: "/minijogos/copo-cafe.webp", alvoCorreto: "comum", explicacao: "Resíduo comum, como o de casa." },
      { id: "embalagem-seringa", label: "Embalagem de papel da seringa (limpa)", imagem: "/minijogos/embalagem-seringa.webp", alvoCorreto: "reciclavel", explicacao: "Embalagem limpa, sem contato com o paciente, pode ser reciclada." },
    ],
  },
};
