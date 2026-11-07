import React, { useState } from "react";
import PropTypes from "prop-types";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Reorder } from "framer-motion";
import { Button } from "@/components/ui/button";

const embaralhar = (passos) => {
  const ids = passos.map((p) => p.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  // Evita começar já resolvido.
  return ids.every((id, i) => id === passos[i].id) ? [...ids].reverse() : ids;
};

// Lista reordenável (arrastar) com botões ↑ ↓ para quem não arrasta. "Conferir" marca só os passos fora de lugar.
export default function Ordenar({ definicao, conferir, feedback }) {
  const { passos } = definicao.ordenar;
  const porId = new Map(passos.map((p) => [p.id, p]));
  const [ordem, setOrdem] = useState(() => embaralhar(passos));
  const fora = new Set(feedback?.foraDeLugar ?? []);

  const mover = (i, delta) => {
    const j = i + delta;
    if (j < 0 || j >= ordem.length) return;
    const nova = [...ordem];
    [nova[i], nova[j]] = [nova[j], nova[i]];
    setOrdem(nova);
  };

  return (
    <div className="space-y-4">
      <Reorder.Group axis="y" values={ordem} onReorder={setOrdem} className="space-y-2">
        {ordem.map((id, i) => (
          <Reorder.Item key={id} value={id} className={`flex items-center gap-2 rounded-xl border bg-[#16222E] px-3 py-2 ${fora.has(id) ? "border-[#FF6B6B]" : "border-[#27394B]"}`} style={{ touchAction: "none" }}>
            <span className="w-5 shrink-0 text-xs font-extrabold text-[#9FB3C6]">{i + 1}</span>
            <span className="flex-1 text-sm font-semibold">{porId.get(id).texto}</span>
            <button type="button" onClick={() => mover(i, -1)} disabled={i === 0} aria-label={`Subir: ${porId.get(id).texto}`} className="rounded-lg p-1 disabled:opacity-30"><ArrowUp size={18} aria-hidden="true" /></button>
            <button type="button" onClick={() => mover(i, 1)} disabled={i === ordem.length - 1} aria-label={`Descer: ${porId.get(id).texto}`} className="rounded-lg p-1 disabled:opacity-30"><ArrowDown size={18} aria-hidden="true" /></button>
          </Reorder.Item>
        ))}
      </Reorder.Group>
      {feedback && !feedback.concluido && fora.size > 0 && <p className="text-center text-xs font-bold text-[#FF6B6B]" role="status">{fora.size} passo(s) fora de lugar, marcados em vermelho.</p>}
      <Button variant="primary" className="w-full" onClick={() => conferir(ordem)}>Conferir</Button>
    </div>
  );
}

Ordenar.propTypes = { definicao: PropTypes.object.isRequired, conferir: PropTypes.func.isRequired, feedback: PropTypes.object };
