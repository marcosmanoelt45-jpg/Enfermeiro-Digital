import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
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
  FileText,
  Target,
  ClipboardList,
  Eye,
  Check,
  Download,
  ArrowRightLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import StudentHeader from "@/components/StudentHeader";
import StudentFooter from "@/components/StudentFooter";
import ClinicalGapRadar from "@/components/ClinicalGapRadar";
import { CASE_LIBRARY, generateRandomFullCase } from "@/lib/caseLibrary";
import { evaluateClinicalReasoning, getScaffoldingHint } from "@/services/socraticTutorService";
import { exportClinicalCaseToPdf } from "@/services/pdfExportService";

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

  const remainingGaps = caseGaps.filter((g) => !addedGaps.includes(g.key));

  const detectedItems = [
    { label: "PA", value: `${currentCase.vitals.pa_sistolica}/${currentCase.vitals.pa_diastolica} mmHg` },
    { label: "FC", value: `${currentCase.vitals.fc} bpm` },
    { label: "FR", value: `${currentCase.vitals.fr} irpm` },
    { label: "Tax", value: `${currentCase.vitals.tax} °C` },
    { label: "SatO2", value: `${currentCase.vitals.sat}%` },
    ...addedGaps.map((key) => {
      const g = caseGaps.find((x) => x.key === key);
      return { label: g?.label.split(" ")[0] || "Dado", value: "Registrado" };
    })
  ];

  function handleAddGap(gap) {
    if (!addedGaps.includes(gap.key)) {
      setAddedGaps([...addedGaps, gap.key]);
      setToastMessage(`Parâmetro registrado no prontuário: "${gap.label}".`);
      setTimeout(() => setToastMessage(""), 3500);
    }
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
    } finally {
      setIsEvaluating(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <StudentHeader activeTab="casos" />

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Cabeçalho Clínico do Simulador */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-teal-800 uppercase tracking-wider block">
              Processo de Enfermagem • Resolução COFEN nº 736/2024
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Simulador de Casos Clínicos
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Desenvolva o julgamento clínico nas 5 etapas do PE: Avaliação, Diagnóstico, Planejamento, Implementação e Evolução.
            </p>
          </div>

          <Button
            onClick={handleGenerateRandom}
            variant="outline"
            className="rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 text-xs flex items-center gap-2 self-start md:self-auto shrink-0"
          >
            <Shuffle className="h-4 w-4" /> Gerar Novo Caso
          </Button>
        </div>

        {/* Notificação Toast */}
        {toastMessage && (
          <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs flex items-center gap-2 animate-in fade-in shadow-sm">
            <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Seletor de Casos Clínicos Disponíveis */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {cases.slice(0, 6).map((c, idx) => (
            <button
              key={c.id || idx}
              onClick={() => handleSelectCase(idx)}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedCaseIdx === idx
                  ? "bg-white border-teal-700 ring-1 ring-teal-700 shadow-xs"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="text-[10px] font-bold text-teal-800 uppercase block line-clamp-1">
                {c.category}
              </span>
              <p className="text-xs font-semibold text-slate-900 line-clamp-1 mt-0.5">
                {c.title}
              </p>
            </button>
          ))}
        </div>

        {/* BARRA DAS 5 ETAPAS DO PROCESSO DE ENFERMAGEM (COFEN 736/2024) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs">
          <div className="grid grid-cols-5 gap-1.5 text-center">
            {[
              { num: 1, label: "1. Avaliação" },
              { num: 2, label: "2. Diagnóstico" },
              { num: 3, label: "3. Planejamento" },
              { num: 4, label: "4. Implementação" },
              { num: 5, label: "5. Evolução" }
            ].map((step) => {
              const isCurrent = activeStep === step.num;
              return (
                <button
                  key={step.num}
                  onClick={() => setActiveStep(step.num)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                    isCurrent
                      ? "bg-teal-700 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden font-mono">{step.num}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* WORKSPACE DINÂMICO CONFORME A ETAPA ATIVA */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* COLUNA PRINCIPAL (2 COLUNAS): CONTEÚDO ESPECÍFICO DA ETAPA SELECIONADA */}
          <div className="lg:col-span-2 space-y-6">

            {/* ETAPA 1: AVALIAÇÃO / COLETA DE DADOS */}
            {activeStep === 1 && (
              <div className="space-y-5 animate-in fade-in">
                {/* Prontuário do Paciente */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                    <div>
                      <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        {currentCase.category}
                      </span>
                      <h2 className="text-base font-bold text-slate-900 mt-1">
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
                            ? "bg-slate-800 text-white"
                            : "border-slate-300 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>{showClinicalNotes ? "Ocultar Pistas" : "Anotações Clínicas"}</span>
                      </Button>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                        {currentCase.patient.name} • {currentCase.patient.age}a • {currentCase.patient.gender}
                      </span>
                    </div>
                  </div>

                  {/* Anamnese & Resumo Clínico */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700">
                    <span className="font-bold text-slate-900 block">Histórico & Motivo de Admissão:</span>
                    <p className="leading-relaxed">
                      {currentCase.patient.previous_anamnesis}
                    </p>

                    {showClinicalNotes && (
                      <div className="mt-2 pt-2 border-t border-slate-200 flex flex-wrap gap-2 text-[11px]">
                        <span className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-md font-semibold">
                          💡 Pista: Retenção volêmica aguda & dispneia progressiva
                        </span>
                        <span className="bg-rose-100 text-rose-900 px-2.5 py-1 rounded-md font-semibold">
                          💡 Risco: Descompensação ventilatória iminente
                        </span>
                      </div>
                    )}

                    <div className="text-slate-500 pt-1 text-[11px] border-t border-slate-200/60">
                      <strong>Antecedentes:</strong> {currentCase.patient.medical_history} | <strong>Medicações:</strong> {currentCase.patient.current_medications}
                    </div>
                  </div>

                  {/* Sinais Vitais do Paciente */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">PA</span>
                      <span className="text-xs font-bold text-slate-900">
                        {currentCase.vitals.pa_sistolica}/{currentCase.vitals.pa_diastolica}
                      </span>
                      <span className="text-[10px] text-slate-400 block">mmHg</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">FC</span>
                      <span className="text-xs font-bold text-slate-900">{currentCase.vitals.fc}</span>
                      <span className="text-[10px] text-slate-400 block">bpm</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">FR</span>
                      <span className="text-xs font-bold text-slate-900">{currentCase.vitals.fr}</span>
                      <span className="text-[10px] text-slate-400 block">irpm</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Tax</span>
                      <span className="text-xs font-bold text-slate-900">{currentCase.vitals.tax}</span>
                      <span className="text-[10px] text-slate-400 block">°C</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">SatO2</span>
                      <span className="text-xs font-bold text-slate-900">{currentCase.vitals.sat}</span>
                      <span className="text-[10px] text-slate-400 block">%</span>
                    </div>
                  </div>

                  {/* Ações de Exame Físico à Beira-leito */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                        <Stethoscope className="h-4 w-4 text-teal-700" /> Procedimentos de Exame Físico
                      </span>
                      <span className="text-[11px] text-slate-400">Toque para coletar achados</span>
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
                                ? "bg-slate-100 border-teal-700 ring-1 ring-teal-700 shadow-xs"
                                : "bg-white border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <Icon className="h-3.5 w-3.5 text-teal-700" />
                              <span className="text-xs font-bold text-slate-900 block truncate">{act.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {activeExamAction && (
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 animate-in fade-in">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-900 block">
                              Achado: {activeExamAction.label}
                            </span>
                            <p className="text-xs text-slate-700 leading-relaxed">
                              "{activeExamAction.finding}"
                            </p>
                            <p className="text-[11px] text-slate-500">
                              <strong>Significado:</strong> {activeExamAction.clinicalMeaning}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAppendFinding(activeExamAction.finding)}
                            className="rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-[11px] shrink-0 h-8 flex items-center gap-1 font-semibold"
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
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg">
                      Etapa 2 do PE: Diagnóstico de Enfermagem
                    </span>
                    <h2 className="text-base font-bold text-slate-900 mt-1">
                      Julgamento Clínico e Resposta Humana Prioritária
                    </h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRequestHint}
                    disabled={loadingHint}
                    className="rounded-xl text-xs text-amber-700 hover:bg-amber-50 flex items-center gap-1.5"
                  >
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    <span>{loadingHint ? "Buscando dica..." : `Pista Diagnóstica (Nível ${hintLevel})`}</span>
                  </Button>
                </div>

                {currentHint && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1 animate-in fade-in">
                    <span className="font-bold flex items-center gap-1 text-amber-800">
                      <Lightbulb className="h-3.5 w-3.5" /> Dica Orientadora:
                    </span>
                    <p className="leading-relaxed">{currentHint.content}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      1. Título do Diagnóstico de Enfermagem Prioritário:
                    </label>
                    <Input
                      value={studentHypothesis}
                      onChange={(e) => setStudentHypothesis(e.target.value)}
                      placeholder="Ex: Padrão respiratório ineficaz (ou termo CIPE® equivalente)"
                      className="rounded-xl text-xs border-slate-300 h-10"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      2. Fatores Relacionados / Etiologia (Qual a causa provável?):
                    </label>
                    <Textarea
                      value={studentEtiology}
                      onChange={(e) => setStudentEtiology(e.target.value)}
                      placeholder="Ex: Fadiga da musculatura respiratória, hipervolemia e congestão pulmonar secundária..."
                      className="rounded-xl text-xs border-slate-300 min-h-[60px]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      3. Características Definidoras / Evidências Clínicas (Quais dados comprovam?):
                    </label>
                    <Textarea
                      value={studentEvidences}
                      onChange={(e) => setStudentEvidences(e.target.value)}
                      placeholder="Ex: Taquipneia (FR 26 irpm), SpO2 89% em ar ambiente e estertores bibasais..."
                      className="rounded-xl text-xs border-slate-300 min-h-[60px]"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setActiveStep(1)}
                    className="rounded-xl border-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <ArrowLeft className="h-4 w-4" /> Voltar para Avaliação
                  </Button>
                  <Button
                    onClick={() => setActiveStep(3)}
                    disabled={!studentHypothesis.trim()}
                    className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs px-5 h-10 font-semibold flex items-center gap-2"
                  >
                    Avançar para Planejamento <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ETAPA 3: PLANEJAMENTO (METAS E RESULTADOS ESPERADOS) */}
            {activeStep === 3 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 animate-in fade-in">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg">
                    Etapa 3 do PE: Planejamento
                  </span>
                  <h2 className="text-base font-bold text-slate-900 mt-1">
                    Metas Terapêuticas & Resultados Esperados
                  </h2>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <span className="font-bold text-slate-900 block mb-0.5">Diagnóstico Selecionado:</span>
                  <p>{studentHypothesis || "Nenhum diagnóstico definido na etapa anterior."}</p>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-800 block">
                    Defina as Metas Mensuráveis e Resultados Esperados para este paciente:
                  </label>
                  <Textarea
                    value={studentGoals}
                    onChange={(e) => setStudentGoals(e.target.value)}
                    placeholder="Ex: Paciente apresentará SpO2 ≥ 94% em ar ambiente em até 2 horas. Frequência respiratória entre 16-20 irpm sem sinais de esforço ventilatório nas próximas 4 horas."
                    className="rounded-xl text-xs border-slate-300 min-h-[100px]"
                  />
                  <p className="text-[11px] text-slate-400">
                    Dica: Boas metas devem ser claras, mensuráveis e com prazo definido para a reavaliação.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setActiveStep(2)}
                    className="rounded-xl border-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <ArrowLeft className="h-4 w-4" /> Voltar para Diagnóstico
                  </Button>
                  <Button
                    onClick={() => setActiveStep(4)}
                    className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs px-5 h-10 font-semibold flex items-center gap-2"
                  >
                    Avançar para Implementação <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ETAPA 4: IMPLEMENTAÇÃO (PRESCRIÇÃO DE ENFERMAGEM) */}
            {activeStep === 4 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 animate-in fade-in">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg">
                    Etapa 4 do PE: Implementação
                  </span>
                  <h2 className="text-base font-bold text-slate-900 mt-1">
                    Prescrição de Cuidados de Enfermagem & Conduta Prática
                  </h2>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-800 block">
                    Prescreva as intervenções de enfermagem com aprazamento de horários:
                  </label>
                  <Textarea
                    value={studentInterventions}
                    onChange={(e) => setStudentInterventions(e.target.value)}
                    placeholder="Ex: 1. Posicionar em decúbito elevado (Fowler a 45°); 2. Instalar oxigenoterapia sob cânula nasal a 2 L/min; 3. Monitorizar oximetria de pulso contínua; 4. Aferir sinais vitais de 2/2h..."
                    className="rounded-xl text-xs border-slate-300 min-h-[110px]"
                  />
                  <p className="text-[11px] text-slate-400">
                    Estruture os cuidados em ações prioritárias imediatas e ações de monitoramento contínuo.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setActiveStep(3)}
                    className="rounded-xl border-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 w-full sm:w-auto"
                  >
                    <ArrowLeft className="h-4 w-4" /> Voltar para Metas
                  </Button>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      onClick={handleSubmitEvaluation}
                      disabled={isEvaluating || (!studentHypothesis && !studentInterventions)}
                      className="rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs px-5 h-10 font-semibold flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {isEvaluating ? "Avaliando..." : "Submeter para Revisão"}
                    </Button>
                    <Button
                      onClick={() => {
                        handleSimulatePatientResponse();
                        setActiveStep(5);
                      }}
                      className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs px-5 h-10 font-semibold flex items-center gap-2"
                    >
                      Evoluir Paciente <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 5: EVOLUÇÃO DE ENFERMAGEM */}
            {activeStep === 5 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg">
                      Etapa 5 do PE: Evolução de Enfermagem
                    </span>
                    <h2 className="text-base font-bold text-slate-900 mt-1">
                      Reavaliação Clínica & Resposta às Intervenções
                    </h2>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSimulatePatientResponse}
                    className="rounded-xl text-xs flex items-center gap-1.5 border-slate-300"
                  >
                    <Timer className="h-4 w-4 text-teal-700" />
                    <span>Recalcular Resposta (30 min)</span>
                  </Button>
                </div>

                {simulatedTimeline ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          Status Fisiológico ({simulatedTimeline.elapsedTime})
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                          Estabilização em Curso
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {simulatedTimeline.clinicalStatus}
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-center text-xs">
                        <div className="p-2 rounded-lg bg-white border border-slate-200">
                          <span className="text-[10px] text-slate-400 block uppercase">PA Anterior / Atual</span>
                          <span className="font-bold text-slate-800">
                            {simulatedTimeline.vitalsBefore.pa_sistolica}/{simulatedTimeline.vitalsBefore.pa_diastolica} → {simulatedTimeline.vitalsAfter.pa_sistolica}/{simulatedTimeline.vitalsAfter.pa_diastolica}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-white border border-slate-200">
                          <span className="text-[10px] text-slate-400 block uppercase">FC Anterior / Atual</span>
                          <span className="font-bold text-slate-800">
                            {simulatedTimeline.vitalsBefore.fc} → {simulatedTimeline.vitalsAfter.fc} bpm
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-white border border-slate-200">
                          <span className="text-[10px] text-slate-400 block uppercase">FR Anterior / Atual</span>
                          <span className="font-bold text-slate-800">
                            {simulatedTimeline.vitalsBefore.fr} → {simulatedTimeline.vitalsAfter.fr} irpm
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-white border border-slate-200">
                          <span className="text-[10px] text-slate-400 block uppercase">SatO2 Pós-Cuidado</span>
                          <span className="font-bold text-teal-700">
                            {simulatedTimeline.vitalsBefore.sat}% → {simulatedTimeline.vitalsAfter.sat}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-800 block">
                        Registro da Evolução de Enfermagem (Anotação de Prontuário):
                      </label>
                      <Textarea
                        value={studentEvolutionNotes}
                        onChange={(e) => setStudentEvolutionNotes(e.target.value)}
                        placeholder="Ex: Paciente reavaliado 30 minutos após oxigenoterapia e posicionamento em Fowler. Refere melhora da sensação de dispneia. Sinais vitais demonstram eupneia e saturação satisfatória..."
                        className="rounded-xl text-xs border-slate-300 min-h-[90px]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-500 border border-dashed rounded-xl space-y-2">
                    <p>Execute as intervenções na etapa anterior ou clique no botão acima para simular a resposta terapêutica.</p>
                    <Button
                      size="sm"
                      onClick={handleSimulatePatientResponse}
                      className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs"
                    >
                      Simular Resposta Terapêutica
                    </Button>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setActiveStep(4)}
                    className="rounded-xl border-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <ArrowLeft className="h-4 w-4" /> Voltar para Implementação
                  </Button>
                  <Button
                    onClick={handleSubmitEvaluation}
                    disabled={isEvaluating}
                    className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs px-6 h-10 font-semibold flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" /> Concluir Estudo de Caso
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* COLUNA LATERAL (1 COLUNA): PAINEL DE FEEDBACK CLÍNICO */}
          <div className="space-y-5">
            {/* Feedback / Revisão Clínica */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <ClipboardList className="h-4 w-4 text-teal-700" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Revisão do Julgamento Clínico
                </h3>
              </div>

              {tutorEvaluation ? (
                <div className="space-y-3 text-xs leading-relaxed animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-600">Acurácia Diagnóstica:</span>
                    <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {tutorEvaluation.score}%
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-1">Análise do Raciocínio:</span>
                    <p className="text-slate-700">{tutorEvaluation.reasoningAnalysis}</p>
                  </div>

                  {tutorEvaluation.reflectiveQuestion && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
                      <span className="font-bold block mb-1">Questão para Reflexão:</span>
                      <p>{tutorEvaluation.reflectiveQuestion}</p>
                    </div>
                  )}

                  {tutorEvaluation.pointsToConsider?.length > 0 && (
                    <div className="space-y-1">
                      <span className="font-bold text-slate-800 block">Pontos Chave:</span>
                      <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                        {tutorEvaluation.pointsToConsider.map((pt, i) => (
                          <li key={i}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-3 mt-3 border-t border-slate-200/80 flex flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={() => navigate("/passagem-plantao", { state: { caseData: currentCase } })}
                      className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs w-full"
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5" /> Passar Plantão deste Paciente (SBAR)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        exportClinicalCaseToPdf({
                          caseData: currentCase,
                          tutorEvaluation: tutorEvaluation
                        });
                        setToastMessage("Prontuário gerado em PDF com sucesso!");
                        setTimeout(() => setToastMessage(""), 3500);
                      }}
                      className="rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5 w-full"
                    >
                      <Download className="h-3.5 w-3.5" /> Baixar Prontuário em PDF
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 space-y-2">
                  <p>Preencha suas hipóteses e condutas para receber a revisão clínica detalhada.</p>
                </div>
              )}
            </div>

            {/* Resumo da Etapa Atual */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs text-xs text-slate-600 space-y-2">
              <span className="font-bold text-slate-900 block uppercase tracking-wide text-[11px]">
                Diretriz COFEN nº 736/2024
              </span>
              <p className="leading-relaxed">
                {activeStep === 1 && "A etapa de Avaliação subsidia todas as decisões clínicas subsequentes por meio da coleta metódica de dados."}
                {activeStep === 2 && "O Diagnóstico de Enfermagem representa o julgamento clínico sobre as respostas da pessoa ou coletividade a processos de saúde."}
                {activeStep === 3 && "O Planejamento envolve a determinação das metas e dos resultados que se espera alcançar com a assistência."}
                {activeStep === 4 && "A Implementação consiste na execução das intervenções prescritas pelo enfermeiro com rigor e aprazamento."}
                {activeStep === 5 && "A Evolução é o processo contínuo de avaliação dos resultados alcançados e readequação do plano de cuidados."}
              </p>
            </div>
          </div>
        </div>
      </main>

      <StudentFooter />
    </div>
  );
}
