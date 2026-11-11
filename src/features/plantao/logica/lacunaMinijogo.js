// Transforma uma lacuna do cenário em um minijogo do registro (C11), para o MinijogoRunner abrir numa folha.
// - lacuna com `minijogo`: usa o minijogo estático de mesmo id;
// - lacuna com `exame`: monta um minijogo "escolher" (4 opções, 1 correta) com o achado esperado.
import { validarDefinicao } from "../../minijogos/logica/validarDefinicao.js";
import { achadoDoTexto } from "../../minijogos/logica/ausculta.js";
import { dadosDaAusculta } from "../../minijogos/dados/ausculta-pulmonar-pov.js";
import { pistaDoExame } from "../dados/pistasExames.js";

export function minijogoDaLacuna(lacuna, cenarioId, estaticos = [], { paciente = "marcus" } = {}) {
  // Ausculta pulmonar: o minijogo em primeira pessoa, com o achado do caso (lido do valor esperado).
  if (/ausculta/i.test(`${lacuna.campo} ${lacuna.rotulo}`)) {
    return { ...dadosDaAusculta({ achado: achadoDoTexto(lacuna.valorEsperado), paciente, id: `plantao-${cenarioId}-ausculta`.toLowerCase().replace(/[^a-z0-9-]/g, "-") }), achado: { campo: lacuna.campo, valor: lacuna.valorEsperado, texto: lacuna.rotulo } };
  }
  if (lacuna.minijogo) return estaticos.find((m) => m.id === lacuna.minijogo) ?? null;
  if (!lacuna.exame) return null;
  const def = {
    id: `plantao-${cenarioId}-${lacuna.campo}`.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    versao: 1,
    tipo: "escolher",
    titulo: lacuna.rotulo,
    instrucao: "Examine o paciente e escolha o achado correto.",
    categoria: "avaliacao",
    fonte: { titulo: "Exame físico à beira-leito" },
    achado: { campo: lacuna.campo, valor: lacuna.valorEsperado, texto: lacuna.rotulo },
    escolher: {
      pergunta: lacuna.exame.pergunta,
      // O que o aluno vê ao examinar (imagem, monitor, medidas, observações): sem isso não há de onde tirar a resposta.
      pista: pistaDoExame(cenarioId, lacuna.campo),
      opcoes: lacuna.exame.opcoes.map((o, i) => ({ id: `o${i + 1}`, texto: o.texto, correta: o.correta, feedback: o.feedback })),
    },
  };
  return validarDefinicao(def).length ? null : def;
}
