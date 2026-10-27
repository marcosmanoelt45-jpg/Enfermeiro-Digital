import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  User,
  ShieldCheck,
  Loader2,
  Camera,
  Check,
  Sparkles,
  Mic,
  Sun,
  Moon,
  Flame,
  Snowflake,
  ChevronDown,
  ChevronUp,
  Award,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import PhotoCropper from "@/components/PhotoCropper";
import StudentHeader from "@/components/StudentHeader";
import MobileBottomDock from "@/components/mobile/MobileBottomDock";

// Componentes de Estatísticas Clínicas Formativas
import { clinicalGamificationService } from "@/services/clinicalGamificationService";
import WeeklyActivityChart from "@/components/profile/WeeklyActivityChart";
import GotiStudyPointsModal from "@/components/mascot/GotiStudyPointsModal";

function cleanName(name) {
  return (name || "").replace(/^models\//, "");
}

export default function Conta() {
  const { user, logout, checkUserAuth } = useAuth();
  const { theme, setTheme, triggerHaptic } = useTheme();
  const navigate = useNavigate();

  // Controle de Abas: 'stats' (Estatísticas Clínicas) | 'settings' (Ajustes & IA)
  const [activeTab, setActiveTab] = useState("stats");

  // Estado da Gamificação Clínica
  const [gameState, setGameState] = useState(() => clinicalGamificationService.getState());
  const [showPeModal, setShowPeModal] = useState(false);

  // Controle de accordions expansíveis
  const [openSections, setOpenSections] = useState({
    dedication: false,
    league: false,
    mission: false,
    achievements: false,
    team: false,
  });

  const toggleSection = (section) => {
    triggerHaptic(15);
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const refreshGameState = () => {
    setGameState(clinicalGamificationService.getState());
  };

  useEffect(() => {
    refreshGameState();
  }, []);

  function handleBuyStreakFreeze() {
    triggerHaptic(25);
    const result = clinicalGamificationService.spendStudyPoints(30, "streak_freeze");
    if (result.success) {
      refreshGameState();
      toast({
        title: "❄️ Congelamento de Plantão Adquirido!",
        description: "Seu streak de dias está protegido contra imprevistos na escala hospitalar."
      });
    } else {
      toast({
        title: "Saldo Insuficiente de PE",
        description: result.reason || "Complete mais tarefas para acumular 30 Pontos de Estudo.",
        variant: "destructive"
      });
    }
  }

  const [busy, setBusy] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.full_name || "");
  const [savingName, setSavingName] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const fileRef = useRef(null);

  // Chave do Gemini AI
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem("enfermeiro_gemini_api_key") || "");
  const [geminiKeyInput, setGeminiKeyInput] = useState(geminiKey);
  const [testingGemini, setTestingGemini] = useState(false);

  // Chave do AssemblyAI
  const [assemblyAIKey, setAssemblyAIKey] = useState(() => localStorage.getItem("enfermeiro_assemblyai_api_key") || "");
  const [assemblyAIKeyInput, setAssemblyAIKeyInput] = useState(assemblyAIKey);
  const [testingAssemblyAI, setTestingAssemblyAI] = useState(false);

  async function handleSaveGeminiKey() {
    const keyToTest = geminiKeyInput.trim();
    if (!keyToTest) return;

    setTestingGemini(true);
    try {
      const listRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${keyToTest}`
      );

      if (!listRes.ok) {
        const errData = await listRes.json().catch(() => ({}));
        const msg = errData?.error?.message || "";
        if (
          listRes.status === 400 &&
          (msg.toLowerCase().includes("api key not valid") || msg.toLowerCase().includes("key invalid"))
        ) {
          throw new Error("Chave de API inválida. Verifique se copiou a chave completa gerada no Google AI Studio.");
        }
        throw new Error(msg || "Não foi possível validar a chave junto ao Google AI Studio.");
      }

      const listData = await listRes.json().catch(() => ({}));
      const rawModels = listData?.models || [];

      const contentModels = rawModels.filter((m) => {
        const methods = m.supportedGenerationMethods || m.supportedActions || [];
        return methods.includes("generateContent");
      });

      const priorityOrder = [
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-2.0-flash",
        "gemini-flash-latest",
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash",
      ];

      const candidateList = [];
      for (const pref of priorityOrder) {
        const found = contentModels.find(
          (m) => cleanName(m.name).toLowerCase() === pref.toLowerCase()
        );
        if (found && !candidateList.includes(cleanName(found.name))) {
          candidateList.push(cleanName(found.name));
        }
      }

      for (const m of contentModels) {
        const name = cleanName(m.name);
        if (
          !candidateList.includes(name) &&
          !name.includes("tts") &&
          !name.includes("image") &&
          !name.includes("pro-preview")
        ) {
          candidateList.push(name);
        }
      }

      let activeModel = null;
      let lastErrorMessage = "";

      for (const modelCandidate of candidateList) {
        try {
          const pingRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelCandidate}:generateContent?key=${keyToTest}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: "ping" }] }],
              }),
            }
          );

          if (pingRes.ok) {
            activeModel = modelCandidate;
            break;
          }

          const errPing = await pingRes.json().catch(() => ({}));
          lastErrorMessage = errPing?.error?.message || "";
        } catch (callErr) {
          lastErrorMessage = callErr.message || "";
        }
      }

      if (!activeModel) {
        throw new Error(
          lastErrorMessage || "Nenhum modelo do Google Gemini pôde responder à geração de teste no momento."
        );
      }

      localStorage.setItem("enfermeiro_gemini_api_key", keyToTest);
      localStorage.setItem("enfermeiro_gemini_model", activeModel);
      setGeminiKey(keyToTest);
      toast({
        title: "Google Gemini Conectado!",
        description: `Sua chave foi validada com sucesso com o modelo ${activeModel}. Raciocínio diagnóstico e transcrição multimodal ativos.`,
      });
    } catch (e) {
      toast({
        title: "Erro ao validar chave",
        description: e.message || "Verifique se a chave do Google AI Studio está correta.",
        variant: "destructive",
      });
    } finally {
      setTestingGemini(false);
    }
  }

  function handleRemoveGeminiKey() {
    localStorage.removeItem("enfermeiro_gemini_api_key");
    localStorage.removeItem("enfermeiro_gemini_model");
    setGeminiKey("");
    setGeminiKeyInput("");
    toast({
      title: "Chave removida",
      description: "O Enfere voltará a utilizar o super motor taxonômico local.",
    });
  }

  async function handleSaveAssemblyAIKey() {
    const keyToTest = assemblyAIKeyInput.trim();
    if (!keyToTest) return;

    setTestingAssemblyAI(true);
    try {
      const res = await fetch("https://api.assemblyai.com/v2/transcript?limit=1", {
        headers: { authorization: keyToTest },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Chave do AssemblyAI inválida ou sem saldo.");
      }

      localStorage.setItem("enfermeiro_assemblyai_api_key", keyToTest);
      setAssemblyAIKey(keyToTest);
      toast({
        title: "AssemblyAI Conectado!",
        description: "Transcrição de áudio de alta precisão em pt-BR ativada com sucesso.",
      });
    } catch (e) {
      toast({
        title: "Erro ao validar AssemblyAI",
        description: e.message || "Verifique sua chave de API no painel do AssemblyAI.",
        variant: "destructive",
      });
    } finally {
      setTestingAssemblyAI(false);
    }
  }

  function handleRemoveAssemblyAIKey() {
    localStorage.removeItem("enfermeiro_assemblyai_api_key");
    setAssemblyAIKey("");
    setAssemblyAIKeyInput("");
    toast({
      title: "Chave AssemblyAI removida",
      description: "A transcrição de voz utilizará o Google Gemini ou o reconhecimento nativo.",
    });
  }

  async function handleLogout() {
    setBusy(true);
    triggerHaptic(20);
    try {
      await logout(true);
      navigate("/splash");
    } catch {
      navigate("/splash");
    } finally {
      setBusy(false);
    }
  }

  function handleViewSplash() {
    triggerHaptic(20);
    navigate("/splash");
  }

  async function saveName() {
    if (!nameValue.trim() || nameValue.trim() === user?.full_name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const newName = nameValue.trim();
      await base44.auth.updateMe({ full_name: newName });
      await checkUserAuth();
      toast({ title: "Nome atualizado", description: "Seu nome foi atualizado com sucesso." });
      setEditingName(false);
    } catch (err) {
      toast({ title: "Erro ao salvar nome", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setSavingName(false);
    }
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Tamanho máximo: 10 MB.", variant: "destructive" });
      return;
    }
    setPendingFile(file);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function uploadCroppedPhoto(file) {
    setPendingFile(null);
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      await base44.auth.updateMe({ photo_url: file_url });
      await checkUserAuth();
      toast({ title: "Foto atualizada com sucesso!" });
    } catch (err) {
      toast({ title: "Erro ao enviar foto", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0B131D] text-[#EAF2F8] pb-28 md:pb-8 flex flex-col">
      {/* Header Desktop */}
      <div className="hidden md:block">
        <StudentHeader activeTab="perfil" />
      </div>

      <main className="flex-1 mx-auto max-w-xl md:max-w-2xl w-full px-4 sm:px-6 py-4 space-y-4">
        {/* Título "Perfil" (Página 21 do PDF) */}
        <h1 className="text-xl sm:text-2xl font-black text-white pt-1">
          Perfil
        </h1>

        {/* Card do Perfil do Estudante (Página 21 do PDF) */}
        <div className="rounded-2xl border border-[#1F3045] bg-[#0E1722] p-4 flex items-center gap-3.5">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-[#20D5B5] flex items-center justify-center text-[#0B131D] shadow-xs overflow-hidden">
              {user?.photo_url ? (
                <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-7 h-7 text-[#0B131D]" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-[#1F3045] bg-[#131F2E] text-white hover:text-[#20D5B5] transition disabled:opacity-50"
              title="Alterar foto"
            >
              {uploadingPhoto ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>

          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveName()}
                  className="rounded-xl text-xs bg-[#131F2E] border-[#1F3045] text-white"
                  autoFocus
                />
                <Button type="button" size="sm" onClick={saveName} disabled={savingName || !nameValue.trim()} className="bg-[#20D5B5] text-[#0B131D] font-bold text-xs">
                  {savingName ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-base font-black text-white truncate">
                    {user?.full_name || "Estudante de Enfermagem"}
                  </h2>
                  <p className="text-xs text-[#9FB3C6] truncate">
                    Membro desde {new Date(user?.created_at || Date.now()).getFullYear()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNameValue(user?.full_name || "");
                    setEditingName(true);
                  }}
                  className="text-xs font-bold text-[#20D5B5] hover:underline shrink-0"
                >
                  Editar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Pílulas de Alternância de Abas (Página 21 do PDF) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(15);
              setActiveTab("stats");
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTab === "stats"
                ? "bg-[#20D5B5] text-[#0B131D] shadow-xs"
                : "bg-[#131F2E] text-[#9FB3C6] hover:text-white border border-[#1F3045]"
            }`}
          >
            Estatísticas Clínicas
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic(15);
              setActiveTab("settings");
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTab === "settings"
                ? "bg-[#20D5B5] text-[#0B131D] shadow-xs"
                : "bg-[#131F2E] text-[#9FB3C6] hover:text-white border border-[#1F3045]"
            }`}
          >
            Ajustes & IA
          </button>
        </div>

        {/* CONTEÚDO DA ABA 1: ESTATÍSTICAS CLÍNICAS (Página 21 do PDF) */}
        {activeTab === "stats" && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* Card de Dias Seguidos (Streak) 1:1 com a Página 21 */}
            <div className="rounded-2xl border border-[#FFC247]/40 bg-[#0E1722] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Flame className="w-7 h-7 text-[#FFC247] shrink-0 fill-[#FFC247]" />
                <div>
                  <h3 className="text-sm font-black text-[#FFC247]">
                    {gameState.streak || 3} dias seguidos
                  </h3>
                  <p className="text-[11px] text-[#9FB3C6]">
                    Recorde: {gameState.bestStreak || 12} dias · {gameState.streakFreezeAvailable ?? 5} congelamentos disponíveis
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(15);
                  setShowPeModal(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#131F2E] border border-[#1F3045] text-xs font-black text-[#FFC247] hover:border-[#FFC247]/50 transition cursor-pointer"
              >
                {gameState.studyPoints ?? gameState.totalXp ?? 120} PE
              </button>
            </div>

            {/* Grid 2x2 com as Métricas Formativas (Página 21 do PDF) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-4 space-y-1">
                <div className="text-2xl font-black text-[#20D5B5]">
                  {gameState.solvedCases ?? 7}
                </div>
                <div className="text-xs font-semibold text-[#9FB3C6]">
                  Casos resolvidos
                </div>
              </div>

              <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-4 space-y-1">
                <div className="text-2xl font-black text-[#20D5B5]">
                  {gameState.accuracyRate ? `${gameState.accuracyRate}%` : "88%"}
                </div>
                <div className="text-xs font-semibold text-[#9FB3C6]">
                  Acurácia diagnóstica
                </div>
              </div>

              <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-4 space-y-1">
                <div className="text-2xl font-black text-[#20D5B5]">
                  {gameState.safeDosagesCount ?? 14}
                </div>
                <div className="text-xs font-semibold text-[#9FB3C6]">
                  Cálculos seguros
                </div>
              </div>

              <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-4 space-y-1">
                <div className="text-2xl font-black text-[#20D5B5]">
                  {gameState.sbarHandoffsCount ?? 4}
                </div>
                <div className="text-xs font-semibold text-[#9FB3C6]">
                  Plantões SBAR
                </div>
              </div>
            </div>

            {/* Card de Nível do Estudante (Página 21 do PDF) */}
            <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-4 space-y-2.5">
              <div className="text-xs font-black text-[#20D5B5] uppercase tracking-wide">
                NÍVEL 1 · Recruta de Enfermagem
              </div>
              <div className="w-full h-2 rounded-full bg-[#0E1722] overflow-hidden">
                <div className="h-full bg-[#20D5B5] rounded-full w-[60%]" />
              </div>
            </div>

            {/* Lista de Acordeões Expansíveis (Página 21 do PDF) */}
            <div className="space-y-2 pt-1">
              {/* 1. Dedicação semanal */}
              <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('dedication')}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-[#16222E] transition"
                >
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-white">
                      Dedicação semanal
                    </div>
                    <div className="text-[11px] text-[#9FB3C6]">
                      290 PE nos últimos 7 dias
                    </div>
                  </div>
                  {openSections.dedication ? (
                    <ChevronUp className="w-4 h-4 text-[#9FB3C6]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#9FB3C6]" />
                  )}
                </button>
                {openSections.dedication && (
                  <div className="p-4 pt-0 border-t border-[#1F3045]/60">
                    <WeeklyActivityChart weeklyDays={gameState.weeklyDays} />
                  </div>
                )}
              </div>

              {/* 2. Liga semanal */}
              <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('league')}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-[#16222E] transition"
                >
                  <div className="text-xs sm:text-sm font-bold text-white">
                    Liga semanal
                  </div>
                  {openSections.league ? (
                    <ChevronUp className="w-4 h-4 text-[#9FB3C6]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#9FB3C6]" />
                  )}
                </button>
                {openSections.league && (
                  <div className="p-4 pt-2 border-t border-[#1F3045]/60 text-xs text-[#9FB3C6] space-y-2">
                    <div className="flex items-center justify-between font-bold text-white">
                      <span>Divisão Prata · Grupo 4</span>
                      <span className="text-[#20D5B5]">Top 5 Avançam</span>
                    </div>
                    <p className="text-[11px]">Você está na 3ª posição com 290 PE acumulados nesta rodada.</p>
                  </div>
                )}
              </div>

              {/* 3. Missão: Mãos Dadas no Plantão */}
              <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('mission')}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-[#16222E] transition"
                >
                  <div className="text-xs sm:text-sm font-bold text-white">
                    Missão: Mãos Dadas no Plantão
                  </div>
                  {openSections.mission ? (
                    <ChevronUp className="w-4 h-4 text-[#9FB3C6]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#9FB3C6]" />
                  )}
                </button>
                {openSections.mission && (
                  <div className="p-4 pt-2 border-t border-[#1F3045]/60 text-xs text-[#9FB3C6] space-y-2">
                    <p className="text-[11px]">Conclua 3 passagens de plantão SBAR com precisão para desbloquear a insígnia de Comunicação Interprofissional da OMS.</p>
                    <div className="w-full h-1.5 rounded-full bg-[#0E1722] overflow-hidden">
                      <div className="h-full bg-[#20D5B5] rounded-full w-[33%]" />
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Conquistas */}
              <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('achievements')}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-[#16222E] transition"
                >
                  <div className="text-xs sm:text-sm font-bold text-white">
                    Conquistas
                  </div>
                  {openSections.achievements ? (
                    <ChevronUp className="w-4 h-4 text-[#9FB3C6]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#9FB3C6]" />
                  )}
                </button>
                {openSections.achievements && (
                  <div className="p-4 pt-2 border-t border-[#1F3045]/60 text-xs text-[#9FB3C6] space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-[#0E1722] border border-[#1F3045] flex items-center gap-2">
                        <Award className="w-4 h-4 text-[#FFC247]" />
                        <span className="text-[11px] font-bold text-white">Primeiro Plantão</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#0E1722] border border-[#1F3045] flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#20D5B5]" />
                        <span className="text-[11px] font-bold text-white">Dose Exata</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Colegas e atividade da equipe */}
              <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('team')}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-[#16222E] transition"
                >
                  <div className="text-xs sm:text-sm font-bold text-white">
                    Colegas e atividade da equipe
                  </div>
                  {openSections.team ? (
                    <ChevronUp className="w-4 h-4 text-[#9FB3C6]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#9FB3C6]" />
                  )}
                </button>
                {openSections.team && (
                  <div className="p-4 pt-2 border-t border-[#1F3045]/60 text-xs text-[#9FB3C6] space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#20D5B5]" />
                      <span className="text-[11px] text-white">12 colegas praticando neste turno</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Módulo de Congelamento de Plantão */}
            <div className="pt-2">
              <div className="rounded-2xl border border-[#1F3045] bg-[#0E1722] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-950/60 border border-sky-800 text-sky-400 flex items-center justify-center shrink-0">
                    <Snowflake className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white flex items-center gap-2">
                      Congelamento de Plantão
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-900/60 text-sky-300">
                        {gameState.streakFreezeAvailable || 0} disponível{(gameState.streakFreezeAvailable || 0) !== 1 ? "is" : ""}
                      </span>
                    </h5>
                    <p className="text-[11px] text-[#9FB3C6]">
                      Fique 1 dia sem atividade sem perder sua contagem de dias seguidos na escala clínica.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleBuyStreakFreeze}
                  disabled={(gameState.studyPoints ?? gameState.totalXp ?? 0) < 30}
                  className="rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs shrink-0 self-start sm:self-auto py-2 px-3 disabled:opacity-50"
                >
                  <Snowflake className="w-3.5 h-3.5" />
                  <span>Comprar (+1) por 30 PE</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* CONTEÚDO DA ABA 2: AJUSTES & IA */}
        {activeTab === "settings" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Card de Configuração de Aparência e Tema */}
            <div className="rounded-2xl border border-[#1F3045] bg-[#0E1722] p-5 space-y-4 shadow-xs">
              <div>
                <p className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Sun className="h-4 w-4 text-[#FFC247]" /> Aparência & Tema Visual
                </p>
                <p className="mt-0.5 text-xs text-[#9FB3C6]">
                  Personalize o contraste da interface para estudos diurnos ou plantão noturno em enfermarias.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(25);
                    setTheme('light');
                  }}
                  className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 ${
                    theme === 'light'
                      ? 'bg-[#131F2E] border-[#20D5B5] text-white font-bold ring-2 ring-[#20D5B5]/20'
                      : 'bg-[#131F2E] border-[#1F3045] text-[#9FB3C6] hover:border-slate-500'
                  }`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 shrink-0">
                    <Sun className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-white">Modo Claro</span>
                    <span className="text-[10px] text-[#9FB3C6]">Visual clássico</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(25);
                    setTheme('dark');
                  }}
                  className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 ${
                    theme === 'dark'
                      ? 'bg-[#131F2E] border-[#20D5B5] text-[#20D5B5] font-bold ring-2 ring-[#20D5B5]/20'
                      : 'bg-[#131F2E] border-[#1F3045] text-[#9FB3C6] hover:border-slate-500'
                  }`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B131D] text-[#FFC247] shrink-0 border border-[#1F3045]">
                    <Moon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-white">Modo Escuro</span>
                    <span className="text-[10px] text-[#9FB3C6]">Padrão relaxante</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Card do Google Gemini AI */}
            <div className="rounded-2xl border border-[#1F3045] bg-[#0E1722] p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-[#20D5B5]" /> Inteligência Artificial Clínica (Google Gemini)
                  </p>
                  <p className="mt-0.5 text-xs text-[#9FB3C6]">
                    Conecte sua chave de API para raciocínio diagnóstico avançado e ilimitado com o Google Gemini.
                  </p>
                </div>
                {geminiKey ? (
                  <span className="rounded-full bg-[#20D5B5]/15 px-2 py-0.5 text-[11px] font-bold text-[#20D5B5] border border-[#20D5B5]/30">
                    Chave Ativa
                  </span>
                ) : (
                  <span className="rounded-full bg-[#131F2E] px-2 py-0.5 text-[11px] font-medium text-[#9FB3C6] border border-[#1F3045]">
                    Motor Local Ativo
                  </span>
                )}
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="Cole sua chave de API (AIzaSy...)"
                    value={geminiKeyInput}
                    onChange={(e) => setGeminiKeyInput(e.target.value)}
                    className="rounded-xl text-xs bg-[#131F2E] border-[#1F3045] text-white"
                  />
                  <Button
                    type="button"
                    onClick={handleSaveGeminiKey}
                    disabled={testingGemini || (!geminiKeyInput.trim() && !geminiKey)}
                    className="shrink-0 rounded-xl bg-[#20D5B5] hover:bg-[#1AD1B0] text-[#0B131D] text-xs px-3 font-black shadow-[0_3px_0_0_#148A76] active:translate-y-0.5 active:shadow-none"
                  >
                    {testingGemini ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Salvar & Testar"}
                  </Button>
                </div>

                {geminiKey && (
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-[#20D5B5] font-medium flex items-center gap-1">
                      <Check className="h-3 w-3" /> Chave configurada com sucesso
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveGeminiKey}
                      className="text-rose-400 hover:underline"
                    >
                      Remover chave
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Card do AssemblyAI */}
            <div className="rounded-2xl border border-[#1F3045] bg-[#0E1722] p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Mic className="h-4 w-4 text-[#20D5B5]" /> Transcrição de Voz (AssemblyAI)
                  </p>
                  <p className="mt-0.5 text-xs text-[#9FB3C6]">
                    Modelo dedicado de reconhecimento de fala em português (pt-BR) para gravação de áudios longos à beira-leito.
                  </p>
                </div>
                {assemblyAIKey ? (
                  <span className="rounded-full bg-[#20D5B5]/15 px-2 py-0.5 text-[11px] font-bold text-[#20D5B5] border border-[#20D5B5]/30">
                    Chave Ativa
                  </span>
                ) : (
                  <span className="rounded-full bg-[#131F2E] px-2 py-0.5 text-[11px] font-medium text-[#9FB3C6] border border-[#1F3045]">
                    Não configurada
                  </span>
                )}
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="Cole sua chave de API do AssemblyAI"
                    value={assemblyAIKeyInput}
                    onChange={(e) => setAssemblyAIKeyInput(e.target.value)}
                    className="rounded-xl text-xs bg-[#131F2E] border-[#1F3045] text-white"
                  />
                  <Button
                    type="button"
                    onClick={handleSaveAssemblyAIKey}
                    disabled={testingAssemblyAI || (!assemblyAIKeyInput.trim() && !assemblyAIKey)}
                    className="shrink-0 rounded-xl bg-[#20D5B5] hover:bg-[#1AD1B0] text-[#0B131D] text-xs px-3 font-black shadow-[0_3px_0_0_#148A76] active:translate-y-0.5 active:shadow-none"
                  >
                    {testingAssemblyAI ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Salvar & Testar"}
                  </Button>
                </div>

                {assemblyAIKey && (
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-[#20D5B5] font-medium flex items-center gap-1">
                      <Check className="h-3 w-3" /> Transcrição AssemblyAI conectada
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveAssemblyAIKey}
                      className="text-rose-400 hover:underline"
                    >
                      Remover chave
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Ações Rápidas: Rever Tela de Splash & Sair da Conta */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleViewSplash}
                className="w-full rounded-2xl bg-[#131F2E] border border-[#1F3045] hover:border-[#20D5B5]/50 text-white font-bold text-xs sm:text-sm py-3.5 px-4 flex items-center justify-center gap-2 select-none active:translate-y-0.5 transition-all cursor-pointer shadow-xs"
              >
                <Sparkles className="h-4 w-4 text-[#20D5B5]" />
                <span>Rever Tela de Abertura (Splash / Boas-Vindas)</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={busy}
                className="w-full rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 font-bold py-3.5 flex items-center justify-center gap-2 active:translate-y-0.5 transition cursor-pointer"
              >
                {busy ? (
                  "Saindo..."
                ) : (
                  <>
                    <LogOut className="h-4 w-4" /> Sair da conta
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-2xl px-4 py-4 text-center">
        <p className="text-[11px] text-[#9FB3C6]/60">
          © 2026 Marcos Manoel Tavares Neumann — Criador e detentor dos direitos da plataforma Enfere
        </p>
      </footer>

      {pendingFile && (
        <PhotoCropper
          file={pendingFile}
          onConfirm={uploadCroppedPhoto}
          onCancel={() => setPendingFile(null)}
        />
      )}

      <GotiStudyPointsModal
        isOpen={showPeModal}
        onClose={() => {
          setShowPeModal(false);
          refreshGameState();
        }}
      />

      <MobileBottomDock activeTab="perfil" />
    </div>
  );
}
