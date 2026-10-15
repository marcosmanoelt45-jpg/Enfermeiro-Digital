import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  FileText,
  ShieldCheck,
  Calculator,
  Droplet,
  Beaker,
  BookOpen,
  Sparkles
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

  // Estado dos Desafios Clínicos
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [studentInput, setStudentInput] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [showFormula, setShowFormula] = useState(false);

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
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <StudentHeader activeTab="calculos" />

      <main className="flex-1 mx-auto max-w-5xl w-full px-4 sm:px-6 py-6 space-y-6">
        {/* Barra Superior de Navegação Segura */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 text-xs font-semibold flex items-center gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar ao Painel</span>
          </Button>

          {/* Seletor de Modo Principal */}
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("desafios")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "desafios"
                  ? "bg-white text-teal-800 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
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
                  ? "bg-white text-teal-800 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Calculadora Livre & Gotejamento
            </button>
          </div>
        </div>

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
              {activeTab === "desafios"
                ? "Resolva desafios de dosagem e infusão com verificação passo a passo pela tutora socrática Florence."
                : "Calcule volumes, taxas de infusão em macrogotas/microgotas e doses por peso em tempo real."}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 self-start sm:self-auto shrink-0">
            <ShieldCheck className="h-4 w-4 text-teal-700" />
            <span>9 Certos da Medicação</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ABA 1: DESAFIOS CLÍNICOS & TUTORIA SOCRÁTICA                              */}
        {/* ========================================================================= */}
        {activeTab === "desafios" && (
          <div className="space-y-6 animate-in fade-in">
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

            {/* Card Principal: Ordem Médica Hospitalar */}
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

                  {/* Detalhes Estruturados da Prescrição */}
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

                <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-teal-900 font-bold text-xs">
                    <Sparkles className="h-4 w-4 text-teal-700" />
                    <span>Calculadora Prática Disponível</span>
                  </div>
                  <p className="text-xs text-teal-800 leading-relaxed">
                    Precisa calcular gotejamento livre ou doses ponderais para conferir na prática?
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setActiveTab("calculadora");
                      runFreeCalculate();
                    }}
                    className="w-full rounded-xl bg-white border-teal-300 text-teal-800 hover:bg-teal-100/50 text-xs font-semibold mt-1"
                  >
                    Abrir Calculadora Livre
                  </Button>
                </div>
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
                        ? "bg-white border-teal-700 shadow-xs ring-1 ring-teal-700"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${active ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{t.label}</span>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{t.hint}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Formulário de Cálculo */}
              <div className="lg:col-span-2 space-y-5">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        {calcType === "dose" && "Cálculo de Dose e Volume a Administrar"}
                        {calcType === "drip" && "Cálculo de Gotejamento e Infusão Venosa"}
                        {calcType === "weight_based" && "Cálculo de Dose Pediátrica por Peso (mg/kg)"}
                      </h2>
                      <p className="text-xs text-slate-500">
                        Insira os parâmetros prescritos para obter a taxa e o volume com as etapas da fórmula.
                      </p>
                    </div>
                  </div>

                  {/* Campos do Modo 1: Dose -> Volume */}
                  {calcType === "dose" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Dose Prescrita (mg ou UI)</label>
                        <Input
                          type="number"
                          placeholder="Ex: 500"
                          value={calcForm.prescribed_dose}
                          onChange={(e) => updateCalc("prescribed_dose", e.target.value)}
                          className="rounded-xl border-slate-300 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Concentração Disponível (mg/mL ou UI/mL)</label>
                        <Input
                          type="number"
                          placeholder="Ex: 250"
                          value={calcForm.concentration}
                          onChange={(e) => updateCalc("concentration", e.target.value)}
                          className="rounded-xl border-slate-300 text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {/* Campos do Modo 2: Gotejamento */}
                  {calcType === "drip" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Volume Total da Solução (mL)</label>
                          <Input
                            type="number"
                            placeholder="Ex: 1000"
                            value={calcForm.volume_ml}
                            onChange={(e) => updateCalc("volume_ml", e.target.value)}
                            className="rounded-xl border-slate-300 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Tempo de Infusão</label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="Ex: 8"
                              value={calcForm.time_value}
                              onChange={(e) => updateCalc("time_value", e.target.value)}
                              className="rounded-xl border-slate-300 text-sm flex-1"
                            />
                            <select
                              value={calcForm.time_unit}
                              onChange={(e) => updateCalc("time_unit", e.target.value)}
                              className="rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700"
                            >
                              <option value="h">Horas</option>
                              <option value="min">Minutos</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <label className="text-xs font-bold text-slate-700">Tipo de Equipo:</label>
                        <button
                          type="button"
                          onClick={() => updateCalc("micro", false)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            !calcForm.micro ? "bg-teal-700 text-white" : "bg-white text-slate-600 border border-slate-200"
                          }`}
                        >
                          Macrogotas (1 mL = 20 gotas)
                        </button>
                        <button
                          type="button"
                          onClick={() => updateCalc("micro", true)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            calcForm.micro ? "bg-teal-700 text-white" : "bg-white text-slate-600 border border-slate-200"
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
                        <label className="text-xs font-bold text-slate-700">Peso do Paciente (kg)</label>
                        <Input
                          type="number"
                          placeholder="Ex: 18"
                          value={calcForm.weight}
                          onChange={(e) => updateCalc("weight", e.target.value)}
                          className="rounded-xl border-slate-300 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Dose Prescrita (mg/kg)</label>
                        <Input
                          type="number"
                          placeholder="Ex: 15"
                          value={calcForm.dose_per_kg}
                          onChange={(e) => updateCalc("dose_per_kg", e.target.value)}
                          className="rounded-xl border-slate-300 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Concentração (mg/mL)</label>
                        <Input
                          type="number"
                          placeholder="Ex: 50"
                          value={calcForm.concentration}
                          onChange={(e) => updateCalc("concentration", e.target.value)}
                          className="rounded-xl border-slate-300 text-sm"
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
                    <div className="p-4 rounded-xl bg-slate-50 border border-teal-600 space-y-2.5 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-teal-800 uppercase tracking-wide">
                          {calcResult.label}
                        </span>
                        <span className="text-lg font-bold text-teal-900 bg-white px-3 py-1 rounded-lg border border-teal-200">
                          {calcResult.value}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                        {calcResult.formula}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {calcResult.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Coluna Lateral: Tabela de Referência e Conversões (Resgatada do Backup) */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-teal-700" />
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                        Tabela de Conversões
                      </h3>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">Enfermagem</span>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5 rounded-xl bg-slate-50 p-3">
                    {CONVERSIONS.map((c, i) => (
                      <p key={i} className="text-xs text-slate-700 font-medium">
                        • {c}
                      </p>
                    ))}
                  </div>

                  <div className="space-y-2 rounded-xl bg-teal-50/70 p-3.5 border border-teal-100">
                    <p className="text-xs font-bold text-teal-900">Fórmulas de Gotejamento Venoso</p>
                    <div className="space-y-1.5 text-[11px] text-slate-700 font-mono">
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
      </main>

      <StudentFooter />
    </div>
  );
}
