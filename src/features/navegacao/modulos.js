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
  "/minijogos",
  "/questoes",
  "/simulador-casos",
  "/conta",
  "/social",
];

// Cada módulo tem uma rota e, opcionalmente, um lugar em cada superfície (header, dock, trilha).
// `flag: null` quer dizer que o módulo está sempre disponível. Desenho final (D2 do plano Cenas ao Vivo):
// dock Início · Menu · Cálculo · Vídeos · Perfil; "Menu" abre a gaveta. Minijogos ficam só no Menu.
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
    header: { rotulo: "Vídeos", icone: "Video", ordem: 50, briefingId: "tecnicas" },
    dock: { rotulo: "Vídeos", icone: "Video", ordem: 40 },
    trilha: {
      titulo: "Vídeos e POPs",
      subtitulo: "Passo a passo com vídeo e checklist",
      selo: "POPs",
      icone: "Video",
      ordem: 40,
    },
  },
  {
    id: "minijogos",
    rota: "/minijogos",
    grupo: "pratica",
    flag: null,
    header: { rotulo: "Minijogos", icone: "Gamepad2", ordem: 52 },
    trilha: {
      titulo: "Minijogos",
      subtitulo: "Pratique com as mãos: bandeja, ausculta e mais",
      selo: "Jogos",
      icone: "Gamepad2",
      ordem: 42,
    },
  },
  {
    id: "questoes",
    rota: "/questoes",
    grupo: "pratica",
    flag: null,
    header: { rotulo: "Questões", icone: "ListChecks", ordem: 55 },
    trilha: {
      titulo: "Questões",
      subtitulo: "3 min · Curativo, medicamentos e punção, com 2 chances",
      selo: "Quiz",
      icone: "ListChecks",
      ordem: 45,
    },
  },
  {
    id: "casos",
    rota: "/simulador-casos",
    grupo: "pratica",
    flag: null,
    header: { rotulo: "Casos Clínicos", icone: "BookOpen", ordem: 60, briefingId: "casos" },
    dock: { rotulo: "Menu", icone: "Menu", ordem: 20, gaveta: true },
  },
  {
    // Amigos por convite, perfil dos amigos e pódio. Atrás da chave `social` até a migration 015 estar no ar.
    id: "social",
    rota: "/social",
    grupo: "principal",
    flag: "social",
    header: { rotulo: "Social", icone: "Trophy", ordem: 58 },
  },
  {
    id: "perfil",
    rota: "/conta",
    grupo: "principal",
    flag: null,
    dock: { rotulo: "Perfil", icone: "User", ordem: 50 },
  },
];

// Opções da gaveta "Menu" do menu de baixo. `modulo` diz de qual módulo vem a flag.
export const GAVETA_PRATICA = [
  {
    id: "consulta",
    modulo: "consulta",
    rota: "/consulta",
    titulo: "Consulta ao Vivo",
    subtitulo: "Converse com um paciente por voz ou texto",
    icone: "Stethoscope",
    ordem: 10,
  },
  {
    // Uma entrada só: ao tocar, a gaveta pergunta como a pessoa quer fazer o plantão.
    id: "plantao",
    modulo: "sbar",
    rota: "/passagem-plantao",
    titulo: "Plantão",
    subtitulo: "Com a enfermeira Ana ou por voz e preenchimento",
    icone: "ArrowRightLeft",
    ordem: 20,
    escolhas: [
      { id: "ana", rota: "/passagem-plantao", titulo: "Com a enfermeira Ana", subtitulo: "Ela pergunta e você responde por voz ou texto", icone: "ArrowRightLeft" },
      { id: "gravacao", rota: "/plantao/gravacao", titulo: "Por voz ou preenchimento", subtitulo: "Grave a passagem completa ou preencha o SBAR", icone: "Mic" },
    ],
  },
  {
    id: "questoes",
    modulo: "questoes",
    rota: "/questoes",
    titulo: "Questões",
    subtitulo: "Múltipla escolha com 2 chances",
    icone: "ListChecks",
    ordem: 25,
  },
  {
    id: "minijogos",
    modulo: "minijogos",
    rota: "/minijogos",
    titulo: "Minijogos",
    subtitulo: "Bandeja do curativo, ausculta e mais",
    icone: "Gamepad2",
    ordem: 28,
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
    id: "history",
    modulo: "casos",
    rota: "/simulador-casos?action=history",
    titulo: "Histórico e rascunhos",
    subtitulo: "Casos, plantões, consultas e cálculos",
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
