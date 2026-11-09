import React, { useEffect, useState } from "react";
import {
  Trophy,
  RotateCcw,
  Home,
  ChevronDown,
  ChevronUp,
  Sparkles
} from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { AnimatedProgress } from "@/components/ui/animated-progress";
import { celebrate } from "@/lib/celebrate";

export default function RevisaoFinalModal({
  isOpen,
  resumo,
  onRefazerErradas,
  onNovaPratica,
  onVoltarHub,
  celebrar = true
}) {
  const [filtroSituacao, setFiltroSituacao] = useState("todas"); // 'todas' | 'acertos' | 'amarelas' | 'vermelhas' | 'erradas'
  const [expandedQuestao, setExpandedQuestao] = useState(null);
  // Os números contam a partir de 0 a cada abertura.
  const [mostrar, setMostrar] = useState(false);
  const taxa = Number(resumo?.aproveitamento) || 0;

  useEffect(() => {
    if (!isOpen) {
      setMostrar(false);
      return undefined;
    }
    const t = setTimeout(() => setMostrar(true), 150);
    // Confete só quando a sessão passa de 70% (momento raro).
    if (celebrar && taxa >= 70) celebrate({ count: 60, y: 0.35 });
    return () => clearTimeout(t);
  }, [isOpen, taxa, celebrar]);

  // Cada abertura começa limpa; a página de trás não rola e Esc leva a uma nova prática.
  useEffect(() => {
    if (!isOpen) return undefined;
    setFiltroSituacao("todas");
    setExpandedQuestao(null);
    const overflowAntes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onNovaPratica?.();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflowAntes;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onNovaPratica]);

  if (!isOpen || !resumo) return null;

  const {
    totalQuestoes = 0,
    acertos = 0,
    amarelas = 0,
    vermelhas = 0,
    aproveitamento = 0,
    tempoTotal = 0,
    questoes = []
  } = resumo;

  const questoesFiltradas = questoes.filter((q) => {
    if (filtroSituacao === "erradas") return q.status === "amarela" || q.status === "vermelha";
    if (filtroSituacao === "amarelas") return q.status === "amarela";
    if (filtroSituacao === "vermelhas") return q.status === "vermelha";
    if (filtroSituacao === "acertos") return q.status === "verde";
    return true;
  });

  const totalErradas = amarelas + vermelhas;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Resumo do atendimento"
        className="w-full max-w-2xl bg-[#0E1722] border border-[#1F3045] rounded-3xl p-5 sm:p-7 text-[#EAF2F8] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto"
      >
        {/* Cabeçalho do Resumo */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-[#1F3045]">
          <div className="w-12 h-12 rounded-2xl bg-[#20D5B5]/15 border border-[#20D5B5]/30 flex items-center justify-center text-[#20D5B5] shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              Atendimento Concluído!
            </h2>
            <p className="text-xs text-[#9FB3C6]">
              {tempoTotal > 0
                ? `Tempo: ${String(Math.floor(tempoTotal / 60)).padStart(2, "0")}:${String(Math.round(tempoTotal % 60)).padStart(2, "0")} · revise questão por questão`
                : "Revise o seu desempenho questão por questão"}
            </p>
          </div>
        </div>

        {/* Grid de Estatísticas Gerais */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-4">
          <div className="p-3 rounded-2xl bg-[#131F2E] border border-[#1F3045] text-center">
            <span className="text-xl sm:text-2xl font-black text-[#20D5B5] block">
              <AnimatedNumber value={mostrar ? acertos : 0} />
            </span>
            <span className="text-[11px] font-bold text-[#9FB3C6] uppercase">
              Acertou de primeira
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[#131F2E] border border-[#1F3045] text-center">
            <span className="text-xl sm:text-2xl font-black text-[#FFC247] block">
              <AnimatedNumber value={mostrar ? amarelas : 0} />
            </span>
            <span className="text-[11px] font-bold text-[#9FB3C6] uppercase">
              Acertou de segunda
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[#131F2E] border border-[#1F3045] text-center">
            <span className="text-xl sm:text-2xl font-black text-[#F25F5C] block">
              <AnimatedNumber value={mostrar ? vermelhas : 0} />
            </span>
            <span className="text-[11px] font-bold text-[#9FB3C6] uppercase">
              Errou
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[#131F2E] border border-[#1F3045] text-center">
            <span className="text-xl sm:text-2xl font-black text-white block">
              <AnimatedNumber value={mostrar ? aproveitamento : 0} />%
            </span>
            <span className="text-[11px] font-bold text-[#9FB3C6] uppercase">
              Aproveitamento
            </span>
            <AnimatedProgress
              value={mostrar ? aproveitamento : 0}
              tone={aproveitamento >= 70 ? "success" : "brand"}
              label="Aproveitamento da sessão"
              className="mt-2 h-1.5"
            />
          </div>
        </div>

        {/* Filtros da Revisão (Estilo TRT-4 / Plurall) */}
        <div className="flex items-center gap-2 pb-3 overflow-x-auto scrollbar-none">
          <span className="text-xs font-mono font-bold text-[#9FB3C6] uppercase mr-1">
            Filtrar:
          </span>
          <button
            type="button"
            onClick={() => setFiltroSituacao("todas")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              filtroSituacao === "todas"
                ? "bg-[#20D5B5] text-[#0E1722]"
                : "bg-[#131F2E] border border-[#1F3045] text-[#9FB3C6] hover:text-white"
            }`}
          >
            Todas ({totalQuestoes})
          </button>
          <button
            type="button"
            onClick={() => setFiltroSituacao("acertos")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              filtroSituacao === "acertos"
                ? "bg-[#20D5B5]/20 border border-[#20D5B5] text-[#20D5B5]"
                : "bg-[#131F2E] border border-[#1F3045] text-[#9FB3C6] hover:text-white"
            }`}
          >
            Acertos ({acertos})
          </button>
          <button
            type="button"
            onClick={() => setFiltroSituacao("amarelas")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              filtroSituacao === "amarelas"
                ? "bg-[#FFC247]/20 border border-[#FFC247] text-[#FFC247]"
                : "bg-[#131F2E] border border-[#1F3045] text-[#9FB3C6] hover:text-white"
            }`}
          >
            Amarelas ({amarelas})
          </button>
          <button
            type="button"
            onClick={() => setFiltroSituacao("vermelhas")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              filtroSituacao === "vermelhas"
                ? "bg-[#F25F5C]/20 border border-[#F25F5C] text-[#F25F5C]"
                : "bg-[#131F2E] border border-[#1F3045] text-[#9FB3C6] hover:text-white"
            }`}
          >
            Vermelhas ({vermelhas})
          </button>
        </div>

        {/* Lista de Questões com Revisão Detalhada */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {questoesFiltradas.map((q, idx) => {
            // Chave estável pelo número da questão: trocar o filtro não abre outra linha.
            const chave = q.numQuestao ?? idx;
            const isExpanded = expandedQuestao === chave;
            return (
              <div
                key={chave}
                className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-3.5 sm:p-4 transition hover:border-[#27394B]"
              >
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  className="w-full text-left flex items-start justify-between gap-3 cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#20D5B5]"
                  onClick={() => setExpandedQuestao(isExpanded ? null : chave)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-[#9FB3C6]">
                        Questão {q.numQuestao || idx + 1}
                      </span>
                      {q.status === "verde" && (
                        <span className="text-[10px] font-bold text-[#20D5B5] bg-[#20D5B5]/15 border border-[#20D5B5]/30 px-2 py-0.5 rounded-full">
                          Acerto
                        </span>
                      )}
                      {q.status === "amarela" && (
                        <span className="text-[10px] font-bold text-[#FFC247] bg-[#FFC247]/15 border border-[#FFC247]/30 px-2 py-0.5 rounded-full">
                          Acertou de segunda
                        </span>
                      )}
                      {q.status === "vermelha" && (
                        <span className="text-[10px] font-bold text-[#F25F5C] bg-[#F25F5C]/15 border border-[#F25F5C]/30 px-2 py-0.5 rounded-full">
                          Errou
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-white line-clamp-2">
                      {q.pergunta}
                    </p>
                  </div>
                  <span className="p-1 rounded-lg text-[#9FB3C6] shrink-0" aria-hidden="true">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </button>

                {/* Acordeão de Revisão da Questão */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-[#1F3045] space-y-3 animate-in fade-in duration-200">
                    <div className="text-[11px] font-bold text-[#9FB3C6] uppercase tracking-wider">
                      Análise Alternativa por Alternativa
                    </div>
                    <div className="space-y-2">
                      {(q.explicacaoAlternativas || []).map((alt, aIdx) => (
                        <div
                          key={aIdx}
                          className={`p-2.5 rounded-xl border text-xs leading-relaxed ${
                            alt.isCorreta
                              ? "bg-[#20D5B5]/10 border-[#20D5B5]/40"
                              : "bg-[#0E1722] border-[#1F3045]"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span
                              className={`font-mono font-bold px-1.5 py-0.5 rounded-sm text-[10px] ${
                                alt.isCorreta
                                  ? "bg-[#20D5B5] text-[#0E1722]"
                                  : "bg-[#F25F5C]/20 text-[#F25F5C]"
                              }`}
                            >
                              {alt.letra}
                            </span>
                            {alt.isCorreta ? (
                              <span className="font-bold text-[#20D5B5] uppercase text-[10px]">
                                Correta
                              </span>
                            ) : (
                              <span className="font-bold text-[#F25F5C] uppercase text-[10px]">
                                Incorreta
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#EAF2F8]">{alt.explicacao}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Rodapé com Ações */}
        <div className="pt-4 border-t border-[#1F3045] flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onVoltarHub}
            className="px-4 py-2.5 rounded-xl border border-[#27394B] bg-[#131F2E] hover:bg-[#16222E] text-xs font-bold text-[#9FB3C6] hover:text-white transition flex items-center gap-1.5 cursor-pointer"
          >
            <Home className="w-4 h-4" /> Voltar ao Início
          </button>

          <div className="flex items-center gap-2">
            {totalErradas > 0 && (
              <button
                type="button"
                onClick={onRefazerErradas}
                className="px-4 py-2.5 rounded-xl border border-[#F25F5C]/40 bg-[#F25F5C]/15 hover:bg-[#F25F5C]/25 text-xs font-black text-white transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-[#F25F5C]" /> Refazer Só Erradas ({totalErradas})
              </button>
            )}

            <button
              type="button"
              onClick={onNovaPratica}
              className="px-5 py-2.5 rounded-xl bg-[#20D5B5] hover:bg-[#20D5B5]/90 text-[#0E1722] font-black text-xs sm:text-sm transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" /> Nova Prática
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
