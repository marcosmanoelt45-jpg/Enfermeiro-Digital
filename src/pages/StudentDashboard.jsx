import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Calculator,
  Stethoscope,
  Users,
  PlusCircle,
  Mic,
  ArrowRightLeft,
  Search,
  FolderPlus,
  X,
  Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import StudentHeader from "@/components/StudentHeader";
import StudentFooter from "@/components/StudentFooter";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";

// Componentes Móveis Estilo Orizon Verde e Branco / Dark Mode
import MobileHeader from "@/components/mobile/MobileHeader";
import HeroCourseCard from "@/components/mobile/HeroCourseCard";
import ClinicalOptionsModal from "@/components/mobile/ClinicalOptionsModal";
import ClinicalModuleCard from "@/components/mobile/ClinicalModuleCard";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { triggerHaptic } = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);

  const cleanUserName = user?.name ? user.name.split(" ")[0] : (user?.full_name ? user.full_name.split(" ")[0] : "");
  const isGeneric = !cleanUserName || ['estudante', 'enfermeiro', 'aluno', 'professor'].includes(cleanUserName.toLowerCase());
  const greetingName = isGeneric ? '' : cleanUserName;
  const isProfessor = user?.user_type === "professor";

  // Configuração Automática do Hero Card
  const heroCardConfig = useMemo(() => ({
    title: "Processo de Enfermagem Completo",
    subtitle: "5 Etapas COFEN nº 736/2024 & NANDA-I • Raciocínio Diagnóstico",
    progressPercent: 75,
    actionText: isProfessor ? "Ver Minhas Turmas" : "Iniciar Caso Clínico",
    actionTo: isProfessor ? "/turmas" : "/simulador-casos",
    timeEstimate: "15 min",
    competencyTag: "COFEN nº 736/2024 • NANDA-I / NIC / NOC",
    badgeText: isProfessor ? "Ambiente Docente" : "Trilha Principal",
    desktopSub: isProfessor
      ? "Painel Docente • Gestão de Turmas e Casos Clínicos"
      : "Painel do Aluno • Prática Baseada em Evidências",
    desktopDesc: isProfessor
      ? "Crie e gerencie turmas de enfermagem, acompanhe o desempenho dos alunos e publique novos casos clínicos e questões para as turmas."
      : "Monte casos clínicos com escores validados (Braden, CAM, CALOI, SAK) ou explore simulações formativas com o Processo de Enfermagem nas 5 etapas normatizadas pelo COFEN e taxonomias NANDA-I/NIC/NOC."
  }), [isProfessor]);

  // Definição Completa dos Módulos Clínicos (Cada um com sua diretriz metodológica nativa automática)
  const learningModules = useMemo(() => [
    {
      id: "casos",
      category: "cofen",
      title: "Simulador de Casos Clínicos",
      subtitle: "Processo de Enfermagem & Raciocínio Clínico",
      description: "Pratique o raciocínio diagnóstico nas 5 etapas do PE (COFEN 736/2024) com taxonomias NANDA-I, NIC e NOC e julgamento clínico.",
      icon: BookOpen,
      path: "/simulador-casos",
      tag: "COFEN nº 736 • NANDA-I",
      time: "15 min",
      badgeText: "5 Etapas Normatizadas",
      stats: "Avaliação, Diagnóstico e Metas",
      featured: true
    },
    {
      id: "sbar",
      category: "sbar",
      title: "Passagem de Plantão SBAR",
      subtitle: "Comunicação Segura & Tutoria Florence",
      description: "Treine a técnica SBAR (Situação, Breve Histórico, Avaliação, Recomendação) por voz ou texto, com debriefing socrático da Tutora Florence.",
      icon: ArrowRightLeft,
      path: "/passagem-plantao",
      tag: "Meta 2 OMS • SBAR Áudio",
      time: "8 min",
      badgeText: "Tutoria IA Florence",
      stats: "Áudio • Debriefing • PDF",
      featured: true
    },
    {
      id: "calculos",
      category: "doses",
      title: "Laboratório de Cálculo de Doses",
      subtitle: "Farmacologia Clínica",
      description: "Domine gotejamento de macrogotas, microgotas, infusões em minutos e diluição de antibióticos com feedback estruturado.",
      icon: Calculator,
      path: "/laboratorio-calculos",
      tag: "Segurança Medicamentosa",
      time: "5 min",
      badgeText: "4 Modos",
      stats: "Macrogotas • Microgotas • Diluições"
    },
    {
      id: "sistemas",
      category: "semiologia",
      title: "Semiologia por Sistemas",
      subtitle: "Exame Físico Céfalo-Caudal",
      description: "Identifique achados normais e sinais de alarme em neurologia, respiração, cardiologia e tegumentar.",
      icon: Stethoscope,
      path: "/sistemas-organicos",
      tag: "Exame Físico",
      time: "10 min",
      badgeText: "Céfalo-Caudal",
      stats: "Glasgow • Braden • Ausculta"
    },
    {
      id: "montar",
      category: "cofen",
      title: "Montador de Casos Clínicos",
      subtitle: "Estúdio de Casos & Desafio",
      description: "Construa o perfil do paciente do zero com escores clínicos validados (Braden, CAM, AUDIT, SAK, CALOI) e resolva o desafio diagnóstico.",
      icon: PlusCircle,
      path: "/montar-caso",
      tag: "Estúdio Clínico",
      time: "12 min",
      badgeText: "Escores + Áudio",
      stats: "Braden • CAM • CALOI • SAK"
    },
    {
      id: "procedimentos",
      category: "procedimentos",
      title: "Videoteca de Procedimentos & POPs",
      subtitle: "Laboratório de Habilidades (Skills Lab)",
      description: "Aprenda e treine punção venosa, sondagem vesical SVD/SVA, SNG/SNE, curativos e injeções com vídeos didáticos, checklists de técnica asséptica e IA.",
      icon: Video,
      path: "/procedimentos",
      tag: "Habilidades Práticas",
      time: "8 min",
      badgeText: "Vídeos + Checklists",
      stats: "Punção • SVD • SNG • Injeções • IA",
      featured: true
    },
    {
      id: "turmas",
      category: "turmas",
      title: "Minhas Turmas & Desafios",
      subtitle: "Ambiente Acadêmico",
      description: "Acesse suas salas de aula, responda a estudos de caso atribuídos pelo seu professor e acompanhe sua evolução.",
      icon: Users,
      path: "/turmas",
      tag: "Acadêmico",
      time: "Variável",
      badgeText: "Docência",
      stats: "Estudos Atribuídos e Turmas"
    }
  ], []);

  // Categorias para os Chips Deslizáveis
  const categories = useMemo(() => [
    { id: "all", label: "Todos", count: learningModules.length },
    { id: "procedimentos", label: "Procedimentos & POPs", count: learningModules.filter(m => m.category === 'procedimentos').length },
    { id: "cofen", label: "Processo de Enfermagem", count: learningModules.filter(m => m.category === 'cofen').length },
    { id: "sbar", label: "Plantão SBAR", count: learningModules.filter(m => m.category === 'sbar').length },
    { id: "doses", label: "Cálculo de Doses", count: learningModules.filter(m => m.category === 'doses').length },
    { id: "semiologia", label: "Semiologia", count: learningModules.filter(m => m.category === 'semiologia').length },
    { id: "turmas", label: "Minhas Turmas", count: learningModules.filter(m => m.category === 'turmas').length }
  ], [learningModules]);

  const isSearching = searchQuery.trim().length > 0;

  // Filtragem Dinâmica Global
  const filteredModules = useMemo(() => {
    return learningModules.filter(module => {
      // Quando houver texto na busca, pesquisa GLOBALMENTE em todos os módulos
      const matchesSearch = !isSearching ||
        module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.stats.toLowerCase().includes(searchQuery.toLowerCase());

      // Se não estiver pesquisando, aplica o filtro da categoria clicada
      const matchesCategory = isSearching || selectedCategory === "all" || module.category === selectedCategory;

      return matchesCategory && matchesSearch;
    });
  }, [learningModules, selectedCategory, searchQuery, isSearching]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-800 dark:text-slate-100 pb-24 md:pb-0 transition-colors">
      {/* Header Clássico no Desktop (md:block) */}
      <div className="hidden md:block">
        <StudentHeader activeTab="hub" />
      </div>

      {/* Header Móvel Inspirado no Dribbble 16244904 (md:hidden) */}
      <div className="md:hidden">
        <MobileHeader
          userName={greetingName}
          userType={isProfessor ? "professor" : "aluno"}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onSelectCategory={(catId) => {
            triggerHaptic(20);
            setSelectedCategory(catId);
          }}
          categories={categories}
          onOpenOptions={() => setIsOptionsModalOpen(true)}
        />
      </div>

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 py-4 sm:py-8 space-y-5">

        {/* Banner Hero no Desktop (md:block) */}
        <div className="hidden md:block rounded-3xl border border-emerald-100 dark:border-slate-800 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 dark:from-emerald-950 dark:via-emerald-900 dark:to-slate-900 p-8 shadow-sm text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider block">
                {heroCardConfig.desktopSub}
              </span>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                {isProfessor
                  ? (greetingName ? `Olá professor, ${greetingName}. Pronto para gerenciar suas turmas hoje?` : "Olá professor. Pronto para gerenciar suas turmas hoje?")
                  : (greetingName ? `Olá aluno, ${greetingName}. Pronto para a prática clínica hoje?` : "Olá aluno. Pronto para a prática clínica hoje?")}
              </h1>
              <p className="text-sm text-emerald-100/90 leading-relaxed">
                {heroCardConfig.desktopDesc}
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-2.5 shrink-0">
              <Button
                onClick={() => navigate("/montar-caso")}
                className="rounded-full bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-sm px-5 h-11 shadow-md flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4 text-emerald-700" /> Montar Meu Caso
              </Button>
              <Button
                onClick={() => navigate("/montar-caso?mode=audio")}
                variant="outline"
                className="rounded-full border-emerald-400/60 bg-emerald-900/30 text-white hover:bg-emerald-900/50 font-semibold text-sm px-4 h-11 flex items-center gap-2"
              >
                <Mic className="h-4 w-4 text-emerald-300" /> Áudio
              </Button>
              <Button
                onClick={() => navigate(heroCardConfig.actionTo)}
                variant="outline"
                className="rounded-full border-white/30 text-white hover:bg-white/10 font-semibold text-sm px-4 h-11 flex items-center gap-2"
              >
                <BookOpen className="h-4 w-4" /> {heroCardConfig.actionText}
              </Button>
            </div>
          </div>
        </div>

        {/* MODO BUSCA ATIVA: Oculta o Hero Card para colocar os resultados no topo imediato do celular */}
        {isSearching ? (
          <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60 flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
              <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                Resultados para: <strong>"{searchQuery}"</strong> ({filteredModules.length} encontrados)
              </span>
            </div>
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-slate-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-300 flex items-center gap-1 font-bold"
            >
              <X className="w-3.5 h-3.5" /> Limpar
            </button>
          </div>
        ) : (
          <>


            {/* Hero Card Móvel Estilo Orizon (md:hidden) Conectado à Diretriz Ativa */}
            <div className="md:hidden">
              <HeroCourseCard
                title={heroCardConfig.title}
                subtitle={heroCardConfig.subtitle}
                progressPercent={heroCardConfig.progressPercent}
                actionText={heroCardConfig.actionText}
                actionTo={heroCardConfig.actionTo}
                timeEstimate={heroCardConfig.timeEstimate}
                competencyTag={heroCardConfig.competencyTag}
                badgeText={heroCardConfig.badgeText}
              />
            </div>

            {/* Acesso Rápido a Criação de Casos (Mobile Bar) */}
            <div className="md:hidden grid grid-cols-2 gap-2.5">
              <button
                onClick={() => navigate("/montar-caso")}
                className="flex items-center gap-2 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 active:scale-95 transition-all text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate">Montar Caso</span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-medium">5 Escores</span>
                </div>
              </button>

              <button
                onClick={() => navigate("/montar-caso?mode=audio")}
                className="flex items-center gap-2 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 active:scale-95 transition-all text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <Mic className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate">Caso por Áudio</span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-medium">Voz de Preceptor</span>
                </div>
              </button>
            </div>
          </>
        )}

        {/* Grade de Módulos Clínicos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                <span>{isSearching ? "Módulos Encontrados" : "Módulos de Formação & Simulação"}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800">
                  {filteredModules.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isSearching
                  ? "Toque no módulo para acessar diretamente"
                  : "Prática assistencial orientada por evidências científicas"}
              </p>
            </div>
          </div>

          {/* Estado Vazio de Busca */}
          {filteredModules.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-emerald-200 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Nenhum módulo encontrado
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Não encontramos nenhum módulo para "{searchQuery}". Tente outro termo clínico ou limpe os filtros.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="rounded-full border-emerald-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 text-xs font-semibold"
              >
                Limpar Busca & Filtros
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
              {filteredModules.map((mod) => (
                <ClinicalModuleCard
                  key={mod.id}
                  title={mod.title}
                  description={mod.description}
                  tag={mod.tag}
                  time={mod.time}
                  icon={mod.icon}
                  to={mod.path}
                  featured={mod.featured}
                  badgeText={mod.badgeText}
                />
              ))}
            </div>
          )}
        </div>

        {/* Assinatura de Autoria e Direitos Autorais */}
        <div className="text-center py-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          Criado e desenvolvido por <strong className="text-slate-700 dark:text-slate-300">Marcos Manoel Tavares Neumann</strong> • Detentor de todos os direitos autorais
        </div>
      </main>

      {/* Footer Unificado (Desktop com Links e Mobile com Dock Orizon + Bottom Sheet Vaul) */}
      <StudentFooter onOpenOptions={() => setIsOptionsModalOpen(true)} />

      {/* Central de Opções & Preferências Clínicas */}
      <ClinicalOptionsModal
        isOpen={isOptionsModalOpen}
        onClose={() => setIsOptionsModalOpen(false)}
      />
    </div>
  );
}
