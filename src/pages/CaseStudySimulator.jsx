import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  Shuffle,
  Activity,
  HeartPulse,
  Layers,
  Send,
  Plus,
  Stethoscope,
  Timer,
  ClipboardList,
  Eye,
  Check,
  ArrowRightLeft,
  Scale,
  Award,
  MessageSquareQuote,
  History,
  Clock,
  BookmarkPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import StudentHeader from "@/components/StudentHeader";
import StudentFooter from "@/components/StudentFooter";
import ClinicalGapRadar from "@/components/ClinicalGapRadar";
import { CASE_LIBRARY, generateRandomFullCase } from "@/lib/caseLibrary";
import { evaluateClinicalReasoning, getScaffoldingHint } from "@/services/socraticTutorService";
import CaseHistoryModal from "@/components/history/CaseHistoryModal";
import { clinicalHistoryService, MODULE_TYPES } from "@/services/clinicalHistoryService";

export default function CaseStudySimulator() {
  const navigate = useNavigate();
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const [activeStep, setActiveStep] = useState(1); // 1: Avaliação, 2: Diagnóstico, 3: Planejamento, 4: Implementação, 5: Evolução
  const [cases, setCases] = useState(CASE_LIBRARY);

  // Estados dos formulários por etapa clínica do Processo de Enfermagem
  const [studentAssessmentNotes, setStudentAssessmentNotes] = useState("");
  const [studentHypothesis, setStudentHypothesis] = useState("");
  const [studentEtiology, setStudentEtiology] = useState("");
  const [studentEvidences, setStudentEvidences] = useState("");
  const [studentGoals, setStudentGoals] = useState("");
  const [studentInterventions, setStudentInterventions] = useState("");
  const [studentEvolutionNotes, setStudentEvolutionNotes] = useState("");

  // Estados de Tutoria e Feedback Clínico
  const [tutorEvaluation, setTutorEvaluation] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentHint, setCurrentHint] = useState(null);
  const [hintLevel, setHintLevel] = useState(1);
  const [loadingHint, setLoadingHint] = useState(false);
  const [viewingDebriefing, setViewingDebriefing] = useState(false);
  const [showCofenGuideline, setShowCofenGuideline] = useState(false);

  // Anotações Clínicas e Exame Físico Interativo
  const [showClinicalNotes, setShowClinicalNotes] = useState(false);
  const [activeExamAction, setActiveExamAction] = useState(null);
  const [simulatedTimeline, setSimulatedTimeline] = useState(null);

  // Estado de Parâmetros Adicionados
  const [addedGaps, setAddedGaps] = useState([]);
  const [toastMessage, setToastMessage] = useState("");

  const currentCase = cases[selectedCaseIdx];

  // Ações de Exame Físico à beira-leito
  const physicalExamActions = [
    {
      id: "ausculta",
      label: "Auscultar Pulmão",
      icon: Stethoscope,
      finding: "Estertores crepitantes bibasais em terço inferior com expansibilidade discretamente diminuída à direita.",
      clinicalMeaning: "Sugere congestão alveolar ou consolidação inflamatória aguda."
    },
    {
      id: "glicemia",
      label: "Glicemia Capilar (HGT)",
      icon: Activity,
      finding: "HGT: 138 mg/dL (glicemia pós-prandial dentro do limite aceitável de estresse).",
      clinicalMeaning: "Descarta hipoglicemia aguda como causa primária da alteração do sensório."
    },
    {
      id: "perfusao",
      label: "Avaliar Perfusão & TEC",
      icon: HeartPulse,
      finding: "Tempo de Enchimento Capilar (TEC) de 3,5 segundos com extremidades frias.",
      clinicalMeaning: "Indica vasoconstrição compensatória periférica e perfusão tissular comprometida."
    },
    {
      id: "pele",
      label: "Inspecionar Sacro e Calcanhares",
      icon: Layers,
      finding: "Hiperemia não branqueável em região sacra (LPP Estágio 1). Calcanhares íntegros.",
      clinicalMeaning: "Risco de progressão de lesão por pressão nas próximas 12 horas."
    }
  ];

  // Parâmetros para conferência do caso
  const caseGaps = [
    { key: "glicemia", label: "Glicemia Capilar (HGT)", hint: "Checar se há hiperglicemia ou hipoglicemia mascarando o sensório." },
    { key: "alergias", label: "Investigação Detalhada de Alergias", hint: "Confirmar ausência de alergia a penicilinas, AINEs e iodo." },
    { key: "pulsos", label: "Palpação de Pulsos Periféricos e Perfusão", hint: "Verificar se os pulsos distais estão cheios, simétricos ou filiformes." },
    { key: "braden", label: "Aplicação da Escala de Braden", hint: "Avaliar risco preditivo de lesão por pressão na admissão." }
  ];

  const remainingGaps = caseGaps.filter(
    (g) => !addedGaps.some((x) => (typeof x === "string" ? x === g.key : x.key === g.key))
  );

  const detectedItems = [
    { label: "PA", value: `${currentCase.vitals.pa_sistolica}/${currentCase.vitals.pa_diastolica} mmHg` },
    { label: "FC", value: `${currentCase.vitals.fc} bpm` },
    { label: "FR", value: `${currentCase.vitals.fr} irpm` },
    { label: "Tax", value: `${currentCase.vitals.tax} °C` },
    { label: "SatO2", value: `${currentCase.vitals.sat}%` },
    ...addedGaps.map((item) => {
      if (typeof item === "object" && item.label && item.value) {
        return { ...item, canRemove: true };
      }
      const g = caseGaps.find((x) => x.key === item);
      return {
        key: item,
        label: g?.label || "Dado Clínico",
        value: "Avaliado e Registrado",
        canRemove: true
      };
    })
  ];

  function handleAddGap(gap, resulting) {
    const key = gap.key || gap;
    const finalItem = resulting || {
      key,
      label: gap.label || "Parâmetro",
      value: "Avaliado e Registrado no prontuário",
      status: "normal",
      canRemove: true
    };

    setAddedGaps((prev) => {
      const filtered = prev.filter((x) => (typeof x === "string" ? x !== key : x.key !== key));
      return [...filtered, { ...finalItem, key, canRemove: true }];
    });
    setToastMessage(`Parâmetro registrado no prontuário: "${finalItem.label} — ${finalItem.value}".`);
    setTimeout(() => setToastMessage(""), 3500);
  }

  function handleRemoveGap(item) {
    const key = item.key || item;
    setAddedGaps((prev) => prev.filter((x) => (typeof x === "string" ? x !== key : x.key !== key)));
    setToastMessage(`Parâmetro removido do prontuário: "${item.label}".`);
    setTimeout(() => setToastMessage(""), 3000);
  }

  function handleAppendFinding(findingText) {
    const addition = ` [Achado: ${findingText}]`;
    if (activeStep === 1) {
      setStudentAssessmentNotes((prev) => (prev ? prev + addition : findingText));
    } else if (activeStep === 2) {
      setStudentEvidences((prev) => (prev ? prev + addition : findingText));
    } else {
      setStudentInterventions((prev) => (prev ? prev + addition : findingText));
    }
    setToastMessage(`Achado incorporado ao formulário da Etapa ${activeStep}!`);
    setTimeout(() => setToastMessage(""), 3500);
  }

  function handleSelectCase(idx) {
    setSelectedCaseIdx(idx);
    setActiveStep(1);
    setStudentAssessmentNotes("");
    setStudentHypothesis("");
    setStudentEtiology("");
    setStudentEvidences("");
    setStudentGoals("");
    setStudentInterventions("");
    setStudentEvolutionNotes("");
    setTutorEvaluation(null);
    setCurrentHint(null);
    setAddedGaps([]);
    setActiveExamAction(null);
    setSimulatedTimeline(null);
    setShowClinicalNotes(false);
    setViewingDebriefing(false);
    setShowCofenGuideline(false);
  }

  function handleGenerateRandom() {
    const randomCase = generateRandomFullCase();
    setCases([randomCase, ...cases]);
    setSelectedCaseIdx(0);
    setActiveStep(1);
    setStudentAssessmentNotes("");
    setStudentHypothesis("");
    setStudentEtiology("");
    setStudentEvidences("");
    setStudentGoals("");
    setStudentInterventions("");
    setStudentEvolutionNotes("");
    setTutorEvaluation(null);
    setCurrentHint(null);
    setAddedGaps([]);
    setActiveExamAction(null);
    setSimulatedTimeline(null);
    setShowClinicalNotes(false);
    setViewingDebriefing(false);
    setShowCofenGuideline(false);
    setToastMessage("Novo caso clínico gerado com dados sintéticos.");
    setTimeout(() => setToastMessage(""), 3500);
  }

  function handleSimulatePatientResponse() {
    setSimulatedTimeline({
      elapsedTime: "30 minutos após intervenções",
      vitalsBefore: { ...currentCase.vitals },
      vitalsAfter: {
        pa_sistolica: Math.max(120, currentCase.vitals.pa_sistolica - 15),
        pa_diastolica: Math.max(75, currentCase.vitals.pa_diastolica - 10),
        fc: Math.max(75, currentCase.vitals.fc - 18),
        fr: Math.max(18, currentCase.vitals.fr - 6),
        sat: Math.min(98, currentCase.vitals.sat + 6)
      },
      clinicalStatus: "Paciente com padrão respiratório mais regular, menor esforço ventilatório e perfusão periférica melhorada."
    });
    setToastMessage("Simulação de evolução clínica calculada com sucesso.");
    setTimeout(() => setToastMessage(""), 3500);
  }

  async function handleRequestHint() {
    setLoadingHint(true);
    try {
      const hint = await getScaffoldingHint(currentCase, hintLevel);
      setCurrentHint(hint);
      setHintLevel((prev) => (prev < 3 ? prev + 1 : 1));
    } finally {
      setLoadingHint(false);
    }
  }

  // Histórico & Cronômetro de Atividade do Simulador
  const [searchParams] = useSearchParams();
  const [currentActivityId, setCurrentActivityId] = useState(null);
  const [activitySeconds, setActivitySeconds] = useState(0);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "review" || action === "continue" || action === "history") {
      setIsHistoryOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActivitySeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  function handleSaveDraft() {
    const progress = Math.min(Math.round((activeStep / 5) * 100), 99);
    const draft = clinicalHistoryService.saveDraft({
      id: currentActivityId,
      moduleType: MODULE_TYPES.CASE_SIMULATOR,
      title: `Caso Clínico: ${currentCase.title}`,
      patientInfo: `${currentCase.patient?.name || "Paciente"} • ${currentCase.category || "Enfermaria"}`,
      progress,
      durationSeconds: activitySeconds,
      step: activeStep,
      formData: {
        selectedCaseIdx,
        activeStep,
        studentAssessmentNotes,
        studentHypothesis,
        studentEtiology,
        studentEvidences,
        studentGoals,
        studentInterventions,
        studentEvolutionNotes,
      }
    });
    setCurrentActivityId(draft.id);
    setToastMessage("Rascunho do caso salvo no Histórico!");
    setTimeout(() => setToastMessage(""), 3000);
  }

  function handleResumeActivity(item) {
    if (item?.formData) {
      if (typeof item.formData.selectedCaseIdx === "number") setSelectedCaseIdx(item.formData.selectedCaseIdx);
      if (typeof item.formData.activeStep === "number") setActiveStep(item.formData.activeStep);
      if (item.formData.studentAssessmentNotes) setStudentAssessmentNotes(item.formData.studentAssessmentNotes);
      if (item.formData.studentHypothesis) setStudentHypothesis(item.formData.studentHypothesis);
      if (item.formData.studentEtiology) setStudentEtiology(item.formData.studentEtiology);
      if (item.formData.studentEvidences) setStudentEvidences(item.formData.studentEvidences);
      if (item.formData.studentGoals) setStudentGoals(item.formData.studentGoals);
      if (item.formData.studentInterventions) setStudentInterventions(item.formData.studentInterventions);
      if (item.formData.studentEvolutionNotes) setStudentEvolutionNotes(item.formData.studentEvolutionNotes);
      if (item.durationSeconds) setActivitySeconds(item.durationSeconds);
    }
    if (item?.evaluation) {
      setTutorEvaluation(item.evaluation);
      setViewingDebriefing(true);
    }
    setCurrentActivityId(item.id);
    setIsHistoryOpen(false);
  }

  async function handleSubmitEvaluation() {
    setIsEvaluating(true);
    try {
      const res = await evaluateClinicalReasoning({
        caseData: currentCase,
        hypothesis: studentHypothesis,
        justification: `${studentEtiology} | Evidências: ${studentEvidences} | Avaliação: ${studentAssessmentNotes}`,
        interventions: `${studentInterventions} | Metas: ${studentGoals}`
      });
      setTutorEvaluation(res);
      setViewingDebriefing(true);
      window.scrollTo({ top: 320, behavior: "smooth" });

      try {
        const submitted = clinicalHistoryService.submitActivity({
          id: currentActivityId,
          moduleType: MODULE_TYPES.CASE_SIMULATOR,
          title: `Caso Clínico: ${currentCase.title}`,
          patientInfo: `${currentCase.patient?.name || "Paciente"} • ${currentCase.category || "Enfermaria"}`,
          durationSeconds: activitySeconds,
          score: res?.overallScore || 90,
          evaluation: res,
          formData: {
            selectedCaseIdx,
            studentHypothesis,
            studentEtiology,
            studentEvidences,
            studentGoals,
            studentInterventions,
            studentEvolutionNotes
          }
        });
        setCurrentActivityId(submitted.id);
      } catch (err) {
        console.warn("[CaseStudySimulator] Erro ao gravar histórico:", err);
      }
    } finally {
      setIsEvaluating(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-800 dark:text-slate-100">
      <StudentHeader activeTab="casos" />

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 py-6 space-y-6">
        {/* Barra Superior Limpa e Funcional */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Simulador de Casos Clínicos
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                COFEN 736/2024
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pratique as 5 etapas do Processo de Enfermagem com debriefing e suporte à beira-leito.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
            {/* Cronômetro */}
            <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              <Clock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{clinicalHistoryService.formatDuration(activitySeconds)}</span>
            </span>

            {/* Salvar Rascunho */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              className="rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
              title="Salvar rascunho do caso clínico no Histórico"
            >
              <BookmarkPlus className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Salvar Rascunho</span>
            </Button>

            {/* Histórico do Módulo */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHistoryOpen(true)}
              className="rounded-xl border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
            >
              <History className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Histórico de Casos</span>
            </Button>

            <Button
              onClick={() => navigate('/passagem-plantao', { state: { caseData: currentCase } })}
              variant="outline"
              className="rounded-xl border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 text-xs flex items-center gap-2 font-semibold shadow-2xs"
              title="Pratique a passagem de plantão deste paciente na metodologia SBAR"
            >
              <ArrowRightLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Passar Plantão (SBAR)</span>
            </Button>
            <Button
              onClick={handleGenerateRandom}
              variant="outline"
              className="rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs flex items-center gap-2 font-semibold shadow-2xs"
            >
              <Shuffle className="h-4 w-4" />
              <span>Novo Caso</span>
            </Button>
          </div>
        </div>

        {/* Notificação Toast */}
        {toastMessage && (
          <div className="p-3.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs flex items-center gap-2 animate-in fade-in shadow-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Banner de Acesso Rápido ao Histórico de Casos & Rascunhos */}
        <div
          onClick={() => setIsHistoryOpen(true)}
          className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform shadow-2xs">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Consultar Histórico de Casos & Rascunhos Anteriores</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Retomar Atividades
                </span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Veja as simulações que você já realizou, o tempo gasto em cada etapa do PE e continue simulações em andamento.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsHistoryOpen(true);
            }}
            className="rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-white dark:hover:bg-slate-900 shrink-0"
          >
            <span>Abrir Histórico</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1 text-emerald-600" />
          </Button>
        </div>

        {/* Apresentação Focada: 1 Caso por Vez + Sorteio Aleatório */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center shrink-0">
              <Stethoscope className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 uppercase tracking-wide">
                  {currentCase.category}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Leito {currentCase.patient?.bed || "Enfermaria"} • Caso Clínico Simulado
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                {currentCase.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Paciente: <strong className="text-slate-800 dark:text-slate-200">{currentCase.patient?.name}</strong> ({currentCase.patient?.age} anos, {currentCase.patient?.gender})
              </p>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Selecionar caso:</span>
                <select
                  value={selectedCaseIdx}
                  onChange={(e) => handleSelectCase(Number(e.target.value))}
                  className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 font-medium cursor-pointer"
                >
                  {cases.map((c, i) => (
                    <option key={c.id || i} value={i}>
                      Caso {i + 1}: {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <Button
            onClick={handleGenerateRandom}
            variant="outline"
            className="rounded-xl border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-xs font-bold flex items-center gap-2 shadow-2xs self-start md:self-auto shrink-0 py-2.5 px-4"
          >
            <Shuffle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>🎲 Sortear Novo Caso Clínico</span>
          </Button>
        </div>

        {/* BARRA DAS 5 ETAPAS DO PROCESSO DE ENFERMAGEM (COFEN 736/2024) + AÇÕES DE APOIO */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2.5 shadow-xs space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="grid grid-cols-5 gap-1.5 flex-1 text-center">
              {[
                { num: 1, label: "1. Avaliação" },
                { num: 2, label: "2. Diagnóstico" },
                { num: 3, label: "3. Planejamento" },
                { num: 4, label: "4. Implementação" },
                { num: 5, label: "5. Evolução" }
              ].map((step) => {
                const isCurrent = !viewingDebriefing && activeStep === step.num;
                return (
                  <button
                    key={step.num}
                    onClick={() => {
                      setActiveStep(step.num);
                      setViewingDebriefing(false);
                    }}
                    className={`py-2 px-1.5 rounded-xl text-xs font-bold transition-all ${
                      isCurrent
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className="sm:hidden font-mono">{step.num}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {tutorEvaluation && (
                <button
                  onClick={() => setViewingDebriefing(!viewingDebriefing)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
                    viewingDebriefing
                      ? "bg-teal-700 text-white shadow-xs"
                      : "bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-950/70"
                  }`}
                >
                  <Award className="h-3.5 w-3.5" />
                  <span>Debriefing PEARLS ({tutorEvaluation.score}%)</span>
                </button>
              )}

              <button
                onClick={() => setShowCofenGuideline(!showCofenGuideline)}
                className={`py-1.5 px-2.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition ${
                  showCofenGuideline
                    ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                title="Consultar diretriz regulatória da etapa clínica"
              >
                <Scale className="h-3.5 w-3.5 text-slate-500" />
                <span className="hidden sm:inline">{showCofenGuideline ? "Ocultar COFEN" : "COFEN 736"}</span>
              </button>
            </div>
          </div>

          {/* Diretriz COFEN 736/2024 Sob Demanda (Divulgação Progressiva) */}
          {showCofenGuideline && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-1 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                  <Scale className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Diretriz Regulatória COFEN nº 736/2024 — Etapa {activeStep}
                </span>
                <button
                  onClick={() => setShowCofenGuideline(false)}
                  className="text-[10px] font-bold text-slate-500 hover:underline"
                >
                  Fechar
                </button>
              </div>
              <p className="leading-relaxed">
                {activeStep === 1 && "A etapa de Avaliação subsidia todas as decisões clínicas subsequentes por meio da coleta metódica de dados subjetivos e objetivos."}
                {activeStep === 2 && "O Diagnóstico de Enfermagem representa o julgamento clínico sobre as respostas da pessoa ou coletividade a processos de saúde/doença."}
                {activeStep === 3 && "O Planejamento envolve a determinação das metas e dos resultados que se espera alcançar com a assistência de enfermagem."}
                {activeStep === 4 && "A Implementação consiste na execução das intervenções prescritas pelo enfermeiro com rigor e aprazamento."}
                {activeStep === 5 && "A Evolução é o processo contínuo de avaliação dos resultados alcançados e readequação do plano de cuidados terapêuticos."}
              </p>
            </div>
          )}
        </div>

        {/* WORKSPACE CENTRAL LIMPO (Sem ruído lateral - CLT / Sweller) */}
        <div className="max-w-4xl mx-auto w-full">
          {viewingDebriefing && tutorEvaluation ? (
            /* ========================================================================= */
            /* DEBRIEFING CLÍNICO SOCRÁTICO (FRAMEWORK PEARLS / DML - Miller Nível 3)    */
            /* ========================================================================= */
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
                {/* Cabeçalho do Debriefing */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 uppercase tracking-wide">
                        Framework PEARLS • Debriefing Socrático
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">Preceptor Clínico IA</span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      Parecer Pedagógico & Desconstrução do Raciocínio
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Paciente: <strong>{currentCase.patient.name}</strong> • Diagnóstico Clínico: {currentCase.title}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase block">Acurácia Diagnóstica</span>
                      <span className="text-2xl font-black text-emerald-900 dark:text-emerald-200 leading-none">{tutorEvaluation.score}%</span>
                    </div>
                    <Award className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>

                {/* Fase 1: Análise da Decisão Clínica & Lacunas */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                    <ClipboardList className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    1. Análise do Julgamento Clínico (Diagnosis & Evidence Gap)
                  </span>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
                    <p>{tutorEvaluation.reasoningAnalysis}</p>
                  </div>
                </div>

                {/* Fase 2: Provocação Socrática para Reflexão Profunda */}
                {tutorEvaluation.reflectiveQuestion && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                      <MessageSquareQuote className="h-4 w-4 text-amber-500" />
                      2. Provocação Socrática de Investigação Reflexiva
                    </span>
                    <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs sm:text-sm text-amber-950 dark:text-amber-200 leading-relaxed space-y-2">
                      <p className="font-semibold italic">"{tutorEvaluation.reflectiveQuestion}"</p>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300/80 pt-1 border-t border-amber-200/60 dark:border-amber-900/40">
                        Ponto de Aprendizagem: Esta pergunta visa consolidar o raciocínio dedutivo para evitar eventos sentinela na prática beira-leito.
                      </p>
                    </div>
                  </div>
                )}

                {/* Fase 3: Pontos Críticos para a Prática Hospitalar Segura */}
                {tutorEvaluation.pointsToConsider?.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      3. Pontos-Chave para a Tomada de Decisão Beira-Leito
                    </span>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                      <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 list-disc list-inside">
                        {tutorEvaluation.pointsToConsider.map((pt, i) => (
                          <li key={i} className="leading-relaxed font-medium">{pt}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Ações Finais do Debriefing */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setViewingDebriefing(false)}
                    className="rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 w-full sm:w-auto shadow-2xs"
                  >
                    <ArrowLeft className="h-4 w-4" /> Revisar Etapas do Caso
                  </Button>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                      onClick={handleGenerateRandom}
                      className="rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 flex-1 sm:flex-none shadow-xs h-10 px-4"
                    >
                      <Shuffle className="h-4 w-4" /> <span>🎲 Próximo Caso Aleatório</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* ETAPA 1: AVALIAÇÃO / COLETA DE DADOS */}
              {activeStep === 1 && (
              <div className="space-y-5 animate-in fade-in">
                {/* Prontuário do Paciente */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
                    <div>
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                        {currentCase.category}
                      </span>
                      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {currentCase.title}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={showClinicalNotes ? "default" : "outline"}
                        onClick={() => setShowClinicalNotes(!showClinicalNotes)}
                        className={`rounded-xl text-xs h-8 flex items-center gap-1.5 ${
                          showClinicalNotes
                            ? "bg-slate-800 dark:bg-slate-700 text-white"
                            : "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>{showClinicalNotes ? "Ocultar Pistas" : "Anotações Clínicas"}</span>
                      </Button>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {currentCase.patient.name} • {currentCase.patient.age}a • {currentCase.patient.gender}
                      </span>
                    </div>
                  </div>

                  {/* Anamnese & Resumo Clínico */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">Histórico & Motivo de Admissão:</span>
                    <p className="leading-relaxed">
                      {currentCase.patient.previous_anamnesis}
                    </p>

                    {showClinicalNotes && (
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-2 text-[11px]">
                        <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 px-2.5 py-1 rounded-md font-semibold border border-amber-200 dark:border-amber-900/60">
                          💡 Pista: Retenção volêmica aguda & dispneia progressiva
                        </span>
                        <span className="bg-rose-100 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 px-2.5 py-1 rounded-md font-semibold border border-rose-200 dark:border-rose-900/60">
                          💡 Risco: Descompensação ventilatória iminente
                        </span>
                      </div>
                    )}

                    <div className="text-slate-500 dark:text-slate-400 pt-1 text-[11px] border-t border-slate-200/60 dark:border-slate-700/60">
                      <strong>Antecedentes:</strong> {currentCase.patient.medical_history} | <strong>Medicações:</strong> {currentCase.patient.current_medications}
                    </div>
                  </div>

                  {/* Sinais Vitais do Paciente */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase block">PA</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {currentCase.vitals.pa_sistolica}/{currentCase.vitals.pa_diastolica}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-400 block">mmHg</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase block">FC</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{currentCase.vitals.fc}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-400 block">bpm</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase block">FR</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{currentCase.vitals.fr}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-400 block">irpm</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase block">Tax</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{currentCase.vitals.tax}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-400 block">°C</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase block">SatO2</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{currentCase.vitals.sat}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-400 block">%</span>
                    </div>
                  </div>

                  {/* Ações de Exame Físico à Beira-leito */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
                        <Stethoscope className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Procedimentos de Exame Físico
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-400">Toque para coletar achados</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {physicalExamActions.map((act) => {
                        const Icon = act.icon;
                        const isSelected = activeExamAction?.id === act.id;
                        return (
                          <button
                            key={act.id}
                            type="button"
                            onClick={() => setActiveExamAction(isSelected ? null : act)}
                            className={`p-2.5 rounded-xl border text-left transition-all ${
                              isSelected
                                ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 dark:border-emerald-500 ring-1 ring-emerald-600 shadow-xs"
                                : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <Icon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate">{act.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {activeExamAction && (
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2 animate-in fade-in">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                              Achado: {activeExamAction.label}
                            </span>
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                              "{activeExamAction.finding}"
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              <strong>Significado:</strong> {activeExamAction.clinicalMeaning}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAppendFinding(activeExamAction.finding)}
                            className="rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-[11px] shrink-0 h-8 flex items-center gap-1 font-semibold"
                          >
                            <Plus className="h-3.5 w-3.5" /> Adicionar às Notas
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Radar de Parâmetros Clínicos */}
                  <ClinicalGapRadar
                    detectedItems={detectedItems}
                    missingGaps={remainingGaps}
                    onAddGap={handleAddGap}
                    onRemoveGap={handleRemoveGap}
                    completenessPercentage={Math.round((detectedItems.length / (detectedItems.length + remainingGaps.length)) * 100)}
                    title="Conferência de Parâmetros da Avaliação"
                  />

                  {/* Notas da Avaliação do Aluno */}
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-slate-800 block">
                      Anotações de Avaliação do Estudante (Dados Relevantes Coletados):
                    </label>
                    <Textarea
                      value={studentAssessmentNotes}
                      onChange={(e) => setStudentAssessmentNotes(e.target.value)}
                      placeholder="Descreva os dados subjetivos e objetivos identificados na anamnese e no exame físico..."
                      className="rounded-xl text-xs border-slate-300 min-h-[80px]"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      onClick={() => setActiveStep(2)}
                      className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs px-5 h-10 font-semibold flex items-center gap-2"
                    >
                      Avançar para Diagnóstico <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 2: DIAGNÓSTICO DE ENFERMAGEM */}
            {activeStep === 2 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      Etapa 2 do PE: Diagnóstico de Enfermagem
                    </span>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                      Julgamento Clínico e Resposta Humana Prioritária
                    </h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRequestHint}
                    disabled={loadingHint}
                    className="rounded-xl text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-1.5"
                  >
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    <span>{loadingHint ? "Buscando dica..." : `Pista Diagnóstica (Nível ${hintLevel})`}</span>
                  </Button>
                </div>

                {currentHint && (
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-950 dark:text-amber-200 space-y-1 animate-in fade-in">
                    <span className="font-bold flex items-center gap-1 text-amber-800 dark:text-amber-300">
                      <Lightbulb className="h-3.5 w-3.5" /> Dica Orientadora:
                    </span>
                    <p className="leading-relaxed">{currentHint.content}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      1. Título do Diagnóstico de Enfermagem Prioritário:
                    </label>
                    <Input
                      value={studentHypothesis}
                      onChange={(e) => setStudentHypothesis(e.target.value)}
                      placeholder="Ex: Padrão respiratório ineficaz (ou termo CIPE® equivalente)"
                      className="rounded-xl text-xs border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 h-10"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      2. Fatores Relacionados / Etiologia (Qual a causa provável?):
                    </label>
                    <Textarea
                      value={studentEtiology}
                      onChange={(e) => setStudentEtiology(e.target.value)}
                      placeholder="Ex: Fadiga da musculatura respiratória, hipervolemia e congestão pulmonar secundária..."
                      className="rounded-xl text-xs border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-[60px]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      3. Características Definidoras / Evidências Clínicas (Quais dados comprovam?):
                    </label>
                    <Textarea
                      value={studentEvidences}
                      onChange={(e) => setStudentEvidences(e.target.value)}
                      placeholder="Ex: Taquipneia (FR 26 irpm), SpO2 89% em ar ambiente e estertores bibasais..."
                      className="rounded-xl text-xs border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-[60px]"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setActiveStep(1)}
                    className="rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                  >
                    <ArrowLeft className="h-4 w-4" /> Voltar para Avaliação
                  </Button>
                  <Button
                    onClick={() => setActiveStep(3)}
                    disabled={!studentHypothesis.trim()}
                    className="rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs px-5 h-10 font-bold flex items-center gap-2 shadow-xs disabled:opacity-50"
                  >
                    Avançar para Planejamento <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ETAPA 3: PLANEJAMENTO (METAS E RESULTADOS ESPERADOS) */}
            {activeStep === 3 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5 animate-in fade-in">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    Etapa 3 do PE: Planejamento
                  </span>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                    Metas Terapêuticas & Resultados Esperados
                  </h2>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block mb-0.5">Diagnóstico Selecionado:</span>
                  <p>{studentHypothesis || "Nenhum diagnóstico definido na etapa anterior."}</p>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Defina as Metas Mensuráveis e Resultados Esperados para este paciente:
                  </label>
                  <Textarea
                    value={studentGoals}
                    onChange={(e) => setStudentGoals(e.target.value)}
                    placeholder="Ex: Paciente apresentará SpO2 ≥ 94% em ar ambiente em até 2 horas. Frequência respiratória entre 16-20 irpm sem sinais de esforço ventilatório nas próximas 4 horas."
                    className="rounded-xl text-xs border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-[100px]"
                  />
                  <p className="text-[11px] text-slate-400 dark:text-slate-400">
                    Dica: Boas metas devem ser claras, mensuráveis e com prazo definido para a reavaliação.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setActiveStep(2)}
                    className="rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                  >
                    <ArrowLeft className="h-4 w-4" /> Voltar para Diagnóstico
                  </Button>
                  <Button
                    onClick={() => setActiveStep(4)}
                    className="rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs px-5 h-10 font-bold flex items-center gap-2 shadow-xs"
                  >
                    Avançar para Implementação <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ETAPA 4: IMPLEMENTAÇÃO (PRESCRIÇÃO DE ENFERMAGEM) */}
            {activeStep === 4 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5 animate-in fade-in">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    Etapa 4 do PE: Implementação
                  </span>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                    Prescrição de Cuidados de Enfermagem & Conduta Prática
                  </h2>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Prescreva as intervenções de enfermagem com aprazamento de horários:
                  </label>
                  <Textarea
                    value={studentInterventions}
                    onChange={(e) => setStudentInterventions(e.target.value)}
                    placeholder="Ex: 1. Posicionar em decúbito elevado (Fowler a 45°); 2. Instalar oxigenoterapia sob cânula nasal a 2 L/min; 3. Monitorizar oximetria de pulso contínua; 4. Aferir sinais vitais de 2/2h..."
                    className="rounded-xl text-xs border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-[110px]"
                  />
                  <p className="text-[11px] text-slate-400 dark:text-slate-400">
                    Estruture os cuidados em ações prioritárias imediatas e ações de monitoramento contínuo.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setActiveStep(3)}
                    className="rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 w-full sm:w-auto shadow-2xs"
                  >
                    <ArrowLeft className="h-4 w-4" /> Voltar para Metas
                  </Button>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      onClick={handleSubmitEvaluation}
                      disabled={isEvaluating || (!studentHypothesis && !studentInterventions)}
                      className="rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs px-5 h-10 font-bold flex items-center gap-2 shadow-xs"
                    >
                      <Send className="h-4 w-4" />
                      {isEvaluating ? "Avaliando..." : "Submeter para Revisão"}
                    </Button>
                    <Button
                      onClick={() => {
                        handleSimulatePatientResponse();
                        setActiveStep(5);
                      }}
                      className="rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs px-5 h-10 font-bold flex items-center gap-2 shadow-xs"
                    >
                      Evoluir Paciente <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 5: EVOLUÇÃO DE ENFERMAGEM */}
            {activeStep === 5 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      Etapa 5 do PE: Evolução de Enfermagem
                    </span>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                      Reavaliação Clínica & Resposta às Intervenções
                    </h2>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSimulatePatientResponse}
                    className="rounded-xl text-xs flex items-center gap-1.5 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold"
                  >
                    <Timer className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Recalcular Resposta (30 min)</span>
                  </Button>
                </div>

                {simulatedTimeline ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Status Fisiológico ({simulatedTimeline.elapsedTime})
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Estabilização em Curso
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {simulatedTimeline.clinicalStatus}
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-center text-xs">
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] text-slate-400 dark:text-slate-400 block uppercase">PA Anterior / Atual</span>
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            {simulatedTimeline.vitalsBefore.pa_sistolica}/{simulatedTimeline.vitalsBefore.pa_diastolica} → {simulatedTimeline.vitalsAfter.pa_sistolica}/{simulatedTimeline.vitalsAfter.pa_diastolica}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] text-slate-400 dark:text-slate-400 block uppercase">FC Anterior / Atual</span>
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            {simulatedTimeline.vitalsBefore.fc} → {simulatedTimeline.vitalsAfter.fc} bpm
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] text-slate-400 dark:text-slate-400 block uppercase">FR Anterior / Atual</span>
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            {simulatedTimeline.vitalsBefore.fr} → {simulatedTimeline.vitalsAfter.fr} irpm
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] text-slate-400 dark:text-slate-400 block uppercase">SatO2 Pós-Cuidado</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {simulatedTimeline.vitalsBefore.sat}% → {simulatedTimeline.vitalsAfter.sat}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Registro da Evolução de Enfermagem (Anotação de Prontuário):
                      </label>
                      <Textarea
                        value={studentEvolutionNotes}
                        onChange={(e) => setStudentEvolutionNotes(e.target.value)}
                        placeholder="Ex: Paciente reavaliado 30 minutos após oxigenoterapia e posicionamento em Fowler. Refere melhora da sensação de dispneia. Sinais vitais demonstram eupneia e saturação satisfatória..."
                        className="rounded-xl text-xs border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-[90px]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl space-y-2">
                    <p>Execute as intervenções na etapa anterior ou clique no botão acima para simular a resposta terapêutica.</p>
                    <Button
                      size="sm"
                      onClick={handleSimulatePatientResponse}
                      className="rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-bold"
                    >
                      Simular Resposta Terapêutica
                    </Button>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setActiveStep(4)}
                    className="rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                  >
                    <ArrowLeft className="h-4 w-4" /> Voltar para Implementação
                  </Button>
                  <Button
                    onClick={handleSubmitEvaluation}
                    disabled={isEvaluating}
                    className="rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs px-6 h-10 font-bold flex items-center gap-2 shadow-xs disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" /> {isEvaluating ? "Avaliando Raciocínio..." : "Concluir Estudo de Caso"}
                  </Button>
                </div>
              </div>
            )}
            </div>
          )}
        </div>

        {/* Modal Unificado de Histórico de Casos Clínicos */}
        <CaseHistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          onResumeActivity={handleResumeActivity}
          defaultModuleFilter={MODULE_TYPES.CASE_SIMULATOR}
          lockModuleFilter={true}
          title="Histórico de Simulações de Casos Clínicos"
        />
      </main>

      <StudentFooter />
    </div>
  );
}
