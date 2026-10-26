import React, { useState } from "react";
import {
  X,
  Sparkles,
  Shield,
  Lightbulb,
  Flame,
  Award,
  CheckCircle2,
  TrendingUp,
  Target,
  Snowflake
} from "lucide-react";
import { clinicalGamificationService } from "@/services/clinicalGamificationService";
import { useTheme } from "@/lib/ThemeContext";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

export default function GotiStudyPointsModal({ isOpen, onClose }) {
  const { triggerHaptic } = useTheme();
  const [gameState, setGameState] = useState(() => clinicalGamificationService.getState());

  if (!isOpen) return null;

  const currentPe = gameState.studyPoints ?? gameState.totalXp ?? 0;
  const freezeCount = gameState.streakFreezeAvailable || 0;

  const handleBuyStreakFreeze = () => {
    triggerHaptic(25);
    const result = clinicalGamificationService.spendStudyPoints(30, "streak_freeze");
    if (result.success) {
      setGameState(clinicalGamificationService.getState());
      toast({
        title: "❄️ Congelamento de Plantão Adquirido!",
        description: "Seu streak de dias está protegido contra imprevistos na escala hospitalar."
      });
    } else {
      toast({
        title: "Saldo Insuficiente de PE",
        description: result.reason || "Complete mais tarefas para acumular 30 Pontos de Estudo.",
        variant: "destructive"
      });
    }
  };

  // Critérios pedagógicos de pontuação por mérito
  const scoringCriteria = [
    {
      icon: Target,
      title: "Resolução de Casos Clínicos",
      reward: "+50 PE",
      desc: "Completar as 5 etapas normatizadas do PE com raciocínio diagnóstico e julgamento clínico."
    },
    {
      icon: TrendingUp,
      title: "Cálculo de Doses Farmacológicas",
      reward: "+25 PE",
      desc: "Acertar o cálculo e regras de arredondamento em macrogotas, microgotas e diluições."
    },
    {
      icon: Lightbulb,
      title: "Passagem de Plantão SBAR",
      reward: "+35 PE",
      desc: "Treinar a comunicação segura SBAR por texto ou áudio com debriefing do Goti IA."
    },
    {
      icon: Shield,
      title: "Procedimentos e Técnicas Práticas",
      reward: "+30 PE",
      desc: "Completar checklists assépticos e treinar procedimentos operacionais padrão (POPs)."
    },
    {
      icon: Flame,
      title: "Ofensiva Clínica Diária (Streak)",
      reward: "+15 PE",
      desc: "Manter a regularidade de estudos diários na plataforma Enfere."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full sm:max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-[32px] sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-amber-500/10 via-teal-500/10 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                  Pontos de Estudo (PE)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Progresso & Mérito
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Acompanhe o seu acúmulo de mérito clínico e critérios de evolução.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic(20);
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Saldo Atual de PE e Nível */}
        <div className="p-5 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              Seu Saldo Acumulado
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
                {currentPe}
              </span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                PE (Pontos de Estudo)
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              Nível Clínico
            </span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{gameState.levelTitle || "Interno de Enfermagem"}</span>
            </div>
          </div>
        </div>

        {/* Área de Utilidades & Critérios de Pontuação */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Card de Congelamento de Plantão */}
          <div className="rounded-2xl border-2 border-sky-300 dark:border-sky-800 bg-gradient-to-r from-sky-50/80 via-blue-50/40 to-white dark:from-sky-950/40 dark:via-slate-900 dark:to-slate-900 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0 text-sky-600 dark:text-sky-400">
                <Snowflake className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    Congelamento de Plantão (Ofensiva)
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300">
                    Estoque: {freezeCount} ativo{freezeCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Protege seus dias consecutivos caso você fique sem praticar hoje por causa do plantão ou correria.
                </p>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={handleBuyStreakFreeze}
              disabled={currentPe < 30}
              className="rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-2xs py-2 px-4 tap-press disabled:opacity-50"
            >
              <Snowflake className="w-3.5 h-3.5" />
              <span>Comprar por 30 PE</span>
            </Button>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Como Ganhar Pontos de Estudo
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Os Pontos de Estudo refletem a sua dedicação clínica e precisão técnica nas atividades formativas.
            </p>
          </div>

          <div className="space-y-2.5">
            {scoringCriteria.map((item, index) => {
              const IconComp = item.icon;
              return (
                <div
                  key={index}
                  className="p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 text-xs font-black px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    {item.reward}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rodapé explicativo */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>💡 Seus pontos são vitalícios e medem seu domínio formativo.</span>
          <button
            onClick={() => {
              triggerHaptic(15);
              onClose();
            }}
            className="font-bold text-teal-600 dark:text-teal-400 hover:underline"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
