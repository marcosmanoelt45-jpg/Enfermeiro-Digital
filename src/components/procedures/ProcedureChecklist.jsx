import React, { useState } from 'react';
import { CheckCircle2, Circle, PackageCheck, ListOrdered, Award, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { procedureService } from '@/services/procedureService';
import { soundEffects } from '@/services/soundEffectsService';
import { AnimatedProgress } from '@/components/ui/animated-progress';
import { celebrate } from '@/lib/celebrate';
import { vibrate } from '@/lib/motion';

export default function ProcedureChecklist({ procedure, onComplete }) {
  const [tab, setTab] = useState('steps'); // 'steps' | 'materials'
  const [materials, setMaterials] = useState(() => procedure.materials || []);
  const [steps, setSteps] = useState(() => procedure.steps || []);
  const [completed, setCompleted] = useState(false);

  const toggleMaterial = (id) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, checked: !m.checked } : m))
    );
  };

  const toggleStep = (id) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, checked: !s.checked } : s))
    );
  };

  const checkedMaterialsCount = materials.filter((m) => m.checked).length;
  const checkedStepsCount = steps.filter((s) => s.checked).length;
  const totalItems = materials.length + steps.length;
  const totalChecked = checkedMaterialsCount + checkedStepsCount;
  const percent = totalItems > 0 ? Math.round((totalChecked / totalItems) * 100) : 0;

  const handleFinishTraining = () => {
    const res = procedureService.completeProcedure();
    setCompleted(true);
    soundEffects.playCorrect();
    vibrate(20);
    celebrate({ count: 80, spread: 80, y: 0.6 });
    toast({
      title: '🎉 Treinamento Prático Concluído!',
      description: 'O Goti creditou +30 XP na sua carreira e manteve seu plantão em dia!',
    });
    if (onComplete) onComplete(res);
  };

  return (
    <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs transition-colors">
      {/* Cabeçalho do Checklist & Barra de Progresso */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5 uppercase tracking-wide">
            <PackageCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            O Que Fazer · Roteiro de Habilidade Prática
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Marque os passos da técnica asséptica e os materiais da bandeja durante o estudo.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-bold text-teal-700 dark:text-teal-400">
            {percent}% Concluído
          </span>
          <AnimatedProgress value={percent} tone={percent >= 100 ? "success" : "brand"} className="w-24 h-2.5" label="Progresso do roteiro" />
        </div>
      </div>

      {/* Seletor de Sub-Abas do Checklist */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
        <button
          type="button"
          onClick={() => setTab('steps')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all tap-press ${
            tab === 'steps'
              ? 'bg-white dark:bg-slate-900 text-teal-900 dark:text-teal-200 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <ListOrdered className="h-3.5 w-3.5 text-teal-600" />
          <span>Técnica Passo a Passo ({checkedStepsCount}/{steps.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('materials')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all tap-press ${
            tab === 'materials'
              ? 'bg-white dark:bg-slate-900 text-teal-900 dark:text-teal-200 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <PackageCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Materiais ({checkedMaterialsCount}/{materials.length})</span>
        </button>
      </div>

      {/* Conteúdo: Técnica Passo a Passo */}
      {tab === 'steps' && (
        <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
          {steps.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggleStep(s.id)}
              className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all tap-press ${
                s.checked
                  ? 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800'
                  : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {s.checked ? (
                  <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400 fill-teal-100 dark:fill-teal-950" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className={`text-xs font-bold block leading-snug ${s.checked ? 'text-teal-950 dark:text-teal-200 line-through' : 'text-slate-900 dark:text-slate-100'}`}>
                  Passo {s.stepNumber}: {s.title}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Conteúdo: Materiais da Bandeja */}
      {tab === 'materials' && (
        <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
          {materials.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => toggleMaterial(m.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all tap-press ${
                m.checked
                  ? 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800'
                  : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="shrink-0">
                {m.checked ? (
                  <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400 fill-teal-100 dark:fill-teal-950" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-400" />
                )}
              </div>
              <span className={`text-xs font-medium truncate ${m.checked ? 'text-teal-900 dark:text-teal-300 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                {m.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Botão de Conclusão do Treinamento & Ganho de XP */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span>Recompensa: <strong className="text-amber-700 dark:text-amber-400 font-bold">+30 XP</strong> com o Goti</span>
        </div>

        <Button
          type="button"
          onClick={handleFinishTraining}
          disabled={completed}
          variant={percent >= 100 ? 'success' : 'primary'}
          className="w-full sm:w-auto text-xs px-5"
        >
          {completed ? (
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-teal-600" /> Treinamento Concluído!
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Award className="h-4 w-4" /> Concluir Treinamento (+30 XP)
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
