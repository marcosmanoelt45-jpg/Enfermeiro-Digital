import React, { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

/**
 * Mapeamento das mídias disponíveis do Mascote Goti
 */
const GOTI_MEDIA = {
  // Animações em Vídeo
  idle: {
    type: "video",
    src: "/goti/goti-idle.mp4",
    poster: "/goti/goti-pose-neutral.png",
    label: "Goti esperando calmamente"
  },
  jumping: {
    type: "video",
    src: "/goti/goti-jumping.mp4",
    poster: "/goti/goti-pose-celebrate.png",
    label: "Goti comemorando com corações"
  },
  pointing: {
    type: "video",
    src: "/goti/goti-pointing.mp4",
    poster: "/goti/goti-pose-celebrate.png",
    label: "Goti dando uma dica clínica"
  },
  breathing: {
    type: "video",
    src: "/goti/goti-breathing.mp4",
    poster: "/goti/goti-pose-neutral.png",
    label: "Goti respirando fundo"
  },
  angry: {
    type: "video",
    src: "/goti/goti-angry.mp4",
    poster: "/goti/goti-pose-thinking.png",
    label: "Goti em alerta de enfermagem"
  },

  // Poses em Imagem de Alta Resolução (Recorte Transparente)
  thinking: {
    type: "image",
    src: "/goti/goti-pose-thinking.png",
    label: "Goti pensando na hipótese diagnóstica"
  },
  happy: {
    type: "image",
    src: "/goti/goti-pose-happy.png",
    label: "Goti radiante com estrelinhas"
  },
  celebrate: {
    type: "image",
    src: "/goti/goti-pose-celebrate.png",
    label: "Goti vibrando com mão erguida"
  },
  neutral: {
    type: "image",
    src: "/goti/goti-pose-neutral.png",
    label: "Goti sorridente e receptivo"
  },
  avatar: {
    type: "image",
    src: "/goti/goti-avatar-app.png",
    label: "Avatar oficial do Goti com touca de enfermeiro"
  }
};

const SIZE_PRESETS = {
  xs: "w-8 h-8",
  sm: "w-12 h-12",
  md: "w-24 h-24",
  lg: "w-40 h-40",
  xl: "w-56 h-56",
  "2xl": "w-72 h-72"
};

/**
 * GotiAnimated
 * Renderiza o mascote Goti em poses estáticas de alta fidelidade ou
 * em vídeos com remoção de fundo branco (ChromaKey em Canvas) a 60fps.
 */
export default function GotiAnimated({
  animation = "idle",
  size = "md",
  className = "",
  loop = true,
  autoplay = true,
  withSound = false,
  withSoundToggle = false,
  onClick = null,
  showBadge = null
}) {
  const currentMedia = GOTI_MEDIA[animation] || GOTI_MEDIA.idle;
  const isVideo = currentMedia.type === "video";

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isMuted, setIsMuted] = useState(!withSound);

  const sizeClass = SIZE_PRESETS[size] || size;

  // Gerenciamento do ChromaKey em tempo real para vídeos
  useEffect(() => {
    if (!isVideo) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let isRunning = true;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const processFrame = () => {
      if (!isRunning) return;

      if (video.readyState >= 2 && !video.paused && !video.ended) {
        const cw = canvas.width;
        const ch = canvas.height;

        // Limpa o canvas
        ctx.clearRect(0, 0, cw, ch);
        // Desenha o frame atual
        ctx.drawImage(video, 0, 0, cw, ch);

        const imgData = ctx.getImageData(0, 0, cw, ch);
        const data = imgData.data;
        const totalPixels = data.length;

        // Limiar de branco e sombra de chão
        // Elimina branco de estúdio (R,G,B altos) e a sombra cinza suave na base
        for (let i = 0; i < totalPixels; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // 1. Fundo branco puro ou quase puro
          if (r > 240 && g > 240 && b > 240) {
            data[i + 3] = 0; // Transparente
          } 
          // 2. Transição suave nas bordas (antialiasing)
          else if (r > 224 && g > 224 && b > 224) {
            const minVal = Math.min(r, g, b);
            const fade = (240 - minVal) / 16;
            data[i + 3] = Math.floor(Math.max(0, Math.min(255, data[i + 3] * fade)));
          }
          // 3. Sombra cinza neutra de estúdio no piso (apenas abaixo de 75% da altura)
          else {
            const pixelIndex = i / 4;
            const y = Math.floor(pixelIndex / cw);
            if (y > ch * 0.76) {
              const diffRG = Math.abs(r - g);
              const diffRB = Math.abs(r - b);
              // Cinza neutro sem saturação
              if (diffRG < 12 && diffRB < 12 && r > 170 && r < 235) {
                data[i + 3] = 0; // Remove elipse cinza do chão
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        if (!isVideoReady) setIsVideoReady(true);
      }

      animFrameRef.current = requestAnimationFrame(processFrame);
    };

    const handlePlay = () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(processFrame);
    };

    video.addEventListener("play", handlePlay);

    // Inicia reprodução
    video.play().catch(() => {
      // Autoplay bloqueado pelo navegador, mantém silencioso
      video.muted = true;
      video.play().catch(() => {});
    });

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      video.removeEventListener("play", handlePlay);
    };
  }, [animation, isVideo]);

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${sizeClass} ${className} ${
        onClick ? "cursor-pointer transition-transform hover:scale-105 active:scale-95" : ""
      }`}
      onClick={onClick}
      title={currentMedia.label}
    >
      {/* Halo de iluminação hospitalar suave atrás do Goti */}
      <div className="absolute inset-0 rounded-full bg-teal-500/10 dark:bg-teal-400/15 blur-xl -z-10 pointer-events-none transform scale-110" />

      {isVideo ? (
        <>
          {/* Vídeo oculto usado como fonte de frames */}
          <video
            ref={videoRef}
            src={currentMedia.src}
            loop={loop}
            autoPlay={autoplay}
            muted={isMuted}
            playsInline
            crossOrigin="anonymous"
            className="hidden"
            onLoadedData={() => setIsVideoReady(true)}
          />

          {/* Canvas que renderiza os frames transparentes */}
          <canvas
            ref={canvasRef}
            width={320}
            height={320}
            className={`w-full h-full object-contain filter drop-shadow-md transition-opacity duration-300 ${
              isVideoReady ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Imagem de poster enquanto o vídeo prepara o primeiro frame */}
          {!isVideoReady && (
            <img
              src={currentMedia.poster}
              alt={currentMedia.label}
              className="absolute inset-0 w-full h-full object-contain filter drop-shadow-md animate-pulse"
            />
          )}

          {/* Botão de Toggle de Som Opcional */}
          {withSoundToggle && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (videoRef.current) {
                  const nextMuted = !isMuted;
                  videoRef.current.muted = nextMuted;
                  setIsMuted(nextMuted);
                }
              }}
              className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-900/80 hover:bg-slate-800 text-teal-300 border border-teal-500/30 shadow-xs z-10 transition-colors"
              title={isMuted ? "Ouvir voz do Goti" : "Silenciar Goti"}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </>
      ) : (
        /* Imagem Estática com Transparência Nativa */
        <img
          src={currentMedia.src}
          alt={currentMedia.label}
          className="w-full h-full object-contain filter drop-shadow-md transition-transform duration-200"
          loading="eager"
        />
      )}

      {/* Badge ou Indicador Flutuante Opcional */}
      {showBadge && (
        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-600 text-white shadow-xs">
          {showBadge}
        </span>
      )}
    </div>
  );
}
