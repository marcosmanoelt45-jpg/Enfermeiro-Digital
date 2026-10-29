import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  RotateCcw,
  SkipForward,
  Sparkles,
  ArrowLeft,
  Search,
  Zap,
  BookOpen,
  CheckCircle2
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { PACIENTES, gerarCasoAleatorio } from "@/data/simuladorCasosData";
import { falar, pararFala } from "@/services/simuladorVozService";
import { clinicalGamificationService } from "@/services/clinicalGamificationService";
import { clinicalHistoryService } from "@/services/clinicalHistoryService";

import PacienteVideoStage from "@/components/simulador/PacienteVideoStage";
import FalaLegendaBubble from "@/components/simulador/FalaLegendaBubble";
import PlurallTopBar from "@/components/simulador/PlurallTopBar";
import PlurallQuestionCard from "@/components/simulador/PlurallQuestionCard";
import RevisaoFinalModal from "@/components/simulador/RevisaoFinalModal";

export const TOPICOS_PRATICA = [
  {
    id: "calculo",
    titulo: "Cálculo de Medicamentos",
    descricao: "Regras de três, gotejamento (macrogotas/microgotas) e vazão em BIC",
    tags: ["cálc", "calculo", "medicamento", "dose", "gotejamento", "bic", "solucao", "soro"],
    badge: "Farmacologia"
  },
  {
    id: "curativo",
    titulo: "Curativos e Lesões por Pressão",
    descricao: "Estadiamento NPUAP, técnica asséptica, coberturas e desbridamento",
    tags: ["curat", "curativo", "ferida", "pressao", "npuap", "lesao", "pele", "estagio", "braden"],
    badge: "Cirúrgica"
  },
  {
    id: "acesso_venoso",
    titulo: "Punção Venosa e Flebite",
    descricao: "Terapia infusional, escalas da INS, técnica push-pause e complicações",
    tags: ["punc", "puncao", "venosa", "flebite", "acesso", "cateter", "ins", "veia", "infiltracao"],
    badge: "Terapia EV"
  },
  {
    id: "farmaco",
    titulo: "Farmacologia Clínica e Diluições",
    descricao: "Reconstituição, estabilidade, vias de administração e segurança do paciente",
    tags: ["farm", "farmaco", "diluicao", "antibiotico", "ampola", "reconstituicao"],
    badge: "Medicamentos"
  },
  {
    id: "sinais_vitais",
    titulo: "Sinais Vitais e Semiologia",
    descricao: "Parâmetros hemodinâmicos, saturação, pulsos periféricos e perfusão",
    tags: ["sin", "sinais", "vitais", "pa", "pressao", "temperatura", "spo2", "pulso"],
    badge: "Semiologia"
  },
  {
    id: "todos",
    titulo: "Geral (Todos os Temas Clínicos)",
    descricao: "Simulação ampla integrando casos cirúrgicos e de clínica médica",
    tags: ["geral", "todos", "completo", "atendimento", "misto"],
    badge: "Intensivo"
  }
];

