import React from 'react';
import { ChevronRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ClinicalModuleCard({
  title,
  description,
  tag,
  time,
  icon: Icon,
  to,
  progress = null,
  featured = false,
  badgeText = '',
  onClick = null
}) {
  const content = (
    <div
      onClick={onClick}
      className={`group block p-4 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border-2 transition-all duration-150 select-none cursor-pointer ${
        featured
          ? 'border-emerald-200 dark:border-emerald-800/80 border-b-4 border-b-emerald-400 dark:border-b-emerald-600 shadow-sm shadow-emerald-100/50 dark:shadow-none hover:border-emerald-300 active:translate-y-1 active:border-b-2'
          : 'border-slate-200 dark:border-slate-800 border-b-4 border-b-slate-300 dark:border-b-slate-700/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-0.5 active:translate-y-1 active:border-b-2'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* 3D Icon Container com profundidade física */}
        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border-2 border-emerald-100 dark:border-emerald-800/60 border-b-4 border-b-emerald-200 dark:border-b-emerald-800 group-hover:bg-emerald-100/80 dark:group-hover:bg-emerald-900/80 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-all">
          {Icon ? <Icon className="w-6 h-6 stroke-[2.2]" /> : null}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              {tag}
            </span>
            {badgeText && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs">
                {badgeText}
              </span>
            )}
          </div>

          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-800 dark:group-hover:text-emerald-400 transition-colors truncate">
            {title}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
            {description}
          </p>

          {/* Micro Progress Capsule se aplicável */}
          {progress !== null && (
            <div className="mt-2.5">
              <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                <span>Progresso</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500 relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute top-0.5 left-1 right-1 h-[2px] bg-white/40 rounded-full" />
                </div>
              </div>
            </div>
          )}

          {/* Sub-meta row */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {time && (
                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  {time}
                </span>
              )}
            </div>

            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors">
              <span>Acessar</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (onClick) {
    return content;
  }

  return (
    <Link to={to} className="block">
      {content}
    </Link>
  );
}
