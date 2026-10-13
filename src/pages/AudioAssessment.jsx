import React, { useState, useRef, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { audioTranscriptionService } from "@/services/audioTranscriptionService";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Mic,
  Square,
  Loader2,
  AudioLines,
  RotateCcw,
  Sparkles,
  Activity,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Settings,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseClinicalSpeech, describeParsed } from "@/lib/clinicalSpeechParser";

export default function AudioAssessment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [stage, setStage] = useState("");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [activeEngine, setActiveEngine] = useState("Detectando...");

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const transcriptAccumulatorRef = useRef("");

  // Extração clínica dinâmica a partir do relato falado
  const parsedData = useMemo(() => parseClinicalSpeech(transcript), [transcript]);
  const parsedDescriptions = useMemo(() => describeParsed(parsedData), [parsedData]);

  useEffect(() => {
    setActiveEngine(audioTranscriptionService.getActiveEngine());
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  async function startRecording() {
    setError("");
    transcriptAccumulatorRef.current = "";
    setTranscript("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);

      // Tenta reconhecimento de voz preliminar em tempo real caso disponível
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = "pt-BR";
          recognition.continuous = true;
          recognition.interimResults = true;

          recognition.onresult = (event) => {
            let finalPart = "";
            let interimPart = "";

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const res = event.results[i];
              if (res.isFinal) {
                finalPart += res[0].transcript + " ";
              } else {
                interimPart += res[0].transcript;
              }
            }

            if (finalPart) {
              transcriptAccumulatorRef.current = (transcriptAccumulatorRef.current + " " + finalPart).trim();
            }

            const currentLive = (transcriptAccumulatorRef.current + " " + interimPart).trim();
            if (currentLive) {
              setTranscript(currentLive);
            }
          };

          recognition.onerror = (e) => {
            console.warn("Web Speech API nativa avisou:", e?.error);
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {
          console.warn("Web Speech API indisponível:", e);
        }
      }
    } catch {
      setError("Não foi possível acessar o microfone. Verifique as permissões de áudio no seu navegador.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      setRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
  }

  function reset() {
    stopRecording();
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setTranscript("");
    transcriptAccumulatorRef.current = "";
    setError("");
    setIsEditingTranscript(false);
  }

  async function handleProcess() {
    if (!audioBlob && !transcript.trim()) {
      setError("Grave um áudio ou digite o relato clínico antes de continuar.");
      return;
    }

    setProcessing(true);
    setError("");
    setStage("Iniciando transcrição com IA...");

    try {
      let finalTranscriptText = transcript.trim();

      // 1. Executa transcrição profissional do arquivo de áudio via AssemblyAI ou Gemini se disponível
      if (audioBlob) {
        try {
          const transResult = await audioTranscriptionService.transcribe(
            audioBlob,
            transcript,
            (msg) => setStage(msg)
          );
          if (transResult?.text) {
            finalTranscriptText = transResult.text.trim();
            setTranscript(finalTranscriptText);
          }
        } catch (sttErr) {
          console.warn("Erro no STT em nuvem:", sttErr);
          if (!finalTranscriptText) {
            throw sttErr;
          }
        }
      }

      if (!finalTranscriptText) {
        throw new Error(
          "Nenhum relato clínico foi detectado. Você pode digitar o texto no campo de transcrição ou configurar sua chave da API do AssemblyAI / Google Gemini em Minha Conta."
        );
      }

      // 2. Extrai dados clínicos estruturados a partir do texto completo
      const dynamicParsed = parseClinicalSpeech(finalTranscriptText);

      // 3. Opcional: tenta fazer upload do áudio para arquivamento
      let file_url = null;
      if (audioBlob) {
        setStage("Arquivando áudio da gravação...");
        try {
          const file = new File([audioBlob], "avaliacao.webm", { type: "audio/webm" });
          const uploadFn = base44.integrations?.Core?.UploadFile || base44.integrations?.Core?.UploadPublicFile;
          if (uploadFn) {
            const uploadRes = await uploadFn({ file }).catch(() => null);
            file_url = uploadRes?.file_url || null;
          }
        } catch {}
      }

      // 4. Salva a avaliação clínica
      setStage("Registrando parâmetros clínicos e escalas...");
      const res = await base44.functions.invoke("audioAssessment", {
        audio_url: file_url,
        patient_id: id,
        transcript: finalTranscriptText,
        parsed: dynamicParsed,
      });

      if (res?.error) throw new Error(res.error);

      const data = res?.data || res;
      const targetId = data?.assessment_id || data?.id || res?.assessment_id || res?.id;

      if (!targetId) {
        throw new Error("Não foi possível gerar a identificação da avaliação clínica.");
      }

      setStage("Gerando plano de cuidados e diagnósticos NANDA-I...");
      setTimeout(() => {
        navigate(`/assessment/${targetId}/ai`);
      }, 1000);
    } catch (err) {
      console.error("Erro ao processar áudio:", err);
      setError(err?.message || "Erro ao processar áudio.");
      setProcessing(false);
      setStage("");
    }
  }

  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl shrink-0">
                <ArrowLeft className="h-5 w-5 text-slate-700" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-base font-semibold text-slate-800 leading-tight">Avaliação por Áudio</h1>
                <p className="text-xs text-slate-500 truncate">Dite o relato clínico à beira-leito</p>
              </div>
            </div>

            {/* BADGE DE MOTOR DE TRANSCRIÇÃO ATIVO */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-2.5 py-1 text-[11px] font-medium text-teal-800" title="Motor ativo para processamento de voz">
                <Cpu className="h-3 w-3 text-teal-600" />
                {activeEngine}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/conta")}
                className="rounded-xl h-8 w-8 text-slate-400 hover:text-teal-700"
                title="Configurar chaves de IA (AssemblyAI / Google Gemini)"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-5 space-y-4">
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-start gap-3 shadow-sm">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 min-w-0">
              <p className="font-semibold text-rose-900">Atenção no processamento do áudio</p>
              <p className="text-xs leading-relaxed text-rose-700">{error}</p>
              <div className="pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate("/conta")}
                  className="rounded-xl text-xs h-7 border-rose-300 text-rose-800 hover:bg-rose-100"
                >
                  Configurar chave de IA em Minha Conta
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Recording / Idle state */}
        {!processing && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            {!audioUrl ? (
              <>
                <p className="mb-1 text-sm font-semibold text-slate-800">
                  {recording ? "Gravando áudio com alta precisão..." : "Toque no microfone para começar a ditar"}
                </p>
                <p className="mb-6 text-xs text-slate-500">
                  {recording
                    ? `Duração da gravação: ${fmtTime(recordingTime)}`
                    : "Fale sinais vitais, dor, queixas, quedas e histórico do paciente"}
                </p>
                <button
                  onClick={recording ? stopRecording : startRecording}
                  className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full transition shadow-lg active:scale-95 ${
                    recording
                      ? "bg-rose-600 text-white animate-pulse"
                      : "bg-gradient-to-tr from-teal-600 to-emerald-600 text-white hover:from-teal-700 hover:to-emerald-700"
                  }`}
                  title={recording ? "Parar gravação" : "Iniciar gravação"}
                >
                  {recording ? <Square className="h-8 w-8" /> : <Mic className="h-10 w-10" />}
                </button>
                <p className="mt-6 text-xs text-slate-400">
                  {recording
                    ? "Toque no quadrado vermelho quando terminar de falar"
                    : "Ex: 'Paciente com PA 130 por 80, FC 88, dor nota 7 nas costas, saturação 95...'"}
                </p>
              </>
            ) : (
              <>
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 shadow-sm">
                  <AudioLines className="h-7 w-7 text-teal-600" />
                </div>
                <p className="text-sm font-semibold text-slate-800">Gravação finalizada com sucesso!</p>
                <p className="text-xs text-slate-400 mb-3">Ouça o áudio gravado e clique no botão abaixo para processar</p>
                <audio src={audioUrl} controls className="mx-auto mt-2 w-full max-w-sm rounded-xl" />

                <div className="mt-5 flex gap-2">
                  <Button variant="outline" onClick={reset} className="flex-1 rounded-xl py-5 font-medium">
                    <RotateCcw className="mr-2 h-4 w-4" /> Gravar novamente
                  </Button>
                  <Button
                    onClick={handleProcess}
                    className="flex-1 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 py-5 text-white font-semibold shadow-md active:scale-95 transition"
                  >
                    <Sparkles className="mr-2 h-4 w-4 text-amber-300" /> Transcrever & Gerar Plano
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Live transcription & extracted clinical preview */}
        {!processing && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`flex h-2.5 w-2.5 rounded-full ${recording ? "bg-emerald-500 animate-ping" : "bg-teal-600"}`} />
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Transcrição do Relato Clínico
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingTranscript((prev) => !prev)}
                className="h-7 text-xs text-slate-600 hover:text-teal-700 gap-1"
              >
                <Edit3 className="h-3.5 w-3.5" />
                {isEditingTranscript ? "Concluir edição" : "Editar manualmente"}
              </Button>
            </div>

            {isEditingTranscript ? (
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={4}
                className="w-full text-sm rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 leading-relaxed"
                placeholder="Escreva ou edite o relato clínico falado..."
              />
            ) : (
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5 text-sm text-slate-800 leading-relaxed text-left min-h-[60px]">
                {transcript || (
                  <span className="text-slate-400 italic">
                    O texto transcrito pelo microfone aparecerá aqui. Você também pode digitar se preferir.
                  </span>
                )}
              </div>
            )}

            {/* Badges de Parâmetros Clínicos Identificados Automaticamente */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 mb-2">
                <Activity className="h-4 w-4 text-teal-600" />
                <p className="text-xs font-semibold text-slate-700">
                  Parâmetros Identificados ({parsedDescriptions.length}):
                </p>
              </div>

              {parsedDescriptions.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {parsedDescriptions.map((desc, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-lg bg-teal-50 border border-teal-200 px-2.5 py-1 text-xs font-medium text-teal-800"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                      {desc}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Sinais vitais (PA, FC, TAX, SatO₂), dor e escalas falados serão destacados aqui automaticamente.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Processing state */}
        {processing && (
          <div className="rounded-2xl border border-teal-200 bg-teal-50/80 p-8 text-center shadow-sm space-y-4">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-teal-600" />
            <div>
              <p className="text-base font-semibold text-slate-800">{stage}</p>
              <p className="mt-1 text-xs text-slate-500">
                A IA analisa o áudio, transcreve os parâmetros clínicos e constrói o plano NANDA-I, NIC e NOC
              </p>
            </div>

            {transcript && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Relato Processado</p>
                <p className="text-xs text-slate-700 leading-relaxed">{transcript}</p>
              </div>
            )}
          </div>
        )}

        {/* Info card */}
        {!processing && !audioUrl && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
            <p className="text-sm font-semibold text-slate-800">Como funciona o Áudio Inteligente</p>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li>• <strong>Gravação Direta:</strong> O áudio é gravado no seu microfone com cancelamento de ruído.</li>
              <li>• <strong>Transcrição por IA (AssemblyAI / Gemini):</strong> O áudio é enviado diretamente para modelos de ponta especializados em português (pt-BR).</li>
              <li>• <strong>Extração Clínica:</strong> Sinais vitais, queixas de dor, risco de queda e escalas são extraídos automaticamente.</li>
              <li>• <strong>Geração NANDA-I:</strong> Em poucos segundos você recebe diagnósticos, intervenções e metas completas.</li>
            </ul>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-teal-700">
              <span>Para máxima precisão, configure suas chaves de API gratuitas:</span>
              <button onClick={() => navigate("/conta")} className="font-semibold underline hover:text-teal-900">
                Configurar em Minha Conta ↗
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
