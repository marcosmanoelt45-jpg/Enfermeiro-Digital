import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Home, Loader2, Plus, Trash2, Save, FileCheck2, AlertTriangle, Pill, Stethoscope, Calendar, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
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

const EDITABLE_FIELDS = [
  "discharge_date",
  "destination",
  "conditions",
  "medications",
  "care_instructions",
  "warning_signs",
  "follow_up",
  "responsible_nurse",
  "status",
  "notes"
];

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
      toast({ title: "Caso removido com sucesso" });
      navigate("/");
    } catch (err) {
      toast({ variant: "destructive", title: "Erro ao remover caso", description: err?.message });
    } finally {
      setDeleting(false);
    }
  }

  const blank = {
    discharge_date: new Date().toLocaleDateString("en-CA"),
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
      setPlans(data || []);
    } catch (err) {
      toast({ variant: "destructive", title: "Erro ao carregar planos", description: err?.message });
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
    setForm({
      ...blank,
      ...p,
      discharge_date: p.discharge_date ? p.discharge_date.slice(0, 10) : new Date().toLocaleDateString("en-CA")
    });
    setEditing(p.id);
  }

  function listField(key, label, _placeholder) {
    const items = form[key] || [];
    return (
      <div>
        <Label className="text-xs text-[#9FB3C6]">{label}</Label>
        <div className="space-y-1.5 mt-1">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={item}
                onChange={(e) => {
                  const next = [...items]; next[i] = e.target.value; update(key, next);
                }}
                className="rounded-lg bg-[#0B131D] border-[#27394B] text-[#EAF2F8]"
              />
              <button
                type="button"
                aria-label={`Remover item ${i + 1}`}
                onClick={() => update(key, items.filter((_, idx) => idx !== i))}
                className="shrink-0 rounded-lg p-1.5 text-[#8A9DB1] hover:text-[#FF6B6B]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => update(key, [...items, ""])}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#1F3045] py-1.5 text-xs text-[#9FB3C6] hover:border-[#20D5B5]/40 hover:text-[#20D5B5]"
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
      const payload = Object.fromEntries(EDITABLE_FIELDS.map((k) => [k, form[k]]));
      payload.patient_id = patientId;

      if (editing === "new") {
        await base44.entities.DischargePlan.create(payload);
        toast({ title: "Plano de alta criado com sucesso" });
      } else {
        await base44.entities.DischargePlan.update(editing, payload);
        toast({ title: "Plano de alta atualizado com sucesso" });
      }
      setEditing(null);
      setForm(blank);
      load();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Não foi possível salvar o plano",
        description: err?.message || "Tente novamente."
      });
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    try {
      await base44.entities.DischargePlan.delete(id);
      toast({ title: "Plano de alta removido" });
      load();
    } catch (err) {
      toast({ variant: "destructive", title: "Erro ao remover plano", description: err?.message });
    }
  }

  if (editing) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-4 space-y-4">
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-[#20D5B5]" />
            <p className="text-sm font-semibold text-[#EAF2F8]">{editing === "new" ? "Novo Plano de Alta" : "Editar Plano de Alta"}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-[#9FB3C6]">Data da alta</Label>
              <Input
                type="date"
                value={form.discharge_date}
                onChange={(e) => update("discharge_date", e.target.value)}
                className="rounded-xl bg-[#0B131D] border-[#27394B] text-[#EAF2F8]"
              />
            </div>
            <div>
              <Label className="text-xs text-[#9FB3C6]">Destino</Label>
              <select
                value={form.destination}
                onChange={(e) => update("destination", e.target.value)}
                className="h-9 w-full rounded-xl border border-[#27394B] bg-[#0B131D] text-[#EAF2F8] px-3 text-sm focus:ring-1 focus:ring-[#20D5B5]"
              >
                {Object.entries(DESTINATIONS).map(([k, v]) => (
                  <option key={k} value={k} className="bg-[#131F2E] text-[#EAF2F8]">
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label className="text-xs text-[#9FB3C6]">Condições clínicas na alta</Label>
            <Textarea
              value={form.conditions}
              onChange={(e) => update("conditions", e.target.value)}
              placeholder="Estado clínico, diagnósticos de internação, evolução..."
              className="rounded-xl bg-[#0B131D] border-[#27394B] text-[#EAF2F8]"
              rows={2}
            />
          </div>

          {listField("medications", "Medicações de uso domiciliar")}
          {listField("care_instructions", "Orientações de cuidado")}
          {listField("warning_signs", "Sinais de alerta para retorno")}

          <div>
            <Label className="text-xs text-[#9FB3C6]">Retorno / Ambulatório</Label>
            <Input
              value={form.follow_up}
              onChange={(e) => update("follow_up", e.target.value)}
              placeholder="Ex: Retorno em 7 dias com cardiologia"
              className="rounded-xl bg-[#0B131D] border-[#27394B] text-[#EAF2F8]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-[#9FB3C6]">Enfermeiro responsável</Label>
              <Input
                value={form.responsible_nurse}
                onChange={(e) => update("responsible_nurse", e.target.value)}
                placeholder="Nome / COREN"
                className="rounded-xl bg-[#0B131D] border-[#27394B] text-[#EAF2F8]"
              />
            </div>
            <div>
              <Label className="text-xs text-[#9FB3C6]">Status</Label>
              <select
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
                className="h-9 w-full rounded-xl border border-[#27394B] bg-[#0B131D] text-[#EAF2F8] px-3 text-sm focus:ring-1 focus:ring-[#20D5B5]"
              >
                <option value="rascunho" className="bg-[#131F2E] text-[#EAF2F8]">Rascunho</option>
                <option value="ativa" className="bg-[#131F2E] text-[#EAF2F8]">Ativa</option>
                <option value="concluida" className="bg-[#131F2E] text-[#EAF2F8]">Concluída</option>
              </select>
            </div>
          </div>

          <div>
            <Label className="text-xs text-[#9FB3C6]">Observações</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Anotações adicionais"
              className="rounded-xl bg-[#0B131D] border-[#27394B] text-[#EAF2F8]"
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={save} disabled={saving} className="flex-1 rounded-xl">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Salvar plano
            </Button>
            <Button onClick={() => { setEditing(null); setForm(blank); }} variant="outline" className="rounded-xl">
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button onClick={startNew} className="w-full rounded-2xl py-5">
        <Plus className="mr-2 h-5 w-5" /> Novo Plano de Alta
      </Button>

      <div>
        <p className="mb-2 text-xs font-semibold text-[#9FB3C6]">Planos de Alta ({plans.length})</p>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-[#8A9DB1]" /></div>
        ) : plans.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#1F3045] bg-[#131F2E] p-6 text-center text-sm text-[#8A9DB1]">
            Nenhum plano de alta registrado.
          </div>
        ) : (
          <div className="space-y-2">
            {plans.map((p) => {
              const DestIcon = DESTINATIONS[p.destination]?.icon || Home;
              return (
                <div key={p.id} className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#20D5B5]/15 text-[#20D5B5]">
                      <DestIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[#EAF2F8]">{DESTINATIONS[p.destination]?.label || "Alta"}</p>
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${p.status === "concluida" ? "bg-[#20D5B5]/20 text-[#20D5B5]" : p.status === "ativa" ? "bg-[#FFC247]/20 text-[#FFC247]" : "bg-[#1F3045] text-[#9FB3C6]"}`}>
                          {p.status}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-[#9FB3C6]">
                        <Calendar className="mr-1 inline h-3 w-3" />
                        {p.discharge_date ? p.discharge_date.slice(0, 10).split("-").reverse().join("/") : "—"}
                        {p.responsible_nurse && ` · ${p.responsible_nurse}`}
                      </p>
                      {p.conditions && <p className="mt-1 text-xs text-[#9FB3C6] line-clamp-2">{p.conditions}</p>}
                      {(p.medications?.length > 0 || p.care_instructions?.length > 0 || p.warning_signs?.length > 0) && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {p.medications?.length > 0 && <span className="inline-flex items-center gap-0.5 rounded bg-sky-500/15 border border-sky-500/30 px-1.5 py-0.5 text-[10px] text-sky-400"><Pill className="h-2.5 w-2.5" />{p.medications.length} meds</span>}
                          {p.care_instructions?.length > 0 && <span className="rounded bg-[#20D5B5]/15 border border-[#20D5B5]/30 px-1.5 py-0.5 text-[10px] text-[#20D5B5]">{p.care_instructions.length} orientações</span>}
                          {p.warning_signs?.length > 0 && <span className="inline-flex items-center gap-0.5 rounded bg-[#FFC247]/15 border border-[#FFC247]/30 px-1.5 py-0.5 text-[10px] text-[#FFC247]"><AlertTriangle className="h-2.5 w-2.5" />{p.warning_signs.length} alertas</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        aria-label="Editar plano de alta"
                        onClick={() => startEdit(p)}
                        className="rounded-lg p-1.5 text-[#9FB3C6] hover:bg-[#16222E] hover:text-[#EAF2F8]"
                      >
                        <FileCheck2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Excluir plano de alta"
                        onClick={() => remove(p.id)}
                        className="rounded-lg p-1.5 text-[#8A9DB1] hover:bg-red-500/10 hover:text-[#FF6B6B]"
                      >
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

      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-[#FF6B6B]">
            <UserX className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#FF6B6B]">Remover caso de estudo</p>
            <p className="mt-0.5 text-xs text-[#9FB3C6]">
              Exclui permanentemente este paciente simulado e todos os dados vinculados (avaliações, diagnósticos, medicamentos, evoluções e planos de alta).
            </p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="danger" className="mt-3 w-full rounded-xl" disabled={deleting}>
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Remover caso
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-[#131F2E] border-[#1F3045] text-[#EAF2F8]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[#EAF2F8]">Remover este caso de estudo?</AlertDialogTitle>
              <AlertDialogDescription className="text-[#9FB3C6]">
                Esta ação não pode ser desfeita. Todos os registros vinculados a este paciente simulado serão apagados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-[#1F3045] bg-[#0E1722] text-[#9FB3C6] hover:bg-[#16222E]">Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={deleteCase} className="bg-[#FF6B6B] hover:bg-[#FF6B6B]/80 text-white">
                Sim, remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
