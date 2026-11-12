import React, { useState } from "react";
import PropTypes from "prop-types";
import { ArrowDown, ArrowUp, TriangleAlert } from "lucide-react";

// Prontuário em páginas de papel, para a janela (JanelaFolha): 1) identificação e sinais vitais com a faixa de
// referência e o que está fora dela; 2) história e alergias; 3) prescrição, pendências e o que foi examinado.
// Cada caso só passa os seus dados; campo vazio mostra as linhas em branco.

const TINTA = "#1F3A5F";
const LINHA = 26;
const pautado = {
  backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${LINHA - 1}px, #9AA5A0 ${LINHA - 1}px, #9AA5A0 ${LINHA}px)`,
  lineHeight: `${LINHA}px`,
};

function Papel({ nome, leito, children }) {
  return (
    <article className="rounded-md bg-[#E5E8E3] px-4 pb-5 pt-3 text-[#2B2F2E] shadow-[0_4px_0_#3E2C26]" aria-label={`Prontuário de ${nome}`}>
      <header className="mb-3 flex items-baseline justify-between gap-2 border-b-2 border-[#2B2F2E]/70 pb-1.5">
        <p className="text-[12px] font-black tracking-wide">PRONTUÁRIO DO PACIENTE</p>
        <p className="truncate text-[12px] font-bold" style={{ color: TINTA }}>
          {nome}
          {leito ? ` · ${leito}` : ""}
        </p>
      </header>
      <div className="space-y-3">{children}</div>
    </article>
  );
}
Papel.propTypes = { nome: PropTypes.string, leito: PropTypes.string, children: PropTypes.node };

function Campo({ rotulo, children, linhas = 2 }) {
  const vazio = children == null || children === "" || (Array.isArray(children) && children.length === 0);
  return (
    <section>
      <h3 className="text-[13px] font-bold text-[#2B2F2E]">{rotulo}</h3>
      <div className="text-[14px] font-semibold" style={{ ...pautado, color: TINTA, minHeight: LINHA * linhas }}>
        {vazio ? null : children}
      </div>
    </section>
  );
}
Campo.propTypes = { rotulo: PropTypes.string.isRequired, children: PropTypes.node, linhas: PropTypes.number };

function Foto({ src, nome }) {
  const [erro, setErro] = useState(false);
  return (
    <div className="aspect-square w-24 shrink-0 overflow-hidden border-[3px] border-[#1A1A1A] bg-[#DCE4EB] sm:w-28">
      {src && !erro ? (
        <img src={src} alt={`Foto de ${nome}`} className="h-full w-full object-cover" loading="lazy" decoding="async" onError={() => setErro(true)} />
      ) : (
        <p className="pt-3 text-center text-[11px] font-semibold">SEM FOTO</p>
      )}
    </div>
  );
}
Foto.propTypes = { src: PropTypes.string, nome: PropTypes.string };

const COR_ESTADO = { alto: "#C0392B", baixo: "#B9770E" };

function TabelaSinais({ linhas }) {
  if (!linhas.length) return <Campo rotulo="Sinais vitais:" linhas={3} />;
  const fora = linhas.filter((l) => l[3]).length;
  return (
    <section>
      <h3 className="text-[13px] font-bold text-[#2B2F2E]">Sinais vitais da admissão</h3>
      <table className="mt-1 w-full border-collapse text-left text-[13px]">
        <thead>
          <tr className="border-b border-[#2B2F2E]/50 text-[11px] uppercase">
            <th className="py-1 pr-2 font-bold">Sinal</th>
            <th className="py-1 pr-2 font-bold">Valor</th>
            <th className="py-1 font-bold">Referência</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map(([r, v, ref, e]) => (
            <tr key={r} className="border-b border-[#9AA5A0]/70">
              <td className="py-1 pr-2 font-bold">{r}</td>
              <td className="py-1 pr-2 font-extrabold tabular-nums" style={{ color: e ? COR_ESTADO[e] : TINTA }}>
                <span className="inline-flex items-center gap-0.5">
                  {v}
                  {e === "alto" && <ArrowUp className="h-3.5 w-3.5" aria-label="acima da referência" />}
                  {e === "baixo" && <ArrowDown className="h-3.5 w-3.5" aria-label="abaixo da referência" />}
                </span>
              </td>
              <td className="py-1 text-[12px] font-semibold tabular-nums text-[#5E6B66]">{ref}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1 text-[11px] font-bold text-[#5E6B66]">
        {fora ? `${fora} ${fora === 1 ? "sinal fora" : "sinais fora"} da faixa de referência (setas).` : "Todos dentro da faixa de referência."}
      </p>
    </section>
  );
}
TabelaSinais.propTypes = { linhas: PropTypes.array };

function CaixaAlergia({ children, temAlergia }) {
  return (
    <section className={`rounded-md border-2 px-2 py-1.5 ${temAlergia ? "border-[#C0392B]/70 bg-[#C0392B]/10" : "border-[#9AA5A0] bg-transparent"}`}>
      <h3 className="flex items-center gap-1 text-[13px] font-black" style={{ color: temAlergia ? "#C0392B" : "#2B2F2E" }}>
        {temAlergia && <TriangleAlert className="h-4 w-4" aria-hidden="true" />}
        Alergias
      </h3>
      <div className="text-[14px] font-semibold" style={{ color: TINTA }}>{children}</div>
    </section>
  );
}
CaixaAlergia.propTypes = { children: PropTypes.node, temAlergia: PropTypes.bool };

/** Páginas do prontuário para a JanelaFolha. */
export function paginasProntuario({ foto, nome, nascimento, sexo, leito, motivo, historico, sinais = [], anamnese, alergias, temAlergia = false, prescricao, achados = null }) {
  return [
    {
      titulo: "Identificação e sinais vitais",
      conteudo: (
        <Papel nome={nome} leito={leito}>
          <div className="flex gap-3">
            <Foto src={foto} nome={nome} />
            <div className="min-w-0 space-y-1">
              <p className="text-[11px] font-bold uppercase leading-tight">Paciente</p>
              <p className="text-[15px] font-extrabold leading-snug" style={{ color: TINTA }}>{nome}</p>
              {nascimento && <p className="text-[13px] font-bold tabular-nums" style={{ color: TINTA }}>{nascimento}</p>}
              <p className="text-[13px] font-bold">
                Sexo: <span style={{ color: TINTA }}>{sexo || "—"}</span>
              </p>
              <p className="text-[13px] font-bold">
                Leito/setor: <span style={{ color: TINTA }}>{leito || "—"}</span>
              </p>
            </div>
          </div>
          <Campo rotulo="Motivo da internação / queixa principal:" linhas={2}>{motivo}</Campo>
          <TabelaSinais linhas={sinais} />
        </Papel>
      ),
    },
    {
      titulo: "História e alergias",
      conteudo: (
        <Papel nome={nome} leito={leito}>
          <CaixaAlergia temAlergia={temAlergia}>{alergias}</CaixaAlergia>
          <Campo rotulo="Histórico e comorbidades:" linhas={3}>{historico}</Campo>
          <Campo rotulo="Anamnese prévia / situação atual:" linhas={3}>{anamnese}</Campo>
        </Papel>
      ),
    },
    {
      titulo: "Prescrição e exames",
      conteudo: (
        <Papel nome={nome} leito={leito}>
          <Campo rotulo="Prescrição e pendências:" linhas={4}>{prescricao}</Campo>
          {achados}
        </Papel>
      ),
    },
  ];
}
