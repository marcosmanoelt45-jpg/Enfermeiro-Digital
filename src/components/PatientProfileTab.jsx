import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Save, HeartPulse, ClipboardList, Pill, AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import CategoryPicker from "@/components/CategoryPicker";
import { DISEASES_CATALOG, MEDICATIONS_CATALOG, ALLERGIES_CATALOG } from "@/lib/clinicalCatalogs";

const TEXT_FIELDS = [
  { key: "medical_history", label: "Histórico prévio", icon: ClipboardList, placeholder: "Cirurgias, internações, eventos..." },
  { key: "notes", label: "Outras informações úteis", icon: FileText, placeholder: "Observações gerais relevantes ao caso" }
];

const CATEGORY_FIELDS = [
  { key: "previous_diseases", label: "Doenças prévias", icon: HeartPulse, catalog: DISEASES_CATALOG, placeholder: "Buscar doença..." },
  { key: "current_medications", label: "Medicamentos em uso", icon: Pill, catalog: MEDICATIONS_CATALOG, placeholder: "Buscar medicamento..." },
  { key: "allergies", label: "Alergias", icon: AlertCircle, catalog: ALLERGIES_CATALOG, placeholder: "Buscar alergia..." }
];

export default function PatientProfileTab({ patient, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setForm({
      previous_diseases: patient.previous_diseases || "",
      medical_history: patient.medical_history || "",
      current_medications: patient.current_medications || "",
      allergies: patient.allergies || "",
      notes: patient.notes || ""
    });
    setEditing(true);
  }

  function update(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function save() {
    setSaving(true);
    try {
      await base44.entities.Patient.update(patient.id, form);
      setEditing(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
        {CATEGORY_FIELDS.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.key}>
              <Label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Icon className="h-3.5 w-3.5" /> {f.label}
              </Label>
              <div className="mt-1.5">
                <CategoryPicker
                  value={form[f.key]}
                  onChange={(v) => update(f.key, v)}
                  catalog={f.catalog}
                  placeholder={f.placeholder}
                />
              </div>
            </div>
          );
        })}

        {TEXT_FIELDS.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.key}>
              <Label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Icon className="h-3.5 w-3.5" /> {f.label}
              </Label>
              <Textarea
                value={form[f.key]}
                onChange={(e) => update(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="mt-1 rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                rows={2}
              />
            </div>
          );
        })}

        <div className="flex gap-2">
          <Button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Salvar
          </Button>
          <Button onClick={() => setEditing(false)} variant="outline" className="rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  const allFields = [...CATEGORY_FIELDS, ...TEXT_FIELDS];
  const hasData = allFields.some((f) => patient[f.key]);

  return (
    <div className="space-y-3">
      <Button onClick={startEdit} variant="outline" className="w-full rounded-2xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
        {hasData ? "Editar perfil clínico" : "Preencher perfil clínico"}
      </Button>
      {allFields.map((f) => {
        const Icon = f.icon;
        const value = patient[f.key];
        return (
          <div key={f.key} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-slate-400 dark:text-slate-400" />
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{f.label}</p>
            </div>
            {value ? (
              f.catalog ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {String(value).split(",").map((s) => s.trim()).filter(Boolean).map((item) => (
                    <span key={item} className="rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 px-2 py-0.5 text-xs text-teal-700 dark:text-teal-300">{item}</span>
                  ))}
                </div>
              ) : (
                <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{value}</p>
              )
            ) : (
              <p className="mt-1.5 text-sm text-slate-400 dark:text-slate-600 italic">Não informado</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
