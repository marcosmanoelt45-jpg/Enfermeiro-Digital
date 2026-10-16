import React from 'react';
import { AlertTriangle, ShieldAlert, Lightbulb, Scale } from 'lucide-react';

export default function ProcedureSafetyAlerts({ safetyAlerts = [], cofenNorm = '' }) {
  if (!safetyAlerts.length && !cofenNorm) return null;

  return (
    <div className="space-y-3">
      {/* Respaldo Legal & COFEN */}
      {cofenNorm && (
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-950 dark:text-teal-200 shadow-2xs">
          <Scale className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold block text-teal-900 dark:text-teal-100">
              Legislação Profissional & Diretriz Ética
            </span>
            <p className="text-teal-800 dark:text-teal-300 mt-0.5 leading-relaxed">
              {cofenNorm}. Respeite sempre as competências privativas do Enfermeiro e as atribuições de delegação segura à equipe de enfermagem.
            </p>
          </div>
        </div>
      )}

      {/* Alertas de Iatrogenia e Cuidados de Ouro */}
      {safetyAlerts.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-colors">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 mb-3">
            <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            Pontos Críticos de Segurança · Onde os Estudantes Mais Erram
          </h4>

          <div className="space-y-2.5">
            {safetyAlerts.map((alert, idx) => {
              const isDanger = alert.type === 'danger';
              const isWarning = alert.type === 'warning';

              const boxClass = isDanger
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-950 dark:text-rose-200'
                : isWarning
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-950 dark:text-amber-200'
                : 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900 text-sky-950 dark:text-sky-200';

              const Icon = isDanger ? AlertTriangle : isWarning ? AlertTriangle : Lightbulb;
              const iconColor = isDanger ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-sky-600';

              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-3 rounded-xl border ${boxClass} text-xs`}
                >
                  <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${iconColor}`} />
                  <div>
                    <strong className="block font-bold">{alert.title}</strong>
                    <p className="mt-0.5 leading-relaxed opacity-90">{alert.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
