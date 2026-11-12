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
import { ClipboardList, NotebookPen } from "lucide-react";
import FolhaEvolucao from "./componentes/FolhaEvolucao.jsx";
import { paginasConsulta } from "./componentes/ProntuarioConsulta.jsx";
import JanelaFolha from "@/components/prontuario/JanelaFolha.jsx";
import { MODELO_SOAP, anotarNoObjetivo, semModeloVazio } from "@/components/prontuario/modelosAnotacao.js";
import { ICONE_ANOTACAO, ICONE_PRONTUARIO } from "@/components/prontuario/icones.js";
import PainelExames, { PopupExame } from "./componentes/PainelExames.jsx";
import { detectarExame } from "./dados/exames.js";
import MinijogoRunner from "@/features/minijogos/componentes/MinijogoRunner.jsx";
import { dadosDaAusculta } from "@/features/minijogos/dados/ausculta-pulmonar-pov.js";
import { achadoDoTexto } from "@/features/minijogos/logica/ausculta.js";

const AVISO_FIM = 5;


// Anotações por aluno e por consulta (sobrevivem a recarregar a página).
const chaveNotas = (userId, sessaoId) => `enfere_notas_${userId ?? "anon"}_${sessaoId}`;
// Folha nova já vem com o modelo SOAP escrito (o aluno preenche ou apaga).
function lerNotas(chave) {
  try {
    return localStorage.getItem(chave) ?? MODELO_SOAP;
  } catch {
    return MODELO_SOAP;
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
  const [paginaProntuario, setPaginaProntuario] = useState(0);
  // Exames de beira de leito: o aluno pede na conversa ("vamos medir sua glicemia"), o paciente concorda e
  // aparece o botão; o resultado vem do servidor, coerente com o caso.
  const [exames, setExames] = useState([]);
  const [examePedido, setExamePedido] = useState(null);
  const [fazendoExame, setFazendoExame] = useState(false);
  const [resultadoNovo, setResultadoNovo] = useState(null); // resultado mostrado no pop-up logo após o exame
  const [erroExame, setErroExame] = useState(null);
  const feitosRef = useRef(new Set());
  // Ausculta pulmonar vira o minijogo em primeira pessoa (com o achado do caso); os outros exames dão o resultado direto.
  const [ausculta, setAusculta] = useState(null); // { definicao, resultado }
  const fazerExame = async () => {
    if (!examePedido) return;
    setErroExame(null);
    setFazendoExame(true);
    try {
      let r = await consulta.exame({ sessaoId: sessao.sessaoId, exameId: examePedido });
      feitosRef.current.add(r.exameId);
      // "Glicemia capilar 112 mg/dL" -> "112 mg/dL" (o rótulo já aparece ao lado).
      const bruto = String(r.resultado ?? "");
      const sem = (bruto.toLowerCase().startsWith(r.rotulo.toLowerCase()) ? bruto.slice(r.rotulo.length).replace(/^[:\s-]+/, "") : bruto).replace(/\.\s*$/, "");
      r = { ...r, resultado: sem ? sem.charAt(0).toUpperCase() + sem.slice(1) : bruto };
      setExamePedido(null);
      if (r.exameId === "ausculta-pulmonar") {
        const paciente = sessao.personagemId === "teresinha" ? "teresinha" : "marcus";
        setAusculta({ resultado: r, definicao: dadosDaAusculta({ achado: achadoDoTexto(r.resultado), paciente, id: "consulta-ausculta" }) });
        return;
      }
      setExames((lista) => [...lista.filter((x) => x.exameId !== r.exameId), r]);
      setResultadoNovo(r);
    } catch {
      setErroExame("Não deu para fazer o exame agora. Tente de novo.");
    } finally {
      setFazendoExame(false);
    }
  };
  const dispensarExame = useCallback(() => {
    setExamePedido(null);
    setErroExame(null);
  }, []);
  const fecharResultado = useCallback(() => setResultadoNovo(null), []);
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
      // Salva sozinho a cada fala: a consulta aparece no histórico antes de o aluno encerrar e registrar.
      clinicalHistoryService.autoSalvar({
        id: sessao.sessaoId,
        moduleType: MODULE_TYPES.CONSULTA,
        ...resumoParaHistorico({ briefing: sessao.briefing, tema: sessao.tema, personalidadePublica: sessao.personalidadePublica }),
        progress: Math.round(((40 - r.turnosRestantes) / 40) * 100),
        durationSeconds: (Date.now() - inicio.current) / 1000,
        userId: user?.id ?? null,
      });
      // O exame vem da IA do paciente ou, se ela não marcar, do próprio texto do aluno ("vou medir sua glicemia").
      const pedido = r.exame ?? detectarExame(texto);
      if (pedido && !feitosRef.current.has(pedido)) setExamePedido(pedido);
      return [{ texto: r.fala, emocao: r.emocao, origem: "aovivo" }];
    },
    [sessao.sessaoId, sessao.briefing, sessao.tema, sessao.personalidadePublica, user?.id]
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
    return <RegistroConsulta achadosIniciais={semModeloVazio(notas, MODELO_SOAP)} briefing={sessao.briefing} turnos={turnos} onEnviar={finalizar} enviando={enviando} erro={erro} onVoltar={() => setFase("cena")} />;
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
        { id: "prontuario", rotulo: "Prontuário", icone: ClipboardList, imagem: ICONE_PRONTUARIO, cor: "#20D5B5", ativo: prontuarioAberto, onClick: () => setProntuarioAberto((v) => !v) },
        { id: "notas", rotulo: "Anotação", icone: NotebookPen, imagem: ICONE_ANOTACAO, cor: "#FFC247", ativo: notasAbertas, onClick: () => setNotasAbertas((v) => !v) },
        { id: "encerrar", rotulo: "Encerrar e registrar", onClick: () => setFase("registro") },
      ]}
      falasIniciais={falasIniciais}
      turnosIniciais={retomada ? retomada.turnos : null}
      autoIniciar={!retomada}
      onEnviar={onEnviar}
      onEncerrar={onSair}
      onTurnos={setTurnos}
      slotAbaixoPalco={<PainelExames exames={exames} />}
    />
    <PopupExame
      pedido={ausculta ? null : examePedido}
      resultado={resultadoNovo}
      fazendo={fazendoExame}
      erro={erroExame}
      onFazer={fazerExame}
      onDispensar={dispensarExame}
      onAnotar={() => {
        const r = resultadoNovo;
        if (r) setNotas((n) => `${n.trim() ? `${n.trimEnd()}\n` : ""}${r.rotulo}: ${r.resultado}`);
        setResultadoNovo(null);
      }}
      onFechar={fecharResultado}
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
    <JanelaFolha
      id="consulta-prontuario"
      aberta={prontuarioAberto}
      titulo="Prontuário"
      icone={ClipboardList}
      cor="#20D5B5"
      lado="esquerda"
      paginas={paginasConsulta({ sessao, exames })}
      pagina={paginaProntuario}
      onPagina={setPaginaProntuario}
      onFechar={() => setProntuarioAberto(false)}
    />
    <JanelaFolha
      id="consulta-anotacao"
      aberta={notasAbertas}
      titulo="Anotação"
      icone={NotebookPen}
      cor="#FFC247"
      lado="direita"
      paginas={[
        { titulo: "Evolução (SOAP)", conteudo: <div className="h-full min-h-[420px]"><FolhaEvolucao texto={notas} onMudar={setNotas} briefing={b} turnos={turnos} modelo={MODELO_SOAP} preencher idCampo="folha-evolucao-janela" /></div> },
        {
          titulo: "Exames e sinais",
          conteudo: (
            <div className="space-y-2 rounded-md bg-[#E5E8E3] p-3 text-[#2B2F2E]">
              <p className="text-[12px] font-black">EXAMES E SINAIS PARA A EVOLUÇÃO</p>
              {exames.length === 0 ? (
                <p className="text-[13px] font-semibold text-[#4A5550]">Os exames que você fizer na consulta aparecem aqui, com um botão para levar o resultado para a evolução.</p>
              ) : (
                exames.map((x) => (
                  <div key={x.exameId} className="flex items-center justify-between gap-2 rounded-md border border-[#9AA5A0] px-2 py-1.5">
                    <p className="text-[14px] font-semibold text-[#1F3A5F]"><span className="text-[#2B2F2E]">{x.rotulo}:</span> {x.resultado}</p>
                    <button type="button" onClick={() => setNotas((n) => anotarNoObjetivo(n, `${x.rotulo}: ${x.resultado}`))} className="btn-3d-amber shrink-0 rounded-lg px-2 py-1 text-xs font-extrabold">Anotar</button>
                  </div>
                ))
              )}
              <p className="text-[11px] font-bold text-[#5E6B66]">O resultado entra na linha "O (Objetivo)" da folha.</p>
            </div>
          ),
        },
      ]}
      onFechar={() => setNotasAbertas(false)}
    />
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
