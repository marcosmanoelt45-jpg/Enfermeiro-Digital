import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  clinicalHistoryService,
  MODULE_TYPES,
  MODULE_LABELS
} from "@/services/clinicalHistoryService";
import {
  Trash2,
  RotateCcw,
  CheckCircle2,
  Calendar,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/ui/animated-number";

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

  // Filtragem das atividades (profile-9: exclui rascunhos de erradas e acertos)
  const atividadesFiltradas = useMemo(() => {
    return atividades.filter((item) => {
      // Filtro de Módulo
      if (filtroModulo !== "all" && item.moduleType !== filtroModulo) {
        return false;
      }
      // Rascunhos em andamento não entram em erradas nem em acertos puros
      if (item.status === "em_andamento") {
        if (filtroSituacao === "erradas" || filtroSituacao === "acertos") return false;
        return true;
      }
      // Filtro de Situação para concluídos
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

  // Navegar para retomar rascunho
  const handleResumeActivity = (item, e) => {
    e.stopPropagation();
    if (item.moduleType === MODULE_TYPES.VIDEOCHAMADA) {
      navigate("/videochamada");
    } else if (item.moduleType === MODULE_TYPES.DOSAGE) {
      navigate("/calculo-medicamentos");
    } else if (item.moduleType === MODULE_TYPES.SBAR) {
      navigate("/sbar");
    } else if (item.moduleType === MODULE_TYPES.CASE_SIMULATOR) {
      navigate("/simulador");
    } else if (item.moduleType === MODULE_TYPES.PROCEDURES) {
      navigate("/procedimentos");
    } else {
      navigate("/casos");
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Cards de Métricas do Histórico com AnimatedNumber (profile-9 & redesign) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-3.5 text-center">
          <span className="text-xl sm:text-2xl font-black text-white block">
            <AnimatedNumber value={stats.completedCount} />
          </span>
          <span className="text-[11px] font-bold text-[#9FB3C6] uppercase">
            Sessões Concluídas
          </span>
        </div>
        <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-3.5 text-center">
          <span className="text-xl sm:text-2xl font-black text-[#20D5B5] block">
            <AnimatedNumber value={stats.totalAcertos} />
          </span>
          <span className="text-[11px] font-bold text-[#9FB3C6] uppercase">
            Total de Acertos
          </span>
        </div>
        <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-3.5 text-center">
          <span className="text-xl sm:text-2xl font-black text-[#FFC247] block">
            <AnimatedNumber value={stats.totalAmarelas} />
          </span>
          <span className="text-[11px] font-bold text-[#9FB3C6] uppercase">
            1º Erro (Amarelas)
          </span>
        </div>
        <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-3.5 text-center">
          <span className="text-xl sm:text-2xl font-black text-[#FF6B6B] block">
            <AnimatedNumber value={stats.totalVermelhas} />
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
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handlePraticarErradas}
              className="flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Refazer <AnimatedNumber value={questoesRevisao.length} /> Questões Erradas</span>
            </Button>
          ) : (
            <span className="text-xs text-[#20D5B5] font-bold flex items-center gap-1.5 px-2">
              <CheckCircle2 className="w-4 h-4" /> Nenhuma questão pendente de revisão
            </span>
          )}
        </div>

        {atividades.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setPassoExclusao(1);
              setModalExclusaoAberto(true);
            }}
            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 ml-auto"
            title="Excluir histórico de atividades"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar Histórico</span>
          </Button>
        )}
      </div>

      {/* Filtros Horizontais por Módulo e Situação (profile-10 redesign) */}
      <div className="space-y-2">
        {/* Filtro por Módulo com scroll horizontal */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
          <span className="text-[11px] font-mono font-bold text-[#9FB3C6] uppercase px-1 shrink-0">
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
          {Object.entries(MODULE_LABELS).map(([modKey, modLabel]) => (
            <button
              key={modKey}
              type="button"
              onClick={() => setFiltroModulo(modKey)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                filtroModulo === modKey
                  ? "bg-[#20D5B5] text-[#0E1722]"
                  : "bg-[#131F2E] border border-[#1F3045] text-[#9FB3C6] hover:text-white"
              }`}
            >
              {modLabel.split(" ")[0]}
            </button>
          ))}
        </div>

        {/* Filtro por Situação */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
          <span className="text-[11px] font-mono font-bold text-[#9FB3C6] uppercase px-1 shrink-0">
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
                ? "bg-[#FF6B6B] text-white"
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

      {/* Lista de Atividades Registradas */}
      <div className="space-y-3">
        {atividadesFiltradas.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-[#1F3045] bg-[#0E1722] text-center text-sm text-[#9FB3C6]">
            Nenhuma atividade encontrada para os filtros selecionados.
          </div>
        ) : (
          atividadesFiltradas.map((item) => {
            const isExpanded = expandedId === item.id;
            const isDraft = item.status === "em_andamento";
            const details = item.details || {};
            const questoes = details.questoes || [];

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-[#1F3045] bg-[#0E1722] p-4 transition hover:border-[#27394B]"
              >
                {/* Linha de cabeçalho acessível como button (profile-15) */}
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="w-full flex items-start justify-between gap-3 text-left cursor-pointer focus:outline-none"
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

                  {/* Status ou Nota (profile-9: rascunho exibe chip âmbar e botão Continuar) */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isDraft ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl border bg-[#FFC247]/15 border-[#FFC247]/40 text-[#FFC247]">
                          Em andamento · {item.progressPercentage || 0}%
                        </span>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={(e) => handleResumeActivity(item, e)}
                          className="h-7 text-xs"
                        >
                          <Play className="w-3 h-3 mr-1" /> Continuar
                        </Button>
                      </div>
                    ) : (
                      <span
                        className={`text-xs font-mono font-bold px-2.5 py-1 rounded-xl border ${
                          (item.score ?? 100) >= 80
                            ? "bg-[#20D5B5]/15 border-[#20D5B5]/40 text-[#20D5B5]"
                            : (item.score ?? 100) >= 50
                            ? "bg-[#FFC247]/15 border-[#FFC247]/40 text-[#FFC247]"
                            : "bg-[#FF6B6B]/15 border-[#FF6B6B]/40 text-[#FF6B6B]"
                        }`}
                      >
                        {item.score ?? 100}%
                      </span>
                    )}

                    <div className="p-1 rounded-lg text-[#9FB3C6]">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </button>

                {/* Acordeão de Detalhes da Sessão */}
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
                                <span className="text-[#FF6B6B] font-bold text-[10px] bg-[#FF6B6B]/15 px-2 py-0.5 rounded-full">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
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
                  Seus pontos PE e ofensiva continuam salvos
                </span>
              </div>
            </div>

            {passoExclusao === 1 ? (
              <p className="text-xs sm:text-sm text-[#9FB3C6] leading-relaxed">
                Você está prestes a limpar os registros clínicos de tentativas anteriores. Seus Pontos de Estudo (PE) e Ofensiva de dias seguidos NÃO serão perdidos. Deseja prosseguir?
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-white font-bold leading-relaxed bg-rose-500/10 p-3 rounded-xl border border-rose-500/30">
                Atenção: Ao confirmar, todas as sessões do histórico local serão excluídas. Esta ação não poderá ser desfeita.
              </p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setModalExclusaoAberto(false);
                  setPassoExclusao(1);
                }}
              >
                Cancelar
              </Button>

              {passoExclusao === 1 ? (
                <Button
                  type="button"
                  variant="warning"
                  size="sm"
                  onClick={() => setPassoExclusao(2)}
                >
                  Continuar (1/2)
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={handleConfirmarExclusao}
                >
                  Confirmar e Excluir
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
