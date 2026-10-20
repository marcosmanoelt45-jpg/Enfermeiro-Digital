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
  xs: "w-10 h-10 md:w-14 md:h-14",
  sm: "w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24",
  feedback: "w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-44 lg:h-44",
  md: "w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48",
  lg: "w-36 h-36 sm:w-44 sm:h-44 md:w-56 md:h-56 lg:w-64 lg:h-64",
  xl: "w-44 h-44 sm:w-52 sm:h-52 md:w-64 md:h-64 lg:w-72 lg:h-72",
  "2xl": "w-52 h-52 sm:w-60 sm:h-60 md:w-72 md:h-72 lg:w-80 lg:h-80 xl:w-96 xl:h-96",
  hero: "w-44 h-52 sm:w-52 sm:h-60 md:w-72 md:h-84 lg:w-88 lg:h-[26rem] xl:w-96 xl:h-[30rem]"
};

/**
 * GotiAnimated
 * Renderiza o mascote Preceptor Goti:
 * - 100% transparente com canal alfa nativo WebM (zero fundo branco, zero cortes de jaleco ou crocs).
 * - Vídeos em taxa de quadros fluida (24-60 FPS) e loops orgânicos contínuos com transição imperceptível.
 * - Aceleração gráfica por hardware (GPU) ativa para eliminar micro-stutters.
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
        <div className="absolute bottom-0 w-1/2 h-2.5 rounded-full bg-black/15 dark:bg-black/30 blur-xs pointer-events-none" />
      )}

      {/* Renderização de Vídeo WebM Transparente ou Fallback de Imagem com aceleração de hardware */}
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
          style={{
            transform: "translateZ(0)",
            willChange: "transform",
            backfaceVisibility: "hidden"
          }}
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
