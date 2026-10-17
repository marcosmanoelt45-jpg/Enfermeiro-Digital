import React from 'react';
import { AlertOctagon, AlertTriangle, Lightbulb, Scale } from 'lucide-react';

export default function ProcedureSafetyAlerts({ safetyAlerts = [], cofenNorm = '' }) {
  if (!safetyAlerts.length && !cofenNorm) return null;

  return (
    <div className="space-y-4">
      {/* Bloco 'O Que NÃO Fazer' - Erros Críticos & Iatrogenias */}
      {safetyAlerts.length > 0 && (
        <div className="rounded-3xl border border-rose-200/90 dark:border-rose-900/60 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <span className="p-1.5 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400">
              <AlertOctagon className="h-4 w-4" />
            </span>
            <div>
              <h4 className="text-sm font-black text-rose-950 dark:text-rose-200 uppercase tracking-wider">
                O Que NÃO Fazer · Erros Críticos & Iatrogenias
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Práticas contraindicadas que colocam em risco a vida e a segurança do paciente.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {safetyAlerts.map((alert, idx) => {
              const isDanger = alert.type === 'danger';
              const isWarning = alert.type === 'warning';

              const boxClass = isDanger
                ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/70 text-rose-950 dark:text-rose-200'
                : isWarning
                ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-900/70 text-amber-950 dark:text-amber-200'
                : 'bg-sky-50/80 dark:bg-sky-950/30 border-sky-200/80 dark:border-sky-900/70 text-sky-950 dark:text-sky-200';

              const Icon = isDanger ? AlertOctagon : isWarning ? AlertTriangle : Lightbulb;
              const iconColor = isDanger ? 'text-rose-600 dark:text-rose-400' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-sky-600 dark:text-sky-400';

              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border ${boxClass} text-xs transition-all`}
                >
                  <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${iconColor}`} />
                  <div className="min-w-0 flex-1">
                    <strong className="block font-bold text-xs sm:text-[13px] leading-tight">
                      {alert.title}
                    </strong>
                    <p className="mt-1 leading-relaxed opacity-90 text-[11px] sm:text-xs">
                      {alert.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Respaldo Legal & COFEN */}
      {cofenNorm && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-950 dark:text-teal-200 shadow-2xs">
          <Scale className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold block text-teal-900 dark:text-teal-100">
              Legislação & Competência Ética do Enfermeiro
            </span>
            <p className="text-teal-800 dark:text-teal-300 mt-0.5 leading-relaxed">
              {cofenNorm}. Atue sempre embasado pelo Código de Ética dos Profissionais de Enfermagem e pela Lei do Exercício Profissional nº 7.498/86.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
