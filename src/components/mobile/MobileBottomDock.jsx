import React from 'react';
import { Home, Stethoscope, Video, Mic, Calculator, MoreHorizontal } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function MobileBottomDock({ onOpenPocketMenu }) {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      id: 'home',
      label: 'Início',
      icon: Home,
      path: '/',
      exact: true
    },
    {
      id: 'procedures',
      label: 'POPs',
      icon: Video,
      path: '/procedimentos'
    },
    {
      id: 'cases',
      label: 'Casos',
      icon: Stethoscope,
      path: '/simulador-casos'
    },
    {
      id: 'sbar',
      label: 'Plantão',
      icon: Mic,
      path: '/passagem-plantao'
    },
    {
      id: 'calc',
      label: 'Doses',
      icon: Calculator,
      path: '/laboratorio-calculos'
    }
  ];

  const isCurrentActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.5)] px-2 py-1.5 pb-safe md:hidden transition-colors">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = isCurrentActive(item);
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-200 tap-press ${
                active
                  ? 'text-teal-700 dark:text-teal-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  active
                    ? 'bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-400 shadow-2xs'
                    : 'text-slate-400 dark:text-slate-400'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${active ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Botão de Ferramentas / Bolso (Abre o Bottom Sheet Vaul) */}
        <button
          onClick={onOpenPocketMenu}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-400 transition-all duration-200 tap-press"
        >
          <div className="p-1 rounded-xl text-slate-400 dark:text-slate-400 hover:bg-teal-50 dark:hover:bg-teal-950/70 hover:text-teal-700 dark:hover:text-teal-400 transition-colors">
            <MoreHorizontal className="w-4.5 h-4.5 stroke-[1.8]" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">
            Bolso
          </span>
        </button>
      </div>
    </nav>
  );
}
