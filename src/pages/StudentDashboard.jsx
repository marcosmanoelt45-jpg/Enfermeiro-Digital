import React from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Calculator,
  Stethoscope,
  Users,
  ChevronRight,
  PlusCircle,
  Mic,
  ArrowRightLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import StudentHeader from "@/components/StudentHeader";
import StudentFooter from "@/components/StudentFooter";
import { useAuth } from "@/lib/AuthContext";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const studentName = user?.name ? user.name.split(" ")[0] : "Estudante";

  const learningModules = [
    {
      id: "sbar",
      title: "Passagem de Plantão (SBAR)",
      subtitle: "Comunicação Segura & Tutoria",
      description: "Pratique a transição de cuidados por voz ou texto. A tutora Florence audita a segurança do paciente e gera laudo oficial em PDF.",
      icon: ArrowRightLeft,
      path: "/passagem-plantao",
      badge: "Novo • Tutoria Socrática",
      badgeColor: "bg-teal-50 text-teal-800 border-teal-200",
      accentBg: "bg-teal-700 text-white",
      stats: "SBAR • Meta 2 OMS • PDF Oficial"
    },
    {
      id: "montar",
      title: "Montador de Casos Clínicos",
      subtitle: "Estúdio de Casos & Desafio",
      description: "Construa o perfil do paciente do zero com todos os escores clínicos (Braden, CAM, AUDIT, SAK, CALOI) e resolva o desafio diagnóstico da IA.",
      icon: PlusCircle,
      path: "/montar-caso",
      badge: "Interativo",
      badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
      accentBg: "bg-emerald-700 text-white",
      stats: "Braden • CAM • CALOI • SAK • Áudio"
    },
    {
      id: "casos",
      title: "Simulador de Casos Clínicos",
      subtitle: "Processo de Enfermagem",
      description: "Pratique o raciocínio diagnóstico nas 5 etapas do PE com casos pré-configurados e conferência de dados em tempo real.",
      icon: BookOpen,
      path: "/simulador-casos",
      badge: "6 Cenários Clínicos",
      badgeColor: "bg-teal-50 text-teal-800 border-teal-200",
      accentBg: "bg-teal-700 text-white",
      stats: "Avaliação, Diagnóstico e Metas"
    },
    {
      id: "calculos",
      title: "Laboratório de Cálculo de Doses",
      subtitle: "Farmacologia Clínica",
      description: "Domine gotejamento de macrogotas, microgotas, infusões em minutos e diluição de antibióticos com feedback estruturado.",
      icon: Calculator,
      path: "/laboratorio-calculos",
      badge: "Prática Farmacológica",
      badgeColor: "bg-sky-50 text-sky-800 border-sky-200",
      accentBg: "bg-sky-700 text-white",
      stats: "Macrogotas • Microgotas • Diluições"
    },
    {
      id: "sistemas",
      title: "Semiologia por Sistemas",
      subtitle: "Exame Físico Céfalo-Caudal",
      description: "Identifique achados normais e sinais de alarme em neurologia, respiração, cardiologia e tegumentar.",
      icon: Stethoscope,
      path: "/sistemas-organicos",
      badge: "Semiologia & Exame",
      badgeColor: "bg-indigo-50 text-indigo-800 border-indigo-200",
      accentBg: "bg-indigo-700 text-white",
      stats: "Glasgow • Braden • Ausculta • Sinais"
    },
    {
      id: "turmas",
      title: "Minhas Turmas & Desafios",
      subtitle: "Ambiente Acadêmico",
      description: "Acesse suas salas de aula, responda a estudos de caso atribuídos pelo seu professor e acompanhe sua evolução.",
      icon: Users,
      path: "/turmas",
      badge: "Módulo Docente",
      badgeColor: "bg-slate-100 text-slate-800 border-slate-200",
      accentBg: "bg-slate-800 text-white",
      stats: "Estudos Atribuídos e Turmas"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <StudentHeader activeTab="hub" />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 py-8 space-y-8">
        {/* Header Clínico Executivo (Padrão Fariz Rahmadani / Dribbble) */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <span className="text-xs font-bold text-teal-800 uppercase tracking-wider block">
                Painel do Estudante
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Olá, {studentName}. Pronto para a prática clínica hoje?
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Monte casos clínicos completos com escores validados (Braden, CAM, AUDIT, SAK, CALOI) ou explore cenários de simulação com desafios diagnósticos formativos e julgamento clínico avançado.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-2.5 shrink-0">
              <Button
                onClick={() => navigate("/montar-caso")}
                className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs sm:text-sm px-4 h-10 shadow-xs flex items-center gap-1.5"
              >
                <PlusCircle className="h-4 w-4" /> Montar Meu Caso
              </Button>
              <Button
                onClick={() => navigate("/montar-caso?mode=audio")}
                variant="outline"
                className="rounded-xl border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-semibold text-xs sm:text-sm px-3.5 h-10 flex items-center gap-1.5"
              >
                <Mic className="h-4 w-4 text-emerald-700" /> Caso por Áudio
              </Button>
              <Button
                onClick={() => navigate("/simulador-casos")}
                variant="outline"
                className="rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs sm:text-sm px-3.5 h-10 flex items-center gap-1.5"
              >
                <BookOpen className="h-4 w-4" /> Casos Prontos
              </Button>
              <Button
                onClick={() => navigate("/passagem-plantao")}
                variant="outline"
                className="rounded-xl border-teal-300 text-teal-800 hover:bg-teal-50 font-semibold text-xs sm:text-sm px-3.5 h-10 flex items-center gap-1.5"
              >
                <ArrowRightLeft className="h-4 w-4 text-teal-700" /> Plantão SBAR
              </Button>
              <Button
                onClick={() => navigate("/laboratorio-calculos")}
                variant="ghost"
                className="rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold text-xs sm:text-sm px-3 h-10 flex items-center gap-1.5"
              >
                <Calculator className="h-4 w-4" /> Doses
              </Button>
            </div>
          </div>

          {/* Métricas Rápidas do Estudante */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-100">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Cenários Disponíveis</span>
              <span className="text-lg font-bold text-slate-900">6 Casos</span>
              <span className="text-[10px] text-teal-700 block font-medium">Clínica & Urgência</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Processo de Enfermagem</span>
              <span className="text-lg font-bold text-slate-900">5 Etapas</span>
              <span className="text-[10px] text-teal-700 block font-medium">COFEN 736/2024</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Cálculos Farmacológicos</span>
              <span className="text-lg font-bold text-slate-900">4 Modos</span>
              <span className="text-[10px] text-teal-700 block font-medium">Gotas & Diluições</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Semiologia por Sistemas</span>
              <span className="text-lg font-bold text-slate-900">4 Áreas</span>
              <span className="text-[10px] text-teal-700 block font-medium">Neuro, Cardio, Resp, Pele</span>
            </div>
          </div>
        </div>

        {/* Grade de Módulos de Aprendizagem */}
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Módulos de Formação & Simulação
            </h2>
            <p className="text-xs text-slate-500">
              Selecione uma área para treinar habilidades práticas assistenciais
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {learningModules.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.id}
                  onClick={() => navigate(mod.path)}
                  className="group bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-sm hover:border-teal-600 transition-all duration-200 flex flex-col justify-between cursor-pointer"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${mod.accentBg} shadow-xs`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${mod.badgeColor}`}>
                        {mod.badge}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {mod.subtitle}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-800 transition-colors mt-0.5">
                        {mod.title}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1">
                        {mod.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-800">
                    <span className="text-[11px] text-slate-600">{mod.stats}</span>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-800 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <StudentFooter />
    </div>
  );
}
