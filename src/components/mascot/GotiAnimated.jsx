import React from "react";

/**
 * Mapeamento das poses oficiais em Ultra HD do Mascote Preceptor Goti
 * Todas com recorte transparente puro (zero fundo branco), olhos brilhantes
 * e jaleco médico com cores 100% fiéis à ilustração original.
 */
const GOTI_POSES = {
  // Padrão de repouso / Espera clínica
  idle: {
    src: "/goti/goti-idle.webp",
    label: "Goti em plantão de simulação",
    animationClass: ""
  },
  breathing: {
    src: "/goti/goti-idle.webp",
    label: "Goti respirando fundo e focado",
    animationClass: ""
  },
  neutral: {
    src: "/goti/goti-idle.webp",
    label: "Goti sorridente e receptivo",
    animationClass: ""
  },
  wave: {
    src: "/goti/goti-wave.webp",
    label: "Goti acenando e dando as boas-vindas",
    animationClass: ""
  },

  // Sucesso, acerto e amor (corações)
  love: {
    src: "/goti/goti-love.webp",
    label: "Goti comemorando com corações",
    animationClass: ""
  },
  happy: {
    src: "/goti/goti-love.webp",
    label: "Goti vibrando com estrelinhas e corações",
    animationClass: ""
  },
  jumping: {
    src: "/goti/goti-jumping.webp",
    label: "Goti radiante pulando de alegria",
    animationClass: ""
  },
  celebrate: {
    src: "/goti/goti-jumping.webp",
    label: "Goti comemorando sua conquista",
    animationClass: ""
  },

  // Instrução, mentoria, apontar dedo e dicas
  pointing: {
    src: "/goti/goti-pointing.webp",
    label: "Goti orientando uma diretriz clínica",
    animationClass: ""
  },
  thinking: {
    src: "/goti/goti-pointing.webp",
    label: "Goti formulando hipótese diagnóstica",
    animationClass: ""
  },

  // Alerta, erro e atenção de risco (bravo)
  angry: {
    src: "/goti/goti-angry.webp",
    label: "Goti em alerta de segurança do paciente",
    animationClass: ""
  },
  error: {
    src: "/goti/goti-angry.webp",
    label: "Goti atento corrigindo a conduta",
    animationClass: ""
  },

  // Avatar circular
  avatar: {
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
 * - 100% transparente (sem nenhum fundo branco ou caixa retangular).
 * - Olhos cristalinos, jaleco branco puro, gola verde e crocs com furinhos.
 * - Animação suave e orgânica de flutuação/levitação (CSS 60 FPS).
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
        <div className="absolute bottom-1 w-2/3 h-3 rounded-full bg-black/25 dark:bg-black/40 blur-sm -z-10 pointer-events-none" />
      )}

      {/* Ilustração recortada ultra-HD com contornos puros */}
      <img
        src={currentPose.src}
        alt={currentPose.label}
        className={`w-full h-full object-contain ${currentPose.animationClass} transition-transform duration-300`}
        loading="eager"
      />

      {/* Badge ou Indicador Flutuante Opcional */}
      {showBadge && (
        <span className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-600 text-white shadow-md border border-white/20">
          {showBadge}
        </span>
      )}
    </div>
  );
}
