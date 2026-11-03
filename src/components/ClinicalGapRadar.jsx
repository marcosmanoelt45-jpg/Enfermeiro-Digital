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
import { SEMIOLOGY_KNOWLEDGE_BASE, getShuffledSemiologyFinding } from "@/data/semiologyFindings";
import GotiAnimated from "@/components/mascot/GotiAnimated";

/**
 * ClinicalGapRadar.jsx
 * Radar de Parâmetros Clínicos e Verificação de Protocolo.
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
  const [activeFinding, setActiveFinding] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const safePercentage = Number.isFinite(completenessPercentage) ? Math.max(0, Math.min(100, completenessPercentage)) : 0;

  function handleOpenGap(gap) {
    setActiveGap(gap);
    const finding = getShuffledSemiologyFinding(gap.key) || SEMIOLOGY_KNOWLEDGE_BASE[gap.key];
    setActiveFinding(finding);
    setSelectedOptionId(null);
    setSelectedOption(null);
    setIsAnswered(false);
    setCustomValue(finding?.resultingItem?.value || gap.hint || "");
  }

  function handleCloseModal() {
    setActiveGap(null);
    setActiveFinding(null);
    setSelectedOptionId(null);
    setSelectedOption(null);
    setIsAnswered(false);
    setCustomValue("");
  }

  const findingData = activeFinding || (activeGap ? SEMIOLOGY_KNOWLEDGE_BASE[activeGap.key] : null);

  function handleSelectOption(opt) {
    if (isAnswered) return;
    setSelectedOptionId(opt.id);
    setSelectedOption(opt);
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
    <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-5 shadow-sm space-y-4">
      {/* Cabeçalho com Medidor de Completude */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F3045] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#20D5B5]/15 text-[#20D5B5]">
            <ClipboardCheck className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#EAF2F8] leading-tight">
              {title}
            </h3>
            <p className="text-xs text-[#9FB3C6]">
              Conferência de dados essenciais para o julgamento diagnóstico
            </p>
          </div>
        </div>

        {/* Barra de Progresso / Completude */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto bg-[#0E1722] border border-[#1F3045] px-3 py-1.5 rounded-xl">
          <span className="text-[11px] font-medium text-[#9FB3C6]">Completude:</span>
          <div className="w-16 h-2 bg-[#1F3045] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                safePercentage >= 85
                  ? "bg-[#20D5B5]"
                  : safePercentage >= 60
                  ? "bg-[#FFC247]"
                  : "bg-[#FF6B6B]"
              }`}
              style={{ width: `${safePercentage}%` }}
            />
          </div>
          <span className="text-xs font-bold text-[#EAF2F8]">{safePercentage}%</span>
        </div>
      </div>

      {/* Sinais Coletados */}
      {detectedItems.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-[#9FB3C6] flex items-center gap-1 uppercase tracking-wide">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#20D5B5]" /> Parâmetros Registrados ({detectedItems.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {detectedItems.map((item, idx) => {
              const isDeletable = Boolean(item.canRemove || item.key);
              return (
                <span
                  key={item.key || idx}
                  className="group inline-flex items-center gap-1.5 rounded-lg border border-[#1F3045] bg-[#0E1722] px-2.5 py-1 text-xs text-[#EAF2F8] transition-all hover:border-[#27394B]"
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${item.status === 'critical' ? 'bg-[#FF6B6B]' : item.status === 'altered' ? 'bg-[#FFC247]' : 'bg-[#20D5B5]'}`} />
                  <span className="font-semibold text-[#EAF2F8]">{item.label}:</span>
                  <span className="text-[#9FB3C6]">{item.value}</span>
                  {isDeletable && onRemoveGap && (
                    <button
                      type="button"
                      aria-label={`Remover parâmetro ${item.label}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveGap(item);
                      }}
                      title="Remover parâmetro do prontuário"
                      className="ml-1 -mr-1 p-0.5 rounded text-[#8A9DB1] hover:text-[#FF6B6B] hover:bg-red-500/10 transition-colors"
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
          <span className="text-[11px] font-bold text-[#FFC247] flex items-center gap-1 uppercase tracking-wide">
            <AlertCircle className="h-3.5 w-3.5" /> Parâmetros Complementares Recomendados ({missingGaps.length})
          </span>
        </div>

        {missingGaps.length === 0 ? (
          <div className="p-3 rounded-xl bg-[#0E1722] border border-[#1F3045] text-xs text-[#20D5B5] flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Todos os parâmetros essenciais desta etapa foram registrados com sucesso.</span>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-2">
            {missingGaps.map((gap, idx) => (
              <button
                key={gap.key || idx}
                type="button"
                onClick={() => handleOpenGap(gap)}
                className="group flex items-start justify-between p-3 rounded-xl border border-[#1F3045] bg-[#0E1722] hover:border-[#20D5B5]/50 hover:bg-[#16222E] transition-all text-left"
              >
                <div className="space-y-0.5 pr-2">
                  <span className="text-xs font-bold text-[#EAF2F8] group-hover:text-[#20D5B5] flex items-center gap-1.5">
                    <Stethoscope className="h-3.5 w-3.5 text-[#20D5B5] shrink-0" />
                    {gap.label}
                  </span>
                  <p className="text-[11px] text-[#9FB3C6] leading-tight">
                    {gap.hint || gap.desc || "Investigar e registrar para complementar a avaliação."}
                  </p>
                </div>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#131F2E] text-[#9FB3C6] group-hover:bg-[#20D5B5] group-hover:text-[#0A1118] transition-all">
                  <Plus className="h-4 w-4" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal Interativo de Exame Físico & Julgamento Propedêutico */}
      <Dialog open={Boolean(activeGap)} onOpenChange={(open) => { if (!open) handleCloseModal(); }}>
        <DialogContent className="sm:max-w-xl rounded-2xl p-6 bg-[#131F2E] border-[#1F3045] text-[#EAF2F8]">
          <DialogHeader className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#20D5B5] bg-[#20D5B5]/15 px-2.5 py-1 rounded-lg border border-[#20D5B5]/30 self-start">
              <Stethoscope className="h-3.5 w-3.5" />
              Exame Físico Guiado à Beira-Leito
            </div>
            <DialogTitle className="text-base sm:text-lg font-bold text-[#EAF2F8]">
              {findingData?.title || activeGap?.label}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#9FB3C6] leading-relaxed">
              {findingData?.maneuver || activeGap?.hint || "Posicione o paciente e execute a propedêutica clínica recomendada para fundamentar o raciocínio."}
            </DialogDescription>
          </DialogHeader>

          {/* Dilema de Avaliação Prática */}
          <div className="space-y-3 py-2">
            <span className="text-xs font-bold text-[#EAF2F8] block">
              {findingData?.prompt || "Qual achado clínico você identifica durante o exame físico?"}
            </span>

            {findingData?.options ? (
              <div className="space-y-2.5">
                <div className="space-y-2">
                  {findingData.options.map((opt, idx) => {
                    const isSelected = selectedOptionId === opt.id;
                    const letter = opt.letter || String.fromCharCode(65 + idx);
                    let cardStyle = "border-[#1F3045] bg-[#0E1722] hover:border-[#20D5B5]/50 hover:bg-[#16222E] text-[#EAF2F8]";

                    if (isAnswered) {
                      if (opt.isCorrect) {
                        cardStyle = "border-[#20D5B5] bg-[#20D5B5]/15 text-[#20D5B5] font-bold";
                      } else if (isSelected && !opt.isCorrect) {
                        cardStyle = "border-[#FF6B6B] bg-[#FF6B6B]/15 text-[#FF6B6B] font-bold";
                      } else {
                        cardStyle = "border-[#1F3045]/40 bg-[#0E1722]/40 text-[#8A9DB1] opacity-50";
                      }
                    } else if (isSelected) {
                      cardStyle = "border-[#20D5B5] bg-[#20D5B5]/20 text-[#EAF2F8] ring-1 ring-[#20D5B5] font-semibold";
                    }

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={isAnswered}
                        onClick={() => handleSelectOption(opt)}
                        className={`w-full text-left p-3 rounded-xl border text-xs leading-relaxed transition-all flex items-start gap-2.5 ${cardStyle}`}
                      >
                        <div className={`mt-0.5 h-6 w-6 rounded-lg font-black text-xs border flex items-center justify-center shrink-0 transition-colors shadow-sm ${
                          isAnswered && opt.isCorrect
                            ? "bg-[#20D5B5] border-[#20D5B5] text-[#0A1118]"
                            : isAnswered && isSelected && !opt.isCorrect
                            ? "bg-[#FF6B6B] border-[#FF6B6B] text-white"
                            : !isAnswered && isSelected
                            ? "bg-[#20D5B5] text-[#0A1118] border-[#20D5B5]"
                            : "border-[#27394B] bg-[#16222E] text-[#9FB3C6]"
                        }`}>
                          {isAnswered && opt.isCorrect ? <Check className="h-3.5 w-3.5" /> : letter}
                        </div>
                        <div className="space-y-1 flex-1">
                          <span className="font-medium text-[#EAF2F8]">{opt.label}</span>
                          {isAnswered && isSelected && (
                            <p className={`text-[11px] leading-tight mt-1 ${opt.isCorrect ? "text-[#20D5B5] font-semibold" : "text-[#FF6B6B]"}`}>
                              {opt.feedback}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Botão de Verificação Explícita Antes de Corrigir */}
                {!isAnswered && (
                  <div className="pt-1">
                    <Button
                      type="button"
                      onClick={() => {
                        if (!selectedOptionId) return;
                        setIsAnswered(true);
                      }}
                      disabled={!selectedOptionId}
                      className="w-full py-2.5 rounded-xl font-bold text-xs"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Verificar Resposta</span>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#0E1722] border border-[#1F3045] text-xs text-[#9FB3C6] space-y-2">
                <p>
                  Parâmetro: <strong className="text-[#EAF2F8]">{activeGap?.label}</strong>. {activeGap?.hint || "Confirme a realização do exame físico e o registro no prontuário."}
                </p>
              </div>
            )}

            {/* Feedback Visual com o Mascote Goti quando o aluno responde */}
            {isAnswered && selectedOption && (
              <div className={`p-3.5 rounded-2xl flex items-center gap-3.5 border transition-all animate-in fade-in slide-in-from-bottom-2 ${
                selectedOption.isCorrect 
                  ? "bg-[#20D5B5]/15 border-[#20D5B5]/30 text-[#20D5B5]" 
                  : "bg-[#FFC247]/15 border-[#FFC247]/30 text-[#FFC247]"
              }`}>
                <div className="shrink-0 relative">
                  <GotiAnimated
                    animation={selectedOption.isCorrect ? "love" : "angry"}
                    size="feedback"
                    className="w-24 h-24 sm:w-28 sm:h-28 shrink-0"
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
                  <p className="text-[11px] leading-relaxed text-[#EAF2F8]/90">
                    {selectedOption.feedback}
                  </p>
                </div>
              </div>
            )}

            {/* Alerta formativo caso o aluno ainda não tenha respondido */}
            {findingData?.options && !isAnswered && (
              <p className="text-[11px] text-[#FFC247] font-semibold flex items-center gap-1.5 pt-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Selecione uma conduta acima e clique em &quot;Verificar Resposta&quot; antes de incorporar ao prontuário.
              </p>
            )}

            {/* Pérola Clínica Formativa pós-resposta */}
            {isAnswered && findingData?.pearl && (
              <div className="p-3.5 rounded-xl bg-[#0E1722] border border-[#1F3045] text-xs text-[#EAF2F8] space-y-1 animate-in fade-in">
                <span className="font-bold flex items-center gap-1.5 text-[#FFC247]">
                  <Lightbulb className="h-4 w-4 text-[#FFC247]" /> Pérola de Enfermagem:
                </span>
                <p className="leading-relaxed text-[11px] text-[#9FB3C6]">{findingData.pearl}</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-row justify-between items-center gap-2 pt-2 border-t border-[#1F3045]">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCloseModal}
              className="text-xs text-[#9FB3C6] hover:text-[#EAF2F8] rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmFinding}
              disabled={Boolean(findingData?.options && !isAnswered)}
              className="rounded-xl text-xs font-semibold flex items-center gap-1.5"
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
