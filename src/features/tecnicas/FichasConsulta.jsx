import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Activity, BedDouble, Calculator, ChevronDown, FlaskConical, HeartCrack, HeartPulse, Layers, MessageCircle, NotebookPen,
  Package, PersonStanding, Pill, ScanLine, Search, ShieldCheck, Syringe, Waves,
} from "lucide-react";
import { FICHAS, GRUPOS_FICHAS } from "@/data/fichas/fichas.js";
import { vibrate } from "@/lib/motion";

const ICONES = { Activity, BedDouble, Calculator, FlaskConical, HeartCrack, HeartPulse, Layers, MessageCircle, NotebookPen, Package, PersonStanding, Pill, ScanLine, ShieldCheck, Syringe, Waves };
const semAcento = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function Bloco({ bloco }) {
  if (bloco.tipo === "texto") return <p className="text-sm font-semibold leading-relaxed text-[#C9D6E2]">{bloco.texto}</p>;
  if (bloco.tipo === "lista") {
    return (
      <ul className="space-y-1.5">
        {bloco.itens.map((t) => (
          <li key={t} className="flex gap-2 text-sm font-semibold leading-snug text-[#C9D6E2]">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#20D5B5]" aria-hidden="true" />
            {t}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[280px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr>
            {bloco.cabecalho.map((c) => (
              <th key={c} scope="col" className="border-b-2 border-[#27394B] px-2 py-1.5 text-xs font-black text-[#9FB3C6]">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bloco.linhas.map((linha) => (
            <tr key={linha.join("|")}>
              {linha.map((cel, i) => (
                <td key={`${i}-${cel}`} className={`border-b border-[#1F3045] px-2 py-1.5 align-top font-semibold ${i === 0 ? "text-[#EAF2F8]" : "text-[#C9D6E2]"}`}>{cel}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
Bloco.propTypes = { bloco: PropTypes.object.isRequired };

/** Fichas de consulta rápida: escalas, valores, metas e regras das aulas, para consultar na hora. */
export default function FichasConsulta() {
  const [busca, setBusca] = useState("");
  const [grupo, setGrupo] = useState("todos");
  const [aberta, setAberta] = useState(null);

  const visiveis = useMemo(() => {
    const termo = semAcento(busca.trim());
    return FICHAS.filter((f) => (grupo === "todos" || f.grupo === grupo) && (!termo || semAcento(`${f.titulo} ${f.resumo} ${JSON.stringify(f.blocos)}`).includes(termo)));
  }, [busca, grupo]);

  return (
    <section className="space-y-4" aria-label="Fichas de consulta rápida">
      <label className="flex items-center gap-2 rounded-2xl border-2 border-[#27394B] bg-[#131F2E] px-3 py-2.5 focus-within:border-[#20D5B5]">
        <Search className="h-4 w-4 text-[#9FB3C6]" aria-hidden="true" />
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar: Braden, potássio, V1, penicilina..."
          className="w-full bg-transparent text-sm font-semibold text-[#EAF2F8] placeholder:text-[#6F8499] focus:outline-none"
          aria-label="Buscar nas fichas"
        />
      </label>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {[["todos", "Todas"], ...Object.entries(GRUPOS_FICHAS)].map(([id, rotulo]) => (
          <button
            key={id}
            type="button"
            aria-pressed={grupo === id}
            onClick={() => setGrupo(id)}
            className={`shrink-0 rounded-full border-2 px-3 py-1 text-xs font-black transition-colors duration-150 ${grupo === id ? "border-[#20D5B5] bg-[#20D5B5]/12 text-[#20D5B5]" : "border-[#27394B] text-[#9FB3C6]"}`}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {visiveis.length === 0 ? (
        <p className="py-8 text-center text-sm font-bold text-[#9FB3C6]">Nenhuma ficha com esse termo.</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 md:items-start">
          {visiveis.map((f) => {
            const Icone = ICONES[f.icone] ?? Layers;
            const ativa = aberta === f.id;
            return (
              <li key={f.id} className="rounded-2xl border-2 border-[#27394B] bg-[#131F2E]">
                <button
                  type="button"
                  aria-expanded={ativa}
                  aria-controls={`ficha-${f.id}`}
                  onClick={() => {
                    vibrate(8);
                    setAberta(ativa ? null : f.id);
                  }}
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#20D5B5]/12 text-[#20D5B5]">
                    <Icone className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black text-[#EAF2F8]">{f.titulo}</span>
                    <span className="block text-xs font-bold text-[#9FB3C6]">{f.resumo}</span>
                  </span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-[#9FB3C6] transition-transform duration-200 ${ativa ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>
                {ativa && (
                  <div id={`ficha-${f.id}`} className="animate-[avatarEntra_180ms_ease-out] space-y-3 border-t-2 border-[#27394B] p-4 motion-reduce:animate-none">
                    {f.blocos.map((b, i) => (
                      <Bloco key={`${f.id}-${i}`} bloco={b} />
                    ))}
                    <p className="text-[11px] font-bold text-[#6F8499]">Fonte: {f.fonte}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
