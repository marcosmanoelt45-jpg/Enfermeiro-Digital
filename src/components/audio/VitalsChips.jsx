import React from "react";
import { Activity } from "lucide-react";
import { describeVitals } from "@/lib/vitalsParser";

export default function VitalsChips({ vitals }) {
  const items = describeVitals(vitals);

  if (!items.length) {
    return (
      <p className="mt-3 rounded-xl bg-amber-50 p-2.5 text-[11px] text-amber-700">
        Nenhum sinal vital foi reconhecido no texto. Dite no formato “PA 120 por 80”, “FC 78”, “Tax 36,5”,
        “Sat 96%”, “dor 7” — ou preencha a avaliação manualmente após confirmar.
      </p>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-teal-200 bg-teal-50/60 p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-teal-700">
        <Activity className="h-3.5 w-3.5" /> Sinais vitais identificados no relato
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item.label} className="rounded-lg border border-teal-200 bg-white px-2.5 py-1 text-xs text-slate-700">
            <span className="font-semibold text-teal-700">{item.label}</span> {item.value} {item.unit}
          </span>
        ))}
      </div>
    </div>
  );
}
