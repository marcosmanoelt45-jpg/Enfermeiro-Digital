import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calculator,
  Droplets,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { guideMedicationCalculation } from "@/services/socraticTutorService";
import StudentHeader from "@/components/StudentHeader";

const DOSAGE_PROBLEMS = [
  {
    id: "prob_1",
    category: "Macrogotas / Horas",
    title: "Infusão de Soro Fisiológico em 8h",
    description: "Prescrição médica: Soro Fisiológico 0,9% 1000 mL para ser administrado por via intravenosa no período de 8 horas, utilizando equipo comum (macrogotas).",
    question: "Quantas gotas por minuto (gts/min) deverão ser administradas?",
    formulaHint: "Gotas/min = Volume (mL) ÷ (Tempo (h) × 3)",
    correctResult: "42",
    explanationSteps: [
      "Identifique as variáveis: Volume = 1000 mL | Tempo = 8 horas",
      "Equipo de macrogotas com tempo em horas utiliza a fórmula: Gotas/min = V / (T × 3)",
      "Cálculo: 1000 ÷ (8 × 3) = 1000 ÷ 24 = 41,66...",
      "Regra de arredondamento em gotas: como a fração é ≥ 0,5, arredondamos para 42 gotas/minuto."
    ],
    safetyNote: "Nunca deixe correr gotas fracionadas. Ajuste o regulador de fluxo para 42 gts/min e cronometre 1 minuto completo."
  },
  {
    id: "prob_2",
    category: "Microgotas / Horas",
    title: "Infusão em Paciente Pediátrico / Cardiopata",
    description: "Prescrição médica: Soro Glicosado 5% 500 mL para infundir em 12 horas através de equipo de microgotas.",
    question: "Qual deve ser a taxa de infusão em microgotas por minuto (mgts/min)?",
    formulaHint: "Microgotas/min = Volume (mL) ÷ Tempo (h)",
    correctResult: "42",
    explanationSteps: [
      "Identifique as variáveis: Volume = 500 mL | Tempo = 12 horas",
      "Para microgotas com tempo em horas: Microgotas/min = Volume ÷ Tempo",
      "Cálculo: 500 ÷ 12 = 41,66...",
      "Arredondamento: 42 microgotas/minuto (ou 42 mL/h em bomba de infusão contínua)."
    ],
    safetyNote: "Lembre-se: 1 gota equivale a 3 microgotas. Portanto, Microgotas/min é numericamente igual a mL/hora."
  },
  {
    id: "prob_3",
    category: "Macrogotas / Minutos",
    title: "Antibiótico em Infusão Rápida (30 minutos)",
    description: "Prescrição médica: Metronidazol 500mg em bolsa de 100 mL para correr em 30 minutos via equipo de macrogotas.",
    question: "Quantas gotas por minuto devem ser infundidas?",
    formulaHint: "Gotas/min = (Volume × 20) ÷ Tempo em minutos",
    correctResult: "67",
    explanationSteps: [
      "Quando o tempo é prescrito em minutos, a constante muda!",
      "Fórmula: Gotas/min = (Volume em mL × 20) ÷ Tempo em minutos",
      "Cálculo: (100 × 20) ÷ 30 = 2000 ÷ 30 = 66,66...",
      "Arredondamento: 67 gotas/minuto."
    ],
    safetyNote: "Atenção crítica: Não confunda a fórmula de tempo em horas com tempo em minutos para não hiperinfundir o paciente."
  },
  {
    id: "prob_4",
    category: "Diluição de Antibióticos",
    title: "Penicilina Cristalina (Frasco de 5.000.000 UI)",
    description: "Prescrição médica: Penicilina Cristalina 2.000.000 UI EV. Disponível na enfermaria: Frasco-ampola com pó liofilizado de 5.000.000 UI e ampolas de água destilada (AD) de 10 mL.",
    question: "Sabendo que o pó ocupa 2 mL de soluto, se adicionarmos 8 mL de AD (totalizando 10 mL), quantos mL devemos aspirar para administrar a dose prescrita?",
    formulaHint: "Volume de soluto (2 mL) + solvente (8 mL) = 10 mL total. Regra de três: 5.000.000 UI está para 10 mL, assim como 2.000.000 UI está para X.",
    correctResult: "4",
    explanationSteps: [
      "No frasco de 5 milhões de UI, o soluto (pó) equivale a 2 mL.",
      "Ao injetar 8 mL de AD, o volume total da solução reconstituída é 10 mL.",
      "Montagem da proporção: 5.000.000 UI --- 10 mL | 2.000.000 UI --- X mL",
      "X = (2.000.000 × 10) ÷ 5.000.000 = 20 ÷ 5 = 4 mL."
    ],
    safetyNote: "Atenção: A penicilina de 10.000.000 UI ocupa 4 mL de soluto. Nunca esqueça de descontar o volume do pó para evitar superdosagem."
  }
];

