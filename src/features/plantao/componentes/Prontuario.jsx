import React from "react";
import PropTypes from "prop-types";
import { HelpCircle } from "lucide-react";
import FichaProntuario, { nascimentoPorIdade } from "@/components/prontuario/FichaProntuario.jsx";
import { dadosDoProntuario } from "../dados/prontuarioPlantao.js";

// Prontuário do paciente em papel na prancheta. Os achados das lacunas aparecem como "?" até serem examinados.
// A narrativa da avaliação NÃO aparece (ela entrega os achados).
export default function Prontuario({ cenario, lacunasPreenchidas = {}, onAbrirLacuna, compacto = false }) {
  const d = dadosDoProntuario(cenario);
  const exame = (
    <section>
      <h3 className="text-[13px] font-bold text-[#2B2F2E]">Exame do paciente</h3>
      <p className="text-[12px] font-semibold leading-snug text-[#4A5550]">A Ana vai perguntar sobre estes itens. Toque em cada um para examinar o paciente: o que você encontrar fica anotado aqui para usar na passagem.</p>
      <ul className="mt-1 space-y-1.5">
        {cenario.lacunas.map((l) => {
          const feita = lacunasPreenchidas[l.campo];
          return (
            <li key={l.campo}>
              {feita ? (
                <div className="rounded-md border border-[#2E8A5C]/50 bg-[#3DD68C]/15 px-2 py-1">
                  <p className="text-[11px] font-bold uppercase text-[#2B2F2E]">{l.rotulo}</p>
                  <p className="text-[14px] font-semibold text-[#1F3A5F]">{feita.valor}</p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onAbrirLacuna(l)}
                  className="flex w-full items-center gap-2 rounded-md border-2 border-dashed border-[#C98A12] bg-[#FFC247]/15 px-2 py-1.5 text-left transition-transform active:scale-[0.98]"
                  aria-label={`${l.rotulo}: ainda não examinado. Toque para examinar`}
                >
                  <HelpCircle size={18} className="shrink-0 text-[#B07405]" aria-hidden="true" />
                  <span className="flex-1 text-[14px] font-bold text-[#2B2F2E]">{l.rotulo}</span>
                  <span className="text-[14px] font-black text-[#B07405]">?</span>
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );

  return (
    <FichaProntuario
      foto={`/pacientes/fotos/${cenario.id}.webp`}
      nome={cenario.name}
      nascimento={`${nascimentoPorIdade(d.idadeAnos, cenario.id, new Date(), d.meses)} (${d.idadeTexto})`}
      sexo={d.sexo}
      leito={cenario.sector}
      motivo={cenario.diagnosis}
      historico={d.historico}
      sinaisVitais={d.sinaisVitais}
      anamnese={cenario.goldenSbar.situation}
      alergias={d.alergias}
      prescricao={cenario.goldenSbar.recommendation}
      extra={exame}
      compacto={compacto}
    />
  );
}

Prontuario.propTypes = {
  cenario: PropTypes.object.isRequired,
  lacunasPreenchidas: PropTypes.object,
  onAbrirLacuna: PropTypes.func.isRequired,
  compacto: PropTypes.bool,
};
