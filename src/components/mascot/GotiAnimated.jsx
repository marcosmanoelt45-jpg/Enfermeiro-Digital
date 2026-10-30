import React from "react";
import gotiPoseNeutral from "@/assets/goti-pose-neutral.png";
import gotiPoseWave from "@/assets/goti-pose-wave.png";
import gotiPoseHappy from "@/assets/goti-pose-happy.png";
import gotiPoseThinking from "@/assets/goti-pose-thinking.png";
import gotiLogoOficial from "@/assets/goti-icone-oficial.png";

/**
 * Mapeamento das poses oficiais em Ultra HD do Mascote Goti
 * Renderização estática/suave via assets com hash do Vite (zero flicker/piscadas de vídeo WebM corrompido,
 * cores 100% sólidas no corpo azul e jaleco branco, e canal alfa puro).
 */
const GOTI_POSES = {
  idle: {
    src: gotiPoseNeutral,
    label: "Goti em plantão de simulação",
  },
  breathing: {
    src: gotiPoseNeutral,
    label: "Goti respirando fundo e focado",
  },
  neutral: {
    src: gotiPoseNeutral,
    label: "Goti sorridente e receptivo",
  },
  wave: {
    src: gotiPoseWave,
    label: "Goti acenando e dando as boas-vindas",
  },
  love: {
    src: gotiPoseHappy,
    label: "Goti comemorando com alegria",
  },
  happy: {
    src: gotiPoseHappy,
    label: "Goti vibrando com a conquista",
  },
  jumping: {
    src: gotiPoseHappy,
    label: "Goti radiante comemorando",
  },
  celebrate: {
    src: gotiPoseHappy,
    label: "Goti comemorando sua conquista",
  },
  pointing: {
    src: gotiPoseWave,
    label: "Goti orientando uma diretriz clínica",
  },
  thinking: {
    src: gotiPoseThinking,
    label: "Goti formulando hipótese diagnóstica",
  },
  angry: {
    src: gotiPoseThinking,
    label: "Goti em alerta de segurança do paciente",
  },
  error: {
    src: gotiPoseThinking,
    label: "Goti em alerta de segurança do paciente",
  },
  avatar: {
    src: gotiLogoOficial,
    label: "Avatar oficial do Goti",
  },
};

const SIZE_PRESETS = {
  xs: "w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20",
  sm: "w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24",
  feedback: "w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56",
  md: "w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 lg:w-60 lg:h-60",
  lg: "w-44 h-44 sm:w-52 sm:h-52 md:w-64 md:h-64 lg:w-72 lg:h-72",
  xl: "w-52 h-52 sm:w-60 sm:h-60 md:w-72 md:h-72 lg:w-80 lg:h-80",
  "2xl": "w-60 h-60 sm:w-72 sm:h-72 md:w-84 md:h-84 lg:w-96 lg:h-96",
  hero: "w-52 h-64 sm:w-64 sm:h-76 md:w-80 md:h-96 lg:w-96 lg:h-[26rem] xl:w-[26rem] xl:h-[30rem]",
};

export default function GotiAnimated({
  animation,
  pose,
  size = "md",
  width,
  height,
  className = "",
  onClick = null,
  showBadge = null,
}) {
  const requestedPose = animation || pose || "idle";
  const currentPose = GOTI_POSES[requestedPose] || GOTI_POSES.idle;
  const isPreset = typeof size === "string" && SIZE_PRESETS[size];
  const sizeClass = isPreset
    ? SIZE_PRESETS[size]
    : typeof size === "string" && !size.match(/^\d+$/)
      ? size
      : "";
  const customWidth =
    width ||
    (typeof size === "number" || (typeof size === "string" && size.match(/^\d+$/))
      ? size
      : null);
  const customHeight = height || customWidth;
  const customStyle = customWidth
    ? {
        width: `${customWidth}px`,
        height: `${customHeight}px`,
        maxWidth: `${customWidth}px`,
        maxHeight: `${customHeight}px`,
        flexShrink: 0,
      }
    : {};

  return (
    <div
      style={customStyle}
      className={`relative inline-flex flex-col items-center justify-center select-none ${sizeClass} ${className} ${
        onClick ? "cursor-pointer transition-transform hover:scale-105 active:scale-95" : ""
      }`}
      onClick={onClick}
      title={currentPose.label}
    >
      <img
        src={currentPose.src}
        alt={currentPose.label}
        className="w-full h-full object-contain pointer-events-none select-none transition-transform duration-300"
        loading="eager"
        decoding="async"
      />

      {showBadge && (
        <span className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-600 text-white shadow-md border border-white/20">
          {showBadge}
        </span>
      )}
    </div>
  );
}
