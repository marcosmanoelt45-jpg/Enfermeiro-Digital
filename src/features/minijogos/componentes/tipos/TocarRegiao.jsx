import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";

// Toque nas regiões do corpo. Sem imagem, desenha um tórax esquemático. Sem áudio, mostra o achado em texto.
export default function TocarRegiao({ definicao, conferir }) {
  const { regioes, objetivo, imagem } = definicao["tocar-regiao"];
  const vistas = [...new Set(regioes.map((r) => r.vista ?? definicao["tocar-regiao"].vista ?? "anterior"))];
  const [vista, setVista] = useState(vistas[0]);
  const [tocadas, setTocadas] = useState([]);
  const [ultima, setUltima] = useState(null);
  const audio = useRef(null);

  const tocar = (r) => {
    const novas = tocadas.includes(r.id) ? tocadas : [...tocadas, r.id];
    setTocadas(novas);
    setUltima(r);
    if (r.audio) {
      try {
        audio.current ??= new Audio();
        audio.current.src = r.audio;
        audio.current.play().catch(() => {});
      } catch {
        // sem áudio: o texto do achado já está na tela
      }
    }
    if (objetivo === "explorar") {
      if (novas.length === regioes.length) conferir(novas);
    } else {
      conferir(novas);
    }
  };

  const daVista = regioes.filter((r) => (r.vista ?? definicao["tocar-regiao"].vista ?? "anterior") === vista);

  return (
    <div className="space-y-3">
      {vistas.length > 1 && (
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Vista do corpo">
          {vistas.map((v) => (
            <button key={v} type="button" aria-pressed={vista === v} onClick={() => setVista(v)} className={`rounded-full border px-3 py-1.5 text-sm font-bold ${vista === v ? "border-[#20D5B5] text-[#20D5B5]" : "border-[#27394B]"}`}>
              {v === "anterior" ? "Frente" : "Costas"}
            </button>
          ))}
        </div>
      )}

      <div className="relative mx-auto w-full max-w-xs overflow-hidden rounded-2xl border border-[#27394B] bg-[#0E1722]" style={{ aspectRatio: "4 / 5" }}>
        {imagem ? (
          <img src={imagem} alt="" width={400} height={500} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <svg viewBox="0 0 100 125" className="absolute inset-0 h-full w-full" aria-hidden="true">
            <path d="M30 12 Q50 2 70 12 Q82 22 80 50 L76 100 Q50 112 24 100 L20 50 Q18 22 30 12 Z" fill="#16222E" stroke="#27394B" strokeWidth="1.5" />
            <line x1="50" y1="14" x2="50" y2="100" stroke="#27394B" strokeDasharray="3 3" />
          </svg>
        )}
        {daVista.map((r) => {
          const feita = tocadas.includes(r.id);
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => tocar(r)}
              aria-label={`${r.label}${feita ? " (já tocado)" : ""}`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#20D5B5] ${feita ? "border-[#3DD68C] bg-[#3DD68C]/25" : "border-[#20D5B5]/70 bg-[#20D5B5]/10"}`}
              style={{ left: `${r.x}%`, top: `${r.y}%`, width: `${r.raio * 2}%`, aspectRatio: "1 / 1", minWidth: 36, minHeight: 36 }}
            />
          );
        })}
      </div>

      <div className="min-h-[56px] rounded-2xl border border-[#27394B] bg-[#131F2E] p-3" role="status" aria-live="polite">
        {ultima ? (
          <>
            <p className="text-xs font-bold text-[#9FB3C6]">{ultima.label}</p>
            <p className="text-sm font-semibold">{ultima.achado}</p>
          </>
        ) : (
          <p className="text-sm font-semibold text-[#9FB3C6]">Toque num ponto do tórax.</p>
        )}
      </div>
      <p className="text-center text-xs font-bold text-[#9FB3C6]">{tocadas.length} de {regioes.length} pontos</p>
      {objetivo === "explorar" && tocadas.length < regioes.length && <Button variant="outline" className="w-full" disabled>Toque em todos os pontos para concluir</Button>}
    </div>
  );
}

TocarRegiao.propTypes = { definicao: PropTypes.object.isRequired, conferir: PropTypes.func.isRequired };
