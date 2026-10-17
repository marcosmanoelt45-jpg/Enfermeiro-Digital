import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Loader2, Library, Download, Shuffle, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import RiskBadge from "@/components/RiskBadge";
import { CASE_LIBRARY, generateRandomFullCase, buildAssessmentFromCase } from "@/lib/caseLibrary";
import NandaSearchBar from "@/components/NandaSearchBar";

const CATEGORY_STYLE = {
  Cardiologia: "bg-rose-50 text-rose-700 border-rose-200",
  Neurologia: "bg-violet-50 text-violet-700 border-violet-200",
  Infectologia: "bg-amber-50 text-amber-700 border-amber-200",
  Pneumologia: "bg-sky-50 text-sky-700 border-sky-200",
  Geriatria: "bg-teal-50 text-teal-700 border-teal-200",
  Cirurgia: "bg-slate-100 text-slate-700 border-slate-300",
  Endocrinologia: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Geral: "bg-slate-100 text-slate-600 border-slate-200"
};

export default function CaseLibrary() {
  const navigate = useNavigate();
  const [importing, setImporting] = useState(null);
  const [category, setCategory] = useState("Todos");

  const categories = ["Todos", ...Array.from(new Set(CASE_LIBRARY.map((c) => c.category)))];
  const filtered = category === "Todos" ? CASE_LIBRARY : CASE_LIBRARY.filter((c) => c.category === category);

  async function importCase(caseData) {
    setImporting(caseData.id);
    try {
      const patient = await base44.entities.Patient.create(caseData.patient);
      const assessment = buildAssessmentFromCase(caseData, patient.id, patient.name);
      await base44.entities.Assessment.create(assessment);
      navigate(`/patient/${patient.id}`);
    } finally {
      setImporting(null);
    }
  }

  async function importRandom() {
    setImporting("random");
    try {
      const caseData = generateRandomFullCase();
      const patient = await base44.entities.Patient.create(caseData.patient);
      const assessment = buildAssessmentFromCase(caseData, patient.id, patient.name);
      await base44.entities.Assessment.create(assessment);
      navigate(`/patient/${patient.id}`);
    } finally {
      setImporting(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      <header className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-xl text-slate-600 dark:text-slate-300">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white">
                <Library className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100 leading-none">Banco de Casos</h1>
                <p className="text-xs text-slate-400">Casos clínicos prontos para praticar</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4 space-y-4">
        <NandaSearchBar />

        <div className="rounded-2xl border border-teal-200 dark:border-teal-800/60 bg-teal-50/60 dark:bg-slate-900 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 dark:bg-slate-800 text-teal-700 dark:text-teal-400">
              <Shuffle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Gerar caso aleatório completo</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Cria um paciente simulado com histórico, anamnese prévia, sinais vitais e escalas calculadas automaticamente.
              </p>
            </div>
          </div>
          <Button onClick={importRandom} disabled={importing === "random"} className="mt-3 w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold">
            {importing === "random" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shuffle className="mr-2 h-4 w-4" />}
            Gerar e abrir caso
          </Button>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold border transition ${
                category === c
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.map((c) => (
            <div key={c.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{c.title}</p>
                    <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${CATEGORY_STYLE[c.category] || CATEGORY_STYLE.Geral}`}>{c.category}</span>
                    {c.difficulty && <RiskBadge status={c.difficulty} size="sm" />}
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{c.summary}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {c.patient.name} · {c.patient.age} anos · {c.patient.gender === "M" ? "Masculino" : c.patient.gender === "F" ? "Feminino" : "Outro"}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5">PA {c.vitals.pa_sistolica}/{c.vitals.pa_diastolica}</span>
                    <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5">FC {c.vitals.fc}</span>
                    <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5">Sat {c.vitals.sat}%</span>
                    <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5">Tax {c.vitals.tax}°C</span>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => importCase(c)}
                disabled={importing === c.id}
                variant="outline"
                className="mt-3 w-full rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 font-bold"
              >
                {importing === c.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Importar caso
              </Button>
            </div>
          ))}
        </div>
      </main>

      <footer className="mx-auto max-w-2xl px-4 py-4 text-center">
        <p className="text-[11px] text-slate-400 dark:text-slate-400">
          © 2026 Marcos Manoel Tavares Neumann — Criador e detentor dos direitos da plataforma Enfere
        </p>
      </footer>
    </div>
  );
}
