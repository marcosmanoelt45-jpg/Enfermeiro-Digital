import React, { useState } from 'react';
import { Users, Flame, UserPlus, Check, Search } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { clinicalGamificationService } from '@/services/clinicalGamificationService';

export default function ColleaguesList({ colleagues = [], onUpdate }) {
  const [search, setSearch] = useState('');

  function handleToggleFollow(colleague) {
    clinicalGamificationService.toggleFollowColleague(colleague.id);
    toast({
      title: colleague.following ? 'Deixou de seguir' : 'Seguindo colega!',
      description: colleague.following
        ? `Você não verá mais as atividades de ${colleague.name} no mural.`
        : `Agora você receberá as conquistas clínicas de ${colleague.name}!`,
    });
    if (onUpdate) onUpdate();
  }

  const filtered = colleagues.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.role.toLowerCase().includes(search.toLowerCase()) ||
      c.levelTitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Colegas de Plantão & Turma
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Conecte-se com estudantes e preceptores para estudos cooperativos.
          </p>
        </div>

        {/* Busca rápida */}
        <div className="relative min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar colega..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">Nenhum colega encontrado com esse nome.</p>
        ) : (
          filtered.map((c) => {
            return (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800/90 bg-slate-50/50 dark:bg-slate-850/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-teal-600 text-white">
                    {c.avatar ? (
                      <img src={c.avatar} alt={c.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-bold text-xs">
                        {c.initials || c.name.charAt(0)}
                      </div>
                    )}
                    {c.isOnline && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                        {c.name}
                      </p>
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800 shrink-0">
                        Nv {c.level}
                      </span>
                    </div>

                    <p className="truncate text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {c.role} · {c.levelTitle}
                    </p>

                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-bold">
                        <Flame className="h-3 w-3 fill-amber-500 text-amber-500" />
                        {c.streak} dias
                      </span>
                      <span>·</span>
                      <span className="font-semibold text-slate-600 dark:text-slate-300">{c.xp} XP</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleFollow(c)}
                  className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
                    c.following
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                      : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-xs'
                  }`}
                >
                  {c.following ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Seguindo</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Seguir</span>
                    </>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
