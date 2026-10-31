import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Flame,
  Zap,
  Calculator,
  ArrowRightLeft,
  Video,
  PlusCircle,
  Mic,
  ChevronRight,
  BookOpen
} from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { useAuth } from "@/lib/AuthContext";
import { clinicalHistoryService } from "@/services/clinicalHistoryService";
import { clinicalGamificationService } from "@/services/clinicalGamificationService";
import GotiAnimated from "@/components/mascot/GotiAnimated";

export default function EnfereVivoTrail({ userName = "Estudante", onOpenAIChat }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { triggerHaptic } = useTheme();

  const userInitial = userName && userName.trim() ? userName.trim().charAt(0).toUpperCase() : "E";

  const gameState = useMemo(() => clinicalGamificationService.getState(user?.id), [user?.id]);
  const todayActivitiesCount = useMemo(() => {
    const all = clinicalHistoryService.getAllActivities("all", user?.id);
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    return all.filter((a) => {
      if (!a?.completedAt) return false;
      const d = new Date(a.completedAt);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return k === todayKey;
    }).length;
  }, [user?.id]);
  const dailyGoalPercent = Math.min(100, Math.round((todayActivitiesCount / 3) * 100));

  // Busca a última atividade em andamento no histórico individual do usuário
  const latestActivity = useMemo(() => {
    return clinicalHistoryService.getLatestInProgressActivity(user?.id);
  }, [user?.id]);

  const hasInProgressCase = Boolean(latestActivity);

  // Módulos sugeridos de hoje (incluindo Videochamada em destaque)
  const suggestions = useMemo(() => [
    {
      id: "videochamada",
      title: "Atendimento por Voz (Videochamada)",
      subtitle: "5 min · Paciente com Fala e Voz Neural",
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
      subtitle: "5 min · 4 Modos de Cálculos Clínicos",
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
      subtitle: "8 min · Preceptoria IA Socrática",
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
      subtitle: "8 min · Vídeos + Checklists Operacionais",
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
      subtitle: "Construção com Escores Braden e Áudio",
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
    <div className="w-full max-w-md mx-auto space-y-4 px-1 py-1 pb-10 select-none">
      {/* 1. Topbar de Status (Avatar, Ofensiva e PE) */}
      <div className="flex items-center justify-between gap-2 pt-1 pb-1">
        {/* Avatar Circular */}
        <button
          onClick={() => {
            triggerHaptic(15);
            navigate("/conta");
          }}
          className="w-11 h-11 rounded-full bg-[#20D5B5] text-[#06302E] font-black text-lg flex items-center justify-center shadow-md border-2 border-white/20 active:scale-95 transition-transform cursor-pointer"
          title="Minha Conta"
          aria-label="Minha Conta"
        >
          {userInitial}
        </button>

        {/* Chips de Ofensiva e PE */}
        <div className="flex items-center gap-2">
          {/* Chip Ofensiva */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#16222E] border border-[#27394B] text-[#FFC247] text-xs font-black shadow-xs">
            <Flame className="w-4 h-4 fill-current text-[#FFC247]" />
            <span>{gameState.streak || 0} dias</span>
          </div>

          {/* Chip PE */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#16222E] border border-[#27394B] text-[#20D5B5] text-xs font-black shadow-xs">
            <Zap className="w-4 h-4 fill-current text-[#20D5B5]" />
            <span>{gameState.studyPoints ?? 0} PE</span>
          </div>
        </div>
      </div>

      {/* 2. Saudação com Mascote Goti em Destaque Ampliado */}
      <div className="flex items-center gap-3.5 bg-[#131F2E]/80 border border-[#1F3045] rounded-3xl p-3.5 shadow-sm">
        <div
          onClick={() => {
            triggerHaptic(20);
            if (onOpenAIChat) onOpenAIChat();
            else window.dispatchEvent(new CustomEvent("open-goti-chat"));
          }}
          className="cursor-pointer shrink-0 transition-transform hover:scale-105 active:scale-95"
          title="Falar com o Preceptor Goti"
        >
          {/* Goti ampliado com tamanho expressivo e amigável */}
          <GotiAnimated
            animation="wave"
            size="md"
            className="w-20 h-20 shrink-0 drop-shadow-[0_4px_16px_rgba(32,213,181,0.35)]"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="inline-block text-[10px] font-black uppercase tracking-wider text-[#20D5B5] bg-[#20D5B5]/10 px-2 py-0.5 rounded-md mb-1">
            Preceptor Clínico
          </div>
          <h1 className="text-lg font-black text-[#EAF2F8] tracking-tight leading-tight">
            Olá, {userName}
          </h1>
          <p className="text-xs font-semibold text-[#9FB3C6] mt-0.5 leading-snug">
            Pronto para a prática clínica hoje?
          </p>
        </div>
      </div>

      {/* 3. Meta do Dia */}
      <div className="space-y-1.5 px-0.5">
        <div className="flex items-center justify-between text-xs font-extrabold">
          <span className="text-[#EAF2F8]">Meta do dia</span>
          <span className="text-[#9FB3C6]">{todayActivitiesCount} de 3 atividades hoje</span>
        </div>
        <div className="h-2.5 w-full bg-[#16222E] border border-[#27394B] rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-[#1FC7B6] to-[#20D5B5] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(32,213,181,0.4)]"
            style={{ width: `${dailyGoalPercent}%` }}
          />
        </div>
      </div>

      {/* 4. Card "Continuar de Onde Parou" Inteligente e Individual */}
      {hasInProgressCase ? (
        // Caso em andamento recuperado do histórico do estudante
        <div className="bg-[#131F2E] rounded-3xl border border-[#1F3045] p-4 sm:p-5 shadow-lg space-y-3.5 relative overflow-hidden">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#1E2640] border border-[#2F3E66] text-[#A5B4FC] text-[11px] font-black tracking-wide">
            {latestActivity.moduleLabel || "Simulador de Casos Clínicos (PE)"}
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-extrabold text-[#20D5B5] uppercase tracking-wider block">
              CONTINUAR DE ONDE PAROU
            </span>
            <h2 className="text-base font-black text-[#EAF2F8] leading-snug">
              {latestActivity.title}
            </h2>
            <p className="text-xs font-medium text-[#9FB3C6]">
              {latestActivity.patientInfo ? `${latestActivity.patientInfo} · ` : ""}
              Etapa {latestActivity.step || 1} · {latestActivity.progressPercentage || 0}% concluído
            </p>
          </div>

          {/* Barra de Progresso Real */}
          <div className="h-2 w-full bg-[#16222E] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#20D5B5] rounded-full transition-all duration-300"
              style={{ width: `${Math.max(latestActivity.progressPercentage || 0, 10)}%` }}
            />
          </div>

          {/* Botão Largo "Continuar" em Ciano 3D */}
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
            className="w-full h-12 rounded-2xl bg-[#20D5B5] hover:bg-[#1bc4a6] text-[#06302E] font-black text-sm tracking-wide border-0 border-b-4 border-b-[#149F86] active:translate-y-1 active:border-b-2 transition-all flex items-center justify-center gap-2 select-none shadow-[0_4px_14px_rgba(32,213,181,0.25)] cursor-pointer"
          >
            <span>Continuar</span>
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      ) : (
        // Boas-vindas para primeiro acesso / usuário sem casos em andamento
        <div className="bg-[#131F2E] rounded-3xl border border-[#1F3045] p-4 sm:p-5 shadow-lg space-y-3.5 relative overflow-hidden">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#20D5B5]/15 border border-[#20D5B5]/30 text-[#20D5B5] text-[11px] font-black tracking-wide">
            <BookOpen className="w-3.5 h-3.5" />
            <span>COMECE POR AQUI</span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-extrabold text-[#20D5B5] uppercase tracking-wider block">
              BOAS-VINDAS AO ENFERE
            </span>
            <h2 className="text-base font-black text-[#EAF2F8] leading-snug">
              Inicie sua Prática Clínica
            </h2>
            <p className="text-xs font-medium text-[#9FB3C6] leading-relaxed">
              Monte seu primeiro caso clínico personalizado com escores de enfermagem e viva simulações imersivas.
            </p>
          </div>

          {/* Botão Largo em Ciano 3D */}
          <button
            onClick={() => {
              triggerHaptic(20);
              navigate("/montar-caso");
            }}
            className="w-full h-12 rounded-2xl bg-[#20D5B5] hover:bg-[#1bc4a6] text-[#06302E] font-black text-sm tracking-wide border-0 border-b-4 border-b-[#149F86] active:translate-y-1 active:border-b-2 transition-all flex items-center justify-center gap-2 select-none shadow-[0_4px_14px_rgba(32,213,181,0.25)] cursor-pointer"
          >
            <PlusCircle className="w-4.5 h-4.5 stroke-[2.5]" />
            <span>Montar Caso Clínico</span>
          </button>
        </div>
      )}

      {/* 5. Seção "Sugestões de Hoje" */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-0.5">
          <div>
            <h3 className="text-sm font-black text-[#EAF2F8] tracking-tight">
              Sugestões de hoje
            </h3>
            <p className="text-[11px] font-medium text-[#9FB3C6]">
              Módulos recomendados para sua formação prática
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {suggestions.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.action}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left active:translate-y-0.5 transition-all group cursor-pointer ${
                  item.highlight
                    ? "bg-gradient-to-r from-[#162838] to-[#131F2E] border-[#20D5B5]/50 shadow-md"
                    : "bg-[#131F2E] border-[#1F3045] hover:border-[#20D5B5]/60"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                      item.highlight
                        ? "bg-[#20D5B5] text-[#06302E] shadow-sm"
                        : "bg-[#162838] border border-[#20D5B5]/30 text-[#20D5B5]"
                    }`}
                  >
                    <Icon className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <strong className="block text-xs font-black text-[#EAF2F8] truncate group-hover:text-[#20D5B5] transition-colors">
                        {item.title}
                      </strong>
                      {item.badge && (
                        <span
                          className={`text-[9.5px] font-black px-1.5 py-0.5 rounded-md ${
                            item.highlight
                              ? "bg-[#20D5B5] text-[#06302E]"
                              : "bg-[#20D5B5]/10 text-[#20D5B5] border border-[#20D5B5]/20"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
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

      {/* 6. Rodapé com Autoria Oficial */}
      <div className="text-center pt-3 pb-2 text-[10px] text-[#52667A] font-medium">
        Criado e desenvolvido por <strong className="text-[#9FB3C6]">Marcos Manoel Tavares Neumann</strong>
      </div>
    </div>
  );
}
