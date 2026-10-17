import React, { useRef } from 'react';
import { Clock, Video, ExternalLink, ShieldCheck, BookOpen } from 'lucide-react';

export default function ProcedurePlayer({ procedure }) {
  const iframeRef = useRef(null);

  if (!procedure) return null;

  const {
    title,
    videoUrl,
    videoSource,
    duration,
    institutionalBadge,
    officialGuideUrl,
  } = procedure;

  // Formata a URL do YouTube com parâmetros limpos e sem recomendações invasivas
  const getEmbedUrl = () => {
    if (!videoUrl) return '';
    let url = videoUrl;

    if (url.includes('watch?v=')) {
      const videoId = url.split('watch?v=')[1]?.split('&')[0];
      url = `https://www.youtube.com/embed/${videoId}`;
    }

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}rel=0&modestbranding=1&controls=1`;
  };

  const getDirectYoutubeUrl = () => {
    if (!videoUrl) return '';
    if (videoUrl.includes('/embed/')) {
      const id = videoUrl.split('/embed/')[1]?.split('?')[0];
      return `https://www.youtube.com/watch?v=${id}`;
    }
    return videoUrl;
  };

  const isEmbeddable = videoUrl && (videoUrl.includes('youtube') || videoUrl.includes('youtu.be') || videoUrl.includes('vimeo'));

  return (
    <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs transition-colors">
      {/* Container de Vídeo Proporção 16:9 de Alta Fidelidade */}
      <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {isEmbeddable ? (
          <iframe
            ref={iframeRef}
            src={getEmbedUrl()}
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
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <Video className="h-12 w-12 text-slate-600 mb-2" />
            <p className="text-xs font-medium">Demonstração técnica em laboratório disponível abaixo.</p>
          </div>
        )}
      </div>

      {/* Barra de Informações & Credenciamento da Fonte Oficial */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {institutionalBadge && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>{institutionalBadge}</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                <span>{duration}</span>
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 leading-snug">
              {title}
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Produção & Demonstração: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{videoSource}</strong>
            </p>
          </div>

          {/* Links Externos Oficiais (YouTube institucional e Protocolo COFEN) */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap shrink-0">
            {officialGuideUrl && (
              <a
                href={officialGuideUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 text-xs font-bold hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 transition tap-press"
                title="Acessar resolução regulamentadora ou protocolo oficial"
              >
                <BookOpen className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>Diretriz / COFEN</span>
              </a>
            )}

            {isEmbeddable && (
              <a
                href={getDirectYoutubeUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/70 dark:border-slate-700 transition tap-press"
                title="Assistir em tela cheia no player oficial"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Abrir Vídeo</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
