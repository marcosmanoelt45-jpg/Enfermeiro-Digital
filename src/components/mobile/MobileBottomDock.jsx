import React from 'react';
import { Home, Stethoscope, Mic, Calculator, MoreHorizontal } from 'lucide-react';
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
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800/80 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)] px-3 py-1.5 pb-safe md:hidden transition-colors">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = isCurrentActive(item);
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-90 ${
                active
                  ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 font-medium'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-colors ${
                  active
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400'
                    : 'text-slate-400 dark:text-slate-400'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
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
          className="flex flex-col items-center justify-center py-1 px-3 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all duration-200 active:scale-90"
        >
          <div className="p-1 rounded-xl text-slate-400 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/70 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
            <MoreHorizontal className="w-5 h-5 stroke-[1.8]" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">
            Bolso
          </span>
        </button>
      </div>
    </nav>
  );
}
