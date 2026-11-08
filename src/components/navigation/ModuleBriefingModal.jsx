import React from "react";
import {
  X,
  Play,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Mic,
  FileText,
  Video,
  Calculator,
  PlusCircle,
  ArrowRightLeft,
  ShieldCheck,
  Stethoscope
} from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";

const MODULE_DATA = {
  procedimentos: {
    title: "Videoteca de Procedimentos & POPs",
    category: "Laboratório de Habilidades (Skills Lab)",
    badge: "Técnica Asséptica • COFEN",
    icon: Video,
    speech: "Olá! Aqui você treina técnicas fundamentais como punção venosa, injeções e sondagens. Vídeos didáticos em 16:9, checklists assépticos e pontuação de segurança!",
    targetPath: "/procedimentos",
    actions: [
      { id: "start", label: "Começar Novo Procedimento", desc: "Ver lista completa de POPs e iniciar treino", icon: Play, primary: true, query: "?action=new" },
      { id: "continue", label: "Continuar Treinamento", desc: "Retomar o último procedimento assistido", icon: ArrowRight, primary: false, query: "?action=continue" },
      { id: "review", label: "Revisão de POPs e Checklists", desc: "Consultar etapas de técnica asséptica e critérios", icon: RotateCcw, primary: false, query: "?action=review" }
    ]
  },
  montar: {
    title: "Montador de Casos Clínicos",
    category: "Estúdio de Casos & Desafio",
    badge: "Escores Clínicos • Áudio",
    icon: PlusCircle,
    speech: "Monte um caso clínico completo com sinais vitais, histórico e escores validados (Braden, CAM, CALOI, SAK). Você pode montar manualmente ou gravar por áudio!",
    targetPath: "/montar-caso",
    actions: [
      { id: "start", label: "Começar Novo (Manual Guiado)", desc: "Preenchimento passo a passo com sliders de precisão", icon: FileText, primary: true, query: "?mode=manual" },
      { id: "continue", label: "Começar por Áudio (Voz)", desc: "Relate o caso falando que o Enfere extrai com IA", icon: Mic, primary: false, query: "?mode=audio" },
      { id: "review", label: "Revisão dos Casos Montados", desc: "Ver os casos que você já estruturou na plataforma", icon: RotateCcw, primary: false, path: "/banco-casos" }
    ]
  },
  casos: {
    title: "Simulador de Casos Clínicos",
    category: "Processo de Enfermagem Completo",
    badge: "COFEN nº 736/2024 • NANDA-I",
    icon: BookOpen,
    speech: "Aqui aplicamos as 5 etapas do Processo de Enfermagem: Avaliação, Diagnóstico NANDA-I, Planejamento NOC, Implementação NIC e Evolução. Treine seu raciocínio clínico!",
    targetPath: "/simulador-casos",
    actions: [
      { id: "start", label: "Começar Novo Caso Clínico", desc: "Sortear paciente simulado e iniciar investigação", icon: Play, primary: true, query: "?action=new" },
      { id: "continue", label: "Continuar Caso em Andamento", desc: "Retomar sua última simulação com o Goti", icon: ArrowRight, primary: false, query: "?action=continue" },
      { id: "review", label: "Revisão de Casos Concluídos", desc: "Consultar histórico de simulações e notas formativas", icon: RotateCcw, primary: false, query: "?action=review" }
    ]
  },
  sbar: {
    title: "Plantão ao Vivo",
    category: "Passagem de plantão SBAR",
    badge: "Meta 2 OMS • SBAR",
    icon: ArrowRightLeft,
    speech: "A enfermeira Ana vai passar o plantão para você e fazer perguntas. Examine o que faltou, responda por voz ou texto e receba o relatório no fim. Leva uns 8 minutos.",
    targetPath: "/passagem-plantao",
    actions: [
      { id: "start", label: "Começar plantão", desc: "Receba a passagem da enfermeira Ana e responda as perguntas", icon: Play, primary: true, query: "" },
      { id: "gravacao", label: "Modo gravação", desc: "Grave sua passagem completa ou faça a simulação rápida com timer", icon: Mic, primary: false, path: "/plantao/gravacao" }
    ]
  },
  calculos: {
    title: "Cálculo com o Dr. Rui",
    category: "Farmacologia Clínica & Segurança",
    badge: "Gotejamento • Diluições • BIC",
    icon: Calculator,
    speech: "O Dr. Rui passa a prescrição e você calcula: gotejamento, diluição, bomba de infusão. Fique de olho: às vezes a prescrição vem com erro e você precisa questionar. Uns 5 minutos.",
    targetPath: "/laboratorio-calculos",
    actions: [
      { id: "start", label: "Começar rodada", desc: "Questões de dose com o Dr. Rui", icon: Play, primary: true, query: "" }
    ]
  },
  consulta: {
    title: "Consulta ao Vivo",
    category: "Anamnese e raciocínio clínico",
    badge: "Voz ou texto • NANDA-I",
    icon: Stethoscope,
    speech: "Converse com um paciente por voz ou texto, anote o que ele contar e registre no fim: você recebe nota e comentários. Uns 10 minutos.",
    targetPath: "/consulta",
    actions: [
      { id: "start", label: "Começar consulta", desc: "Escolha o paciente e comece a conversa", icon: Play, primary: true, query: "" }
    ]
  },
  tecnicas: {
    title: "Técnicas",
    category: "Laboratório de Habilidades",
    badge: "Minijogos • POPs • Vídeos",
    icon: Video,
    speech: "Pratique com as mãos: minijogos de técnicas, POPs com checklists e a videoteca de procedimentos. Uns 5 minutos por técnica.",
    targetPath: "/tecnicas",
    actions: [
      { id: "start", label: "Minijogos", desc: "Treine as etapas das técnicas", icon: Play, primary: true, query: "" },
      { id: "videos", label: "POPs com vídeo", desc: "Procedimentos com vídeo, checklist e referência", icon: Video, primary: false, query: "?aba=pops" }
    ]
  },
};

