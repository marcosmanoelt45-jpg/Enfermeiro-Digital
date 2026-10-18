import React, { useState, useEffect } from "react";
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
import { clinicalHistoryService, MODULE_LABELS } from "@/services/clinicalHistoryService";

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

  // Sincronizar filtro quando abrir com módulo padrão
  useEffect(() => {
    if (isOpen) {
      setActiveFilter(defaultModuleFilter);
    }
  }, [isOpen, defaultModuleFilter]);

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

  function handleDelete(id, e) {
    e.stopPropagation();
    if (window.confirm("Deseja realmente remover este registro do seu histórico?")) {
      clinicalHistoryService.deleteActivity(id);
      loadActivities();
    }
  }

  if (!isOpen) return null;

  const displayTitle = title || (lockModuleFilter && defaultModuleFilter !== "all" && MODULE_LABELS[defaultModuleFilter]
    ? `Histórico: ${MODULE_LABELS[defaultModuleFilter]}`
    : "Histórico de Casos & Prática Clínica");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 via-white to-teal-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{displayTitle}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {stats.total} {stats.total === 1 ? "registro" : "registros"}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lockModuleFilter
                  ? "Atividades e rascunhos exclusivos deste módulo. Retome seu progresso ou veja o resultado."
                  : "Acompanhe o tempo de resolução, status de envio e retome atividades a qualquer momento."}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumo Rápido de Métricas */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total do Módulo</span>
            <strong className="text-slate-900 dark:text-slate-100 text-sm font-black">{stats.total}</strong>
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-emerald-700 dark:text-emerald-400 block text-[10px] uppercase font-bold">Concluídos (100%)</span>
            <strong className="text-emerald-700 dark:text-emerald-400 text-sm font-black">{stats.completedCount}</strong>
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-amber-700 dark:text-amber-400 block text-[10px] uppercase font-bold">Em Andamento</span>
            <strong className="text-amber-700 dark:text-amber-400 text-sm font-black">{stats.inProgressCount}</strong>
          </div>
        </div>

        {/* Barra de Filtros (Aparece somente quando lockModuleFilter não estiver travado) */}
        {!lockModuleFilter && (
          <div className="px-4 sm:px-6 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: "all", label: "Todas as Atividades" },
              { id: "sbar", label: "Passagem SBAR" },
              { id: "case_builder", label: "Montador de Casos" },
              { id: "case_simulator", label: "Simulador de Casos" },
              { id: "dosage", label: "Cálculo de Doses" },
              { id: "systems_assessment", label: "Semiologia" },
            ].map((flt) => (
              <button
                key={flt.id}
                onClick={() => setActiveFilter(flt.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  activeFilter === flt.id
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {flt.label}
              </button>
            ))}
          </div>
        )}

        {/* Lista de Atividades com Rolagem */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {activities.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Hourglass className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Nenhuma atividade encontrada neste filtro
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Inicie um caso clínico, monte um perfil ou realize uma passagem SBAR. Todas as suas práticas ficarão salvas automaticamente aqui!
              </p>
            </div>
          ) : (
            activities.map((act) => {
              const isCompleted = act.status === "concluido";
              const dateFormatted = new Date(act.updatedAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={act.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-emerald-300 dark:hover:border-emerald-800 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {act.moduleLabel || "Clínica"}
                      </span>

                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          Concluído (100%)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          Em Andamento ({act.progressPercentage}%)
                        </span>
                      )}

                      {act.score !== null && act.score !== undefined && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                          <Award className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                          Nota: {act.score}/100
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {act.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {act.patientInfo}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {dateFormatted}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Tempo dedicado: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{clinicalHistoryService.formatDuration(act.durationSeconds)}</strong>
                      </span>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCompleted ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                        style={{ width: `${act.progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                    {!isCompleted ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          if (onResumeActivity) onResumeActivity(act);
                          onClose();
                        }}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 flex items-center gap-1.5 shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Entrar de Novo</span>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (onViewEvaluation) onViewEvaluation(act);
                          else if (onResumeActivity) onResumeActivity(act);
                          onClose();
                        }}
                        className="rounded-xl border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold text-xs h-9 px-3.5 flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Ver Resultado</span>
                      </Button>
                    )}

                    <button
                      onClick={(e) => handleDelete(act.id, e)}
                      title="Excluir registro"
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Seu progresso é gravado automaticamente em tempo real.</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-xl font-semibold text-xs"
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
