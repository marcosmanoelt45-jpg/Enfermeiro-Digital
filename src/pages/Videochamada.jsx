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
import { PACIENTES, CASOS_SIMULADOR, gerarCasoAleatorio } from "@/data/simuladorCasosData";
import { falar, pararFala } from "@/services/simuladorVozService";
import { clinicalGamificationService } from "@/services/clinicalGamificationService";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { clinicalHistoryService } from "@/services/clinicalHistoryService";
import { celebrate } from "@/lib/celebrate";
import { vibrate } from "@/lib/motion";

import PacienteVideoStage from "@/components/simulador/PacienteVideoStage";
import FalaLegendaBubble from "@/components/simulador/FalaLegendaBubble";
import PlurallTopBar from "@/components/simulador/PlurallTopBar";
import PlurallQuestionCard from "@/components/simulador/PlurallQuestionCard";
import { TOPICOS_PRATICA } from "@/data/simuladorTopicos";
import RevisaoFinalModal from "@/components/simulador/RevisaoFinalModal";
import CaseHistoryModal from "@/components/history/CaseHistoryModal";
import { History } from "lucide-react";


export default function Videochamada() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Controle de Visualização: 'selecao' (Aba de Pesquisa Exclusiva) ou 'sessao' (Atendimento Ativo)
  const [emSessao, setEmSessao] = useState(false);
  const [modalRevisaoFinalAberto, setModalRevisaoFinalAberto] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
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
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem("enfere_videochamada_som") !== "0";
    } catch {
      return true;
    }
  });
  // Lido dentro de executarFala: ligar ou desligar o som não reinicia a pergunta.
  const soundRef = useRef(soundEnabled);
  const [modoSessao, setModoSessao] = useState("normal");
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

  // Quantas questões cada tema tem nos dois pacientes (o tema "todos" soma tudo).
  const questoesPorTema = useMemo(() => {
    const contagem = {};
    let total = 0;
    for (const caso of Object.values(CASOS_SIMULADOR)) {
      for (const q of caso?.passos || []) {
        if (!q.categoriaPratica) continue;
        contagem[q.categoriaPratica] = (contagem[q.categoriaPratica] || 0) + 1;
        total += 1;
      }
    }
    return { ...contagem, todos: total };
  }, []);

  // Sugestões inteligentes de tópicos com busca preditiva
  const sugestoesTopicos = useMemo(() => {
    // Sem acento e sem casar pedaços curtos ("pa" dentro de "capacidade").
    const norm = (v) => String(v || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const term = norm(searchTerm);
    if (!term) return TOPICOS_PRATICA;
    return TOPICOS_PRATICA.filter(
      (t) =>
        norm(t.titulo).includes(term) ||
        norm(t.descricao).includes(term) ||
        (term.length >= 3 && t.tags.some((tag) => norm(tag).startsWith(term)))
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
        soundEnabled: soundRef.current,
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
    [pacienteId, emSessao]
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
  function handleIniciarSessaoPratica({ mode, categoria, revisaoOverride }) {
    pararFala();
    setModoSessao(mode);

    // Com tema escolhido, sorteia só entre pacientes que têm questões suficientes desse tema
    // (cada paciente cobre temas diferentes).
    const sortear = (ids) => ids[Math.floor(Math.random() * ids.length)];
    const elegiveis = ["marcus", "teresinha"].filter(
      (id) => (CASOS_SIMULADOR[id]?.passos || []).filter((q) => q.categoriaPratica === categoria).length >= 4
    );
    const temaEspecifico = categoria && categoria !== "todos" && mode !== "revisao";
    if (temaEspecifico && elegiveis.length === 0) {
      toast({ title: "Poucas questões deste tema", description: "Ainda não há questões suficientes; a sessão será mista." });
    }
    const novoPaciente = temaEspecifico && elegiveis.length ? sortear(elegiveis) : sortear(["marcus", "teresinha"]);
    setPacienteId(novoPaciente);

    let labelsModo = "Atividade Normal (7 a 9)";
    if (mode === "rapida") labelsModo = "Atividade Rápida (4 a 6)";
    if (mode === "revisao") labelsModo = "Revisão (Só Amarelas e Vermelhas)";
    setModalidadeAtiva(labelsModo);
    setCategoriaAtiva(categoria);

    // "Refazer só erradas" revisa as questões desta sessão, não a fila inteira do histórico.
    const revisaoQueue = revisaoOverride?.length
      ? revisaoOverride
      : clinicalHistoryService.getQuestoesRevisao(user?.id);
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
        vibrate(15);
        if (tentativasAtuais === 0) celebrate({ count: 45, y: 0.55 });
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
          // Acertou na 2ª tentativa (após dica amarela): continua contando só como amarela, não como acerto de primeira
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
          // Fora da revisão, a amarela vai para a fila ao salvar a sessão; na revisão, acertar resolve.
          if (questaoAtual && modoSessao === "revisao") {
            clinicalHistoryService.removerQuestoesRevisao([questaoAtual], user?.id);
          }
        }
      } else {
        // ERRO
        setClipeAtivo("erro");
        vibrate([30, 40, 30]);

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
      // Só fecha a sessão com todas respondidas: volta para a primeira pendente.
      const pendentes = Array.from({ length: totalQuestoes }, (_, i) => i + 1).filter((n) => !questaoStates[n]?.isFinalizada);
      if (pendentes.length > 0) {
        setStepIndex(pendentes[0]);
        toast({ title: `Faltam ${pendentes.length} questões`, description: "Responda todas para ver o resumo final." });
        return;
      }
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
    // Acerto de primeira vale 1; acerto na segunda tentativa vale meio.
    const estados = Object.values(questaoStates);
    const verdes = estados.filter((st) => st.status === "verde").length;
    const amarelasResolvidas = estados.filter((st) => st.status === "amarela" && st.isFinalizada).length;
    const taxaAproveitamento = Math.round(((verdes + 0.5 * amarelasResolvidas) / totalQuestoes) * 100);

    const listaQuestoesFinal = todasQuestoes.map((q, idx) => {
      const qNum = idx + 1;
      const st = questaoStates[qNum] || { status: "aberta", selectedChoice: null };
      return {
        ...q,
        numQuestao: qNum,
        status: st.isFinalizada ? st.status : "pulada",
        escolhaAluno: st.selectedChoice,
        alternativaEscolhidaTexto: st.selectedChoice !== null ? q.opcoes[st.selectedChoice] : null,
        gabaritoTexto: q.opcoes[q.correta]
      };
    });

    const dadosSessao = {
      pacienteId: paciente.id,
      pacienteNome: paciente.nome,
      modalidade: modalidadeAtiva,
      modo: modoSessao,
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

    if (taxaAproveitamento >= 70) celebrate({ count: 90, spread: 85, y: 0.3 });
    setModalRevisaoFinalAberto(true);
  }

  // Alternar som
  function handleToggleSound() {
    const next = !soundEnabled;
    soundRef.current = next;
    setSoundEnabled(next);
    try {
      localStorage.setItem("enfere_videochamada_som", next ? "1" : "0");
    } catch {
      // Sem armazenamento: a preferência vale só nesta visita.
    }
    if (!next) {
      pararFala();
      setIsSpeaking(false);
    }
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#27394B] bg-[#16222E] text-xs font-bold text-[#20D5B5] hover:bg-[#1F3045] transition cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Histórico</span>
                </button>
                <span className="text-xs font-mono font-bold text-[#20D5B5] bg-[#20D5B5]/10 border border-[#20D5B5]/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Simulador Clínico
                </span>
              </div>
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
                  className="w-full pl-11 pr-4 py-3 bg-[#131F2E] border border-[#27394B] rounded-2xl text-sm font-semibold text-white placeholder-[#9FB3C6]/60 focus:outline-none focus:border-[#20D5B5] focus:ring-1 focus:ring-[#20D5B5] transition shadow-inner"
                />
              </div>
            </div>

            {/* Seleção do Tópico */}
            <div className="py-3 space-y-2 max-h-[38vh] overflow-y-auto pr-1">
              <div className="text-xs font-mono font-bold text-[#9FB3C6] uppercase tracking-wider px-1 mb-2">
                Temas Clínicos Disponíveis
              </div>
              {sugestoesTopicos.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#27394B] p-4 text-center text-sm text-[#9FB3C6]" role="status">
                  <p>Nenhum tema para "{searchTerm.trim()}".</p>
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => setSearchTerm("")}>
                    Ver todos os temas
                  </Button>
                </div>
              )}
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
                        ? "bg-[#20D5B5]/15 border-[#20D5B5] shadow-sm"
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
                      <p className={`mt-1 text-[11px] font-bold ${(questoesPorTema[topico.id] || 0) >= 4 ? "text-[#20D5B5]" : "text-[#FFC247]"}`}>
                        {(questoesPorTema[topico.id] || 0) >= 4
                          ? `${questoesPorTema[topico.id]} questões`
                          : "Poucas questões · a sessão mistura temas"}
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
                disabled={questoesRevisaoPendentes.length === 0}
                className="p-3 rounded-2xl bg-[#131F2E] border border-[#1F3045] hover:border-[#FFC247] hover:bg-[#16222E] text-left transition flex items-center justify-between gap-2 cursor-pointer group disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[#1F3045] disabled:hover:bg-[#131F2E]"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-black text-white group-hover:text-[#FFC247]">
                    <RotateCcw className="w-3.5 h-3.5 text-[#FFC247]" />
                    <span>Revisão</span>
                  </div>
                  <div className="text-[11px] text-[#9FB3C6]">
                    {questoesRevisaoPendentes.length > 0
                      ? `${questoesRevisaoPendentes.length} pendentes`
                      : "Sem questões pendentes"}
                  </div>
                </div>
              </button>
            </div>
          </div>
          <CaseHistoryModal
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            defaultModuleFilter="videochamada"
            lockModuleFilter={true}
            title="Histórico de Atendimentos por Voz"
          />
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
            // Sair no meio descarta as respostas: pede confirmação se já houver alguma.
            if (respondidasCount > 0 && !window.confirm("Sair do atendimento? O progresso desta sessão será perdido.")) return;
            pararFala();
            setIsSpeaking(false);
            setEmSessao(false);
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

            {/* Botões Clicáveis e Funcionais para Navegar por Todas as Questões a Qualquer Hora */}
            <div className="flex items-center justify-between gap-2 px-1 py-1.5 border-y border-[#1F3045]/60 my-1 bg-[#131F2E]/40 rounded-xl">
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none flex-1">
                {todasQuestoes.map((_, qIdx) => {
                  const qNum = qIdx + 1;
                  const st = questaoStates[qNum] || { status: "aberta", isFinalizada: false };
                  const isCurrent = stepIndex === qNum;
                  let dotColor = "bg-[#1A293D] text-[#9FB3C6] border-[#27394B]";
                  if (st.status === "verde") dotColor = "bg-[#20D5B5] text-[#0E1722] border-[#20D5B5] font-black";
                  else if (st.status === "amarela" && st.isFinalizada) dotColor = "bg-[#FFC247] text-[#0E1722] border-[#FFC247] font-black";
                  else if (st.status === "amarela" && !st.isFinalizada) dotColor = "bg-[#FFC247]/20 text-[#FFC247] border-[#FFC247] font-bold";
                  else if (st.status === "vermelha") dotColor = "bg-[#F25F5C] text-white border-[#F25F5C] font-black";

                  return (
                    <button
                      key={qNum}
                      type="button"
                      onClick={() => {
                        if (qNum > maxStepAlcancado) return;
                        pararFala();
                        setStepIndex(qNum);
                      }}
                      disabled={qNum > maxStepAlcancado}
                      aria-disabled={qNum > maxStepAlcancado}
                      // Chip visual de 28 px com área de toque de 44 px (before:-inset-2).
                      className={`relative w-7 h-7 rounded-lg border text-xs font-mono flex items-center justify-center shrink-0 transition cursor-pointer before:absolute before:-inset-2 before:content-[''] disabled:cursor-not-allowed ${dotColor} ${
                        isCurrent ? "ring-2 ring-white scale-105 shadow-md" : "hover:border-white/50"
                      }`}
                      title={`Ir para Questão ${qNum}`}
                      aria-label={`Questão ${qNum}: ${
                        st.status === "verde" ? "acertou de primeira"
                          : st.status === "amarela" && st.isFinalizada ? "acertou com dica"
                          : st.status === "amarela" ? "com dica, em aberto"
                          : st.status === "vermelha" ? "errou"
                          : "não respondida"
                      }`}
                      aria-current={isCurrent ? "step" : undefined}
                    >
                      {qNum}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleRepetirFala}
                  className="w-10 h-10 rounded-xl border border-[#27394B] bg-[#16222E] text-[#9FB3C6] hover:text-[#20D5B5] flex items-center justify-center transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#20D5B5]"
                  title="Ouvir pergunta novamente"
                  aria-label="Ouvir pergunta de novo"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                {isSpeaking && (
                  <button
                    type="button"
                    onClick={handlePularFala}
                    className="w-10 h-10 rounded-xl border border-[#27394B] bg-[#16222E] text-[#9FB3C6] hover:text-white flex items-center justify-center transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#20D5B5]"
                    title="Pular áudio"
                    aria-label="Pular o áudio"
                  >
                    <SkipForward className="w-4 h-4" />
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

          {/* Card da Questão Plurall com Dica sob demanda e Bloqueio após resposta */}
          {questaoAtual && (
            <PlurallQuestionCard
              key={`${startTime}-${stepIndex}`}
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
              hideStem={!isReadOnly}
              isLastQuestion={stepIndex === totalQuestoes}
              hintVisible={Boolean(questaoStates[stepIndex]?.hintVisible)}
              onToggleHint={() => {
                setQuestaoStates((prev) => ({
                  ...prev,
                  [stepIndex]: {
                    ...prev[stepIndex],
                    hintVisible: !prev[stepIndex]?.hintVisible
                  }
                }));
              }}
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
              revisaoOverride: (resumoFinal?.questoes || []).filter(
                (q) => q.status === "amarela" || q.status === "vermelha"
              )
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
        <CaseHistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          defaultModuleFilter="videochamada"
          lockModuleFilter={true}
          title="Histórico de Atendimentos por Voz"
        />
      </div>
    </div>
  );
}
