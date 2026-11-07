import React, { useCallback, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import CenaAoVivo from "@/features/cena/CenaAoVivo.jsx";
import { consulta, ErroServidor, obterRelatorioDaConsulta } from "@/features/cena/servidor.js";
import { buscarPersonagem } from "@/features/cena/dados/personagens.js";
import { useAuth } from "@/lib/AuthContext";
import { clinicalHistoryService, MODULE_TYPES } from "@/services/clinicalHistoryService";
import { clinicalGamificationService } from "@/services/clinicalGamificationService";
import { abertura } from "./dados/aberturas.js";
import { resumoParaHistorico } from "./logica/relatorioView.js";
import Rapport from "./componentes/Rapport.jsx";
import RegistroConsulta from "./componentes/RegistroConsulta.jsx";
import RelatorioConsulta from "./componentes/RelatorioConsulta.jsx";

const AVISO_FIM = 5;

/**
 * Cena da consulta: o motor Cena ao Vivo ligado às ações da cena-ia, depois o registro e o relatório.
 * `sessao` = { sessaoId, personagemId, personalidadePublica, tema, briefing }.
 * Com `retomada` ({ turnos, rapport, turnosRestantes }) a conversa continua de onde parou.
 */
export default function ConsultaCena({ sessao, retomada = null, onSair, onNova, onFinalizada }) {
  const { user } = useAuth();
  const personagem = buscarPersonagem(sessao.personagemId);
  const [fase, setFase] = useState("cena"); // cena | registro | relatorio
  const [rapport, setRapport] = useState(retomada?.rapport ?? "baixo");
  const [restantes, setRestantes] = useState(retomada?.turnosRestantes ?? 40);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const [relatorio, setRelatorio] = useState(null);
  const [turnosDoRelatorio, setTurnosDoRelatorio] = useState([]);
  const inicio = useRef(Date.now());

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

  const finalizar = useCallback(
    async (registro) => {
      setErro(null);
      setEnviando(true);
      try {
        const { relatorio: r } = await consulta.finalizar({ sessaoId: sessao.sessaoId, registro });
        // Histórico do Perfil e pontos, uma vez só (o servidor já recusa finalizar de novo).
        const duracao = Math.round((Date.now() - inicio.current) / 1000);
        const resumo = resumoParaHistorico({ briefing: sessao.briefing, tema: sessao.tema, personalidadePublica: sessao.personalidadePublica });
        clinicalHistoryService.submitActivity({ id: sessao.sessaoId, moduleType: MODULE_TYPES.CONSULTA, ...resumo, durationSeconds: duracao, score: r.notas.geral, evaluation: r.notas, userId: user?.id ?? null });
        clinicalGamificationService.recordActivity("consulta", 40, user?.id ?? null, { activityId: sessao.sessaoId });
        onFinalizada?.();
        setRelatorio(r);
        setFase("relatorio");
        // "Rever conversa": depois de encerrada, a RLS libera os turnos; se falhar, o relatório abre sem eles.
        obterRelatorioDaConsulta(sessao.sessaoId).then((d) => setTurnosDoRelatorio(d.turnos)).catch(() => {});
      } catch (e) {
        if (e instanceof ErroServidor && e.codigo === "SESSAO_ENCERRADA") onFinalizada?.();
        setErro(e?.message || "Não foi possível montar o relatório. Tente de novo.");
      } finally {
        setEnviando(false);
      }
    },
    [sessao, user, onFinalizada]
  );

  if (fase === "relatorio" && relatorio) {
    return <RelatorioConsulta relatorio={relatorio} turnos={turnosDoRelatorio} onNova={onNova} onInicio={onSair} />;
  }
  if (fase === "registro") {
    return <RegistroConsulta onEnviar={finalizar} enviando={enviando} erro={erro} onVoltar={() => setFase("cena")} />;
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
      acoes={[{ id: "encerrar", rotulo: "Encerrar consulta", onClick: () => setFase("registro") }]}
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
    tema: PropTypes.string,
    briefing: PropTypes.object.isRequired,
  }).isRequired,
  retomada: PropTypes.shape({ turnos: PropTypes.array, rapport: PropTypes.string, turnosRestantes: PropTypes.number }),
  onSair: PropTypes.func,
  onNova: PropTypes.func,
  onFinalizada: PropTypes.func,
};
