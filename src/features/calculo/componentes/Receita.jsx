import React from "react";
import PropTypes from "prop-types";
import { Chip, Inset } from "@/components/ui/surface";

const fmt = (n) => Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 3 });

// A prescrição como numa receita: fármaco, dose, via, frequência e o que há disponível. Números em fonte tabular.
export default function Receita({ item }) {
  const p = item.prescricao;
  const alergias = item.paciente?.alergias ?? [];
  return (
    <Inset className="space-y-3 border-dashed" role="group" aria-label="Receita">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-extrabold text-[#9FB3C6]">Prescrição</span>
        {item.altaVigilancia && <Chip tone="warning">Alta vigilância</Chip>}
      </div>
      <p className="text-lg font-black leading-tight">{p.farmaco}</p>
      <dl className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <dt className="text-xs font-bold text-[#9FB3C6]">Dose</dt>
          <dd className="font-black tabular-nums">{fmt(p.dose)} {p.unidadeDose}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-[#9FB3C6]">Via</dt>
          <dd className="font-black">{p.via}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-[#9FB3C6]">Frequência</dt>
          <dd className="font-black">{p.frequencia}</dd>
        </div>
      </dl>
      <p className="text-sm font-semibold"><span className="font-bold text-[#9FB3C6]">Disponível: </span>{item.disponivel}</p>
      {alergias.length > 0 && (
        <p className="rounded-xl border border-[#FF6B6B]/40 bg-[#FF6B6B]/10 px-3 py-1.5 text-sm font-bold text-[#FF6B6B]">
          Alergia registrada: {alergias.join(", ")}
        </p>
      )}
    </Inset>
  );
}

Receita.propTypes = { item: PropTypes.object.isRequired };
