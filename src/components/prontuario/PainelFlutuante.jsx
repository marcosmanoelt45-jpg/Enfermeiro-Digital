import React from "react";
import PropTypes from "prop-types";
import { AnimatePresence, m as motion } from "framer-motion";
import { X } from "lucide-react";

// Painel no topo da tela (celular), sem escurecer o resto: dá para ler o prontuário e continuar
// digitando ou gravando a resposta embaixo. No computador o prontuário fica ao lado da conversa.
export default function PainelFlutuante({ aberto, titulo, onFechar, children }) {
  return (
    <AnimatePresence>
      {aberto && (
        <motion.section
          className="fixed inset-x-0 top-0 z-40 max-h-[52vh] overflow-y-auto overscroll-contain rounded-b-3xl border-b border-[#27394B] bg-[#0B131D]/97 px-3 pb-3 shadow-[0_14px_30px_rgba(0,0,0,0.55)] backdrop-blur lg:hidden"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          aria-label={titulo}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between bg-[#0B131D] py-2">
            <h2 className="text-sm font-extrabold">{titulo}</h2>
            <button type="button" onClick={onFechar} className="rounded-full p-2 text-[#9FB3C6]" aria-label={`Fechar ${titulo}`}>
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          {children}
        </motion.section>
      )}
    </AnimatePresence>
  );
}

PainelFlutuante.propTypes = { aberto: PropTypes.bool.isRequired, titulo: PropTypes.string.isRequired, onFechar: PropTypes.func.isRequired, children: PropTypes.node };
