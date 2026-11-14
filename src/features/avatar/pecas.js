// Catálogo do avatar: cada categoria, suas opções e as cores. JS puro (as camadas ficam em public/avatar e a
// montagem em compor.js; cada opção aqui tem um arquivo <categoria>-<id> gerado por scripts/assets/montar-avatar.py).
// O avatar salvo é um objeto pequeno com as escolhas (ex.: { pele: 2, cabelo: "longo", ... }), guardado no
// perfil público (coluna avatar). Estilo tirado das artes do Flow (assets-brutos/flow/avatar): chapado,
// formas redondas, bochechas rosadas, pijama hospitalar com estampa, crachá e acessórios de cabeça divertidos.

// As cores novas entram sempre no fim da lista: o avatar salva o índice, então a ordem antiga não pode mudar.
export const PELES = [
  "#FFDCC8", "#FEC3A3", "#EAA67C", "#C98457", "#9A603E", "#6B412B",
  "#FFE9DC", "#F6CDB0", "#E3B48C", "#D49A6A", "#B5784C", "#83512F", "#55331F",
];
export const CORES_CABELO = [
  "#2A2230", "#4A2E2A", "#7A4A2A", "#B5552C", "#E0B05C", "#BDB6AF", "#E991B8", "#5E8FEA",
  "#16141A", "#5E3B22", "#9C5B2E", "#D9823B", "#F2D48A", "#F3EFEA", "#C2453D", "#9A6BD8", "#3FB5A0", "#F07C4A",
];
export const CORES_ROUPA = [
  "#A5B6EE", "#C3A6E6", "#7FCFC2", "#F3AFC8", "#F6C77E", "#93D38E", "#5B6B83", "#F08A7E",
  "#3E5C8A", "#5277D9", "#46B6C9", "#2F9C8C", "#5F8F5F", "#FFE08A", "#E25C5C", "#A23E5E", "#E4B8F2", "#B8C2CC", "#F2F4F7", "#353B48",
];
export const CORES_ACESSORIO = [
  "#C69E9C", "#F3A9BE", "#F7F1EA", "#3C3542", "#F2C14E", "#7CCBC0", "#A88BE0",
  "#E25C5C", "#F08A4B", "#93D38E", "#5277D9", "#A5B6EE", "#A23E5E", "#46B6C9", "#B8C2CC", "#8A5A3B",
];
export const CORES_MASCARA = [
  "#A9D3EE", "#F3B3C8", "#F7F7F5", "#3C3542", "#93D38E", "#C3A6E6", "#F6C77E", "#7FCFC2",
  "#3E5C8A", "#5277D9", "#E25C5C", "#A23E5E", "#F08A4B", "#B8C2CC", "#2F9C8C",
];
export const CORES_FUNDO = [
  "#BFEBD9", "#D9CCF5", "#FBD6C6", "#C6E0FB", "#FCE9A8", "#F8C9DA", "#2B4A5E", "#DDE6EC",
  "#FFD7A8", "#B9EBF2", "#D4F2C4", "#FFC4B8", "#E9DBFF", "#F3EBDD", "#FFFFFF", "#1E3347", "#3B2F4A", "#26403A",
];

// Cada opção: id (o que vai salvo) e rótulo (o que a pessoa lê).
export const CATEGORIAS = [
  {
    id: "rosto",
    rotulo: "Rosto",
    grupos: [
      { campo: "pele", rotulo: "Tom de pele", tipo: "cor", cores: PELES, basicas: 6 },
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
      { campo: "corCabelo", rotulo: "Cor", tipo: "cor", cores: CORES_CABELO, basicas: 8 },
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
    id: "mascara",
    rotulo: "Máscara",
    grupos: [
      { campo: "corMascara", rotulo: "Cor", tipo: "cor", cores: CORES_MASCARA, basicas: 8 },
      {
        campo: "mascara",
        rotulo: "Máscara",
        opcoes: [
          { id: "nenhuma", rotulo: "Sem máscara" },
          { id: "cirurgica", rotulo: "Cirúrgica" },
          { id: "comum", rotulo: "De tecido" },
        ],
      },
    ],
  },
  {
    id: "cabeca",
    rotulo: "Cabeça",
    grupos: [
      { campo: "corAcessorio", rotulo: "Cor", tipo: "cor", cores: CORES_ACESSORIO, basicas: 7 },
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
      { campo: "corRoupa", rotulo: "Cor do pijama", tipo: "cor", cores: CORES_ROUPA, basicas: 8 },
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
    grupos: [{ campo: "fundo", rotulo: "Cor de fundo", tipo: "cor", cores: CORES_FUNDO, basicas: 8 }],
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
  mascara: "nenhuma",
  corMascara: 0,
  corRoupa: 0,
  estampa: "confete",
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
  // o sorteio usa só as cores básicas: assim o avatar sorteado de quem não montou o seu não muda quando entram cores
  for (const g of CAMPOS) a[g.campo] = g.tipo === "cor" ? Math.floor(r() * (g.basicas ?? g.cores.length)) : de(g.opcoes).id;
  // sorteio mais "bonito": menos barba e óculos de proteção, e sem fundo escuro
  if (r() < 0.75) a.barba = "nenhuma";
  if (a.oculos === "protecao" && r() < 0.7) a.oculos = "nenhum";
  if (a.fundo === 6) a.fundo = 0;
  if (r() < 0.8) a.mascara = "nenhuma"; // sorteio: máscara só de vez em quando
  return normalizarAvatar(a);
}
