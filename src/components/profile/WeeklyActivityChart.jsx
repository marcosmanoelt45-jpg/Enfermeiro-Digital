import React from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import { clinicalGamificationService } from '@/services/clinicalGamificationService';

export default function WeeklyActivityChart({ weeklyDays = [] }) {
  const safeDays = Array.isArray(weeklyDays) && weeklyDays.length === 7
    ? weeklyDays
    : clinicalGamificationService.getPast7Days({}, false);

  const maxXp = Math.max(100, ...safeDays.map((d) => Number(d.xp) || 0));
  const totalWeeklyXp = safeDays.reduce((acc, d) => acc + (Number(d.xp) || 0), 0);
  const activeDaysCount = safeDays.filter((d) => d.completed || (Number(d.xp) || 0) > 0).length;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-colors">
      <div className="flex items-center justify-between mb-4 gap-2">
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Dedicação Semanal de Estudo
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Total acumulado nos últimos 7 dias:{' '}
            <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">{totalWeeklyXp} PE</strong>
          </p>
        </div>

        <div
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
            activeDaysCount > 0
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          <span>{activeDaysCount}/7 dias</span>
        </div>
      </div>

      {/* Gráfico de Barras com escala proporcional */}
      <div className="flex items-end justify-between gap-2 h-36 pt-4 pb-2 px-1">
        {safeDays.map((item, idx) => {
          const xpVal = Number(item.xp) || 0;
          const heightPercent = xpVal > 0 ? Math.max(14, Math.round((xpVal / maxXp) * 100)) : 6;
          return (
            <div key={item.date || idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
              <span
                className={`text-[10px] font-bold transition-opacity ${
                  xpVal > 0
                    ? 'text-emerald-600 dark:text-emerald-400 opacity-100'
                    : 'text-slate-400 dark:text-slate-500 opacity-75'
                }`}
              >
                {xpVal}
              </span>

              <div className="w-full flex justify-center items-end h-full">
                <div
                  className={`w-full max-w-[32px] rounded-t-lg transition-all duration-300 ${
                    item.isToday && xpVal > 0
                      ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-md shadow-emerald-500/20'
                      : xpVal > 0 || item.completed
                      ? 'bg-emerald-400 dark:bg-emerald-600 group-hover:bg-emerald-500'
                      : item.isToday
                      ? 'bg-teal-900/40 border border-teal-500/40'
                      : 'bg-slate-100 dark:bg-slate-800/80'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
              </div>

              <div className="text-center">
                <span
                  className={`text-[10px] font-bold block ${
                    item.isToday
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {item.dayShort}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
