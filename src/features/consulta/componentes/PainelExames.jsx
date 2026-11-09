import React from "react";
import PropTypes from "prop-types";
import { AnimatePresence, m as motion } from "framer-motion";
import { Loader2, Stethoscope } from "lucide-react";
import { ROTULO_EXAME } from "../dados/exames.js";

/** Exame pedido na conversa (botão para fazer) e os resultados já obtidos, logo abaixo do paciente. */
export default function PainelExames({ pedido, fazendo, exames, onFazer, onDispensar }) {
  if (!pedido && exames.length === 0) return null;
  return (
    <div className="space-y-2">
      <AnimatePresence>
        {pedido && (
          <motion.div
            className="flex items-center gap-2 rounded-2xl border border-[#20D5B5]/40 bg-[#20D5B5]/10 p-2 pl-3"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
          >
            <Stethoscope size={18} className="shrink-0 text-[#20D5B5]" aria-hidden="true" />
            <span className="min-w-0 flex-1 text-sm font-bold">{ROTULO_EXAME[pedido] ?? "Exame"}</span>
            <button type="button" onClick={onDispensar} className="rounded-xl px-2 py-1.5 text-xs font-bold text-[#9FB3C6]">
              Agora não
            </button>
            <button type="button" onClick={onFazer} disabled={fazendo} className="btn-3d-teal inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold">
              {fazendo && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
              {fazendo ? "Examinando…" : "Fazer"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {exames.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Exames feitos">
          {exames.map((x) => (
            <li key={x.exameId} className="rounded-xl border border-[#27394B] bg-[#131F2E] px-2.5 py-1.5 text-xs font-semibold">
              <span className="text-[#9FB3C6]">{x.rotulo}:</span> <b className="text-[#EAF2F8]">{x.resultado}</b>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

PainelExames.propTypes = {
  pedido: PropTypes.string,
  fazendo: PropTypes.bool,
  exames: PropTypes.array.isRequired,
  onFazer: PropTypes.func.isRequired,
  onDispensar: PropTypes.func.isRequired,
};
