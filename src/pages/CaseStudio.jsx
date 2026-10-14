import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Shuffle,
  Activity,
  HeartPulse,
  ClipboardCheck,
  BrainCircuit,
  Wine,
  Footprints,
  FileText,
  HelpCircle,
  Lightbulb,
  Award,
  RotateCcw,
  Send,
  UserRound,
  ShieldCheck,
  Check,
  ChevronRight,
  Target,
  Layers,
  Mic,
  MicOff,
  Pill,
  AlertTriangle,
  ShieldAlert,
  ListChecks
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import StudentHeader from "@/components/StudentHeader";
import StudentFooter from "@/components/StudentFooter";
import VitalSlider from "@/components/VitalSlider";
import PainLocationPicker from "@/components/PainLocationPicker";
import RiskBadge from "@/components/RiskBadge";
import {
  computeGlobalRisk,
  computeBradenTotal,
  computeCamPositive,
  computeAuditTotal,
  computeSakTotal,
  computeCaloiTotal,
  RISK_META
} from "@/lib/riskEngine";
import { generateRandomInitials, generateRandomName, generateRandomAge, formatToInitials } from "@/lib/sampleNames";
import { generateCaseDiagnosticChallenge } from "@/services/diagnosticChallengeService";

const WIZARD_STEPS = [
  { key: "profile", label: "1. Perfil & Anamnese", icon: UserRound },
  { key: "vitals", label: "2. Sinais Vitais", icon: HeartPulse },
  { key: "braden", label: "3. Escala Braden", icon: ClipboardCheck },
  { key: "cam", label: "4. Escala CAM", icon: BrainCircuit },
  { key: "sak_audit", label: "5. Quedas & Álcool", icon: Footprints },
  { key: "caloi", label: "6. Dor & Localização", icon: Activity },
  { key: "notes", label: "7. Notas & Voz (Ambiental)", icon: FileText },
];

const BRADEN_ITEMS = [
  { key: "braden_perception", label: "Percepção Sensorial", min: 1, max: 4, desc: "1: Totalmente limitada | 4: Nenhuma limitação" },
  { key: "braden_moisture", label: "Umidade da Pele", min: 1, max: 4, desc: "1: Constantemente úmida | 4: Raramente úmida" },
  { key: "braden_activity", label: "Nível de Atividade", min: 1, max: 4, desc: "1: Acamado | 4: Deambula frequentemente" },
  { key: "braden_mobility", label: "Mobilidade no Leito", min: 1, max: 4, desc: "1: Totalmente imóvel | 4: Sem limitações" },
  { key: "braden_nutrition", label: "Padrão Nutricional", min: 1, max: 4, desc: "1: Muito pobre | 4: Excelente ingestão" },
  { key: "braden_friction", label: "Fricção & Cisalhamento", min: 1, max: 3, desc: "1: Problema evidente | 3: Nenhum problema" },
];

const SAK_ITEMS = [
  { key: "sak_disorientation", label: "Desorientação têmporo-espacial", points: 5 },
  { key: "sak_urination", label: "Urgência ou micções frequentes", points: 5 },
  { key: "sak_walking", label: "Limitação física para deambular", points: 4 },
  { key: "sak_caregiver", label: "Ausência de acompanhante", points: 0.5 },
  { key: "sak_postop", label: "Pós-operatório imediato", points: 0.5 },
  { key: "sak_previous_falls", label: "Histórico de queda prévia (12 meses)", points: 1 },
];

const CALOI_PAIN_CHARS = [
  "Pontada", "Queimação", "Irradiada", "Latejante",
  "Contínua", "Em peso", "Cólica", "Pressão", "Aguda"
];

