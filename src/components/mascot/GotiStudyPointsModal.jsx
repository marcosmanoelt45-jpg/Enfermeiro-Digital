import React, { useState } from "react";
import {
  X,
  Sparkles,
  Coins,
  Shield,
  Lightbulb,
  Flame,
  Award,
  Check,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import GotiMascot from "@/components/mascot/GotiMascot";
import {
  clinicalGamificationService,
  STUDY_POINTS_STORE_ITEMS
} from "@/services/clinicalGamificationService";
import { useTheme } from "@/lib/ThemeContext";

const ICON_MAP = {
  Lightbulb,
  Flame,
  Shield,
  Sparkles,
  Award
};

export default function GotiStudyPointsModal({ isOpen, onClose }) {
  const { triggerHaptic } = useTheme();
  const [gameState, setGameState] = useState(() => clinicalGamificationService.getState());
  const [feedback, setFeedback] = useState(null);

  if (!isOpen) return null;

  const currentPe = gameState.studyPoints ?? gameState.totalXp ?? 0;

  function handlePurchase(item) {
    triggerHaptic(30);
    const result = clinicalGamificationService.spendStudyPoints(item.cost, item.id);

    if (result.success) {
      setGameState(clinicalGamificationService.getState());
      setFeedback({
        type: "success",
        message: `Parabéns! Você adquiriu "${item.title}". ${item.benefit}`
      });
    } else {
      setFeedback({
        type: "error",
        message: result.reason
      });
    }

    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full sm:max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-[32px] sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho com o Goti e Saldo de PE */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-amber-500/10 via-teal-500/10 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <GotiMascot size={42} state="celebrating" showSpeech={false} interactive={false} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                  Pontos de Estudo (PE)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Benefícios Clínicos
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ganhe PE resolvendo casos, doses e SBAR. Invista em sua prática!
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

        {/* Banner do Saldo Atual de PE */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              Seu Saldo Disponível
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {currentPe}
              </span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                PE (Pontos de Estudo)
              </span>
            </div>
          </div>

          <div className="text-right text-[11px] text-slate-500 dark:text-slate-400">
            <span>🛡️ Congelamentos disponíveis: </span>
            <strong className="text-teal-600 dark:text-teal-400 font-bold">
              {gameState.streakFreezeAvailable || 0}
            </strong>
          </div>
        </div>

        {/* Feedback de Compra / Erro */}
        {feedback && (
          <div
            className={`p-3 text-xs font-medium flex items-center gap-2 border-b ${
              feedback.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                : "bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
            }`}
          >
            {feedback.type === "success" ? (
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Lista de Itens do Catálogo */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Utilidades & Resgates de Aprendizagem
          </p>

          <div className="space-y-3">
            {STUDY_POINTS_STORE_ITEMS.map((item) => {
              const IconComp = ICON_MAP[item.icon] || Sparkles;
              const hasEnough = currentPe >= item.cost;
              const isUnlocked = (gameState.unlockedItems || []).includes(item.id);

              return (
                <div
                  key={item.id}
                  className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-teal-400 dark:hover:border-teal-600 transition flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </h4>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      onClick={() => handlePurchase(item)}
                      disabled={!hasEnough}
                      size="sm"
                      className={`rounded-xl text-xs font-bold h-9 px-3 ${
                        hasEnough
                          ? "bg-amber-600 hover:bg-amber-700 text-white shadow-xs active:scale-95"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      <span>{item.cost} PE</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rodapé explicativo */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>💡 Como ganhar mais PE?</span>
          <span>Acertos de doses: +25 PE • Casos Clínicos: +50 PE • SBAR: +35 PE</span>
        </div>
      </div>
    </div>
  );
}
