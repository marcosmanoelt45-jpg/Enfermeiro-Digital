import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, m as motion } from "framer-motion";
import { X, Trophy, Sparkles, ArrowRight, MessageCircle } from "lucide-react";
import GotiAnimated from "./GotiAnimated";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { popIn, scrimVariants } from "@/lib/motion";
import { celebrate } from "@/lib/celebrate";

// Pose, selo e texto do Goti conforme a nota. Abaixo de 50% o tom é de revisão, nunca de bronca.
function feedbackFor(score) {
  if (score >= 90) {
    return {
      pose: "jumping",
      badge: "Desempenho ouro",
      tone: "border-[#3DD68C]/40 bg-[#3DD68C]/15 text-[#3DD68C]",
      title: "Raciocínio impecável!",
      comment: "Você demonstrou raciocínio afiado, técnica precisa e segurança no cuidado.",
    };
  }
  if (score >= 80) {
    return {
      pose: "love",
      badge: "Alta precisão",
      tone: "border-[#20D5B5]/40 bg-[#20D5B5]/15 text-[#20D5B5]",
      title: "Excelente trabalho no plantão!",
      comment: "Seu raciocínio clínico foi assertivo e baseado em evidências.",
    };
  }
  if (score >= 50) {
    return {
      pose: "pointing",
      badge: "Pontos a lapidar",
      tone: "border-[#FFC247]/40 bg-[#FFC247]/15 text-[#FFC247]",
      title: "Bom trabalho! Vamos lapidar alguns pontos",
      comment: "Você captou a essência do caso. Veja as orientações para aperfeiçoar a decisão.",
    };
  }
  return {
    pose: "thinking",
    badge: "Vamos revisar juntos",
    tone: "border-[#FFC247]/40 bg-[#FFC247]/15 text-[#FFC247]",
    title: "Vamos revisar juntos",
    comment: "Alguns passos precisam de atenção. Revise o parecer com calma: o próximo plantão fica mais seguro.",
  };
}

/**
 * GotiEvaluationModal
 * Fechamento de atividade: Goti com pose pela nota, nota contando até o valor e o comentário do Goti.
 * Folha inferior no celular, cartão central no computador.
 */
export default function GotiEvaluationModal({
  isOpen,
  onClose,
  score = 100,
  scoreLabel = "Acurácia clínica",
  activityTitle = "Atividade prática concluída",
  comment = "",
  onContinue = null,
}) {
  const numScore = Math.max(0, Math.min(100, typeof score === "number" ? score : parseInt(score, 10) || 0));
  const [shownScore, setShownScore] = useState(0);
  const primaryRef = useRef(null);

  // Esc fecha só enquanto aberto; o foco vai para a ação principal; a nota conta a partir de 0.
  useEffect(() => {
    if (!isOpen) {
      setShownScore(0);
      return undefined;
    }
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => {
      setShownScore(numScore);
      primaryRef.current?.focus();
    }, 120);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [isOpen, numScore, onClose]);

  // Confete só em nota de excelência, uma vez por abertura.
  useEffect(() => {
    if (isOpen && numScore >= 90) celebrate({ count: 60, y: 0.4 });
  }, [isOpen, numScore]);

  const fb = feedbackFor(numScore);
  const finalComment = comment || fb.comment;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="goti-eval-scrim"
          variants={scrimVariants}
          initial="hidden"
          animate="show"
          exit="exit"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0B131D]/80 backdrop-blur-sm sm:p-4"
          onClick={onClose}
        >
          <motion.div
            variants={popIn}
            initial="hidden"
            animate="show"
            exit="hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="goti-eval-title"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border-2 border-[#27394B] bg-[#131F2E] p-6 sm:p-8 text-center text-[#EAF2F8] shadow-[0_6px_0_#0A1118] pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
          >
            <span className="mx-auto mb-3 block h-1.5 w-10 rounded-full bg-[#27394B] sm:hidden" aria-hidden="true" />

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="absolute top-3 right-3 grid size-11 place-items-center rounded-xl text-[#9FB3C6] transition-colors hover:bg-[#1F3045] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#20D5B5]"
            >
              <X className="h-5 w-5" />
            </button>

            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black ${fb.tone}`}>
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {fb.badge}
            </span>

            <div className="my-3 flex items-center justify-center select-none">
              <GotiAnimated animation={fb.pose} size="2xl" className="h-40 w-40 sm:h-52 sm:w-52 shrink-0" />
            </div>

            <h3 id="goti-eval-title" className="text-xl sm:text-2xl font-black leading-snug tracking-tight text-white">
              {fb.title}
            </h3>
            <p className="mt-1 text-xs font-semibold text-[#9FB3C6]">{activityTitle}</p>

            <div className="mx-auto my-4 inline-flex items-center gap-3 rounded-2xl border-2 border-[#27394B] bg-[#0E1722] px-6 py-3">
              <Trophy className="h-6 w-6 shrink-0 text-[#FFC247]" aria-hidden="true" />
              <div className="text-left">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#9FB3C6]">{scoreLabel}</span>
                <span className="text-3xl font-black leading-none text-white">
                  <AnimatedNumber value={shownScore} duration={0.8} />%
                </span>
              </div>
            </div>

            <div className="relative mt-1 w-full rounded-2xl border-2 border-[#27394B] bg-[#16222E] p-4 text-left text-sm leading-relaxed">
              <div className="absolute -top-2 left-1/2 h-0 w-0 -translate-x-1/2 border-x-8 border-b-8 border-x-transparent border-b-[#27394B]" aria-hidden="true" />
              <p className="mb-1 text-xs font-black text-[#20D5B5]">Comentário do Goti</p>
              <p className="font-medium text-[#EAF2F8]">{finalComment}</p>
            </div>

            <div className="mt-5 flex w-full flex-col gap-2">
              <Button
                ref={primaryRef}
                size="lg"
                className="w-full"
                onClick={() => {
                  onContinue?.();
                  onClose?.();
                }}
              >
                Continuar
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("open-goti-chat", {
                      detail: { prompt: `Recebi ${numScore}% em "${activityTitle}". O que devo revisar primeiro?` },
                    })
                  );
                  onClose?.();
                }}
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Perguntar ao Goti
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
