import React from "react";
import PropTypes from "prop-types";
import { m as motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Avatar, ChamaDuplaMini } from "./ChamaDupla.jsx";
import BotaoCutucar from "./BotaoCutucar.jsx";
import { MAX_OFENSIVAS_AMIGOS, estadoDoPar } from "./ofensivaAmigos.js";

const EASE_OUT = [0.23, 1, 0.32, 1];
const SITUACAO = {
  acesa: "Os dois estudaram hoje",
  falta_amigo: (n) => `Falta ${n} hoje`,
  falta_voce: "Falta você hoje",
  apagada: "Ninguém estudou hoje ainda",
};

/**
 * Lista das ofensivas com amigos (até 5), no perfil. Cada linha: avatar, nome, as duas chaminhas com o número
 * e a situação do dia; quando só falta o amigo, aparece "Cutucar". As vagas livres viram "Convidar amigo".
 */
export default function SecaoOfensivasAmigos({ itens = [], onConvidar, onAbrir, onCutucar }) {
  const vagas = Math.max(0, MAX_OFENSIVAS_AMIGOS - itens.length);
  return (
    <section className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-4" aria-labelledby="ofensivas-amigos-titulo">
      <div className="mb-3 flex items-center justify-between">
        <h3 id="ofensivas-amigos-titulo" className="text-base font-black text-[#EAF2F8]">
          Ofensivas com amigos
        </h3>
        <span className="text-xs font-bold text-[#9FB3C6]">
          {itens.length} de {MAX_OFENSIVAS_AMIGOS}
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {itens.map((a, i) => {
          const estado = estadoDoPar(a);
          const primeiro = a.nome.split(" ")[0];
          const texto = typeof SITUACAO[estado] === "function" ? SITUACAO[estado](primeiro) : SITUACAO[estado];
          return (
            <motion.li
              key={a.id}
              className="flex items-center gap-3 rounded-xl border border-[#27394B] bg-[#16222E] px-3 py-2.5"
              initial={{ opacity: 0, transform: "translateY(8px)" }}
              animate={{ opacity: 1, transform: "translateY(0px)", transition: { duration: 0.22, ease: EASE_OUT, delay: i * 0.05 } }}
            >
              <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => onAbrir?.(a)}>
                <Avatar pessoa={a} tamanho={40} borda="#16222E" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black text-[#EAF2F8]">{a.nome}</span>
                  <span className="flex items-center gap-1.5 text-xs font-bold">
                    <ChamaDuplaMini acesa={estado === "acesa"} tamanho={16} />
                    <span className={estado === "acesa" ? "text-[#FFC247]" : "text-[#7D8FA3]"}>{a.dias}</span>
                    <span className="truncate text-[#9FB3C6]">· {texto}</span>
                  </span>
                </span>
              </button>
              {estado === "falta_amigo" && <BotaoCutucar nome={primeiro} onCutucar={() => onCutucar?.(a)} />}
            </motion.li>
          );
        })}
        {Array.from({ length: vagas }, (_, i) => (
          <li key={`vaga-${i}`}>
            <button
              type="button"
              onClick={onConvidar}
              className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-[#27394B] px-3 py-2.5 text-left text-sm font-bold text-[#9FB3C6] transition-colors duration-150 hover:border-[#20D5B5]/60 hover:text-[#20D5B5]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#27394B]">
                <Plus className="h-5 w-5" aria-hidden="true" />
              </span>
              Convidar amigo
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
SecaoOfensivasAmigos.propTypes = { itens: PropTypes.array, onConvidar: PropTypes.func, onAbrir: PropTypes.func, onCutucar: PropTypes.func };
