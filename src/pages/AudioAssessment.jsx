import React, { useState, useRef, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
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
  AlertCircle
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

      // Inicia reconhecimento de voz nativo do navegador em pt-BR (gratuito)
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
            console.warn("Reconhecimento de fala nativo:", e?.error);
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {
          console.warn("Web Speech API não inicializada:", e);
        }
      }
    } catch {
      setError("Não foi possível acessar o microfone. Verifique as permissões do navegador.");
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
    if (!audioBlob && !transcript.trim()) return;
    setProcessing(true);
    setError("");
    setStage("Enviando áudio...");

    try {
      let file_url = null;
      if (audioBlob) {
        const file = new File([audioBlob], "avaliacao.webm", { type: "audio/webm" });
        const uploadFn = base44.integrations?.Core?.UploadFile || base44.integrations?.Core?.UploadPublicFile;
        if (uploadFn) {
          const uploadRes = await uploadFn({ file }).catch(() => ({ file_url: null }));
          file_url = uploadRes?.file_url;
        }
      }

      setStage("Processando relato e extraindo parâmetros clínicos...");
      const res = await base44.functions.invoke("audioAssessment", {
        audio_url: file_url,
        patient_id: id,
        transcript: transcript.trim(),
        parsed: parsedData,
      });

      if (res?.error) throw new Error(res.error);

      const data = res?.data || res;
      const targetId = data?.assessment_id || data?.id || res?.assessment_id || res?.id;

      if (!targetId) {
        throw new Error("Não foi possível identificar o identificador da avaliação gerada.");
      }

      setStage("Gerando plano de cuidados e diagnósticos NANDA-I...");
      setTimeout(() => {
        navigate(`/assessment/${targetId}/ai`);
      }, 1200);
    } catch (err) {
      setError(err?.message || "Erro ao processar áudio.");
      setProcessing(false);
      setStage("");
    }
  }

  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-base font-semibold text-slate-800">Avaliação por Áudio</h1>
              <p className="text-xs text-slate-400">Dite o relato clínico à beira-leito com transcrição inteligente</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700 flex items-start gap-2.5">
            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Recording / Idle state */}
        {!processing && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            {!audioUrl ? (
              <>
                <p className="mb-1 text-sm font-medium text-slate-700">
                  {recording ? "Ouvindo e gravando em tempo real..." : "Toque para começar a ditar"}
                </p>
                <p className="mb-6 text-xs text-slate-400">
                  {recording
                    ? fmtTime(recordingTime)
                    : "Dite livremente: PA, frequência cardíaca, dor, risco de queda e escalas"}
                </p>
                <button
                  onClick={recording ? stopRecording : startRecording}
                  className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full transition shadow-md ${
                    recording
                      ? "bg-rose-500 text-white animate-pulse"
                      : "bg-teal-600 text-white hover:bg-teal-700"
                  }`}
                >
                  {recording ? <Square className="h-8 w-8" /> : <Mic className="h-10 w-10" />}
                </button>
                <p className="mt-6 text-xs text-slate-400">
                  {recording ? "Toque no quadrado quando terminar o relato" : "Ex: 'PA 120 por 80, FC 78, Sat 97, sem dor, orientado...'"}
                </p>
              </>
            ) : (
              <>
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                  <AudioLines className="h-7 w-7" />
                </div>
                <p className="text-sm font-semibold text-slate-800">Gravação concluída</p>
                <audio src={audioUrl} controls className="mx-auto mt-3 w-full max-w-sm" />
                <div className="mt-5 flex gap-2">
                  <Button variant="outline" onClick={reset} className="flex-1 rounded-xl">
                    <RotateCcw className="mr-2 h-4 w-4" /> Gravar novamente
                  </Button>
                  <Button onClick={handleProcess} className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium">
                    <Sparkles className="mr-2 h-4 w-4" /> Processar e Gerar Plano
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Live transcription & extracted clinical preview */}
        {!processing && transcript && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Transcrição do Relato
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingTranscript((prev) => !prev)}
                className="h-7 text-xs text-slate-500 gap-1"
              >
                <Edit3 className="h-3.5 w-3.5" />
                {isEditingTranscript ? "Concluir edição" : "Ajustar texto"}
              </Button>
            </div>

            {isEditingTranscript ? (
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={4}
                className="w-full text-sm rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-700"
                placeholder="Ajuste o texto reconhecido se necessário..."
              />
            ) : (
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5 text-sm text-slate-700 leading-relaxed text-left">
                {transcript}
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
                  Nenhum sinal vital ou escala identificado ainda. Você pode continuar falando ou ajustar o texto.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Processing state */}
        {processing && (
          <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-8 text-center shadow-sm">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-teal-600" />
            <p className="mt-4 text-base font-semibold text-slate-800">{stage}</p>
            <p className="mt-1 text-xs text-slate-500">Integrando sinais vitais, escalas e plano de cuidados</p>

            {transcript && (
              <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 text-left">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Transcrição Utilizada</p>
                <p className="text-xs text-slate-600 leading-relaxed">{transcript}</p>
              </div>
            )}
          </div>
        )}

        {/* Info card */}
        {!processing && !audioUrl && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-800">Guia de Uso Rápido</p>
            <ul className="mt-2 space-y-1.5 text-xs text-slate-500">
              <li>• <strong>1. Toque no microfone</strong> e fale naturalmente o caso do paciente.</li>
              <li>• <strong>2. Acompanhe a transcrição em tempo real</strong> e a extração automática de PA, FC, SatO₂, Dor e escalas.</li>
              <li>• <strong>3. Ajuste o texto se quiser</strong> e clique em <em>Processar e Gerar Plano</em> para receber os diagnósticos NANDA-I, NIC e NOC.</li>
            </ul>
            <p className="mt-3 rounded-lg bg-teal-50 p-2.5 text-[11px] text-teal-800 font-medium">
              Compatível com o reconhecimento de voz nativo do navegador — seguro, rápido e com privacidade LGPD.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
