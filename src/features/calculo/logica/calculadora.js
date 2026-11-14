// Calculadora livre do Cálculo: a pessoa digita os dados e recebe o resultado com as etapas da conta.
// Cada função devolve { ok: true, resultado, unidade, etapas: [texto], extra? } ou { ok: false, erro }.
// JS puro (testado em calculadora.test.mjs). Números com vírgula ("2,5") também valem.

export const num = (v) => {
  if (typeof v === "number") return v;
  let s = String(v ?? "").trim().replace(/\s/g, "");
  // "1.000" e "25.000" (milhar no padrão brasileiro) ou "1.000,5": ponto é milhar; "1.5" continua decimal
  if (s.includes(",") || /^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  const n = s === "" ? NaN : Number(s);
  return Number.isFinite(n) ? n : NaN;
};
const br = (n, casas = 2) => Number(n).toLocaleString("pt-BR", { maximumFractionDigits: casas });
const falta = (...valores) => valores.some((v) => !Number.isFinite(v) || v <= 0);
const ERRO = { ok: false, erro: "Preencha todos os campos com números maiores que zero." };

/** Gotejamento: volume (mL) em tempo (h ou min) -> gotas/min (macro: 20 gts/mL) ou microgotas/min (60), e mL/h. */
export function gotejamento({ volume, tempo, unidadeTempo = "h", equipo = "macro" }) {
  const v = num(volume);
  const t = num(tempo);
  if (falta(v, t)) return ERRO;
  const horas = unidadeTempo === "min" ? t / 60 : t;
  const mlh = v / horas;
  if (equipo === "micro") {
    const r = v / horas;
    return {
      ok: true,
      resultado: Math.round(r),
      unidade: "microgotas/min",
      etapas: [
        unidadeTempo === "min" ? `${br(t)} min = ${br(horas, 3)} h` : null,
        `Microgotas/min = volume ÷ horas`,
        `${br(v)} ÷ ${br(horas, 3)} = ${br(r)}`,
        `Arredonda: ${Math.round(r)} microgotas/min`,
      ].filter(Boolean),
      extra: `Vazão: ${br(mlh)} mL/h`,
    };
  }
  const r = unidadeTempo === "min" ? (v * 20) / t : v / (horas * 3);
  return {
    ok: true,
    resultado: Math.round(r),
    unidade: "gotas/min",
    etapas:
      unidadeTempo === "min"
        ? ["Gotas/min = (volume × 20) ÷ minutos", `(${br(v)} × 20) ÷ ${br(t)} = ${br(r)}`, `Arredonda: ${Math.round(r)} gotas/min`]
        : ["Gotas/min = volume ÷ (horas × 3)", `${br(v)} ÷ (${br(horas)} × 3) = ${br(v)} ÷ ${br(horas * 3)} = ${br(r)}`, `Arredonda: ${Math.round(r)} gotas/min`],
    extra: `Vazão: ${br(mlh)} mL/h`,
  };
}

/** Volume a aspirar (regra de três): dose prescrita, quanto tem no frasco e em quantos mL. */
export function doseVolume({ prescrito, disponivel, volumeDisponivel }) {
  const p = num(prescrito);
  const d = num(disponivel);
  const vd = num(volumeDisponivel);
  if (falta(p, d, vd)) return ERRO;
  const r = (p * vd) / d;
  return {
    ok: true,
    resultado: Math.round(r * 100) / 100,
    unidade: "mL",
    etapas: [`${br(d)} está para ${br(vd)} mL, assim como ${br(p)} está para X`, `X = (${br(p)} × ${br(vd)}) ÷ ${br(d)}`, `X = ${br(p * vd)} ÷ ${br(d)} = ${br(r)} mL`],
  };
}

/** Dose por peso: dose/kg × peso. Com `vezesAoDia`, também a dose de cada tomada. */
export function dosePorPeso({ dosePorKg, peso, vezesAoDia = "" }) {
  const dk = num(dosePorKg);
  const p = num(peso);
  if (falta(dk, p)) return ERRO;
  const total = dk * p;
  const vezes = num(vezesAoDia);
  const etapas = [`Dose = dose por kg × peso`, `${br(dk)} × ${br(p)} kg = ${br(total)}`];
  let extra;
  if (Number.isFinite(vezes) && vezes > 0) {
    etapas.push(`Por tomada: ${br(total)} ÷ ${br(vezes)} = ${br(total / vezes)}`);
    extra = `${br(total / vezes)} por tomada (${br(vezes)}x ao dia)`;
  }
  return { ok: true, resultado: Math.round(total * 100) / 100, unidade: "mg (ou a unidade prescrita)", etapas, extra };
}

/**
 * Bomba de infusão: dose (por hora ou por minuto) ÷ concentração da solução -> mL/h.
 * Concentração = quantidade do fármaco ÷ volume da solução. Dose em mcg/min com fármaco em mg: converte.
 */
export function bombaInfusao({ dose, porMinuto = false, quantidade, volumeSolucao, doseEmMcg = false, quantidadeEmMg = false, peso = "", porKg = false }) {
  const d0 = num(dose);
  const q = num(quantidade);
  const vs = num(volumeSolucao);
  if (falta(d0, q, vs)) return ERRO;
  const etapas = [];
  let d = d0;
  if (porKg) {
    const p = num(peso);
    if (falta(p)) return ERRO;
    d = d0 * p;
    etapas.push(`Dose do paciente: ${br(d0)} × ${br(p)} kg = ${br(d)}${porMinuto ? "/min" : "/h"}`);
  }
  let qq = q;
  if (doseEmMcg && quantidadeEmMg) {
    qq = q * 1000;
    etapas.push(`Fármaco: ${br(q)} mg = ${br(qq)} mcg`);
  }
  const conc = qq / vs;
  etapas.push(`Concentração = ${br(qq)} ÷ ${br(vs)} mL = ${br(conc, 4)} por mL`);
  const porHora = porMinuto ? d * 60 : d;
  if (porMinuto) etapas.push(`Dose por hora: ${br(d)} × 60 = ${br(porHora)}`);
  const r = porHora / conc;
  etapas.push(`mL/h = dose por hora ÷ concentração = ${br(porHora)} ÷ ${br(conc, 4)} = ${br(r)} mL/h`);
  return { ok: true, resultado: Math.round(r * 10) / 10, unidade: "mL/h", etapas };
}

/**
 * Diluição de frasco-ampola (ex.: penicilina cristalina): o pó ocupa volume. Volume final = diluente + volume do pó.
 * Quanto aspirar = dose prescrita × volume final ÷ quantidade do frasco.
 */
export function diluicao({ quantidadeFrasco, diluente, volumePo = 0, prescrito }) {
  const q = num(quantidadeFrasco);
  const dl = num(diluente);
  const po = num(volumePo) || 0;
  const p = num(prescrito);
  if (falta(q, dl, p)) return ERRO;
  const vf = dl + po;
  const r = (p * vf) / q;
  return {
    ok: true,
    resultado: Math.round(r * 100) / 100,
    unidade: "mL",
    etapas: [
      po ? `Volume final = ${br(dl)} mL de diluente + ${br(po)} mL do pó = ${br(vf)} mL` : `Volume final = ${br(vf)} mL`,
      `${br(q)} está para ${br(vf)} mL, assim como ${br(p)} está para X`,
      `X = (${br(p)} × ${br(vf)}) ÷ ${br(q)} = ${br(r)} mL`,
    ],
  };
}

/** Fórmulas de referência (para o quadro de fórmulas). `fracao`: numerador / denominador desenhados em fração. */
export const FORMULAS = [
  { id: "macro_h", titulo: "Gotas/min (macrogotas, em horas)", resultado: "gotas/min", fracao: ["Volume (mL)", "Tempo (h) × 3"], dica: "1 mL = 20 gotas" },
  { id: "macro_min", titulo: "Gotas/min (macrogotas, em minutos)", resultado: "gotas/min", fracao: ["Volume (mL) × 20", "Tempo (min)"] },
  { id: "micro_h", titulo: "Microgotas/min", resultado: "microgotas/min", fracao: ["Volume (mL)", "Tempo (h)"], dica: "1 mL = 60 microgotas" },
  { id: "bic", titulo: "Bomba de infusão", resultado: "mL/h", fracao: ["Volume (mL)", "Tempo (h)"] },
  { id: "bic_dose", titulo: "Bomba pela dose", resultado: "mL/h", fracao: ["Dose por hora", "Concentração (por mL)"], dica: "Dose por minuto × 60 = dose por hora" },
  { id: "regra3", titulo: "Regra de três (quanto aspirar)", resultado: "mL", fracao: ["Dose prescrita × Volume do frasco", "Dose do frasco"] },
  { id: "peso", titulo: "Dose por peso", resultado: "dose", linha: "Dose por kg × Peso (kg)" },
  { id: "diluicao", titulo: "Frasco-ampola com pó", resultado: "mL", fracao: ["Dose prescrita × (diluente + pó)", "Dose do frasco"] },
];

export const CONVERSOES = ["1 g = 1.000 mg", "1 mg = 1.000 mcg", "1 L = 1.000 mL", "1 h = 60 min", "1 mL = 20 gotas = 60 microgotas"];
