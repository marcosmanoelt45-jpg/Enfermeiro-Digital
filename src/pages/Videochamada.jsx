import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Volume2,
  VolumeX,
  RotateCcw,
  SkipForward,
  Mic,
  FileText,
  Volume1,
  Check
} from "lucide-react";
import { PACIENTES, gerarCasoAleatorio } from "@/data/simuladorCasosData";
import {
  falar,
  pararFala,
  iniciarReconhecimentoVoz,
  validarRespostaFalada
} from "@/services/simuladorVozService";
import { audioTranscriptionService } from "@/services/audioTranscriptionService";
import { validateCalculoAnswer } from "@/services/simuladorFormulaService";
import PacienteVideoStage from "@/components/simulador/PacienteVideoStage";
import SimuladorTopBar from "@/components/simulador/SimuladorTopBar";
import FalaLegendaBubble from "@/components/simulador/FalaLegendaBubble";
import TecladoCalculo from "@/components/simulador/TecladoCalculo";
import FeedbackBottomSheet from "@/components/simulador/FeedbackBottomSheet";
import GotiAnimated from "@/components/mascot/GotiAnimated";
import { clinicalGamificationService } from "@/services/clinicalGamificationService";

export default function Videochamada() {
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const initialTelaParam = searchParams.get("tela") || "intro";

  // Estados do Simulador
  const [pacienteId, setPacienteId] = useState("marcus");
  const [tela, setTela] = useState(initialTelaParam); // 'intro' | 'fala' | 'questao' | 'resumo'

  // Caso dinâmico com 7 questões por atendimento e rotação sem repetição
  const [caso, setCaso] = useState(() => {
    const shouldShuffle = searchParams.get("noshuffle") !== "1";
    return gerarCasoAleatorio("marcus", { shuffleQuestions: shouldShuffle, minQuestions: 7 });
  });

  const [stepIndex, setStepIndex] = useState(() => {
    if (searchParams.get("tipo") === "voz") {
      const idx = caso.passos.findIndex((p) => p.tipo === "resposta_falada");
      if (idx >= 0) return idx;
    }
    const paramStep = searchParams.get("step");
    return paramStep !== null ? Number(paramStep) : 0;
  });
  const [vidas, setVidas] = useState(() => {
    const paramVidas = searchParams.get("vidas");
    return paramVidas !== null ? Number(paramVidas) : 3;
  });
  const [xp, setXp] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState([]);
  const [startTime, setStartTime] = useState(0);
  const [tempoDecorrido, setTempoDecorrido] = useState(0);

  // Áudio e Fala
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const [falaConcluida, setFalaConcluida] = useState(false);

  // Clipes do Vídeo do Paciente
  const [clipeAtivo, setClipeAtivo] = useState("fala"); // 'fala' | 'acerto' | 'erro'

  // Respostas do Aluno
  const [selectedEscolha, setSelectedEscolha] = useState(null); // number | null
  const [selectedMultipla, setSelectedMultipla] = useState([]); // number[]
  const [valorCalculo, setValorCalculo] = useState(""); // string
  const [textoVoz, setTextoVoz] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [micStatusLabel, setMicStatusLabel] = useState("Toque e fale a sua resposta");
  const activeRecognizerRef = useRef(null);

  // Feedback Bottom Sheet
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackIsCorrect, setFeedbackIsCorrect] = useState(true);
  const [feedbackRespostaCerta, setFeedbackRespostaCerta] = useState("");
  const [feedbackExplicacao, setFeedbackExplicacao] = useState("");

  // Modais Auxiliares
  const [modalDigitarAberto, setModalDigitarAberto] = useState(false);
  const [inputDigitarManual, setInputDigitarManual] = useState("");
  const [modalOpcoesAberto, setModalOpcoesAberto] = useState(false);

  const paciente = PACIENTES[pacienteId] || PACIENTES.marcus;
  const passoAtual = caso.passos[stepIndex] || caso.passos[0];
  const totalQuestoes = useMemo(
    () => caso.passos.filter((p) => p.tipo !== "fala_paciente").length || 1,
    [caso]
  );

  function handleSelectPaciente(novoId) {
    pararFala();
    setPacienteId(novoId);
    setCaso(gerarCasoAleatorio(novoId, { shuffleQuestions: true, minQuestions: 7 }));
    setIsSpeaking(false);
    setFalaConcluida(false);
    resetRespostasPasso();
  }

  // Limpeza de timers e fala ao desmontar
  useEffect(() => {
    return () => {
      pararFala();
      if (activeRecognizerRef.current) {
        activeRecognizerRef.current.stop();
      }
    };
  }, []);

  // Iniciar fala do paciente quando a tela ou passo mudar
  const executarFala = useCallback((texto, customAudioFile) => {
    setActiveWordIndex(-1);
    setFalaConcluida(false);

    falar(texto, pacienteId, {
      soundEnabled,
      customAudioFile,
      onStart: () => {
        setIsSpeaking(true);
      },
      onWordIndex: (wIndex) => {
        setActiveWordIndex(wIndex);
      },
      onEnd: () => {
        setIsSpeaking(false);
        setFalaConcluida(true);
      }
    });
  }, [pacienteId, soundEnabled]);

  // Abertura do Atendimento (Gesto que destrava áudio no navegador)
  function handleIniciarAtendimento() {
    const novoCaso = gerarCasoAleatorio(pacienteId, { shuffleQuestions: true, minQuestions: 7 });
    setCaso(novoCaso);
    setTela("fala");
    setStepIndex(0);
    setVidas(3);
    setXp(0);
    setAcertos(0);
    setErros([]);
    setStartTime(Date.now());
    setClipeAtivo("fala");

    // Executa a fala de abertura do paciente com o áudio gravado específico
    const aberturaTexto = novoCaso.passos[0].texto;
    const aberturaAudio = novoCaso.passos[0].audioPath;
    executarFala(aberturaTexto, aberturaAudio);
  }

  // Repetir a fala atual
  function handleRepetirFala() {
    const texto = tela === "fala" ? caso.passos[0].texto : passoAtual.pergunta;
    const audio = tela === "fala" ? caso.passos[0].audioPath : passoAtual.audioPath;
    executarFala(texto, audio);
  }

  // Pular a fala atual
  function handlePularFala() {
    pararFala();
    setIsSpeaking(false);
    setActiveWordIndex(999);
    setFalaConcluida(true);
  }

  // Avançar da tela de fala inicial para a primeira questão
  function handleContinuarAposFala() {
    pararFala();
    setStepIndex(1);
    setTela("questao");
    resetRespostasPasso();

    // Inicia a fala da pergunta da questão 1 com áudio específico
    const proximoPasso = caso.passos[1];
    if (proximoPasso?.pergunta) {
      executarFala(proximoPasso.pergunta, proximoPasso.audioPath);
    }
  }

  function resetRespostasPasso() {
    setSelectedEscolha(null);
    setSelectedMultipla([]);
    setValorCalculo("");
    setTextoVoz("");
    setMicStatusLabel("Toque e fale a sua resposta");
    setClipeAtivo("fala");
    if (activeRecognizerRef.current) {
      activeRecognizerRef.current.stop();
    }
    setIsRecording(false);
  }

  // Manipulador de cliques no Teclado Virtual de Cálculo
  function handleKeypadPress(key) {
    if (key === "BACKSPACE") {
      setValorCalculo((prev) => prev.slice(0, -1));
    } else if (key === ",") {
      setValorCalculo((prev) => {
        if (!prev) return "0,";
        if (prev.includes(",")) return prev;
        return prev + ",";
      });
    } else {
      setValorCalculo((prev) => {
        if (prev.length >= 7) return prev;
        return prev + key;
      });
    }
  }

  // Gravação de voz Dual-Engine (Web Speech API em tempo real + MediaRecorder com Fallback IA)
  async function handleToggleGravacaoVoz() {
    if (isRecording) {
      setIsRecording(false);
      setMicStatusLabel("Processando sua fala...");

      if (activeRecognizerRef.current) {
        try {
          const res = await activeRecognizerRef.current.stop();
          activeRecognizerRef.current = null;

          let finalText = (res?.text || textoVoz || "").trim();

          // Fallback: Se a Web Speech API não retornou texto (bloqueio do browser ou sem internet), mas gravamos o áudio real:
          if (!finalText && res?.audioBlob && res.audioBlob.size > 1000) {
            setMicStatusLabel("Transcrevendo fala com IA...");
            try {
              const aiRes = await audioTranscriptionService.transcribe(res.audioBlob, (status) => {
                if (status?.message) setMicStatusLabel(status.message);
              });
              if (aiRes?.text) {
                finalText = aiRes.text.trim();
              }
            } catch (aiErr) {
              console.warn("Fallback de transcrição por IA falhou:", aiErr);
            }
          }

          if (finalText) {
            setTextoVoz(finalText);
            setMicStatusLabel("Fala gravada com sucesso");
          } else {
            setMicStatusLabel("Nenhuma fala detectada. Toque para tentar de novo ou prefira digitar.");
          }
        } catch (stopErr) {
          console.error("Erro ao finalizar captura de voz:", stopErr);
          setMicStatusLabel("Erro ao processar áudio. Tente novamente.");
        }
      }
      return;
    }

    pararFala();
    setTextoVoz("");
    setIsRecording(true);
    setMicStatusLabel("Conectando microfone...");

    try {
      const recognizer = await iniciarReconhecimentoVoz({
        onInterim: (interim) => {
          setTextoVoz(interim);
          setMicStatusLabel("Ouvindo você...");
        },
        onFinal: (final) => {
          setTextoVoz(final);
          setMicStatusLabel("Fala capturada");
        },
        onError: (erro) => {
          setIsRecording(false);
          setMicStatusLabel(typeof erro === "string" ? erro : "Microfone indisponível");
          console.warn("Erro no microfone:", erro);
        },
        onEnd: () => {
          // Mantém controle via stop
        }
      });

      activeRecognizerRef.current = recognizer;
      setMicStatusLabel("Gravando... Fale sua resposta");
    } catch (startErr) {
      setIsRecording(false);
      activeRecognizerRef.current = null;
      setMicStatusLabel("Microfone bloqueado. Permita o acesso ou clique em 'Prefiro digitar'.");
      console.error("Erro ao inicializar microfone:", startErr);
    }
  }

  // Verifica se o botão "Verificar" da questão deve estar habilitado
  const canVerificar = () => {
    if (!passoAtual) return false;
    if (passoAtual.tipo === "multipla_escolha") {
      return selectedEscolha !== null;
    }
    if (passoAtual.tipo === "multipla_selecao") {
      return selectedMultipla.length >= 2;
    }
    if (passoAtual.tipo === "calculo") {
      return valorCalculo.trim().length > 0;
    }
    if (passoAtual.tipo === "resposta_falada") {
      return textoVoz.trim().length > 0;
    }
    return false;
  };

  // Avaliação determinística da resposta
  function handleVerificarResposta() {
    pararFala();
    let isCorrect = false;
    let gabarito = "";

    if (passoAtual.tipo === "multipla_escolha") {
      isCorrect = selectedEscolha === passoAtual.correta;
      gabarito = passoAtual.opcoes[passoAtual.correta];
    } else if (passoAtual.tipo === "multipla_selecao") {
      const a = [...selectedMultipla].sort().join();
      const b = [...passoAtual.corretas].sort().join();
      isCorrect = a === b;
      gabarito = passoAtual.corretas.map((k) => passoAtual.opcoes[k]).join(" · ");
    } else if (passoAtual.tipo === "calculo") {
      const validation = validateCalculoAnswer({
        alunoResposta: valorCalculo,
        formula: passoAtual.formula,
        variaveis: passoAtual.variaveis,
        valorEsperado: passoAtual.respostaEsperada,
        tolerancia: passoAtual.tolerancia || 0.01,
        unidade: passoAtual.unidade
      });
      isCorrect = validation.correta;
      gabarito = `${passoAtual.respostaEsperada} ${passoAtual.unidade}`;
    } else if (passoAtual.tipo === "resposta_falada") {
      isCorrect = validarRespostaFalada(textoVoz, passoAtual.aceitas);
      gabarito = passoAtual.respostaCertaTexto || "Conduta adequada";
    }

    if (isCorrect) {
      setXp((prev) => prev + 25);
      setAcertos((prev) => prev + 1);
      setClipeAtivo("acerto");
    } else {
      setVidas((prev) => Math.max(0, prev - 1));
      setErros((prev) => [...prev, stepIndex]);
      setClipeAtivo("erro");
    }

    setFeedbackIsCorrect(isCorrect);
    setFeedbackRespostaCerta(gabarito);
    setFeedbackExplicacao(passoAtual.explicacao || "");
    setFeedbackOpen(true);
  }

  // Avançar após feedback
  function handleContinuarAposFeedback() {
    setFeedbackOpen(false);

    // Se as vidas acabarem ou se for o último passo
    if (vidas <= 0 || stepIndex >= caso.passos.length - 1) {
      const tempoTotal = Math.round((Date.now() - startTime) / 1000);
      setTempoDecorrido(tempoTotal);

      // Registrar histórico para reconhecimento pela IA do Goti e estatísticas
      try {
        const totalQuestoes = caso.passos.filter((p) => p.tipo !== "fala_paciente").length || 1;
        const precisaoCalculada = Math.round((acertos / totalQuestoes) * 100);
        const novoRegistro = {
          id: Date.now(),
          pacienteId: paciente.id,
          pacienteNome: paciente.nome,
          acertos,
          totalQuestoes,
          precisao: precisaoCalculada,
          vidasRestantes: vidas,
          semVidas: vidas <= 0,
          xpGanho: xp,
          tempoSegundos: tempoTotal,
          data: new Date().toLocaleDateString("pt-BR"),
          hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        };

        const rawHistorico = localStorage.getItem("enfermeiro_historico_videochamadas");
        const historicoExistente = rawHistorico ? JSON.parse(rawHistorico) : [];
        const atualizado = [novoRegistro, ...historicoExistente].slice(0, 10);
        localStorage.setItem("enfermeiro_historico_videochamadas", JSON.stringify(atualizado));

        if (xp > 0) {
          clinicalGamificationService.recordActivity("case_solved", xp);
        }
      } catch (err) {
        console.warn("[Videochamada] Erro ao registrar histórico de atendimento:", err);
      }

      setTela("resumo");
      return;
    }

    const nextIndex = stepIndex + 1;
    setStepIndex(nextIndex);
    resetRespostasPasso();

    const proximoPasso = caso.passos[nextIndex];
    if (proximoPasso?.pergunta) {
      executarFala(proximoPasso.pergunta, proximoPasso.audioPath);
    }
  }

  // Alternar som ligado/desligado
  function handleToggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (!next) {
      pararFala();
      setIsSpeaking(false);
    }
  }


  return (
    <div className="w-full min-h-screen bg-[#0E1720] text-[#EAF2F8] font-['Nunito',sans-serif] flex justify-center selection:bg-[#2AD3C1]/30">
      <div className="w-full max-w-[480px] sm:max-w-[500px] min-h-screen flex flex-col relative overflow-x-hidden transition-all duration-300">

        {/* =========================================================================
            TELA 2: ABERTURA DO CASO (02-intro.png)
        ========================================================================= */}
        {tela === "intro" && (
          <div className="flex-1 flex flex-col justify-center p-3 sm:p-4 my-auto animate-in fade-in duration-200">
            {/* Topo com Botão Fechar X e Som */}
            <div>
              <div className="flex items-center justify-between pt-1 pb-2">
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[#9FB3C6] hover:text-[#EAF2F8] hover:bg-[#16222E] transition-colors cursor-pointer"
                  aria-label="Voltar para Início"
                >
                  <X className="w-7 h-7 stroke-[2.5]" />
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleSound}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[#9FB3C6] hover:text-[#2AD3C1] bg-[#16222E] border border-[#27394B] cursor-pointer"
                    title={soundEnabled ? "Som ativado" : "Som desativado"}
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4 text-[#2AD3C1]" /> : <VolumeX className="w-4 h-4 text-[#FF6B6B]" />}
                  </button>
                </div>
              </div>

              {/* Palco de Vídeo do Paciente com Dados Clínicos */}
              <div className="flex flex-col gap-2.5 mb-2.5">
                <PacienteVideoStage
                  pacienteId={pacienteId}
                  clipeAtivo="fala"
                  isSpeaking={false}
                  className="w-full h-[185px] xs:h-[200px] sm:h-[220px] rounded-2xl shadow-md border-2 border-[#27394B]"
                />

                {/* Ficha Clínica do Paciente */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#16222E] border-2 border-[#27394B] border-b-[4px] border-b-[#0A1118]">
                  <div>
                    <b className="text-base sm:text-lg font-black text-[#EAF2F8] block">
                      {paciente.nome}
                    </b>
                    <div className="text-xs font-bold text-[#9FB3C6]">
                      {paciente.idade} · {paciente.leito}
                    </div>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-[#3AA7E8]/15 text-[#6CC3F5] text-xs font-black">
                    {paciente.sinaisVitais}
                  </div>
                </div>
              </div>

              {/* Informações da Missão */}
              <div>
                {/* Chips de Categoria */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-[#2AD3C1]/15 text-[#2AD3C1]">
                    Atendimento por voz
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-[#3DD68C]/15 text-[#3DD68C]">
                    Caso simulado
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-[#FFC247]/15 text-[#FFC247]">
                    7 Questões Inéditas · Sessão {caso.loteInfo?.loteAtual || 1}/3
                  </span>
                </div>

                {/* Título do Caso */}
                <h1 className="text-xl sm:text-2xl font-black leading-tight text-[#EAF2F8] mb-1.5">
                  {caso.titulo}
                </h1>
                <p className="text-xs sm:text-sm font-bold text-[#9FB3C6] mb-3">
                  {caso.subtitulo}
                </p>

                {/* Seletor Segmentado Marcus / Teresinha */}
                <div className="flex gap-2 mb-2.5">
                  <button
                    type="button"
                    onClick={() => handleSelectPaciente("marcus")}
                    className={`flex-1 h-11 rounded-xl border-2 font-black text-sm flex items-center justify-center transition-all cursor-pointer ${
                      pacienteId === "marcus"
                        ? "border-[#2AD3C1] border-b-[4px] border-b-[#17A99A] bg-[#2AD3C1]/10 text-[#2AD3C1]"
                        : "border-[#27394B] border-b-[4px] border-b-[#0A1118] bg-[#16222E] text-[#EAF2F8]"
                    }`}
                  >
                    Marcus
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPaciente("teresinha")}
                    className={`flex-1 h-11 rounded-xl border-2 font-black text-sm flex items-center justify-center transition-all cursor-pointer ${
                      pacienteId === "teresinha"
                        ? "border-[#2AD3C1] border-b-[4px] border-b-[#17A99A] bg-[#2AD3C1]/10 text-[#2AD3C1]"
                        : "border-[#27394B] border-b-[4px] border-b-[#0A1118] bg-[#16222E] text-[#EAF2F8]"
                    }`}
                  >
                    Teresinha
                  </button>
                </div>

                {/* Nota de Som */}
                <div className="flex items-center gap-2 text-xs font-bold text-[#9FB3C6] px-1">
                  <Volume1 className="w-4 h-4 text-[#2AD3C1] flex-none" />
                  <span>A voz do paciente é gerada a partir do caso com Voicebox neural.</span>
                </div>
              </div>
            </div>

            {/* Botão de Abertura 3D */}
            <div className="pt-3 mt-2">
              <button
                type="button"
                onClick={handleIniciarAtendimento}
                className="w-full h-12 sm:h-13 rounded-xl bg-[#2AD3C1] text-[#06302E] font-black text-base sm:text-lg shadow-[0_4px_0_#17A99A] active:translate-y-[2px] active:shadow-[0_2px_0_#17A99A] flex items-center justify-center transition-all cursor-pointer"
              >
                Iniciar atendimento
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            TELA 3: PACIENTE FALANDO (03-fala-paciente.png)
        ========================================================================= */}
        {tela === "fala" && (
          <div className="flex-1 flex flex-col justify-center p-3 sm:p-4 my-auto animate-in fade-in duration-200">
            <div>
              {/* TopBar */}
              <SimuladorTopBar
                stepAtual={0}
                totalSteps={caso.passos.length}
                vidas={vidas}
                onExit={() => setTela("intro")}
                onMoreOptions={() => setModalOpcoesAberto(true)}
              />

              {/* Palco do Paciente */}
              <div className="mt-2.5 mb-2.5">
                <PacienteVideoStage
                  pacienteId={pacienteId}
                  clipeAtivo={clipeAtivo}
                  isSpeaking={isSpeaking}
                  onClipeEnded={() => setClipeAtivo("fala")}
                  className="w-full h-[185px] xs:h-[200px] sm:h-[220px] rounded-2xl shadow-md border-2 border-[#27394B]"
                />
              </div>

              {/* Balão com Ondas Sonoras, Karaokê e Botões */}
              <div className="flex flex-col gap-2.5">
                <FalaLegendaBubble
                  texto={caso.passos[0].texto}
                  isSpeaking={isSpeaking}
                  activeWordIndex={activeWordIndex}
                />

                {/* Botões Secundários: Repetir e Pular */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleRepetirFala}
                    className="flex-1 h-11 rounded-xl border-2 border-[#27394B] border-b-[3px] border-b-[#0A1118] bg-[#16222E] text-[#EAF2F8] font-extrabold text-sm flex items-center justify-center gap-1.5 active:translate-y-[2px] active:border-b-2 hover:bg-[#1E2E3E] transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-[#9FB3C6]" />
                    <span>Repetir</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePularFala}
                    className="flex-1 h-11 rounded-xl border-2 border-[#27394B] border-b-[3px] border-b-[#0A1118] bg-[#16222E] text-[#EAF2F8] font-extrabold text-sm flex items-center justify-center gap-1.5 active:translate-y-[2px] active:border-b-2 hover:bg-[#1E2E3E] transition-all cursor-pointer"
                  >
                    <span>Pular</span>
                    <SkipForward className="w-4 h-4 text-[#9FB3C6]" />
                  </button>
                </div>
              </div>
            </div>

            {/* Botão de Continuar */}
            <div className="pt-3 mt-2">
              <button
                type="button"
                disabled={!falaConcluida && isSpeaking}
                onClick={handleContinuarAposFala}
                className={`w-full h-12 sm:h-13 rounded-xl font-black text-base sm:text-lg flex items-center justify-center transition-all cursor-pointer ${
                  !falaConcluida && isSpeaking
                    ? "bg-[#27394B] text-[#5D7388] shadow-[0_4px_0_#0A1118] cursor-not-allowed opacity-75"
                    : "bg-[#2AD3C1] text-[#06302E] shadow-[0_4px_0_#17A99A] active:translate-y-[2px] active:shadow-[0_2px_0_#17A99A]"
                }`}
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            TELAS 4 A 7: QUESTÕES DO CASO (Escolha, Seleção, Cálculo, Voz)
        ========================================================================= */}
        {tela === "questao" && (
          <div className="flex-1 flex flex-col justify-center p-3 sm:p-4 my-auto animate-in fade-in duration-200">
            <div>
              {/* TopBar com contagem de 1 a totalQuestoes */}
              <SimuladorTopBar
                stepAtual={Math.max(0, stepIndex - 1)}
                totalSteps={totalQuestoes}
                vidas={vidas}
                onExit={() => setTela("intro")}
                onMoreOptions={() => setModalOpcoesAberto(true)}
              />

              {/* Palco de Vídeo + Pergunta do Paciente com Ondas */}
              <div className="flex flex-col items-center gap-2.5 w-full mt-2 mb-2">
                <PacienteVideoStage
                  pacienteId={pacienteId}
                  clipeAtivo={clipeAtivo}
                  isSpeaking={isSpeaking}
                  small={false}
                  onClipeEnded={() => setClipeAtivo("fala")}
                  className="w-full h-[185px] xs:h-[200px] sm:h-[220px] mx-auto rounded-2xl shadow-md border-2 border-[#27394B]"
                />
                <FalaLegendaBubble
                  texto={passoAtual.pergunta}
                  isSpeaking={isSpeaking}
                  activeWordIndex={activeWordIndex}
                  compact
                  className="w-full text-center"
                />
              </div>

              {/* Tema da Questão agrupado com indicador de Sessão Única */}
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider px-0.5 mb-1.5">
                <span className="text-[#2AD3C1] truncate max-w-[70%]">
                  {passoAtual.tema || `QUESTÃO ${stepIndex} DE ${totalQuestoes}`}
                </span>
                {caso.rodadaId && (
                  <span className="text-[10px] text-[#9FB3C6] bg-[#16222E] px-2 py-0.5 rounded-md border border-[#27394B] font-bold">
                    Sessão #{caso.rodadaId}
                  </span>
                )}
              </div>

              {/* Corpo Dinâmico por Tipo de Questão */}
              <div className="flex flex-col gap-1.5 w-full mb-2">
                {/* -----------------------------------------------------------
                    TELA 4: MÚLTIPLA ESCOLHA (04-questao-escolha.png)
                ----------------------------------------------------------- */}
                {passoAtual.tipo === "multipla_escolha" && (
                  <div className="flex flex-col gap-1.5">
                    {passoAtual.opcoes.map((opcao, optIdx) => {
                      const isSelected = selectedEscolha === optIdx;
                      const letter = ["A", "B", "C", "D", "E"][optIdx] || String(optIdx + 1);
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => setSelectedEscolha(optIdx)}
                          className={`w-full py-2 px-3 rounded-[12px] border-2 font-black text-[13px] sm:text-[13.5px] text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#2AD3C1] border-b-[3px] border-b-[#17A99A] bg-[#2AD3C1]/10 text-[#2AD3C1]"
                              : "border-[#27394B] border-b-[3px] border-b-[#0A1118] bg-[#16222E] text-[#EAF2F8] hover:bg-[#1E2E3E]"
                          }`}
                        >
                          <span
                            className={`w-5.5 h-5.5 rounded-md border-2 flex items-center justify-center text-[10.5px] font-black flex-none ${
                              isSelected
                                ? "border-[#2AD3C1] text-[#2AD3C1]"
                                : "border-[#27394B] text-[#9FB3C6]"
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="flex-1 leading-snug">{opcao}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* -----------------------------------------------------------
                    TELA 5: MÚLTIPLA SELEÇÃO (05-questao-selecao.png)
                ----------------------------------------------------------- */}
                {passoAtual.tipo === "multipla_selecao" && (
                  <div className="flex flex-col gap-1.5">
                    {passoAtual.opcoes.map((opcao, optIdx) => {
                      const isChecked = selectedMultipla.includes(optIdx);
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => {
                            setSelectedMultipla((prev) =>
                              prev.includes(optIdx)
                                ? prev.filter((i) => i !== optIdx)
                                : [...prev, optIdx]
                            );
                          }}
                          className={`w-full py-1.5 px-3 rounded-[12px] border-2 font-black text-[12px] sm:text-[12.5px] text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                            isChecked
                              ? "border-[#2AD3C1] border-b-[3px] border-b-[#17A99A] bg-[#2AD3C1]/10 text-[#2AD3C1]"
                              : "border-[#27394B] border-b-[3px] border-b-[#0A1118] bg-[#16222E] text-[#EAF2F8] hover:bg-[#1E2E3E]"
                          }`}
                        >
                          <div
                            className={`w-4.5 h-4.5 rounded-md border-2 flex items-center justify-center flex-none ${
                              isChecked
                                ? "border-[#2AD3C1] bg-[#2AD3C1] text-[#06302E]"
                                : "border-[#27394B]"
                            }`}
                          >
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <span className="flex-1 leading-tight">{opcao}</span>
                        </button>
                      );
                    })}
                    <div className="flex items-center justify-between px-1 text-[11px] font-bold">
                      <span className="text-[#9FB3C6]">Marque todas as corretas.</span>
                      {selectedMultipla.length === 1 && (
                        <span className="text-[#FFC247] animate-pulse">Marque pelo menos 2</span>
                      )}
                      {selectedMultipla.length >= 2 && (
                        <span className="text-[#2AD3C1]">{selectedMultipla.length} selecionadas</span>
                      )}
                    </div>
                  </div>
                )}

                {/* -----------------------------------------------------------
                    TELA 6: CÁLCULO DE DOSE (06-questao-calculo.png)
                ----------------------------------------------------------- */}
                {passoAtual.tipo === "calculo" && (
                  <div className="flex flex-col gap-2">
                    {/* Card Registro de Prescrição com Fórmula sem cortes */}
                    <div className="rounded-[16px] bg-[#16222E] border-2 border-[#27394B] border-b-[3px] border-b-[#0A1118] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-1 text-[#2AD3C1] font-black text-xs uppercase tracking-wider mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-[#2AD3C1]" />
                          <span>Registro de prescrição</span>
                        </div>
                        {passoAtual.formulaGuia && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#0E1720] border border-[#27394B] text-[#9FB3C6] whitespace-normal text-right">
                            {passoAtual.formulaGuia}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-[#EAF2F8] leading-tight mb-2">
                        {passoAtual.prescricao}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {passoAtual.dadosTabela.map(([label, val], dIdx) => (
                          <div key={dIdx}>
                            <div className="font-bold text-[#9FB3C6] text-[11px]">{label}</div>
                            <div className="font-black text-[#EAF2F8]">{val}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Teclado e Display Virtual */}
                    <TecladoCalculo
                      valor={valorCalculo}
                      unidade={passoAtual.unidade}
                      onKeyPress={handleKeypadPress}
                    />
                  </div>
                )}

                {/* -----------------------------------------------------------
                    TELA 7: RESPOSTA FALADA (07-questao-voz.png)
                ----------------------------------------------------------- */}
                {passoAtual.tipo === "resposta_falada" && (
                  <div className="flex flex-col items-center gap-2.5 pt-1 w-full">
                    {/* Botão de Microfone Bloco 3D (conforme desenho na print) */}
                    <button
                      type="button"
                      onClick={handleToggleGravacaoVoz}
                      className={`w-24 h-20 sm:w-28 sm:h-22 rounded-2xl flex items-center justify-center transition-all cursor-pointer select-none mx-auto ${
                        isRecording
                          ? "bg-[#FF6B6B] text-[#2B1619] shadow-[0_5px_0_#b84444] animate-pulse active:translate-y-[2px] active:shadow-[0_2px_0_#b84444]"
                          : "bg-[#2AD3C1] text-[#06302E] shadow-[0_5px_0_#17A99A] active:translate-y-[2px] active:shadow-[0_2px_0_#17A99A] hover:brightness-105"
                      }`}
                      aria-label={isRecording ? "Concluir gravação" : "Falar resposta por voz"}
                    >
                      <Mic className="w-10 h-10 sm:w-11 sm:h-11 stroke-[2.2]" />
                    </button>

                    {/* Texto de Status / Instrução */}
                    <div className="text-xs font-black text-[#9FB3C6] text-center px-3">
                      {isRecording ? "Gravando fala... Toque no botão para concluir" : micStatusLabel}
                    </div>

                    {/* Card com a Transcrição ao Vivo */}
                    <div className="w-full rounded-[16px] bg-[#16222E] border-2 border-[#27394B] border-b-[3px] border-b-[#0A1118] p-3 min-h-[58px] flex items-center text-left">
                      <span
                        className={`text-[13.5px] font-extrabold ${
                          textoVoz ? "text-[#EAF2F8]" : "text-[#9FB3C6]/60"
                        }`}
                      >
                        {textoVoz || "A transcrição da sua fala aparece aqui…"}
                      </span>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex gap-2 w-full justify-center">
                      {isRecording && (
                        <button
                          type="button"
                          onClick={handleToggleGravacaoVoz}
                          className="h-9 px-3.5 rounded-xl bg-[#FF6B6B] text-[#2B1619] font-black text-xs shadow-[0_3px_0_#b84444] active:translate-y-0.5 transition-all cursor-pointer"
                        >
                          Concluir fala
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setInputDigitarManual(textoVoz);
                          setModalDigitarAberto(true);
                        }}
                        className="h-9 px-3.5 rounded-xl border-2 border-[#27394B] border-b-[3px] border-b-[#0A1118] bg-[#16222E] text-[#EAF2F8] font-black text-xs hover:bg-[#1E2E3E] active:translate-y-[2px] transition-all cursor-pointer"
                      >
                        Prefiro digitar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Botão 3D Verificar */}
            <div className="pt-2 mt-1.5">
              <button
                type="button"
                disabled={!canVerificar()}
                onClick={handleVerificarResposta}
                className={`w-full h-11 sm:h-12 rounded-xl font-black text-base flex items-center justify-center transition-all cursor-pointer ${
                  !canVerificar()
                    ? "bg-[#27394B] text-[#5D7388] shadow-[0_4px_0_#0A1118] cursor-not-allowed opacity-75"
                    : "bg-[#2AD3C1] text-[#06302E] shadow-[0_4px_0_#17A99A] active:translate-y-[2px] active:shadow-[0_2px_0_#17A99A]"
                }`}
              >
                Verificar
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            TELA 10: CONCLUSÃO E RESUMO (10-resumo.png)
        ========================================================================= */}
        {tela === "resumo" && (() => {
          const semVidas = vidas <= 0;
          return (
            <div className="flex-1 flex flex-col p-5 items-center justify-center text-center animate-in fade-in duration-300">
              <div className="w-full max-w-md mx-auto flex flex-col items-center">
                {/* Título de Conclusão ou Encerramento */}
                <h2
                  className={`text-[26px] xs:text-[28px] sm:text-[32px] font-black leading-tight mb-2 ${
                    semVidas ? "text-[#FF5C5C]" : "text-[#3DD68C]"
                  }`}
                >
                  {semVidas ? "Atendimento encerrado" : "Atendimento concluído!"}
                </h2>

                {/* Mascote Goti Animado */}
                <div className="my-2 py-1">
                  <GotiAnimated animation={semVidas ? "angry" : "jumping"} pose={semVidas ? "angry" : "jumping"} size="md" width={115} />
                </div>

                {/* Subtítulo dinâmico */}
                <div className="text-sm font-bold text-[#9FB3C6] max-w-sm mx-auto mb-4 leading-relaxed">
                  {semVidas
                    ? "Você cometeu alguns enganos e ficou sem vidas, mas não desanime, é errando que se aprende!"
                    : `Você cuidou bem do ${paciente.nome}.`}
                </div>

                {/* Grade de 3 Cards de Métricas */}
                <div className="w-full grid grid-cols-3 gap-2 mb-3">
                  <div className="rounded-2xl bg-[#16222E] border-2 border-[#27394B] border-b-[4px] border-b-[#0A1118] p-2.5">
                    <div className="text-xl font-black text-[#2AD3C1]">+{xp}</div>
                    <div className="text-[11px] font-extrabold text-[#9FB3C6] uppercase">
                      PE ganhos
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#16222E] border-2 border-[#27394B] border-b-[4px] border-b-[#0A1118] p-2.5">
                    <div
                      className={`text-xl font-black ${
                        semVidas ? "text-[#FF7A7A]" : "text-[#3DD68C]"
                      }`}
                    >
                      {Math.round((acertos / totalQuestoes) * 100)}%
                    </div>
                    <div className="text-[11px] font-extrabold text-[#9FB3C6] uppercase">
                      Precisão
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#16222E] border-2 border-[#27394B] border-b-[4px] border-b-[#0A1118] p-2.5">
                    <div className="text-xl font-black text-[#6CC3F5]">
                      {Math.floor(tempoDecorrido / 60)}:
                      {(tempoDecorrido % 60).toString().padStart(2, "0")}
                    </div>
                    <div className="text-[11px] font-extrabold text-[#9FB3C6] uppercase">
                      Tempo
                    </div>
                  </div>
                </div>

                {/* Card Revisar */}
                <div className="w-full rounded-2xl bg-[#16222E] border-2 border-[#27394B] border-b-[4px] border-b-[#0A1118] p-3.5 text-left mb-6">
                  <div className="text-xs font-black text-[#9FB3C6] uppercase tracking-wider mb-1">
                    REVISAR
                  </div>
                  <div className="text-sm font-extrabold text-[#EAF2F8]">
                    {erros.length === 0
                      ? "Nenhum erro — ótimo trabalho!"
                      : `${erros.length} questão(ões) para refazer`}
                  </div>
                </div>

                {/* Botões de Ação */}
                {semVidas ? (
                  <div className="w-full flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={handleIniciarAtendimento}
                      className="w-full h-12 sm:h-13 rounded-xl bg-[#2AD3C1] text-[#06302E] font-black text-base sm:text-lg shadow-[0_4px_0_#17A99A] active:translate-y-[2px] active:shadow-[0_2px_0_#17A99A] flex items-center justify-center transition-all cursor-pointer"
                    >
                      Tentar novamente
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/")}
                      className="w-full h-11 rounded-xl bg-[#16222E] border-2 border-[#27394B] text-[#9FB3C6] hover:text-[#EAF2F8] font-bold text-sm flex items-center justify-center transition-all cursor-pointer"
                    >
                      Voltar ao início
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="w-full h-12 sm:h-13 rounded-xl bg-[#2AD3C1] text-[#06302E] font-black text-base sm:text-lg shadow-[0_4px_0_#17A99A] active:translate-y-[2px] active:shadow-[0_2px_0_#17A99A] flex items-center justify-center transition-all cursor-pointer"
                  >
                    Concluir
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* =========================================================================
            TELAS 8 & 9: BOTTOM SHEET DE FEEDBACK (08-feedback-acerto / 09-feedback-erro)
        ========================================================================= */}
        <FeedbackBottomSheet
          isOpen={feedbackOpen}
          isCorrect={feedbackIsCorrect}
          respostaCerta={feedbackRespostaCerta}
          explicacao={feedbackExplicacao}
          onContinuar={handleContinuarAposFeedback}
        />

        {/* Modal: Prefiro Digitar */}
        {modalDigitarAberto && (
          <div className="fixed inset-0 bg-[#050A0F]/70 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-[22px] bg-[#16222E] border-2 border-[#27394B] border-b-[5px] border-b-[#0A1118] p-5 shadow-2xl">
              <h4 className="text-lg font-black text-[#EAF2F8] mb-2">
                Digite a sua resposta
              </h4>
              <p className="text-xs font-bold text-[#9FB3C6] mb-3">
                Descreva a conduta ou o procedimento com suas palavras:
              </p>
              <textarea
                value={inputDigitarManual}
                onChange={(e) => setInputDigitarManual(e.target.value)}
                rows={3}
                placeholder="Descreva a conduta ou procedimento com suas palavras..."
                className="w-full rounded-xl bg-[#0E1720] border-2 border-[#27394B] p-3 text-sm font-bold text-[#EAF2F8] focus:border-[#2AD3C1] focus:outline-none mb-4 resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalDigitarAberto(false)}
                  className="flex-1 h-11 rounded-xl border-2 border-[#27394B] bg-transparent text-[#9FB3C6] font-extrabold text-sm hover:text-[#EAF2F8]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTextoVoz(inputDigitarManual.trim());
                    setModalDigitarAberto(false);
                  }}
                  className="flex-1 h-11 rounded-xl bg-[#2AD3C1] text-[#06302E] font-black text-sm shadow-[0_3px_0_#17A99A] active:translate-y-0.5"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Mais Opções */}
        {modalOpcoesAberto && (
          <div className="fixed inset-0 bg-[#050A0F]/70 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-[22px] bg-[#16222E] border-2 border-[#27394B] border-b-[5px] border-b-[#0A1118] p-5 shadow-2xl flex flex-col gap-3">
              <h4 className="text-lg font-black text-[#EAF2F8]">
                Opções do Atendimento
              </h4>
              <button
                type="button"
                onClick={() => {
                  handleToggleSound();
                  setModalOpcoesAberto(false);
                }}
                className="w-full h-12 rounded-xl border-2 border-[#27394B] bg-[#0E1720] text-[#EAF2F8] font-extrabold text-sm flex items-center justify-between px-3"
              >
                <span>Voz do paciente</span>
                <span className={soundEnabled ? "text-[#2AD3C1]" : "text-[#FF6B6B]"}>
                  {soundEnabled ? "Ligada" : "Desligada"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalOpcoesAberto(false);
                  handleIniciarAtendimento();
                }}
                className="w-full h-12 rounded-xl border-2 border-[#27394B] bg-[#0E1720] text-[#EAF2F8] font-extrabold text-sm flex items-center gap-2 px-3"
              >
                <RotateCcw className="w-4 h-4 text-[#9FB3C6]" />
                <span>Reiniciar este caso</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalOpcoesAberto(false);
                  pararFala();
                  setTela("intro");
                }}
                className="w-full h-12 rounded-xl border-2 border-[#27394B] bg-[#0E1720] text-[#FF6B6B] font-extrabold text-sm flex items-center gap-2 px-3"
              >
                <X className="w-4 h-4 text-[#FF6B6B]" />
                <span>Abandonar caso e voltar</span>
              </button>
              <button
                type="button"
                onClick={() => setModalOpcoesAberto(false)}
                className="mt-1 h-11 rounded-xl bg-[#27394B] text-[#EAF2F8] font-black text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
