import React, { useState, useEffect, useMemo } from "react";
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
  ClipboardList,
  Eye,
  Check,
  ArrowRightLeft,
  Award,
  MessageSquareQuote,
  History,
  Clock,
  BookmarkPlus,
  Sparkles,
  AlertTriangle,
  HelpCircle,
  CheckCircle,
  Lock,
  Search,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import StudentHeader from "@/components/StudentHeader";
import StudentFooter from "@/components/StudentFooter";
import ClinicalGapRadar from "@/components/ClinicalGapRadar";
import { CASE_LIBRARY, generateRandomFullCase } from "@/lib/caseLibrary";
import { evaluateClinicalReasoning, getScaffoldingHint } from "@/services/socraticTutorService";
import CaseHistoryModal from "@/components/history/CaseHistoryModal";
import { clinicalHistoryService, MODULE_TYPES } from "@/services/clinicalHistoryService";
import {
  NANDA_COMPLETE_CATALOG,
  COMPREHENSIVE_ETIOLOGIES,
  buildCaseEvidences
} from "@/lib/nandaCatalog";
import GotiAnimated from "@/components/mascot/GotiAnimated";
import GotiEvaluationModal from "@/components/mascot/GotiEvaluationModal";
import MobileBottomDock from "@/components/mobile/MobileBottomDock";

