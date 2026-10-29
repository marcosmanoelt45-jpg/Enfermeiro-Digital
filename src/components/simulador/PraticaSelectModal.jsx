import React, { useState, useMemo } from "react";
import {
  X,
  Search,
  Zap,
  BookOpen,
  RotateCcw,
  Sparkles,
  ChevronRight,
  CheckCircle2
} from "lucide-react";

export const TOPICOS_PRATICA = [
  {
    id: "calculo",
    titulo: "Cálculo de Medicamentos",
    descricao: "Regras de três, gotejamento (macrogotas/microgotas) e vazão em BIC",
    tags: ["cálc", "calculo", "medicamento", "dose", "gotejamento", "bic", "solucao", "soro"],
    badge: "Farmacologia"
  },
  {
    id: "curativo",
    titulo: "Curativos e Lesões por Pressão",
    descricao: "Estadiamento NPUAP, técnica asséptica, coberturas e desbridamento",
    tags: ["curat", "curativo", "ferida", "pressao", "npuap", "lesao", "pele", "estagio", "braden"],
    badge: "Cirúrgica"
  },
  {
    id: "acesso_venoso",
    titulo: "Punção Venosa e Flebite",
    descricao: "Terapia infusional, escalas da INS, técnica push-pause e complicações",
    tags: ["punc", "puncao", "venosa", "flebite", "acesso", "cateter", "ins", "veia", "infiltracao"],
    badge: "Terapia EV"
  },
  {
    id: "farmaco",
    titulo: "Farmacologia Clínica e Diluições",
    descricao: "Reconstituição, estabilidade, vias de administração e segurança do paciente",
    tags: ["farm", "farmaco", "diluicao", "antibiotico", "ampola", "reconstituicao"],
    badge: "Medicamentos"
  },
  {
    id: "sinais_vitais",
    titulo: "Sinais Vitais e Semiologia",
    descricao: "Parâmetros hemodinâmicos, saturação, pulsos periféricos e perfusão",
    tags: ["sin", "sinais", "vitais", "pa", "pressao", "temperatura", "spo2", "pulso"],
    badge: "Semiologia"
  },
  {
    id: "todos",
    titulo: "Geral (Todos os Temas Clínicos)",
    descricao: "Simulação ampla integrando casos cirúrgicos e de clínica médica",
    tags: ["geral", "todos", "completo", "atendimento", "misto"],
    badge: "Intensivo"
  }
];

