import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, ExternalLink, Loader2, ChevronDown, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import DiagnosisFormDialog from "@/components/DiagnosisFormDialog";
import { SOURCES } from "@/lib/sources";

const STATUS_STYLE = {
  ativo: "bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300",
  resolvido: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
  inativo: "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
};

// Aba de gestão de Diagnósticos de Enfermagem: adicionar, ver atuais, atualizar e remover.
export default function DiagnosesTab({ patientId }) {
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [expanded, setExpanded] = useState({});

  async function load() {
    setLoading(true);
    try {
      const list = await base44.entities.NursingDiagnosis.filter({ patient_id: patientId }, "-updated_date", 200);
      setDiagnoses(list);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [patientId]);

  async function handleSave(data) {
    if (editing) {
      await base44.entities.NursingDiagnosis.update(editing.id, data);
    } else {
      await base44.entities.NursingDiagnosis.create({ ...data, patient_id: patientId });
    }
    setEditing(null);
    load();
  }

  async function handleRemove(d) {
    if (!confirm(`Remover o diagnóstico "${d.title}"?`)) return;
    await base44.entities.NursingDiagnosis.delete(d.id);
    load();
  }

  async function quickStatus(d, status) {
    await base44.entities.NursingDiagnosis.update(d.id, { status });
    load();
  }

  const sorted = [...diagnoses].sort((a, b) => {
    const order = { ativo: 0, inativo: 1, resolvido: 2 };
    return (order[a.status] ?? 9) - (order[b.status] ?? 9);
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
          Diagnósticos ({diagnoses.length})
        </p>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }} className="rounded-xl bg-teal-600 hover:bg-teal-700">
          <Plus className="h-4 w-4" /> Adicionar
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div>
      ) : sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Nenhum diagnóstico registrado. Adicione manualmente ou importe de um plano de IA.
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((d) => (
            <div key={d.id} className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex items-center gap-3 p-3">
                <button onClick={() => setExpanded((e) => ({ ...e, [d.id]: !e[d.id] }))} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                    <Stethoscope className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {d.code && <span className="rounded bg-teal-100 dark:bg-teal-950/80 px-1.5 py-0.5 font-mono text-xs font-semibold text-teal-800 dark:text-teal-300">{d.code}</span>}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLE[d.status] || STATUS_STYLE.ativo}`}>{d.status}</span>
                    </div>
                    <p className="mt-0.5 truncate text-sm font-medium text-slate-800 dark:text-slate-100">{d.title}</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 dark:text-slate-400 transition ${expanded[d.id] ? "rotate-180" : ""}`} />
                </button>
                <div className="flex shrink-0 gap-1">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(d); setOpen(true); }} className="h-8 w-8 rounded-lg text-slate-500 dark:text-slate-400 dark:hover:bg-slate-800">
                    <Pencil className="h-4 w-4 text-slate-500" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleRemove(d)} className="h-8 w-8 rounded-lg text-rose-500 dark:text-rose-400 dark:hover:bg-slate-800">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>

              {expanded[d.id] && (
                <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 p-3 text-sm">
                  {(d.domain || d.class) && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">{[d.domain, d.class].filter(Boolean).join(" · ")}</p>
                  )}
                  {d.defining_characteristics?.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Características Definidoras</p>
                      <ul className="space-y-0.5">
                        {d.defining_characteristics.map((c, i) => <li key={i} className="text-slate-700 dark:text-slate-200">• {c}</li>)}
                      </ul>
                    </div>
                  )}
                  {d.related_factors?.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Fatores Relacionados</p>
                      <ul className="space-y-0.5">
                        {d.related_factors.map((c, i) => <li key={i} className="text-slate-700 dark:text-slate-200">• {c}</li>)}
                      </ul>
                    </div>
                  )}
                  {d.notes && <p className="text-slate-600 dark:text-slate-300"><span className="font-medium text-slate-900 dark:text-slate-100">Obs:</span> {d.notes}</p>}
                  <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-2">
                    {d.source_link && (
                      <a href={d.source_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 hover:underline">
                        <ExternalLink className="h-3 w-3" /> Ver fonte
                      </a>
                    )}
                    <a href={SOURCES.nic.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 hover:underline">
                      <ExternalLink className="h-3 w-3" /> Manual NIC
                    </a>
                    <a href={SOURCES.noc.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:underline">
                      <ExternalLink className="h-3 w-3" /> Manual NOC
                    </a>
                  </div>
                </div>
              )}

              {d.status === "ativo" && (
                <div className="flex gap-2 border-t border-slate-100 dark:border-slate-800 px-3 py-2">
                  <Button size="sm" variant="outline" onClick={() => quickStatus(d, "resolvido")} className="h-7 rounded-lg text-xs border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">Marcar resolvido</Button>
                  <Button size="sm" variant="outline" onClick={() => quickStatus(d, "inativo")} className="h-7 rounded-lg text-xs border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">Inativar</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <DiagnosisFormDialog open={open} onOpenChange={setOpen} onSave={handleSave} editing={editing} />
    </div>
  );
}
