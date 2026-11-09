import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { ChevronRight, Search, X } from "lucide-react";
import { Tile } from "@/components/ui/surface";
import { clinicalHistoryService } from "@/services/clinicalHistoryService";

// Peças comuns das telas de início do Plantão e do Cálculo: opções grandes, lista com busca e histórico.

export function OpcoesModulo({ opcoes }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {opcoes.map((o) => {
        const Icone = o.icone;
        return (
          <button
            key={o.id}
            type="button"
            onClick={o.onClick}
            className={`${o.destaque ? "btn-3d-teal" : "btn-3d-outline"} flex min-h-[76px] w-full items-center gap-3 rounded-2xl p-4 text-left ${o.destaque ? "sm:col-span-2" : ""}`}
          >
            {Icone && <Icone size={26} className="shrink-0" aria-hidden="true" />}
            <span className="min-w-0 flex-1">
              <span className="block text-base font-extrabold leading-tight">{o.rotulo}</span>
              {o.descricao && <span className={`mt-0.5 block text-xs font-semibold ${o.destaque ? "text-[#073B33]" : "text-[#9FB3C6]"}`}>{o.descricao}</span>}
            </span>
            <ChevronRight size={20} className="shrink-0 opacity-70" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

OpcoesModulo.propTypes = { opcoes: PropTypes.arrayOf(PropTypes.object).isRequired };

const normalizar = (t) => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Lista enxuta com busca. `itens`: { id, titulo, subtitulo, etiqueta, busca }.
export function ListaComBusca({ itens, placeholder = "Buscar", onEscolher, selecionados = null, vazio = "Nada encontrado." }) {
  const [q, setQ] = useState("");
  const filtrados = useMemo(() => {
    const termos = normalizar(q).split(/\s+/).filter(Boolean);
    if (!termos.length) return itens;
    return itens.filter((i) => {
      const alvo = normalizar(`${i.titulo} ${i.subtitulo ?? ""} ${i.etiqueta ?? ""} ${i.busca ?? ""}`);
      return termos.every((t) => alvo.includes(t));
    });
  }, [itens, q]);

  return (
    <div className="space-y-3">
      <label className="relative block">
        <span className="sr-only">{placeholder}</span>
        <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9FB3C6]" aria-hidden="true" />
        <input
          type="text"
          inputMode="search"
          enterKeyHint="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="h-12 w-full rounded-2xl border-2 border-[#27394B] bg-[#131F2E] pl-10 pr-10 text-sm font-semibold text-white placeholder:text-[#6F859A] focus:border-[#20D5B5] focus:outline-none"
        />
        {q && (
          <button type="button" onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[#9FB3C6]" aria-label="Limpar busca">
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </label>
      <p className="text-xs font-bold text-[#9FB3C6]" aria-live="polite">{filtrados.length} de {itens.length}</p>
      {filtrados.length === 0 ? (
        <p className="py-6 text-center text-sm font-semibold text-[#9FB3C6]">{vazio}</p>
      ) : (
        <ul className="divide-y divide-[#27394B] overflow-hidden rounded-2xl border border-[#27394B] bg-[#131F2E]">
          {filtrados.map((i) => {
            const marcado = selecionados?.has(i.id);
            return (
              <li key={i.id}>
                <button
                  type="button"
                  onClick={() => onEscolher(i)}
                  aria-pressed={selecionados ? Boolean(marcado) : undefined}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#16222E] ${marcado ? "bg-[#20D5B5]/10" : ""}`}
                >
                  {selecionados && (
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 text-[11px] font-black ${marcado ? "border-[#20D5B5] bg-[#20D5B5] text-[#0B131D]" : "border-[#3A5068]"}`} aria-hidden="true">
                      {marcado ? "✓" : ""}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold">{i.titulo}</span>
                    {i.subtitulo && <span className="block truncate text-xs font-semibold text-[#9FB3C6]">{i.subtitulo}</span>}
                  </span>
                  {i.etiqueta && <span className="shrink-0 rounded-full border border-[#27394B] px-2 py-0.5 text-[11px] font-bold text-[#9FB3C6]">{i.etiqueta}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

ListaComBusca.propTypes = {
  itens: PropTypes.arrayOf(PropTypes.object).isRequired,
  placeholder: PropTypes.string,
  onEscolher: PropTypes.func.isRequired,
  selecionados: PropTypes.instanceOf(Set),
  vazio: PropTypes.string,
};

const fmtData = (iso) => {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

// Histórico das atividades concluídas de um módulo (salvo no aparelho, por usuário).
export function HistoricoModulo({ moduleType, userId, onRefazer = null }) {
  const itens = useMemo(() => clinicalHistoryService.getAllActivities(moduleType, userId).filter((a) => a.status === "concluido"), [moduleType, userId]);
  if (!itens.length) return <Tile className="text-center text-sm font-semibold text-[#9FB3C6]">Nada por aqui ainda. Quando você terminar uma atividade, ela aparece aqui.</Tile>;
  return (
    <ul className="divide-y divide-[#27394B] overflow-hidden rounded-2xl border border-[#27394B] bg-[#131F2E]">
      {itens.map((a) => {
        const nota = typeof a.score === "number" ? Math.round(a.score) : null;
        const cor = nota == null ? "text-[#9FB3C6]" : nota >= 70 ? "text-[#3DD68C]" : nota >= 50 ? "text-[#FFC247]" : "text-[#FF6B6B]";
        return (
          <li key={a.id} className="flex items-center gap-3 px-4 py-3">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-extrabold">{a.title}</span>
              <span className="block truncate text-xs font-semibold text-[#9FB3C6]">
                {fmtData(a.finishedAt || a.updatedAt)} · {a.patientInfo} · {clinicalHistoryService.formatDuration(a.durationSeconds)}
              </span>
            </span>
            {nota != null && <span className={`shrink-0 text-lg font-black tabular-nums ${cor}`}>{nota}</span>}
            {onRefazer && (
              <button type="button" onClick={() => onRefazer(a)} className="btn-3d-outline shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold">
                Refazer
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

HistoricoModulo.propTypes = { moduleType: PropTypes.string.isRequired, userId: PropTypes.string, onRefazer: PropTypes.func };

export function CabecalhoSecao({ titulo, onVoltar }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={onVoltar} className="btn-3d-outline rounded-xl px-3 py-1.5 text-xs font-bold" aria-label="Voltar">
        ← Voltar
      </button>
      <h2 className="text-lg font-extrabold">{titulo}</h2>
    </div>
  );
}

CabecalhoSecao.propTypes = { titulo: PropTypes.string.isRequired, onVoltar: PropTypes.func.isRequired };
