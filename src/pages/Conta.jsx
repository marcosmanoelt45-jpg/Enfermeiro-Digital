import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  User,
  Loader2,
  Camera,
  Check,
  Sparkles,
  Flame,
  Snowflake,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import PhotoCropper from "@/components/PhotoCropper";
import StudentHeader from "@/components/StudentHeader";
import MobileBottomDock from "@/components/mobile/MobileBottomDock";

// Componentes de Estatísticas Clínicas Formativas
import { clinicalGamificationService } from "@/services/clinicalGamificationService";
import { clinicalHistoryService } from "@/services/clinicalHistoryService";
import WeeklyActivityChart from "@/components/profile/WeeklyActivityChart";
import GotiStudyPointsModal from "@/components/mascot/GotiStudyPointsModal";
import HistoricoAtividadesTab from "@/components/profile/HistoricoAtividadesTab";

export default function Conta() {
  const { user, logout, checkUserAuth } = useAuth();
  const { triggerHaptic } = useTheme();
  const navigate = useNavigate();

  // Estado da Gamificação Clínica
  const [gameState, setGameState] = useState(() => clinicalGamificationService.getState(user?.id));
  const [showPeModal, setShowPeModal] = useState(false);

  // Controle do acordeão de dedicação semanal
  const [openDedication, setOpenDedication] = useState(true);
  const [perfilTab, setPerfilTab] = useState("visao_geral"); // "visao_geral" | "historico"

  const refreshGameState = () => {
    setGameState(clinicalGamificationService.getState(user?.id));
  };

  useEffect(() => {
    refreshGameState();
  }, [user?.id]);

  const [busy, setBusy] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.full_name || "");
  const [savingName, setSavingName] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const fileRef = useRef(null);





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

        {/* Abas Estilo Plurall / TRT-4: Visão Geral e Histórico */}
        <div className="flex border-b border-[#1F3045] gap-2 pt-1 pb-1">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              setPerfilTab("visao_geral");
            }}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              perfilTab === "visao_geral"
                ? "border-[#20D5B5] text-[#20D5B5]"
                : "border-transparent text-[#9FB3C6] hover:text-white"
            }`}
          >
            Visão Geral
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              setPerfilTab("historico");
            }}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              perfilTab === "historico"
                ? "border-[#20D5B5] text-[#20D5B5]"
                : "border-transparent text-[#9FB3C6] hover:text-white"
            }`}
          >
            Histórico de Atividades
          </button>
        </div>

        {perfilTab === "historico" && (
          <HistoricoAtividadesTab userId={user?.id} />
        )}

        {perfilTab === "visao_geral" && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* Informações Clínicas Reais do Estudante */}
          {/* Card de Dias Seguidos (Streak) */}
          <div className="rounded-2xl border border-[#FFC247]/40 bg-[#0E1722] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Flame className="w-7 h-7 text-[#FFC247] shrink-0 fill-[#FFC247]" />
              <div>
                <h3 className="text-sm font-black text-[#FFC247]">
                  {gameState.streak ?? 0} dias seguidos
                </h3>
                <p className="text-[11px] text-[#9FB3C6]">
                  Recorde: {gameState.bestStreak ?? 0} dias · {gameState.streakFreezeAvailable ?? 1} congelamento{(gameState.streakFreezeAvailable || 1) !== 1 ? "s" : ""} disponível
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
              {gameState.studyPoints ?? gameState.totalXp ?? 0} PE
            </button>
          </div>

          {/* Grid 2x2 com as Métricas Individuais Reais da Conta */}
          {(() => {
            const userActivities = clinicalHistoryService.getAllActivities("all", user?.id);
            const summaryStats = clinicalHistoryService.getSummaryStats(user?.id);
            const realCasesCount = userActivities.length || gameState.solvedCases || 0;
            const realAccuracy = userActivities.length > 0
              ? summaryStats.avgScore
              : (gameState.solvedCases > 0 ? (gameState.accuracyRate || 0) : 0);
            const levelInfo = clinicalGamificationService.getLevelInfo(gameState.studyPoints ?? gameState.totalXp ?? 0);
            const weeklyPeTotal = (gameState.weeklyDays || []).reduce((acc, d) => acc + (Number(d.xp) || 0), 0);
            const activeWeeklyDays = (gameState.weeklyDays || []).filter((d) => d.completed || (Number(d.xp) || 0) > 0).length;

            return (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-4 space-y-1">
                    <div className="text-2xl font-black text-[#20D5B5]">
                      {realCasesCount}
                    </div>
                    <div className="text-xs font-semibold text-[#9FB3C6]">
                      Atividades concluídas
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-4 space-y-1">
                    <div className="text-2xl font-black text-[#20D5B5]">
                      {`${realAccuracy}%`}
                    </div>
                    <div className="text-xs font-semibold text-[#9FB3C6]">
                      Acurácia diagnóstica
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-4 space-y-1">
                    <div className="text-2xl font-black text-[#FFC247]">
                      {gameState.streak || 0}
                    </div>
                    <div className="text-xs font-semibold text-[#9FB3C6]">
                      Dias de ofensiva
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-4 space-y-1">
                    <div className="text-2xl font-black text-[#20D5B5]">
                      {gameState.acertosSeguidos || 0}
                    </div>
                    <div className="text-xs font-semibold text-[#9FB3C6]">
                      Acertos seguidos
                    </div>
                  </div>
                </div>

                {/* Card de Nível do Estudante (Real por Conta) */}
                <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-black text-[#20D5B5] uppercase tracking-wide">
                      NÍVEL {levelInfo.current.level} · {levelInfo.current.title}
                    </div>
                    <span className="text-[11px] font-bold text-[#9FB3C6]">
                      {levelInfo.next
                        ? `Faltam ${levelInfo.xpToNext} PE p/ Nível ${levelInfo.next.level}`
                        : "Nível Máximo"}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#0E1722] overflow-hidden">
                    <div
                      className="h-full bg-[#20D5B5] rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(4, levelInfo.progressPercent)}%` }}
                    />
                  </div>
                </div>

                {/* Dedicação semanal com dados de atividade real */}
                <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(15);
                      setOpenDedication((prev) => !prev);
                    }}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-[#16222E] transition"
                  >
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-white">
                        Dedicação semanal
                      </div>
                      <div className="text-[11px] text-[#9FB3C6]">
                        {weeklyPeTotal} PE nos últimos 7 dias · {activeWeeklyDays}/7 dias ativos
                      </div>
                    </div>
                    {openDedication ? (
                      <ChevronUp className="w-4 h-4 text-[#9FB3C6]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#9FB3C6]" />
                    )}
                  </button>
                  {openDedication && (
                    <div className="p-4 pt-0 border-t border-[#1F3045]/60">
                      <WeeklyActivityChart weeklyDays={gameState.weeklyDays} />
                    </div>
                  )}
                </div>
              </>
            );
          })()}

          {/* Card de Congelamento de Plantão (Informativo, sem compra) */}
          <div className="pt-1">
            <div className="rounded-2xl border border-[#1F3045] bg-[#0E1722] p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-950/60 border border-sky-800 text-sky-400 flex items-center justify-center shrink-0">
                  <Snowflake className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white flex items-center gap-2">
                    Congelamento de Plantão
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-900/60 text-sky-300">
                      {gameState.streakFreezeAvailable || 0} disponível{(gameState.streakFreezeAvailable || 0) !== 1 ? "is" : ""}
                    </span>
                  </h5>
                  <p className="text-[11px] text-[#9FB3C6] mt-0.5">
                    Fique 1 dia sem atividade sem perder sua contagem de dias seguidos na escala clínica.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

          {/* Ações da Conta: Rever Splash & Sair */}
          <div className="space-y-3 pt-3">
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
