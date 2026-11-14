// Dados do prontuário que o cenário do Plantão não guarda à parte: sexo (lido do texto de cada caso), alergias
// separadas do histórico e a idade do lactente (o cenário guarda age = 1 para "7 meses").

const SEXO = {
  pos_op: "M",
  icc: "M",
  delirium: "M",
  dpoc: "M",
  sepse_urinaria: "F",
  avc_isquemico: "M",
  iam_st: "M",
  trauma_cranio: "M",
  cetoacidose_pediatrica: "F",
  pre_eclampsia_grave: "F",
  pancreatite_aguda: "M",
  choque_anafilatico: "F",
  queimado_agudo: "M",
  politrauma_bacia: "M",
  hemorragia_digestiva: "M",
  tep_pos_op: "M",
  falciforme_toracica: "M",
  bronquiolite_lactente: "M",
  paliativos_terminal: "F",
  crise_tireotoxica: "F",
  srpa_colectomia: "M",
  caso2_apendicectomia_dm: "M",
};

const MESES = { bronquiolite_lactente: 7 };

const frases = (t = "") => t.split(/(?<=\.)\s+/).map((s) => s.trim()).filter(Boolean);
const fmt = (n) => String(n).replace(".", ",");

export function dadosDoProntuario(c) {
  const partes = frases(c.goldenSbar?.background);
  const sobreAlergia = partes.filter((s) => /alerg/i.test(s));
  const historico = partes.filter((s) => !/alerg/i.test(s)).join(" ");
  const meses = MESES[c.id];
  const v = c.vitals;
  return {
    sexo: SEXO[c.id] ?? "",
    idadeAnos: meses ? 0 : c.age,
    meses: meses ?? null,
    idadeTexto: meses ? `${meses} meses` : `${c.age} anos`,
    historico,
    alergias: sobreAlergia.length ? sobreAlergia.join(" ") : "Sem registro de alergias.",
    sinaisVitais: [
      ["PA", `${v.pa_sistolica}/${v.pa_diastolica} mmHg`],
      ["FC", `${v.fc} bpm`],
      ["FR", `${v.fr} irpm`],
      ["SatO₂", `${v.sat}%`],
      ["Tax", `${fmt(v.tax)} °C`],
    ],
  };
}

export function sexoDoCenario(id) {
  return SEXO[id] ?? "";
}
