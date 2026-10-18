import React from "react";
import {
  X,
  Play,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Mic,
  FileText,
  Clock,
  Sparkles,
  Video,
  Calculator,
  Stethoscope,
  PlusCircle,
  ArrowRightLeft,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
      { id: "review", label: "Revisão dos Casos Montados", desc: "Ver os casos que você já estruturou na plataforma", icon: RotateCcw, primary: false, query: "?mode=library" }
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
      { id: "continue", label: "Continuar Caso em Andamento", desc: "Retomar sua última simulação com o Preceptor Clínico IA", icon: ArrowRight, primary: false, query: "?action=continue" },
      { id: "review", label: "Revisão de Casos Concluídos", desc: "Consultar prontuários anteriores e notas formativas", icon: RotateCcw, primary: false, query: "?action=review" }
    ]
  },
  sbar: {
    title: "Passagem de Plantão SBAR",
    category: "Comunicação Segura & Preceptoria",
    badge: "Meta 2 OMS • SBAR Multimodal",
    icon: ArrowRightLeft,
    speech: "A passagem de plantão estruturada SBAR (Situação, Breve Histórico, Avaliação e Recomendação) evita 80% das falhas de comunicação. Como deseja treinar hoje?",
    targetPath: "/passagem-plantao",
    isSbarSpecial: true,
    actions: [
      { id: "sbar_voice", label: "Passagem por Áudio (Voz)", desc: "Treine falando ao microfone com transcrição e checagem de itens", icon: Mic, primary: true, query: "?tab=free_voice" },
      { id: "sbar_manual", label: "Passagem Estruturada (Texto)", desc: "Preencha os 4 pilares guiados passo a passo no teclado", icon: FileText, primary: false, query: "?tab=guided" },
      { id: "sbar_quick", label: "Simulação Rápida Beira-Leito", desc: "Caso crítico com contagem regressiva de 2 minutos para priorização", icon: Clock, primary: false, query: "?mode=rapid" },
      { id: "sbar_review", label: "Exercícios Anteriores & Revisão", desc: "Consultar histórico de passagens, debriefings e PDFs", icon: RotateCcw, primary: false, query: "?tab=debriefing" }
    ]
  },
  calculos: {
    title: "Laboratório de Cálculo de Doses",
    category: "Farmacologia Clínica & Segurança",
    badge: "Gotejamento • Diluições",
    icon: Calculator,
    speech: "Erros de dosagem são preveníveis! Aqui você treina macrogotas, microgotas, infusões em minutos e diluição de antibióticos com suporte socrático do Preceptor IA.",
    targetPath: "/laboratorio-calculos",
    actions: [
      { id: "start", label: "Começar Novo Desafio de Dose", desc: "Sorteia prescrição médica e calcula gotejamento", icon: Play, primary: true, query: "?action=new" },
      { id: "continue", label: "Continuar Modo Prática", desc: "Voltar para o laboratório de infusão ativa", icon: ArrowRight, primary: false, query: "?action=continue" },
      { id: "review", label: "Revisão de Fórmulas e Regras", desc: "Consultar macetes clínicos e histórico de acertos", icon: RotateCcw, primary: false, query: "?action=review" }
    ]
  },
  sistemas: {
    title: "Semiologia & Exame Físico",
    category: "Avaliação Céfalo-Caudal",
    badge: "Escalas • Achados Clínicos",
    icon: Stethoscope,
    speech: "Semiologia por sistemas orgânicos: neurológico (Glasgow/CAM), respiratório, cardiovascular e tegumentar (Braden). Identifique sinais de alerta!",
    targetPath: "/sistemas-organicos",
    actions: [
      { id: "start", label: "Começar Novo Exame Clínico", desc: "Selecionar sistema orgânico e avaliar achados", icon: Play, primary: true, query: "?action=new" },
      { id: "continue", label: "Continuar Avaliação", desc: "Retomar a escala ou sistema que estava analisando", icon: ArrowRight, primary: false, query: "?action=continue" },
      { id: "review", label: "Revisão de Escalas e Manobras", desc: "Consultar critérios de normalidade e sinais de alarme", icon: RotateCcw, primary: false, query: "?action=review" }
    ]
  }
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
        className="w-full sm:max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-[32px] sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topo com Título e Badge */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-teal-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0 shadow-2xs">
              <IconComp className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                  {data.title}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  {data.badge}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {data.category}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic(20);
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card do Preceptor Clínico IA com Fala Explicativa da Aba */}
        <div className="p-4 sm:p-5 bg-teal-50/50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 flex items-start gap-3.5">
          <div className="shrink-0 -mt-0.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white flex items-center justify-center shadow-xs">
              <IconComponent className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800 dark:text-teal-300">
              <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Diretrizes do Preceptor Clínico IA</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              "{data.speech}"
            </p>
          </div>
        </div>

        {/* Ações / Escolha de Modalidade de Estudo */}
        <div className="p-4 sm:p-5 space-y-3 overflow-y-auto">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Selecione como deseja praticar:
          </p>

          <div className="grid grid-cols-1 gap-2.5">
            {data.actions.map((act) => {
              const ActionIcon = act.icon;
              return (
                <button
                  key={act.id}
                  onClick={() => handleActionClick(act)}
                  className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all active:scale-98 ${
                    act.primary
                      ? "bg-teal-700 hover:bg-teal-800 text-white border-teal-700 shadow-md shadow-teal-900/15"
                      : "bg-white dark:bg-slate-900 hover:border-teal-400 dark:hover:border-teal-600 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        act.primary
                          ? "bg-white/20 text-white"
                          : "bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-800"
                      }`}
                    >
                      <ActionIcon className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div>
                      <span className={`text-xs sm:text-sm font-bold block ${act.primary ? "text-white" : "text-slate-900 dark:text-white"}`}>
                        {act.label}
                      </span>
                      <span className={`text-[11px] block mt-0.5 leading-snug ${act.primary ? "text-teal-100" : "text-slate-500 dark:text-slate-400"}`}>
                        {act.desc}
                      </span>
                    </div>
                  </div>

                  <ArrowRight className={`w-4 h-4 shrink-0 ${act.primary ? "text-white" : "text-slate-400"}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Rodapé Informativo */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Ambiente de Simulação Enfere</span>
          <span>Prática Baseada em Evidências</span>
        </div>
      </div>
    </div>
  );
}
