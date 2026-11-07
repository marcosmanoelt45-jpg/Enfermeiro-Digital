import React, { useState } from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";

const LETRAS = ["A", "B", "C", "D", "E"];

// Cartões A–D; o feedback de cada opção aparece depois de confirmar.
export default function Escolher({ definicao, conferir, feedback }) {
  const { pergunta, opcoes, imagem } = definicao.escolher;
  const [escolhida, setEscolhida] = useState(null);
  const [embaralhadas] = useState(() => [...opcoes].sort(() => Math.random() - 0.5));
  const confirmada = Boolean(feedback);

  return (
    <div className="space-y-4">
      {imagem && <img src={imagem} alt="" width={400} height={250} loading="lazy" className="w-full rounded-2xl" />}
      <p className="text-base font-extrabold">{pergunta}</p>
      <div className="space-y-2" role="radiogroup" aria-label="Alternativas">
        {embaralhadas.map((o, i) => {
          const marcada = escolhida === o.id;
          const mostrar = confirmada && marcada;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={marcada}
              disabled={confirmada && feedback.concluido}
              onClick={() => setEscolhida(o.id)}
              className={`flex w-full gap-3 rounded-2xl border p-3 text-left transition-colors ${mostrar ? (o.correta ? "border-[#3DD68C] bg-[#3DD68C]/10" : "border-[#FF6B6B] bg-[#FF6B6B]/10") : marcada ? "border-[#20D5B5] bg-[#20D5B5]/10" : "border-[#27394B]"}`}
            >
              <span className="font-extrabold text-[#9FB3C6]">{LETRAS[i]}</span>
              <span className="flex-1 text-sm font-semibold">
                {o.texto}
                {mostrar && <span className="mt-1 block text-xs font-semibold text-[#9FB3C6]">{o.feedback}</span>}
              </span>
            </button>
          );
        })}
      </div>
      <Button variant="primary" className="w-full" disabled={!escolhida || (confirmada && feedback.concluido)} onClick={() => conferir(escolhida)}>Confirmar</Button>
    </div>
  );
}

Escolher.propTypes = { definicao: PropTypes.object.isRequired, conferir: PropTypes.func.isRequired, feedback: PropTypes.object };
