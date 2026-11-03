import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Stethoscope, Activity, Target, ExternalLink } from "lucide-react";
import { SOURCES } from "@/lib/sources";

// Card expansível para renderizar Diagnósticos (NANDA-I), Intervenções (NIC) e Resultados (NOC).
export default function DiagnosisCard({ diagnosis, index }) {
  const [open, setOpen] = useState(index === 0);
  const interventions = diagnosis.interventions || diagnosis.nic || [];
  const outcomes = diagnosis.outcomes || diagnosis.noc || [];
  const defining = diagnosis.defining_characteristics || diagnosis.caracteristicas_definidoras || [];
  const related = diagnosis.related_factors || diagnosis.fatores_relacionados || [];

  return (
    <div className="overflow-hidden rounded-2xl border border-[#1F3045] bg-[#131F2E] shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#20D5B5]/15 text-[#20D5B5]">
          <Stethoscope className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {diagnosis.code && (
              <span className="rounded-md bg-[#20D5B5]/20 border border-[#20D5B5]/30 px-1.5 py-0.5 font-mono text-xs font-semibold text-[#20D5B5]">
                {diagnosis.code}
              </span>
            )}
            <p className="truncate font-semibold text-[#EAF2F8]">{diagnosis.title || diagnosis.titulo}</p>
          </div>
          {(diagnosis.domain || diagnosis.dominio || diagnosis.class || diagnosis.classe) && (
            <p className="mt-0.5 truncate text-xs text-[#9FB3C6]">
              {[diagnosis.domain || diagnosis.dominio, diagnosis.class || diagnosis.classe].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <ChevronDown className={`h-5 w-5 shrink-0 text-[#9FB3C6] transition ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <div className="space-y-4 border-t border-[#1F3045] bg-[#0E1722] p-4">
              {defining.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[#9FB3C6]">Características Definidoras</p>
                  <ul className="space-y-1">
                    {defining.map((c, i) => (
                      <li key={i} className="flex gap-2 text-sm text-[#EAF2F8]">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#20D5B5]" />
                        <span>{typeof c === "string" ? c : c.text || c.descricao || JSON.stringify(c)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {related.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[#9FB3C6]">Fatores Relacionados</p>
                  <ul className="space-y-1">
                    {related.map((c, i) => (
                      <li key={i} className="flex gap-2 text-sm text-[#EAF2F8]">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#FFC247]" />
                        <span>{typeof c === "string" ? c : c.text || c.descricao || JSON.stringify(c)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {interventions.length > 0 && (
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#9FB3C6]">
                    <Activity className="h-3 w-3" /> Intervenções (NIC)
                  </p>
                  <div className="space-y-2">
                    {interventions.map((it, i) => (
                      <div key={i} className="rounded-xl bg-sky-500/10 border border-sky-500/20 p-2.5">
                        <div className="flex items-center gap-2">
                          {it.code && (
                            <span className="rounded bg-sky-500/20 px-1.5 py-0.5 font-mono text-xs font-semibold text-sky-400">
                              {it.code}
                            </span>
                          )}
                          <p className="text-sm font-medium text-[#EAF2F8]">{it.title || it.titulo || it.label}</p>
                        </div>
                        {it.description && <p className="mt-1 text-xs text-[#9FB3C6]">{it.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {outcomes.length > 0 && (
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#9FB3C6]">
                    <Target className="h-3 w-3" /> Resultados Esperados (NOC)
                  </p>
                  <div className="space-y-2">
                    {outcomes.map((oc, i) => (
                      <div key={i} className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-2.5">
                        <div className="flex items-center gap-2">
                          {oc.code && (
                            <span className="rounded bg-violet-500/20 px-1.5 py-0.5 font-mono text-xs font-semibold text-violet-400">
                              {oc.code}
                            </span>
                          )}
                          <p className="text-sm font-medium text-[#EAF2F8]">{oc.title || oc.titulo || oc.label}</p>
                        </div>
                        {oc.description && <p className="mt-1 text-xs text-[#9FB3C6]">{oc.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-[#1F3045] pt-3 text-xs">
                <a href={SOURCES.nanda.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#20D5B5] hover:underline">
                  <ExternalLink className="h-3 w-3" /> NANDA-I {diagnosis.code}
                </a>
                <a href={SOURCES.nic.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sky-400 hover:underline">
                  <ExternalLink className="h-3 w-3" /> Manual NIC
                </a>
                <a href={SOURCES.noc.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-violet-400 hover:underline">
                  <ExternalLink className="h-3 w-3" /> Manual NOC
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
