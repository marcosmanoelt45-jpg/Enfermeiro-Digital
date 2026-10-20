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
  ChevronDown,
  Shuffle,
  ArrowRightLeft,
  History,
  BookmarkPlus
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
  },
  {
    id: "dpoc",
    title: "Exacerbação de DPOC & Broncoespasmo",
    sector: "Clínica Médica • Leito 08",
    bed: "Leito 08",
    age: 64,
    name: "R.F.M.",
    diagnosis: "Doença Pulmonar Obstrutiva Crônica agudizada por infecção traqueobrônquica",
    vitals: { pa_sistolica: 138, pa_diastolica: 85, fc: 104, fr: 26, sat: 89, tax: 37.8 },
    clinicalSummary: "Paciente tabagista de longa data admitido com dispneia progressiva, tosse produtiva com escarro amarelado espesso e sibilos expiratórios difusos.",
    goldenSbar: {
      situation: "Paciente R.F.M., 64 anos, no Leito 08 da Clínica Médica, internado há 12 horas por exacerbação de DPOC infecciosa.",
      background: "DPOC estágio GOLD 3 com uso domiciliar de broncodilatadores. Alergia prévia a dipirona com urticária.",
      assessment: "PA 138/85 mmHg, FC 104 bpm, FR 26 irpm com tiragem intercostal leve, SatO2 89% em ar ambiente que subiu para 92% com Venturi a 28%. Sibilos expiratórios bilaterais e roncos esparsos.",
      recommendation: "Manter oxigenoterapia com alvo estrito de SatO2 entre 88-92% para evitar hipercapnia; realizar nebulização com broncodilatador prescrito às 22h e vigiar padrão ventilatório."
    },
    educationalPointers: {
      situation: "Informe o estágio do DPOC e tempo de admissão.",
      background: "Alerte categoricamente sobre a alergia à dipirona.",
      assessment: "Ressalte o alvo específico de oxigênio de 88-92% no retentor de CO2.",
      recommendation: "Prescreva a vigilância da frequência respiratória e horários da nebulização."
    }
  },
  {
    id: "sepse_urinaria",
    title: "Sepse de Foco Urinário & Hipotensão",
    sector: "Emergência / Sala Amarela • Leito 15",
    bed: "Leito 15 - Emergência",
    age: 71,
    name: "D.M.S.",
    diagnosis: "Sepse de foco urinário (ITU complicada) e resposta inflamatória sistêmica",
    vitals: { pa_sistolica: 90, pa_diastolica: 55, fc: 112, fr: 24, sat: 94, tax: 38.7 },
    clinicalSummary: "Idosa trazida pela família com rebaixamento do sensório, calafrios, febre e oligúria nas últimas 18 horas. Pele quente e ruborizada, tempo de enchimento capilar de 4 segundos.",
    goldenSbar: {
      situation: "Paciente D.M.S., 71 anos, Leito 15 da Sala Amarela da Emergência, admitida há 2 horas com sepse grave de provável foco urinário.",
      background: "Diabética e com histórico de ITU de repetição. Sem alergias medicamentosas registradas.",
      assessment: "Hipotensa (PA 90/55 mmHg, PAM 66 mmHg), taquicárdica (FC 112 bpm), taquipneica (FR 24 irpm) e febril (Tax 38,7 °C). Diurese concentrada e fétida de 40 mL nas últimas 2 horas.",
      recommendation: "Concluir a ressuscitação volêmica com Ringer Lactato a 30 mL/kg nas próximas 2 horas; administrar ceftriaxona IV prescrita imediatamente após colheita de culturas."
    },
    educationalPointers: {
      situation: "Enfatize a urgência da sepse nas primeiras horas do pacote de sobrevida.",
      background: "Confirme a ausência de alergias a betalactâmicos.",
      assessment: "Informe a PAM limítrofe (66 mmHg) e a oligúria crítica.",
      recommendation: "Priorize o término rápido da hidratação venosa e início precoce do antibiótico."
    }
  }
];

