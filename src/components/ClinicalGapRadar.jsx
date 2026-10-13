import React from "react";
import { AlertCircle, Plus, CheckCircle2, Stethoscope, Search, Sparkles, ShieldAlert, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * ClinicalGapRadar.jsx
 * Radar de Lacunas Clínicas e Pontos Cegos da Avaliação de Enfermagem.
 * Inspirado nas melhores práticas de engenharia reversa de simuladores clínicos (AMBOSS / Osmosis).
 * Permite ao estudante identificar o que está faltando na avaliação física/anamnese e adicionar com 1 clique!
 */
export default function ClinicalGapRadar({
  detectedItems = [],
  missingGaps = [],
  onAddGap,
  title = "Radar de Lacunas Clínicas & Dados Faltantes",
  completenessPercentage = 70
}) {
  return (
    <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 p-4 sm:p-5 shadow-xs space-y-4">
      {/* Cabeçalho do Radar com Barra de Completude */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
            <Search className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight flex items-center gap-1.5">
              {title}
              <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                Detecção Ativa por IA
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Evite fechamento prematuro: identifique parâmetros críticos não coletados
            </p>
          </div>
        </div>

        {/* Medidor de Completude da Avaliação */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white/90 border border-amber-200 px-3 py-1.5 rounded-xl shadow-2xs">
          <span className="text-[11px] font-medium text-slate-600">Completude:</span>
          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                completenessPercentage >= 85
                  ? "bg-emerald-500"
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

      {/* Sinais Já Identificados (Positivos) */}
      {detectedItems.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 uppercase tracking-wide">
            <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" /> Coletados na Avaliação ({detectedItems.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {detectedItems.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-white px-2.5 py-1 text-xs text-slate-700 shadow-2xs"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                <span className="font-semibold text-teal-800">{item.label}:</span>
                <span className="font-medium text-slate-800">{item.value}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* LACUNAS FALTANTES (O QUE O PROFESSOR E A IA INDICAM PARA ADICIONAR) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1 uppercase tracking-wide">
            <AlertCircle className="h-3.5 w-3.5 text-amber-600" /> Parâmetros e Cuidados Faltantes ({missingGaps.length})
          </span>
          <span className="text-[11px] text-slate-500">Toque em (+) para investigar ou adicionar</span>
        </div>

        {missingGaps.length === 0 ? (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Excelente! Não há lacunas clínicas críticas pendentes nesta etapa da avaliação.</span>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-2">
            {missingGaps.map((gap, idx) => (
              <button
                key={gap.key || idx}
                type="button"
                onClick={() => onAddGap && onAddGap(gap)}
                className="group flex items-start justify-between p-2.5 rounded-xl border border-amber-300 bg-white/95 hover:border-teal-500 hover:bg-teal-50/50 hover:shadow-xs transition-all text-left"
              >
                <div className="space-y-0.5 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500 group-hover:bg-teal-600 transition-colors" />
                    <span className="text-xs font-bold text-slate-800 group-hover:text-teal-900">
                      {gap.label}
                    </span>
                    <span className="text-[9px] font-semibold uppercase px-1 rounded bg-amber-100 text-amber-800">
                      faltando
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 group-hover:text-slate-600 leading-tight">
                    {gap.hint || gap.desc || "Investigar e registrar para fechar o julgamento clínico."}
                  </p>
                </div>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800 group-hover:bg-teal-600 group-hover:text-white transition-all shadow-2xs">
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
