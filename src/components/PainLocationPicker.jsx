import React, { useState } from "react";
import { ChevronDown, MapPin, X } from "lucide-react";
import { PAIN_LOCATIONS } from "@/lib/painLocations";

export default function PainLocationPicker({ value, onChange }) {
  const [openRegion, setOpenRegion] = useState(null);
  const selected = Array.isArray(value) ? value : value ? [value] : [];

  function toggle(loc) {
    if (selected.includes(loc)) {
      onChange(selected.filter((x) => x !== loc));
    } else {
      onChange([...selected, loc]);
    }
  }

  function remove(loc) {
    onChange(selected.filter((x) => x !== loc));
  }

  return (
    <div className="space-y-3">
      {/* Chips de seleção */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((loc) => (
            <span key={loc} className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700">
              <MapPin className="h-3 w-3" />
              {loc}
              <button onClick={() => remove(loc)} className="ml-0.5 rounded-full hover:bg-rose-200">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Acordeão por região */}
      <div className="space-y-1.5">
        {PAIN_LOCATIONS.map((group) => {
          const isOpen = openRegion === group.region;
          return (
            <div key={group.region} className="overflow-hidden rounded-xl border border-slate-200">
              <button
                onClick={() => setOpenRegion(isOpen ? null : group.region)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left transition hover:bg-slate-50"
              >
                <span className="text-sm font-medium text-slate-700">{group.region}</span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="flex flex-wrap gap-1.5 border-t border-slate-100 p-3">
                  {group.items.map((loc) => {
                    const active = selected.includes(loc);
                    return (
                      <button
                        key={loc}
                        onClick={() => toggle(loc)}
                        className={`rounded-full border-2 px-2.5 py-1 text-xs font-medium transition ${
                          active ? "border-rose-500 bg-rose-50 text-rose-700" : "border-slate-200 text-slate-500 hover:border-rose-200"
                        }`}
                      >
                        {loc}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selected.length === 0 && (
        <p className="text-xs text-slate-400">Toque nas regiões acima para selecionar os locais da dor.</p>
      )}
    </div>
  );
}
