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
            <span key={loc} className="inline-flex items-center gap-1 rounded-full bg-[#FF6B6B]/20 border border-[#FF6B6B]/30 px-2.5 py-1 text-xs font-medium text-[#FF6B6B]">
              <MapPin className="h-3 w-3" />
              {loc}
              <button
                type="button"
                aria-label={`Remover ${loc}`}
                onClick={() => remove(loc)}
                className="ml-0.5 rounded-full hover:bg-[#FF6B6B]/30 p-0.5"
              >
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
            <div key={group.region} className="overflow-hidden rounded-xl border border-[#1F3045] bg-[#0E1722]">
              <button
                type="button"
                onClick={() => setOpenRegion(isOpen ? null : group.region)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left transition hover:bg-[#16222E]"
              >
                <span className="text-sm font-medium text-[#EAF2F8]">{group.region}</span>
                <ChevronDown className={`h-4 w-4 text-[#9FB3C6] transition ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="flex flex-wrap gap-1.5 border-t border-[#1F3045] p-3 bg-[#131F2E]">
                  {group.items.map((loc) => {
                    const active = selected.includes(loc);
                    return (
                      <button
                        type="button"
                        key={loc}
                        onClick={() => toggle(loc)}
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                          active
                            ? "border-[#FF6B6B] bg-[#FF6B6B]/20 text-[#FF6B6B]"
                            : "border-[#1F3045] bg-[#0E1722] text-[#9FB3C6] hover:border-[#27394B]"
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
        <p className="text-xs text-[#52667A]">Toque nas regiões acima para selecionar os locais da dor.</p>
      )}
    </div>
  );
}
