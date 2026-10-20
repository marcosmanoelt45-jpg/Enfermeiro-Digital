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
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 dark:from-emerald-950 dark:via-emerald-900 dark:to-slate-950 text-white p-5 shadow-lg shadow-emerald-950/20 dark:shadow-black/60 border-2 border-emerald-600/40 dark:border-emerald-700/50 border-b-4 border-b-emerald-950/70 dark:border-b-black transition-colors">
      {/* Decorative subtle background circles */}
      <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-emerald-600/30 dark:bg-emerald-500/10 blur-2xl pointer-events-none" />
      <div className="absolute right-4 bottom-2 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />

      {/* Top badges */}
      <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 dark:bg-emerald-900/50 text-emerald-100 dark:text-emerald-300 backdrop-blur-sm border border-white/15 dark:border-emerald-700/50 shadow-2xs">
          <Activity className="w-3.5 h-3.5 text-emerald-300 dark:text-emerald-400 stroke-[2.5]" />
          {badgeText}
        </span>
        <div className="flex items-center gap-2 text-emerald-200 dark:text-emerald-300 text-xs">
          <span className="flex items-center gap-1 font-semibold">
            <Clock className="w-3.5 h-3.5 stroke-[2.2]" /> {timeEstimate}
          </span>
        </div>
      </div>

      {/* Main Titles */}
      <div className="relative z-10 mb-4">
        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-emerald-100/90 dark:text-emerald-200/90 mt-1 font-medium">
          {subtitle}
        </p>
      </div>

      {/* Glossy Capsule Progress Bar com Reflexo Superior */}
      <div className="relative z-10 mb-5 bg-emerald-950/50 dark:bg-black/50 p-3.5 rounded-2xl border border-white/10 dark:border-slate-800 shadow-inner">
        <div className="flex justify-between items-center text-xs mb-2">
          <span className="text-emerald-100 dark:text-emerald-300 font-semibold">Progresso do Raciocínio Clínico</span>
          <span className="font-extrabold text-white text-sm">{progressPercent}%</span>
        </div>
        <div className="w-full h-3 bg-emerald-950/80 dark:bg-slate-900 rounded-full overflow-hidden relative shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-white dark:from-emerald-500 dark:via-teal-400 dark:to-emerald-300 rounded-full transition-all duration-500 ease-out relative"
            style={{ width: `${progressPercent}%` }}
          >
            {/* Brilho Glossy Superior */}
            <div className="absolute top-0.5 left-2 right-2 h-[2.5px] bg-white/60 rounded-full" />
          </div>
        </div>
      </div>

      {/* Bottom CTA Action Button com Física 3D */}
      <div className="relative z-10 flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-200/90 dark:text-emerald-300/80 font-semibold">
          <Award className="w-4 h-4 text-emerald-300 dark:text-emerald-400 stroke-[2.5]" />
          <span>{competencyTag}</span>
        </div>

        <Link
          to={actionTo}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-emerald-900 dark:bg-emerald-400 dark:text-slate-950 text-xs sm:text-sm font-extrabold border-b-4 border-emerald-200 dark:border-emerald-600 shadow-sm active:translate-y-1 active:border-b-0 transition-all select-none group"
        >
          <span>{actionText}</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5] transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
