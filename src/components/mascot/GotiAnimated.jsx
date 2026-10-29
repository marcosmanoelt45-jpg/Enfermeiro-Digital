import React, { useEffect, useRef, useState } from "react";

/**
 * Mapeamento das poses oficiais em Ultra HD do Mascote Goti
 * Todas com recorte transparente puro (zero fundo branco), olhos brilhantes
 * e jaleco médico com cores 100% fiéis à ilustração original.
 */
const GOTI_POSES = {
  // Padrão de repouso / Espera clínica
  idle: {
    videoSrc: "/goti/goti-idle.webm",
    src: "/goti/goti-idle.webp",
    label: "Goti em plantão de simulação",
    animationClass: "",
    bottomCropPercent: 0
  },
  breathing: {
    videoSrc: "/goti/goti-idle.webm",
    src: "/goti/goti-idle.webp",
    label: "Goti respirando fundo e focado",
    animationClass: "",
    bottomCropPercent: 0
  },
  neutral: {
    videoSrc: "/goti/goti-idle.webm",
    src: "/goti/goti-idle.webp",
    label: "Goti sorridente e receptivo",
    animationClass: "",
    bottomCropPercent: 0
  },
  wave: {
    videoSrc: "/goti/goti-wave.webm",
    src: "/goti/goti-wave.webp",
    label: "Goti acenando e dando as boas-vindas",
    animationClass: "",
    bottomCropPercent: 0
  },

  // Sucesso, acerto e comemoração limpa (Goti pulando feliz, sem corações ou estrelas)
  love: {
    videoSrc: "/goti/goti-jumping.webm",
    src: "/goti/goti-jumping.webp",
    label: "Goti comemorando com alegria",
    animationClass: "",
    bottomCropPercent: 0
  },
  happy: {
    videoSrc: "/goti/goti-jumping.webm",
    src: "/goti/goti-jumping.webp",
    label: "Goti vibrando com a conquista",
    animationClass: "",
    bottomCropPercent: 0
  },
  jumping: {
    videoSrc: "/goti/goti-jumping.webm",
    src: "/goti/goti-jumping.webp",
    label: "Goti radiante pulando de alegria",
    animationClass: "",
    bottomCropPercent: 0
  },
  celebrate: {
    videoSrc: "/goti/goti-jumping.webm",
    src: "/goti/goti-jumping.webp",
    label: "Goti comemorando sua conquista",
    animationClass: "",
    bottomCropPercent: 0
  },

  // Instrução, mentoria, apontar dedo e dicas
  pointing: {
    videoSrc: "/goti/goti-pointing.webm",
    src: "/goti/goti-pointing.webp",
    label: "Goti orientando uma diretriz clínica",
    animationClass: "",
    bottomCropPercent: 0
  },
  thinking: {
    videoSrc: "/goti/goti-thinking.webm",
    src: "/goti/goti-thinking.webp",
    label: "Goti formulando hipótese diagnóstica",
    animationClass: "",
    bottomCropPercent: 0
  },

  // Alerta, erro e atenção de risco (bravo)
  angry: {
    videoSrc: "/goti/goti-angry.webm",
    src: "/goti/goti-angry.webp",
    label: "Goti bravo em alerta de segurança do paciente",
    animationClass: "",
    bottomCropPercent: 0
  },
  error: {
    videoSrc: "/goti/goti-angry.webm",
    src: "/goti/goti-angry.webp",
    label: "Goti bravo em alerta de segurança do paciente",
    animationClass: "",
    bottomCropPercent: 0
  },

  // Avatar circular
  avatar: {
    videoSrc: null,
    src: "/goti/goti-avatar-app.png",
    label: "Avatar oficial do Goti",
    animationClass: "",
    bottomCropPercent: 0
  }
};

const SIZE_PRESETS = {
  xs: "w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20",
  sm: "w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24",
  feedback: "w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56",
  md: "w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 lg:w-60 lg:h-60",
  lg: "w-44 h-44 sm:w-52 sm:h-52 md:w-64 md:h-64 lg:w-72 lg:h-72",
  xl: "w-52 h-52 sm:w-60 sm:h-60 md:w-72 md:h-72 lg:w-80 lg:h-80",
  "2xl": "w-60 h-60 sm:w-72 sm:h-72 md:w-84 md:h-84 lg:w-96 lg:h-96",
  hero: "w-52 h-64 sm:w-64 sm:h-76 md:w-80 md:h-96 lg:w-96 lg:h-[26rem] xl:w-[26rem] xl:h-[30rem]"
};

