import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  BookOpen,
  AlertCircle,
  Lightbulb,
  Radio,
  Check,
  Volume2,
  Loader2,
  ChevronDown,
  Shuffle,
  ArrowRightLeft,
  History,
  BookmarkPlus,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import StudentHeader from "@/components/StudentHeader";
import StudentFooter from "@/components/StudentFooter";
import { useAuth } from "@/lib/AuthContext";
import { evaluateSbarHandoff } from "@/services/sbarTutorService";
import { audioTranscriptionService } from "@/services/audioTranscriptionService";
import { evaluateSbarChecklists } from "@/lib/sbarSpeechMatcher";
import CaseHistoryModal from "@/components/history/CaseHistoryModal";
import { clinicalHistoryService, MODULE_TYPES } from "@/services/clinicalHistoryService";
import GotiAnimated from "@/components/mascot/GotiAnimated";
import GotiEvaluationModal from "@/components/mascot/GotiEvaluationModal";
import { PRESET_HANDOFF_SCENARIOS } from "@/data/sbarHandoffScenarios";
import MobileBottomDock from "@/components/mobile/MobileBottomDock";

export default function SbarHandoffLab() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const passedCase = location.state?.caseData;

  const [viewMode, setViewMode] = useState(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("tab") || params.get("mode") || passedCase) return "workspace";
    return "choose";
  });

  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get("tab") || "guided";
  }); // "guided" | "free_voice" | "confirm" | "debriefing"
  const [activeGuidedStep, setActiveGuidedStep] = useState(0); // 0: S, 1: B, 2: A, 3: R

  // Histórico & Cronômetro de Atividade SBAR
  const [currentActivityId, setCurrentActivityId] = useState(null);
  const [activitySeconds, setActivitySeconds] = useState(0);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get("action");
    const tab = params.get("tab");
    if (action === "review" || action === "continue" || action === "history" || tab === "debriefing") {
      setIsHistoryOpen(true);
    }
  }, [location.search]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActivitySeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  function handleSaveDraft() {
    const filledCount = [sbarData.situation, sbarData.background, sbarData.assessment, sbarData.recommendation].filter(Boolean).length;
    const progress = Math.round((filledCount / 4) * 100);
    const draft = clinicalHistoryService.saveDraft({
      id: currentActivityId,
      moduleType: MODULE_TYPES.SBAR,
      title: `Passagem SBAR: ${currentCase?.title || "Caso Clínico"}`,
      patientInfo: `${currentCase?.name || "Paciente"} (${currentCase?.age || "?"}a) • ${currentCase?.sector || "Enfermaria"}`,
      progress,
      durationSeconds: activitySeconds,
      step: activeGuidedStep,
      formData: { sbarData, currentCase, activeTab }
    });
    setCurrentActivityId(draft.id);
    setToastMessage("Rascunho SBAR salvo no Histórico com sucesso!");
    setTimeout(() => setToastMessage(""), 3000);
  }

  function handleResumeActivity(item) {
    if (item?.formData) {
      if (item.formData.sbarData) setSbarData(item.formData.sbarData);
      if (item.formData.currentCase) setCurrentCase(item.formData.currentCase);
      if (item.formData.activeTab) setActiveTab(item.formData.activeTab);
      if (item.durationSeconds) setActivitySeconds(item.durationSeconds);
    }
    if (item?.evaluation) {
      setTutorEvaluation(item.evaluation);
      setActiveTab("debriefing");
    }
    setCurrentActivityId(item.id);
    setSubmissionSuccess(item.status === "concluido" || item.status === "completed");
    setViewMode("workspace");
    setIsHistoryOpen(false);
  }

  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  const [currentCase, setCurrentCase] = useState(() => {
    return passedCase || PRESET_HANDOFF_SCENARIOS[0];
  });

  const [sbarData, setSbarData] = useState({
    situation: "",
    background: "",
    assessment: "",
    recommendation: ""
  });

  // Checklists Pedagógicos Interativos por Pilar
  const [checklists, setChecklists] = useState({
    situation: { bed: false, id: false, reason: false },
    background: { allergy: false, comorbidities: false, meds: false },
    assessment: { vitals: false, sato2: false, exam: false },
    recommendation: { time: false, meds: false, monitoring: false }
  });

  // Reconhecimento de Voz Dual-Engine (Web Speech API em tempo real + MediaRecorder Fallback com IA)
  const [isListening, setIsListening] = useState(false);
  const [voiceStarting, setVoiceStarting] = useState(false);
  const [activeListeningField, setActiveListeningField] = useState(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [isTranscribingWithAi, setIsTranscribingWithAi] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [processingField, setProcessingField] = useState(null);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const lastVoiceInputLenRef = useRef(0);
  const isListeningRef = useRef(false);
  const interimTranscriptRef = useRef("");

  // Estados de Avaliação
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [tutorEvaluation, setTutorEvaluation] = useState(null);
  const [studentReflections, setStudentReflections] = useState({});
  const [isSavingReflections, setIsSavingReflections] = useState(false);
  const [reflectionsFeedback, setReflectionsFeedback] = useState(null);
  const [showGotiEvaluationModal, setShowGotiEvaluationModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showGoldComparison, setShowGoldComparison] = useState(false);

  useEffect(() => {
    if (passedCase) {
      setCurrentCase(passedCase);
    }
  }, [passedCase]);

  // Limpeza de recursos de áudio ao desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
        mediaRecorderRef.current = null;
      }
      if (streamRef.current) {
        try {
          streamRef.current.getTracks().forEach((t) => t.stop());
        } catch {}
        streamRef.current = null;
      }
    };
  }, []);

  function formatSeconds(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  // Tabela de diretrizes do Goti para orientar o estudante quando clicar em um item de checklist não atendido
  const CHECKLIST_GUIDANCE = {
    situation: {
      bed: "Para validar Leito/Setor, informe o leito, enfermaria ou setor no texto da Situação (ex: 'Leito 12-A', 'Clínica Cirúrgica').",
      id: "Para validar Identificação, mencione o nome ou iniciais e a idade do paciente (ex: 'M.S.L., 58 anos').",
      reason: "Para validar Motivo da Admissão, cite o diagnóstico ou motivo de internação (ex: '1º DPO de colectomia', 'diverticulite')."
    },
    background: {
      allergy: "Para validar Alergias (Meta 2), declare expressamente as alergias conhecidas ou que o paciente 'nega alergias'.",
      comorbidities: "Para validar Comorbidades, informe doenças prévias ou cirurgias anteriores (ex: 'hipertenso', 'diabetes').",
      meds: "Para validar Medicações Contínuas, cite os medicamentos habituais do paciente (ex: 'Losartana')."
    },
    assessment: {
      vitals: "Para validar Sinais Vitais, insira os valores de PA, FC, FR e Temperatura aferidos no plantão.",
      sato2: "Para validar Oxigenação, registre a saturação de O2 (ex: 'SatO2 98% em ar ambiente').",
      exam: "Para validar Exame Físico Dirigido, relate dados de palpação, ausculta, curativo cirúrgico ou débito de drenos."
    },
    recommendation: {
      time: "Para validar Horários/Aprazamento, especifique horários precisos para ações ou medicamentos (ex: 'às 20h', 'a cada 4 horas').",
      meds: "Para validar Medicações e Pendências, detalhe medicamentos prescritos a administrar ou pendências de exames.",
      monitoring: "Para validar Monitorização, descreva o balanço hídrico, vigilância de drenos ou parâmetros críticos a acompanhar."
    }
  };

  // Validação dinâmica rigorosa dos checklists baseada estritamente no texto digitado/falado
  useEffect(() => {
    const autoChecked = evaluateSbarChecklists(sbarData, currentCase);
    setChecklists(autoChecked);
  }, [sbarData, currentCase]);

  // Fornece feedback instrutivo do Goti sobre os itens do checklist, bloqueando marcação arbitrária sem texto
  function handleToggleChecklistItem(pillarKey, itemKey) {
    const currentChecked = evaluateSbarChecklists(sbarData, currentCase);
    const isDone = currentChecked[pillarKey]?.[itemKey];

    if (isDone) {
      setToastMessage("✨ Item já validado pelo Goti com base na redação do seu texto clínico!");
      setTimeout(() => setToastMessage(""), 3500);
      return;
    }

    const hint = CHECKLIST_GUIDANCE[pillarKey]?.[itemKey] || "Redija os dados objetivos deste item no campo do pilar para validação pelo Goti.";
    setToastMessage(`🩺 Goti orienta: ${hint}`);
    setTimeout(() => setToastMessage(""), 5500);
  }

  async function handleSaveStudentReflections() {
    const filledAnswers = Object.entries(studentReflections).filter(([_, val]) => val && val.trim().length > 0);
    if (filledAnswers.length === 0) {
      setToastMessage("🩺 Goti: Digite sua reflexão em ao menos uma pergunta antes de enviar!");
      setTimeout(() => setToastMessage(""), 4000);
      return;
    }

    setIsSavingReflections(true);
    try {
      if (currentActivityId) {
        clinicalHistoryService.updateActivity(currentActivityId, {
          studentReflections,
          reflectionsSubmittedAt: new Date().toISOString()
        });
      }

      await new Promise((r) => setTimeout(r, 600));

      setReflectionsFeedback({
        savedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        comment: "Excelente reflexão clínica! O Goti analisou suas justificativas: você demonstrou sólido compromisso com a continuidade da assistência, segurança do paciente e comunicação assertiva. Suas anotações foram registradas com sucesso no histórico acadêmico."
      });

      setToastMessage("🩺 Respostas reflexivas salvas no prontuário e auditadas pelo Goti!");
      setTimeout(() => setToastMessage(""), 4000);
    } catch (err) {
      console.warn("Erro ao salvar reflexões:", err);
      setToastMessage("Reflexões salvas localmente no prontuário.");
      setTimeout(() => setToastMessage(""), 3000);
    } finally {
      setIsSavingReflections(false);
    }
  }

  async function stopListening(fieldNameOverride = null) {
    const targetField = fieldNameOverride || activeListeningField;

    isListeningRef.current = false;

    // 1. Limpa o cronômetro visual
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // 2. Encerra a Web Speech API
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    // 3. Flush imediato de palavras intermediárias para não perder o fim da fala
    const pendingInterim = (interimTranscriptRef.current || "").trim();
    if (pendingInterim && targetField) {
      setSbarData((prev) => {
        const currentVal = prev[targetField] ? prev[targetField].trim() + " " : "";
        return {
          ...prev,
          [targetField]: currentVal + pendingInterim
        };
      });
    }
    interimTranscriptRef.current = "";

    // 4. Encerra o MediaRecorder e captura o blob binário gravado
    let recordedBlob = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        await new Promise((resolve) => {
          mediaRecorderRef.current.onstop = () => {
            if (audioChunksRef.current.length > 0) {
              recordedBlob = new Blob(audioChunksRef.current, {
                type: mediaRecorderRef.current.mimeType || "audio/webm"
              });
            }
            resolve();
          };
          mediaRecorderRef.current.stop();
        });
      } catch (e) {
        console.warn("Aviso ao encerrar MediaRecorder:", e);
      }
      mediaRecorderRef.current = null;
    }

    // 5. Desliga faixas de hardware do microfone
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((t) => t.stop());
      } catch {}
      streamRef.current = null;
    }

    setIsListening(false);
    setVoiceStarting(false);
    setInterimTranscript("");

    // 6. Ativa feedback visual de processamento se houver áudio a transcrever
    if (targetField) {
      setProcessingField(targetField);
      setIsProcessingAudio(true);
      setToastMessage(`Processando áudio para o pilar ${targetField.toUpperCase()}...`);
    }

    try {
      // Janela de estabilização de 400ms para capturar os últimos eventos assíncronos da fala
      await new Promise((resolve) => setTimeout(resolve, 400));

      const currentText = (sbarData[targetField] || "").trim();
      const textLenBefore = lastVoiceInputLenRef.current || 0;

      // Se a Web Speech já capturou novo conteúdo
      if (currentText.length > textLenBefore || pendingInterim.length > 0) {
        setToastMessage(`Transcrição do pilar ${targetField.toUpperCase()} concluída com sucesso!`);
        setTimeout(() => setToastMessage(""), 3000);
      } else if (recordedBlob && targetField && recordedBlob.size > 1500) {
        // Fallback com IA (Gemini / AssemblyAI) se a Web Speech não digitou texto
        setIsTranscribingWithAi(true);
        setToastMessage("Transcrevendo o áudio gravado em alta fidelidade...");
        const result = await audioTranscriptionService.transcribe(recordedBlob);
        if (result && result.text) {
          setSbarData((prev) => {
            const prevText = prev[targetField] ? prev[targetField].trim() + " " : "";
            return {
              ...prev,
              [targetField]: prevText + result.text.trim()
            };
          });
          setToastMessage(`Pilar ${targetField.toUpperCase()} transcrito com sucesso!`);
          setTimeout(() => setToastMessage(""), 3500);
        }
      } else if (recordedBlob && recordedBlob.size <= 1500) {
        setToastMessage("Áudio muito breve. Fale com naturalidade um pouco mais próximo ao microfone.");
        setTimeout(() => setToastMessage(""), 3000);
      }
    } catch (err) {
      console.warn("Aviso na transcrição de áudio:", err);
      const msg = err?.message || "Não foi possível transcrever o áudio automaticamente.";
      setVoiceError(msg);
      setToastMessage(msg);
      setTimeout(() => setToastMessage(""), 6000);
    } finally {
      setIsTranscribingWithAi(false);
      setIsProcessingAudio(false);
      setProcessingField(null);
      setActiveListeningField(null);
    }
  }

  async function toggleVoiceInput(fieldName) {
    setVoiceError("");

    // Se já estiver gravando neste mesmo campo, interrompe
    if ((isListening || voiceStarting) && activeListeningField === fieldName) {
      await stopListening(fieldName);
      setToastMessage("Ditado finalizado.");
      setTimeout(() => setToastMessage(""), 2500);
      return;
    }

    // Se estiver gravando em outro campo, fecha o anterior
    if (isListening || voiceStarting) {
      await stopListening();
    }

    // ZERO LATÊNCIA VISUAL: o botão muda IMEDIATAMENTE no clique
    setIsListening(true);
    setVoiceStarting(true);
    setActiveListeningField(fieldName);
    setRecordingSeconds(0);
    setInterimTranscript("");
    lastVoiceInputLenRef.current = (sbarData[fieldName] || "").length;

    // Inicia cronômetro visual imediatamente
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);

    // 1. Solicita e abre microfone com getUserMedia nativo do navegador
    let stream = null;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
      }
    } catch (err) {
      console.warn("getUserMedia falhou ou foi bloqueado:", err);
      const isDenied = err.name === "NotAllowedError" || err.name === "PermissionDeniedError";
      const msg = isDenied
        ? "Permissão de microfone negada. Clique no ícone de cadeado/configurações na barra de endereços para autorizar o microfone."
        : "Não foi possível conectar ao microfone. Verifique as conexões de áudio do dispositivo.";
      setVoiceError(msg);
      setToastMessage(msg);
      setTimeout(() => setToastMessage(""), 6000);
      if (timerRef.current) clearInterval(timerRef.current);
      setIsListening(false);
      setVoiceStarting(false);
      setActiveListeningField(null);
      return;
    }

    setVoiceStarting(false);

    // 2. Inicia MediaRecorder para garantia de contingência e fallback
    if (stream && typeof MediaRecorder !== "undefined") {
      try {
        audioChunksRef.current = [];
        const types = ["audio/webm", "audio/mp4", "audio/ogg"];
        const mimeType = types.find((t) => {
          try {
            return MediaRecorder.isTypeSupported?.(t);
          } catch {
            return false;
          }
        });
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        recorder.start(250);
        mediaRecorderRef.current = recorder;
      } catch (err) {
        console.warn("Falha ao inicializar MediaRecorder:", err);
      }
    }

    // 3. Dispara Web Speech API se disponível no navegador
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        isListeningRef.current = true;
        interimTranscriptRef.current = "";

        const rec = new SpeechRec();
        rec.lang = "pt-BR";
        rec.continuous = true;
        rec.interimResults = true;
        rec.maxAlternatives = 1;

        rec.onstart = () => {
          setToastMessage(`Microfone aberto para o pilar ${fieldName.toUpperCase()}! Fale com naturalidade...`);
          setTimeout(() => setToastMessage(""), 3000);
        };

        rec.onresult = (event) => {
          let finalTrans = "";
          let interimTrans = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const trans = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTrans += trans + " ";
            } else {
              interimTrans += trans;
            }
          }

          interimTranscriptRef.current = interimTrans;
          setInterimTranscript(interimTrans);

          if (finalTrans.trim()) {
            setSbarData((prev) => {
              const currentVal = prev[fieldName] ? prev[fieldName].trim() + " " : "";
              return {
                ...prev,
                [fieldName]: currentVal + finalTrans.trim()
              };
            });
          }
        };

        rec.onerror = (e) => {
          console.warn("[SpeechRecognition] Aviso:", e.error);
          if (e.error === "no-speech") {
            // Pausa natural do usuário ao respirar ou raciocinar - não interrompe
            return;
          }
          if (e.error === "not-allowed" || e.error === "permission-denied") {
            setVoiceError("Permissão de microfone negada nas configurações do navegador.");
            isListeningRef.current = false;
          } else if (e.error === "network") {
            setVoiceError("Conexão de voz do navegador oscilou. O áudio está sendo gravado e será processado pela IA ao parar.");
          }
        };

        rec.onend = () => {
          // Se o usuário ainda não encerrou conscientemente a escuta, reconecta automaticamente
          if (isListeningRef.current && recognitionRef.current) {
            try {
              rec.start();
            } catch (reErr) {
              console.debug("[SpeechRecognition] Auto-reconect silencioso:", reErr);
            }
          }
        };

        rec.start();
        recognitionRef.current = rec;
      } catch (err) {
        console.warn("[SpeechRecognition] Falha ao iniciar:", err);
      }
    } else {
      setToastMessage("Web Speech não disponível neste navegador. Gravando áudio para transcrição via IA...");
    }
  }

  function handleSelectScenario(idx) {
    if (isListening) stopListening();
    setActiveScenarioIdx(idx);
    setCurrentCase(PRESET_HANDOFF_SCENARIOS[idx]);
    setSbarData({ situation: "", background: "", assessment: "", recommendation: "" });
    setTutorEvaluation(null);
    setStudentReflections({});
    setActiveGuidedStep(0);
  }

  function handleGenerateRandomScenario() {
    if (isListening) stopListening();
    const availableIndices = PRESET_HANDOFF_SCENARIOS.map((_, i) => i).filter((i) => i !== activeScenarioIdx);
    const nextIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    handleSelectScenario(nextIdx);
    setToastMessage(`🎲 Novo caso sorteado: ${PRESET_HANDOFF_SCENARIOS[nextIdx].name} (${PRESET_HANDOFF_SCENARIOS[nextIdx].bed})`);
    setTimeout(() => setToastMessage(""), 3500);
  }

  function handleInsertGoldenExample() {
    if (currentCase?.goldenSbar) {
      setSbarData(currentCase.goldenSbar);
      setToastMessage("Exemplo Padrão Ouro inserido em todos os campos para análise didática!");
      setTimeout(() => setToastMessage(""), 3500);
    }
  }

  function handleInsertFieldExample(fieldKey) {
    if (currentCase?.goldenSbar?.[fieldKey]) {
      setSbarData((prev) => ({ ...prev, [fieldKey]: currentCase.goldenSbar[fieldKey] }));
      setToastMessage(`Exemplo inserido no campo ${fieldKey.toUpperCase()}!`);
      setTimeout(() => setToastMessage(""), 3000);
    }
  }

  function handleClearFields() {
    if (isListening) stopListening();
    setSbarData({ situation: "", background: "", assessment: "", recommendation: "" });
    setTutorEvaluation(null);
    setToastMessage("Campos limpos com sucesso.");
    setTimeout(() => setToastMessage(""), 2500);
  }

  async function handleEvaluateSbar() {
    if (isListening) stopListening();
    const isAnyFilled = sbarData.situation || sbarData.background || sbarData.assessment || sbarData.recommendation;
    if (!isAnyFilled) {
      alert("Por favor, preencha ao menos uma etapa do SBAR antes de enviar para a auditoria do Goti IA.");
      return;
    }

    setIsEvaluating(true);
    try {
      const evaluation = await evaluateSbarHandoff({
        caseData: currentCase,
        sbar: sbarData
      });
      setTutorEvaluation(evaluation);
      setActiveTab("debriefing");
      setShowGotiEvaluationModal(true);

      // Registrar atividade concluída com tempo e score no histórico
      try {
        const submittedItem = clinicalHistoryService.submitActivity({
          id: currentActivityId,
          moduleType: MODULE_TYPES.SBAR,
          title: `Passagem SBAR: ${currentCase?.title || "Caso Clínico"}`,
          patientInfo: `${currentCase?.name || "Paciente"} (${currentCase?.age || "?"}a) • ${currentCase?.sector || "Enfermaria"}`,
          durationSeconds: activitySeconds,
          score: evaluation?.safetyScore || 100,
          evaluation: evaluation,
          formData: { sbarData, currentCase }
        });
        setCurrentActivityId(submittedItem.id);
        setSubmissionSuccess(true);
      } catch (histErr) {
        console.warn("[SbarHandoffLab] Falha ao registrar histórico:", histErr);
      }

      window.scrollTo({ top: 350, behavior: "smooth" });
    } catch (err) {
      console.error("[SbarHandoffLab] Erro ao avaliar:", err);
    } finally {
      setIsEvaluating(false);
    }
  }

  // Metadados pedagógicos estruturados por pilar SBAR
  const guidedStepsMeta = [
    {
      key: "situation",
      letter: "S",
      title: "Situação (Situation)",
      subtitle: "A regra de ouro dos primeiros 20 segundos",
      accentBg: "bg-indigo-700 text-white",
      badgeColor: "bg-indigo-50 text-indigo-800 border-indigo-200",
      activeBorder: "border-indigo-600 ring-indigo-600/20",
      goal: "Apresente quem é o paciente, em qual leito ele se encontra e qual o motivo imediato do contato ou pós-operatório.",
      badExample: "O paciente do 12 tá meio mal, queixando de dor desde ontem e parece que fez cirurgia.",
      badReason: "Falta nome, idade, procedimento específico e leito exato. A equipe que assume não tem ideia de qual conduta urgente tomar.",
      goodExample: currentCase?.goldenSbar?.situation || 'Paciente M.S.L., 58 anos, no Leito 12-A da Clínica Cirúrgica, no 1º DPO de colectomia parcial por diverticulite.',
      goodReason: "Identificação completa em 15 segundos: nome/iniciais, idade, leito, enfermaria e diagnóstico cirúrgico.",
      checklistItems: [
        { key: "bed", label: "Número do Leito / Enfermaria citado", done: checklists.situation.bed },
        { key: "id", label: "Iniciais do paciente e idade", done: checklists.situation.id },
        { key: "reason", label: "Motivo da admissão ou procedimento cirúrgico", done: checklists.situation.reason }
      ]
    },
    {
      key: "background",
      letter: "B",
      title: "Breve Histórico (Background)",
      subtitle: "O escudo contra eventos sentinela e erros fatais",
      accentBg: "bg-amber-700 text-white",
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
      activeBorder: "border-amber-600 ring-amber-600/20",
      goal: "Forneça o contexto clínico indispensável: comorbidades ativas, cirurgias anteriores e a CONFERÊNCIA OBRIGATÓRIA DE ALERGIAS.",
      badExample: "Ele toma remédio de pressão e acho que não tem alergia a nada grave.",
      badReason: "Omissão de alergias medicamentosas e medicações de uso contínuo pode causar choque anafilático ou crise hipertensiva.",
      goodExample: currentCase?.goldenSbar?.background || 'Hipertenso controlado com Losartana. Nega alergias medicamentosas e cirurgias abdominais prévias.',
      goodReason: "Confirma categoricamente a ausência/presença de alergias e comorbidades de base com drogas em uso.",
      checklistItems: [
        { key: "allergy", label: "Status alérgico expressamente confirmado (CRÍTICO)", done: checklists.background.allergy },
        { key: "comorbidities", label: "Comorbidades relevantes de base (HAS, DM, ICC)", done: checklists.background.comorbidities },
        { key: "meds", label: "Medicações contínuas de uso domiciliar", done: checklists.background.meds }
      ]
    },
    {
      key: "assessment",
      letter: "A",
      title: "Avaliação Atual (Assessment)",
      subtitle: "A regra do dado objetivo: 'Nunca diga está estável'",
      accentBg: "bg-rose-700 text-white",
      badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
      activeBorder: "border-rose-600 ring-rose-600/20",
      goal: "Comunique parâmetros vitais numéricos (PA, FC, SatO2, Tax), escala de dor EVA e achados de drenos, curativos ou sensório.",
      badExample: "Os sinais vitais tão bons, o dreno tá saindo um líquido e ele tá com um pouco de dor.",
      badReason: "'Sinais bons' não é dado clínico. Qual é a PA? Qual é o débito e aspecto do dreno em mL? Qual a nota da dor?",
      goodExample: currentCase?.goldenSbar?.assessment || 'PA 115/72 mmHg, FC 84 bpm, SatO2 98%. Dor EVA 4/10 em incisão. Dreno de Portovac com débito serossanguinolento de 120 mL em 12h.',
      goodReason: "Todos os dados são numéricos, quantificados e objetivos. A equipe entrante pode comparar imediatamente se o paciente piorar.",
      checklistItems: [
        { key: "vitals", label: "Pressão Arterial (PA) e Frequência Cardíaca (FC) numéricas", done: checklists.assessment.vitals },
        { key: "sato2", label: "Oximetria de pulso (SatO2) e suporte de O2", done: checklists.assessment.sato2 },
        { key: "exam", label: "Avaliação da dor (EVA), débitos de drenos e curativos", done: checklists.assessment.exam }
      ]
    },
    {
      key: "recommendation",
      letter: "R",
      title: "Recomendação (Recommendation)",
      subtitle: "A liderança da enfermagem na continuidade do cuidado",
      accentBg: "bg-teal-700 text-white",
      badgeColor: "bg-teal-50 text-teal-800 border-teal-200",
      activeBorder: "border-teal-600 ring-teal-600/20",
      goal: "Defina claramente as pendências, cuidados prioritários, horários de medicações e exames que o próximo plantão deve fiscalizar.",
      badExample: "Fica de olho nele na madrugada e qualquer coisa chama o plantonista.",
      badReason: "Falta aprazamento, plano terapêutico, horário de analgesia de resgate e sinais específicos para acionar o médico.",
      goodExample: currentCase?.goldenSbar?.recommendation || 'Vigiar aspecto e débito do dreno a cada 4 horas; administrar analgesia prescrita às 20h; checar resultado do hematócrito de controle.',
      goodReason: "Ações claras, aprazadas por horário e com metas definidas para proteger o paciente no turno da noite.",
      checklistItems: [
        { key: "time", label: "Aprazamentos e horários definidos para ações", done: checklists.recommendation.time },
        { key: "meds", label: "Medicações prescritas e pendentes para o plantão", done: checklists.recommendation.meds },
        { key: "monitoring", label: "Vigilância de drenos, balanço hídrico ou exames laboratoriais", done: checklists.recommendation.monitoring }
      ]
    }
  ];

  const currentGuided = guidedStepsMeta[activeGuidedStep];
  const currentCheckedCount = currentGuided.checklistItems.filter((i) => i.done).length;
  const currentCheckedPercent = Math.round((currentCheckedCount / currentGuided.checklistItems.length) * 100);

  return (
    <div className="min-h-screen bg-[#0B131D] text-[#EAF2F8] flex flex-col pb-28 md:pb-8">
      <StudentHeader activeTab="sbar" />

      <main className="flex-1 mx-auto max-w-5xl w-full px-4 sm:px-6 py-6 space-y-6">
        {/* ======================================================== */}
        {/* MODO 0: ESCOLHA INICIAL LIMPA DO SBAR (IGUAL AO MONTAR) */}
        {/* ======================================================== */}
        {viewMode === "choose" ? (
          <div className="max-w-md mx-auto pt-4 pb-8 animate-in fade-in">
            {/* Modal / Card Principal 1:1 com Página 14 do PDF */}
            <div className="bg-[#131F2E] rounded-3xl border border-[#1F3045] p-5 sm:p-6 shadow-2xl space-y-5">
              {/* Cabeçalho do Card */}
              <div className="flex items-start justify-between gap-3 border-b border-[#1F3045] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#20D5B5]/15 border border-[#20D5B5]/30 flex items-center justify-center text-[#20D5B5] shrink-0">
                    <ArrowRightLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Passagem de Plantão SBAR</h3>
                    <span className="inline-block text-[10px] font-bold text-[#20D5B5] bg-[#20D5B5]/15 border border-[#20D5B5]/30 px-2 py-0.5 rounded-full mt-1">
                      Meta 2 OMS · SBAR Multimodal
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="w-8 h-8 rounded-full border border-[#1F3045] bg-[#0E1722] hover:bg-[#16222E] text-[#9FB3C6] hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* DIRETRIZES DO GOTI (Página 14 do PDF) */}
              <div className="p-4 rounded-2xl bg-[#0E1722] border border-[#1F3045] space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#20D5B5] block">
                  DIRETRIZES DO GOTI
                </span>
                <div className="flex items-start gap-3">
                  <div className="shrink-0 -mt-1">
                    <GotiAnimated animation="thinking" size={42} />
                  </div>
                  <p className="text-xs text-[#EAF2F8] leading-relaxed italic">
                    “A passagem de plantão estruturada SBAR (Situação, Breve Histórico, Avaliação e Recomendação) evita 80% das falhas de comunicação. Como deseja treinar hoje?”
                  </p>
                </div>
              </div>

              {/* SELECIONE COMO DESEJA PRATICAR */}
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#9FB3C6] block">
                  SELECIONE COMO DESEJA PRATICAR:
                </span>

                {/* Card 1: Passagem por Áudio (Voz) */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("free_voice");
                    setViewMode("workspace");
                  }}
                  className="w-full p-4 rounded-2xl bg-[#0B131D] border-2 border-[#20D5B5] text-left flex items-center justify-between group transition hover:bg-[#131F2E]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#20D5B5]/10 border border-[#20D5B5]/30 flex items-center justify-center text-[#20D5B5] shrink-0">
                      <Mic className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">Passagem por Áudio (Voz)</h4>
                      <p className="text-[11px] text-[#9FB3C6]">Treine falando ao microfone com transcrição e checagem de itens</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#20D5B5] group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Card 2: Passagem Estruturada (Texto) */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("guided");
                    setViewMode("workspace");
                  }}
                  className="w-full p-4 rounded-2xl bg-[#0B131D] border border-[#1F3045] hover:border-[#20D5B5]/50 text-left flex items-center justify-between group transition hover:bg-[#131F2E]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#131F2E] border border-[#1F3045] flex items-center justify-center text-[#20D5B5] shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">Passagem Estruturada (Texto)</h4>
                      <p className="text-[11px] text-[#9FB3C6]">Preencha os 4 pilares guiados passo a passo</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#9FB3C6] group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>

                {/* Card 3: Simulação Rápida Beira-Leito */}
                <button
                  type="button"
                  onClick={() => {
                    const criticalCase = PRESET_HANDOFF_SCENARIOS.find((c) => c.id === "sepse_urinaria") || PRESET_HANDOFF_SCENARIOS[1];
                    setCurrentCase(criticalCase);
                    setActiveTab("free_voice");
                    setViewMode("workspace");
                    setToastMessage("Simulação Beira-Leito iniciada! Priorize os dados de emergência do paciente.");
                  }}
                  className="w-full p-4 rounded-2xl bg-[#0B131D] border border-[#1F3045] hover:border-[#20D5B5]/50 text-left flex items-center justify-between group transition hover:bg-[#131F2E]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#131F2E] border border-[#1F3045] flex items-center justify-center text-[#20D5B5] shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">Simulação Rápida Beira-Leito</h4>
                      <p className="text-[11px] text-[#9FB3C6]">Caso crítico com contagem regressiva de 2 minutos para priorização</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#9FB3C6] group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>

                {/* Card 4: Exercícios Anteriores & Revisão */}
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(true)}
                  className="w-full p-4 rounded-2xl bg-[#0B131D] border border-[#1F3045] hover:border-[#20D5B5]/50 text-left flex items-center justify-between group transition hover:bg-[#131F2E]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#131F2E] border border-[#1F3045] flex items-center justify-center text-[#20D5B5] shrink-0">
                      <History className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">Exercícios Anteriores & Revisão</h4>
                      <p className="text-[11px] text-[#9FB3C6]">Consultar histórico de passagens de plantão e debriefings</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#9FB3C6] group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Barra Superior Limpa e Funcional (Página 15 do PDF) */}
            <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] px-5 py-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setViewMode("choose")}
                  className="rounded-xl text-xs font-bold text-[#20D5B5] hover:bg-[#16222E] h-8 px-2.5 -ml-1 flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Modos SBAR
                </button>
                <div className="h-4 w-px bg-[#1F3045] hidden sm:block" />
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Passagem de Plantão SBAR
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#20D5B5]/15 text-[#20D5B5] border border-[#20D5B5]/30">
                  Meta 2 OMS · COFEN 736/2024
                </span>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-xl bg-[#0E1722] text-[#9FB3C6] border border-[#1F3045]">
                  <Clock className="h-3.5 w-3.5 text-[#20D5B5]" />
                  <span>{clinicalHistoryService.formatDuration(activitySeconds)}</span>
                </span>

                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(true)}
                  className="rounded-xl border border-[#1F3045] bg-[#0E1722] text-[#9FB3C6] hover:text-white hover:bg-[#16222E] text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 transition-all"
                >
                  <History className="h-3.5 w-3.5 text-[#20D5B5]" />
                  <span>Histórico SBAR</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="rounded-xl border border-[#1F3045] bg-[#0E1722] text-[#9FB3C6] hover:text-white hover:bg-[#16222E] text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 transition-all"
                >
                  <BookmarkPlus className="h-3.5 w-3.5 text-[#FFC247]" />
                  <span className="hidden sm:inline">Salvar</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearFields}
                  className="rounded-xl text-[#9FB3C6] hover:text-white px-2 py-1.5 text-xs transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Notificação Toast */}
            {toastMessage && (
              <div className="p-3.5 rounded-2xl bg-[#16222E] border border-[#20D5B5]/40 text-white text-xs flex items-center justify-between gap-2 animate-in fade-in shadow-md">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#20D5B5] shrink-0" />
                  <span className="font-bold">{toastMessage}</span>
                </div>
                {isListening && (
                  <span className="flex h-2 w-2 rounded-full bg-[#F0645F] animate-ping shrink-0" />
                )}
              </div>
            )}

            {/* Alerta de Erro de Microfone */}
            {voiceError && (
              <div className="p-3.5 rounded-2xl bg-[#F0645F]/15 border border-[#F0645F]/30 text-white text-xs flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="h-4 w-4 text-[#F0645F] shrink-0" />
                <div className="flex-1 font-medium">{voiceError}</div>
                <button
                  onClick={() => setVoiceError("")}
                  className="text-xs font-bold text-[#F0645F] hover:underline shrink-0"
                >
                  Fechar
                </button>
              </div>
            )}

            {/* Painel do Caso Clínico Ativo (Página 15 do PDF) */}
            <div className="bg-[#131F2E] rounded-3xl border border-[#1F3045] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1F3045]">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-[#20D5B5] uppercase tracking-wider">
                    CASO SIMULADO À BEIRA-LEITO · {currentCase.sector || "Clínica Cirúrgica"} · {currentCase.bed || "Leito 12-A"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateRandomScenario}
                  className="rounded-xl border border-[#1F3045] bg-[#0E1722] hover:bg-[#16222E] text-[#20D5B5] text-xs font-bold px-3 py-1.5 flex items-center gap-1.5 transition-all self-start sm:self-auto"
                >
                  <Shuffle className="h-3.5 w-3.5" />
                  <span>Sortear Novo Caso</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <h2 className="text-base sm:text-lg font-black text-white">
                    {currentCase.name || "M.S.L."} ({currentCase.age || 58}a)
                  </h2>
                  <p className="text-xs text-[#20D5B5] font-semibold">
                    {currentCase.diagnosis || currentCase.title || "Pós-operatório imediato de colectomia por diverticulite aguda"}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="p-2.5 rounded-xl bg-[#0E1722] border border-[#1F3045] text-center min-w-[90px]">
                    <span className="text-[10px] text-[#9FB3C6] font-bold block">PA</span>
                    <strong className="text-xs sm:text-sm font-black text-white">{currentCase.vitals?.pa_sistolica || 115}/{currentCase.vitals?.pa_diastolica || 72} <span className="text-[9px] text-[#9FB3C6]">mmHg</span></strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0E1722] border border-[#1F3045] text-center min-w-[70px]">
                    <span className="text-[10px] text-[#9FB3C6] font-bold block">SatO₂</span>
                    <strong className="text-xs sm:text-sm font-black text-white">{currentCase.vitals?.sat || 98} <span className="text-[9px] text-[#9FB3C6]">%</span></strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0E1722] border border-[#1F3045] text-center min-w-[70px]">
                    <span className="text-[10px] text-[#9FB3C6] font-bold block">FC</span>
                    <strong className="text-xs sm:text-sm font-black text-white">{currentCase.vitals?.fc || 84} <span className="text-[9px] text-[#9FB3C6]">bpm</span></strong>
                  </div>
                </div>
              </div>
            </div>

            {/* NAVEGAÇÃO DE MODOS PEDAGÓGICOS (Página 15 do PDF) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar select-none text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab("guided")}
                className={`px-4 py-2 rounded-xl border whitespace-nowrap transition-all ${
                  activeTab === "guided"
                    ? "bg-[#20D5B5] text-[#0B131D] font-black shadow-[0_2px_0_0_#148A76]"
                    : "bg-[#0E1722] border-[#1F3045] text-[#9FB3C6] hover:text-white"
                }`}
              >
                1. Trilha Guiada
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("free_voice")}
                className={`px-4 py-2 rounded-xl border whitespace-nowrap transition-all ${
                  activeTab === "free_voice"
                    ? "bg-[#20D5B5] text-[#0B131D] font-black shadow-[0_2px_0_0_#148A76]"
                    : "bg-[#0E1722] border-[#1F3045] text-[#9FB3C6] hover:text-white"
                }`}
              >
                2. Simulação Rápida (Voz & Timer)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("confirm")}
                className={`px-4 py-2 rounded-xl border whitespace-nowrap transition-all ${
                  activeTab === "confirm"
                    ? "bg-[#20D5B5] text-[#0B131D] font-black shadow-[0_2px_0_0_#148A76]"
                    : "bg-[#0E1722] border-[#1F3045] text-[#9FB3C6] hover:text-white"
                }`}
              >
                3. Resumo & Confirmação
              </button>

              {tutorEvaluation && (
                <button
                  type="button"
                  onClick={() => setActiveTab("debriefing")}
                  className={`px-4 py-2 rounded-xl border whitespace-nowrap transition-all ${
                    activeTab === "debriefing"
                      ? "bg-[#20D5B5] text-[#0B131D] font-black shadow-[0_2px_0_0_#148A76]"
                      : "bg-[#0E1722] border-[#1F3045] text-[#9FB3C6] hover:text-white"
                  }`}
                >
                  4. Conclusão & Parecer Goti ({tutorEvaluation.safetyScore}%)
                </button>
              )}
            </div>

        {/* CONTEÚDO DA ABA 1: TRILHA GUIADA PASSO A PASSO (Página 15 do PDF) */}
        {activeTab === "guided" && (
          <div className="space-y-5">
            {/* Stepper Visual dos 4 Passos do SBAR (S, B, A, R) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {guidedStepsMeta.map((step, idx) => {
                const isCurrent = activeGuidedStep === idx;
                const hasContent = Boolean(sbarData[step.key]?.trim());
                return (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => setActiveGuidedStep(idx)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      isCurrent
                        ? "bg-[#16222E] border-2 border-[#20D5B5] shadow-xs"
                        : "bg-[#0E1722] border-[#1F3045] hover:border-[#20D5B5]/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-xl text-xs font-black ${
                          isCurrent
                            ? "bg-[#20D5B5] text-[#0B131D]"
                            : "bg-[#131F2E] text-[#9FB3C6] border border-[#1F3045]"
                        }`}
                      >
                        {step.letter}
                      </span>
                      {hasContent && (
                        <CheckCircle2 className="h-4 w-4 text-[#20D5B5]" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-white block mt-2.5 truncate">
                      {step.title}
                    </span>
                    <span className="text-[10px] text-[#9FB3C6] block truncate mt-0.5">
                      {step.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Painel Central de Ensino e Formulação (Página 15 do PDF) */}
            <div className="bg-[#131F2E] rounded-3xl border border-[#1F3045] p-5 sm:p-6 shadow-xs space-y-5">
              {/* Topo do Passo */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F3045] pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#20D5B5]/15 text-[#20D5B5] border border-[#20D5B5]/30">
                      Passo {activeGuidedStep + 1} de 4 · Pilar {currentGuided.letter} · Checklist {currentCheckedCount}/3 ({currentCheckedPercent}%)
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    {currentGuided.title} — {currentGuided.subtitle}
                  </h3>
                  <p className="text-xs text-[#9FB3C6] max-w-2xl leading-relaxed">
                    {currentGuided.goal}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowGoldComparison((v) => !v)}
                    className="rounded-xl border border-[#1F3045] bg-[#0E1722] hover:bg-[#16222E] text-[#9FB3C6] hover:text-white text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 transition-all"
                  >
                    <Lightbulb className="h-3.5 w-3.5 text-[#FFC247]" />
                    <span>{showGoldComparison ? "Ocultar Exemplo" : "Ver Exemplo & Comparativo"}</span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showGoldComparison ? "rotate-180" : ""}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(
                        new CustomEvent("open-goti-chat", {
                          detail: {
                            prompt: `Goti, estou com dúvidas de como redigir o campo de ${currentGuided.title} (${currentGuided.label}) no SBAR. Como devo preencher este pilar? Me mostre apenas um modelo de exemplo didático para eu entender como fazer!`
                          }
                        })
                      );
                    }}
                    className="rounded-xl border border-[#20D5B5]/40 bg-[#20D5B5]/10 hover:bg-[#20D5B5]/20 text-[#20D5B5] text-xs font-bold px-3 py-1.5 flex items-center gap-1.5 transition-all"
                  >
                    <GotiAnimated animation="thinking" size={20} />
                    <span>Fale com o Goti</span>
                  </button>
                </div>
              </div>

              {/* Comparador Didático Opcional */}
              {showGoldComparison && (
                <div className="grid sm:grid-cols-2 gap-3.5 text-xs animate-in fade-in">
                  {/* ❌ Como NÃO falar */}
                  <div className="p-4 rounded-2xl bg-[#F0645F]/10 border border-[#F0645F]/30 text-white space-y-2 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-[#F0645F] text-[10px] uppercase tracking-wide">
                        <AlertOctagon className="h-3.5 w-3.5 shrink-0" />
                        <span>Comunicação Ineficaz (Causa de Erros Clínicos)</span>
                      </div>
                      <p className="italic leading-relaxed font-medium text-xs text-[#EAF2F8]">
                        "{currentGuided.badExample}"
                      </p>
                    </div>
                    <p className="text-[11px] text-[#F0645F] pt-2 border-t border-[#F0645F]/30 leading-normal">
                      <strong>Por que falha:</strong> {currentGuided.badReason}
                    </p>
                  </div>

                  {/* ✅ Padrão Ouro */}
                  <div className="p-4 rounded-2xl bg-[#20D5B5]/10 border border-[#20D5B5]/30 text-white space-y-2 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-[#20D5B5] text-[10px] uppercase tracking-wide">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          <span>Comunicação Efetiva (Padrão Ouro COFEN/OMS)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleInsertFieldExample(currentGuided.key)}
                          className="text-[10px] font-bold text-[#20D5B5] hover:underline"
                        >
                          Copiar texto
                        </button>
                      </div>
                      <p className="leading-relaxed font-semibold text-xs text-[#EAF2F8]">
                        "{currentGuided.goodExample}"
                      </p>
                    </div>
                    <p className="text-[11px] text-[#20D5B5] pt-2 border-t border-[#20D5B5]/30 leading-normal">
                      <strong>Vantagem assistencial:</strong> {currentGuided.goodReason}
                    </p>
                  </div>
                </div>
              )}

              {/* CHECKLIST DINÂMICO DE SEGURANÇA (Página 15 do PDF) */}
              <div className="p-4 rounded-2xl bg-[#0E1722] border border-[#1F3045] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#20D5B5] flex items-center gap-1.5">
                    CHECKLIST DINÂMICO DE SEGURANÇA · {currentCheckedCount} DE 3
                  </span>
                  <span className="text-[10px] font-bold text-[#9FB3C6]">
                    {currentCheckedPercent}% concluído
                  </span>
                </div>

                {/* Itens do Checklist com círculo de seleção */}
                <div className="space-y-2 pt-1">
                  {currentGuided.checklistItems.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => handleToggleChecklistItem(currentGuided.key, item.key)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                        item.done
                          ? "bg-[#16222E] border-[#20D5B5] text-white"
                          : "bg-[#131F2E]/60 border-[#1F3045] text-[#9FB3C6] hover:border-[#20D5B5]/40 hover:text-white"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          item.done
                            ? "bg-[#20D5B5] text-[#0B131D]"
                            : "border border-[#1F3045] bg-[#0E1722]"
                        }`}
                      >
                        {item.done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : null}
                      </div>
                      <span className="text-xs font-medium leading-tight">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Área de Digitação & Gravação por Microfone */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-white flex items-center gap-2 flex-wrap">
                    <span>Sua formulação para o pilar {currentGuided.letter}:</span>
                    {isListening && activeListeningField === currentGuided.key && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#F0645F] animate-pulse bg-[#F0645F]/15 px-2 py-0.5 rounded-full border border-[#F0645F]/30">
                        <Radio className="h-3 w-3 text-[#F0645F] animate-ping" />
                        <span>Ouvindo sua voz ({formatSeconds(recordingSeconds)})...</span>
                      </span>
                    )}
                    {(isProcessingAudio || isTranscribingWithAi) && processingField === currentGuided.key && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#20D5B5] animate-pulse bg-[#20D5B5]/15 px-2 py-0.5 rounded-full border border-[#20D5B5]/30">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Transcrevendo áudio...</span>
                      </span>
                    )}
                  </label>

                  {/* Botão de Ditar por Voz */}
                  <button
                    type="button"
                    disabled={(isProcessingAudio || isTranscribingWithAi) && processingField === currentGuided.key}
                    onClick={() => toggleVoiceInput(currentGuided.key)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      isListening && activeListeningField === currentGuided.key
                        ? "bg-[#F0645F] text-white shadow-md animate-pulse"
                        : "border border-[#20D5B5]/40 bg-transparent text-[#20D5B5] hover:bg-[#20D5B5]/10"
                    }`}
                  >
                    {isListening && activeListeningField === currentGuided.key ? (
                      voiceStarting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Ligando Mic...</span>
                        </>
                      ) : (
                        <>
                          <MicOff className="h-3.5 w-3.5" />
                          <span>Parar Ditado ({formatSeconds(recordingSeconds)})</span>
                        </>
                      )
                    ) : (isProcessingAudio || isTranscribingWithAi) && processingField === currentGuided.key ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Transcrevendo...</span>
                      </>
                    ) : (
                      <>
                        <Mic className="h-3.5 w-3.5" />
                        <span>Ditar por Voz</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Balão de Fala Interina ao Vivo */}
                {isListening && activeListeningField === currentGuided.key && interimTranscript && (
                  <div className="p-2.5 rounded-xl bg-[#20D5B5]/15 border border-[#20D5B5]/30 text-[#20D5B5] text-xs flex items-center gap-2 animate-in fade-in">
                    <Volume2 className="h-4 w-4 shrink-0 animate-bounce" />
                    <span className="italic font-medium">"{interimTranscript}"</span>
                  </div>
                )}

                <Textarea
                  rows={4}
                  value={sbarData[currentGuided.key]}
                  onChange={(e) => setSbarData({ ...sbarData, [currentGuided.key]: e.target.value })}
                  placeholder={`Formule a ${currentGuided.title} deste paciente com clareza clínica e dados objetivos...`}
                  className="text-xs sm:text-sm rounded-2xl border-[#1F3045] bg-[#0E1722] text-white placeholder:text-[#9FB3C6]/60 resize-none focus:border-[#20D5B5] focus:ring-0 leading-relaxed p-3.5"
                />

                <div className="flex items-center justify-between text-[11px] text-[#9FB3C6]">
                  <span>Dica: use dados numéricos e cite horário específico de medicações.</span>
                  <span>{sbarData[currentGuided.key]?.length || 0} caracteres</span>
                </div>
              </div>

              {/* Navegação entre Passos (Página 15 do PDF) */}
              <div className="flex items-center justify-between pt-3 border-t border-[#1F3045]">
                <button
                  type="button"
                  disabled={activeGuidedStep === 0}
                  onClick={() => {
                    if (isListening) stopListening();
                    setActiveGuidedStep((prev) => Math.max(0, prev - 1));
                  }}
                  className="rounded-2xl border border-[#1F3045] bg-[#0E1722] hover:bg-[#16222E] text-[#9FB3C6] hover:text-white px-5 py-3 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Passo anterior
                </button>

                {activeGuidedStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (isListening) stopListening();
                      setActiveGuidedStep((prev) => Math.min(3, prev + 1));
                    }}
                    className="rounded-2xl bg-[#20D5B5] hover:bg-[#1AD1B0] text-[#0B131D] font-black shadow-[0_4px_0_0_#148A76] active:translate-y-1 active:shadow-none px-6 py-3 text-xs transition-all flex items-center gap-1.5"
                  >
                    <span>Próximo passo: {guidedStepsMeta[activeGuidedStep + 1]?.letter}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isEvaluating}
                    onClick={handleEvaluateSbar}
                    className="rounded-2xl bg-[#20D5B5] hover:bg-[#1AD1B0] text-[#0B131D] font-black shadow-[0_4px_0_0_#148A76] active:translate-y-1 active:shadow-none px-6 py-3 text-xs transition-all flex items-center gap-2"
                  >
                    {isEvaluating ? (
                      <>
                        <Sparkles className="h-3.5 w-3.5 animate-spin" /> Goti analisando...
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" /> Concluir e Transmitir
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA 2: SIMULAÇÃO RÁPIDA À BEIRA-LEITO (ÁUDIO DIRETO) */}
        {activeTab === "free_voice" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  Simulação em Tempo Real (Troca de Turno Contínua)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Dite a passagem de plantão por voz em cada pilar com seu microfone. Fale com clareza e ritmo pausado.
                </p>
              </div>

              {isListening && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold animate-pulse">
                  <Radio className="h-3.5 w-3.5 text-rose-600" />
                  <span>Microfone Ligado no Pilar {activeListeningField?.toUpperCase()}</span>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                { key: "situation", letter: "S", title: "Situação", color: "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300", ph: "Ex.: Paciente M.S.L., 58 anos, no Leito 12-A, no 1º DPO de colectomia..." },
                { key: "background", letter: "B", title: "Histórico", color: "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300", ph: "Ex.: Hipertenso controlado com Losartana. Nega alergias..." },
                { key: "assessment", letter: "A", title: "Avaliação", color: "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300", ph: "Ex.: PA 115/72, FC 84, SatO2 98%. Dor EVA 4/10 em incisão..." },
                { key: "recommendation", letter: "R", title: "Recomendação", color: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300", ph: "Ex.: Vigiar dreno a cada 4h; analgesia às 20h; checar hematócrito..." }
              ].map((pilar) => (
                <div key={pilar.key} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-md font-bold text-xs ${pilar.color}`}>
                        {pilar.letter}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{pilar.title}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        {Object.values(checklists[pilar.key] || {}).filter(Boolean).length}/3 itens
                      </span>

                      <Button
                        size="sm"
                        disabled={(isProcessingAudio || isTranscribingWithAi) && processingField === pilar.key}
                        variant={isListening && activeListeningField === pilar.key ? "destructive" : "outline"}
                        onClick={() => toggleVoiceInput(pilar.key)}
                        className={`rounded-lg h-7 px-2.5 text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isListening && activeListeningField === pilar.key
                            ? "bg-rose-600 hover:bg-rose-700 text-white shadow-xs animate-pulse ring-2 ring-rose-400"
                            : (isProcessingAudio || isTranscribingWithAi) && processingField === pilar.key
                            ? "bg-teal-50 dark:bg-teal-950/40 border-teal-600 text-teal-900 dark:text-teal-200"
                            : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        {isListening && activeListeningField === pilar.key ? (
                          voiceStarting ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin text-white" />
                              <span>Ligando...</span>
                            </>
                          ) : (
                            <>
                              <MicOff className="h-3 w-3 animate-pulse text-white" />
                              <span>Parar ({formatSeconds(recordingSeconds)})</span>
                            </>
                          )
                        ) : (isProcessingAudio || isTranscribingWithAi) && processingField === pilar.key ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin text-teal-700 dark:text-teal-400" />
                            <span>Transcrevendo...</span>
                          </>
                        ) : (
                          <>
                            <Mic className="h-3 w-3 text-teal-700 dark:text-teal-400" />
                            <span>Ditar</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {(isProcessingAudio || isTranscribingWithAi) && processingField === pilar.key && (
                    <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200 text-[11px] flex items-center gap-2 animate-pulse">
                      <Loader2 className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400 animate-spin shrink-0" />
                      <span className="font-medium">Áudio recebido! Transcrevendo...</span>
                    </div>
                  )}

                  {isListening && activeListeningField === pilar.key && interimTranscript && (
                    <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200 text-[11px] italic">
                      "{interimTranscript}"
                    </div>
                  )}

                  <Textarea
                    rows={3}
                    value={sbarData[pilar.key]}
                    onChange={(e) => setSbarData({ ...sbarData, [pilar.key]: e.target.value })}
                    placeholder={pilar.ph}
                    className="text-xs rounded-lg border-slate-200 dark:border-slate-700 resize-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 leading-relaxed"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                size="lg"
                disabled={isEvaluating}
                onClick={handleEvaluateSbar}
                className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-6 h-11 flex items-center gap-2 shadow-xs"
              >
                {isEvaluating ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin text-teal-200" />
                    <span>Goti está auditando a passagem de plantão...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Submeter Passagem de Plantão para o Goti IA</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA 3: CONFIRMAR ENVIO & RESUMO COMPLETO DO SBAR (100%) */}
        {activeTab === "confirm" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-6">
              {/* Topo da Confirmação */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      Confirmação de Envio da Passagem de Plantão SBAR
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Revise os 4 pilares do relatório clínico antes de confirmar a entrega final e receber o parecer do Goti.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                    <Clock className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Tempo de Prática: {clinicalHistoryService.formatDuration(activitySeconds)}</span>
                  </span>
                </div>
              </div>

              {submissionSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider">Passagem de Plantão 100% Concluída</h4>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                      Esta atividade foi finalizada e registrada no seu histórico com sucesso. Você pode consultar debriefings e métricas a qualquer momento no menu de Histórico.
                    </p>
                  </div>
                </div>
              )}

              {/* Dados do Paciente em Transição */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Paciente em Passagem de Plantão</span>
                  <strong className="text-slate-900 dark:text-slate-100 text-sm font-bold">
                    {currentCase.name} ({currentCase.age}a) • {currentCase.bed}
                  </strong>
                  <span className="text-slate-500 dark:text-slate-400 block mt-0.5">{currentCase.diagnosis}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200">
                    PA: {currentCase.vitals?.pa_sistolica}/{currentCase.vitals?.pa_diastolica}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200">
                    SatO₂: {currentCase.vitals?.sat}%
                  </span>
                </div>
              </div>

              {/* Os 4 Pilares Estruturados do SBAR */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pilar S */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-indigo-200 dark:border-indigo-900/60 space-y-2">
                  <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-900/40 pb-2">
                    <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-indigo-700 text-white flex items-center justify-center text-[11px] font-bold">S</span>
                      Situação (Situation)
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sbarData.situation ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300" : "bg-amber-100 text-amber-800"}`}>
                      {sbarData.situation ? "Preenchido" : "Pendente"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 italic min-h-[48px] leading-relaxed">
                    {sbarData.situation || "Nenhuma informação informada neste pilar ainda."}
                  </p>
                </div>

                {/* Pilar B */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-amber-200 dark:border-amber-900/60 space-y-2">
                  <div className="flex items-center justify-between border-b border-amber-100 dark:border-amber-900/40 pb-2">
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-amber-700 text-white flex items-center justify-center text-[11px] font-bold">B</span>
                      Breve Histórico (Background)
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sbarData.background ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300" : "bg-amber-100 text-amber-800"}`}>
                      {sbarData.background ? "Preenchido" : "Pendente"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 italic min-h-[48px] leading-relaxed">
                    {sbarData.background || "Nenhuma informação informada neste pilar ainda."}
                  </p>
                </div>

                {/* Pilar A */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
                  <div className="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900/40 pb-2">
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-emerald-700 text-white flex items-center justify-center text-[11px] font-bold">A</span>
                      Avaliação Clínica (Assessment)
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sbarData.assessment ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300" : "bg-amber-100 text-amber-800"}`}>
                      {sbarData.assessment ? "Preenchido" : "Pendente"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 italic min-h-[48px] leading-relaxed">
                    {sbarData.assessment || "Nenhuma informação informada neste pilar ainda."}
                  </p>
                </div>

                {/* Pilar R */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-teal-200 dark:border-teal-900/60 space-y-2">
                  <div className="flex items-center justify-between border-b border-teal-100 dark:border-teal-900/40 pb-2">
                    <span className="text-xs font-bold text-teal-900 dark:text-teal-300 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-teal-700 text-white flex items-center justify-center text-[11px] font-bold">R</span>
                      Recomendação (Recommendation)
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sbarData.recommendation ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300" : "bg-amber-100 text-amber-800"}`}>
                      {sbarData.recommendation ? "Preenchido" : "Pendente"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 italic min-h-[48px] leading-relaxed">
                    {sbarData.recommendation || "Nenhuma informação informada neste pilar ainda."}
                  </p>
                </div>
              </div>

              {/* Botões Oficiais da Aba de Confirmação */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("guided")}
                  className="rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold"
                >
                  <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar para Edição Guiada
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleSaveDraft}
                    className="rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <BookmarkPlus className="h-3.5 w-3.5 text-amber-500" />
                    <span>Salvar Rascunho</span>
                  </Button>

                  <Button
                    onClick={handleEvaluateSbar}
                    disabled={isEvaluating}
                    className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs px-6 h-10 font-bold flex items-center gap-2 shadow-xs"
                  >
                    {isEvaluating ? (
                      <>
                        <Sparkles className="h-4 w-4 animate-spin text-teal-200" />
                        <span>Auditando com IA...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        <span>Confirmar Envio Oficial (100%) & Avaliar</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA 3: DEBRIEFING DO GOTI IA */}
        {tutorEvaluation && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-teal-200 dark:border-teal-900/60 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in">
            {/* Topo do Feedback com Score e Grade */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-teal-700 dark:text-teal-400" />
                  <span className="text-xs font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider block">
                    Parecer de Comunicação • Goti IA
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                  Auditoria da Comunicação & Segurança do Paciente
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                  {tutorEvaluation.summaryFeedback}
                </p>
              </div>

              <div className="flex items-center gap-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-2xl p-3 shrink-0">
                <div
                  className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
                  onClick={() => setShowGotiEvaluationModal(true)}
                  title="Clique para ver a comemoração e parecer do Goti!"
                >
                  <GotiAnimated
                    animation={tutorEvaluation.safetyScore >= 80 ? "jumping" : tutorEvaluation.safetyScore >= 50 ? "pointing" : "angry"}
                    size="feedback"
                    className="w-32 h-32 sm:w-44 sm:h-44 md:w-52 md:h-52 shrink-0"
                  />
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-teal-800 dark:text-teal-300 uppercase block">Índice de Segurança</span>
                  <span className="text-2xl font-extrabold text-teal-900 dark:text-teal-200 block leading-none">
                    {tutorEvaluation.safetyScore}/100
                  </span>
                </div>
                <div className="h-10 w-px bg-teal-200 dark:bg-teal-800" />
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-700 text-white">
                  {tutorEvaluation.grade}
                </span>
              </div>
            </div>

            {/* SIMULADOR DE CONSEQUÊNCIA DE EVENTO SENTINELA (APRENDIZAGEM VIVA) */}
            {tutorEvaluation.sentinelConsequence && (
              <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-xs uppercase tracking-wide">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Simulador de Consequências no Hospital Real (O que aconteceria se você omitisse esses dados?):</span>
                </div>
                <p className="text-xs text-amber-950 dark:text-amber-200 leading-relaxed font-medium">
                  {tutorEvaluation.sentinelConsequence}
                </p>
              </div>
            )}

            {/* Desdobramento dos 4 Pilares SBAR */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Desempenho por Eixo da Metodologia:
              </h4>

              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { key: "situation", label: "S - Situação", letter: "S" },
                  { key: "background", label: "B - Histórico", letter: "B" },
                  { key: "assessment", label: "A - Avaliação", letter: "A" },
                  { key: "recommendation", label: "R - Recomendação", letter: "R" }
                ].map((pillar) => {
                  const data = tutorEvaluation.pillarScores?.[pillar.key] || { score: 75, feedback: "Informações registradas com clareza." };
                  return (
                    <div key={pillar.key} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{pillar.label}</span>
                        <span className={`text-xs font-extrabold ${data.score >= 80 ? 'text-teal-700 dark:text-teal-400' : 'text-amber-700 dark:text-amber-400'}`}>
                          {data.score} pts
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal">
                        {data.feedback}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Omissões Críticas e Pontos Fortes */}
            <div className="grid sm:grid-cols-2 gap-4 text-xs pt-1">
              {tutorEvaluation.criticalOmissions?.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-rose-800 dark:text-rose-300">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Omissões Críticas que Devem ser Corrigidas:</span>
                  </div>
                  <ul className="space-y-1.5 text-rose-700 dark:text-rose-200">
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
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Pontos Fortes da Sua Comunicação:</span>
                  </div>
                  <ul className="space-y-1.5 text-emerald-700 dark:text-emerald-200">
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

            {/* Mensagem de Mentoria & Exportação em PDF com Goti */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 italic">
                  "{tutorEvaluation.gotiMentorship || tutorEvaluation.florenceMentorship || 'A comunicação assertiva é a maior ferramenta de proteção da enfermagem.'}"
                </div>
              </div>
            </div>
          </div>
        )}
        </>
        )}

        {/* Modal Retangular de Conclusão e Avaliação do Goti */}
        <GotiEvaluationModal
          isOpen={showGotiEvaluationModal}
          onClose={() => setShowGotiEvaluationModal(false)}
          score={tutorEvaluation?.safetyScore ?? 100}
          scoreLabel="Índice de Segurança SBAR"
          activityTitle={`Passagem SBAR: ${currentCase?.title || "Caso Clínico"}`}
          comment={tutorEvaluation?.summaryFeedback || tutorEvaluation?.gotiMentorship || tutorEvaluation?.florenceMentorship || "Excelente comunicação beira-leito!"}
          onContinue={() => setShowGotiEvaluationModal(false)}
        />

        {/* Modal Unificado de Histórico SBAR (Isolado exclusivamente para o módulo SBAR) */}
        <CaseHistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          onResumeActivity={handleResumeActivity}
          defaultModuleFilter="sbar"
          lockModuleFilter={true}
          title="Histórico de Passagem de Plantão SBAR"
        />
      </main>

      <StudentFooter />
      <MobileBottomDock />
    </div>
  );
}
