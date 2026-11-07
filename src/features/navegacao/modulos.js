// Registro único dos módulos do app. O cabeçalho, o menu de baixo, a gaveta "Casos" e a trilha do Hub
// leem daqui, e um módulo com a flag desligada some de todos esses lugares.
// JS puro (sem React): os ícones são referenciados pelo nome e resolvidos em `icones.js`.
import { flagAtiva } from "../flags.js";

// Rotas que existem hoje. Todo módulo novo registra a sua rota aqui.
export const ROTAS_CONHECIDAS = [
  "/",
  "/videochamada",
  "/procedimentos",
  "/montar-caso",
  "/simulador-casos",
  "/passagem-plantao",
  "/consulta",
  "/tecnicas",
  "/laboratorio-calculos",
  "/conta",
];

// Cada módulo tem uma rota e, opcionalmente, um lugar em cada superfície (header, dock, trilha).
// `flag: null` quer dizer que o módulo está sempre disponível.
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
    id: "videochamada",
    rota: "/videochamada",
    grupo: "pratica",
    flag: null,
    header: { rotulo: "Videochamada", icone: "PhoneCall", ordem: 20, novo: true },
    trilha: {
      titulo: "Atendimento por Voz (Videochamada)",
      subtitulo: "5 min · Paciente com Fala e Voz Neural",
      selo: "NOVO",
      destaque: true,
      icone: "Mic",
      ordem: 10,
    },
  },
  {
    id: "procedimentos",
    rota: "/procedimentos",
    grupo: "principal",
    flag: null,
    header: { rotulo: "Procedimentos", icone: "Video", ordem: 30 },
    // Com a flag "tecnicas" ligada, a aba Técnicas assume o lugar de Vídeos (mesma posição).
    dock: { rotulo: "Vídeos", icone: "Video", ordem: 40, ocultoComFlag: "tecnicas" },
    trilha: {
      titulo: "Videoteca de Procedimentos & POPs",
      subtitulo: "8 min · Vídeos + Checklists Operacionais",
      selo: "Checklists",
      icone: "Video",
      ordem: 40,
    },
  },
  {
    id: "montar",
    rota: "/montar-caso",
    grupo: "pratica",
    flag: null,
    header: { rotulo: "Montar Caso", icone: "PlusCircle", ordem: 40, briefingId: "montar" },
    trilha: {
      titulo: "Montador de Casos Clínicos",
      subtitulo: "Construção com Escores Braden e Áudio",
      selo: "Escores + Voz",
      icone: "PlusCircle",
      ordem: 50,
    },
  },
  {
    id: "casos",
    rota: "/simulador-casos",
    grupo: "pratica",
    flag: null,
    header: { rotulo: "Casos Clínicos", icone: "BookOpen", ordem: 50, briefingId: "casos" },
    dock: { rotulo: "Casos", icone: "ClipboardList", ordem: 20, gaveta: true },
  },
  {
    id: "sbar",
    rota: "/passagem-plantao",
    grupo: "pratica",
    flag: null,
    header: { rotulo: "Plantão SBAR", icone: "ArrowRightLeft", ordem: 60, briefingId: "sbar" },
    trilha: {
      titulo: "Passagem de Plantão SBAR",
      subtitulo: "8 min · Preceptoria IA Socrática",
      selo: "Preceptoria IA",
      icone: "ArrowRightLeft",
      ordem: 30,
    },
  },
  {
    id: "calculos",
    rota: "/laboratorio-calculos",
    grupo: "principal",
    flag: null,
    header: { rotulo: "Cálculo de Doses", icone: "Calculator", ordem: 70, briefingId: "calculos" },
    dock: { rotulo: "Doses", icone: "Calculator", ordem: 30 },
    trilha: {
      titulo: "Laboratório de Cálculo de Doses",
      subtitulo: "5 min · 4 Modos de Cálculos Clínicos",
      selo: "4 Modos",
      icone: "Calculator",
      ordem: 20,
    },
  },
  {
    id: "tecnicas",
    rota: "/tecnicas",
    grupo: "pratica",
    flag: "tecnicas",
    header: { rotulo: "Técnicas", icone: "Video", ordem: 35, novo: true },
    dock: { rotulo: "Técnicas", icone: "Video", ordem: 40 },
    trilha: {
      titulo: "Técnicas: minijogos, POPs e vídeos",
      subtitulo: "5 min · Pratique com as mãos",
      selo: "NOVO",
      icone: "Video",
      ordem: 45,
    },
  },
  {
    id: "consulta",
    rota: "/consulta",
    grupo: "pratica",
    flag: "consulta",
    header: { rotulo: "Consulta", icone: "Stethoscope", ordem: 55, novo: true },
    trilha: {
      titulo: "Consulta ao Vivo",
      subtitulo: "10 min · Converse com um paciente por voz ou texto",
      selo: "NOVO",
      icone: "Stethoscope",
      ordem: 15,
    },
  },
  {
    id: "perfil",
    rota: "/conta",
    grupo: "principal",
    flag: null,
    dock: { rotulo: "Perfil", icone: "User", ordem: 50 },
  },
];

// Opções da gaveta "Casos" do menu de baixo. `modulo` diz de qual módulo vem a flag.
export const GAVETA_PRATICA = [
  {
    id: "atendimento_voz",
    modulo: "videochamada",
    rota: "/videochamada",
    titulo: "Atendimento por voz",
    subtitulo: "Paciente simulado fala com você · 5 questões",
    selo: "NOVO",
    icone: "Mic",
    ordem: 10,
  },
  {
    id: "continue",
    modulo: "casos",
    rota: "/simulador-casos",
    titulo: "Continuar de onde parou",
    subtitulo: "Simulador · Idoso com Insuficiência Cardíaca Descompensada",
    icone: "Activity",
    ordem: 20,
  },
  {
    id: "pe_simulator",
    modulo: "casos",
    rota: "/simulador-casos",
    titulo: "Simulador de Casos Clínicos",
    subtitulo: "Processo de Enfermagem · 5 etapas",
    icone: "GraduationCap",
    ordem: 30,
  },
  {
    id: "case_studio",
    modulo: "montar",
    rota: "/montar-caso",
    titulo: "Montar Caso",
    subtitulo: "8 etapas · escores e voz",
    icone: "FileText",
    ordem: 40,
  },
  {
    id: "sbar_handoff",
    modulo: "sbar",
    rota: "/passagem-plantao",
    titulo: "Passagem de Plantão SBAR",
    subtitulo: "Meta 2 da OMS · 3 modos",
    icone: "ArrowRightLeft",
    ordem: 50,
  },
  {
    id: "semiology",
    modulo: "casos",
    rota: "/simulador-casos?mode=semiology",
    titulo: "Semiologia por Sistemas",
    subtitulo: "Neuro, Resp, Cardio e Pele",
    icone: "Stethoscope",
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
