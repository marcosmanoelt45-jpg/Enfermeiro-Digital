import React, { useState, useRef, useEffect } from "react";
import { Stethoscope, X, ExternalLink, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { SOURCES } from "@/lib/sources";

// Barra de busca rápida de diagnósticos de enfermagem NANDA-I (consultados no banco de dados).
export default function NandaSearchBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const boxRef = useRef(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await base44.entities.NandaDiagnosis.list("-code", 500);
        if (active) setCatalog(list || []);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    function onClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") {
        setSelected(null);
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const q = query.trim().toLowerCase();
  const results = q
    ? catalog
        .filter(
          (d) =>
            (d.title || "").toLowerCase().includes(q) ||
            (d.code || "").toLowerCase().includes(q) ||
            (d.domain || "").toLowerCase().includes(q)
        )
        .slice(0, 12)
    : [];

  return (
    <div className="relative" ref={boxRef}>
      <div className="relative">
        <Stethoscope className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#20D5B5]" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar diagnóstico NANDA-I no banco (ex: risco de infecção, 00004)..."
          className="rounded-xl border-[#1F3045] bg-[#0E1722] text-[#EAF2F8] placeholder:text-[#8A9DB1] pl-9 pr-9 focus:ring-1 focus:ring-[#20D5B5]"
        />
        {loading && (
          <Loader2 className="absolute right-9 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#8A9DB1]" />
        )}
        {query && !loading && (
          <button
            type="button"
            aria-label="Limpar busca"
            onClick={() => { setQuery(""); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A9DB1] hover:text-[#9FB3C6]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && query && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-2xl border border-[#1F3045] bg-[#131F2E] shadow-lg">
          {loading ? (
            <p className="px-4 py-6 text-center text-sm text-[#8A9DB1]">Carregando catálogo...</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-[#8A9DB1]">
              Nenhum diagnóstico encontrado para &quot;{query}&quot;.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {results.map((d) => (
                <li key={d.id ?? d.code}>
                  <button
                    type="button"
                    onClick={() => { setSelected(d); setOpen(false); }}
                    className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-[#16222E]"
                  >
                    <span className="mt-0.5 shrink-0 rounded-md bg-[#20D5B5]/20 border border-[#20D5B5]/30 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#20D5B5]">
                      {d.code}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-[#EAF2F8]">{d.title}</span>
                      <span className="block text-xs text-[#9FB3C6]">{d.domain}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="nanda-modal-title"
          className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 p-4 sm:items-center backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div className="w-full max-w-md rounded-2xl bg-[#131F2E] border border-[#1F3045] p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-block rounded-md bg-[#20D5B5]/20 border border-[#20D5B5]/30 px-2 py-0.5 font-mono text-xs font-semibold text-[#20D5B5]">
                  {selected.code}
                </span>
                <h3 id="nanda-modal-title" className="mt-2 text-base font-semibold text-[#EAF2F8]">{selected.title}</h3>
              </div>
              <button
                type="button"
                aria-label="Fechar detalhes"
                onClick={() => setSelected(null)}
                className="text-[#9FB3C6] hover:text-[#EAF2F8]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-xs font-medium text-[#9FB3C6]">Domínio</dt>
                <dd className="text-[#EAF2F8]">{selected.domain}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[#9FB3C6]">Classe</dt>
                <dd className="text-[#EAF2F8]">{selected.class}</dd>
              </div>
            </dl>
            <a href={SOURCES.nanda.url} target="_blank" rel="noreferrer" className="mt-4 flex items-center gap-1.5 text-sm font-medium text-[#20D5B5] hover:underline">
              <ExternalLink className="h-4 w-4" /> Ver na fonte NANDA-I 2024-2026
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
