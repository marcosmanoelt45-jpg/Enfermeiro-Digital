// Faixas de referência dos sinais vitais por idade, para o prontuário marcar o que está fora do normal.
// Referências usuais de enfermagem (adulto em repouso; criança e lactente pelas faixas pediátricas mais usadas).
// É apoio de leitura: quem decide é o raciocínio clínico do aluno sobre o caso.

const FAIXAS = {
  lactente: { fc: [100, 160], fr: [30, 60], pas: [70, 100], pad: [35, 65], sat: [95, 100], tax: [36, 37.5] },
  crianca: { fc: [70, 120], fr: [18, 30], pas: [85, 115], pad: [50, 75], sat: [95, 100], tax: [36, 37.5] },
  adulto: { fc: [60, 100], fr: [12, 20], pas: [90, 139], pad: [60, 89], sat: [95, 100], tax: [35.5, 37.7] },
};

export function faixaPorIdade(idadeAnos, meses = null) {
  if (meses != null && meses < 12) return "lactente";
  if (idadeAnos != null && idadeAnos < 1) return "lactente";
  if (idadeAnos != null && idadeAnos < 12) return "crianca";
  return "adulto";
}

const fmt = (n) => String(n).replace(".", ",");
const estado = (valor, [min, max]) => (valor == null || Number.isNaN(Number(valor)) ? null : valor < min ? "baixo" : valor > max ? "alto" : null);
const pior = (a, b) => a ?? b;

/**
 * Linhas do prontuário a partir dos sinais vitais do caso: [rótulo, valor, referência, estado].
 * `v` = { pa_sistolica, pa_diastolica, fc, fr, sat, tax }. Estado: "alto" | "baixo" | null.
 */
export function linhasSinaisVitais(v, idadeAnos, meses = null) {
  if (!v) return [];
  const f = FAIXAS[faixaPorIdade(idadeAnos, meses)];
  return [
    ["PA", `${v.pa_sistolica}/${v.pa_diastolica} mmHg`, `${f.pas[0]}-${f.pas[1]}/${f.pad[0]}-${f.pad[1]}`, pior(estado(v.pa_sistolica, f.pas), estado(v.pa_diastolica, f.pad))],
    ["FC", `${v.fc} bpm`, `${f.fc[0]}-${f.fc[1]}`, estado(v.fc, f.fc)],
    ["FR", `${v.fr} irpm`, `${f.fr[0]}-${f.fr[1]}`, estado(v.fr, f.fr)],
    ["SatO₂", `${v.sat}%`, `≥ ${f.sat[0]}%`, estado(v.sat, f.sat)],
    ["Tax", `${fmt(v.tax)} °C`, `${fmt(f.tax[0])}-${fmt(f.tax[1])}`, estado(v.tax, f.tax)],
  ];
}
