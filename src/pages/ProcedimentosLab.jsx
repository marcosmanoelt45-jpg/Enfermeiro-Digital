import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Video,
  Search,
  Play,
  ArrowLeft,
  ShieldCheck,
  Check,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import StudentHeader from '@/components/StudentHeader';
import StudentFooter from '@/components/StudentFooter';
import { useTheme } from '@/lib/ThemeContext';
import { procedureService } from '@/services/procedureService';
import { getProcedurePreview } from '@/services/procedurePreviews';

// Componentes modulares
import EnfereClinicalPlayer from '@/components/procedures/EnfereClinicalPlayer';
import ProcedureChecklist from '@/components/procedures/ProcedureChecklist';
import ProcedureSafetyAlerts from '@/components/procedures/ProcedureSafetyAlerts';
import ProcedureAIChat from '@/components/procedures/ProcedureAIChat';

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col transition-colors">
      <StudentHeader activeTab="procedimentos" />

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-6 space-y-6">
        {/* Se estiver visualizando um procedimento ativo (Modo Treinamento) */}
        {activeProcedure ? (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Barra superior de navegação de volta */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(20);
                  setActiveProcedure(null);
                }}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-400 transition tap-press"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar ao Catálogo de Procedimentos
              </button>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  {activeProcedure.categoryLabel}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700">
                  {activeProcedure.difficulty}
                </span>
              </div>
            </div>

            {/* Layout em 2 Colunas Despoluído e Técnico com o Player Próprio do Enfere */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Coluna da Esquerda (Player Próprio Enfere + 'O Que NÃO Fazer' + Chat Goti IA) */}
              <div className="lg:col-span-7 space-y-6">
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
                <ProcedureSafetyAlerts
                  safetyAlerts={activeProcedure.safetyAlerts}
                  cofenNorm={activeProcedure.cofenNorm}
                />
                <ProcedureAIChat procedure={activeProcedure} />
              </div>

              {/* Coluna da Direita ('O Que Fazer' - Passo a Passo Asséptico & Materiais) */}
              <div className="lg:col-span-5 space-y-6 sticky top-20">
                <ProcedureChecklist
                  procedure={activeProcedure}
                  onComplete={() => refreshList()}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Modo Catálogo & Grade de Procedimentos */
          <div className="space-y-6">
            {/* Hero Banner da Videoteca com Procedimento Seguro */}
            <div className="relative overflow-hidden rounded-3xl border border-teal-200/80 dark:border-teal-900/60 bg-gradient-to-br from-teal-700 via-emerald-800 to-slate-900 text-white p-6 sm:p-8 shadow-sm">
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="max-w-xl text-center md:text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-teal-100 text-xs font-bold mb-3 border border-white/20">
                    <Video className="h-3.5 w-3.5" />
                    <span>Laboratório de Habilidades Práticas · Skills Lab</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                    Videoteca & Procedimentos Operacionais Padrão (POPs)
                  </h1>
                  <p className="mt-2 text-xs sm:text-sm text-teal-100/90 leading-relaxed">
                    Vídeos com chancela de hospitais e universidades de excelência (UFRGS, UFSM, Einstein), guias de <strong>O Que Fazer</strong> e <strong>O Que NÃO Fazer</strong>, com técnica asséptica e suporte do Goti IA.
                  </p>
                </div>

                <div className="shrink-0 flex items-center justify-center">
                  <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 text-left space-y-2 min-w-[200px]">
                    <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <span>Procedimento Seguro</span>
                    </div>
                    <p className="text-xs text-teal-100/80">Técnica asséptica estrita e biossegurança hospitalar</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Barra de Filtros e Busca (Sem o botão de gerar com IA) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Input de Busca */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar procedimento (ex: punção, vesical, SNG, aspiração)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-2xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs"
                />
              </div>

              {/* Contador de Assistidos */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{watchedIds.length} de {procedures.length} vídeos assistidos</span>
                </span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  • Exibindo <strong className="text-slate-700 dark:text-slate-200">{filtered.length}</strong>
                </span>
              </div>
            </div>

            {/* Chips de Categorias Deslizáveis com Suporte a Toque e Arraste Fluido */}
            <div
              ref={categoriesRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch', overscrollBehaviorX: 'contain' }}
              className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1.5 -mx-4 px-4 sm:mx-0 sm:px-0 select-none cursor-grab active:cursor-grabbing"
            >
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                let count = procedures.length;
                if (cat.id === 'watched') {
                  count = watchedIds.length;
                } else if (cat.id === 'unwatched') {
                  count = Math.max(0, procedures.length - watchedIds.length);
                } else if (cat.id !== 'all') {
                  count = procedures.filter((p) => p.category === cat.id).length;
                }

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic(15);
                      setSelectedCategory(cat.id);
                    }}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all tap-press ${
                      isActive
                        ? 'bg-teal-700 dark:bg-teal-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-teal-300'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className="ml-1.5 text-[10px] opacity-80 font-mono">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Grade de Cards de Procedimentos */}
            {filtered.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
                <Video className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Nenhum procedimento encontrado
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Tente buscar por outro termo ou selecione uma categoria diferente acima.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((proc) => {
                  const previewSrc = getProcedurePreview(proc.id) || proc.previewImage || `/previews/${proc.id}.svg`;
                  const isWatched = watchedIds.includes(proc.id);

                  return (
                    <div
                      key={proc.id}
                      onClick={() => handleOpenProcedure(proc)}
                      className={`group rounded-3xl border bg-white dark:bg-slate-900 p-5 shadow-xs hover-lift tap-press transition-all cursor-pointer flex flex-col justify-between ${
                        isWatched
                          ? 'border-emerald-300/80 dark:border-emerald-900/60 ring-1 ring-emerald-500/20'
                          : 'border-slate-200/90 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-500'
                      }`}
                    >
                      <div>
                        {/* Thumbnail Exclusiva do Procedimento */}
                        <div className="relative aspect-video w-full rounded-2xl bg-slate-950 overflow-hidden mb-3.5 flex items-center justify-center group-hover:scale-[1.01] transition-transform">
                          <img
                            src={previewSrc}
                            alt={proc.title}
                            loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              if (!e.currentTarget.dataset.retried) {
                                e.currentTarget.dataset.retried = 'true';
                                e.currentTarget.src = `/previews/${proc.id}.svg`;
                              }
                            }}
                          />
                          <div className="absolute inset-0 bg-slate-950/25 group-hover:bg-slate-950/10 transition-colors pointer-events-none" />

                          {/* Botão de Alternância Rápida de Assistido no Topo Esquerdo */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleWatched(e, proc.id)}
                            className={`absolute top-2.5 left-2.5 z-20 p-1.5 rounded-xl backdrop-blur-md transition-all shadow-md ${
                              isWatched
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-slate-950/70 text-slate-300 hover:text-white hover:bg-slate-900'
                            }`}
                            title={isWatched ? 'Marcar como não assistido' : 'Marcar como já assistido'}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Badge de 'Assistido' no Topo Direito */}
                          {isWatched && (
                            <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600/95 text-white text-[10px] font-black shadow-lg backdrop-blur-xs border border-emerald-400/30">
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>Assistido</span>
                            </div>
                          )}

                          <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/90 text-slate-950 shadow-lg group-hover:scale-110 transition-transform">
                            <Play className="h-5 w-5 fill-slate-950 ml-0.5" />
                          </div>

                          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-white/90 z-10">
                            <span className="px-2 py-0.5 rounded-md bg-slate-950/85 backdrop-blur-xs font-mono font-bold">
                              {proc.duration}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-teal-950/85 backdrop-blur-xs font-semibold text-teal-300 border border-teal-800/60 text-[10px]">
                              {proc.categoryLabel}
                            </span>
                          </div>
                        </div>

                        {proc.institutionalBadge && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider mb-1">
                            <ShieldCheck className="h-3 w-3" />
                            <span className="truncate">{proc.institutionalBadge}</span>
                          </div>
                        )}

                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-800 dark:group-hover:text-teal-300 transition-colors line-clamp-2 leading-snug">
                          {proc.title}
                        </h3>

                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {proc.description}
                        </p>
                      </div>

                      {/* Footer do Card */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          {isWatched ? (
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Concluído
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              {proc.steps?.length || 0} passos · {proc.materials?.length || 0} materiais
                            </span>
                          )}
                        </div>

                        <span className="font-bold text-teal-700 dark:text-teal-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                          Ver POP & Vídeo →
                        </span>
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
    </div>
  );
}
