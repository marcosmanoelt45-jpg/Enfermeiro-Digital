import React from "react";
import PropTypes from "prop-types";
import { Check, X } from "lucide-react";

/**
 * FeedbackBottomSheet
 *
 * Folha inferior de feedback (acerto ou erro) com animação deslizante,
 * indicador de acerto/erro, ganho de PE ou perda de vida, explicação clínica
 * e botão 3D de continuidade.
 */
export default function FeedbackBottomSheet({
  isOpen = false,
  isCorrect = true,
  respostaCerta = "",
  explicacao = "",
  onContinuar
}) {
  if (!isOpen) return null;

  return (
    <>
      {/* Scrim escurecido de fundo */}
      <div
        className="fixed inset-0 bg-[#050A0F]/65 z-40 animate-fade-in pointer-events-auto"
        onClick={onContinuar}
      />

      {/* Bottom Sheet Deslizante */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 p-5 pb-8 rounded-t-[28px] border-t-2 shadow-[0_-8px_30px_rgba(0,0,0,0.7)] animate-in slide-in-from-bottom duration-250 select-none ${
          isCorrect ? "bg-[#10281F] border-[#3DD68C]" : "bg-[#2B1619] border-[#FF6B6B]"
        }`}
      >
        <div className="max-w-md mx-auto flex flex-col">
          {/* Header de Feedback */}
          <div className="flex items-center gap-3.5 mb-3.5">
            <div
              className={`w-[52px] h-[52px] rounded-full flex items-center justify-center flex-none ${
                isCorrect ? "bg-[#3DD68C] text-[#06302E]" : "bg-[#FF6B6B] text-[#2B1619]"
              }`}
            >
              {isCorrect ? (
                <Check className="w-8 h-8 stroke-[3]" />
              ) : (
                <X className="w-8 h-8 stroke-[3]" />
              )}
            </div>

            <div>
              <h3
                className={`text-2xl font-black ${
                  isCorrect ? "text-[#3DD68C]" : "text-[#FF6B6B]"
                }`}
              >
                {isCorrect ? "Correto!" : "Quase lá"}
              </h3>
              <div
                className={`text-sm font-bold ${
                  isCorrect ? "text-[#3DD68C]/90" : "text-[#FF6B6B]/90"
                }`}
              >
                {isCorrect ? "+25 PE" : "Você perdeu 1 vida"}
              </div>
            </div>
          </div>

          {/* Card com Resposta e Explicação */}
          <div className="rounded-[18px] bg-[#16222E] border-2 border-[#27394B] border-b-[5px] border-b-[#0A1118] p-3.5 mb-3.5">
            {!isCorrect && respostaCerta && (
              <div className="mb-2 pb-2 border-b border-[#27394B]">
                <div className="text-xs font-black text-[#9FB3C6] uppercase tracking-wider mb-1">
                  Resposta certa
                </div>
                <div className="text-[15px] font-black text-[#EAF2F8]">
                  {respostaCerta}
                </div>
              </div>
            )}

            <div>
              <div className="text-xs font-black text-[#9FB3C6] uppercase tracking-wider mb-1">
                Por quê
              </div>
              <div className="text-[14px] font-bold text-[#EAF2F8] leading-snug">
                {explicacao}
              </div>
            </div>
          </div>

          {/* Botão de Ação 3D */}
          <button
            type="button"
            onClick={onContinuar}
            className={`w-full h-14 rounded-2xl font-black text-lg flex items-center justify-center active:translate-y-[3px] transition-all cursor-pointer ${
              isCorrect
                ? "bg-[#2AD3C1] text-[#06302E] shadow-[0_5px_0_#17A99A] active:shadow-[0_2px_0_#17A99A]"
                : "bg-[#FF6B6B] text-[#2B1619] shadow-[0_5px_0_#b84444] active:shadow-[0_2px_0_#b84444]"
            }`}
          >
            {isCorrect ? "Continuar" : "Entendi"}
          </button>
        </div>
      </div>
    </>
  );
}

FeedbackBottomSheet.propTypes = {
  isOpen: PropTypes.bool,
  isCorrect: PropTypes.bool,
  respostaCerta: PropTypes.string,
  explicacao: PropTypes.string,
  onContinuar: PropTypes.func
};
