import React, { useState } from "react";
import PropTypes from "prop-types";
import { m as motion } from "framer-motion";
import { Button } from "@/components/ui/button";

// Arrastar itens para o alvo. Dois jeitos, o mesmo resultado: arrastar com o dedo/mouse, ou (obrigatório no celular)
// tocar no item para selecionar e tocar no alvo para colocar. Tocar num item já colocado o devolve.
export default function Arrastar({ definicao, conferir, feedback }) {
  const { alvos, itens } = definicao.arrastar;
  const [colocados, setColocados] = useState({});
  const [selecionado, setSelecionado] = useState(null);
  const [embaralhados] = useState(() => [...itens].sort(() => Math.random() - 0.5)); // fixo na sessão

  const colocar = (itemId, alvoId) => {
    setColocados((c) => ({ ...c, [itemId]: alvoId }));
    setSelecionado(null);
  };
  const devolver = (itemId) => setColocados((c) => ({ ...c, [itemId]: null }));

  const aoSoltar = (itemId, evento) => {
    const x = evento.clientX;
    const y = evento.clientY;
    if (typeof x !== "number" || typeof y !== "number") return;
    const alvo = document.elementsFromPoint(x, y).find((el) => el.dataset?.alvo);
    if (alvo) colocar(itemId, alvo.dataset.alvo);
  };

  const livres = embaralhados.filter((i) => !colocados[i.id]);
  const estado = (id) => feedback?.detalhes?.find((d) => d.id === id)?.estado;

  return (
    <div className="space-y-4">
      {alvos.map((alvo) => {
        const dentro = itens.filter((i) => colocados[i.id] === alvo.id);
        return (
          <div
            key={alvo.id}
            data-alvo={alvo.id}
            role="button"
            tabIndex={0}
            aria-label={`${alvo.label}${selecionado ? ": toque para colocar o item selecionado" : ""}`}
            onClick={() => selecionado && colocar(selecionado, alvo.id)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && selecionado && colocar(selecionado, alvo.id)}
            className={`min-h-[120px] rounded-2xl border-2 border-dashed p-3 transition-colors ${selecionado ? "border-[#20D5B5] bg-[#20D5B5]/5" : "border-[#27394B]"}`}
          >
            <p className="mb-2 text-xs font-bold text-[#9FB3C6]">{alvo.label}</p>
            <div className="flex flex-wrap gap-2">
              {dentro.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    devolver(i.id);
                  }}
                  aria-label={`${i.label}: tocar para tirar da bandeja`}
                  className={`rounded-xl border px-3 py-2 text-sm font-bold ${estado(i.id) === "errado" ? "border-[#FF6B6B] text-[#FF6B6B]" : estado(i.id) === "certo" ? "border-[#3DD68C] text-[#3DD68C]" : "border-[#27394B]"}`}
                >
                  {i.label}
                </button>
              ))}
              {dentro.length === 0 && <span className="text-xs font-semibold text-[#9FB3C6]">Solte os itens aqui</span>}
            </div>
          </div>
        );
      })}

      <div className="flex flex-wrap gap-2" aria-label="Itens disponíveis">
        {livres.map((i) => (
          <motion.button
            key={i.id}
            type="button"
            drag
            dragSnapToOrigin
            dragMomentum={false}
            whileDrag={{ scale: 1.05, zIndex: 20 }}
            onDragEnd={(e) => aoSoltar(i.id, e)}
            onClick={() => setSelecionado(selecionado === i.id ? null : i.id)}
            aria-pressed={selecionado === i.id}
            style={{ touchAction: "none" }}
            className={`rounded-xl border px-3 py-2 text-sm font-bold ${selecionado === i.id ? "border-[#20D5B5] ring-2 ring-[#20D5B5]" : "border-[#27394B]"} bg-[#16222E]`}
          >
            {i.label}
          </motion.button>
        ))}
      </div>

      <Button variant="primary" className="w-full" onClick={() => conferir(colocados)}>Conferir</Button>
    </div>
  );
}

Arrastar.propTypes = { definicao: PropTypes.object.isRequired, conferir: PropTypes.func.isRequired, feedback: PropTypes.object };
