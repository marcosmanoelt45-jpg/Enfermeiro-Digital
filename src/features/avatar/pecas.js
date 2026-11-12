// Catálogo do avatar: cada categoria, suas opções e as cores. JS puro (o desenho fica em AvatarPessoa.jsx).
// O avatar salvo é um objeto pequeno com as escolhas (ex.: { pele: 2, cabelo: "longo", ... }), guardado no
// perfil público (coluna avatar). Estilo tirado das artes do Flow (assets-brutos/flow/avatar): chapado,
// formas redondas, bochechas rosadas, pijama hospitalar com estampa, crachá e acessórios de cabeça divertidos.

export const PELES = ["#F7D7BF", "#EFBF94", "#E0A274", "#C17F55", "#94593A", "#663D27"];
export const CORES_CABELO = ["#2A2230", "#4A2E22", "#7A4A2A", "#B5552C", "#E0B05C", "#BDB6AF", "#E991B8", "#5E8FEA"];
export const CORES_ROUPA = ["#B8A4E3", "#93A8EC", "#7CCBC0", "#F2A7C4", "#F6C77E", "#8FD18A", "#5B6B83", "#F08A7E"];
export const CORES_ACESSORIO = ["#E8A6B8", "#F7F1EA", "#3C3542", "#F2C14E", "#7CCBC0", "#A88BE0"];
export const CORES_FUNDO = ["#BFEBD9", "#D9CCF5", "#FBD6C6", "#C6E0FB", "#FCE9A8", "#F8C9DA", "#2B4A5E", "#DDE6EC"];

// Cada opção: id (o que vai salvo) e rótulo (o que a pessoa lê).
export const CATEGORIAS = [
  {
    id: "rosto",
    rotulo: "Rosto",
    grupos: [
      { campo: "pele", rotulo: "Tom de pele", tipo: "cor", cores: PELES },
      {
        campo: "olhos",
        rotulo: "Olhos",
        opcoes: [
          { id: "ponto", rotulo: "Simples" },
          { id: "cilios", rotulo: "Com cílios" },
          { id: "grandes", rotulo: "Brilhantes" },
          { id: "feliz", rotulo: "Sorrindo" },
          { id: "piscando", rotulo: "Piscando" },
          { id: "sono", rotulo: "Plantão noturno" },
        ],
      },
      {
        campo: "boca",
        rotulo: "Boca",
        opcoes: [
          { id: "sorriso", rotulo: "Sorriso" },
          { id: "aberta", rotulo: "Animada" },
          { id: "dentes", rotulo: "Sorrisão" },
          { id: "lingua", rotulo: "Língua" },
          { id: "neutra", rotulo: "Séria" },
          { id: "o", rotulo: "Surpresa" },
        ],
      },
    ],
  },
  {
    id: "cabelo",
    rotulo: "Cabelo",
    grupos: [
      { campo: "corCabelo", rotulo: "Cor", tipo: "cor", cores: CORES_CABELO },
      {
        campo: "cabelo",
        rotulo: "Corte",
        opcoes: [
          { id: "longo", rotulo: "Longo" },
          { id: "chanel", rotulo: "Chanel" },
          { id: "rabo", rotulo: "Rabo de cavalo" },
          { id: "coque", rotulo: "Coque" },
          { id: "cacheado", rotulo: "Cacheado" },
          { id: "curto", rotulo: "Curto" },
          { id: "topete", rotulo: "Topete" },
          { id: "raspado", rotulo: "Raspado" },
          { id: "careca", rotulo: "Sem cabelo" },
        ],
      },
    ],
  },
  {
    id: "barba",
    rotulo: "Barba",
    grupos: [
      {
        campo: "barba",
        rotulo: "Barba",
        opcoes: [
          { id: "nenhuma", rotulo: "Sem barba" },
          { id: "bigode", rotulo: "Bigode" },
          { id: "cavanhaque", rotulo: "Cavanhaque" },
          { id: "curta", rotulo: "Curta" },
          { id: "cheia", rotulo: "Cheia" },
        ],
      },
    ],
  },
  {
    id: "oculos",
    rotulo: "Óculos",
    grupos: [
      {
        campo: "oculos",
        rotulo: "Óculos",
        opcoes: [
          { id: "nenhum", rotulo: "Sem óculos" },
          { id: "redondo", rotulo: "Redondo" },
          { id: "quadrado", rotulo: "Quadrado" },
          { id: "gatinho", rotulo: "Gatinho" },
          { id: "protecao", rotulo: "De proteção" },
        ],
      },
    ],
  },
  {
    id: "cabeca",
    rotulo: "Cabeça",
    grupos: [
      { campo: "corAcessorio", rotulo: "Cor", tipo: "cor", cores: CORES_ACESSORIO },
      {
        campo: "cabeca",
        rotulo: "Acessório",
        opcoes: [
          { id: "nenhum", rotulo: "Nada" },
          { id: "gato", rotulo: "Orelhas de gato" },
          { id: "urso", rotulo: "Orelhas de urso" },
          { id: "coelho", rotulo: "Orelhas de coelho" },
          { id: "touca", rotulo: "Touca cirúrgica" },
          { id: "flores", rotulo: "Tiara de flores" },
          { id: "laco", rotulo: "Laço" },
          { id: "quepe", rotulo: "Quepe de enfermagem" },
          { id: "antenas", rotulo: "Anteninhas" },
        ],
      },
    ],
  },
  {
    id: "roupa",
    rotulo: "Roupa",
    grupos: [
      { campo: "corRoupa", rotulo: "Cor do pijama", tipo: "cor", cores: CORES_ROUPA },
      {
        campo: "estampa",
        rotulo: "Estampa",
        opcoes: [
          { id: "lisa", rotulo: "Lisa" },
          { id: "coracoes", rotulo: "Corações" },
          { id: "cruzes", rotulo: "Cruzinhas" },
          { id: "estrelas", rotulo: "Estrelas" },
          { id: "gotinhas", rotulo: "Gotinhas" },
          { id: "patinhas", rotulo: "Patinhas" },
          { id: "curativos", rotulo: "Curativos" },
          { id: "confete", rotulo: "Confete" },
          { id: "ecg", rotulo: "Batimentos" },
        ],
      },
      {
        campo: "jaleco",
        rotulo: "Por cima",
        opcoes: [
          { id: "nenhum", rotulo: "Só o pijama" },
          { id: "jaleco", rotulo: "Jaleco branco" },
          { id: "colete", rotulo: "Colete" },
        ],
      },
      {
        campo: "estetoscopio",
        rotulo: "No pescoço",
        opcoes: [
          { id: "nenhum", rotulo: "Nada" },
          { id: "estetoscopio", rotulo: "Estetoscópio" },
          { id: "cordao", rotulo: "Cordão do crachá" },
        ],
      },
    ],
  },
  {
    id: "cracha",
    rotulo: "Crachá",
    grupos: [
      {
        campo: "cracha",
        rotulo: "Crachá",
        opcoes: [
          { id: "nenhum", rotulo: "Sem crachá" },
          { id: "classico", rotulo: "Clássico" },
          { id: "goti", rotulo: "Do Goti" },
          { id: "estrela", rotulo: "Estrela" },
          { id: "coracao", rotulo: "Coração" },
          { id: "arcoiris", rotulo: "Arco-íris" },
        ],
      },
    ],
  },
  {
    id: "fundo",
    rotulo: "Fundo",
    grupos: [{ campo: "fundo", rotulo: "Cor de fundo", tipo: "cor", cores: CORES_FUNDO }],
  },
];

