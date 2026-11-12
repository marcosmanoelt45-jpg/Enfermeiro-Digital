import React, { useState } from "react";
import PropTypes from "prop-types";
import { AnimatePresence, m as motion } from "framer-motion";
import { Check, Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { vibrate } from "@/lib/motion";

/**
 * "Cutucar": quem já estudou lembra o amigo. Um toque por dia; depois o botão vira "Cutucado" com um check.
 * A mão balança uma vez no toque (feedback), sem animação em repouso.
 */
export default function BotaoCutucar({ nome, onCutucar, grande = false }) {
  const [feito, setFeito] = useState(false);
  const cutucar = () => {
    if (feito) return;
    vibrate(15);
    setFeito(true);
    onCutucar?.();
  };
  return (
    <Button
      type="button"
      variant={feito ? "outline" : "info"}
      size={grande ? "lg" : "sm"}
      className={grande ? "w-full" : ""}
      onClick={cutucar}
      disabled={feito}
      aria-label={feito ? `${nome} foi cutucado` : `Cutucar ${nome}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {feito ? (
          <motion.span
            key="ok"
            className="inline-flex items-center gap-1.5"
            initial={{ opacity: 0, transform: "scale(0.85)" }}
            animate={{ opacity: 1, transform: "scale(1)", transition: { type: "spring", duration: 0.35, bounce: 0.4 } }}
          >
            <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /> Cutucado
          </motion.span>
        ) : (
          <motion.span key="cutucar" className="inline-flex items-center gap-1.5" exit={{ opacity: 0, transition: { duration: 0.1 } }}>
            <motion.span
              className="inline-flex"
              style={{ transformOrigin: "70% 90%" }}
              whileTap={{ transform: "rotate(-25deg)" }}
            >
              <Hand className="h-4 w-4" strokeWidth={2.6} aria-hidden="true" />
            </motion.span>
            {grande ? `Cutucar ${nome}` : "Cutucar"}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
BotaoCutucar.propTypes = { nome: PropTypes.string.isRequired, onCutucar: PropTypes.func, grande: PropTypes.bool };
