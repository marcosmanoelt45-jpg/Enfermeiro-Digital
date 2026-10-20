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
    <div className="relative overflow-hidden rounded-3xl border-2 border-amber-300/80 dark:border-amber-900/60 border-b-4 border-b-amber-400 dark:border-b-amber-950 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent dark:from-amber-950/40 dark:via-orange-950/20 dark:to-slate-900 p-5 sm:p-6 shadow-sm transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Lado Esquerdo: Fogo & Contador da Ofensiva Clínica (#FF9600) */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#FF9600] to-amber-400 text-white shadow-md border-2 border-amber-200 border-b-4 border-b-[#CC7900] select-none">
            <Flame className="h-8 w-8 fill-white stroke-none drop-shadow-xs animate-flame-subtle" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                {streak} {streak === 1 ? 'dia' : 'dias'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FF9600]/15 dark:bg-[#FF9600]/20 px-2.5 py-0.5 text-xs font-extrabold text-[#d97706] dark:text-amber-400 border border-amber-300/80 dark:border-amber-700/60 shadow-2xs">
                <Sparkles className="h-3.5 w-3.5 stroke-[2.5]" /> Ofensiva Clínica
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
              Praticando raciocínio clínico diário. Recorde pessoal:{' '}
              <strong className="text-amber-900 dark:text-amber-300 font-extrabold">{bestStreak} dias</strong>.
            </p>
          </div>
        </div>

        {/* Lado Direito: Botão 3D de Congelamento de Plantão */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleUseFreeze}
            disabled={freezing || streakFreezeAvailable <= 0}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border-2 transition-all select-none ${
              streakFreezeAvailable > 0
                ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800 border-b-4 border-b-sky-400 dark:border-b-sky-900 text-sky-800 dark:text-sky-300 hover:bg-sky-100 active:translate-y-1 active:border-b-2 shadow-xs cursor-pointer'
                : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed opacity-70'
            }`}
            title="Protege a ofensiva em dias de plantão hospitalar de 24h ou 36h"
          >
            <Snowflake className="h-4 w-4 text-sky-500 stroke-[2.5]" />
            <span>Plantão Seguro ({streakFreezeAvailable})</span>
          </button>
        </div>
      </div>

      {/* Mini-Calendário Semanal (7 dias) com Botões Táteis 3D */}
      <div className="mt-5 pt-4 border-t border-amber-200/60 dark:border-amber-900/50">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-950 dark:text-amber-300">
            Frequência desta semana
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Complete ao menos 1 caso por dia
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
          {weeklyDays.map((d, idx) => {
            return (
              <div
                key={idx}
                className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 text-center transition-all select-none ${
                  d.completed
                    ? 'bg-[#FF9600] text-white border-amber-400 border-b-4 border-b-[#CC7900] shadow-xs active:translate-y-0.5'
                    : d.isToday
                    ? 'bg-white dark:bg-slate-800 border-amber-400 dark:border-amber-500 border-b-4 border-b-amber-500 dark:border-b-amber-600 text-slate-800 dark:text-slate-100 ring-2 ring-amber-400/30'
                    : 'bg-white/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 border-b-4 border-b-slate-300 dark:border-b-slate-900 text-slate-400 dark:text-slate-500'
                }`}
              >
                <span className={`text-[10px] font-black uppercase ${d.completed ? 'text-amber-100' : 'text-slate-600 dark:text-slate-400'}`}>
                  {d.dayShort}
                </span>
                <div className="mt-1 flex h-5 w-5 items-center justify-center">
                  {d.completed ? (
                    <Check className="h-4 w-4 stroke-[3.5] text-white" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700" />
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
