import React from 'react';
import { Sparkles } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { clinicalGamificationService } from '@/services/clinicalGamificationService';

export default function TeamActivityFeed({
  feedEvents = [],
  onUpdate,
  encouragementsSent = 0,
  encouragementsReceived = 0,
}) {
  function handleReact(eventId, reactionType, colleagueName) {
    clinicalGamificationService.reactToFeedEvent(eventId, reactionType);
    const reactionLabels = {
      highFive: 'Tocou aqui com 👏',
      energy: 'Mandou força ⚡ para',
      trophy: 'Parabenizou 🏆',
    };
    toast({
      title: 'Incentivo Enviado! (+10 XP)',
      description: `Você ${reactionLabels[reactionType] || 'apoiou'} ${colleagueName}.`,
    });
    if (onUpdate) onUpdate();
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Mural da Equipe · Feed de Conquistas
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Celebre marcos clínicos de colegas de turma e envie energia com 1 toque.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            {encouragementsSent} enviados
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            {encouragementsReceived} recebidos
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {feedEvents.map((evt) => {
          return (
            <div
              key={evt.id}
              className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/90 bg-slate-50/50 dark:bg-slate-850/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-snug">
                    <strong className="font-bold text-slate-900 dark:text-slate-100">
                      {evt.colleagueName}
                    </strong>{' '}
                    {evt.action}.
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {evt.detail}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                  {evt.timeAgo}
                </span>
              </div>

              {/* Botões de Reação em 1 Clique */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleReact(evt.id, 'highFive', evt.colleagueName)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all active:scale-95 ${
                    evt.myReaction === 'highFive'
                      ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-400 text-amber-900 dark:text-amber-200 font-bold'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-300'
                  }`}
                >
                  <span>👏 Tocar aqui</span>
                  <span className="text-[10px] opacity-80">({evt.reactions?.highFive || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleReact(evt.id, 'energy', evt.colleagueName)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all active:scale-95 ${
                    evt.myReaction === 'energy'
                      ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-400 text-amber-900 dark:text-amber-200 font-bold'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-300'
                  }`}
                >
                  <span>⚡ Força!</span>
                  <span className="text-[10px] opacity-80">({evt.reactions?.energy || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleReact(evt.id, 'trophy', evt.colleagueName)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all active:scale-95 ${
                    evt.myReaction === 'trophy'
                      ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-400 text-amber-900 dark:text-amber-200 font-bold'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-300'
                  }`}
                >
                  <span>🏆 Parabéns</span>
                  <span className="text-[10px] opacity-80">({evt.reactions?.trophy || 0})</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
