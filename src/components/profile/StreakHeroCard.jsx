import React, { useState } from 'react';
import { Flame, Snowflake, Check, Sparkles } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { clinicalGamificationService } from '@/services/clinicalGamificationService';

export default function StreakHeroCard({ streakData, onUpdate }) {
  const [freezing, setFreezing] = useState(false);

  const {
    streak = 3,
    bestStreak = 12,
    streakFreezeAvailable = 1,
    weeklyDays = [],
  } = streakData || {};

  function handleUseFreeze() {
    if (streakFreezeAvailable <= 0) {
      toast({
        title: 'Sem congelamentos disponíveis',
        description: 'Você recebe 1 congelamento de plantão a cada semana de prática ativa.',
        variant: 'destructive',
      });
      return;
    }

    setFreezing(true);
    const res = clinicalGamificationService.useStreakFreeze();
    if (res.success) {
      toast({
        title: '❄️ Congelamento de Plantão Ativado!',
        description: 'Sua ofensiva está protegida caso você entre em escala de plantão corrido hoje.',
      });
      if (onUpdate) onUpdate();
    } else {
      toast({
        title: 'Aviso',
        description: res.reason,
      });
    }
    setFreezing(false);
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 dark:border-amber-900/50 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent dark:from-amber-950/40 dark:via-orange-950/20 dark:to-slate-900 p-5 shadow-xs transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Lado Esquerdo: Fogo & Contador da Ofensiva */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/25 animate-pulse">
            <Flame className="h-8 w-8 fill-white stroke-none" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                {streak} {streak === 1 ? 'dia' : 'dias'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 dark:bg-amber-400/10 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/50">
                <Sparkles className="h-3 w-3" /> Ofensiva Clínica
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Praticando raciocínio clínico diário. Recorde pessoal:{' '}
              <strong className="text-amber-800 dark:text-amber-300 font-semibold">{bestStreak} dias</strong>.
            </p>
          </div>
        </div>

        {/* Lado Direito: Botão de Congelamento de Plantão */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleUseFreeze}
            disabled={freezing || streakFreezeAvailable <= 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              streakFreezeAvailable > 0
                ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60'
                : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed'
            }`}
            title="Protege a ofensiva em dias de plantão hospitalar de 24h ou 36h"
          >
            <Snowflake className="h-3.5 w-3.5 text-sky-500" />
            <span>Plantão Seguro ({streakFreezeAvailable})</span>
          </button>
        </div>
      </div>

      {/* Mini-Calendário Semanal (7 dias) */}
      <div className="mt-5 pt-4 border-t border-amber-200/50 dark:border-amber-900/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900/80 dark:text-amber-300/80">
            Frequência desta semana
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Complete ao menos 1 caso ou cálculo por dia
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {weeklyDays.map((d, idx) => {
            return (
              <div
                key={idx}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                  d.completed
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs dark:bg-amber-600'
                    : d.isToday
                    ? 'bg-white dark:bg-slate-800 border-amber-400 dark:border-amber-500 text-slate-800 dark:text-slate-100 ring-2 ring-amber-400/30'
                    : 'bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-400'
                }`}
              >
                <span className={`text-[10px] font-bold uppercase ${d.completed ? 'text-amber-100' : 'text-slate-500 dark:text-slate-400'}`}>
                  {d.dayShort}
                </span>
                <div className="mt-1 flex h-5 w-5 items-center justify-center">
                  {d.completed ? (
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
