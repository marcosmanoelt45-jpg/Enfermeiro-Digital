// Minijogo "Ausculta pulmonar" (tocar regiões). Caso de ICC: crepitações finas nas bases.
// Sem sons: nenhum áudio entra sem licença registrada em public/minijogos/LICENCAS.md (o dono escolhe os arquivos).
// O achado aparece em texto ("Som: ..."). Para ligar um som, preencha `audio` da região com o caminho do arquivo.
const focos = (vista, prefixo) => [
  { id: `${prefixo}-apice-d`, label: "Ápice direito", x: 36, y: 22, raio: 8, achado: "Som: murmúrio vesicular presente, sem ruídos adventícios." },
  { id: `${prefixo}-apice-e`, label: "Ápice esquerdo", x: 64, y: 22, raio: 8, achado: "Som: murmúrio vesicular presente, sem ruídos adventícios." },
  { id: `${prefixo}-medio-d`, label: "Campo médio direito", x: 34, y: 42, raio: 8, achado: "Som: murmúrio vesicular discretamente diminuído." },
  { id: `${prefixo}-medio-e`, label: "Campo médio esquerdo", x: 66, y: 42, raio: 8, achado: "Som: murmúrio vesicular discretamente diminuído." },
  { id: `${prefixo}-base-d`, label: "Base direita", x: 32, y: 62, raio: 8, achado: "Som: crepitações finas inspiratórias em base direita." },
  { id: `${prefixo}-base-e`, label: "Base esquerda", x: 68, y: 62, raio: 8, achado: "Som: crepitações finas inspiratórias em base esquerda." },
].map((r) => ({ ...r, vista }));

export default {
  id: "ausculta-pulmonar",
  versao: 1,
  tipo: "tocar-regiao",
  titulo: "Ausculta pulmonar",
  instrucao: "Toque nos 12 pontos do tórax, na frente e nas costas, e descubra o que o paciente apresenta.",
  categoria: "avaliacao",
  fonte: { titulo: "Semiologia respiratória: ausculta dos campos pulmonares" },
  // Preenche a lacuna "ausculta pulmonar" do Plantão ao concluir.
  achado: { campo: "ausculta_pulmonar", valor: "crepitações finas em bases", texto: "Ausculta pulmonar" },
  "tocar-regiao": {
    imagem: null, // sem imagem: o componente desenha um tórax esquemático
    vista: "anterior",
    objetivo: "explorar",
    regioes: [...focos("anterior", "ant"), ...focos("posterior", "post")],
  },
};
