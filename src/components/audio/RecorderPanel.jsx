import React from "react";
import { AudioLines, Keyboard, Mic, RotateCcw, Sparkles, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RecorderPanel({ recording, seconds, audioUrl, busy, onStart, onStop, onTranscribe, onManual, onReset }) {
  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (audioUrl) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center shadow-xs">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
          <AudioLines className="h-7 w-7" />
        </div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Áudio gravado</p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-300">Ouça antes de transcrever, se quiser</p>
        <audio src={audioUrl} controls className="mx-auto mt-4 w-full max-w-sm" />
        <Button
          onClick={onTranscribe}
          disabled={busy}
          className="mt-5 h-12 w-full rounded-xl bg-teal-600 text-base font-semibold hover:bg-teal-700 text-white"
        >
          <Sparkles className="mr-2 h-5 w-5" /> Transcrever &amp; Gerar Plano
        </Button>
        <div className="mt-2 flex gap-2">
          <Button
            variant="outline"
            onClick={onReset}
            disabled={busy}
            className="flex-1 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Refazer
          </Button>
          <Button
            variant="ghost"
            onClick={onManual}
            disabled={busy}
            className="flex-1 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Keyboard className="mr-2 h-4 w-4" /> Escrever relato
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-xs">
      <p className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
        {recording ? "Gravando..." : "Toque para começar a gravar"}
      </p>
      <p className="mb-6 text-xs text-slate-500 dark:text-slate-300">
        {recording ? fmtTime(seconds) : "Dite os sinais vitais, escalas e observações do paciente"}
      </p>
      <button
        type="button"
        onClick={recording ? onStop : onStart}
        className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full transition shadow-md ${
          recording ? "animate-pulse bg-rose-500 text-white" : "bg-teal-600 text-white hover:bg-teal-700"
        }`}
      >
        {recording ? <Square className="h-8 w-8" /> : <Mic className="h-10 w-10" />}
      </button>
      <p className="mt-6 text-xs text-slate-500 dark:text-slate-300 font-medium">
        {recording
          ? "Toque no quadrado para parar"
          : "Ex: PA 120 por 80, FC 78, FR 18, Tax 36,5, Sat 96%, dor 7"}
      </p>
    </div>
  );
}
