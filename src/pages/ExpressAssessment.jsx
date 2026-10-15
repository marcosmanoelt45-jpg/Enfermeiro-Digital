import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { assessmentService } from "@/services";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Loader2, Sparkles, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
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
  const draftKey = `enfermeiro_assessment_draft_${id}`;

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [restoredFromDraft, setRestoredFromDraft] = useState(false);

  // Inicializa a partir do rascunho local se existir
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_ASSESSMENT_DATA, ...parsed };
      }
    } catch (e) {
      console.warn("Falha ao recuperar rascunho:", e);
    }
    return DEFAULT_ASSESSMENT_DATA;
  });

  const isInitialMount = useRef(true);

  // Detecta se iniciou com rascunho
  useEffect(() => {
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      setRestoredFromDraft(true);
      setLastSaved(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    }
  }, [draftKey]);

  // Auto-save a cada alteração nos dados das escalas e notas
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    try {
      localStorage.setItem(draftKey, JSON.stringify(data));
      setLastSaved(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (err) {
      console.warn("Erro ao persistir rascunho no localStorage:", err);
    }
  }, [data, draftKey]);

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  function resetDraft() {
    if (window.confirm("Deseja realmente limpar todos os dados preenchidos desta avaliação e recomeçar do zero?")) {
      localStorage.removeItem(draftKey);
      setData(DEFAULT_ASSESSMENT_DATA);
      setStep(0);
      setRestoredFromDraft(false);
      setLastSaved(null);
      toast({
        title: "Rascunho limpo",
        description: "Os campos foram restaurados para os valores padrão.",
      });
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      let assessmentId = null;

      // 1. Tenta salvar via base44 functions
      try {
        const res = await base44.functions.invoke("saveAssessment", { patient_id: id, data });
        assessmentId = res?.data?.assessment_id || res?.assessment_id || res?.id;
      } catch (invokeErr) {
        console.warn("Tentando fallback de salvamento direto via assessmentService:", invokeErr);
      }

      // 2. Fallback direto se base44 não retornou id
      if (!assessmentId) {
        const directCreated = await assessmentService.create({
          patient_id: id,
          ...data,
        });
        assessmentId = directCreated.id;
      }

      if (assessmentId) {
        // Remove rascunho após salvar com êxito
        localStorage.removeItem(draftKey);
        toast({
          title: "Avaliação registrada!",
          description: "Iniciando processamento clínico da IA...",
        });
        navigate(`/assessment/${assessmentId}/ai`);
        return;
      }

      throw new Error("Não foi possível gerar identificador para a avaliação.");
    } catch (e) {
      console.error("Erro ao salvar avaliação:", e);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível registrar a avaliação. Seus dados continuam salvos neste dispositivo.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  const next = () => setStep((s) => Math.min(s + 1, ASSESSMENT_STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm">
        <div className="mx-auto max-w-2xl px-4 py-2.5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/patient/${id}`)}
                className="rounded-xl shrink-0"
                title="Voltar ao paciente (seu rascunho continuará salvo)"
              >
                <ArrowLeft className="h-5 w-5 text-slate-700" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-base font-semibold text-slate-800 leading-tight">Avaliação Clínica Express</h1>
                <p className="text-[11px] text-slate-500 truncate">
                  Passo {step + 1} de {ASSESSMENT_STEPS.length}: <span className="font-medium text-slate-700">{ASSESSMENT_STEPS[step]?.label}</span>
                </p>
              </div>
            </div>

            {/* BOTÃO PRINCIPAL DE AÇÃO DA IA - FIXO NO CABEÇALHO, ACESSÍVEL DE QUALQUER PASSO */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                onClick={handleSave}
                disabled={saving}
                size="sm"
                className="rounded-xl bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow hover:from-teal-700 hover:to-emerald-700 transition active:scale-95"
                title="Gera o plano NANDA/NIC/NOC com a IA utilizando todos os dados das escalas e notas preenchidas até o momento"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-300" />
                    Gerar Plano IA
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* BARRA DE STATUS DO RASCUNHO AUTOMÁTICO */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {lastSaved ? `Rascunho salvo às ${lastSaved}` : "Rascunho salvo automaticamente"}
              </span>
              {restoredFromDraft && (
                <span className="rounded bg-teal-50 px-1 py-0.2 text-[10px] font-medium text-teal-700">
                  Restaurado
                </span>
              )}
            </div>
            <button
              onClick={resetDraft}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-600 transition"
              title="Limpar formulário"
            >
              <RotateCcw className="h-3 w-3" />
              Limpar
            </button>
          </div>

          <div className="pt-2">
            <AssessmentStepNav step={step} setStep={setStep} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4 pb-28">
        <AssessmentRiskBanner data={data} />
        <AssessmentStepContent data={data} set={set} step={step} />
      </main>

      <footer className="fixed bottom-0 inset-x-0 border-t border-slate-200 bg-white/95 backdrop-blur z-10 shadow-lg">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center gap-2">
          <Button
            variant="outline"
            onClick={prev}
            disabled={step === 0}
            className="flex-1 rounded-xl py-5 font-medium"
          >
            Anterior
          </Button>

          {step < ASSESSMENT_STEPS.length - 1 ? (
            <Button
              onClick={next}
              className="flex-1 rounded-xl bg-teal-600 py-5 font-semibold text-white hover:bg-teal-700"
            >
              Próximo: {ASSESSMENT_STEPS[step + 1]?.label}
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 py-5 font-semibold text-white shadow-md hover:from-teal-700 hover:to-emerald-700"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Salvar e Gerar Plano IA
                </>
              )}
            </Button>
          )}

          {/* Botão de atalho rápido no rodapé se não estiver no último passo */}
          {step < ASSESSMENT_STEPS.length - 1 && (
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl border-teal-200 bg-teal-50/70 px-3 py-5 text-teal-800 hover:bg-teal-100 hover:text-teal-900"
              title="Salva as escalas e notas atuais e gera o plano com IA agora"
            >
              <Sparkles className="h-4 w-4 text-teal-600" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
