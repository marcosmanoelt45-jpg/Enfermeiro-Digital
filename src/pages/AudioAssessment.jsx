import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import useAudioRecorder from "@/hooks/useAudioRecorder";
import RecorderPanel from "@/components/audio/RecorderPanel";
import TranscriptPanel from "@/components/audio/TranscriptPanel";
import StatusCard from "@/components/audio/StatusCard";
import { getAssemblyAiKey, transcribeAudio } from "@/lib/assemblyai";
import { parseVitalsFromTranscript } from "@/lib/vitalsParser";
import { computeAllScores } from "@/lib/riskEngine";
import { audioTranscriptionService } from "@/services/audioTranscriptionService";

export default function AudioAssessment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const recorder = useAudioRecorder();
  const [transcript, setTranscript] = useState("");
  const [manual, setManual] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");

  const hasAssemblyKey = Boolean(getAssemblyAiKey());
  const hasGeminiKey = Boolean(audioTranscriptionService.getGeminiKey());
  const hasAnyKey = hasAssemblyKey || hasGeminiKey;

  const vitals = useMemo(() => parseVitalsFromTranscript(transcript), [transcript]);

  async function handleTranscribe() {
    setError("");
    if (!recorder.blob) {
      setError("Nenhum áudio gravado. Grave novamente o relato.");
      return;
    }

    setTranscribing(true);
    try {
      // Usa cascata: AssemblyAI -> Gemini Multimodal Audio
      let text = "";
      if (hasAssemblyKey) {
        text = await transcribeAudio(recorder.blob, {
          apiKey: getAssemblyAiKey(),
          onStage: setStage,
        });
      } else if (hasGeminiKey) {
        const res = await audioTranscriptionService.transcribeWithGemini(
          recorder.blob,
          (msg) => setStage(msg)
        );
        text = res?.text || "";
      } else {
        setError("Configure uma chave da AssemblyAI ou do Google Gemini em Minha Conta para transcrever o áudio.");
        setManual(true);
        setTranscribing(false);
        return;
      }

      if (!text) {
        setError("A transcrição não retornou texto audível. Escreva o relato manualmente.");
        setManual(true);
      } else {
        setTranscript(text);
      }
    } catch (err) {
      console.warn("Falha na transcrição:", err);
      setError(err?.message || "Não foi possível transcrever o áudio. Você pode digitar o relato abaixo.");
      setManual(true);
    } finally {
      setTranscribing(false);
      setStage("");
    }
  }

  async function handleConfirm() {
    setError("");
    const relato = transcript.trim();
    if (!relato) {
      setError("Escreva ou transcreva o relato antes de gerar a avaliação.");
      return;
    }
    setCreating(true);
    setStage("Extraindo parâmetros clínicos e salvando avaliação...");
    try {
      const data = parseVitalsFromTranscript(relato);
      const scores = computeAllScores(data);
      let patient = null;
      try {
        patient = await base44.entities.Patient.get(id);
      } catch {}

      const assessment = await base44.entities.Assessment.create({
        ...data,
        ...scores,
        patient_id: id,
        patient_name: patient?.name,
        notes: relato,
        ai_status: "pending",
      });

      setStage("Gerando plano de cuidados e diagnósticos NANDA-I...");
      // Dispara a geração de IA em background e navega
      base44.functions
        .invoke("generateCarePlan", { assessment_id: assessment.id })
        .catch(() => {});

      navigate(`/assessment/${assessment.id}/ai`);
    } catch (err) {
      console.error("Erro ao criar avaliação:", err);
      setError(err?.message || "Não foi possível criar a avaliação.");
      setCreating(false);
      setStage("");
    }
  }

  function handleReset() {
    recorder.reset();
    setTranscript("");
    setManual(false);
    setError("");
    setStage("");
  }

  const showReview = (Boolean(transcript) || manual) && !transcribing && !creating;
  const busy = transcribing || creating;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-base font-semibold text-slate-800">Avaliação por Áudio</h1>
                <p className="text-xs text-slate-400">Grave o relato clínico: transcrição automática com IA</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/conta")}
              className="rounded-xl h-8 w-8 text-slate-400 hover:text-teal-700"
              title="Configurações de IA"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        {(error || recorder.error) && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error || recorder.error}
          </div>
        )}

        {!hasAnyKey && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-amber-800">
              <AlertTriangle className="h-4 w-4" /> Chave de Transcrição não configurada
            </p>
            <p className="mt-1 text-xs text-amber-700">
              Para transcrição automática do microfone, configure sua chave da AssemblyAI ou do Google Gemini em Minha Conta. Ou se preferir, digite o relato diretamente.
            </p>
            <Button
              size="sm"
              onClick={() => navigate("/conta")}
              className="mt-3 rounded-xl bg-amber-600 hover:bg-amber-700"
            >
              Configurar chave em Minha Conta
            </Button>
          </div>
        )}

        {busy ? (
          <StatusCard
            title={stage}
            subtitle={
              transcribing
                ? "A transcrição com IA leva apenas alguns instantes"
                : "Criando a avaliação e calculando escores de risco"
            }
            detail={transcript}
          />
        ) : showReview ? (
          <>
            {recorder.url && <audio src={recorder.url} controls className="w-full rounded-xl shadow-sm" />}
            <TranscriptPanel
              value={transcript}
              onChange={setTranscript}
              vitals={vitals}
              onConfirm={handleConfirm}
              onReset={handleReset}
            />
          </>
        ) : (
          <RecorderPanel
            recording={recorder.recording}
            seconds={recorder.seconds}
            audioUrl={recorder.url}
            busy={busy}
            onStart={recorder.start}
            onStop={recorder.stop}
            onTranscribe={handleTranscribe}
            onManual={() => setManual(true)}
            onReset={handleReset}
          />
        )}

        {!busy && !showReview && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium text-slate-700">Como funciona</p>
            <ul className="mt-2 space-y-1.5 text-xs text-slate-500">
              <li>1. Grave o relato clínico do paciente falando sinais vitais, dor, queixas e escalas.</li>
              <li>2. Toque em “Transcrever &amp; Gerar Plano” — a IA transcreve o áudio em português.</li>
              <li>3. Revise o texto: os sinais vitais são identificados dele e a avaliação é registrada na hora.</li>
              <li>4. O plano de cuidados (NANDA-I, NIC e NOC) é gerado automaticamente.</li>
            </ul>
            <p className="mt-3 rounded-lg bg-teal-50 p-2 text-[11px] text-teal-800">
              Sem limite de créditos da plataforma: opera diretamente com suas chaves de IA no navegador.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
