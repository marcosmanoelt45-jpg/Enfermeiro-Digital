// Minijogo "Descarte certo" (arrastar com 4 destinos). Grupos da RDC ANVISA nº 222/2018.
export default {
  id: "descarte-residuos",
  versao: 1,
  tipo: "arrastar",
  titulo: "Descarte certo dos resíduos",
  instrucao: "Arraste cada resíduo para o recipiente certo.",
  categoria: "biosseguranca",
  fonte: { titulo: "RDC ANVISA nº 222/2018 (gerenciamento de resíduos de serviços de saúde)" },
  arrastar: {
    fundo: null,
    alvos: [
      { id: "perfuro", label: "Caixa de perfurocortante (grupo E)", imagem: null, area: { x: 2, y: 2, w: 47, h: 47 } },
      { id: "infectante", label: "Saco branco leitoso (infectante, grupo A)", imagem: null, area: { x: 51, y: 2, w: 47, h: 47 } },
      { id: "comum", label: "Lixo comum (grupo D)", imagem: null, area: { x: 2, y: 51, w: 47, h: 47 } },
      { id: "reciclavel", label: "Reciclável (grupo D)", imagem: null, area: { x: 51, y: 51, w: 47, h: 47 } },
    ],
    itens: [
      { id: "agulha", label: "Agulha usada", imagem: null, alvoCorreto: "perfuro", explicacao: "Agulha vai direto na caixa rígida de perfurocortante, sem reencapar." },
      { id: "lanceta", label: "Lanceta da glicemia", imagem: null, alvoCorreto: "perfuro", explicacao: "Lanceta perfura: caixa de perfurocortante." },
      { id: "ampola", label: "Ampola de vidro quebrada", imagem: null, alvoCorreto: "perfuro", explicacao: "Vidro quebrado corta: também é perfurocortante." },
      { id: "gaze-sangue", label: "Gaze com sangue", imagem: null, alvoCorreto: "infectante", explicacao: "Material com sangue ou secreção é infectante: saco branco leitoso." },
      { id: "luva-usada", label: "Luva usada no curativo", imagem: null, alvoCorreto: "infectante", explicacao: "Teve contato com a ferida: infectante." },
      { id: "papel-toalha", label: "Papel-toalha da higiene das mãos", imagem: null, alvoCorreto: "comum", explicacao: "Sem contato com material biológico: lixo comum." },
      { id: "copo-cafe", label: "Copo de café", imagem: null, alvoCorreto: "comum", explicacao: "Resíduo comum, como o de casa." },
      { id: "embalagem-seringa", label: "Embalagem de papel da seringa (limpa)", imagem: null, alvoCorreto: "reciclavel", explicacao: "Embalagem limpa, sem contato com o paciente, pode ser reciclada." },
    ],
  },
};
