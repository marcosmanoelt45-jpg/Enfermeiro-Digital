import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, User } from "lucide-react";
import RiskBadge from "@/components/RiskBadge";

export default function PatientCard({ patient, latestRisk }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/patient/${patient.id}`)}
      className="w-full text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-md hover:border-teal-300 dark:hover:border-teal-600 transition active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
          <User className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-800 dark:text-slate-100">{patient.name}</p>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            {patient.age != null && <span>{patient.age} anos</span>}
            {patient.gender && <span>· {patient.gender === "M" ? "Masculino" : patient.gender === "F" ? "Feminino" : "Outro"}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {latestRisk && <RiskBadge status={latestRisk} size="sm" />}
          <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600" />
        </div>
      </div>
    </button>
  );
}
