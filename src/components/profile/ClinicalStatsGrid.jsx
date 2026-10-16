import React from 'react';
import { Stethoscope, Target, Pill, Radio, Activity } from 'lucide-react';

export default function ClinicalStatsGrid({
  solvedCases = 0,
  accuracyRate = 0,
  safeDosagesCount = 0,
  sbarHandoffsCount = 0,
}) {
  const stats = [
    {
      id: 'cases',
      title: 'Casos Resolvidos',
      value: solvedCases,
      unit: 'simulações',
      icon: Stethoscope,
      color: 'from-emerald-500 to-teal-600',
      tag: 'COFEN 736/2024',
      description: 'Julgamento clínico e prescrições concluídas',
    },
    {
      id: 'accuracy',
      title: 'Acurácia Diagnóstica',
      value: `${accuracyRate}%`,
      unit: 'assertividade',
      icon: Target,
      color: 'from-blue-500 to-indigo-600',
      tag: 'NANDA-I & NOC',
      description: 'Precisão em diagnósticos e hipóteses prioritárias',
    },
    {
      id: 'dosages',
      title: 'Cálculos Seguros',
      value: safeDosagesCount,
      unit: 'dosagens',
      icon: Pill,
      color: 'from-amber-500 to-orange-600',
      tag: 'Zero Iatrogenia',
      description: 'Gotejamentos e diluições sem falha de dose',
    },
    {
      id: 'sbar',
      title: 'Plantões SBAR',
      value: sbarHandoffsCount,
      unit: 'passagens',
      icon: Radio,
      color: 'from-purple-500 to-fuchsia-600',
      tag: 'Comunicação Segura',
      description: 'Passagens de caso sem perda de informação crítica',
    },
  ];

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          Métricas Vitais de Desempenho
        </h4>
        <span className="text-[11px] text-slate-400 dark:text-slate-400">
          Dados acumulados de prática
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs transition-colors hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr ${s.color} text-white shadow-xs`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                  {s.tag}
                </span>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {s.value}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {s.unit}
                </span>
              </div>

              <p className="mt-0.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                {s.title}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                {s.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
