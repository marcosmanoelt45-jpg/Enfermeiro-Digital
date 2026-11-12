import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import { AnimatePresence, m as motion } from "framer-motion";
import { Stethoscope } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const EASE = [0.23, 1, 0.32, 1];
const ANA = "/personagens/enfermeira-ana/poster.webp";

/**
 * Aviso da enfermeira Ana no começo da consulta ou do plantão: dá para pedir exame na conversa para conferir o
 * que ainda não está documentado. Aparece logo depois de a cena abrir; some ao tocar em "Entendi".
 */
export default function DicaExame({ exemplo, onFechar }) {
  const { user } = useAuth();
  // "Não mostrar de novo": guardado no aparelho, por conta.
  const chave = `enfere_dica_exame_oculta_${user?.id ?? "anon"}`;
  const [aberta, setAberta] = useState(false);
  const botao = useRef(null);
  useEffect(() => {
    let oculta = false;
    try {
      oculta = localStorage.getItem(chave) === "1";
    } catch {
      /* sem armazenamento: mostra */
    }
    if (oculta) return undefined;
    const t = setTimeout(() => setAberta(true), 450);
    return () => clearTimeout(t);
  }, [chave]);
  useEffect(() => {
    if (!aberta) return undefined;
    const t = setTimeout(() => botao.current?.focus({ preventScroll: true }), 150);
    const esc = (e) => e.key === "Escape" && fechar();
    window.addEventListener("keydown", esc);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", esc);
    };
  }, [aberta]); // eslint-disable-line react-hooks/exhaustive-deps
  const fechar = () => {
    setAberta(false);
    onFechar?.();
  };
  const naoMostrarMais = () => {
    try {
      localStorage.setItem(chave, "1");
    } catch {
      /* sem armazenamento: vale só agora */
    }
    fechar();
  };
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {aberta && (
        <motion.div
          key="dica-exame"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={fechar}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dica-exame-titulo"
            className="w-full max-w-sm rounded-3xl border-2 border-[#20D5B5]/60 bg-[#131F2E] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.6)]"
            initial={{ opacity: 0, transform: "translateY(12px) scale(0.97)" }}
            animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
            exit={{ opacity: 0, transform: "translateY(8px) scale(0.98)" }}
            transition={{ duration: 0.22, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <img src={ANA} alt="" className="h-16 w-16 shrink-0 rounded-2xl bg-[#0B131D] object-cover object-top" />
              <div className="min-w-0">
                <p className="text-xs font-extrabold uppercase tracking-wide text-[#20D5B5]">Enfermeira Ana</p>
                <h2 id="dica-exame-titulo" className="text-lg font-black leading-tight text-[#EAF2F8]">Faltou alguma informação?</h2>
              </div>
            </div>
            <p className="mt-3 text-[15px] font-semibold leading-relaxed text-[#C9D6E2]">
              Você pode pedir um exame para verificar o que ainda não está documentado no prontuário. É só dizer na conversa, por exemplo:
            </p>
            <p className="mt-2 flex items-start gap-2 rounded-2xl bg-[#0B131D] px-3 py-2.5 text-[15px] font-bold text-[#EAF2F8]">
              <Stethoscope className="mt-0.5 h-5 w-5 shrink-0 text-[#20D5B5]" aria-hidden="true" />
              <span>{exemplo}</span>
            </p>
            <p className="mt-2 text-sm font-semibold text-[#9FB3C6]">O resultado aparece no prontuário.</p>
            <button ref={botao} type="button" onClick={fechar} className="btn-3d-teal mt-4 w-full rounded-2xl py-3 text-base font-extrabold">
              Entendi
            </button>
            <button type="button" onClick={naoMostrarMais} className="mt-2 w-full rounded-2xl py-2.5 text-sm font-bold text-[#9FB3C6] transition-colors hover:text-[#EAF2F8]">
              Não mostrar de novo
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

DicaExame.propTypes = { exemplo: PropTypes.string.isRequired, onFechar: PropTypes.func };
