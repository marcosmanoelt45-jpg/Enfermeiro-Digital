import React from "react";
import PropTypes from "prop-types";
import FichaProntuario, { nascimentoPorIdade } from "@/components/prontuario/FichaProntuario.jsx";

const A_INVESTIGAR = <span className="text-[#7D8A85]">A investigar na consulta.</span>;
const SEXO = { M: "Masculino", F: "Feminino" };

// O que a equipe já sabe, no papel: identificação, setor, queixa e sinais vitais. Histórico, alergias e medicações
// ficam em branco de propósito (é o que a consulta vai descobrir).
export default function ProntuarioConsulta({ sessao, compacto = false }) {
  const b = sessao.briefing ?? {};
  const v = b.sinaisVitais;
  return (
    <FichaProntuario
      foto={`/pacientes/fotos/${sessao.personagemId}.webp`}
      nome={b.nome ?? "Paciente"}
      nascimento={b.idade ? `${nascimentoPorIdade(b.idade, sessao.sessaoId)} (${b.idade} anos)` : ""}
      sexo={SEXO[b.sexo] ?? b.sexo ?? ""}
      leito={b.setor}
      motivo={b.queixa}
      historico={A_INVESTIGAR}
      sinaisVitais={
        v
          ? [
              ["PA", `${v.pa_sistolica}/${v.pa_diastolica} mmHg`],
              ["FC", `${v.fc} bpm`],
              ["FR", `${v.fr} irpm`],
              ["SatO₂", `${v.sat}%`],
              ["Tax", `${String(v.tax).replace(".", ",")} °C`],
            ]
          : []
      }
      anamnese={A_INVESTIGAR}
      alergias={A_INVESTIGAR}
      prescricao={A_INVESTIGAR}
      compacto={compacto}
    />
  );
}

ProntuarioConsulta.propTypes = { sessao: PropTypes.object.isRequired, compacto: PropTypes.bool };
