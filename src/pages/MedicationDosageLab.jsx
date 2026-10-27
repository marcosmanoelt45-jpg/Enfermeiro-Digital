import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Lightbulb,
  FileText,
  Calculator,
  Droplet,
  Beaker,
  BookOpen,
  X,
  MoreVertical
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
import MobileBottomDock from "@/components/mobile/MobileBottomDock";

import { getDosageProblems } from "@/data/dosageProblems";
import { generateProceduralDosageProblem } from "@/services/proceduralDosageGenerator";

const INITIAL_PROBLEMS = getDosageProblems();


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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("desafios"); // "desafios" | "calculadora"

  // Estado dos Desafios Clínicos & Geração Procedural
  const [problemsList, setProblemsList] = useState(INITIAL_PROBLEMS);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [studentInput, setStudentInput] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [showFormula, setShowFormula] = useState(false);
  const [showConversions, setShowConversions] = useState(false);
  const [showFullSolution, setShowFullSolution] = useState(false);
  const [showGotiEvaluationModal, setShowGotiEvaluationModal] = useState(false);

  // Estado da Calculadora Interativa Livre
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
  const [toastMessage, setToastMessage] = useState("");

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

  const problem = problemsList[selectedIdx] || problemsList[0] || INITIAL_PROBLEMS[0];

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

  function handleReset() {
    setStudentInput("");
    setSelectedOption(null);
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
    let nextIdx = Math.floor(Math.random() * problemsList.length);
    if (nextIdx === selectedIdx && problemsList.length > 1) {
      nextIdx = (selectedIdx + 1) % problemsList.length;
    }
    setSelectedIdx(nextIdx);
    handleReset();
  }

  function handleGenerateProcedural() {
    const newProblem = generateProceduralDosageProblem();
    setProblemsList((prev) => [newProblem, ...prev]);
    setSelectedIdx(0);
    handleReset();
    setToastMessage("⚡ Novo cálculo gerado proceduralmente com 4 alternativas aleatórias!");
    setTimeout(() => setToastMessage(""), 3500);
  }

  function handleSelectOption(opt) {
    setSelectedOption(opt.id);
    setStudentInput(opt.value || opt.text);

    if (opt.isCorrect) {
      setFeedback({
        isCorrect: true,
        feedback: `Alternativa (${opt.letter}) Correta! ${opt.rationale}`,
        questionToThink: null
      });
      setShowGotiEvaluationModal(true);
      clinicalHistoryService.submitActivity({
        id: currentActivityId,
        moduleType: MODULE_TYPES.DOSAGE,
        title: `Cálculo: ${problem.title}`,
        patientInfo: `${problem.category} • Solução: ${problem.solutionName}`,
        durationSeconds: activitySeconds,
        score: 100,
        evaluation: `Alternativa (${opt.letter}) correta: ${opt.rationale}`,
        formData: { selectedIdx, studentInput: opt.value, selectedOption: opt.id }
      });
    } else {
      setFeedback({
        isCorrect: false,
        feedback: `Alternativa (${opt.letter}) Incorreta. ${opt.rationale}`,
        questionToThink: "Revise a montagem da fórmula ou o cálculo de diluição."
      });
    }
  }

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
    <div className="min-h-screen bg-[#0B131D] text-[#EAF2F8] pb-28 md:pb-8 flex flex-col">
      <div className="hidden md:block">
        <StudentHeader activeTab="calculos" />
      </div>

      <main className="flex-1 mx-auto max-w-xl w-full px-4 sm:px-6 py-4 space-y-5">
        {/* Barra Superior de Exercício 1:1 com Página 17 do PDF */}
        <div className="flex items-center justify-between gap-3 pt-1 pb-2">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-10 h-10 rounded-full border border-[#1F3045] bg-[#0E1722] hover:bg-[#16222E] text-[#9FB3C6] hover:text-white flex items-center justify-center transition-colors shrink-0"
            title="Voltar ao início"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Barra de Progresso Centralizada (1/6) */}
          <div className="flex-1 max-w-[200px] flex items-center gap-2">
            <div className="flex-1 h-2 bg-[#1F3045] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#20D5B5] rounded-full transition-all duration-300"
                style={{ width: `${((selectedIdx + 1) / problemsList.length) * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-[#9FB3C6] shrink-0">
              {selectedIdx + 1}/{problemsList.length}
            </span>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="w-10 h-10 rounded-full border border-[#1F3045] bg-[#0E1722] hover:bg-[#16222E] text-[#9FB3C6] hover:text-white flex items-center justify-center transition-colors shrink-0"
              title="Opções do desafio & Histórico"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notificação Toast */}
        {toastMessage && (
          <div className="p-3.5 rounded-2xl bg-[#16222E] border border-[#20D5B5]/40 text-white text-xs flex items-center gap-2 animate-in fade-in shadow-md">
            <CheckCircle2 className="h-4 w-4 text-[#20D5B5] shrink-0" />
            <span className="font-bold">{toastMessage}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 1: DESAFIOS CLÍNICOS & CASOS PRÁTICOS (Páginas 17 e 18 do PDF)        */}
        {/* ========================================================================= */}
        {activeTab === "desafios" && (
          <div className="space-y-5 animate-in fade-in">
            {/* Badges de Categoria (Página 17 do PDF) */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#20D5B5]/15 text-[#20D5B5] border border-[#20D5B5]/30">
                {problem.category?.toUpperCase() || "MACROGOTAS / HORAS"}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#20D5B5]/15 text-[#20D5B5] border border-[#20D5B5]/30">
                Segurança do Paciente
              </span>
            </div>

            {/* Título do Desafio */}
            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
              {problem.title}
            </h1>

            {/* Card "Registro de prescrição" (Página 17 do PDF) */}
            <div className="bg-[#131F2E] rounded-3xl border border-[#1F3045] p-5 sm:p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-black text-[#20D5B5]">
                <FileText className="w-4 h-4 text-[#20D5B5]" />
                <span className="uppercase tracking-wider">Registro de prescrição</span>
              </div>

              <p className="text-xs sm:text-sm text-[#EAF2F8] leading-relaxed font-medium">
                {problem.description}
              </p>

              {/* Grid 2x2 com os 4 Quadrantes */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#1F3045] text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-[#9FB3C6] font-bold block uppercase">Solução</span>
                  <strong className="text-white font-bold text-xs sm:text-sm block">
                    {problem.solutionName || "Soro Fisiológico 0,9%"}
                  </strong>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-[#9FB3C6] font-bold block uppercase">Volume</span>
                  <strong className="text-white font-bold text-xs sm:text-sm block">
                    {problem.volume || "1000 mL"}
                  </strong>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-[#9FB3C6] font-bold block uppercase">Via / tempo</span>
                  <strong className="text-white font-bold text-xs sm:text-sm block">
                    {problem.route || "IV"} · {problem.time || "8 horas"}
                  </strong>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-[#9FB3C6] font-bold block uppercase">Equipo</span>
                  <strong className="text-white font-bold text-xs sm:text-sm block">
                    {problem.device || "Macrogotas"}
                  </strong>
                </div>
              </div>
            </div>

            {/* Pergunta do Desafio */}
            <div className="space-y-3 pt-1">
              <h2 className="text-base sm:text-lg font-black text-white">
                {problem.question || "Quantas gotas por minuto?"}
              </h2>

              {/* Campo de Resposta com Sufixo Integrado (Página 17 do PDF) */}
              <div className="bg-[#0E1722] rounded-2xl border-2 border-[#20D5B5] p-4 flex items-center justify-between gap-3 shadow-inner">
                <input
                  type="text"
                  value={studentInput}
                  onChange={(e) => {
                    setStudentInput(e.target.value);
                    setSelectedOption(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleEvaluate()}
                  placeholder="Sua resposta"
                  className="bg-transparent border-none text-white text-base sm:text-lg font-black placeholder:text-[#9FB3C6]/60 focus:outline-none focus:ring-0 flex-1 w-full"
                />
                <span className="text-xs sm:text-sm font-bold text-[#9FB3C6] shrink-0">
                  gotas/min
                </span>
              </div>

              {/* 4 Alternativas Rápidas (Toque para preencher) */}
              {problem.options && problem.options.length > 0 && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {problem.options.map((opt) => (
                    <button
                      key={opt.id || opt.letter}
                      type="button"
                      onClick={() => handleSelectOption(opt)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center gap-2 ${
                        studentInput.trim() === opt.value || selectedOption === opt.id
                          ? "bg-[#20D5B5]/15 border-[#20D5B5] text-[#20D5B5]"
                          : "bg-[#0E1722] border-[#1F3045] text-[#9FB3C6] hover:text-white"
                      }`}
                    >
                      <span className="w-5 h-5 rounded-md bg-[#131F2E] border border-[#1F3045] text-[10px] font-black flex items-center justify-center shrink-0">
                        {opt.letter}
                      </span>
                      <span className="truncate">{opt.text}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Linha de Ações Auxiliares (Página 17 do PDF) */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                type="button"
                onClick={() => setShowFormula(!showFormula)}
                className={`rounded-2xl border px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
                  showFormula
                    ? "bg-[#FFC247]/15 border-[#FFC247] text-[#FFC247]"
                    : "bg-[#0E1722] border-[#1F3045] text-white hover:bg-[#16222E]"
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5 text-[#FFC247]" />
                <span>Ver Fórmula</span>
              </button>

              <button
                type="button"
                onClick={() => setShowConversions(!showConversions)}
                className={`rounded-2xl border px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
                  showConversions
                    ? "bg-[#20D5B5]/15 border-[#20D5B5] text-[#20D5B5]"
                    : "bg-[#0E1722] border-[#1F3045] text-white hover:bg-[#16222E]"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-[#20D5B5]" />
                <span>Tabela de Conversão</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("open-goti-chat", {
                      detail: {
                        prompt: `Olá Goti! Estou resolvendo uma prescrição de ${problem.category}: "${problem.description}". Como devo raciocinar para montar a fórmula passo a passo? Pode me dar uma dica didática?`
                      }
                    })
                  );
                }}
                className="rounded-2xl border border-[#1F3045] bg-[#0E1722] hover:bg-[#16222E] text-white px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-2"
              >
                <GotiAnimated animation="pointing" size={24} />
                <span>Goti</span>
              </button>
            </div>

            {/* Tabela de Conversões Sob Demanda */}
            {showConversions && (
              <div className="p-4 rounded-2xl bg-[#0E1722] border border-[#1F3045] text-xs text-[#EAF2F8] space-y-2.5 animate-in fade-in">
                <span className="font-bold flex items-center gap-1.5 uppercase tracking-wide text-[10px] text-[#20D5B5]">
                  <BookOpen className="h-3.5 w-3.5" />
                  Tabela de Conversões Hospitalares
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-[#131F2E] border border-[#1F3045]">
                    <span className="text-[10px] text-[#9FB3C6] block">Gotas</span>
                    <strong className="text-white">1 mL = 20 gotas</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-[#131F2E] border border-[#1F3045]">
                    <span className="text-[10px] text-[#9FB3C6] block">Microgotas</span>
                    <strong className="text-white">1 mL = 60 microgotas</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-[#131F2E] border border-[#1F3045]">
                    <span className="text-[10px] text-[#9FB3C6] block">Gramas</span>
                    <strong className="text-white">1 g = 1.000 mg</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-[#131F2E] border border-[#1F3045]">
                    <span className="text-[10px] text-[#9FB3C6] block">Miligramas</span>
                    <strong className="text-white">1 mg = 1.000 mcg</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Fórmula de Referência Sob Demanda */}
            {showFormula && (
              <div className="p-4 rounded-2xl bg-[#0E1722] border border-[#FFC247]/40 text-xs text-[#EAF2F8] space-y-1 animate-in fade-in">
                <span className="font-bold text-[#FFC247] block text-[10px] uppercase">Fórmula de Referência:</span>
                <p className="font-mono text-sm text-white font-bold">{problem.formulaHint}</p>
              </div>
            )}

            {/* Botão Principal "Verificar" 3D Tátil (Página 17 do PDF) */}
            <div className="pt-3">
              <button
                type="button"
                disabled={evaluating || !studentInput.trim()}
                onClick={handleEvaluate}
                className="w-full py-4 rounded-2xl bg-[#20D5B5] hover:bg-[#1AD1B0] text-[#0B131D] font-black shadow-[0_4px_0_0_#148A76] active:translate-y-1 active:shadow-none text-center text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {evaluating ? "Verificando..." : "Verificar"}
              </button>
            </div>

            {/* ========================================================================= */}
            {/* BOTTOM SHEET / MODAL DE FEEDBACK IMEDIATO (Página 18 do PDF)               */}
            {/* ========================================================================= */}
            {feedback && (
              <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
                <div className="bg-[#131F2E] border-t sm:border border-[#1F3045] rounded-t-[32px] sm:rounded-3xl p-6 w-full max-w-md space-y-5 animate-in slide-in-from-bottom duration-200 shadow-2xl">
                  {/* Cabeçalho do Resultado */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                        feedback.isCorrect ? "bg-[#20D5B5] text-[#0B131D]" : "bg-[#FFC247] text-[#0B131D]"
                      }`}
                    >
                      <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">
                        {feedback.isCorrect ? "Correto!" : "Atenção ao cálculo!"}
                      </h3>
                      <span className="inline-block text-xs font-black text-[#20D5B5] bg-[#20D5B5]/15 border border-[#20D5B5]/30 px-2.5 py-0.5 rounded-full mt-0.5">
                        {feedback.isCorrect ? "+25 PE" : "Revisar"}
                      </span>
                    </div>
                  </div>

                  {/* Card "Como chegar lá" (Página 18 do PDF) */}
                  <div className="bg-[#0E1722] rounded-2xl border border-[#1F3045] p-4 space-y-2.5">
                    <span className="text-xs font-black text-white block">Como chegar lá</span>
                    <div className="space-y-2 text-xs font-mono text-[#EAF2F8]">
                      {problem.explanationSteps && problem.explanationSteps.length >= 2 ? (
                        <>
                          <div className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-md bg-[#131F2E] border border-[#1F3045] text-white font-black text-xs flex items-center justify-center shrink-0">
                              1
                            </span>
                            <span className="text-white font-bold leading-relaxed pt-0.5">
                              {problem.explanationSteps[2] || "1000 ÷ (8 × 3) = 41,7"}
                            </span>
                          </div>
                          <div className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-md bg-[#131F2E] border border-[#1F3045] text-white font-black text-xs flex items-center justify-center shrink-0">
                              2
                            </span>
                            <span className="text-white font-bold leading-relaxed pt-0.5">
                              {problem.explanationSteps[3] || `Arredondando: ${problem.correctResult} gotas/min`}
                            </span>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-[#9FB3C6] font-sans leading-relaxed">
                          {feedback.feedback}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Botão 3D "Continuar" (Página 18 do PDF) */}
                  <button
                    type="button"
                    onClick={() => {
                      setFeedback(null);
                      setStudentInput("");
                      setSelectedOption(null);
                      setSelectedIdx((prev) => (prev + 1) % problemsList.length);
                    }}
                    className="w-full py-4 rounded-2xl bg-[#20D5B5] hover:bg-[#1AD1B0] text-[#0B131D] font-black shadow-[0_4px_0_0_#148A76] active:translate-y-1 active:shadow-none text-center text-sm transition-all cursor-pointer"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}
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
      <MobileBottomDock />
    </div>
  );
}
