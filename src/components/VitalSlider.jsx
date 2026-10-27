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
    teal: "[&_[role=slider]]:bg-[#20D5B5] [&_[role=slider]]:border-[#0B131D] [&_.bg-primary]:bg-[#20D5B5]",
    amber: "[&_[role=slider]]:bg-[#FFC247] [&_[role=slider]]:border-[#0B131D] [&_.bg-primary]:bg-[#FFC247]",
    rose: "[&_[role=slider]]:bg-[#F0645F] [&_[role=slider]]:border-[#0B131D] [&_.bg-primary]:bg-[#F0645F]",
    sky: "[&_[role=slider]]:bg-[#38BDF8] [&_[role=slider]]:border-[#0B131D] [&_.bg-primary]:bg-[#38BDF8]",
    violet: "[&_[role=slider]]:bg-[#A78BFA] [&_[role=slider]]:border-[#0B131D] [&_.bg-primary]:bg-[#A78BFA]",
    slate: "[&_[role=slider]]:bg-[#64748B] [&_[role=slider]]:border-[#0B131D] [&_.bg-primary]:bg-[#64748B]"
  };

  const isAmber = accentColor === "amber" || accentColor === "rose";

  return (
    <div className="space-y-2 p-3 sm:p-4 rounded-2xl bg-[#0E1722] border border-[#1F3045]">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1.5">
          <p className="text-xs sm:text-sm font-bold text-white">{label}</p>
          {unit && <span className="text-[11px] text-[#9FB3C6] font-mono">{unit}</span>}
        </div>
        <div className="text-right">
          <span className={`text-xl sm:text-2xl font-black tabular-nums ${isAmber ? "text-[#FFC247]" : "text-[#20D5B5]"}`}>
            {safe}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 pt-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={dec}
          className="h-9 w-9 shrink-0 rounded-xl border-[#1F3045] bg-[#131F2E] text-white hover:bg-[#1E2E3E] active:scale-95 transition shadow-xs"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Slider
          value={[safe]}
          min={min}
          max={max}
          step={step}
          onValueChange={(v) => onChange(v[0])}
          className={`flex-1 ${accentMap[accentColor] || accentMap.teal}`}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={inc}
          className="h-9 w-9 shrink-0 rounded-xl border-[#1F3045] bg-[#131F2E] text-white hover:bg-[#1E2E3E] active:scale-95 transition shadow-xs"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
