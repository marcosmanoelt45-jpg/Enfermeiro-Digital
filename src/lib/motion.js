/**
 * Tokens de movimento "Enfere Vivo".
 *
 * Fonte única para durações, curvas e molas usadas pelo framer-motion.
 * As mesmas curvas existem como variáveis CSS em src/index.css (--ease-*, --dur-*).
 *
 * Regras (Emil Kowalski / impeccable):
 * - Entradas e saídas usam ease-out forte; nunca ease-in em UI.
 * - Interações de UI ficam abaixo de 300ms; celebrações podem passar disso.
 * - Nada surge de scale(0): partir de 0.9+ combinado com opacidade.
 * - Só animar transform e opacity (compositor), nunca width/height em listas.
 * - Toda animação respeita prefers-reduced-motion (MotionConfig reducedMotion="user").
 */

export const ease = {
  out: [0.23, 1, 0.32, 1],
  inOut: [0.77, 0, 0.175, 1],
  drawer: [0.32, 0.72, 0, 1],
  overshoot: [0.34, 1.56, 0.64, 1],
};

export const duration = {
  press: 0.11,
  fast: 0.16,
  base: 0.22,
  slow: 0.32,
};

export const spring = {
  /** Resposta tátil de botões e chips. */
  snappy: { type: "spring", stiffness: 520, damping: 32, mass: 0.8 },
  /** Folhas inferiores, gavetas e cartões que sobem. */
  sheet: { type: "spring", stiffness: 380, damping: 36, mass: 0.9 },
  /** Indicadores que deslizam (dock, abas). */
  glide: { type: "spring", stiffness: 460, damping: 38 },
  /** Comemorações: um pouco de quique, nunca exagerado. */
  pop: { type: "spring", stiffness: 420, damping: 18, mass: 0.7 },
  /** Barras de progresso e contadores. */
  fill: { type: "spring", stiffness: 140, damping: 24 },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: duration.base, ease: ease.out } },
};

export const listStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.04 } },
};

export const popIn = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: spring.pop },
};

export const sheetVariants = {
  hidden: { y: "100%" },
  show: { y: 0, transition: spring.sheet },
  exit: { y: "100%", transition: { duration: duration.base, ease: ease.drawer } },
};

export const scrimVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: duration.base, ease: ease.out } },
  exit: { opacity: 0, transition: { duration: duration.fast, ease: ease.out } },
};

/** Tremida curta de erro (horizontal, 4 oscilações, ~360ms). */
export const shake = {
  x: [0, -8, 8, -6, 6, -3, 0],
  transition: { duration: 0.36, ease: "easeOut" },
};

/** Vibração física curta, só em aparelhos que suportam e quando o usuário permite. */
export function vibrate(pattern = 12) {
  try {
    if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
    if (localStorage.getItem("enfermeiro_haptic") === "false") return;
    navigator.vibrate(pattern);
  } catch {
    // Navegadores sem Vibration API (iOS Safari) simplesmente ignoram.
  }
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}
