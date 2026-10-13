import React from "react";
import { Loader2 } from "lucide-react";

export default function StatusCard({ title, subtitle, detail }) {
  return (
    <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-8 text-center">
      <Loader2 className="mx-auto h-10 w-10 animate-spin text-teal-600" />
      <p className="mt-4 text-sm font-medium text-slate-700">{title || "Processando..."}</p>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
      {detail && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 text-left">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Relato</p>
          <p className="max-h-32 overflow-y-auto text-sm text-slate-600">{detail}</p>
        </div>
      )}
    </div>
  );
}
