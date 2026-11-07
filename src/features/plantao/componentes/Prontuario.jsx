import React from "react";
import PropTypes from "prop-types";
import { HelpCircle } from "lucide-react";
import { Chip, Inset } from "@/components/ui/surface";

const fmtPA = (v) => `${v.pa_sistolica}/${v.pa_diastolica}`;

// Prontuário do paciente, montado do cenário. Os campos das lacunas aparecem como "?" até serem examinados.
// A narrativa da avaliação NÃO aparece (ela entrega os achados): só situação, antecedentes, sinais vitais,
// lacunas e as pendências da recomendação.
export default function Prontuario({ cenario, lacunasPreenchidas = {}, onAbrirLacuna }) {
  const v = cenario.vitals;
  return (
    <div className="space-y-3" aria-label="Prontuário">
      <Inset className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-lg font-black leading-tight">{cenario.name} · {cenario.age} anos</p>
          <Chip tone="neutral">{cenario.bed}</Chip>
        </div>
        <p className="text-sm font-semibold text-[#9FB3C6]">{cenario.sector}</p>
        <p className="text-sm font-bold">{cenario.diagnosis}</p>
      </Inset>

      <Inset className="space-y-1">
        <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#9FB3C6]">Situação e antecedentes</h3>
        <p className="text-sm font-semibold">{cenario.goldenSbar.situation}</p>
        <p className="text-sm font-semibold">{cenario.goldenSbar.background}</p>
      </Inset>

      <Inset>
        <h3 className="mb-2 text-xs font-extrabold uppercase tracking-wide text-[#9FB3C6]">Sinais vitais</h3>
        <dl className="grid grid-cols-3 gap-2 text-center">
          {[["PA", `${fmtPA(v)} mmHg`], ["FC", `${v.fc} bpm`], ["FR", `${v.fr} irpm`], ["SatO₂", `${v.sat}%`], ["Tax", `${String(v.tax).replace(".", ",")} °C`]].map(([r, valor]) => (
            <div key={r} className="rounded-xl border border-[#27394B] bg-[#16222E] p-2">
              <dt className="text-xs font-bold text-[#9FB3C6]">{r}</dt>
              <dd className="text-sm font-black tabular-nums">{valor}</dd>
            </div>
          ))}
        </dl>
      </Inset>

      <Inset className="space-y-2">
        <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#9FB3C6]">Exame do paciente</h3>
        {cenario.lacunas.map((l) => {
          const feita = lacunasPreenchidas[l.campo];
          return feita ? (
            <div key={l.campo} className="rounded-xl border border-[#3DD68C]/40 bg-[#3DD68C]/10 p-2">
              <p className="text-xs font-bold text-[#9FB3C6]">{l.rotulo}</p>
              <p className="text-sm font-bold">{feita.valor}</p>
            </div>
          ) : (
            <button key={l.campo} type="button" onClick={() => onAbrirLacuna(l)} className="btn-3d-outline flex w-full items-center gap-2 rounded-xl p-2 text-left" aria-label={`${l.rotulo}: ainda não examinado. Toque para examinar`}>
              <HelpCircle size={20} className="shrink-0 text-[#FFC247]" aria-hidden="true" />
              <span className="flex-1 text-sm font-bold">{l.rotulo}</span>
              <Chip tone="warning">?</Chip>
            </button>
          );
        })}
      </Inset>

      <Inset className="space-y-1">
        <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#9FB3C6]">Prescrição e pendências</h3>
        <p className="text-sm font-semibold">{cenario.goldenSbar.recommendation}</p>
      </Inset>
    </div>
  );
}

Prontuario.propTypes = {
  cenario: PropTypes.object.isRequired,
  lacunasPreenchidas: PropTypes.object,
  onAbrirLacuna: PropTypes.func.isRequired,
};