export default function CaseStudio() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [viewMode, setViewMode] = useState("builder"); // "builder" | "challenge"

  // Estado do Perfil e Anamnese (LGPD: Anonimizado estritamente com iniciais)
  const [profile, setProfile] = useState({
    initials: "J.S.F.",
    name: "J.S.F.",
    age: "68",
    gender: "M",
    previous_diseases: "Hipertensão Arterial Sistêmica, Insuficiência Cardíaca congestiva CF II.",
    medical_history: "Internação anterior por descompensação volêmica há 6 meses. Tabagista prévio cessado há 10 anos.",
    current_medications: "Enalapril 20mg 12/12h, Furosemida 40mg/dia, Carvedilol 12.5mg 12/12h.",
    allergies: "Nega alergias medicamentosas ou alimentares.",
    previous_anamnesis: "Admitido na enfermaria com queixa de dispneia progressiva aos médios esforços há 4 dias, associada a tosse seca e edema progressivo de membros inferiores. Refere ortopneia.",
    notes: ""
  });

  // Estado dos Escores e Sinais Vitais
  const [data, setData] = useState({
    pa_sistolica: 150,
    pa_diastolica: 95,
    fc: 98,
    fr: 24,
    tax: 36.7,
    sat: 91,
    braden_perception: 3,
    braden_moisture: 3,
    braden_activity: 2,
    braden_mobility: 2,
    braden_nutrition: 3,
    braden_friction: 2,
    cam_acute: false,
    cam_inattention: false,
    cam_disorganized: false,
    cam_altered_loc: false,
    audit_1: 0,
    sak_disorientation: false,
    sak_urination: true,
    sak_walking: true,
    sak_caregiver: false,
    sak_postop: false,
    sak_previous_falls: false,
    sak_meds: 3,
    caloi_pain_intensity: 4,
    caloi_pain_location: ["Tórax"],
    caloi_pain_characteristics: ["Em peso", "Pressão"],
    notes: "Paciente lúcido, comunicativo, adotando posição de ortopneia no leito."
  });

  // Estados da Bateria de Desafios Clínicos de Alta Complexidade
  const [challenge, setChallenge] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isGeneratingChallenge, setIsGeneratingChallenge] = useState(false);
  const [userAnswers, setUserAnswers] = useState({}); // { [questionIdx]: optionId }
  const [submittedQuestions, setSubmittedQuestions] = useState({}); // { [questionIdx]: boolean }
  const [revealedTips, setRevealedTips] = useState({}); // { [questionIdx]: boolean }

  // Estados de Voz ("Caring out loud")
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const setParam = (key, val) => setData((prev) => ({ ...prev, [key]: val }));
  const setProf = (key, val) => setProfile((prev) => ({ ...prev, [key]: val }));

  // Cálculos Automáticos dos Escores
  const bradenTotal = computeBradenTotal({
    perception: data.braden_perception,
    moisture: data.braden_moisture,
    activity: data.braden_activity,
    mobility: data.braden_mobility,
    nutrition: data.braden_nutrition,
    friction: data.braden_friction,
  });

  const camPositive = computeCamPositive({
    acute: data.cam_acute,
    inattention: data.cam_inattention,
    disorganized: data.cam_disorganized,
    altered_loc: data.cam_altered_loc,
  });

  const sakTotal = computeSakTotal(data);
  const caloiTotal = computeCaloiTotal(data);
  const globalRisk = computeGlobalRisk(data);

  // Gerador de Caso Sintético Aleatório (Anonimizado - LGPD)
  function handleGenerateRandomProfile() {
    const random = generateRandomInitials();
    const randomAge = generateRandomAge();
    const gender = random.gender;
    setProfile({
      initials: random.initials,
      name: random.initials,
      age: String(randomAge),
      gender,
      previous_diseases: "HAS estágio 2, DM tipo 2 em uso de metformina.",
      medical_history: "Relata internação prévia há 1 ano por infecção do trato urinário. Sedentário.",
      current_medications: "Losartana 50mg/dia, Metformina 850mg 12/12h.",
      allergies: "Nega alergias conhecidas.",
      previous_anamnesis: "Paciente trazido por familiares com relato de astenia importante, diminuição da ingesta hídrica e sonolência nas últimas 24 horas.",
      notes: "Apresenta mucosas desidratadas e turgor diminuído."
    });
    setData((prev) => ({
      ...prev,
      pa_sistolica: 110,
      pa_diastolica: 70,
      fc: 104,
      fr: 20,
      tax: 37.8,
      sat: 95,
      braden_perception: 2,
      braden_moisture: 3,
      braden_activity: 1,
      braden_mobility: 2,
      braden_nutrition: 2,
      braden_friction: 1,
      cam_acute: true,
      cam_inattention: true,
      caloi_pain_intensity: 2
    }));
  }

  // Captação de Voz Ambiental ("Caring out loud")
  function toggleSpeechRecognition() {
    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setIsListening(false);
      return;
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Reconhecimento de fala não suportado neste navegador.");
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.lang = "pt-BR";
      rec.continuous = true;
      rec.interimResults = false;
      rec.onresult = (e) => {
        let transcript = "";
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) transcript += e.results[i][0].transcript + " ";
        }
        if (transcript.trim()) {
          setParam("notes", (data.notes ? data.notes + " " : "") + transcript.trim());
        }
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      rec.start();
      recognitionRef.current = rec;
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  }

  // Disparo da Bateria de Desafios Clínicos (Garante anonimização estrita LGPD)
  async function handleLaunchChallenge() {
    setIsGeneratingChallenge(true);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setSubmittedQuestions({});
    setRevealedTips({});

    try {
      const sanitizedInitials = formatToInitials(profile.initials || profile.name);
      const safeProfile = {
        ...profile,
        initials: sanitizedInitials,
        name: sanitizedInitials
      };
      const res = await generateCaseDiagnosticChallenge(safeProfile, data);
      setChallenge(res);
      setViewMode("challenge");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsGeneratingChallenge(false);
    }
  }

  // Lista normalizada de questões (bateria de 4 eixos)
  const questionsList = challenge?.questions || (challenge?.options ? [{
    id: 1,
    category: "Priorização & Julgamento Clínico",
    questionStem: "Qual é a Conduta Prioritária / Diagnóstico de Enfermagem para este caso?",
    attendingTip: challenge.attendingTip,
    options: challenge.options
  }] : []);

  const activeQuestion = questionsList[currentQuestionIndex] || questionsList[0];
  const activeSelectedOption = activeQuestion ? userAnswers[currentQuestionIndex] : null;
  const isActiveSubmitted = activeQuestion ? !!submittedQuestions[currentQuestionIndex] : false;
  const isTipRevealed = activeQuestion ? !!revealedTips[currentQuestionIndex] : false;

  // Pontuação Total da Bateria
  const totalCorrect = questionsList.filter((q, idx) => {
    if (!submittedQuestions[idx]) return false;
    const ans = userAnswers[idx];
    const opt = q.options?.find(o => o.id === ans);
    return opt?.isCorrect;
  }).length;
  const totalScore = totalCorrect * 100;
  const allQuestionsAnswered = questionsList.length > 0 && questionsList.every((_, idx) => submittedQuestions[idx]);

  // Ações do Estudante na Bateria
  function handleSelectOption(optionId) {
    if (isActiveSubmitted) return;
    setUserAnswers((prev) => ({ ...prev, [currentQuestionIndex]: optionId }));
  }

  function handleSubmitCurrentAnswer() {
    if (!activeSelectedOption) return;
    setSubmittedQuestions((prev) => ({ ...prev, [currentQuestionIndex]: true }));
  }

  function handleToggleTip() {
    setRevealedTips((prev) => ({ ...prev, [currentQuestionIndex]: !prev[currentQuestionIndex] }));
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <StudentHeader activeTab="casos" />

      <main className="flex-1 mx-auto max-w-5xl w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Cabeçalho do Estúdio */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-teal-800 uppercase tracking-wider block">
                Estúdio de Montagem & Julgamento Diagnóstico
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                COFEN 736/2024
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {viewMode === "builder" ? "Montar Caso Clínico Próprio" : "Desafio Diagnóstico Interativo"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {viewMode === "builder"
                ? "Monte a anamnese e todos os escores do paciente (Braden, CAM, Vitais, Dor) e gere um desafio lúdico com análise de distratores."
                : "Analise as evidências clínicas do caso montado e teste seu raciocínio diagnóstico sem respostas mastigadas."}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {viewMode === "builder" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateRandomProfile}
                className="rounded-xl border-slate-300 text-slate-700 text-xs flex items-center gap-1.5"
              >
                <Shuffle className="h-3.5 w-3.5" />
                <span>Preencher Paciente Aleatório</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode("builder")}
                className="rounded-xl border-slate-300 text-slate-700 text-xs flex items-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Ajustar Parâmetros do Caso</span>
              </Button>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* MODO 1: MONTADOR DO CASO CLÍNICO (WIZARD DE 7 PASSOS)    */}
        {/* ======================================================== */}
        {viewMode === "builder" && (
          <div className="space-y-6">
            {/* Barra de Progresso do Wizard */}
            <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                {WIZARD_STEPS.map((s, idx) => {
                  const Icon = s.icon;
                  const isActive = idx === currentStep;
                  const isDone = idx < currentStep;
                  return (
                    <button
                      key={s.key}
                      onClick={() => setCurrentStep(idx)}
                      className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-teal-700 text-white shadow-xs"
                          : isDone
                          ? "bg-slate-100 text-teal-900 font-medium"
                          : "text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conteúdo do Passo Ativo */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 animate-in fade-in">
              {/* PASSO 0: PERFIL & ANAMNESE */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h2 className="text-base font-bold text-slate-900">
                      Identificação do Paciente & Anamnese Clínica
                    </h2>
                    <p className="text-xs text-slate-500">
                      Cadastre os dados demográficos e o histórico de admissão para contextualizar o caso.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <span>Iniciais do Paciente (LGPD):</span>
                          <span className="text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3 text-emerald-600" />
                            Anonimizado
                          </span>
                        </label>
                      </div>
                      <Input
                        value={profile.initials || profile.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProf("initials", val);
                          setProf("name", val);
                        }}
                        onBlur={() => {
                          const sanitized = formatToInitials(profile.initials || profile.name);
                          setProf("initials", sanitized);
                          setProf("name", sanitized);
                        }}
                        placeholder="Ex: J.S.F. (apenas iniciais)"
                        className="rounded-xl border-slate-300 text-xs h-10 font-mono tracking-wider uppercase font-semibold"
                      />
                      <p className="text-[11px] text-slate-500">
                        Conforme a LGPD (Lei nº 13.709/2018), informe apenas as iniciais (ex: <strong>J.S.F.</strong>). Nomes completos são convertidos automaticamente.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Idade:</label>
                        <Input
                          type="number"
                          value={profile.age}
                          onChange={(e) => setProf("age", e.target.value)}
                          placeholder="Ex: 68"
                          className="rounded-xl border-slate-300 text-xs h-10"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Sexo:</label>
                        <select
                          value={profile.gender}
                          onChange={(e) => setProf("gender", e.target.value)}
                          className="w-full rounded-xl border border-slate-300 text-xs h-10 px-3 bg-white"
                        >
                          <option value="M">Masculino</option>
                          <option value="F">Feminino</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Histórico & Doenças Prévias:</label>
                    <Input
                      value={profile.previous_diseases}
                      onChange={(e) => setProf("previous_diseases", e.target.value)}
                      placeholder="Ex: Hipertensão Arterial, Insuficiência Cardíaca CF II, DM..."
                      className="rounded-xl border-slate-300 text-xs h-10"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Medicações em Uso:</label>
                      <Input
                        value={profile.current_medications}
                        onChange={(e) => setProf("current_medications", e.target.value)}
                        placeholder="Ex: Enalapril 20mg, Furosemida 40mg..."
                        className="rounded-xl border-slate-300 text-xs h-10"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Alergias Conhecidas:</label>
                      <Input
                        value={profile.allergies}
                        onChange={(e) => setProf("allergies", e.target.value)}
                        placeholder="Ex: Nega alergias conhecidas ou alérgico a penicilina"
                        className="rounded-xl border-slate-300 text-xs h-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Anamnese / Motivo da Internação:</label>
                    <Textarea
                      value={profile.previous_anamnesis}
                      onChange={(e) => setProf("previous_anamnesis", e.target.value)}
                      placeholder="Descreva a queixa principal, evolução dos sintomas e achados da admissão..."
                      className="rounded-xl border-slate-300 text-xs min-h-[90px]"
                    />
                  </div>
                </div>
              )}

              {/* PASSO 1: SINAIS VITAIS */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Monitorização de Sinais Vitais
                      </h2>
                      <p className="text-xs text-slate-500">
                        Ajuste os valores para calibrar o perfil hemodinâmico e ventilatório do paciente.
                      </p>
                    </div>
                    <RiskBadge status={globalRisk} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <VitalSlider
                      label="PA Sistólica"
                      unit="mmHg"
                      value={data.pa_sistolica}
                      min={60}
                      max={220}
                      step={5}
                      onChange={(v) => setParam("pa_sistolica", v)}
                      accentColor="teal"
                    />
                    <VitalSlider
                      label="PA Diastólica"
                      unit="mmHg"
                      value={data.pa_diastolica}
                      min={40}
                      max={140}
                      step={5}
                      onChange={(v) => setParam("pa_diastolica", v)}
                      accentColor="teal"
                    />
                    <VitalSlider
                      label="Frequência Cardíaca"
                      unit="bpm"
                      value={data.fc}
                      min={35}
                      max={200}
                      step={2}
                      onChange={(v) => setParam("fc", v)}
                      accentColor="rose"
                    />
                    <VitalSlider
                      label="Frequência Respiratória"
                      unit="irpm"
                      value={data.fr}
                      min={8}
                      max={45}
                      step={1}
                      onChange={(v) => setParam("fr", v)}
                      accentColor="sky"
                    />
                    <VitalSlider
                      label="Temperatura Axilar"
                      unit="°C"
                      value={data.tax}
                      min={34}
                      max={42}
                      step={0.1}
                      onChange={(v) => setParam("tax", v)}
                      accentColor="amber"
                    />
                    <VitalSlider
                      label="Saturação de O₂"
                      unit="%"
                      value={data.sat}
                      min={70}
                      max={100}
                      step={1}
                      onChange={(v) => setParam("sat", v)}
                      accentColor="teal"
                    />
                  </div>
                </div>
              )}

              {/* PASSO 2: ESCALA DE BRADEN */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Escala de Braden (Risco de Lesão por Pressão)
                      </h2>
                      <p className="text-xs text-slate-500">
                        Classifique os 6 domínios fisiológicos para obter o escore preditivo de LPP.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Escore Braden</span>
                      <span className={`text-xl font-bold ${bradenTotal <= 12 ? "text-rose-600" : bradenTotal <= 14 ? "text-amber-600" : "text-teal-700"}`}>
                        {bradenTotal} pts ({bradenTotal <= 12 ? "Alto Risco" : bradenTotal <= 14 ? "Moderado Risco" : "Baixo Risco"})
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {BRADEN_ITEMS.map((item) => (
                      <div key={item.key} className="space-y-1 p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <VitalSlider
                          label={item.label}
                          value={data[item.key]}
                          min={item.min}
                          max={item.max}
                          step={1}
                          onChange={(v) => setParam(item.key, v)}
                          accentColor="teal"
                        />
                        <span className="text-[10px] text-slate-400 block pt-1">{item.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PASSO 3: ESCALA CAM (DELIRIUM) */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Método de Avaliação de Confusão Mental (CAM)
                      </h2>
                      <p className="text-xs text-slate-500">
                        Rastreio de Delirium no adulto hospitalizado.
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${camPositive ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-slate-100 text-slate-700 border-slate-200"}`}>
                      CAM: {camPositive ? "Positivo (Delirium Provável)" : "Negativo"}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { key: "cam_acute", label: "1. Início agudo e curso flutuante", desc: "Houve mudança súbita no comportamento ou o quadro oscila ao longo do dia?" },
                      { key: "cam_inattention", label: "2. Desatenção", desc: "O paciente tem dificuldade para fixar a atenção ou se distrai facilmente?" },
                      { key: "cam_disorganized", label: "3. Pensamento desorganizado", desc: "A conversa é desconexa, ilógica ou troca assuntos imprevisivelmente?" },
                      { key: "cam_altered_loc", label: "4. Nível de consciência alterado", desc: "Encontra-se hiperalerta, sonolento ou estuporoso em vez de alerta normal?" },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                          data[item.key]
                            ? "bg-slate-100 border-teal-700 text-slate-900"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={data[item.key]}
                          onChange={(e) => setParam(item.key, e.target.checked)}
                          className="mt-0.5 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                        />
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-900 block">{item.label}</span>
                          <span className="text-[11px] text-slate-500">{item.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* PASSO 4: QUEDAS & ÁLCOOL (SAK & AUDIT) */}
              {currentStep === 4 && (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Estratificação de Risco de Quedas (SAK)
                      </h2>
                      <p className="text-xs text-slate-500">
                        Identifique fatores de risco intrínsecos e extrínsecos no ambiente de internação.
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                      SAK: {sakTotal} pts
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SAK_ITEMS.map((item) => (
                      <label
                        key={item.key}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          data[item.key]
                            ? "bg-slate-100 border-teal-700 text-slate-900"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-xs font-semibold">{item.label}</span>
                        <input
                          type="checkbox"
                          checked={data[item.key]}
                          onChange={(e) => setParam(item.key, e.target.checked)}
                          className="rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* PASSO 5: ESCALA CALOI (DOR) */}
              {currentStep === 5 && (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Avaliação Multidimensional da Dor (CALOI)
                      </h2>
                      <p className="text-xs text-slate-500">
                        Caracterize a intensidade, localização anatômica e descritores sensoriais.
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${caloiTotal >= 7 ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-slate-100 text-slate-800 border-slate-200"}`}>
                      Intensidade: {caloiTotal}/10
                    </span>
                  </div>

                  <div className="space-y-3">
                    <VitalSlider
                      label="Intensidade da Dor (Escala Numérica)"
                      unit="/10"
                      value={data.caloi_pain_intensity}
                      min={0}
                      max={10}
                      step={1}
                      onChange={(v) => setParam("caloi_pain_intensity", v)}
                      accentColor="rose"
                    />

                    <div className="pt-2">
                      <label className="text-xs font-bold text-slate-700 block mb-2">
                        Características e Descritores da Dor:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {CALOI_PAIN_CHARS.map((char) => {
                          const isSel = (data.caloi_pain_characteristics || []).includes(char);
                          return (
                            <button
                              key={char}
                              type="button"
                              onClick={() => {
                                const prev = data.caloi_pain_characteristics || [];
                                setParam(
                                  "caloi_pain_characteristics",
                                  isSel ? prev.filter((c) => c !== char) : [...prev, char]
                                );
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                                isSel
                                  ? "bg-slate-800 text-white border-slate-800"
                                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              {char}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PASSO 6: NOTAS & VOZ AMBIENTAL */}
              {currentStep === 6 && (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Notas da Avaliação & Captação Ambiental de Voz
                      </h2>
                      <p className="text-xs text-slate-500">
                        Simulação do conceito "Caring out loud" (verbalização natural de achados à beira-leito).
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={toggleSpeechRecognition}
                      className={`rounded-xl text-xs gap-1.5 ${
                        isListening
                          ? "bg-rose-50 text-rose-600 border-rose-300 animate-pulse"
                          : "text-slate-700 border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                      <span>{isListening ? "Parar Captação" : "Ditar por Voz"}</span>
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Relato de Enfermagem & Observações da Avaliação:
                    </label>
                    <Textarea
                      value={data.notes}
                      onChange={(e) => setParam("notes", e.target.value)}
                      placeholder="Fale ou digite as observações clínicas observadas durante o atendimento..."
                      className="rounded-xl text-xs border-slate-300 min-h-[120px]"
                    />
                  </div>
                </div>
              )}

              {/* Navegação Entre Passos & Disparo do Desafio Lúdico */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                  disabled={currentStep === 0}
                  className="rounded-xl border-slate-300 text-slate-700 text-xs font-semibold"
                >
                  <ArrowLeft className="h-4 w-4 mr-1.5" /> Passo Anterior
                </Button>

                {currentStep < WIZARD_STEPS.length - 1 ? (
                  <Button
                    onClick={() => setCurrentStep((s) => Math.min(WIZARD_STEPS.length - 1, s + 1))}
                    className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs px-5 font-semibold"
                  >
                    Próximo Passo <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleLaunchChallenge}
                    disabled={isGeneratingChallenge}
                    className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs px-6 h-11 font-semibold flex items-center gap-2 shadow-xs"
                  >
                    <Target className="h-4 w-4 text-teal-400" />
                    <span>{isGeneratingChallenge ? "Gerando Desafio..." : "Gerar Desafio Diagnóstico (IA)"}</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODO 2: BATERIA DE DESAFIOS CLÍNICOS (ESTILO AMBOSS/SIMX) */}
        {/* ======================================================== */}
        {viewMode === "challenge" && challenge && (
          <div className="space-y-6 animate-in fade-in">
            {/* Vinheta Resumo do Caso & Placar Geral */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg">
                      Bateria de Julgamento Clínico Avançado
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Vivência Real • COFEN 736/2024
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                    {challenge.questionTitle}
                  </h2>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                    <Award className={`h-4 w-4 ${totalCorrect > 0 ? "text-amber-500" : "text-slate-400"}`} />
                    <span className="text-xs font-bold text-slate-800">
                      Pontuação: {totalScore} / {questionsList.length * 100} pts
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode("builder")}
                    className="rounded-xl border-slate-300 text-slate-700 text-xs flex items-center gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Ajustar Escores</span>
                  </Button>
                </div>
              </div>

              {/* Prontuário Sintético Baseado no que o Aluno Montou */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
                <span className="font-bold text-slate-900 block">Dados Clínicos do Paciente (Anonimizado - LGPD):</span>
                <p className="leading-relaxed">
                  {challenge.clinicalVignette}
                </p>
                <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                    PA: {data.pa_sistolica}/{data.pa_diastolica} mmHg
                  </span>
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                    FC: {data.fc} bpm
                  </span>
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                    FR: {data.fr} irpm
                  </span>
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                    SatO2: {data.sat}%
                  </span>
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                    Braden: {bradenTotal} pts
                  </span>
                  {camPositive && (
                    <span className="bg-rose-50 text-rose-800 px-2 py-0.5 rounded border border-rose-200">
                      CAM: Delirium Positivo
                    </span>
                  )}
                  {caloiTotal > 0 && (
                    <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                      Dor: {caloiTotal}/10
                    </span>
                  )}
                </div>
              </div>

              {/* SELETOR DE ABAS DA BATERIA (4 EIXOS DE VIVÊNCIA CLÍNICA) */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Eixos de Julgamento Clínico ({questionsList.length} Desafios):
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Respondidas: {Object.keys(submittedQuestions).length} de {questionsList.length}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {questionsList.map((q, idx) => {
                    const isCurrent = idx === currentQuestionIndex;
                    const isSub = !!submittedQuestions[idx];
                    const chosen = q.options?.find(o => o.id === userAnswers[idx]);
                    const isRight = chosen?.isCorrect;

                    let tabStyle = "bg-white border-slate-200 text-slate-600 hover:border-slate-300";
                    if (isCurrent) {
                      tabStyle = "bg-teal-50/80 border-teal-600 text-teal-900 ring-1 ring-teal-600 font-bold shadow-xs";
                    } else if (isSub && isRight) {
                      tabStyle = "bg-emerald-50 border-emerald-300 text-emerald-900";
                    } else if (isSub && !isRight) {
                      tabStyle = "bg-rose-50 border-rose-300 text-rose-900";
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-start justify-between gap-1.5 ${tabStyle}`}
                      >
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase block opacity-75">
                            Q{idx + 1}
                          </span>
                          <span className="text-xs font-semibold truncate block">
                            {q.category}
                          </span>
                        </div>
                        {isSub && (
                          isRight ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                          )
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* CARD DA QUESTÃO ATIVA */}
            {activeQuestion && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <div>
                    <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                      Questão {currentQuestionIndex + 1} de {questionsList.length} • {activeQuestion.category}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-2 leading-relaxed">
                      {activeQuestion.questionStem}
                    </h3>
                  </div>

                  <div className="shrink-0">
                    <Button
                      size="sm"
                      variant={isTipRevealed ? "default" : "outline"}
                      onClick={handleToggleTip}
                      className={`rounded-xl text-xs h-8 flex items-center gap-1.5 ${
                        isTipRevealed
                          ? "bg-amber-500 hover:bg-amber-600 text-white"
                          : "border-amber-300 text-amber-800 hover:bg-amber-50"
                      }`}
                    >
                      <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                      <span>{isTipRevealed ? "Ocultar Dica Socrática" : "Dica de Raciocínio (AMBOSS Tip)"}</span>
                    </Button>
                  </div>
                </div>

                {/* Dica Socrática (Attending Physician Tip) */}
                {isTipRevealed && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1 animate-in fade-in">
                    <span className="font-bold flex items-center gap-1 text-amber-900">
                      <Lightbulb className="h-4 w-4 text-amber-600" /> Dica de Vivência à Beira-Leito:
                    </span>
                    <p className="leading-relaxed">{activeQuestion.attendingTip}</p>
                  </div>
                )}

                {/* Alternativas de Múltipla Escolha com Distratores Sutis */}
                <div className="space-y-2.5 pt-1">
                  {activeQuestion.options?.map((option) => {
                    const isSelected = activeSelectedOption === option.id;
                    const showFeedback = isActiveSubmitted;
                    let style = "bg-white border-slate-200 hover:border-slate-300";

                    if (isSelected && !showFeedback) {
                      style = "bg-slate-100 border-teal-700 ring-1 ring-teal-700 shadow-xs";
                    }

                    if (showFeedback) {
                      if (option.isCorrect) {
                        style = "bg-emerald-50/80 border-emerald-500 text-emerald-950 font-medium";
                      } else if (isSelected && !option.isCorrect) {
                        style = "bg-rose-50/80 border-rose-400 text-rose-950";
                      } else {
                        style = "bg-slate-50 border-slate-200 text-slate-500 opacity-70";
                      }
                    }

                    return (
                      <div
                        key={option.id}
                        onClick={() => handleSelectOption(option.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${style}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold shrink-0 ${
                            showFeedback && option.isCorrect
                              ? "bg-emerald-600 text-white"
                              : showFeedback && isSelected && !option.isCorrect
                              ? "bg-rose-600 text-white"
                              : isSelected
                              ? "bg-teal-700 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}>
                            {option.id}
                          </span>
                          <div className="space-y-1 flex-1">
                            <p className="text-xs font-bold leading-snug">
                              {option.title}
                            </p>

                            {/* DEBRIEFING CLÍNICO PÓS-SUBMISSÃO (ESTILO AMBOSS + OSMOSIS) */}
                            {showFeedback && (
                              <div className="mt-2 pt-2 border-t border-slate-200/60 text-xs space-y-1 animate-in fade-in">
                                {option.isCorrect ? (
                                  <div className="text-emerald-900">
                                    <span className="font-bold flex items-center gap-1">
                                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                      Por que esta conduta é a correta?
                                    </span>
                                    <p className="mt-0.5 leading-relaxed">{option.whyCorrect}</p>
                                  </div>
                                ) : (
                                  <div className="text-slate-700">
                                    <span className="font-bold flex items-center gap-1 text-slate-900">
                                      <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                                      Análise do Distrator: Por que não é a prioridade / Armadilha da prática:
                                    </span>
                                    <p className="mt-0.5 leading-relaxed">{option.whyDistractor}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* AÇÕES DA QUESTÃO ATIVA & NAVEGAÇÃO NA BATERIA */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  {!isActiveSubmitted ? (
                    <Button
                      onClick={handleSubmitCurrentAnswer}
                      disabled={!activeSelectedOption}
                      className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs px-6 h-10 font-semibold flex items-center gap-2"
                    >
                      <Check className="h-4 w-4" /> Confirmar Julgamento Clínico
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">
                        {activeQuestion.options?.find(o => o.id === activeSelectedOption)?.isCorrect ? (
                          <span className="text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" /> Resposta Correta (+100 XP)
                          </span>
                        ) : (
                          <span className="text-rose-600 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" /> Resposta Incorreta (Revise os distratores)
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 ml-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentQuestionIndex === 0}
                      className="rounded-xl border-slate-300 text-slate-700 text-xs font-semibold"
                    >
                      <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Questão Anterior
                    </Button>

                    {currentQuestionIndex < questionsList.length - 1 ? (
                      <Button
                        size="sm"
                        onClick={() => setCurrentQuestionIndex((prev) => Math.min(questionsList.length - 1, prev + 1))}
                        className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold"
                      >
                        Próxima Questão <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    ) : (
                      allQuestionsAnswered && (
                        <Button
                          size="sm"
                          onClick={handleLaunchChallenge}
                          className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Nova Bateria de Casos</span>
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Plano de Cuidados e Prescrição de Enfermagem (Visível Pós-Submissão) */}
            {challenge.recommendedInterventions?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <ClipboardCheck className="h-4 w-4 text-teal-700" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Prescrição de Cuidados de Enfermagem (Resolução COFEN nº 736/2024)
                  </h3>
                </div>
                <ul className="space-y-2 text-xs text-slate-700">
                  {challenge.recommendedInterventions.map((care, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{care}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>

      <StudentFooter />
    </div>
  );
}