export default function CaseStudySimulator() {
  const navigate = useNavigate();
  // Inicialização 100% aleatória do caso clínico (desafio cego)
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(() => Math.floor(Math.random() * CASE_LIBRARY.length));
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

  // Trava de Confirmação Definitiva da Hipótese (sem spoiler prévio)
  const [isDiagnosisConfirmed, setIsDiagnosisConfirmed] = useState(false);

  // Estados dos Seletores Internos dentro da aba de escrita
  const [isDiagnosisComboboxOpen, setIsDiagnosisComboboxOpen] = useState(false);
  const [diagnosisSearchTerm, setDiagnosisSearchTerm] = useState("");
  const [isEtiologySelectorOpen, setIsEtiologySelectorOpen] = useState(false);
  const [etiologySearchTerm, setEtiologySearchTerm] = useState("");
  const [selectedEtiologiesList, setSelectedEtiologiesList] = useState([]);
  const [isEvidenceSelectorOpen, setIsEvidenceSelectorOpen] = useState(false);
  const [evidenceSearchTerm, setEvidenceSearchTerm] = useState("");
  const [selectedEvidencesList, setSelectedEvidencesList] = useState([]);

  // Feedback pedagógico e socrático do Goti (Detetive Clínico) - emitido somente após a confirmação
  const [detectiveFeedback, setDetectiveFeedback] = useState(null);

  const currentCase = cases[selectedCaseIdx] || CASE_LIBRARY[0];

  // Catálogo de Evidências construído para o caso atual (reais + distratores)
  const allCaseEvidences = useMemo(() => {
    return buildCaseEvidences(currentCase);
  }, [currentCase]);

  // Filtro de Diagnósticos NANDA-I para o Combobox Interno
  const filteredDiagnoses = useMemo(() => {
    if (!diagnosisSearchTerm.trim()) {
      return NANDA_COMPLETE_CATALOG.slice(0, 50);
    }
    const q = diagnosisSearchTerm.toLowerCase().trim();
    return NANDA_COMPLETE_CATALOG.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        (d.code && d.code.includes(q)) ||
        (d.domain && d.domain.toLowerCase().includes(q))
    ).slice(0, 50);
  }, [diagnosisSearchTerm]);

  // Filtro de Causas / Etiologias para o Seletor Interno
  const filteredEtiologies = useMemo(() => {
    if (!etiologySearchTerm.trim()) return COMPREHENSIVE_ETIOLOGIES;
    const q = etiologySearchTerm.toLowerCase().trim();
    return COMPREHENSIVE_ETIOLOGIES.filter(
      (item) => item.label.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
    );
  }, [etiologySearchTerm]);

  // Filtro de Evidências Clínicas para o Seletor Interno
  const filteredEvidences = useMemo(() => {
    if (!evidenceSearchTerm.trim()) return allCaseEvidences;
    const q = evidenceSearchTerm.toLowerCase().trim();
    return allCaseEvidences.filter((item) => item.label.toLowerCase().includes(q));
  }, [evidenceSearchTerm, allCaseEvidences]);

  // Ações de seleção de Etiologia dentro da caixa de escrita
  function handleToggleEtiology(term) {
    if (isDiagnosisConfirmed) return;
    setSelectedEtiologiesList((prev) => {
      let updated;
      if (prev.includes(term)) {
        updated = prev.filter((t) => t !== term);
      } else {
        updated = [...prev, term];
      }
      setStudentEtiology(updated.join(", "));
      return updated;
    });
  }

  // Ações de seleção de Evidências dentro da caixa de escrita
  function handleToggleEvidence(term) {
    if (isDiagnosisConfirmed) return;
    setSelectedEvidencesList((prev) => {
      let updated;
      if (prev.includes(term)) {
        updated = prev.filter((t) => t !== term);
      } else {
        updated = [...prev, term];
      }
      setStudentEvidences(updated.join(", "));
      return updated;
    });
  }

  // Confirmação Definitiva da Hipótese: trava as escolhas e emite o parecer do Goti
  function handleConfirmDiagnosis() {
    if (!studentHypothesis.trim() || !studentEtiology.trim() || !studentEvidences.trim()) {
      alert("Por favor, preencha o Título do Diagnóstico, as Causas (Etiologia) e as Evidências antes de confirmar.");
      return;
    }

    setIsDiagnosisConfirmed(true);
    setIsDiagnosisComboboxOpen(false);
    setIsEtiologySelectorOpen(false);
    setIsEvidenceSelectorOpen(false);

    // Auditoria clínica do Goti após a confirmação definitiva
    const v = currentCase?.vitals || {};
    const hasTaquipneia = v.fr && v.fr > 20;
    const studentText = (studentEvidences + " " + studentEtiology).toLowerCase();

    // Checagem de contradição grave (ex: marcou bradipneia em taquipneico)
    if (hasTaquipneia && (studentText.includes("bradipneia") || studentText.includes("fr < 10") || studentText.includes("sem esforço"))) {
      setDetectiveFeedback({
        type: "warning",
        title: "⚠️ Auditoria do Preceptor Goti: Incoerência Clínica Grave Travada",
        text: `Atenção crítica: Você confirmou evidências que contradizem os sinais vitais reais do caso (ex: citou bradipneia ou ausência de desconforto em paciente com taquipneia real de ${v.fr} irpm e hipoxemia). Pela Resolução COFEN nº 736/2024, erros diagnósticos desse porte geram dedução severa na pontuação de acurácia.`,
        question: "Como você corrigirá o impacto dessa contradição no planejamento das metas (Etapa 3)?"
      });
      return;
    }

    // Diagnósticos prioritários esperados para pacientes com acometimento ventilatório/hemodinâmico
    const isRespiratoryFocus = studentHypothesis.toLowerCase().includes("respirat") ||
      studentHypothesis.toLowerCase().includes("gases") ||
      studentHypothesis.toLowerCase().includes("liquido") ||
      studentHypothesis.toLowerCase().includes("debito");

    if (isRespiratoryFocus) {
      setDetectiveFeedback({
        type: "success",
        title: "🔒 Hipótese Prioritária Confirmada e Registrada no Prontuário!",
        text: `Excelente priorização clínica! Você formulou "${studentHypothesis}" alinhado às necessidades vitais mais imediatas (Regra do ABC). A etapa de diagnóstico está travada definitivamente. Siga para o Planejamento das Metas.`,
        question: "Quais metas quantitativas com aprazamento de horário você definirá para reverter este quadro?"
      });
    } else {
      setDetectiveFeedback({
        type: "challenge",
        title: "🔒 Hipótese Travada • Alerta de Priorização (Maslow / ABC)",
        text: `Você confirmou "${studentHypothesis}". Embora possa ser um diagnóstico secundário plausível, atente-se para contemplar os riscos ventilatórios e hemodinâmicos prioritários nas etapas de Metas e Prescrição para não comprometer a segurança do paciente.`,
        question: "Como você garantirá a estabilização respiratória e hemodinâmica durante a execução dos cuidados?"
      });
    }
  }

  // Estados de Avaliação do Goti e Feedback Clínico
  const [tutorEvaluation, setTutorEvaluation] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentHint, setCurrentHint] = useState(null);
  const [hintLevel, setHintLevel] = useState(1);
  const [loadingHint, setLoadingHint] = useState(false);
  const [viewingDebriefing, setViewingDebriefing] = useState(false);
  const [showCofenGuideline, setShowCofenGuideline] = useState(false);
  const [showGotiEvaluationModal, setShowGotiEvaluationModal] = useState(false);

  // Anotações Clínicas e Exame Físico Interativo
  const [showClinicalNotes, setShowClinicalNotes] = useState(false);
  const [activeExamAction, setActiveExamAction] = useState(null);
  const [simulatedTimeline, setSimulatedTimeline] = useState(null);

  // Estado de Parâmetros Adicionados
  const [addedGaps, setAddedGaps] = useState([]);
  const [toastMessage, setToastMessage] = useState("");
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
    setIsDiagnosisConfirmed(false);
    setSelectedEtiologiesList([]);
    setSelectedEvidencesList([]);
    setDetectiveFeedback(null);
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
    setIsDiagnosisConfirmed(false);
    setSelectedEtiologiesList([]);
    setSelectedEvidencesList([]);
    setDetectiveFeedback(null);
    setTutorEvaluation(null);
    setCurrentHint(null);
    setAddedGaps([]);
    setActiveExamAction(null);
    setSimulatedTimeline(null);
    setShowClinicalNotes(false);
    setViewingDebriefing(false);
    setShowCofenGuideline(false);
    setToastMessage("🎲 Novo caso clínico simulado e randomizado sorteado!");
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
    if (!studentHypothesis.trim()) {
      setToastMessage("Por favor, formule o Título do Diagnóstico de Enfermagem na Etapa 2 antes de concluir.");
      setTimeout(() => setToastMessage(""), 4000);
      setActiveStep(2);
      return;
    }

    setIsEvaluating(true);
    try {
      const res = await evaluateClinicalReasoning({
        caseData: currentCase,
        studentHypothesis: studentHypothesis.trim(),
        studentJustification: [
          studentEtiology ? `Etiologia: ${studentEtiology}` : "",
          studentEvidences ? `Evidências: ${studentEvidences}` : "",
          studentAssessmentNotes ? `Avaliação: ${studentAssessmentNotes}` : ""
        ].filter(Boolean).join(" | "),
        studentInterventions: [
          studentInterventions ? `Prescrição: ${studentInterventions}` : "",
          studentGoals ? `Metas: ${studentGoals}` : ""
        ].filter(Boolean).join(" | "),
        studentEvolution: studentEvolutionNotes || ""
      });

      setTutorEvaluation(res);
      setViewingDebriefing(true);
      setShowGotiEvaluationModal(true);
      window.scrollTo({ top: 320, behavior: "smooth" });

      try {
        const submitted = clinicalHistoryService.submitActivity({
          id: currentActivityId,
          moduleType: MODULE_TYPES.CASE_SIMULATOR,
          title: `Caso Clínico: ${currentCase.title}`,
          patientInfo: `${currentCase.patient?.name || "Paciente"} • ${currentCase.category || "Enfermaria"}`,
          durationSeconds: activitySeconds,
          score: typeof res?.score === "number" ? res.score : (res?.overallScore || 85),
          evaluation: res,
          formData: {
            selectedCaseIdx,
            studentHypothesis,
            studentEtiology,
            studentEvidences,
            studentGoals,
            studentInterventions,
            studentEvolutionNotes,
            studentAssessmentNotes
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
    <div className="min-h-screen bg-[#0B131D] flex flex-col text-[#EAF2F8] pb-28 md:pb-8 selection:bg-[#20D5B5]/30 selection:text-[#20D5B5]">
      <StudentHeader activeTab="casos" />

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 py-6 space-y-6">
        {/* Barra Superior Oficial (Páginas 4 a 7 do PDF) */}
        <div className="rounded-3xl border border-[#1F3045] bg-[#131F2E] px-5 py-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">
                Simulador de Casos Clínicos
              </h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#20D5B5]/15 text-[#20D5B5] border border-[#20D5B5]/30 uppercase tracking-wide">
                COFEN 736/2024
              </span>
              {/* Cronômetro */}
              <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-xl bg-[#0E1722] text-[#9FB3C6] border border-[#1F3045]">
                <Clock className="h-3.5 w-3.5 text-[#20D5B5]" />
                <span>{clinicalHistoryService.formatDuration(activitySeconds)}</span>
              </span>
            </div>
            <p className="text-xs text-[#9FB3C6]">
              Pratique as 5 etapas do Processo de Enfermagem com debriefing e suporte à beira-leito.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
            {/* Salvar Rascunho */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              className="rounded-xl border-[#1F3045] bg-[#16222E] text-[#9FB3C6] hover:text-white hover:bg-[#1E2E3E] text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
              title="Salvar rascunho do caso clínico no Histórico"
            >
              <BookmarkPlus className="h-3.5 w-3.5 text-[#20D5B5]" />
              <span className="hidden sm:inline">Salvar Rascunho</span>
            </Button>

            {/* Histórico do Módulo */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHistoryOpen(true)}
              className="rounded-xl border-[#1F3045] bg-[#16222E] text-[#9FB3C6] hover:text-white hover:bg-[#1E2E3E] text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
            >
              <History className="h-3.5 w-3.5 text-[#20D5B5]" />
              <span className="hidden sm:inline">Histórico</span>
            </Button>

            <Button
              onClick={() => navigate('/passagem-plantao', { state: { caseData: currentCase } })}
              variant="outline"
              className="rounded-xl border-[#1F3045] bg-[#16222E] text-[#20D5B5] hover:bg-[#20D5B5]/10 text-xs flex items-center gap-2 font-semibold shadow-2xs"
              title="Pratique a passagem de plantão deste paciente na metodologia SBAR"
            >
              <ArrowRightLeft className="h-4 w-4 text-[#20D5B5]" />
              <span>Passar Plantão (SBAR)</span>
            </Button>
            <Button
              onClick={handleGenerateRandom}
              className="rounded-xl bg-[#20D5B5] hover:bg-[#1AD1B0] text-[#0B131D] text-xs flex items-center gap-2 font-bold shadow-[0_3px_0_0_#148A76] active:translate-y-0.5"
            >
              <Shuffle className="h-4 w-4" />
              <span>Novo Caso</span>
            </Button>
          </div>
        </div>

        {/* Notificação Toast */}
        {toastMessage && (
          <div className="p-3.5 rounded-2xl bg-[#131F2E] border border-[#20D5B5]/40 text-white text-xs flex items-center gap-2 animate-in fade-in shadow-lg">
            <CheckCircle2 className="h-4 w-4 text-[#20D5B5] shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Card de Acesso Rápido ao Histórico de Casos & Rascunhos (Página 4 do PDF) */}
        <div
          onClick={() => setIsHistoryOpen(true)}
          className="p-4 sm:p-5 rounded-3xl bg-[#131F2E] border border-[#1F3045] hover:border-[#20D5B5]/50 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-[#0E1722] border border-[#1F3045] text-[#20D5B5] group-hover:scale-105 transition-transform shadow-2xs">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <span>Consultar Histórico de Casos & Rascunhos Anteriores</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#20D5B5]/15 text-[#20D5B5] border border-[#20D5B5]/30">
                  Retomar Atividades
                </span>
              </h4>
              <p className="text-[11px] text-[#9FB3C6] mt-0.5">
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
            className="rounded-xl border-[#1F3045] bg-[#16222E] text-[#9FB3C6] text-xs font-semibold hover:text-white hover:bg-[#1E2E3E] shrink-0"
          >
            <span>Abrir Histórico</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1 text-[#20D5B5]" />
          </Button>
        </div>

        {/* Card do Paciente e Caso Clínico (Página 4 do PDF) */}
        <div className="rounded-3xl border border-[#1F3045] bg-[#131F2E] p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0E1722] border border-[#1F3045] flex items-center justify-center shrink-0 text-[#20D5B5]">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#20D5B5]/15 text-[#20D5B5] border border-[#20D5B5]/30 uppercase tracking-wide">
                  {viewingDebriefing ? currentCase.category : (currentCase.category || "Cardiologia")}
                </span>
                <span className="text-xs text-[#9FB3C6] font-medium">
                  Leito {currentCase.patient?.bed || "Enfermaria"} · Caso Clínico Simulado
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                {viewingDebriefing ? (
                  <>
                    <span className="text-[#20D5B5]">Diagnóstico Revelado:</span> {currentCase.title}
                  </>
                ) : (
                  <>
                    <span>{currentCase.title || `Caso Clínico Simulado #${currentCase.id || selectedCaseIdx + 1}`}</span>
                  </>
                )}
              </h2>
              <p className="text-xs text-[#9FB3C6]">
                Paciente <strong className="text-[#EAF2F8]">{currentCase.patient?.name || "S. S."}</strong> (Caso Simulado #{currentCase.id || selectedCaseIdx + 101}) · {currentCase.patient?.age || "76"} anos · {currentCase.patient?.gender || "M"}
              </p>
            </div>
          </div>

          <Button
            onClick={handleGenerateRandom}
            variant="outline"
            className="rounded-2xl border-[#1F3045] bg-[#16222E] text-[#20D5B5] hover:bg-[#20D5B5]/10 text-xs font-bold flex items-center gap-2 shadow-2xs self-start md:self-auto shrink-0 py-2.5 px-4"
          >
            <Shuffle className="h-4 w-4 text-[#20D5B5]" />
            <span>Sortear Novo Caso Clínico</span>
          </Button>
        </div>

        {/* BARRA HORIZONTAL DAS 5 ETAPAS DO PROCESSO DE ENFERMAGEM (Página 4 do PDF) */}
        <div className="bg-[#131F2E] rounded-2xl border border-[#1F3045] p-1.5 shadow-xs">
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
                    className={`py-2 px-1.5 rounded-xl text-xs font-black transition-all ${
                      isCurrent
                        ? "bg-[#20D5B5] text-[#0B131D] shadow-sm"
                        : "text-[#9FB3C6] hover:bg-[#16222E] hover:text-[#EAF2F8]"
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
                  className={`py-1.5 px-3 rounded-xl text-xs font-black flex items-center gap-1.5 transition ${
                    viewingDebriefing
                      ? "bg-[#20D5B5] text-[#0B131D] shadow-xs"
                      : "bg-[#16222E] text-[#20D5B5] border border-[#1F3045] hover:bg-[#1E2E3E]"
                  }`}
                >
                  <Award className="h-3.5 w-3.5" />
                  <span>Conclusão ({tutorEvaluation.score}%)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* WORKSPACE CENTRAL LIMPO (Sem ruído lateral - CLT / Sweller) */}
        <div className="max-w-4xl mx-auto w-full">
          {viewingDebriefing && tutorEvaluation ? (
            /* ========================================================================= */
            /* DEBRIEFING CLÍNICO COM O GOTI (FRAMEWORK PEARLS / DML - Miller Nível 3)  */
            /* ========================================================================= */
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-[#131F2E] rounded-3xl border border-[#1F3045] p-6 shadow-xs space-y-5">
                {/* Cabeçalho da Conclusão (Página 7 do PDF) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1F3045] pb-4 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#20D5B5]/15 text-[#20D5B5] border border-[#20D5B5]/30 uppercase tracking-wide">
                      CONCLUSÃO · AVALIAÇÃO FORMATIVA
                    </span>
                    <h2 className="text-xl font-black text-white mt-1">
                      Parecer Pedagógico & Desconstrução do Raciocínio
                    </h2>
                    <p className="text-xs text-[#9FB3C6]">
                      Goti IA · {currentCase.title}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 bg-[#0E1722] p-3.5 rounded-2xl border border-[#1F3045] shrink-0">
                    <div
                      className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
                      onClick={() => setShowGotiEvaluationModal(true)}
                      title="Clique para ver a comemoração e parecer completo do Goti!"
                    >
                      <GotiAnimated
                        animation={tutorEvaluation.score >= 80 ? "celebrate" : tutorEvaluation.score >= 50 ? "pointing" : "thinking"}
                        size={64}
                        className="shrink-0"
                      />
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-[#9FB3C6] uppercase tracking-wider block">Acurácia Diagnóstica</span>
                      <span className="text-3xl font-black text-[#FFC247] leading-none">{tutorEvaluation.score}%</span>
                    </div>
                  </div>
                </div>

                {/* Resumo Transparente das Respostas Submetidas pelo Estudante (Página 7 do PDF) */}
                <div className="p-4 rounded-2xl bg-[#0E1722] border border-[#1F3045] space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#20D5B5] flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
                      <ClipboardList className="h-3.5 w-3.5 text-[#20D5B5]" />
                      RESPOSTAS ENVIADAS PARA AUDITORIA DO GOTI
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#20D5B5]/15 text-[#20D5B5] border border-[#20D5B5]/30">
                      Registrado no Prontuário
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[#9FB3C6] pt-1">
                    <div>
                      <strong className="text-white block text-xs">Diagnóstico Prioritário</strong>
                      <span className="text-[#20D5B5] font-semibold">{studentHypothesis || "Volume de líquidos excessivo"}</span>
                    </div>
                    <div>
                      <strong className="text-white block text-xs">Etiologia / Causa</strong>
                      <span>{studentEtiology || "Hipervolemia e congestão pulmonar secundária, idade avançada"}</span>
                    </div>
                    <div className="md:col-span-2">
                      <strong className="text-white block text-xs">Evidências / Sinais Clínicos</strong>
                      <span>{studentEvidences || "Dessaturação (SpO2: 89%), PA 160/95 mmHg, taquipneia acentuada (FR: 26 irpm)"}</span>
                    </div>
                  </div>
                </div>

                {/* Fase 1: Análise da Decisão Clínica */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                    <ClipboardList className="h-4 w-4 text-[#20D5B5]" />
                    Análise do Julgamento Clínico
                  </span>
                  <div className="p-4 rounded-2xl bg-[#0E1722] border border-[#1F3045] text-xs sm:text-sm text-[#EAF2F8] leading-relaxed">
                    <p>{tutorEvaluation.reasoningAnalysis || tutorEvaluation.feedbackTitle || `Você formulou a hipótese de ${studentHypothesis || "Volume de líquidos excessivo"}. O raciocínio clínico demonstrou correlação fisiopatológica com a sobrecarga de volume.`}</p>
                  </div>
                </div>

                {/* Fase 2: Provocação Socrática */}
                {tutorEvaluation.reflectiveQuestion && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[#FFC247] uppercase tracking-wide flex items-center gap-1.5">
                      <MessageSquareQuote className="h-4 w-4 text-[#FFC247]" />
                      Pergunta do Goti para Reflexão
                    </span>
                    <div className="p-4 rounded-2xl bg-[#FFC247]/10 border border-[#FFC247]/30 text-xs sm:text-sm text-[#EAF2F8] leading-relaxed space-y-1">
                      <p className="font-semibold italic text-[#FFC247]">"{tutorEvaluation.reflectiveQuestion}"</p>
                      <p className="text-[11px] text-[#9FB3C6] pt-1 border-t border-[#FFC247]/20">
                        Ponto de Aprendizagem: Esta pergunta visa consolidar o raciocínio dedutivo para evitar eventos sentinela na prática beira-leito.
                      </p>
                    </div>
                  </div>
                )}

                {/* Ações Finais do Debriefing (Página 7 do PDF) */}
                <div className="pt-4 border-t border-[#1F3045] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setViewingDebriefing(false)}
                    className="rounded-2xl border-[#1F3045] bg-[#16222E] text-[#9FB3C6] hover:text-white hover:bg-[#1E2E3E] text-xs font-bold flex items-center gap-1.5 w-full sm:w-auto h-11"
                  >
                    <ArrowLeft className="h-4 w-4" /> Revisar Etapas do Caso
                  </Button>

                  <Button
                    onClick={handleGenerateRandom}
                    className="w-full sm:w-auto rounded-2xl bg-[#20D5B5] hover:bg-[#1AD1B0] text-[#0B131D] text-xs font-black flex items-center justify-center gap-2 shadow-[0_4px_0_0_#148A76] active:translate-y-1 h-11 px-8"
                  >
                    <Shuffle className="h-4 w-4" /> <span>Novo Caso</span>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* ETAPA 1: AVALIAÇÃO / COLETA DE DADOS (Página 4 do PDF) */}
              {activeStep === 1 && (
              <div className="space-y-5 animate-in fade-in">
                {/* Prontuário do Paciente */}
                <div className="bg-[#131F2E] rounded-3xl border border-[#1F3045] p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1F3045] pb-3 gap-2">
                    <div>
                      <span className="text-xs font-bold text-[#20D5B5] bg-[#20D5B5]/15 px-2.5 py-0.5 rounded-full border border-[#20D5B5]/30">
                        {currentCase.category || "Cardiologia"}
                      </span>
                      <h2 className="text-base font-bold text-white mt-1.5">
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
                            ? "bg-[#20D5B5] text-[#0B131D] font-bold"
                            : "border-[#1F3045] bg-[#16222E] text-[#9FB3C6] hover:text-white hover:bg-[#1E2E3E]"
                        }`}
                      >
                        <Eye className="h-3.5 w-3.5 text-[#20D5B5]" />
                        <span>{showClinicalNotes ? "Ocultar Pistas" : "Anotações Clínicas"}</span>
                      </Button>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#0E1722] border border-[#1F3045] text-[#9FB3C6]">
                        {currentCase.patient.name} · {currentCase.patient.age}a · {currentCase.patient.gender}
                      </span>
                    </div>
                  </div>

                  {/* Anamnese & Resumo Clínico */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#0E1722] border border-[#1F3045] space-y-2.5 text-xs text-[#EAF2F8]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs block">Histórico & Motivo de Admissão</span>
                      <span className="text-[10px] text-[#9FB3C6] font-medium">Anotações Clínicas</span>
                    </div>
                    <p className="leading-relaxed text-[#9FB3C6]">
                      {currentCase.patient.previous_anamnesis}
                    </p>

                    {showClinicalNotes && (
                      <div className="mt-2 pt-2 border-t border-[#1F3045] flex flex-wrap gap-2 text-[11px]">
                        <span className="bg-[#FFC247]/15 text-[#FFC247] px-2.5 py-1 rounded-md font-semibold border border-[#FFC247]/30">
                          💡 Pista: Retenção volêmica aguda & dispneia progressiva
                        </span>
                        <span className="bg-[#F0645F]/15 text-[#F0645F] px-2.5 py-1 rounded-md font-semibold border border-[#F0645F]/30">
                          💡 Risco: Descompensação ventilatória iminente
                        </span>
                      </div>
                    )}

                    <div className="text-[#9FB3C6] pt-1 text-[11px] border-t border-[#1F3045]">
                      <strong className="text-white">Antecedentes:</strong> {currentCase.patient.medical_history} | <strong className="text-white">Medicações:</strong> {currentCase.patient.current_medications}
                    </div>
                  </div>

                  {/* Sinais Vitais do Paciente (Monitor 1:1 com a Página 4 do PDF) */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                    <div className="p-3 rounded-2xl bg-[#16222E] border border-[#FFC247]/40 text-center shadow-xs">
                      <span className="text-[10px] font-black text-[#FFC247] uppercase block tracking-wider">▲ PA</span>
                      <div className="text-sm sm:text-base font-black text-white mt-0.5">
                        {currentCase.vitals.pa_sistolica}/{currentCase.vitals.pa_diastolica} <span className="text-[10px] font-normal text-[#9FB3C6]">mmHg</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#16222E] border border-[#FFC247]/40 text-center shadow-xs">
                      <span className="text-[10px] font-black text-[#FFC247] uppercase block tracking-wider">▲ FC</span>
                      <div className="text-sm sm:text-base font-black text-white mt-0.5">
                        {currentCase.vitals.fc} <span className="text-[10px] font-normal text-[#9FB3C6]">bpm</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#16222E] border border-[#FFC247]/40 text-center shadow-xs">
                      <span className="text-[10px] font-black text-[#FFC247] uppercase block tracking-wider">▲ FR</span>
                      <div className="text-sm sm:text-base font-black text-white mt-0.5">
                        {currentCase.vitals.fr} <span className="text-[10px] font-normal text-[#9FB3C6]">irpm</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#16222E] border border-[#1F3045] text-center shadow-xs">
                      <span className="text-[10px] font-bold text-[#9FB3C6] uppercase block tracking-wider">Tax</span>
                      <div className="text-sm sm:text-base font-black text-white mt-0.5">
                        {currentCase.vitals.tax} <span className="text-[10px] font-normal text-[#9FB3C6]">°C</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#16222E] border border-[#F0645F]/50 text-center col-span-2 sm:col-span-1 shadow-xs">
                      <span className="text-[10px] font-black text-[#F0645F] uppercase block tracking-wider">✕ SatO2</span>
                      <div className="text-sm sm:text-base font-black text-[#F0645F] mt-0.5">
                        {currentCase.vitals.sat} <span className="text-[10px] font-normal text-[#9FB3C6]">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Ações de Exame Físico à Beira-leito (Página 4 do PDF) */}
                  <div className="space-y-2.5 pt-2 border-t border-[#1F3045]">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-[#20D5B5] uppercase tracking-wider">
                        EXAME FÍSICO · TOQUE PARA COLETAR ACHADOS
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {physicalExamActions.map((act) => {
                        const isSelected = activeExamAction?.id === act.id;
                        return (
                          <button
                            key={act.id}
                            type="button"
                            onClick={() => setActiveExamAction(isSelected ? null : act)}
                            className={`p-3 rounded-2xl border text-left transition-all ${
                              isSelected
                                ? "bg-[#20D5B5]/15 border-[#20D5B5] ring-1 ring-[#20D5B5] shadow-xs text-white"
                                : "bg-[#16222E] border-[#1F3045] hover:border-[#20D5B5]/50 text-[#EAF2F8]"
                            }`}
                          >
                            <span className="text-xs font-bold block truncate">{act.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {activeExamAction && (
                      <div className="p-4 rounded-2xl bg-[#0E1722] border border-[#1F3045] space-y-2 animate-in fade-in">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-white block">
                              Achado: {activeExamAction.label}
                            </span>
                            <p className="text-xs text-[#9FB3C6] leading-relaxed">
                              "{activeExamAction.finding}"
                            </p>
                            <p className="text-[11px] text-[#20D5B5]">
                              <strong>Significado:</strong> {activeExamAction.clinicalMeaning}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAppendFinding(activeExamAction.finding)}
                            className="rounded-xl bg-[#20D5B5] hover:bg-[#1AD1B0] text-[#0B131D] text-[11px] shrink-0 h-8 font-black flex items-center gap-1"
                          >
                            <Plus className="h-3.5 w-3.5" /> Adicionar
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
                    <label className="text-xs font-bold text-white block">
                      Anotações de Avaliação do Estudante (Dados Relevantes Coletados):
                    </label>
                    <Textarea
                      value={studentAssessmentNotes}
                      onChange={(e) => setStudentAssessmentNotes(e.target.value)}
                      placeholder="Descreva os dados subjetivos e objetivos identificados na anamnese e no exame físico..."
                      className="rounded-2xl text-xs border-[#1F3045] bg-[#0E1722] text-[#EAF2F8] min-h-[80px] focus:border-[#20D5B5] focus:ring-[#20D5B5]"
                    />
                  </div>

                  {/* Botão de Ação Próxima Etapa 3D (Página 4 do PDF) */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveStep(2)}
                      className="w-full py-3.5 rounded-2xl bg-[#20D5B5] hover:bg-[#1AD1B0] text-[#0B131D] font-black text-sm tracking-wide shadow-[0_4px_0_0_#148A76] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                      <span>Próxima etapa</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 2: DIAGNÓSTICO DE ENFERMAGEM (1:1 com a Página 5 do PDF) */}
            {activeStep === 2 && (
              <div className="bg-[#131F2E] rounded-3xl border border-[#1F3045] p-5 sm:p-7 shadow-xs space-y-6 animate-in fade-in duration-300">
                {/* 1. CALLOUT SOCRÁTICO DO GOTI PRECEPTOR (Página 5 do PDF) */}
                <div className="rounded-3xl bg-[#0E1722] border border-[#1F3045] p-4 sm:p-5 shadow-sm flex items-start gap-4">
                  <div className="shrink-0 pt-0.5">
                    <GotiAnimated animation="thinking" size={54} className="w-14 h-14 drop-shadow-md" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-[#20D5B5] tracking-tight">
                        Raciocínio Fisiopatológico Preciso!
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#20D5B5]/15 text-[#20D5B5] border border-[#20D5B5]/30">
                        Preceptoria IA
                      </span>
                    </div>
                    <p className="text-xs text-[#EAF2F8] leading-relaxed">
                      Muito bom! A hipervolemia é a etiologia central da congestão pulmonar observada na ausculta.
                    </p>
                    <p className="text-xs font-semibold text-[#9FB3C6] italic pt-1 border-t border-[#1F3045]">
                      Quais achados da anamnese ou da ausculta comprovam a sobrecarga hídrica?
                    </p>
                  </div>
                </div>

                {/* Dica Revelada pelo Goti */}
                {currentHint && (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-3.5 animate-in fade-in shadow-2xs">
                    <GotiAnimated animation="pointing" size="sm" className="w-14 h-14 shrink-0 mt-0.5 drop-shadow-sm" />
                    <div className="space-y-1">
                      <span className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300 text-xs">
                        <Lightbulb className="h-4 w-4 text-amber-600" /> Dica de Raciocínio Clínico do Preceptor:
                      </span>
                      <p className="leading-relaxed text-slate-800 dark:text-amber-100">{currentHint.content}</p>
                    </div>
                  </div>
                )}

                {/* Feedback Lúdico do Detetive Goti */}
                {detectiveFeedback && (
                  <div
                    className={`p-4 rounded-2xl border text-xs flex items-start gap-3.5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
                      detectiveFeedback.type === "success"
                        ? "bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100"
                        : detectiveFeedback.type === "challenge"
                        ? "bg-amber-50/95 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-100"
                        : detectiveFeedback.type === "warning"
                        ? "bg-rose-50/95 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-950 dark:text-rose-100"
                        : "bg-teal-50/90 dark:bg-teal-950/50 border-teal-300 dark:border-teal-800 text-teal-950 dark:text-teal-100"
                    }`}
                  >
                    <GotiAnimated
                      animation={
                        detectiveFeedback.type === "success"
                          ? "jumping"
                          : detectiveFeedback.type === "warning"
                          ? "thinking"
                          : "pointing"
                      }
                      size="feedback"
                      className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 drop-shadow-md"
                    />
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm flex items-center gap-1.5">
                          {detectiveFeedback.type === "success" && <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                          {detectiveFeedback.type === "challenge" && <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                          {detectiveFeedback.type === "warning" && <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                          {detectiveFeedback.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => setDetectiveFeedback(null)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="leading-relaxed">{detectiveFeedback.text}</p>
                      {detectiveFeedback.question && (
                        <p className="font-semibold italic text-[11px] opacity-90 border-t border-slate-200/60 dark:border-slate-800/80 pt-1 mt-1">
                          💬 {detectiveFeedback.question}
                        </p>
                      )}
                      {detectiveFeedback.onConfirm && (
                        <div className="pt-2 flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={detectiveFeedback.onConfirm}
                            className="rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-2xs h-8"
                          >
                            {detectiveFeedback.actionLabel || "Confirmar Escolha"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setDetectiveFeedback(null)}
                            className="rounded-xl text-xs h-8 text-slate-600 dark:text-slate-300"
                          >
                            Reavaliar Pistas
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. OS 3 PILARES DO DIAGNÓSTICO (1:1 COM A PÁGINA 5 DO PDF) */}
                <div className="space-y-4">
                  {/* PILAR 1: TÍTULO DIAGNÓSTICO NANDA-I */}
                  <div className="space-y-3 p-4 sm:p-5 rounded-3xl bg-[#0E1722] border border-[#1F3045]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <label className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                        <span>1. Título do Diagnóstico de Enfermagem Prioritário (NANDA-I / CIPE)</span>
                        {isDiagnosisConfirmed && <Lock className="w-3.5 h-3.5 text-[#FFC247]" />}
                      </label>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#20D5B5]/15 text-[#20D5B5] border border-[#20D5B5]/30 self-start sm:self-auto">
                        Sugestões automáticas ativas
                      </span>
                    </div>

                    <div className="relative">
                      <div
                        onClick={() => {
                          if (!isDiagnosisConfirmed) {
                            setIsDiagnosisComboboxOpen(!isDiagnosisComboboxOpen);
                          }
                        }}
                        className={`w-full min-h-[46px] px-4 py-2.5 rounded-2xl border text-xs sm:text-sm flex items-center justify-between cursor-pointer transition ${
                          isDiagnosisConfirmed
                            ? "bg-[#131F2E] border-[#1F3045] opacity-90 cursor-not-allowed"
                            : "bg-[#0B131D] border-[#1F3045] hover:border-[#20D5B5]"
                        }`}
                      >
                        <span className="font-bold text-white truncate">
                          {studentHypothesis || "Volume de líquidos excessivo"}
                        </span>
                        {!isDiagnosisConfirmed && (
                          <ChevronDown className={`w-4 h-4 text-[#9FB3C6] transition-transform ${isDiagnosisComboboxOpen ? "rotate-180" : ""}`} />
                        )}
                      </div>

                      {/* Dropdown / Popover Interno com Pesquisa */}
                      {isDiagnosisComboboxOpen && !isDiagnosisConfirmed && (
                        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-[#131F2E] border border-[#20D5B5]/40 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in">
                          <div className="p-3 border-b border-[#1F3045] bg-[#0E1722] space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white">
                                Catálogo NANDA-I (2024-2026)
                              </span>
                              <button
                                type="button"
                                onClick={() => setIsDiagnosisComboboxOpen(false)}
                                className="text-[#9FB3C6] hover:text-white text-xs px-2 py-0.5 rounded"
                              >
                                Fechar ✕
                              </button>
                            </div>
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9FB3C6]" />
                              <input
                                type="text"
                                value={diagnosisSearchTerm}
                                onChange={(e) => setDiagnosisSearchTerm(e.target.value)}
                                placeholder="Filtrar por título..."
                                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#1F3045] bg-[#0B131D] text-xs text-white focus:outline-hidden focus:border-[#20D5B5]"
                                autoFocus
                              />
                            </div>
                          </div>

                          <div className="max-h-52 overflow-y-auto divide-y divide-[#1F3045]">
                            {filteredDiagnoses.map((diag) => (
                              <button
                                key={diag.code || diag.title}
                                type="button"
                                onClick={() => {
                                  setStudentHypothesis(diag.title);
                                  setIsDiagnosisComboboxOpen(false);
                                }}
                                className={`w-full text-left p-3 transition flex items-center justify-between ${
                                  studentHypothesis === diag.title
                                    ? "bg-[#20D5B5]/15 text-[#20D5B5] font-bold"
                                    : "hover:bg-[#16222E] text-[#9FB3C6] hover:text-white"
                                }`}
                              >
                                <span className="text-xs">{diag.title}</span>
                                <span className="text-[10px] font-mono text-[#9FB3C6]">{diag.code ? `Cód: ${diag.code}` : "NANDA"}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>


                  </div>

                  {/* PILAR 2: FATORES RELACIONADOS / ETIOLOGIA (Página 5 do PDF) */}
                  <div className="space-y-3 p-4 sm:p-5 rounded-3xl bg-[#0E1722] border border-[#1F3045]">
                    <label className="text-xs sm:text-sm font-bold text-white block">
                      2. Fatores Relacionados / Etiologia
                    </label>

                    <Textarea
                      value={studentEtiology || ""}
                      onChange={(e) => setStudentEtiology(e.target.value)}
                      placeholder="Descreva a causa fisiopatológica / etiologia com suas próprias palavras..."
                      className="rounded-2xl bg-[#0B131D] border-[#1F3045] text-xs sm:text-sm text-white min-h-[70px] focus:border-[#20D5B5]"
                    />
                  </div>

                  {/* PILAR 3: CARACTERÍSTICAS DEFINIDORAS (Página 5 do PDF) */}
                  <div className="space-y-3 p-4 sm:p-5 rounded-3xl bg-[#0E1722] border border-[#1F3045]">
                    <label className="text-xs sm:text-sm font-bold text-white block">
                      3. Características Definidoras / Evidências Clínicas
                    </label>

                    <Textarea
                      value={studentEvidences || ""}
                      onChange={(e) => setStudentEvidences(e.target.value)}
                      placeholder="Descreva os sinais clínicos e evidências que fundamentam o diagnóstico..."
                      className="rounded-2xl bg-[#0B131D] border-[#1F3045] text-xs sm:text-sm text-white min-h-[70px] focus:border-[#20D5B5]"
                    />
                  </div>
                </div>

                {/* BOTÕES DE NAVEGAÇÃO INFERIOR (Página 5 do PDF) */}
                <div className="pt-4 border-t border-[#1F3045] flex items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setActiveStep(1)}
                    className="rounded-2xl border-[#1F3045] bg-[#16222E] text-[#9FB3C6] hover:text-white hover:bg-[#1E2E3E] text-xs font-bold flex items-center gap-1.5 h-11 px-5"
                  >
                    <ArrowLeft className="h-4 w-4" /> Voltar
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDiagnosisConfirmed(true);
                      setActiveStep(3);
                    }}
                    className="flex-1 sm:flex-none py-3 px-8 rounded-2xl bg-[#20D5B5] hover:bg-[#1AD1B0] text-[#0B131D] text-xs font-black shadow-[0_4px_0_0_#148A76] active:translate-y-1 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Avançar para Planejamento</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-3">
                  <div>
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      Etapa 4 do PE: Implementação
                    </span>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                      Prescrição de Cuidados de Enfermagem & Conduta Prática
                    </h2>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(
                          new CustomEvent("open-goti-chat", {
                            detail: {
                              prompt: `Olá Goti! Estou prescrevendo as intervenções de enfermagem para o paciente ${currentCase?.patient?.name || ''}. Como estruturo os cuidados com verbos no infinitivo, aprazamento e metas seguras? Pode me dar um exemplo didático modelo similar sem me dar a resposta deste caso?`
                            }
                          })
                        );
                      }
                    }}
                    className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs py-2 px-3 self-start sm:self-auto tap-press"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Dúvidas? Fale com o Goti!</span>
                  </Button>
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

            {/* ETAPA 5: EVOLUÇÃO DE ENFERMAGEM (1:1 com a Página 6 do PDF) */}
            {activeStep === 5 && (
              <div className="bg-[#131F2E] rounded-3xl border border-[#1F3045] p-5 sm:p-6 shadow-xs space-y-5 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1F3045] pb-3 gap-2">
                  <div>
                    <span className="text-xs font-bold text-[#20D5B5] bg-[#20D5B5]/15 px-2.5 py-1 rounded-xl border border-[#20D5B5]/30">
                      Etapa 5 do PE: Evolução de Enfermagem
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-white mt-1.5">
                      Reavaliação Clínica & Resposta às Intervenções
                    </h2>
                  </div>

                </div>

                <div className="space-y-4">
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#0E1722] border border-[#1F3045] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        Status Fisiológico (30 min após intervenções)
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Estabilização em Curso
                      </span>
                    </div>
                    <p className="text-xs text-[#9FB3C6] leading-relaxed">
                      {simulatedTimeline?.clinicalStatus || "Paciente com padrão respiratório mais regular, menor esforço ventilatório e perfusão periférica melhorada."}
                    </p>

                    {/* Comparativo de Sinais Vitais com Setas (1:1 com a Página 6 do PDF) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 text-center text-xs">
                      <div className="p-3 rounded-2xl bg-[#16222E] border border-[#1F3045] space-y-1">
                        <span className="text-[10px] text-[#9FB3C6] block font-semibold uppercase">PA anterior → atual</span>
                        <div className="font-black text-white text-sm">
                          {simulatedTimeline ? `${simulatedTimeline.vitalsBefore.pa_sistolica}/${simulatedTimeline.vitalsBefore.pa_diastolica} → ${simulatedTimeline.vitalsAfter.pa_sistolica}/${simulatedTimeline.vitalsAfter.pa_diastolica}` : "160/95 → 145/95"}
                        </div>
                        <span className="text-emerald-400 text-xs block font-bold">▼</span>
                      </div>
                      <div className="p-3 rounded-2xl bg-[#16222E] border border-[#1F3045] space-y-1">
                        <span className="text-[10px] text-[#9FB3C6] block font-semibold uppercase">FC anterior → atual</span>
                        <div className="font-black text-white text-sm">
                          {simulatedTimeline ? `${simulatedTimeline.vitalsBefore.fc} → ${simulatedTimeline.vitalsAfter.fc} bpm` : "104 → 86 bpm"}
                        </div>
                        <span className="text-emerald-400 text-xs block font-bold">▼</span>
                      </div>
                      <div className="p-3 rounded-2xl bg-[#16222E] border border-[#1F3045] space-y-1">
                        <span className="text-[10px] text-[#9FB3C6] block font-semibold uppercase">FR anterior → atual</span>
                        <div className="font-black text-white text-sm">
                          {simulatedTimeline ? `${simulatedTimeline.vitalsBefore.fr} → ${simulatedTimeline.vitalsAfter.fr} irpm` : "26 → 20 irpm"}
                        </div>
                        <span className="text-emerald-400 text-xs block font-bold">▼</span>
                      </div>
                      <div className="p-3 rounded-2xl bg-[#16222E] border border-[#1F3045] space-y-1">
                        <span className="text-[10px] text-[#9FB3C6] block font-semibold uppercase">SatO2 pós-cuidado</span>
                        <div className="font-black text-[#20D5B5] text-sm">
                          {simulatedTimeline ? `${simulatedTimeline.vitalsBefore.sat}% → ${simulatedTimeline.vitalsAfter.sat}%` : "89% → 95%"}
                        </div>
                        <span className="text-emerald-400 text-xs block font-bold">▲</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#20D5B5] uppercase tracking-wider block">
                      REGISTRO DA EVOLUÇÃO DE ENFERMAGEM (ANOTAÇÃO DE PRONTUÁRIO)
                    </label>
                    <Textarea
                      value={studentEvolutionNotes}
                      onChange={(e) => setStudentEvolutionNotes(e.target.value)}
                      placeholder="Ex: Paciente reavaliado 30 minutos após oxigenoterapia e posicionamento em Fowler. Refere melhora da sensação de dispneia..."
                      className="rounded-2xl text-xs border-[#1F3045] bg-[#0E1722] text-[#EAF2F8] min-h-[90px] focus:border-[#20D5B5] focus:ring-[#20D5B5]"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1F3045] flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setActiveStep(4)}
                    className="rounded-2xl border-[#1F3045] bg-[#16222E] text-[#9FB3C6] hover:text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs py-3 px-5"
                  >
                    <ArrowLeft className="h-4 w-4" /> Voltar
                  </Button>
                  <button
                    type="button"
                    onClick={handleSubmitEvaluation}
                    disabled={isEvaluating}
                    className="py-3 px-6 rounded-2xl bg-[#20D5B5] hover:bg-[#1AD1B0] text-[#0B131D] font-black text-xs tracking-wide shadow-[0_4px_0_0_#148A76] active:translate-y-1 active:shadow-none transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" /> {isEvaluating ? "Avaliando..." : "Concluir estudo de caso"}
                  </button>
                </div>
              </div>
            )}
            </div>
          )}
        </div>

        {/* Modal Retangular de Conclusão e Avaliação do Goti */}
        <GotiEvaluationModal
          isOpen={showGotiEvaluationModal}
          onClose={() => setShowGotiEvaluationModal(false)}
          score={tutorEvaluation?.score ?? 0}
          scoreLabel="Acurácia Diagnóstica"
          activityTitle={`Estudo de Caso: ${currentCase.title}`}
          comment={tutorEvaluation?.gapAnalysis || tutorEvaluation?.feedback || tutorEvaluation?.summary || "Parabéns por concluir as etapas do Processo de Enfermagem!"}
          onContinue={() => setShowGotiEvaluationModal(false)}
        />

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
      <MobileBottomDock />
    </div>
  );
}
