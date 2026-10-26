import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  Lock,
  Activity,
  Flame,
  Zap,
  ChevronRight,
  BookOpen,
  ArrowRightLeft,
  Calculator,
  Video
} from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";

/**
 * EnfereVivoTrail · Trilha vertical tátil do Plantão de Hoje
 * Especificação 1:1 com as Páginas 1 e 2 do PDF Enfere Vivo:
 * - Header de status: Avatar circular, Ofensiva (🔥 7 dias), XP (⚡ 340 XP)
 * - Título da tela: "Plantão de hoje", "Quarta-feira · 2 de 5 etapas"
 * - Meta do dia: 40% com barra aqua grossa
 * - Estações: Concluída, Ativa/Atual (com botão tátil que afunda 4px em 120ms) e Bloqueadas
 * - Motivo de linha vertical conectada
 */
export default function EnfereVivoTrail({ userName = "Aluno", onOpenAIChat }) {
  const navigate = useNavigate();
  const { triggerHaptic } = useTheme();

  const userInitial = userName && userName.trim() ? userName.trim().charAt(0).toUpperCase() : "G";

  const stages = [
    {
      id: "avaliacao",
      title: "Avaliação do paciente",
      subtitle: "Concluído · +40 XP",
      status: "completed", // completed | active | locked
      action: () => navigate("/simulador-casos"),
    },
    {
      id: "raciocinio",
      tag: "Raciocínio clínico",
      title: "Caso: dispneia em idoso",
      subtitle: "Etapa 3 de 5 · cerca de 6 min",
      status: "active",
      buttonText: "Continuar",
      action: () => {
        triggerHaptic(20);
        navigate("/simulador-casos");
      },
    },
    {
      id: "calculo",
      title: "Cálculo de doses",
      subtitle: "Abre ao concluir o caso",
      status: "locked",
      action: () => navigate("/laboratorio-calculos"),
    },
    {
      id: "sbar",
      title: "Passagem de plantão",
      subtitle: "Método SBAR",
      status: "locked",
      action: () => navigate("/passagem-plantao"),
    },
    {
      id: "sondagem",
      title: "Sondagem vesical de demora",
      subtitle: "Procedimento · videoteca",
      status: "locked",
      action: () => navigate("/procedimentos"),
    },
  ];

  return (
    <div className="w-full max-w-md mx-auto space-y-5 px-1 py-1">
      {/* 1. Header de Status Compacto (Página 1 e 2 do PDF) */}
      <div className="flex items-center justify-between gap-2 pt-1 pb-1">
        {/* Avatar Circular */}
        <button
          onClick={() => {
            triggerHaptic(15);
            navigate("/conta");
          }}
          className="w-11 h-11 rounded-full bg-[#1FC7B6] dark:bg-[#2AD3C1] text-[#06302E] font-black text-lg flex items-center justify-center shadow-xs border-2 border-white dark:border-slate-800 active:scale-95 transition-transform"
          title="Minha Conta"
          aria-label="Minha Conta"
        >
          {userInitial}
        </button>

        {/* Chips de Ofensiva e XP com Borda Tátil */}
        <div className="flex items-center gap-2">
          {/* Chip Ofensiva */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white dark:bg-[#16222E] border-2 border-[#DCE5EC] dark:border-[#27394B] border-b-4 border-b-[#C4D1DC] dark:border-b-[#0A1118] text-[#D97706] dark:text-[#FFC247] text-xs font-black shadow-2xs select-none">
            <Flame className="w-4 h-4 fill-current text-[#D97706] dark:text-[#FFC247]" />
            <span>7 dias</span>
          </div>

          {/* Chip XP */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white dark:bg-[#16222E] border-2 border-[#DCE5EC] dark:border-[#27394B] border-b-4 border-b-[#C4D1DC] dark:border-b-[#0A1118] text-[#1FC7B6] dark:text-[#2AD3C1] text-xs font-black shadow-2xs select-none">
            <Zap className="w-4 h-4 fill-current text-[#1FC7B6] dark:text-[#2AD3C1]" />
            <span>340 XP</span>
          </div>
        </div>
      </div>

      {/* 2. Título da Tela e Meta do Dia */}
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-[#1B2B3A] dark:text-[#EAF2F8] tracking-tight leading-tight">
          Plantão de hoje
        </h1>
        <p className="text-xs font-semibold text-[#52667A] dark:text-[#9FB3C6]">
          Quarta-feira · 2 de 5 etapas
        </p>

        {/* Barra de Progresso da Meta Diária */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-extrabold">
            <span className="text-[#1B2B3A] dark:text-[#EAF2F8]">Meta do dia</span>
            <span className="text-[#52667A] dark:text-[#9FB3C6]">40%</span>
          </div>
          <div className="h-3 w-full bg-[#DCE5EC] dark:bg-[#27394B] rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-[#1FC7B6] dark:bg-[#2AD3C1] rounded-full transition-all duration-500 shadow-2xs"
              style={{ width: "40%" }}
            />
          </div>
        </div>
      </div>

      {/* 3. Trilha Vertical Tátil de Estações Conectadas (Estilo Enfere Vivo) */}
      <div className="relative pt-2 pb-4">
        {/* Linha vertical condutora no centro dos nós */}
        <div className="absolute left-6 top-6 bottom-6 w-1 bg-[#DCE5EC] dark:bg-[#27394B] -translate-x-1/2 rounded-full" />

        <div className="space-y-4 relative">
          {stages.map((stage, idx) => {
            if (stage.status === "completed") {
              return (
                <div key={stage.id} className="flex items-center gap-4">
                  {/* Nó Concluído (Verde com Check e Borda 3D) */}
                  <div className="relative z-10 w-12 h-12 rounded-2xl bg-[#1F9D63] text-white flex items-center justify-center shrink-0 border-2 border-emerald-600 border-b-4 border-b-[#147045] shadow-xs">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  {/* Texto */}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-extrabold text-[#1B2B3A] dark:text-[#EAF2F8] truncate">
                      {stage.title}
                    </h3>
                    <p className="text-xs font-semibold text-[#52667A] dark:text-[#9FB3C6]">
                      {stage.subtitle}
                    </p>
                  </div>
                </div>
              );
            }

            if (stage.status === "active") {
              return (
                <div key={stage.id} className="space-y-2">
                  <div className="flex items-start gap-4">
                    {/* Nó Ativo (Aqua com Motivo de Pulso/ECG) */}
                    <div className="relative z-10 w-12 h-12 rounded-2xl bg-[#1FC7B6] dark:bg-[#2AD3C1] text-[#06302E] flex items-center justify-center shrink-0 border-2 border-[#12A596] dark:border-[#17A99A] border-b-4 border-b-[#12A596] dark:border-b-[#17A99A] shadow-md ring-4 ring-[#1FC7B6]/20">
                      <Activity className="w-6 h-6 stroke-[2.5] animate-pulse" />
                    </div>

                    {/* Card Expandido da Atividade Ativa */}
                    <div className="flex-1 bg-white dark:bg-[#16222E] rounded-3xl border-2 border-[#DCE5EC] dark:border-[#27394B] border-b-4 border-b-[#C4D1DC] dark:border-b-[#0A1118] p-4 shadow-sm space-y-3">
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#EEF2FF] dark:bg-[#1E1B4B] text-[#3F43C9] dark:text-[#B4B7FF] text-[11px] font-black uppercase tracking-wider">
                        {stage.tag}
                      </div>

                      <div>
                        <h3 className="text-base font-black text-[#1B2B3A] dark:text-[#EAF2F8] leading-snug">
                          {stage.title}
                        </h3>
                        <p className="text-xs font-semibold text-[#52667A] dark:text-[#9FB3C6] mt-0.5">
                          {stage.subtitle}
                        </p>
                      </div>

                      {/* Botão Tátil 3D "Continuar" que afunda 4px ao toque em 120ms */}
                      <button
                        onClick={stage.action}
                        className="w-full h-12 rounded-2xl bg-[#1FC7B6] hover:bg-[#1bb8a8] dark:bg-[#2AD3C1] dark:hover:bg-[#25c0b0] text-[#06302E] font-black text-sm tracking-wide border-2 border-[#12A596] dark:border-[#17A99A] border-b-5 border-b-[#12A596] dark:border-b-[#17A99A] active:translate-y-1 active:border-b-2 transition-all duration-100 flex items-center justify-center gap-2 select-none shadow-sm cursor-pointer"
                      >
                        <span>{stage.buttonText}</span>
                        <ChevronRight className="w-4 h-4 stroke-[3]" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            // Estágio Bloqueado (locked)
            return (
              <div key={stage.id} className="flex items-center gap-4 opacity-75">
                {/* Nó Bloqueado */}
                <div className="relative z-10 w-12 h-12 rounded-2xl bg-white dark:bg-[#16222E] text-[#52667A] dark:text-[#9FB3C6] flex items-center justify-center shrink-0 border-2 border-[#DCE5EC] dark:border-[#27394B] border-b-4 border-b-[#C4D1DC] dark:border-b-[#0A1118]">
                  <Lock className="w-5 h-5" />
                </div>
                {/* Texto */}
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-extrabold text-[#52667A] dark:text-[#9FB3C6] truncate">
                    {stage.title}
                  </h3>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    {stage.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
