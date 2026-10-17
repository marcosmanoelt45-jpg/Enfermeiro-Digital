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
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</p>
          {unit && <p className="text-xs text-slate-500 dark:text-slate-300">{unit}</p>}
        </div>
        <div className="text-right">
          <span className="text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-50">{safe}</span>
          {unit && <span className="ml-1 text-sm font-medium text-slate-500 dark:text-slate-300">{unit}</span>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={dec}
          className="h-12 w-12 shrink-0 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition shadow-xs"
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
          className="h-12 w-12 shrink-0 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition shadow-xs"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
