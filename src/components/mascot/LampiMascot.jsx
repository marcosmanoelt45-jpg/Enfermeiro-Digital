import React, { useState } from 'react';
import { useTheme } from '@/lib/ThemeContext';

/**
 * LampiMascot.jsx
 * Mascote Oficial do Lampi (Inspirado na Lâmpada de Florence Nightingale e na Coruja da Sabedoria).
 * Componente SVG vetorial puro, ultra-leve (< 12KB), 60 FPS com animações suaves de respiração,
 * piscar de olhos e múltiplos estados emocionais ('idle', 'happy', 'streak', 'thinking', 'alert').
 */
export default function LampiMascot({
  state = 'idle', // 'idle' | 'happy' | 'streak' | 'thinking' | 'alert'
  size = 120, // tamanho em px
  message = '', // balão de fala opcional
  interactive = true, // reage ao clique
  className = '',
}) {
  const { triggerHaptic } = useTheme();
  const [isWaving, setIsWaving] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const motivationalQuotes = [
    'Bora manter o foco no plantão!',
    'Acurácia diagnóstica impecável!',
    'Cheque sempre a dose antes de infundir!',
    'A lâmpada de Nightingale ilumina sua prática!',
    'Sua ofensiva clínica tá brilhando!',
  ];

  const currentMessage = message || (isWaving ? motivationalQuotes[clickCount % motivationalQuotes.length] : '');

  const handleClick = () => {
    if (!interactive) return;
    triggerHaptic(25);
    setIsWaving(true);
    setClickCount((prev) => prev + 1);
    setTimeout(() => setIsWaving(false), 2500);
  };

  const stateClasses = {
    idle: '',
    happy: 'filter contrast-105',
    streak: 'drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]',
    thinking: '-rotate-2',
    alert: 'scale-105'
  };

  return (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
      {/* Balão de Fala Dinâmico do Lampi */}
      {currentMessage && (
        <div className="mb-2 max-w-[200px] px-3 py-1.5 rounded-2xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700/80 shadow-md text-slate-800 dark:text-slate-100 text-xs font-bold leading-tight text-center animate-in zoom-in-95 duration-200 relative">
          <span>{currentMessage}</span>
          {/* Ponta do balão */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-800 border-b border-r border-emerald-300 dark:border-emerald-700/80 rotate-45" />
        </div>
      )}

      {/* Ilustração Vetorial do Mascote Lampi */}
      <div
        onClick={handleClick}
        style={{ width: size, height: size }}
        className={`relative transition-transform duration-200 cursor-pointer ${stateClasses[state] || ''} ${
          interactive ? 'hover:scale-105 active:scale-95' : ''
        }`}
        title="Lampi — Seu companheiro clínico de estudos!"
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-md"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <style>{`
            @keyframes lampiBreath {
              0%, 100% { transform: translateY(0px) scale(1); }
              50% { transform: translateY(-3px) scale(1.02); }
            }
            @keyframes lampiBlink {
              0%, 90%, 100% { transform: scaleY(1); }
              95% { transform: scaleY(0.1); }
            }
            @keyframes lampiFlame {
              0%, 100% { transform: scale(1) rotate(-2deg); fill: #F59E0B; }
              50% { transform: scale(1.15) rotate(3deg); fill: #F97316; }
            }
            @keyframes lampiWave {
              0%, 100% { transform: rotate(0deg); }
              25% { transform: rotate(-15deg); }
              75% { transform: rotate(20deg); }
            }
            .lampi-body {
              animation: lampiBreath 3.5s ease-in-out infinite;
              transform-origin: center bottom;
            }
            .lampi-eye {
              animation: lampiBlink 4s ease-in-out infinite;
              transform-origin: center;
            }
            .lampi-flame {
              animation: lampiFlame 1.8s ease-in-out infinite;
              transform-origin: center bottom;
            }
            .lampi-arm-wave {
              animation: lampiWave 0.6s ease-in-out infinite;
              transform-origin: top left;
            }
          `}</style>

          {/* Sombra suave no chão */}
          <ellipse cx="100" cy="188" rx="55" ry="8" fill="rgba(0,0,0,0.12)" />

          {/* Grupo com a respiração corporal */}
          <g className="lampi-body">
            {/* Corpo / Formato da Corujinha/Lâmpada (Verde Esmeralda e Penugem Suave) */}
            <path
              d="M100 30 C55 30, 40 70, 42 125 C43 160, 68 180, 100 180 C132 180, 157 160, 158 125 C160 70, 145 30, 100 30 Z"
              fill="url(#emeraldGradient)"
            />

            {/* Barriguinha Branca de Jaleco */}
            <path
              d="M100 75 C75 75, 65 105, 68 145 C70 168, 85 178, 100 178 C115 178, 130 168, 132 145 C135 105, 125 75, 100 75 Z"
              fill="#FFFFFF"
              fillOpacity="0.95"
            />

            {/* Gola do Jaleco Cirúrgico & Botõezinhos */}
            <path
              d="M80 82 L100 115 L120 82"
              stroke="#047857"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="100" cy="132" r="3" fill="#047857" />
            <circle cx="100" cy="148" r="3" fill="#047857" />
            <circle cx="100" cy="164" r="3" fill="#047857" />

            {/* Estetoscópio no Pescoço */}
            <path
              d="M62 95 C55 125, 75 145, 90 148"
              stroke="#0284C7"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M138 95 C145 125, 125 145, 110 148"
              stroke="#0284C7"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            {/* Olivas / Diafragma do Estetoscópio */}
            <circle cx="100" cy="150" r="7" fill="#0EA5E9" stroke="#0284C7" strokeWidth="2" />
            <circle cx="100" cy="150" r="3" fill="#FFFFFF" />

            {/* Asinhas / Braços */}
            {/* Asa Esquerda */}
            <path
              d="M44 100 C28 115, 30 140, 52 148 C50 135, 48 115, 44 100 Z"
              fill="#047857"
            />

            {/* Asa Direita (Acena se estiver acenando ou segura a lâmpada/prancheta) */}
            <g className={isWaving ? 'lampi-arm-wave' : ''}>
              <path
                d="M156 100 C172 115, 170 140, 148 148 C150 135, 152 115, 156 100 Z"
                fill="#047857"
              />
            </g>

            {/* Patinhas */}
            <ellipse cx="80" cy="182" rx="10" ry="5" fill="#F59E0B" />
            <ellipse cx="120" cy="182" rx="10" ry="5" fill="#F59E0B" />

            {/* Olhos Grandes Expressivos */}
            <g className="lampi-eye">
              {/* Olho Esquerdo */}
              <circle cx="78" cy="68" r="16" fill="#FFFFFF" />
              <circle cx="79" cy="68" r="10" fill="#0F172A" />
              <circle cx="82" cy="65" r="4" fill="#FFFFFF" /> {/* Brilho */}

              {/* Olho Direito */}
              <circle cx="122" cy="68" r="16" fill="#FFFFFF" />
              <circle cx="121" cy="68" r="10" fill="#0F172A" />
              <circle cx="124" cy="65" r="4" fill="#FFFFFF" /> {/* Brilho */}

              {/* Bochechinhas rosadas de simpatia */}
              <ellipse cx="62" cy="80" rx="6" ry="3.5" fill="#FB7185" fillOpacity="0.6" />
              <ellipse cx="138" cy="80" rx="6" ry="3.5" fill="#FB7185" fillOpacity="0.6" />
            </g>

            {/* Biquinho simpático */}
            <polygon points="94,76 106,76 100,86" fill="#F59E0B" />

            {/* Touca de Florence / Chama da Lâmpada no Topo da Cabeça */}
            <g transform="translate(0, -6)">
              {/* Suporte da Lâmpada Dourada */}
              <path
                d="M88 32 C88 24, 112 24, 112 32 Z"
                fill="#D97706"
              />
              {/* A Chama Viva de Nightingale */}
              <path
                className="lampi-flame"
                d="M100 6 C108 14, 115 22, 108 30 C104 34, 96 34, 92 30 C85 22, 92 14, 100 6 Z"
                fill="#F59E0B"
              />
              <circle cx="100" cy="24" r="3" fill="#FEF08A" />
            </g>
          </g>

          {/* Gradientes e Filtros */}
          <defs>
            <linearGradient id="emeraldGradient" x1="40" y1="30" x2="160" y2="180" gradientUnits="userSpaceOnUse">
              <stop stopColor="#10B981" />
              <stop offset="0.5" stopColor="#059669" />
              <stop offset="1" stopColor="#047857" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
