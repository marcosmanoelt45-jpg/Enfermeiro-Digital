import React, { useState } from 'react';
import { useTheme } from '@/lib/ThemeContext';
import { Sparkles, HeartPulse, CheckCircle2, Award } from 'lucide-react';

/**
 * GotiMascot.jsx
 * Mascote Oficial do Enfere: GOTI (A Gotinha 3D de Enfermagem).
 * Inspirado nas micro-animações do Duolingo: flutuação suave, respiração viva,
 * pulo comemorativo ao acertar questões, balões de fala socráticos e dicas clínicas.
 */
export default function GotiMascot({
  state = 'idle', // 'idle' | 'happy' | 'celebrating' | 'thinking' | 'encouraging'
  size = 120, // tamanho em px ou 'sm' | 'md' | 'lg' | 'xl'
  message = '', // mensagem do balão de fala estilo Duolingo
  subMessage = '', // texto menor complementar
  interactive = true, // reage ao toque/clique
  showGlow = true, // brilho suave ao fundo
  onClick,
  className = '',
}) {
  const { triggerHaptic } = useTheme?.() || { triggerHaptic: () => {} };
  const [isBouncing, setIsBouncing] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  // Normalização do tamanho
  let pixelSize = 120;
  if (typeof size === 'number') {
    pixelSize = size;
  } else if (size === 'sm') {
    pixelSize = 64;
  } else if (size === 'md') {
    pixelSize = 110;
  } else if (size === 'lg') {
    pixelSize = 160;
  } else if (size === 'xl') {
    pixelSize = 220;
  }

  // Falas encorajadoras do Goti
  const gotiQuotes = [
    'Bora manter o foco no plantão! Você é capaz!',
    'Excelente raciocínio clínico! Segurança em 1º lugar.',
    'Sempre confira os 9 certos na medicação!',
    'Lembre-se da técnica asséptica e lave bem as mãos.',
    'A prática baseada em evidências é a sua melhor amiga!',
    'O SBAR claro e assertivo salva vidas no hospital!',
  ];

  const currentMessage = message || (isBouncing ? gotiQuotes[clickCount % gotiQuotes.length] : '');

  const handleClick = (e) => {
    if (!interactive) return;
    triggerHaptic?.(25);
    setIsBouncing(true);
    setClickCount((prev) => prev + 1);
    if (onClick) onClick(e);
    setTimeout(() => setIsBouncing(false), 1800);
  };

  // Classes de animação baseadas no estado
  const activeAnimation = isBouncing || state === 'celebrating' || state === 'happy'
    ? 'animate-goti-celebrate'
    : state === 'thinking'
    ? 'animate-goti-think'
    : 'animate-goti-idle';

  return (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
      {/* Estilos CSS Inline de Animações Fluídas do Goti (Estilo Duolingo) */}
      <style>{`
        @keyframes gotiIdle {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-7px) scale(1.02);
          }
        }
        @keyframes gotiCelebrate {
          0% {
            transform: translateY(0) scale(1);
          }
          20% {
            transform: translateY(-16px) scale(1.08) rotate(-4deg);
          }
          40% {
            transform: translateY(0) scale(0.96) rotate(3deg);
          }
          60% {
            transform: translateY(-8px) scale(1.04) rotate(-2deg);
          }
          80% {
            transform: translateY(0) scale(0.99) rotate(1deg);
          }
          100% {
            transform: translateY(0) scale(1);
          }
        }
        @keyframes gotiThink {
          0%, 100% {
            transform: rotate(-3deg) translateY(0);
          }
          50% {
            transform: rotate(3deg) translateY(-4px);
          }
        }
        @keyframes gotiShadow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.35;
          }
          50% {
            transform: scale(0.85);
            opacity: 0.2;
          }
        }
        .animate-goti-idle {
          animation: gotiIdle 3.2s ease-in-out infinite;
        }
        .animate-goti-celebrate {
          animation: gotiCelebrate 0.8s ease-in-out;
        }
        .animate-goti-think {
          animation: gotiThink 2.4s ease-in-out infinite;
        }
        .animate-goti-shadow {
          animation: gotiShadow 3.2s ease-in-out infinite;
        }
      `}</style>

      {/* Balão de Fala Socrático estilo Duolingo */}
      {currentMessage && (
        <div className="mb-2.5 max-w-[260px] px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-800 border-2 border-emerald-400 dark:border-emerald-600 shadow-lg text-slate-800 dark:text-slate-100 text-xs font-bold leading-snug text-center animate-in zoom-in-95 duration-200 relative z-20">
          <div className="flex items-center justify-center gap-1.5 text-emerald-800 dark:text-emerald-400 text-[10px] uppercase tracking-wider mb-0.5">
            <Sparkles className="w-3 h-3" />
            <span>Goti Preceptor</span>
          </div>
          <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">
            {currentMessage}
          </p>
          {subMessage && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
              {subMessage}
            </p>
          )}
          {/* Ponta do Balão de Fala apontando para o topo da cabeça do Goti */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white dark:bg-slate-800 border-b-2 border-r-2 border-emerald-400 dark:border-emerald-600 rotate-45" />
        </div>
      )}

      {/* Container do Mascote */}
      <div
        onClick={handleClick}
        style={{ width: `${pixelSize}px`, height: `${pixelSize}px` }}
        className={`relative cursor-pointer transition-transform duration-200 ${
          interactive ? 'hover:scale-105 active:scale-95' : ''
        }`}
        title="Goti, o mascote oficial do Enfere!"
      >
        {/* Glow de Fundo Suave */}
        {showGlow && (
          <div
            className="absolute inset-0 rounded-full bg-emerald-400/20 dark:bg-emerald-500/15 blur-xl pointer-events-none transition-opacity"
            style={{ transform: 'scale(0.85)' }}
          />
        )}

        {/* Imagem Oficial do Goti Renderizada com Animação Fluida */}
        <div className={`w-full h-full relative z-10 flex items-center justify-center ${activeAnimation}`}>
          <img
            src="/mascot/goti.png"
            alt="Goti - Mascote do Enfere"
            className="w-full h-full object-contain filter drop-shadow-md select-none pointer-events-none"
            loading="eager"
          />

          {/* Efeito de Confetes / Sucesso quando comemorando */}
          {(isBouncing || state === 'celebrating') && (
            <div className="absolute -top-3 -right-2 flex items-center gap-1 bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full shadow-md animate-bounce">
              <Award className="w-3 h-3 text-slate-900" />
              <span>Mandou bem!</span>
            </div>
          )}
        </div>

        {/* Sombra 3D no Piso (Inspirado no Duolingo) */}
        <div
          className="w-3/5 h-2.5 mx-auto bg-slate-950/25 dark:bg-slate-950/50 rounded-full blur-[2px] animate-goti-shadow mt-[-8px] pointer-events-none"
        />
      </div>
    </div>
  );
}
