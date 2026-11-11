import React, { useEffect, useState } from 'react';
import { AnimatePresence, m as motion, useDragControls } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { scrimVariants, sheetVariants, spring, vibrate } from '@/lib/motion';
import { itensDoDock, opcoesDaGavetaPratica } from '@/features/navegacao/modulos';
import { icone } from '@/features/navegacao/icones';
import { useAuth } from '@/lib/AuthContext';
import { clinicalHistoryService } from '@/services/clinicalHistoryService';

export default function MobileBottomDock() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Gaveta da aba "Menu". Uma opção com `escolhas` (o Plantão) abre uma segunda tela com as duas maneiras de fazer.
  const [isCasesDrawerOpen, setIsCasesDrawerOpen] = useState(false);
  const [escolhaAberta, setEscolhaAberta] = useState(null);
  // Arraste só pelo puxador, para não brigar com a rolagem da lista
  const sheetDrag = useDragControls();

  // 5 Itens Oficiais da Bottom Navigation Bar (Páginas 2, 3, 4, 15, 19, 21 do PDF)
  // As abas vêm do registro único de módulos. A aba marcada como gaveta abre a folha em vez de navegar.
  const navItems = itensDoDock().map((m) => ({
    id: m.id,
    label: m.rotulo,
    icon: icone(m.icone),
    path: m.rota,
    exact: m.exato,
    gaveta: m.gaveta,
    onClick: m.gaveta
      ? () => setIsCasesDrawerOpen(true)
      : () => {
          setIsCasesDrawerOpen(false);
          navigate(m.rota);
        }
  }));

  const isCurrentActive = (item) => {
    if (item.gaveta && isCasesDrawerOpen) return true;
    if (item.exact) {
      return location.pathname === item.path && !isCasesDrawerOpen;
    }
    return location.pathname.startsWith(item.path) && !isCasesDrawerOpen;
  };

  // Fecha a folha com Esc (teclado / leitores de tela)
  useEffect(() => {
    if (!isCasesDrawerOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (escolhaAberta) setEscolhaAberta(null);
        else setIsCasesDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isCasesDrawerOpen, escolhaAberta]);

  // Fechou a gaveta: volta para a lista da próxima vez.
  useEffect(() => {
    if (!isCasesDrawerOpen) setEscolhaAberta(null);
  }, [isCasesDrawerOpen]);

  // Opções do Drawer da aba "Prática" (Conforme 01-casos.png e Especificação Oficial)
  const irPara = (rota) => {
    setIsCasesDrawerOpen(false);
    navigate(rota);
  };
  const caseDrawerOptions = opcoesDaGavetaPratica().map((o) => ({
    id: o.id,
    title: o.titulo,
    subtitle: o.subtitulo,
    icon: icone(o.icone),
    escolhas: o.escolhas?.map((e) => ({ id: e.id, title: e.titulo, subtitle: e.subtitulo, icon: icone(e.icone), action: () => irPara(e.rota) })),
    action: o.escolhas
      ? () => setEscolhaAberta(o.id)
      : o.id === 'continue'
      ? () => {
          // Continua a atividade em andamento mais recente, de qualquer módulo (não só caso clínico).
          const ultima = clinicalHistoryService.getLatestInProgressActivity(user?.id);
          irPara(ultima ? clinicalHistoryService.rotaDeRetomada(ultima.moduleType) : o.rota);
        }
      : () => irPara(o.rota)
  }));
  const escolha = caseDrawerOptions.find((o) => o.id === escolhaAberta) ?? null;
  const opcoesVisiveis = escolha ? escolha.escolhas : caseDrawerOptions;

  return (
    <>
      {/* Dock Inferior Fixa para Mobile (5 Abas 1:1 com as referências) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#0B131D] border-t border-[#1F3045] px-2 py-2 pb-[calc(10px+env(safe-area-inset-bottom,0px))] md:hidden transition-colors select-none">
        <div className="flex items-center justify-between max-w-md mx-auto gap-1">
          {navItems.map((item) => {
            const active = isCurrentActive(item);
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  vibrate(8);
                  item.onClick();
                }}
                aria-current={active ? 'page' : undefined}
                className={`relative flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl min-h-[52px] tap-press ${
                  active ? 'text-[#20D5B5]' : 'text-[#9FB3C6] hover:text-[#EAF2F8]'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="dock-active-pill"
                    className="absolute inset-x-1.5 top-0.5 bottom-0.5 rounded-2xl bg-[#20D5B5]/10 border border-[#20D5B5]/50"
                    transition={spring.glide}
                  />
                )}
                <motion.span
                  className="relative p-1"
                  animate={active ? { y: [0, -3, 0], scale: [1, 1.12, 1] } : { y: 0, scale: 1 }}
                  transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
                >
                  <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
                </motion.span>
                <span className={`relative text-[11px] tracking-tight font-extrabold truncate max-w-[60px] ${
                  active ? 'text-[#20D5B5]' : 'text-[#9FB3C6]'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Drawer / Bottom Sheet da aba "Prática" (Página 3 do PDF) */}
      <AnimatePresence>
      {isCasesDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop com desfoque */}
          <motion.div
            className="fixed inset-0 bg-black/75"
            variants={scrimVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={() => setIsCasesDrawerOpen(false)}
          />

          {/* Painel que sobe do fundo; arrastar para baixo fecha */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            variants={sheetVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            drag="y"
            dragListener={false}
            dragControls={sheetDrag}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) setIsCasesDrawerOpen(false);
            }}
            className="relative z-10 w-full max-h-[85vh] bg-[#101923] border-t-2 border-[#1F3045] rounded-t-[32px] p-5 pb-[calc(24px+env(safe-area-inset-bottom,0px))] overflow-y-auto"
          >
            {/* Puxador superior */}
            <div
              className="-mt-2 mb-2 flex justify-center py-2 cursor-grab active:cursor-grabbing touch-none"
              onPointerDown={(e) => sheetDrag.start(e)}
            >
              <div className="w-12 h-1.5 bg-[#27394B] rounded-full" />
            </div>

            {/* Cabeçalho do Drawer */}
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2 min-w-0">
                {escolha && (
                  <button
                    type="button"
                    onClick={() => setEscolhaAberta(null)}
                    className="w-8 h-8 rounded-full bg-[#16222E] border border-[#27394B] text-[#9FB3C6] hover:text-white flex items-center justify-center transition-colors shrink-0"
                    aria-label="Voltar ao menu"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                <h2 className="text-xl font-black text-[#EAF2F8] tracking-tight truncate">
                  {escolha ? escolha.title : "Menu"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCasesDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-[#16222E] border border-[#27394B] text-[#9FB3C6] hover:text-white flex items-center justify-center transition-colors"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {escolha && <p className="text-sm font-semibold text-[#9FB3C6] pb-1">Como você quer fazer o plantão?</p>}
            <div className="space-y-2.5 mt-2">
              {opcoesVisiveis.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={opt.action}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#16222E] border border-[#1F3045] text-left card-press group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-2">
                      <div className="w-10 h-10 rounded-xl bg-[#16222E] border border-[#27394B] text-[#20D5B5] flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 stroke-[2.4]" />
                      </div>
                      <div className="min-w-0">
                        <strong className="block text-sm font-black text-[#EAF2F8] truncate group-hover:text-[#20D5B5] transition-colors">
                          {opt.title}
                        </strong>
                        <span className="block text-xs font-semibold text-[#9FB3C6] mt-0.5">
                          {opt.subtitle}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#8A9DB1] group-hover:text-[#20D5B5] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </>
  );
}
