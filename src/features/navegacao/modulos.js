// Registro único dos módulos do app. O cabeçalho, o menu de baixo, a gaveta "Casos" e a trilha do Hub
// leem daqui, e um módulo com a flag desligada some de todos esses lugares.
// JS puro (sem React): os ícones são referenciados pelo nome e resolvidos em `icones.js`.
import { flagAtiva } from "../flags.js";

// Rotas que os menus usam. Todo módulo registra a sua rota aqui.
export const ROTAS_CONHECIDAS = [
  "/",
  "/consulta",
  "/passagem-plantao",
  "/plantao/gravacao",
  "/laboratorio-calculos",
  "/tecnicas",
  "/simulador-casos",
  "/conta",
];

// Cada módulo tem uma rota e, opcionalmente, um lugar em cada superfície (header, dock, trilha).
// `flag: null` quer dizer que o módulo está sempre disponível. Desenho final (D2 do plano Cenas ao Vivo):
// dock Início · Prática · Cálculo · Técnicas · Perfil; "Prática" abre a gaveta.
export const MODULOS = [
  {
    id: "hub",
    rota: "/",
    grupo: "principal",
    flag: null,
    header: { rotulo: "Início", icone: "LayoutGrid", ordem: 10 },
    dock: { rotulo: "Início", icone: "Home", ordem: 10, exato: true },
  },
  {
    id: "consulta",
    rota: "/consulta",
    grupo: "pratica",
    flag: null,
    header: { rotulo: "Consulta ao Vivo", icone: "Stethoscope", ordem: 20, briefingId: "consulta" },
    trilha: {
      titulo: "Consulta ao Vivo",
      subtitulo: "10 min · Converse com um paciente por voz ou texto",
      selo: "Voz",
      destaque: true,
      icone: "Stethoscope",
      ordem: 10,
    },
  },
  {
    id: "sbar",
    rota: "/passagem-plantao",
    grupo: "pratica",
    flag: null,
    header: { rotulo: "Plantão", icone: "ArrowRightLeft", ordem: 30, briefingId: "sbar" },
    trilha: {
      titulo: "Plantão ao Vivo",
      subtitulo: "8 min · Receba a passagem SBAR da enfermeira Ana",
      selo: "SBAR",
      icone: "ArrowRightLeft",
      ordem: 20,
    },
  },
  {
    id: "calculos",
    rota: "/laboratorio-calculos",
    grupo: "principal",
    flag: null,
    header: { rotulo: "Cálculo", icone: "Calculator", ordem: 40, briefingId: "calculos" },
    dock: { rotulo: "Cálculo", icone: "Calculator", ordem: 30 },
    trilha: {
      titulo: "Cálculo com o Dr. Rui",
      subtitulo: "5 min · Gotejamento, diluição e BIC",
      selo: "Doses",
      icone: "Calculator",
      ordem: 30,
    },
  },
  {
    id: "tecnicas",
    rota: "/tecnicas",
    grupo: "principal",
    flag: null,
    header: { rotulo: "Técnicas", icone: "Video", ordem: 50, briefingId: "tecnicas" },
    dock: { rotulo: "Técnicas", icone: "Video", ordem: 40 },
    trilha: {
      titulo: "Técnicas: minijogos e POPs",
      subtitulo: "5 min · Pratique com as mãos",
      selo: "Minijogos",
      icone: "Video",
      ordem: 40,
    },
  },
  {
    id: "casos",
    rota: "/simulador-casos",
    grupo: "pratica",
    flag: null,
    header: { rotulo: "Casos Clínicos", icone: "BookOpen", ordem: 60, briefingId: "casos" },
    dock: { rotulo: "Prática", icone: "ClipboardList", ordem: 20, gaveta: true },
  },
  {
    id: "perfil",
    rota: "/conta",
    grupo: "principal",
    flag: null,
    dock: { rotulo: "Perfil", icone: "User", ordem: 50 },
  },
];

