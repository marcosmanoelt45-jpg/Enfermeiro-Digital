import React, { useState } from 'react';
import { useTheme } from '@/lib/ThemeContext';
import { Sparkles, Award } from 'lucide-react';

/**
 * GotiMascot.jsx
 * Mascote Oficial do Enfere: GOTI (A Gotinha Clínica da Enfermagem).
 * Construído 100% em SVG Vetorial Multi-Camada de Altíssima Resolução (60 FPS),
 * com física orgânica de squash & stretch, respiração viva, piscar de olhos realista,
 * estetoscópio articulado, tablet clínico com traçado de ECG pulsante e estados emocionais.
 */
export default function GotiMascot({
  state,
  mood,
  size = 130, // tamanho em px ou 'sm' | 'md' | 'lg' | 'xl'
  message = '', // balão socrático do Goti
  speechBubble = '', // alias retrocompatível para message
  subMessage = '', // texto menor complementar
  interactive = true, // reage ao toque/clique
  showGlow = true, // aura luminosa sutil
  onClick,
  className = '',
}) {
  const { triggerHaptic } = useTheme?.() || { triggerHaptic: () => {} };
  const [isWaving, setIsWaving] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  // Normalização do estado/humor do Goti
  const rawState = (state || mood || 'idle').toLowerCase();
  const isCelebrating = rawState === 'celebrating' || rawState === 'celebrate' || isWaving;
  const isHappy = rawState === 'happy' || rawState === 'encouraging' || isCelebrating;
  const isThinking = rawState === 'thinking' || rawState === 'think';
  const isAlert = rawState === 'alert';

  // Normalização do tamanho
  let pixelSize = 130;
  if (typeof size === 'number') {
    pixelSize = size;
  } else if (size === 'sm') {
    pixelSize = 72;
  } else if (size === 'md') {
    pixelSize = 120;
  } else if (size === 'lg') {
    pixelSize = 170;
  } else if (size === 'xl') {
    pixelSize = 230;
  }

  // Falas clínicas encorajadoras do Goti
  const gotiQuotes = [
    'Bora manter o foco no plantão! Você é capaz!',
    'Excelente raciocínio clínico! Segurança em 1º lugar.',
    'Sempre confira os 9 certos na medicação!',
    'Lembre-se da técnica asséptica e lave bem as mãos.',
    'A prática baseada em evidências é a sua melhor amiga!',
    'O SBAR claro e assertivo salva vidas no hospital!',
    'Cuidado com a velocidade de infusão das bombas!',
  ];

  const providedText = message || speechBubble || '';
  const currentMessage = providedText || (isWaving ? gotiQuotes[clickCount % gotiQuotes.length] : '');

  const handleClick = (e) => {
    if (!interactive) return;
    triggerHaptic?.(25);
    setIsWaving(true);
    setClickCount((prev) => prev + 1);
    if (onClick) onClick(e);
    setTimeout(() => setIsWaving(false), 2400);
  };

  return (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
      {/* Estilos e Animações CSS Nativas 60 FPS com Curvas Naturais Bézier */}
      <style>{`
        @keyframes gotiBreathe {
          0%, 100% {
            transform: translateY(0px) scale(1, 1);
          }
          50% {
            transform: translateY(-5px) scale(0.985, 1.015);
          }
        }
        @keyframes gotiBlink {
          0%, 88%, 94%, 100% {
            transform: scaleY(1);
          }
          91% {
            transform: scaleY(0.08);
          }
        }
        @keyframes gotiWaveArm {
          0%, 100% {
            transform: rotate(0deg);
          }
          20% {
            transform: rotate(-22deg);
          }
          40% {
            transform: rotate(18deg);
          }
          60% {
            transform: rotate(-18deg);
          }
          80% {
            transform: rotate(12deg);
          }
        }
        @keyframes gotiCelebrateJump {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          25% {
            transform: translateY(-14px) scale(1.04) rotate(-3deg);
          }
          50% {
            transform: translateY(0) scale(0.97, 1.03) rotate(2deg);
          }
          75% {
            transform: translateY(-8px) scale(1.02) rotate(-1deg);
          }
        }
        @keyframes gotiShadowMove {
          0%, 100% {
            transform: scale(1);
            opacity: 0.32;
          }
          50% {
            transform: scale(0.86);
            opacity: 0.18;
          }
        }
        @keyframes gotiEcgGlow {
          0%, 100% {
            opacity: 0.7;
            filter: drop-shadow(0 0 2px rgba(6, 182, 212, 0.5));
          }
          50% {
            opacity: 1;
            filter: drop-shadow(0 0 6px rgba(6, 182, 212, 0.9));
          }
        }

        .goti-breathe-body {
          animation: ${isCelebrating ? 'gotiCelebrateJump 0.9s ease-in-out infinite' : 'gotiBreathe 3.4s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite'};
          transform-origin: center bottom;
        }
        .goti-eye-anim {
          animation: gotiBlink 4.2s ease-in-out infinite;
          transform-origin: center;
        }
        .goti-wave-anim {
          animation: gotiWaveArm 0.8s ease-in-out infinite;
          transform-origin: 58px 125px;
        }
        .goti-shadow-anim {
          animation: gotiShadowMove 3.4s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
          transform-origin: center;
        }
        .goti-ecg-pulse {
          animation: gotiEcgGlow 2s ease-in-out infinite;
        }
      `}</style>

      {/* Balão de Fala Socrático estilo Duolingo */}
      {currentMessage && (
        <div className="mb-2.5 max-w-[270px] px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border-2 border-teal-500/80 dark:border-teal-400 shadow-xl text-slate-800 dark:text-slate-100 text-xs font-bold leading-snug text-center animate-in zoom-in-95 duration-200 relative z-30">
          <div className="flex items-center justify-center gap-1.5 text-teal-700 dark:text-teal-400 text-[10px] uppercase tracking-wider mb-0.5">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Goti · Preceptor Digital</span>
          </div>
          <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-200">
            {currentMessage}
          </p>
          {subMessage && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
              {subMessage}
            </p>
          )}
          {/* Ponta do Balão de Fala alinhada à ponta da cabeça da gotinha */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white dark:bg-slate-900 border-b-2 border-r-2 border-teal-500/80 dark:border-teal-400 rotate-45" />
        </div>
      )}

      {/* Container Principal do Mascote com Interatividade */}
      <div
        onClick={handleClick}
        style={{ width: `${pixelSize}px`, height: `${pixelSize}px` }}
        className={`relative cursor-pointer transition-transform duration-200 ${
          interactive ? 'hover:scale-105 active:scale-95' : ''
        }`}
        title="Goti, o mascote oficial do Enfere! Clique para interagir."
      >
        {/* Glow de Fundo Suave */}
        {showGlow && (
          <div
            className="absolute inset-0 rounded-full bg-teal-400/20 dark:bg-teal-500/15 blur-2xl pointer-events-none transition-opacity"
            style={{ transform: 'scale(0.85)' }}
          />
        )}

        {/* Emblema de Conquista / Vitória */}
        {isCelebrating && (
          <div className="absolute -top-3 -right-2 z-30 flex items-center gap-1 bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-lg animate-bounce">
            <Award className="w-3.5 h-3.5 text-slate-950 fill-amber-300" />
            <span>Show!</span>
          </div>
        )}

        {/* SVG Vetorial Hiper-Nítido e Articulado do GOTI */}
        <svg
          viewBox="0 0 240 240"
          className="w-full h-full relative z-10 drop-shadow-md select-none pointer-events-none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradiente do Corpo da Gotinha (Branco Pérola / Sutil reflexo azul clínico) */}
            <radialGradient id="gotiBodyGrad" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="60%" stopColor="#F0F9FF" />
              <stop offset="85%" stopColor="#E0F2FE" />
              <stop offset="100%" stopColor="#BAE6FD" />
            </radialGradient>

            {/* Gradiente da Blusa Scrub (Verde-Água / Teal Clínico) */}
            <linearGradient id="gotiScrubGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14B8A6" />
              <stop offset="50%" stopColor="#0D9488" />
              <stop offset="100%" stopColor="#0F766E" />
            </linearGradient>

            {/* Gradiente da Calça Scrub */}
            <linearGradient id="gotiPantsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0D9488" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>

            {/* Gradiente dos Olhos (Profundidade Expressiva) */}
            <radialGradient id="gotiEyeGrad" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#0369A1" />
              <stop offset="45%" stopColor="#0C4A6E" />
              <stop offset="100%" stopColor="#082F49" />
            </radialGradient>

            {/* Brilho da Tela do Tablet Clínico */}
            <linearGradient id="gotiScreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
          </defs>

          {/* Sombra Dinâmica no Piso */}
          <ellipse
            cx="120"
            cy="222"
            rx="56"
            ry="9"
            fill="rgba(15, 23, 42, 0.35)"
            className="goti-shadow-anim"
          />

          {/* Grupo Articulado com Respiração e Física Corporal */}
          <g className="goti-breathe-body">
            {/* 1. Sapatinhos Hospitalares (Crocs Brancos com Solado Macio) */}
            <g id="goti-shoes">
              {/* Pé Esquerdo */}
              <ellipse cx="98" cy="214" rx="16" ry="8" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />
              <circle cx="93" cy="212" r="1.5" fill="#94A3B8" />
              <circle cx="98" cy="213" r="1.5" fill="#94A3B8" />
              <circle cx="103" cy="212" r="1.5" fill="#94A3B8" />

              {/* Pé Direito */}
              <ellipse cx="142" cy="214" rx="16" ry="8" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />
              <circle cx="137" cy="212" r="1.5" fill="#94A3B8" />
              <circle cx="142" cy="213" r="1.5" fill="#94A3B8" />
              <circle cx="147" cy="212" r="1.5" fill="#94A3B8" />
            </g>

            {/* 2. Perninhas e Calça Scrub */}
            <g id="goti-pants">
              <path
                d="M86 186 L112 186 L108 210 L88 210 Z"
                fill="url(#gotiPantsGrad)"
              />
              <path
                d="M128 186 L154 186 L152 210 L132 210 Z"
                fill="url(#gotiPantsGrad)"
              />
            </g>

            {/* 3. Corpo Principal da Gotinha (Forma Fluida Orgânica) */}
            <g id="goti-head-body">
              <path
                d="M120 22 C135 48, 185 96, 185 142 C185 180, 156 200, 120 200 C84 200, 55 180, 55 142 C55 96, 105 48, 120 22 Z"
                fill="url(#gotiBodyGrad)"
                stroke="#BAE6FD"
                strokeWidth="1.5"
              />

              {/* Reflexo de Brilho Tridimensional na Superfície da Gota */}
              <path
                d="M120 34 C128 54, 160 88, 166 120 C162 100, 140 64, 124 44 Z"
                fill="#FFFFFF"
                fillOpacity="0.6"
              />
            </g>

            {/* 4. Roupa Scrub (Camisa com Decote em V e Bolsinho) */}
            <g id="goti-scrub">
              {/* Blusa Scrub cobrindo o tronco */}
              <path
                d="M62 136 C64 120, 176 120, 178 136 C182 165, 175 190, 120 190 C65 190, 58 165, 62 136 Z"
                fill="url(#gotiScrubGrad)"
              />

              {/* Decote em V Clássico da Enfermagem */}
              <path
                d="M102 125 L120 148 L138 125"
                stroke="#0F766E"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <polygon points="108,125 120,142 132,125" fill="#E0F2FE" />

              {/* Bolsinho do Jaleco com Mini Cruz da Enfermagem */}
              <rect x="78" y="152" width="16" height="15" rx="3" fill="#0F766E" fillOpacity="0.4" />
              <path d="M86 156 L86 162 M83 159 L89 159" stroke="#CCFBF1" strokeWidth="1.8" strokeLinecap="round" />
            </g>

            {/* 5. Estetoscópio Clínico */}
            <g id="goti-stethoscope">
              {/* Tubo de borracha ao redor do pescoço */}
              <path
                d="M84 130 C76 148, 88 165, 106 168"
                stroke="#475569"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M156 130 C164 148, 148 165, 126 168"
                stroke="#475569"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Olivas e Diafragma Metálico */}
              <circle cx="116" cy="169" r="6.5" fill="#94A3B8" stroke="#475569" strokeWidth="1.8" />
              <circle cx="116" cy="169" r="3" fill="#E2E8F0" />
            </g>

            {/* 6. Braço Esquerdo segurando o Tablet Clínico com Prontuário */}
            <g id="goti-left-arm-tablet">
              {/* Braço com manga scrub */}
              <path d="M174 142 C184 150, 185 165, 172 174" stroke="#0D9488" strokeWidth="9" strokeLinecap="round" />
              <ellipse cx="170" cy="172" rx="7" ry="6" fill="#F0F9FF" />

              {/* O Tablet Clínico */}
              <g transform="translate(160, 138) rotate(12)">
                <rect x="0" y="0" width="30" height="42" rx="4" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />
                <rect x="2.5" y="3" width="25" height="36" rx="2.5" fill="url(#gotiScreenGrad)" />

                {/* Traçado de ECG e Batimentos no Tablet */}
                <path
                  className="goti-ecg-pulse"
                  d="M4 22 L9 22 L11 16 L14 28 L17 18 L20 22 L26 22"
                  stroke="#22D3EE"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                {/* Linhas de Dados Clínicos */}
                <line x1="5" y1="8" x2="16" y2="8" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="22" cy="8" r="2" fill="#34D399" />
                <line x1="5" y1="32" x2="20" y2="32" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
              </g>
            </g>

            {/* 7. Braço Direito Interativo (Aceno Fluido ao Clicar) */}
            <g id="goti-right-arm" className={isWaving || isCelebrating ? 'goti-wave-anim' : ''}>
              {/* Manga do scrub */}
              <path d="M66 142 C54 148, 52 162, 64 172" stroke="#0D9488" strokeWidth="9" strokeLinecap="round" />
              {/* Mãozinha branca acenando */}
              <ellipse cx="60" cy="172" rx="7.5" ry="6.5" fill="#F0F9FF" />
            </g>

            {/* 8. Rosto Expressivo: Olhos, Bochechas e Sorriso */}
            <g id="goti-face">
              {/* Bochechinhas Rosadas com Blush Suave */}
              <ellipse cx="86" cy="120" rx="9" ry="5.5" fill="#FB7185" fillOpacity="0.45" />
              <ellipse cx="154" cy="120" rx="9" ry="5.5" fill="#FB7185" fillOpacity="0.45" />

              {/* Expressão dos Olhos */}
              {isHappy ? (
                /* Olhos em Arco Sorridente Alegre (^ ^) */
                <g>
                  <path
                    d="M92 108 C97 99, 109 99, 114 108"
                    stroke="#0F172A"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M126 108 C131 99, 143 99, 148 108"
                    stroke="#0F172A"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                  />
                </g>
              ) : isThinking ? (
                /* Olhos Pensativos voltados para cima */
                <g className="goti-eye-anim">
                  {/* Olho Esquerdo */}
                  <ellipse cx="102" cy="104" rx="14" ry="16" fill="#FFFFFF" stroke="#BAE6FD" strokeWidth="1" />
                  <ellipse cx="104" cy="98" rx="9.5" ry="11" fill="url(#gotiEyeGrad)" />
                  <circle cx="106" cy="94" r="3.5" fill="#FFFFFF" />

                  {/* Olho Direito */}
                  <ellipse cx="138" cy="104" rx="14" ry="16" fill="#FFFFFF" stroke="#BAE6FD" strokeWidth="1" />
                  <ellipse cx="140" cy="98" rx="9.5" ry="11" fill="url(#gotiEyeGrad)" />
                  <circle cx="142" cy="94" r="3.5" fill="#FFFFFF" />
                </g>
              ) : isAlert ? (
                /* Olhos Arregalados de Atenção/Alerta Clínico */
                <g className="goti-eye-anim">
                  {/* Olho Esquerdo */}
                  <ellipse cx="100" cy="105" rx="16" ry="18" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="1.5" />
                  <ellipse cx="100" cy="105" rx="9" ry="10" fill="#0F172A" />
                  <circle cx="103" cy="101" r="3.5" fill="#FFFFFF" />

                  {/* Olho Direito */}
                  <ellipse cx="140" cy="105" rx="16" ry="18" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="1.5" />
                  <ellipse cx="140" cy="105" rx="9" ry="10" fill="#0F172A" />
                  <circle cx="143" cy="101" r="3.5" fill="#FFFFFF" />
                </g>
              ) : (
                /* Olhos Padrão (Grandes, Vivos e com Piscar Orgânico a 60 FPS) */
                <g className="goti-eye-anim">
                  {/* Olho Esquerdo */}
                  <ellipse cx="101" cy="106" rx="14.5" ry="16.5" fill="#FFFFFF" stroke="#E0F2FE" strokeWidth="1" />
                  <ellipse cx="102" cy="106" rx="10" ry="11.5" fill="url(#gotiEyeGrad)" />
                  <circle cx="102" cy="106" r="6.5" fill="#082F49" />
                  <circle cx="105" cy="101" r="3.8" fill="#FFFFFF" /> {/* Catchlight 1 */}
                  <circle cx="98" cy="111" r="1.8" fill="#FFFFFF" fillOpacity="0.8" /> {/* Catchlight 2 */}

                  {/* Olho Direito */}
                  <ellipse cx="139" cy="106" rx="14.5" ry="16.5" fill="#FFFFFF" stroke="#E0F2FE" strokeWidth="1" />
                  <ellipse cx="138" cy="106" rx="10" ry="11.5" fill="url(#gotiEyeGrad)" />
                  <circle cx="138" cy="106" r="6.5" fill="#082F49" />
                  <circle cx="141" cy="101" r="3.8" fill="#FFFFFF" /> {/* Catchlight 1 */}
                  <circle cx="134" cy="111" r="1.8" fill="#FFFFFF" fillOpacity="0.8" /> {/* Catchlight 2 */}
                </g>
              )}

              {/* Boquinha Amigável e Expressiva */}
              {isHappy ? (
                /* Boca Aberta Sorrindo Alegre com Língua Rosadinha */
                <g>
                  <path
                    d="M112 120 C112 131, 128 131, 128 120 Z"
                    fill="#BE123C"
                  />
                  <path
                    d="M115 125 C118 128, 122 128, 125 125"
                    stroke="#FDA4AF"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </g>
              ) : isThinking ? (
                /* Boquinha Curiosa Pequena */
                <ellipse cx="120" cy="122" rx="3.5" ry="3" fill="#BE123C" />
              ) : (
                /* Sorriso Confiante Gentil */
                <path
                  d="M113 121 C117 126, 123 126, 127 121"
                  stroke="#BE123C"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  fill="none"
                />
              )}
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}
