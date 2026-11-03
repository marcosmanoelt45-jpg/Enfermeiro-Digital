import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MEDICATION_CATALOG, drugUrl } from "@/lib/medicationCatalog";

// Seletor de medicamento com busca no catálogo e link para Drugs.com.
export default function DrugPicker({ value, onChange, onPick }) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef(null);

  useEffect(() => { setQuery(value || ""); }, [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MEDICATION_CATALOG.slice(0, 8);
    return MEDICATION_CATALOG.filter(
      (d) => d.name.toLowerCase().includes(q) || d.class.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [query]);

  useEffect(() => {
    function handle(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function select(drug) {
    setQuery(drug.name);
    setOpen(false);
    onChange?.(drug.name, drug);
    onPick?.(drug);
  }

  function onKey(e) {
    if (!open || filtered.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" && active >= 0) { e.preventDefault(); select(filtered[active]); }
  }

  const matched = MEDICATION_CATALOG.find((d) => d.name.toLowerCase() === query.trim().toLowerCase());

  return (
    <div className="relative" ref={boxRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#52667A]" />
        <Input
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls="drug-picker-listbox"
          value={query}
          onChange={(e) => { setQuery(e.target.value); onChange?.(e.target.value); setOpen(true); setActive(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder="Buscar medicamento..."
          className="rounded-xl pl-9 bg-[#0B131D] border-[#27394B] text-[#EAF2F8] placeholder:text-[#52667A] focus:ring-1 focus:ring-[#20D5B5]"
        />
      </div>
      {open && filtered.length > 0 && (
        <div
          id="drug-picker-listbox"
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-[#1F3045] bg-[#131F2E] shadow-lg"
        >
          {filtered.map((d, i) => (
            <button
              key={d.name}
              role="option"
              aria-selected={i === active}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => select(d)}
              className={`flex w-full items-center justify-between px-3 py-2 text-left transition ${i === active ? "bg-[#20D5B5]/15 text-[#20D5B5]" : "hover:bg-[#16222E] text-[#EAF2F8]"}`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{d.name}</p>
                <p className="truncate text-[11px] text-[#9FB3C6]">{d.class}{d.concentration ? ` · ${d.concentration} ${d.unit || "mg/mL"}` : ""}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {(matched || query.trim()) && (
        <a
          href={drugUrl(query.trim())}
          target="_blank"
          rel="noreferrer"
          className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-[#20D5B5] hover:underline"
        >
          <ExternalLink className="h-3 w-3" /> Ver no Drugs.com
        </a>
      )}
    </div>
  );
}
