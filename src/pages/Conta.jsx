import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  LogOut,
  UserCircle,
  ShieldCheck,
  Loader2,
  Camera,
  Check,
  Sparkles,
  Mic,
  Sun,
  Moon,
  Sliders,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Image as ImageComponent } from "@/components/ui/image";
import { toast } from "@/components/ui/use-toast";
import PhotoCropper from "@/components/PhotoCropper";

// Componentes de Estatísticas Clínicas Formativas
import { clinicalGamificationService } from "@/services/clinicalGamificationService";
import ClinicalStatsGrid from "@/components/profile/ClinicalStatsGrid";
import WeeklyActivityChart from "@/components/profile/WeeklyActivityChart";

function cleanName(name) {
  return (name || "").replace(/^models\//, "");
}

export default function Conta() {
  const { user, logout, checkUserAuth } = useAuth();
  const { theme, setTheme, triggerHaptic } = useTheme();
  const navigate = useNavigate();

  // Controle de Abas: 'stats' (Perfil & Estatísticas) | 'social' (Comunidade & Liga) | 'settings' (Ajustes & IA)
  const [activeTab, setActiveTab] = useState("stats");

  // Estado da Gamificação Clínica
  const [gameState, setGameState] = useState(() => clinicalGamificationService.getState());

  const refreshGameState = () => {
    setGameState(clinicalGamificationService.getState());
  };

  useEffect(() => {
    refreshGameState();
  }, []);

  const [busy, setBusy] = useState(false);
  const [switching, setSwitching] = useState(false);
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
        "gemini-3.5-flash",
        "gemini-flash-latest",
        "gemini-3.1-flash-lite",
        "gemini-3.8-flash",
        "gemini-3.7-flash",
        "gemini-3.6-flash",
        "gemini-2.0-flash",
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
      description: "O Enfermeiro Digital voltará a utilizar o super motor taxonômico local.",
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

  const profileLabel =
    user?.user_type === "professor"
      ? "Professor"
      : user?.user_type === "aluno"
      ? "Aluno"
      : "Não definido";

  function handleLogout() {
    setBusy(true);
    logout(true);
  }

  async function _switchProfile(type) {
    if (switching || user?.user_type === type) return;
    setSwitching(true);
    try {
      await base44.auth.updateMe({ user_type: type, role: type });
      await checkUserAuth();
      toast({
        title: "Perfil atualizado",
        description: type === "professor" ? "Agora você está como Professor." : "Agora você está como Aluno.",
      });
    } catch (err) {
      toast({
        title: "Erro ao trocar perfil",
        description: err.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSwitching(false);
    }
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
      try {
        await base44.entities.TurmaMember.updateMany(
          { user_id: user.id },
          { $set: { user_name: newName } }
        );
        await base44.entities.Turma.updateMany(
          { teacher_id: user.id },
          { $set: { teacher_name: newName } }
        );
      } catch {}
      await checkUserAuth();
      toast({ title: "Nome atualizado", description: "Seu nome foi atualizado em todas as turmas." });
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
      try {
        await base44.entities.TurmaMember.updateMany(
          { user_id: user.id },
          { $set: { photo_url: file_url } }
        );
      } catch {}
      await checkUserAuth();
      toast({ title: "Foto atualizada com sucesso!" });
    } catch (err) {
      toast({ title: "Erro ao enviar foto", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors pb-12">
      {/* Header Sticky */}
      <header className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao Início
          </button>

          {/* Indicador no Header */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              Enfermeiro Digital · Desempenho Clínico
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4 space-y-4">
        {/* Card do Perfil do Usuário com Foto, Nome e Status */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-colors">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="h-16 w-16 overflow-hidden rounded-2xl bg-teal-600 shadow-sm">
                {user?.photo_url ? (
                  <ImageComponent src={user.photo_url} fittingType="fill" className="h-full w-full" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white">
                    <UserCircle className="h-8 w-8" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white dark:border-slate-800 bg-teal-600 text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-50"
                title="Alterar foto"
              >
                {uploadingPhoto ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>

            <div className="min-w-0 flex-1">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveName()}
                    className="rounded-lg text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                    autoFocus
                  />
                  <Button type="button" size="icon" variant="outline" onClick={() => setEditingName(false)} disabled={savingName} className="shrink-0 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" size="icon" onClick={saveName} disabled={savingName || !nameValue.trim()} className="shrink-0 rounded-lg bg-teal-600 hover:bg-teal-700 text-white">
                    {savingName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate font-bold text-base text-slate-900 dark:text-slate-100">
                      {user?.full_name || "Estudante de Enfermagem"}
                    </h2>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setNameValue(user?.full_name || ""); setEditingName(true); }} className="shrink-0 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-slate-800 text-xs font-semibold">
                    Editar
                  </Button>
                </div>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 dark:bg-teal-950/60 px-2.5 py-0.5 text-[11px] font-bold text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  <ShieldCheck className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                  {profileLabel}
                </span>

                <span className="text-[11px] text-slate-400 dark:text-slate-400">
                  Membro desde {new Date(user?.created_at || Date.now()).getFullYear()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Abas Superiores de Navegação do Perfil */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(20);
              setActiveTab("stats");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "stats"
                ? "bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Estatísticas Clínicas</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(20);
              setActiveTab("settings");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "settings"
                ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Sliders className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <span>Ajustes & IA</span>
          </button>
        </div>

        {/* ABA 1: PERFIL & ESTATÍSTICAS CLÍNICAS */}
        {activeTab === "stats" && (
          <div className="space-y-4">
            {/* Grid 2x2 de Métricas Vitais de Desempenho Clínico */}
            <ClinicalStatsGrid
              solvedCases={gameState.solvedCases}
              accuracyRate={gameState.accuracyRate}
              safeDosagesCount={gameState.safeDosagesCount}
              sbarHandoffsCount={gameState.sbarHandoffsCount}
            />

            {/* Gráfico Semanal de Atividade */}
            <WeeklyActivityChart weeklyDays={gameState.weeklyDays} />
          </div>
        )}

        {/* ABA 2: AJUSTES, TEMAS & CHAVES DE INTELIGÊNCIA ARTIFICIAL */}
        {activeTab === "settings" && (
          <div className="space-y-4">
            {/* Alternar Perfil Aluno vs Professor */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 shadow-xs">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" /> Papel no Enfermeiro Digital
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Alterne seu modo de uso entre Estudante (responder tarefas e simulações) e Professor (gerenciar turmas e criar casos).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => _switchProfile("aluno")}
                  disabled={switching || user?.user_type === "aluno"}
                  className={`p-3 rounded-xl border text-center font-bold text-xs transition ${
                    user?.user_type === "aluno"
                      ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                      : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  Aluno de Enfermagem
                </button>
                <button
                  type="button"
                  onClick={() => _switchProfile("professor")}
                  disabled={switching || user?.user_type === "professor"}
                  className={`p-3 rounded-xl border text-center font-bold text-xs transition ${
                    user?.user_type === "professor"
                      ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                      : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  Professor Docente
                </button>
              </div>
            </div>

            {/* Card de Configuração de Aparência e Tema */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Sun className="h-4 w-4 text-amber-500" /> Aparência & Tema Visual
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
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
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold ring-2 ring-emerald-600/20'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 shrink-0">
                    <Sun className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Modo Claro</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Visual clássico & branco</span>
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
                      ? 'bg-slate-800 border-emerald-500 text-emerald-400 font-bold ring-2 ring-emerald-500/20'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-amber-400 shrink-0 border border-slate-700">
                    <Moon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Modo Escuro</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Padrão relaxante p/ olhos</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Card do Google Gemini AI */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400" /> Inteligência Artificial Clínica (Google Gemini)
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Conecte sua chave de API para raciocínio diagnóstico avançado e ilimitado com o Google Gemini.
                  </p>
                </div>
                {geminiKey ? (
                  <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Chave Ativa
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
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
                    className="rounded-xl text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                  />
                  <Button
                    type="button"
                    onClick={handleSaveGeminiKey}
                    disabled={testingGemini || (!geminiKeyInput.trim() && !geminiKey)}
                    className="shrink-0 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs px-3 font-semibold"
                  >
                    {testingGemini ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Salvar & Testar"}
                  </Button>
                </div>

                {geminiKey && (
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="h-3 w-3" /> Chave configurada com sucesso
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveGeminiKey}
                      className="text-rose-500 hover:underline"
                    >
                      Remover chave
                    </button>
                  </div>
                )}

                <p className="text-[11px] text-slate-400">
                  Não tem uma chave? Crie gratuitamente em segundos no{" "}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-600 dark:text-teal-400 hover:underline font-medium"
                  >
                    Google AI Studio ↗
                  </a>
                  . Se preferir não configurar, o Enfermeiro Digital usará o super motor clínico local.
                </p>
              </div>
            </div>

            {/* Card do AssemblyAI */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Mic className="h-4 w-4 text-teal-600 dark:text-teal-400" /> Transcrição de Voz (AssemblyAI)
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Modelo dedicado de reconhecimento de fala em português (pt-BR) para gravação de áudios longos e relatos à beira-leito.
                  </p>
                </div>
                {assemblyAIKey ? (
                  <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Chave Ativa
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
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
                    className="rounded-xl text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                  />
                  <Button
                    type="button"
                    onClick={handleSaveAssemblyAIKey}
                    disabled={testingAssemblyAI || (!assemblyAIKeyInput.trim() && !assemblyAIKey)}
                    className="shrink-0 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs px-3 font-semibold"
                  >
                    {testingAssemblyAI ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Salvar & Testar"}
                  </Button>
                </div>

                {assemblyAIKey && (
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="h-3 w-3" /> Transcrição AssemblyAI conectada com sucesso
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveAssemblyAIKey}
                      className="text-rose-500 hover:underline"
                    >
                      Remover chave
                    </button>
                  </div>
                )}

                <p className="text-[11px] text-slate-400">
                  Obtenha sua chave gratuita em{" "}
                  <a
                    href="https://www.assemblyai.com/dashboard/signup"
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-600 dark:text-teal-400 hover:underline font-medium"
                  >
                    AssemblyAI Dashboard ↗
                  </a>
                  . Se não configurar, a gravação utilizará o Google Gemini Multimodal Audio ou o reconhecimento nativo do navegador.
                </p>
              </div>
            </div>

            {/* Botão de Logout */}
            <Button
              onClick={handleLogout}
              disabled={busy}
              variant="destructive"
              className="w-full rounded-xl font-bold py-3"
            >
              {busy ? (
                "Saindo..."
              ) : (
                <>
                  <LogOut className="h-4 w-4" /> Sair da conta
                </>
              )}
            </Button>
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-2xl px-4 py-4 text-center">
        <p className="text-[11px] text-slate-400 dark:text-slate-400">
          © 2026 Marcos Manoel Tavares Neumann — Criador e detentor dos direitos da plataforma Enfermeiro Digital
        </p>
      </footer>

      {pendingFile && (
        <PhotoCropper
          file={pendingFile}
          onConfirm={uploadCroppedPhoto}
          onCancel={() => setPendingFile(null)}
        />
      )}
    </div>
  );
}
