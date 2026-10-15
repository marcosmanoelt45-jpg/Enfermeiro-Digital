import React from "react";
import { ShieldAlert, Lock, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function DlpShieldModal({ open, onOpenChange, matches = [], onAnonymizeAndProceed, onCancel }) {
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-6 sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Alerta de Proteção de Dados (LGPD)
              </DialogTitle>
              <p className="text-xs text-slate-500">
                Lei nº 13.709/2018 & Código de Ética de Enfermagem (Res. COFEN 564/2017)
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-3 text-sm text-slate-600">
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5">
            <p className="font-semibold text-amber-900 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              Identificamos dados sensíveis reais no seu texto
            </p>
            <p className="mt-1 text-xs text-amber-800 leading-relaxed">
              O <strong>Enfermeiro Digital</strong> é um ambiente exclusivamente voltado à simulação e aprendizagem acadêmica. Por segurança e conformidade legal, nunca insira dados de pacientes reais de seus estágios ou hospitais.
            </p>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-700">Itens identificados pelo filtro:</p>
            <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
              {matches.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white border border-slate-100">
                  <span className="font-medium text-slate-700">{m.label}</span>
                  <code className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-mono">
                    {m.snippet}
                  </code>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Você pode <strong>anonimizar automaticamente</strong> esses termos para continuar seu estudo sem riscos de conformidade.
          </p>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="rounded-xl border-slate-300"
          >
            Editar meu texto
          </Button>
          <Button
            type="button"
            onClick={onAnonymizeAndProceed}
            className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2"
          >
            <Lock className="h-4 w-4" />
            Anonimizar e Prosseguir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
