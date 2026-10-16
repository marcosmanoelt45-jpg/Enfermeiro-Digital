import React from 'react';
import { Users2, Sparkles, Clock, CheckCircle } from 'lucide-react';

export default function FriendQuestCard({ quest }) {
  if (!quest) return null;

  const {
    title = 'Mãos Dadas no Plantão',
    description = 'Resolvam juntos 8 casos clínicos simulados nesta semana.',
    partnerName = 'Mariana Duarte',
    partnerAvatar,
    current = 5,
    target = 8,
    rewardXp = 150,
    rewardBadge = 'Sinergia Clínica',
    expiresInDays = 3,
  } = quest;

  const percent = Math.min(100, Math.round((current / target) * 100));
  const isCompleted = current >= target;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-200/80 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900 p-5 shadow-xs transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20">
            <Users2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              Missão em Dupla da Semana
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {title}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-800/60">
          <Clock className="h-3 w-3" />
          <span>{expiresInDays} dias</span>
        </div>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
        {description}
      </p>

      {/* Avatares dos Parceiros de Plantão */}
      <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-indigo-100 dark:border-indigo-950 mb-3.5">
        <div className="flex items-center gap-2">
          {/* Dupla de avatares sobrepostos */}
          <div className="flex -space-x-2 overflow-hidden">
            <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 bg-teal-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
              Você
            </div>
            <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 bg-purple-600 text-white overflow-hidden shadow-xs">
              {partnerAvatar ? (
                <img src={partnerAvatar} alt={partnerName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-bold">
                  {partnerName?.charAt(0)}
                </div>
              )}
            </div>
          </div>

          <div className="text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              Você & {partnerName}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              Plantão compartilhado
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-sm font-black text-indigo-700 dark:text-indigo-300">
            {current} / {target}
          </span>
          <span className="text-[10px] text-slate-400 block font-medium">casos concluídos</span>
        </div>
      </div>

      {/* Barra de Progresso Colaborativa */}
      <div className="space-y-1.5">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] pt-1">
          <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
            <Sparkles className="h-3 w-3" />
            <span>Recompensa: +{rewardXp} XP & Distintivo "{rewardBadge}"</span>
          </div>
          {isCompleted && (
            <span className="flex items-center gap-1 font-bold text-emerald-600">
              <CheckCircle className="h-3.5 w-3.5" /> Concluído!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
