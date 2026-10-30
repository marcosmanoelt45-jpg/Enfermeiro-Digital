import React, { useEffect, useRef, useState } from "react";
import gotiPoseNeutral from "@/assets/goti-pose-neutral.png";
import gotiPoseWave from "@/assets/goti-pose-wave.png";
import gotiPoseHappy from "@/assets/goti-pose-happy.png";
import gotiPoseThinking from "@/assets/goti-pose-thinking.png";
import gotiLogoOficial from "@/assets/goti-icone-oficial.png";

/**
 * Mapeamento das poses oficiais em Ultra HD do Mascote Goti
 * - Reprodução primária via vídeo WebM com canal alfa nativo no Canvas HTML5 (60 FPS, 100% sólido).
 * - Poster instantâneo em PNG com hash do Vite enquanto o vídeo carrega (zero telas vazias ou piscadas).
 * - Fallback animado em WebP RGBA sólido para iOS Safari / navegadores sem suporte a WebM Alpha.
 */
const GOTI_POSES = {
  idle: {
    videoSrc: "/goti/goti-idle.webm",
    webpSrc: "/goti/goti-idle.webp",
    posterSrc: gotiPoseNeutral,
    label: "Goti em plantão de simulação",
  },
  breathing: {
    videoSrc: "/goti/goti-idle.webm",
    webpSrc: "/goti/goti-idle.webp",
    posterSrc: gotiPoseNeutral,
    label: "Goti respirando fundo e focado",
  },
  neutral: {
    videoSrc: "/goti/goti-idle.webm",
    webpSrc: "/goti/goti-idle.webp",
    posterSrc: gotiPoseNeutral,
    label: "Goti sorridente e receptivo",
  },
  wave: {
    videoSrc: "/goti/goti-wave.webm",
    webpSrc: "/goti/goti-wave.webp",
    posterSrc: gotiPoseWave,
    label: "Goti acenando e dando as boas-vindas",
  },
  love: {
    videoSrc: "/goti/goti-jumping.webm",
    webpSrc: "/goti/goti-jumping.webp",
    posterSrc: gotiPoseHappy,
    label: "Goti comemorando com alegria",
  },
  happy: {
    videoSrc: "/goti/goti-jumping.webm",
    webpSrc: "/goti/goti-jumping.webp",
    posterSrc: gotiPoseHappy,
    label: "Goti vibrando com a conquista",
  },
  jumping: {
    videoSrc: "/goti/goti-jumping.webm",
    webpSrc: "/goti/goti-jumping.webp",
    posterSrc: gotiPoseHappy,
    label: "Goti radiante comemorando",
  },
  celebrate: {
    videoSrc: "/goti/goti-jumping.webm",
    webpSrc: "/goti/goti-jumping.webp",
    posterSrc: gotiPoseHappy,
    label: "Goti comemorando sua conquista",
  },
  pointing: {
    videoSrc: "/goti/goti-pointing.webm",
    webpSrc: "/goti/goti-pointing.webp",
    posterSrc: gotiPoseWave,
    label: "Goti orientando uma diretriz clínica",
  },
  thinking: {
    videoSrc: "/goti/goti-thinking.webm",
    webpSrc: "/goti/goti-thinking.webp",
    posterSrc: gotiPoseThinking,
    label: "Goti formulando hipótese diagnóstica",
  },
  angry: {
    videoSrc: "/goti/goti-angry.webm",
    webpSrc: "/goti/goti-angry.webp",
    posterSrc: gotiPoseThinking,
    label: "Goti bravo em alerta de segurança do paciente",
  },
  error: {
    videoSrc: "/goti/goti-angry.webm",
    webpSrc: "/goti/goti-angry.webp",
    posterSrc: gotiPoseThinking,
    label: "Goti bravo em alerta de segurança do paciente",
  },
  avatar: {
    videoSrc: null,
    webpSrc: gotiLogoOficial,
    posterSrc: gotiLogoOficial,
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

  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [useWebpFallback, setUseWebpFallback] = useState(false);

  useEffect(() => {
    if (!currentPose.videoSrc) {
      setUseWebpFallback(true);
      setIsCanvasReady(false);
      return;
    }

    const isSafariOrIos =
      typeof navigator !== "undefined" &&
      (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
        /^((?!chrome|android).)*safari/i.test(navigator.userAgent));

    if (isSafariOrIos) {
      setUseWebpFallback(true);
      setIsCanvasReady(false);
      return;
    }

    setUseWebpFallback(false);
    setIsCanvasReady(false);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let animId;
    let isActive = true;
    let markedReady = false;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    try {
      video.setAttribute("webkit-playsinline", "true");
    } catch {}

    const ctx = canvas.getContext("2d", { alpha: true });

    const drawFrame = () => {
      if (!isActive) return;
      if (video.readyState >= 2) {
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        if (vw > 0 && vh > 0) {
          const isWidescreen = vw >= 1400 && vh >= 700;
          const sDim = isWidescreen ? Math.min(vw, Math.floor(vh * 0.96)) : Math.min(vw, vh);
          const sx = isWidescreen ? Math.floor((vw - sDim) / 2) : 0;
          const sy = isWidescreen ? Math.floor(vh * 0.03) : 0;
          const sw = sDim;
          const sh = sDim;

          if (canvas.width !== sw || canvas.height !== sh) {
            canvas.width = sw;
            canvas.height = sh;
          }
          ctx.clearRect(0, 0, sw, sh);
          ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);

          if (!markedReady) {
            markedReady = true;
            setIsCanvasReady(true);
          }
        }
      }
      animId = requestAnimationFrame(drawFrame);
    };

    const handlePlay = () => {
      if (isActive) animId = requestAnimationFrame(drawFrame);
    };

    const handleError = () => {
      if (isActive) setUseWebpFallback(true);
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("error", handleError);

    video.play().catch(() => {
      if (isActive) setUseWebpFallback(true);
    });

    animId = requestAnimationFrame(drawFrame);

    return () => {
      isActive = false;
      cancelAnimationFrame(animId);
      if (video) {
        video.removeEventListener("play", handlePlay);
        video.removeEventListener("error", handleError);
      }
    };
  }, [currentPose.videoSrc]);

  return (
    <div
      style={customStyle}
      className={`relative inline-flex flex-col items-center justify-center select-none ${sizeClass} ${className} ${
        onClick ? "cursor-pointer transition-transform hover:scale-105 active:scale-95" : ""
      }`}
      onClick={onClick}
      title={currentPose.label}
    >
      {currentPose.videoSrc && !useWebpFallback ? (
        <>
          <video
            ref={videoRef}
            key={currentPose.videoSrc}
            src={currentPose.videoSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            disablePictureInPicture={true}
            disableRemotePlayback={true}
            controls={false}
            tabIndex={-1}
            aria-hidden="true"
            onError={() => setUseWebpFallback(true)}
            style={{
              position: "absolute",
              width: "1px",
              height: "1px",
              opacity: 0,
              pointerEvents: "none",
              zIndex: -1,
            }}
          />
          {!isCanvasReady && (
            <img
              src={currentPose.posterSrc}
              alt={currentPose.label}
              className="w-full h-full object-contain pointer-events-none select-none"
              loading="eager"
              decoding="async"
            />
          )}
          <canvas
            ref={canvasRef}
            aria-label={currentPose.label}
            style={{
              transform: "translateZ(0)",
              willChange: "transform",
              backfaceVisibility: "hidden",
              display: isCanvasReady ? "block" : "none",
            }}
            className="w-full h-full object-contain pointer-events-none select-none transition-transform duration-300"
          />
        </>
      ) : (
        <img
          src={currentPose.webpSrc || currentPose.posterSrc}
          alt={currentPose.label}
          className="w-full h-full object-contain pointer-events-none select-none transition-transform duration-300"
          loading="eager"
          decoding="async"
        />
      )}

      {showBadge && (
        <span className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-600 text-white shadow-md border border-white/20">
          {showBadge}
        </span>
      )}
    </div>
  );
}
