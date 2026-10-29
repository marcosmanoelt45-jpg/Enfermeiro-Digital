import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  clinicalHistoryService,
  MODULE_TYPES
} from "@/services/clinicalHistoryService";
import {
  Trash2,
  RotateCcw,
  CheckCircle2,
  Calendar,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from "lucide-react";

export default function HistoricoAtividadesTab({ userId = null }) {
  const navigate = useNavigate();

  const [atividades, setAtividades] = useState([]);
  const [filtroModulo, setFiltroModulo] = useState("all");
  const [filtroSituacao, setFiltroSituacao] = useState("all"); // 'all' | 'erradas' | 'acertos'
  const [expandedId, setExpandedId] = useState(null);

  // Controle do Modal de Dupla Verificação para Exclusão
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);
  const [passoExclusao, setPassoExclusao] = useState(1);

  const carregarHistorico = () => {
    const list = clinicalHistoryService.getAllActivities("all", userId);
    setAtividades(list);
  };

  useEffect(() => {
    carregarHistorico();
  }, [userId]);

  // Estatísticas calculadas
  const stats = useMemo(() => {
    return clinicalHistoryService.getSummaryStats(userId);
  }, [atividades, userId]);

  // Questões pendentes de revisão
  const questoesRevisao = useMemo(() => {
    return clinicalHistoryService.getQuestoesRevisao(userId);
  }, [atividades, userId]);

  // Filtragem das atividades
  const atividadesFiltradas = useMemo(() => {
    return atividades.filter((item) => {
      // Filtro de Módulo
      if (filtroModulo !== "all" && item.moduleType !== filtroModulo) {
        return false;
      }
      // Filtro de Situação
      if (filtroSituacao === "erradas") {
        const temErradas =
          (item.details?.amarelas || 0) > 0 || (item.details?.vermelhas || 0) > 0 || (item.score || 0) < 100;
        if (!temErradas) return false;
      } else if (filtroSituacao === "acertos") {
        if ((item.score || 0) < 100) return false;
      }
      return true;
    });
  }, [atividades, filtroModulo, filtroSituacao]);

  // Exclusão com dupla verificação
  const handleConfirmarExclusao = () => {
    clinicalHistoryService.limparTodoHistorico(userId);
    setModalExclusaoAberto(false);
    setPassoExclusao(1);
    carregarHistorico();
  };

  // Iniciar sessão com questões erradas
  const handlePraticarErradas = () => {
    navigate("/videochamada?tela=intro&modo=revisao");
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Cards de Métricas do Histórico */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-3.5 text-center">
          <span className="text-xl sm:text-2xl font-black text-white block">
            {stats.total}
          </span>
          <span className="text-[11px] font-bold text-[#9FB3C6] uppercase">
            Sessões Realizadas
          </span>
        </div>
        <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-3.5 text-center">
          <span className="text-xl sm:text-2xl font-black text-[#20D5B5] block">
            {stats.totalAcertos}
          </span>
          <span className="text-[11px] font-bold text-[#9FB3C6] uppercase">
            Total de Acertos
          </span>
        </div>
        <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-3.5 text-center">
          <span className="text-xl sm:text-2xl font-black text-[#FFC247] block">
            {stats.totalAmarelas}
          </span>
          <span className="text-[11px] font-bold text-[#9FB3C6] uppercase">
            1º Erro (Amarelas)
          </span>
        </div>
        <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-3.5 text-center">
          <span className="text-xl sm:text-2xl font-black text-[#F25F5C] block">
            {stats.totalVermelhas}
          </span>
          <span className="text-[11px] font-bold text-[#9FB3C6] uppercase">
            Revisões (Vermelhas)
          </span>
        </div>
      </div>

      {/* Barra de Ações Rápidas: Praticar Erradas & Limpar Histórico */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-[#0E1722] border border-[#1F3045]">
        <div className="flex items-center gap-2">
          {questoesRevisao.length > 0 ? (
            <button
              type="button"
              onClick={handlePraticarErradas}
              className="px-4 py-2 rounded-xl bg-[#F25F5C]/15 border border-[#F25F5C]/40 text-xs font-black text-white hover:bg-[#F25F5C]/25 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-4 h-4 text-[#F25F5C]" />
              Refazer {questoesRevisao.length} Questões Erradas
            </button>
          ) : (
            <span className="text-xs text-[#20D5B5] font-bold flex items-center gap-1.5 px-2">
              <CheckCircle2 className="w-4 h-4" /> Nenhuma questão pendente de revisão
            </span>
          )}
        </div>

        {atividades.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setPassoExclusao(1);
              setModalExclusaoAberto(true);
            }}
            className="px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ml-auto"
            title="Excluir histórico de atividades"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Limpar Histórico
          </button>
        )}
      </div>

      {/* Filtros Horizontais por Módulo e Situação (Estilo Plurall / TRT-4) */}
      <div className="space-y-2">
        {/* Filtro por Módulo */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
          <span className="text-[11px] font-mono font-bold text-[#9FB3C6] uppercase px-1">
            Módulo:
          </span>
          <button
            type="button"
            onClick={() => setFiltroModulo("all")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filtroModulo === "all"
                ? "bg-[#20D5B5] text-[#0E1722]"
                : "bg-[#131F2E] border border-[#1F3045] text-[#9FB3C6] hover:text-white"
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setFiltroModulo(MODULE_TYPES.VIDEOCHAMADA)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filtroModulo === MODULE_TYPES.VIDEOCHAMADA
                ? "bg-[#20D5B5] text-[#0E1722]"
                : "bg-[#131F2E] border border-[#1F3045] text-[#9FB3C6] hover:text-white"
            }`}
          >
            Videochamada
          </button>
          <button
            type="button"
            onClick={() => setFiltroModulo(MODULE_TYPES.DOSAGE)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filtroModulo === MODULE_TYPES.DOSAGE
                ? "bg-[#20D5B5] text-[#0E1722]"
                : "bg-[#131F2E] border border-[#1F3045] text-[#9FB3C6] hover:text-white"
            }`}
          >
            Cálculo de Doses
          </button>
          <button
            type="button"
            onClick={() => setFiltroModulo(MODULE_TYPES.SBAR)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filtroModulo === MODULE_TYPES.SBAR
                ? "bg-[#20D5B5] text-[#0E1722]"
                : "bg-[#131F2E] border border-[#1F3045] text-[#9FB3C6] hover:text-white"
            }`}
          >
            Plantão SBAR
          </button>
          <button
            type="button"
            onClick={() => setFiltroModulo(MODULE_TYPES.CASE_SIMULATOR)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filtroModulo === MODULE_TYPES.CASE_SIMULATOR
                ? "bg-[#20D5B5] text-[#0E1722]"
                : "bg-[#131F2E] border border-[#1F3045] text-[#9FB3C6] hover:text-white"
            }`}
          >
            Casos Clínicos
          </button>
        </div>

        {/* Filtro por Situação */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
          <span className="text-[11px] font-mono font-bold text-[#9FB3C6] uppercase px-1">
            Status:
          </span>
          <button
            type="button"
            onClick={() => setFiltroSituacao("all")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filtroSituacao === "all"
                ? "bg-[#20D5B5] text-[#0E1722]"
                : "bg-[#131F2E] border border-[#1F3045] text-[#9FB3C6] hover:text-white"
            }`}
          >
            Todas as Sessões
          </button>
          <button
            type="button"
            onClick={() => setFiltroSituacao("erradas")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filtroSituacao === "erradas"
                ? "bg-[#F25F5C] text-white"
                : "bg-[#131F2E] border border-[#1F3045] text-[#9FB3C6] hover:text-white"
            }`}
          >
            Com Erros / Para Revisão
          </button>
          <button
            type="button"
            onClick={() => setFiltroSituacao("acertos")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filtroSituacao === "acertos"
                ? "bg-[#20D5B5]/20 border border-[#20D5B5] text-[#20D5B5]"
                : "bg-[#131F2E] border border-[#1F3045] text-[#9FB3C6] hover:text-white"
            }`}
          >
            Apenas 100% Acertos
          </button>
        </div>
      </div>

      {/* Lista de Atividades Registradas (Somente Leitura) */}
      <div className="space-y-3">
        {atividadesFiltradas.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-[#1F3045] bg-[#0E1722] text-center text-sm text-[#9FB3C6]">
            Nenhuma atividade encontrada para os filtros selecionados.
          </div>
        ) : (
          atividadesFiltradas.map((item) => {
            const isExpanded = expandedId === item.id;
            const details = item.details || {};
            const questoes = details.questoes || [];

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-[#1F3045] bg-[#0E1722] p-4 transition hover:border-[#27394B]"
              >
                <div
                  className="flex items-start justify-between gap-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#131F2E] border border-[#27394B] text-[#20D5B5]">
                        {item.moduleLabel || "Clínica"}
                      </span>
                      <span className="text-xs text-[#9FB3C6] flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5" />
                        {item.dataDisplay || new Date(item.finishedAt || item.updatedAt).toLocaleDateString("pt-BR")}
                        {" · "}
                        {item.horaDisplay || new Date(item.finishedAt || item.updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-white truncate">
                      {item.title}
                    </h3>

                    <p className="text-xs text-[#9FB3C6] mt-0.5">
                      {item.patientInfo}
                      {item.durationSeconds > 0 && ` · Duração: ${clinicalHistoryService.formatDuration(item.durationSeconds)}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-1 rounded-xl border ${
                        (item.score ?? 100) >= 80
                          ? "bg-[#20D5B5]/15 border-[#20D5B5]/40 text-[#20D5B5]"
                          : (item.score ?? 100) >= 50
                          ? "bg-[#FFC247]/15 border-[#FFC247]/40 text-[#FFC247]"
                          : "bg-[#F25F5C]/15 border-[#F25F5C]/40 text-[#F25F5C]"
                      }`}
                    >
                      {item.score ?? 100}%
                    </span>
                    <button
                      type="button"
                      className="p-1 rounded-lg text-[#9FB3C6] hover:text-white transition"
                      aria-label="Ver detalhes da sessão"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Acordeão de Detalhes da Sessão (Somente Leitura) */}
                {isExpanded && (
                  <div className="mt-3.5 pt-3.5 border-t border-[#1F3045] space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-xs text-[#9FB3C6] font-mono">
                      <span>Detalhes da Sessão: {questoes.length} questões registradas</span>
                      <span className="text-[#20D5B5]">Modo Somente Leitura</span>
                    </div>

                    {questoes.length > 0 ? (
                      <div className="space-y-2">
                        {questoes.map((q, qIdx) => (
                          <div
                            key={qIdx}
                            className="p-3 rounded-xl border border-[#1F3045] bg-[#131F2E] text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono font-bold text-white">
                                Questão {q.numQuestao || qIdx + 1}
                              </span>
                              {q.status === "verde" && (
                                <span className="text-[#20D5B5] font-bold text-[10px] bg-[#20D5B5]/15 px-2 py-0.5 rounded-full">
                                  ✓ Acerto de 1ª
                                </span>
                              )}
                              {q.status === "amarela" && (
                                <span className="text-[#FFC247] font-bold text-[10px] bg-[#FFC247]/15 px-2 py-0.5 rounded-full">
                                  ⚠ 1º Erro (Amarela)
                                </span>
                              )}
                              {q.status === "vermelha" && (
                                <span className="text-[#F25F5C] font-bold text-[10px] bg-[#F25F5C]/15 px-2 py-0.5 rounded-full">
                                  ✗ 2º Erro (Revisão)
                                </span>
                              )}
                            </div>

                            <p className="text-white font-medium">{q.pergunta}</p>

                            <div className="text-[11px] text-[#9FB3C6] pt-1">
                              <div>
                                <b className="text-white">Gabarito:</b> {q.gabaritoTexto || "Conforme protocolo"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#9FB3C6]">
                        {item.evaluation || "Sessão concluída com conformidade assistencial."}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Dupla Verificação para Exclusão do Histórico */}
      {modalExclusaoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0E1722] border border-rose-500/40 rounded-3xl p-6 text-[#EAF2F8] shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  {passoExclusao === 1 ? "Excluir todo o histórico?" : "Confirmação Final (Passo 2 de 2)"}
                </h3>
                <span className="text-xs text-rose-400/90 font-semibold">
                  Ação Irreversível
                </span>
              </div>
            </div>

            {passoExclusao === 1 ? (
              <p className="text-xs sm:text-sm text-[#9FB3C6] leading-relaxed">
                Você está prestes a apagar permanentemente todas as tentativas, notas, tempos e questões registradas no seu histórico. Deseja continuar para a confirmação final?
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-white font-bold leading-relaxed bg-rose-500/10 p-3 rounded-xl border border-rose-500/30">
                Atenção: Ao clicar em &quot;Confirmar e Excluir Definitivamente&quot;, todo o seu histórico será zerado imediatamente sem possibilidade de recuperação.
              </p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setModalExclusaoAberto(false);
                  setPassoExclusao(1);
                }}
                className="px-4 py-2 rounded-xl border border-[#27394B] text-xs font-bold text-[#9FB3C6] hover:text-white transition cursor-pointer"
              >
                Cancelar
              </button>

              {passoExclusao === 1 ? (
                <button
                  type="button"
                  onClick={() => setPassoExclusao(2)}
                  className="px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 text-xs font-bold transition cursor-pointer"
                >
                  Continuar (1/2)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmarExclusao}
                  className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black transition shadow-lg cursor-pointer"
                >
                  Confirmar e Excluir Definitivamente
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
