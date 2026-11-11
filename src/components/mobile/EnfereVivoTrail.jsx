import React, { useMemo } from "react";
import { m as motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Flame,
  Zap,
  Stethoscope,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { useAuth } from "@/lib/AuthContext";
import { clinicalHistoryService } from "@/services/clinicalHistoryService";
import { clinicalGamificationService } from "@/services/clinicalGamificationService";
import GotiAnimated from "@/components/mascot/GotiAnimated";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { AnimatedProgress } from "@/components/ui/animated-progress";
import { fadeUp, listStagger } from "@/lib/motion";
import { modulosDaTrilha } from "@/features/navegacao/modulos";
import { icone } from "@/features/navegacao/icones";

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

  // Módulos sugeridos de hoje (Consulta ao Vivo em destaque)
  const suggestions = useMemo(
    () =>
      modulosDaTrilha().map((m) => ({
        id: m.id,
        title: m.titulo,
        subtitle: m.subtitulo,
        badge: m.selo,
        highlight: m.destaque,
        icon: icone(m.icone),
        action: () => {
          triggerHaptic(15);
          navigate(m.rota);
        }
      })),
    [navigate, triggerHaptic]
  );

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
          className="w-11 h-11 rounded-full bg-[#20D5B5] text-[#06302E] font-black text-lg flex items-center justify-center shadow-[0_3px_0_#149F86] border-2 border-white/20 tap-press cursor-pointer"
          title="Minha Conta"
          aria-label="Minha Conta"
        >
          {userInitial}
        </button>

        {/* Chips de Ofensiva e PE */}
        <div className="flex items-center gap-2">
          {/* Chip Ofensiva */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#16222E] border border-[#27394B] text-[#FFC247] text-xs font-black shadow-sm">
            <Flame className={`w-4 h-4 fill-current text-[#FFC247] ${gameState.streak ? "animate-flame-subtle" : ""}`} />
            <span><AnimatedNumber value={gameState.streak || 0} /> {gameState.streak === 1 ? "dia" : "dias"}</span>
          </div>

          {/* Chip PE */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#16222E] border border-[#27394B] text-[#20D5B5] text-xs font-black shadow-sm">
            <Zap className="w-4 h-4 fill-current text-[#20D5B5]" />
            <span><AnimatedNumber value={gameState.studyPoints ?? 0} /> PE</span>
          </div>
        </div>
      </div>

      {/* 2. Saudação com Mascote Goti em Destaque Ampliado */}
      <div className="flex items-center gap-3.5 bg-[#131F2E] border border-[#1F3045] rounded-3xl p-3.5">
        <div
          onClick={() => {
            triggerHaptic(20);
            if (onOpenAIChat) onOpenAIChat();
            else window.dispatchEvent(new CustomEvent("open-goti-chat"));
          }}
          className="cursor-pointer shrink-0 tap-press"
          title="Falar com o Preceptor Goti"
          role="button"
          tabIndex={0}
          aria-label="Falar com o Preceptor Goti"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (onOpenAIChat) onOpenAIChat();
              else window.dispatchEvent(new CustomEvent("open-goti-chat"));
            }
          }}
        >
          {/* Goti ampliado com tamanho expressivo e amigável */}
          <GotiAnimated
            animation="wave"
            size="md"
            className="w-20 h-20 shrink-0"
          />
        </div>
        <div className="min-w-0 flex-1">
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
          <span className={dailyGoalPercent >= 100 ? "text-[#3DD68C]" : "text-[#9FB3C6]"}>
            {dailyGoalPercent >= 100 ? "Meta batida! " : ""}{todayActivitiesCount} de 3 atividades hoje
          </span>
        </div>
        <AnimatedProgress value={dailyGoalPercent} tone={dailyGoalPercent >= 100 ? "success" : "brand"} label="Meta do dia" />
      </div>

      {/* 4. Card "Continuar de Onde Parou" Inteligente e Individual */}
      {hasInProgressCase ? (
        // Caso em andamento recuperado do histórico do estudante
        <div className="bg-[#131F2E] rounded-3xl border border-[#1F3045] p-4 sm:p-5 space-y-3.5 relative overflow-hidden">
          <div className="space-y-1">
            <h2 className="text-base font-black text-[#EAF2F8] leading-snug">
              Continue de onde parou
            </h2>
            <p className="text-sm font-semibold text-[#EAF2F8] leading-snug">
              {latestActivity.title}
            </p>
            <p className="text-xs font-medium text-[#9FB3C6]">
              {latestActivity.moduleLabel || "Casos clínicos"}
              {latestActivity.patientInfo ? ` · ${latestActivity.patientInfo}` : ""}
              {` · etapa ${latestActivity.step || 1}, ${latestActivity.progressPercentage || 0}% concluído`}
            </p>
          </div>

          {/* Barra de Progresso Real */}
          <AnimatedProgress value={latestActivity.progressPercentage || 0} minVisible={10} className="h-2.5" label="Progresso do caso" />

          {/* Botão Largo "Continuar" em Ciano 3D */}
          <button
            onClick={() => {
              triggerHaptic(20);
              navigate(clinicalHistoryService.rotaDeRetomada(latestActivity.moduleType));
            }}
            className="btn-3d-teal w-full h-12 text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Continuar</span>
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      ) : (
        // Boas-vindas para primeiro acesso / usuário sem casos em andamento
        <div className="bg-[#131F2E] rounded-3xl border border-[#1F3045] p-4 sm:p-5 space-y-3.5 relative overflow-hidden">
          <div className="space-y-1">
            <h2 className="text-base font-black text-[#EAF2F8] leading-snug">
              Comece pela consulta
            </h2>
            <p className="text-xs font-medium text-[#9FB3C6] leading-relaxed">
              Converse com um paciente por voz ou texto, anote o que ele contar e receba nota e comentários.
            </p>
          </div>

          {/* Botão Largo em Ciano 3D */}
          <button
            onClick={() => {
              triggerHaptic(20);
              navigate("/consulta");
            }}
            className="btn-3d-teal w-full h-12 text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Stethoscope className="w-[18px] h-[18px] stroke-[2.5]" />
            <span>Começar uma consulta</span>
          </button>
        </div>
      )}

      {/* 5. Seção "Sugestões de Hoje" */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-0.5">
          <div>
            <h3 className="text-base font-black text-[#EAF2F8] tracking-tight">
              Para hoje
            </h3>
          </div>
        </div>

        <motion.div className="space-y-2" variants={listStagger} initial="hidden" animate="show">
          {suggestions.map((item) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                variants={fadeUp}
                whileTap={{ scale: 0.98 }}
                onClick={item.action}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-colors group cursor-pointer ${
                  item.highlight
                    ? "bg-[#131F2E] border-[#20D5B5]/60"
                    : "bg-[#131F2E] border-[#1F3045] hover:border-[#20D5B5]/60"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      item.highlight
                        ? "bg-[#20D5B5] text-[#06302E]"
                        : "bg-[#16222E] border border-[#27394B] text-[#20D5B5]"
                    }`}
                  >
                    <Icon className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <div>
                      <strong className="block text-sm font-black text-[#EAF2F8] truncate group-hover:text-[#20D5B5] transition-colors">
                        {item.title}
                      </strong>
                    </div>
                    <span className="block text-xs font-medium text-[#9FB3C6] truncate mt-0.5">
                      {item.subtitle}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8A9DB1] group-hover:text-[#20D5B5] group-hover:translate-x-0.5 transition-all shrink-0" />
              </motion.button>
            );
          })}
        </motion.div>
      </div>

    </div>
  );
}
