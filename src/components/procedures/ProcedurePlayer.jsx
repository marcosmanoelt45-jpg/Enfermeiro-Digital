import React, { useRef, useState } from 'react';
import { Play, Clock, Video } from 'lucide-react';

export default function ProcedurePlayer({ procedure }) {
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const iframeRef = useRef(null);

  if (!procedure) return null;

  const {
    title,
    videoUrl,
    videoSource,
    duration,
    timestamps = [],
  } = procedure;

  // Formata a URL do YouTube com parâmetros limpos e start timestamp
  const getEmbedUrl = (seconds = 0) => {
    if (!videoUrl) return '';
    let url = videoUrl;

    // Se for URL normal do youtube (watch?v=), converte para embed
    if (url.includes('watch?v=')) {
      const videoId = url.split('watch?v=')[1]?.split('&')[0];
      url = `https://www.youtube.com/embed/${videoId}`;
    }

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}rel=0&modestbranding=1&start=${seconds}`;
  };

  const handleSeek = (seconds) => {
    setCurrentSeconds(seconds);
    if (iframeRef.current) {
      iframeRef.current.src = getEmbedUrl(seconds);
    }
  };

  const isEmbeddable = videoUrl && (videoUrl.includes('youtube') || videoUrl.includes('youtu.be') || videoUrl.includes('vimeo'));

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs transition-colors">
      {/* Container de Vídeo Proporção 16:9 */}
      <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {isEmbeddable ? (
          <iframe
            ref={iframeRef}
            src={getEmbedUrl(currentSeconds)}
            title={title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : videoUrl ? (
          <video
            src={videoUrl}
            controls
            className="w-full h-full object-cover"
            title={title}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <Video className="h-12 w-12 text-slate-600 mb-2" />
            <p className="text-xs">Demonstração interativa e roteiro didático disponível abaixo.</p>
          </div>
        )}
      </div>

      {/* Barra de Informações do Vídeo */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Fonte Didática: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{videoSource}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200/60 dark:border-slate-700/60">
              <Clock className="h-3.5 w-3.5 text-emerald-600" />
              <span>Duração: {duration}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Capítulos & Marcadores de Tempo Interativos */}
      {timestamps.length > 0 && (
        <div className="p-4 bg-slate-50/60 dark:bg-slate-950/40">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Play className="h-3.5 w-3.5 text-emerald-600 fill-emerald-600" />
              Capítulos do Procedimento (Clique para ir direto à etapa)
            </span>
            <span className="text-[10px] text-slate-400">
              {timestamps.length} etapas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {timestamps.map((cap, idx) => {
              const isActive = currentSeconds === cap.seconds;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSeek(cap.seconds)}
                  className={`flex items-center gap-2.5 p-2 rounded-xl text-left border text-xs transition-all active:scale-98 ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold ring-1 ring-emerald-500/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200/70 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-300 hover:bg-emerald-50/30'
                  }`}
                >
                  <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 shrink-0">
                    {cap.time}
                  </span>
                  <span className="truncate text-xs">
                    {cap.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
