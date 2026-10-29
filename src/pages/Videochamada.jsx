import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  RotateCcw,
  SkipForward,
  Sparkles
} from "lucide-react";
import { PACIENTES, gerarCasoAleatorio } from "@/data/simuladorCasosData";
import { falar, pararFala } from "@/services/simuladorVozService";
import { clinicalGamificationService } from "@/services/clinicalGamificationService";
import { clinicalHistoryService } from "@/services/clinicalHistoryService";

import PacienteVideoStage from "@/components/simulador/PacienteVideoStage";
import FalaLegendaBubble from "@/components/simulador/FalaLegendaBubble";
import PlurallTopBar from "@/components/simulador/PlurallTopBar";
import PlurallQuestionCard from "@/components/simulador/PlurallQuestionCard";
import PraticaSelectModal from "@/components/simulador/PraticaSelectModal";
import RevisaoFinalModal from "@/components/simulador/RevisaoFinalModal";

export default function Videochamada() {
  const navigate = useNavigate();

  // Estados de Controle de Modal e Tela
  const [modalPraticaAberto, setModalPraticaAberto] = useState(true);
  const [modalRevisaoFinalAberto, setModalRevisaoFinalAberto] = useState(false);
  const [resumoFinal, setResumoFinal] = useState(null);

  // Paciente e Caso Clínico
  const [pacienteId, setPacienteId] = useState(() => (Math.random() < 0.5 ? "marcus" : "teresinha"));
  const [caso, setCaso] = useState(() => gerarCasoAleatorio("marcus", { mode: "normal", categoria: "todos" }));
  const [modalidadeAtiva, setModalidadeAtiva] = useState("Atividade Normal (7 a 9)");
  const [categoriaAtiva, setCategoriaAtiva] = useState("todos");

  // Navegação de Passos (1 até totalQuestoes)
  const [stepIndex, setStepIndex] = useState(1);
  const [maxStepAlcancado, setMaxStepAlcancado] = useState(1);

  // Estado Individual por Questão (Plurall Engine)
  // Formato: { [stepIndex]: { selectedChoice, tentativas, status: 'aberta'|'amarela'|'vermelha'|'verde', isFinalizada } }
  const [questaoStates, setQuestaoStates] = useState({});

  // Estatísticas Globais da Sessão
  const [acertos, setAcertos] = useState(0);
  const [amarelas, setAmarelas] = useState(0);
  const [vermelhas, setVermelhas] = useState(0);
  const [startTime, setStartTime] = useState(() => Date.now());

  // Áudio, Fala e Vídeo do Paciente
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const [clipeAtivo, setClipeAtivo] = useState("fala"); // 'fala' | 'acerto' | 'erro'

  const mountedRef = useRef(true);

  // Questões válidas do caso (exclui a fala introdutória de passo 0)
  const todasQuestoes = useMemo(() => {
    return caso.passos.filter((p) => p.tipo !== "fala" && p.tipo !== "fala_paciente");
  }, [caso]);

  const totalQuestoes = todasQuestoes.length || 7;
  // A questão atual mapeia de 1 a N
  const questaoAtual = todasQuestoes[stepIndex - 1] || todasQuestoes[0];

  const questoesRevisaoPendentes = useMemo(() => {
    return clinicalHistoryService.getQuestoesRevisao();
  }, [modalPraticaAberto]);

  // Contagem de questões respondidas
  const respondidasCount = useMemo(() => {
    return Object.values(questaoStates).filter(
      (st) => st.status === "verde" || st.status === "vermelha" || (st.status === "amarela" && st.isFinalizada)
    ).length;
  }, [questaoStates]);

  // Estado da questão atual
  const estadoAtual = questaoStates[stepIndex] || {
    selectedChoice: null,
    tentativas: 0,
    status: "aberta",
    isFinalizada: false
  };

  const isReadOnly = stepIndex < maxStepAlcancado && estadoAtual.isFinalizada;

  // Limpeza de fala e timers ao desmontar
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      pararFala();
    };
  }, []);

  // Iniciar fala do paciente quando a questão mudar
  const executarFala = useCallback(
    (texto, customAudioFile) => {
      if (!texto) return;
      setActiveWordIndex(-1);

      falar(texto, pacienteId, {
        soundEnabled,
        customAudioFile,
        onStart: () => {
          if (mountedRef.current) setIsSpeaking(true);
        },
        onWordIndex: (wIndex) => {
          if (mountedRef.current) setActiveWordIndex(wIndex);
        },
        onEnd: () => {
          if (mountedRef.current) {
            setIsSpeaking(false);
            setActiveWordIndex(-1);
          }
        }
      });
    },
    [pacienteId, soundEnabled]
  );

  // Disparar fala ao trocar de questão
  useEffect(() => {
    if (!modalPraticaAberto && questaoAtual?.pergunta) {
      setClipeAtivo("fala");
      executarFala(questaoAtual.pergunta, questaoAtual.audioPath);
    }
    return () => {
      pararFala();
    };
  }, [stepIndex, modalPraticaAberto, questaoAtual, executarFala]);

  // Iniciar Atendimento com parâmetros selecionados no modal Plurall
  function handleIniciarSessaoPratica({ mode, categoria, topicoNome }) {
    pararFala();

    // Sorteia aleatoriamente Marcus ou Teresinha
    const novoPaciente = Math.random() < 0.5 ? "marcus" : "teresinha";
    setPacienteId(novoPaciente);

    let labelsModo = "Atividade Normal (7 a 9)";
    if (mode === "rapida") labelsModo = "Atividade Rápida (4 a 6)";
    if (mode === "revisao") labelsModo = "Revisão (Só Amarelas e Vermelhas)";
    setModalidadeAtiva(labelsModo);
    setCategoriaAtiva(categoria);

    const revisaoQueue = clinicalHistoryService.getQuestoesRevisao();
    const novoCaso = gerarCasoAleatorio(novoPaciente, {
      mode,
      categoria,
      revisaoQuestoes: revisaoQueue
    });

    setCaso(novoCaso);
    setStepIndex(1);
    setMaxStepAlcancado(1);
    setQuestaoStates({});
    setAcertos(0);
    setAmarelas(0);
    setVermelhas(0);
    setStartTime(Date.now());
    setModalPraticaAberto(false);
    setModalRevisaoFinalAberto(false);
  }

  // Selecionar alternativa na questão atual
  function handleSelectChoice(choiceIdx) {
    if (estadoAtual.isFinalizada || isReadOnly) return;

    setQuestaoStates((prev) => ({
      ...prev,
      [stepIndex]: {
        ...(prev[stepIndex] || { tentativas: 0, status: "aberta" }),
        selectedChoice: choiceIdx
      }
    }));
  }

  // Verificar Resposta com Sistema de 2 Erros
  function handleVerificarResposta() {
    if (estadoAtual.selectedChoice === null || estadoAtual.isFinalizada) return;

    pararFala();
    const escolhaAluno = estadoAtual.selectedChoice;
    const gabarito = questaoAtual.correta;
    const isCorreta = escolhaAluno === gabarito;
    const tentativasAtuais = estadoAtual.tentativas || 0;

    if (isCorreta) {
      // ACERTO
      setClipeAtivo("acerto");
      if (tentativasAtuais === 0) {
        // Acertou na 1ª tentativa: Verde
        setAcertos((prev) => prev + 1);
        setQuestaoStates((prev) => ({
          ...prev,
          [stepIndex]: {
            ...prev[stepIndex],
            status: "verde",
            tentativas: 1,
            isFinalizada: true
          }
        }));
        // Remove da fila de revisão se for o caso
        clinicalHistoryService.removerQuestoesRevisao([questaoAtual]);
      } else {
        // Acertou na 2ª tentativa (após dica amarela): Finaliza como amarela resolvida
        setQuestaoStates((prev) => ({
          ...prev,
          [stepIndex]: {
            ...prev[stepIndex],
            status: "amarela",
            tentativas: 2,
            isFinalizada: true
          }
        }));
      }
    } else {
      // ERRO
      setClipeAtivo("erro");
      if (tentativasAtuais === 0) {
        // 1º ERRO: Exibir Dica sem gabarito e marcar como amarela
        setAmarelas((prev) => prev + 1);
        setQuestaoStates((prev) => ({
          ...prev,
          [stepIndex]: {
            ...prev[stepIndex],
            status: "amarela",
            tentativas: 1,
            isFinalizada: false // permite tentar de novo
          }
        }));
      } else {
        // 2º ERRO: Revela resposta, explica e marca para Revisão (Vermelha)
        setVermelhas((prev) => prev + 1);
        setQuestaoStates((prev) => ({
          ...prev,
          [stepIndex]: {
            ...prev[stepIndex],
            status: "vermelha",
            tentativas: 2,
            isFinalizada: true
          }
        }));
      }
    }
  }

  // Avançar para próxima questão ou finalizar sessão
  function handleProximaQuestao() {
    pararFala();

    if (stepIndex >= totalQuestoes) {
      // Fim do simulador: Concluir e abrir Revisão Final
      finalizarAtendimento();
    } else {
      const nextStep = stepIndex + 1;
      setStepIndex(nextStep);
      setMaxStepAlcancado((prev) => Math.max(prev, nextStep));
    }
  }

  // Voltar para questão anterior (somente leitura)
  function handleVoltarQuestao() {
    if (stepIndex > 1) {
      pararFala();
      setStepIndex((prev) => prev - 1);
    }
  }

  // Avançar quando estiver revisitando questão anterior
  function handleAvancarParaFrente() {
    if (stepIndex < maxStepAlcancado) {
      pararFala();
      setStepIndex((prev) => prev + 1);
    }
  }

  // Finalizar Atendimento e Registrar Histórico
  function finalizarAtendimento() {
    const tempoTotalSegundos = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    const paciente = PACIENTES[pacienteId] || PACIENTES.marcus;
    const taxaAproveitamento = Math.round((acertos / totalQuestoes) * 100);

    // Mapeia todas as questões com suas respostas e status finais
    const listaQuestoesFinal = todasQuestoes.map((q, idx) => {
      const qNum = idx + 1;
      const st = questaoStates[qNum] || { status: "aberta", selectedChoice: null };
      return {
        ...q,
        numQuestao: qNum,
        status: st.status === "aberta" ? "amarela" : st.status,
        escolhaAluno: st.selectedChoice,
        alternativaEscolhidaTexto: st.selectedChoice !== null ? q.opcoes[st.selectedChoice] : null,
        gabaritoTexto: q.opcoes[q.correta]
      };
    });

    const dadosSessao = {
      pacienteId: paciente.id,
      pacienteNome: paciente.nome,
      modalidade: modalidadeAtiva,
      totalQuestoes,
      acertos,
      amarelas,
      vermelhas,
      precisao: taxaAproveitamento,
      tempoSegundos: tempoTotalSegundos,
      questoes: listaQuestoesFinal
    };

    // Salva no histórico oficial
    try {
      clinicalHistoryService.saveVideochamadaSession(dadosSessao);
      if (acertos > 0) {
        clinicalGamificationService.recordActivity("case_solved", acertos * 25);
      }
    } catch (saveErr) {
      console.warn("[Videochamada] Falha ao persistir histórico:", saveErr);
    }

    setResumoFinal({
      ...dadosSessao,
      aproveitamento: taxaAproveitamento,
      tempoTotal: tempoTotalSegundos
    });

    setModalRevisaoFinalAberto(true);
  }

  // Alternar som ligado / desligado
  function handleToggleSound() {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (!next) {
        pararFala();
        setIsSpeaking(false);
      }
      return next;
    });
  }

  // Repetir fala do paciente na pergunta atual
  function handleRepetirFala() {
    if (questaoAtual?.pergunta) {
      executarFala(questaoAtual.pergunta, questaoAtual.audioPath);
    }
  }

  // Pular fala do paciente
  function handlePularFala() {
    pararFala();
    setIsSpeaking(false);
    setActiveWordIndex(999);
  }

  return (
    <div className="w-full min-h-screen bg-[#0E1720] text-[#EAF2F8] font-['Nunito',sans-serif] flex justify-center selection:bg-[#20D5B5]/30">
      <div className="w-full max-w-[540px] min-h-screen flex flex-col relative overflow-x-hidden transition-all duration-300">
        {/* TopBar Estilo Plurall */}
        <PlurallTopBar
          respondidas={respondidasCount}
          total={totalQuestoes}
          acertos={acertos}
          amarelas={amarelas}
          vermelhas={vermelhas}
          onClose={() => navigate("/")}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          podeVoltar={stepIndex > 1}
          onVoltar={handleVoltarQuestao}
          questaoAtualIndex={stepIndex - 1}
        />

        {/* Palco do Paciente com Vídeo e Legenda com Ondas Sonoras */}
        <main className="flex-1 flex flex-col p-3 sm:p-4 gap-3">
          <div className="flex flex-col gap-2">
            <PacienteVideoStage
              pacienteId={pacienteId}
              clipeAtivo={clipeAtivo}
              isSpeaking={isSpeaking}
              onClipeEnded={() => setClipeAtivo("fala")}
              className="w-full h-[180px] xs:h-[195px] sm:h-[210px] rounded-2xl shadow-md border-2 border-[#1F3045]"
            />

            {/* Fala do Paciente em Estilo Legenda Karaokê com Ondas Sonoras */}
            <FalaLegendaBubble
              texto={questaoAtual?.pergunta || "Aguardando próxima pergunta..."}
              isSpeaking={isSpeaking}
              activeWordIndex={activeWordIndex}
              compact
              className="w-full text-center"
            />

            {/* Controles de Repetir e Pular Áudio */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 text-xs text-[#9FB3C6]">
                <span className="w-2 h-2 rounded-full bg-[#20D5B5] animate-pulse" />
                <span className="font-bold text-[#EAF2F8]">
                  {PACIENTES[pacienteId]?.nome || "Paciente"}
                </span>
                <span>· {modalidadeAtiva}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleRepetirFala}
                  className="px-2.5 py-1 rounded-lg border border-[#27394B] bg-[#16222E] text-[11px] font-bold text-[#9FB3C6] hover:text-[#20D5B5] flex items-center gap-1 transition cursor-pointer"
                  title="Ouvir pergunta novamente"
                >
                  <RotateCcw className="w-3 h-3" /> Repetir
                </button>
                {isSpeaking && (
                  <button
                    type="button"
                    onClick={handlePularFala}
                    className="px-2.5 py-1 rounded-lg border border-[#27394B] bg-[#16222E] text-[11px] font-bold text-[#9FB3C6] hover:text-white flex items-center gap-1 transition cursor-pointer"
                    title="Pular áudio"
                  >
                    <SkipForward className="w-3 h-3" /> Pular
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Banner Informativo se estiver navegando em Modo Somente Leitura (Questão Anterior) */}
          {isReadOnly && (
            <div className="rounded-2xl border border-[#20D5B5]/40 bg-[#20D5B5]/10 px-3.5 py-2.5 flex items-center justify-between text-xs animate-in fade-in">
              <div className="flex items-center gap-2 text-[#20D5B5] font-bold">
                <Sparkles className="w-4 h-4" />
                <span>Visualizando resposta registrada (somente leitura)</span>
              </div>
              {stepIndex < maxStepAlcancado && (
                <button
                  type="button"
                  onClick={handleAvancarParaFrente}
                  className="px-3 py-1 rounded-xl bg-[#20D5B5] text-[#0E1722] font-black text-xs hover:bg-[#20D5B5]/90 transition cursor-pointer"
                >
                  Avançar
                </button>
              )}
            </div>
          )}

          {/* Card da Questão Plurall (5 alternativas, Dica 1º erro, Gabarito 2º erro, Botão Revisão com cores) */}
          {questaoAtual && (
            <PlurallQuestionCard
              questao={questaoAtual}
              numQuestao={stepIndex}
              totalQuestoes={totalQuestoes}
              selectedChoice={estadoAtual.selectedChoice}
              onSelectChoice={handleSelectChoice}
              tentativas={estadoAtual.tentativas}
              status={estadoAtual.status}
              onVerificar={handleVerificarResposta}
              onProxima={handleProximaQuestao}
              isReadOnly={isReadOnly}
              isLastQuestion={stepIndex === totalQuestoes}
            />
          )}
        </main>

        {/* Modal de Escolha Inicial de Atividade (O que você quer praticar hoje?) */}
        <PraticaSelectModal
          isOpen={modalPraticaAberto}
          onClose={() => {
            setModalPraticaAberto(false);
            if (!respondidasCount) {
              navigate("/");
            }
          }}
          onStartSession={handleIniciarSessaoPratica}
          questoesRevisaoCount={questoesRevisaoPendentes.length}
        />

        {/* Modal de Revisão Final da Sessão Concluída */}
        <RevisaoFinalModal
          isOpen={modalRevisaoFinalAberto}
          resumo={resumoFinal}
          onRefazerErradas={() => {
            const erradas = (resumoFinal?.questoes || []).filter(
              (q) => q.status === "amarela" || q.status === "vermelha"
            );
            handleIniciarSessaoPratica({
              mode: "revisao",
              categoria: categoriaAtiva,
              topicoNome: "Revisão de Erros"
            });
          }}
          onNovaPratica={() => {
            setModalRevisaoFinalAberto(false);
            setModalPraticaAberto(true);
          }}
          onVoltarHub={() => {
            setModalRevisaoFinalAberto(false);
            navigate("/");
          }}
        />
      </div>
    </div>
  );
}
