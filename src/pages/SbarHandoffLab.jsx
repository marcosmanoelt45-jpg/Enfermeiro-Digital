import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Download,
  HeartPulse,
  Activity,
  Clock,
  ArrowRight,
  ArrowLeft,
  MessageSquareQuote,
  RotateCcw,
  BookOpen,
  AlertCircle,
  Lightbulb,
  Radio,
  Check,
  Volume2,
  CheckSquare,
  Loader2,
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
import { audioTranscriptionService } from "@/services/audioTranscriptionService";
import { evaluateSbarChecklists } from "@/lib/sbarSpeechMatcher";

const PRESET_HANDOFF_SCENARIOS = [
  {
    id: "pos_op",
    title: "1º DPO de Colectomia Parcial",
    sector: "Clínica Cirúrgica • Leito 12-A",
    bed: "Leito 12-A",
    age: 58,
    name: "M.S.L.",
    diagnosis: "Pós-operatório imediato de colectomia por diverticulite aguda",
    vitals: { pa_sistolica: 115, pa_diastolica: 72, fc: 84, fr: 17, sat: 98, tax: 36.6 },
    clinicalSummary: "Paciente lúcido no 1º DPO de colectomia parcial, queixando-se de dor moderada em incisão cirúrgica. Dreno tubular ativo em flanco direito com débito serossanguinolento.",
    goldenSbar: {
      situation: "Paciente M.S.L., 58 anos, no Leito 12-A da Clínica Cirúrgica, no 1º DPO de colectomia parcial por diverticulite.",
      background: "Hipertenso controlado com Losartana. Nega alergias medicamentosas e cirurgias abdominais prévias.",
      assessment: "PA 115/72 mmHg, FC 84 bpm, afebril, SatO2 98% em ar ambiente. Abdome flácido, doloroso à palpação na incisão (EVA 4/10). Dreno de Portovac com débito serossanguinolento de 120 mL em 12h. Curativo cirúrgico limpo e seco.",
      recommendation: "Vigiar aspecto e volume do dreno a cada 4 horas; administrar analgesia prescrita às 20h; checar resultado do hematócrito de controle colhido nesta tarde."
    },
    educationalPointers: {
      situation: "Diga quem é, o leito e o motivo cirúrgico em 15 segundos.",
      background: "Confirme categoricamente que o paciente NÃO tem alergias medicamentosas.",
      assessment: "Fale números exatos de PA, débito do dreno e nota da dor na escala EVA.",
      recommendation: "Deixe horários claros de analgesia e exames laboratoriais a checar."
    }
  },
  {
    id: "icc",
    title: "ICC Descompensada & Congestão Pulmonar",
    sector: "UTI Cardiológica • Leito 04",
    bed: "Leito 04 - UTI",
    age: 67,
    name: "J.A.P.",
    diagnosis: "Insuficiência Cardíaca Congestiva perfil B (úmido e quente)",
    vitals: { pa_sistolica: 148, pa_diastolica: 94, fc: 96, fr: 23, sat: 92, tax: 36.4 },
    clinicalSummary: "Admitido por piora progressiva da dispneia aos mínimos esforços e ortopneia. Estertores crepitantes bibasais em terços inferiores e turgência jugular patológica.",
    goldenSbar: {
      situation: "Paciente J.A.P., 67 anos, no Leito 04 da UTI Cardiológica, admitido há 6 horas por descompensação de ICC com congestão pulmonar aguda.",
      background: "Histórico de ICC com fração de ejeção de 32%, HAS e DM2. Relata alergia severa a contraste iodado.",
      assessment: "PA 148/94 mmHg, FC 96 bpm, FR 23 irpm, SatO2 92% em ar ambiente que subiu para 96% sob cateter nasal a 3 L/min. Estertores crepitantes finos bibasais e edema de MMII +++/4+.",
      recommendation: "Administrar Furosemida 40 mg IV prescrita para as 20h; realizar balanço hídrico rigoroso de 6 em 6 horas e registrar peso em jejum amanhã cedo."
    },
    educationalPointers: {
      situation: "Identifique o tempo de admissão (6 horas) e o motivo da descompensação.",
      background: "Obrigatoriamente avise sobre a alergia a contraste iodado antes de qualquer tomografia.",
      assessment: "Informe a resposta da saturação ao oxigênio (de 92% para 96% a 3 L/min).",
      recommendation: "Prescreva o controle de diurese e o balanço hídrico rigoroso."
    }
  },
  {
    id: "delirium",
    title: "Idoso com Delirium & Risco de Queda",
    sector: "Enfermaria Geriátrica • Leito 21-B",
    bed: "Leito 21-B",
    age: 82,
    name: "A.B.C.",
    diagnosis: "Pneumonia Comunitária associada a Delirium Misto",
    vitals: { pa_sistolica: 132, pa_diastolica: 78, fc: 76, fr: 19, sat: 95, tax: 37.1 },
    clinicalSummary: "Paciente idoso com flutuação do nível de consciência, desorientação temporal e tentativa recorrente de retirada de punção venosa e evasão do leito.",
    goldenSbar: {
      situation: "Paciente A.B.C., 82 anos, Leito 21-B da Geriatria, no 3º dia de internação por pneumonia comunitária em antibioticoterapia venosa.",
      background: "Diagnóstico prévio de Alzheimer leve e osteoartrose. Nega alergias medicamentosas conhecidas. Histórico de queda no domicílio há 2 meses com contusão em quadril.",
      assessment: "Sinais vitais estáveis (PA 132/78 mmHg, FC 76 bpm, SatO2 95%). Apresenta flutuação do sensório (CAM positivo), agitou-se no início da tarde tentando levantar-se sem auxílio.",
      recommendation: "Manter grades do leito sempre elevadas bilateralmente; orientar e apoiar o acompanhante familiar; manter acesso periférico protegido e evitar contenção física mecânica desnecessária."
    },
    educationalPointers: {
      situation: "Informe o dia do antibiótico e a enfermaria geriátrica.",
      background: "Alerte sobre a queda recente no domicílio para acionar o protocolo de quedas.",
      assessment: "Descreva a flutuação do CAM e a tentativa de evasão do leito.",
      recommendation: "Foque nas grades elevadas e na segurança física do paciente sem contenção abusiva."
    }
  }
];

