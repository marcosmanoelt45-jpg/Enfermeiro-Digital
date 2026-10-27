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
import { validateCalculoAnswer } from "@/services/simuladorFormulaService";
import PacienteVideoStage from "@/components/simulador/PacienteVideoStage";
import SimuladorTopBar from "@/components/simulador/SimuladorTopBar";
import FalaLegendaBubble from "@/components/simulador/FalaLegendaBubble";
import TecladoCalculo from "@/components/simulador/TecladoCalculo";
import FeedbackBottomSheet from "@/components/simulador/FeedbackBottomSheet";
import GotiAnimated from "@/components/mascot/GotiAnimated";

export default function Videochamada() {
  const navigate = useNavigate();

  // Estados do Simulador
  const [pacienteId, setPacienteId] = useState("marcus");
  const [tela, setTela] = useState("intro"); // 'intro' | 'fala' | 'questao' | 'resumo'
  const [stepIndex, setStepIndex] = useState(0);
  const [vidas, setVidas] = useState(3);
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

  // Caso dinâmico com 8+ questões e alternativas embaralhadas
  const [caso, setCaso] = useState(() =>
    gerarCasoAleatorio("marcus", { shuffleQuestions: true, minQuestions: 8 })
  );
  const paciente = PACIENTES[pacienteId] || PACIENTES.marcus;
  const passoAtual = caso.passos[stepIndex] || caso.passos[0];
  const totalQuestoes = useMemo(
    () => caso.passos.filter((p) => p.tipo !== "fala_paciente").length || 1,
    [caso]
  );

  function handleSelectPaciente(novoId) {
    pararFala();
    setPacienteId(novoId);
    setCaso(gerarCasoAleatorio(novoId, { shuffleQuestions: true, minQuestions: 8 }));
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
    const novoCaso = gerarCasoAleatorio(pacienteId, { shuffleQuestions: true, minQuestions: 8 });
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

  // Gravação de voz com Web Speech API
  function handleToggleGravacaoVoz() {
    if (isRecording) {
      if (activeRecognizerRef.current) {
        activeRecognizerRef.current.stop();
      }
      setIsRecording(false);
      setMicStatusLabel(textoVoz ? "Fala gravada com sucesso" : "Gravação concluída");
      return;
    }

    pararFala();
    setTextoVoz("");
    setIsRecording(true);
    setMicStatusLabel("Gravando... Fale a sua resposta");

    const recognizer = iniciarReconhecimentoVoz({
      onInterim: (interim) => {
        setTextoVoz(interim);
      },
      onFinal: (final) => {
        setTextoVoz(final);
        setMicStatusLabel("Transcrição concluída");
      },
      onError: (erro) => {
        setIsRecording(false);
        setMicStatusLabel(typeof erro === "string" ? erro : "Microfone indisponível");
        console.warn("Erro no microfone:", erro);
      },
      onEnd: () => {
        setIsRecording(false);
      }
    });

    activeRecognizerRef.current = recognizer;
  }

  // Verifica se o botão "Verificar" da questão deve estar habilitado
  const canVerificar = () => {
    if (!passoAtual) return false;
    if (passoAtual.tipo === "multipla_escolha") {
      return selectedEscolha !== null;
    }
    if (passoAtual.tipo === "multipla_selecao") {
      return selectedMultipla.length > 0;
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
      setTempoDecorrido(Math.round((Date.now() - startTime) / 1000));
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

  // Alternar entre paciente Marcus e Teresinha
  function handleSelectPaciente(pId) {
    if (pId === pacienteId) return;
    pararFala();
    setPacienteId(pId);
  }

  return (
    <div className="w-full min-h-screen bg-[#0E1720] text-[#EAF2F8] font-['Nunito',sans-serif] flex justify-center selection:bg-[#2AD3C1]/30">
      <div className="w-full max-w-[440px] md:max-w-4xl lg:max-w-5xl xl:max-w-6xl min-h-screen flex flex-col relative overflow-x-hidden transition-all duration-300">

        {/* =========================================================================
            TELA 2: ABERTURA DO CASO (02-intro.png)
        ========================================================================= */}
        {tela === "intro" && (
          <div className="flex-1 flex flex-col p-4 sm:p-5 md:p-8 animate-in fade-in duration-200">
            {/* Topo com Botão Fechar X */}
            <div className="flex items-center justify-between pt-1 pb-3">
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

            {/* Layout Responsivo: Coluna Única no Mobile, 2 Colunas no Desktop */}
            <div className="flex-1 flex flex-col md:grid md:grid-cols-12 md:gap-8 md:items-center">
              {/* Coluna Esquerda no PC: Palco de Vídeo do Paciente com Dados Clínicos */}
              <div className="md:col-span-6 flex flex-col gap-3 mb-4 md:mb-0">
                <PacienteVideoStage
                  pacienteId={pacienteId}
                  clipeAtivo="fala"
                  isSpeaking={false}
                  className="w-full"
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

              {/* Coluna Direita no PC: Informações da Missão e Ações */}
              <div className="md:col-span-6 flex flex-col justify-between h-full">
                <div>
                  {/* Chips de Categoria */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-[#2AD3C1]/15 text-[#2AD3C1]">
                      Atendimento por voz
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-[#3DD68C]/15 text-[#3DD68C]">
                      Caso simulado
                    </span>
                  </div>

                  {/* Título do Caso */}
                  <h1 className="text-2xl sm:text-3xl font-black leading-tight text-[#EAF2F8] mb-2">
                    {caso.titulo}
                  </h1>
                  <p className="text-xs sm:text-sm font-bold text-[#9FB3C6] mb-4">
                    {caso.subtitulo}
                  </p>

                  {/* Seletor Segmentado Marcus / Teresinha */}
                  <div className="flex gap-2 mb-3">
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
                  <div className="flex items-center gap-2 text-xs font-bold text-[#9FB3C6] mb-4 px-1">
                    <Volume1 className="w-4 h-4 text-[#2AD3C1] flex-none" />
                    <span>A voz do paciente é gerada a partir do caso com Voicebox neural.</span>
                  </div>
                </div>

                {/* Botão de Abertura 3D */}
                <div className="mt-auto pt-2">
                  <button
                    type="button"
                    onClick={handleIniciarAtendimento}
                    className="w-full h-12 sm:h-13 rounded-xl bg-[#2AD3C1] text-[#06302E] font-black text-base sm:text-lg shadow-[0_4px_0_#17A99A] active:translate-y-[2px] active:shadow-[0_2px_0_#17A99A] flex items-center justify-center transition-all cursor-pointer"
                  >
                    Iniciar atendimento
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TELA 3: PACIENTE FALANDO (03-fala-paciente.png)
        ========================================================================= */}
        {tela === "fala" && (
          <div className="flex-1 flex flex-col p-4 sm:p-5 md:p-8 animate-in fade-in duration-200">
            {/* TopBar */}
            <SimuladorTopBar
              stepAtual={0}
              totalSteps={caso.passos.length}
              vidas={vidas}
              onExit={() => setTela("intro")}
              onMoreOptions={() => setModalOpcoesAberto(true)}
            />

            {/* Conteúdo Central Responsivo */}
            <div className="flex-1 flex flex-col md:grid md:grid-cols-12 md:gap-8 md:items-center mt-3">
              {/* Palco do Paciente */}
              <div className="md:col-span-6 mb-3 md:mb-0">
                <PacienteVideoStage
                  pacienteId={pacienteId}
                  clipeAtivo={clipeAtivo}
                  isSpeaking={isSpeaking}
                  onClipeEnded={() => setClipeAtivo("fala")}
                  className="w-full"
                />
              </div>

              {/* Lado Direito: Balão com Ondas Sonoras, Karaokê e Botões */}
              <div className="md:col-span-6 flex flex-col justify-between gap-3 h-full">
                <div className="flex flex-col gap-3">
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

                {/* Botão de Continuar */}
                <div className="mt-auto pt-3">
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
            </div>
          </div>
        )}

        {/* =========================================================================
            TELAS 4 A 7: QUESTÕES DO CASO (Escolha, Seleção, Cálculo, Voz)
        ========================================================================= */}
        {tela === "questao" && (
          <div className="flex-1 flex flex-col p-3 sm:p-4 md:p-6 lg:p-8 animate-in fade-in duration-200">
            {/* TopBar */}
            <SimuladorTopBar
              stepAtual={stepIndex}
              totalSteps={caso.passos.length}
              vidas={vidas}
              onExit={() => setTela("intro")}
              onMoreOptions={() => setModalOpcoesAberto(true)}
            />

            {/* Layout Responsivo: 2 Colunas no Desktop, Empilhado no Mobile */}
            <div className="flex-1 flex flex-col md:grid md:grid-cols-12 md:gap-8 md:items-start my-2">

              {/* Coluna Esquerda (Desktop): Palco de Vídeo + Pergunta do Paciente com Ondas */}
              <div className="md:col-span-5 flex flex-col gap-2.5 mb-2 md:mb-0">
                {/* Visualização Mobile: Linha compacta */}
                <div className="flex md:hidden items-stretch gap-2">
                  <PacienteVideoStage
                    pacienteId={pacienteId}
                    clipeAtivo={clipeAtivo}
                    isSpeaking={isSpeaking}
                    small
                    onClipeEnded={() => setClipeAtivo("fala")}
                  />
                  <FalaLegendaBubble
                    texto={passoAtual.pergunta}
                    isSpeaking={isSpeaking}
                    activeWordIndex={activeWordIndex}
                    compact
                    className="flex-1"
                  />
                </div>

                {/* Visualização Desktop: Vídeo Grande + Balão de Pergunta abaixo */}
                <div className="hidden md:flex flex-col gap-3">
                  <PacienteVideoStage
                    pacienteId={pacienteId}
                    clipeAtivo={clipeAtivo}
                    isSpeaking={isSpeaking}
                    small={false}
                    onClipeEnded={() => setClipeAtivo("fala")}
                    className="w-full md:h-[260px] lg:h-[300px]"
                  />
                  <FalaLegendaBubble
                    texto={passoAtual.pergunta}
                    isSpeaking={isSpeaking}
                    activeWordIndex={activeWordIndex}
                    compact={false}
                    className="w-full"
                  />
                  {/* Badge de Sinais Vitais no Desktop */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#16222E] border-2 border-[#27394B]">
                    <div>
                      <span className="text-sm font-black text-[#EAF2F8] block">{paciente.nome}</span>
                      <span className="text-xs font-bold text-[#9FB3C6]">{paciente.idade} · {paciente.leito}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-[#3AA7E8]/15 text-[#6CC3F5] text-xs font-black">
                      {paciente.sinaisVitais}
                    </span>
                  </div>
                </div>
              </div>

              {/* Coluna Direita (Desktop): Opções da Questão + Botão Verificar */}
              <div className="md:col-span-7 flex flex-col justify-between flex-1 gap-2 md:min-h-[460px]">
                {/* Tema da Questão */}
                {passoAtual.tema && (
                  <div className="text-[11px] font-black text-[#2AD3C1] uppercase tracking-wider mb-0.5 px-0.5">
                    {passoAtual.tema}
                  </div>
                )}

                {/* Corpo Dinâmico por Tipo de Questão */}
                <div className="flex-1 flex flex-col justify-center gap-1.5 my-1">
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
                      <div className="text-[11px] font-bold text-[#9FB3C6] px-1">
                        Marque todas as corretas.
                      </div>
                    </div>
                  )}

                  {/* -----------------------------------------------------------
                      TELA 6: CÁLCULO DE DOSE (06-questao-calculo.png)
                  ----------------------------------------------------------- */}
                  {passoAtual.tipo === "calculo" && (
                    <div className="flex flex-col gap-2">
                      {/* Card Registro de Prescrição com Fórmula no Cantinho */}
                      <div className="rounded-[16px] bg-[#16222E] border-2 border-[#27394B] border-b-[3px] border-b-[#0A1118] p-3">
                        <div className="flex items-center justify-between text-[#2AD3C1] font-black text-xs uppercase tracking-wider mb-1">
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-4 h-4" />
                            <span>Registro de prescrição</span>
                          </div>
                          {passoAtual.formulaGuia && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#0E1720] border border-[#27394B] text-[#9FB3C6] truncate max-w-[190px]">
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
                    <div className="flex flex-col items-center gap-2 pt-1">
                      {/* Botão Circular Grande de Microfone */}
                      <button
                        type="button"
                        onClick={handleToggleGravacaoVoz}
                        className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                          isRecording
                            ? "bg-[#FF6B6B] text-[#2B1619] shadow-[0_4px_0_#b84444] animate-pulse scale-105"
                            : "bg-[#2AD3C1] text-[#06302E] shadow-[0_4px_0_#17A99A] active:translate-y-[2px]"
                        }`}
                        aria-label={isRecording ? "Concluir gravação" : "Gravar resposta por voz"}
                      >
                        <Mic className="w-9 h-9 stroke-[2.3]" />
                      </button>

                      <div className="text-xs font-black text-[#9FB3C6] text-center px-3">
                        {micStatusLabel}
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

                {/* Botão 3D Verificar */}
                <div className="mt-auto pt-2">
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

            </div>
          </div>
        )}

        {/* =========================================================================
            TELA 10: CONCLUSÃO E RESUMO (10-resumo.png)
        ========================================================================= */}
        {tela === "resumo" && (
          <div className="flex-1 flex flex-col p-5 items-center justify-center text-center animate-in fade-in duration-300">
            <div className="w-full max-w-md mx-auto flex flex-col items-center">
              {/* Título de Conclusão */}
              <h2 className="text-[28px] sm:text-[32px] font-black text-[#3DD68C] leading-tight mb-2">
                Atendimento concluído!
              </h2>

              {/* Mascote Goti Animado */}
              <div className="my-2 py-1">
                <GotiAnimated pose="jumping" size="md" width={115} />
              </div>

              {/* Subtítulo */}
              <div className="text-sm font-bold text-[#9FB3C6] mb-4">
                Você cuidou bem do {paciente.nome}.
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
                  <div className="text-xl font-black text-[#3DD68C]">
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

              {/* Botão Concluir */}
              <button
                type="button"
                onClick={() => navigate("/")}
                className="w-full h-12 sm:h-13 rounded-xl bg-[#2AD3C1] text-[#06302E] font-black text-base sm:text-lg shadow-[0_4px_0_#17A99A] active:translate-y-[2px] active:shadow-[0_2px_0_#17A99A] flex items-center justify-center transition-all cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        )}

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
