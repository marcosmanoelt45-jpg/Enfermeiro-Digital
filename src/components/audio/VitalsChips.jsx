import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Plus, Sparkles } from "lucide-react";
import { describeVitals, getMissingVitals } from "@/lib/vitalsParser";

export default function VitalsChips({ vitals, text = "", onInsertMissing }) {
  const items = describeVitals(vitals);
  const missing = getMissingVitals(vitals, text);

  return (
    <div className="mt-3 space-y-3">
      {/* SINAIS IDENTIFICADOS */}
      {items.length > 0 ? (
        <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-teal-800">
              <CheckCircle2 className="h-4 w-4 text-teal-600" /> Sinais Vitais Identificados no Relato
            </p>
            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800">
              {items.length} detectados
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {items.map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-white px-3 py-1.5 text-xs text-slate-800 font-medium shadow-xs"
              >
                <span className="font-bold text-teal-700">{item.label}:</span>
                <span className="font-semibold text-slate-900">{item.value}</span>
                {item.unit && <span className="text-slate-500 text-[11px]">{item.unit}</span>}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <p className="font-medium flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-600" /> Nenhum sinal vital foi reconhecido no texto
          </p>
          <p className="mt-1 text-[11px] text-amber-700">
            Dite no formato “PA 120 por 80”, “FC 78”, “Tax 36,5”, “Sat 96%”, “dor 7” — ou ajuste no campo de texto acima.
          </p>
        </div>
      )}

      {/* SINAIS FALTANTES (CHECKLIST DE SEGURANÇA CLÍNICA) */}
      {missing.length > 0 && (
        <div className="rounded-xl border border-amber-200/90 bg-amber-50/60 p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-900">
              <AlertCircle className="h-4 w-4 text-amber-600" /> Parâmetros Faltantes no Relato ({missing.length})
            </p>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
              Atenção Clínica
            </span>
          </div>

          <p className="mt-1 text-xs text-amber-800/90 leading-relaxed">
            Estes parâmetros não foram detectados no relato. Se você os aferiu, toque no item para adicioná-lo ou dite no texto antes de gerar o plano:
          </p>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {missing.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => onInsertMissing && onInsertMissing(item)}
                title={`Clique para adicionar: ${item.desc}`}
                className="group inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white/95 px-2.5 py-1 text-xs text-slate-700 hover:border-amber-400 hover:bg-amber-50/80 transition-all text-left shadow-2xs"
              >
                <span className="h-2 w-2 rounded-full bg-amber-500 group-hover:scale-125 transition-transform" />
                <span className="font-medium text-slate-800">{item.label}</span>
                <span className="text-[10px] text-amber-700 bg-amber-100/70 rounded px-1 font-medium">faltando</span>
                {onInsertMissing && (
                  <Plus className="h-3 w-3 text-slate-400 group-hover:text-amber-700 group-hover:scale-110 ml-0.5" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
