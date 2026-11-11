import React, { useState, useRef, useEffect, useMemo } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
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
  Flame,
  Snowflake,
  ChevronDown,
  ChevronUp,
  Pencil,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ClinicalOptionsModal from "@/components/mobile/ClinicalOptionsModal";
import { SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import PhotoCropper from "@/components/PhotoCropper";
import StudentHeader from "@/components/StudentHeader";
import MobileBottomDock from "@/components/mobile/MobileBottomDock";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { AnimatedProgress } from "@/components/ui/animated-progress";
import { listStagger, fadeUp, spring } from "@/lib/motion";

// Componentes de Estatísticas Clínicas Formativas
import { clinicalGamificationService } from "@/services/clinicalGamificationService";
import { clinicalHistoryService } from "@/services/clinicalHistoryService";
import WeeklyActivityChart from "@/components/profile/WeeklyActivityChart";
import GotiStudyPointsModal from "@/components/mascot/GotiStudyPointsModal";
import HistoricoAtividadesTab from "@/components/profile/HistoricoAtividadesTab";

// Helper de pluralização PT-BR (profile-7)
const plural = (n, singular, pluralForm) => (n === 1 ? singular : pluralForm);

export default function Conta() {
  const { user, logout, checkUserAuth } = useAuth();
  const { triggerHaptic } = useTheme();
  const navigate = useNavigate();

  // Estado da Gamificação Clínica
  const [gameState, setGameState] = useState(() => clinicalGamificationService.getState(user?.id));
  const [showPeModal, setShowPeModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAjustes, setShowAjustes] = useState(false);

  // Controle do acordeão de dedicação semanal
  const [openDedication, setOpenDedication] = useState(true);
  const [perfilTab, setPerfilTab] = useState("visao_geral"); // "visao_geral" | "historico"

  const refreshGameState = () => {
    if (user?.id) {
      setGameState(clinicalGamificationService.getState(user.id));
    }
  };

  // profile-14: Atualiza ao mudar user?.id e quando a janela volta ao foco / visibilidade
  useEffect(() => {
    refreshGameState();

    const handleFocusOrVisible = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        refreshGameState();
      }
    };

    window.addEventListener("focus", handleFocusOrVisible);
    document.addEventListener("visibilitychange", handleFocusOrVisible);
    return () => {
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
    };
  }, [user?.id]);

  const [busy, setBusy] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.full_name || "");
  const [savingName, setSavingName] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const fileRef = useRef(null);

  // profile-8: Estatísticas resumidas oficiais de histórico real memoizadas
  const summaryStats = useMemo(() => {
    return clinicalHistoryService.getSummaryStats(user?.id);
  }, [user?.id, gameState]);

  const levelInfo = useMemo(() => {
    const points = gameState?.studyPoints ?? gameState?.totalXp ?? 0;
    return clinicalGamificationService.getLevelInfo(points);
  }, [gameState]);

  const weeklyPeTotal = useMemo(() => {
    return (gameState?.weeklyDays || []).reduce((acc, d) => acc + (Number(d.xp) || 0), 0);
  }, [gameState?.weeklyDays]);

  const activeWeeklyDays = useMemo(() => {
    return (gameState?.weeklyDays || []).filter((d) => d.completed || (Number(d.xp) || 0) > 0).length;
  }, [gameState?.weeklyDays]);

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
      setShowLogoutConfirm(false);
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

  const freezeCount = gameState?.streakFreezeAvailable ?? 0;

  return (
    <div className="min-h-screen bg-[#0B131D] text-[#EAF2F8] pb-28 md:pb-8 flex flex-col">
      {/* Header Desktop */}
      <div className="hidden md:block">
        <StudentHeader activeTab="perfil" />
      </div>

      <main className="flex-1 mx-auto max-w-xl md:max-w-2xl w-full px-4 sm:px-6 py-4 space-y-4">
        {/* Título "Perfil" */}
        <h1 className="text-xl sm:text-2xl font-black text-white pt-1">
          Perfil
        </h1>

        {/* Card de Identidade do Estudante (profile-15 & Redesign) */}
        <div className="rounded-2xl border border-[#1F3045] bg-[#0E1722] p-4 flex items-center gap-3.5 shadow-sm">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-[#20D5B5] ring-2 ring-[#20D5B5]/40 flex items-center justify-center text-[#0B131D] shadow-sm overflow-hidden">
              {user?.photo_url ? (
                <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-7 h-7 text-[#0B131D]" />
              )}
            </div>
            {/* profile-15: touch target de 44px com after:inset e aria-label acessível */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingPhoto}
              aria-label="Alterar foto de perfil"
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-[#1F3045] bg-[#131F2E] text-white hover:text-[#20D5B5] transition disabled:opacity-50 after:absolute after:-inset-2 cursor-pointer"
            >
              {uploadingPhoto ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
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
                  className="rounded-xl text-xs bg-[#131F2E] border-[#1F3045] text-white h-9"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="primary"
                  size="icon"
                  onClick={saveName}
                  disabled={savingName || !nameValue.trim()}
                  loading={savingName}
                  aria-label="Salvar nome"
                  className="h-9 w-9 shrink-0"
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-black text-white truncate">
                      {user?.full_name || "Estudante de Enfermagem"}
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#20D5B5]/15 text-[#20D5B5] border border-[#20D5B5]/30">
                      Nv {levelInfo.current.level} · {levelInfo.current.title}
                    </span>
                  </div>
                  <p className="text-xs text-[#9FB3C6] truncate mt-0.5">
                    Membro desde {new Date(user?.created_at || Date.now()).getFullYear()}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setNameValue(user?.full_name || "");
                    setEditingName(true);
                  }}
                  className="text-xs font-bold text-[#20D5B5] shrink-0 h-8 px-2.5"
                >
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Abas com Semântica Acessível e Indicador Deslizante (profile-15 & Redesign) */}
        <div role="tablist" aria-label="Navegação do perfil" className="flex border-b border-[#1F3045] gap-2 pt-1 pb-1 relative">
          <button
            role="tab"
            id="tab-visao-geral"
            aria-selected={perfilTab === "visao_geral"}
            aria-controls="panel-visao-geral"
            type="button"
            onClick={() => {
              triggerHaptic(10);
              setPerfilTab("visao_geral");
            }}
            className={`relative px-4 py-2.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer select-none ${
              perfilTab === "visao_geral" ? "text-[#20D5B5]" : "text-[#9FB3C6] hover:text-white"
            }`}
          >
            Visão Geral
            {perfilTab === "visao_geral" && (
              <motion.span
                layoutId="perfil-tab-indicator"
                transition={spring.glide}
                className="absolute bottom-0 inset-x-0 h-0.5 bg-[#20D5B5] rounded-full"
              />
            )}
          </button>

          <button
            role="tab"
            id="tab-historico"
            aria-selected={perfilTab === "historico"}
            aria-controls="panel-historico"
            type="button"
            onClick={() => {
              triggerHaptic(10);
              setPerfilTab("historico");
            }}
            className={`relative px-4 py-2.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer select-none ${
              perfilTab === "historico" ? "text-[#20D5B5]" : "text-[#9FB3C6] hover:text-white"
            }`}
          >
            Histórico de Atividades
            {perfilTab === "historico" && (
              <motion.span
                layoutId="perfil-tab-indicator"
                transition={spring.glide}
                className="absolute bottom-0 inset-x-0 h-0.5 bg-[#20D5B5] rounded-full"
              />
            )}
          </button>
        </div>

        {/* Painel do Histórico de Atividades */}
        <div
          role="tabpanel"
          id="panel-historico"
          aria-labelledby="tab-historico"
          hidden={perfilTab !== "historico"}
        >
          {perfilTab === "historico" && (
            <HistoricoAtividadesTab userId={user?.id} />
          )}
        </div>

        {/* Painel de Visão Geral com Stagger Animation */}
        <div
          role="tabpanel"
          id="panel-visao-geral"
          aria-labelledby="tab-visao-geral"
          hidden={perfilTab !== "visao_geral"}
        >
          {perfilTab === "visao_geral" && (
            <motion.div
              variants={listStagger}
              initial="hidden"
              animate="show"
              className="space-y-3.5"
            >
              {/* Card de Dias Seguidos (Streak Hero) */}
              <motion.div
                variants={fadeUp}
                className="rounded-2xl border border-[#FFC247]/40 bg-[#0E1722] p-4 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Flame className="w-8 h-8 text-[#FFC247] shrink-0 fill-[#FFC247]" />
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-[#FFC247]">
                      <AnimatedNumber value={gameState?.streak ?? 0} /> dias seguidos
                    </h3>
                    <p className="text-[11px] text-[#9FB3C6]">
                      Recorde: <AnimatedNumber value={gameState?.bestStreak ?? 0} /> dias ·{" "}
                      {freezeCount} {plural(freezeCount, "congelamento disponível", "congelamentos disponíveis")}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    triggerHaptic(15);
                    setShowPeModal(true);
                  }}
                  className="border-[#FFC247]/40 text-[#FFC247] font-black hover:bg-[#FFC247]/10 h-8"
                >
                  <AnimatedNumber value={gameState?.studyPoints ?? gameState?.totalXp ?? 0} /> PE
                </Button>
              </motion.div>

              {/* Grid 2x2 com as Métricas Individuais Reais (profile-8: Nota média e Atividades concluídas) */}
              <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-4 space-y-1">
                  <div className="text-2xl font-black text-[#20D5B5]">
                    <AnimatedNumber value={summaryStats.completedCount} />
                  </div>
                  <div className="text-xs font-semibold text-[#9FB3C6]">
                    Atividades concluídas
                  </div>
                </div>

                <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-4 space-y-1">
                  <div className="text-2xl font-black text-[#20D5B5]">
                    {summaryStats.completedCount > 0 ? `${summaryStats.avgScore}%` : "—"}
                  </div>
                  <div className="text-xs font-semibold text-[#9FB3C6]">
                    Nota média
                  </div>
                </div>

                <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-4 space-y-1">
                  <div className="text-2xl font-black text-[#FFC247]">
                    <AnimatedNumber value={gameState?.streak || 0} />
                  </div>
                  <div className="text-xs font-semibold text-[#9FB3C6]">
                    Dias de ofensiva
                  </div>
                </div>

                <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-4 space-y-1">
                  <div className="text-2xl font-black text-[#20D5B5]">
                    <AnimatedNumber value={gameState?.acertosSeguidos || 0} />
                  </div>
                  <div className="text-xs font-semibold text-[#9FB3C6]">
                    Acertos seguidos
                  </div>
                </div>
              </motion.div>

              {/* Card de Nível do Estudante com AnimatedProgress (profile-16) */}
              <motion.div variants={fadeUp} className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-black text-[#20D5B5]">
                    NÍVEL {levelInfo.current.level} · {levelInfo.current.title}
                  </div>
                  <span className="text-[11px] font-bold text-[#9FB3C6]">
                    {levelInfo.next ? (
                      <>Faltam <AnimatedNumber value={levelInfo.xpToNext} /> PE p/ Nível {levelInfo.next.level}</>
                    ) : (
                      "Nível Máximo"
                    )}
                  </span>
                </div>
                <div className="pt-1">
                  <AnimatedProgress
                    value={levelInfo.progressPercent}
                    minVisible={4}
                    tone="brand"
                    label="Progresso para o próximo nível Nightingale"
                  />
                </div>
              </motion.div>

              {/* Dedicação semanal com dados de atividade real e acordeão acessível (profile-11) */}
              <motion.div variants={fadeUp} className="rounded-2xl border border-[#1F3045] bg-[#131F2E] overflow-hidden">
                <button
                  type="button"
                  aria-expanded={openDedication}
                  aria-controls="dedication-content"
                  onClick={() => {
                    triggerHaptic(15);
                    setOpenDedication((prev) => !prev);
                  }}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-[#16222E] transition cursor-pointer"
                >
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-white">
                      Dedicação semanal
                    </div>
                    <div className="text-[11px] text-[#9FB3C6]">
                      <AnimatedNumber value={weeklyPeTotal} /> PE nos últimos 7 dias · {activeWeeklyDays}/7 dias ativos
                    </div>
                  </div>
                  {openDedication ? (
                    <ChevronUp className="w-4 h-4 text-[#9FB3C6]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#9FB3C6]" />
                  )}
                </button>
                {openDedication && (
                  <div id="dedication-content" className="p-4 pt-0 border-t border-[#1F3045]/60">
                    <WeeklyActivityChart weeklyDays={gameState?.weeklyDays} />
                  </div>
                )}
              </motion.div>

              {/* Card de Congelamento de Plantão (profile-7 & profile-15: sem pulse infinito) */}
              <motion.div variants={fadeUp} className="pt-1">
                <div className="rounded-2xl border border-[#1F3045] bg-[#0E1722] p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-950/60 border border-sky-800 text-sky-400 flex items-center justify-center shrink-0">
                      <Snowflake className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white flex items-center gap-2">
                        Congelamento de Plantão
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-900/60 text-sky-300">
                          {freezeCount} {plural(freezeCount, "disponível", "disponíveis")}
                        </span>
                      </h5>
                      <p className="text-[11px] text-[#9FB3C6] mt-0.5">
                        Fique 1 dia sem atividade sem perder sua contagem de dias seguidos na escala clínica.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* Ações da Conta: Ajustes e Sair */}
        <div className="space-y-3 pt-3">
          {/* Ajustes de leitura, plantão noturno e toque: antes só existiam numa gaveta que nunca abria. */}
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => setShowAjustes(true)}
            className="w-full text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
          >
            <SlidersHorizontal className="h-4 w-4 text-[#20D5B5]" />
            <span>Ajustes (leitura, plantão noturno e toque)</span>
          </Button>

          <Button
            type="button"
            variant="danger"
            size="lg"
            onClick={() => setShowLogoutConfirm(true)}
            disabled={busy}
            loading={busy}
            className="w-full text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair da conta</span>
          </Button>
        </div>
        <ClinicalOptionsModal isOpen={showAjustes} onClose={() => setShowAjustes(false)} />
      </main>

      <footer className="mx-auto max-w-2xl px-4 py-4 text-center">
        <p className="text-[11px] text-[#9FB3C6]/60">
          © 2026 Marcos Manoel Tavares Neumann — Criador e detentor dos direitos da plataforma Enfere
        </p>
      </footer>

      {/* Modal de Confirmação de Logout */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-[#0E1722] border border-[#1F3045] rounded-3xl p-6 text-[#EAF2F8] shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-[#FF6B6B]">
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Encerrar Sessão</h3>
                  <p className="text-xs text-[#9FB3C6]">Deseja realmente sair da sua conta?</p>
                </div>
              </div>
              <p className="text-xs text-[#9FB3C6] leading-relaxed">
                Seus pontos PE, ofensiva e histórico continuam salvos com segurança.
              </p>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleLogout}
                  loading={busy}
                >
                  Sim, Sair
                </Button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

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
