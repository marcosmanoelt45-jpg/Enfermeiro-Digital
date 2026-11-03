import React from 'react';
import { Drawer } from 'vaul';
import {
  Sparkles,
  ShieldCheck,
  LogOut,
  FolderPlus,
  ChevronRight,
  Sliders,
  Video,
  PhoneCall,
  Stethoscope
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MobilePocketDrawer({
  isOpen,
  onOpenChange,
  currentUser,
  onLogout,
  onOpenOptions = () => {}
}) {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    onOpenChange(false);
    navigate(path);
  };

  const pocketTools = [
    {
      id: 'videochamada',
      title: 'Videochamada (Atendimento por voz)',
      subtitle: 'Simulação interativa com paciente por voz e condutas',
      icon: PhoneCall,
      path: '/videochamada',
      tag: 'NOVO'
    },
    {
      id: 'procedimentos',
      title: 'Videoteca de Procedimentos',
      subtitle: 'Punção venosa, sondagens, curativos e IA',
      icon: Video,
      path: '/procedimentos',
      tag: 'Skills Lab'
    },
    {
      id: 'studio',
      title: 'Montador de Casos Clínicos',
      subtitle: 'Escores Braden, CAM, CALOI e áudios clínicos',
      icon: FolderPlus,
      path: '/montar-caso',
      tag: 'Estúdio Clínico'
    },
    {
      id: 'ai-dashboard',
      title: 'Analytics & Goti IA',
      subtitle: 'Métricas de proficiência clínica e evolução no Enfere',
      icon: Sparkles,
      path: '/ai-dashboard',
      tag: 'Desempenho'
    }
  ];

  return (
    <Drawer.Root open={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 transition-opacity" />
        <Drawer.Content className="bg-[#131F2E] flex flex-col rounded-t-[32px] fixed bottom-0 left-0 right-0 max-h-[85vh] z-50 outline-none border-t border-[#1F3045] shadow-2xl transition-colors">
          {/* Top Grab Handle */}
          <div className="pt-3 pb-1 flex justify-center">
            <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
          </div>

          <div className="p-5 overflow-y-auto no-scrollbar">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#1F3045]">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-none">
                {currentUser?.email?.charAt(0)?.toUpperCase() || 'E'}
              </div>
              <div className="flex-1 min-w-0">
                <Drawer.Title className="text-base font-bold text-slate-100 truncate">
                  {currentUser?.full_name || currentUser?.name || 'Estudante de Enfermagem'}
                </Drawer.Title>
                <Drawer.Description className="text-xs text-[#9FB3C6] truncate flex items-center gap-1.5 mt-0.5">
                  <span className="font-semibold text-emerald-400">
                    Estudante de Enfermagem
                  </span>
                  <span>·</span>
                  <span>{currentUser?.email || 'Ambiente Educacional'}</span>
                </Drawer.Description>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-[#3DD68C] border border-emerald-800">
                Online
              </span>
            </div>

            {/* Atalho Rápido para Perfil & Estatísticas Clínicas */}
            <button
              onClick={() => handleNavigate('/conta')}
              className="w-full mb-2.5 flex items-center justify-between p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 hover:border-emerald-300 text-left group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-100">
                      Meu Perfil & Desempenho Clínico
                    </span>
                  </div>
                  <span className="text-[11px] text-[#9FB3C6] block">
                    Acompanhe casos resolvidos, precisão diagnóstica e métricas formativas
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Atalho Rápido para Ajustes & Opções de Tema */}
            <button
              onClick={() => {
                onOpenChange(false);
                onOpenOptions();
              }}
              className="w-full mb-5 flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-emerald-400 text-left group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-100 block">
                    Ajustes & Preferências
                  </span>
                  <span className="text-[11px] text-emerald-400 block">
                    Tamanho de Fonte, Vibração e Modo Plantão
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Quick Tools Section */}
            <div className="mb-5">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-emerald-400" /> Ferramentas de Bolso
              </h4>

              <div className="space-y-2">
                {pocketTools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleNavigate(tool.path)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 transition-all text-left group active:scale-[0.99]"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center border border-slate-700 group-hover:border-emerald-200 group-hover:bg-emerald-700 group-hover:text-white dark:group-hover:bg-emerald-600 dark:group-hover:text-white transition-all shadow-sm">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">
                            {tool.title}
                          </span>
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 bg-[#131F2E] text-emerald-400 border border-emerald-800 rounded-md">
                            {tool.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#9FB3C6] truncate mt-0.5">
                          {tool.subtitle}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#9FB3C6] group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Propriedade Intelectual & Autoria */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 mb-5">
              <div className="flex items-center gap-2 text-[#3DD68C] font-bold text-xs mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Propriedade Intelectual & Autoria</span>
              </div>
              <p className="text-[11px] text-emerald-300/80 leading-relaxed font-medium">
                Criado e desenvolvido por <strong>Marcos Manoel Tavares Neumann</strong>, autor e detentor exclusivo de todos os direitos autorais e patrimoniais do projeto.
              </p>
            </div>

            {/* Account & Logout */}
            <div className="pt-2 border-t border-[#1F3045] flex items-center justify-between">
              <div className="text-[11px] text-[#9FB3C6]">
                <span>© 2026 • Marcos Manoel Tavares Neumann</span>
              </div>

              {onLogout && (
                <button
                  onClick={() => {
                    onOpenChange(false);
                    onLogout();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair da conta</span>
                </button>
              )}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
