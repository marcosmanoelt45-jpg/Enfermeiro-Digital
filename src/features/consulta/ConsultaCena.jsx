import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import CenaAoVivo from "@/features/cena/CenaAoVivo.jsx";
import { consulta, ErroServidor, obterRelatorioDaConsulta } from "@/features/cena/servidor.js";
import { buscarPersonagem } from "@/features/cena/dados/personagens.js";
import { useAuth } from "@/lib/AuthContext";
import { clinicalHistoryService, MODULE_TYPES } from "@/services/clinicalHistoryService";
import { clinicalGamificationService } from "@/services/clinicalGamificationService";
import { abertura } from "./dados/aberturas.js";
import { resumoParaHistorico } from "./logica/relatorioView.js";
import RegistroConsulta from "./componentes/RegistroConsulta.jsx";
import RelatorioConsulta from "./componentes/RelatorioConsulta.jsx";
import BlocoNotas from "./componentes/BlocoNotas.jsx";
import FolhaEvolucao from "./componentes/FolhaEvolucao.jsx";
import ProntuarioConsulta from "./componentes/ProntuarioConsulta.jsx";
import PainelFlutuante from "@/components/prontuario/PainelFlutuante.jsx";
import PainelExames from "./componentes/PainelExames.jsx";
import { detectarExame } from "./dados/exames.js";
import MinijogoRunner from "@/features/minijogos/componentes/MinijogoRunner.jsx";
import { dadosDaAusculta } from "@/features/minijogos/dados/ausculta-pulmonar-pov.js";
import { achadoDoTexto } from "@/features/minijogos/logica/ausculta.js";

const AVISO_FIM = 5;

// Anotações por aluno e por consulta (sobrevivem a recarregar a página).
const chaveNotas = (userId, sessaoId) => `enfere_notas_${userId ?? "anon"}_${sessaoId}`;
function lerNotas(chave) {
  try {
    return localStorage.getItem(chave) ?? "";
  } catch {
    return "";
  }
}

/**
 * Cena da consulta: o motor Cena ao Vivo ligado às ações da cena-ia, depois o registro e o relatório.
 * `sessao` = { sessaoId, personagemId, personalidadePublica, tema, briefing }.
 * Com `retomada` ({ turnos, rapport, turnosRestantes }) a conversa continua de onde parou.
 */
