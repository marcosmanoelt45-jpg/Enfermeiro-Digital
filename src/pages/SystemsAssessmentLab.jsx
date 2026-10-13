import React, { useState } from "react";
import {
  Stethoscope,
  Brain,
  Wind,
  Heart,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Search,
  BookOpen,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import StudentHeader from "@/components/StudentHeader";
import ClinicalGapRadar from "@/components/ClinicalGapRadar";

const SYSTEMS_MODULES = [
  {
    id: "neuro",
    title: "Sistema Neurológico & Sensório",
    icon: Brain,
    badgeColor: "bg-violet-50 text-violet-700 border-violet-200",
    description: "Avaliação do nível de consciência, reatividade pupilar, escala de coma de Glasgow e rastreio de delirium.",
    caseScenario: {
      patient: "Paciente D. O., 82 anos, 2º DPO de artroplastia de quadril.",
      findings: [
        { label: "Nível de Consciência", value: "Flutuante (sonolenta pela manhã, agitada à tarde)", status: "altered" },
        { label: "Escala CAM", value: "Positiva (Início agudo e desatenção presentes)", status: "critical" },
        { label: "Pupilas", value: "Isocóricas e fotorreagentes bilateralmente (3 mm)", status: "normal" }
      ],
      missingGaps: [
        { key: "glasgow", label: "Cálculo da Escala de Glasgow com Reatividade Pupilar (Glasgow-P)", hint: "Pontuar abertura ocular, resposta verbal e motora." },
        { key: "forca_motora", label: "Teste de Força Motora e Simetria Facial", hint: "Investigar assimetrias para afastar evento cerebrovascular agudo." }
      ]
    },
    clinicalPearls: [
      "Nunca assuma que a confusão mental no idoso hospitalizado é 'da idade': o delirium é uma urgência geriátrica multifatorial.",
      "A hipóxia e a retenção urinária aguda são duas das causas mais frequentes e reversíveis de agitação psicomotora súbita."
    ]
  },
  {
    id: "resp",
    title: "Sistema Respiratório & Oxigenação",
    icon: Wind,
    badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
    description: "Inspeção do padrão ventilatório, uso de musculatura acessória, ausculta pulmonar e troca gasosa.",
    caseScenario: {
      patient: "Paciente M. H. S., 62 anos, quadro febril com tosse produtiva.",
      findings: [
        { label: "Frequência Respiratória", value: "24 irpm (taquipneia compensatória)", status: "altered" },
        { label: "Ausculta Pulmonar", value: "Estertores crepitantes em terço inferior de hemitórax direito", status: "critical" },
        { label: "Oximetria de Pulso", value: "93% em ar ambiente", status: "altered" }
      ],
      missingGaps: [
        { key: "tiragem", label: "Inspeção de Tiragem Intercostal e Batimento de Asa de Nariz", hint: "Verificar se há fadiga iminente da musculatura diafragmática." },
        { key: "aspecto_secrecao", label: "Caracterização da Expectoração", hint: "Avaliar cor, consistência e odor da secreção brônquica." }
      ]
    },
    clinicalPearls: [
      "A taquipneia é o sinal vital mais precoce e sensível de deterioração clínica no adulto internado.",
      "Sibilos indicam broncoespasmo; estertores crepitantes indicam abertura súbita de alvéolos colapsados por líquido ou exsudato."
    ]
  },
  {
    id: "cardio",
    title: "Sistema Cardiovascular & Perfusão",
    icon: Heart,
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    description: "Monitorização de pressão arterial, pulsos periféricos, tempo de enchimento capilar e sinais de baixo débito.",
    caseScenario: {
      patient: "Paciente S. S., 76 anos, cardiopatia com ganho ponderal rápido.",
      findings: [
        { label: "Pressão Arterial", value: "160/95 mmHg (hipertensão estágio 2)", status: "altered" },
        { label: "Frequência Cardíaca", value: "104 bpm (taquicardia sinusal)", status: "altered" },
        { label: "Edema Periférico", value: "Edema em membros inferiores 3+/4+ com sinal de cacifo positivo", status: "critical" }
      ],
      missingGaps: [
        { key: "turgencia_jugular", label: "Avaliação de Turgência Jugular Patológica a 45°", hint: "Sinal direto de aumento da pressão venosa central e sobrecarga de câmaras direitas." },
        { key: "tec", label: "Tempo de Enchimento Capilar (TEC)", hint: "Testar se a perfusão periférica está preservada (< 2 segundos)." }
      ]
    },
    clinicalPearls: [
      "Edema bilateral com cacifo sugere etiologia sistêmica (cardíaca, renal ou hepática); edema assimétrico exige rastreio de TVP.",
      "A pressão de pulso (PAS - PAD) reduzida associada à taquicardia é sinal clássico de volume ejetado diminuído."
    ]
  },
  {
    id: "pele",
    title: "Sistema Tegumentar & Prevenção de LPP",
    icon: Layers,
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "Inspeção cutânea, escala de Braden, estadiamento de lesões por pressão e integridade tecidual.",
    caseScenario: {
      patient: "Paciente A. P. L., 79 anos, restrita ao leito e incontinente.",
      findings: [
        { label: "Escala de Braden", value: "Escore Total 11 (Alto Risco de Lesão por Pressão)", status: "critical" },
        { label: "Região Sacra", value: "Hiperemia não branqueável com pele íntegra (LPP Estágio 1)", status: "altered" },
        { label: "Turgor Cutâneo", value: "Diminuído em região clavicular", status: "altered" }
      ],
      missingGaps: [
        { key: "calcaneos", label: "Inspeção Específica de Calcanhares e Maléolos", hint: "Segundo sítio mais acometido por lesão por pressão no paciente acamado." },
        { key: "colchao_pneumatico", label: "Checagem de Superfície de Suporte", hint: "Confirmar se o colchão de redistribuição de pressão está ativo e calibrado." }
      ]
    },
    clinicalPearls: [
      "Hiperemia que não clareia à digitopressão já é Lesão por Pressão Estágio 1: a mudança de decúbito a cada 2h deve ser imediata.",
      "Nunca massageie áreas com hiperemia não branqueável: a massagem causa isquemia e ruptura do tecido celular subcutâneo."
    ]
  }
];

export default function SystemsAssessmentLab() {
  const [selectedSysId, setSelectedSysId] = useState("neuro");
  const [activeSystem, setActiveSystem] = useState(SYSTEMS_MODULES[0]);
  const [discoveredGaps, setDiscoveredGaps] = useState([]);
  const [successToast, setSuccessToast] = useState("");

  function handleSelectSystem(sys) {
    setSelectedSysId(sys.id);
    setActiveSystem(sys);
    setDiscoveredGaps([]);
    setSuccessToast("");
  }

  function handleAddGap(gap) {
    if (!discoveredGaps.includes(gap.key)) {
      setDiscoveredGaps([...discoveredGaps, gap.key]);
      setSuccessToast(`Parâmetro incorporado com sucesso: "${gap.label}".`);
      setTimeout(() => setSuccessToast(""), 3500);
    }
  }

  const currentMissingGaps = activeSystem.caseScenario.missingGaps.filter(
    (g) => !discoveredGaps.includes(g.key)
  );

  const currentDetected = [
    ...activeSystem.caseScenario.findings,
    ...discoveredGaps.map((key) => {
      const orig = activeSystem.caseScenario.missingGaps.find((g) => g.key === key);
      return {
        label: orig?.label || "Dado Adicionado",
        value: "Avaliado e registrado na anamnese",
        status: "normal"
      };
    })
  ];

  const completeness = Math.round(
    ((activeSystem.caseScenario.findings.length + discoveredGaps.length) /
      (activeSystem.caseScenario.findings.length + activeSystem.caseScenario.missingGaps.length)) *
      100
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <StudentHeader activeTab="sistemas" />

      <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-6 space-y-6">
        {/* Banner do Módulo */}
        <div className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-200 border border-teal-400/30">
              <Stethoscope className="h-3.5 w-3.5" /> Semiologia & Semiotécnica de Enfermagem
            </span>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Treinador de Avaliação por Sistemas Orgânicos
            </h1>
            <p className="text-xs md:text-sm text-teal-100/80 max-w-2xl">
              Desenvolva o raciocínio clínico focado em cada sistema anatômico, reconheça sinais de alerta à beira-leito e complete as lacunas do exame físico.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-xl border border-white/10 text-xs">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            <span>Exame Físico Cofen 736/2024</span>
          </div>
        </div>

        {/* Notificação de Sucesso ao Adicionar Lacuna */}
        {successToast && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successToast}</span>
          </div>
        )}

        {/* Grade de Navegação dos Sistemas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SYSTEMS_MODULES.map((sys) => {
            const Icon = sys.icon;
            const isSelected = selectedSysId === sys.id;
            return (
              <button
                key={sys.id}
                onClick={() => handleSelectSystem(sys)}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? "bg-white border-teal-600 ring-2 ring-teal-600/20 shadow-sm"
                    : "bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-xl ${isSelected ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <ChevronRight className={`h-4 w-4 ${isSelected ? "text-teal-600" : "text-slate-300"}`} />
                </div>
                <h3 className="text-xs font-bold text-slate-800 mt-2 line-clamp-1">
                  {sys.title.split("&")[0]}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                  {sys.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Cenário do Sistema Selecionado & Radar de Lacunas */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${activeSystem.badgeColor}`}>
                  {activeSystem.title}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  Cenário Clínico Simulado
                </span>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Identificação do Paciente
                </span>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">
                  {activeSystem.caseScenario.patient}
                </p>
              </div>

              {/* RADAR DE LACUNAS CLÍNICAS INTEGRADO COM BOTÕES DE ADIÇÃO COM 1 CLIQUE */}
              <ClinicalGapRadar
                detectedItems={currentDetected}
                missingGaps={currentMissingGaps}
                onAddGap={handleAddGap}
                completenessPercentage={completeness}
                title={`Investigação do ${activeSystem.title.split("&")[0]}`}
              />
            </div>
          </div>

          {/* Painel Lateral: Pérolas Clínicas e Diretrizes */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-teal-700 font-bold text-sm">
                <Sparkles className="h-4 w-4" />
                <h3>Pérolas Clínicas da Professora Florence</h3>
              </div>

              <div className="space-y-2.5">
                {activeSystem.clinicalPearls.map((pearl, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                    <p>💡 {pearl}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4 text-xs text-teal-950 space-y-1.5">
              <span className="font-bold flex items-center gap-1.5 text-teal-900">
                <BookOpen className="h-4 w-4 text-teal-700" />
                Sistematização do Exame Físico
              </span>
              <p className="text-teal-900/90 leading-relaxed">
                A coleta metódica céfalo-caudal assegura que nenhuma resposta humana seja omitida antes da prescrição de enfermagem.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
