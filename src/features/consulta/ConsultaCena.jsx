import React, { useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/surface";
import PageShell from "@/components/layout/PageShell";
import CenaAoVivo from "@/features/cena/CenaAoVivo.jsx";
import { consulta } from "@/features/cena/servidor.js";
import { buscarPersonagem } from "@/features/cena/dados/personagens.js";
import { abertura } from "./dados/aberturas.js";
import Rapport from "./componentes/Rapport.jsx";

const AVISO_FIM = 5;

/**
 * Cena da consulta: o motor Cena ao Vivo ligado às ações da cena-ia.
 * `sessao` = { sessaoId, personagemId, personalidadePublica, briefing }.
 * Com `retomada` ({ turnos, rapport, turnosRestantes }) a conversa continua de onde parou.
 */
export default function ConsultaCena({ sessao, retomada = null, onSair }) {
  const personagem = buscarPersonagem(sessao.personagemId);
  const [rapport, setRapport] = useState(retomada?.rapport ?? "baixo");
  const [restantes, setRestantes] = useState(retomada?.turnosRestantes ?? 40);
  const [encerrando, setEncerrando] = useState(false);

  const falasIniciais = useMemo(
    () => (retomada ? [] : abertura(sessao.personagemId, sessao.personalidadePublica, sessao.sessaoId)),
    [retomada, sessao.personagemId, sessao.personalidadePublica, sessao.sessaoId]
  );

  const onEnviar = useCallback(
    async (texto, canal, turnoId) => {
      const r = await consulta.turno({ sessaoId: sessao.sessaoId, turnoId, texto, canal });
      setRapport(r.rapport);
      setRestantes(r.turnosRestantes);
      return [{ texto: r.fala, emocao: r.emocao, origem: "aovivo" }];
    },
    [sessao.sessaoId]
  );

  if (encerrando) {
    return (
      <PageShell semDock>
        <Panel className="space-y-3 text-center">
          <h1 className="text-lg font-extrabold">Consulta encerrada</h1>
          <p className="text-sm font-semibold text-[#9FB3C6]">Em breve: relatório com a cobertura da anamnese, a comunicação e o raciocínio.</p>
          <Button variant="primary" onClick={onSair}>Voltar ao início</Button>
        </Panel>
      </PageShell>
    );
  }

  const slotTopo = (
    <div className="space-y-1">
      <Rapport nivel={rapport} />
      {restantes <= AVISO_FIM && restantes > 0 && (
        <p className="text-center text-xs font-bold text-[#FFC247]" role="status">
          Faltam {restantes} falas: hora de ir fechando.
        </p>
      )}
    </div>
  );

  const b = sessao.briefing;
  return (
    <CenaAoVivo
      personagemId={sessao.personagemId}
      titulo={`${personagem?.nome ?? b.nome} · ${b.setor}`}
      progresso={{ atual: 40 - restantes, total: 40 }}
      slotTopo={slotTopo}
      acoes={[{ id: "encerrar", rotulo: "Encerrar consulta", onClick: () => setEncerrando(true) }]}
      falasIniciais={falasIniciais}
      turnosIniciais={retomada ? retomada.turnos : null}
      autoIniciar={!retomada}
      onEnviar={onEnviar}
      onEncerrar={onSair}
    />
  );
}

ConsultaCena.propTypes = {
  sessao: PropTypes.shape({
    sessaoId: PropTypes.string.isRequired,
    personagemId: PropTypes.string.isRequired,
    personalidadePublica: PropTypes.string.isRequired,
    briefing: PropTypes.object.isRequired,
  }).isRequired,
  retomada: PropTypes.shape({ turnos: PropTypes.array, rapport: PropTypes.string, turnosRestantes: PropTypes.number }),
  onSair: PropTypes.func,
};
