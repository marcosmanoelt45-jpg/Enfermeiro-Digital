import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import LojaPE from "@/features/pontos/LojaPE.jsx";

/**
 * Loja de PE em folha (botão de PE do cabeçalho e do Perfil). O conteúdo é o mesmo da aba Loja do Perfil.
 * Remonta a cada abertura (lê o saldo atual).
 */
export default function GotiStudyPointsModal({ isOpen, onClose }) {
  const { user } = useAuth();

  useEffect(() => {
    if (!isOpen) return undefined;
    const esc = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="loja-pe-titulo"
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border-2 border-[#27394B] bg-[#0B131D] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 id="loja-pe-titulo" className="text-lg font-black text-[#EAF2F8]">
            Pontos de Estudo
          </h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#16222E] text-[#EAF2F8]">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <LojaPE userId={user?.id} />
      </div>
    </div>,
    document.body
  );
}
GotiStudyPointsModal.propTypes = { isOpen: PropTypes.bool, onClose: PropTypes.func };
