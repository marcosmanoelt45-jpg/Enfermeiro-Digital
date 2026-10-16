import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Shuffle,
  Activity,
  HeartPulse,
  ClipboardCheck,
  BrainCircuit,
  Footprints,
  FileText,
  Lightbulb,
  Award,
  RotateCcw,
  UserRound,
  ShieldCheck,
  Check,
  Target,
  Mic,
  MicOff,
  ListChecks,
  AudioLines,
  Download,
  ArrowRightLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import StudentHeader from "@/components/StudentHeader";
import StudentFooter from "@/components/StudentFooter";
import VitalSlider from "@/components/VitalSlider";
import RiskBadge from "@/components/RiskBadge";
import useAudioRecorder from "@/hooks/useAudioRecorder";
import { exportClinicalCaseToPdf } from "@/services/pdfExportService";
import ClinicalGuideTabs from "@/components/audio/ClinicalGuideTabs";
import RecorderPanel from "@/components/audio/RecorderPanel";
import { parseVitalsFromTranscript } from "@/lib/vitalsParser";
import { audioTranscriptionService } from "@/services/audioTranscriptionService";
import { getAssemblyAiKey, transcribeAudio } from "@/lib/assemblyai";
import {
  computeGlobalRisk,
  computeBradenTotal,
  computeCamPositive,
  computeSakTotal,
  computeCaloiTotal
} from "@/lib/riskEngine";
import { generateRandomInitials, generateRandomAge, formatToInitials } from "@/lib/sampleNames";
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
  const [viewMode, setViewMode] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get("mode") === "audio") return "audio";
      if (p.get("mode") === "manual") return "builder";
    } catch {}
    return "choose"; // "choose" | "builder" | "audio" | "challenge"
  });

  // Estados do Modo de Áudio
  const audioRecorder = useAudioRecorder();
  const [audioTranscript, setAudioTranscript] = useState("");
  const [isAudioTranscribing, setIsAudioTranscribing] = useState(false);
  const [audioStage, setAudioStage] = useState("");
  const [audioError, setAudioError] = useState("");
  const [isLiveDictatingAudio, setIsLiveDictatingAudio] = useState(false);
  const liveAudioRecRef = useRef(null);
  const isLiveDictatingRef = useRef(false);
  const liveAudioInterimRef = useRef("");

  // Manipulador de ditado ao vivo para o modo de áudio
  function toggleLiveAudioDictation() {
    setAudioError("");
    if (isLiveDictatingAudio) {
      isLiveDictatingRef.current = false;
      if (liveAudioRecRef.current) {
        try {
          liveAudioRecRef.current.onend = null;
          liveAudioRecRef.current.stop();
        } catch {}
      }
      // Flush de áudio intermediário retido no buffer
      const pending = (liveAudioInterimRef.current || "").trim();
      if (pending) {
        setAudioTranscript((prev) => (prev ? prev.trim() + " " : "") + pending);
      }
      liveAudioInterimRef.current = "";
      setIsLiveDictatingAudio(false);
      return;
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      setAudioError("Reconhecimento de fala direto não suportado por este navegador. Use o Google Chrome ou Microsoft Edge.");
      return;
    }

    try {
      isLiveDictatingRef.current = true;
      liveAudioInterimRef.current = "";

      const rec = new SpeechRec();
      rec.lang = "pt-BR";
      rec.continuous = true;
      rec.interimResults = true;

      rec.onresult = (e) => {
        let finalTrans = "";
        let interimTrans = "";
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            finalTrans += e.results[i][0].transcript + " ";
          } else {
            interimTrans += e.results[i][0].transcript;
          }
        }
        liveAudioInterimRef.current = interimTrans;
        if (finalTrans.trim()) {
          setAudioTranscript((prev) => (prev ? prev.trim() + " " : "") + finalTrans.trim());
          liveAudioInterimRef.current = "";
        }
      };

      rec.onerror = (ev) => {
        console.warn("[Áudio Estúdio] Aviso:", ev);
        if (ev.error === "no-speech") {
          return; // Pausa normal ao respirar/pensar
        }
        if (ev.error === "not-allowed") {
          setAudioError("Permissão de microfone negada no navegador.");
          isLiveDictatingRef.current = false;
          setIsLiveDictatingAudio(false);
        }
      };

      rec.onend = () => {
        if (isLiveDictatingRef.current && liveAudioRecRef.current) {
          try {
            rec.start();
          } catch (err) {
            console.debug("[Áudio Estúdio] Auto-restart ignorado:", err);
          }
        }
      };

      rec.start();
      liveAudioRecRef.current = rec;
      setIsLiveDictatingAudio(true);
    } catch {
      setAudioError("Não foi possível acionar o dispositivo de áudio.");
      isLiveDictatingRef.current = false;
      setIsLiveDictatingAudio(false);
    }
  }

  // Transcrição com IA do áudio gravado
  async function handleAudioTranscribe() {
    setAudioError("");
    if (!audioRecorder.blob) {
      setAudioError("Nenhum áudio gravado. Grave o relato antes de transcrever.");
      return;
    }

    setIsAudioTranscribing(true);
    try {
      const hasAssemblyKey = Boolean(getAssemblyAiKey());
      const hasGeminiKey = Boolean(audioTranscriptionService.getGeminiKey());
      let text = "";
      if (hasAssemblyKey) {
        text = await transcribeAudio(audioRecorder.blob, {
          apiKey: getAssemblyAiKey(),
          onStage: setAudioStage,
        });
      } else if (hasGeminiKey) {
        const res = await audioTranscriptionService.transcribeWithGemini(
          audioRecorder.blob,
          (msg) => setAudioStage(msg)
        );
        text = res?.text || "";
      } else {
        setAudioError("Chave de IA não configurada em Minha Conta. Use o botão 'Ditar por Voz ao Vivo' abaixo para captação instantânea sem chaves, ou digite o relato.");
        setIsAudioTranscribing(false);
        return;
      }

      if (!text) {
        setAudioError("A transcrição não retornou texto audível. Use o ditado ao vivo.");
      } else {
        setAudioTranscript((prev) => (prev ? prev.trim() + " " : "") + text.trim());
      }
    } catch (err) {
      setAudioError(err?.message || "Erro na transcrição. Use o ditado ao vivo.");
    } finally {
      setIsAudioTranscribing(false);
      setAudioStage("");
    }
  }

  // Aplicação dos dados extraídos do áudio no caso clínico
  function applyAudioDataToCase(launchDirectly = false) {
    const text = audioTranscript.trim();
    if (!text) {
      setAudioError("Nenhum relato fornecido ainda. Grave ou dite o caso antes de prosseguir.");
      return;
    }
    const extracted = parseVitalsFromTranscript(text);
    setData((prev) => ({
      ...prev,
      ...extracted,
      notes: (prev.notes ? prev.notes + "\n" : "") + `[Relato Clínico por Voz]: ${text}`
    }));
    setProfile((prev) => ({
      ...prev,
      previous_anamnesis: prev.previous_anamnesis || text
    }));

    if (launchDirectly) {
      handleLaunchChallenge();
    } else {
      setViewMode("builder");
    }
  }

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
  const [speechError, setSpeechError] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const speechInterimRef = useRef("");

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
    setSpeechError("");
    if (isListening) {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch {}
      }
      const pending = (speechInterimRef.current || "").trim();
      if (pending) {
        setParam("notes", (data.notes ? data.notes.trim() + " " : "") + pending);
      }
      speechInterimRef.current = "";
      setIsListening(false);
      setInterimTranscript("");
      return;
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      setSpeechError("Reconhecimento de fala não suportado neste navegador. Utilize o Google Chrome ou Microsoft Edge.");
      return;
    }

    try {
      isListeningRef.current = true;
      speechInterimRef.current = "";

      const rec = new SpeechRec();
      rec.lang = "pt-BR";
      rec.continuous = true;
      rec.interimResults = true;

      rec.onresult = (e) => {
        let finalTrans = "";
        let interimTrans = "";
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            finalTrans += e.results[i][0].transcript + " ";
          } else {
            interimTrans += e.results[i][0].transcript;
          }
        }
        speechInterimRef.current = interimTrans;
        setInterimTranscript(interimTrans);
        if (finalTrans.trim()) {
          setParam("notes", (data.notes ? data.notes.trim() + " " : "") + finalTrans.trim());
          speechInterimRef.current = "";
          setInterimTranscript("");
        }
      };

      rec.onerror = (ev) => {
        console.warn("[Voz] Aviso:", ev);
        if (ev.error === "no-speech") {
          return; // Silêncio normal ao raciocinar
        }
        if (ev.error === "not-allowed") {
          setSpeechError("Acesso ao microfone negado. Habilite a permissão do microfone nas configurações do seu navegador.");
          isListeningRef.current = false;
          setIsListening(false);
          setInterimTranscript("");
        } else {
          setSpeechError(`Aviso do microfone: ${ev.error || "falha temporária"}.`);
        }
      };

      rec.onend = () => {
        if (isListeningRef.current && recognitionRef.current) {
          try {
            rec.start();
          } catch (err) {
            console.debug("[Voz] Auto-restart silencioso:", err);
          }
        }
      };

      rec.start();
      recognitionRef.current = rec;
      setIsListening(true);
    } catch {
      setSpeechError("Não foi possível acionar o dispositivo de áudio. Verifique suas conexões.");
      isListeningRef.current = false;
      setIsListening(false);
      setInterimTranscript("");
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-800 dark:text-slate-100 transition-colors">
      <StudentHeader activeTab="montar" />

      <main className="flex-1 mx-auto max-w-5xl w-full px-4 sm:px-6 py-6 space-y-6">
        {/* Barra Superior Minimalista e Funcional (Sem poluição de banners gigantes) */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              aria-label="Voltar ao Painel"
              title="Voltar ao Painel"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 uppercase tracking-wider">
                  COFEN 736/2024
                </span>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 hidden sm:inline">
                  • Julgamento Clínico
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight mt-0.5">
                {viewMode === "choose" && "Novo Caso Clínico"}
                {viewMode === "builder" && "Montar Caso Clínico"}
                {viewMode === "audio" && "Avaliação por Áudio & Fala"}
                {viewMode === "challenge" && "Desafio Diagnóstico Interativo"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {viewMode === "choose" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs flex items-center gap-1.5"
              >
                <span>Voltar ao Painel</span>
              </Button>
            )}

            {viewMode === "builder" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode("audio")}
                  className="rounded-xl border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-xs flex items-center gap-1.5"
                >
                  <AudioLines className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">Modo</span> Áudio
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateRandomProfile}
                  className="rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Shuffle className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Gerar</span> Aleatório
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("choose")}
                  className="rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs"
                >
                  Trocar Modo
                </Button>
              </>
            )}

            {viewMode === "audio" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode("builder")}
                  className="rounded-xl border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-xs flex items-center gap-1.5"
                >
                  <ClipboardCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Modo Manual</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("choose")}
                  className="rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs"
                >
                  Trocar Modo
                </Button>
              </>
            )}

            {viewMode === "challenge" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode("builder")}
                className="rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Ajustar Parâmetros</span>
              </Button>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* MODO 0: ESCOLHA INICIAL LIMPA (MANUAL OU ÁUDIO)          */}
        {/* ======================================================== */}
        {viewMode === "choose" && (
          <div className="space-y-6 animate-in fade-in max-w-3xl mx-auto pt-4">
            <div className="text-center space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Como deseja iniciar a avaliação do paciente?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Escolha o método mais adequado ao seu momento de aprendizagem. Você poderá alternar a qualquer momento.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Opção 1: Avaliação Manual Guiada */}
              <div
                onClick={() => setViewMode("builder")}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-white dark:bg-slate-900 p-6 sm:p-7 transition-all shadow-xs hover:shadow-lg cursor-pointer flex flex-col justify-between space-y-5 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                      <ClipboardCheck className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      Passo a Passo
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Avaliação Manual Guiada
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Preencha sinais vitais, histórico e escalas validadas (Braden, CAM, SAK e Dor) com sliders de precisão clínica.
                  </p>
                </div>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewMode("builder");
                  }}
                  className="w-full rounded-2xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold text-xs py-2.5 h-auto flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>Iniciar Avaliação Manual</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Opção 2: Avaliação por Voz */}
              <div
                onClick={() => setViewMode("audio")}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-white dark:bg-slate-900 p-6 sm:p-7 transition-all shadow-xs hover:shadow-lg cursor-pointer flex flex-col justify-between space-y-5 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-400 group-hover:scale-105 transition-transform">
                      <AudioLines className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Voz & IA • Beira-Leito
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Avaliação por Áudio & Fala
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Dite ou grave o relato clínico à beira-leito. A IA transcreve e extrai os sinais vitais e escores automaticamente.
                  </p>
                </div>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewMode("audio");
                  }}
                  className="w-full rounded-2xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold text-xs py-2.5 h-auto flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Mic className="h-4 w-4" />
                  <span>Iniciar por Áudio</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODO ÁUDIO: CAPTAÇÃO CLÍNICA POR VOZ & IA À BEIRA-LEITO  */}
        {/* ======================================================== */}
        {viewMode === "audio" && (
          <div className="space-y-6 animate-in fade-in">
            {audioError && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center justify-between">
                <span>{audioError}</span>
                <button
                  type="button"
                  onClick={() => setAudioError("")}
                  className="font-bold text-rose-600 hover:text-rose-900 ml-2 text-xs"
                >
                  Fechar
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Coluna Esquerda: Microfone, Ditado e Transcrição */}
              <div className="md:col-span-5 space-y-4">
                <RecorderPanel
                  recording={audioRecorder.recording}
                  seconds={audioRecorder.seconds}
                  audioUrl={audioRecorder.url}
                  busy={isAudioTranscribing}
                  onStart={audioRecorder.start}
                  onStop={audioRecorder.stop}
                  onTranscribe={handleAudioTranscribe}
                  onManual={() => setViewMode("builder")}
                  onReset={() => {
                    audioRecorder.reset();
                    setAudioTranscript("");
                    setAudioError("");
                  }}
                />

                {/* Botão de Ditado ao Vivo Direto no Navegador */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Ditado ao Vivo (Nativo)</span>
                    <span className="text-[10px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded font-semibold border border-emerald-200 dark:border-emerald-800">
                      Sem Chave de API
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Fale diretamente no microfone do navegador sem precisar de chave externa. O texto é captado e os sinais vitais são extraídos em tempo real.
                  </p>
                  <Button
                    type="button"
                    onClick={toggleLiveAudioDictation}
                    className={`w-full rounded-xl text-xs font-semibold flex items-center justify-center gap-2 ${
                      isLiveDictatingAudio
                        ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse"
                        : "bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white"
                    }`}
                  >
                    {isLiveDictatingAudio ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    <span>{isLiveDictatingAudio ? "Parar Ditado ao Vivo" : "Iniciar Ditado por Voz ao Vivo"}</span>
                  </Button>
                </div>

                {/* Campo de Relato Clínico Editável */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                    Transcrição do Relato Clínico:
                  </label>
                  <Textarea
                    value={audioTranscript}
                    onChange={(e) => setAudioTranscript(e.target.value)}
                    placeholder="O relato transcrito aparecerá aqui. Você também pode complementar ou editar manualmente..."
                    className="rounded-xl text-xs border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-[140px]"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-400">
                    Dica: Fale pressão arterial (ex: 120 por 80), FC, FR, dor, escala de Glasgow e queixas.
                  </p>
                </div>
              </div>

              {/* Coluna Direita: Guia Clínico em Abas & Pré-visualização dos Parâmetros Extraídos */}
              <div className="md:col-span-7 space-y-4">
                {/* Abas com Frases Orientadoras */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                      Guia Clínico de Verbalização ("Caring Out Loud")
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60">
                      Clique no snippet para adicionar
                    </span>
                  </div>
                  <ClinicalGuideTabs
                    onSelectSnippet={(snippet) => {
                      setAudioTranscript((prev) => (prev ? `${prev} ${snippet}` : snippet.replace(/^,\s*/, "")));
                    }}
                  />
                </div>

                {/* Prévia dos Parâmetros Extraídos em Tempo Real */}
                {(() => {
                  const extracted = parseVitalsFromTranscript(audioTranscript);
                  const hasAny = Object.keys(extracted).length > 0;
                  return (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                          Parâmetros Fisiológicos Extraídos da Fala
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hasAny ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                          {hasAny ? "Dados Identificados" : "Aguardando Fala"}
                        </span>
                      </div>

                      {hasAny ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                          {extracted.pa_sistolica && (
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Pressão Arterial</span>
                              <span className="font-bold text-slate-900 dark:text-slate-100">{extracted.pa_sistolica}/{extracted.pa_diastolica || 80} mmHg</span>
                            </div>
                          )}
                          {extracted.fc && (
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Frequência Cardíaca</span>
                              <span className="font-bold text-slate-900 dark:text-slate-100">{extracted.fc} bpm</span>
                            </div>
                          )}
                          {extracted.fr && (
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Frequência Respiratória</span>
                              <span className="font-bold text-slate-900 dark:text-slate-100">{extracted.fr} irpm</span>
                            </div>
                          )}
                          {extracted.tax && (
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Temperatura</span>
                              <span className="font-bold text-slate-900 dark:text-slate-100">{extracted.tax} °C</span>
                            </div>
                          )}
                          {extracted.sat && (
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Saturação O₂</span>
                              <span className="font-bold text-slate-900 dark:text-slate-100">{extracted.sat} %</span>
                            </div>
                          )}
                          {extracted.caloi_pain_intensity !== undefined && (
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Dor (0-10)</span>
                              <span className="font-bold text-slate-900 dark:text-slate-100">{extracted.caloi_pain_intensity} / 10</span>
                            </div>
                          )}
                          {extracted.glasgow && (
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Glasgow</span>
                              <span className="font-bold text-slate-900 dark:text-slate-100">{extracted.glasgow} pts</span>
                            </div>
                          )}
                          {extracted.estado_consciencia && (
                            <div className="col-span-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Sensório / Consciência</span>
                              <span className="font-bold text-slate-900 dark:text-slate-100">{extracted.estado_consciencia}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 dark:text-slate-400 italic py-2">
                          Nenhum sinal vital detectado ainda. Fale ou digite por exemplo: "PA 140 por 90, pulso 88, respiração 20, saturação 95%, dor 6 no abdômen".
                        </p>
                      )}

                      {/* Botões de Ação para Prosseguir */}
                      <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2.5 justify-end">
                        <Button
                          variant="outline"
                          onClick={() => applyAudioDataToCase(false)}
                          disabled={!audioTranscript.trim()}
                          className="rounded-xl border-slate-300 text-slate-700 text-xs font-semibold"
                        >
                          <ListChecks className="h-4 w-4 mr-1.5" />
                          <span>Preencher Caso e Ver Passo a Passo</span>
                        </Button>
                        <Button
                          onClick={() => applyAudioDataToCase(true)}
                          disabled={!audioTranscript.trim() || isGeneratingChallenge}
                          className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs px-5 font-semibold flex items-center gap-1.5 shadow-xs"
                        >
                          <Target className="h-4 w-4 text-teal-400" />
                          <span>{isGeneratingChallenge ? "Gerando..." : "Preencher e Lançar Desafio IA"}</span>
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODO 1: MONTADOR DO CASO CLÍNICO (WIZARD DE 7 PASSOS)    */}
        {/* ======================================================== */}
        {viewMode === "builder" && (
          <div className="space-y-6">
            {/* Barra de Progresso do Wizard */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-xs">
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
                          ? "bg-emerald-600 text-white shadow-xs"
                          : isDone
                          ? "bg-slate-100 dark:bg-slate-800 text-emerald-800 dark:text-emerald-400 font-medium"
                          : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60"
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6 animate-in fade-in">
              {/* PASSO 0: PERFIL & ANAMNESE */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Identificação do Paciente & Anamnese Clínica
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
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
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sexo:</label>
                        <select
                          value={profile.gender}
                          onChange={(e) => setProf("gender", e.target.value)}
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 text-xs h-10 px-3 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                        >
                          <option value="M">Masculino</option>
                          <option value="F">Feminino</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Histórico & Doenças Prévias:</label>
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
                            ? "bg-emerald-50 dark:bg-emerald-950/60 border-teal-600 dark:border-emerald-500 text-slate-900 dark:text-emerald-200"
                            : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={data[item.key]}
                          onChange={(e) => setParam(item.key, e.target.checked)}
                          className="mt-0.5 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                        />
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">{item.label}</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* PASSO 4: QUEDAS & ÁLCOOL (SAK & AUDIT) */}
              {currentStep === 4 && (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        Estratificação de Risco de Quedas (SAK)
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Identifique fatores de risco intrínsecos e extrínsecos no ambiente de internação.
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                      SAK: {sakTotal} pts
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SAK_ITEMS.map((item) => (
                      <label
                        key={item.key}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          data[item.key]
                            ? "bg-emerald-50 dark:bg-emerald-950/60 border-teal-600 dark:border-emerald-500 text-slate-900 dark:text-emerald-200"
                            : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
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
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        Avaliação Multidimensional da Dor (CALOI)
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Caracterize a intensidade, localização anatômica e descritores sensoriais.
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${caloiTotal >= 7 ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800" : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700"}`}>
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
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
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
                                  ? "bg-emerald-700 dark:bg-emerald-600 text-white border-emerald-700"
                                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
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

                  {speechError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
                      <span>{speechError}</span>
                      <button
                        type="button"
                        onClick={() => setSpeechError("")}
                        className="text-rose-500 hover:text-rose-800 font-bold ml-2 text-xs"
                      >
                        Fechar
                      </button>
                    </div>
                  )}

                  {isListening && (
                    <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-800 flex items-center gap-2 animate-pulse">
                      <Mic className="h-4 w-4 text-teal-600 animate-bounce" />
                      <div>
                        <span className="font-bold">Captação de voz ativa: </span>
                        <span>Fale naturalmente os achados à beira-leito...</span>
                        {interimTranscript && (
                          <p className="mt-1 text-slate-700 italic bg-white/80 p-1.5 rounded-lg border border-teal-100">
                            "{interimTranscript}..."
                          </p>
                        )}
                      </div>
                    </div>
                  )}

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
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                  disabled={currentStep === 0}
                  className="rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="h-4 w-4 mr-1.5" /> Passo Anterior
                </Button>

                {currentStep < WIZARD_STEPS.length - 1 ? (
                  <Button
                    onClick={() => setCurrentStep((s) => Math.min(WIZARD_STEPS.length - 1, s + 1))}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-5 font-semibold shadow-xs"
                  >
                    Próximo Passo <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleLaunchChallenge}
                    disabled={isGeneratingChallenge}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-6 h-11 font-semibold flex items-center gap-2 shadow-xs"
                  >
                    <Target className="h-4 w-4 text-emerald-200" />
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      Bateria de Julgamento Clínico Avançado
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Vivência Real • COFEN 736/2024
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {challenge.questionTitle}
                  </h2>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <Award className={`h-4 w-4 ${totalCorrect > 0 ? "text-amber-500" : "text-slate-400"}`} />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Pontuação: {totalScore} / {questionsList.length * 100} pts
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode("builder")}
                    className="rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Ajustar Escores</span>
                  </Button>
                </div>
              </div>

              {/* Prontuário Sintético Baseado no que o Aluno Montou */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 block">Dados Clínicos do Paciente (Anonimizado - LGPD):</span>
                <p className="leading-relaxed">
                  {challenge.clinicalVignette}
                </p>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    PA: {data.pa_sistolica}/{data.pa_diastolica} mmHg
                  </span>
                  <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    FC: {data.fc} bpm
                  </span>
                  <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    FR: {data.fr} irpm
                  </span>
                  <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    SatO2: {data.sat}%
                  </span>
                  <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    Braden: {bradenTotal} pts
                  </span>
                  {camPositive && (
                    <span className="bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                      CAM: Delirium Positivo
                    </span>
                  )}
                  {caloiTotal > 0 && (
                    <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      Dor: {caloiTotal}/10
                    </span>
                  )}
                </div>
              </div>

              {/* SELETOR DE ABAS DA BATERIA (4 EIXOS DE VIVÊNCIA CLÍNICA) */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Eixos de Julgamento Clínico ({questionsList.length} Desafios):
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Respondidas: {Object.keys(submittedQuestions).length} de {questionsList.length}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {questionsList.map((q, idx) => {
                    const isCurrent = idx === currentQuestionIndex;
                    const isSub = !!submittedQuestions[idx];
                    const chosen = q.options?.find(o => o.id === userAnswers[idx]);
                    const isRight = chosen?.isCorrect;

                    let tabStyle = "bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600";
                    if (isCurrent) {
                      tabStyle = "bg-teal-50/80 dark:bg-teal-950/80 border-teal-600 dark:border-teal-500 text-teal-900 dark:text-teal-200 ring-1 ring-teal-600 dark:ring-teal-500 font-bold shadow-xs";
                    } else if (isSub && isRight) {
                      tabStyle = "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300";
                    } else if (isSub && !isRight) {
                      tabStyle = "bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-300";
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
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
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
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
                  <div>
                    <span className="text-xs font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                      Questão {currentQuestionIndex + 1} de {questionsList.length} • {activeQuestion.category}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mt-2 leading-relaxed">
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
                          : "border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                      }`}
                    >
                      <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                      <span>{isTipRevealed ? "Ocultar Dica Socrática" : "Dica de Raciocínio Clínico"}</span>
                    </Button>
                  </div>
                </div>

                {/* Dica Socrática (Attending Physician Tip) */}
                {isTipRevealed && (
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-950 dark:text-amber-200 space-y-1 animate-in fade-in">
                    <span className="font-bold flex items-center gap-1 text-amber-900 dark:text-amber-300">
                      <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" /> Dica de Vivência à Beira-Leito:
                    </span>
                    <p className="leading-relaxed">{activeQuestion.attendingTip}</p>
                  </div>
                )}

                {/* Alternativas de Múltipla Escolha com Distratores Sutis */}
                <div className="space-y-2.5 pt-1">
                  {activeQuestion.options?.map((option) => {
                    const isSelected = activeSelectedOption === option.id;
                    const showFeedback = isActiveSubmitted;
                    let style = "bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-800 dark:text-slate-200";

                    if (isSelected && !showFeedback) {
                      style = "bg-emerald-50 dark:bg-emerald-950/60 border-teal-700 dark:border-emerald-500 ring-1 ring-teal-700 dark:ring-emerald-500 shadow-xs text-slate-900 dark:text-emerald-100";
                    }

                    if (showFeedback) {
                      if (option.isCorrect) {
                        style = "bg-emerald-50/80 dark:bg-emerald-950/80 border-emerald-500 dark:border-emerald-600 text-emerald-950 dark:text-emerald-200 font-medium";
                      } else if (isSelected && !option.isCorrect) {
                        style = "bg-rose-50/80 dark:bg-rose-950/80 border-rose-400 dark:border-rose-600 text-rose-950 dark:text-rose-200";
                      } else {
                        style = "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 opacity-70";
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
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <ClipboardCheck className="h-4 w-4 text-teal-700 dark:text-teal-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                    Prescrição de Cuidados de Enfermagem (Resolução COFEN nº 736/2024)
                  </h3>
                </div>
                <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-200">
                  {challenge.recommendedInterventions.map((care, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{care}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-2.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      exportClinicalCaseToPdf({
                        caseData: {
                          name: profile?.name || "Paciente Simulado",
                          age: profile?.age || 50,
                          bed: profile?.bed || "Leito de Internação",
                          title: challenge?.patientSummary || "Caso Montado no Estúdio",
                          diagnosis: challenge?.correctDiagnosis || "Diagnóstico de Enfermagem",
                          vitals: data,
                          interventions: challenge?.recommendedInterventions
                        },
                        tutorEvaluation: {
                          safetyScore: totalScore,
                          summaryFeedback: `Bateria de julgamento clínico concluída com pontuação de ${totalScore} pontos. Prescrição de cuidados COFEN nº 736/2024 formulada.`
                        }
                      });
                    }}
                    className="rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5 w-full sm:w-auto"
                  >
                    <Download className="h-3.5 w-3.5" /> Baixar Prontuário em PDF
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigate("/passagem-plantao", {
                        state: {
                          caseData: {
                            name: profile?.name || "Paciente Simulado",
                            age: profile?.age || 50,
                            bed: profile?.bed || "Leito de Internação",
                            sector: "Enfermaria Clínica Geral",
                            diagnosis: challenge?.correctDiagnosis || "Diagnóstico de Enfermagem",
                            clinicalSummary: challenge?.patientSummary || "Caso clínico montado com escores no Estúdio de Casos.",
                            vitals: data,
                            interventions: challenge?.recommendedInterventions
                          }
                        }
                      });
                    }}
                    className="rounded-xl border-amber-300 text-amber-900 hover:bg-amber-50 text-xs font-semibold flex items-center justify-center gap-1.5 w-full sm:w-auto"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5 text-amber-700" /> Passar Plantão deste Caso (SBAR)
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <StudentFooter />
    </div>
  );
}
