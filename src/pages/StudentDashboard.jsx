import React from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Calculator,
  Stethoscope,
  Users,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  BrainCircuit,
  GraduationCap,
  Activity,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  Award,
  Zap,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import StudentHeader from "@/components/StudentHeader";
import { useAuth } from "@/lib/AuthContext";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const studentName = user?.name ? user.name.split(" ")[0] : "Futuro(a) Enfermeiro(a)";

  const learningModules = [
    {
      id: "casos",
      title: "Simulador de Casos Clínicos",
      subtitle: "Processo de Enfermagem (COFEN 736/2024)",
      description: "Treine o raciocínio diagnóstico nas 5 etapas do PE com tutoria socrática guiada e radar de lacunas clínicas em tempo real.",
      icon: BookOpen,
      path: "/simulador-casos",
      badge: "6 Cenários Sintéticos",
      badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
      accentGradient: "from-teal-600 to-teal-800",
      stats: "Avaliação, Diagnóstico e Metas"
    },
    {
      id: "calculos",
      title: "Laboratório de Cálculo de Doses",
      subtitle: "Farmacologia & Segurança do Paciente",
      description: "Domine gotejamento de macrogotas, microgotas, infusões em minutos e diluição de antibióticos com feedback passo a passo.",
      icon: Calculator,
      path: "/laboratorio-calculos",
      badge: "Fórmulas & Prática",
      badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
      accentGradient: "from-sky-600 to-sky-800",
      stats: "Macrogotas • Microgotas • Diluições"
    },
    {
      id: "sistemas",
      title: "Semiologia por Sistemas",
      subtitle: "Exame Físico Céfalo-Caudal",
      description: "Identifique achados normais e sinais de alarme em neurologia, respiração, cardiologia e tegumentar com o Radar de Lacunas.",
      icon: Stethoscope,
      path: "/sistemas-organicos",
      badge: "Radar de Lacunas",
      badgeColor: "bg-violet-50 text-violet-700 border-violet-200",
      accentGradient: "from-violet-600 to-violet-800",
      stats: "Glasgow • Braden • CAM • Ausculta"
    },
    {
      id: "turmas",
      title: "Minhas Turmas & Desafios",
      subtitle: "Atividades & Feedback Docente",
      description: "Acesse suas salas de aula universitárias, responda a estudos de caso atribuídos pelo seu professor e visualize seu progresso.",
      icon: Users,
      path: "/turmas",
      badge: "Acadêmico",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      accentGradient: "from-emerald-600 to-emerald-800",
      stats: "Estudos de Caso e Turmas Ativas"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <StudentHeader activeTab="hub" />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 py-8 space-y-8">
        {/* Banner Hero Sofisticado Dribbble-Style */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 p-8 sm:p-10 text-white shadow-md">
          {/* Luzes de fundo decorativas */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-10 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-400/30 backdrop-blur-xs">
                <Sparkles className="h-3.5 w-3.5" /> Metodologias Ativas & Tutoria Socrática
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-xs">
                <ShieldCheck className="h-3.5 w-3.5" /> Ambiente 100% Didático LGPD
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Olá, {studentName}! Pronto para elevar seu raciocínio clínico hoje?
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              A <strong>Professora Florence</strong> acompanha sua jornada acadêmica através do método socrático, instigando o julgamento clínico e preparando você para os plantões mais desafiadores.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <Button
                onClick={() => navigate("/simulador-casos")}
                className="rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs sm:text-sm px-6 h-11 shadow-sm flex items-center gap-2"
              >
                <BookOpen className="h-4 w-4" /> Iniciar Estudo de Caso
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              <Button
                onClick={() => navigate("/laboratorio-calculos")}
                variant="outline"
                className="rounded-2xl bg-white/10 hover:bg-white/20 text-white border-white/20 font-semibold text-xs sm:text-sm px-6 h-11 backdrop-blur-xs flex items-center gap-2"
              >
                <Calculator className="h-4 w-4" /> Praticar Cálculos de Doses
              </Button>
            </div>
          </div>
        </div>

        {/* Grade de Módulos de Aprendizagem */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Módulos de Formação & Simulação Clínica
              </h2>
              <p className="text-xs text-slate-500">
                Selecione uma área para treinar habilidades práticas de enfermagem
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {learningModules.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.id}
                  onClick={() => navigate(mod.path)}
                  className="group relative bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md hover:border-teal-500/80 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr ${mod.accentGradient} text-white shadow-xs group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${mod.badgeColor}`}>
                        {mod.badge}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        {mod.subtitle}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors mt-0.5">
                        {mod.title}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1.5">
                        {mod.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-700 group-hover:translate-x-0.5 transition-transform">
                    <span>{mod.stats}</span>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-700" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Seção de Destaque: O Que é a Tutora Socrática & Alinhamento com o COFEN */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-7 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Como Funciona a Tutora Florence?
                </h3>
                <p className="text-xs text-slate-500">
                  Método Socrático e Aprendizagem Baseada em Problemas (PBL)
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Diferente de sistemas tradicionais que entregam respostas prontas, a Tutora Florence foi desenvolvida para <strong>ensinar você a pensar</strong>. Ela analisa suas hipóteses, detecta se algum sinal vital foi negligenciado e formula perguntas reflexivas para que você chegue ao diagnóstico e à conduta com rigor e segurança.
            </p>

            <div className="grid sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-teal-600" /> Sem Atalhos
                </span>
                <p className="text-[11px] text-slate-500">
                  Estimula o raciocínio fisiopatológico em vez de respostas decoradas.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-sky-600" /> Andaimes (3 Níveis)
                </span>
                <p className="text-[11px] text-slate-500">
                  Dicas progressivas que guiam seu olhar sem revelar o desfecho.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-emerald-600" /> COFEN 736/2024
                </span>
                <p className="text-[11px] text-slate-500">
                  Totalmente alinhado às 5 etapas vigentes do Processo de Enfermagem.
                </p>
              </div>
            </div>
          </div>

          {/* Card de Governança LGPD & Inovação (Starts-HCPA) */}
          <div className="rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-50/80 via-white to-emerald-50/50 p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-600 text-white">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Governança & LGPD
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Lei nº 13.709/2018 em Saúde
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Este ambiente é 100% didático e utiliza exclusivamente dados sintéticos. Nosso sistema de DLP inspeciona e protege ativamente qualquer dado antes da tutoria.
              </p>

              <div className="p-3 rounded-xl bg-white border border-teal-200 text-[11px] text-teal-900 space-y-1">
                <span className="font-bold flex items-center gap-1 text-teal-800">
                  <Lock className="h-3.5 w-3.5 text-teal-600" /> Anonimização Ativa
                </span>
                <p className="text-slate-600">
                  Projetado para incubação e parcerias com o ecossistema <strong>Starts-HCPA</strong>.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/privacidade-lgpd")}
              className="w-full rounded-xl border-teal-300 text-teal-800 hover:bg-teal-100/60 text-xs font-semibold"
            >
              Conhecer a Política de Privacidade
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
