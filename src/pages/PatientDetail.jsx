import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, ChevronRight, ClipboardList, Activity, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import RiskBadge from "@/components/RiskBadge";
import DiagnosesTab from "@/components/DiagnosesTab";
import MedicationsTab from "@/components/MedicationsTab";
import EvolutionsTab from "@/components/EvolutionsTab";
import DischargeTab from "@/components/DischargeTab";
import PatientProfileTab from "@/components/PatientProfileTab";
import PreviousAnamnesisTab from "@/components/PreviousAnamnesisTab";

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("avaliacoes");

  async function load() {
    setLoading(true);
    try {
      const [p, all] = await Promise.all([
        base44.entities.Patient.get(id),
        base44.entities.Assessment.filter({ patient_id: id }, "-created_date", 100)
      ]);
      setPatient(p);
      setAssessments(all);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div>;
  if (!patient) return <div className="py-20 text-center text-slate-400">Paciente não encontrado</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-slate-800">{patient.name}</h1>
              <p className="text-xs text-slate-400">
                {[patient.age != null && `${patient.age} anos`, patient.gender === "M" ? "Masculino" : patient.gender === "F" ? "Feminino" : patient.gender === "Outro" ? "Outro" : null].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4 space-y-4">
        <div className="flex gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1">
          {[
            { key: "perfil", label: "Perfil" },
            { key: "anamnese", label: "Anamnese" },
            { key: "avaliacoes", label: "Avaliações" },
            { key: "diagnosticos", label: "Diagnósticos" },
            { key: "medicamentos", label: "Medicamentos" },
            { key: "evolucao", label: "Evolução" },
            { key: "alta", label: "Plano de Alta" }
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition ${tab === t.key ? "bg-white text-teal-700 shadow-sm" : "text-slate-500"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "avaliacoes" && (
          <>
            <Button onClick={() => navigate(`/patient/${id}/assessment`)} className="w-full rounded-2xl bg-teal-600 py-6 text-base hover:bg-teal-700">
              <ClipboardList className="mr-2 h-5 w-5" /> Iniciar Avaliação Express
            </Button>

            <Button onClick={() => navigate(`/patient/${id}/audio-assessment`)} variant="outline" className="w-full rounded-2xl border-teal-300 py-5 text-base text-teal-700 hover:bg-teal-50">
              <Mic className="mr-2 h-5 w-5" /> Avaliação por Áudio
            </Button>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Avaliações</p>
              {assessments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
                  Nenhuma avaliação registrada.
                </div>
              ) : (
                <div className="space-y-2">
                  {assessments.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => navigate(`/assessment/${a.id}/ai`)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm hover:border-teal-300 transition"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                        <Activity className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800">
                          PA {a.pa_sistolica}/{a.pa_diastolica} · FC {a.fc} · Sat {a.sat}%
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(a.created_date).toLocaleString("pt-BR")}
                        </p>
                      </div>
                      <RiskBadge status={a.risk_status} size="sm" />
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {tab === "diagnosticos" && <DiagnosesTab patientId={id} />}

        {tab === "perfil" && <PatientProfileTab patient={patient} onSaved={load} />}

        {tab === "anamnese" && <PreviousAnamnesisTab patient={patient} onSaved={load} />}

        {tab === "medicamentos" && <MedicationsTab patientId={id} />}

        {tab === "evolucao" && <EvolutionsTab patientId={id} />}

        {tab === "alta" && <DischargeTab patientId={id} />}
      </main>

      <footer className="mx-auto max-w-2xl px-4 py-4 text-center">
        <p className="text-[11px] text-slate-400">Criado por Marcos Manoel Tavares Neumann</p>
      </footer>
    </div>
  );
}
