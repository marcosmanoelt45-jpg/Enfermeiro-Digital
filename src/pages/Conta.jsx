import React, { useState, useEffect, useMemo } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Check,
  Trophy,
  UserPlus,
  Flame,
  Snowflake,
  ChevronDown,
  ChevronUp,
  Pencil,
  AlertTriangle,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ClinicalOptionsModal from "@/components/mobile/ClinicalOptionsModal";
import { SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
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
import SecaoOfensivasAmigos from "@/features/amigos/SecaoOfensivasAmigos.jsx";
import { flagAtiva } from "@/features/flags";
import AvatarPessoa from "@/features/avatar/AvatarPessoa.jsx";
import { CORES_FUNDO } from "@/features/avatar/pecas.js";
import { useMeuAvatar } from "@/features/avatar/meuAvatar.js";
import { atualizarMeuPerfil } from "@/features/social/servicoSocial.js";
import { EVENTO_SINCRONIZADO } from "@/features/conta/sincronizacao.js";
import PrivacidadeESom from "@/features/conta/PrivacidadeESom.jsx";
import { souAdmin } from "@/features/admin/servicoAdmin.js";

import LojaPE from "@/features/pontos/LojaPE.jsx";

// Aba Social do Perfil: carrega só quando aberta (pódio, avatares e amigos não pesam o perfil).
const SocialConteudo = React.lazy(() => import("@/features/social/SocialConteudo.jsx"));

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
  // Link da administração: o servidor decide (tabela admins); aqui só se esconde para os demais.
  const [ehAdmin, setEhAdmin] = useState(false);
  useEffect(() => {
    let vivo = true;
    if (user?.id) souAdmin().then((ok) => vivo && setEhAdmin(ok));
    return () => {
      vivo = false;
    };
  }, [user?.id]);

  // Controle do acordeão de dedicação semanal
  const [openDedication, setOpenDedication] = useState(true);
  const [perfilTab, setPerfilTab] = useState("visao_geral"); // "visao_geral" | "historico" | "social"

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
    window.addEventListener(EVENTO_SINCRONIZADO, refreshGameState);
    document.addEventListener("visibilitychange", handleFocusOrVisible);
    return () => {
      window.removeEventListener("focus", handleFocusOrVisible);
      window.removeEventListener(EVENTO_SINCRONIZADO, refreshGameState);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
    };
  }, [user?.id]);

  const [busy, setBusy] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.full_name || "");
  const [savingName, setSavingName] = useState(false);
  const { avatar: meuAvatar, montado: avatarMontado } = useMeuAvatar(user?.id);

  // profile-8: Estatísticas resumidas oficiais de histórico real memoizadas
  const summaryStats = useMemo(() => {
    return clinicalHistoryService.getSummaryStats(user?.id);
  }, [user?.id, gameState]);

  const levelInfo = useMemo(() => {
    // nível pelo total já ganho: gastar PE na loja não baixa o nível
    const points = gameState?.totalXp ?? gameState?.studyPoints ?? 0;
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
      atualizarMeuPerfil({ nome: newName }).catch(() => {}); // amigos e pódio veem o nome novo
      await checkUserAuth();
      toast({ title: "Nome atualizado", description: "Seu nome foi atualizado com sucesso." });
      setEditingName(false);
    } catch (err) {
      toast({ title: "Erro ao salvar nome", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setSavingName(false);
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
        {/* Cabeçalho do perfil: o avatar grande no fundo que a pessoa escolheu, nome, nível e atalhos. */}
        <section className="overflow-hidden rounded-3xl border-2 border-[#27394B]" aria-label="Seu perfil">
          <div className="relative flex justify-center pt-6" style={{ background: CORES_FUNDO[meuAvatar.fundo] }}>
            {/* flex: o avatar (inline-block) deixava embaixo o espaço da linha de texto, uma faixa entre o
                personagem e o resto do cartão */}
            <motion.div
              className="flex"
              initial={{ opacity: 0, transform: "translateY(10px)" }}
              animate={{ opacity: 1, transform: "translateY(0px)", transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } }}
            >
              <AvatarPessoa avatar={meuAvatar} nome={user?.full_name} tamanho={176} semFundo titulo="Seu avatar" />
            </motion.div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => navigate("/avatar")}
              className="absolute right-3 top-3 bg-[#0B131D]/70 backdrop-blur-sm"
            >
              <Pencil className="h-3.5 w-3.5" /> {avatarMontado ? "Editar avatar" : "Montar meu avatar"}
            </Button>
          </div>

          <div className="bg-[#131F2E] p-4">
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveName()}
                  className="h-10 rounded-xl border-[#1F3045] bg-[#0B131D] text-sm text-white"
                  maxLength={40}
                  aria-label="Seu nome"
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
                  className="h-10 w-10 shrink-0"
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-black text-white">{user?.full_name || "Estudante de Enfermagem"}</h1>
                  <p className="mt-0.5 text-xs font-semibold text-[#9FB3C6]">
                    Nv {levelInfo.current.level} · {levelInfo.current.title} · no Enfere desde {new Date(user?.created_at || Date.now()).getFullYear()}
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
                  className="h-8 shrink-0 px-2.5 text-xs font-bold text-[#20D5B5]"
                >
                  <Pencil className="mr-1 h-3.5 w-3.5" /> Nome
                </Button>
              </div>
            )}

            {flagAtiva("social") && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  setPerfilTab("social");
                  document.getElementById("tab-social")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="mt-3 flex w-full items-center gap-3 rounded-2xl border-2 border-[#27394B] bg-[#0B131D] px-3 py-2.5 text-left transition-colors duration-150 hover:border-[#20D5B5]/60"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFC247]/15 text-[#FFC247]">
                  <Trophy className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-black text-white">Amigos e pódio</span>
                  <span className="block text-xs font-semibold text-[#9FB3C6]">Convide colegas e veja quem está com a maior ofensiva</span>
                </span>
                <UserPlus className="h-5 w-5 text-[#20D5B5]" aria-hidden="true" />
              </button>
            )}

            {ehAdmin && (
              <button
                type="button"
                onClick={() => navigate("/admin")}
                className="mt-3 flex w-full items-center gap-3 rounded-2xl border-2 border-[#27394B] bg-[#0B131D] px-3 py-2.5 text-left transition-colors duration-150 hover:border-[#20D5B5]/60"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#20D5B5]/15 text-[#20D5B5]">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-black text-white">Administração</span>
                  <span className="block text-xs font-semibold text-[#9FB3C6]">Contas, histórico e exclusão</span>
                </span>
                <ChevronRight className="h-5 w-5 text-[#20D5B5]" aria-hidden="true" />
              </button>
            )}
          </div>
        </section>

        {/* Abas com Semântica Acessível e Indicador Deslizante (profile-15 & Redesign) */}
        <div role="tablist" aria-label="Navegação do perfil" className="no-scrollbar relative flex gap-1 overflow-x-auto whitespace-nowrap border-b border-[#1F3045] pb-1 pt-1 [&>button]:shrink-0 [&>button]:px-3">
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
            Histórico
            {perfilTab === "historico" && (
              <motion.span
                layoutId="perfil-tab-indicator"
                transition={spring.glide}
                className="absolute bottom-0 inset-x-0 h-0.5 bg-[#20D5B5] rounded-full"
              />
            )}
          </button>

          <button
            role="tab"
            id="tab-loja"
            aria-selected={perfilTab === "loja"}
            aria-controls="panel-loja"
            type="button"
            onClick={() => {
              triggerHaptic(10);
              setPerfilTab("loja");
            }}
            className={`relative px-4 py-2.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer select-none ${
              perfilTab === "loja" ? "text-[#20D5B5]" : "text-[#9FB3C6] hover:text-white"
            }`}
          >
            Loja
            {perfilTab === "loja" && (
              <motion.span
                layoutId="perfil-tab-indicator"
                transition={spring.glide}
                className="absolute bottom-0 inset-x-0 h-0.5 bg-[#20D5B5] rounded-full"
              />
            )}
          </button>

          {flagAtiva("social") && (
            <button
              role="tab"
              id="tab-social"
              aria-selected={perfilTab === "social"}
              aria-controls="panel-social"
              type="button"
              onClick={() => {
                triggerHaptic(10);
                setPerfilTab("social");
              }}
              className={`relative px-4 py-2.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer select-none ${
                perfilTab === "social" ? "text-[#20D5B5]" : "text-[#9FB3C6] hover:text-white"
              }`}
            >
              Social
              {perfilTab === "social" && (
                <motion.span
                  layoutId="perfil-tab-indicator"
                  transition={spring.glide}
                  className="absolute bottom-0 inset-x-0 h-0.5 bg-[#20D5B5] rounded-full"
                />
              )}
            </button>
          )}
        </div>

        {/* Loja de PE: bloqueio de ofensiva e PE em dobro */}
        <div role="tabpanel" id="panel-loja" aria-labelledby="tab-loja" hidden={perfilTab !== "loja"}>
          {perfilTab === "loja" && <LojaPE userId={user?.id} onMudou={(s) => setGameState(s)} />}
        </div>

        {/* Social: pódio e amigos (o mesmo conteúdo da página /social) */}
        <div role="tabpanel" id="panel-social" aria-labelledby="tab-social" hidden={perfilTab !== "social"}>
          {perfilTab === "social" && (
            <React.Suspense fallback={<p className="py-8 text-center text-sm font-bold text-[#9FB3C6]">Carregando…</p>}>
              <SocialConteudo />
            </React.Suspense>
          )}
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
            // initial={false}: a Visão Geral aparece pronta junto com o resto do perfil. A entrada em cascata
            // (cada cartão começando invisível, um depois do outro) fazia ela parecer carregar depois.
            <motion.div
              variants={listStagger}
              initial={false}
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

              {/* Ofensivas com amigos: atrás da chave `amigos` até o servidor do multiplayer existir. */}
              {flagAtiva("amigos") && (
                <motion.div variants={fadeUp}>
                  <SecaoOfensivasAmigos
                    itens={[]}
                    onConvidar={() => toast({ title: "Amigos chegam na próxima atualização", description: "Logo você poderá convidar colegas e manter a ofensiva juntos." })}
                  />
                </motion.div>
              )}

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

        {/* Ações da Conta: privacidade e som, Ajustes e Sair */}
        <div className="space-y-3 pt-3">
          <PrivacidadeESom comSocial={flagAtiva("social")} />
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
