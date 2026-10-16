import React from 'react';
import { Trophy, Clock, ChevronUp, Flame } from 'lucide-react';

export default function WeeklyLeagueCard({ leaderboard = [] }) {
  return (
    <div className="rounded-2xl border border-amber-200/80 dark:border-amber-900/50 bg-white dark:bg-slate-900 p-5 shadow-xs transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
              <Trophy className="h-4 w-4" />
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Liga Semanal · Divisão Anna Nery
            </h4>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Os 3 primeiros colocados sobem para a prestigiosa <strong className="text-amber-700 dark:text-amber-400">Liga Diamante Nightingale</strong>!
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 self-start sm:self-auto border border-slate-200/60 dark:border-slate-700/60">
          <Clock className="h-3.5 w-3.5 text-amber-600" />
          <span>Faltam 2 dias p/ fechar</span>
        </div>
      </div>

      {/* Lista da Tabela de Classificação da Liga */}
      <div className="space-y-1.5">
        {leaderboard.map((item) => {
          const isTop3 = item.rank <= 3;
          return (
            <div
              key={item.rank}
              className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                item.isMe
                  ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 font-bold ring-2 ring-emerald-500/20'
                  : 'bg-slate-50/50 dark:bg-slate-850/40 border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                    item.rank === 1
                      ? 'bg-amber-400 text-amber-950 shadow-xs'
                      : item.rank === 2
                      ? 'bg-slate-300 text-slate-900'
                      : item.rank === 3
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-400 dark:text-slate-400'
                  }`}
                >
                  {item.rank}
                </span>

                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-teal-600 text-white">
                  {item.avatar ? (
                    <img src={item.avatar} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-bold text-xs">
                      {item.name?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={`truncate text-xs font-bold ${item.isMe ? 'text-emerald-950 dark:text-emerald-200' : 'text-slate-800 dark:text-slate-200'}`}>
                      {item.name} {item.isMe && '(Você)'}
                    </p>
                    {isTop3 && (
                      <span className="flex items-center text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        <ChevronUp className="h-3 w-3" /> Sobe
                      </span>
                    )}
                  </div>

                  {item.streak > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                      <Flame className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                      <span>{item.streak} dias</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className={`text-xs font-black block ${item.isMe ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'}`}>
                  {item.xp} XP
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">
                  nesta semana
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
