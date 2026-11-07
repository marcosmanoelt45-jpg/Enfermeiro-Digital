import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import MobileBottomDock from "@/components/mobile/MobileBottomDock";
import gotiLogoOficial from "@/assets/goti-icone-oficial.png";

// `showDock` (padrão: ligado) deixa as páginas sem o menu de baixo, como o PageShell com semDock.
export default function StudentFooter({ showDock = true }) {
  const navigate = useNavigate();

  return (
    <>
      <footer className={`mt-auto border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-950 pt-6 ${showDock ? "pb-24" : "pb-6"} md:py-6 text-slate-500 dark:text-slate-400 transition-colors`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <img
              src={gotiLogoOficial}
              alt="Goti"
              className="w-8 h-8 object-contain shrink-0 filter drop-shadow-sm"
            />
            <span className="font-bold text-slate-800 dark:text-slate-200">Enfere</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">Raciocínio Clínico & Simulação de Enfermagem</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate("/privacidade-lgpd")}
              className="hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center gap-1.5 transition-colors font-medium"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Ajuda, FAQ & LGPD</span>
            </button>
            <span className="text-slate-200 dark:text-slate-700">|</span>
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Criador & Detentor dos Direitos: <strong className="text-slate-700 dark:text-slate-200">Marcos Manoel Tavares Neumann</strong>
            </span>
          </div>
        </div>
      </footer>

      {/* Dock Inferior Móvel Estilo Orizon (Aparece em telas < md) */}
      {showDock && <MobileBottomDock />}
    </>
  );
}
