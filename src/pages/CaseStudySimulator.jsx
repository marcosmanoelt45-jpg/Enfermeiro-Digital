import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  ShieldAlert,
  Shuffle,
  Activity,
  HeartPulse,
  Brain,
  Layers,
  Thermometer,
  Lock,
  ChevronRight,
  Send,
  Plus,
  Stethoscope,
  Timer,
  Zap,
  Eye,
  SlidersHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import StudentHeader from "@/components/StudentHeader";
import ClinicalGapRadar from "@/components/ClinicalGapRadar";
import DlpShieldModal from "@/components/DlpShieldModal";
import { CASE_LIBRARY, generateRandomFullCase } from "@/lib/caseLibrary";
import { evaluateClinicalReasoning, getScaffoldingHint } from "@/services/socraticTutorService";
import { inspectClinicalInputForDLP, sanitizeTextForLGPD } from "@/lib/dlpSanitizer";

export default function CaseStudySimulator() {
  const navigate = useNavigate();
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const [activeStep, setActiveStep] = useState(1); // 1 a 5 (COFEN 736/2024)
  const [cases, setCases] = useState(CASE_LIBRARY);

  // Estados de entrada do estudante
  const [studentHypothesis, setStudentHypothesis] = useState("");
  const [studentJustification, setStudentJustification] = useState("");
  const [studentInterventions, setStudentInterventions] = useState("");

  // Estados de tutoria socrática
  const [tutorEvaluation, setTutorEvaluation] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentHint, setCurrentHint] = useState(null);
  const [hintLevel, setHintLevel] = useState(1);
  const [loadingHint, setLoadingHint] = useState(false);

  // Inovações inspiradas em Engenharia Reversa (AMBOSS / Osmosis / SimX / Whitebook)
  const [showHighYield, setShowHighYield] = useState(false); // AMBOSS: High-Yield Clues Overlay
  const [activeExamAction, setActiveExamAction] = useState(null); // Osmosis/SimX: Hands-on Physical Exam
  const [simulatedTimeline, setSimulatedTimeline] = useState(null); // SimX: 30-min Clinical Response Simulation

  // Estado de Lacunas Descobertas no Caso
  const [addedGaps, setAddedGaps] = useState([]);
  const [toastMessage, setToastMessage] = useState("");

  // Estados de DLP / LGPD
  const [dlpOpen, setDlpOpen] = useState(false);
  const [dlpMatches, setDlpMatches] = useState([]);

  const currentCase = cases[selectedCaseIdx];

  // Ações de Exame Físico Interativo à beira-leito (Inspirado no Osmosis/SimX)
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
      clinicalMeaning: "Risco imediato de progressão de lesão por pressão nas próximas 12 horas."
    }
  ];

  // Lacunas padrão baseadas no caso
  const caseGaps = [
    { key: "glicemia", label: "Aferição de Glicemia Capilar (HGT)", hint: "Checar se há hiperglicemia ou hipoglicemia mascarando o sensório." },
    { key: "alergias", label: "Investigação Detalhada de Alergias", hint: "Confirmar ausência de alergia a penicilinas, AINEs e iodo." },
    { key: "pulsos", label: "Palpação de Pulsos Periféricos e Perfusão", hint: "Verificar se os pulsos distais estão cheios, simétricos ou filiformes." },
    { key: "braden", label: "Aplicação da Escala de Braden", hint: "Avaliar risco preditivo de lesão por pressão nas primeiras 24h de admissão." }
  ];

  const remainingGaps = caseGaps.filter(g => !addedGaps.includes(g.key));

  const detectedItems = [
    { label: "PA", value: `${currentCase.vitals.pa_sistolica}/${currentCase.vitals.pa_diastolica} mmHg` },
    { label: "FC", value: `${currentCase.vitals.fc} bpm` },
    { label: "FR", value: `${currentCase.vitals.fr} irpm` },
    { label: "Tax", value: `${currentCase.vitals.tax} °C` },
    { label: "SatO2", value: `${currentCase.vitals.sat}%` },
    ...addedGaps.map(key => {
      const g = caseGaps.find(x => x.key === key);
      return { label: g?.label.split(" ")[0] || "Dado", value: "Investigado e Adicionado" };
    })
  ];

  function handleAddGap(gap) {
    if (!addedGaps.includes(gap.key)) {
      setAddedGaps([...addedGaps, gap.key]);
      setToastMessage(`Dado clínico incorporado ao prontuário: "${gap.label}".`);
      setTimeout(() => setToastMessage(""), 3500);
    }
  }

  function handleAppendGapToReasoning(gapText) {
    const addition = ` [Dado Integrado: ${gapText}]`;
    setStudentJustification((prev) => (prev ? prev + addition : gapText));
    setToastMessage(`Ponto cego incorporado à sua justificativa com sucesso!`);
    setTimeout(() => setToastMessage(""), 3500);
  }

  function handleSelectCase(idx) {
    setSelectedCaseIdx(idx);
    setActiveStep(1);
    setStudentHypothesis("");
    setStudentJustification("");
    setStudentInterventions("");
    setTutorEvaluation(null);
    setCurrentHint(null);
    setAddedGaps([]);
    setActiveExamAction(null);
    setSimulatedTimeline(null);
    setShowHighYield(false);
  }

  function handleGenerateRandom() {
    const randomCase = generateRandomFullCase();
    setCases([randomCase, ...cases]);
    setSelectedCaseIdx(0);
    setActiveStep(1);
    setStudentHypothesis("");
    setStudentJustification("");
    setStudentInterventions("");
    setTutorEvaluation(null);
    setCurrentHint(null);
    setAddedGaps([]);
    setActiveExamAction(null);
    setSimulatedTimeline(null);
    setShowHighYield(false);
    setToastMessage("Novo caso simulado gerado com dados sintéticos!");
    setTimeout(() => setToastMessage(""), 3500);
  }

  // Simulação de Resposta Terapêutica (Inspirado no SimX)
  function handleSimulatePatientResponse() {
    setSimulatedTimeline({
      elapsedTime: "30 minutos após intervenções",
      vitalsBefore: { ...currentCase.vitals },
      vitalsAfter: {
        pa_sistolica: Math.max(120, currentCase.vitals.pa_sistolica - 15),
        pa_diastolica: Math.max(75, currentCase.vitals.pa_diastolica - 10),
        fc: Math.max(75, currentCase.vitals.fc - 18),
        fr: Math.max(18, currentCase.vitals.fr - 6),
        sat: Math.min(97, currentCase.vitals.sat + 6),
        tax: currentCase.vitals.tax
      },
      patientFeedback: "Paciente refere alívio da sensação de sufocamento. Padrão respiratório menos esforçado com menor recrutamento de músculos acessórios.",
      safetyDebrief: "Excelente conduta! A intervenção oportuna de oxigenoterapia e cabeceira elevada evitou a fadiga diafragmática precoce."
    });
    setToastMessage("Evolução clínica simulada com sucesso!");
    setTimeout(() => setToastMessage(""), 3500);
  }

  async function handleSubmitEvaluation() {
    const combinedText = `${studentHypothesis} ${studentJustification} ${studentInterventions}`;
    const dlpCheck = inspectClinicalInputForDLP(combinedText);

    if (dlpCheck.hasSensitiveData) {
      setDlpMatches(dlpCheck.matches);
      setDlpOpen(true);
      return;
    }

    await executeEvaluation();
  }

  async function executeEvaluation() {
    setIsEvaluating(true);
    try {
      const evaluation = await evaluateClinicalReasoning({
        caseData: currentCase,
        studentHypothesis,
        studentJustification,
        studentInterventions
      });
      setTutorEvaluation(evaluation);
    } finally {
      setIsEvaluating(false);
    }
  }

  function handleDlpAnonymizeAndProceed() {
    setStudentHypothesis(sanitizeTextForLGPD(studentHypothesis));
    setStudentJustification(sanitizeTextForLGPD(studentJustification));
    setStudentInterventions(sanitizeTextForLGPD(studentInterventions));
    setDlpOpen(false);
    executeEvaluation();
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <StudentHeader activeTab="casos" />

      {/* Modal de Proteção DLP da LGPD */}
      <DlpShieldModal
        open={dlpOpen}
        onOpenChange={setDlpOpen}
        matches={dlpMatches}
        onAnonymizeAndProceed={handleDlpAnonymizeAndProceed}
        onCancel={() => setDlpOpen(false)}
      />

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-6 space-y-6">
        {/* Banner do Módulo de Simulação */}
        <div className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-200 border border-teal-400/30">
                <BookOpen className="h-3.5 w-3.5" /> Simulação Clínica Resolução COFEN nº 736/2024
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <Lock className="h-3 w-3" /> Dados 100% Simulados LGPD
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Simulador de Raciocínio Clínico de Enfermagem
            </h1>
            <p className="text-xs md:text-sm text-teal-100/80 max-w-2xl">
              Desenvolva o julgamento clínico diagnóstico através das 5 etapas do Processo de Enfermagem. A Tutora Socrática Florence desafia suas hipóteses com perguntas reflexivas.
            </p>
          </div>

          <Button
            onClick={handleGenerateRandom}
            variant="outline"
            className="rounded-xl bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs flex items-center gap-2 shrink-0"
          >
            <Shuffle className="h-4 w-4" /> Gerar Novo Caso Aleatório
          </Button>
        </div>

        {/* Notificação Toast */}
        {toastMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* Seletor de Casos Clínicos Disponíveis */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {cases.slice(0, 6).map((c, idx) => (
            <button
              key={c.id || idx}
              onClick={() => handleSelectCase(idx)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                selectedCaseIdx === idx
                  ? "bg-white border-teal-600 ring-2 ring-teal-600/20 shadow-sm"
                  : "bg-white/70 border-slate-200 hover:bg-white"
              }`}
            >
              <span className="text-[10px] font-bold text-teal-700 uppercase block line-clamp-1">
                {c.category}
              </span>
              <p className="text-xs font-semibold text-slate-800 line-clamp-1 mt-0.5">
                {c.title}
              </p>
            </button>
          ))}
        </div>

        {/* Barra de Progresso das 5 Etapas do COFEN 736/2024 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs">
          <div className="grid grid-cols-5 gap-1 sm:gap-2 text-center">
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
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                    isCurrent
                      ? "bg-teal-600 text-white shadow-2xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden font-mono">{step.num}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conteúdo Principal Dividido em Colunas */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Coluna 1 & 2: Dados do Paciente e Formulário do Estudante */}
          <div className="lg:col-span-2 space-y-5">
            {/* Prontuário Simulado */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div>
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    {currentCase.category}
                  </span>
                  <h2 className="text-base font-bold text-slate-900 mt-1">
                    {currentCase.title}
                  </h2>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {/* INOVAÇÃO AMBOSS: High-Yield Overlay */}
                  <Button
                    size="sm"
                    variant={showHighYield ? "default" : "outline"}
                    onClick={() => setShowHighYield(!showHighYield)}
                    className={`rounded-xl text-xs h-8 flex items-center gap-1.5 ${
                      showHighYield
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                        : "border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>{showHighYield ? "Pistas Ativas" : "Pistas High-Yield (AMBOSS)"}</span>
                  </Button>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    {currentCase.patient.name} • {currentCase.patient.age}a • {currentCase.patient.gender}
                  </span>
                </div>
              </div>

              {/* Anamnese e Resumo Clínico com Destaques High-Yield */}
              <div className="space-y-2 text-xs text-slate-700">
                <div className={`p-3.5 rounded-xl border transition-all ${
                  showHighYield
                    ? "bg-indigo-50/50 border-indigo-200 text-indigo-950"
                    : "bg-slate-50 border-slate-200 text-slate-700"
                }`}>
                  <span className="font-bold text-slate-900 block mb-1">Histórico & Motivo da Admissão:</span>
                  <p className="leading-relaxed">
                    {currentCase.patient.previous_anamnesis}
                  </p>
                  {showHighYield && (
                    <div className="mt-2 pt-2 border-t border-indigo-100 flex flex-wrap gap-1.5 text-[11px]">
                      <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-semibold">
                        💡 Pista: Retenção volêmica aguda & dispneia progressiva
                      </span>
                      <span className="bg-rose-100 text-rose-900 px-2 py-0.5 rounded-md font-semibold">
                        💡 Risco: Descompensação ventilatória iminente
                      </span>
                    </div>
                  )}
                  <p className="text-slate-500 mt-2 text-[11px]">
                    <strong>Antecedentes:</strong> {currentCase.patient.medical_history} | <strong>Medicações:</strong> {currentCase.patient.current_medications}
                  </p>
                </div>
              </div>

              {/* Sinais Vitais com Indicadores Visuais */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">PA</span>
                  <span className="text-xs font-bold text-slate-900">
                    {currentCase.vitals.pa_sistolica}/{currentCase.vitals.pa_diastolica}
                  </span>
                  <span className="text-[10px] text-slate-400 block">mmHg</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">FC</span>
                  <span className="text-xs font-bold text-slate-900">{currentCase.vitals.fc}</span>
                  <span className="text-[10px] text-slate-400 block">bpm</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">FR</span>
                  <span className="text-xs font-bold text-slate-900">{currentCase.vitals.fr}</span>
                  <span className="text-[10px] text-slate-400 block">irpm</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Tax</span>
                  <span className="text-xs font-bold text-slate-900">{currentCase.vitals.tax}</span>
                  <span className="text-[10px] text-slate-400 block">°C</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">SatO2</span>
                  <span className="text-xs font-bold text-slate-900">{currentCase.vitals.sat}</span>
                  <span className="text-[10px] text-slate-400 block">%</span>
                </div>
              </div>

              {/* INOVAÇÃO OSMOSIS/SIMX: AÇÕES DE EXAME FÍSICO INTERATIVO À BEIRA-LEITO */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                    <Stethoscope className="h-4 w-4 text-teal-600" /> Ações de Exame Físico Interativo (SimX / Osmosis)
                  </span>
                  <span className="text-[11px] text-slate-500">Toque para investigar à beira-leito</span>
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
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                          isSelected
                            ? "bg-teal-600 text-white border-teal-700 shadow-2xs"
                            : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                        }`}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${isSelected ? "text-white" : "text-teal-600"}`} />
                        <span className="text-xs font-semibold leading-tight line-clamp-1">{act.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Exibição do Achado Físico Revelado */}
                {activeExamAction && (
                  <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 space-y-2 animate-in fade-in">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-teal-900 block">
                          Resultado do Procedimento: {activeExamAction.label}
                        </span>
                        <p className="text-xs text-teal-800 mt-0.5 leading-relaxed font-serif">
                          "{activeExamAction.finding}"
                        </p>
                        <p className="text-[11px] text-slate-600 mt-1">
                          <strong>Interpretação Fisiopatológica:</strong> {activeExamAction.clinicalMeaning}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAppendGapToReasoning(activeExamAction.finding)}
                        className="rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-[11px] shrink-0 h-8 flex items-center gap-1 font-semibold"
                      >
                        <Plus className="h-3.5 w-3.5" /> Incorporar ao Raciocínio
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* RADAR DE LACUNAS CLÍNICAS (O QUE ESTÁ FALTANDO E PODER ADICIONAR COM 1 CLIQUE) */}
              <ClinicalGapRadar
                detectedItems={detectedItems}
                missingGaps={remainingGaps}
                onAddGap={handleAddGap}
                completenessPercentage={Math.round((detectedItems.length / (detectedItems.length + remainingGaps.length)) * 100)}
                title="Lacunas Clínicas Identificadas pela IA"
              />
            </div>

            {/* Espaço de Raciocínio Clínico do Aluno */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-teal-600" />
                  Seu Julgamento Clínico (Etapa {activeStep}: {
                    activeStep === 1 ? "Avaliação" :
                    activeStep === 2 ? "Diagnóstico" :
                    activeStep === 3 ? "Planejamento" :
                    activeStep === 4 ? "Implementação" : "Evolução"
                  })
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRequestHint}
                  disabled={loadingHint}
                  className="rounded-xl text-xs text-amber-700 hover:bg-amber-50 flex items-center gap-1.5"
                >
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <span>{loadingHint ? "Buscando dica..." : `Pedir Pista (Nível ${hintLevel})`}</span>
                </Button>
              </div>

              {/* Dica da Tutora Florence (Scaffolding) */}
              {currentHint && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1 animate-in fade-in">
                  <span className="font-bold flex items-center gap-1 text-amber-800">
                    <Lightbulb className="h-3.5 w-3.5" /> {currentHint.title || "Dica da Tutora"}
                  </span>
                  <p className="leading-relaxed">{currentHint.content}</p>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Qual hipótese diagnóstica ou resposta humana prioritária você identifica?
                  </label>
                  <Textarea
                    value={studentHypothesis}
                    onChange={(e) => setStudentHypothesis(e.target.value)}
                    placeholder="Ex: Padrão respiratório ineficaz relacionado à fadiga muscular evidenciado por taquipneia e saturação de 89%..."
                    className="rounded-xl text-xs border-slate-300 min-h-[60px]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Justificativa Clínica: Quais dados do paciente sustentam sua conclusão?
                  </label>
                  <Textarea
                    value={studentJustification}
                    onChange={(e) => setStudentJustification(e.target.value)}
                    placeholder="Explique o mecanismo fisiopatológico e correlacione com os sinais vitais alterados..."
                    className="rounded-xl text-xs border-slate-300 min-h-[70px]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Cuidados de Enfermagem Propostos (Implementação):
                  </label>
                  <Textarea
                    value={studentInterventions}
                    onChange={(e) => setStudentInterventions(e.target.value)}
                    placeholder="Descreva as intervenções prioritárias com aprazamento (ex: posicionar em Fowler, monitorar SatO2 contínua)..."
                    className="rounded-xl text-xs border-slate-300 min-h-[60px]"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row justify-between items-center gap-2">
                  {/* INOVAÇÃO SIMX: Simulação Temporal da Resposta Terapêutica */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSimulatePatientResponse}
                    className="rounded-xl border-sky-300 text-sky-800 hover:bg-sky-50 text-xs flex items-center gap-1.5 w-full sm:w-auto"
                  >
                    <Timer className="h-4 w-4 text-sky-600" />
                    <span>Simular Resposta após 30 min (SimX)</span>
                  </Button>

                  <Button
                    onClick={handleSubmitEvaluation}
                    disabled={isEvaluating || (!studentHypothesis.trim() && !studentJustification.trim())}
                    className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs px-6 flex items-center gap-2 w-full sm:w-auto"
                  >
                    {isEvaluating ? (
                      <>
                        <Sparkles className="h-4 w-4 animate-spin" /> Analisando Raciocínio...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" /> Submeter para a Tutora Florence
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Simulação da Resposta Terapêutica (Evolução Temporal) */}
            {simulatedTimeline && (
              <div className="bg-white rounded-2xl border border-sky-200 p-6 shadow-sm space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-sky-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-600 text-white">
                      <Timer className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Evolução Clínica do Paciente ({simulatedTimeline.elapsedTime})
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Simulação Fisiológica de Resposta Terapêutica
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Estabilização em Curso
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">PA Anterior / Atual</span>
                    <span className="font-bold text-slate-900">
                      {simulatedTimeline.vitalsBefore.pa_sistolica}/{simulatedTimeline.vitalsBefore.pa_diastolica} → {simulatedTimeline.vitalsAfter.pa_sistolica}/{simulatedTimeline.vitalsAfter.pa_diastolica}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">FC Anterior / Atual</span>
                    <span className="font-bold text-slate-900">
                      {simulatedTimeline.vitalsBefore.fc} → {simulatedTimeline.vitalsAfter.fc} bpm
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">FR Anterior / Atual</span>
                    <span className="font-bold text-slate-900">
                      {simulatedTimeline.vitalsBefore.fr} → {simulatedTimeline.vitalsAfter.fr} irpm
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] text-emerald-600 block">SatO2 Pós-Cuidado</span>
                    <span className="font-bold text-emerald-900">
                      {simulatedTimeline.vitalsBefore.sat}% → {simulatedTimeline.vitalsAfter.sat}%
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                  💬 <strong>Relato do Paciente:</strong> "{simulatedTimeline.patientFeedback}"
                </p>

                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{simulatedTimeline.safetyDebrief}</span>
                </div>
              </div>
            )}

            {/* Avaliação Socrática da Tutora Florence */}
            {tutorEvaluation && (
              <div className="bg-white rounded-2xl border border-teal-200 p-6 shadow-sm space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-600 text-white">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {tutorEvaluation.feedbackTitle || "Feedback Formativo da Tutora"}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {tutorEvaluation.cofenStepFocus || "Resolução COFEN nº 736/2024"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-teal-700">
                      {tutorEvaluation.score}%
                    </span>
                    <span className="text-[10px] text-slate-400 block">Acurácia Formativa</span>
                  </div>
                </div>

                {/* Pontos Fortes */}
                {tutorEvaluation.strengths?.length > 0 && (
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Pontos Fortes Identificados:
                    </span>
                    <ul className="text-xs text-emerald-800 list-disc list-inside space-y-0.5">
                      {tutorEvaluation.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Gaps Clínicos Omissos com BOTÃO DE ADICIONAR COM 1 CLIQUE */}
                {tutorEvaluation.gaps?.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Pontos Cegos & Dados Faltantes Detectados:
                    </span>
                    <p className="text-[11px] text-amber-800">
                      O professor destacou a importância de preencher lacunas. Clique no botão para incorporar cada ponto cego ao seu raciocínio:
                    </p>
                    <div className="space-y-1.5">
                      {tutorEvaluation.gaps.map((g, i) => (
                        <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-white border border-amber-200 text-xs">
                          <span className="text-slate-800 leading-tight">⚠️ {g}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAppendGapToReasoning(g)}
                            className="rounded-lg text-[10px] h-7 border-amber-300 text-amber-900 hover:bg-amber-100 shrink-0 flex items-center gap-1 font-semibold self-start sm:self-auto"
                          >
                            <Plus className="h-3 w-3" /> Adicionar à Justificativa
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Questões Socráticas Instigadoras (Não dá a resposta de mão beijada!) */}
                {tutorEvaluation.socraticQuestions?.length > 0 && (
                  <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-2">
                    <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <Brain className="h-4 w-4 text-indigo-600" /> Desafio Socrático da Tutora Florence:
                    </span>
                    <div className="space-y-1.5">
                      {tutorEvaluation.socraticQuestions.map((q, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-white border border-indigo-100 text-xs text-indigo-900 font-medium">
                          ❓ {q}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Coluna 3: Objetivos e Questões Guiadas do Caso */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wide block">
                Objetivos de Aprendizagem
              </span>
              <ul className="space-y-2 text-xs text-slate-600">
                {(currentCase.learningObjectives || []).map((obj, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                Perguntas Condutoras
              </span>
              <div className="space-y-2 text-xs text-slate-600">
                {(currentCase.guidingQuestions || []).map((q, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="font-medium text-slate-700">{q}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-teal-950 space-y-1.5">
              <span className="font-bold flex items-center gap-1.5 text-teal-900">
                <ShieldAlert className="h-4 w-4 text-teal-700" />
                Segurança & Privacidade LGPD
              </span>
              <p className="text-teal-900/90 leading-relaxed">
                Este caso clínico utiliza dados 100% sintéticos para fins didáticos. O sistema intercepta automaticamente qualquer inserção acidental de dados pessoais reais.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
