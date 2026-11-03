import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, User } from "lucide-react";
import RiskBadge from "@/components/RiskBadge";

export default function PatientCard({ patient, latestRisk }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(`/patient/${patient.id}`)}
      className="w-full text-left rounded-2xl border border-[#1F3045] bg-[#131F2E] p-4 shadow-sm hover:border-[#20D5B5]/50 transition active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#20D5B5]/15 text-[#20D5B5]">
          <User className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-[#EAF2F8]">{patient.name}</p>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-[#9FB3C6]">
            {patient.age != null && <span>{patient.age} anos</span>}
            {patient.gender && <span>· {patient.gender === "M" ? "Masculino" : patient.gender === "F" ? "Feminino" : "Outro"}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {latestRisk && <RiskBadge status={latestRisk} size="sm" />}
          <ChevronRight className="h-4 w-4 text-[#8A9DB1]" />
        </div>
      </div>
    </button>
  );
}
