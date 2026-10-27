import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calculator,
  PlusCircle,
  Video,
  ArrowRightLeft,
  ChevronRight,
  Flame,
  Zap,
  Mic,
  BookOpen
} from "lucide-react";
import StudentHeader from "@/components/StudentHeader";
import StudentFooter from "@/components/StudentFooter";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";
import { clinicalHistoryService } from "@/services/clinicalHistoryService";

import EnfereVivoTrail from "@/components/mobile/EnfereVivoTrail";
import GotiAnimated from "@/components/mascot/GotiAnimated";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { triggerHaptic } = useTheme();

  const cleanUserName = user?.name ? user.name.split(" ")[0] : (user?.full_name ? user.full_name.split(" ")[0] : "Marcos");

  // Busca a última atividade em andamento no histórico do usuário
  const latestActivity = useMemo(() => {
    return clinicalHistoryService.getLatestInProgressActivity(user?.id);
  }, [user?.id]);

  const hasInProgressCase = Boolean(latestActivity);

  // Módulos recomendados para as "Sugestões de Hoje" no desktop
  const desktopSuggestions = useMemo(() => [
    {
      id: "videochamada",
      title: "Atendimento por Voz (Videochamada)",
      subtitle: "5 min · Paciente simulado com fala e voz neural",
      badge: "NOVO",
      highlight: true,
      icon: Mic,
      action: () => {
        triggerHaptic(15);
        navigate("/videochamada");
      }
    },
    {
      id: "doses",
      title: "Laboratório de Cálculo de Doses",
      subtitle: "5 min · 4 Modos (Macrogotas, Microgotas, BIC)",
      badge: "4 Modos",
      highlight: false,
      icon: Calculator,
      action: () => {
        triggerHaptic(15);
        navigate("/laboratorio-calculos");
      }
    },
    {
      id: "sbar",
      title: "Passagem de Plantão SBAR",
      subtitle: "8 min · Comunicação interprofissional com IA",
      badge: "Preceptoria IA",
      highlight: false,
      icon: ArrowRightLeft,
      action: () => {
        triggerHaptic(15);
        navigate("/passagem-plantao");
      }
    },
    {
      id: "pops",
      title: "Videoteca de Procedimentos & POPs",
      subtitle: "8 min · Vídeos cirúrgicos + Checklists validados",
      badge: "Checklists",
      highlight: false,
      icon: Video,
      action: () => {
        triggerHaptic(15);
        navigate("/procedimentos");
      }
    },
    {
      id: "case_maker",
      title: "Montador de Casos Clínicos",
      subtitle: "Construção de pacientes com escores Braden e áudio",
      badge: "Escores + Voz",
      highlight: false,
      icon: PlusCircle,
      action: () => {
        triggerHaptic(15);
        navigate("/montar-caso");
      }
    }
  ], [navigate, triggerHaptic]);

  return (
    <div className="min-h-screen bg-[#0B131D] flex flex-col text-[#EAF2F8] pb-24 md:pb-12 transition-colors select-none">
      {/* Header Clássico no Desktop */}
      <StudentHeader activeTab="hub" desktopOnly={true} />

      <main className="flex-1 mx-auto max-w-5xl w-full px-4 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* ========================================================================= */}
        {/* VISUALIZAÇÃO MOBILE (EnfereVivoTrail com Goti ampliado e Sugestões)       */}
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
          {/* Header Superior do Painel PC: Saudação, Mascote Goti Ampliado, Ofensiva e PE */}
          <div className="flex items-center justify-between gap-6 bg-[#131F2E] border border-[#1F3045] rounded-3xl p-6 shadow-xl relative overflow-hidden">
            {/* Brilho de fundo sutil */}
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-[#20D5B5]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-6 z-10">
              {/* Mascote Goti Animado em Proporção Destaque Ampliado */}
              <div
                onClick={() => {
                  triggerHaptic(20);
                  window.dispatchEvent(new CustomEvent("open-goti-chat"));
                }}
                className="cursor-pointer group shrink-0 transition-transform hover:scale-105 active:scale-95"
                title="Conversar com o Preceptor Goti"
              >
                <GotiAnimated
                  animation="wave"
                  size="lg"
                  className="w-24 h-24 lg:w-28 lg:h-28 shrink-0 drop-shadow-[0_4px_20px_rgba(32,213,181,0.35)]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="inline-block text-[10.5px] font-black uppercase tracking-wider text-[#20D5B5] bg-[#20D5B5]/10 px-2.5 py-0.5 rounded-md">
                  Preceptoria Clínica
                </div>
                <h1 className="text-2xl lg:text-3xl font-black text-[#EAF2F8] tracking-tight">
                  Olá, {cleanUserName}
                </h1>
                <p className="text-sm font-semibold text-[#9FB3C6]">
                  Pronto para a prática clínica hoje?
                </p>

                {/* Meta do Dia no Desktop */}
                <div className="flex items-center gap-3 pt-1">
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
            <div className="flex items-center gap-3 z-10">
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

          {/* Card "Continuar de Onde Parou" Dinâmico / Boas-Vindas */}
          {hasInProgressCase ? (
            <div className="bg-[#131F2E] rounded-3xl border border-[#1F3045] p-6 shadow-xl space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#1E2640] border border-[#2F3E66] text-[#A5B4FC] text-xs font-black tracking-wide">
                  {latestActivity.moduleLabel || "Simulador de Casos Clínicos (PE)"}
                </div>
                <span className="text-xs font-bold text-[#9FB3C6]">
                  Etapa {latestActivity.step || 1} · {latestActivity.progressPercentage || 0}% concluído
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-black text-[#20D5B5] uppercase tracking-wider block">
                  CONTINUAR DE ONDE PAROU
                </span>
                <h2 className="text-xl font-black text-[#EAF2F8] leading-snug">
                  {latestActivity.title}
                </h2>
                {latestActivity.patientInfo && (
                  <p className="text-xs font-medium text-[#9FB3C6]">
                    {latestActivity.patientInfo}
                  </p>
                )}
              </div>

              {/* Barra de Progresso Real */}
              <div className="h-2.5 w-full bg-[#16222E] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#20D5B5] rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(latestActivity.progressPercentage || 0, 10)}%` }}
                />
              </div>

              {/* Botão de Ação Primária em Ciano 3D */}
              <div className="pt-1 flex gap-3">
                <button
                  onClick={() => {
                    triggerHaptic(20);
                    if (latestActivity.moduleType === "case_builder") {
                      navigate("/montar-caso");
                    } else if (latestActivity.moduleType === "sbar") {
                      navigate("/passagem-plantao");
                    } else {
                      navigate("/simulador-casos");
                    }
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
                  <span>Novo Caso</span>
                </button>
              </div>
            </div>
          ) : (
            // Boas-Vindas para novo aluno / sem histórico prévio
            <div className="bg-[#131F2E] rounded-3xl border border-[#1F3045] p-6 shadow-xl space-y-4 relative overflow-hidden">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#20D5B5]/15 border border-[#20D5B5]/30 text-[#20D5B5] text-xs font-black tracking-wide">
                <BookOpen className="w-4 h-4" />
                <span>COMECE POR AQUI</span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-black text-[#20D5B5] uppercase tracking-wider block">
                  BOAS-VINDAS AO ENFERMEIRO DIGITAL
                </span>
                <h2 className="text-xl font-black text-[#EAF2F8] leading-snug">
                  Inicie sua Prática Clínica
                </h2>
                <p className="text-sm font-medium text-[#9FB3C6] leading-relaxed max-w-2xl">
                  Monte seu primeiro caso clínico personalizado com escores de enfermagem validados e experimente o Atendimento por Voz com nossos pacientes simulados.
                </p>
              </div>

              <div className="pt-1 flex gap-3">
                <button
                  onClick={() => {
                    triggerHaptic(20);
                    navigate("/montar-caso");
                  }}
                  className="px-6 h-12 rounded-2xl bg-[#20D5B5] hover:bg-[#1bc4a6] text-[#06302E] font-black text-sm tracking-wide border-0 border-b-4 border-b-[#149F86] active:translate-y-1 active:border-b-2 transition-all flex items-center justify-center gap-2 select-none shadow-[0_4px_14px_rgba(32,213,181,0.25)] cursor-pointer"
                >
                  <PlusCircle className="w-4.5 h-4.5 stroke-[2.5]" />
                  <span>Montar Caso Clínico</span>
                </button>
                <button
                  onClick={() => {
                    triggerHaptic(15);
                    navigate("/videochamada");
                  }}
                  className="px-5 h-12 rounded-2xl bg-[#16222E] hover:bg-[#1b2b3a] text-[#EAF2F8] font-bold text-sm border border-[#27394B] border-b-4 border-b-[#0A1118] active:translate-y-1 active:border-b-2 transition-all flex items-center gap-2 cursor-pointer select-none"
                >
                  <Mic className="w-4 h-4 text-[#20D5B5]" />
                  <span>Atendimento por Voz</span>
                </button>
              </div>
            </div>
          )}

          {/* Seção Principal Centralizada: "Sugestões de Hoje" */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-black text-[#EAF2F8] tracking-tight">
                Sugestões de hoje
              </h3>
              <p className="text-xs font-semibold text-[#9FB3C6]">
                Módulos clínicos recomendados para sua formação prática orientada por evidências
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {desktopSuggestions.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    className={`flex flex-col justify-between p-5 min-h-[160px] rounded-2xl border text-left active:translate-y-0.5 transition-all group cursor-pointer shadow-md ${
                      item.highlight
                        ? "bg-gradient-to-br from-[#162838] to-[#131F2E] border-[#20D5B5]/60 hover:border-[#20D5B5]"
                        : "bg-[#131F2E] border-[#1F3045] hover:border-[#20D5B5]"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                          item.highlight
                            ? "bg-[#20D5B5] text-[#06302E] shadow-sm"
                            : "bg-[#162838] border border-[#20D5B5]/30 text-[#20D5B5]"
                        }`}
                      >
                        <Icon className="w-5.5 h-5.5 stroke-[2.2]" />
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg ${
                            item.highlight
                              ? "bg-[#20D5B5] text-[#06302E]"
                              : "bg-[#20D5B5]/10 text-[#20D5B5] border border-[#20D5B5]/20"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <strong className="block text-sm font-black text-[#EAF2F8] leading-snug group-hover:text-[#20D5B5] transition-colors">
                        {item.title}
                      </strong>
                      <p className="text-xs text-[#9FB3C6] font-medium leading-relaxed">
                        {item.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
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
