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
  Target,
  Mic,
  MicOff,
  ListChecks,
  AudioLines,
  History,
  Clock,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import StudentHeader from "@/components/StudentHeader";
import StudentFooter from "@/components/StudentFooter";
import VitalSlider from "@/components/VitalSlider";
import RiskBadge from "@/components/RiskBadge";
import useAudioRecorder from "@/hooks/useAudioRecorder";
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
import { formatToInitials } from "@/lib/sampleNames";
import { generateCaseDiagnosticChallenge } from "@/services/diagnosticChallengeService";
import { generateProceduralClinicalCase } from "@/data/randomClinicalScenarios";
import CaseHistoryModal from "@/components/history/CaseHistoryModal";
import { clinicalHistoryService, MODULE_TYPES } from "@/services/clinicalHistoryService";
import GotiAnimated from "@/components/mascot/GotiAnimated";
import { useDragScroll } from "@/hooks/useDragScroll";
import MobileBottomDock from "@/components/mobile/MobileBottomDock";

const WIZARD_STEPS = [
  { key: "profile", label: "1. Perfil & Anamnese", icon: UserRound },
  { key: "vitals", label: "2. Sinais Vitais", icon: HeartPulse },
  { key: "braden", label: "3. Escala Braden", icon: ClipboardCheck },
  { key: "cam", label: "4. Escala CAM", icon: BrainCircuit },
  { key: "sak_audit", label: "5. Quedas & Álcool", icon: Footprints },
  { key: "caloi", label: "6. Dor & Localização", icon: Activity },
  { key: "notes", label: "7. Notas & Voz", icon: FileText },
  { key: "confirm", label: "8. Confirmar Envio", icon: CheckCircle2 },
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
  const wizardStepsScrollRef = useDragScroll();
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
  const [batteryCycle, setBatteryCycle] = useState(0);
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
    initials: "",
    name: "",
    age: "",
    gender: "M",
    previous_diseases: "",
    medical_history: "",
    current_medications: "",
    allergies: "",
    previous_anamnesis: "",
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
    notes: ""
  });

  // Estados da Bateria de Desafios Clínicos de Alta Complexidade
  const [challenge, setChallenge] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isGeneratingChallenge, setIsGeneratingChallenge] = useState(false);
  const [userAnswers, setUserAnswers] = useState({}); // { [questionIdx]: optionId }
  const [submittedQuestions, setSubmittedQuestions] = useState({}); // { [questionIdx]: boolean }
  const [revealedTips, setRevealedTips] = useState({}); // { [questionIdx]: boolean }
  const [viewingConclusion, setViewingConclusion] = useState(false);

  // Estados de Histórico & Cronômetro de Atividade
  const [currentActivityId, setCurrentActivityId] = useState(null);
  const [activitySeconds, setActivitySeconds] = useState(0);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  React.useEffect(() => {
    let interval = null;
    if (viewMode === "builder" || viewMode === "audio") {
      interval = setInterval(() => {
        setActivitySeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [viewMode]);

  function handleSaveDraft() {
    const patientDisplay = profile.initials ? `${profile.initials} (${profile.age ? profile.age + "a" : "?"})` : "Paciente em Anamnese";
    const progress = Math.round(((currentStep + 1) / WIZARD_STEPS.length) * 100);
    const draft = clinicalHistoryService.saveDraft({
      id: currentActivityId,
      moduleType: MODULE_TYPES.CASE_BUILDER,
      title: `Caso Clínico: ${profile.initials || "Sem Iniciais"}`,
      patientInfo: `${patientDisplay} • ${(profile.previous_anamnesis || profile.notes || "Em elaboração").substring(0, 45)}...`,
      progress,
      durationSeconds: activitySeconds,
      step: currentStep,
      formData: { profile, data, viewMode }
    });
    setCurrentActivityId(draft.id);
    alert("Rascunho salvo com sucesso! Você pode retomar este caso a qualquer momento no menu de Histórico.");
  }

  function handleConfirmSubmission() {
    const patientDisplay = profile.initials ? `${profile.initials} (${profile.age ? profile.age + "a" : "?"})` : "Paciente Cadastrado";
    const bradenScore = computeBradenTotal({
      perception: data.braden_perception,
      moisture: data.braden_moisture,
      activity: data.braden_activity,
      mobility: data.braden_mobility,
      nutrition: data.braden_nutrition,
      friction: data.braden_friction,
    });
    const bradenRisk = computeGlobalRisk(data).bradenRisk;
    const sakScore = computeSakTotal(data);
    const camPos = computeCamPositive({
      acute: data.cam_acute,
      inattention: data.cam_inattention,
      disorganized: data.cam_disorganized,
      altered_loc: data.cam_altered_loc,
    });

    const evaluation = {
      bradenScore,
      bradenRisk: bradenRisk?.label || "Avaliado",
      sakScore,
      camPositive: camPos,
      painScore: data.caloi_pain_intensity,
      summary: `Avaliação do paciente ${patientDisplay} concluída e assinada. Braden: ${bradenScore} (${bradenRisk?.label || "Avaliado"}), Risco Quedas SAK: ${sakScore} pts, Dor: ${data.caloi_pain_intensity}/10.`
    };

    const item = clinicalHistoryService.submitActivity({
      id: currentActivityId,
      moduleType: MODULE_TYPES.CASE_BUILDER,
      title: `Caso Clínico: ${profile.initials || "Anônimo"}`,
      patientInfo: `${patientDisplay} • Sexo: ${profile.gender === "M" ? "Masculino" : "Feminino"}`,
      durationSeconds: activitySeconds,
      score: 100,
      evaluation,
      formData: { profile, data }
    });

    setCurrentActivityId(item.id);
    setSubmissionSuccess(true);
  }

  async function handleResumeActivity(item) {
    let currentProf = profile;
    let currentD = data;
    if (item?.formData) {
      if (item.formData.profile) {
        setProfile(item.formData.profile);
        currentProf = item.formData.profile;
      }
      if (item.formData.data) {
        setData(item.formData.data);
        currentD = item.formData.data;
      }
      if (item.step !== undefined) setCurrentStep(item.step);
      if (item.durationSeconds) setActivitySeconds(item.durationSeconds);
    }
    setCurrentActivityId(item.id);
    setSubmissionSuccess(item.status === "completed");
    setIsHistoryModalOpen(false);

    // Redireciona diretamente para a resolução das questões clínicas
    setIsGeneratingChallenge(true);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setSubmittedQuestions({});
    setRevealedTips({});
    setViewingConclusion(false);

    try {
      const sanitizedInitials = formatToInitials(currentProf.initials || currentProf.name);
      const safeProfile = {
        ...currentProf,
        initials: sanitizedInitials,
        name: sanitizedInitials
      };
      const res = await generateCaseDiagnosticChallenge(safeProfile, currentD);
      setChallenge(res);
      setViewMode("challenge");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("[Histórico] Erro ao carregar questões:", err);
      setViewMode("challenge");
    } finally {
      setIsGeneratingChallenge(false);
    }
  }

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

  // Gerador de Caso Sintético Aleatório Procedural (Anonimizado - LGPD)
  function handleGenerateRandomProfile() {
    const procedural = generateProceduralClinicalCase();
    setProfile(procedural.profile);
    setData((prev) => ({
      ...prev,
      ...procedural.vitals,
      braden_perception: procedural.braden.perception,
      braden_moisture: procedural.braden.moisture,
      braden_activity: procedural.braden.activity,
      braden_mobility: procedural.braden.mobility,
      braden_nutrition: procedural.braden.nutrition,
      braden_friction: procedural.braden.friction,
      cam_acute: procedural.cam.acute,
      cam_inattention: procedural.cam.inattention,
      cam_disorganized: procedural.cam.disorganized,
      cam_altered_loc: procedural.cam.altered_loc,
      sak_disorientation: procedural.sak.disorientation,
      sak_urination: procedural.sak.urination,
      sak_walking: procedural.sak.walking,
      sak_caregiver: procedural.sak.caregiver,
      sak_postop: procedural.sak.postop,
      sak_previous_falls: procedural.sak.previous_falls,
      sak_meds: procedural.sak.meds,
      caloi_pain_intensity: procedural.caloi.intensity,
      caloi_pain_location: procedural.caloi.location,
      caloi_pain_characteristics: procedural.caloi.characteristics
    }));
  }

  // Sorteia um novo caso clínico autêntico procedural e inicia imediatamente o desafio
  async function handleLaunchRandomNewCase() {
    const procedural = generateProceduralClinicalCase();
    setProfile(procedural.profile);
    const updatedData = {
      ...data,
      ...procedural.vitals,
      braden_perception: procedural.braden.perception,
      braden_moisture: procedural.braden.moisture,
      braden_activity: procedural.braden.activity,
      braden_mobility: procedural.braden.mobility,
      braden_nutrition: procedural.braden.nutrition,
      braden_friction: procedural.braden.friction,
      cam_acute: procedural.cam.acute,
      cam_inattention: procedural.cam.inattention,
      cam_disorganized: procedural.cam.disorganized,
      cam_altered_loc: procedural.cam.altered_loc,
      sak_disorientation: procedural.sak.disorientation,
      sak_urination: procedural.sak.urination,
      sak_walking: procedural.sak.walking,
      sak_caregiver: procedural.sak.caregiver,
      sak_postop: procedural.sak.postop,
      sak_previous_falls: procedural.sak.previous_falls,
      sak_meds: procedural.sak.meds,
      caloi_pain_intensity: procedural.caloi.intensity,
      caloi_pain_location: procedural.caloi.location,
      caloi_pain_characteristics: procedural.caloi.characteristics
    };
    setData(updatedData);

    setIsGeneratingChallenge(true);
    setViewingConclusion(false);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setSubmittedQuestions({});
    setRevealedTips({});
    setBatteryCycle(0);

    try {
      const sanitizedInitials = formatToInitials(procedural.profile.initials || procedural.profile.name);
      const safeProfile = {
        ...procedural.profile,
        initials: sanitizedInitials,
        name: sanitizedInitials
      };
      const res = await generateCaseDiagnosticChallenge(safeProfile, updatedData, 0);
      setChallenge(res);
      setViewMode("challenge");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsGeneratingChallenge(false);
    }
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

  // Disparo da Bateria de Desafios Clínicos (Garante anonimização estrita LGPD e rotação de questões)
  async function handleLaunchChallenge() {
    setIsGeneratingChallenge(true);
    setViewingConclusion(false);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setSubmittedQuestions({});
    setRevealedTips({});

    try {
      const nextCycle = batteryCycle + 1;
      setBatteryCycle(nextCycle);

      const sanitizedInitials = formatToInitials(profile.initials || profile.name);
      const safeProfile = {
        ...profile,
        initials: sanitizedInitials,
        name: sanitizedInitials
      };
      const res = await generateCaseDiagnosticChallenge(safeProfile, data, nextCycle);
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

  // Pontuação Total e Acurácia da Bateria
  const totalCorrect = questionsList.filter((q, idx) => {
    if (!submittedQuestions[idx]) return false;
    const ans = userAnswers[idx];
    const opt = q.options?.find(o => o.id === ans);
    return opt?.isCorrect;
  }).length;
  const totalScore = totalCorrect * 100;
  const accuracyScore = questionsList.length > 0 ? Math.round((totalCorrect / questionsList.length) * 100) : 0;
  const allQuestionsAnswered = questionsList.length > 0 && questionsList.every((_, idx) => submittedQuestions[idx]);

  // Ações do Estudante na Bateria
  function handleSelectOption(optionId) {
    if (isActiveSubmitted) return;
    setUserAnswers((prev) => ({ ...prev, [currentQuestionIndex]: optionId }));
  }

  function handleSubmitCurrentAnswer() {
    if (!activeSelectedOption) return;
    setSubmittedQuestions((prev) => {
      const next = { ...prev, [currentQuestionIndex]: true };
      const willAllBeAnswered = questionsList.length > 0 && questionsList.every((_, idx) => next[idx]);
      if (willAllBeAnswered) {
        setTimeout(() => setViewingConclusion(true), 400);
      }
      return next;
    });
  }

  function handleToggleTip() {
    setRevealedTips((prev) => ({ ...prev, [currentQuestionIndex]: !prev[currentQuestionIndex] }));
  }

  return (
    <div className="min-h-screen bg-[#0B131D] flex flex-col text-[#EAF2F8] pb-28 md:pb-8 selection:bg-[#20D5B5]/30 selection:text-[#20D5B5]">
      <StudentHeader activeTab="montar" />

      <main className="flex-1 mx-auto max-w-5xl w-full px-4 sm:px-6 py-6 space-y-6">
        {/* Barra Superior Minimalista e Funcional (Responsiva no Celular) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1F3045]">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate("/")}
              className="p-2 rounded-xl text-[#9FB3C6] hover:text-white hover:bg-[#131F2E] transition-colors shrink-0"
              aria-label="Voltar ao Painel"
              title="Voltar ao Painel"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#20D5B5]/15 text-[#20D5B5] border border-[#20D5B5]/30 uppercase tracking-wider whitespace-nowrap inline-flex items-center">
                  Prática Baseada em Evidências
                </span>
                <span className="text-xs font-semibold text-[#9FB3C6] hidden sm:inline">
                  • Julgamento Clínico
                </span>
              </div>
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-white leading-tight mt-0.5 truncate">
                {viewMode === "choose" && "Montar Caso Clínico"}
                {viewMode === "builder" && "Montar Caso Clínico"}
                {viewMode === "audio" && "Avaliação por Áudio & Fala"}
                {viewMode === "challenge" && "Bateria de Julgamento Clínico Avançado"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHistoryModalOpen(true)}
              className="rounded-xl border-[#1F3045] bg-[#16222E] text-[#9FB3C6] hover:text-white hover:bg-[#1E2E3E] text-xs flex items-center gap-1.5 shadow-2xs font-semibold"
            >
              <History className="h-3.5 w-3.5 text-[#20D5B5]" />
              <span>Histórico de Casos</span>
            </Button>

            {viewMode === "choose" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="rounded-xl text-[#9FB3C6] hover:text-white text-xs flex items-center gap-1.5"
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
                  className="rounded-xl border-[#1F3045] bg-[#16222E] text-[#20D5B5] hover:bg-[#20D5B5]/10 text-xs flex items-center gap-1.5"
                >
                  <AudioLines className="h-3.5 w-3.5 text-[#20D5B5]" />
                  <span className="hidden sm:inline">Modo</span> Áudio
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateRandomProfile}
                  className="rounded-xl border-[#1F3045] bg-[#16222E] text-[#9FB3C6] hover:text-white text-xs flex items-center gap-1.5"
                >
                  <Shuffle className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Gerar</span> Aleatório
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("choose")}
                  className="rounded-xl text-[#9FB3C6] hover:text-white text-xs"
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
                  className="rounded-xl border-[#1F3045] bg-[#16222E] text-[#20D5B5] hover:bg-[#20D5B5]/10 text-xs flex items-center gap-1.5"
                >
                  <ClipboardCheck className="h-3.5 w-3.5 text-[#20D5B5]" />
                  <span>Modo Manual</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("choose")}
                  className="rounded-xl text-[#9FB3C6] hover:text-white text-xs"
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
                className="rounded-xl border-[#1F3045] bg-[#16222E] text-[#9FB3C6] hover:text-white text-xs flex items-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Ajustar Parâmetros</span>
              </Button>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* MODO 0: ESCOLHA INICIAL (1:1 COM A PÁGINA 8 DO PDF)      */}
        {/* ======================================================== */}
        {viewMode === "choose" && (
          <div className="max-w-md mx-auto w-full pt-2 pb-6 animate-in fade-in">
            <div className="bg-[#0E1722] border border-[#1F3045] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
              {/* Topo do Modal (Página 8 do PDF) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#131F2E] border border-[#1F3045] flex items-center justify-center text-[#20D5B5]">
                    <ClipboardCheck className="w-5 h-5 text-[#20D5B5]" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Montador de Casos Clínicos</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#20D5B5]/15 text-[#20D5B5] border border-[#20D5B5]/30">
                      Escores Clínicos + Áudio
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="p-1.5 rounded-xl text-[#9FB3C6] hover:text-white hover:bg-[#131F2E] transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* DIRETRIZES DO GOTI (Página 8 do PDF) */}
              <div className="p-4 rounded-2xl bg-[#131F2E] border border-[#1F3045] space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#20D5B5] block">
                  DIRETRIZES DO GOTI
                </span>
                <div className="flex items-start gap-3">
                  <GotiAnimated size={42} animation="thinking" className="shrink-0 pt-0.5" />
                  <p className="text-xs text-[#EAF2F8] leading-relaxed italic">
                    “Monte um caso clínico completo com sinais vitais, histórico e escores validados (Braden, CAM, CALOI, SAK). Você pode montar manualmente ou gravar por áudio!”
                  </p>
                </div>
              </div>

              {/* SELECIONE COMO DESEJA PRATICAR (Página 8 do PDF) */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#9FB3C6] block">
                  SELECIONE COMO DESEJA PRATICAR:
                </span>

                {/* Card 1: Começar Novo (Manual Guiado) */}
                <button
                  type="button"
                  onClick={() => setViewMode("builder")}
                  className="w-full p-4 rounded-2xl bg-[#0B131D] border-2 border-[#20D5B5] text-left flex items-center justify-between group transition hover:bg-[#131F2E]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#20D5B5]/10 border border-[#20D5B5]/30 flex items-center justify-center text-[#20D5B5] shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">Começar Novo (Manual Guiado)</h4>
                      <p className="text-[11px] text-[#9FB3C6]">Preenchimento passo a passo com sliders de precisão</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#20D5B5] group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Card 2: Começar por Áudio (Voz) */}
                <button
                  type="button"
                  onClick={() => setViewMode("audio")}
                  className="w-full p-4 rounded-2xl bg-[#0B131D] border border-[#1F3045] hover:border-[#20D5B5]/50 text-left flex items-center justify-between group transition hover:bg-[#131F2E]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#131F2E] border border-[#1F3045] flex items-center justify-center text-[#20D5B5] shrink-0">
                      <Mic className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">Começar por Áudio (Voz)</h4>
                      <p className="text-[11px] text-[#9FB3C6]">Relate o caso falando e o Enfere extrai com IA</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#9FB3C6] group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>

                {/* Card 3: Revisão dos Casos Montados */}
                <button
                  type="button"
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="w-full p-4 rounded-2xl bg-[#0B131D] border border-[#1F3045] hover:border-[#20D5B5]/50 text-left flex items-center justify-between group transition hover:bg-[#131F2E]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#131F2E] border border-[#1F3045] flex items-center justify-center text-[#20D5B5] shrink-0">
                      <History className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">Revisão dos Casos Montados</h4>
                      <p className="text-[11px] text-[#9FB3C6]">Ver os casos que você já estruturou na plataforma</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#9FB3C6] group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>
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

                {/* Status Dinâmico de Transcrição por IA */}
                {isAudioTranscribing && (
                  <div className="rounded-2xl border border-teal-200 dark:border-teal-800 bg-teal-50/80 dark:bg-teal-950/60 p-3.5 text-xs text-teal-800 dark:text-teal-300 flex items-center gap-2.5 animate-pulse shadow-2xs">
                    <AudioLines className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span className="font-semibold">{audioStage || "Processando e transcrevendo áudio com inteligência artificial..."}</span>
                  </div>
                )}

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
        {/* MODO 1: MONTADOR DO CASO CLÍNICO (WIZARD DE 8 PASSOS)    */}
        {/* ======================================================== */}
        {viewMode === "builder" && (
          <div className="space-y-6">
            {/* Barra de Progresso do Wizard (Páginas 9 e 10 do PDF) */}
            <div className="bg-[#131F2E] rounded-2xl border border-[#1F3045] p-2 shadow-xs">
              <div ref={wizardStepsScrollRef} className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none">
                {WIZARD_STEPS.map((s, idx) => {
                  const Icon = s.icon;
                  const isActive = idx === currentStep;
                  const isDone = idx < currentStep;
                  return (
                    <button
                      key={s.key}
                      onClick={() => setCurrentStep(idx)}
                      className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                        isActive
                          ? "bg-[#20D5B5] text-[#0B131D] shadow-[0_2px_0_0_#148A76]"
                          : isDone
                          ? "bg-[#0E1722] text-[#20D5B5] border border-[#20D5B5]/30 font-medium"
                          : "text-[#9FB3C6] hover:bg-[#16222E] hover:text-white"
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
            <div className="bg-[#131F2E] rounded-3xl border border-[#1F3045] p-5 sm:p-7 shadow-xs space-y-6 animate-in fade-in">
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
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                          <span>Iniciais do Paciente (LGPD):</span>
                          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-semibold flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
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
                        className="rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs h-10 font-mono tracking-wider uppercase font-semibold"
                      />
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Conforme a LGPD (Lei nº 13.709/2018), informe apenas as iniciais (ex: <strong>J.S.F.</strong>). Nomes completos são convertidos automaticamente.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Idade:</label>
                        <Input
                          type="number"
                          value={profile.age}
                          onChange={(e) => setProf("age", e.target.value)}
                          placeholder="Ex: 68"
                          className="rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs h-10"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Sexo:</label>
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
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Histórico & Doenças Prévias:</label>
                    <Input
                      value={profile.previous_diseases}
                      onChange={(e) => setProf("previous_diseases", e.target.value)}
                      placeholder="Ex: Hipertensão Arterial, Insuficiência Cardíaca CF II, DM..."
                      className="rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs h-10"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Medicações em Uso:</label>
                      <Input
                        value={profile.current_medications}
                        onChange={(e) => setProf("current_medications", e.target.value)}
                        placeholder="Ex: Enalapril 20mg, Furosemida 40mg..."
                        className="rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs h-10"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Alergias Conhecidas:</label>
                      <Input
                        value={profile.allergies}
                        onChange={(e) => setProf("allergies", e.target.value)}
                        placeholder="Ex: Nega alergias conhecidas ou alérgico a penicilina"
                        className="rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs h-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Anamnese / Motivo da Internação:</label>
                    <Textarea
                      value={profile.previous_anamnesis}
                      onChange={(e) => setProf("previous_anamnesis", e.target.value)}
                      placeholder="Descreva a queixa principal, evolução dos sintomas e achados da admissão..."
                      className="rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs min-h-[90px]"
                    />
                  </div>
                </div>
              )}

              {/* PASSO 1: SINAIS VITAIS */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        Monitorização de Sinais Vitais
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
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

              {/* PASSO 2: ESCALA DE BRADEN (1:1 COM A PÁGINA 9 DO PDF) */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="border-b border-[#1F3045] pb-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#20D5B5]/15 text-[#20D5B5] border border-[#20D5B5]/30 uppercase tracking-wide">
                      Escala Braden
                    </span>
                    <h2 className="text-lg font-black text-white mt-1">
                      Risco de lesão por pressão
                    </h2>
                    <p className="text-xs text-[#9FB3C6] mt-0.5">
                      Toque na pontuação de cada item. A descrição do valor aparece abaixo.
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    {BRADEN_ITEMS.map((item) => {
                      const maxVal = item.max || 4;
                      const currentVal = data[item.key] || 1;
                      return (
                        <div key={item.key} className="p-3.5 rounded-2xl bg-[#0E1722] border border-[#1F3045] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{item.label}</span>
                            <span className="text-[10px] text-[#9FB3C6] font-mono">
                              1 {item.key === "braden_moisture" ? "úmida" : item.key === "braden_activity" ? "acamado" : item.key === "braden_mobility" ? "imóvel" : item.key === "braden_nutrition" ? "muito pobre" : item.key === "braden_friction" ? "problema" : "limitada"} · {maxVal} {item.key === "braden_moisture" ? "rara" : item.key === "braden_activity" ? "deambula" : item.key === "braden_mobility" ? "sem limite" : item.key === "braden_nutrition" ? "excelente" : item.key === "braden_friction" ? "nenhum" : "nenhuma"}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {Array.from({ length: maxVal }).map((_, i) => {
                              const val = i + 1;
                              const isSelected = currentVal === val;
                              return (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setParam(item.key, val)}
                                  className={`py-2 rounded-xl text-xs font-black transition-all ${
                                    isSelected
                                      ? "bg-[#20D5B5] text-[#0B131D] shadow-[0_2px_0_0_#148A76]"
                                      : "bg-[#131F2E] border border-[#1F3045] text-[#9FB3C6] hover:text-white"
                                  }`}
                                >
                                  {val}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Total Braden (Página 9 do PDF) */}
                  <div className="p-4 rounded-2xl bg-[#0E1722] border border-[#1F3045] flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold text-white">Total Braden: {bradenTotal}</span>
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                      bradenTotal <= 12 ? "bg-[#F0645F]/20 text-[#F0645F] border border-[#F0645F]/30" :
                      bradenTotal <= 14 ? "bg-[#FFC247]/20 text-[#FFC247] border border-[#FFC247]/30" :
                      "bg-[#20D5B5]/20 text-[#20D5B5] border border-[#20D5B5]/30"
                    }`}>
                      {bradenTotal <= 12 ? "▲ Alto risco" : bradenTotal <= 14 ? "▲ Risco moderado" : "✓ Baixo risco"}
                    </span>
                  </div>
                </div>
              )}

              {/* PASSO 3: ESCALA CAM (DELIRIUM) */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        Método de Avaliação de Confusão Mental (CAM)
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Rastreio de Delirium no adulto hospitalizado.
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${camPositive ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"}`}>
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
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        Notas da Avaliação & Captação Ambiental de Voz
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
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
                          ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border-rose-300 dark:border-rose-700 animate-pulse"
                          : "text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                      <span>{isListening ? "Parar Captação" : "Ditar por Voz"}</span>
                    </Button>
                  </div>

                  {speechError && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
                      <span>{speechError}</span>
                      <button
                        type="button"
                        onClick={() => setSpeechError("")}
                        className="text-rose-500 hover:text-rose-800 dark:hover:text-rose-200 font-bold ml-2 text-xs"
                      >
                        Fechar
                      </button>
                    </div>
                  )}

                  {isListening && (
                    <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-xs text-teal-800 dark:text-teal-200 flex items-center gap-2 animate-pulse">
                      <Mic className="h-4 w-4 text-teal-600 dark:text-teal-400 animate-bounce" />
                      <div>
                        <span className="font-bold">Captação de voz ativa: </span>
                        <span>Fale naturalmente os achados à beira-leito...</span>
                        {interimTranscript && (
                          <p className="mt-1 text-slate-700 dark:text-slate-200 italic bg-white/80 dark:bg-slate-900/80 p-1.5 rounded-lg border border-teal-100 dark:border-teal-900/60">
                            "{interimTranscript}..."
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                      Relato de Enfermagem & Observações da Avaliação:
                    </label>
                    <Textarea
                      value={data.notes}
                      onChange={(e) => setParam("notes", e.target.value)}
                      placeholder="Fale ou digite as observações clínicas observadas durante o atendimento..."
                      className="rounded-xl text-xs border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 min-h-[120px]"
                    />
                  </div>
                </div>
              )}

              {/* PASSO 7: CONFIRMAR ENVIO & RESUMO FINAL (Página 11 do PDF) */}
              {currentStep === 7 && (
                <div className="space-y-6">
                  <div className="border-b border-[#1F3045] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-xl bg-[#20D5B5]/15 text-[#20D5B5] border border-[#20D5B5]/30">
                          <CheckCircle2 className="h-4 w-4" />
                        </span>
                        <h2 className="text-base sm:text-lg font-black text-white">
                          Confirmação de Envio & Resumo Geral do Caso
                        </h2>
                      </div>
                      <p className="text-xs text-[#9FB3C6] mt-1">
                        Revise todos os parâmetros do paciente antes de formalizar a entrega e liberar o debriefing com a IA.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-[#0E1722] text-[#9FB3C6] border border-[#1F3045]">
                        <Clock className="h-3.5 w-3.5 text-[#20D5B5]" />
                        <span>Tempo: {clinicalHistoryService.formatDuration(activitySeconds)}</span>
                      </span>
                    </div>
                  </div>

                  {submissionSuccess && (
                    <div className="p-4 rounded-2xl bg-[#20D5B5]/10 border border-[#20D5B5]/30 text-white flex items-start gap-3 animate-in fade-in">
                      <CheckCircle2 className="h-5 w-5 text-[#20D5B5] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-black text-xs uppercase tracking-wider text-[#20D5B5]">Atividade Oficialmente Concluída (100%)</h4>
                        <p className="text-xs text-[#9FB3C6] mt-0.5">
                          Este caso foi assinado e registrado com sucesso no seu Histórico de Prática Clínica.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Bloco 1: Identificação & Anamnese */}
                    <div className="p-4 rounded-2xl bg-[#0E1722] border border-[#1F3045] space-y-3">
                      <div className="flex items-center justify-between border-b border-[#1F3045] pb-2">
                        <span className="text-xs font-black text-white flex items-center gap-1.5">
                          <UserRound className="h-4 w-4 text-[#20D5B5]" />
                          Perfil & Anamnese do Paciente
                        </span>
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-[#20D5B5]/15 text-[#20D5B5] border border-[#20D5B5]/30">
                          Anonimizado
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-[#9FB3C6] block uppercase font-bold">Iniciais</span>
                          <strong className="text-white font-mono tracking-wider">{profile.initials || profile.name || "R.S.R."}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#9FB3C6] block uppercase font-bold">Idade / Sexo</span>
                          <strong className="text-white">{profile.age ? `${profile.age} anos` : "79 anos"} • {profile.gender === "M" ? "Masculino" : "Feminino"}</strong>
                        </div>
                      </div>
                      <div className="text-xs pt-1 border-t border-[#1F3045]">
                        <span className="text-[10px] text-[#9FB3C6] block uppercase font-bold">Histórico / Doenças</span>
                        <p className="text-[#EAF2F8] text-xs">{profile.previous_diseases || "HAS estágio 2, DM tipo 2 em uso de metformina."}</p>
                      </div>
                      <div className="text-xs">
                        <span className="text-[10px] text-[#9FB3C6] block uppercase font-bold">Alergias</span>
                        <p className="text-[#EAF2F8] text-xs font-semibold">{profile.allergies || "Nega alergias conhecidas."}</p>
                      </div>
                      <div className="text-xs">
                        <span className="text-[10px] text-[#9FB3C6] block uppercase font-bold">Admissão / Queixa</span>
                        <p className="text-[#EAF2F8] text-xs">{profile.previous_anamnesis || profile.notes || "Paciente trazido por familiares com relato de astenia importante, diminuição da ingesta hídrica e sonolência nas últimas 24 horas."}</p>
                      </div>
                    </div>

                    {/* Bloco 2: Sinais Vitais & Escores (Página 11 do PDF) */}
                    <div className="p-4 rounded-2xl bg-[#0E1722] border border-[#1F3045] space-y-3">
                      <div className="flex items-center justify-between border-b border-[#1F3045] pb-2">
                        <span className="text-xs font-black text-white flex items-center gap-1.5">
                          <HeartPulse className="h-4 w-4 text-[#F0645F]" />
                          Sinais Vitais & Escores
                        </span>
                        <span className="text-[10px] uppercase font-bold text-[#9FB3C6]">
                          COFEN 736/2024
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-[#16222E] border border-[#F0645F]/40">
                          <span className="text-[10px] text-[#F0645F] font-black block">✕ PA</span>
                          <strong className="text-base font-black text-[#F0645F]">{data.pa_sistolica}/{data.pa_diastolica} <span className="text-[10px] font-normal text-[#9FB3C6]">mmHg</span></strong>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#16222E] border border-[#F0645F]/40">
                          <span className="text-[10px] text-[#F0645F] font-black block">✕ FC</span>
                          <strong className="text-base font-black text-[#F0645F]">{data.fc} <span className="text-[10px] font-normal text-[#9FB3C6]">bpm</span></strong>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#16222E] border border-[#1F3045]">
                          <span className="text-[10px] text-[#9FB3C6] font-black block">SatO₂</span>
                          <strong className="text-base font-black text-white">{data.sat} <span className="text-[10px] font-normal text-[#9FB3C6]">%</span></strong>
                        </div>
                      </div>

                      <div className="pt-1.5 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-[#16222E] border border-[#1F3045]">
                          <span className="text-[#9FB3C6]">Escala de Braden:</span>
                          <strong className="text-white">{bradenTotal} pts</strong>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-xl bg-[#16222E] border border-[#1F3045]">
                          <span className="text-[#9FB3C6]">Escala CAM (Delírium):</span>
                          <strong className={camPositive ? "text-[#F0645F] font-bold" : "text-[#20D5B5] font-semibold"}>
                            {camPositive ? "▲ Positivo (Delírium)" : "Negativo"}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-xl bg-[#16222E] border border-[#1F3045]">
                          <span className="text-[#9FB3C6]">Quedas (SAK):</span>
                          <strong className="text-white">{sakTotal} pts</strong>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-xl bg-[#16222E] border border-[#1F3045]">
                          <span className="text-[#9FB3C6]">Dor (Escala Caloi):</span>
                          <strong className="text-white">{data.caloi_pain_intensity}/10</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {data.notes && (
                    <div className="p-3.5 rounded-2xl bg-[#0E1722] border border-[#1F3045] text-xs space-y-1">
                      <span className="text-[10px] font-bold text-[#9FB3C6] uppercase tracking-wider block">Observações Finais & Relato de Enfermagem:</span>
                      <p className="text-[#EAF2F8] italic">{data.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Navegação Entre Passos & Ações Oficiais de Envio (Páginas 9, 10, 11 do PDF) */}
              <div className="pt-4 border-t border-[#1F3045] flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                  disabled={currentStep === 0}
                  className="rounded-xl border border-[#1F3045] bg-[#0E1722] text-[#9FB3C6] hover:text-white px-4 py-2.5 text-xs font-bold hover:bg-[#16222E] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Passo anterior
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="rounded-xl border border-[#1F3045] bg-[#0E1722] text-[#9FB3C6] hover:text-white px-4 py-2.5 text-xs font-bold hover:bg-[#16222E] transition-all"
                  >
                    Salvar rascunho
                  </button>

                  {currentStep < WIZARD_STEPS.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (currentStep === 0 && !profile.initials?.trim() && !profile.name?.trim()) {
                          alert("Por favor, preencha as Iniciais ou Nome do paciente antes de avançar para o próximo passo.");
                          return;
                        }
                        setCurrentStep((s) => Math.min(WIZARD_STEPS.length - 1, s + 1));
                      }}
                      className="rounded-xl bg-[#20D5B5] hover:bg-[#1AD1B0] text-[#0B131D] text-xs px-6 py-2.5 font-black shadow-[0_3px_0_0_#148A76] active:translate-y-1 transition-all"
                    >
                      Próximo passo
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmSubmission}
                        className="rounded-xl bg-[#20D5B5] hover:bg-[#1AD1B0] text-[#0B131D] text-xs px-6 py-2.5 font-black shadow-[0_4px_0_0_#148A76] active:translate-y-1 transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Confirmar envio (100%)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleLaunchChallenge}
                        disabled={isGeneratingChallenge}
                        className="rounded-xl bg-[#16222E] border border-[#20D5B5]/40 hover:bg-[#131F2E] text-[#20D5B5] text-xs px-4 py-2.5 font-black flex items-center gap-2 transition-all"
                      >
                        <Target className="h-4 w-4" />
                        <span>{isGeneratingChallenge ? "Gerando..." : "Gerar Desafio IA"}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODO 2: BATERIA DE DESAFIOS CLÍNICOS (ESTILO AMBOSS/SIMX) */}
        {/* ======================================================== */}
        {viewMode === "challenge" && challenge && (
          <div className="space-y-6 animate-in fade-in">
            {/* Vinheta Resumo do Caso & Placar Geral (Página 12 do PDF) */}
            <div className="bg-[#131F2E] rounded-3xl border border-[#1F3045] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1F3045] pb-3 gap-2">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white">
                    Bateria de Julgamento Clínico Avançado
                  </h2>
                  <p className="text-xs text-[#9FB3C6] mt-0.5">
                    Vivência Hospitalar · Dados anonimizados (LGPD)
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-[#0E1722] px-3 py-1.5 rounded-xl border border-[#1F3045]">
                    <Award className="h-4 w-4 text-[#FFC247]" />
                    <span className="text-xs font-bold text-white">
                      {totalScore} / {questionsList.length * 100} pts
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setViewMode("builder")}
                    className="rounded-xl border border-[#1F3045] bg-[#0E1722] text-[#9FB3C6] hover:text-white text-xs px-3 py-1.5 font-bold flex items-center gap-1.5 hover:bg-[#16222E] transition-all"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Ajustar Escores</span>
                  </button>
                </div>
              </div>

              {/* Card DADOS CLÍNICOS DO PACIENTE (Página 12 do PDF) */}
              <div className="p-4 rounded-2xl bg-[#0E1722] border border-[#1F3045] space-y-3">
                <span className="text-[10px] font-black text-[#20D5B5] uppercase tracking-wider block">
                  DADOS CLÍNICOS DO PACIENTE
                </span>
                <p className="text-xs text-[#EAF2F8] leading-relaxed">
                  Paciente {profile.initials || "M.S.R."}, {profile.age || 79} anos, internado na unidade de cuidados clínicos. Histórico: HAS estágio 2, DM tipo 2 em uso de metformina.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#16222E] border border-[#F0645F]/40">
                    <span className="text-[10px] text-[#F0645F] font-black block">✕ PA</span>
                    <strong className="text-sm font-black text-[#F0645F]">{data.pa_sistolica}/{data.pa_diastolica} <span className="text-[10px] font-normal text-[#9FB3C6]">mmHg</span></strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#16222E] border border-[#F0645F]/40">
                    <span className="text-[10px] text-[#F0645F] font-black block">✕ FC</span>
                    <strong className="text-sm font-black text-[#F0645F]">{data.fc} <span className="text-[10px] font-normal text-[#9FB3C6]">bpm</span></strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#16222E] border border-[#1F3045]">
                    <span className="text-[10px] text-[#9FB3C6] font-black block">FR</span>
                    <strong className="text-sm font-black text-white">{data.fr} <span className="text-[10px] font-normal text-[#9FB3C6]">irpm</span></strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#16222E] border border-[#1F3045]">
                    <span className="text-[10px] text-[#9FB3C6] font-black block">SatO₂</span>
                    <strong className="text-sm font-black text-white">{data.sat} <span className="text-[10px] font-normal text-[#9FB3C6]">%</span></strong>
                  </div>
                </div>
              </div>

              {/* SELETOR DE ABAS DA BATERIA (4 EIXOS DE VIVÊNCIA CLÍNICA + CONCLUSÃO) */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-[#9FB3C6] uppercase tracking-wider">
                    EIXOS DE JULGAMENTO CLÍNICO ({questionsList.length} DESAFIOS)
                  </span>
                  <span className="text-[10px] font-bold text-[#9FB3C6]">
                    Respondidas: {Object.keys(submittedQuestions).length} de {questionsList.length}
                  </span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar select-none">
                  {questionsList.map((q, idx) => {
                    const isCurrent = !viewingConclusion && idx === currentQuestionIndex;
                    const isSub = !!submittedQuestions[idx];
                    const chosen = q.options?.find(o => o.id === userAnswers[idx]);
                    const isRight = chosen?.isCorrect;

                    let tabStyle = "bg-[#0E1722] border-[#1F3045] text-[#9FB3C6] hover:text-white";
                    if (isCurrent) {
                      tabStyle = "bg-[#20D5B5] text-[#0B131D] font-black shadow-[0_2px_0_0_#148A76]";
                    } else if (isSub && isRight) {
                      tabStyle = "bg-[#20D5B5]/15 border-[#20D5B5]/40 text-[#20D5B5]";
                    } else if (isSub && !isRight) {
                      tabStyle = "bg-[#F0645F]/15 border-[#F0645F]/40 text-[#F0645F]";
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setViewingConclusion(false);
                          setCurrentQuestionIndex(idx);
                        }}
                        className={`px-3 py-2 rounded-xl border text-left whitespace-nowrap transition-all flex items-center gap-1.5 text-xs font-bold ${tabStyle}`}
                      >
                        <span>Q{idx + 1}{isSub ? (isRight ? " ✓" : " ✕") : ""}</span>
                        <span className="truncate">{q.category || `Desafio ${idx + 1}`}</span>
                      </button>
                    );
                  })}

                  {allQuestionsAnswered && (
                    <button
                      onClick={() => setViewingConclusion(true)}
                      className={`px-3 py-2 rounded-xl border text-left whitespace-nowrap transition-all flex items-center gap-1.5 text-xs font-bold ${
                        viewingConclusion
                          ? "bg-[#20D5B5] text-[#0B131D] font-black"
                          : "bg-[#FFC247]/15 border-[#FFC247]/40 text-[#FFC247]"
                      }`}
                    >
                      <Award className="h-3.5 w-3.5" />
                      <span>Resultado Final</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ABA DE CONCLUSÃO OU CARD DA QUESTÃO ATIVA (1:1 COM A PÁGINA 13 DO PDF) */}
            {viewingConclusion ? (
              <div className="bg-[#131F2E] rounded-3xl border border-[#1F3045] p-6 shadow-xs space-y-6 animate-in fade-in">
                {/* Cabeçalho de Conclusão com o Goti (Página 13 do PDF) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1F3045] pb-5 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#20D5B5]/15 text-[#20D5B5] border border-[#20D5B5]/30 uppercase tracking-wide">
                      CONCLUSÃO · AVALIAÇÃO FORMATIVA
                    </span>
                    <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                      Parecer Pedagógico & Desconstrução do Raciocínio
                    </h2>
                    <p className="text-xs text-[#9FB3C6]">
                      Paciente: {profile.initials || "M.S.R."} ({profile.age || 79} anos) · Bateria de Julgamento Clínico Avançado
                    </p>
                  </div>

                  <div className="flex items-center gap-4 bg-[#0E1722] p-3.5 rounded-2xl border border-[#1F3045] shrink-0">
                    <div className="shrink-0">
                      <GotiAnimated
                        animation={accuracyScore >= 80 ? "celebrate" : accuracyScore >= 50 ? "pointing" : "thinking"}
                        size={54}
                        className="shrink-0"
                      />
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-[#9FB3C6] uppercase tracking-wider block">ACURÁCIA DIAGNÓSTICA</span>
                      <span className="text-2xl sm:text-3xl font-black text-[#FFC247] leading-none">{accuracyScore}%</span>
                      <span className="text-[10px] font-bold text-[#9FB3C6] block mt-1">
                        {totalCorrect} de {questionsList.length} acertos
                      </span>
                    </div>
                  </div>
                </div>

                {/* Desconstrução das Questões Clínicas (Página 13 do PDF) */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-[#20D5B5] uppercase tracking-wider">
                    DESCONSTRUÇÃO DAS {questionsList.length} QUESTÕES CLÍNICAS
                  </h3>

                  <div className="space-y-3">
                    {questionsList.map((q, idx) => {
                      const chosenOptId = userAnswers[idx];
                      const chosenOpt = q.options?.find(o => o.id === chosenOptId);
                      const isRight = chosenOpt?.isCorrect;
                      const correctOpt = q.options?.find(o => o.isCorrect);

                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-[#0E1722] border border-[#1F3045] space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-[#9FB3C6]">
                                QUESTÃO {idx + 1} · {q.category || "PRIORIZAÇÃO & CONDUTA IMEDIATA"}
                              </span>
                              <p className="text-xs sm:text-sm font-bold text-white mt-0.5">
                                {q.questionStem}
                              </p>
                            </div>
                            {isRight ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#20D5B5] bg-[#20D5B5]/15 border border-[#20D5B5]/30 px-2.5 py-0.5 rounded-full shrink-0">
                                <CheckCircle2 className="h-3.5 w-3.5 text-[#20D5B5]" /> ✓ Acertou (+100 PE)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F0645F] bg-[#F0645F]/15 border border-[#F0645F]/30 px-2.5 py-0.5 rounded-full shrink-0">
                                <AlertCircle className="h-3.5 w-3.5 text-[#F0645F]" /> ✕ Revisar distrator
                              </span>
                            )}
                          </div>

                          {/* Sua Conduta & Justificativa */}
                          <div className="text-xs bg-[#131F2E] p-3 rounded-xl border border-[#1F3045] space-y-1.5">
                            <div>
                              <strong className="text-white">Sua conduta ({chosenOpt?.id || "—"}):</strong>{" "}
                              <span className={isRight ? "text-[#20D5B5] font-semibold" : "text-[#F0645F] font-semibold"}>
                                {chosenOpt?.title || "Não respondida"}
                              </span>
                            </div>
                            {isRight ? (
                              <p className="text-[11px] text-[#9FB3C6] leading-relaxed">
                                <strong className="text-white">Justificativa baseada em evidências:</strong> {chosenOpt?.whyCorrect}
                              </p>
                            ) : (
                              <div className="space-y-1 text-[11px] leading-relaxed">
                                <p className="text-[#F0645F]">
                                  <strong className="text-white">Armadilha do distrator:</strong> {chosenOpt?.whyDistractor}
                                </p>
                                {correctOpt && (
                                  <p className="text-[#20D5B5] pt-1 border-t border-[#1F3045]">
                                    <strong className="text-white">Conduta correta ({correctOpt.id}):</strong> {correctOpt.title} — {correctOpt.whyCorrect}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Botão de Ação Central 3D (Página 13 do PDF) */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleLaunchRandomNewCase}
                    className="w-full py-3.5 rounded-2xl bg-[#20D5B5] hover:bg-[#1AD1B0] text-[#0B131D] font-black text-sm tracking-wide shadow-[0_4px_0_0_#148A76] active:translate-y-1 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Novo caso</span>
                  </button>
                </div>
              </div>
            ) : (
              activeQuestion && (
                <div className="bg-[#131F2E] rounded-3xl border border-[#1F3045] p-5 sm:p-7 shadow-xs space-y-5">
                  <div className="border-b border-[#1F3045] pb-3">
                    <span className="text-xs font-bold text-[#9FB3C6]">
                      Questão {currentQuestionIndex + 1} de {questionsList.length} · {activeQuestion.category}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white mt-2 leading-relaxed">
                      {activeQuestion.questionStem}
                    </h3>
                  </div>

                  {/* Dica da Questão */}
                  {isTipRevealed && (
                    <div className="p-3.5 rounded-2xl bg-[#FFC247]/10 border border-[#FFC247]/30 text-xs text-[#EAF2F8] space-y-1 animate-in fade-in">
                      <span className="font-bold flex items-center gap-1 text-[#FFC247]">
                        <Lightbulb className="h-4 w-4" /> Dica do Goti:
                      </span>
                      <p className="leading-relaxed">{activeQuestion.attendingTip}</p>
                    </div>
                  )}

                  {/* Alternativas A, B, C, D (Página 12 do PDF) */}
                  <div className="space-y-3 pt-1">
                    {activeQuestion.options?.map((option) => {
                      const isSelected = activeSelectedOption === option.id;
                      const showFeedback = isActiveSubmitted;
                      
                      let containerStyle = "bg-[#0E1722] border-[#1F3045] hover:border-[#20D5B5]/50 text-[#EAF2F8]";
                      let badgeStyle = "bg-[#16222E] border-[#1F3045] text-[#9FB3C6]";

                      if (isSelected && !showFeedback) {
                        containerStyle = "bg-[#0E1722] border-2 border-[#20D5B5] text-white";
                        badgeStyle = "bg-[#20D5B5] border-[#20D5B5] text-[#0B131D]";
                      }

                      if (showFeedback) {
                        if (option.isCorrect) {
                          containerStyle = "bg-[#20D5B5]/10 border-2 border-[#20D5B5] text-white";
                          badgeStyle = "bg-[#20D5B5] border-[#20D5B5] text-[#0B131D]";
                        } else if (isSelected && !option.isCorrect) {
                          containerStyle = "bg-[#F0645F]/10 border-2 border-[#F0645F] text-white";
                          badgeStyle = "bg-[#F0645F] border-[#F0645F] text-white";
                        } else {
                          containerStyle = "bg-[#0E1722]/50 border-[#1F3045] text-[#9FB3C6] opacity-60";
                          badgeStyle = "bg-[#16222E] border-[#1F3045] text-[#9FB3C6]";
                        }
                      }

                      return (
                        <div
                          key={option.id}
                          onClick={() => handleSelectOption(option.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer ${containerStyle}`}
                        >
                          <div className="flex items-start gap-3.5">
                            <span className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-black shrink-0 transition-colors ${badgeStyle}`}>
                              {option.id}
                            </span>
                            <div className="space-y-1 flex-1">
                              <p className="text-xs sm:text-sm font-semibold leading-relaxed">
                                {option.title}
                              </p>

                              {/* ANÁLISE FORMATIVA PÓS-SUBMISSÃO */}
                              {showFeedback && (
                                <div className="mt-2.5 pt-2.5 border-t border-[#1F3045] text-xs space-y-1 animate-in fade-in">
                                  {option.isCorrect ? (
                                    <div className="text-[#20D5B5]">
                                      <span className="font-bold flex items-center gap-1">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Por que esta conduta é a correta?
                                      </span>
                                      <p className="mt-0.5 leading-relaxed text-[#EAF2F8]">{option.whyCorrect}</p>
                                    </div>
                                  ) : (
                                    <div className="text-[#F0645F]">
                                      <span className="font-bold flex items-center gap-1">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        Análise do Distrator:
                                      </span>
                                      <p className="mt-0.5 leading-relaxed text-[#9FB3C6]">{option.whyDistractor}</p>
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

                  {/* AÇÕES DA QUESTÃO ATIVA & NAVEGAÇÃO NA BATERIA (Página 12 do PDF) */}
                  <div className="pt-3 border-t border-[#1F3045] flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleToggleTip}
                      className="rounded-xl border border-[#1F3045] bg-[#0E1722] hover:bg-[#16222E] text-[#FFC247] px-4 py-2.5 text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <span>▲ Dica</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {!isActiveSubmitted ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (!activeSelectedOption) {
                              alert("Por favor, selecione uma das alternativas antes de avançar.");
                              return;
                            }
                            handleSubmitCurrentAnswer();
                          }}
                          disabled={!activeSelectedOption}
                          className="rounded-xl bg-[#20D5B5] hover:bg-[#1AD1B0] text-[#0B131D] text-xs px-6 py-2.5 font-black shadow-[0_3px_0_0_#148A76] active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Verificar
                        </button>
                      ) : currentQuestionIndex < questionsList.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => setCurrentQuestionIndex((prev) => Math.min(questionsList.length - 1, prev + 1))}
                          className="rounded-xl bg-[#20D5B5] hover:bg-[#1AD1B0] text-[#0B131D] text-xs px-6 py-2.5 font-black shadow-[0_3px_0_0_#148A76] active:translate-y-1 transition-all flex items-center gap-1.5"
                        >
                          <span>Próxima questão</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        allQuestionsAnswered && (
                          <button
                            type="button"
                            onClick={() => setViewingConclusion(true)}
                            className="rounded-xl bg-[#20D5B5] hover:bg-[#1AD1B0] text-[#0B131D] text-xs px-6 py-2.5 font-black shadow-[0_3px_0_0_#148A76] active:translate-y-1 transition-all flex items-center gap-1.5"
                          >
                            <Award className="h-3.5 w-3.5" />
                            <span>Ver Conclusão ({accuracyScore}%)</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Modal Unificado de Histórico de Casos Clínicos (Exclusivo para Montador de Casos) */}
        <CaseHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          onResumeActivity={handleResumeActivity}
          defaultModuleFilter="case_builder"
          lockModuleFilter={true}
          title="Histórico de Casos Montados"
        />
      </main>

      <StudentFooter />
      <MobileBottomDock />
    </div>
  );
}