export default function PraticaSelectModal({
  isOpen,
  onClose,
  onStartSession,
  questoesRevisaoCount = 0
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [topicoSelecionado, setTopicoSelecionado] = useState(null);

  // Filtro inteligente de sugestões preditivas
  const sugestoes = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return TOPICOS_PRATICA;
    return TOPICOS_PRATICA.filter(
      (t) =>
        t.titulo.toLowerCase().includes(term) ||
        t.descricao.toLowerCase().includes(term) ||
        t.tags.some((tag) => tag.includes(term) || term.includes(tag))
    );
  }, [searchTerm]);

  if (!isOpen) return null;

  function handleSelectTopico(topico) {
    setTopicoSelecionado(topico);
    setSearchTerm(topico.titulo);
  }

  function handleStart(mode) {
    const categoria = topicoSelecionado ? topicoSelecionado.id : "todos";
    onStartSession({
      mode,
      categoria,
      topicoNome: topicoSelecionado?.titulo || "Geral"
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-[#0E1722] border border-[#1F3045] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 text-[#EAF2F8] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pratica-modal-title"
      >
        {/* Topo do Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1F3045]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#20D5B5]/15 border border-[#20D5B5]/30 flex items-center justify-center text-[#20D5B5]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="pratica-modal-title" className="text-base sm:text-lg font-black text-white">
                O que você quer praticar hoje?
              </h2>
              <p className="text-xs text-[#9FB3C6]">
                Escolha o tema e a intensidade da sua sessão de estudos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#9FB3C6] hover:text-white hover:bg-[#16222E] transition cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Campo de Busca Preditiva (Autocomplete) */}
        <div className="py-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9FB3C6]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (topicoSelecionado && e.target.value !== topicoSelecionado.titulo) {
                  setTopicoSelecionado(null);
                }
              }}
              placeholder="Digite o tema (ex: Cálc, Curativo, Punção...)"
              className="w-full pl-11 pr-4 py-3 bg-[#131F2E] border border-[#27394B] rounded-2xl text-sm font-semibold text-white placeholder-[#9FB3C6]/60 focus:outline-hidden focus:border-[#20D5B5] focus:ring-1 focus:ring-[#20D5B5] transition shadow-inner"
              autoFocus
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setTopicoSelecionado(null);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9FB3C6] hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Conteúdo Dinâmico: Lista de Sugestões ou Modos de Atividade */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Se ainda não selecionou um tópico ou está pesquisando */}
          {!topicoSelecionado && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#9FB3C6] uppercase tracking-wider px-1">
                Sugestões Automáticas
              </span>
              <div className="space-y-1.5">
                {sugestoes.map((topico) => (
                  <button
                    key={topico.id}
                    type="button"
                    onClick={() => handleSelectTopico(topico)}
                    className="w-full text-left p-3 rounded-2xl bg-[#131F2E] hover:bg-[#16222E] border border-[#1F3045] hover:border-[#20D5B5]/50 transition flex items-center justify-between group cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-[#20D5B5] transition truncate">
                          {topico.titulo}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1F3045] text-[#9FB3C6]">
                          {topico.badge}
                        </span>
                      </div>
                      <p className="text-xs text-[#9FB3C6] truncate mt-0.5">
                        {topico.descricao}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#9FB3C6] group-hover:text-[#20D5B5] group-hover:translate-x-0.5 transition shrink-0" />
                  </button>
                ))}
                {sugestoes.length === 0 && (
                  <div className="text-center py-6 text-sm text-[#9FB3C6]">
                    Nenhum tema encontrado para &quot;{searchTerm}&quot;.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Painel de Modos de Atividade exibido ao selecionar o tópico */}
          {topicoSelecionado && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-[#20D5B5] uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Tema selecionado: {topicoSelecionado.titulo}
                </span>
                <button
                  type="button"
                  onClick={() => setTopicoSelecionado(null)}
                  className="text-xs text-[#9FB3C6] hover:text-white underline cursor-pointer"
                >
                  Trocar tema
                </button>
              </div>

              {/* Botão 1: Atividade Rápida */}
              <button
                type="button"
                onClick={() => handleStart("rapida")}
                className="w-full text-left p-4 rounded-2xl bg-[#131F2E] hover:bg-[#1A293D] border border-[#27394B] hover:border-[#20D5B5] transition group shadow-sm flex items-center gap-3.5 cursor-pointer"
              >
                <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Zap className="w-6 h-6 fill-amber-400/20" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white group-hover:text-[#20D5B5] transition">
                      Atividade Rápida
                    </h3>
                    <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                      4 a 6 questões
                    </span>
                  </div>
                  <p className="text-xs text-[#9FB3C6] mt-0.5">
                    Ideal para pausas curtas, revisão expressa e fixação de conceitos-chave.
                  </p>
                </div>
              </button>

              {/* Botão 2: Atividade Normal */}
              <button
                type="button"
                onClick={() => handleStart("normal")}
                className="w-full text-left p-4 rounded-2xl bg-[#131F2E] hover:bg-[#1A293D] border border-[#27394B] hover:border-[#20D5B5] transition group shadow-sm flex items-center gap-3.5 cursor-pointer"
              >
                <div className="w-11 h-11 rounded-xl bg-[#20D5B5]/15 border border-[#20D5B5]/30 flex items-center justify-center text-[#20D5B5] shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white group-hover:text-[#20D5B5] transition">
                      Atividade Normal
                    </h3>
                    <span className="text-xs font-bold text-[#20D5B5] bg-[#20D5B5]/10 px-2 py-0.5 rounded-full border border-[#20D5B5]/20">
                      7 a 9 questões
                    </span>
                  </div>
                  <p className="text-xs text-[#9FB3C6] mt-0.5">
                    Simulação clínica aprofundada com raciocínio diagnóstico e farmacologia.
                  </p>
                </div>
              </button>

              {/* Botão 3: Revisão (Só amarelas e vermelhas) */}
              <button
                type="button"
                onClick={() => handleStart("revisao")}
                className="w-full text-left p-4 rounded-2xl bg-[#131F2E] hover:bg-[#1A293D] border border-[#27394B] hover:border-[#F25F5C] transition group shadow-sm flex items-center gap-3.5 cursor-pointer"
              >
                <div className="w-11 h-11 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white group-hover:text-rose-400 transition">
                      Revisão Focada
                    </h3>
                    <span className="text-xs font-bold text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded-full border border-rose-400/20">
                      {questoesRevisaoCount > 0 ? `${questoesRevisaoCount} pendentes` : "Só Amarelas e Vermelhas"}
                    </span>
                  </div>
                  <p className="text-xs text-[#9FB3C6] mt-0.5">
                    Refaça exclusivamente as questões com 1º ou 2º erro para consolidar o aprendizado.
                  </p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
