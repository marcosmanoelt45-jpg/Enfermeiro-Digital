import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Calculator,
  Users,
  UserCircle,
  LogOut,
  PlusCircle,
  LayoutGrid,
  ArrowRightLeft,
  Sun,
  Moon,
  Video,
  Coins
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";

import GotiChatDrawer from "@/components/mascot/GotiChatDrawer";
import GotiStudyPointsModal from "@/components/mascot/GotiStudyPointsModal";
import ModuleBriefingModal from "@/components/navigation/ModuleBriefingModal";
import { clinicalGamificationService } from "@/services/clinicalGamificationService";

export default function StudentHeader({ activeTab = "hub", desktopOnly = false }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme, toggleTheme, triggerHaptic } = useTheme();

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
      <header className={`sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl transition-colors ${desktopOnly ? "hidden md:block" : ""}`}>
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
              <img
                src="/goti/goti-icone.jpg"
                alt="Enfere - Mascote Goti"
                className="h-11 w-11 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform border border-teal-500/20"
              />
              <div>
                <span className="font-black text-base text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                  Enfere
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block -mt-0.5 font-medium">
                  Simulação & Prática Clínica
                </span>
              </div>
            </button>

            {/* Navegação Principal Desktop */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = activeTab === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => handleNavClick(link)}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all tap-press ${
                      isActive
                        ? "bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-800 shadow-2xs"
                        : "text-slate-600 dark:text-slate-300 hover:text-teal-800 dark:hover:text-teal-400 hover:bg-slate-100/70 dark:hover:bg-slate-900"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-teal-600 dark:text-teal-400" : "text-slate-400"}`} />
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Ações do Usuário: Chat do Goti, Pontos de Estudo (PE), Tema e Perfil */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Botão de Chat com o Goti com Física 3D Tátil */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(20);
                  setIsGotiChatOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/80 border-2 border-teal-200 dark:border-teal-800 border-b-4 border-b-teal-300 dark:border-b-teal-900 text-teal-900 dark:text-teal-200 hover:bg-teal-100/90 dark:hover:bg-teal-900/90 text-xs font-extrabold transition-all active:translate-y-1 active:border-b-2 shadow-2xs cursor-pointer select-none"
                title="Conversar diretamente com o Goti"
              >
                <div className="relative flex items-center justify-center">
                  <img
                    src="/goti/goti-icone.jpg"
                    alt="Goti"
                    className="w-5 h-5 object-cover rounded-lg shadow-2xs"
                  />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <span className="hidden sm:inline">Goti</span>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-md bg-teal-200/80 dark:bg-teal-800/80 text-teal-950 dark:text-teal-100 font-black">
                  Chat
                </span>
              </button>

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

              {/* Alternador Rápido de Tema (Claro / Escuro) */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(25);
                  toggleTheme();
                }}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200/80 dark:border-slate-800 transition-all active:scale-95"
                title={theme === 'dark' ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
                aria-label="Alternar tema claro e escuro"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4 text-amber-400" />
                ) : (
                  <Moon className="h-4 w-4 text-slate-700" />
                )}
              </button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/conta")}
                className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-200 hover:border-teal-300 dark:hover:border-teal-700 hover:text-teal-800 dark:hover:text-teal-400 dark:bg-slate-900 h-9 px-2.5 sm:px-3"
              >
                <UserCircle className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <span className="hidden md:inline">Conta</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  logout(true);
                  navigate("/splash");
                }}
                className="rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1.5 h-9 px-2 sm:px-2.5"
                title="Sair da Plataforma"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Botão Flutuante do Goti IA (Canto Inferior Direito - com folga segura acima do dock móvel) */}
      <button
        onClick={() => {
          triggerHaptic(20);
          setIsGotiChatOpen(true);
        }}
        className="fixed bottom-28 sm:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2.5 p-2 sm:px-4 sm:py-2.5 rounded-full bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 text-white shadow-xl shadow-teal-900/30 border-2 border-white/20 active:scale-95 transition-all group hide-on-short-landscape"
        title="Dúvidas clínicas? Pergunte ao Goti"
      >
        <img
          src="/goti/goti-icone.jpg"
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
