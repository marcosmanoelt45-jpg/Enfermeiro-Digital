import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Calculator,
  PlusCircle,
  Video,
  ArrowRightLeft,
  Stethoscope,
  ChevronRight,
  Flame,
  Zap,
  Sparkles,
  Search,
  X
} from "lucide-react";
import StudentHeader from "@/components/StudentHeader";
import StudentFooter from "@/components/StudentFooter";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";

import EnfereVivoTrail from "@/components/mobile/EnfereVivoTrail";
import GotiAnimated from "@/components/mascot/GotiAnimated";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { triggerHaptic } = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const cleanUserName = user?.name ? user.name.split(" ")[0] : (user?.full_name ? user.full_name.split(" ")[0] : "Marcos");

  // Módulos sugeridos para a lateral no desktop (Página 2 do PDF)
  const desktopSuggestions = useMemo(() => [
    {
      id: "doses",
      title: "Laboratório de Cálculo de Doses",
      subtitle: "5 min · 4 Modos",
      icon: Calculator,
      action: () => {
        triggerHaptic(15);
        navigate("/laboratorio-calculos");
      }
    },
    {
      id: "sbar",
      title: "Passagem de Plantão SBAR",
      subtitle: "8 min · Preceptoria IA",
      icon: ArrowRightLeft,
      action: () => {
        triggerHaptic(15);
        navigate("/passagem-plantao");
      }
    },
    {
      id: "pops",
      title: "Videoteca de Procedimentos & POPs",
      subtitle: "8 min · Vídeos + Checklists",
      icon: Video,
      action: () => {
        triggerHaptic(15);
        navigate("/procedimentos");
      }
    }
  ], [navigate, triggerHaptic]);

  // Grade de 6 cards oficiais "Praticar" (Página 2 do PDF)
  const practiceCards = useMemo(() => [
    {
      id: "pe_cases",
      title: "Simulador de Casos Clínicos",
      desc: "5 etapas do Processo de Enfermagem com NANDA/NIC/NOC e debriefing formativo.",
      badge: "5 Etapas",
      icon: BookOpen,
      action: () => {
        triggerHaptic(15);
        navigate("/simulador-casos");
      }
    },
    {
      id: "sbar_handoff",
      title: "Passagem de Plantão SBAR",
      desc: "Comunicação interprofissional estruturada com gravação de áudio e feedback.",
      badge: "Preceptoria IA",
      icon: ArrowRightLeft,
      action: () => {
        triggerHaptic(15);
        navigate("/passagem-plantao");
      }
    },
    {
      id: "calc_doses",
      title: "Laboratório de Cálculo de Doses",
      desc: "Gotejamento macrogotas, microgotas, BIC em mL/h e diluições críticas.",
      badge: "4 Modos",
      icon: Calculator,
      action: () => {
        triggerHaptic(15);
        navigate("/laboratorio-calculos");
      }
    },
    {
      id: "case_maker",
      title: "Montador de Casos Clínicos",
      desc: "Construção de pacientes com escores validados (Braden, CAM, CALOI, SAK) e áudio.",
      badge: "Escores + Áudio",
      icon: PlusCircle,
      action: () => {
        triggerHaptic(15);
        navigate("/montar-caso");
      }
    },
    {
      id: "pops_library",
      title: "Videoteca de Procedimentos & POPs",
      desc: "Skills Lab com checklists operacionais, técnica asséptica e chancela hospitalar.",
      badge: "Vídeos + Checklists",
      icon: Video,
      action: () => {
        triggerHaptic(15);
        navigate("/procedimentos");
      }
    },
    {
      id: "semiology",
      title: "Semiologia por Sistemas Orgânicos",
      desc: "Exame físico céfalo-caudal direcionado por radar semiológico (Neuro, Resp, Cardio, Pele).",
      badge: "4 Sistemas",
      icon: Stethoscope,
      action: () => {
        triggerHaptic(15);
        navigate("/simulador-casos?mode=semiology");
      }
    }
  ], [navigate, triggerHaptic]);

  const isSearching = searchQuery.trim().length > 0;
  const filteredPracticeCards = useMemo(() => {
    if (!isSearching) return practiceCards;
    const q = searchQuery.toLowerCase().trim();
    return practiceCards.filter(c => c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q) || c.badge.toLowerCase().includes(q));
  }, [practiceCards, searchQuery, isSearching]);

  return (
    <div className="min-h-screen bg-[#0B131D] flex flex-col text-[#EAF2F8] pb-24 md:pb-12 transition-colors select-none">
      {/* Header Clássico no Desktop */}
      <StudentHeader activeTab="hub" desktopOnly={true} />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* ========================================================================= */}
        {/* VISUALIZAÇÃO MOBILE (1:1 com a Página 2 do PDF)                            */}
        {/* ========================================================================= */}
        <div className="md:hidden">
          <EnfereVivoTrail
            userName={cleanUserName}
            onOpenAIChat={() => {
              triggerHaptic(20);
              window.dispatchEvent(new CustomEvent("open-goti-chat"));
            }}
          />
        </div>

        {/* ========================================================================= */}
        {/* VISUALIZAÇÃO COMPUTADOR (PC / Telas Médias e Grandes)                     */}
        {/* ========================================================================= */}
        <div className="hidden md:block space-y-6">
          {/* Header Superior do Painel PC: Saudação, Mascote Goti, Ofensiva e PE */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#131F2E] border border-[#1F3045] rounded-3xl p-6 shadow-xl relative overflow-hidden">
            {/* Brilho de fundo sutil */}
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-[#20D5B5]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-5 z-10">
              {/* Mascote Goti Animado em Proporção Elegante */}
              <div
                onClick={() => {
                  triggerHaptic(20);
                  window.dispatchEvent(new CustomEvent("open-goti-chat"));
                }}
                className="cursor-pointer group shrink-0 transition-transform hover:scale-105 active:scale-95"
                title="Conversar com o Goti"
              >
                <GotiAnimated
                  animation="wave"
                  size="md"
                  className="w-20 h-20 lg:w-24 lg:h-24 shrink-0 drop-shadow-[0_4px_16px_rgba(32,213,181,0.25)]"
                />
              </div>

              <div>
                <h1 className="text-2xl lg:text-3xl font-black text-[#EAF2F8] tracking-tight">
                  Olá, {cleanUserName}
                </h1>
                <p className="text-sm font-semibold text-[#9FB3C6] mt-0.5">
                  Pronto para a prática clínica hoje?
                </p>
                {/* Meta do Dia no Desktop */}
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-xs font-black text-[#EAF2F8]">Meta do dia:</span>
                  <div className="h-2.5 w-48 bg-[#16222E] border border-[#27394B] rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-[#1FC7B6] to-[#20D5B5] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(32,213,181,0.4)]"
                      style={{ width: "35%" }}
                    />
                  </div>
                  <span className="text-xs font-bold text-[#9FB3C6]">1 de 3 atividades</span>
                </div>
              </div>
            </div>

            {/* Badges de Ofensiva e Pontos de Estudo (PE) */}
            <div className="flex items-center gap-3 z-10 self-start lg:self-center">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#16222E] border border-[#27394B] text-[#FFC247] text-sm font-black shadow-sm">
                <Flame className="w-5 h-5 fill-current text-[#FFC247]" />
                <span>3 dias seguidos</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#16222E] border border-[#27394B] text-[#20D5B5] text-sm font-black shadow-sm">
                <Zap className="w-5 h-5 fill-current text-[#20D5B5]" />
                <span>120 PE</span>
              </div>
            </div>
          </div>

          {/* Grid Principal do PC (2 Colunas: 65% Conteúdo Principal e 35% Lateral) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Coluna Principal da Esquerda (8 Colunas no Desktop) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Card "Continuar de Onde Parou" (Idoso com Insuficiência Cardíaca) */}
              <div className="bg-[#131F2E] rounded-3xl border border-[#1F3045] p-6 shadow-xl space-y-4 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#1E2640] border border-[#2F3E66] text-[#A5B4FC] text-xs font-black tracking-wide">
                    Simulador de Casos Clínicos (PE)
                  </div>
                  <span className="text-xs font-bold text-[#9FB3C6]">Etapa 2 de 5 · 40% concluído</span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-black text-[#20D5B5] uppercase tracking-wider block">
                    CONTINUAR DE ONDE PAROU
                  </span>
                  <h2 className="text-xl font-black text-[#EAF2F8] leading-snug">
                    Idoso com Insuficiência Cardíaca Descompensada
                  </h2>
                  <p className="text-xs font-medium text-[#9FB3C6]">
                    Paciente S. S. (Caso Simulado #101) · 76 anos · M • Leito Enfermaria
                  </p>
                </div>

                {/* Barra de Progresso */}
                <div className="h-2.5 w-full bg-[#16222E] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#20D5B5] rounded-full transition-all duration-300"
                    style={{ width: "40%" }}
                  />
                </div>

                {/* Botão de Ação Primária em Ciano 3D */}
                <div className="pt-1 flex gap-3">
                  <button
                    onClick={() => {
                      triggerHaptic(20);
                      navigate("/simulador-casos");
                    }}
                    className="flex-1 h-12 rounded-2xl bg-[#20D5B5] hover:bg-[#1bc4a6] text-[#06302E] font-black text-sm tracking-wide border-0 border-b-4 border-b-[#149F86] active:translate-y-1 active:border-b-2 transition-all flex items-center justify-center gap-2 select-none shadow-[0_4px_14px_rgba(32,213,181,0.25)] cursor-pointer"
                  >
                    <span>Continuar Simulação</span>
                    <ChevronRight className="w-4 h-4 stroke-[3]" />
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic(15);
                      navigate("/montar-caso");
                    }}
                    className="px-5 h-12 rounded-2xl bg-[#16222E] hover:bg-[#1b2b3a] text-[#EAF2F8] font-bold text-sm border border-[#27394B] border-b-4 border-b-[#0A1118] active:translate-y-1 active:border-b-2 transition-all flex items-center gap-2 cursor-pointer select-none"
                  >
                    <PlusCircle className="w-4 h-4 text-[#20D5B5]" />
                    <span>Montar Caso</span>
                  </button>
                </div>
              </div>

              {/* Seção "Praticar" em Grid 3x2 no PC */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-[#EAF2F8] tracking-tight">
                      Praticar Módulos Clínicos
                    </h3>
                    <p className="text-xs font-semibold text-[#9FB3C6]">
                      Formação prática orientada por diretrizes COFEN e evidências científicas
                    </p>
                  </div>
                  {/* Busca Rápida no Desktop */}
                  <div className="relative w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#52667A]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar módulo..."
                      className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#131F2E] border border-[#1F3045] text-xs text-[#EAF2F8] placeholder-[#52667A] focus:outline-hidden focus:border-[#20D5B5]"
                    />
                    {isSearching && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#52667A] hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPracticeCards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <button
                        key={card.id}
                        onClick={card.action}
                        className="flex flex-col justify-between p-4 min-h-[160px] rounded-2xl bg-[#131F2E] border border-[#1F3045] hover:border-[#20D5B5] text-left hover:-translate-y-1 active:translate-y-0.5 transition-all group cursor-pointer shadow-md"
                      >
                        <div className="flex items-center justify-between w-full mb-3">
                          <div className="w-10 h-10 rounded-xl bg-[#162838] border border-[#20D5B5]/30 text-[#20D5B5] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Icon className="w-5 h-5 stroke-[2.2]" />
                          </div>
                          <span className="text-[10px] font-black text-[#20D5B5] bg-[#20D5B5]/10 border border-[#20D5B5]/20 px-2 py-0.5 rounded-lg">
                            {card.badge}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <strong className="block text-sm font-black text-[#EAF2F8] leading-snug group-hover:text-[#20D5B5] transition-colors">
                            {card.title}
                          </strong>
                          <p className="text-xs text-[#9FB3C6] font-medium line-clamp-2 leading-relaxed">
                            {card.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Coluna Lateral da Direita (4 Colunas no Desktop) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Card "Sugestões de Hoje" */}
              <div className="bg-[#131F2E] rounded-3xl border border-[#1F3045] p-5 shadow-xl space-y-4">
                <div>
                  <h3 className="text-sm font-black text-[#EAF2F8] tracking-tight">
                    Sugestões de hoje
                  </h3>
                  <p className="text-xs font-medium text-[#9FB3C6]">
                    Módulos que você praticou menos nos últimos 7 dias
                  </p>
                </div>

                <div className="space-y-2.5">
                  {desktopSuggestions.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={item.action}
                        className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#16222E] border border-[#1F3045] hover:border-[#20D5B5]/60 text-left active:translate-y-0.5 transition-all group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div className="w-10 h-10 rounded-xl bg-[#162838] border border-[#20D5B5]/30 text-[#20D5B5] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Icon className="w-5 h-5 stroke-[2.2]" />
                          </div>
                          <div className="min-w-0">
                            <strong className="block text-xs font-black text-[#EAF2F8] truncate group-hover:text-[#20D5B5] transition-colors">
                              {item.title}
                            </strong>
                            <span className="block text-[11px] font-medium text-[#9FB3C6] truncate mt-0.5">
                              {item.subtitle}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#52667A] group-hover:text-[#20D5B5] group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Card Preceptor Goti IA - Tutoria Socrática no Desktop */}
              <div className="bg-gradient-to-br from-[#131F2E] to-[#101A24] rounded-3xl border border-[#20D5B5]/30 p-5 shadow-xl space-y-3 relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#20D5B5]/15 border border-[#20D5B5]/30 flex items-center justify-center text-[#20D5B5]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block text-sm font-black text-[#EAF2F8]">
                      Preceptor Goti IA
                    </strong>
                    <span className="text-[11px] font-medium text-[#20D5B5]">
                      Tutor Socrático de Plantão
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#9FB3C6] leading-relaxed">
                  "Lembre-se: antes de titular qualquer vasodilatador ou anti-hipertensivo no idoso, avalie a presença de dor aguda e congestão volêmica!"
                </p>

                <button
                  onClick={() => {
                    triggerHaptic(20);
                    window.dispatchEvent(new CustomEvent("open-goti-chat"));
                  }}
                  className="w-full h-10 rounded-xl bg-[#16222E] hover:bg-[#1b2b3a] text-[#20D5B5] font-black text-xs border border-[#20D5B5]/40 hover:border-[#20D5B5] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Abrir Conversa Clínica com o Goti</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé com Direitos Autorais Oficiais */}
        <div className="text-center pt-6 pb-2 text-[11px] text-[#52667A] font-medium">
          Criado e desenvolvido por <strong className="text-[#9FB3C6]">Marcos Manoel Tavares Neumann</strong>
        </div>
      </main>

      {/* Footer Unificado com Bottom Dock no Mobile */}
      <StudentFooter />
    </div>
  );
}
