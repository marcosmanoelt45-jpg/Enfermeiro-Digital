import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Calculator,
  UserCircle,
  LogOut,
  PlusCircle,
  LayoutGrid,
  ArrowRightLeft,
  Video,
  PhoneCall,
  Coins
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";

import GotiChatDrawer from "@/components/mascot/GotiChatDrawer";
import GotiStudyPointsModal from "@/components/mascot/GotiStudyPointsModal";
import ModuleBriefingModal from "@/components/navigation/ModuleBriefingModal";
import { clinicalGamificationService } from "@/services/clinicalGamificationService";
import gotiLogoOficial from "@/assets/goti-icone-oficial.png";

export default function StudentHeader({ activeTab = "hub", desktopOnly = false }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { triggerHaptic } = useTheme();

  // Estados dos Modais do Goti e Navegação
  const [briefingModuleId, setBriefingModuleId] = useState(null);
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [isGotiChatOpen, setIsGotiChatOpen] = useState(false);
  const [isStudyPointsOpen, setIsStudyPointsOpen] = useState(false);
  const [studyPoints, setStudyPoints] = useState(() => clinicalGamificationService.getStudyPoints());

  useEffect(() => {
    function handleStorage() {
      setStudyPoints(clinicalGamificationService.getStudyPoints());
    }
    function handleCustomOpen() {
      setIsGotiChatOpen(true);
    }
    window.addEventListener("storage", handleStorage);
    window.addEventListener("open-goti-chat", handleCustomOpen);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("open-goti-chat", handleCustomOpen);
    };
  }, []);

  const navLinks = [
    { id: "hub", label: "Início", path: "/", icon: LayoutGrid, hasBriefing: false },
    { id: "videochamada", label: "Videochamada", path: "/videochamada", icon: PhoneCall, hasBriefing: false, isNew: true },
    { id: "procedimentos", label: "Procedimentos", path: "/procedimentos", icon: Video, hasBriefing: false },
    { id: "montar", label: "Montar Caso", path: "/montar-caso", icon: PlusCircle, hasBriefing: true },
    { id: "casos", label: "Casos Clínicos", path: "/simulador-casos", icon: BookOpen, hasBriefing: true },
    { id: "sbar", label: "Plantão SBAR", path: "/passagem-plantao", icon: ArrowRightLeft, hasBriefing: true },
    { id: "calculos", label: "Cálculo de Doses", path: "/laboratorio-calculos", icon: Calculator, hasBriefing: true },
  ];

  function handleNavClick(link) {
    triggerHaptic(12);
    if (link.hasBriefing) {
      setBriefingModuleId(link.id);
      setIsBriefingOpen(true);
    } else {
      navigate(link.path);
    }
  }

  function handleBriefingAction(action, targetPath) {
    setIsBriefingOpen(false);
    triggerHaptic(20);
    const destination = action.query ? `${targetPath}${action.query}` : targetPath;
    navigate(destination);
  }

  return (
    <>
      <header className={`sticky top-0 z-30 border-b border-[#1F3045] bg-[#0B131D]/95 backdrop-blur-xl transition-colors ${desktopOnly ? "hidden md:block" : ""}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-3">
            {/* Logo Oficial com Ícone do Goti */}
            <button
              onClick={() => {
                triggerHaptic(15);
                navigate("/");
              }}
              className="flex items-center gap-3 text-left group transition tap-press shrink-0"
            >
              <div className="relative flex items-center justify-center shrink-0">
                <img
                  src={gotiLogoOficial}
                  alt="Enfere - Mascote Goti"
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain filter drop-shadow-[0_2px_12px_rgba(32,213,181,0.35)] group-hover:scale-110 transition-transform"
                />
              </div>
              <div>
                <span className="font-black text-xl text-[#20D5B5] tracking-tight flex items-center gap-1.5 leading-none">
                  Enfere
                </span>
                <span className="text-[11px] text-[#9FB3C6] block mt-1 font-bold tracking-tight">
                  Prática Clínica de Enfermagem
                </span>
              </div>
            </button>

            {/* Navegação Principal Desktop */}
            <nav className="hidden lg:flex items-center gap-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = activeTab === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => handleNavClick(link)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black transition-all relative ${
                      isActive
                        ? "bg-[#20D5B5]/10 text-[#20D5B5] border border-[#20D5B5]/30 shadow-[0_0_10px_rgba(32,213,181,0.2)]"
                        : "text-[#9FB3C6] hover:text-[#EAF2F8] hover:bg-[#16222E]"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-[#20D5B5]" : "text-[#52667A]"}`} />
                    <span>{link.label}</span>
                    {link.isNew && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[#20D5B5] text-[#0A1118] uppercase tracking-wider">
                        NOVO
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Ações do Usuário: Perfil e Logout */}
            <div className="flex items-center gap-2 shrink-0">

              {/* Saldo de Pontos de Estudo (PE) - Ocultado temporariamente conforme diretriz */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(20);
                  setIsStudyPointsOpen(true);
                }}
                className="hidden items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-xs font-black transition-all active:scale-95"
                title="Ver saldo de Pontos de Estudo (PE) e mérito clínico"
              >
                <Coins className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{studyPoints}</span>
                <span className="text-[10px] font-bold text-amber-700/80 dark:text-amber-400/80">PE</span>
              </button>



              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/conta")}
                className="rounded-xl border-[#27394B] text-xs font-bold flex items-center gap-1.5 text-[#EAF2F8] hover:border-[#20D5B5] hover:text-[#20D5B5] bg-[#16222E] h-9 px-3"
              >
                <UserCircle className="h-4 w-4 text-[#20D5B5]" />
                <span className="hidden md:inline">Conta</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  logout(true);
                  navigate("/splash");
                }}
                className="rounded-xl text-xs text-[#F0645F] hover:text-white hover:bg-[#F0645F]/20 flex items-center gap-1.5 h-9 px-2.5"
                title="Sair da Plataforma"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Botão Flutuante do Goti IA no Desktop */}
      <button
        onClick={() => {
          triggerHaptic(20);
          setIsGotiChatOpen(true);
        }}
        className="hidden md:flex fixed bottom-6 right-6 z-40 items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#16222E] border-2 border-[#20D5B5]/40 hover:border-[#20D5B5] text-white shadow-xl shadow-black/50 active:scale-95 transition-all group"
        title="Dúvidas clínicas? Pergunte ao Goti"
      >
        <img
          src={gotiLogoOficial}
          alt="Goti IA"
          className="w-8 h-8 rounded-full object-cover filter drop-shadow-xs group-hover:scale-110 transition-transform"
        />
        <div className="hidden sm:block text-left">
          <span className="text-xs font-black block leading-none">Goti IA</span>
          <span className="text-[10px] text-teal-100 block font-medium">Tirar Dúvida Clínica</span>
        </div>
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
        </span>
      </button>

      {/* Modal Intersticial de Briefing Pedagógico nas 6 Abas */}
      <ModuleBriefingModal
        isOpen={isBriefingOpen}
        moduleId={briefingModuleId}
        onClose={() => setIsBriefingOpen(false)}
        onSelectAction={handleBriefingAction}
      />

      {/* Gaveta / Modal de Chat com o Goti */}
      <GotiChatDrawer
        isOpen={isGotiChatOpen}
        onClose={() => setIsGotiChatOpen(false)}
      />

      {/* Modal de Saldo e Gastos de Pontos de Estudo (PE) */}
      <GotiStudyPointsModal
        isOpen={isStudyPointsOpen}
        onClose={() => {
          setIsStudyPointsOpen(false);
          setStudyPoints(clinicalGamificationService.getStudyPoints());
        }}
      />
    </>
  );
}
