import React, { useState, useEffect, useRef } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  FileText,
  X,
  MoreVertical,
  History,
  RotateCcw,
  PlusCircle,
  HelpCircle,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import StudentHeader from "@/components/StudentHeader";
import StudentFooter from "@/components/StudentFooter";
import CaseHistoryModal from "@/components/history/CaseHistoryModal";
import { clinicalHistoryService, MODULE_TYPES } from "@/services/clinicalHistoryService";
import { clinicalGamificationService } from "@/services/clinicalGamificationService";
import { useAuth } from "@/lib/AuthContext";
import { celebrate } from "@/lib/celebrate";
import { spring, vibrate } from "@/lib/motion";
import { AnimatedProgress } from "@/components/ui/animated-progress";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { validateCalculoAnswer } from "@/services/simuladorFormulaService";

import { getDosageProblems } from "@/data/dosageProblems";
import { generateProceduralDosageProblem } from "@/services/proceduralDosageGenerator";

const INITIAL_PROBLEMS = getDosageProblems();
const DOSAGE_SOLVED_KEY = "enfere_dosage_solved_ids_v1";

function getSolvedDosageIds(userId) {
  try {
    if (typeof localStorage === "undefined") return new Set();
    const cleanId = userId ? String(userId).replace(/[^a-zA-Z0-9_-]/g, "_") : "anon";
    const raw = localStorage.getItem(`${DOSAGE_SOLVED_KEY}_${cleanId}`);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markDosageIdSolved(id, userId) {
  try {
    if (typeof localStorage === "undefined" || !id) return;
    const cleanId = userId ? String(userId).replace(/[^a-zA-Z0-9_-]/g, "_") : "anon";
    const k = `${DOSAGE_SOLVED_KEY}_${cleanId}`;
    const raw = localStorage.getItem(k);
    const set = raw ? new Set(JSON.parse(raw)) : new Set();
    set.add(String(id));
    localStorage.setItem(k, JSON.stringify(Array.from(set)));
  } catch {}
}

const CONVERSIONS = [
  { label: "Massa", value: "1 g = 1.000 mg" },
  { label: "Massa", value: "1 mg = 1.000 mcg" },
  { label: "Volume", value: "1 L = 1.000 mL" },
  { label: "Gotejamento", value: "1 mL = 20 gotas" },
  { label: "Gotejamento", value: "1 mL = 60 microgotas" },
  { label: "Gotejamento", value: "1 gota = 3 microgotas" },
  { label: "Concentração", value: "1% = 10 mg/mL" },
  { label: "Eletrólitos", value: "KCl 19,1% = 2,56 mEq/mL" }
];

export default function MedicationDosageLab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("desafios"); 

  const [problemsList, setProblemsList] = useState(INITIAL_PROBLEMS);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [studentInput, setStudentInput] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const [searchParams] = useSearchParams();
  const [currentActivityId, setCurrentActivityId] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const startedAt = useRef(Date.now());
  const resumedSeconds = useRef(0);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "review" || action === "continue" || action === "history") {
      setIsHistoryOpen(true);
    }
  }, [searchParams]);

  const problem = problemsList[selectedIdx] || problemsList[0] || INITIAL_PROBLEMS[0];

  function getDuration() {
    return Math.round((Date.now() - startedAt.current) / 1000) + resumedSeconds.current;
  }

  function handleSaveDraft() {
    const duration = getDuration();
    const draft = clinicalHistoryService.saveDraft({
      id: currentActivityId,
      moduleType: MODULE_TYPES.DOSAGE,
      title: `Cálculo: ${problem.title}`,
      patientInfo: `${problem.category} • ${problem.solutionName}`,
      progress: Math.round(((selectedIdx + 1) / problemsList.length) * 100),
      durationSeconds: duration,
      userId: user?.id,
      formData: { selectedIdx, studentInput, activeTab, resumedSeconds: duration }
    });
    setCurrentActivityId(draft.id);
    setToastMessage("Rascunho salvo!");
    setTimeout(() => setToastMessage(""), 3000);
    setIsOptionsOpen(false);
  }

  function handleResumeActivity(item) {
    if (item?.formData) {
      if (typeof item.formData.selectedIdx === "number") setSelectedIdx(item.formData.selectedIdx);
      if (item.formData.studentInput) setStudentInput(item.formData.studentInput);
      if (item.formData.activeTab) setActiveTab(item.formData.activeTab);
      if (typeof item.formData.resumedSeconds === "number") {
        resumedSeconds.current = item.formData.resumedSeconds;
        startedAt.current = Date.now();
      }
    }
    setCurrentActivityId(item.id);
    setIsHistoryOpen(false);
  }

  function handleReset() {
    setStudentInput("");
    setSelectedOption(null);
    setFeedback(null);
    setShowHelp(false);
  }

  function handleNext() {
    if (selectedIdx + 1 < problemsList.length) {
      setSelectedIdx(prev => prev + 1);
      handleReset();
    } else {
      setShowSummary(true);
    }
  }

  function handleRandomProblem() {
    const solvedSet = getSolvedDosageIds(user?.id);
    const unSolvedIndices = problemsList
      .map((p, i) => (!solvedSet.has(String(p.id)) && i !== selectedIdx ? i : -1))
      .filter(i => i !== -1);

    if (unSolvedIndices.length > 0) {
      setSelectedIdx(unSolvedIndices[Math.floor(Math.random() * unSolvedIndices.length)]);
    } else {
      handleGenerateProcedural();
    }
    handleReset();
    setIsOptionsOpen(false);
  }

  function handleGenerateProcedural() {
    const newProblem = generateProceduralDosageProblem();
    setProblemsList(prev => [...prev, newProblem]);
    setSelectedIdx(problemsList.length);
    handleReset();
    setToastMessage("Novo desafio gerado!");
    setTimeout(() => setToastMessage(""), 3000);
    setIsOptionsOpen(false);
  }

  async function handleEvaluate() {
    if (!studentInput.trim() || evaluating || feedback) return;
    setEvaluating(true);
    
    try {
      const selectedOptObj = problem.options?.find(
        o => o.id === selectedOption || o.value?.trim() === studentInput.trim() || o.text?.trim() === studentInput.trim()
      );

      let isCorrect = false;
      let rationale = selectedOptObj?.rationale || "";

      if (selectedOptObj) {
        isCorrect = Boolean(selectedOptObj.isCorrect);
      } else {
        const resMath = validateCalculoAnswer({
          alunoResposta: studentInput,
          valorEsperado: Number(String(problem.correctResult).replace(",", ".")),
          tolerancia: problem.answer?.relTol ?? 0.01,
          unidade: problem.answerUnit,
        });
        // Gotejamento é sempre um número inteiro de gotas: "41,7" não é uma resposta aplicável no equipo.
        isCorrect = resMath.correta && (problem.answer?.kind !== "integer" || Number.isInteger(resMath.alunoVal));
      }

      const res = {
        isCorrect,
        rationale,
        feedback: isCorrect ? "Excelente! Precisão clínica garantida." : "Atenção necessária no cálculo.",
        steps: problem.explanationSteps || []
      };

      setFeedback(res);
      if (isCorrect) {
        vibrate(15);
        celebrate({ count: 40, y: 0.5 });
        clinicalGamificationService.registrarAcertoQuestao(user?.id);
      } else {
        vibrate([30, 40, 30]);
        clinicalGamificationService.registrarErroVermelhoQuestao(user?.id);
        setShowHelp(true);
      }

      markDosageIdSolved(problem.id, user?.id);
      clinicalHistoryService.submitActivity({
        id: currentActivityId,
        moduleType: MODULE_TYPES.DOSAGE,
        title: `Cálculo: ${problem.title}`,
        durationSeconds: getDuration(),
        score: isCorrect ? 100 : 0,
        userId: user?.id,
        formData: { problemId: problem.id, isCorrect }
      });
    } finally {
      setEvaluating(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0B131D] text-[#EAF2F8] pb-28 md:pb-8 flex flex-col font-sans">
      <div className="hidden md:block"><StudentHeader activeTab="calculos" /></div>

      <main className="flex-1 mx-auto max-w-xl w-full px-4 py-4 space-y-6">
        {/* Top Bar do Sistema */}
        <div className="flex items-center justify-between gap-4">
          <Button variant="secondary" size="icon" onClick={() => navigate("/")} className="rounded-full bg-[#131F2E] border-[#1F3045] shrink-0">
            <X className="w-5 h-5" />
          </Button>

          <div className="flex-1 space-y-1">
            <AnimatedProgress value={((selectedIdx + 1) / problemsList.length) * 100} label={`Questão ${selectedIdx + 1} de ${problemsList.length}`} />
          </div>

          <div className="relative">
            <Button variant="secondary" size="icon" onClick={() => setIsOptionsOpen(!isOptionsOpen)} className="rounded-full bg-[#131F2E] border-[#1F3045] shrink-0">
              <MoreVertical className="w-5 h-5" />
            </Button>
            
            <AnimatePresence>
              {isOptionsOpen && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 mt-2 w-56 bg-[#131F2E] border border-[#1F3045] rounded-2xl shadow-2xl z-50 overflow-hidden p-1"
                >
                  <button onClick={handleGenerateProcedural} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1F3045] text-left text-sm font-bold transition-colors">
                    <PlusCircle className="w-4 h-4 text-emerald-400" /> Novo desafio inédito
                  </button>
                  <button onClick={handleRandomProblem} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1F3045] text-left text-sm font-bold transition-colors">
                    <RotateCcw className="w-4 h-4 text-blue-400" /> Questão aleatória
                  </button>
                  <button onClick={handleSaveDraft} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1F3045] text-left text-sm font-bold transition-colors">
                    <History className="w-4 h-4 text-amber-400" /> Salvar rascunho
                  </button>
                  <button onClick={() => { setIsHistoryOpen(true); setIsOptionsOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1F3045] text-left text-sm font-bold transition-colors">
                    <History className="w-4 h-4 text-slate-400" /> Ver histórico
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {activeTab === "desafios" && !showSummary && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] font-black px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">
                {problem.category}
              </span>
              {problem.highAlert && (
                <span className="text-[10px] font-black px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-widest">
                  Alta Vigilância
                </span>
              )}
            </div>

            <h1 className="text-2xl font-black text-white leading-tight">{problem.title}</h1>

            <div className="bg-[#131F2E] rounded-3xl border border-[#1F3045] p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                <FileText className="w-4 h-4" /> Registro de prescrição
              </div>
              <p className="text-sm text-slate-200 leading-relaxed font-medium">{problem.description}</p>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#1F3045]">
                {[
                  { label: "Solução", value: problem.solutionName },
                  { label: "Volume", value: problem.volume },
                  { label: "Via/Tempo", value: `${problem.route} • ${problem.time}` },
                  { label: "Equipo", value: problem.device }
                ].map(item => (
                  <div key={item.label} className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{item.label}</span>
                    <strong className="text-white font-bold text-sm block">{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-black text-white">{problem.question}</h2>
              
              <div className="space-y-4">
                <div className="bg-[#0E1722] rounded-2xl border-2 border-emerald-500/50 p-4 flex items-center justify-between shadow-inner focus-within:border-emerald-500 transition-colors">
                  <input
                    type="text"
                    inputMode="decimal"
                    aria-label={`Resposta em ${problem.answerUnit || 'unidades'}`}
                    value={studentInput}
                    onChange={e => { setStudentInput(e.target.value); setSelectedOption(null); }}
                    onKeyDown={e => e.key === "Enter" && handleEvaluate()}
                    placeholder="0.00"
                    className="bg-transparent border-none text-white text-2xl font-black placeholder:text-slate-700 focus:outline-none w-full"
                  />
                  {/* A unidade vem do problema; sem unidade definida, não mostra nenhuma (nunca "gotas/min" por padrão). */}
                  {problem.answerUnit && (
                    <span className="text-sm font-bold text-slate-500 bg-[#131F2E] px-3 py-1 rounded-lg">
                      {problem.answerUnit}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {problem.options?.map(opt => (
                    <button
                      key={opt.id}
                      disabled={!!feedback}
                      onClick={() => { setSelectedOption(opt.id); setStudentInput(opt.value); }}
                      className={`btn-3d-outline p-3 rounded-2xl border text-left text-xs font-bold transition-all flex items-center gap-3 ${
                        selectedOption === opt.id ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-[#1F3045] text-slate-400"
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
                        selectedOption === opt.id ? "bg-emerald-500 text-[#0B131D] border-emerald-500" : "bg-[#131F2E] border-[#1F3045]"
                      }`}>
                        {opt.letter}
                      </span>
                      <span className="truncate">{opt.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowHelp(!showHelp)} className="text-[10px] font-black uppercase text-slate-500 hover:text-white">
                <HelpCircle className="w-3 h-3 mr-1.5" /> Fórmulas e Ajuda
              </Button>
            </div>

            <AnimatePresence>
              {showHelp && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-4">
                  <div className="p-5 rounded-3xl bg-[#0E1722] border border-[#1F3045] space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {CONVERSIONS.map(c => (
                        <div key={c.value} className="p-3 rounded-2xl bg-[#131F2E] border border-[#1F3045] space-y-1">
                          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter opacity-50">{c.label}</span>
                          <p className="text-xs font-bold text-white">{c.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                      <span className="text-[10px] font-black text-amber-500 uppercase mb-1 block">Fórmula de Referência</span>
                      <p className="text-sm font-mono font-black text-white">{problem.formulaHint}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button size="xl" onClick={handleEvaluate} disabled={evaluating || !studentInput.trim() || !!feedback} className="w-full rounded-3xl font-black tracking-wide py-7 text-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_6px_0_0_#059669] active:translate-y-1 active:shadow-none transition-all">
              {evaluating ? "Validando..." : "Verificar Cálculo"}
            </Button>

            {/* Folha de Resultado estilo Bottom Sheet */}
            <AnimatePresence>
              {feedback && (
                <div className="fixed inset-0 z-50 bg-[#0B131D]/90 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
                  <motion.div 
                    initial={{ y: "100%" }} animate={feedback.isCorrect ? { y: 0 } : { y: 0, x: [0, -10, 10, -10, 10, 0] }}
                    transition={spring.sheet} className="bg-[#131F2E] w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] p-8 space-y-6 shadow-2xl border-t-2 border-emerald-500/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${feedback.isCorrect ? "bg-emerald-500 text-slate-950" : "bg-rose-500 text-white"}`}>
                        {feedback.isCorrect ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-white">{feedback.isCorrect ? "Correto!" : "Quase lá..."}</h3>
                        {feedback.isCorrect && (
                          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-sm">
                            <PlusCircle className="w-4 h-4" /> <AnimatedNumber value={25} /> PE Conquistados
                          </div>
                        )}
                      </div>
                    </div>

                    {feedback.rationale && (
                      <div className={`p-4 rounded-2xl text-xs font-bold ${feedback.isCorrect ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                        Por que esta alternativa? {feedback.rationale}
                      </div>
                    )}

                    <div className="space-y-3">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resolução passo a passo</span>
                      <ol className="space-y-2">
                        {feedback.steps.map((step, idx) => (
                          <motion.li initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} key={idx} className="flex items-start gap-3 text-sm font-medium text-slate-300">
                            <span className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">{idx + 1}</span>
                            {step}
                          </motion.li>
                        ))}
                      </ol>
                      <div className="pt-2 border-t border-slate-800">
                        <p className="text-lg font-black text-white">
                          Resposta: <span className="text-emerald-400">{problem.correctResult}</span>{" "}
                          {problem.answerUnit && <span className="text-slate-500 text-sm">{problem.answerUnit}</span>}
                        </p>
                      </div>
                    </div>

                    <Button size="xl" onClick={handleNext} className={`w-full rounded-2xl font-black ${feedback.isCorrect ? "bg-emerald-500 hover:bg-emerald-400" : "bg-rose-500 hover:bg-rose-400"} text-slate-950`}>
                      Continuar <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {showSummary && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 py-10">
            <div className="relative inline-block">
              <div className="w-40 h-40 rounded-full border-8 border-emerald-500/20 flex items-center justify-center mx-auto">
                <div className="text-5xl font-black text-white">100%</div>
              </div>
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute -top-2 -right-2 bg-emerald-500 text-slate-950 p-2 rounded-full shadow-lg">
                <CheckCircle2 className="w-6 h-6" />
              </motion.div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white">Treino Concluído!</h2>
              <p className="text-slate-400 font-medium">Você dominou todos os problemas deste lote com precisão clínica.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#131F2E] p-4 rounded-3xl border border-[#1F3045]">
                <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">XP Total</span>
                <span className="text-2xl font-black text-white">+500</span>
              </div>
              <div className="bg-[#131F2E] p-4 rounded-3xl border border-[#1F3045]">
                <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Tempo</span>
                <span className="text-2xl font-black text-white">{Math.floor(getDuration() / 60)}m</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={handleGenerateProcedural} size="xl" className="w-full rounded-3xl bg-emerald-500 text-slate-950 font-black">
                Desafios Inéditos (IA)
              </Button>
              <Button variant="ghost" onClick={() => navigate("/")} className="w-full text-slate-500 font-bold">
                Voltar ao Hub
              </Button>
            </div>
          </motion.div>
        )}

        <CaseHistoryModal
          isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)}
          onResumeActivity={handleResumeActivity} defaultModuleFilter="dosage"
          lockModuleFilter={true} title="Histórico de Cálculos"
        />
      </main>

      <StudentFooter />
    </div>
  );
}
