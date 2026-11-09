import React, { useState } from "react";
import PropTypes from "prop-types";

// Prontuário em papel sobre uma prancheta (madeira, prendedor de metal e caneta), feito só com CSS para ficar
// nítido em qualquer tela. Cada caso só passa os seus dados. Campos vazios mostram as linhas em branco.

const TINTA = "#1F3A5F";
const LINHA = 26; // altura de cada linha pautada (px)

const pautado = {
  backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${LINHA - 1}px, #9AA5A0 ${LINHA - 1}px, #9AA5A0 ${LINHA}px)`,
  lineHeight: `${LINHA}px`,
};

function Campo({ rotulo, children, linhas = 2, className = "" }) {
  const vazio = children == null || children === "" || (Array.isArray(children) && children.length === 0);
  return (
    <section className={className}>
      <h3 className="text-[13px] font-bold text-[#2B2F2E]">{rotulo}</h3>
      <div className="text-[14px] font-semibold" style={{ ...pautado, color: TINTA, minHeight: LINHA * linhas }}>
        {vazio ? null : children}
      </div>
    </section>
  );
}

Campo.propTypes = { rotulo: PropTypes.string.isRequired, children: PropTypes.node, linhas: PropTypes.number, className: PropTypes.string };

function Prendedor() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-0 z-10 w-[38%] max-w-[260px] -translate-x-1/2 -translate-y-[38%]" aria-hidden="true">
      <div className="mx-auto h-10 w-[62%] rounded-t-2xl bg-[#A6AAAA] pt-2.5">
        <div className="mx-auto h-4 w-[70%] rounded-full bg-[#E9ECEB]" />
      </div>
      <div className="h-3 bg-[#8C918F]" />
      <div className="h-11 bg-[#A6AAAA]" style={{ backgroundImage: "linear-gradient(to bottom, #7A7F7D 0 7px, transparent 7px), linear-gradient(to top, #8C918F 0 8px, transparent 8px)" }} />
      <div className="h-1.5 bg-[#C3C6C1]" />
    </div>
  );
}

function Caneta() {
  return (
    <div className="relative mx-auto mt-4 h-5 w-[58%] max-w-[420px]" aria-hidden="true">
      <div className="absolute inset-y-[3px] left-[10%] right-[12%] rounded-sm" style={{ background: "linear-gradient(to bottom, #8E8A86 0 45%, #6E6A66 45% 100%)" }} />
      <div className="absolute inset-y-[3px] left-0 w-[11%] bg-[#2B2523]" style={{ clipPath: "polygon(0 50%, 35% 0, 100% 0, 100% 100%, 35% 100%)" }} />
      <div className="absolute inset-y-[1px] right-[4%] w-[9%] rounded-sm bg-[#2B2523]" />
      <div className="absolute -top-1 right-[10%] h-1.5 w-[22%] rounded-full bg-[#2B2523]" />
      <div className="absolute -bottom-1.5 left-[8%] right-[10%] h-1.5 rounded-full bg-black/25 blur-[2px]" />
    </div>
  );
}

