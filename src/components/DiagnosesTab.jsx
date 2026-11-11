import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, ExternalLink, Loader2, ChevronDown, Stethoscope } from "lucide-react";
import { safeHttpUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import DiagnosisFormDialog from "@/components/DiagnosisFormDialog";
import { SOURCES } from "@/lib/sources";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STATUS_LABELS = {
  ativo: "Ativo",
  inativo: "Inativo",
  resolvido: "Resolvido"
};

const STATUS_STYLE = {
  ativo: "bg-[#20D5B5]/20 border border-[#20D5B5]/30 text-[#20D5B5]",
  resolvido: "bg-[#1F3045] border border-[#27394B] text-[#9FB3C6]",
  inativo: "bg-[#FFC247]/20 border border-[#FFC247]/30 text-[#FFC247]"
};

// Aba de gestão de Diagnósticos de Enfermagem: adicionar, ver atuais, atualizar e remover.
export default function DiagnosesTab({ patientId }) {
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [deleteItem, setDeleteItem] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const list = await base44.entities.NursingDiagnosis.filter({ patient_id: patientId }, "-updated_date", 200);
      setDiagnoses(list || []);
    } catch (err) {
      toast({ variant: "destructive", title: "Erro ao carregar diagnósticos", description: err?.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [patientId]);

  async function handleSave(data) {
    try {
      if (editing) {
        await base44.entities.NursingDiagnosis.update(editing.id, data);
        toast({ title: "Diagnóstico atualizado" });
      } else {
        await base44.entities.NursingDiagnosis.create({ ...data, patient_id: patientId });
        toast({ title: "Diagnóstico adicionado" });
      }
      setEditing(null);
      load();
    } catch (err) {
      toast({ variant: "destructive", title: "Não foi possível salvar", description: err?.message });
    }
  }

  async function confirmRemove() {
    if (!deleteItem) return;
    try {
      await base44.entities.NursingDiagnosis.delete(deleteItem.id);
      toast({ title: "Diagnóstico removido" });
      load();
    } catch (err) {
      toast({ variant: "destructive", title: "Erro ao excluir diagnóstico", description: err?.message });
    } finally {
      setDeleteItem(null);
    }
  }

  async function quickStatus(d, status) {
    try {
      await base44.entities.NursingDiagnosis.update(d.id, { status });
      toast({ title: `Diagnóstico marcado como ${STATUS_LABELS[status] || status}` });
      load();
    } catch (err) {
      toast({ variant: "destructive", title: "Erro ao atualizar status", description: err?.message });
    }
  }

  const sorted = [...diagnoses].sort((a, b) => {
    const order = { ativo: 0, inativo: 1, resolvido: 2 };
    return (order[a.status] ?? 9) - (order[b.status] ?? 9);
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[#9FB3C6]">
          Diagnósticos ({diagnoses.length})
        </p>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }} className="rounded-xl">
          <Plus className="h-4 w-4" /> Adicionar
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-[#20D5B5]" /></div>
      ) : sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#1F3045] bg-[#131F2E] p-6 text-center text-sm text-[#8A9DB1]">
          Nenhum diagnóstico registrado. Adicione manualmente ou importe de um plano de IA.
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((d) => (
            <div key={d.id} className="overflow-hidden rounded-2xl border border-[#1F3045] bg-[#131F2E] shadow-sm">
              <div className="flex items-center gap-3 p-3">
                <button
                  type="button"
                  onClick={() => setExpanded((e) => ({ ...e, [d.id]: !e[d.id] }))}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#20D5B5]/15 text-[#20D5B5]">
                    <Stethoscope className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {d.code && <span className="rounded bg-[#20D5B5]/20 border border-[#20D5B5]/30 px-1.5 py-0.5 font-mono text-xs font-semibold text-[#20D5B5]">{d.code}</span>}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLE[d.status] || STATUS_STYLE.ativo}`}>
                        {STATUS_LABELS[d.status] || d.status}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm font-medium text-[#EAF2F8]">{d.title}</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-[#9FB3C6] transition ${expanded[d.id] ? "rotate-180" : ""}`} />
                </button>
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Editar diagnóstico"
                    onClick={() => { setEditing(d); setOpen(true); }}
                    className="h-8 w-8 rounded-lg text-[#9FB3C6] hover:bg-[#16222E] hover:text-[#EAF2F8]"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Excluir diagnóstico"
                    onClick={() => setDeleteItem(d)}
                    className="h-8 w-8 rounded-lg text-[#8A9DB1] hover:bg-red-500/10 hover:text-[#FF6B6B]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {expanded[d.id] && (
                <div className="space-y-3 border-t border-[#1F3045] bg-[#0E1722] p-3 text-sm">
                  {(d.domain || d.class) && (
                    <p className="text-xs text-[#9FB3C6]">{[d.domain, d.class].filter(Boolean).join(" · ")}</p>
                  )}
                  {d.defining_characteristics?.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-semibold text-[#9FB3C6]">Características Definidoras</p>
                      <ul className="space-y-0.5">
                        {d.defining_characteristics.map((c, i) => <li key={i} className="text-[#EAF2F8]">• {c}</li>)}
                      </ul>
                    </div>
                  )}
                  {d.related_factors?.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-semibold text-[#9FB3C6]">Fatores Relacionados</p>
                      <ul className="space-y-0.5">
                        {d.related_factors.map((c, i) => <li key={i} className="text-[#EAF2F8]">• {c}</li>)}
                      </ul>
                    </div>
                  )}
                  {d.notes && <p className="text-[#9FB3C6]"><span className="font-medium text-[#EAF2F8]">Obs:</span> {d.notes}</p>}
                  <div className="flex flex-wrap items-center gap-2 border-t border-[#1F3045] pt-2">
                    {safeHttpUrl(d.source_link) && (
                      <a href={safeHttpUrl(d.source_link)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[#20D5B5] hover:underline">
                        <ExternalLink className="h-3 w-3" /> Ver fonte
                      </a>
                    )}
                    <a href={SOURCES.nic.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-sky-400 hover:underline">
                      <ExternalLink className="h-3 w-3" /> Manual NIC
                    </a>
                    <a href={SOURCES.noc.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-violet-400 hover:underline">
                      <ExternalLink className="h-3 w-3" /> Manual NOC
                    </a>
                  </div>
                </div>
              )}

              {d.status === "ativo" && (
                <div className="flex gap-2 border-t border-[#1F3045] px-3 py-2">
                  <Button size="sm" variant="outline" onClick={() => quickStatus(d, "resolvido")} className="h-7 rounded-lg text-xs">
                    Marcar resolvido
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => quickStatus(d, "inativo")} className="h-7 rounded-lg text-xs">
                    Inativar
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent className="bg-[#131F2E] border-[#1F3045] text-[#EAF2F8]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#EAF2F8]">Remover diagnóstico?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#9FB3C6]">
              Deseja realmente remover o diagnóstico &quot;{deleteItem?.title}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#1F3045] bg-[#0E1722] text-[#9FB3C6] hover:bg-[#16222E]">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove} className="bg-[#FF6B6B] hover:bg-[#FF6B6B]/80 text-white">
              Sim, remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DiagnosisFormDialog open={open} onOpenChange={setOpen} onSave={handleSave} editing={editing} />
    </div>
  );
}
