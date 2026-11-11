import React, { useEffect, useRef, useState } from "react";
import SaltoMascote from "./SaltoMascote.jsx";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { AnimatePresence, m as motion } from "framer-motion";
import { Check, Lightbulb, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sheetVariants } from "@/lib/motion";

// Rostos de quem dá o retorno nas cenas com personagem. O Goti não fica na mensagem: no acerto ele salta
// pelo meio da tela (SaltoMascote); nas outras folhas entra o ícone.
export const ROSTOS = {
  rui: { ok: "/personagens/medico-rui/poster.webp", erro: "/personagens/medico-rui/poster.webp", alerta: "/personagens/medico-rui/poster.webp", nome: "Dr. Rui" },
  ana: { ok: "/personagens/enfermeira-ana/poster.webp", erro: "/personagens/enfermeira-ana/poster.webp", alerta: "/personagens/enfermeira-ana/poster.webp", nome: "Enfermeira Ana" },
};

const TOM = {
  ok: { fundo: "bg-[#11291D] border-[#1E5A3A]", titulo: "text-[#3DD68C]", icone: "bg-[#3DD68C] text-[#062819]", botao: "success", Icone: Check },
  erro: { fundo: "bg-[#2C171B] border-[#5A2A30]", titulo: "text-[#FF6B6B]", icone: "bg-[#FF6B6B] text-[#2B1619]", botao: "danger", Icone: X },
  alerta: { fundo: "bg-[#2C2410] border-[#5C4A17]", titulo: "text-[#FFC247]", icone: "bg-[#FFC247] text-[#2B1700]", botao: "warning", Icone: Lightbulb },
};

function Rosto({ quem, tom }) {
  const r = ROSTOS[quem];
  if (!r) return null;
  return <img src={r[tom]} alt={r.nome} width={48} height={48} className="h-12 w-12 shrink-0 rounded-full border-2 border-[#27394B] bg-[#0E1722] object-cover object-top" />;
}
Rosto.propTypes = { quem: PropTypes.string, tom: PropTypes.string.isRequired };

/** Conteúdo da folha: rosto (ou ícone), título colorido, explicação curta, selo de PE e os botões. */
function Conteudo({ tom, quem, titulo, texto, pe, acao, secundaria, focoRef }) {
  const t = TOM[tom];
  return (
    <>
      {pe ? (
        <span className="absolute -top-4 right-4 rounded-full bg-[#20D5B5] px-2.5 py-1 text-xs font-black text-[#06302E] shadow-[0_3px_0_#149F86]">+{pe} PE</span>
      ) : null}
      <div className="flex items-center gap-3">
        {ROSTOS[quem] ? (
          <Rosto quem={quem} tom={tom} />
        ) : (
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${t.icone}`}>
            <t.Icone size={24} strokeWidth={3} aria-hidden="true" />
          </span>
        )}
        <h2 className={`text-xl font-black ${t.titulo}`}>{titulo}</h2>
      </div>
      {texto ? <div className="mt-2 text-sm font-semibold leading-relaxed text-[#C9D7E3]">{texto}</div> : null}
      {acao || secundaria ? (
        <div className="mt-4 flex gap-2">
          {secundaria ? (
            <Button variant="outline" size="lg" className="shrink-0" onClick={secundaria.onClick}>
              {secundaria.rotulo}
            </Button>
          ) : null}
          {acao ? (
            <Button ref={focoRef} variant={t.botao} size="lg" className="flex-1" onClick={acao.onClick} disabled={acao.desabilitado}>
              {acao.rotulo}
            </Button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
Conteudo.propTypes = {
  tom: PropTypes.oneOf(["ok", "erro", "alerta"]).isRequired,
  quem: PropTypes.oneOf(["goti", "rui", "ana"]),
  titulo: PropTypes.node.isRequired,
  texto: PropTypes.node,
  pe: PropTypes.number,
  acao: PropTypes.shape({ rotulo: PropTypes.node.isRequired, onClick: PropTypes.func.isRequired, desabilitado: PropTypes.bool }),
  secundaria: PropTypes.shape({ rotulo: PropTypes.node.isRequired, onClick: PropTypes.func.isRequired }),
  focoRef: PropTypes.object,
};

/**
 * Retorno de acerto, erro ou "faltou um pedaço", no padrão do app inteiro.
 * - flutuante (padrão): folha que sobe de baixo, em portal (um transform num ancestral quebraria o fixed).
 * - embutida: o mesmo cartão dentro do fluxo da tela (cenas com personagem, onde a conversa fica visível).
 */
export default function FolhaResposta({ aberta = true, embutida = false, ...props }) {
  const focoRef = useRef(null);
  useEffect(() => {
    if (!aberta || embutida) return undefined;
    const t = setTimeout(() => focoRef.current?.focus({ preventScroll: true }), 120);
    return () => clearTimeout(t);
  }, [aberta, embutida]);

  // Acerto: o Goti salta pelo meio da tela, uma vez por folha aberta.
  const [salto, setSalto] = useState(0);
  const acertou = aberta && props.tom === "ok";
  useEffect(() => {
    if (acertou) setSalto((n) => n + 1);
  }, [acertou]);

  const papel = props.tom === "ok" ? "status" : "alert";
  if (embutida) {
    if (!aberta) return null;
    return (
      <>
      <SaltoMascote disparo={salto} />
      <motion.div
        role={papel}
        className={`relative rounded-3xl border-2 p-4 ${TOM[props.tom].fundo}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        <Conteudo {...props} />
      </motion.div>
      </>
    );
  }

  if (typeof document === "undefined") return null;
  return (
    <>
    <SaltoMascote disparo={salto} />
    {createPortal(
    <AnimatePresence>
      {aberta && (
        <motion.div
          key="folha-resposta"
          role={papel}
          className={`fixed inset-x-0 bottom-0 z-[60] mx-auto w-full max-w-xl rounded-t-3xl border-t-2 px-4 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] ${TOM[props.tom].fundo}`}
          variants={sheetVariants}
          initial="hidden"
          animate="show"
          exit="exit"
        >
          <Conteudo {...props} focoRef={focoRef} />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
    )}
    </>
  );
}

FolhaResposta.propTypes = {
  aberta: PropTypes.bool,
  embutida: PropTypes.bool,
  tom: PropTypes.oneOf(["ok", "erro", "alerta"]).isRequired,
  quem: PropTypes.oneOf(["goti", "rui", "ana"]),
  titulo: PropTypes.node.isRequired,
  texto: PropTypes.node,
  pe: PropTypes.number,
  acao: PropTypes.object,
  secundaria: PropTypes.object,
};
