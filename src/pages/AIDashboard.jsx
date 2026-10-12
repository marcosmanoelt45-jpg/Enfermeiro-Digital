import React, { useState, useEffect, useRef } from "react";
import { assessmentService, patientService, diagnosisService, aiService } from "@/services";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Sparkles, AlertCircle, HeartPulse, ClipboardCheck, BrainCircuit, Footprints, Wine, Activity, RefreshCw, BookPlus, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import RiskBadge from "@/components/RiskBadge";
import DiagnosisCard from "@/components/DiagnosisCard";
import { SOURCES } from "@/lib/sources";

export default function AIDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const pollRef = useRef(null);

  async function loadAssessment() {
    const a = await assessmentService.get(id);
    setAssessment(a);
    if (a.patient_id) {
      try { setPatient(await patientService.get(a.patient_id)); } catch {}
    }
    if (a.ai_response) setPlan(a.ai_response);
    return a;
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const a = await loadAssessment();
        // Polling em background se a IA ainda estiver processando
        if (a.ai_status === "pending" || (!a.ai_status && !a.ai_response)) {
          pollRef.current = setInterval(async () => {
            try {
              const fresh = await assessmentService.get(id);
              setAssessment(fresh);
              if (fresh.ai_response) setPlan(fresh.ai_response);
              if (fresh.ai_status !== "pending") {
                clearInterval(pollRef.current);
                pollRef.current = null;
              }
            } catch {}
          }, 4000);
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [id]);

  async function regenerate() {
    setAssessment((a) => ({ ...a, ai_status: "pending" }));
    setPlan(null);
    try {
      const generated = await aiService.invokeCarePlanSync(id);
      const fresh = await assessmentService.get(id);
      setAssessment(fresh);
      if (fresh.ai_response || generated) setPlan(fresh.ai_response || generated);
    } catch (e) {
      setAssessment((a) => ({ ...a, ai_status: "error" }));
    }
  }

  async function importDiagnoses() {
    if (!plan?.diagnosticos?.length || !assessment?.patient_id) return;
    setImporting(true);
    try {
      const records = plan.diagnosticos.map((d) => ({
        patient_id: assessment.patient_id,
        code: d.code || "",
        title: d.title || "",
        domain: d.domain || "",
        class: d.class || "",
        status: "ativo",
        source_link: SOURCES.nanda.url,
        defining_characteristics: d.defining_characteristics || [],
        related_factors: d.related_factors || [],
        interventions: d.interventions || [],
        outcomes: d.outcomes || [],
        assessment_id: id
      }));
      await diagnosisService.bulkCreate(records);
      setImported(true);
    } finally {
      setImporting(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div>;
  if (!assessment) return <div className="py-20 text-center text-slate-400">Avaliação não encontrada</div>;

  const diagnoses = plan?.diagnosticos || [];
  const isPending = assessment.ai_status === "pending" || (!assessment.ai_status && !plan);
  const isError = assessment.ai_status === "error";

  const vitals = [
    { label: "PA", value: `${assessment.pa_sistolica}/${assessment.pa_diastolica}`, icon: HeartPulse },
    { label: "FC", value: `${assessment.fc}`, icon: HeartPulse },
    { label: "FR", value: `${assessment.fr}`, icon: HeartPulse },
    { label: "TAX", value: `${assessment.tax}°`, icon: HeartPulse },
    { label: "Sat", value: `${assessment.sat}%`, icon: HeartPulse },
    { label: "BRADEN", value: assessment.braden_total, icon: ClipboardCheck },
    { label: "CAM", value: assessment.cam_positive ? "Pos" : "Neg", icon: BrainCircuit },
    { label: "AUDIT", value: assessment.audit_total, icon: Wine },
    { label: "SAK", value: assessment.sak_score, icon: Footprints },
    { label: "CALOI", value: `${assessment.caloi_score}/10`, icon: Activity }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/patient/${assessment.patient_id}`)} className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-semibold text-slate-800">Plano de Cuidados IA</h1>
              <p className="text-xs text-slate-400">{patient?.name} · {new Date(assessment.created_date).toLocaleString("pt-BR")}</p>
            </div>
            <RiskBadge status={assessment.risk_status} size="sm" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4 space-y-4">
        {/* Banner Mandatório Human-in-the-Loop & Blindagem LGPD */}
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/80 p-3.5 text-xs text-blue-900 shadow-sm">
          <ShieldAlert className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-blue-950">Sistema de Apoio à Decisão Clínica (SADC) · Supervisão Obrigatória</p>
            <p className="text-blue-800 leading-relaxed">
              Sugestão de diagnósticos fundamentada na taxonomia NANDA-I, NIC e NOC. Em conformidade com a Resolução CFM nº 2.454/2026 e COFEN nº 736/2024, estes dados foram previamente desidentificados e não substituem o julgamento clínico autônomo do profissional de enfermagem.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {vitals.map((v) => {
            const Icon = v.icon;
            return (
              <div key={v.label} className="rounded-xl border border-slate-200 bg-white p-2 text-center">
                <Icon className="mx-auto h-3.5 w-3.5 text-slate-400" />
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">{v.label}</p>
                <p className="text-sm font-semibold text-slate-800">{v.value}</p>
              </div>
            );
          })}
        </div>

        {isPending && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-teal-200 bg-teal-50 p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            <div>
              <p className="font-medium text-teal-800">Processando plano de cuidados taxonômico...</p>
              <p className="text-sm text-teal-600">A IA clínica anonimizada analisa os sinais vitais e escores (NANDA-I/NIC/NOC).</p>
            </div>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-sm font-medium text-red-700">Não foi possível gerar o plano agora.</p>
            <Button onClick={regenerate} variant="outline" className="rounded-xl">
              <RefreshCw className="mr-2 h-4 w-4" /> Tentar novamente
            </Button>
          </div>
        )}

        {plan && !isPending && (
          <>
            <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-teal-600" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Síntese Clínica</p>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800">
                  Rascunho Preliminar Gerado por IA
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-700 leading-relaxed">{plan.resumo || plan.summary}</p>
              {plan.prioridade && (
                <span className="mt-2 inline-block rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-800">
                  Prioridade Clínica: {plan.prioridade.toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={regenerate} variant="outline" size="sm" className="rounded-xl">
                <RefreshCw className="mr-2 h-4 w-4" /> Regenerar Plano
              </Button>
              <Button
                onClick={importDiagnoses}
                disabled={importing || imported}
                size="sm"
                className="rounded-xl bg-teal-600 hover:bg-teal-700 shadow-sm"
              >
                {importing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : imported ? (
                  <CheckCircle2 className="mr-2 h-4 w-4 text-white" />
                ) : (
                  <BookPlus className="mr-2 h-4 w-4" />
                )}
                {imported ? "Diagnósticos Validados e Salvos" : "Revisar e Salvar no Prontuário"}
              </Button>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Diagnósticos de Enfermagem Propostos ({diagnoses.length})
              </p>
              <div className="space-y-3">
                {diagnoses.map((d, i) => (
                  <DiagnosisCard key={i} diagnosis={d} index={i} />
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