export default function ModuleBriefingModal({ isOpen, moduleId, onClose, onSelectAction }) {
  const { triggerHaptic } = useTheme();

  if (!isOpen || !moduleId || !MODULE_DATA[moduleId]) return null;

  const data = MODULE_DATA[moduleId];
  const IconComp = data.icon;

  function handleActionClick(action) {
    triggerHaptic(25);
    if (onSelectAction) {
      onSelectAction(action, data.targetPath);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full sm:max-w-xl bg-[#131F2E] border border-[#1F3045] rounded-t-[32px] sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden text-slate-100 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topo com Título e Badge */}
        <div className="p-5 border-b border-slate-800/80 bg-gradient-to-r from-teal-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-950/80 border border-teal-800 text-teal-400 flex items-center justify-center shrink-0 shadow-sm">
              <IconComp className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white leading-tight">
                  {data.title}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800">
                  {data.badge}
                </span>
              </div>
              <p className="text-xs text-[#9FB3C6] font-medium">
                {data.category}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic(20);
              onClose();
            }}
            className="p-2 rounded-xl text-[#9FB3C6] hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card do Goti IA com Fala Explicativa da Aba */}
        <div className="p-4 sm:p-5 bg-slate-950/50 border-b border-[#1F3045] flex items-start gap-3.5">
          <div className="shrink-0 -mt-0.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white flex items-center justify-center shadow-sm">
              <IconComp className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-teal-300">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Diretrizes do Goti</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              "{data.speech}"
            </p>
          </div>
        </div>

        {/* Ações / Escolha de Modalidade de Estudo */}
        <div className="p-4 sm:p-5 space-y-3 overflow-y-auto">
          <p className="text-xs font-bold uppercase tracking-wider text-[#9FB3C6]">
            Selecione como deseja praticar:
          </p>

          <div className="grid grid-cols-1 gap-2.5">
            {data.actions.map((act) => {
              const ActionIcon = act.icon;
              return (
                <button
                  key={act.id}
                  onClick={() => handleActionClick(act)}
                  className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all active:scale-[0.98] ${
                    act.primary
                      ? "bg-[#20D5B5] text-[#06302E] hover:brightness-105 border-[#149F86] shadow-md shadow-teal-900/15"
                      : "bg-[#131F2E] hover:border-teal-600 border-[#1F3045] text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        act.primary
                          ? "bg-white/20 text-white"
                          : "bg-teal-950 text-teal-400 border border-teal-800"
                      }`}
                    >
                      <ActionIcon className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div>
                      <span className={`text-xs sm:text-sm font-bold block ${act.primary ? "text-white" : "text-white"}`}>
                        {act.label}
                      </span>
                      <span className={`text-[11px] block mt-0.5 leading-snug ${act.primary ? "text-teal-100" : "text-[#9FB3C6]"}`}>
                        {act.desc}
                      </span>
                    </div>
                  </div>

                  <ArrowRight className={`w-4 h-4 shrink-0 ${act.primary ? "text-white" : "text-[#9FB3C6]"}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Rodapé Informativo */}
        <div className="p-3.5 bg-[#0E1722] border-t border-[#1F3045] flex items-center justify-between text-[11px] text-[#9FB3C6]">
          <span>Ambiente de Simulação Enfere</span>
          <span>Prática Baseada em Evidências</span>
        </div>
      </div>
    </div>
  );
}
