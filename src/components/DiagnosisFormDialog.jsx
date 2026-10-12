import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { SOURCES } from "@/lib/sources";

const empty = { code: "", title: "", domain: "", class: "", status: "ativo", source_link: SOURCES.nanda.url, defining_characteristics: "", related_factors: "", notes: "" };

// Diálogo de adição/edição de diagnóstico de enfermagem (NANDA-I).
export default function DiagnosisFormDialog({ open, onOpenChange, onSave, editing }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          code: editing.code || "",
          title: editing.title || "",
          domain: editing.domain || "",
          class: editing.class || "",
          status: editing.status || "ativo",
          source_link: editing.source_link || SOURCES.nanda.url,
          defining_characteristics: (editing.defining_characteristics || []).join("\n"),
          related_factors: (editing.related_factors || []).join("\n"),
          notes: editing.notes || ""
        });
      } else {
        setForm(empty);
      }
    }
  }, [open, editing]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.code.trim() || !form.title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        code: form.code.trim(),
        title: form.title.trim(),
        domain: form.domain.trim(),
        class: form.class.trim(),
        status: form.status,
        source_link: form.source_link.trim(),
        defining_characteristics: form.defining_characteristics.split("\n").map(s => s.trim()).filter(Boolean),
        related_factors: form.related_factors.split("\n").map(s => s.trim()).filter(Boolean),
        notes: form.notes.trim()
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar Diagnóstico" : "Novo Diagnóstico de Enfermagem"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Código NANDA-I *</Label>
              <Input value={form.code} onChange={(e) => set("code", e.target.value)} placeholder="ex: 00004" className="mt-1" />
            </div>
            <div>
              <Label>Status</Label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                <option value="ativo">Ativo</option>
                <option value="resolvido">Resolvido</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>
          <div>
            <Label>Título *</Label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="ex: Risco de infecção" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Domínio</Label>
              <Input value={form.domain} onChange={(e) => set("domain", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Classe</Label>
              <Input value={form.class} onChange={(e) => set("class", e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Link da fonte</Label>
            <Input value={form.source_link} onChange={(e) => set("source_link", e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Características definidoras (uma por linha)</Label>
            <textarea value={form.defining_characteristics} onChange={(e) => set("defining_characteristics", e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <Label>Fatores relacionados (um por linha)</Label>
            <textarea value={form.related_factors} onChange={(e) => set("related_factors", e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <Label>Observações</Label>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !form.code.trim() || !form.title.trim()} className="bg-teal-600 hover:bg-teal-700">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
