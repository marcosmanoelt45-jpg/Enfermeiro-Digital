import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Search } from "lucide-react";

const normalizar = (t) => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Campo com lista: ao tocar, mostra a lista inteira; digitar filtra (por nome ou código) e tocar completa.
 * `itens`: [{ id, rotulo, detalhe? }]. Teclado: setas, Enter e Esc.
 */
export default function CampoBusca({ itens, onEscolher, placeholder, rotulo, excluir = null, desabilitado = false, maxVisiveis = 300 }) {
  const [q, setQ] = useState("");
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(0);
  const caixa = useRef(null);
  const lista = useRef(null);
  const id = useId();

  const filtrados = useMemo(() => {
    const termos = normalizar(q).split(/\s+/).filter(Boolean);
    const base = excluir ? itens.filter((i) => !excluir.has(i.id)) : itens;
    const r = termos.length ? base.filter((i) => termos.every((t) => normalizar(`${i.detalhe ?? ""} ${i.rotulo}`).includes(t))) : base;
    return r.slice(0, maxVisiveis);
  }, [itens, q, excluir, maxVisiveis]);

  useEffect(() => setAtivo(0), [q]);

  // Fecha ao tocar fora.
  useEffect(() => {
    if (!aberto) return undefined;
    const fora = (e) => caixa.current && !caixa.current.contains(e.target) && setAberto(false);
    document.addEventListener("pointerdown", fora);
    return () => document.removeEventListener("pointerdown", fora);
  }, [aberto]);

  useEffect(() => {
    lista.current?.querySelector(`[data-i="${ativo}"]`)?.scrollIntoView({ block: "nearest" });
  }, [ativo]);

  const escolher = (item) => {
    onEscolher(item);
    setQ("");
    setAberto(false);
  };

  const teclas = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAberto(true);
      setAtivo((a) => Math.min(a + 1, filtrados.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAtivo((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && aberto && filtrados[ativo]) {
      e.preventDefault();
      escolher(filtrados[ativo]);
    } else if (e.key === "Escape") {
      setAberto(false);
    }
  };

  return (
    <div className="relative" ref={caixa}>
      <label htmlFor={id} className="sr-only">{rotulo ?? placeholder}</label>
      <Search size={16} className="pointer-events-none absolute left-3 top-3.5 text-[#6F859A]" aria-hidden="true" />
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={aberto}
        aria-controls={`${id}-lista`}
        aria-autocomplete="list"
        autoComplete="off"
        value={q}
        disabled={desabilitado}
        onChange={(e) => {
          setQ(e.target.value);
          setAberto(true);
        }}
        onFocus={() => setAberto(true)}
        onClick={() => setAberto(true)}
        onKeyDown={teclas}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border-2 border-[#27394B] bg-[#131F2E] pl-9 pr-3 text-sm font-semibold text-[#EAF2F8] placeholder:text-[#6F859A] focus:border-[#20D5B5] focus:outline-none disabled:opacity-50"
      />
      {aberto && !desabilitado && (
        <ul
          id={`${id}-lista`}
          ref={lista}
          role="listbox"
          className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto overscroll-contain rounded-xl border border-[#27394B] bg-[#0E1722] p-1 shadow-[0_12px_30px_rgba(0,0,0,0.5)]"
        >
          {filtrados.length === 0 ? (
            <li className="px-3 py-2 text-sm font-semibold text-[#9FB3C6]">Nada encontrado.</li>
          ) : (
            filtrados.map((i, n) => (
              <li key={i.id} role="option" aria-selected={n === ativo} data-i={n}>
                <button
                  type="button"
                  onMouseEnter={() => setAtivo(n)}
                  onClick={() => escolher(i)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold ${n === ativo ? "bg-[#16222E]" : ""}`}
                >
                  {i.detalhe && <span className="mr-1.5 tabular-nums text-[#20D5B5]">{i.detalhe}</span>}
                  {i.rotulo}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

CampoBusca.propTypes = {
  itens: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired, rotulo: PropTypes.string.isRequired, detalhe: PropTypes.string })).isRequired,
  onEscolher: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  rotulo: PropTypes.string,
  excluir: PropTypes.instanceOf(Set),
  desabilitado: PropTypes.bool,
  maxVisiveis: PropTypes.number,
};
