import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  BookOpen,
  Calculator,
  Stethoscope,
  Users,
  HelpCircle,
  UserCircle,
  LogOut,
  PlusCircle,
  LayoutGrid,
  ArrowRightLeft,
  Sun,
  Moon,
  Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";

export default function StudentHeader({ activeTab = "hub" }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme, toggleTheme, triggerHaptic } = useTheme();

  const navLinks = [
    { id: "hub", label: "Início", path: "/", icon: LayoutGrid },
    { id: "procedimentos", label: "Procedimentos", path: "/procedimentos", icon: Video },
    { id: "montar", label: "Montar Caso", path: "/montar-caso", icon: PlusCircle },
    { id: "casos", label: "Casos Clínicos", path: "/simulador-casos", icon: BookOpen },
    { id: "sbar", label: "Plantão SBAR", path: "/passagem-plantao", icon: ArrowRightLeft },
    { id: "calculos", label: "Cálculo de Doses", path: "/laboratorio-calculos", icon: Calculator },
    { id: "sistemas", label: "Semiologia", path: "/sistemas-organicos", icon: Stethoscope },
    { id: "turmas", label: "Minhas Turmas", path: "/turmas", icon: Users },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo e Nome da Plataforma Enfermeiro Digital */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 text-left group transition"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-700 dark:bg-emerald-600 text-white shadow-sm shadow-emerald-200 dark:shadow-none group-hover:bg-emerald-800 transition-colors">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-base text-slate-900 dark:text-white tracking-tight block">
                Enfermeiro Digital
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block -mt-0.5 font-medium">
                Simulação & Prática Clínica
              </span>
            </div>
          </button>

          {/* Navegação Principal Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => navigate(link.path)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-100 dark:border-emerald-800"
                      : "text-slate-600 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-emerald-700 dark:text-emerald-400" : "text-slate-400"}`} />
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Ações do Usuário & FAQ / Ajuda */}
          <div className="flex items-center gap-2">
            {/* Alternador Rápido de Tema (Claro / Escuro) */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic(25);
                toggleTheme();
              }}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200/80 dark:border-slate-800 transition-all active:scale-95"
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
              variant="ghost"
              size="sm"
              onClick={() => navigate("/privacidade-lgpd")}
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-slate-900 rounded-xl"
              title="Central de Ajuda, FAQ & Governança LGPD"
            >
              <HelpCircle className="h-4 w-4 text-slate-400" />
              <span>Ajuda & FAQ</span>
            </Button>


            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/conta")}
              className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-200 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-800 dark:hover:text-emerald-400 dark:bg-slate-900"
            >
              <UserCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Minha Conta</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout(true)}
              className="rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>

        {/* Barra de Navegação Mobile (Chips Deslizáveis Verdes & Brancos) */}
        <div className="flex md:hidden items-center gap-1.5 overflow-x-auto py-2.5 border-t border-slate-100 dark:border-slate-800/80 no-scrollbar">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => navigate(link.path)}
                className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-emerald-700 dark:bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-200 hover:text-emerald-700 dark:hover:text-emerald-400"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {link.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