export default function SbarHandoffLab() {
  const location = useLocation();
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-800 dark:text-slate-100">
      <StudentHeader activeTab="sbar" />

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 py-6 space-y-6">
        {/* ======================================================== */}
        {/* MODO 0: ESCOLHA INICIAL LIMPA DO SBAR (IGUAL AO MONTAR) */}
        {/* ======================================================== */}
        {viewMode === "choose" ? (
          <div className="space-y-6 animate-in fade-in max-w-4xl mx-auto pt-2 pb-8">
            {/* Header da Escolha do SBAR */}
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-3xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 shadow-sm flex items-center justify-center">
                  <ArrowRightLeft className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                </div>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Laboratório de Passagem de Plantão SBAR
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto mt-1">
                  Meta 2 da OMS para Segurança do Paciente. Evite perda de informações críticas entre turnos.
                </p>
              </div>
            </div>

            {/* As 4 Modalidades do SBAR */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Opção 1: Passagem por Áudio */}
              <div
                onClick={() => {
                  setActiveTab("free_voice");
                  setViewMode("workspace");
                }}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 bg-white dark:bg-slate-900 p-6 transition-all shadow-xs hover:shadow-lg cursor-pointer flex flex-col justify-between space-y-5 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-400 group-hover:scale-105 transition-transform">
                      <Mic className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                      Reconhecimento de Voz
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    Passagem por Áudio (Voz)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Treine falando livremente ou tópico por tópico. O Enfere transcreve sua voz em tempo real e audita menção a leito, sinais vitais e alergias.
                  </p>
                </div>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab("free_voice");
                    setViewMode("workspace");
                  }}
                  className="w-full rounded-2xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-semibold text-xs py-2.5 h-auto flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>Iniciar por Áudio</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Opção 2: Passagem Estruturada por Texto */}
              <div
                onClick={() => {
                  setActiveTab("guided");
                  setViewMode("workspace");
                }}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 bg-white dark:bg-slate-900 p-6 transition-all shadow-xs hover:shadow-lg cursor-pointer flex flex-col justify-between space-y-5 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      Passo a Passo Guiado
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Passagem Estruturada (Manual / Texto)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Preencha cada um dos 4 pilares (Situação, Histórico, Avaliação e Recomendação) pelo teclado, com checklists assépticos e dicas padrão-ouro.
                  </p>
                </div>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab("guided");
                    setViewMode("workspace");
                  }}
                  className="w-full rounded-2xl bg-indigo-700 hover:bg-indigo-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 h-auto flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>Iniciar Modo Guiado</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Opção 3: Simulação Rápida Beira-Leito */}
              <div
                onClick={() => {
                  const criticalCase = PRESET_HANDOFF_SCENARIOS.find((c) => c.id === "sepse_urinaria") || PRESET_HANDOFF_SCENARIOS[1];
                  setCurrentCase(criticalCase);
                  setActiveTab("free_voice");
                  setViewMode("workspace");
                  setToastMessage("Simulação Beira-Leito iniciada! Priorize os dados de emergência do paciente.");
                }}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 bg-white dark:bg-slate-900 p-6 transition-all shadow-xs hover:shadow-lg cursor-pointer flex flex-col justify-between space-y-5 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 group-hover:scale-105 transition-transform">
                      <Clock className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      Caso Crítico • 2 min
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Simulação Rápida Beira-Leito
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Cenário de urgência beira-leito (Sepse com Hipotensão ou ICC Descompensada). Treine a agilidade de passar dados críticos em menos de 2 minutos.
                  </p>
                </div>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    const criticalCase = PRESET_HANDOFF_SCENARIOS.find((c) => c.id === "sepse_urinaria") || PRESET_HANDOFF_SCENARIOS[1];
                    setCurrentCase(criticalCase);
                    setActiveTab("free_voice");
                    setViewMode("workspace");
                  }}
                  className="w-full rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs py-2.5 h-auto flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>Iniciar Simulação Rápida</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Opção 4: Histórico & Exercícios Anteriores */}
              <div
                onClick={() => setIsHistoryOpen(true)}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-white dark:bg-slate-900 p-6 transition-all shadow-xs hover:shadow-lg cursor-pointer flex flex-col justify-between space-y-5 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                      <History className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Histórico Oficial
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Histórico de Casos & Debriefings
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Acesse o histórico das suas passagens de plantão, tempo gasto, pareceres pedagógicos e retome atividades não concluídas em 100%.
                  </p>
                </div>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsHistoryOpen(true);
                  }}
                  variant="outline"
                  className="w-full rounded-2xl border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold text-xs py-2.5 h-auto flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <History className="h-4 w-4 mr-1 text-emerald-600" />
                  <span>Abrir Histórico Completo</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Barra Superior Limpa e Funcional com Botão de Voltar para Modos */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("choose")}
                  className="rounded-xl text-xs font-bold text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 h-8 px-2.5 -ml-1 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Modos SBAR
                </Button>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Passagem de Plantão SBAR
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Meta 2 OMS • COFEN 736/2024
                </span>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  <Clock className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  <span>{clinicalHistoryService.formatDuration(activitySeconds)}</span>
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsHistoryOpen(true)}
                  className="rounded-xl border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/60 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  <History className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Histórico SBAR</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveDraft}
                  className="rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  <BookmarkPlus className="h-3.5 w-3.5 text-amber-500" />
                  <span className="hidden sm:inline">Salvar Rascunho</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent("open-goti-chat", {
                        detail: {
                          prompt: "Goti, como estruturo a passagem de plantão no método SBAR? Me dê um modelo didático de exemplo para eu aprender a fazer com minhas palavras!"
                        }
                      })
                    );
                  }}
                  className="rounded-xl border-teal-300 dark:border-teal-700 bg-teal-50/60 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Dúvidas? Fale com o Goti
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

        {/* Banner de Acesso Rápido ao Histórico SBAR */}
        <div
          onClick={() => setIsHistoryOpen(true)}
          className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform shadow-2xs">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Consultar Histórico de Passagens de Plantão & Rascunhos</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  Retomar Atividades
                </span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Veja as passagens de plantão que você já realizou, o feedback do Goti e continue treinos em andamento.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsHistoryOpen(true);
            }}
            className="rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-white dark:hover:bg-slate-900 shrink-0"
          >
            <span>Abrir Histórico</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1 text-teal-600" />
          </Button>
        </div>

        {/* Painel do Caso Clínico Ativo: 1 Caso por Vez (Design Focado & Despoluído) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                Caso Simulado à Beira-Leito
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {currentCase.sector || currentCase.bed}
              </span>
            </div>

            <Button
              type="button"
              onClick={handleGenerateRandomScenario}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 flex items-center gap-2 shadow-xs transition-all active:scale-98 self-start sm:self-auto"
              title="Sortear aleatoriamente outro caso clínico"
            >
              <Shuffle className="h-4 w-4" />
              <span>Sortear Novo Caso Aleatório</span>
            </Button>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{currentCase.name} ({currentCase.age}a)</span>
                <span className="text-slate-400 font-normal">•</span>
                <span className="text-emerald-800 dark:text-emerald-400 font-semibold text-sm">{currentCase.diagnosis || currentCase.title}</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
                {currentCase.clinicalSummary || currentCase.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shrink-0">
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

          <button
            onClick={() => setActiveTab("confirm")}
            className={`pb-3 px-1 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === "confirm"
                ? "border-teal-700 text-teal-900 dark:border-teal-400 dark:text-teal-300 font-extrabold"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>3. Confirmar Envio & Resumo SBAR (100%)</span>
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
              <span>4. Conclusão & Parecer do Goti (Score: {tutorEvaluation.safetyScore}/100)</span>
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
                    onClick={() => {
                      window.dispatchEvent(
                        new CustomEvent("open-goti-chat", {
                          detail: {
                            prompt: `Goti, estou com dúvidas de como redigir o campo de ${currentGuided.title} (${currentGuided.label}) no SBAR. Como devo preencher este pilar? Me mostre apenas um modelo de exemplo didático para eu entender como fazer!`
                          }
                        })
                      );
                    }}
                    className="rounded-xl border-teal-300 dark:border-teal-800 bg-teal-50/80 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 hover:bg-teal-100 text-xs font-bold shrink-0 shadow-2xs flex items-center gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Dúvidas? Fale com o Goti
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
                        <Sparkles className="h-3.5 w-3.5 animate-spin text-white" /> Goti analisando...
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5 text-white" /> Concluir e Transmitir para o Goti IA
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

        {/* CONTEÚDO DA ABA 3: DEBRIEFING SOCRÁTICO DO PRECEPTOR CLÍNICO IA */}
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
    </div>
  );
}
