import React, { useEffect, useMemo } from "react";
import { dispararLoteVozes } from "@/features/cena/servidor.js";
import { m as motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Calculator,
  Gamepad2,
  Video,
  ArrowRightLeft,
  ChevronRight,
  Zap,
  Stethoscope,
  BookOpen
} from "lucide-react";
import StudentHeader from "@/components/StudentHeader";
import StudentFooter from "@/components/StudentFooter";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";
import { clinicalHistoryService } from "@/services/clinicalHistoryService";

import EnfereVivoTrail from "@/components/mobile/EnfereVivoTrail";
import GotiAnimated from "@/components/mascot/GotiAnimated";
import { AnimatedNumber } from "@/components/ui/animated-number";
import ChipOfensiva from "@/components/feedback/ofensiva/ChipOfensiva.jsx";
import { AnimatedProgress } from "@/components/ui/animated-progress";
import { fadeUp, listStagger } from "@/lib/motion";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useEstadoJogo } from "@/features/pontos/useEstadoJogo.js";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  // Lote diário de vozes do Gemini (falas fixas), em segundo plano: só com sessão de verdade.
  useEffect(() => {
    if (user?.id) dispararLoteVozes();
  }, [user?.id]);
  const { triggerHaptic } = useTheme();
  // Só o layout da tela atual é montado: o outro rodaria um segundo Goti em vídeo, escondido.
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const cleanUserName = user?.name ? user.name.split(" ")[0] : (user?.full_name ? user.full_name.split(" ")[0] : "Estudante");

  const gameState = useEstadoJogo(user?.id);
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

  // Busca a última atividade em andamento no histórico do usuário
  const latestActivity = useMemo(() => {
    return clinicalHistoryService.getLatestInProgressActivity(user?.id);
  }, [user?.id]);

  const hasInProgressCase = Boolean(latestActivity);

  // Módulos recomendados para as "Sugestões de Hoje" no desktop
  const desktopSuggestions = useMemo(() => [
    { id: "consulta", title: "Consulta ao Vivo", subtitle: "10 min · Converse com um paciente por voz ou texto", badge: "Voz", highlight: true, icon: Stethoscope, rota: "/consulta" },
    { id: "sbar", title: "Plantão ao Vivo", subtitle: "8 min · Receba a passagem SBAR da enfermeira Ana", badge: "SBAR", highlight: false, icon: ArrowRightLeft, rota: "/passagem-plantao" },
    { id: "doses", title: "Cálculo com o Dr. Rui", subtitle: "5 min · Gotejamento, diluição e BIC", badge: "Doses", highlight: false, icon: Calculator, rota: "/laboratorio-calculos" },
    { id: "minijogos", title: "Minijogos", subtitle: "Pratique com as mãos: bandeja, ausculta e mais", badge: "Jogos", highlight: false, icon: Gamepad2, rota: "/minijogos" },
    { id: "tecnicas", title: "Vídeos e POPs", subtitle: "Passo a passo com vídeo e checklist", badge: "POPs", highlight: false, icon: Video, rota: "/tecnicas" },
    { id: "casos", title: "Casos Clínicos", subtitle: "Processo de Enfermagem · 5 etapas", badge: "NANDA-I", highlight: false, icon: BookOpen, rota: "/simulador-casos" },
  ].map((s) => ({
    ...s,
    action: () => {
      triggerHaptic(15);
      navigate(s.rota);
    },
  })), [navigate, triggerHaptic]);

  return (
    <div className="min-h-screen bg-[#0B131D] flex flex-col text-[#EAF2F8] pb-24 md:pb-12 transition-colors select-none">
      {/* Header Clássico no Desktop */}
      <StudentHeader activeTab="hub" desktopOnly={true} />

      <main className="flex-1 mx-auto max-w-5xl w-full px-4 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* ========================================================================= */}
        {/* VISUALIZAÇÃO MOBILE (EnfereVivoTrail com Goti ampliado e Sugestões)       */}
        {/* ========================================================================= */}
        {!isDesktop && (
        <div className="md:hidden">
          <EnfereVivoTrail
            userName={cleanUserName}
            onOpenAIChat={() => {
              triggerHaptic(20);
              window.dispatchEvent(new CustomEvent("open-goti-chat"));
            }}
          />
        </div>
        )}

        {/* ========================================================================= */}
        {/* VISUALIZAÇÃO COMPUTADOR (PC / Telas Médias e Grandes)                     */}
        {/* ========================================================================= */}
        {isDesktop && (
        <div className="hidden md:block space-y-6">
          {/* Header Superior do Painel PC: Saudação, Mascote Goti Ampliado, Ofensiva e PE */}
          <div className="flex items-center justify-between gap-6 bg-[#131F2E] border border-[#1F3045] rounded-3xl p-6 relative overflow-hidden">

            <div className="flex items-center gap-6 z-10">
              {/* Mascote Goti Animado em Proporção Destaque Ampliado */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(20);
                  window.dispatchEvent(new CustomEvent("open-goti-chat"));
                }}
                className="cursor-pointer group shrink-0 tap-press rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#20D5B5]"
                title="Conversar com o Preceptor Goti"
                aria-label="Conversar com o Preceptor Goti"
              >
                <GotiAnimated
                  animation="wave"
                  size="lg"
                  className="w-24 h-24 lg:w-28 lg:h-28 shrink-0"
                />
              </button>

              <div className="space-y-1.5">
                <h1 className="text-2xl lg:text-3xl font-black text-[#EAF2F8] tracking-tight">
                  Olá, {cleanUserName}
                </h1>
                <p className="text-sm font-semibold text-[#9FB3C6]">
                  Pronto para a prática clínica hoje?
                </p>

                {/* Meta do Dia no Desktop */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs font-black text-[#EAF2F8]">Meta do dia:</span>
                  <AnimatedProgress value={dailyGoalPercent} tone={dailyGoalPercent >= 100 ? "success" : "brand"} className="w-48 h-2.5" label="Meta do dia" />
                  <span className="text-xs font-bold text-[#9FB3C6]">{todayActivitiesCount} de 3 atividades</span>
                </div>
              </div>
            </div>

            {/* Badges de Ofensiva e Pontos de Estudo (PE) */}
            <div className="flex items-center gap-3 z-10">
              <ChipOfensiva estado={gameState} />
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#16222E] border border-[#27394B] text-[#20D5B5] text-sm font-black">
                <Zap className="w-5 h-5 fill-current text-[#20D5B5]" />
                <span><AnimatedNumber value={gameState.studyPoints ?? 0} /> PE</span>
              </div>
            </div>
          </div>

          {/* Card "Continuar de Onde Parou" Dinâmico / Boas-Vindas */}
          {hasInProgressCase ? (
            <div className="bg-[#131F2E] rounded-3xl border border-[#1F3045] p-6 space-y-4 relative overflow-hidden">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-[#EAF2F8] leading-snug">
                  Continue de onde parou
                </h2>
                <p className="text-base font-semibold text-[#EAF2F8] leading-snug">
                  {latestActivity.title}
                </p>
                <p className="text-sm font-medium text-[#9FB3C6]">
                  {latestActivity.moduleLabel || "Casos clínicos"}
                  {latestActivity.patientInfo ? ` · ${latestActivity.patientInfo}` : ""}
                  {` · etapa ${latestActivity.step || 1}, ${latestActivity.progressPercentage || 0}% concluído`}
                </p>
              </div>

              {/* Barra de Progresso Real */}
              <AnimatedProgress value={latestActivity.progressPercentage || 0} minVisible={10} label="Progresso do caso" />

              {/* Botão de Ação Primária em Ciano 3D */}
              <div className="pt-1 flex gap-3">
                <button
                  onClick={() => {
                    triggerHaptic(20);
                    navigate(clinicalHistoryService.rotaDeRetomada(latestActivity.moduleType));
                  }}
                  className="btn-3d-teal flex-1 h-12 text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continuar Simulação</span>
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </button>
                <button
                  onClick={() => {
                    triggerHaptic(15);
                    navigate("/consulta");
                  }}
                  className="btn-3d-outline px-5 h-12 text-sm flex items-center gap-2 cursor-pointer"
                >
                  <Stethoscope className="w-4 h-4 text-[#20D5B5]" />
                  <span>Nova consulta</span>
                </button>
              </div>
            </div>
          ) : (
            // Boas-Vindas para novo aluno / sem histórico prévio
            <div className="bg-[#131F2E] rounded-3xl border border-[#1F3045] p-6 space-y-4 relative overflow-hidden">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-[#EAF2F8] leading-snug">
                  Comece pela consulta
                </h2>
                <p className="text-sm font-medium text-[#9FB3C6] leading-relaxed max-w-2xl">
                  Converse com um paciente na Consulta ao Vivo, receba o plantão da enfermeira Ana ou treine doses com o Dr. Rui.
                </p>
              </div>

              <div className="pt-1 flex gap-3">
                <button
                  onClick={() => {
                    triggerHaptic(20);
                    navigate("/consulta");
                  }}
                  className="btn-3d-teal px-6 h-12 text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Stethoscope className="w-[18px] h-[18px] stroke-[2.5]" />
                  <span>Começar uma consulta</span>
                </button>
                <button
                  onClick={() => {
                    triggerHaptic(15);
                    navigate("/simulador-casos");
                  }}
                  className="btn-3d-outline px-5 h-12 text-sm flex items-center gap-2 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-[#20D5B5]" />
                  <span>Casos Clínicos</span>
                </button>
              </div>
            </div>
          )}

          {/* Seção Principal Centralizada: "Sugestões de Hoje" */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-black text-[#EAF2F8] tracking-tight">
                Para hoje
              </h3>
            </div>

            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" variants={listStagger} initial="hidden" animate="show">
              {desktopSuggestions.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    variants={fadeUp}
                    whileTap={{ scale: 0.98 }}
                    onClick={item.action}
                    className={`flex flex-col justify-between p-5 min-h-[150px] rounded-2xl border text-left transition-colors group cursor-pointer ${
                      item.highlight
                        ? "bg-[#131F2E] border-[#20D5B5]/60 hover:border-[#20D5B5]"
                        : "bg-[#131F2E] border-[#1F3045] hover:border-[#20D5B5]/70"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          item.highlight
                            ? "bg-[#20D5B5] text-[#06302E]"
                            : "bg-[#16222E] border border-[#27394B] text-[#20D5B5]"
                        }`}
                      >
                        <Icon className="w-[22px] h-[22px] stroke-[2.2]" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <strong className="block text-sm font-black text-[#EAF2F8] leading-snug group-hover:text-[#20D5B5] transition-colors">
                        {item.title}
                      </strong>
                      <p className="text-xs text-[#9FB3C6] font-medium leading-relaxed">
                        {item.subtitle}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          </div>
        </div>
        )}

      </main>

      {/* Footer Unificado com Bottom Dock no Mobile */}
      <StudentFooter />
    </div>
  );
}
