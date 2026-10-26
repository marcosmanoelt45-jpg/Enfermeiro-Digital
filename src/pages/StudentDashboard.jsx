import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Calculator,
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
import EnfereVivoTrail from "@/components/mobile/EnfereVivoTrail";
import ClinicalOptionsModal from "@/components/mobile/ClinicalOptionsModal";
import ClinicalModuleCard from "@/components/mobile/ClinicalModuleCard";
import ModuleBriefingModal from "@/components/navigation/ModuleBriefingModal";
import GotiAnimated from "@/components/mascot/GotiAnimated";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { triggerHaptic } = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [briefingModuleId, setBriefingModuleId] = useState(null);
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const cleanUserName = user?.name ? user.name.split(" ")[0] : (user?.full_name ? user.full_name.split(" ")[0] : "");
  const isGeneric = !cleanUserName || ['estudante', 'enfermeiro', 'aluno'].includes(cleanUserName.toLowerCase());
  const greetingName = isGeneric ? '' : cleanUserName;

  // Configuração Automática do Hero Card (Foco 100% no Aluno e Prática Clínica)
  const heroCardConfig = useMemo(() => ({
    title: "Processo de Enfermagem Completo",
    subtitle: "5 Etapas • Raciocínio Diagnóstico & Taxonomias Clínicas",
    progressPercent: 75,
    actionText: "Iniciar Caso Clínico",
    actionTo: "/simulador-casos",
    timeEstimate: "15 min",
    competencyTag: "Raciocínio Clínico • NANDA-I / NIC / NOC",
    badgeText: "Trilha Principal",
    desktopSub: "Painel do Aluno • Prática Baseada em Evidências",
    desktopDesc: "Monte casos clínicos com escores validados (Braden, CAM, CALOI, SAK) ou explore simulações formativas com o Processo de Enfermagem em 5 etapas e taxonomias NANDA-I/NIC/NOC.",
  }), []);

  // Definição Completa dos Módulos Clínicos (Cada um com sua diretriz metodológica nativa automática)
  const learningModules = useMemo(() => [
    {
      id: "casos",
      category: "cofen",
      title: "Simulador de Casos Clínicos",
      subtitle: "Processo de Enfermagem & Raciocínio Clínico",
      description: "Pratique o raciocínio diagnóstico nas 5 etapas do Processo de Enfermagem com taxonomias NANDA-I, NIC e NOC e julgamento clínico.",
      icon: BookOpen,
      path: "/simulador-casos",
      tag: "Processo de Enfermagem • NANDA-I",
      time: "15 min",
      badgeText: "5 Etapas",
      stats: "Avaliação, Diagnóstico e Metas",
      featured: true
    },
    {
      id: "sbar",
      category: "sbar",
      title: "Passagem de Plantão SBAR",
      subtitle: "Comunicação Segura & Treino SBAR",
      description: "Treine a técnica SBAR (Situação, Breve Histórico, Avaliação, Recomendação) por voz ou texto, com debriefing e devolutiva do Goti IA.",
      icon: ArrowRightLeft,
      path: "/passagem-plantao",
      tag: "Meta 2 OMS • SBAR Áudio",
      time: "8 min",
      badgeText: "Goti IA",
      stats: "Áudio • Conclusão • PDF",
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
    }
  ], []);

  // Categorias para os Chips Deslizáveis
  const categories = useMemo(() => [
    { id: "all", label: "Todos", count: learningModules.length },
    { id: "cofen", label: "Processo de Enfermagem", count: learningModules.filter(m => m.category === 'cofen').length },
    { id: "sbar", label: "Plantão SBAR", count: learningModules.filter(m => m.category === 'sbar').length },
    { id: "doses", label: "Cálculo de Doses", count: learningModules.filter(m => m.category === 'doses').length },
    { id: "procedimentos", label: "Procedimentos & POPs", count: learningModules.filter(m => m.category === 'procedimentos').length },
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
      {/* Header Clássico no Desktop (controlado internamente por desktopOnly para não ocultar modais no mobile) */}
      <StudentHeader activeTab="hub" desktopOnly={true} />

      {/* Header Móvel de Busca (Exibido apenas em busca ativa) */}
      {isSearching && (
        <div className="md:hidden">
          <MobileHeader
            userName={greetingName}
            userType="aluno"
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onSelectCategory={(catId) => {
              triggerHaptic(20);
              setSelectedCategory(catId);
            }}
            categories={categories}
            onOpenOptions={() => setIsOptionsModalOpen(true)}
            onOpenAIChat={() => {
              triggerHaptic(20);
              window.dispatchEvent(new CustomEvent("open-goti-chat"));
            }}
          />
        </div>
      )}

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 py-4 sm:py-8 space-y-5">

        {/* Banner Hero no Desktop e Tablet/Landscape (md:block) com Plantão de Simulação */}
        <div className="hidden md:block rounded-3xl border-2 border-emerald-600/40 dark:border-emerald-700/50 border-b-4 border-b-emerald-950/80 dark:border-b-black bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 dark:from-emerald-950 dark:via-teal-950 dark:to-slate-950 p-6 lg:p-8 shadow-xl text-white relative overflow-hidden">
          {/* Luz difusa de fundo */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-row items-center justify-between gap-4 lg:gap-8">
            <div className="space-y-3 lg:space-y-4 max-w-xl">
              <span className="text-[11px] font-black text-emerald-300 uppercase tracking-widest block drop-shadow-xs">
                {heroCardConfig.desktopSub}
              </span>
              <h1 className="text-xl sm:text-2xl lg:text-4xl font-black tracking-tight text-white leading-tight drop-shadow-sm">
                {greetingName ? `Olá, ${greetingName}! Pronto para a prática clínica hoje?` : "Olá! Pronto para a prática clínica hoje?"}
              </h1>
              <p className="text-xs lg:text-sm font-medium text-emerald-50/95 leading-relaxed drop-shadow-xs line-clamp-2 lg:line-clamp-none">
                {heroCardConfig.desktopDesc}
              </p>

              <div className="flex flex-wrap gap-2.5 pt-2">
                <button
                  onClick={() => navigate("/montar-caso")}
                  className="rounded-2xl bg-white text-emerald-950 hover:bg-emerald-50 font-black text-xs lg:text-sm px-5 h-10 lg:h-12 border-b-4 border-emerald-200 dark:border-emerald-400/80 shadow-md flex items-center gap-2 select-none active:translate-y-1 active:border-b-0 transition-all cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4 text-emerald-700 stroke-[2.5]" /> Montar Meu Caso
                </button>
                <button
                  onClick={() => navigate("/montar-caso?mode=audio")}
                  className="rounded-2xl border-2 border-teal-300/40 border-b-4 border-b-teal-500/80 bg-teal-950/70 text-white hover:bg-teal-900/90 font-extrabold text-xs lg:text-sm px-4 h-10 lg:h-12 flex items-center gap-2 select-none active:translate-y-1 active:border-b-2 transition-all shadow-sm cursor-pointer"
                >
                  <Mic className="h-4 w-4 text-teal-300 stroke-[2.5]" /> Áudio
                </button>
                <button
                  onClick={() => navigate(heroCardConfig.actionTo)}
                  className="rounded-2xl border-2 border-white/20 border-b-4 border-b-emerald-700/80 bg-white/10 text-white hover:bg-white/20 font-extrabold text-xs lg:text-sm px-4 h-10 lg:h-12 flex items-center gap-2 select-none active:translate-y-1 active:border-b-2 transition-all cursor-pointer"
                >
                  <BookOpen className="h-4 w-4 text-emerald-300 stroke-[2.5]" /> {heroCardConfig.actionText}
                </button>
              </div>
            </div>

            {/* Mascote Goti em Destaque Imponente (Sem balão de texto e sem card lateral COFEN) */}
            <div className="shrink-0 flex items-center justify-center">
              <div
                onClick={() => {
                  triggerHaptic(20);
                  window.dispatchEvent(new CustomEvent("open-goti-chat"));
                }}
                className="cursor-pointer group flex items-center justify-center p-1 transition-transform hover:scale-105 active:scale-95 select-none"
                title="Clique para conversar com o Goti"
              >
                {/* Goti em pose de boas-vindas com proporção cinematográfica */}
                <GotiAnimated
                  animation="wave"
                  size="hero"
                  className="w-52 h-64 sm:w-64 sm:h-76 md:w-80 md:h-96 lg:w-96 lg:h-[26rem] xl:w-[26rem] xl:h-[30rem] shrink-0"
                />
              </div>
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
            {/* Trilha Tátil Vertical do Plantão de Hoje - Especificação 1:1 do PDF Enfere Vivo */}
            <div className="md:hidden">
              <EnfereVivoTrail
                userName={greetingName}
                onOpenAIChat={() => {
                  triggerHaptic(20);
                  window.dispatchEvent(new CustomEvent("open-goti-chat"));
                }}
              />
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
                  onClick={() => {
                    triggerHaptic(15);
                    if (mod.id === "procedimentos") {
                      navigate(mod.path);
                    } else {
                      setBriefingModuleId(mod.id);
                      setIsBriefingOpen(true);
                    }
                  }}
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

      {/* Modal de Briefing Pedagógico do Módulo */}
      <ModuleBriefingModal
        isOpen={isBriefingOpen}
        moduleId={briefingModuleId}
        onClose={() => setIsBriefingOpen(false)}
        onSelectAction={(action, targetPath) => {
          setIsBriefingOpen(false);
          const destination = action.query ? `${targetPath}${action.query}` : targetPath;
          navigate(destination);
        }}
      />
    </div>
  );
}