/**
 * GotiAnimated
 * Renderiza o mascote Goti:
 * - Renderização via HTML5 Canvas desacoplado do vídeo: elimina botões injetados por extensões/navegadores (>|).
 * - 100% transparente com canal alfa nativo WebM (zero fundo branco, zero cortes de jaleco ou crocs).
 * - Recorte calibrado por pose (pointing = 15.5%, idle/wave = 9.8%) para eliminar completamente o chão branco.
 * - Taxa de quadros fluida (24-60 FPS) e aceleração GPU ativa.
 */
export default function GotiAnimated({
  animation,
  pose,
  size = "md",
  width,
  height,
  className = "",
  onClick = null,
  showBadge = null,
  showShadow = false
}) {
  const requestedPose = animation || pose || "idle";
  const currentPose = GOTI_POSES[requestedPose] || GOTI_POSES.idle;
  const isPreset = typeof size === "string" && SIZE_PRESETS[size];
  const sizeClass = isPreset ? SIZE_PRESETS[size] : (typeof size === "string" && !size.match(/^\d+$/) ? size : "");
  const customWidth = width || (typeof size === "number" || (typeof size === "string" && size.match(/^\d+$/)) ? size : null);
  const customHeight = height || customWidth;
  const customStyle = customWidth
    ? { width: `${customWidth}px`, height: `${customHeight}px`, maxWidth: `${customWidth}px`, maxHeight: `${customHeight}px`, flexShrink: 0 }
    : {};

  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const [useImageFallback, setUseImageFallback] = useState(false);

  useEffect(() => {
    // Se a pose não tiver vídeo, ativa o render de imagem direto
    if (!currentPose.videoSrc) {
      setUseImageFallback(true);
      return;
    }

    // Detecção rápida de dispositivos iOS Safari / WebKit móvel
    // No iOS, WebM com transparência alfa não é suportado pelo motor gráfico e vídeos de 1px são suspensos.
    const isSafariOrIos = typeof navigator !== "undefined" && (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (/^((?!chrome|android).)*safari/i.test(navigator.userAgent))
    );

    if (isSafariOrIos) {
      setUseImageFallback(true);
      return;
    }

    // Reseta o fallback para tentar vídeo caso mude a pose em navegadores compatíveis
    setUseImageFallback(false);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let animId;
    let isActive = true;

    // Garante atributos estritos de mídia móvel para autoplay sem bloqueio
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
          // Para vídeos widescreen (1920x1080), foca uma área 1:1 centrada no personagem Goti.
          // Isso elimina ~600px de sobras vazias laterais e preserva 100% da ponta da gota,
          // estetoscópio, jaleco, pernas e calçados (crocs), sem decepar os pés.
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
        }
      }
      animId = requestAnimationFrame(drawFrame);
    };

    const handlePlay = () => {
      if (isActive) animId = requestAnimationFrame(drawFrame);
    };

    const handleError = () => {
      if (isActive) setUseImageFallback(true);
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("error", handleError);

    // Timeout de segurança: se o vídeo demorar mais de 350ms sem quadros prontos, ativa imagem
    const safetyTimeout = setTimeout(() => {
      if (isActive && video.readyState < 2) {
        setUseImageFallback(true);
      }
    }, 350);

    video.play().catch(() => {
      // Autoplay bloqueado pelo sistema operacional móvel ou modo de economia de energia
      if (isActive) setUseImageFallback(true);
    });

    animId = requestAnimationFrame(drawFrame);

    return () => {
      isActive = false;
      clearTimeout(safetyTimeout);
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
      {/* Exibição: Se for compatível e sem falha, utiliza o Canvas gráfico alimentado pelo vídeo WebM.
          Em smartphones com restrição, iOS Safari ou conexões lentas, exibe instantaneamente a imagem WebP Ultra HD com transparência pura */}
      {currentPose.videoSrc && !useImageFallback ? (
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
            onError={() => setUseImageFallback(true)}
            style={{
              position: "absolute",
              width: "1px",
              height: "1px",
              opacity: 0,
              pointerEvents: "none",
              zIndex: -1
            }}
          />
          {/* Canvas gráfico: zero botões externos, zero overlays, transparência alfa nativa e proporção 1:1 */}
          <canvas
            ref={canvasRef}
            aria-label={currentPose.label}
            style={{
              transform: "translateZ(0)",
              willChange: "transform",
              backfaceVisibility: "hidden"
            }}
            className={`w-full h-full object-contain pointer-events-none select-none ${currentPose.animationClass} transition-transform duration-300`}
          />
        </>
      ) : (
        <img
          src={currentPose.src}
          alt={currentPose.label}
          className={`w-full h-full object-contain pointer-events-none select-none ${currentPose.animationClass} transition-transform duration-300`}
          loading="eager"
          decoding="async"
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
