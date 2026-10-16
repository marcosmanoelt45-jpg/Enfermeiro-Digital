import React, { useState } from 'react';
import { Flame, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LampiMascot from './LampiMascot';

export default function MascotBanner({ userName = 'Aluno', streak = 3, xp = 480 }) {
  const navigate = useNavigate();
  const [lampiMood, setLampiMood] = useState('happy');

  const tips = [
    'Lembre-se: Na SVD, o cuff é insuflado estritamente com água destilada!',
    'Mantenha a ofensiva viva hoje com 1 caso rápido ou cálculo de dose!',
    'Na técnica em Z, a pele é tracionada lateralmente para vedar o trajeto!',
    'Acurácia diagnóstica: Sempre correlacione características definidoras NANDA-I!',
  ];

  const randomTip = tips[(userName.length || 0) % tips.length];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-200/90 dark:border-emerald-900/60 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-amber-500/10 dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-amber-950/20 p-4 sm:p-5 shadow-xs transition-all">
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        {/* Mascote Lampi Animado */}
        <div className="shrink-0 flex items-center justify-center">
          <LampiMascot size={96} state={lampiMood} interactive={true} />
        </div>

        {/* Mensagem e Status do Mascote */}
        <div className="flex-1 text-center sm:text-left min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold mb-1.5 border border-emerald-200 dark:border-emerald-800">
            <Sparkles className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <span>Lampi · Seu Companheiro de Plantão</span>
          </div>

          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 leading-tight">
            Olá, {userName}! Pronto para iluminar seu raciocínio clínico?
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            💡 <strong>Dica do Lampi:</strong> {randomTip}
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/15 dark:bg-amber-400/10 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-300/60 dark:border-amber-700/60">
              <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              <span>{streak} {streak === 1 ? 'dia' : 'dias'} de ofensiva</span>
            </div>

            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/15 dark:bg-emerald-400/10 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300/60 dark:border-emerald-700/60">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{xp} XP</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setLampiMood((prev) => (prev === 'happy' ? 'streak' : 'happy'));
                navigate('/conta');
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline ml-1"
            >
              <span>Ver Estatísticas & Comunidade</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
