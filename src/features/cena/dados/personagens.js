// C1. Personagens da Cena ao Vivo. Até a F8, marcus e teresinha usam os clipes antigos em
// public/pacientes/<id>/ (o arquivo "fala" vira a emoção "falando"). Os demais são placeholders sem clipe:
// o palco mostra o poster e anima o avatar.

/** @type {import('../tipos.js').Personagem[]} */
export const PERSONAGENS = [
  {
    id: "marcus",
    nome: "Sr. Marcus",
    papel: "paciente",
    faixa: "idoso",
    sexo: "M",
    voz: { voiceboxPerfil: "Marcus", navegador: { pitch: 0.72, rate: 0.9 } },
    clipes: ["falando", "acerto", "erro"],
    pasta: "/pacientes/marcus",
    arquivos: { falando: "fala" },
    poster: "/pacientes/marcus/poster.png",
  },
  {
    id: "teresinha",
    nome: "Dona Teresinha",
    papel: "paciente",
    faixa: "idoso",
    sexo: "F",
    voz: { voiceboxPerfil: "Teresinha", navegador: { pitch: 1.15, rate: 0.88 } },
    clipes: ["falando", "acerto", "erro"],
    pasta: "/pacientes/teresinha",
    arquivos: { falando: "fala" },
    poster: "/pacientes/teresinha/poster.png",
  },
  {
    id: "medico-rui",
    nome: "Dr. Rui",
    papel: "medico",
    faixa: "adulto",
    sexo: "M",
    voz: { voiceboxPerfil: "Rui", navegador: { pitch: 0.85, rate: 1 } },
    clipes: [],
    poster: "/personagens/medico-rui/poster.png",
  },
  {
    id: "enfermeira-ana",
    nome: "Enfermeira Ana",
    papel: "enfermeira",
    faixa: "adulto",
    sexo: "F",
    voz: { voiceboxPerfil: "Ana", navegador: { pitch: 1.1, rate: 1 } },
    clipes: ["parado", "falando", "pensando"],
    pasta: "/personagens/enfermeira-ana",
    poster: "/personagens/enfermeira-ana/poster.png",
  },
  {
    id: "goti",
    nome: "Goti",
    papel: "preceptor",
    faixa: "jovem",
    sexo: "M",
    voz: { voiceboxPerfil: "Goti", navegador: { pitch: 1.3, rate: 1.05 } },
    clipes: [],
    poster: "/goti/goti-pose-neutral.png",
  },
];

export function buscarPersonagem(id) {
  return PERSONAGENS.find((p) => p.id === id) ?? null;
}