// Opções da gaveta "Prática" do menu de baixo. `modulo` diz de qual módulo vem a flag.
export const GAVETA_PRATICA = [
  {
    id: "consulta",
    modulo: "consulta",
    rota: "/consulta",
    titulo: "Consulta ao Vivo",
    subtitulo: "Converse com um paciente por voz ou texto",
    selo: "Voz",
    icone: "Stethoscope",
    ordem: 10,
  },
  {
    id: "plantao",
    modulo: "sbar",
    rota: "/passagem-plantao",
    titulo: "Plantão ao Vivo",
    subtitulo: "Passagem SBAR com a enfermeira Ana",
    icone: "ArrowRightLeft",
    ordem: 20,
  },
  {
    id: "pe_simulator",
    modulo: "casos",
    rota: "/simulador-casos",
    titulo: "Casos Clínicos",
    subtitulo: "Processo de Enfermagem · 5 etapas",
    icone: "GraduationCap",
    ordem: 30,
  },
  {
    id: "continue",
    modulo: "casos",
    rota: "/simulador-casos?action=continue",
    titulo: "Continuar de onde parou",
    subtitulo: "Retome seu último caso clínico",
    icone: "Activity",
    ordem: 40,
  },
  {
    id: "semiology",
    modulo: "casos",
    rota: "/simulador-casos?mode=semiology",
    titulo: "Semiologia por Sistemas",
    subtitulo: "Neuro, Resp, Cardio e Pele",
    icone: "Stethoscope",
    ordem: 50,
  },
  {
    id: "gravacao",
    modulo: "sbar",
    rota: "/plantao/gravacao",
    titulo: "Plantão · Modo gravação",
    subtitulo: "Grave a passagem completa ou faça a simulação rápida",
    icone: "Mic",
    ordem: 60,
  },
  {
    id: "history",
    modulo: "casos",
    rota: "/simulador-casos?action=history",
    titulo: "Histórico e rascunhos",
    subtitulo: "Casos, SBAR e cálculos",
    icone: "History",
    ordem: 70,
  },
];

const visivel = (modulo, ativa) => !modulo.flag || ativa(modulo.flag);
const porOrdem = (a, b) => a.ordem - b.ordem;

// Itens da barra de navegação do computador, na ordem de hoje.
export function modulosDoHeader(ativa = flagAtiva, modulos = MODULOS) {
  return modulos
    .filter((m) => m.header && visivel(m, ativa))
    .map((m) => ({
      id: m.id,
      rotulo: m.header.rotulo,
      rota: m.rota,
      icone: m.header.icone,
      briefingId: m.header.briefingId ?? null,
      novo: Boolean(m.header.novo),
      ordem: m.header.ordem,
    }))
    .sort(porOrdem);
}

// Abas do menu de baixo. `gaveta: true` marca a aba que abre a gaveta em vez de navegar.
export function itensDoDock(ativa = flagAtiva, modulos = MODULOS) {
  return modulos
    .filter((m) => m.dock && visivel(m, ativa) && !(m.dock.ocultoComFlag && ativa(m.dock.ocultoComFlag)))
    .map((m) => ({
      id: m.id,
      rotulo: m.dock.rotulo,
      rota: m.rota,
      icone: m.dock.icone,
      exato: Boolean(m.dock.exato),
      gaveta: Boolean(m.dock.gaveta),
      ordem: m.dock.ordem,
    }))
    .sort(porOrdem);
}

// Opções da gaveta "Casos": somem quando o módulo de origem está com a flag desligada.
export function opcoesDaGavetaPratica(ativa = flagAtiva, modulos = MODULOS, opcoes = GAVETA_PRATICA) {
  const porId = new Map(modulos.map((m) => [m.id, m]));
  return opcoes
    .filter((o) => {
      const modulo = porId.get(o.modulo);
      return modulo ? visivel(modulo, ativa) : false;
    })
    .map((o) => ({ ...o }))
    .sort(porOrdem);
}

// Cartões "Sugestões de hoje" da trilha do Hub.
export function modulosDaTrilha(ativa = flagAtiva, modulos = MODULOS) {
  return modulos
    .filter((m) => m.trilha && visivel(m, ativa))
    .map((m) => ({
      id: m.id,
      rota: m.rota,
      titulo: m.trilha.titulo,
      subtitulo: m.trilha.subtitulo,
      selo: m.trilha.selo,
      destaque: Boolean(m.trilha.destaque),
      icone: m.trilha.icone,
      ordem: m.trilha.ordem,
    }))
    .sort(porOrdem);
}
