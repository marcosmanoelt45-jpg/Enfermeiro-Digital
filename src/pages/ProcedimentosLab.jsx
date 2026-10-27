import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Play,
  ArrowLeft,
  Video,
} from 'lucide-react';
import StudentHeader from '@/components/StudentHeader';
import StudentFooter from '@/components/StudentFooter';
import { useTheme } from '@/lib/ThemeContext';
import { procedureService } from '@/services/procedureService';

// Componentes modulares
import EnfereClinicalPlayer from '@/components/procedures/EnfereClinicalPlayer';
import ProcedureChecklist from '@/components/procedures/ProcedureChecklist';
import ProcedureSafetyAlerts from '@/components/procedures/ProcedureSafetyAlerts';
import ProcedureAIChat from '@/components/procedures/ProcedureAIChat';
import MobileBottomDock from '@/components/mobile/MobileBottomDock';

export default function ProcedimentosLab() {
  const { triggerHaptic } = useTheme();

  const [procedures, setProcedures] = useState(() => procedureService.list());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProcedure, setActiveProcedure] = useState(null);

  const categoriesRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    startXRef.current = e.pageX - (categoriesRef.current?.offsetLeft || 0);
    scrollLeftRef.current = categoriesRef.current?.scrollLeft || 0;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !categoriesRef.current) return;
    e.preventDefault();
    const x = e.pageX - (categoriesRef.current.offsetLeft || 0);
    const walk = (x - startXRef.current) * 1.5;
    categoriesRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };
  const [watchedIds, setWatchedIds] = useState(() => procedureService.getWatchedList());

  const refreshList = () => {
    const list = procedureService.list();
    setProcedures(list);
    setWatchedIds(procedureService.getWatchedList());
    if (activeProcedure) {
      const fresh = list.find((p) => p.id === activeProcedure.id);
      if (fresh) setActiveProcedure(fresh);
    }
  };

  useEffect(() => {
    refreshList();
  }, []);

  const categories = [
    { id: 'all', label: 'Todos os Procedimentos' },
    { id: 'watched', label: '✓ Já Assistidos' },
    { id: 'unwatched', label: 'Pendentes' },
    { id: 'urgencia', label: 'Urgência & Emergência' },
    { id: 'eliminacoes', label: 'Cateterismos & Eliminações' },
    { id: 'vasculares', label: 'Acessos Vasculares' },
    { id: 'medicamentos', label: 'Terapia Medicamentosa' },
    { id: 'respiratorio', label: 'Vias Aéreas & Ventilação' },
    { id: 'curativos', label: 'Curativos & Lesões' },
  ];

  const filtered = useMemo(() => {
    return procedures.filter((p) => {
      const matchesSearch =
        !searchQuery.trim() ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesCategory = true;
      if (selectedCategory === 'watched') {
        matchesCategory = watchedIds.includes(p.id);
      } else if (selectedCategory === 'unwatched') {
        matchesCategory = !watchedIds.includes(p.id);
      } else if (selectedCategory !== 'all') {
        matchesCategory = p.category === selectedCategory;
      }

      return matchesSearch && matchesCategory;
    });
  }, [procedures, selectedCategory, searchQuery, watchedIds]);

  const handleOpenProcedure = (proc) => {
    triggerHaptic(25);
    procedureService.markWatched(proc.id);
    setWatchedIds(procedureService.getWatchedList());
    setActiveProcedure(proc);
  };

  const handleToggleWatched = (e, procId) => {
    e.stopPropagation();
    triggerHaptic(20);
    procedureService.toggleWatched(procId);
    setWatchedIds(procedureService.getWatchedList());
  };

  return (
    <div className="min-h-screen bg-[#0B131D] text-[#EAF2F8] pb-28 md:pb-8 flex flex-col">
      <div className="hidden md:block">
        <StudentHeader activeTab="procedimentos" />
      </div>

      <main className="flex-1 mx-auto max-w-xl md:max-w-4xl w-full px-4 sm:px-6 py-4 space-y-5">
        {/* Se estiver visualizando um procedimento ativo (Modo Treinamento - Página 20 do PDF) */}
        {activeProcedure ? (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Barra superior de navegação de volta */}
            <div className="pt-1 pb-1">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(20);
                  setActiveProcedure(null);
                }}
                className="inline-flex items-center gap-2 text-xs font-bold text-white hover:text-[#20D5B5] transition"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar ao catálogo
              </button>
            </div>

            {/* Player de Vídeo Clínico */}
            <div className="rounded-3xl overflow-hidden border border-[#1F3045] bg-[#0E1722] shadow-lg">
              <EnfereClinicalPlayer
                videoUrl={activeProcedure.videoUrl}
                title={activeProcedure.title}
                sourceName={activeProcedure.videoSource}
                sourceUrl={activeProcedure.sourceUrl || activeProcedure.officialGuideUrl}
                institutionalBadge={activeProcedure.institutionalBadge}
                cofenNorm={activeProcedure.cofenNorm}
                steps={activeProcedure.steps}
                previewImage={activeProcedure.previewImage}
                duration={activeProcedure.duration}
                onComplete={() => refreshList()}
              />
            </div>

            {/* Informações Institucionais do POP (Página 20 do PDF) */}
            <div className="space-y-1">
              {activeProcedure.institutionalBadge && (
                <span className="text-[10px] font-black uppercase text-[#20D5B5] tracking-wider block">
                  {activeProcedure.institutionalBadge}
                </span>
              )}
              <h1 className="text-base sm:text-lg font-black text-white leading-tight">
                {activeProcedure.title}
              </h1>
              <p className="text-xs text-[#9FB3C6]">
                Produção acadêmica: {activeProcedure.videoSource || "Hospital Israelita Albert Einstein"} · Dr. Rafael Rafaini Lloret
              </p>
            </div>

            {/* Roteiro de Habilidade Prática & Checklist */}
            <div className="space-y-4">
              <ProcedureChecklist
                procedure={activeProcedure}
                onComplete={() => refreshList()}
              />
              <ProcedureSafetyAlerts
                safetyAlerts={activeProcedure.safetyAlerts}
                cofenNorm={activeProcedure.cofenNorm}
              />
              <ProcedureAIChat procedure={activeProcedure} />
            </div>

            {/* Recompensa e Botão 3D Tátil "Concluir treinamento" (Página 20 do PDF) */}
            <div className="pt-2 space-y-3">
              <div className="text-center text-xs font-black text-[#FFC247]">
                Recompensa: +30 com o Goti
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(30);
                  procedureService.markWatched(activeProcedure.id);
                  refreshList();
                  setActiveProcedure(null);
                }}
                className="w-full py-4 rounded-2xl bg-[#20D5B5] hover:bg-[#1AD1B0] text-[#0B131D] font-black shadow-[0_4px_0_0_#148A76] active:translate-y-1 active:shadow-none text-center text-sm transition-all cursor-pointer"
              >
                Concluir treinamento
              </button>
            </div>
          </div>
        ) : (
          /* Modo Catálogo & Lista de Procedimentos (Página 19 do PDF) */
          <div className="space-y-5">
            {/* Cabeçalho da Videoteca 1:1 com Página 19 do PDF */}
            <div className="space-y-1.5 pt-1">
              <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#20D5B5]/15 text-[#20D5B5] border border-[#20D5B5]/30">
                Skills Lab
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Videoteca de Procedimentos & POPs
              </h1>
              <p className="text-xs text-[#9FB3C6] leading-relaxed max-w-2xl">
                Vídeos com chancela de hospitais e universidades de excelência. Toque em "ver mais" para a descrição completa.
              </p>
            </div>

            {/* Campo de Busca (Página 19 do PDF) */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9FB3C6]" />
              <input
                type="text"
                placeholder="Buscar procedimento..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl text-xs sm:text-sm bg-[#0E1722] border border-[#1F3045] text-white placeholder:text-[#9FB3C6]/60 focus:outline-none focus:border-[#20D5B5]"
              />
            </div>

            {/* Contador de Assistidos (Página 19 do PDF) */}
            <div className="text-xs font-bold text-[#20D5B5]">
              {watchedIds.length} de {procedures.length} vídeos assistidos
            </div>

            {/* Chips de Categorias Deslizáveis */}
            <div
              ref={categoriesRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch', overscrollBehaviorX: 'contain' }}
              className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 select-none cursor-grab active:cursor-grabbing"
            >
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic(15);
                      setSelectedCategory(cat.id);
                    }}
                    className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#20D5B5] text-[#0B131D] font-black shadow-[0_2px_0_0_#148A76]'
                        : 'bg-[#0E1722] border border-[#1F3045] text-[#9FB3C6] hover:text-white hover:border-[#20D5B5]/40'
                    }`}
                  >
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Lista de Cards de Procedimentos (Página 19 do PDF) */}
            {filtered.length === 0 ? (
              <div className="rounded-3xl border border-[#1F3045] bg-[#0E1722] p-10 text-center space-y-2">
                <Video className="h-10 w-10 text-[#9FB3C6] mx-auto opacity-60" />
                <p className="text-sm font-bold text-white">Nenhum procedimento encontrado</p>
                <p className="text-xs text-[#9FB3C6]">Tente buscar por outro termo ou selecione outra categoria.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((proc) => {
                  const isWatched = watchedIds.includes(proc.id);

                  return (
                    <div
                      key={proc.id}
                      onClick={() => handleOpenProcedure(proc)}
                      className="bg-[#131F2E] rounded-2xl border border-[#1F3045] hover:border-[#20D5B5]/50 p-4 transition-all cursor-pointer flex items-center gap-4 group shadow-xs"
                    >
                      {/* Quadrado do Play */}
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#0E1722] border border-[#1F3045] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <h3 className="text-xs sm:text-sm font-bold text-white leading-tight line-clamp-2">
                          {proc.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#20D5B5]/15 text-[#20D5B5] border border-[#20D5B5]/30">
                            {proc.categoryLabel}
                          </span>
                          <span className="text-[10px] font-semibold text-[#9FB3C6]">
                            {proc.duration}
                          </span>
                          {isWatched && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#20D5B5]/20 text-[#20D5B5] border border-[#20D5B5]/40 flex items-center gap-1">
                              ✓ Concluído
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      <StudentFooter />
      <MobileBottomDock />
    </div>
  );
}
