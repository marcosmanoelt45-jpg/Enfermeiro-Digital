import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, ExternalLink, Pill, Stethoscope, Activity, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SOURCES } from "@/lib/sources";
import { DRUGS_COM_BASE } from "@/lib/medicationCatalog";

const GROUPS = [
  {
    title: "Taxonomias de Enfermagem (Diagnósticos, Intervenções e Resultados)",
    icon: Stethoscope,
    items: [SOURCES.nanda, SOURCES.nic, SOURCES.noc]
  },
  {
    title: "Escalas de Risco",
    icon: Activity,
    items: [SOURCES.braden, SOURCES.glasgow, SOURCES.cam, SOURCES.sak, SOURCES.audit, SOURCES.caloi]
  },
  {
    title: "Fonte de Medicamentos",
    icon: Pill,
    items: [{ label: "Drugs.com", url: DRUGS_COM_BASE }]
  },
  {
    title: "Dicionário e Terminologia",
    icon: BookOpen,
    items: [SOURCES.dicionario]
  }
];

export default function References() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0E1722] text-slate-100 transition-colors">
      <header className="sticky top-0 z-10 border-b border-[#1F3045] bg-slate-900/90 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-xl text-slate-300">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-100 leading-none">Referências</h1>
                <p className="text-xs text-[#9FB3C6]">Fontes dos diagnósticos, escalas e medicamentos</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4 space-y-4">
        <div className="rounded-2xl border border-teal-800/60 bg-[#131F2E] p-3">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
            <p className="text-xs text-slate-300">
              Consulte sempre as fontes oficiais para confirmar diagnósticos, intervenções e dosagens. Os links abrem diretamente a fonte de referência.
            </p>
          </div>
        </div>

        {GROUPS.map((g) => {
          const Icon = g.icon;
          return (
            <div key={g.title} className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-300">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold text-slate-100">{g.title}</p>
              </div>
              <div className="space-y-2">
                {g.items.filter((s) => s && s.url).map((s) => (
                  <a
                    key={s.label}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-xl border border-slate-700 px-3 py-2.5 transition hover:border-teal-600 hover:bg-slate-800 text-slate-200"
                  >
                    <span className="text-sm font-medium">{s.label}</span>
                    <ExternalLink className="h-4 w-4 text-teal-400" />
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </main>

      <footer className="mx-auto max-w-2xl px-4 py-4 text-center">
        <p className="text-[11px] text-[#9FB3C6]">
          © 2026 Marcos Manoel Tavares Neumann — Criador e detentor dos direitos da plataforma Enfere
        </p>
      </footer>
    </div>
  );
}
