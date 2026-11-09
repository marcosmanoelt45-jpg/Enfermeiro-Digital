// Minijogo "Ausculta pulmonar" (primeira pessoa): o paciente sentado na maca, a mão com o estetoscópio e os focos
// na sequência da aula de exame físico do tórax (frente e costas, comparando direita e esquerda).
// O POP de exame físico do HCPA não é público: a referência é o livro usado na aula (Barros et al.).
// Fora da aba Técnicas, o Plantão e a Consulta abrem uma cópia com o achado do caso (ver dadosDaAusculta).
export default {
  id: "ausculta-pulmonar-pov",
  versao: 1,
  tipo: "ausculta",
  titulo: "Ausculte os pulmões",
  instrucao: "Mova o estetoscópio e segure em cada foco, na ordem. Perto do ponto certo o som fica nítido. No fim, diga o que ouviu.",
  categoria: "avaliacao",
  fonte: {
    titulo: "Barros, E. et al. Anamnese e exame físico: avaliação diagnóstica de enfermagem no adulto (focos de ausculta e ruídos adventícios, como na aula de exame físico do tórax). O POP do HCPA não é público.",
  },
  ausculta: { achado: "aleatorio", vistas: ["frente", "costas"] },
};

// Cópia do minijogo para um caso (Plantão ou Consulta): achado tirado do texto do caso e só as costas.
export function dadosDaAusculta({ achado, paciente, id = "ausculta-caso", vistas = ["costas"] }) {
  return {
    id,
    versao: 1,
    tipo: "ausculta",
    titulo: "Ausculta pulmonar",
    instrucao: "Ausculte as costas do paciente na ordem dos focos e diga o que ouviu.",
    categoria: "avaliacao",
    fonte: { titulo: "Barros, E. et al. Anamnese e exame físico (focos de ausculta pulmonar)." },
    ausculta: { achado, paciente, vistas },
  };
}
