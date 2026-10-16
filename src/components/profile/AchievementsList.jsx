import React from 'react';
import { Award, Pill, Stethoscope, Flame, Radio, Users } from 'lucide-react';

const ICON_MAP = {
  Pill,
  Stethoscope,
  Flame,
  Radio,
  Users,
};

export default function AchievementsList({ achievements = [] }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="h-4 w-4 text-amber-500" />
            Distintivos & Conquistas de Honra
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Evolua cada distintivo de Bronze até Ouro conforme sua prática clínica.
          </p>
        </div>
      </div>

      <div className="space-y-3.5">
        {achievements.map((ach) => {
          const Icon = ICON_MAP[ach.icon] || Award;
          const currentVal = ach.current || 0;
          const tiersList = Array.isArray(ach.tiers) ? ach.tiers : [];
          const nextTier = tiersList.find((t) => t.level > (ach.completedLevel || 0)) || tiersList[tiersList.length - 1];
          const targetVal = nextTier?.target || ach.target || 10;
          const percent = Math.min(100, Math.round((currentVal / targetVal) * 100));

          const tierColor =
            ach.completedLevel >= 3
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-700'
              : ach.completedLevel === 2
              ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
              : ach.completedLevel === 1
              ? 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200 border-amber-200 dark:border-amber-800'
              : 'bg-slate-100 text-slate-400 dark:bg-slate-800/80 dark:text-slate-400 border-slate-200 dark:border-slate-800';

          const tierLabel =
            ach.completedLevel >= 3
              ? 'Ouro'
              : ach.completedLevel === 2
              ? 'Prata'
              : ach.completedLevel === 1
              ? 'Bronze'
              : 'Bloqueado';

          return (
            <div
              key={ach.id}
              className="flex items-start gap-3.5 p-3 rounded-xl border border-slate-100 dark:border-slate-800/90 bg-slate-50/50 dark:bg-slate-850/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <div className="relative shrink-0 mt-0.5">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${tierColor} shadow-xs`}>
                  <Icon className="h-5 w-5" />
                </div>
                {ach.completedLevel > 0 && (
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white text-[9px] font-bold">
                    ✓
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {ach.title}
                    </h5>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${tierColor}`}>
                      {tierLabel}
                    </span>
                  </div>

                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 shrink-0">
                    {currentVal} / {targetVal} {ach.unit}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {ach.description}
                </p>

                {/* Barra de progresso */}
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
