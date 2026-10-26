import React, { useState } from 'react';
import {
  Home,
  ClipboardList,
  Calculator,
  Video,
  User,
  Activity,
  GraduationCap,
  FileText,
  ArrowRightLeft,
  Stethoscope,
  History,
  ChevronRight,
  X,
  Mic
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function MobileBottomDock() {
  const location = useLocation();
  const navigate = useNavigate();

  // Controle do Drawer/Bottom Sheet da aba "Casos" (Página 3 do PDF)
  const [isCasesDrawerOpen, setIsCasesDrawerOpen] = useState(false);

  // 5 Itens Oficiais da Bottom Navigation Bar (Páginas 2, 3, 4, 15, 19, 21 do PDF)
  const navItems = [
    {
      id: 'home',
      label: 'Início',
      icon: Home,
      path: '/',
      exact: true,
      onClick: () => {
        setIsCasesDrawerOpen(false);
        navigate('/');
      }
    },
    {
      id: 'cases',
      label: 'Casos',
      icon: ClipboardList,
      path: '/simulador-casos',
      onClick: () => setIsCasesDrawerOpen(true)
    },
    {
      id: 'calc',
      label: 'Doses',
      icon: Calculator,
      path: '/laboratorio-calculos',
      onClick: () => {
        setIsCasesDrawerOpen(false);
        navigate('/laboratorio-calculos');
      }
    },
    {
      id: 'procedures',
      label: 'Vídeos',
      icon: Video,
      path: '/procedimentos',
      onClick: () => {
        setIsCasesDrawerOpen(false);
        navigate('/procedimentos');
      }
    },
    {
      id: 'profile',
      label: 'Perfil',
      icon: User,
      path: '/conta',
      onClick: () => {
        setIsCasesDrawerOpen(false);
        navigate('/conta');
      }
    }
  ];

  const isCurrentActive = (item) => {
    if (item.id === 'cases' && isCasesDrawerOpen) return true;
    if (item.exact) {
      return location.pathname === item.path && !isCasesDrawerOpen;
    }
    return location.pathname.startsWith(item.path) && !isCasesDrawerOpen;
  };

  // Opções do Drawer da aba "Casos" (Conforme 01-casos.png e Especificação Oficial)
  const caseDrawerOptions = [
    {
      id: 'atendimento_voz',
      title: 'Atendimento por voz',
      badge: 'NOVO',
      subtitle: 'Paciente simulado fala com você · 5 questões',
      icon: Mic,
      action: () => {
        setIsCasesDrawerOpen(false);
        navigate('/videochamada');
      }
    },
    {
      id: 'continue',
      title: 'Continuar de onde parou',
      subtitle: 'Simulador · Idoso com Insuficiência Cardíaca Descompensada',
      icon: Activity,
      action: () => {
        setIsCasesDrawerOpen(false);
        navigate('/simulador-casos');
      }
    },
    {
      id: 'pe_simulator',
      title: 'Simulador de Casos Clínicos',
      subtitle: 'Processo de Enfermagem · 5 etapas',
      icon: GraduationCap,
      action: () => {
        setIsCasesDrawerOpen(false);
        navigate('/simulador-casos');
      }
    },
    {
      id: 'case_studio',
      title: 'Montar Caso',
      subtitle: '8 etapas · escores e voz',
      icon: FileText,
      action: () => {
        setIsCasesDrawerOpen(false);
        navigate('/montar-caso');
      }
    },
    {
      id: 'sbar_handoff',
      title: 'Passagem de Plantão SBAR',
      subtitle: 'Meta 2 da OMS · 3 modos',
      icon: ArrowRightLeft,
      action: () => {
        setIsCasesDrawerOpen(false);
        navigate('/passagem-plantao');
      }
    },
    {
      id: 'semiology',
      title: 'Semiologia por Sistemas',
      subtitle: 'Neuro, Resp, Cardio e Pele',
      icon: Stethoscope,
      action: () => {
        setIsCasesDrawerOpen(false);
        navigate('/simulador-casos?mode=semiology');
      }
    },
    {
      id: 'history',
      title: 'Histórico e rascunhos',
      subtitle: 'Casos, SBAR e cálculos',
      icon: History,
      action: () => {
        setIsCasesDrawerOpen(false);
        navigate('/simulador-casos?action=history');
      }
    }
  ];

  return (
    <>
      {/* Dock Inferior Fixa para Mobile (5 Abas 1:1 com as referências) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#0B131D]/95 dark:bg-[#0B131D]/95 backdrop-blur-xl border-t border-[#1F3045] shadow-[0_-4px_24px_rgba(0,0,0,0.6)] px-2 py-2 pb-[calc(10px+env(safe-area-inset-bottom,0px))] md:hidden transition-colors select-none">
        <div className="flex items-center justify-between max-w-md mx-auto gap-1">
          {navItems.map((item) => {
            const active = isCurrentActive(item);
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-120 active:scale-95 ${
                  active
                    ? 'text-[#20D5B5]'
                    : 'text-[#9FB3C6] hover:text-[#EAF2F8]'
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-all ${
                    active
                      ? 'border border-[#20D5B5] bg-[#20D5B5]/10 text-[#20D5B5] shadow-[0_0_12px_rgba(32,213,181,0.2)]'
                      : 'text-current'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
                </div>
                <span className={`text-[11px] mt-1 tracking-tight font-extrabold truncate max-w-[60px] ${
                  active ? 'text-[#20D5B5]' : 'text-[#9FB3C6]'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Drawer / Bottom Sheet da aba "Casos" (Página 3 do PDF) */}
      {isCasesDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop com desfoque */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsCasesDrawerOpen(false)}
          />

          {/* Painel que sobe do fundo */}
          <div className="relative z-10 w-full max-h-[85vh] bg-[#101923] border-t-2 border-[#1F3045] rounded-t-[32px] p-5 pb-[calc(24px+env(safe-area-inset-bottom,0px))] shadow-2xl overflow-y-auto animate-in slide-in-from-bottom duration-300">
            {/* Puxador superior */}
            <div className="w-12 h-1.5 bg-[#27394B] rounded-full mx-auto mb-4" />

            {/* Cabeçalho do Drawer */}
            <div className="flex items-center justify-between pb-3">
              <h2 className="text-xl font-black text-[#EAF2F8] tracking-tight">
                Casos
              </h2>
              <button
                type="button"
                onClick={() => setIsCasesDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-[#16222E] border border-[#27394B] text-[#9FB3C6] hover:text-white flex items-center justify-center transition-colors"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Lista dos 6 Itens da Página 3 do PDF */}
            <div className="space-y-2.5 mt-2">
              {caseDrawerOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={opt.action}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#16222E] border border-[#1F3045] text-left hover:border-[#20D5B5] active:translate-y-0.5 transition-all group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-2">
                      <div className="w-10 h-10 rounded-xl bg-[#20D5B5]/15 text-[#20D5B5] flex items-center justify-center shrink-0 border border-[#20D5B5]/20 group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5 stroke-[2.4]" />
                      </div>
                      <div className="min-w-0">
                        <strong className="block text-sm font-black text-[#EAF2F8] truncate group-hover:text-[#20D5B5] transition-colors flex items-center">
                          {opt.title}
                          {opt.badge && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-[#20D5B5]/20 text-[#20D5B5] ml-1.5 tracking-wider">
                              {opt.badge}
                            </span>
                          )}
                        </strong>
                        <span className="block text-xs font-semibold text-[#9FB3C6] truncate mt-0.5">
                          {opt.subtitle}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#52667A] group-hover:text-[#20D5B5] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
