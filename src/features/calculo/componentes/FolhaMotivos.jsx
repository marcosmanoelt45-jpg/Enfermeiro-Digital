import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { AnimatePresence, m as motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { sheetVariants, scrimVariants } from "@/lib/motion";
import { MOTIVOS } from "../logica/rodada.js";

// Folha inferior: "Por que você está questionando?". Esc ou toque fora fecham.
export default function FolhaMotivos({ aberta, onEscolher, onFechar }) {
  useEffect(() => {
    if (!aberta) return undefined;
    const esc = (e) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [aberta, onFechar]);

  return (
    <AnimatePresence>
      {aberta && (
        <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true" aria-labelledby="folha-motivos-titulo">
          <motion.div className="absolute inset-0 bg-black/70" variants={scrimVariants} initial="hidden" animate="show" exit="exit" onClick={onFechar} />
          <motion.div className="relative w-full space-y-3 rounded-t-3xl border border-[#27394B] bg-[#0B131D] p-4 pb-8" variants={sheetVariants} initial="hidden" animate="show" exit="exit">
            <h2 id="folha-motivos-titulo" className="text-lg font-extrabold">Por que você questiona a prescrição?</h2>
            <div className="space-y-2">
              {MOTIVOS.map((mot) => (
                <Button key={mot.id} variant="outline" className="w-full justify-start" onClick={() => onEscolher(mot)}>
                  {mot.rotulo}
                </Button>
              ))}
            </div>
            <Button variant="ghost" className="w-full" onClick={onFechar}>Voltar ao cálculo</Button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

FolhaMotivos.propTypes = {
  aberta: PropTypes.bool.isRequired,
  onEscolher: PropTypes.func.isRequired,
  onFechar: PropTypes.func.isRequired,
};
