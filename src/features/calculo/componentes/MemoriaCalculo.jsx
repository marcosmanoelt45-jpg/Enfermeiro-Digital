import React from "react";
import PropTypes from "prop-types";
import { m as motion } from "framer-motion";
import { Inset } from "@/components/ui/surface";
import { fadeUp, listStagger } from "@/lib/motion";

const fmt = (n) => Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 3 });

// Memória de cálculo passo a passo (ou, numa prescrição com erro, o que estava errado e a conduta).
export default function MemoriaCalculo({ item }) {
  const resposta = item.resposta === null ? null : `${fmt(item.resposta)} ${item.unidade}`;
  return (
    <Inset className="space-y-2" aria-label="Memória de cálculo">
      <h2 className="text-sm font-extrabold">{item.erroProposital ? "O que estava errado" : "Como chegar na resposta"}</h2>
      <motion.ol className="space-y-1.5 text-sm font-semibold" variants={listStagger} initial="hidden" animate="show">
        {item.memoria.map((passo, i) => (
          <motion.li key={i} variants={fadeUp} className="flex gap-2">
            <span className="font-black tabular-nums text-[#20D5B5]">{i + 1}.</span>
            <span>{passo}</span>
          </motion.li>
        ))}
      </motion.ol>
      {resposta && <p className="border-t border-[#1F3045] pt-2 text-base font-black text-[#3DD68C]">Resposta: {resposta}</p>}
    </Inset>
  );
}

MemoriaCalculo.propTypes = { item: PropTypes.object.isRequired };
