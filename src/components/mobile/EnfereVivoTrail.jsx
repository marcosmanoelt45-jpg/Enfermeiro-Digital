import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Flame,
  Zap,
  Calculator,
  ArrowRightLeft,
  Video,
  BookOpen,
  PlusCircle,
  Stethoscope,
  ChevronRight
} from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import GotiAnimated from "@/components/mascot/GotiAnimated";

/**
 * EnfereVivoTrail · Tela Inicial do Hub do Estudante (Mobile-First)
 * Especificação 1:1 com a Página 2 do PDF de Referência:
 * - Topbar: Avatar circular ciano, Ofensiva (🔥 3 dias), PE (⚡ 120 PE)
 * - Saudação: Mascote Goti animado + "Olá, Marcos" + "Pronto para a prática clínica hoje?"
 * - Meta do dia: "1 de 3 atividades hoje" com barra de progresso ciano
 * - Card Continuar de Onde Parou: "Idoso com Insuficiência Cardíaca Descompensada", barra 40%, botão tátil "Continuar"
 * - Sugestões de Hoje: Módulos menos praticados com cards horizontais
 * - Praticar: Grid 2 colunas com os 6 módulos oficiais
 * - Rodapé com autoria do Marcos Manoel Tavares Neumann
 */
export default function EnfereVivoTrail({ userName = "Marcos", onOpenAIChat }) {
  const navigate = useNavigate();
  const { triggerHaptic } = useTheme();

  const userInitial = userName && userName.trim() ? userName.trim().charAt(0).toUpperCase() : "M";

  // Módulos sugeridos (Sugestões de hoje)
  const suggestions = [
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
  ];

  // 6 Cards da seção "Praticar" (Grid 2 colunas)
  const practiceCards = [
    {
      id: "pe_cases",
      title: "Simulador de Casos Clínicos",
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
      badge: "4 Sistemas",
      icon: Stethoscope,
      action: () => {
        triggerHaptic(15);
        navigate("/simulador-casos?mode=semiology");
      }
    }
  ];

  return (
    <div className="w-full max-w-md mx-auto space-y-5 px-1 py-1 pb-10 select-none">
      {/* 1. Topbar de Status (Avatar, Ofensiva e PE) */}
      <div className="flex items-center justify-between gap-2 pt-1 pb-1">
        {/* Avatar Circular 'M' */}
        <button
          onClick={() => {
            triggerHaptic(15);
            navigate("/conta");
          }}
          className="w-11 h-11 rounded-full bg-[#20D5B5] text-[#06302E] font-black text-lg flex items-center justify-center shadow-md border-2 border-white/20 active:scale-95 transition-transform"
          title="Minha Conta"
          aria-label="Minha Conta"
        >
          {userInitial}
        </button>

        {/* Chips de Ofensiva e PE */}
        <div className="flex items-center gap-2">
          {/* Chip Ofensiva (🔥 3 dias) */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#16222E] border border-[#27394B] text-[#FFC247] text-xs font-black shadow-xs">
            <Flame className="w-4 h-4 fill-current text-[#FFC247]" />
            <span>3 dias</span>
          </div>

          {/* Chip PE (⚡ 120 PE) */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#16222E] border border-[#27394B] text-[#20D5B5] text-xs font-black shadow-xs">
            <Zap className="w-4 h-4 fill-current text-[#20D5B5]" />
            <span>120 PE</span>
          </div>
        </div>
      </div>

      {/* 2. Saudação com Mascote Goti Animado */}
      <div className="flex items-center gap-3.5 pt-1">
        <div
          onClick={() => {
            triggerHaptic(20);
            if (onOpenAIChat) onOpenAIChat();
            else window.dispatchEvent(new CustomEvent("open-goti-chat"));
          }}
          className="cursor-pointer shrink-0 transition-transform hover:scale-105 active:scale-95"
          title="Falar com o Goti"
        >
          {/* Goti animado substituindo o desenho simples de gota */}
          <GotiAnimated
            animation="wave"
            size="sm"
            className="w-14 h-14 shrink-0 drop-shadow-[0_4px_12px_rgba(32,213,181,0.2)]"
          />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-black text-[#EAF2F8] tracking-tight leading-tight">
            Olá, {userName}
          </h1>
          <p className="text-xs font-semibold text-[#9FB3C6] mt-0.5">
            Pronto para a prática clínica hoje?
          </p>
        </div>
      </div>

      {/* 3. Meta do Dia */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs font-extrabold">
          <span className="text-[#EAF2F8]">Meta do dia</span>
          <span className="text-[#9FB3C6]">1 de 3 atividades hoje</span>
        </div>
        <div className="h-2.5 w-full bg-[#16222E] border border-[#27394B] rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-[#1FC7B6] to-[#20D5B5] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(32,213,181,0.4)]"
            style={{ width: "35%" }}
          />
        </div>
      </div>

      {/* 4. Card "Continuar de Onde Parou" (Idoso com Insuficiência Cardíaca) */}
      <div className="bg-[#131F2E] rounded-3xl border border-[#1F3045] p-4 sm:p-5 shadow-lg space-y-3.5 relative overflow-hidden">
        {/* Badge da Trilha */}
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#1E2640] border border-[#2F3E66] text-[#A5B4FC] text-[11px] font-black tracking-wide">
          Simulador de Casos Clínicos (PE)
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-extrabold text-[#20D5B5] uppercase tracking-wider block">
            CONTINUAR DE ONDE PAROU
          </span>
          <h2 className="text-base font-black text-[#EAF2F8] leading-snug">
            Idoso com Insuficiência Cardíaca Descompensada
          </h2>
          <p className="text-xs font-medium text-[#9FB3C6]">
            Etapa 2 de 5 · 40% concluído
          </p>
        </div>

        {/* Barra de Progresso do Caso */}
        <div className="h-2 w-full bg-[#16222E] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#20D5B5] rounded-full transition-all duration-300"
            style={{ width: "40%" }}
          />
        </div>

        {/* Botão Largo "Continuar" em Ciano 3D */}
        <button
          onClick={() => {
            triggerHaptic(20);
            navigate("/simulador-casos");
          }}
          className="w-full h-12 rounded-2xl bg-[#20D5B5] hover:bg-[#1bc4a6] text-[#06302E] font-black text-sm tracking-wide border-0 border-b-4 border-b-[#149F86] active:translate-y-1 active:border-b-2 transition-all flex items-center justify-center gap-2 select-none shadow-[0_4px_14px_rgba(32,213,181,0.25)] cursor-pointer"
        >
          Continuar
        </button>
      </div>

      {/* 5. Seção "Sugestões de Hoje" */}
      <div className="space-y-2.5 pt-1">
        <div>
          <h3 className="text-sm font-black text-[#EAF2F8] tracking-tight">
            Sugestões de hoje
          </h3>
          <p className="text-[11px] font-medium text-[#9FB3C6]">
            Módulos que você praticou menos nos últimos 7 dias
          </p>
        </div>

        <div className="space-y-2">
          {suggestions.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.action}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#131F2E] border border-[#1F3045] hover:border-[#20D5B5]/60 text-left active:translate-y-0.5 transition-all group cursor-pointer"
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

      {/* 6. Seção "Praticar" (Grid 2 Colunas 1:1 com a Página 2 do PDF) */}
      <div className="space-y-2.5 pt-1">
        <h3 className="text-sm font-black text-[#EAF2F8] tracking-tight">
          Praticar
        </h3>

        <div className="grid grid-cols-2 gap-2.5">
          {practiceCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                onClick={card.action}
                className="flex flex-col justify-between p-3.5 min-h-[130px] rounded-2xl bg-[#131F2E] border border-[#1F3045] hover:border-[#20D5B5] text-left active:scale-[0.98] transition-all group cursor-pointer"
              >
                {/* Ícone com fundo arredondado */}
                <div className="w-9 h-9 rounded-xl bg-[#162838] border border-[#20D5B5]/30 text-[#20D5B5] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mb-2">
                  <Icon className="w-4.5 h-4.5 stroke-[2.2]" />
                </div>

                <div className="space-y-2">
                  <strong className="block text-xs font-black text-[#EAF2F8] leading-snug group-hover:text-[#20D5B5] transition-colors line-clamp-2">
                    {card.title}
                  </strong>
                  <span className="inline-block text-[10px] font-black text-[#20D5B5] bg-[#20D5B5]/10 border border-[#20D5B5]/20 px-2 py-0.5 rounded-lg">
                    {card.badge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 7. Rodapé com Autoria Oficial */}
      <div className="text-center pt-3 pb-2 text-[10px] text-[#52667A] font-medium">
        Criado e desenvolvido por <strong className="text-[#9FB3C6]">Marcos Manoel Tavares Neumann</strong>
      </div>
    </div>
  );
}
