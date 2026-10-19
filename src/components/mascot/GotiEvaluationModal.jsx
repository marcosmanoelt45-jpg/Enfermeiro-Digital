import React, { useEffect } from "react";
import { X, Trophy, Sparkles, Heart, ArrowRight, ShieldCheck } from "lucide-react";
import GotiAnimated from "./GotiAnimated";

/**
 * GotiEvaluationModal
 * Modal retangular semi-transparente com efeito glassmorphism de encerramento de atividades.
 * Exibe o mascote Goti em tamanho grande, com animação contextualizada pela nota:
 * - >= 80%: Comemoração/Amor ("happy"/"celebrate") com corações e estrelas
 * - 50% a 79%: Apontando o dedo ("pointing") com foco instrutivo e melhorias
 * - < 50%: Reflexivo/Apoio ("thinking") acolhedor e incentivador
 */
export default function GotiEvaluationModal({
  isOpen,
  onClose,
  score = 100,
  scoreLabel = "Acurácia Clínica",
  activityTitle = "Atividade Prática Concluída",
  comment = "",
  onContinue = null
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const numScore = typeof score === "number" ? score : parseInt(score, 10) || 0;

  // Lógica de pose e tom do Goti conforme o desempenho
  let pose = "happy";
  let badgeText = "Excelente Desempenho Clínico!";
  let badgeColor = "bg-emerald-500/20 text-emerald-300 border-emerald-400/40";
  let title = "Parabéns pelo Raciocínio de Excelência! 🌟";
  let defaultComment = "Sua tomada de decisão demonstrou grande adesão aos protocolos de segurança do paciente e raciocínio baseado em evidências!";

  if (numScore >= 90) {
    pose = "jumping";
    badgeText = "Desempenho Ouro • Raciocínio Impecável";
    badgeColor = "bg-emerald-500/20 text-emerald-300 border-emerald-400/40";
    title = "Parabéns pela Maestria Clínica! 🌟";
    defaultComment = "Você demonstrou raciocínio afiado, técnica precisa e segurança absoluta no cuidado!";
  } else if (numScore >= 80) {
    pose = "love";
    badgeText = "Alta Precisão & Segurança do Paciente";
    badgeColor = "bg-emerald-500/20 text-emerald-300 border-emerald-400/40";
    title = "Excelente Trabalho no Plantão! 💖";
    defaultComment = "Seu raciocínio clínico foi muito assertivo e baseado em evidências. Parabéns!";
  } else if (numScore >= 50) {
    pose = "pointing";
    badgeText = "Bom Raciocínio • Pontos a Lapidar";
    badgeColor = "bg-amber-500/20 text-amber-300 border-amber-400/40";
    title = "Bom Trabalho! Vamos Lapidar Alguns Pontos";
    defaultComment = "Você capturou a essência do caso! Veja as orientações que apontei para aperfeiçoar sua tomada de decisão.";
  } else {
    pose = "angry";
    badgeText = "Atenção aos Protocolos • Alerta Clínico";
    badgeColor = "bg-rose-500/20 text-rose-300 border-rose-400/40";
    title = "Atenção aos Detalhes de Segurança!";
    defaultComment = "Houve falhas que colocariam a assistência em risco. Vamos revisar juntos as etapas para transformar esse erro em aprendizado seguro!";
  }

  const finalComment = comment || defaultComment;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-teal-950/95 border border-teal-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-white text-center flex flex-col items-center overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Luzes difusas de fundo (Aura Hospitalar) */}
        <div className="absolute -top-20 -left-20 w-56 h-56 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Botão Fechar X */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Badge de Destaque Superior */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mb-4 shadow-sm backdrop-blur-xs select-none">
          <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black border ${badgeColor}`}>
            <Sparkles className="w-3.5 h-3.5" />
            {badgeText}
          </span>
        </div>

        {/* Mascote Goti em Tamanho Grande com Iluminação Neon */}
        <div className="relative my-2 select-none">
          {numScore >= 80 && (
            <>
              {/* Partículas de carinho/amor flutuantes */}
              <div className="absolute -top-3 -left-4 text-rose-400 animate-bounce text-xl select-none">💖</div>
              <div className="absolute -top-4 -right-3 text-amber-300 animate-pulse text-lg select-none">⭐</div>
              <div className="absolute top-1/2 -right-6 text-teal-300 animate-bounce text-base select-none">✨</div>
            </>
          )}

          {numScore >= 50 && numScore < 80 && (
            <div className="absolute -top-3 -right-3 text-amber-400 text-xl animate-pulse select-none">💡</div>
          )}

          <GotiAnimated
            animation={pose}
            size="2xl"
            className="w-44 h-44 sm:w-52 sm:h-52 drop-shadow-2xl"
          />
        </div>

        {/* Título e Subtítulo */}
        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 leading-snug">
          {title}
        </h3>
        <p className="text-xs text-teal-300/90 font-medium mt-1">
          {activityTitle}
        </p>

        {/* Placar de Pontuação / Acurácia */}
        <div className="my-4 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-center justify-center gap-3">
          <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-left">
            <span className="text-[10px] font-bold text-slate-300 uppercase block tracking-wider">
              {scoreLabel}
            </span>
            <span className="text-2xl font-black text-white leading-none">
              {numScore}%
            </span>
          </div>
        </div>

        {/* Balão de Fala do Goti com Comentário Personalizado */}
        <div className="w-full bg-slate-800/80 border border-teal-500/20 rounded-2xl p-4 text-xs sm:text-sm text-slate-200 leading-relaxed text-left relative mt-1">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-b-8 border-b-slate-800" />
          <div className="flex items-center gap-1.5 text-xs font-black text-teal-300 mb-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Comentário do Goti:</span>
          </div>
          <p className="font-medium text-slate-200 italic">
            "{finalComment}"
          </p>
        </div>

        {/* Botão de Ação Primária */}
        <div className="w-full mt-5">
          <button
            onClick={() => {
              if (onContinue) onContinue();
              onClose();
            }}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-950/40 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer"
          >
            <span>Ver Parecer Completo do Goti 🩺</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
