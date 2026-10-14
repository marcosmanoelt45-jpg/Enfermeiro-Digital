import React from "react";
import { useNavigate } from "react-router-dom";
import { Activity, ShieldCheck, HelpCircle, FileText } from "lucide-react";

export default function StudentFooter() {
  const navigate = useNavigate();

  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white py-6 text-slate-500">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-700 text-white">
            <Activity className="h-3.5 w-3.5" />
          </div>
          <span className="font-semibold text-slate-700">Enfermeiro Digital</span>
          <span className="text-slate-400">•</span>
          <span>Plataforma de Simulação & Educação Clínica</span>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate("/privacidade-lgpd")}
            className="hover:text-teal-700 flex items-center gap-1.5 transition-colors font-medium"
          >
            <ShieldCheck className="h-4 w-4 text-slate-400" />
            <span>Central de Ajuda, FAQ & LGPD</span>
          </button>
          <span className="text-slate-300">|</span>
          <span className="text-slate-400">Resolução COFEN nº 736/2024</span>
        </div>
      </div>
    </footer>
  );
}
