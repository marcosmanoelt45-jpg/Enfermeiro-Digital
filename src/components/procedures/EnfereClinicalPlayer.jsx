import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ExternalLink,
  ShieldCheck,
  Award,
  BookOpen,
  Gauge
} from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';

/**
 * EnfereClinicalPlayer.jsx
 * Player de Vídeo Proprietário do Enfere para Procedimentos e Simulação Clínica.
 * Suporta streaming MP4 direto de alta definição (ex: UFRGS NAPEAD) e YouTube headless integrado,
 * com barra de andamento contínuo (timeline interativa), seletor de velocidades (0.5x a 2x),
 * controle de volume/mudo e atribuição acadêmica transparente.
 */
export default function EnfereClinicalPlayer({
  videoUrl,
  title,
  sourceName,
  sourceUrl,
  institutionalBadge = 'Escola de Enfermagem UFRGS & Diretrizes COFEN',
  cofenNorm = '',
  previewImage = null,
  duration = '',
  onComplete,
}) {
  const { triggerHaptic } = useTheme?.() || { triggerHaptic: () => {} };
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const iframeRef = useRef(null);
  const progressBarRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Detecta se é arquivo de vídeo nativo (MP4 direto da UFRGS ou CDN) ou YouTube
  const isNativeMp4 = Boolean(
    videoUrl &&
      (videoUrl.endsWith('.mp4') ||
        videoUrl.includes('.mp4') ||
        videoUrl.includes('ufrgs.br') ||
        videoUrl.includes('/video_file/'))
  );

  // Extração do ID do YouTube para vídeos em fallback
  const extractYoutubeId = (url) => {
    if (!url) return '';
    const match = url.match(/(?:embed\/|v=|vi\/|youtu\.be\/|\/v\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : '';
  };

  const youtubeId = !isNativeMp4 ? extractYoutubeId(videoUrl) : '';

  // Parse de duração inicial se informada por texto (ex: "6 min" -> 360)
  useEffect(() => {
    if (duration && totalDuration === 0) {
      const match = duration.match(/(\d+)\s*min/i);
      if (match) {
        setTotalDuration(parseInt(match[1], 10) * 60);
      }
    }
  }, [duration, totalDuration]);

  // Formatação de segundos para mm:ss
  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Alternar Play/Pause
  const togglePlay = () => {
    triggerHaptic?.(15);
    if (isNativeMp4 && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    // YouTube Iframe API
    if (!isPlaying) {
      setIsPlaying(true);
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'playVideo', args: '' }),
          '*'
        );
      }
    } else {
      setIsPlaying(false);
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }),
          '*'
        );
      }
    }
  };

  // Alternar Mudo
  const toggleMute = () => {
    triggerHaptic?.(10);
    const newMuted = !isMuted;
    setIsMuted(newMuted);

    if (isNativeMp4 && videoRef.current) {
      videoRef.current.muted = newMuted;
      return;
    }

    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: newMuted ? 'mute' : 'unMute', args: '' }),
        '*'
      );
    }
  };

  // Reiniciar vídeo do início
  const restartVideo = () => {
    triggerHaptic?.(20);
    setCurrentTime(0);
    if (isNativeMp4 && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      return;
    }

    setIsPlaying(true);
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'seekTo', args: [0, true] }),
        '*'
      );
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'playVideo', args: '' }),
        '*'
      );
    }
  };

  // Alterar Velocidade de Reprodução (0.5x, 1x, 1.25x, 1.5x, 2x)
  const handleSpeedChange = (rate) => {
    triggerHaptic?.(15);
    setPlaybackRate(rate);
    setShowSpeedMenu(false);

    if (isNativeMp4 && videoRef.current) {
      videoRef.current.playbackRate = rate;
      return;
    }

    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'setPlaybackRate', args: [rate] }),
        '*'
      );
    }
  };

  // Buscar posição no vídeo através da barra de progresso
  const handleSeekFromEvent = useCallback((e) => {
    if (!progressBarRef.current || totalDuration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = clickX / rect.width;
    const targetSeconds = percentage * totalDuration;

    setCurrentTime(targetSeconds);

    if (isNativeMp4 && videoRef.current) {
      videoRef.current.currentTime = targetSeconds;
    } else if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'seekTo', args: [targetSeconds, true] }),
        '*'
      );
    }
  }, [totalDuration, isNativeMp4]);

  const onProgressBarMouseDown = (e) => {
    isDraggingRef.current = true;
    handleSeekFromEvent(e);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingRef.current) {
        handleSeekFromEvent(e);
      }
    };
    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleSeekFromEvent]);

  // Atualização de tempo do vídeo nativo
  const handleTimeUpdate = () => {
    if (isNativeMp4 && videoRef.current && !isDraggingRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.duration && !isNaN(videoRef.current.duration)) {
        setTotalDuration(videoRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (isNativeMp4 && videoRef.current) {
      if (videoRef.current.duration && !isNaN(videoRef.current.duration)) {
        setTotalDuration(videoRef.current.duration);
      }
      videoRef.current.playbackRate = playbackRate;
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    onComplete?.();
  };

  // Simulação / sincronização contínua de tempo para YouTube caso esteja reproduzindo
  useEffect(() => {
    if (isNativeMp4 || !isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + playbackRate;
        if (totalDuration > 0 && next >= totalDuration) {
          setIsPlaying(false);
          onComplete?.();
          return totalDuration;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, isNativeMp4, playbackRate, totalDuration, onComplete]);

  // Alternar Tela Cheia
  const toggleFullscreen = () => {
    triggerHaptic?.(15);
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Limpar estado quando mudar de vídeo
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setPlaybackRate(1);
  }, [videoUrl]);

  const progressPercent = totalDuration > 0 ? Math.min(100, (currentTime / totalDuration) * 100) : 0;
  const speedOptions = [0.5, 1, 1.25, 1.5, 2];

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col group select-none transition-all duration-300"
    >
      {/* Moldura de Vídeo 16:9 de Alta Fidelidade */}
      <div className="relative w-full aspect-video bg-black overflow-hidden flex items-center justify-center">
        {/* Renderização Híbrida: Vídeo Nativo MP4 da UFRGS ou Iframe YouTube Headless */}
        {isNativeMp4 ? (
          <video
            ref={videoRef}
            src={videoUrl}
            playsInline
            preload="metadata"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleVideoEnded}
            className="w-full h-full object-contain bg-black cursor-pointer"
            onClick={togglePlay}
          />
        ) : youtubeId ? (
          <iframe
            ref={iframeRef}
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?enablejsapi=1&autoplay=0&controls=0&modestbranding=1&rel=0&iv_load_policy=3&fs=0&playsinline=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
            title={title}
            className="w-full h-full border-0 pointer-events-auto"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        ) : (
          <div className="text-center p-8 text-slate-400">
            <BookOpen className="w-12 h-12 mx-auto text-teal-400 mb-2 opacity-60" />
            <p className="text-sm font-semibold">Demonstração técnica em carregamento...</p>
          </div>
        )}

        {/* Capa / Preview Exclusiva do Procedimento (Antes do Início da Reprodução) */}
        {!isPlaying && currentTime === 0 && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-20 transition-all duration-300">
            {previewImage && (
              <img
                src={previewImage}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover opacity-25"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none" />

            <div className="relative z-10 max-w-xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-bold tracking-wide">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>{institutionalBadge}</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                {title}
              </h3>

              {duration && (
                <p className="text-xs text-slate-400 font-medium">
                  Tempo estimado de capacitação: <span className="text-teal-400 font-bold">{duration}</span>
                </p>
              )}

              {/* Botão de Play Principal */}
              <button
                onClick={togglePlay}
                className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-teal-500/25 transition-all duration-200 hover:scale-105 active:scale-95 group-hover:ring-4 group-hover:ring-teal-500/30 tap-press"
              >
                <div className="w-7 h-7 rounded-full bg-slate-950/20 flex items-center justify-center">
                  <Play className="w-4 h-4 text-slate-950 fill-current ml-0.5" />
                </div>
                <span>Iniciar Demonstração Clínica</span>
              </button>
            </div>
          </div>
        )}

        {/* Marca d'água discreta do Enfere Player */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] font-bold text-slate-200">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span>{isNativeMp4 ? 'Vídeo Oficial UFRGS • Enfere Player' : 'Enfere Clinical Player'}</span>
        </div>
      </div>

      {/* BARRA DE ANDAMENTO DO VÍDEO (TIMELINE / SCRUBBER) */}
      <div
        ref={progressBarRef}
        onMouseDown={onProgressBarMouseDown}
        className="group/progress relative h-2.5 bg-slate-800/90 hover:h-4 cursor-pointer transition-all duration-150 flex items-center"
        title="Arrastar ou clicar para navegar no vídeo"
      >
        {/* Barra de Progresso Decorrido */}
        <div
          className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-75 relative"
          style={{ width: `${progressPercent}%` }}
        >
          {/* Thumb / Indicador de arrasto no final da barra */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md scale-0 group-hover/progress:scale-100 transition-transform" />
        </div>
      </div>

      {/* BARRA DE CONTROLES PRÓPRIOS DO ENFERE */}
      <div className="bg-slate-900 border-t border-slate-800/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-slate-200">
        {/* Bloco Esquerdo: Play/Pause, Reiniciar, Mudo e Marcador de Tempo */}
        <div className="flex items-center gap-2.5">
          {/* Botão Play/Pause */}
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-xl bg-teal-500/10 hover:bg-teal-500/25 border border-teal-500/30 text-teal-400 flex items-center justify-center transition tap-press"
            title={isPlaying ? 'Pausar' : 'Reproduzir'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          {/* Botão Reiniciar */}
          <button
            onClick={restartVideo}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition tap-press"
            title="Reiniciar procedimento do início"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Botão Mudo/Áudio */}
          <button
            onClick={toggleMute}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition tap-press"
            title={isMuted ? 'Ativar Áudio' : 'Mutar'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Andamento / Tempo do Vídeo (Tempo Decorrido / Duração Total) */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono font-bold text-slate-300">
            <span className="text-teal-400">{formatTime(currentTime)}</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">{formatTime(totalDuration)}</span>
          </div>
        </div>

        {/* Bloco Direito: Seletor de Velocidades (0.5x, 1x, 1.25x, 1.5x, 2x) & Tela Cheia */}
        <div className="flex items-center gap-2.5">
          {/* Seletor de Velocidades em Linha */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1 px-1.5 text-[11px] font-bold text-slate-400">
              <Gauge className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden md:inline">Velocidade:</span>
            </div>
            {speedOptions.map((speed) => {
              const isCurrent = playbackRate === speed;
              return (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all tap-press ${
                    isCurrent
                      ? 'bg-teal-500 text-slate-950 shadow-xs scale-105'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                  title={`Reproduzir em ${speed}x`}
                >
                  {speed === 1 ? '1x' : `${speed}x`}
                </button>
              );
            })}
          </div>

          {/* Botão Tela Cheia */}
          <button
            onClick={toggleFullscreen}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition tap-press"
            title={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Rodapé Ético: Atribuição Oficial da Fonte & UFRGS / Diretrizes */}
      <div className="bg-slate-950 px-4 py-2.5 border-t border-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-teal-400 shrink-0" />
          <span>
            Produção Acadêmica: <strong className="text-slate-200">{sourceName}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-teal-400 hover:text-teal-300 font-semibold transition hover:underline"
            >
              <span>Ver no Repositório Oficial</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          {cofenNorm && (
            <span className="text-[11px] text-slate-500 hidden sm:inline border-l border-slate-800 pl-3">
              {cofenNorm}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
