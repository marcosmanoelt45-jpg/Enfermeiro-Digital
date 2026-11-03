import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Pill, Loader2, Trash2, Calculator, Droplet, Save, Beaker, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import DrugPicker from "@/components/DrugPicker";

const CALC_TYPES = [
  { key: "dose", label: "Dose → Volume", icon: Calculator, hint: "Descobrir quantos mL aplicar" },
  { key: "drip", label: "Gotejamento IV", icon: Droplet, hint: "Macro/microgotas por min" },
  { key: "weight_based", label: "Dose por peso", icon: Beaker, hint: "mg/kg → mL" }
];

const CONVERSIONS = [
  "1 kg = 1000 g", "1 g = 1000 mg", "1 mg = 1000 mcg", "1 L = 1000 mL",
  "1% = 1 g em 100 mL", "1 mL = 20 gotas (macro)", "1 mL = 60 microgotas", "1 gota = 3 microgotas"
];

export default function MedicationsTab({ patientId }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calcType, setCalcType] = useState("dose");
  const [showRef, setShowRef] = useState(false);
  const [form, setForm] = useState({
    drug_name: "",
    concentration: "",
    prescribed_dose: "",
    weight: "",
    dose_per_kg: "",
    volume_ml: "",
    time_value: "",
    time_unit: "h",
    micro: false,
    notes: ""
  });
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await base44.entities.MedicationRecord.filter({ patient_id: patientId }, "-created_date", 100);
      setRecords(data || []);
    } catch (err) {
      toast({ variant: "destructive", title: "Erro ao carregar cálculos", description: err?.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [patientId]);

  function update(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function calculate() {
    const c = Number(form.concentration) || 0;
    const dose = Number(form.prescribed_dose) || 0;
    const weight = Number(form.weight) || 0;
    const dosePerKg = Number(form.dose_per_kg) || 0;
    const vol = Number(form.volume_ml) || 0;
    const timeVal = Number(form.time_value) || 0;
    const isMicro = form.micro;
    const isHours = form.time_unit === "h";

    if (calcType === "dose") {
      if (c <= 0) return setResult(null);
      const ml = dose / c;
      setResult({ label: "Volume a administrar", value: `${ml.toFixed(2)} mL`, numeric: ml, drip_rate: 0 });
    } else if (calcType === "drip") {
      if (timeVal <= 0 || vol <= 0) return setResult(null);
      let gtt;
      let formula;
      if (isHours) {
        if (isMicro) {
          gtt = vol / timeVal;
          formula = `${vol} mL ÷ ${timeVal} h = ${Math.round(gtt)} microgotas/min`;
        } else {
          gtt = vol / (timeVal * 3);
          formula = `${vol} mL ÷ (${timeVal} h × 3) = ${Math.round(gtt)} gotas/min`;
        }
      } else {
        const factor = isMicro ? 60 : 20;
        gtt = (vol * factor) / timeVal;
        formula = `(${vol} mL × ${factor}) ÷ ${timeVal} min = ${Math.round(gtt)} ${isMicro ? "microgotas" : "gotas"}/min`;
      }
      setResult({ label: isMicro ? "Microgotas por minuto" : "Gotas por minuto", value: `${Math.round(gtt)} ${isMicro ? "microgtt" : "gtt"}/min`, numeric: Math.round(gtt), drip_rate: Math.round(gtt), formula });
    } else {
      if (weight <= 0 || c <= 0) return setResult(null);
      const totalDose = dosePerKg * weight;
      const ml = totalDose / c;
      setResult({ label: "Volume a administrar", value: `${ml.toFixed(2)} mL (${totalDose.toFixed(2)} mg total)`, numeric: ml, drip_rate: 0 });
    }
  }

  async function save() {
    if (!form.drug_name || !result) return;
    setSaving(true);
    try {
      const payload = {
        patient_id: patientId,
        drug_name: form.drug_name,
        calc_type: calcType,
        concentration: Number(form.concentration) || 0,
        prescribed_dose: Number(form.prescribed_dose) || 0,
        calculated_volume: calcType !== "drip" ? result.numeric : 0,
        weight: Number(form.weight) || 0,
        dose_per_kg: Number(form.dose_per_kg) || 0,
        volume_ml: Number(form.volume_ml) || 0,
        drop_factor: form.micro ? 60 : 20,
        time_min: form.time_unit === "min" ? Number(form.time_value) || 0 : (Number(form.time_value) || 0) * 60,
        drip_rate: calcType === "drip" ? result.numeric : 0,
        notes: form.notes || ""
      };
      await base44.entities.MedicationRecord.create(payload);
      toast({ title: "Cálculo salvo no prontuário" });
      setForm({ drug_name: "", concentration: "", prescribed_dose: "", weight: "", dose_per_kg: "", volume_ml: "", time_value: "", time_unit: "h", micro: false, notes: "" });
      setResult(null);
      load();
    } catch (err) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: err?.message });
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    try {
      await base44.entities.MedicationRecord.delete(id);
      toast({ title: "Registro removido" });
      load();
    } catch (err) {
      toast({ variant: "destructive", title: "Erro ao excluir", description: err?.message });
    }
  }

  return (
    <div className="space-y-4">
      {/* Reference panel */}
      <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-4">
        <button type="button" onClick={() => setShowRef((s) => !s)} className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#20D5B5]" />
            <p className="text-sm font-semibold text-[#EAF2F8]">Referência de Cálculo</p>
          </div>
          <span className="text-xs text-[#9FB3C6]">{showRef ? "ocultar" : "mostrar"}</span>
        </button>
        {showRef && (
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-xl bg-[#0E1722] p-3">
              {CONVERSIONS.map((c, i) => (
                <p key={i} className="text-xs text-[#9FB3C6]">{c}</p>
              ))}
            </div>
            <div className="space-y-1.5 rounded-xl bg-[#20D5B5]/10 border border-[#20D5B5]/20 p-3">
              <p className="text-xs font-semibold text-[#20D5B5]">Fórmulas de Gotejamento</p>
              <div className="space-y-1 text-[11px] text-[#9FB3C6]">
                <p><b>Macro (min):</b> gotas/min = (Volume × 20) ÷ Tempo (min)</p>
                <p><b>Micro (min):</b> microgotas/min = (Volume × 60) ÷ Tempo (min)</p>
                <p><b>Macro (h):</b> gotas/min = Volume ÷ (Tempo (h) × 3)</p>
                <p><b>Micro (h):</b> microgotas/min = Volume ÷ Tempo (h)</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Calculator */}
      <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-4">
        <div className="mb-3 flex items-center gap-2">
          <Pill className="h-4 w-4 text-[#20D5B5]" />
          <p className="text-sm font-semibold text-[#EAF2F8]">Calculadora de Medicamentos</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {CALC_TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                type="button"
                key={t.key}
                onClick={() => { setCalcType(t.key); setResult(null); }}
                className={`rounded-xl border-2 p-3 text-center transition ${
                  calcType === t.key
                    ? "border-[#20D5B5] bg-[#20D5B5]/15"
                    : "border-[#1F3045] bg-[#0E1722]"
                }`}
              >
                <Icon className={`mx-auto h-5 w-5 ${calcType === t.key ? "text-[#20D5B5]" : "text-[#52667A]"}`} />
                <p className="mt-1 text-xs font-medium text-[#EAF2F8]">{t.label}</p>
                <p className="mt-0.5 text-[10px] text-[#9FB3C6]">{t.hint}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <Label className="text-xs text-[#9FB3C6]">Medicamento</Label>
            <DrugPicker
              value={form.drug_name}
              onChange={(name, drug) => {
                update("drug_name", name);
                // A calculadora trabalha em mg: só preenche sozinha concentrações em mg/mL (UI e mEq ficam para o aluno).
                if (drug && drug.concentration && !form.concentration && (!drug.unit || drug.unit === "mg/mL")) update("concentration", String(drug.concentration));
              }}
            />
          </div>

          {calcType === "dose" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-[#9FB3C6]">Concentração (mg/mL)</Label>
                <Input
                  type="number"
                  value={form.concentration}
                  onChange={(e) => update("concentration", e.target.value)}
                  placeholder="500"
                  className="rounded-xl bg-[#0B131D] border-[#27394B] text-[#EAF2F8]"
                />
              </div>
              <div>
                <Label className="text-xs text-[#9FB3C6]">Dose prescrita (mg)</Label>
                <Input
                  type="number"
                  value={form.prescribed_dose}
                  onChange={(e) => update("prescribed_dose", e.target.value)}
                  placeholder="1000"
                  className="rounded-xl bg-[#0B131D] border-[#27394B] text-[#EAF2F8]"
                />
              </div>
            </div>
          )}

          {calcType === "drip" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-[#9FB3C6]">Volume (mL)</Label>
                  <Input
                    type="number"
                    value={form.volume_ml}
                    onChange={(e) => update("volume_ml", e.target.value)}
                    placeholder="500"
                    className="rounded-xl bg-[#0B131D] border-[#27394B] text-[#EAF2F8]"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#9FB3C6]">Tempo</Label>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      value={form.time_value}
                      onChange={(e) => update("time_value", e.target.value)}
                      placeholder="8"
                      className="rounded-xl bg-[#0B131D] border-[#27394B] text-[#EAF2F8]"
                    />
                    <div className="flex shrink-0 rounded-xl border border-[#27394B] bg-[#0B131D] p-0.5">
                      <button
                        type="button"
                        onClick={() => update("time_unit", "h")}
                        className={`rounded-lg px-3 text-sm font-medium ${form.time_unit === "h" ? "bg-[#20D5B5]/20 text-[#20D5B5]" : "text-[#52667A]"}`}
                      >
                        h
                      </button>
                      <button
                        type="button"
                        onClick={() => update("time_unit", "min")}
                        className={`rounded-lg px-3 text-sm font-medium ${form.time_unit === "min" ? "bg-[#20D5B5]/20 text-[#20D5B5]" : "text-[#52667A]"}`}
                      >
                        min
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { update("micro", !form.micro); setResult(null); }}
                className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 transition ${
                  form.micro
                    ? "border-sky-500 bg-sky-500/15"
                    : "border-[#1F3045] bg-[#0E1722]"
                }`}
              >
                <Droplet className={`h-5 w-5 ${form.micro ? "text-sky-400" : "text-[#52667A]"}`} />
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-[#EAF2F8]">Equipo de microgotas</p>
                  <p className="text-[11px] text-[#9FB3C6]">{form.micro ? "60 gtt/mL" : "20 gtt/mL (macrogotas)"}</p>
                </div>
                <div className={`h-6 w-11 rounded-full p-0.5 transition ${form.micro ? "bg-sky-500" : "bg-[#1F3045]"}`}>
                  <div className={`h-5 w-5 rounded-full bg-white transition ${form.micro ? "translate-x-5" : ""}`} />
                </div>
              </button>
            </>
          )}

          {calcType === "weight_based" && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-[#9FB3C6]">Peso (kg)</Label>
                <Input
                  type="number"
                  value={form.weight}
                  onChange={(e) => update("weight", e.target.value)}
                  placeholder="70"
                  className="rounded-xl bg-[#0B131D] border-[#27394B] text-[#EAF2F8]"
                />
              </div>
              <div>
                <Label className="text-xs text-[#9FB3C6]">Dose (mg/kg)</Label>
                <Input
                  type="number"
                  value={form.dose_per_kg}
                  onChange={(e) => update("dose_per_kg", e.target.value)}
                  placeholder="5"
                  className="rounded-xl bg-[#0B131D] border-[#27394B] text-[#EAF2F8]"
                />
              </div>
              <div>
                <Label className="text-xs text-[#9FB3C6]">Concentração (mg/mL)</Label>
                <Input
                  type="number"
                  value={form.concentration}
                  onChange={(e) => update("concentration", e.target.value)}
                  placeholder="10"
                  className="rounded-xl bg-[#0B131D] border-[#27394B] text-[#EAF2F8]"
                />
              </div>
            </div>
          )}

          <Textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Observações (via, diluente, frequência...)"
            className="rounded-xl bg-[#0B131D] border-[#27394B] text-[#EAF2F8]"
            rows={2}
          />

          <div className="flex gap-2">
            <Button onClick={calculate} variant="outline" className="flex-1 rounded-xl">
              <Calculator className="mr-2 h-4 w-4" /> Calcular
            </Button>
            <Button onClick={save} disabled={!form.drug_name || !result || saving} className="flex-1 rounded-xl">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar no prontuário
            </Button>
          </div>

          {result && (
            <div className="rounded-xl border border-[#20D5B5]/30 bg-[#20D5B5]/10 p-3 text-center">
              <p className="text-xs uppercase tracking-wide text-[#20D5B5]">{result.label}</p>
              <p className="text-2xl font-semibold text-[#EAF2F8]">{result.value}</p>
              {result.formula && <p className="mt-1 text-[11px] text-[#20D5B5]">{result.formula}</p>}
            </div>
          )}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9FB3C6]">Cálculos salvos ({records.length})</p>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-[#20D5B5]" /></div>
        ) : records.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#1F3045] bg-[#131F2E] p-6 text-center text-sm text-[#52667A]">
            Nenhum cálculo salvo.
          </div>
        ) : (
          <div className="space-y-2">
            {records.map((r) => (
              <div key={r.id} className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#20D5B5]/15 text-[#20D5B5]">
                    <Pill className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#EAF2F8]">{r.drug_name}</p>
                    <p className="text-xs text-[#9FB3C6]">
                      {r.calc_type === "dose" && `Volume: ${r.calculated_volume?.toFixed(2)} mL`}
                      {r.calc_type === "drip" && `Gotejamento: ${r.drip_rate} ${r.drop_factor === 60 ? "microgotas" : "gotas"}/min`}
                      {r.calc_type === "weight_based" && `Volume: ${r.calculated_volume?.toFixed(2)} mL`}
                      {" · "}{new Date(r.created_date || r.created_at).toLocaleString("pt-BR")}
                    </p>
                    {r.notes && <p className="mt-1 text-xs text-[#52667A]">{r.notes}</p>}
                  </div>
                  <button
                    type="button"
                    aria-label="Excluir cálculo"
                    onClick={() => remove(r.id)}
                    className="shrink-0 rounded-lg p-1.5 text-[#52667A] hover:bg-red-500/10 hover:text-[#FF6B6B]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
