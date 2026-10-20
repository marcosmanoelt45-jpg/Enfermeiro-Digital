import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  FileText,
  ShieldCheck,
  Calculator,
  Droplet,
  Beaker,
  BookOpen,
  Shuffle,
  Sparkles,
  History,
  Clock,
  BookmarkPlus,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { guideMedicationCalculation } from "@/services/socraticTutorService";
import StudentHeader from "@/components/StudentHeader";
import StudentFooter from "@/components/StudentFooter";
import CaseHistoryModal from "@/components/history/CaseHistoryModal";
import { clinicalHistoryService, MODULE_TYPES } from "@/services/clinicalHistoryService";
import GotiAnimated from "@/components/mascot/GotiAnimated";
import GotiEvaluationModal from "@/components/mascot/GotiEvaluationModal";

const DOSAGE_PROBLEMS = [
  {
    id: "prob_1",
    category: "Macrogotas / Horas",
    title: "Infusão de Soro Fisiológico em 8h",
    description: "Prescrição médica: Soro Fisiológico 0,9% 1000 mL para ser administrado por via intravenosa no período de 8 horas, utilizando equipo comum (macrogotas).",
    solutionName: "Soro Fisiológico 0,9%",
    volume: "1000 mL",
    route: "Intravenosa (IV)",
    time: "8 horas",
    device: "Equipo de Macrogotas",
    question: "Quantas gotas por minuto (gts/min) deverão ser administradas?",
    formulaHint: "Gotas/min = Volume (mL) ÷ (Tempo (h) × 3)",
    correctResult: "42",
    explanationSteps: [
      "Identifique as variáveis da prescrição: Volume = 1000 mL | Tempo = 8 horas",
      "Equipo de macrogotas com tempo em horas utiliza a fórmula: Gotas/min = V / (T × 3)",
      "Cálculo matemático: 1000 ÷ (8 × 3) = 1000 ÷ 24 = 41,66...",
      "Regra de arredondamento em gotas: como a fração é ≥ 0,5, arredondamos para 42 gotas/minuto."
    ]
  },
  {
    id: "prob_2",
    category: "Microgotas / Horas",
    title: "Infusão em Paciente Pediátrico / Cardiopata",
    description: "Prescrição médica: Soro Glicosado 5% 500 mL para infundir em 12 horas através de equipo de microgotas.",
    solutionName: "Soro Glicosado 5%",
    volume: "500 mL",
    route: "Intravenosa (IV)",
    time: "12 horas",
    device: "Equipo de Microgotas",
    question: "Qual deve ser a taxa de infusão em microgotas por minuto (mgts/min)?",
    formulaHint: "Microgotas/min = Volume (mL) ÷ Tempo (h)",
    correctResult: "42",
    explanationSteps: [
      "Identifique as variáveis da prescrição: Volume = 500 mL | Tempo = 12 horas",
      "Para microgotas com tempo em horas: Microgotas/min = Volume ÷ Tempo",
      "Cálculo matemático: 500 ÷ 12 = 41,66...",
      "Arredondamento: 42 microgotas/minuto (numericamente igual a 42 mL/h em bomba de infusão)."
    ]
  },
  {
    id: "prob_3",
    category: "Macrogotas / Minutos",
    title: "Antibiótico em Infusão Rápida (30 minutos)",
    description: "Prescrição médica: Metronidazol 500mg em bolsa de 100 mL para correr em 30 minutos via equipo de macrogotas.",
    solutionName: "Metronidazol 500mg (100 mL)",
    volume: "100 mL",
    route: "Intravenosa (IV)",
    time: "30 minutos",
    device: "Equipo de Macrogotas",
    question: "Quantas gotas por minuto devem ser infundidas?",
    formulaHint: "Gotas/min = (Volume × 20) ÷ Tempo em minutos",
    correctResult: "67",
    explanationSteps: [
      "Quando o tempo é prescrito em minutos, a constante muda para 20!",
      "Fórmula: Gotas/min = (Volume em mL × 20) ÷ Tempo em minutos",
      "Cálculo matemático: (100 × 20) ÷ 30 = 2000 ÷ 30 = 66,66...",
      "Arredondamento: 67 gotas/minuto."
    ]
  },
  {
    id: "prob_4",
    category: "Diluição de Antibióticos",
    title: "Penicilina Cristalina (Frasco de 5.000.000 UI)",
    description: "Prescrição médica: Penicilina Cristalina 2.000.000 UI EV. Disponível na enfermaria: Frasco-ampola com pó liofilizado de 5.000.000 UI e ampolas de água destilada (AD) de 10 mL.",
    solutionName: "Penicilina Cristalina 5.000.000 UI",
    volume: "Reconstituir p/ 10 mL",
    route: "Intravenosa (IV)",
    time: "Horário prescrito",
    device: "Frasco-Ampola + Seringa",
    question: "Sabendo que o pó ocupa 2 mL de soluto, se adicionarmos 8 mL de AD (totalizando 10 mL), quantos mL devemos aspirar para administrar a dose prescrita?",
    formulaHint: "Soluto (2 mL) + solvente (8 mL) = 10 mL. Regra de três: 5.000.000 UI = 10 mL, logo 2.000.000 UI = X.",
    correctResult: "4",
    explanationSteps: [
      "No frasco de 5 milhões de UI, o soluto (pó) equivale a 2 mL de volume.",
      "Ao injetar 8 mL de diluente (AD), o volume total da solução reconstituída é 10 mL.",
      "Montagem da proporção direta: 5.000.000 UI --- 10 mL | 2.000.000 UI --- X mL",
      "Cálculo: X = (2.000.000 × 10) ÷ 5.000.000 = 20 ÷ 5 = 4 mL."
    ]
  },
  {
    id: "prob_5",
    category: "Anticoagulação & Alta Vigilância",
    title: "Heparina Sódica Contínua em UTI",
    description: "Prescrição médica: Heparina sódica 800 UI/h em infusão intravenosa contínua. Solução preparada: Frasco de SF 0,9% 250 mL + 25.000 UI de Heparina (5 mL da apresentação 5.000 UI/mL). Volume total = 250 mL.",
    solutionName: "Heparina 25.000 UI em 250 mL SF 0,9%",
    volume: "250 mL (100 UI/mL)",
    route: "Intravenosa Contínua (IV)",
    time: "Contínuo",
    device: "Bomba de Infusão Contínua (BIC)",
    question: "Qual vazão em mL/h deve ser programada na Bomba de Infusão Contínua (BIC) para administrar exatamente 800 UI/hora?",
    formulaHint: "Concentração: 25.000 UI ÷ 250 mL = 100 UI/mL. Vazão (mL/h) = Dose prescrita (UI/h) ÷ Concentração (UI/mL).",
    correctResult: "8",
    explanationSteps: [
      "Determine a concentração da solução: 25.000 UI ÷ 250 mL = 100 UI por cada 1 mL.",
      "A dose prescrita é de 800 UI/h.",
      "Regra de três ou divisão direta: 100 UI --- 1 mL | 800 UI --- X mL.",
      "Cálculo: X = 800 ÷ 100 = 8 mL/h.",
      "Na Bomba de Infusão Contínua (BIC), programa-se a vazão de 8 mL/h."
    ]
  },
  {
    id: "prob_6",
    category: "Corticoterapia & Emergência",
    title: "Hidrocortisona em Crise Asmática",
    description: "Prescrição médica: Hidrocortisona 150 mg EV em bólus lento. Na farmácia hospitalar há frasco-ampola com pó liofilizado de Hidrocortisona 500 mg e ampola de diluente de 5 mL.",
    solutionName: "Hidrocortisona 500 mg (Frasco-Ampola)",
    volume: "5 mL após reconstituição",
    route: "Intravenosa (IV)",
    time: "Dose Imediata (STAT)",
    device: "Frasco-Ampola + Seringa de 5 mL",
    question: "Após reconstituir o pó de 500 mg com 5 mL de diluente (AD), quantos mL devem ser aspirados para administrar exatamente 150 mg?",
    formulaHint: "500 mg --- 5 mL | 150 mg --- X mL. X = (150 × 5) ÷ 500.",
    correctResult: "1.5",
    explanationSteps: [
      "Volume e concentração: 500 mg reconstituídos em 5 mL resultam em 100 mg/mL.",
      "Montagem da proporção: 500 mg = 5 mL | 150 mg = X mL",
      "Cálculo: X = (150 × 5) ÷ 500 = 750 ÷ 500 = 1,5 mL.",
      "Aspire exatamente 1,5 mL da seringa graduada para administrar a dose de 150 mg."
    ]
  }
];

