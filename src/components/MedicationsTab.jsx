import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Pill, Loader2, Trash2, Calculator, Droplet, Save, Beaker, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
      setRecords(data);
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
      setForm({ drug_name: "", concentration: "", prescribed_dose: "", weight: "", dose_per_kg: "", volume_ml: "", time_value: "", time_unit: "h", micro: false, notes: "" });
      setResult(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    await base44.entities.MedicationRecord.delete(id);
    load();
  }

  return (
    <div className="space-y-4">
      {/* Reference panel */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <button onClick={() => setShowRef((s) => !s)} className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Referência de Cálculo</p>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-400">{showRef ? "ocultar" : "mostrar"}</span>
        </button>
        {showRef && (
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 p-3">
              {CONVERSIONS.map((c, i) => (
                <p key={i} className="text-xs text-slate-600 dark:text-slate-300">{c}</p>
              ))}
            </div>
            <div className="space-y-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 p-3">
              <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">Fórmulas de Gotejamento</p>
              <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
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
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Pill className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Calculadora de Medicamentos</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {CALC_TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => { setCalcType(t.key); setResult(null); }}
                className={`rounded-xl border-2 p-3 text-center transition ${
                  calcType === t.key
                    ? "border-teal-500 bg-teal-50 dark:bg-teal-950/50"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60"
                }`}
              >
                <Icon className={`mx-auto h-5 w-5 ${calcType === t.key ? "text-teal-600 dark:text-teal-400" : "text-slate-400 dark:text-slate-400"}`} />
                <p className="mt-1 text-xs font-medium text-slate-700 dark:text-slate-200">{t.label}</p>
                <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-400">{t.hint}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <Label className="text-xs text-slate-500 dark:text-slate-400">Medicamento</Label>
            <DrugPicker
              value={form.drug_name}
              onChange={(name, drug) => {
                update("drug_name", name);
                if (drug && drug.concentration && !form.concentration) update("concentration", String(drug.concentration));
              }}
            />
          </div>

          {calcType === "dose" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-500 dark:text-slate-400">Concentração (mg/mL)</Label>
                <Input
                  type="number"
                  value={form.concentration}
                  onChange={(e) => update("concentration", e.target.value)}
                  placeholder="500"
                  className="rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-500 dark:text-slate-400">Dose prescrita (mg)</Label>
                <Input
                  type="number"
                  value={form.prescribed_dose}
                  onChange={(e) => update("prescribed_dose", e.target.value)}
                  placeholder="1000"
                  className="rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                />
              </div>
            </div>
          )}

          {calcType === "drip" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-500 dark:text-slate-400">Volume (mL)</Label>
                  <Input
                    type="number"
                    value={form.volume_ml}
                    onChange={(e) => update("volume_ml", e.target.value)}
                    placeholder="500"
                    className="rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500 dark:text-slate-400">Tempo</Label>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      value={form.time_value}
                      onChange={(e) => update("time_value", e.target.value)}
                      placeholder="8"
                      className="rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                    />
                    <div className="flex shrink-0 rounded-xl border border-slate-200 dark:border-slate-700 p-0.5">
                      <button
                        onClick={() => update("time_unit", "h")}
                        className={`rounded-lg px-3 text-sm font-medium ${form.time_unit === "h" ? "bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300" : "text-slate-400 dark:text-slate-400"}`}
                      >
                        h
                      </button>
                      <button
                        onClick={() => update("time_unit", "min")}
                        className={`rounded-lg px-3 text-sm font-medium ${form.time_unit === "min" ? "bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300" : "text-slate-400 dark:text-slate-400"}`}
                      >
                        min
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => { update("micro", !form.micro); setResult(null); }}
                className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 transition ${
                  form.micro
                    ? "border-sky-500 bg-sky-50 dark:bg-sky-950/40"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60"
                }`}
              >
                <Droplet className={`h-5 w-5 ${form.micro ? "text-sky-600 dark:text-sky-400" : "text-slate-400"}`} />
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Equipo de microgotas</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-400">{form.micro ? "60 gtt/mL" : "20 gtt/mL (macrogotas)"}</p>
                </div>
                <div className={`h-6 w-11 rounded-full p-0.5 transition ${form.micro ? "bg-sky-500" : "bg-slate-200 dark:bg-slate-700"}`}>
                  <div className={`h-5 w-5 rounded-full bg-white transition ${form.micro ? "translate-x-5" : ""}`} />
                </div>
              </button>
            </>
          )}

          {calcType === "weight_based" && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-slate-500 dark:text-slate-400">Peso (kg)</Label>
                <Input
                  type="number"
                  value={form.weight}
                  onChange={(e) => update("weight", e.target.value)}
                  placeholder="70"
                  className="rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-500 dark:text-slate-400">Dose (mg/kg)</Label>
                <Input
                  type="number"
                  value={form.dose_per_kg}
                  onChange={(e) => update("dose_per_kg", e.target.value)}
                  placeholder="5"
                  className="rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-500 dark:text-slate-400">Concentração (mg/mL)</Label>
                <Input
                  type="number"
                  value={form.concentration}
                  onChange={(e) => update("concentration", e.target.value)}
                  placeholder="10"
                  className="rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                />
              </div>
            </div>
          )}

          <Textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Observações (via, diluente, frequência...)"
            className="rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            rows={2}
          />

          <div className="flex gap-2">
            <Button onClick={calculate} variant="outline" className="flex-1 rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              <Calculator className="mr-2 h-4 w-4" /> Calcular
            </Button>
            <Button onClick={save} disabled={!form.drug_name || !result || saving} className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar no prontuário
            </Button>
          </div>

          {result && (
            <div className="rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/40 p-3 text-center">
              <p className="text-xs uppercase tracking-wide text-teal-600 dark:text-teal-400">{result.label}</p>
              <p className="text-2xl font-semibold text-teal-800 dark:text-teal-200">{result.value}</p>
              {result.formula && <p className="mt-1 text-[11px] text-teal-600 dark:text-teal-400">{result.formula}</p>}
            </div>
          )}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Cálculos salvos ({records.length})</p>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
        ) : records.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center text-sm text-slate-400">
            Nenhum cálculo salvo.
          </div>
        ) : (
          <div className="space-y-2">
            {records.map((r) => (
              <div key={r.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400">
                    <Pill className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{r.drug_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {r.calc_type === "dose" && `Volume: ${r.calculated_volume?.toFixed(2)} mL`}
                      {r.calc_type === "drip" && `Gotejamento: ${r.drip_rate} gtt/min`}
                      {r.calc_type === "weight_based" && `Volume: ${r.calculated_volume?.toFixed(2)} mL`}
                      {" · "}{new Date(r.created_date).toLocaleString("pt-BR")}
                    </p>
                    {r.notes && <p className="mt-1 text-xs text-slate-400 dark:text-slate-400">{r.notes}</p>}
                  </div>
                  <button onClick={() => remove(r.id)} className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-500">
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
