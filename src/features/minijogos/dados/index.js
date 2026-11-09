// Registro dos minijogos. Para criar um novo minijogo basta um arquivo em ./ e uma linha aqui.
//
// VITRINE x RESERVA (decisão do dono, 2026-11-08): a aba Técnicas mostra só os minijogos PRONTOS, interativos no
// nível da bandeja do curativo (cena com objetos de verdade, física, arrastar). Os demais (os estáticos abaixo e os
// "ordenar"/"escolher" gerados dos POPs e da semiologia) ficam guardados como RESERVA: nada foi apagado, eles seguem
// testados e o Plantão ainda usa alguns nas lacunas do prontuário. Para promover um, refaça no padrão da bandeja e
// ponha em MINIJOGOS_PRONTOS.
import bandeja from "./bandeja-curativo-simples.js";
import ausculta from "./ausculta-pulmonar.js";
import auscultaPov from "./ausculta-pulmonar-pov.js";
import contarFr from "./contar-fr.js";
import descarte from "./descarte-residuos.js";
import maos from "./higienizacao-maos.js";
import { paramentacao, desparamentacao } from "./paramentacao-epi.js";
import noveCertos from "./nove-certos.js";
import glicemia from "./glicemia-capilar.js";
import purgarEquipo from "./purgar-equipo.js";
import { flebite, lppEstagio1 } from "./situacoes-clinicas.js";
import { gerarTodosOsOrdenar } from "../logica/doProcedimento.js";
import { gerarTodosOsEscolher } from "../logica/daSemiologia.js";

// Os que aparecem na aba Técnicas.
export const MINIJOGOS_PRONTOS = [bandeja, auscultaPov];

export function catalogoPronto() {
  return { todos: MINIJOGOS_PRONTOS, porId: Object.fromEntries(MINIJOGOS_PRONTOS.map((m) => [m.id, m])) };
}

// Reserva (e Plantão): todos os estáticos feitos à mão.
export const MINIJOGOS_ESTATICOS = [bandeja, auscultaPov, ausculta, contarFr, maos, paramentacao, desparamentacao, descarte, noveCertos, glicemia, purgarEquipo, flebite, lppEstagio1];

// Catálogo completo da reserva. procedimentos = MASTER_PROCEDURES; semiologia = SEMIOLOGY_KNOWLEDGE_BASE
// (passados de fora: este arquivo fica puro).
export function montarCatalogo({ procedimentos = [], semiologia = {} } = {}) {
  const { jogos: ordenar, pulados } = gerarTodosOsOrdenar(procedimentos);
  const escolher = gerarTodosOsEscolher(semiologia);
  const todos = [...MINIJOGOS_ESTATICOS, ...ordenar, ...escolher];
  return { todos, pulados, porId: Object.fromEntries(todos.map((m) => [m.id, m])) };
}

export const ROTULOS_TIPO = { arrastar: "Arrastar", "tocar-regiao": "Tocar", ordenar: "Ordenar", medir: "Medir", escolher: "Escolher", ausculta: "Ausculta" };
export const ROTULOS_CATEGORIA = { curativos: "Curativos", avaliacao: "Avaliação", biosseguranca: "Biossegurança", medicacao: "Medicação", sinais_vitais: "Sinais vitais", procedimentos: "Procedimentos" };
