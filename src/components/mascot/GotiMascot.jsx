import React, { useState } from 'react';
import { useTheme } from '@/lib/ThemeContext';
import { Sparkles, Award } from 'lucide-react';

/**
 * GotiMascot.jsx
 * Mascote Oficial do Enfere: GOTI (O Preceptor Clínico de Enfermagem).
 * Design 2D Vetorial Flat (Estilo Duolingo / Stripe / Modern Tech Mascot),
 * com traços limpos, cores hospitalares autênticas, crachá clínico e física orgânica suave.
 */
export default function GotiMascot({
  state,
  mood,
  size = 160, // Tamanho em px ou preset 'sm' | 'md' | 'lg' | 'xl' | 'hero'
  message = '', // Fala / feedback socrático
  speechBubble = '', // Alias para retrocompatibilidade
  subMessage = '', // Texto secundário
  interactive = true, // Reage ao toque / hover
  showGlow = true, // Aura luminosa difusa
  layout = 'vertical', // 'vertical' | 'horizontal'
  onClick,
  className = '',
}) {
  const { triggerHaptic } = useTheme?.() || { triggerHaptic: () => {} };
  const [clickCount, setClickCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Normalização do estado/humor do Goti
  const rawState = (state || mood || 'idle').toLowerCase();
  const isCelebrating = rawState === 'celebrating' || rawState === 'celebrate' || rawState === 'happy';
  const isSpeaking = rawState === 'speaking' || rawState === 'teaching';
  const isThinking = rawState === 'thinking' || rawState === 'think';
  const isAlert = rawState === 'alert';

  // Seleção dinâmica do mascote 2D Flat Vector
  let imageSrc = '/mascot/goti_2d_idle.jpg';
  if (isCelebrating) {
    imageSrc = '/mascot/goti_2d_celebrating.jpg';
  } else if (isSpeaking) {
    imageSrc = '/mascot/goti_2d_speaking.jpg';
  } else if (isThinking || isAlert) {
    imageSrc = '/mascot/goti_2d_thinking.jpg';
  }

  // Normalização de tamanho em pixels
  let pixelSize = 160;
  if (typeof size === 'number') {
    pixelSize = size;
  } else if (size === 'sm') {
    pixelSize = 96;
  } else if (size === 'md') {
    pixelSize = 144;
  } else if (size === 'lg') {
    pixelSize = 192;
  } else if (size === 'xl') {
    pixelSize = 256;
  } else if (size === 'hero') {
    pixelSize = 320;
  }

  const isCompact = pixelSize < 64;
  const currentMessage = message || speechBubble;
  const isHorizontal = layout === 'horizontal';

  const handleClick = (e) => {
    if (!interactive) return;
    triggerHaptic?.(18);
    setClickCount((prev) => prev + 1);
    if (onClick) onClick(e);
  };

  // Se for avatar compacto (ex: no Header ou chat mini), renderiza sem animações pesadas
  if (isCompact) {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden border-2 border-teal-500/40 bg-white shadow-xs ${className}`}
        style={{ width: `${pixelSize}px`, height: `${pixelSize}px` }}
        title="Goti - Preceptor Clínico 2D"
        onClick={handleClick}
      >
        <img
          src={imageSrc}
          alt="Goti 2D"
          className="w-full h-full object-cover object-center"
          loading="eager"
        />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex ${isHorizontal ? 'flex-row items-center gap-4' : 'flex-col items-center gap-3'} select-none transition-all ${className}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      <style>{`
        @keyframes goti2DBreathing {
          0%, 100% {
            transform: translateY(0px) scale(1, 1);
          }
          50% {
            transform: translateY(-7px) scale(1.02, 0.98);
          }
        }
        @keyframes goti2DAura {
          0%, 100% {
            opacity: 0.25;
            transform: scale(0.96);
          }
          50% {
            opacity: 0.55;
            transform: scale(1.06);
          }
        }
        @keyframes goti2DShadow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.28;
          }
          50% {
            transform: scale(0.85);
            opacity: 0.12;
          }
        }
        .goti-2d-body {
          animation: goti2DBreathing 4.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
          transform-origin: center bottom;
          will-change: transform;
        }
        .goti-2d-aura {
          animation: goti2DAura 3.6s ease-in-out infinite;
          will-change: transform, opacity;
        }
        .goti-2d-shadow {
          animation: goti2DShadow 4.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
          will-change: transform, opacity;
        }
      `}</style>

      {/* Balão de Fala Socrático no Topo (Modo Vertical) */}
      {currentMessage && !isHorizontal && (
        <div className="relative mb-1 max-w-[300px] px-4 py-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-teal-500/40 dark:border-teal-400/50 shadow-xl text-slate-800 dark:text-slate-100 text-xs font-bold leading-snug animate-in fade-in duration-200 z-30 text-center">
          <div className="flex items-center justify-center gap-1.5 text-teal-700 dark:text-teal-400 text-[10px] uppercase tracking-wider mb-1 font-black">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Goti · Preceptor Digital</span>
          </div>
          <p className="text-[12.5px] font-semibold text-slate-800 dark:text-slate-200 leading-snug">
            {currentMessage}
          </p>
          {subMessage && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {subMessage}
            </p>
          )}
          {/* Ponta sutil apontando para o Goti */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white/95 dark:bg-slate-900/95 border-b border-r border-teal-500/40 dark:border-teal-400/50 rotate-45" />
        </div>
      )}

      {/* Container Principal do Mascote 2D */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: `${pixelSize}px`, height: `${pixelSize}px` }}
      >
        {/* Aura Difusa Suave */}
        {showGlow && (
          <div
            className="absolute goti-2d-aura rounded-full pointer-events-none"
            style={{
              width: `${pixelSize * 1.15}px`,
              height: `${pixelSize * 1.15}px`,
              background: 'radial-gradient(circle, rgba(45,212,191,0.3) 0%, rgba(20,184,166,0.1) 50%, transparent 70%)',
              filter: 'blur(16px)',
            }}
          />
        )}

        {/* Personagem 2D com Moldura Nítida */}
        <div
          className={`goti-2d-body relative w-full h-full rounded-[2.2rem] overflow-hidden bg-white shadow-xl transition-all duration-300 border-2 border-teal-500/30 dark:border-teal-400/40 ${
            interactive ? 'cursor-pointer hover:scale-[1.04] hover:-rotate-1 active:scale-[0.96]' : ''
          }`}
          style={{
            boxShadow: '0 16px 36px -10px rgba(13, 148, 136, 0.25)',
          }}
        >
          <img
            src={imageSrc}
            alt="Goti - Preceptor Clínico 2D"
            className="w-full h-full object-cover object-center pointer-events-none"
            loading="eager"
          />
        </div>

        {/* Sombra 2D de Piso Suave */}
        <div
          className="absolute -bottom-2.5 goti-2d-shadow rounded-full pointer-events-none"
          style={{
            width: `${pixelSize * 0.7}px`,
            height: `${pixelSize * 0.14}px`,
            background: 'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.45) 0%, rgba(13, 148, 136, 0.15) 60%, transparent 80%)',
            filter: 'blur(3px)',
          }}
        />

        {/* Badge de Conquista quando em celebração */}
        {isCelebrating && (
          <div className="absolute -top-3 -right-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[11px] shadow-lg flex items-center gap-1.5 animate-bounce z-20">
            <Award className="w-3.5 h-3.5 text-slate-950 fill-current" />
            <span>Excelente!</span>
          </div>
        )}
      </div>

      {/* Balão Horizontal (Modo Horizontal) */}
      {currentMessage && isHorizontal && (
        <div className="max-w-[360px] px-4 py-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-teal-500/40 dark:border-teal-400/50 shadow-xl text-slate-800 dark:text-slate-100 text-xs font-bold leading-snug animate-in fade-in duration-200 relative z-30">
          <div className="flex items-center gap-1.5 text-teal-700 dark:text-teal-400 text-[10px] uppercase tracking-wider mb-1 font-black">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Goti · Preceptor Digital</span>
          </div>
          <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
            {currentMessage}
          </p>
          {subMessage && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {subMessage}
            </p>
          )}
          {/* Ponta do Balão apontando para a esquerda */}
          <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-3.5 h-3.5 bg-white/95 dark:bg-slate-900/95 border-b border-l border-teal-500/40 dark:border-teal-400/50 rotate-45" />
        </div>
      )}
    </div>
  );
}
