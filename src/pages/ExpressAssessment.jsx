import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ASSESSMENT_STEPS,
  DEFAULT_ASSESSMENT_DATA,
  AssessmentStepNav,
  AssessmentRiskBanner,
  AssessmentStepContent,
} from "@/components/AssessmentSteps";

export default function ExpressAssessment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(DEFAULT_ASSESSMENT_DATA);

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  async function handleSave() {
    setSaving(true);
    try {
      const res = await base44.functions.invoke("saveAssessment", { patient_id: id, data });
      const assessmentId = res?.data?.assessment_id || res?.assessment_id || res?.id;
      if (assessmentId) {
        navigate(`/assessment/${assessmentId}/ai`);
        return;
      }
    } catch (e) {
      console.error("Erro ao salvar avaliação:", e);
    } finally {
      setSaving(false);
    }
  }

  const next = () => setStep((s) => Math.min(s + 1, ASSESSMENT_STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-base font-semibold text-slate-800">Avaliação Express</h1>
          </div>
          <AssessmentStepNav step={step} setStep={setStep} />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4 pb-28">
        <AssessmentRiskBanner data={data} />
        <AssessmentStepContent data={data} set={set} step={step} />
      </main>

      <footer className="fixed bottom-0 inset-x-0 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3 flex gap-3">
          <Button variant="outline" onClick={prev} disabled={step === 0} className="flex-1 rounded-xl py-5">Anterior</Button>
          {step < ASSESSMENT_STEPS.length - 1 ? (
            <Button onClick={next} className="flex-1 rounded-xl bg-teal-600 py-5 hover:bg-teal-700">Próximo</Button>
          ) : (
            <Button onClick={handleSave} disabled={saving} className="flex-1 rounded-xl bg-teal-600 py-5 hover:bg-teal-700">
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Check className="mr-2 h-5 w-5" /> Salvar e Gerar Plano IA</>}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
