import React from "react";
import PropTypes from "prop-types";
import FichaProntuario, { nascimentoPorIdade } from "@/components/prontuario/FichaProntuario.jsx";
import { paginasProntuario } from "@/components/prontuario/PaginasProntuario.jsx";
import { linhasSinaisVitais } from "@/components/prontuario/sinaisVitais.js";

const A_INVESTIGAR = <span className="text-[#7D8A85]">A investigar na consulta.</span>;
// Quando o paciente não lembra (alergias, nomes de remédio), há outras fontes: é o caminho plausível de um plantão real.
const OUTRAS_FONTES = (
  <span className="text-[#7D8A85]">A investigar na consulta. Se ele não lembrar, peça a receita ou os papéis que trouxe, veja o registro de internação anterior ou ligue para um familiar.</span>
);
const SEXO = { M: "Masculino", F: "Feminino" };

// O que a equipe já sabe, no papel: identificação, setor, queixa e sinais vitais. Histórico, alergias e medicações
// ficam em branco de propósito (é o que a consulta vai descobrir).
export default function ProntuarioConsulta({ sessao, compacto = false, exames = [] }) {
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
      alergias={OUTRAS_FONTES}
      prescricao={OUTRAS_FONTES}
      compacto={compacto}
      extra={
        exames.length > 0 ? (
          <section>
            <h3 className="text-[13px] font-bold text-[#2B2F2E]">Exames feitos na consulta:</h3>
            <ul className="text-[14px] font-semibold text-[#1F3A5F]">
              {exames.map((x) => (
                <li key={x.exameId}>
                  <span className="text-[#2B2F2E]">{x.rotulo}:</span> {x.resultado}
                </li>
              ))}
            </ul>
          </section>
        ) : null
      }
    />
  );
}

ProntuarioConsulta.propTypes = { sessao: PropTypes.object.isRequired, compacto: PropTypes.bool, exames: PropTypes.array };

/** Prontuário da consulta em páginas, para a janela. */
export function paginasConsulta({ sessao, exames = [] }) {
  const b = sessao.briefing ?? {};
  return paginasProntuario({
    foto: `/pacientes/fotos/${sessao.personagemId}.webp`,
    nome: b.nome ?? "Paciente",
    nascimento: b.idade ? `${nascimentoPorIdade(b.idade, sessao.sessaoId)} (${b.idade} anos)` : "",
    sexo: SEXO[b.sexo] ?? b.sexo ?? "",
    leito: b.setor,
    motivo: b.queixa,
    sinais: linhasSinaisVitais(b.sinaisVitais, b.idade),
    historico: A_INVESTIGAR,
    anamnese: A_INVESTIGAR,
    alergias: OUTRAS_FONTES,
    prescricao: OUTRAS_FONTES,
    achados: (
      <section>
        <h3 className="text-[13px] font-bold text-[#2B2F2E]">Exames feitos na consulta</h3>
        {exames.length === 0 ? (
          <p className="text-[12px] font-semibold leading-snug text-[#4A5550]">Nenhum ainda. Combine o exame na conversa (ex.: "vou medir sua glicemia") e o resultado aparece aqui.</p>
        ) : (
          <ul className="text-[14px] font-semibold text-[#1F3A5F]">
            {exames.map((x) => (
              <li key={x.exameId}>
                <span className="text-[#2B2F2E]">{x.rotulo}:</span> {x.resultado}
              </li>
            ))}
          </ul>
        )}
      </section>
    ),
  });
}
