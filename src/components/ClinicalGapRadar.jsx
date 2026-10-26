import React, { useState } from "react";
import { AlertCircle, Plus, CheckCircle2, ClipboardCheck, Stethoscope, Lightbulb, Check, ArrowRight, X } from "lucide-react";
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
import GotiAnimated from "@/components/mascot/GotiAnimated";

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
  onRemoveGap,
  title = "Verificação de Protocolo Clínico",
  completenessPercentage = 70
}) {
  const [activeGap, setActiveGap] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [customValue, setCustomValue] = useState("");

  function handleOpenGap(gap, existingItem = null) {
    setActiveGap(gap);
    const finding = SEMIOLOGY_KNOWLEDGE_BASE[gap.key];
    if (existingItem) {
      setCustomValue(existingItem.value || "");
      setSelectedOptionId(null);
      setSelectedOption(null);
      setIsAnswered(true);
    } else {
      setSelectedOptionId(null);
      setSelectedOption(null);
      setIsAnswered(false);
      setCustomValue(finding?.resultingItem?.value || gap.hint || "");
    }
  }

  function handleCloseModal() {
    setActiveGap(null);
    setSelectedOptionId(null);
    setSelectedOption(null);
    setIsAnswered(false);
    setCustomValue("");
  }

  const findingData = activeGap ? SEMIOLOGY_KNOWLEDGE_BASE[activeGap.key] : null;

  function handleSelectOption(opt) {
    setSelectedOptionId(opt.id);
    setSelectedOption(opt);
    setIsAnswered(true);
    if (findingData?.resultingItem?.value) {
      setCustomValue(findingData.resultingItem.value);
    } else if (opt.label) {
      setCustomValue(opt.label);
    }
  }

  function handleConfirmFinding() {
    if (!activeGap) return;
    const finalValue = customValue.trim() || findingData?.resultingItem?.value || activeGap.hint || "Avaliado e Registrado";
    const resulting = {
      key: activeGap.key,
      label: findingData?.resultingItem?.label || activeGap.label,
      value: finalValue,
      status: findingData?.resultingItem?.status || "normal",
      canRemove: true
    };

    if (onAddGap) {
      onAddGap(activeGap, resulting);
    }
    handleCloseModal();
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
      {/* Cabeçalho com Medidor de Completude */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400">
            <ClipboardCheck className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Conferência de dados essenciais para o julgamento diagnóstico
            </p>
          </div>
        </div>

        {/* Barra de Progresso / Completude */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl">
          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Completude:</span>
          <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                completenessPercentage >= 85
                  ? "bg-emerald-600"
                  : completenessPercentage >= 60
                  ? "bg-amber-500"
                  : "bg-rose-500"
              }`}
              style={{ width: `${Math.min(completenessPercentage, 100)}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{completenessPercentage}%</span>
        </div>
      </div>

      {/* Sinais Coletados */}
      {detectedItems.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1 uppercase tracking-wide">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Parâmetros Registrados ({detectedItems.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {detectedItems.map((item, idx) => {
              const isDeletable = Boolean(item.canRemove || item.key);
              return (
                <span
                  key={item.key || idx}
                  className="group inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 transition-all hover:border-slate-300 dark:hover:border-slate-600"
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${item.status === 'critical' ? 'bg-rose-600' : item.status === 'altered' ? 'bg-amber-500' : 'bg-emerald-600'}`} />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.label}:</span>
                  <span className="text-slate-600 dark:text-slate-400">{item.value}</span>
                  {isDeletable && onRemoveGap && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveGap(item);
                      }}
                      title="Remover parâmetro do prontuário"
                      className="ml-1 -mr-1 p-0.5 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Parâmetros Faltantes (Exame Físico Interativo) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 uppercase tracking-wide">
            <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Parâmetros Complementares Recomendados ({missingGaps.length})
          </span>
        </div>

        {missingGaps.length === 0 ? (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Todos os parâmetros essenciais desta etapa foram registrados com sucesso.</span>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-2">
            {missingGaps.map((gap, idx) => (
              <button
                key={gap.key || idx}
                type="button"
                onClick={() => handleOpenGap(gap)}
                className="group flex items-start justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left"
              >
                <div className="space-y-0.5 pr-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 flex items-center gap-1.5">
                    <Stethoscope className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    {gap.label}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    {gap.hint || gap.desc || "Investigar e registrar para complementar a avaliação."}
                  </p>
                </div>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <Plus className="h-4 w-4" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal Interativo de Exame Físico & Julgamento Propedêutico */}
      <Dialog open={Boolean(activeGap)} onOpenChange={(open) => { if (!open) handleCloseModal(); }}>
        <DialogContent className="sm:max-w-xl rounded-2xl p-6 dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-800 self-start">
              <Stethoscope className="h-3.5 w-3.5" />
              Exame Físico Guiado à Beira-Leito
            </div>
            <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              {findingData?.title || activeGap?.label}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {findingData?.maneuver || activeGap?.hint || "Posicione o paciente e execute a propedêutica clínica recomendada para fundamentar o raciocínio."}
            </DialogDescription>
          </DialogHeader>

          {/* Dilema de Avaliação Prática */}
          <div className="space-y-3 py-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              {findingData?.prompt || "Qual achado clínico você identifica durante o exame físico?"}
            </span>

            {findingData?.options ? (
              <div className="space-y-2">
                {findingData.options.map((opt) => {
                  const isSelected = selectedOptionId === opt.id;
                  let cardStyle = "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-teal-400 dark:hover:border-teal-500 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200";

                  if (isAnswered) {
                    if (opt.isCorrect) {
                      cardStyle = "border-teal-500 dark:border-teal-600 bg-teal-50/70 dark:bg-teal-950/60 text-teal-950 dark:text-teal-200 font-medium";
                    } else if (isSelected && !opt.isCorrect) {
                      cardStyle = "border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200";
                    } else {
                      cardStyle = "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-400 opacity-60";
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
                          : "border-slate-300 dark:border-slate-600"
                      }`}>
                        {isAnswered && opt.isCorrect ? <Check className="h-2.5 w-2.5" /> : null}
                      </div>
                      <div className="space-y-1">
                        <span>{opt.label}</span>
                        {isAnswered && isSelected && (
                          <p className={`text-[11px] leading-tight mt-1 ${opt.isCorrect ? "text-teal-800 dark:text-teal-300 font-semibold" : "text-rose-700 dark:text-rose-400"}`}>
                            {opt.feedback}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                <p>
                  Parâmetro: <strong>{activeGap?.label}</strong>. {activeGap?.hint || "Confirme a realização do exame físico e o registro no prontuário."}
                </p>
              </div>
            )}

            {/* Feedback Visual com o Mascote Goti quando o aluno responde */}
            {isAnswered && selectedOption && (
              <div className={`p-3.5 rounded-2xl flex items-center gap-3.5 border transition-all animate-in fade-in slide-in-from-bottom-2 ${
                selectedOption.isCorrect 
                  ? "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200" 
                  : "bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200"
              }`}>
                <div className="shrink-0 relative">
                  <GotiAnimated
                    animation={selectedOption.isCorrect ? "love" : "angry"}
                    size="feedback"
                    className="w-32 h-32 sm:w-44 sm:h-44 md:w-52 md:h-52 shrink-0"
                  />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-black flex items-center gap-1.5">
                    {selectedOption.isCorrect ? (
                      <>
                        <span>Excelente raciocínio semiológico!</span>
                        <span className="text-sm">🌟</span>
                      </>
                    ) : (
                      <>
                        <span>Atenção no exame físico!</span>
                        <span className="text-sm">💡</span>
                      </>
                    )}
                  </p>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    {selectedOption.feedback}
                  </p>
                </div>
              </div>
            )}

            {/* Alerta formativo caso o aluno ainda não tenha respondido */}
            {findingData?.options && !isAnswered && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1.5 pt-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Selecione uma conduta acima para interpretar o exame antes de incorporar ao prontuário.
              </p>
            )}

            {/* Pérola Clínica Formativa pós-resposta */}
            {isAnswered && findingData?.pearl && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-950 dark:text-amber-200 space-y-1 animate-in fade-in">
                <span className="font-bold flex items-center gap-1.5 text-amber-900 dark:text-amber-300">
                  <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" /> Pérola de Enfermagem:
                </span>
                <p className="leading-relaxed text-[11px]">{findingData.pearl}</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-row justify-between items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCloseModal}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmFinding}
              disabled={Boolean(findingData?.options && !isAnswered)}
              className="rounded-xl text-xs bg-teal-700 hover:bg-teal-800 text-white font-semibold flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
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
