import React from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import VitalsChips from "@/components/audio/VitalsChips";

export default function TranscriptPanel({ value, onChange, vitals, onConfirm, onReset }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-medium text-slate-700">Relato transcrito</p>
      <p className="mt-0.5 text-xs text-slate-400">
        Revise e corrija o texto antes de confirmar — é dele que saem os sinais vitais e as escalas.
      </p>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ex: Paciente com ferimento penetrante em dorso por arma de fogo, PA 120 por 80, FC 78, FR 18, Tax 36,5, Sat 96%, refere dor 7..."
        className="mt-3 min-h-[150px] rounded-xl text-sm"
      />
      <VitalsChips vitals={vitals} />
      <div className="mt-4 flex gap-2">
        <Button variant="outline" onClick={onReset} className="rounded-xl">
          <RotateCcw className="mr-2 h-4 w-4" /> Refazer
        </Button>
        <Button
          onClick={onConfirm}
          disabled={!value.trim()}
          className="h-11 flex-1 rounded-xl bg-teal-600 text-base hover:bg-teal-700"
        >
          <Sparkles className="mr-2 h-5 w-5" /> Confirmar e gerar plano
        </Button>
      </div>
    </div>
  );
}
