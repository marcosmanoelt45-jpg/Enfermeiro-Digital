import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Home, Loader2, Plus, Trash2, Save, FileCheck2, AlertTriangle, Pill, Stethoscope, Calendar, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const DESTINATIONS = {
  domicilio: { label: "Domicílio", icon: Home },
  transferencia: { label: "Transferência", icon: Stethoscope },
  hospice: { label: "Hospice / Cuidados paliativos", icon: FileCheck2 },
  obito: { label: "Óbito", icon: AlertTriangle }
};

export default function DischargeTab({ patientId }) {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function deleteCase() {
    setDeleting(true);
    try {
      await Promise.all([
        base44.entities.Assessment.deleteMany({ patient_id: patientId }).catch(() => {}),
        base44.entities.NursingDiagnosis.deleteMany({ patient_id: patientId }).catch(() => {}),
        base44.entities.MedicationRecord.deleteMany({ patient_id: patientId }).catch(() => {}),
        base44.entities.Evolution.deleteMany({ patient_id: patientId }).catch(() => {}),
        base44.entities.DischargePlan.deleteMany({ patient_id: patientId }).catch(() => {}),
      ]);
      await base44.entities.Patient.delete(patientId);
      navigate("/");
    } finally {
      setDeleting(false);
    }
  }

  const blank = {
    discharge_date: new Date().toISOString().slice(0, 10),
    destination: "domicilio",
    conditions: "",
    medications: [],
    care_instructions: [],
    warning_signs: [],
    follow_up: "",
    responsible_nurse: "",
    status: "rascunho",
    notes: ""
  };
  const [form, setForm] = useState(blank);

  async function load() {
    setLoading(true);
    try {
      const data = await base44.entities.DischargePlan.filter({ patient_id: patientId }, "-created_date", 20);
      setPlans(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [patientId]);

  function update(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function startNew() {
    setForm(blank);
    setEditing("new");
  }

  function startEdit(p) {
    setForm({ ...blank, ...p, discharge_date: p.discharge_date ? p.discharge_date.slice(0, 10) : "" });
    setEditing(p.id);
  }

  function listField(key, label, _placeholder) {
    const items = form[key] || [];
    return (
      <div>
        <Label className="text-xs text-slate-500 dark:text-slate-400">{label}</Label>
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={item}
                onChange={(e) => {
                  const next = [...items]; next[i] = e.target.value; update(key, next);
                }}
                className="rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
              <button
                onClick={() => update(key, items.filter((_, idx) => idx !== i))}
                className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            onClick={() => update(key, [...items, ""])}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 py-1.5 text-xs text-slate-400 hover:border-teal-300 dark:hover:border-teal-700 hover:text-teal-600 dark:hover:text-teal-400"
          >
            <Plus className="h-3 w-3" /> Adicionar
          </button>
        </div>
      </div>
    );
  }

  async function save() {
    setSaving(true);
    try {
      const payload = { ...form, patient_id: patientId };
      if (editing === "new") {
        await base44.entities.DischargePlan.create(payload);
      } else {
        await base44.entities.DischargePlan.update(editing, payload);
      }
      setEditing(null);
      setForm(blank);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    await base44.entities.DischargePlan.delete(id);
    load();
  }

  if (editing) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{editing === "new" ? "Novo Plano de Alta" : "Editar Plano de Alta"}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500 dark:text-slate-400">Data da alta</Label>
              <Input
                type="date"
                value={form.discharge_date}
                onChange={(e) => update("discharge_date", e.target.value)}
                className="rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500 dark:text-slate-400">Destino</Label>
              <select
                value={form.destination}
                onChange={(e) => update("destination", e.target.value)}
                className="h-9 w-full rounded-xl border border-input bg-transparent dark:bg-slate-800 dark:border-slate-700 text-slate-800 dark:text-slate-100 px-3 text-sm"
              >
                {Object.entries(DESTINATIONS).map(([k, v]) => (
                  <option key={k} value={k} className="dark:bg-slate-800 dark:text-slate-100">
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label className="text-xs text-slate-500 dark:text-slate-400">Condições clínicas na alta</Label>
            <Textarea
              value={form.conditions}
              onChange={(e) => update("conditions", e.target.value)}
              placeholder="Estado clínico, diagnósticos de internação, evolução..."
              className="rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              rows={2}
            />
          </div>

          {listField("medications", "Medicações de uso domiciliar")}
          {listField("care_instructions", "Orientações de cuidado")}
          {listField("warning_signs", "Sinais de alerta para retorno")}

          <div>
            <Label className="text-xs text-slate-500 dark:text-slate-400">Retorno / Ambulatório</Label>
            <Input
              value={form.follow_up}
              onChange={(e) => update("follow_up", e.target.value)}
              placeholder="Ex: Retorno em 7 dias com cardiologia"
              className="rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500 dark:text-slate-400">Enfermeiro responsável</Label>
              <Input
                value={form.responsible_nurse}
                onChange={(e) => update("responsible_nurse", e.target.value)}
                placeholder="Nome / COREN"
                className="rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500 dark:text-slate-400">Status</Label>
              <select
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
                className="h-9 w-full rounded-xl border border-input bg-transparent dark:bg-slate-800 dark:border-slate-700 text-slate-800 dark:text-slate-100 px-3 text-sm"
              >
                <option value="rascunho" className="dark:bg-slate-800 dark:text-slate-100">Rascunho</option>
                <option value="ativa" className="dark:bg-slate-800 dark:text-slate-100">Ativa</option>
                <option value="concluida" className="dark:bg-slate-800 dark:text-slate-100">Concluída</option>
              </select>
            </div>
          </div>

          <div>
            <Label className="text-xs text-slate-500 dark:text-slate-400">Observações</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Anotações adicionais"
              className="rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Salvar plano
            </Button>
            <Button onClick={() => { setEditing(null); setForm(blank); }} variant="outline" className="rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button onClick={startNew} className="w-full rounded-2xl bg-teal-600 py-5 hover:bg-teal-700 text-white">
        <Plus className="mr-2 h-5 w-5" /> Novo Plano de Alta
      </Button>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Planos de Alta ({plans.length})</p>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
        ) : plans.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center text-sm text-slate-400">
            Nenhum plano de alta registrado.
          </div>
        ) : (
          <div className="space-y-2">
            {plans.map((p) => {
              const DestIcon = DESTINATIONS[p.destination]?.icon || Home;
              return (
                <div key={p.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400">
                      <DestIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{DESTINATIONS[p.destination]?.label || "Alta"}</p>
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${p.status === "concluida" ? "bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300" : p.status === "ativa" ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                          {p.status}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-400">
                        <Calendar className="mr-1 inline h-3 w-3" />
                        {p.discharge_date ? new Date(p.discharge_date).toLocaleDateString("pt-BR") : "—"}
                        {p.responsible_nurse && ` · ${p.responsible_nurse}`}
                      </p>
                      {p.conditions && <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{p.conditions}</p>}
                      {(p.medications?.length > 0 || p.care_instructions?.length > 0 || p.warning_signs?.length > 0) && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {p.medications?.length > 0 && <span className="inline-flex items-center gap-0.5 rounded bg-sky-50 dark:bg-sky-950/50 px-1.5 py-0.5 text-[10px] text-sky-700 dark:text-sky-300"><Pill className="h-2.5 w-2.5" />{p.medications.length} meds</span>}
                          {p.care_instructions?.length > 0 && <span className="rounded bg-teal-50 dark:bg-teal-950/50 px-1.5 py-0.5 text-[10px] text-teal-700 dark:text-teal-300">{p.care_instructions.length} orientações</span>}
                          {p.warning_signs?.length > 0 && <span className="inline-flex items-center gap-0.5 rounded bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 text-[10px] text-amber-700 dark:text-amber-300"><AlertTriangle className="h-2.5 w-2.5" />{p.warning_signs.length} alertas</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button onClick={() => startEdit(p)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200">
                        <FileCheck2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => remove(p.id)} className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <UserX className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800">Remover caso de estudo</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Exclui permanentemente este paciente simulado e todos os dados vinculados (avaliações, diagnósticos, medicamentos, evoluções e planos de alta).
            </p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="mt-3 w-full rounded-xl" disabled={deleting}>
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Remover caso
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover este caso de estudo?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Todos os registros vinculados a este paciente simulado serão apagados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={deleteCase} className="bg-red-600 hover:bg-red-700">
                Sim, remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
