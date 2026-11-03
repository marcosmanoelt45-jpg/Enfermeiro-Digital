import React from "react";
import { Loader2 } from "lucide-react";

export default function StatusCard({ title, subtitle, detail }) {
  return (
    <div className="rounded-2xl border border-teal-900/60 bg-[#131F2E] p-8 text-center">
      <Loader2 className="mx-auto h-10 w-10 animate-spin text-teal-600" />
      <p className="mt-4 text-sm font-medium text-slate-100">{title || "Processando..."}</p>
      {subtitle && <p className="mt-1 text-xs text-[#9FB3C6]">{subtitle}</p>}
      {detail && (
        <div className="mt-5 rounded-xl border border-[#1F3045] bg-slate-800/80 p-4 text-left">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-300">Relato</p>
          <p className="max-h-32 overflow-y-auto text-sm text-slate-200">{detail}</p>
        </div>
      )}
    </div>
  );
}
