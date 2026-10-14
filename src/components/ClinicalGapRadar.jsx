import React, { useState } from "react";
import { AlertCircle, Plus, CheckCircle2, ClipboardCheck, Stethoscope, Lightbulb, Check, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SEMIOLOGY_KNOWLEDGE_BASE } from "@/data/semiologyFindings";

/**
 * ClinicalGapRadar.jsx
 * Radar de Parâmetros Clínicos e Verificação de Protocolo.
 * Permite ao estudante identificar parâmetros não investigados e exercitar o exame físico
 * interativo à beira-leito, transformando a busca de lacunas em uma experiência formativa ativa.
 */
export default function ClinicalGapRadar({
  detectedItems = [],
  missingGaps = [],
  onAddGap,
  title = "Verificação de Protocolo Clínico",
  completenessPercentage = 70
}) {
  const [activeGap, setActiveGap] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  function handleOpenGap(gap) {
    setActiveGap(gap);
    setSelectedOptionId(null);
    setIsAnswered(false);
  }

  function handleCloseModal() {
    setActiveGap(null);
    setSelectedOptionId(null);
    setIsAnswered(false);
  }

  const findingData = activeGap ? SEMIOLOGY_KNOWLEDGE_BASE[activeGap.key] : null;

  function handleSelectOption(opt) {
    setSelectedOptionId(opt.id);
    setIsAnswered(true);
  }

  function handleConfirmFinding() {
    if (!activeGap) return;
    const resulting = findingData?.resultingItem || {
      label: activeGap.label.split(" ")[0] || "Parâmetro",
      value: "Avaliado e Registrado",
      status: "normal"
    };

    if (onAddGap) {
      onAddGap(activeGap, resulting);
    }
    handleCloseModal();
  }

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
                <span className={`h-1.5 w-1.5 rounded-full ${item.status === 'critical' ? 'bg-rose-600' : item.status === 'altered' ? 'bg-amber-500' : 'bg-teal-600'}`} />
                <span className="font-semibold text-slate-800">{item.label}:</span>
                <span className="text-slate-600">{item.value}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Parâmetros Faltantes (Exame Físico Interativo) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1 uppercase tracking-wide">
            <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Parâmetros Complementares Recomendados ({missingGaps.length})
          </span>
          <span className="text-[11px] text-teal-700 font-medium">Toque para investigar ativamente</span>
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
                onClick={() => handleOpenGap(gap)}
                className="group flex items-start justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-teal-500 hover:bg-slate-50 transition-all text-left"
              >
                <div className="space-y-0.5 pr-2">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-teal-900 block flex items-center gap-1.5">
                    <Stethoscope className="h-3.5 w-3.5 text-teal-600 shrink-0" />
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

      {/* Modal Interativo de Exame Físico & Julgamento Propedêutico */}
      <Dialog open={Boolean(activeGap)} onOpenChange={(open) => { if (!open) handleCloseModal(); }}>
        <DialogContent className="sm:max-w-xl rounded-2xl p-6">
          <DialogHeader className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 self-start">
              <Stethoscope className="h-3.5 w-3.5" />
              Exame Físico Guiado à Beira-Leito
            </div>
            <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
              {findingData?.title || activeGap?.label}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 leading-relaxed">
              {findingData?.maneuver || activeGap?.hint || "Posicione o paciente e execute a propedêutica clínica recomendada para fundamentar o raciocínio."}
            </DialogDescription>
          </DialogHeader>

          {/* Dilema de Avaliação Prática */}
          <div className="space-y-3 py-2">
            <span className="text-xs font-bold text-slate-800 block">
              {findingData?.prompt || "Qual achado clínico você identifica durante o exame físico?"}
            </span>

            {findingData?.options ? (
              <div className="space-y-2">
                {findingData.options.map((opt) => {
                  const isSelected = selectedOptionId === opt.id;
                  let cardStyle = "border-slate-200 bg-white hover:border-teal-400 hover:bg-slate-50 text-slate-700";

                  if (isAnswered) {
                    if (opt.isCorrect) {
                      cardStyle = "border-teal-500 bg-teal-50/70 text-teal-950 font-medium";
                    } else if (isSelected && !opt.isCorrect) {
                      cardStyle = "border-rose-300 bg-rose-50 text-rose-900";
                    } else {
                      cardStyle = "border-slate-100 bg-slate-50/50 text-slate-400 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(opt)}
                      className={`w-full text-left p-3 rounded-xl border text-xs leading-relaxed transition-all flex items-start gap-2.5 ${cardStyle}`}
                    >
                      <div className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isAnswered && opt.isCorrect
                          ? "bg-teal-600 border-teal-600 text-white"
                          : isAnswered && isSelected && !opt.isCorrect
                          ? "bg-rose-500 border-rose-500 text-white"
                          : "border-slate-300"
                      }`}>
                        {isAnswered && opt.isCorrect ? <Check className="h-2.5 w-2.5" /> : null}
                      </div>
                      <div className="space-y-1">
                        <span>{opt.label}</span>
                        {isAnswered && isSelected && (
                          <p className={`text-[11px] leading-tight mt-1 ${opt.isCorrect ? "text-teal-800 font-semibold" : "text-rose-700"}`}>
                            {opt.feedback}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                <p>
                  Parâmetro: <strong>{activeGap?.label}</strong>. Confirme a realização da técnica de semiologia e o registro no prontuário.
                </p>
              </div>
            )}

            {/* Pérola Clínica Formativa pós-resposta */}
            {isAnswered && findingData?.pearl && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1 animate-in fade-in">
                <span className="font-bold flex items-center gap-1.5 text-amber-900">
                  <Lightbulb className="h-4 w-4 text-amber-600" /> Pérola de Enfermagem:
                </span>
                <p className="leading-relaxed text-[11px]">{findingData.pearl}</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-row justify-between items-center gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCloseModal}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmFinding}
              disabled={findingData?.options && !isAnswered}
              className="rounded-xl text-xs bg-teal-700 hover:bg-teal-800 text-white font-semibold flex items-center gap-1.5"
            >
              <span>Incorporar ao Prontuário</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
