import React from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

// Controle touch-friendly: slider + botões largos de incremento/decremento.
export default function VitalSlider({ label, unit, value, min, max, step = 1, onChange, accentColor = "teal" }) {
  const safe = value === undefined || value === null || Number.isNaN(value) ? min : value;
  const dec = () => onChange(Math.max(min, Number((safe - step).toFixed(2))));
  const inc = () => onChange(Math.min(max, Number((safe + step).toFixed(2))));

  const accentMap = {
    teal: "[&_[role=slider]]:bg-teal-600 [&_.bg-primary]:bg-teal-600",
    rose: "[&_[role=slider]]:bg-rose-600 [&_.bg-primary]:bg-rose-600",
    amber: "[&_[role=slider]]:bg-amber-500 [&_.bg-primary]:bg-amber-500",
    sky: "[&_[role=slider]]:bg-sky-600 [&_.bg-primary]:bg-sky-600",
    violet: "[&_[role=slider]]:bg-violet-600 [&_.bg-primary]:bg-violet-600",
    slate: "[&_[role=slider]]:bg-slate-700 [&_.bg-primary]:bg-slate-700"
  };

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700">{label}</p>
          {unit && <p className="text-xs text-slate-400">{unit}</p>}
        </div>
        <div className="text-right">
          <span className="text-3xl font-semibold tabular-nums text-slate-800">{safe}</span>
          {unit && <span className="ml-1 text-sm text-slate-400">{unit}</span>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={dec}
          className="h-12 w-12 shrink-0 rounded-xl border-slate-200 active:scale-95 transition"
        >
          <Minus className="h-5 w-5" />
        </Button>
        <Slider
          value={[safe]}
          min={min}
          max={max}
          step={step}
          onValueChange={(v) => onChange(v[0])}
          className={`flex-1 ${accentMap[accentColor]}`}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={inc}
          className="h-12 w-12 shrink-0 rounded-xl border-slate-200 active:scale-95 transition"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
