// Minijogo "Glicemia capilar" (ordenar).
// O POP do HCPA não é público; a ordem segue o POP.HC-UFTM-DENF.010 v5 (Ebserh, 2025), itens 1 a 23 da seção 8:
// explicar ao paciente → higienizar as mãos → reunir o material → luvas → tira no glicosímetro → antissepsia com
// álcool 70% e esperar evaporar → punção → desprezar a lanceta → encostar a tira na gota → comprimir com algodão
// seco → ler, informar e anotar.
export default {
  id: "glicemia-capilar",
  versao: 2,
  tipo: "ordenar",
  titulo: "Ordene: verificação da glicemia capilar",
  instrucao: "Coloque as etapas da glicemia capilar na ordem certa.",
  categoria: "sinais_vitais",
  fonte: {
    titulo: "POP.HC-UFTM-DENF.010 v5 (Ebserh, 2025): coleta de amostra de sangue capilar (o POP do HCPA não é público)",
    url: "https://www.gov.br/hubrasil/pt-br/hospitais-universitarios/regiao-sudeste/hc-uftm/documentos/procedimentos-e-rotinas-operacionais-padrao/pops/pop-hc-uftm-denf-010-coleta-de-amostra-de-sangue-capilar-versao-5.pdf",
  },
  ordenar: {
    passos: [
      { id: "orientar", texto: "Explicar o procedimento ao paciente e obter o consentimento" },
      { id: "maos", texto: "Higienizar as mãos e reunir o material" },
      { id: "luvas", texto: "Calçar as luvas de procedimento" },
      { id: "fita", texto: "Colocar a tira reagente no glicosímetro" },
      { id: "limpar", texto: "Fazer a antissepsia da lateral da polpa digital com álcool 70% e esperar secar" },
      { id: "puncionar", texto: "Puncionar a lateral do dedo com a lanceta" },
      { id: "descartar", texto: "Desprezar a lanceta (depois vai para a caixa de perfurocortante)" },
      { id: "gota", texto: "Encostar a tira na gota de sangue até absorver" },
      { id: "comprimir", texto: "Comprimir o local com algodão seco" },
      { id: "registrar", texto: "Ler o resultado, informar o paciente e registrar" },
    ],
  },
};
