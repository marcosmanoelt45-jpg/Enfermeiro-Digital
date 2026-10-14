import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calculator,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  BookOpen,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { guideMedicationCalculation } from "@/services/socraticTutorService";
import StudentHeader from "@/components/StudentHeader";
import StudentFooter from "@/components/StudentFooter";

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

      <main className="flex-1 mx-auto max-w-5xl w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Cabeçalho Clínico Limpo */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-teal-800 uppercase tracking-wider block">
              Prática Farmacológica & Segurança do Paciente
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Cálculo de Medicamentos & Gotejamento
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Resolva desafios de dosagem e infusão com verificação de etapas e prevenção de erros.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 self-start sm:self-auto">
            <ShieldCheck className="h-4 w-4 text-teal-700" />
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
                  ? "bg-white border-teal-700 shadow-xs ring-1 ring-teal-700"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                {p.category}
              </span>
              <p className="text-xs font-semibold text-slate-900 mt-0.5 line-clamp-1">
                {p.title}
              </p>
            </button>
          ))}
        </div>

        {/* Card Principal: Ordem Médica Hospitalar (Padrão Fariz Rahmadani - Clean Prescription) */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    Ordem Médica #{selectedIdx + 1}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {problem.category}
                  </span>
                </div>
                <button
                  onClick={() => setShowFormula(!showFormula)}
                  className="text-xs font-medium text-slate-500 hover:text-teal-800 flex items-center gap-1 transition"
                >
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  {showFormula ? "Ocultar fórmula" : "Ver fórmula orientadora"}
                </button>
              </div>

              {/* Título & Detalhes Estruturados da Prescrição (Fix do Print 5) */}
              <div className="space-y-3">
                <h2 className="text-base font-bold text-slate-900">
                  {problem.title}
                </h2>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span>Registro de Prescrição</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                    {problem.description}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200/60 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Solução</span>
                      <span className="font-semibold text-slate-800">{problem.solutionName || "Solução"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Volume</span>
                      <span className="font-semibold text-slate-800">{problem.volume || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Via / Tempo</span>
                      <span className="font-semibold text-slate-800">{problem.route} ({problem.time})</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Equipo</span>
                      <span className="font-semibold text-slate-800">{problem.device}</span>
                    </div>
                  </div>
                </div>
              </div>

              {showFormula && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                  <Lightbulb className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-bold">Fórmula de Referência:</span>
                    <p className="mt-0.5 font-mono text-slate-800 font-semibold">{problem.formulaHint}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-slate-800 block">
                  {problem.question}
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={studentInput}
                    onChange={(e) => setStudentInput(e.target.value)}
                    placeholder="Ex: 42 (insira o valor numérico ou raciocínio)"
                    className="rounded-xl border-slate-300 text-sm h-10"
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

              {/* Feedback de Avaliação */}
              {feedback && (
                <div
                  className={`p-4 rounded-xl border space-y-3 transition-all ${
                    feedback.isCorrect
                      ? "bg-slate-50 border-teal-600 text-slate-900"
                      : "bg-amber-50/70 border-amber-300 text-amber-950"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {feedback.isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-teal-700 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                    )}
                    <h3 className="text-sm font-bold">
                      {feedback.isCorrect ? "Cálculo Correto e Aprovado!" : "Atenção na Resolução:"}
                    </h3>
                  </div>

                  <p className="text-xs leading-relaxed">{feedback.feedback}</p>

                  {feedback.questionToThink && (
                    <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-800">
                      <span className="font-bold block text-slate-900 mb-0.5">Ponto de Atenção:</span>
                      <p>{feedback.questionToThink}</p>
                    </div>
                  )}

                  {feedback.isCorrect && (
                    <div className="pt-2 flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => handleSelectProblem((selectedIdx + 1) % DOSAGE_PROBLEMS.length)}
                        className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold"
                      >
                        Próximo Desafio <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Coluna Lateral: Guia de Conferência & Dupla Checagem */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide block">
                Etapas de Resolução & Conferência
              </span>
              <ul className="space-y-2.5 text-xs text-slate-600">
                {problem.explanationSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>

      <StudentFooter />
    </div>
  );
}
