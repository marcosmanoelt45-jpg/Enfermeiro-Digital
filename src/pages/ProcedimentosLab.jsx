import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Play,
  ArrowLeft,
  Video,
  ExternalLink,
} from 'lucide-react';
import StudentHeader from '@/components/StudentHeader';
import { Button } from '@/components/ui/button';
import StudentFooter from '@/components/StudentFooter';
import { useTheme } from '@/lib/ThemeContext';
import { procedureService } from '@/services/procedureService';

// Componentes modulares
import EnfereClinicalPlayer from '@/components/procedures/EnfereClinicalPlayer';
import ProcedureChecklist from '@/components/procedures/ProcedureChecklist';
import ProcedureSafetyAlerts from '@/components/procedures/ProcedureSafetyAlerts';
import ProcedureAIChat from '@/components/procedures/ProcedureAIChat';
import MobileBottomDock from '@/components/mobile/MobileBottomDock';
import CaseHistoryModal from '@/components/history/CaseHistoryModal';
import { MODULE_TYPES } from '@/services/clinicalHistoryService';
import { History } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { prefersReducedMotion } from '@/lib/motion';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { AnimatedProgress } from '@/components/ui/animated-progress';

export default function ProcedimentosLab() {
  const { triggerHaptic } = useTheme();

  const [procedures, setProcedures] = useState(() => procedureService.list());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  // O procedimento aberto vive na URL (?p=id): o Voltar do celular volta ao catálogo e o link pode ser compartilhado.
  const activeProcedure = useMemo(
    () => procedures.find((proc) => proc.id === searchParams.get('p')) || null,
    [procedures, searchParams]
  );
  const openProcedure = (proc, { replace = false } = {}) => {
    setSearchParams({ p: proc.id }, { replace });
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };
  const closeProcedure = () => {
    // Se entrou pelo catálogo, volta no histórico; se abriu um link direto, só tira o parâmetro.
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else setSearchParams({}, { replace: true });
  };

  // Ações do briefing: "continue" reabre o último POP visto e "review" abre o histórico.
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'review') {
      setIsHistoryOpen(true);
    } else if (action === 'continue') {
      const ultimoId = procedureService.getWatchedList().slice(-1)[0];
      const ultimo = ultimoId && procedureService.list().find((p) => p.id === ultimoId);
      if (ultimo) openProcedure(ultimo, { replace: true });
    }
  }, [searchParams]);

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
  const concluidosCount = useMemo(
    () => procedures.filter((proc) => procedureService.isCompleted(proc.id)).length,
    // watchedIds muda junto quando um procedimento é concluído (refreshList).
    [procedures, watchedIds]
  );

  const refreshList = () => {
    const list = procedureService.list();
    setProcedures(list);
    setWatchedIds(procedureService.getWatchedList());
  };

  const categories = [
    { id: 'all', label: 'Todos os Procedimentos' },
    { id: 'watched', label: '✓ Já Assistidos' },
    { id: 'unwatched', label: 'Pendentes' },
    { id: 'semiotecnica', label: 'Semiotécnica & Biossegurança' },
    { id: 'eliminacoes', label: 'Cateterismos & Eliminações' },
    { id: 'vasculares', label: 'Acessos Vasculares' },
    { id: 'respiratorio', label: 'Vias Aéreas & Ventilação' },
    { id: 'curativos', label: 'Curativos & Lesões' },
    { id: 'medicamentos', label: 'Terapia Medicamentosa' },
    { id: 'urgencia', label: 'Urgência & Emergência' },
  ];

  const filtered = useMemo(() => {
    // Busca sem diferenciar acento: "puncao" encontra "Punção".
    const norm = (v) => String(v || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    const q = norm(searchQuery.trim());
    return procedures.filter((p) => {
      const matchesSearch = !q || [p.title, p.description, p.categoryLabel, p.institutionalBadge].some((f) => norm(f).includes(q));

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
    // Abrir não conta como assistido: isso só acontece ao concluir o roteiro.
    openProcedure(proc);
  };

  return (
    <div className="min-h-screen bg-[#0B131D] text-[#EAF2F8] pb-28 md:pb-8 flex flex-col">
      <div className="hidden md:block">
        <StudentHeader activeTab="procedimentos" />
      </div>

      <main className="flex-1 mx-auto max-w-xl md:max-w-4xl w-full px-4 sm:px-6 py-4 space-y-5">
        {/* Se estiver visualizando um procedimento ativo (Modo Treinamento) */}
        {activeProcedure ? (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Barra superior de navegação de volta */}
            <div className="pt-1 pb-1">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(20);
                  closeProcedure();
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
                previewImage={activeProcedure.previewImage}
                duration={activeProcedure.duration}
                onComplete={() => refreshList()}
              />
            </div>

            {/* Informações Institucionais e Créditos Acadêmicos do POP */}
            <div className="space-y-1.5 bg-[#0E1722] border border-[#1F3045] rounded-2xl p-4">
              {activeProcedure.institutionalBadge && (
                <span className="text-[10px] font-black uppercase text-[#20D5B5] tracking-wider block">
                  {activeProcedure.institutionalBadge}
                </span>
              )}
              <h1 className="text-base sm:text-lg font-black text-white leading-tight">
                {activeProcedure.title}
              </h1>
              <p className="text-xs text-[#9FB3C6] leading-relaxed">
                <strong className="text-[#EAF2F8]">Produção acadêmica & créditos:</strong>{' '}
                {activeProcedure.videoSource || 'Acervo Institucional de Enfermagem'}
              </p>
              {activeProcedure.officialGuideUrl && (
                <div className="pt-1">
                  <a
                    href={activeProcedure.officialGuideUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#20D5B5] hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Acessar fonte institucional oficial (UFSM LabEnf / Diretrizes)
                  </a>
                </div>
              )}
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
          </div>
        ) : (
          /* Modo Catálogo & Lista de Procedimentos */
          <div className="space-y-5">
            {/* Cabeçalho da Videoteca */}
            <div className="space-y-1.5 pt-1">
              <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#20D5B5]/15 text-[#20D5B5] border border-[#20D5B5]/30">
                Skills Lab · Acervo LabEnf UFSM & Hospitais de Excelência
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Videoteca de Procedimentos & POPs
              </h1>
              <p className="text-xs text-[#9FB3C6] leading-relaxed max-w-2xl">
                Vídeos didáticos oficiais do Laboratório de Enfermagem da UFSM (LabEnf), UFRGS e instituições de referência, para fins exclusivamente educacionais e sem fins lucrativos.
              </p>
            </div>

            {/* Campo de Busca */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9FB3C6]" />
              <input
                type="text"
                placeholder="Buscar procedimento, técnica ou instituição (ex: UFSM, sonda, curativo, traqueostomia)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl text-xs sm:text-sm bg-[#0E1722] border border-[#1F3045] text-white placeholder:text-[#9FB3C6]/60 focus:outline-none focus:border-[#20D5B5]"
              />
            </div>

            {/* Contador de Assistidos */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-[#20D5B5]">
                  <AnimatedNumber value={concluidosCount} /> de {procedures.length} procedimentos concluídos
                  <span className="ml-1.5 font-semibold text-[#9FB3C6]">· {watchedIds.length} assistidos</span>
                </div>
                <AnimatedProgress
                  value={procedures.length ? (concluidosCount / procedures.length) * 100 : 0}
                  label="Procedimentos concluídos"
                  className="mt-1.5 h-1.5 max-w-xs"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#27394B] bg-[#16222E] text-xs font-bold text-[#20D5B5] hover:bg-[#1F3045] transition cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
                <span>Histórico de Treinamentos</span>
              </button>
            </div>

            {/* Chips de Categorias Deslizáveis */}
            <div
              ref={categoriesRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              style={{ touchAction: 'pan-x pan-y', WebkitOverflowScrolling: 'touch', overscrollBehaviorX: 'contain' }}
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

            {/* Lista de Cards de Procedimentos */}
            {filtered.length === 0 ? (
              <div className="rounded-3xl border border-[#1F3045] bg-[#0E1722] p-10 text-center space-y-2">
                <Video className="h-10 w-10 text-[#9FB3C6] mx-auto opacity-60" />
                <p className="text-sm font-bold text-white">Nenhum procedimento encontrado</p>
                <p className="text-xs text-[#9FB3C6]">Tente buscar por outro termo ou selecione outra categoria.</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}>
                  Limpar filtros
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((proc) => {
                  const isWatched = watchedIds.includes(proc.id);

                  return (
                    <button
                      key={proc.id}
                      type="button"
                      aria-label={`${proc.title}, ${proc.duration}${isWatched ? ", assistido" : ""}`}
                      onClick={() => handleOpenProcedure(proc)}
                      className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#20D5B5] bg-[#131F2E] rounded-2xl border border-[#1F3045] hover:border-[#20D5B5]/50 p-4 transition-all cursor-pointer flex items-center gap-4 group shadow-sm"
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
                          {proc.institutionalBadge && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#0E1722] text-[#9FB3C6] border border-[#1F3045]">
                              {proc.institutionalBadge}
                            </span>
                          )}
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
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      <StudentFooter />
      <MobileBottomDock />

      {/* Modal de Histórico de Treinamentos */}
      <CaseHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        defaultModuleFilter={MODULE_TYPES.PROCEDURES}
        lockModuleFilter
        title="Histórico de Treinamentos"
      />
    </div>
  );
}
