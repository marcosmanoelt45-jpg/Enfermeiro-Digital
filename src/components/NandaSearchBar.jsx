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
        if (active) setCatalog(list);
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
        <Stethoscope className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-600" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar diagnóstico NANDA-I no banco (ex: risco de infecção, 00004)..."
          className="rounded-xl border-teal-200 dark:border-teal-800/80 bg-teal-50/40 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 pl-9 pr-9"
        />
        {loading && (
          <Loader2 className="absolute right-9 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-300" />
        )}
        {query && !loading && (
          <button
            onClick={() => { setQuery(""); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && query && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg">
          {loading ? (
            <p className="px-4 py-6 text-center text-sm text-slate-400">Carregando catálogo...</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-400">
              Nenhum diagnóstico encontrado para "{query}".
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {results.map((d) => (
                <li key={d.id}>
                  <button
                    onClick={() => { setSelected(d); setOpen(false); }}
                    className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-teal-50 dark:hover:bg-slate-800"
                  >
                    <span className="mt-0.5 shrink-0 rounded-md bg-teal-100 dark:bg-teal-950/80 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-teal-700 dark:text-teal-300">
                      {d.code}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">{d.title}</span>
                      <span className="block text-xs text-slate-400">{d.domain}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 dark:border dark:border-slate-800 p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-block rounded-md bg-teal-100 dark:bg-teal-950/80 px-2 py-0.5 font-mono text-xs font-semibold text-teal-700 dark:text-teal-300">
                  {selected.code}
                </span>
                <h3 className="mt-2 text-base font-semibold text-slate-800 dark:text-slate-100">{selected.title}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Domínio</dt>
                <dd className="text-slate-700 dark:text-slate-200">{selected.domain}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Classe</dt>
                <dd className="text-slate-700 dark:text-slate-200">{selected.class}</dd>
              </div>
            </dl>
            <a href={SOURCES.nanda.url} target="_blank" rel="noreferrer" className="mt-4 flex items-center gap-1.5 text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline">
              <ExternalLink className="h-4 w-4" /> Ver na fonte NANDA-I 2024-2026
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
