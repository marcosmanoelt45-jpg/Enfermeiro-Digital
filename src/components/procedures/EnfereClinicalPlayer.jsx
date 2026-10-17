import React, { useState, useRef, useEffect } from 'react';
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
  BookOpen
} from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';

/**
 * EnfereClinicalPlayer.jsx
 * Player de Vídeo Proprietário do Enfere voltado para Procedimentos e Simulação Clínica.
 * Elimina distrações visuais e sugestões externas de algoritmos,
 * oferecendo controles táteis limpos, marcos assépticos e atribuição oficial à universidade/instituição de origem.
 */
export default function EnfereClinicalPlayer({
  videoUrl,
  title,
  sourceName,
  sourceUrl,
  institutionalBadge = 'Escola de Enfermagem UFRGS & Diretrizes COFEN',
  cofenNorm = '',
  steps = [],
  previewImage = null,
  duration = '',
  onComplete,
}) {
  const { triggerHaptic } = useTheme?.() || { triggerHaptic: () => {} };
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const containerRef = useRef(null);
  const iframeRef = useRef(null);

  // Extração segura do ID do vídeo (YouTube ou MP4 direto)
  const extractVideoId = (url) => {
    if (!url) return '';
    const match = url.match(/(?:embed\/|v=|vi\/|youtu\.be\/|\/v\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : '';
  };

  const videoId = extractVideoId(videoUrl);

  // Alternar Play/Pause via postMessage da YouTube Iframe API sem recarregar o iframe
  const togglePlay = () => {
    triggerHaptic?.(15);
    if (!isPlaying) {
      setIsPlaying(true);
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'playVideo', args: '' }),
          '*'
        );
      }
    } else {
      setIsPlaying(false);
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }),
          '*'
        );
      }
    }
  };

  const toggleMute = () => {
    triggerHaptic?.(10);
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: newMuted ? 'mute' : 'unMute', args: '' }),
        '*'
      );
    }
  };

  const restartVideo = () => {
    triggerHaptic?.(20);
    setIsPlaying(true);
    if (iframeRef.current && iframeRef.current.contentWindow) {
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
    setCurrentStepIdx(0);
  }, [videoUrl]);

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col group select-none"
    >
      {/* Moldura de Vídeo 16:9 Estilo Sala de Simulação */}
      <div className="relative w-full aspect-video bg-black overflow-hidden flex items-center justify-center">
        {/* Iframe Headless com API ativa e sem poluição de terceiros */}
        {videoId ? (
          <iframe
            ref={iframeRef}
            src={`https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&autoplay=0&controls=0&modestbranding=1&rel=0&iv_load_policy=3&fs=0&playsinline=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
            title={title}
            className="w-full h-full border-0 pointer-events-auto"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        ) : (
          <div className="text-center p-8 text-slate-400">
            <BookOpen className="w-12 h-12 mx-auto text-teal-400 mb-2 opacity-60" />
            <p className="text-sm font-semibold">Vídeo demonstrativo técnico em carregamento...</p>
          </div>
        )}

        {/* Capa / Preview Exclusiva do Procedimento (Antes do Início da Reprodução) */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-20 transition-all duration-300">
            {/* Background com preview personalizada ou gradiente médico */}
            {previewImage && (
              <img
                src={previewImage}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover opacity-25"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none" />

            <div className="relative z-10 max-w-xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-bold tracking-wide">
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

              {/* Botão de Play Principal com Efeito Tátil */}
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

        {/* Marca d'água discreta do Enfere Player no canto superior */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] font-bold text-slate-200">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span>Enfere Skills Player</span>
        </div>
      </div>

      {/* Barra de Controles Próprios do Enfere */}
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-slate-200">
        <div className="flex items-center gap-2">
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
        </div>

        {/* Barra de Passos Assépticos / Marcos do Checklist */}
        {steps && steps.length > 0 && (
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Etapas da Técnica:
            </span>
            {steps.slice(0, 6).map((step, idx) => (
              <button
                key={step.id || idx}
                onClick={() => {
                  triggerHaptic?.(10);
                  setCurrentStepIdx(idx);
                }}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition ${
                  currentStepIdx === idx
                    ? 'bg-teal-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
                title={`Passo ${idx + 1}: ${step.title}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
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
              className="inline-flex items-center gap-1.5 text-teal-400 hover:text-teal-300 font-semibold transition"
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
