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
  badgeText = ''
}) {
  return (
    <Link
      to={to}
      className={`group block p-4 bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 active:scale-[0.98] ${
        featured
          ? 'border-emerald-200 dark:border-emerald-800/80 shadow-sm shadow-emerald-100/50 dark:shadow-none hover:border-emerald-400 dark:hover:border-emerald-500'
          : 'border-slate-100 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none hover:border-emerald-200 dark:hover:border-slate-700 hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Soft Green Icon Container */}
        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-100/60 dark:border-emerald-800/60 group-hover:bg-emerald-100/80 dark:group-hover:bg-emerald-900/80 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors">
          {Icon ? <Icon className="w-6 h-6 stroke-[2.2]" /> : null}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              {tag}
            </span>
            {badgeText && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/60">
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

          {/* Sub-meta row */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50 dark:border-slate-800/80">
            <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-400 font-medium">
              {time && (
                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  {time}
                </span>
              )}
              {progress !== null && (
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {progress}% concluído
                </span>
              )}
            </div>

            <div className="flex items-center text-xs font-bold text-emerald-700 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
              <span className="mr-0.5">Acessar</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
