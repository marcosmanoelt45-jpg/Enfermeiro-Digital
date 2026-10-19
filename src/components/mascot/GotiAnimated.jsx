import React from "react";

/**
 * Mapeamento das poses oficiais em Ultra HD do Mascote Preceptor Goti
 * Todas com recorte transparente puro (zero fundo branco), olhos brilhantes
 * e jaleco médico com cores 100% fiéis à ilustração original.
 */
const GOTI_POSES = {
  // Padrão de repouso / Espera clínica
  idle: {
    videoSrc: "/goti/goti-idle.webm",
    src: "/goti/goti-idle.webp",
    label: "Goti em plantão de simulação",
    animationClass: ""
  },
  breathing: {
    videoSrc: "/goti/goti-idle.webm",
    src: "/goti/goti-idle.webp",
    label: "Goti respirando fundo e focado",
    animationClass: ""
  },
  neutral: {
    videoSrc: "/goti/goti-idle.webm",
    src: "/goti/goti-idle.webp",
    label: "Goti sorridente e receptivo",
    animationClass: ""
  },
  wave: {
    videoSrc: "/goti/goti-wave.webm",
    src: "/goti/goti-wave.webp",
    label: "Goti acenando e dando as boas-vindas",
    animationClass: ""
  },

  // Sucesso, acerto e amor (corações flutuantes)
  love: {
    videoSrc: "/goti/goti-love.webm",
    src: "/goti/goti-love.webp",
    label: "Goti comemorando com corações",
    animationClass: ""
  },
  happy: {
    videoSrc: "/goti/goti-happy.webm",
    src: "/goti/goti-happy.webp",
    label: "Goti vibrando com estrelinhas e corações",
    animationClass: ""
  },
  jumping: {
    videoSrc: "/goti/goti-jumping.webm",
    src: "/goti/goti-jumping.webp",
    label: "Goti radiante pulando de alegria",
    animationClass: ""
  },
  celebrate: {
    videoSrc: "/goti/goti-celebrate.webm",
    src: "/goti/goti-celebrate.webp",
    label: "Goti comemorando sua conquista",
    animationClass: ""
  },

  // Instrução, mentoria, apontar dedo e dicas
  pointing: {
    videoSrc: "/goti/goti-pointing.webm",
    src: "/goti/goti-pointing.webp",
    label: "Goti orientando uma diretriz clínica",
    animationClass: ""
  },
  thinking: {
    videoSrc: "/goti/goti-thinking.webm",
    src: "/goti/goti-thinking.webp",
    label: "Goti formulando hipótese diagnóstica",
    animationClass: ""
  },

  // Alerta, erro e atenção de risco (bravo)
  angry: {
    videoSrc: "/goti/goti-angry.webm",
    src: "/goti/goti-angry.webp",
    label: "Goti em alerta de segurança do paciente",
    animationClass: ""
  },
  error: {
    videoSrc: "/goti/goti-error.webm",
    src: "/goti/goti-error.webp",
    label: "Goti atento corrigindo a conduta",
    animationClass: ""
  },

  // Avatar circular
  avatar: {
    videoSrc: null,
    src: "/goti/goti-avatar-app.png",
    label: "Avatar oficial do Goti",
    animationClass: ""
  }
};

const SIZE_PRESETS = {
  xs: "w-8 h-8",
  sm: "w-12 h-12",
  feedback: "w-20 h-20 sm:w-24 sm:h-24",
  md: "w-24 h-24",
  lg: "w-40 h-40",
  xl: "w-52 h-52",
  "2xl": "w-64 h-64",
  hero: "w-48 h-56 sm:w-56 sm:h-64"
};

/**
 * GotiAnimated
 * Renderiza o mascote Preceptor Goti:
 * - 100% transparente com canal alfa nativo WebM (zero fundo branco, zero cortes de jaleco ou crocs).
 * - Vídeos em taxa de quadros fluida (24-60 FPS) e loops orgânicos contínuos.
 * - Suporte a fallback imediato e acessibilidade.
 */
export default function GotiAnimated({
  animation = "idle",
  size = "md",
  className = "",
  onClick = null,
  showBadge = null,
  showShadow = true
}) {
  const currentPose = GOTI_POSES[animation] || GOTI_POSES.idle;
  const sizeClass = SIZE_PRESETS[size] || size;

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center select-none ${sizeClass} ${className} ${
        onClick ? "cursor-pointer transition-transform hover:scale-105 active:scale-95" : ""
      }`}
      onClick={onClick}
      title={currentPose.label}
    >
      {/* Sombra de apoio suave e discreta na base */}
      {showShadow && (
        <div className="absolute bottom-0 w-1/2 h-2 rounded-full bg-black/15 dark:bg-black/30 blur-xs pointer-events-none" />
      )}

      {/* Renderização de Vídeo WebM Transparente ou Fallback de Imagem */}
      {currentPose.videoSrc ? (
        <video
          key={currentPose.videoSrc}
          ref={(el) => {
            if (el) {
              el.muted = true;
              el.defaultMuted = true;
            }
          }}
          src={currentPose.videoSrc}
          autoPlay
          loop
          muted
          defaultMuted
          playsInline
          preload="auto"
          aria-label={currentPose.label}
          className={`w-full h-full object-contain pointer-events-none ${currentPose.animationClass} transition-transform duration-300`}
        />
      ) : (
        <img
          src={currentPose.src}
          alt={currentPose.label}
          className={`w-full h-full object-contain ${currentPose.animationClass} transition-transform duration-300`}
          loading="eager"
        />
      )}

      {/* Badge ou Indicador Flutuante Opcional */}
      {showBadge && (
        <span className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-600 text-white shadow-md border border-white/20">
          {showBadge}
        </span>
      )}
    </div>
  );
}
