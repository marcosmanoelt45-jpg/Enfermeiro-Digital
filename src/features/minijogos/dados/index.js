// Registro dos minijogos. Para criar um novo minijogo basta um arquivo em ./ e uma linha aqui.
// Os minijogos de "ordenar" (um por procedimento com 4+ passos) e de "escolher" (um por achado de semiologia)
// são gerados dos dados que já existem e entram na mesma lista.
import bandeja from "./bandeja-curativo-simples.js";
import ausculta from "./ausculta-pulmonar.js";
import contarFr from "./contar-fr.js";
import { gerarTodosOsOrdenar } from "../logica/doProcedimento.js";
import { gerarTodosOsEscolher } from "../logica/daSemiologia.js";

export const MINIJOGOS_ESTATICOS = [bandeja, ausculta, contarFr];

// procedimentos = MASTER_PROCEDURES; semiologia = SEMIOLOGY_KNOWLEDGE_BASE (passados de fora: este arquivo fica puro).
export function montarCatalogo({ procedimentos = [], semiologia = {} } = {}) {
  const { jogos: ordenar, pulados } = gerarTodosOsOrdenar(procedimentos);
  const escolher = gerarTodosOsEscolher(semiologia);
  const todos = [...MINIJOGOS_ESTATICOS, ...ordenar, ...escolher];
  return { todos, pulados, porId: Object.fromEntries(todos.map((m) => [m.id, m])) };
}

export const ROTULOS_TIPO = { arrastar: "Arrastar", "tocar-regiao": "Tocar", ordenar: "Ordenar", medir: "Medir", escolher: "Escolher" };
export const ROTULOS_CATEGORIA = { curativos: "Curativos", avaliacao: "Avaliação", biosseguranca: "Biossegurança", medicacao: "Medicação", sinais_vitais: "Sinais vitais", procedimentos: "Procedimentos" };
