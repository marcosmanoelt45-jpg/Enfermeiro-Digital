import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { prefersReducedMotion } from "@/lib/motion";

const getHashId = (hash) => {
  const rawId = hash.slice(1);

  try {
    return decodeURIComponent(rawId);
  } catch {
    return rawId;
  }
};

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === "POP") return;

    if (hash) {
      const id = getHashId(hash);
      const timer = window.setTimeout(() => {
        const el = document.getElementById(id);
        el?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
        // Leitor de tela continua a partir da âncora.
        if (el && !el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
        el?.focus({ preventScroll: true });
      }, 50);
      return () => window.clearTimeout(timer);
    }

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash, navigationType]);

  return null;
}
