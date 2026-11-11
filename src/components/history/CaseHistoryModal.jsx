import React, { useState, useEffect } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import {
  X,
  History,
  CheckCircle2,
  Clock,
  Play,
  FileText,
  Trash2,
  Award,
  Calendar,
  Hourglass
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedProgress } from "@/components/ui/animated-progress";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { clinicalHistoryService, MODULE_LABELS } from "@/services/clinicalHistoryService";
import { scrimVariants, sheetVariants } from "@/lib/motion";

export default function CaseHistoryModal({
  isOpen,
  onClose,
  onResumeActivity,
  onViewEvaluation,
  defaultModuleFilter = "all",
  lockModuleFilter = false,
  title = null
}) {
  const [activities, setActivities] = useState([]);
  const [activeFilter, setActiveFilter] = useState(defaultModuleFilter);
  const [stats, setStats] = useState({ total: 0, completedCount: 0, inProgressCount: 0 });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Sincronizar filtro quando abrir com módulo padrão
  useEffect(() => {
    if (isOpen) {
      setActiveFilter(defaultModuleFilter);
      setConfirmDeleteId(null);
    }
  }, [isOpen, defaultModuleFilter]);

  // Fechar com tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Timer para cancelar confirmação inline de exclusão após 3s
  useEffect(() => {
    if (!confirmDeleteId) return;
    const timer = setTimeout(() => {
      setConfirmDeleteId(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [confirmDeleteId]);

  function loadActivities() {
    const filterToUse = lockModuleFilter ? defaultModuleFilter : activeFilter;
    const list = clinicalHistoryService.getAllActivities(filterToUse);
    setActivities(list);

    if (lockModuleFilter && defaultModuleFilter !== "all") {
      const completed = list.filter((it) => it.status === "concluido");
      const inProgress = list.filter((it) => it.status === "em_andamento");
      setStats({
        total: list.length,
        completedCount: completed.length,
        inProgressCount: inProgress.length,
      });
    } else {
      setStats(clinicalHistoryService.getSummaryStats());
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadActivities();
    }
  }, [isOpen, activeFilter, defaultModuleFilter, lockModuleFilter]);

  function handleDeleteClick(id, e) {
    e.stopPropagation();
    if (confirmDeleteId === id) {
      clinicalHistoryService.deleteActivity(id);
      setConfirmDeleteId(null);
      loadActivities();
    } else {
      setConfirmDeleteId(id);
    }
  }

  const displayTitle = title || (lockModuleFilter && defaultModuleFilter !== "all" && MODULE_LABELS[defaultModuleFilter]
    ? `Histórico: ${MODULE_LABELS[defaultModuleFilter]}`
    : "Histórico de Casos & Prática Clínica");

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="case-history-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          {/* Fundo Escuro com Scrim */}
          <motion.div
            variants={scrimVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal / Folha Inferior Animada */}
          <motion.div
            variants={sheetVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl max-h-[92vh] sm:max-h-[85vh] bg-[#0E1722] border border-[#1F3045] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#EAF2F8] z-10"
          >
            {/* Cabeçalho do Modal */}
            <div className="p-4 sm:p-5 border-b border-[#1F3045] flex items-center justify-between bg-[#131F2E]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#20D5B5]/15 border border-[#20D5B5]/30 text-[#20D5B5] flex items-center justify-center shrink-0">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="case-history-title" className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>{displayTitle}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#20D5B5]/20 text-[#20D5B5] border border-[#20D5B5]/30">
                      <AnimatedNumber value={stats.total} /> {stats.total === 1 ? "registro" : "registros"}
                    </span>
                  </h2>
                  <p className="text-xs text-[#9FB3C6]">
                    {lockModuleFilter
                      ? "Atividades e rascunhos exclusivos deste módulo. Retome seu progresso ou veja o resultado."
                      : "Acompanhe o tempo de resolução, status e retome suas atividades clínicas a qualquer momento."}
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Fechar histórico"
                className="text-[#9FB3C6] hover:text-white shrink-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Resumo Rápido de Métricas com AnimatedNumber */}
            <div className="px-4 sm:px-6 py-3 bg-[#0B131D] border-b border-[#1F3045] grid grid-cols-3 gap-2.5 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-[#131F2E] border border-[#1F3045]">
                <span className="text-[#9FB3C6] block text-[10px] uppercase font-bold">Total</span>
                <strong className="text-white text-sm font-black">
                  <AnimatedNumber value={stats.total} />
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[#131F2E] border border-[#1F3045]">
                <span className="text-[#3DD68C] block text-[10px] uppercase font-bold">Concluídos</span>
                <strong className="text-[#3DD68C] text-sm font-black">
                  <AnimatedNumber value={stats.completedCount} />
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[#131F2E] border border-[#1F3045]">
                <span className="text-[#FFC247] block text-[10px] uppercase font-bold">Em Andamento</span>
                <strong className="text-[#FFC247] text-sm font-black">
                  <AnimatedNumber value={stats.inProgressCount} />
                </strong>
              </div>
            </div>

            {/* Barra de Filtros com todos os módulos (profile-10) */}
            {!lockModuleFilter && (
              <div className="px-4 sm:px-6 py-2.5 border-b border-[#1F3045] bg-[#0E1722] flex items-center gap-2 overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeFilter === "all"
                      ? "bg-[#20D5B5] text-[#0E1722]"
                      : "bg-[#131F2E] border border-[#1F3045] text-[#9FB3C6] hover:text-white"
                  }`}
                >
                  Todas as Atividades
                </button>
                {Object.entries(MODULE_LABELS).map(([modKey, modLabel]) => (
                  <button
                    key={modKey}
                    type="button"
                    onClick={() => setActiveFilter(modKey)}
                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      activeFilter === modKey
                        ? "bg-[#20D5B5] text-[#0E1722]"
                        : "bg-[#131F2E] border border-[#1F3045] text-[#9FB3C6] hover:text-white"
                    }`}
                  >
                    {modLabel.split(" ")[0]}
                  </button>
                ))}
              </div>
            )}

            {/* Lista de Atividades com Rolagem */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {activities.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#131F2E] text-[#9FB3C6] flex items-center justify-center mx-auto border border-[#1F3045]">
                    <Hourglass className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    Nenhuma atividade encontrada neste filtro
                  </h3>
                  <p className="text-xs text-[#9FB3C6] max-w-sm mx-auto">
                    Inicie um caso clínico, cálculo de doses ou passagem SBAR. Todas as suas práticas ficarão salvas automaticamente aqui!
                  </p>
                </div>
              ) : (
                activities.map((act) => {
                  const isCompleted = act.status === "concluido";
                  const dateFormatted = new Date(act.finishedAt || act.updatedAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const isConfirmingThis = confirmDeleteId === act.id;

                  return (
                    <div
                      key={act.id}
                      className="p-4 rounded-2xl border border-[#1F3045] bg-[#131F2E] hover:border-[#27394B] shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0E1722] border border-[#27394B] text-[#20D5B5]">
                            {act.moduleLabel || "Clínica"}
                          </span>

                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#3DD68C]/15 text-[#3DD68C] border border-[#3DD68C]/30">
                              <CheckCircle2 className="w-3 h-3 text-[#3DD68C]" />
                              Concluído
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFC247]/15 text-[#FFC247] border border-[#FFC247]/30">
                              <Clock className="w-3 h-3 text-[#FFC247]" />
                              Em Andamento ({act.progressPercentage || 0}%)
                            </span>
                          )}

                          {act.score !== null && act.score !== undefined && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#20D5B5]/15 text-[#20D5B5] border border-[#20D5B5]/30">
                              <Award className="w-3 h-3 text-[#20D5B5]" />
                              Nota: {act.score}/100
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-white truncate">
                            {act.title}
                          </h4>
                          <p className="text-xs text-[#9FB3C6] line-clamp-1">
                            {act.patientInfo}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-[11px] text-[#9FB3C6] flex-wrap font-mono">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#9FB3C6]" />
                            {dateFormatted}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#9FB3C6]" />
                            Tempo: <strong className="text-white font-semibold">{clinicalHistoryService.formatDuration(act.durationSeconds)}</strong>
                          </span>
                        </div>

                        {/* Barra de Progresso com AnimatedProgress */}
                        <div className="pt-1">
                          <AnimatedProgress
                            value={act.progressPercentage || (isCompleted ? 100 : 0)}
                            tone={isCompleted ? "success" : "warning"}
                            className="h-2"
                            label={`Progresso da sessão: ${act.title}`}
                          />
                        </div>
                      </div>

                      {/* Ações (profile-10: Button do design system + inline confirm) */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#1F3045]">
                        {!isCompleted ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              if (onResumeActivity) onResumeActivity(act);
                              onClose();
                            }}
                            className="h-8 text-xs font-bold"
                          >
                            <Play className="w-3.5 h-3.5 mr-1" />
                            <span>Continuar</span>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (onViewEvaluation) onViewEvaluation(act);
                              else if (onResumeActivity) onResumeActivity(act);
                              onClose();
                            }}
                            className="h-8 text-xs font-semibold"
                          >
                            <FileText className="w-3.5 h-3.5 mr-1" />
                            <span>Ver Resultado</span>
                          </Button>
                        )}

                        {/* Exclusão com confirmação inline de dois toques */}
                        {isConfirmingThis ? (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={(e) => handleDeleteClick(act.id, e)}
                            className="h-7 px-2 text-[11px] font-black animate-in fade-in"
                          >
                            Remover?
                          </Button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteClick(act.id, e)}
                            aria-label={`Excluir ${act.title}`}
                            className="p-1.5 text-[#9FB3C6] hover:text-[#FF6B6B] rounded-lg hover:bg-rose-500/10 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 border-t border-[#1F3045] bg-[#131F2E] flex items-center justify-between text-xs text-[#9FB3C6]">
              <span>Progresso salvo automaticamente no seu perfil.</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-xs font-bold"
              >
                Fechar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
