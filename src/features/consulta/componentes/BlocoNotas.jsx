import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { AnimatePresence, m as motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { scrimVariants, sheetVariants } from "@/lib/motion";

export const MAX_NOTAS = 1500;

// Atalhos de anamnese: tocam e acrescentam o rótulo numa linha nova, para o aluno completar.
const ATALHOS = ["Queixa:", "Início:", "Dor (0-10):", "Medicações:", "Alergias:", "Antecedentes:", "Hábitos:", "Sinais vitais:"];

/** Folha de anotações durante a consulta. O texto vira os "achados" do registro ao encerrar. */
export default function BlocoNotas({ aberto, texto, onMudar, onFechar }) {
  const area = useRef(null);

  useEffect(() => {
    if (!aberto) return undefined;
    const t = setTimeout(() => area.current?.focus(), 250);
    const esc = (e) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", esc);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", esc);
    };
  }, [aberto, onFechar]);

  const acrescentar = (rotulo) => {
    const base = texto.trimEnd();
    onMudar(`${base ? `${base}\n` : ""}${rotulo} `.slice(0, MAX_NOTAS));
    area.current?.focus();
  };

  return (
    <AnimatePresence>
      {aberto && (
        <div className="fixed inset-0 z-40 flex items-end" role="dialog" aria-modal="true" aria-labelledby="notas-titulo">
          <motion.div className="absolute inset-0 bg-black/60" variants={scrimVariants} initial="hidden" animate="show" exit="exit" onClick={onFechar} />
          <motion.div className="relative mx-auto w-full max-w-xl space-y-3 rounded-t-3xl border border-[#27394B] bg-[#0B131D] p-4 pb-8" variants={sheetVariants} initial="hidden" animate="show" exit="exit">
            <div className="flex items-center justify-between">
              <h2 id="notas-titulo" className="text-lg font-extrabold">Anotações</h2>
              <Button variant="ghost" size="icon" onClick={onFechar} aria-label="Fechar anotações">
                <X size={20} aria-hidden="true" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {ATALHOS.map((a) => (
                <button key={a} type="button" onClick={() => acrescentar(a)} className="rounded-full border border-[#27394B] bg-[#16222E] px-3 py-1.5 text-xs font-bold text-[#EAF2F8] active:scale-95">
                  {a.replace(":", "")}
                </button>
              ))}
            </div>
            <Textarea
              ref={area}
              value={texto}
              onChange={(e) => onMudar(e.target.value.slice(0, MAX_NOTAS))}
              rows={8}
              placeholder="Anote o que o paciente contar. Isso vai para o seu registro ao encerrar."
              className="min-h-[10rem] resize-none border-[#27394B] bg-[#131F2E] text-[#EAF2F8]"
              aria-label="Anotações da consulta"
            />
            <div className="flex items-center justify-between text-xs font-semibold text-[#9FB3C6]">
              <span>Salvo automaticamente</span>
              <span>{texto.length}/{MAX_NOTAS}</span>
            </div>
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
};
