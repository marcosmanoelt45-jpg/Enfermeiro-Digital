import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { X } from "lucide-react";
import { NANDA_COMPLETE_CATALOG } from "@/lib/nandaCatalog";
import CampoBusca from "./CampoBusca.jsx";

const MAX_DX = 6;
const MAX_ITENS = 12;

const ITENS_DX = NANDA_COMPLETE_CATALOG.map((d) => ({ id: d.code, rotulo: d.title, detalhe: d.code })).sort((a, b) => a.rotulo.localeCompare(b.rotulo, "pt-BR"));
const porCodigo = new Map(NANDA_COMPLETE_CATALOG.map((d) => [d.code, d]));

export const ehDeRisco = (titulo = "") => /^risco\b/i.test(titulo.trim());

// Indicadores do livro (características definidoras, fatores relacionados e de risco), carregados só nesta tela.
let cacheIndicadores = null;
function useIndicadores() {
  const [dados, setDados] = useState(cacheIndicadores);
  useEffect(() => {
    if (cacheIndicadores) return;
    import("@/data/nanda_indicadores_2024_2026.json").then((m) => {
      cacheIndicadores = m.default ?? m;
      setDados(cacheIndicadores);
    });
  }, []);
  return dados;
}

const opcoes = (lista = []) => lista.map((t) => ({ id: t, rotulo: t }));

function Selecionados({ itens, onRemover, tom }) {
  if (!itens.length) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {itens.map((t) => (
        <li key={t} className={`inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${tom}`}>
          <span className="truncate">{t}</span>
          <button type="button" onClick={() => onRemover(t)} aria-label={`Remover ${t}`} className="shrink-0 rounded-full p-0.5">
            <X size={12} aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}

Selecionados.propTypes = { itens: PropTypes.arrayOf(PropTypes.string).isRequired, onRemover: PropTypes.func.isRequired, tom: PropTypes.string };

function BlocoDiagnostico({ entrada, indicadores, onMudar, onRemover }) {
  const dx = porCodigo.get(entrada.codigo);
  const ind = indicadores?.[entrada.codigo] ?? { cd: [], fr: [], risco: [] };
  const risco = ehDeRisco(dx?.title);
  // Diagnóstico de risco: só fatores de risco (não tem fator relacionado nem característica definidora).
  const listaFatores = risco ? ind.risco : ind.fr;
  const rotuloFatores = risco ? "Fatores de risco" : "Fatores relacionados";
  const mostrarCd = !risco && ind.cd.length > 0;
  const add = (campo, t) => entrada[campo].length < MAX_ITENS && !entrada[campo].includes(t) && onMudar({ ...entrada, [campo]: [...entrada[campo], t] });
  const tirar = (campo, t) => onMudar({ ...entrada, [campo]: entrada[campo].filter((x) => x !== t) });

  return (
    <li className="space-y-3 rounded-2xl border border-[#27394B] bg-[#0E1722] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-extrabold leading-snug">{dx?.title ?? entrada.codigo}</p>
          <p className="text-xs font-semibold text-[#9FB3C6]">
            {entrada.codigo}
            {risco ? " · diagnóstico de risco" : ""}
          </p>
        </div>
        <button type="button" onClick={onRemover} className="shrink-0 rounded-lg p-1.5 text-[#9FB3C6] hover:text-[#FF6B6B]" aria-label={`Remover ${dx?.title ?? entrada.codigo}`}>
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      {!indicadores ? (
        <p className="text-xs font-semibold text-[#9FB3C6]">Carregando fatores e características…</p>
      ) : (
        <>
          {listaFatores.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-[#EAF2F8]">{rotuloFatores}</p>
              <CampoBusca itens={opcoes(listaFatores)} excluir={new Set(entrada.fatores)} onEscolher={(i) => add("fatores", i.id)} placeholder={`Buscar ${rotuloFatores.toLowerCase()} (${listaFatores.length})`} desabilitado={entrada.fatores.length >= MAX_ITENS} />
              <Selecionados itens={entrada.fatores} onRemover={(t) => tirar("fatores", t)} tom="border-[#FFC247]/40 bg-[#FFC247]/10 text-[#FFE2A3]" />
            </div>
          )}
          {mostrarCd && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-[#EAF2F8]">Características definidoras</p>
              <CampoBusca itens={opcoes(ind.cd)} excluir={new Set(entrada.caracteristicas)} onEscolher={(i) => add("caracteristicas", i.id)} placeholder={`Buscar características (${ind.cd.length})`} desabilitado={entrada.caracteristicas.length >= MAX_ITENS} />
              <Selecionados itens={entrada.caracteristicas} onRemover={(t) => tirar("caracteristicas", t)} tom="border-[#20D5B5]/40 bg-[#20D5B5]/10 text-[#A8F0E3]" />
            </div>
          )}
        </>
      )}
    </li>
  );
}

BlocoDiagnostico.propTypes = { entrada: PropTypes.object.isRequired, indicadores: PropTypes.object, onMudar: PropTypes.func.isRequired, onRemover: PropTypes.func.isRequired };

/** Diagnósticos de enfermagem do registro: busca nos 277 da NANDA-I (nome ou código) e, para cada um, os fatores e as características que o livro lista para ele. */
export default function DiagnosticosRegistro({ valor, onMudar }) {
  const indicadores = useIndicadores();
  const escolhidos = useMemo(() => new Set(valor.map((v) => v.codigo)), [valor]);
  return (
    <div className="space-y-3">
      <CampoBusca
        itens={ITENS_DX}
        excluir={escolhidos}
        onEscolher={(i) => onMudar([...valor, { codigo: i.id, fatores: [], caracteristicas: [] }])}
        placeholder={valor.length >= MAX_DX ? `Máximo de ${MAX_DX} diagnósticos` : "Toque para ver a lista ou digite o nome ou o código"}
        rotulo="Buscar diagnóstico de enfermagem"
        desabilitado={valor.length >= MAX_DX}
      />
      {valor.length > 0 && (
        <ul className="space-y-2">
          {valor.map((v) => (
            <BlocoDiagnostico
              key={v.codigo}
              entrada={v}
              indicadores={indicadores}
              onMudar={(novo) => onMudar(valor.map((x) => (x.codigo === v.codigo ? novo : x)))}
              onRemover={() => onMudar(valor.filter((x) => x.codigo !== v.codigo))}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

DiagnosticosRegistro.propTypes = {
  valor: PropTypes.arrayOf(PropTypes.shape({ codigo: PropTypes.string, fatores: PropTypes.array, caracteristicas: PropTypes.array })).isRequired,
  onMudar: PropTypes.func.isRequired,
};

export const tituloDoDiagnostico = (codigo) => porCodigo.get(codigo)?.title ?? codigo;
