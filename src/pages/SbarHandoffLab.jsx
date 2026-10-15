import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Download,
  Stethoscope,
  HeartPulse,
  Activity,
  UserCheck,
  Clock,
  ArrowRight,
  MessageSquareQuote,
  Flame,
  Award,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import StudentHeader from "@/components/StudentHeader";
import StudentFooter from "@/components/StudentFooter";
import { useAuth } from "@/lib/AuthContext";
import { evaluateSbarHandoff } from "@/services/sbarTutorService";
import { exportClinicalCaseToPdf } from "@/services/pdfExportService";

const PRESET_HANDOFF_SCENARIOS = [
  {
    id: "pos_op",
    title: "1º DPO de Colectomia Parcial",
    sector: "Clínica Cirúrgica • Leito 12-A",
    bed: "Leito 12-A",
    age: 58,
    name: "M.S.L.",
    diagnosis: "Pós-operatório de colectomia por diverticulite aguda",
    vitals: { pa_sistolica: 115, pa_diastolica: 72, fc: 84, fr: 17, sat: 98, tax: 36.6 },
    clinicalSummary: "Paciente em recuperação pós-anestésica tardia, lúcido, queixando-se de dor moderada em incisão cirúrgica. Dreno tubular ativo em flanco direito.",
    suggestedSbar: {
      situation: "Paciente M.S.L., 58 anos, Leito 12-A da Clínica Cirúrgica, 1º DPO de colectomia parcial.",
      background: "Hipertenso controlado com Losartana. Nega alergias medicamentosas e cirurgias abdominais anteriores.",
      assessment: "PA 115/72 mmHg, FC 84 bpm, afebril, SatO2 98% em ar ambiente. Abdome flácido, doloroso à palpação próximo à ferida operatória (EVA 4/10). Dreno de Portovac com débito serossanguinolento de 120 mL em 12h. Curativo limpo e seco.",
      recommendation: "Manter vigilância do débito do dreno; administrar analgesia prescrita às 20h; checar resultado do hematócrito de controle colhido à tarde."
    }
  },
  {
    id: "icc",
    title: "ICC Descompensada & Congestão",
    sector: "UTI Cardiológica • Leito 04",
    bed: "Leito 04 - UTI",
    age: 67,
    name: "J.A.P.",
    diagnosis: "Insuficiência Cardíaca Congestiva perfil B (úmido e quente)",
    vitals: { pa_sistolica: 148, pa_diastolica: 94, fc: 96, fr: 23, sat: 92, tax: 36.4 },
    clinicalSummary: "Admitido por piora progressiva da dispneia em repouso e ortopneia. Estertores crepitantes bibasais e turgência jugular.",
    suggestedSbar: {
      situation: "Paciente J.A.P., 67 anos, Leito 04 da UTI, admitido há 6 horas por descompensação de ICC com congestão pulmonar.",
      background: "Histórico de ICC com FE 32%, HAS e DM2. Relata alergia severa a contraste iodado.",
      assessment: "PA 148/94 mmHg, FC 96 bpm, FR 23 irpm, SatO2 92% em ar ambiente que subiu para 96% sob cateter nasal a 3 L/min. Estertores finos em terços inferiores bilaterais, edema de MMII +++/4+.",
      recommendation: "Administrar Furosemida 40 mg IV prescrita para as 20h; balanço hídrico rigoroso; atentar para diurese nas próximas 2 horas e registrar peso em jejum amanhã."
    }
  },
  {
    id: "delirium",
    title: "Idoso com Delirium & Risco de Queda",
    sector: "Enfermaria Geriátrica • Leito 21-B",
    bed: "Leito 21-B",
    age: 82,
    name: "A.B.C.",
    diagnosis: "Pneumonia Comunitária associada a Delirium Hipoativo/Misto",
    vitals: { pa_sistolica: 132, pa_diastolica: 78, fc: 76, fr: 19, sat: 95, tax: 37.1 },
    clinicalSummary: "Paciente idoso com oscilação do nível de consciência, desorientação temporal e tentativa recorrente de retirada de punção venosa periférica.",
    suggestedSbar: {
      situation: "Paciente A.B.C., 82 anos, Leito 21-B, 3º dia de internação por PAC em uso de Ceftriaxona.",
      background: "Portador de Alzheimer leve e osteoartrose. Histórico de queda no domicílio há 2 meses com contusão em quadril.",
      assessment: "Sinais vitais estáveis (PA 132/78 mmHg, FC 76 bpm, SatO2 95%). Apresenta flutuação do sensório (CAM positivo), agitou-se no início da tarde tentando levantar-se sem auxílio.",
      recommendation: "Manter grades do leito sempre elevadas bilateralmente; orientar e apoiar o acompanhante familiar; manter acesso periférico protegido e evitar contenção física mecânica desnecessária."
    }
  }
];

