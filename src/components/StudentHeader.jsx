import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  BookOpen,
  Calculator,
  Stethoscope,
  Users,
  ShieldCheck,
  UserCircle,
  LogOut,
  Sparkles,
  LayoutGrid
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

export default function StudentHeader({ activeTab = "hub" }) {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const navLinks = [
    { id: "hub", label: "Hub do Aluno", path: "/", icon: LayoutGrid },
    { id: "casos", label: "Casos Clínicos", path: "/simulador-casos", icon: BookOpen },
    { id: "calculos", label: "Cálculo de Doses", path: "/laboratorio-calculos", icon: Calculator },
    { id: "sistemas", label: "Sistemas & Semiologia", path: "/sistemas-organicos", icon: Stethoscope },
    { id: "turmas", label: "Minhas Turmas", path: "/turmas", icon: Users },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo e Nome da Plataforma */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 text-left group transition"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-700 to-teal-500 text-white shadow-sm group-hover:scale-105 transition-transform">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base text-slate-900 tracking-tight">
                  Enfermeiro Digital
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 uppercase tracking-wider">
                  EdTech
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Simulação Clínica & Tutoria Socrática
              </p>
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
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-teal-50 text-teal-800 border border-teal-200 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-teal-600" : "text-slate-400"}`} />
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Ações do Usuário & LGPD */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/privacidade-lgpd")}
              className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-xl"
              title="Governança de Privacidade & LGPD"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>LGPD</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/conta")}
              className="rounded-xl border-slate-200 text-xs font-semibold flex items-center gap-1.5"
            >
              <UserCircle className="h-4 w-4 text-slate-500" />
              <span className="hidden sm:inline">Minha Conta</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout(true)}
              className="rounded-xl text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 flex items-center gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>

        {/* Barra de Navegação Mobile */}
        <div className="flex md:hidden items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 no-scrollbar">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => navigate(link.path)}
                className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-teal-600 text-white"
                    : "text-slate-600 bg-slate-100 hover:bg-slate-200"
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
