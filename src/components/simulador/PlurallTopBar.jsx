import React from "react";
import { X, Volume2, VolumeX, ArrowLeft } from "lucide-react";

export default function PlurallTopBar({
  respondidas = 0,
  total = 8,
  acertos = 0,
  amarelas = 0,
  vermelhas = 0,
  onClose,
  soundEnabled = true,
  onToggleSound,
  podeVoltar = false,
  onVoltar,
  questaoAtualIndex = 0
}) {
  const aproveitamento = respondidas > 0 ? Math.round((acertos / respondidas) * 100) : null;
  const pctVerde = total > 0 ? (acertos / total) * 100 : 0;
  const pctAmarela = total > 0 ? (amarelas / total) * 100 : 0;
  const pctVermelha = total > 0 ? (vermelhas / total) * 100 : 0;

  return (
    <header className="sticky top-0 z-40 bg-[#0E1722]/95 backdrop-blur-md border-b border-[#1F3045] px-3 sm:px-4 py-2.5 transition-all">
      {/* Linha Superior: Botões e Título */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {podeVoltar && (
            <button
              type="button"
              onClick={onVoltar}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#9FB3C6] hover:text-white hover:bg-[#16222E] transition cursor-pointer"
              aria-label="Voltar para questão anterior"
              title="Voltar para questão anterior"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#9FB3C6] hover:text-white hover:bg-[#16222E] transition cursor-pointer"
            aria-label="Encerrar simulador"
            title="Encerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center min-w-0 flex-1">
          <span className="text-[11px] sm:text-xs font-mono font-bold tracking-wider text-[#9FB3C6] uppercase">
            Questão {questaoAtualIndex + 1} de {total}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleSound}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#9FB3C6] hover:text-[#20D5B5] bg-[#131F2E] border border-[#27394B] transition cursor-pointer"
            aria-label={soundEnabled ? "Desativar áudio" : "Ativar áudio"}
            title={soundEnabled ? "Desativar áudio" : "Ativar áudio"}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[#20D5B5]" />
            ) : (
              <VolumeX className="w-4 h-4 text-[#9FB3C6]" />
            )}
          </button>
        </div>
      </div>

      {/* Linha de Estatísticas em Tempo Real (Estilo Plurall / TRT-4) */}
      <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono text-[#9FB3C6] pt-2 px-1">
        <span>
          Respondidas <b className="text-white font-bold">{respondidas}</b>/<b className="text-white font-bold">{total}</b>
        </span>
        <div className="flex items-center gap-2.5">
          <span className="text-[#20D5B5] font-bold" title="Acertos na 1ª tentativa">
            ✓ {acertos}
          </span>
          <span className="text-[#FFC247] font-bold" title="Dica solicitada / 1º erro">
            ⚠ {amarelas}
          </span>
          <span className="text-[#F25F5C] font-bold" title="Erros na 2ª tentativa / Para revisão">
            ✗ {vermelhas}
          </span>
          <span>
            Taxa: <b className="text-white">{aproveitamento !== null ? `${aproveitamento}%` : "–"}</b>
          </span>
        </div>
      </div>

      {/* Barra de Progresso Bicolor / Tricolor */}
      <div
        className="w-full h-1.5 rounded-full bg-[#1F3045] mt-2 overflow-hidden flex"
        role="progressbar"
        aria-valuenow={respondidas}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        {/* Acertos (Verde) */}
        <div
          className="h-full bg-[#20D5B5] transition-all duration-300"
          style={{ width: `${pctVerde}%` }}
        />
        {/* 1º Erro / Dica (Amarelo) */}
        <div
          className="h-full bg-[#FFC247] transition-all duration-300"
          style={{ width: `${pctAmarela}%` }}
        />
        {/* 2º Erro / Revisão (Vermelho) */}
        <div
          className="h-full bg-[#F25F5C] transition-all duration-300"
          style={{ width: `${pctVermelha}%` }}
        />
      </div>
    </header>
  );
}