export default function ConsultaCena({ sessao, retomada = null, onSair, onNova, onFinalizada }) {
  const { user } = useAuth();
  const personagem = buscarPersonagem(sessao.personagemId);
  const [fase, setFase] = useState("cena"); // cena | registro | relatorio
  const [restantes, setRestantes] = useState(retomada?.turnosRestantes ?? 40);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const [relatorio, setRelatorio] = useState(null);
  const [turnosDoRelatorio, setTurnosDoRelatorio] = useState([]);
  const inicio = useRef(Date.now());
  const chave = chaveNotas(user?.id, sessao.sessaoId);
  const [notas, setNotas] = useState(() => lerNotas(chave));
  const [notasAbertas, setNotasAbertas] = useState(false);
  const [turnos, setTurnos] = useState(retomada?.turnos ?? []);
  const [prontuarioAberto, setProntuarioAberto] = useState(false);
  const [aba, setAba] = useState("evolucao"); // painel lateral: evolucao | prontuario
  // Exames de beira de leito: o aluno pede na conversa ("vamos medir sua glicemia"), o paciente concorda e
  // aparece o botão; o resultado vem do servidor, coerente com o caso.
  const [exames, setExames] = useState([]);
  const [examePedido, setExamePedido] = useState(null);
  const [fazendoExame, setFazendoExame] = useState(false);
  const feitosRef = useRef(new Set());
  // Ausculta pulmonar vira o minijogo em primeira pessoa (com o achado do caso); os outros exames dão o resultado direto.
  const [ausculta, setAusculta] = useState(null); // { definicao, resultado }
  const fazerExame = async () => {
    if (!examePedido) return;
    setFazendoExame(true);
    try {
      let r = await consulta.exame({ sessaoId: sessao.sessaoId, exameId: examePedido });
      feitosRef.current.add(r.exameId);
      // "Glicemia capilar 112 mg/dL" -> "112 mg/dL" (o rótulo já aparece ao lado).
      const bruto = String(r.resultado ?? "");
      const sem = bruto.toLowerCase().startsWith(r.rotulo.toLowerCase()) ? bruto.slice(r.rotulo.length).replace(/^[:\s-]+/, "") : bruto;
      r = { ...r, resultado: sem ? sem.charAt(0).toUpperCase() + sem.slice(1) : bruto };
      setExamePedido(null);
      if (r.exameId === "ausculta-pulmonar") {
        const paciente = sessao.personagemId === "teresinha" ? "teresinha" : "marcus";
        setAusculta({ resultado: r, definicao: dadosDaAusculta({ achado: achadoDoTexto(r.resultado), paciente, id: "consulta-ausculta" }) });
        return;
      }
      setExames((lista) => [...lista.filter((x) => x.exameId !== r.exameId), r]);
    } catch {
      // segue com o botão para tentar de novo
    } finally {
      setFazendoExame(false);
    }
  };
  useEffect(() => {
    try {
      if (notas) localStorage.setItem(chave, notas);
      else localStorage.removeItem(chave);
    } catch {
      // sem armazenamento: as notas valem só nesta tela
    }
  }, [chave, notas]);

  const falasIniciais = useMemo(
    () => (retomada ? [] : abertura(sessao.personagemId, sessao.personalidadePublica, sessao.sessaoId)),
    [retomada, sessao.personagemId, sessao.personalidadePublica, sessao.sessaoId]
  );

  const onEnviar = useCallback(
    async (texto, canal, turnoId) => {
      const r = await consulta.turno({ sessaoId: sessao.sessaoId, turnoId, texto, canal });
      setRestantes(r.turnosRestantes);
      // O exame vem da IA do paciente ou, se ela não marcar, do próprio texto do aluno ("vou medir sua glicemia").
      const pedido = r.exame ?? detectarExame(texto);
      if (pedido && !feitosRef.current.has(pedido)) setExamePedido(pedido);
      return [{ texto: r.fala, emocao: r.emocao, origem: "aovivo" }];
    },
    [sessao.sessaoId]
  );

  const finalizar = useCallback(
    async (registro) => {
      setErro(null);
      setEnviando(true);
      try {
        const examesFeitos = exames.map((x) => ({ minijogoId: x.exameId, resultado: `${x.rotulo}: ${x.resultado}` }));
        const { relatorio: r } = await consulta.finalizar({ sessaoId: sessao.sessaoId, registro: examesFeitos.length ? { ...registro, examesFeitos } : registro });
        // Histórico do Perfil e pontos, uma vez só (o servidor já recusa finalizar de novo).
        const duracao = Math.round((Date.now() - inicio.current) / 1000);
        const resumo = resumoParaHistorico({ briefing: sessao.briefing, tema: sessao.tema, personalidadePublica: sessao.personalidadePublica });
        clinicalHistoryService.submitActivity({ id: sessao.sessaoId, moduleType: MODULE_TYPES.CONSULTA, ...resumo, durationSeconds: duracao, score: r.notas.geral, evaluation: r.notas, userId: user?.id ?? null });
        clinicalGamificationService.recordActivity("consulta", 40, user?.id ?? null, { activityId: sessao.sessaoId });
        onFinalizada?.();
        setNotas(""); // registro enviado: as anotações já estão nele
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
    [sessao, user, onFinalizada, exames]
  );

  if (fase === "relatorio" && relatorio) {
    return <RelatorioConsulta relatorio={relatorio} turnos={turnosDoRelatorio} onNova={onNova} onInicio={onSair} />;
  }
  if (fase === "registro") {
    return <RegistroConsulta achadosIniciais={notas} briefing={sessao.briefing} turnos={turnos} onEnviar={finalizar} enviando={enviando} erro={erro} onVoltar={() => setFase("cena")} />;
  }

  const slotTopo = (
    <div className="space-y-1">
      <p className="text-center text-xs font-bold text-[#9FB3C6]">{40 - restantes} de 40 falas</p>
      {restantes <= AVISO_FIM && restantes > 0 && (
        <p className="text-center text-xs font-bold text-[#FFC247]" role="status">
          Faltam {restantes} falas: hora de ir fechando.
        </p>
      )}
    </div>
  );

  const b = sessao.briefing;
  return (
    <>
    <CenaAoVivo
      personagemId={sessao.personagemId}
      titulo={`${personagem?.nome ?? b.nome} · ${b.setor}`}
      progresso={{ atual: 40 - restantes, total: 40 }}
      slotTopo={slotTopo}
      acoes={[
        { id: "prontuario", rotulo: "Prontuário", onClick: () => setProntuarioAberto((v) => !v), soCelular: true },
        { id: "notas", rotulo: notas.trim() ? "Evolução ✓" : "Evolução", onClick: () => setNotasAbertas(true), soCelular: true },
        { id: "encerrar", rotulo: "Encerrar e registrar", onClick: () => setFase("registro") },
      ]}
      falasIniciais={falasIniciais}
      turnosIniciais={retomada ? retomada.turnos : null}
      autoIniciar={!retomada}
      onEnviar={onEnviar}
      onEncerrar={onSair}
      onTurnos={setTurnos}
      slotAbaixoPalco={<PainelExames pedido={examePedido} fazendo={fazendoExame} exames={exames} onFazer={fazerExame} onDispensar={() => setExamePedido(null)} />}
      slotLateral={
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-1 rounded-2xl border border-[#27394B] bg-[#0E1722] p-1" role="tablist" aria-label="Painel">
            {[["evolucao", "Evolução"], ["prontuario", "Prontuário"]].map(([id, rotulo]) => (
              <button key={id} type="button" role="tab" aria-selected={aba === id} onClick={() => setAba(id)} className={`rounded-xl py-2 text-sm font-bold transition-colors ${aba === id ? "bg-[#20D5B5] text-[#0B131D]" : "text-[#9FB3C6]"}`}>
                {rotulo}
              </button>
            ))}
          </div>
          {aba === "evolucao" ? <FolhaEvolucao texto={notas} onMudar={setNotas} briefing={b} turnos={turnos} linhas={15} /> : <ProntuarioConsulta sessao={sessao} exames={exames} compacto />}
        </div>
      }
    />
    {ausculta && (
      <MinijogoRunner
        key={ausculta.definicao.id}
        definicao={ausculta.definicao}
        modo="consulta"
        onConcluir={() => {
          const r = ausculta.resultado;
          setExames((lista) => [...lista.filter((x) => x.exameId !== r.exameId), r]);
          setAusculta(null);
        }}
        onFechar={() => {
          feitosRef.current.delete("ausculta-pulmonar");
          setAusculta(null);
        }}
      />
    )}
    <PainelFlutuante aberto={prontuarioAberto} titulo="Prontuário" onFechar={() => setProntuarioAberto(false)}>
      <ProntuarioConsulta sessao={sessao} exames={exames} compacto />
    </PainelFlutuante>
    <BlocoNotas aberto={notasAbertas} texto={notas} onMudar={setNotas} onFechar={() => setNotasAbertas(false)} briefing={b} turnos={turnos} />
    </>
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
