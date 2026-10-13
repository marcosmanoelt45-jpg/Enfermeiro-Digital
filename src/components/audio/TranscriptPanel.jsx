import React, { useRef } from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import VitalsChips from "@/components/audio/VitalsChips";

export default function TranscriptPanel({ value, onChange, vitals, onConfirm, onReset }) {
  const textareaRef = useRef(null);

  function handleInsertMissing(item) {
    if (!item?.snippet) return;
    const current = (value || "").trim();
    const updated = current ? `${current}${item.snippet}` : item.snippet.replace(/^,\s*/, "");
    onChange(updated);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(updated.length, updated.length);
      }
    }, 50);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">Relato transcrito</p>
          <p className="mt-0.5 text-xs text-slate-400">
            Revise e corrija o texto antes de confirmar — é dele que saem os sinais vitais, escalas e todo o prontuário.
          </p>
        </div>
      </div>

      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ex: Paciente chega desacordado com glicemia de 30, frequência respiratória 12, frequência cardíaca 13, pressão arterial 80 por 60, saturação de 80, aparentemente uma lesão na cabeça pós-queda. Sem acompanhante..."
        className="mt-3 min-h-[140px] rounded-xl text-sm leading-relaxed"
      />

      <VitalsChips vitals={vitals} text={value} onInsertMissing={handleInsertMissing} />

      <div className="mt-4 flex gap-2">
        <Button variant="outline" onClick={onReset} className="rounded-xl">
          <RotateCcw className="mr-2 h-4 w-4" /> Refazer
        </Button>
        <Button
          onClick={onConfirm}
          disabled={!value.trim()}
          className="h-11 flex-1 rounded-xl bg-teal-600 text-base font-medium hover:bg-teal-700 shadow-sm"
        >
          <Sparkles className="mr-2 h-5 w-5" /> Confirmar e gerar plano
        </Button>
      </div>
    </div>
  );
}
