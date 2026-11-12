import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m as motion } from "framer-motion";
import { HeartHandshake, Phone, MessageCircle } from "lucide-react";
import { APOIO, riscoDeVida } from "../../../supabase/functions/_shared/logica/seguranca.js";

const EASE = [0.23, 1, 0.32, 1];
const EVENTO = "enfere:apoio";

/** Chame com o texto do aluno antes de mandar para a IA: se falar em se matar, abre o aviso de apoio. */
export function conferirApoio(texto) {
  if (!riscoDeVida(texto)) return false;
  try {
    window.dispatchEvent(new CustomEvent(EVENTO));
  } catch {
    /* sem janela */
  }
  return true;
}

const ICONES = { "tel:188": Phone, "https://cvv.org.br": MessageCircle, "tel:192": Phone };

/**
 * Pausa na simulação quando o aluno diz que pensa em se matar ou se machucar (Consulta e Plantão). Não é parte
 * do treino: mostra onde pedir ajuda agora. A conversa continua por baixo quando ele fechar.
 */
export default function AvisoApoio() {
  const [aberta, setAberta] = useState(false);
  const botao = useRef(null);
  useEffect(() => {
    const abrir = () => setAberta(true);
    window.addEventListener(EVENTO, abrir);
    return () => window.removeEventListener(EVENTO, abrir);
  }, []);
  useEffect(() => {
    if (!aberta) return undefined;
    const t = setTimeout(() => botao.current?.focus({ preventScroll: true }), 150);
    const esc = (e) => e.key === "Escape" && setAberta(false);
    window.addEventListener("keydown", esc);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", esc);
    };
  }, [aberta]);
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {aberta && (
        <motion.div
          key="aviso-apoio"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="aviso-apoio-titulo"
            aria-describedby="aviso-apoio-texto"
            className="w-full max-w-sm rounded-3xl border-2 border-[#FFC247]/70 bg-[#131F2E] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.6)]"
            initial={{ opacity: 0, transform: "translateY(12px) scale(0.97)" }}
            animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
            exit={{ opacity: 0, transform: "translateY(8px) scale(0.98)" }}
            transition={{ duration: 0.22, ease: EASE }}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFC247]/15">
                <HeartHandshake className="h-7 w-7 text-[#FFC247]" aria-hidden="true" />
              </span>
              <h2 id="aviso-apoio-titulo" className="text-lg font-black leading-tight text-[#EAF2F8]">{APOIO.titulo}</h2>
            </div>
            <p id="aviso-apoio-texto" className="mt-3 text-[15px] font-semibold leading-relaxed text-[#C9D6E2]">{APOIO.texto}</p>
            <div className="mt-4 grid gap-2">
              {APOIO.contatos.map((c, i) => {
                const Icone = ICONES[c.href] ?? Phone;
                return (
                  <a
                    key={c.href}
                    href={c.href}
                    target={c.href.startsWith("http") ? "_blank" : undefined}
                    rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className={`${i === 0 ? "btn-3d-amber" : "btn-3d-outline"} flex items-center justify-center gap-2 rounded-2xl py-3 text-base font-extrabold`}
                  >
                    <Icone className="h-5 w-5" aria-hidden="true" />
                    {c.rotulo}
                  </a>
                );
              })}
            </div>
            <button ref={botao} type="button" onClick={() => setAberta(false)} className="mt-3 w-full rounded-2xl py-2.5 text-sm font-bold text-[#9FB3C6] transition-colors hover:text-[#EAF2F8]">
              Voltar para a conversa
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
