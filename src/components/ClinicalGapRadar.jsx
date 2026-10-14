import React from "react";
import { AlertCircle, Plus, CheckCircle2, ClipboardCheck } from "lucide-react";

/**
 * ClinicalGapRadar.jsx
 * Radar de Parâmetros Clínicos e Verificação de Protocolo.
 * Permite ao estudante identificar parâmetros não investigados e incorporá-los ao raciocínio com 1 clique.
 */
export default function ClinicalGapRadar({
  detectedItems = [],
  missingGaps = [],
  onAddGap,
  title = "Verificação de Protocolo Clínico",
  completenessPercentage = 70
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      {/* Cabeçalho com Medidor de Completude */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-teal-800">
            <ClipboardCheck className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-500">
              Conferência de dados essenciais para o julgamento diagnóstico
            </p>
          </div>
        </div>

        {/* Barra de Progresso / Completude */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
          <span className="text-[11px] font-medium text-slate-600">Completude:</span>
          <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                completenessPercentage >= 85
                  ? "bg-teal-600"
                  : completenessPercentage >= 60
                  ? "bg-amber-500"
                  : "bg-rose-500"
              }`}
              style={{ width: `${Math.min(completenessPercentage, 100)}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-800">{completenessPercentage}%</span>
        </div>
      </div>

      {/* Sinais Coletados */}
      {detectedItems.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 uppercase tracking-wide">
            <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" /> Parâmetros Registrados ({detectedItems.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {detectedItems.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                <span className="font-semibold text-slate-800">{item.label}:</span>
                <span className="text-slate-600">{item.value}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Parâmetros Faltantes (Adicionar com 1 clique) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1 uppercase tracking-wide">
            <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Parâmetros Complementares Recomendados ({missingGaps.length})
          </span>
          <span className="text-[11px] text-slate-400">Toque em (+) para incorporar ao caso</span>
        </div>

        {missingGaps.length === 0 ? (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-teal-600" />
            <span>Todos os parâmetros essenciais desta etapa foram registrados com sucesso.</span>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-2">
            {missingGaps.map((gap, idx) => (
              <button
                key={gap.key || idx}
                type="button"
                onClick={() => onAddGap && onAddGap(gap)}
                className="group flex items-start justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-teal-500 hover:bg-slate-50 transition-all text-left"
              >
                <div className="space-y-0.5 pr-2">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-teal-900 block">
                    {gap.label}
                  </span>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    {gap.hint || gap.desc || "Investigar e registrar para complementar a avaliação."}
                  </p>
                </div>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-teal-700 group-hover:text-white transition-all">
                  <Plus className="h-4 w-4" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