export default function SbarHandoffLab() {
  const location = useLocation();
  const { user } = useAuth();

  const passedCase = location.state?.caseData;

  const [activeTab, setActiveTab] = useState("guided"); // "guided" | "free_voice" | "debriefing"
  const [activeGuidedStep, setActiveGuidedStep] = useState(0); // 0: S, 1: B, 2: A, 3: R

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

  // Atualização inteligente dos checklists dinâmicos conforme digitação/voz
  useEffect(() => {
    const autoChecked = evaluateSbarChecklists(sbarData, currentCase);
    setChecklists((prev) => ({
      situation: {
        bed: prev.situation.bed || autoChecked.situation.bed,
        id: prev.situation.id || autoChecked.situation.id,
        reason: prev.situation.reason || autoChecked.situation.reason
      },
      background: {
        allergy: prev.background.allergy || autoChecked.background.allergy,
        comorbidities: prev.background.comorbidities || autoChecked.background.comorbidities,
        meds: prev.background.meds || autoChecked.background.meds
      },
      assessment: {
        vitals: prev.assessment.vitals || autoChecked.assessment.vitals,
        sato2: prev.assessment.sato2 || autoChecked.assessment.sato2,
        exam: prev.assessment.exam || autoChecked.assessment.exam
      },
      recommendation: {
        time: prev.recommendation.time || autoChecked.recommendation.time,
        meds: prev.recommendation.meds || autoChecked.recommendation.meds,
        monitoring: prev.recommendation.monitoring || autoChecked.recommendation.monitoring
      }
    }));
  }, [sbarData, currentCase]);

  // Permite ao acadêmico marcar/desmarcar itens manualmente caso deseje validação direta
  function handleToggleChecklistItem(pillarKey, itemKey) {
    setChecklists((prev) => ({
      ...prev,
      [pillarKey]: {
        ...prev[pillarKey],
        [itemKey]: !prev[pillarKey]?.[itemKey]
      }
    }));
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
      alert("Por favor, preencha ao menos uma etapa do SBAR antes de enviar para a auditoria de Florence.");
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
      window.scrollTo({ top: 350, behavior: "smooth" });
    } catch (err) {
      console.error("[SbarHandoffLab] Erro ao avaliar:", err);
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
        name: user?.name || "Acadêmico de Enfermagem",
        institution: "Faculdade de Enfermagem • Simulação Clínica",
        id: "PORTFOLIO-SBAR-2026"
      }
    });

    setToastMessage("Prontuário Oficial e Parecer Pedagógico em PDF gerados com sucesso!");
    setTimeout(() => setToastMessage(""), 3500);
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-800 dark:text-slate-100">
      <StudentHeader activeTab="sbar" />

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 py-6 space-y-6">
        {/* Barra Superior Limpa e Funcional */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Passagem de Plantão SBAR
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Meta 2 OMS • COFEN 736/2024
            </span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleInsertGoldenExample}
              className="rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Exemplo Padrão Ouro
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFields}
              className="rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Limpar
            </Button>
          </div>
        </div>

        {/* Notificação Toast */}
        {toastMessage && (
          <div className="p-3.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs flex items-center justify-between gap-2 animate-in fade-in shadow-md">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="font-medium">{toastMessage}</span>
            </div>
            {isListening && (
              <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping shrink-0" />
            )}
          </div>
        )}

        {/* Alerta de Erro de Microfone */}
        {voiceError && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 text-xs flex items-center gap-2.5 shadow-2xs animate-in fade-in">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <div className="flex-1 font-medium">{voiceError}</div>
            <button
              onClick={() => setVoiceError("")}
              className="text-xs font-bold text-rose-700 dark:text-rose-300 hover:underline shrink-0"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Seletor de Cenários Clínicos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              1. Selecione o Caso Clínico:
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {PRESET_HANDOFF_SCENARIOS.length} Cenários Disponíveis
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PRESET_HANDOFF_SCENARIOS.map((scenario, idx) => (
              <div
                key={scenario.id}
                onClick={() => handleSelectScenario(idx)}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  activeScenarioIdx === idx
                    ? "bg-white dark:bg-slate-900 border-emerald-600 ring-2 ring-emerald-600/20 shadow-xs"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {scenario.sector}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {scenario.name} ({scenario.age}a)
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                  {scenario.title}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                  {scenario.clinicalSummary}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Card do Paciente no Leito */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase block">Prontuário à Beira-Leito</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {currentCase.bed || "Leito de Internação"}
              </span>
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {currentCase.name} • {currentCase.diagnosis || currentCase.title}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              {currentCase.clinicalSummary || currentCase.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shrink-0">
            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              <HeartPulse className="h-3.5 w-3.5 text-rose-500" />
              PA: {currentCase.vitals?.pa_sistolica}/{currentCase.vitals?.pa_diastolica} mmHg
            </span>
            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              <Activity className="h-3.5 w-3.5 text-emerald-500" />
              SatO2: {currentCase.vitals?.sat}%
            </span>
            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              <Clock className="h-3.5 w-3.5 text-sky-500" />
              FC: {currentCase.vitals?.fc} bpm
            </span>
          </div>
        </div>

        {/* NAVEGAÇÃO DE MODOS PEDAGÓGICOS */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-xs font-bold overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("guided")}
            className={`pb-3 px-1 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "guided"
                ? "border-teal-700 text-teal-900 dark:border-teal-400 dark:text-teal-300 font-extrabold"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>1. Trilha Guiada Passo a Passo (Aprendizagem)</span>
          </button>

          <button
            onClick={() => setActiveTab("free_voice")}
            className={`pb-3 px-1 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "free_voice"
                ? "border-teal-700 text-teal-900 dark:border-teal-400 dark:text-teal-300 font-extrabold"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Mic className="h-4 w-4" />
            <span>2. Simulação Rápida à Beira-Leito (Voz & Timer)</span>
          </button>

          {tutorEvaluation && (
            <button
              onClick={() => setActiveTab("debriefing")}
              className={`pb-3 px-1 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === "debriefing"
                  ? "border-teal-700 text-teal-900 dark:border-teal-400 dark:text-teal-300 font-extrabold"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <MessageSquareQuote className="h-4 w-4 text-teal-700 dark:text-teal-400" />
              <span>3. Debriefing & Parecer Florence (Score: {tutorEvaluation.safetyScore}/100)</span>
            </button>
          )}
        </div>

        {/* CONTEÚDO DA ABA 1: TRILHA GUIADA PASSO A PASSO */}
        {activeTab === "guided" && (
          <div className="space-y-6">
            {/* Stepper Visual dos 4 Passos do SBAR */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {guidedStepsMeta.map((step, idx) => {
                const isCurrent = activeGuidedStep === idx;
                const hasContent = Boolean(sbarData[step.key]?.trim());
                return (
                  <button
                    key={step.key}
                    onClick={() => setActiveGuidedStep(idx)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isCurrent
                        ? `bg-white dark:bg-slate-900 ${step.activeBorder} ring-2 shadow-xs`
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-extrabold ${
                        isCurrent ? step.accentBg : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}>
                        {step.letter}
                      </span>
                      {hasContent && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block mt-2.5 truncate">
                      {step.title}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                      {step.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Painel Central de Ensino e Formulação */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-5">
              {/* Topo do Passo */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${currentGuided.badgeColor}`}>
                      Passo {activeGuidedStep + 1} de 4 • Pilar {currentGuided.letter}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Checklist: {currentCheckedCount}/3 ({currentCheckedPercent}%)
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                    {currentGuided.title} — {currentGuided.subtitle}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                    {currentGuided.goal}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowGoldComparison((v) => !v)}
                    className="rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold shrink-0 shadow-2xs flex items-center gap-1.5"
                  >
                    <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                    <span>{showGoldComparison ? "Ocultar Comparativo" : "Ver Exemplo & Comparativo"}</span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showGoldComparison ? "rotate-180" : ""}`} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleInsertFieldExample(currentGuided.key)}
                    className="rounded-xl border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 text-xs font-semibold shrink-0 shadow-2xs"
                  >
                    Adotar Exemplo Ouro
                  </Button>
                </div>
              </div>

              {/* Comparador Didático Opcional (Divulgação Progressiva - sem poluir o fluxo) */}
              {showGoldComparison && (
                <div className="grid sm:grid-cols-2 gap-3.5 text-xs animate-in fade-in">
                  {/* ❌ Como NÃO falar */}
                  <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900 text-rose-950 dark:text-rose-200 space-y-2 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-rose-800 dark:text-rose-300 text-[11px] uppercase tracking-wide">
                        <AlertOctagon className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span>Comunicação Ineficaz (Causa de Erros Clínicos)</span>
                      </div>
                      <p className="italic leading-relaxed font-medium">
                        "{currentGuided.badExample}"
                      </p>
                    </div>
                    <p className="text-[11px] text-rose-700 dark:text-rose-300 pt-2 border-t border-rose-200/60 dark:border-rose-900/60 leading-normal">
                      <strong>Por que falha:</strong> {currentGuided.badReason}
                    </p>
                  </div>

                  {/* ✅ Padrão Ouro */}
                  <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900 text-emerald-950 dark:text-emerald-200 space-y-2 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300 text-[11px] uppercase tracking-wide">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Comunicação Efetiva (Padrão Ouro COFEN/OMS)</span>
                        </div>
                        <button
                          onClick={() => handleInsertFieldExample(currentGuided.key)}
                          className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                        >
                          Copiar texto
                        </button>
                      </div>
                      <p className="leading-relaxed font-semibold">
                        "{currentGuided.goodExample}"
                      </p>
                    </div>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/60 leading-normal">
                      <strong>Vantagem assistencial:</strong> {currentGuided.goodReason}
                    </p>
                  </div>
                </div>
              )}

              {/* Checklist Dinâmico de Segurança */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                    <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Checklist Dinâmico de Segurança:
                  </span>
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
                    {currentCheckedCount} de 3 ({currentCheckedPercent}%)
                  </span>
                </div>

                {/* Barra de Progresso Suave */}
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-300 rounded-full"
                    style={{ width: `${currentCheckedPercent}%` }}
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-2.5 pt-1">
                  {currentGuided.checklistItems.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => handleToggleChecklistItem(currentGuided.key, item.key)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer select-none ${
                        item.done
                          ? "bg-white dark:bg-slate-800 border-emerald-600 dark:border-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-2xs"
                          : "bg-white/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 hover:bg-white dark:hover:bg-slate-800"
                      }`}
                      title="Clique para marcar/desmarcar este item"
                    >
                      <div className={`flex h-4 w-4 items-center justify-center rounded-md shrink-0 transition-colors ${
                        item.done ? "bg-emerald-600 text-white" : "border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                      }`}>
                        {item.done ? <Check className="h-3 w-3 stroke-[3]" /> : null}
                      </div>
                      <span className="line-clamp-2 leading-tight">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Área de Digitação & Gravação por Microfone */}
              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                    <span>Sua formulação para o pilar {currentGuided.letter}:</span>
                    {isListening && activeListeningField === currentGuided.key && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-600 animate-pulse bg-rose-50 dark:bg-rose-950/40 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800 shadow-2xs">
                        <Radio className="h-3 w-3 text-rose-600 animate-ping" />
                        <span>Ouvindo sua voz ({formatSeconds(recordingSeconds)})... Fale com clareza</span>
                      </span>
                    )}
                    {(isProcessingAudio || isTranscribingWithAi) && processingField === currentGuided.key && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 animate-pulse bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                        <Loader2 className="h-3.5 w-3.5 text-emerald-600 animate-spin" />
                        <span>Áudio recebido! Transcrevendo...</span>
                      </span>
                    )}
                  </label>

                  {/* Botão de Ditar por Voz */}
                  <Button
                    size="sm"
                    disabled={(isProcessingAudio || isTranscribingWithAi) && processingField === currentGuided.key}
                    variant={isListening && activeListeningField === currentGuided.key ? "destructive" : "outline"}
                    onClick={() => toggleVoiceInput(currentGuided.key)}
                    className={`rounded-xl h-9 px-3.5 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                      isListening && activeListeningField === currentGuided.key
                        ? "bg-rose-600 hover:bg-rose-700 text-white shadow-md ring-2 ring-rose-400 ring-offset-2 animate-pulse"
                        : (isProcessingAudio || isTranscribingWithAi) && processingField === currentGuided.key
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 text-emerald-900 dark:text-emerald-200"
                        : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {isListening && activeListeningField === currentGuided.key ? (
                      voiceStarting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-white" />
                          <span>Ligando Mic...</span>
                        </>
                      ) : (
                        <>
                          <MicOff className="h-4 w-4 text-white animate-bounce" />
                          <span>Parar Ditado ({formatSeconds(recordingSeconds)})</span>
                        </>
                      )
                    ) : (isProcessingAudio || isTranscribingWithAi) && processingField === currentGuided.key ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                        <span>Transcrevendo...</span>
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 text-emerald-600" />
                        <span>Ditar por Voz</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Balão de Fala Interina ao Vivo */}
                {isListening && activeListeningField === currentGuided.key && interimTranscript && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
                    <Volume2 className="h-4 w-4 text-emerald-600 shrink-0 animate-bounce" />
                    <span className="italic font-medium">"{interimTranscript}"</span>
                  </div>
                )}

                <Textarea
                  rows={4}
                  value={sbarData[currentGuided.key]}
                  onChange={(e) => setSbarData({ ...sbarData, [currentGuided.key]: e.target.value })}
                  placeholder={`Formule o ${currentGuided.title} deste paciente com clareza clínica e dados objetivos...`}
                  className="text-xs sm:text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 resize-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 leading-relaxed shadow-2xs"
                />

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Dica: Use dados numéricos e cite horário específico de medicações.</span>
                  <span>{sbarData[currentGuided.key]?.length || 0} caracteres</span>
                </div>
              </div>

              {/* Navegação entre Passos */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={activeGuidedStep === 0}
                  onClick={() => {
                    if (isListening) stopListening();
                    setActiveGuidedStep((prev) => Math.max(0, prev - 1));
                  }}
                  className="rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Passo Anterior
                </Button>

                {activeGuidedStep < 3 ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      if (isListening) stopListening();
                      setActiveGuidedStep((prev) => Math.min(3, prev + 1));
                    }}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Próximo Passo: {guidedStepsMeta[activeGuidedStep + 1]?.letter} ({guidedStepsMeta[activeGuidedStep + 1]?.title.split(" ")[0]})</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={isEvaluating}
                    onClick={handleEvaluateSbar}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs"
                  >
                    {isEvaluating ? (
                      <>
                        <Sparkles className="h-3.5 w-3.5 animate-spin text-white" /> Florence analisando...
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5 text-white" /> Concluir e Transmitir para Florence
                      </>
                    )}
                  </Button>
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
                    <span>Florence está auditando a passagem de plantão...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Submeter Passagem de Plantão para Florence</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA 3: DEBRIEFING SOCRÁTICO DA PRECEPTORA FLORENCE */}
        {tutorEvaluation && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-teal-200 dark:border-teal-900/60 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in">
            {/* Topo do Feedback com Score e Grade */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-teal-700 dark:text-teal-400" />
                  <span className="text-xs font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider block">
                    Parecer de Preceptoria Clínica • Florence AI
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

            {/* DEBRIEFING SOCRÁTICO: PERGUNTAS REFLEXIVAS INTERATIVAS */}
            {tutorEvaluation.socraticQuestions?.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquareQuote className="h-5 w-5 text-teal-700 dark:text-teal-400" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                    Debriefing Socrático da Preceptora (Exercício de Raciocínio Clínico)
                  </h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Responda às questões da tutora para consolidar a fixação das condutas de emergência:
                </p>

                <div className="space-y-3 pt-1">
                  {tutorEvaluation.socraticQuestions.map((q, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 space-y-2">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {idx + 1}. {q}
                      </p>
                      <Input
                        value={studentReflections[idx] || ""}
                        onChange={(e) => setStudentReflections({ ...studentReflections, [idx]: e.target.value })}
                        placeholder="Digite sua resposta e justificativa clínica como enfermeiro(a)..."
                        className="text-xs rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:border-teal-700"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mensagem de Mentoria & Exportação em PDF */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs text-slate-600 dark:text-slate-400 italic">
                "{tutorEvaluation.florenceMentorship || 'A comunicação assertiva é a maior ferramenta de proteção da enfermagem.'}"
              </div>

              <Button
                onClick={handleDownloadPdf}
                className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-5 h-10 shadow-xs flex items-center gap-2 shrink-0"
              >
                <Download className="h-4 w-4" />
                <span>Exportar Prontuário & Parecer em PDF</span>
              </Button>
            </div>
          </div>
        )}
      </main>

      <StudentFooter />
    </div>
  );
}
