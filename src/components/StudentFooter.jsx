import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import MobileBottomDock from "@/components/mobile/MobileBottomDock";
import MobilePocketDrawer from "@/components/mobile/MobilePocketDrawer";
import gotiLogoOficial from "@/assets/goti-icone-oficial.png";

export default function StudentFooter({ onOpenOptions }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isPocketDrawerOpen, setIsPocketDrawerOpen] = useState(false);

  return (
    <>
      <footer className="mt-auto border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-950 pt-6 pb-24 md:py-6 text-slate-500 dark:text-slate-400 transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <img
              src={gotiLogoOficial}
              alt="Goti"
              className="w-8 h-8 object-contain shrink-0 filter drop-shadow-xs"
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
      <MobileBottomDock
        onOpenPocketMenu={() => setIsPocketDrawerOpen(true)}
      />

      {/* Bottom Sheet Deslizante Vaul para Ferramentas de Bolso */}
      <MobilePocketDrawer
        isOpen={isPocketDrawerOpen}
        onOpenChange={setIsPocketDrawerOpen}
        currentUser={user}
        onLogout={logout}
        onOpenOptions={onOpenOptions}
      />
    </>
  );
}
