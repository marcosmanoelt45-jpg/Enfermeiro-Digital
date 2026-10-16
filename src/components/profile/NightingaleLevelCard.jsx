import React from 'react';
import { Award, Zap } from 'lucide-react';
import { clinicalGamificationService } from '@/services/clinicalGamificationService';

export default function NightingaleLevelCard({ xp = 0 }) {
  const { current, next, progressPercent, xpToNext } = clinicalGamificationService.getLevelInfo(xp);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                Nível {current.level} · Patente Clínica
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {current.title}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 font-bold text-sm shadow-xs">
          <Zap className="h-4 w-4 fill-amber-500 text-amber-500" />
          <span>{xp} XP</span>
        </div>
      </div>

      <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
        {current.description}
      </p>

      {/* Barra de Progresso do Nível Nightingale */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
          <span className="text-slate-500 dark:text-slate-400">
            Progresso para o próximo nível
          </span>
          {next ? (
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              Faltam {xpToNext} XP para <strong className="font-bold">{next.title}</strong>
            </span>
          ) : (
            <span className="font-bold text-amber-600 dark:text-amber-400">
              Patente Máxima Atingida 🏆
            </span>
          )}
        </div>

        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
