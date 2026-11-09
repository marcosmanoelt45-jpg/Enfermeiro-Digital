import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { AnimatePresence, m as motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scrimVariants, sheetVariants } from "@/lib/motion";
import FolhaEvolucao from "./FolhaEvolucao.jsx";

/** Folha de evolução no celular (folha inferior). No computador ela fica ao lado da conversa. */
export default function BlocoNotas({ aberto, texto, onMudar, onFechar, briefing = null, turnos = [] }) {
  useEffect(() => {
    if (!aberto) return undefined;
    const esc = (e) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [aberto, onFechar]);

  return (
    <AnimatePresence>
      {aberto && (
        <div className="fixed inset-0 z-40 flex items-end" role="dialog" aria-modal="true" aria-label="Evolução de enfermagem">
          <motion.div className="absolute inset-0 bg-black/60" variants={scrimVariants} initial="hidden" animate="show" exit="exit" onClick={onFechar} />
          <motion.div className="relative mx-auto max-h-[92vh] w-full max-w-xl space-y-3 overflow-y-auto rounded-t-3xl border border-[#27394B] bg-[#0B131D] p-4 pb-8" variants={sheetVariants} initial="hidden" animate="show" exit="exit">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-[#9FB3C6]">Salvo automaticamente</p>
              <Button variant="ghost" size="icon" onClick={onFechar} aria-label="Fechar evolução">
                <X size={20} aria-hidden="true" />
              </Button>
            </div>
            <FolhaEvolucao texto={texto} onMudar={onMudar} briefing={briefing} turnos={turnos} linhas={10} idCampo="folha-evolucao-celular" />
            <Button variant="primary" className="w-full" onClick={onFechar}>Voltar à conversa</Button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

BlocoNotas.propTypes = {
  aberto: PropTypes.bool.isRequired,
  texto: PropTypes.string.isRequired,
  onMudar: PropTypes.func.isRequired,
  onFechar: PropTypes.func.isRequired,
  briefing: PropTypes.object,
  turnos: PropTypes.array,
};
