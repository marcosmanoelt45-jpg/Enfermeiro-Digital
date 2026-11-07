import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/surface";
import { searchNandaCatalog, findNandaByCode } from "@/lib/nandaCatalog";

// Busca direta no catálogo NANDA-I (sem Base44): digite o nome ou o código e toque para adicionar.
export default function BuscaDiagnostico({ selecionados, onChange, max = 6 }) {
  const [consulta, setConsulta] = useState("");
  const [aberto, setAberto] = useState(false);

  const resultados = useMemo(() => {
    const q = consulta.trim();
    if (q.length < 2) return [];
    return searchNandaCatalog(q)
      .filter((d) => !selecionados.includes(d.code))
      .slice(0, 8);
  }, [consulta, selecionados]);

  const adicionar = (codigo) => {
    if (selecionados.length >= max || selecionados.includes(codigo)) return;
    onChange([...selecionados, codigo]);
    setConsulta("");
    setAberto(false);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          value={consulta}
          onChange={(e) => {
            setConsulta(e.target.value);
            setAberto(true);
          }}
          onFocus={() => setAberto(true)}
          placeholder="Buscar diagnóstico de enfermagem"
          aria-label="Buscar diagnóstico de enfermagem"
          disabled={selecionados.length >= max}
          className="bg-[#131F2E] border-[#27394B] text-[#EAF2F8]"
        />
        {aberto && resultados.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-[#27394B] bg-[#0E1722] p-1 shadow-lg" role="listbox">
            {resultados.map((d) => (
              <li key={d.code}>
                <button type="button" onClick={() => adicionar(d.code)} className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-[#16222E]">
                  <span className="text-[#9FB3C6]">{d.code}</span> · {d.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {selecionados.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selecionados.map((codigo) => (
            <Chip key={codigo} tone="brand" className="gap-1">
              {findNandaByCode(codigo)?.title ?? codigo}
              <button type="button" onClick={() => onChange(selecionados.filter((c) => c !== codigo))} aria-label={`Remover ${codigo}`}>
                <X size={14} aria-hidden="true" />
              </button>
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}

BuscaDiagnostico.propTypes = {
  selecionados: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
  max: PropTypes.number,
};
