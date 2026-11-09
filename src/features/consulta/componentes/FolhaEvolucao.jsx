import React, { useState } from "react";
import PropTypes from "prop-types";
import { Loader2, Sparkles } from "lucide-react";
import { pedirAjudaGoti } from "../logica/ajudaGoti.js";

export const MAX_NOTAS = 1500;
const LINHA = 28;
const TINTA = "#1F3A5F";

const papelPautado = {
  backgroundColor: "#E5E8E3",
  backgroundImage: `linear-gradient(to right, transparent 0, transparent 38px, #E39A9A 38px, #E39A9A 39px, transparent 39px), repeating-linear-gradient(to bottom, transparent 0, transparent ${LINHA - 1}px, #A9B3AE ${LINHA - 1}px, #A9B3AE ${LINHA}px)`,
  backgroundAttachment: "local",
  lineHeight: `${LINHA}px`,
  color: TINTA,
};

const agora = () => new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

/**
 * Folha de evolução/anotação de enfermagem em papel: escrita livre (nada pronto para clicar) e um botão
 * para o Goti ajudar a formular, lendo o caso e o rascunho, sem dar a resposta.
 * `etapa`: "anotacao" (durante a consulta) ou "intervencoes" (no registro final).
 */
export default function FolhaEvolucao({
  titulo = "EVOLUÇÃO DE ENFERMAGEM",
  etapa = "anotacao",
  texto,
  onMudar,
  briefing = null,
  turnos = [],
  diagnosticos = [],
  linhas = 12,
  placeholder = "Escreva aqui o que o paciente contou, o que você observou e o que fez ou orientou.",
  idCampo = "folha-evolucao",
}) {
  const [ajuda, setAjuda] = useState(null);
  const [pedindo, setPedindo] = useState(false);
  const [quando] = useState(agora);

  const pedir = async () => {
    setPedindo(true);
    const r = await pedirAjudaGoti({ etapa, briefing, turnos, rascunho: texto, diagnosticos });
    setAjuda(r);
    setPedindo(false);
  };

  return (
    <div className="overflow-hidden rounded-2xl border-4 border-[#6B4A3A] shadow-[0_10px_28px_rgba(0,0,0,0.4)]" style={{ backgroundColor: "#8A5E45" }}>
      <div className="m-2 rounded-sm bg-[#E5E8E3] text-[#2B2F2E]" style={{ boxShadow: "0 4px 0 #3E2C26" }}>
        <header className="space-y-1 border-b-2 border-[#2B2F2E]/70 px-4 pb-2 pt-3">
          <h2 className="text-center text-sm font-black tracking-wide">{titulo}</h2>
          <div className="flex flex-wrap justify-between gap-x-3 text-[12px] font-bold">
            <span>
              Paciente: <span style={{ color: TINTA }}>{briefing ? `${briefing.nome}${briefing.idade ? `, ${briefing.idade} anos` : ""}` : "—"}</span>
            </span>
            <span>
              Data/hora: <span className="tabular-nums" style={{ color: TINTA }}>{quando}</span>
            </span>
          </div>
          {briefing?.setor && (
            <p className="text-[12px] font-bold">
              Setor: <span style={{ color: TINTA }}>{briefing.setor}</span>
            </p>
          )}
        </header>
        <label htmlFor={idCampo} className="sr-only">{titulo}</label>
        <textarea
          id={idCampo}
          value={texto}
          maxLength={MAX_NOTAS}
          onChange={(e) => onMudar(e.target.value.slice(0, MAX_NOTAS))}
          placeholder={placeholder}
          spellCheck
          className="block w-full resize-none border-0 bg-transparent py-0 pl-12 pr-4 text-[15px] font-semibold placeholder:text-[#7D8A85] focus:outline-none focus:ring-0"
          style={{ ...papelPautado, height: LINHA * linhas, paddingTop: 2 }}
        />
        <footer className="flex items-center justify-between gap-2 border-t border-[#2B2F2E]/30 px-3 py-2">
          <button
            type="button"
            onClick={pedir}
            disabled={pedindo}
            className="btn-3d-teal inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold disabled:opacity-70"
          >
            {pedindo ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Sparkles size={15} aria-hidden="true" />}
            {pedindo ? "O Goti está lendo o caso…" : "Pedir ajuda ao Goti"}
          </button>
          <span className="text-[11px] font-bold tabular-nums text-[#5E6B66]">{texto.length}/{MAX_NOTAS}</span>
        </footer>
      </div>
      {ajuda && (
        <div className="mx-2 mb-2 flex gap-2 rounded-xl border border-[#20D5B5]/40 bg-[#0E1722] p-3" role="status" aria-live="polite">
          <img src="/goti/goti-pose-neutral.png" alt="" className="h-10 w-10 shrink-0 object-contain" />
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-extrabold text-[#20D5B5]">Goti{ajuda.offline ? " (dica rápida)" : ""}</p>
            <p className="whitespace-pre-line text-sm font-semibold text-[#EAF2F8]">{ajuda.texto}</p>
            <button type="button" onClick={() => setAjuda(null)} className="text-xs font-bold text-[#9FB3C6] underline">
              Fechar dica
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

FolhaEvolucao.propTypes = {
  titulo: PropTypes.string,
  etapa: PropTypes.oneOf(["anotacao", "intervencoes"]),
  texto: PropTypes.string.isRequired,
  onMudar: PropTypes.func.isRequired,
  briefing: PropTypes.object,
  turnos: PropTypes.array,
  diagnosticos: PropTypes.arrayOf(PropTypes.string),
  linhas: PropTypes.number,
  placeholder: PropTypes.string,
  idCampo: PropTypes.string,
};