const CALC_TYPES = [
  { key: "dose", label: "Dose → Volume", icon: Calculator, hint: "Descobrir quantos mL aplicar a partir da concentração" },
  { key: "drip", label: "Gotejamento IV", icon: Droplet, hint: "Calcular gotas ou microgotas por minuto (horas ou min)" },
  { key: "weight_based", label: "Dose Pediátrica / Peso", icon: Beaker, hint: "mg/kg de peso corporal → volume em mL" }
];

const CONVERSIONS = [
  "1 kg = 1.000 g",
  "1 g = 1.000 mg",
  "1 mg = 1.000 mcg",
  "1 L = 1.000 mL",
  "1% = 1 g em 100 mL (10 mg/mL)",
  "1 mL = 20 gotas (macrogotas)",
  "1 mL = 60 microgotas",
  "1 gota = 3 microgotas"
];

export default function MedicationDosageLab() {
  const [activeTab, setActiveTab] = useState("desafios"); // "desafios" | "calculadora"

  // Estado dos Desafios Clínicos
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [studentInput, setStudentInput] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [showFormula, setShowFormula] = useState(false);
  const [showConversions, setShowConversions] = useState(false);
  const [showFullSolution, setShowFullSolution] = useState(false);
  const [showGotiEvaluationModal, setShowGotiEvaluationModal] = useState(false);

  // Estado da Calculadora Interativa Livre (Resgatada do Backup)
  const [calcType, setCalcType] = useState("drip");
  const [calcForm, setCalcForm] = useState({
    drug_name: "",
    concentration: "",
    prescribed_dose: "",
    weight: "",
    dose_per_kg: "",
    volume_ml: "500",
    time_value: "8",
    time_unit: "h",
    micro: false,
    notes: ""
  });
  const [calcResult, setCalcResult] = useState(null);

  // Histórico & Cronômetro de Atividade de Dosagem
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

  const [toastMessage, setToastMessage] = useState("");

  function handleSaveDraft() {
    const draft = clinicalHistoryService.saveDraft({
      id: currentActivityId,
      moduleType: MODULE_TYPES.DOSAGE,
      title: `Cálculo: ${problem.title}`,
      patientInfo: `${problem.category} • Solução: ${problem.solutionName}`,
      progress: studentInput.trim() ? 50 : 25,
      durationSeconds: activitySeconds,
      formData: { selectedIdx, studentInput, calcForm, activeTab }
    });
    setCurrentActivityId(draft.id);
    setToastMessage("Rascunho de cálculo salvo no Histórico!");
    setTimeout(() => setToastMessage(""), 3000);
  }

  function handleResumeActivity(item) {
    if (item?.formData) {
      if (typeof item.formData.selectedIdx === "number") setSelectedIdx(item.formData.selectedIdx);
      if (item.formData.studentInput) setStudentInput(item.formData.studentInput);
      if (item.formData.calcForm) setCalcForm(item.formData.calcForm);
      if (item.formData.activeTab) setActiveTab(item.formData.activeTab);
      if (item.durationSeconds) setActivitySeconds(item.durationSeconds);
    }
    if (item?.evaluation) {
      setFeedback({ explanation: typeof item.evaluation === "string" ? item.evaluation : (item.evaluation.explanation || "Resultado anterior resgatado."), isCorrect: (item.score || 0) >= 100 });
    }
    setCurrentActivityId(item.id);
    setIsHistoryOpen(false);
  }

  const problem = DOSAGE_PROBLEMS[selectedIdx];

  async function handleEvaluate() {
    if (!studentInput.trim()) return;
    setEvaluating(true);
    try {
      const res = await guideMedicationCalculation(problem, studentInput);
      setFeedback(res);
      setShowGotiEvaluationModal(true);

      if (res) {
        clinicalHistoryService.submitActivity({
          id: currentActivityId,
          moduleType: MODULE_TYPES.DOSAGE,
          title: `Cálculo: ${problem.title}`,
          patientInfo: `${problem.category} • Solução: ${problem.solutionName}`,
          durationSeconds: activitySeconds,
          score: res.isCorrect ? 100 : 70,
          evaluation: res.explanation || (res.isCorrect ? "Cálculo exato sem risco de iatrogenia." : "Ajuste de dosagem requerido."),
          formData: { selectedIdx, studentInput, res }
        });
      }
    } finally {
      setEvaluating(false);
    }
  }

  function handleReset() {
    setStudentInput("");
    setFeedback(null);
    setShowFormula(false);
    setShowConversions(false);
    setShowFullSolution(false);
  }

  function handleSelectProblem(idx) {
    setSelectedIdx(idx);
    handleReset();
  }

  function handleRandomProblem() {
    let nextIdx = Math.floor(Math.random() * DOSAGE_PROBLEMS.length);
    if (nextIdx === selectedIdx && DOSAGE_PROBLEMS.length > 1) {
      nextIdx = (selectedIdx + 1) % DOSAGE_PROBLEMS.length;
    }
    setSelectedIdx(nextIdx);
    handleReset();
  }

  function updateCalc(k, v) {
    setCalcForm((prev) => ({ ...prev, [k]: v }));
  }

  function runFreeCalculate() {
    const c = Number(calcForm.concentration) || 0;
    const dose = Number(calcForm.prescribed_dose) || 0;
    const weight = Number(calcForm.weight) || 0;
    const dosePerKg = Number(calcForm.dose_per_kg) || 0;
    const vol = Number(calcForm.volume_ml) || 0;
    const timeVal = Number(calcForm.time_value) || 0;
    const isMicro = calcForm.micro;
    const isHours = calcForm.time_unit === "h";

    if (calcType === "dose") {
      if (c <= 0 || dose <= 0) return setCalcResult(null);
      const ml = dose / c;
      setCalcResult({
        label: "Volume a aspirar / administrar",
        value: `${ml.toFixed(2)} mL`,
        formula: `Dose (${dose} mg) ÷ Concentração (${c} mg/mL) = ${ml.toFixed(2)} mL`,
        notes: `Para administrar ${dose} mg da apresentação de ${c} mg/mL, aspire exatamente ${ml.toFixed(2)} mL.`
      });
    } else if (calcType === "drip") {
      if (timeVal <= 0 || vol <= 0) return setCalcResult(null);
      let gtt;
      let formula;
      if (isHours) {
        if (isMicro) {
          gtt = vol / timeVal;
          formula = `Microgotas/min = Volume (${vol} mL) ÷ Tempo (${timeVal} h) = ${Math.round(gtt)} microgts/min`;
        } else {
          gtt = vol / (timeVal * 3);
          formula = `Gotas/min = Volume (${vol} mL) ÷ (Tempo (${timeVal} h) × 3) = ${Math.round(gtt)} gts/min`;
        }
      } else {
        const factor = isMicro ? 60 : 20;
        gtt = (vol * factor) / timeVal;
        formula = `${isMicro ? "Microgotas" : "Gotas"}/min = (Volume (${vol} mL) × ${factor}) ÷ Tempo (${timeVal} min) = ${Math.round(gtt)} ${isMicro ? "microgts" : "gts"}/min`;
      }
      setCalcResult({
        label: isMicro ? "Taxa em Microgotas / Minuto" : "Taxa em Gotas / Minuto (Macrogotas)",
        value: `${Math.round(gtt)} ${isMicro ? "microgts/min" : "gts/min"}`,
        formula,
        notes: isMicro
          ? `Em bomba de infusão contínua (BIC), programe a vazão para ${Math.round(gtt)} mL/h.`
          : `Em equipo comum macrogotas, ajuste a pinça rolete para regular aproximadamente ${Math.round(gtt)} gotas por minuto.`
      });
    } else {
      if (weight <= 0 || c <= 0 || dosePerKg <= 0) return setCalcResult(null);
      const totalDose = dosePerKg * weight;
      const ml = totalDose / c;
      setCalcResult({
        label: "Volume a administrar (Dose Ponderal)",
        value: `${ml.toFixed(2)} mL`,
        formula: `Dose total: ${dosePerKg} mg/kg × ${weight} kg = ${totalDose.toFixed(2)} mg. Volume: ${totalDose.toFixed(2)} mg ÷ ${c} mg/mL = ${ml.toFixed(2)} mL`,
        notes: `Dose calculada de ${totalDose.toFixed(2)} mg no peso de ${weight} kg.`
      });
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-800 dark:text-slate-100">
      <StudentHeader activeTab="calculos" />

      <main className="flex-1 mx-auto max-w-5xl w-full px-4 sm:px-6 py-6 space-y-6">
        {/* Barra Superior Limpa e Funcional com Histórico */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Cálculo de Medicamentos & Gotejamento
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Segurança do Paciente
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            {/* Cronômetro */}
            <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              <Clock className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              <span>{clinicalHistoryService.formatDuration(activitySeconds)}</span>
            </span>

            {/* Botão de Salvar Rascunho */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              className="rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
              title="Salvar rascunho do cálculo no Histórico"
            >
              <BookmarkPlus className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              <span>Salvar Rascunho</span>
            </Button>

            {/* Botão de Histórico Exclusivo de Cálculos */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHistoryOpen(true)}
              className="rounded-xl border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/60 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
            >
              <History className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              <span>Histórico de Cálculos</span>
            </Button>

            {/* Seletor de Modo Principal */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab("desafios")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === "desafios"
                    ? "bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Desafios & Tutoria
              </button>
              <button
                onClick={() => {
                  setActiveTab("calculadora");
                  runFreeCalculate();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === "calculadora"
                    ? "bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Calculadora Livre
              </button>
            </div>
          </div>
        </div>

        {/* Notificação Toast */}
        {toastMessage && (
          <div className="p-3.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs flex items-center gap-2 animate-in fade-in shadow-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 1: DESAFIOS CLÍNICOS & TUTORIA SOCRÁTICA                              */}
        {/* ========================================================================= */}
        {activeTab === "desafios" && (
          <div className="space-y-6 animate-in fade-in">
            {/* Banner de Acesso Rápido ao Histórico de Cálculos & Doses */}
            <div
              onClick={() => setIsHistoryOpen(true)}
              className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform shadow-2xs">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Consultar Histórico de Cálculos & Doses</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                      Retomar Atividades
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Veja os cálculos que você já resolveu, notas de acurácia matemática e continue desafios em andamento.
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
                <ArrowRight className="h-3.5 w-3.5 ml-1 text-teal-600" />
              </Button>
            </div>
            {/* Cabeçalho Limpo: Identificação e Ação de Sorteio */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 uppercase tracking-wide">
                    {problem.category}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Desafio Clínico {selectedIdx + 1} de {DOSAGE_PROBLEMS.length}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-1 tracking-tight">
                  {problem.title}
                </h2>
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Selecionar desafio:</span>
                  <select
                    value={selectedIdx}
                    onChange={(e) => handleSelectProblem(Number(e.target.value))}
                    className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 font-medium cursor-pointer"
                  >
                    {DOSAGE_PROBLEMS.map((p, i) => (
                      <option key={p.id || i} value={i}>
                        #{i + 1} - {p.category}: {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button
                onClick={handleRandomProblem}
                variant="outline"
                className="rounded-xl border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-xs font-bold flex items-center gap-2 shadow-2xs self-start sm:self-auto shrink-0 py-2.5 px-4 tap-press hover-lift"
              >
                <Shuffle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>🎲 Sortear Novo Desafio</span>
              </Button>
            </div>

            {/* Dica e Suporte do Goti */}
            <div className="rounded-2xl border border-teal-200/80 dark:border-teal-800/80 bg-teal-50/70 dark:bg-slate-900/90 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="shrink-0 flex items-center justify-center">
                <GotiAnimated
                  animation={evaluating ? "thinking" : feedback?.isCorrect ? "jumping" : feedback ? "angry" : "pointing"}
                  size="feedback"
                  className="w-32 h-32 sm:w-44 sm:h-44 md:w-52 md:h-52 lg:w-56 lg:h-56 shrink-0"
                />
              </div>
              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 text-[11px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Preceptor Goti
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                  {feedback?.isCorrect
                    ? "Incrível! Dosagem perfeita e cálculo validado com rigor de segurança!"
                    : evaluating
                    ? "Deixe-me conferir as etapas do seu cálculo clínico..."
                    : feedback
                    ? "Atenção à margem terapêutica! Vamos recalcular juntos?"
                    : "Resolva este desafio! A dosagem correta protege o paciente contra iatrogenias."}
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(
                          new CustomEvent("open-goti-chat", {
                            detail: {
                              prompt: `Olá Goti! Estou resolvendo uma prescrição de ${problem.category}: "${problem.description}". Como devo raciocinar para montar a fórmula passo a passo? Pode me dar um exemplo didático modelo similar sem me dar a resposta final?`
                            }
                          })
                        );
                      }
                    }}
                    className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs py-2 px-3.5 tap-press"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Dúvidas? Fale com o Goti!</span>
                  </Button>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    O Goti te guia na fórmula com um exemplo didático modelo.
                  </span>
                </div>
              </div>
            </div>

            {/* Bancada Principal Limpa de Cálculo Clínico (Sem ruído lateral - CLT / Sweller) */}
            <div className="max-w-4xl mx-auto space-y-5">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
                {/* Cabeçalho da Ordem com Ações Sob Demanda (Progressive Disclosure) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                      Ordem Médica #{selectedIdx + 1}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {problem.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setShowFormula(!showFormula)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 ${
                        showFormula
                          ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                      <span>{showFormula ? "Ocultar Fórmula" : "💡 Ver Fórmula"}</span>
                    </button>

                    <button
                      onClick={() => setShowConversions(!showConversions)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 ${
                        showConversions
                          ? "bg-teal-50 dark:bg-teal-950/40 border-teal-300 dark:border-teal-800 text-teal-900 dark:text-teal-300"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <BookOpen className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                      <span>{showConversions ? "Ocultar Conversões" : "📊 Tabela de Conversão"}</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("calculadora");
                        runFreeCalculate();
                      }}
                      className="text-xs font-medium px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
                    >
                      <Calculator className="h-3.5 w-3.5 text-slate-500" />
                      <span>Calculadora Livre</span>
                    </button>
                  </div>
                </div>

                {/* Tabela de Conversões Sob Demanda (Divulgação Progressiva) */}
                {showConversions && (
                  <div className="p-4 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 text-xs text-teal-950 dark:text-teal-200 space-y-2.5 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 uppercase tracking-wide text-[11px] text-teal-900 dark:text-teal-300">
                        <BookOpen className="h-3.5 w-3.5" />
                        Tabela de Conversões & Equivalências Hospitalares
                      </span>
                      <button
                        onClick={() => setShowConversions(false)}
                        className="text-[10px] font-bold text-teal-700 dark:text-teal-400 hover:underline"
                      >
                        Fechar
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-teal-200/80 dark:border-teal-800/60">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Gotas</span>
                        <strong className="text-teal-900 dark:text-teal-200">1 mL = 20 gotas</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-teal-200/80 dark:border-teal-800/60">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Microgotas</span>
                        <strong className="text-teal-900 dark:text-teal-200">1 mL = 60 microgotas</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-teal-200/80 dark:border-teal-800/60">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Massa / Gramas</span>
                        <strong className="text-teal-900 dark:text-teal-200">1 g = 1.000 mg</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-teal-200/80 dark:border-teal-800/60">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Miligramas</span>
                        <strong className="text-teal-900 dark:text-teal-200">1 mg = 1.000 mcg</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fórmula Orientadora Sob Demanda (Divulgação Progressiva) */}
                {showFormula && (
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start justify-between gap-2.5 animate-in fade-in">
                    <div className="flex items-start gap-2.5">
                      <Lightbulb className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div>
                        <span className="font-bold">Fórmula de Referência Orientadora:</span>
                        <p className="mt-0.5 font-mono text-slate-800 dark:text-slate-200 font-semibold">{problem.formulaHint}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowFormula(false)}
                      className="text-[10px] font-bold text-amber-700 dark:text-amber-400 hover:underline shrink-0"
                    >
                      Ocultar
                    </button>
                  </div>
                )}

                {/* Detalhes Estruturados da Prescrição */}
                <div className="space-y-3">
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {problem.title}
                  </h2>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <span>Registro de Prescrição</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                      {problem.description}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">Solução</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{problem.solutionName || "Solução"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">Volume</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{problem.volume || "—"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">Via / Tempo</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{problem.route} ({problem.time})</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">Equipo</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{problem.device}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Campo de Resolução Ativa do Aluno (Miller Nível 3 - Demonstrar Como Faz) */}
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    {problem.question}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={studentInput}
                      onChange={(e) => setStudentInput(e.target.value)}
                      placeholder="Digite o resultado do seu cálculo (valor numérico ou raciocínio)..."
                      className="rounded-xl border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm h-10"
                      onKeyDown={(e) => e.key === "Enter" && handleEvaluate()}
                    />
                    <Button
                      onClick={handleEvaluate}
                      disabled={evaluating || !studentInput.trim()}
                      className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white shrink-0 px-5 h-10 font-semibold"
                    >
                      {evaluating ? "Verificando..." : "Conferir Cálculo"}
                    </Button>
                  </div>
                </div>

                {/* Feedback & Debriefing Clínico Imediato (PEARLS / DML pós-ação) */}
                {feedback && (
                  <div className="space-y-4 animate-in fade-in">
                    <div
                      className={`p-4 rounded-xl border space-y-3 transition-all ${
                        feedback.isCorrect
                          ? "bg-slate-50 dark:bg-slate-800/80 border-teal-600 text-slate-900 dark:text-slate-100"
                          : "bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div
                          className="shrink-0 flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
                          onClick={() => setShowGotiEvaluationModal(true)}
                          title="Clique para ver a comemoração do Goti!"
                        >
                          <GotiAnimated
                            animation={feedback.isCorrect ? "jumping" : "angry"}
                            size="feedback"
                            className="w-32 h-32 sm:w-44 sm:h-44 md:w-52 md:h-52 lg:w-56 lg:h-56 shrink-0"
                          />
                        </div>
                        <div className="flex-1 space-y-1.5 text-center sm:text-left">
                          <div className="flex items-center justify-center sm:justify-start gap-2">
                            {feedback.isCorrect ? (
                              <CheckCircle2 className="h-5 w-5 text-teal-700 dark:text-teal-400 shrink-0" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                            )}
                            <h3 className="text-sm font-bold">
                              {feedback.isCorrect ? "Cálculo Correto e Aprovado pelo Goti! 🎉" : "Atenção na Resolução:"}
                            </h3>
                          </div>

                          <p className="text-xs leading-relaxed">{feedback.feedback}</p>
                        </div>
                      </div>

                      {feedback.questionToThink && (
                        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200">
                          <span className="font-bold block text-slate-900 dark:text-slate-100 mb-0.5">Ponto de Atenção:</span>
                          <p>{feedback.questionToThink}</p>
                        </div>
                      )}

                      {feedback.isCorrect ? (
                        <div className="pt-2 flex justify-end">
                          <Button
                            size="sm"
                            onClick={handleRandomProblem}
                            className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center gap-1.5"
                          >
                            <span>🎲 Próximo Desafio Aleatório</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-amber-200/60 dark:border-amber-900/40">
                          <Button
                            size="sm"
                            onClick={() => {
                              setFeedback(null);
                              setStudentInput("");
                            }}
                            className="rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold flex items-center gap-1.5"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Tentar Novamente (Sem Spoiler)</span>
                          </Button>

                          {!showFullSolution && (
                            <button
                              type="button"
                              onClick={() => setShowFullSolution(true)}
                              className="text-[11px] font-semibold text-amber-800 dark:text-amber-400 hover:underline"
                            >
                              Desistir e ver resolução completa →
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Resolução Passo a Passo Revelada Apenas Quando Correto ou Por Desistência Explícita */}
                    {(feedback.isCorrect || showFullSolution) && (
                      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                            <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                            Etapas de Resolução & Dupla Checagem (Debriefing)
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Resposta Esperada: {problem.correctResult}
                          </span>
                        </div>
                        <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                          {problem.explanationSteps.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-bold shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span className="leading-relaxed">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 2: CALCULADORA CLÍNICA LIVRE (DO BACKUP ASSISTENCIAL)                  */}
        {/* ========================================================================= */}
        {activeTab === "calculadora" && (
          <div className="space-y-6 animate-in fade-in">
            {/* Seletor de Tipo de Cálculo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CALC_TYPES.map((t) => {
                const Icon = t.icon;
                const active = calcType === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => {
                      setCalcType(t.key);
                      setCalcResult(null);
                    }}
                    className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition ${
                      active
                        ? "bg-white dark:bg-slate-900 border-teal-700 dark:border-teal-500 shadow-xs ring-1 ring-teal-700 dark:ring-teal-500"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${active ? "bg-teal-700 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">{t.label}</span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{t.hint}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Formulário de Cálculo */}
              <div className="lg:col-span-2 space-y-5">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {calcType === "dose" && "Cálculo de Dose e Volume a Administrar"}
                        {calcType === "drip" && "Cálculo de Gotejamento e Infusão Venosa"}
                        {calcType === "weight_based" && "Cálculo de Dose Pediátrica por Peso (mg/kg)"}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Insira os parâmetros prescritos para obter a taxa e o volume com as etapas da fórmula.
                      </p>
                    </div>
                  </div>

                  {/* Campos do Modo 1: Dose -> Volume */}
                  {calcType === "dose" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Dose Prescrita (mg ou UI)</label>
                        <Input
                          type="number"
                          placeholder="Ex: 500"
                          value={calcForm.prescribed_dose}
                          onChange={(e) => updateCalc("prescribed_dose", e.target.value)}
                          className="rounded-xl border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Concentração Disponível (mg/mL ou UI/mL)</label>
                        <Input
                          type="number"
                          placeholder="Ex: 250"
                          value={calcForm.concentration}
                          onChange={(e) => updateCalc("concentration", e.target.value)}
                          className="rounded-xl border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {/* Campos do Modo 2: Gotejamento */}
                  {calcType === "drip" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Volume Total da Solução (mL)</label>
                          <Input
                            type="number"
                            placeholder="Ex: 1000"
                            value={calcForm.volume_ml}
                            onChange={(e) => updateCalc("volume_ml", e.target.value)}
                            className="rounded-xl border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tempo de Infusão</label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="Ex: 8"
                              value={calcForm.time_value}
                              onChange={(e) => updateCalc("time_value", e.target.value)}
                              className="rounded-xl border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm flex-1"
                            />
                            <select
                              value={calcForm.time_unit}
                              onChange={(e) => updateCalc("time_unit", e.target.value)}
                              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200"
                            >
                              <option value="h">Horas</option>
                              <option value="min">Minutos</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tipo de Equipo:</label>
                        <button
                          type="button"
                          onClick={() => updateCalc("micro", false)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            !calcForm.micro ? "bg-teal-700 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          Macrogotas (1 mL = 20 gotas)
                        </button>
                        <button
                          type="button"
                          onClick={() => updateCalc("micro", true)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            calcForm.micro ? "bg-teal-700 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          Microgotas (1 mL = 60 microgotas)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Campos do Modo 3: Dose por Peso */}
                  {calcType === "weight_based" && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Peso do Paciente (kg)</label>
                        <Input
                          type="number"
                          placeholder="Ex: 18"
                          value={calcForm.weight}
                          onChange={(e) => updateCalc("weight", e.target.value)}
                          className="rounded-xl border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Dose Prescrita (mg/kg)</label>
                        <Input
                          type="number"
                          placeholder="Ex: 15"
                          value={calcForm.dose_per_kg}
                          onChange={(e) => updateCalc("dose_per_kg", e.target.value)}
                          className="rounded-xl border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Concentração (mg/mL)</label>
                        <Input
                          type="number"
                          placeholder="Ex: 50"
                          value={calcForm.concentration}
                          onChange={(e) => updateCalc("concentration", e.target.value)}
                          className="rounded-xl border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={runFreeCalculate}
                      className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs px-6 h-10 font-semibold"
                    >
                      Calcular Agora
                    </Button>
                  </div>

                  {/* Exibição do Resultado Calculado */}
                  {calcResult && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-teal-600 space-y-2.5 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wide">
                          {calcResult.label}
                        </span>
                        <span className="text-lg font-bold text-teal-900 dark:text-teal-200 bg-white dark:bg-slate-900 px-3 py-1 rounded-lg border border-teal-200 dark:border-teal-700">
                          {calcResult.value}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                        {calcResult.formula}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {calcResult.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Coluna Lateral: Tabela de Referência e Conversões (Resgatada do Backup) */}
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-teal-700 dark:text-teal-400" />
                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                        Tabela de Conversões
                      </h3>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">Enfermagem</span>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 p-3">
                    {CONVERSIONS.map((c, i) => (
                      <p key={i} className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                        • {c}
                      </p>
                    ))}
                  </div>

                  <div className="space-y-2 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 p-3.5 border border-teal-100 dark:border-teal-900">
                    <p className="text-xs font-bold text-teal-900 dark:text-teal-300">Fórmulas de Gotejamento Venoso</p>
                    <div className="space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300 font-mono">
                      <p><b>Macro (h):</b> V ÷ (T × 3) gotas/min</p>
                      <p><b>Micro (h):</b> V ÷ T microgotas/min</p>
                      <p><b>Macro (min):</b> (V × 20) ÷ T gotas/min</p>
                      <p><b>Micro (min):</b> (V × 60) ÷ T microgotas/min</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Retangular de Conclusão e Avaliação do Goti */}
        <GotiEvaluationModal
          isOpen={showGotiEvaluationModal}
          onClose={() => setShowGotiEvaluationModal(false)}
          score={feedback?.isCorrect ? 100 : 40}
          scoreLabel="Acurácia do Cálculo"
          activityTitle={`Cálculo Clínico: ${problem.title}`}
          comment={feedback?.feedback || (feedback?.isCorrect ? "Cálculo matemático exato e dupla checagem validada com sucesso pelo Goti!" : "Atenção à fórmula e arredondamento de gotas. Vamos recalcular juntos?")}
          onContinue={() => setShowGotiEvaluationModal(false)}
        />

        {/* Modal Unificado de Histórico de Cálculos (Isolado exclusivamente para Dosagem) */}
        <CaseHistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          onResumeActivity={handleResumeActivity}
          defaultModuleFilter="dosage"
          lockModuleFilter={true}
          title="Histórico de Cálculos & Doses"
        />
      </main>

      <StudentFooter />
    </div>
  );
}