export default function MedicationDosageLab() {
  const navigate = useNavigate();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [studentInput, setStudentInput] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [showFormula, setShowFormula] = useState(false);

  const problem = DOSAGE_PROBLEMS[selectedIdx];

  async function handleEvaluate() {
    if (!studentInput.trim()) return;
    setEvaluating(true);
    try {
      const res = await guideMedicationCalculation(problem, studentInput);
      setFeedback(res);
    } finally {
      setEvaluating(false);
    }
  }

  function handleReset() {
    setStudentInput("");
    setFeedback(null);
    setShowFormula(false);
  }

  function handleSelectProblem(idx) {
    setSelectedIdx(idx);
    handleReset();
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <StudentHeader activeTab="calculos" />

      <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-6 space-y-6">
        {/* Banner de Apresentação */}
        <div className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-200 border border-teal-400/30">
              <Calculator className="h-3.5 w-3.5" /> Laboratório Farmacológico Didático
            </span>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Cálculo de Medicamentos & Gotejamento
            </h1>
            <p className="text-xs md:text-sm text-teal-100/80 max-w-2xl">
              Treine os cálculos essenciais da prática assistencial com tutoria socrática passo a passo, prevenindo erros de dosagem e fortalecendo a segurança do paciente.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-xl border border-white/10 text-xs">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            <span>9 Certos da Medicação</span>
          </div>
        </div>

        {/* Grade de Seleção de Problemas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {DOSAGE_PROBLEMS.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => handleSelectProblem(idx)}
              className={`p-3 text-left rounded-xl border transition-all ${
                selectedIdx === idx
                  ? "bg-white border-teal-600 shadow-sm ring-2 ring-teal-600/20"
                  : "bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
                {p.category}
              </span>
              <p className="text-xs font-semibold text-slate-800 mt-1 line-clamp-1">
                {p.title}
              </p>
            </button>
          ))}
        </div>

        {/* Card Principal do Problema */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                  Desafio #{selectedIdx + 1}: {problem.category}
                </span>
                <button
                  onClick={() => setShowFormula(!showFormula)}
                  className="text-xs font-medium text-slate-500 hover:text-teal-700 flex items-center gap-1 transition"
                >
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  {showFormula ? "Ocultar fórmula" : "Ver fórmula orientadora"}
                </button>
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900">{problem.title}</h2>
                <div className="mt-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 leading-relaxed font-serif">
                  "{problem.description}"
                </div>
              </div>

              {showFormula && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2 animate-in fade-in">
                  <Lightbulb className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-bold">Fórmula Conceitual:</span>
                    <p className="mt-0.5 font-mono">{problem.formulaHint}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-700 block">
                  {problem.question}
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={studentInput}
                    onChange={(e) => setStudentInput(e.target.value)}
                    placeholder="Ex: 42 (insira apenas o número ou sua justificativa)"
                    className="rounded-xl border-slate-300 text-sm"
                    onKeyDown={(e) => e.key === "Enter" && handleEvaluate()}
                  />
                  <Button
                    onClick={handleEvaluate}
                    disabled={evaluating || !studentInput.trim()}
                    className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white shrink-0 px-5"
                  >
                    {evaluating ? (
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 animate-spin" /> Avaliando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" /> Checar Cálculo
                      </span>
                    )}
                  </Button>
                </div>
              </div>

              {/* Feedback da Tutora Florence */}
              {feedback && (
                <div
                  className={`p-4 rounded-xl border space-y-3 transition-all ${
                    feedback.isCorrect
                      ? "bg-emerald-50/70 border-emerald-300 text-emerald-950"
                      : "bg-amber-50/80 border-amber-300 text-amber-950"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {feedback.isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="font-bold text-sm">
                        {feedback.isCorrect ? "Cálculo Correto! Parabéns!" : "Atenção ao Raciocínio das Etapas"}
                      </h4>
                      <p className="text-xs mt-1 leading-relaxed">
                        {feedback.feedback}
                      </p>
                    </div>
                  </div>

                  {feedback.stepClarification && (
                    <div className="text-xs bg-white/70 p-3 rounded-lg border border-slate-200/50 space-y-1">
                      <span className="font-bold text-slate-800 block">Passo a Passo Guiado:</span>
                      <p className="text-slate-600">{feedback.stepClarification}</p>
                    </div>
                  )}

                  {feedback.safetyAlert && (
                    <div className="text-xs bg-white/90 p-2.5 rounded-lg border border-slate-200 text-slate-700 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0" />
                      <span>{feedback.safetyAlert}</span>
                    </div>
                  )}

                  {/* Resolução completa disponível após tentativa */}
                  <div className="pt-2 border-t border-slate-200/50">
                    <details className="text-xs text-slate-600 cursor-pointer">
                      <summary className="font-semibold text-teal-800 hover:underline">
                        Ver demonstração matemática completa
                      </summary>
                      <ul className="mt-2 space-y-1 pl-4 list-disc text-slate-700 bg-white/60 p-3 rounded-lg">
                        {problem.explanationSteps.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ul>
                    </details>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Painel Lateral: Guia Rápido de Fórmulas e Simulação */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-teal-700 font-bold text-sm">
                <BookOpen className="h-4 w-4" />
                <h3>Guia Rápido de Fórmulas de Gotejamento</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-800 block">1. Macrogotas em Horas:</span>
                  <code className="text-teal-700 font-mono block mt-1">Gotas/min = V ÷ (T × 3)</code>
                  <span className="text-[11px] text-slate-500 block mt-0.5">V em mL, T em horas</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-800 block">2. Microgotas em Horas:</span>
                  <code className="text-teal-700 font-mono block mt-1">Microgotas/min = V ÷ T</code>
                  <span className="text-[11px] text-slate-500 block mt-0.5">V em mL, T em horas (1 gota = 3 microgotas)</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-800 block">3. Macrogotas em Minutos:</span>
                  <code className="text-teal-700 font-mono block mt-1">Gotas/min = (V × 20) ÷ T(min)</code>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-800 block">4. Microgotas em Minutos:</span>
                  <code className="text-teal-700 font-mono block mt-1">Microgotas/min = (V × 60) ÷ T(min)</code>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-950 space-y-2">
              <span className="font-bold flex items-center gap-1.5 text-emerald-800">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Boas Práticas de Segurança (COFEN)
              </span>
              <p className="leading-relaxed text-emerald-900">
                Conforme a Resolução COFEN nº 736/2024, a administração de medicamentos é etapa privativa da equipe de enfermagem. Realize sempre a dupla checagem para eletrólitos concentrados, anticoagulantes e insulina.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