export const PADRAO = {
  pele: 1,
  olhos: "cilios",
  boca: "sorriso",
  cabelo: "longo",
  corCabelo: 1,
  barba: "nenhuma",
  oculos: "nenhum",
  cabeca: "gato",
  corAcessorio: 0,
  corRoupa: 0,
  estampa: "coracoes",
  jaleco: "nenhum",
  estetoscopio: "nenhum",
  cracha: "classico",
  fundo: 0,
};

const CAMPOS = CATEGORIAS.flatMap((c) => c.grupos);

/** Garante um avatar válido (campos que faltam ou estão errados voltam ao padrão). */
export function normalizarAvatar(a) {
  const out = { ...PADRAO };
  if (!a || typeof a !== "object") return out;
  for (const g of CAMPOS) {
    const v = a[g.campo];
    if (g.tipo === "cor") {
      if (Number.isInteger(v) && v >= 0 && v < g.cores.length) out[g.campo] = v;
    } else if (g.opcoes.some((o) => o.id === v)) out[g.campo] = v;
  }
  return out;
}

/** Avatar sorteado (para "Aleatório" e para quem ainda não montou o seu): semente opcional para ser estável. */
export function sortearAvatar(semente = null) {
  let s = semente == null ? Math.random() * 1e9 : [...String(semente)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const r = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  const de = (lista) => lista[Math.floor(r() * lista.length)];
  const a = {};
  for (const g of CAMPOS) a[g.campo] = g.tipo === "cor" ? Math.floor(r() * g.cores.length) : de(g.opcoes).id;
  // sorteio mais "bonito": menos barba e óculos de proteção, e sem fundo escuro
  if (r() < 0.75) a.barba = "nenhuma";
  if (a.oculos === "protecao" && r() < 0.7) a.oculos = "nenhum";
  if (a.fundo === 6) a.fundo = 0;
  return normalizarAvatar(a);
}
