import React from "react";
import PropTypes from "prop-types";
import { X, MoreHorizontal } from "lucide-react";

/**
 * SimuladorTopBar
 *
 * Barra de navegação superior da lição estilo Duolingo.
 * Contém botão X de sair, barra de progresso, contador de passos,
 * corações de vidas e menu de opções.
 */
export default function SimuladorTopBar({
  stepAtual = 0,
  totalSteps = 5,
  vidas = 3,
  onExit,
  onMoreOptions
}) {
  const percentual = totalSteps > 0 ? Math.min(100, Math.round((stepAtual / totalSteps) * 100)) : 0;

  return (
    <div className="flex items-center gap-2 pt-4 px-3 pb-2 select-none">
      {/* Botão Sair */}
      <button
        type="button"
        onClick={onExit}
        className="w-10 h-10 rounded-full flex items-center justify-center text-[#9FB3C6] hover:text-[#EAF2F8] hover:bg-[#16222E] transition-colors active:scale-95 cursor-pointer"
        aria-label="Sair do atendimento"
      >
        <X className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Barra de Progresso */}
      <div className="flex-1 h-3 rounded-full bg-[#27394B] overflow-hidden p-0.5">
        <div
          className="h-full rounded-full bg-[#2AD3C1] transition-all duration-300"
          style={{ width: `${percentual}%` }}
        />
      </div>

      {/* Contador numérico */}
      <div className="text-xs font-black text-[#9FB3C6] min-w-[32px] text-right">
        {stepAtual + 1}/{totalSteps}
      </div>

      {/* Corações de Vidas */}
      <div className="flex items-center gap-1 font-black text-[#FF6B6B] text-sm px-1.5">
        <span>♥</span>
        <span>{vidas}</span>
      </div>

      {/* Menu / Mais opções */}
      <button
        type="button"
        onClick={onMoreOptions}
        className="w-9 h-9 rounded-full flex items-center justify-center text-[#9FB3C6] hover:text-[#EAF2F8] hover:bg-[#16222E] transition-colors active:scale-95 cursor-pointer"
        aria-label="Mais opções"
      >
        <MoreHorizontal className="w-5 h-5 stroke-[2.5]" />
      </button>
    </div>
  );
}

SimuladorTopBar.propTypes = {
  stepAtual: PropTypes.number,
  totalSteps: PropTypes.number,
  vidas: PropTypes.number,
  onExit: PropTypes.func,
  onMoreOptions: PropTypes.func
};
