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
import CaseHistoryModal from '@/components/history/CaseHistoryModal';
import { MODULE_TYPES } from '@/services/clinicalHistoryService';
import { History } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { prefersReducedMotion } from '@/lib/motion';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { AnimatedProgress } from '@/components/ui/animated-progress';
import { referenciaPop } from "@/data/procedimentos/referenciasPop";
import { clinicalGamificationService } from '@/services/clinicalGamificationService';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';

/** Capa do vídeo: a imagem do próprio YouTube (320x180) quando o vídeo é de lá; senão a prévia do POP. */
function capaDoVideo(proc) {
  const id = String(proc?.videoUrl || '').match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]{6,})/)?.[1];
  return id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : proc?.previewImage || null;
}

// Catálogo de vídeos e POPs, reaproveitado na página /procedimentos e nas abas de Técnicas.
// `embutido`: dentro de outra página (aba POPs de Técnicas), sem o cabeçalho e o rodapé do site, que a página já tem.
export default function VideotecaConteudo({ titulo = 'Vídeos e POPs', embutido = false }) {
  const { triggerHaptic } = useTheme();
  const { user } = useAuth();

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
    { id: 'all', label: 'Todos' },
    { id: 'unwatched', label: 'Para assistir' },
    { id: 'watched', label: 'Assistidos' },
    { id: 'semiotecnica', label: 'Semiotécnica' },
    { id: 'eliminacoes', label: 'Sondas e eliminações' },
    { id: 'vasculares', label: 'Acessos vasculares' },
    { id: 'respiratorio', label: 'Vias aéreas' },
    { id: 'curativos', label: 'Curativos' },
    { id: 'medicamentos', label: 'Medicamentos' },
    { id: 'urgencia', label: 'Urgência' },
  ].filter((c) => ['all', 'unwatched', 'watched'].includes(c.id) || procedures.some((p) => p.category === c.id));

  // Fim do vídeo: 1ª vez marca como assistido e rende o PE do vídeo; depois, só conta o dia na ofensiva.
  const aoTerminarVideo = (proc) => {
    const jaVisto = procedureService.getWatchedList().includes(proc.id);
    if (!jaVisto) {
      procedureService.markWatched(proc.id);
      const r = clinicalGamificationService.recordActivity('video', null, user?.id ?? null, { activityId: `video:${proc.id}` });
      toast({ title: 'Vídeo assistido', description: `+${r.earnedXp} PE e o dia de hoje na sua ofensiva.` });
    } else {
      clinicalGamificationService.concluirAtividadeDoDia(user?.id ?? null);
    }
    refreshList();
  };

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

  const Casca = embutido ? 'div' : 'main';
  const conteudo = (
      <Casca className={embutido ? 'w-full space-y-5' : 'flex-1 mx-auto max-w-xl md:max-w-4xl w-full px-4 sm:px-6 py-4 space-y-5'}>
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
                onComplete={() => aoTerminarVideo(activeProcedure)}
              />
            </div>

            {/* Informações Institucionais e Créditos Acadêmicos do POP */}
            {/* o player já mostra o título e os créditos: aqui só o POP de referência e a fonte oficial */}
            {(activeProcedure.officialGuideUrl || referenciaPop(activeProcedure.id)) && (
            <div className="space-y-1.5 rounded-2xl border-2 border-[#27394B] bg-[#131F2E] p-4">
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
              {referenciaPop(activeProcedure.id) && (
                <div className="rounded-xl border border-[#27394B] bg-[#131F2E] p-3 text-[11px] leading-relaxed text-[#9FB3C6]">
                  <p>
                    <strong className="text-[#EAF2F8]">POP de referência:</strong>{" "}
                    <a href={referenciaPop(activeProcedure.id).url} target="_blank" rel="noopener noreferrer" className="font-bold text-[#20D5B5] hover:underline">
                      {referenciaPop(activeProcedure.id).titulo}
                    </a>
                  </p>
                  {referenciaPop(activeProcedure.id).observacao && <p className="mt-1">{referenciaPop(activeProcedure.id).observacao}</p>}
                </div>
              )}
            </div>
            )}

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
          /* Catálogo: progresso, busca, filtros e os vídeos em cartões com a capa */
          <div className="space-y-4">
            {/* embutido (aba Vídeos de Técnicas): a página já tem o título */}
            {!embutido && (
              <header className="space-y-1 pt-1">
                <h1 className="text-xl font-black text-[#EAF2F8] sm:text-2xl">{titulo}</h1>
                <p className="text-sm font-semibold text-[#9FB3C6]">Vídeos do LabEnf/UFSM e de instituições de referência, com roteiro passo a passo e checklist.</p>
              </header>
            )}

            {/* progresso */}
            <section className="flex items-center gap-3 rounded-2xl border-2 border-[#27394B] bg-[#131F2E] p-3" aria-label="Seu progresso nos vídeos">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#20D5B5]/15 text-[#20D5B5]">
                <Video className="h-6 w-6" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-[#EAF2F8]">
                  <AnimatedNumber value={watchedIds.length} /> de {procedures.length} assistidos
                </p>
                <p className="text-xs font-semibold text-[#9FB3C6]">
                  {concluidosCount} {concluidosCount === 1 ? "checklist concluído" : "checklists concluídos"} · +15 PE por vídeo novo
                </p>
                <AnimatedProgress value={procedures.length ? (watchedIds.length / procedures.length) * 100 : 0} label="Vídeos assistidos" className="mt-1.5 h-2" />
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#27394B] bg-[#0B131D] text-[#20D5B5] transition-colors duration-150 hover:border-[#20D5B5]/60"
                aria-label="Histórico de treinamentos"
              >
                <History className="h-5 w-5" aria-hidden="true" />
              </button>
            </section>

            {/* busca */}
            <label className="relative block">
              <span className="sr-only">Buscar vídeo</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9FB3C6]" aria-hidden="true" />
              <input
                type="search"
                placeholder="Buscar (ex.: sonda, curativo, punção, UFSM)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border-2 border-[#27394B] bg-[#0B131D] py-3 pl-10 pr-4 text-sm font-semibold text-[#EAF2F8] placeholder:text-[#4F6378] focus:border-[#20D5B5] focus:outline-none"
              />
            </label>

            {/* filtros */}
            <div
              ref={categoriesRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              style={{ touchAction: 'pan-x pan-y', overscrollBehaviorX: 'contain' }}
              className="no-scrollbar -mx-1 flex select-none items-center gap-2 overflow-x-auto px-1 pb-1"
            >
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => {
                      triggerHaptic(15);
                      setSelectedCategory(cat.id);
                    }}
                    className={`shrink-0 rounded-full border-2 px-3 py-1.5 text-xs font-black transition-colors duration-150 ${
                      isActive ? 'border-[#20D5B5] bg-[#20D5B5]/15 text-[#20D5B5]' : 'border-[#27394B] text-[#9FB3C6] hover:text-[#EAF2F8]'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {filtered.length === 0 ? (
              <div className="space-y-2 rounded-3xl border-2 border-[#27394B] bg-[#131F2E] p-8 text-center">
                <Video className="mx-auto h-10 w-10 text-[#9FB3C6] opacity-60" aria-hidden="true" />
                <p className="text-sm font-black text-[#EAF2F8]">Nenhum vídeo encontrado</p>
                <p className="text-xs font-semibold text-[#9FB3C6]">Tente outro termo ou outro filtro.</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}>
                  Limpar filtros
                </Button>
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {filtered.map((proc) => {
                  const isWatched = watchedIds.includes(proc.id);
                  const capa = capaDoVideo(proc);
                  return (
                    <li key={proc.id}>
                      <button
                        type="button"
                        aria-label={`${proc.title}, ${proc.duration}${isWatched ? ", assistido" : ""}`}
                        onClick={() => handleOpenProcedure(proc)}
                        className="group w-full overflow-hidden rounded-2xl border-2 border-[#27394B] bg-[#131F2E] text-left transition-colors duration-150 hover:border-[#20D5B5]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#20D5B5]"
                      >
                        <span className="relative block aspect-video bg-[#0B131D]">
                          {capa ? (
                            <img src={capa} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
                          ) : (
                            <Video className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-[#27394B]" aria-hidden="true" />
                          )}
                          <span className="absolute inset-0 bg-gradient-to-t from-[#0B131D]/80 via-transparent to-transparent" aria-hidden="true" />
                          <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#20D5B5] shadow-[0_4px_0_#149F86] transition-transform duration-150 group-active:translate-y-[-46%]">
                            <Play className="ml-0.5 h-5 w-5 fill-[#062B25] text-[#062B25]" aria-hidden="true" />
                          </span>
                          {proc.duration && (
                            <span className="absolute bottom-2 right-2 rounded-md bg-[#0B131D]/85 px-1.5 py-0.5 text-[11px] font-black tabular-nums text-[#EAF2F8]">{proc.duration}</span>
                          )}
                          {isWatched && (
                            <span className="absolute left-2 top-2 rounded-full bg-[#3DD68C] px-2 py-0.5 text-[11px] font-black text-[#062B25]">✓ Assistido</span>
                          )}
                        </span>
                        <span className="block space-y-1.5 p-3">
                          <span className="line-clamp-2 block text-sm font-black leading-snug text-[#EAF2F8]">{proc.title}</span>
                          <span className="flex flex-wrap items-center gap-1.5">
                            <span className="rounded-md bg-[#20D5B5]/15 px-2 py-0.5 text-[11px] font-bold text-[#20D5B5]">{proc.categoryLabel}</span>
                            {proc.institutionalBadge && <span className="truncate text-[11px] font-semibold text-[#9FB3C6]">{proc.institutionalBadge}</span>}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </Casca>
  );

  const historico = (
      <CaseHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        defaultModuleFilter={MODULE_TYPES.PROCEDURES}
        lockModuleFilter
        title="Histórico de Treinamentos"
      />
  );

  if (embutido) {
    return (
      <>
        {conteudo}
        {historico}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B131D] text-[#EAF2F8] pb-28 md:pb-8 flex flex-col">
      <div className="hidden md:block">
        <StudentHeader activeTab="procedimentos" />
      </div>
      {conteudo}
      <StudentFooter />
      {historico}
    </div>
  );
}