export default function SbarHandoffLab() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Caso recebido via navegação ou caso selecionado
  const passedCase = location.state?.caseData;

  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  const [currentCase, setCurrentCase] = useState(() => {
    return passedCase || PRESET_HANDOFF_SCENARIOS[0];
  });

  // Campos do SBAR
  const [sbarData, setSbarData] = useState({
    situation: "",
    background: "",
    assessment: "",
    recommendation: ""
  });

  // Estado de áudio por Web Speech API
  const [isListening, setIsListening] = useState(false);
  const [activeListeningField, setActiveListeningField] = useState(null);
  const speechRecognitionRef = useRef(null);

  // Estados de avaliação tutora
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [tutorEvaluation, setTutorEvaluation] = useState(null);
  const [studentReflections, setStudentReflections] = useState({});
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (passedCase) {
      setCurrentCase(passedCase);
    }
  }, [passedCase]);

  // Inicializa suporte a voz (Web Speech Recognition)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "pt-BR";

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        if (activeListeningField) {
          setSbarData((prev) => ({
            ...prev,
            [activeListeningField]: (prev[activeListeningField] ? prev[activeListeningField] + " " : "") + transcript
          }));
        }
      };

      recognition.onerror = (e) => {
        console.warn("[SpeechRecognition] Erro:", e.error);
        setIsListening(false);
        setActiveListeningField(null);
      };

      recognition.onend = () => {
        setIsListening(false);
        setActiveListeningField(null);
      };

      speechRecognitionRef.current = recognition;
    }

    return () => {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {}
      }
    };
  }, [activeListeningField]);

  function handleSelectScenario(idx) {
    setActiveScenarioIdx(idx);
    setCurrentCase(PRESET_HANDOFF_SCENARIOS[idx]);
    setSbarData({ situation: "", background: "", assessment: "", recommendation: "" });
    setTutorEvaluation(null);
    setStudentReflections({});
  }

  function handleFillSuggested() {
    if (currentCase?.suggestedSbar) {
      setSbarData(currentCase.suggestedSbar);
      setToastMessage("Exemplo estruturado de passagem de plantão inserido nos 4 campos!");
      setTimeout(() => setToastMessage(""), 3500);
    }
  }

  function toggleVoiceInput(fieldName) {
    if (!speechRecognitionRef.current) {
      alert("Seu navegador não possui suporte nativo à gravação direta de fala (Web Speech API). Utilize digitação ou use o Google Chrome.");
      return;
    }

    if (isListening && activeListeningField === fieldName) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
      setActiveListeningField(null);
    } else {
      try {
        setActiveListeningField(fieldName);
        setIsListening(true);
        speechRecognitionRef.current.start();
      } catch (err) {
        console.warn("[SpeechRecognition] Já estava ativo:", err);
      }
    }
  }

  async function handleEvaluateSbar() {
    const isAnyFilled = sbarData.situation || sbarData.background || sbarData.assessment || sbarData.recommendation;
    if (!isAnyFilled) {
      alert("Por favor, preencha ao menos um dos pilares do SBAR antes de enviar para auditoria.");
      return;
    }

    setIsEvaluating(true);
    try {
      const evaluation = await evaluateSbarHandoff({
        caseData: currentCase,
        sbar: sbarData
      });
      setTutorEvaluation(evaluation);
      window.scrollTo({ top: 600, behavior: "smooth" });
    } catch (err) {
      console.error("[SbarHandoffLab] Erro ao avaliar SBAR:", err);
    } finally {
      setIsEvaluating(false);
    }
  }

  function handleDownloadPdf() {
    exportClinicalCaseToPdf({
      caseData: currentCase,
      sbarData: sbarData,
      tutorEvaluation: tutorEvaluation,
      studentInfo: {
        name: user?.name || "Estudante de Enfermagem",
        institution: "Faculdade de Enfermagem (Simulação)",
        id: "MAT-2026-ENF"
      }
    });

    setToastMessage("Prontuário com Parecer Pedagógico em PDF gerado com sucesso!");
    setTimeout(() => setToastMessage(""), 3500);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <StudentHeader activeTab="sbar" />

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Cabeçalho Executivo do Laboratório */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-teal-800 uppercase tracking-wider block">
                Comunicação Interprofissional • Meta 2 OMS
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                Resolução COFEN nº 736/2024
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Laboratório de Passagem de Plantão (Metodologia SBAR)
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Treine a síntese clínica estruturada na troca de turno hospitalar. A preceptora virtual <strong>Florence</strong> audita a segurança do paciente, detecta omissões de dados críticos e conduz o debriefing socrático.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFillSuggested}
              className="rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500 mr-1.5" /> Exemplo Estruturado
            </Button>
            {tutorEvaluation && (
              <Button
                size="sm"
                onClick={handleDownloadPdf}
                className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Download className="h-3.5 w-3.5" /> Baixar Prontuário em PDF
              </Button>
            )}
          </div>
        </div>

        {/* Notificação Toast */}
        {toastMessage && (
          <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs flex items-center gap-2 animate-in fade-in shadow-sm">
            <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Seletor de Cenários de Pacientes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Selecione o Leito / Caso para Transmissão do Plantão:
            </span>
            <span className="text-xs text-slate-500">
              {PRESET_HANDOFF_SCENARIOS.length} Cenários Clínicos
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PRESET_HANDOFF_SCENARIOS.map((scenario, idx) => (
              <div
                key={scenario.id}
                onClick={() => handleSelectScenario(idx)}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  activeScenarioIdx === idx
                    ? "bg-white border-teal-700 ring-2 ring-teal-700/20 shadow-xs"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {scenario.sector}
                  </span>
                  <span className="text-xs font-bold text-teal-700">
                    {scenario.name} ({scenario.age}a)
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 line-clamp-1">
                  {scenario.title}
                </h3>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                  {scenario.clinicalSummary}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Quadro Clínico Resumido do Paciente */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
            <div>
              <span className="text-[10px] font-bold text-teal-800 uppercase block">Prontuário no Leito</span>
              <h2 className="text-sm font-bold text-slate-900">
                {currentCase.name} • {currentCase.bed || "Leito 12"} • {currentCase.diagnosis || currentCase.title}
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span className="flex items-center gap-1 font-semibold">
                <HeartPulse className="h-3.5 w-3.5 text-rose-500" />
                PA: {currentCase.vitals?.pa_sistolica}/{currentCase.vitals?.pa_diastolica} mmHg
              </span>
              <span className="flex items-center gap-1 font-semibold">
                <Activity className="h-3.5 w-3.5 text-emerald-500" />
                SatO2: {currentCase.vitals?.sat}%
              </span>
              <span className="flex items-center gap-1 font-semibold">
                <Clock className="h-3.5 w-3.5 text-sky-500" />
                FC: {currentCase.vitals?.fc} bpm
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {currentCase.clinicalSummary || currentCase.description || "Paciente sob vigilância contínua da enfermagem. Avalie as pendências e sintetize as prioridades para a equipe entrante."}
          </p>
        </div>

        {/* OS 4 PILARES DO SBAR COM GRAVAÇÃO POR VOZ & DIGITAÇÃO */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Estruturação da Passagem de Plantão (SBAR)
            </h2>
            <span className="text-xs text-slate-500">
              Clique no microfone para ditar ou digite nos campos abaixo
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* 1. S - SITUAÇÃO */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-teal-800 font-bold text-xs">
                    S
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Situação (Situation)</h3>
                    <p className="text-[10px] text-slate-500">Identificação, leito e motivo imediato da admissão</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={isListening && activeListeningField === "situation" ? "destructive" : "ghost"}
                  onClick={() => toggleVoiceInput("situation")}
                  className="rounded-lg h-8 px-2.5 text-xs flex items-center gap-1"
                  title="Ditar Situação por voz"
                >
                  {isListening && activeListeningField === "situation" ? (
                    <>
                      <MicOff className="h-3.5 w-3.5 animate-pulse" /> Gravando...
                    </>
                  ) : (
                    <>
                      <Mic className="h-3.5 w-3.5 text-slate-500" /> Ditar
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                rows={3}
                value={sbarData.situation}
                onChange={(e) => setSbarData({ ...sbarData, situation: e.target.value })}
                placeholder="Ex.: Paciente M.S.L., 58 anos, no Leito 12-A, no 1º DPO de colectomia parcial por diverticulite..."
                className="text-xs rounded-xl border-slate-200 resize-none focus:border-teal-700"
              />
            </div>

            {/* 2. B - BACKGROUND / HISTÓRICO */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-800 font-bold text-xs">
                    B
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Breve Histórico (Background)</h3>
                    <p className="text-[10px] text-slate-500">Comorbidades, alergias, medicações e cirurgias prévias</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={isListening && activeListeningField === "background" ? "destructive" : "ghost"}
                  onClick={() => toggleVoiceInput("background")}
                  className="rounded-lg h-8 px-2.5 text-xs flex items-center gap-1"
                  title="Ditar Histórico por voz"
                >
                  {isListening && activeListeningField === "background" ? (
                    <>
                      <MicOff className="h-3.5 w-3.5 animate-pulse" /> Gravando...
                    </>
                  ) : (
                    <>
                      <Mic className="h-3.5 w-3.5 text-slate-500" /> Ditar
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                rows={3}
                value={sbarData.background}
                onChange={(e) => setSbarData({ ...sbarData, background: e.target.value })}
                placeholder="Ex.: Hipertenso em uso crônico de Losartana. Nega alergias conhecidas. Sem cirurgias prévias..."
                className="text-xs rounded-xl border-slate-200 resize-none focus:border-teal-700"
              />
            </div>

            {/* 3. A - AVALIAÇÃO ATUAL */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-800 font-bold text-xs">
                    A
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Avaliação Atual (Assessment)</h3>
                    <p className="text-[10px] text-slate-500">Sinais vitais numéricos, dor, drenos, infusões e riscos</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={isListening && activeListeningField === "assessment" ? "destructive" : "ghost"}
                  onClick={() => toggleVoiceInput("assessment")}
                  className="rounded-lg h-8 px-2.5 text-xs flex items-center gap-1"
                  title="Ditar Avaliação por voz"
                >
                  {isListening && activeListeningField === "assessment" ? (
                    <>
                      <MicOff className="h-3.5 w-3.5 animate-pulse" /> Gravando...
                    </>
                  ) : (
                    <>
                      <Mic className="h-3.5 w-3.5 text-slate-500" /> Ditar
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                rows={3}
                value={sbarData.assessment}
                onChange={(e) => setSbarData({ ...sbarData, assessment: e.target.value })}
                placeholder="Ex.: PA 115/72 mmHg, FC 84 bpm, SatO2 98%. Dor grau 4 em incisão. Dreno tubular com 120 mL serossanguinolento..."
                className="text-xs rounded-xl border-slate-200 resize-none focus:border-teal-700"
              />
            </div>

            {/* 4. R - RECOMENDAÇÃO */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
                    R
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Recomendação (Recommendation)</h3>
                    <p className="text-[10px] text-slate-500">Condutas prioritárias, exames pendentes e cuidados noturnos</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={isListening && activeListeningField === "recommendation" ? "destructive" : "ghost"}
                  onClick={() => toggleVoiceInput("recommendation")}
                  className="rounded-lg h-8 px-2.5 text-xs flex items-center gap-1"
                  title="Ditar Recomendação por voz"
                >
                  {isListening && activeListeningField === "recommendation" ? (
                    <>
                      <MicOff className="h-3.5 w-3.5 animate-pulse" /> Gravando...
                    </>
                  ) : (
                    <>
                      <Mic className="h-3.5 w-3.5 text-slate-500" /> Ditar
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                rows={3}
                value={sbarData.recommendation}
                onChange={(e) => setSbarData({ ...sbarData, recommendation: e.target.value })}
                placeholder="Ex.: Vigiar débito do dreno; administrar dipirona prescrita às 20h; checar resultado do hematócrito..."
                className="text-xs rounded-xl border-slate-200 resize-none focus:border-teal-700"
              />
            </div>
          </div>

          {/* Botão de Envio para a Tutora Florence */}
          <div className="flex justify-end pt-2">
            <Button
              size="lg"
              disabled={isEvaluating}
              onClick={handleEvaluateSbar}
              className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm px-6 h-11 flex items-center gap-2 shadow-xs transition-all"
            >
              {isEvaluating ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin text-teal-200" />
                  <span>Florence está auditando a passagem de plantão...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Transmitir Plantão para Auditoria de Florence</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* PAINEL DE DEBRIEFING SOCRÁTICO DA TUTORA FLORENCE */}
        {tutorEvaluation && (
          <div className="bg-white rounded-2xl border border-teal-200 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in">
            {/* Topo do Feedback com Score e Grade */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-teal-700" />
                  <span className="text-xs font-bold text-teal-800 uppercase tracking-wider block">
                    Parecer de Preceptoria Clínica • Florence AI
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  Avaliação da Comunicação & Segurança do Paciente
                </h3>
                <p className="text-xs text-slate-500">
                  {tutorEvaluation.summaryFeedback}
                </p>
              </div>

              <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-2xl p-3 shrink-0">
                <div className="text-right">
                  <span className="text-[10px] font-bold text-teal-800 uppercase block">Índice de Segurança</span>
                  <span className="text-2xl font-extrabold text-teal-900 block leading-none">
                    {tutorEvaluation.safetyScore}/100
                  </span>
                </div>
                <div className="h-10 w-px bg-teal-200" />
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-700 text-white">
                  {tutorEvaluation.grade}
                </span>
              </div>
            </div>

            {/* Desdobramento dos 4 Pilares SBAR */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Desempenho por Eixo da Metodologia SBAR:
              </h4>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { key: "situation", label: "S - Situação", bg: "bg-teal-50 border-teal-200" },
                  { key: "background", label: "B - Histórico", bg: "bg-sky-50 border-sky-200" },
                  { key: "assessment", label: "A - Avaliação", bg: "bg-indigo-50 border-indigo-200" },
                  { key: "recommendation", label: "R - Recomendação", bg: "bg-emerald-50 border-emerald-200" }
                ].map((col) => {
                  const pillar = tutorEvaluation.pillarScores?.[col.key];
                  return (
                    <div key={col.key} className={`p-3.5 rounded-xl border ${col.bg} space-y-1`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{col.label}</span>
                        <span className="text-xs font-bold text-slate-700">{pillar?.score || 80}%</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-tight">
                        {pillar?.feedback || "Pilar adequadamente abordado."}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Omissões Críticas e Pontos Fortes */}
            <div className="grid sm:grid-cols-2 gap-4">
              {tutorEvaluation.criticalOmissions?.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    <span>Omissões Críticas que Podem Comprometer o Paciente:</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-rose-700">
                    {tutorEvaluation.criticalOmissions.map((om, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="font-bold">•</span>
                        <span>{om}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {tutorEvaluation.strengths?.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Pontos Fortes Demonstrados na Comunicação:</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-emerald-700">
                    {tutorEvaluation.strengths.map((st, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="font-bold">•</span>
                        <span>{st}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* DEBRIEFING SOCRÁTICO: PERGUNTAS REFLEXIVAS DA PRECEPTORA */}
            {tutorEvaluation.socraticQuestions?.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquareQuote className="h-5 w-5 text-teal-700" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Debriefing Socrático de Florence (Pensamento Crítico Reflexivo)
                  </h4>
                </div>
                <p className="text-xs text-slate-500">
                  Exercite sua argumentação clínica respondendo às questões de segurança formuladas pela tutora:
                </p>

                <div className="space-y-3 pt-1">
                  {tutorEvaluation.socraticQuestions.map((q, idx) => (
                    <div key={idx} className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-2">
                      <p className="text-xs font-semibold text-slate-900">
                        {idx + 1}. {q}
                      </p>
                      <Input
                        value={studentReflections[idx] || ""}
                        onChange={(e) => setStudentReflections({ ...studentReflections, [idx]: e.target.value })}
                        placeholder="Digite sua reflexão clínica como acadêmico..."
                        className="text-xs rounded-lg border-slate-200 focus:border-teal-700"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mensagem Final de Florence & Ação de Download do PDF */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-600 italic">
                "{tutorEvaluation.florenceComment}"
              </div>

              <Button
                onClick={handleDownloadPdf}
                className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs px-5 h-10 shadow-xs flex items-center gap-2 shrink-0"
              >
                <Download className="h-4 w-4" />
                <span>Exportar Laudo Oficial em PDF</span>
              </Button>
            </div>
          </div>
        )}
      </main>

      <StudentFooter />
    </div>
  );
}
