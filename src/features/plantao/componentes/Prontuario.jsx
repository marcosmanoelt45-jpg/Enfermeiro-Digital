import React from "react";
import PropTypes from "prop-types";
import FichaProntuario, { nascimentoPorIdade } from "@/components/prontuario/FichaProntuario.jsx";
import { dadosDoProntuario } from "../dados/prontuarioPlantao.js";

// Prontuário do paciente em papel na prancheta. Os achados das lacunas aparecem como "?" até serem examinados.
// A narrativa da avaliação NÃO aparece (ela entrega os achados).
export default function Prontuario({ cenario, lacunasPreenchidas = {}, compacto = false }) {
  const d = dadosDoProntuario(cenario);
  // O exame é pedido na conversa ("vou avaliar o dreno"): aqui ficam só os achados já examinados.
  const feitas = cenario.lacunas.filter((l) => lacunasPreenchidas[l.campo]);
  const exame = (
    <section>
      <h3 className="text-[13px] font-bold text-[#2B2F2E]">Exame do paciente</h3>
      {feitas.length === 0 ? (
        <p className="text-[12px] font-semibold leading-snug text-[#4A5550]">Ainda não examinado. Diga na conversa o que vai avaliar (ex.: "vou avaliar o curativo") e o achado aparece aqui.</p>
      ) : (
        <ul className="mt-1 space-y-1.5">
          {feitas.map((l) => (
            <li key={l.campo} className="rounded-md border border-[#2E8A5C]/50 bg-[#3DD68C]/15 px-2 py-1">
              <p className="text-[11px] font-bold uppercase text-[#2B2F2E]">{l.rotulo}</p>
              <p className="text-[14px] font-semibold text-[#1F3A5F]">{lacunasPreenchidas[l.campo].valor}</p>
            </li>
          ))}
        </ul>
      )}
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
  onAbrirLacuna: PropTypes.func,
  compacto: PropTypes.bool,
};
