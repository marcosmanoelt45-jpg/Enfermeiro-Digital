import React, { useState } from "react";
import PropTypes from "prop-types";
import { m as motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import PistaExame from "../PistaExame.jsx";

const LETRAS = ["A", "B", "C", "D", "E"];
// Cartão com lábio 3D (box-shadow, como os botões): neutro, marcado, certo, errado e apagado.
const ESTILO = {
  neutra: "border-[#27394B] bg-[#16222E] shadow-[0_4px_0_#0A1118]",
  marcada: "border-[#20D5B5] bg-[#20D5B5]/10 shadow-[0_4px_0_#149F86]",
  certa: "border-[#3DD68C] bg-[#12301F] shadow-[0_4px_0_#1E9A5E]",
  errada: "border-[#FF6B6B] bg-[#341A1E] shadow-[0_4px_0_#C24848]",
  apagada: "border-[#27394B] bg-[#16222E] opacity-40 shadow-[0_4px_0_#0A1118]",
};
const LETRA = {
  neutra: "border-[#27394B] text-[#9FB3C6]",
  marcada: "border-[#20D5B5] bg-[#20D5B5] text-[#06302E]",
  certa: "border-[#3DD68C] bg-[#3DD68C] text-[#062819]",
  errada: "border-[#FF6B6B] bg-[#FF6B6B] text-[#2B1619]",
  apagada: "border-[#27394B] text-[#9FB3C6]",
};

// Cartões A–D; o feedback de cada opção aparece depois de confirmar.
export default function Escolher({ definicao, conferir, feedback }) {
  const { pergunta, opcoes, imagem, pista } = definicao.escolher;
  const [escolhida, setEscolhida] = useState(null);
  const [embaralhadas] = useState(() => [...opcoes].sort(() => Math.random() - 0.5));
  const confirmada = Boolean(feedback);

  return (
    <div className="space-y-4">
      {imagem && <img src={imagem} alt="" width={400} height={250} loading="lazy" className="w-full rounded-2xl" />}
      <PistaExame pista={pista} />
      <p className="text-base font-extrabold">{pergunta}</p>
      <div className="space-y-2" role="radiogroup" aria-label="Alternativas">
        {embaralhadas.map((o, i) => {
          const marcada = escolhida === o.id;
          // Depois de confirmar: a escolhida fica verde ou coral, e a certa acende também; as outras apagam.
          const estado = !confirmada ? (marcada ? "marcada" : "neutra") : o.correta ? "certa" : marcada ? "errada" : "apagada";
          const Marca = estado === "certa" ? Check : estado === "errada" ? X : null;
          return (
            <motion.button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={marcada}
              disabled={confirmada}
              onClick={() => setEscolhida(o.id)}
              animate={estado === "certa" && marcada ? { scale: [1, 1.03, 1] } : { scale: 1 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-[border-color,background-color,opacity] duration-150 ${ESTILO[estado]}`}
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 text-xs font-black ${LETRA[estado]}`}>{LETRAS[i]}</span>
              <span className="flex-1 text-sm font-bold">{o.texto}</span>
              {Marca && <Marca size={20} strokeWidth={3} className={estado === "certa" ? "text-[#3DD68C]" : "text-[#FF6B6B]"} aria-hidden="true" />}
            </motion.button>
          );
        })}
      </div>
      {!confirmada && (
        <Button variant="primary" size="lg" className="w-full" disabled={!escolhida} onClick={() => conferir(escolhida)}>
          Confirmar
        </Button>
      )}
    </div>
  );
}

Escolher.propTypes = { definicao: PropTypes.object.isRequired, conferir: PropTypes.func.isRequired, feedback: PropTypes.object };
