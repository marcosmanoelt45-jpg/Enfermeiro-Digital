import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Save, FileText, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function PreviousAnamnesisTab({ patient, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setValue(patient.previous_anamnesis || "");
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    try {
      await base44.entities.Patient.update(patient.id, { previous_anamnesis: value });
      setEditing(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-teal-600" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Anamnese prévia (repasse)</p>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Cole ou descreva aqui as informações repassadas por outro hospital, clínica ou serviço de saúde. Este conteúdo é preservado e enviado à IA na geração dos diagnósticos.
        </p>
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={"Ex: Paciente encaminhado do Hospital X com quadro de...\n\nQueixa principal:\nHistória da doença atual:\nAntecedentes:\nMedicações em uso:\nAlergias:\nExames relevantes:\nConduta anterior:"}
          className="rounded-xl min-h-[280px] text-sm leading-relaxed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
        />
        <div className="flex gap-2">
          <Button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Salvar anamnese
          </Button>
          <Button onClick={() => setEditing(false)} variant="outline" className="rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">Cancelar</Button>
        </div>
      </div>
    );
  }

  const hasData = Boolean(patient.previous_anamnesis);

  return (
    <div className="space-y-3">
      <Button onClick={startEdit} variant="outline" className="w-full rounded-2xl border-teal-300 dark:border-teal-700/60 bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40">
        {hasData ? "Editar anamnese prévia" : "Adicionar anamnese prévia"}
      </Button>
      {hasData ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-400" />
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Repasse de outro serviço</p>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{patient.previous_anamnesis}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Nenhuma anamnese prévia registrada. Adicione o repasse recebido de outro serviço para que a IA considere esses dados nos diagnósticos.
        </div>
      )}
    </div>
  );
}