export default function Videochamada() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Controle de Visualização: 'selecao' (Aba de Pesquisa Exclusiva) ou 'sessao' (Atendimento Ativo)
  const [emSessao, setEmSessao] = useState(false);
  const [modalRevisaoFinalAberto, setModalRevisaoFinalAberto] = useState(false);
  const [resumoFinal, setResumoFinal] = useState(null);

  // Estados da Aba de Pesquisa e Seleção de Prática
  const [searchTerm, setSearchTerm] = useState("");
  const [topicoSelecionado, setTopicoSelecionado] = useState(null);

  // Paciente e Caso Clínico
  const [pacienteId, setPacienteId] = useState("marcus");
  const [caso, setCaso] = useState(() => gerarCasoAleatorio("marcus", { mode: "normal", categoria: "todos" }));
  const [modalidadeAtiva, setModalidadeAtiva] = useState("Atividade Normal (7 a 9)");
  const [categoriaAtiva, setCategoriaAtiva] = useState("todos");

  // Navegação de Passos (1 até totalQuestoes)
  const [stepIndex, setStepIndex] = useState(1);
  const [maxStepAlcancado, setMaxStepAlcancado] = useState(1);

  // Estado Individual por Questão (Plurall Engine)
  // Formato: { [stepIndex]: { selectedChoice, tentativas, status, isFinalizada, opcoesFalhadas } }
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

  // Questões válidas do caso
  const todasQuestoes = useMemo(() => {
    return caso.passos.filter((p) => p.tipo !== "fala" && p.tipo !== "fala_paciente");
  }, [caso]);

  const totalQuestoes = todasQuestoes.length || 7;
  const questaoAtual = todasQuestoes[stepIndex - 1] || todasQuestoes[0];

  // Questões pendentes de revisão do usuário logado
  const questoesRevisaoPendentes = useMemo(() => {
    return clinicalHistoryService.getQuestoesRevisao(user?.id);
  }, [user?.id, emSessao]);

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
    isFinalizada: false,
    opcoesFalhadas: []
  };

  const isReadOnly = stepIndex < maxStepAlcancado && estadoAtual.isFinalizada;

  // Sugestões inteligentes de tópicos com busca preditiva
  const sugestoesTopicos = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return TOPICOS_PRATICA;
    return TOPICOS_PRATICA.filter(
      (t) =>
        t.titulo.toLowerCase().includes(term) ||
        t.descricao.toLowerCase().includes(term) ||
        t.tags.some((tag) => tag.includes(term) || term.includes(tag))
    );
  }, [searchTerm]);

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
      if (!texto || !emSessao) return;
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
    [pacienteId, soundEnabled, emSessao]
  );

  // Disparar fala ao trocar de questão SOMENTE se estiver em sessão ativa
  useEffect(() => {
    if (emSessao && questaoAtual?.pergunta) {
      setClipeAtivo("fala");
      executarFala(questaoAtual.pergunta, questaoAtual.audioPath);
    }
    return () => {
      pararFala();
    };
  }, [stepIndex, emSessao, questaoAtual, executarFala]);

  // Se vier modo revisão pela URL diretamente
  useEffect(() => {
    if (searchParams.get("modo") === "revisao") {
      handleIniciarSessaoPratica({ mode: "revisao", categoria: "todos", topicoNome: "Revisão Geral" });
    }
  }, [searchParams]);

  // Iniciar Atendimento com parâmetros selecionados
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

    const revisaoQueue = clinicalHistoryService.getQuestoesRevisao(user?.id);
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
    setEmSessao(true);
    setModalRevisaoFinalAberto(false);
  }

  // Selecionar alternativa na questão atual (reativo e imune a condições de corrida)
  function handleSelectChoice(choiceIdx) {
    if (isReadOnly) return;

    setQuestaoStates((prev) => {
      const cur = prev[stepIndex] || {
        selectedChoice: null,
        tentativas: 0,
        status: "aberta",
        isFinalizada: false,
        opcoesFalhadas: []
      };

      if (cur.isFinalizada) return prev;
      if ((cur.opcoesFalhadas || []).includes(choiceIdx)) return prev;

      return {
        ...prev,
        [stepIndex]: {
          ...cur,
          selectedChoice: choiceIdx
        }
      };
    });
  }

  // Verificar Resposta com Sistema de 2 Níveis de Erros (Blindado contra travas de 2ª tentativa)
  function handleVerificarResposta(choiceOverride = null) {
    const estado = questaoStates[stepIndex] || estadoAtual;
    const escolhaAluno = (choiceOverride !== null && choiceOverride !== undefined)
      ? choiceOverride
      : (estado.selectedChoice !== null && estado.selectedChoice !== undefined ? estado.selectedChoice : estadoAtual.selectedChoice);

    if (escolhaAluno === null || escolhaAluno === undefined) return;
    if (estado.isFinalizada) return;

    try {
      pararFala();
      const gabarito = Number(questaoAtual?.correta ?? 0);
      const isCorreta = Number(escolhaAluno) === gabarito;
      const tentativasAtuais = estado.tentativas || 0;

      if (isCorreta) {
        // ACERTO
        setClipeAtivo("acerto");
        clinicalGamificationService.registrarAcertoQuestao(user?.id);

        if (tentativasAtuais === 0) {
          // Acertou na 1ª tentativa: Verde
          setAcertos((prev) => prev + 1);
          setQuestaoStates((prev) => ({
            ...prev,
            [stepIndex]: {
              ...prev[stepIndex],
              status: "verde",
              tentativas: 1,
              isFinalizada: true,
              selectedChoice: escolhaAluno
            }
          }));
          if (questaoAtual) {
            clinicalHistoryService.removerQuestoesRevisao([questaoAtual], user?.id);
          }
        } else {
          // Acertou na 2ª tentativa (após dica amarela): Finaliza como amarela resolvida
          setAcertos((prev) => prev + 1);
          setQuestaoStates((prev) => ({
            ...prev,
            [stepIndex]: {
              ...prev[stepIndex],
              status: "amarela",
              tentativas: 2,
              isFinalizada: true,
              selectedChoice: escolhaAluno
            }
          }));
          if (questaoAtual) {
            clinicalHistoryService.removerQuestoesRevisao([questaoAtual], user?.id);
          }
        }
      } else {
        // ERRO
        setClipeAtivo("erro");

        if (tentativasAtuais === 0) {
          // 1º ERRO: Dica ativada, questão amarela aberta, desmarca opção para o aluno escolher outra
          setAmarelas((prev) => prev + 1);
          setQuestaoStates((prev) => ({
            ...prev,
            [stepIndex]: {
              ...prev[stepIndex],
              status: "amarela",
              tentativas: 1,
              selectedChoice: null, // Limpa para obrigar nova escolha sem queimar a 2ª tentativa
              isFinalizada: false, // permite 2ª tentativa
              opcoesFalhadas: [...(prev[stepIndex]?.opcoesFalhadas || []), escolhaAluno]
            }
          }));
        } else {
          // 2º ERRO: Revela resposta, explica e marca para Revisão (Vermelha)
          setVermelhas((prev) => prev + 1);
          setAmarelas((prev) => Math.max(0, prev - 1));
          clinicalGamificationService.registrarErroVermelhoQuestao(user?.id); // ZERA acertos seguidos exclusivamente no erro fatal

          setQuestaoStates((prev) => ({
            ...prev,
            [stepIndex]: {
              ...prev[stepIndex],
              status: "vermelha",
              tentativas: 2,
              selectedChoice: escolhaAluno,
              isFinalizada: true,
              opcoesFalhadas: [...(prev[stepIndex]?.opcoesFalhadas || []), escolhaAluno]
            }
          }));
        }
      }
    } catch (verifErr) {
      console.error("[Videochamada] Erro ao verificar resposta:", verifErr);
    }
  }

  // Avançar para próxima questão ou finalizar sessão
  function handleProximaQuestao() {
    pararFala();

    if (stepIndex >= totalQuestoes) {
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

    // Salva no histórico oficial vinculado ao usuário
    try {
      clinicalHistoryService.saveVideochamadaSession(dadosSessao, user?.id);
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

  // Alternar som
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

  // Repetir fala do paciente
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

  /* =========================================================================
     CENÁRIO 1: ABA EXCLUSIVA DE ESCOLHA DE PRÁTICA (SEM PACIENTE OU QUESTÃO NO FUNDO)
  ========================================================================= */
  if (!emSessao) {
    return (
      <div className="w-full min-h-screen bg-[#0B131D] text-[#EAF2F8] font-['Nunito',sans-serif] flex justify-center p-4 selection:bg-[#20D5B5]/30">
        <div className="w-full max-w-xl flex flex-col justify-between py-2 sm:py-4 animate-in fade-in duration-200">
          <div>
            {/* Header Limpo */}
            <header className="flex items-center justify-between pb-4 border-b border-[#1F3045]">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[#9FB3C6] hover:text-white hover:bg-[#16222E] transition cursor-pointer"
                aria-label="Voltar para Início"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs font-bold">Voltar ao Início</span>
              </button>
              <span className="text-xs font-mono font-bold text-[#20D5B5] bg-[#20D5B5]/10 border border-[#20D5B5]/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Simulador Clínico
              </span>
            </header>

            {/* Título Principal */}
            <div className="pt-6 pb-4">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-8 h-8 rounded-xl bg-[#20D5B5]/15 border border-[#20D5B5]/30 flex items-center justify-center text-[#20D5B5]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  O que você quer praticar hoje?
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-[#9FB3C6]">
                Escolha o tema e a intensidade da sua sessão de estudos clínicos
              </p>
            </div>

            {/* Campo de Busca Preditiva (Autocomplete) */}
            <div className="py-2">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9FB3C6]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (topicoSelecionado && e.target.value !== topicoSelecionado.titulo) {
                      setTopicoSelecionado(null);
                    }
                  }}
                  placeholder="Digite o tema (ex: Cálc, Curativo, Punção...)"
                  className="w-full pl-11 pr-4 py-3 bg-[#131F2E] border border-[#27394B] rounded-2xl text-sm font-semibold text-white placeholder-[#9FB3C6]/60 focus:outline-hidden focus:border-[#20D5B5] focus:ring-1 focus:ring-[#20D5B5] transition shadow-inner"
                  autoFocus
                />
              </div>
            </div>

            {/* Seleção do Tópico */}
            <div className="py-3 space-y-2 max-h-[38vh] overflow-y-auto pr-1">
              <div className="text-xs font-mono font-bold text-[#9FB3C6] uppercase tracking-wider px-1 mb-2">
                Temas Clínicos Disponíveis
              </div>
              {sugestoesTopicos.map((topico) => {
                const isSelected = topicoSelecionado?.id === topico.id;
                return (
                  <button
                    key={topico.id}
                    type="button"
                    onClick={() => {
                      setTopicoSelecionado(topico);
                      setSearchTerm(topico.titulo);
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-[#20D5B5]/15 border-[#20D5B5] shadow-xs"
                        : "bg-[#131F2E] border-[#1F3045] hover:border-[#20D5B5]/50 hover:bg-[#16222E]"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs sm:text-sm font-black text-white truncate">
                          {topico.titulo}
                        </span>
                        <span className="text-[10px] font-bold text-[#20D5B5] bg-[#20D5B5]/10 px-2 py-0.5 rounded-md border border-[#20D5B5]/20">
                          {topico.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#9FB3C6] line-clamp-1">
                        {topico.descricao}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-[#20D5B5] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seleção da Intensidade e Ação de Início */}
          <div className="pt-4 border-t border-[#1F3045] space-y-3">
            <div className="text-xs font-mono font-bold text-[#9FB3C6] uppercase tracking-wider px-1">
              Escolha a Intensidade
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() =>
                  handleIniciarSessaoPratica({
                    mode: "rapida",
                    categoria: topicoSelecionado?.id || "todos",
                    topicoNome: topicoSelecionado?.titulo || "Geral"
                  })
                }
                className="p-3 rounded-2xl bg-[#131F2E] border border-[#1F3045] hover:border-[#20D5B5] hover:bg-[#16222E] text-left transition flex items-center justify-between gap-2 cursor-pointer group"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-black text-white group-hover:text-[#20D5B5]">
                    <Zap className="w-3.5 h-3.5 text-[#20D5B5]" />
                    <span>Rápida</span>
                  </div>
                  <div className="text-[11px] text-[#9FB3C6]">4 a 6 questões</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleIniciarSessaoPratica({
                    mode: "normal",
                    categoria: topicoSelecionado?.id || "todos",
                    topicoNome: topicoSelecionado?.titulo || "Geral"
                  })
                }
                className="p-3 rounded-2xl bg-[#131F2E] border border-[#1F3045] hover:border-[#20D5B5] hover:bg-[#16222E] text-left transition flex items-center justify-between gap-2 cursor-pointer group"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-black text-white group-hover:text-[#20D5B5]">
                    <BookOpen className="w-3.5 h-3.5 text-[#20D5B5]" />
                    <span>Normal</span>
                  </div>
                  <div className="text-[11px] text-[#9FB3C6]">7 a 9 questões</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleIniciarSessaoPratica({
                    mode: "revisao",
                    categoria: topicoSelecionado?.id || "todos",
                    topicoNome: topicoSelecionado?.titulo || "Revisão de Erros"
                  })
                }
                className="p-3 rounded-2xl bg-[#131F2E] border border-[#1F3045] hover:border-[#FFC247] hover:bg-[#16222E] text-left transition flex items-center justify-between gap-2 cursor-pointer group"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-black text-white group-hover:text-[#FFC247]">
                    <RotateCcw className="w-3.5 h-3.5 text-[#FFC247]" />
                    <span>Revisão</span>
                  </div>
                  <div className="text-[11px] text-[#9FB3C6]">
                    {questoesRevisaoPendentes.length > 0
                      ? `${questoesRevisaoPendentes.length} pendentes`
                      : "Só erradas"}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     CENÁRIO 2: ATENDIMENTO CLÍNICO ATIVO (SIMULADOR PLURALL)
  ========================================================================= */
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
          onClose={() => {
            setEmSessao(false);
            pararFala();
          }}
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
              opcoesIncorretasTentadas={estadoAtual.opcoesFalhadas || []}
              tentativas={estadoAtual.tentativas}
              status={estadoAtual.status}
              isFinalizada={estadoAtual.isFinalizada}
              onVerificar={handleVerificarResposta}
              onProxima={handleProximaQuestao}
              isReadOnly={isReadOnly}
              isLastQuestion={stepIndex === totalQuestoes}
            />
          )}
        </main>

        {/* Modal de Revisão Final da Sessão Concluída */}
        <RevisaoFinalModal
          isOpen={modalRevisaoFinalAberto}
          resumo={resumoFinal}
          onRefazerErradas={() => {
            setModalRevisaoFinalAberto(false);
            handleIniciarSessaoPratica({
              mode: "revisao",
              categoria: categoriaAtiva,
              topicoNome: "Revisão de Erros"
            });
          }}
          onNovaPratica={() => {
            setModalRevisaoFinalAberto(false);
            setEmSessao(false);
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