export default function FichaProntuario({
  foto,
  nome,
  nascimento,
  sexo,
  leito,
  motivo,
  historico,
  sinaisVitais = [],
  anamnese,
  alergias,
  prescricao,
  extra = null,
  className = "",
}) {
  const [semFoto, setSemFoto] = useState(false);
  return (
    <div className={`relative mx-auto w-full max-w-[760px] pt-8 ${className}`}>
      <div
        className="relative rounded-[22px] p-3 pb-4 shadow-[0_18px_40px_rgba(0,0,0,0.45)] sm:p-5"
        style={{
          backgroundColor: "#8A5E45",
          backgroundImage:
            "repeating-linear-gradient(176deg, rgba(0,0,0,0.10) 0 3px, transparent 3px 22px), repeating-linear-gradient(183deg, rgba(255,255,255,0.05) 0 6px, transparent 6px 37px)",
          boxShadow: "inset 0 0 0 6px #6B4A3A, 0 18px 40px rgba(0,0,0,0.45)",
        }}
      >
        <Prendedor />
        <article
          className="relative rounded-sm bg-[#E5E8E3] px-4 pb-6 pt-14 text-[#2B2F2E] sm:px-6 sm:pt-16"
          style={{ boxShadow: "0 6px 0 #3E2C26" }}
          aria-label={`Prontuário de ${nome}`}
        >
          <div className="grid gap-x-6 gap-y-4 sm:grid-cols-[minmax(0,36%)_1fr]">
            {/* Foto e identificação */}
            <div className="space-y-2">
              <div className="aspect-square w-full max-w-[220px] overflow-hidden border-[3px] border-[#1A1A1A] bg-[#DCE4EB]">
                {foto && !semFoto ? (
                  <img src={foto} alt={`Foto de ${nome}`} className="h-full w-full object-cover" loading="lazy" decoding="async" onError={() => setSemFoto(true)} />
                ) : (
                  <p className="pt-3 text-center text-sm font-semibold">FOTO DO PACIENTE</p>
                )}
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase leading-tight">Nome do paciente e data de nascimento</p>
                  <p className="text-[15px] font-extrabold leading-snug" style={{ color: TINTA }}>{nome}</p>
                  {nascimento && <p className="text-[13px] font-bold tabular-nums" style={{ color: TINTA }}>{nascimento}</p>}
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase leading-tight">Sexo</p>
                  <p className="text-[15px] font-extrabold" style={{ color: TINTA }}>{sexo || "—"}</p>
                </div>
              </div>
            </div>

            {/* Cabeçalho, motivo e histórico */}
            <div className="space-y-3">
              <h2 className="text-center text-base font-black tracking-wide sm:text-lg">PRONTUÁRIO DO PACIENTE</h2>
              <p className="text-[13px] font-bold">
                Leito: <span className="text-[14px]" style={{ color: TINTA }}>{leito || "—"}</span>
              </p>
              <Campo rotulo="Motivo de internação:" linhas={3}>{motivo}</Campo>
              <Campo rotulo="Histórico:" linhas={3}>{historico}</Campo>
            </div>

            {/* Coluna esquerda */}
            <div className="space-y-4">
              <Campo rotulo="Sinais vitais:" linhas={4}>
                {sinaisVitais.length > 0 && (
                  <ul>
                    {sinaisVitais.map(([r, v]) => (
                      <li key={r} className="tabular-nums">
                        <span className="text-[#2B2F2E]">{r}:</span> {v}
                      </li>
                    ))}
                  </ul>
                )}
              </Campo>
              <Campo rotulo="Anamnese prévia (se houver):" linhas={4}>{anamnese}</Campo>
              <Campo rotulo="Alergias:" linhas={2}>{alergias}</Campo>
            </div>

            {/* Coluna direita */}
            <div className="space-y-4">
              <Campo rotulo="Prescrição e pendências:" linhas={6}>{prescricao}</Campo>
              {extra}
            </div>
          </div>
        </article>
        <Caneta />
      </div>
    </div>
  );
}

FichaProntuario.propTypes = {
  foto: PropTypes.string,
  nome: PropTypes.string.isRequired,
  nascimento: PropTypes.string,
  sexo: PropTypes.string,
  leito: PropTypes.string,
  motivo: PropTypes.node,
  historico: PropTypes.node,
  sinaisVitais: PropTypes.arrayOf(PropTypes.array),
  anamnese: PropTypes.node,
  alergias: PropTypes.node,
  prescricao: PropTypes.node,
  extra: PropTypes.node,
  className: PropTypes.string,
};

// Data de nascimento estável a partir da idade (o caso só guarda a idade): dia e mês saem do id do caso.
export function nascimentoPorIdade(idade, semente = "", hoje = new Date(), meses = null) {
  if (idade == null || Number.isNaN(Number(idade))) return "";
  let h = 0;
  for (const ch of String(semente)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  if (meses) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - meses, 1 + ((h >>> 4) % 28));
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  }
  const mes = h % 12;
  const dia = 1 + ((h >>> 4) % 28);
  let ano = hoje.getFullYear() - Number(idade);
  // Se o aniversário deste ano ainda não chegou, a pessoa nasceu um ano antes.
  if (mes > hoje.getMonth() || (mes === hoje.getMonth() && dia > hoje.getDate())) ano -= 1;
  return `${String(dia).padStart(2, "0")}/${String(mes + 1).padStart(2, "0")}/${ano}`;
}
