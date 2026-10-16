import React from 'react';
import { ArrowRight, Activity, Award, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HeroCourseCard({
  title = 'Processo de Enfermagem Completo',
  subtitle = '5 Etapas COFEN 736/2024 • Caso Clínico Ativo',
  progressPercent = 60,
  actionText = 'Continuar Prática',
  actionTo = '/simulador-casos',
  timeEstimate = '15 min',
  competencyTag = 'Competência COFEN 736/2024',
  badgeText = 'Em Andamento'
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 dark:from-emerald-950 dark:via-emerald-900 dark:to-slate-950 text-white p-5 shadow-lg shadow-emerald-900/15 dark:shadow-black/50 border border-emerald-600/30 dark:border-emerald-700/40 transition-colors">
      {/* Decorative subtle background circles */}
      <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-emerald-600/30 dark:bg-emerald-500/10 blur-2xl pointer-events-none" />
      <div className="absolute right-4 bottom-2 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />

      {/* Top badges */}
      <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/15 dark:bg-emerald-900/50 text-emerald-100 dark:text-emerald-300 backdrop-blur-sm border border-white/10 dark:border-emerald-700/50">
          <Activity className="w-3.5 h-3.5 text-emerald-300 dark:text-emerald-400" />
          {badgeText}
        </span>
        <div className="flex items-center gap-2 text-emerald-200 dark:text-emerald-300 text-xs">
          <span className="flex items-center gap-1 font-medium">
            <Clock className="w-3.5 h-3.5" /> {timeEstimate}
          </span>
        </div>
      </div>

      {/* Main Titles */}
      <div className="relative z-10 mb-4">
        <h2 className="text-xl font-bold text-white tracking-tight leading-snug">
          {title}
        </h2>
        <p className="text-xs text-emerald-100/80 dark:text-emerald-200/80 mt-1 font-medium">
          {subtitle}
        </p>
      </div>

      {/* Linear Clean Progress Bar */}
      <div className="relative z-10 mb-4 bg-emerald-950/40 dark:bg-black/40 p-3 rounded-2xl border border-white/10 dark:border-slate-800">
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="text-emerald-100 dark:text-emerald-300 font-medium">Progresso do Raciocínio</span>
          <span className="font-bold text-white">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 bg-emerald-900/80 dark:bg-slate-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-white dark:bg-emerald-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Bottom CTA Action Button */}
      <div className="relative z-10 flex items-center justify-between pt-1">
        <div className="flex items-center gap-1 text-[11px] text-emerald-200/90 dark:text-emerald-300/80 font-medium">
          <Award className="w-3.5 h-3.5 text-emerald-300 dark:text-emerald-400" />
          <span>{competencyTag}</span>
        </div>

        <Link
          to={actionTo}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white dark:bg-emerald-500 text-emerald-800 dark:text-slate-950 text-xs font-bold shadow-md hover:bg-emerald-50 dark:hover:bg-emerald-400 active:scale-95 transition-all group"
        >
          <span>{actionText}</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
