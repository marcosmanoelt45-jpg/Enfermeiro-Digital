import React, { useState, useMemo } from "react";
import { Search, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { parseList, joinList } from "@/lib/clinicalCatalogs";

// Seletor de categorias clicáveis com busca por texto.
// Props: value (string separada por vírgula), onChange(novaString), catalog (array de opções), placeholder
export default function CategoryPicker({ value, onChange, catalog, placeholder = "Buscar..." }) {
  const [query, setQuery] = useState("");
  const selected = parseList(value);

  function toggle(item) {
    if (selected.includes(item)) {
      onChange(joinList(selected.filter((s) => s !== item)));
    } else {
      onChange(joinList([...selected, item]));
    }
  }

  function addCustom() {
    const v = query.trim();
    if (!v) return;
    if (!selected.some((s) => s.toLowerCase() === v.toLowerCase())) {
      onChange(joinList([...selected, v]));
    }
    setQuery("");
  }

  function remove(item) {
    onChange(joinList(selected.filter((s) => s !== item)));
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q ? catalog.filter((c) => c.toLowerCase().includes(q)) : catalog;
    // remove os já selecionados da lista de sugestões
    return base.filter((c) => !selected.includes(c));
  }, [query, catalog, selected]);

  return (
    <div className="space-y-2">
      {/* Selecionados */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((item) => (
            <span key={item} className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-2 py-1 text-xs font-medium text-teal-700">
              {item}
              <button type="button" onClick={() => remove(item)} className="text-teal-500 hover:text-teal-800">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Busca */}
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
            placeholder={placeholder}
            className="rounded-xl pl-8"
          />
        </div>
        <button type="button" onClick={addCustom} className="rounded-xl border border-slate-200 px-2.5 text-slate-500 hover:bg-slate-50">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Sugestões filtradas */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/50 p-2">
          {filtered.slice(0, 60).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => toggle(item)}
              className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 transition"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
