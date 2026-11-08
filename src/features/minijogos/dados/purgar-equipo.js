// Minijogo "Preparar e purgar o equipo" (ordenar).
// O POP do HCPA não é público. A abertura segue o POP de administração de medicamentos do HUMAP/Ebserh
// (POP/DIEN/002/2016, v1.1): conferir a prescrição → higienizar as mãos → reunir o material → preencher o rótulo do
// soro (paciente, medicamento, dose, leito, via, gotejamento, hora e profissional) → preparar. O preenchimento do
// equipo (pinça fechada, câmara pela metade, retirar o ar) é a técnica usual; o manual do HUMAP não detalha.
export default {
  id: "purgar-equipo",
  versao: 2,
  tipo: "ordenar",
  titulo: "Ordene: preparar o soro e purgar o equipo",
  instrucao: "Coloque as etapas na ordem certa para o equipo ficar sem ar.",
  categoria: "medicacao",
  fonte: {
    titulo: "Manual de POP do Serviço de Enfermagem do HUMAP/Ebserh (POP/DIEN/002/2016) e técnica usual de preenchimento do equipo (o POP do HCPA não é público)",
    url: "https://biblioteca.cofen.gov.br/wp-content/uploads/2020/09/manual-procedimento-operacional-padrao-servico-enfermagem.pdf",
  },
  ordenar: {
    passos: [
      { id: "conferir", texto: "Conferir a prescrição, o soro e a validade (os certos da medicação)" },
      { id: "maos", texto: "Higienizar as mãos e reunir o material" },
      { id: "identificar", texto: "Preencher o rótulo do soro (paciente, solução, leito, via, gotejamento, hora e profissional)" },
      { id: "fechar", texto: "Fechar a pinça rolete do equipo" },
      { id: "conectar", texto: "Conectar o equipo ao frasco sem contaminar a ponta" },
      { id: "camara", texto: "Pendurar o frasco e encher metade da câmara de gotejamento" },
      { id: "abrir", texto: "Abrir a pinça devagar até o soro chegar à ponta, sem bolhas" },
      { id: "fechar2", texto: "Fechar a pinça e proteger a ponta do equipo" },
    ],
  },
};
