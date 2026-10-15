import React, { useState } from "react";
import {
  Brain,
  Wind,
  Heart,
  Layers,
  ChevronRight,
  BookOpen,
  ClipboardList
} from "lucide-react";
import StudentHeader from "@/components/StudentHeader";
import StudentFooter from "@/components/StudentFooter";
import ClinicalGapRadar from "@/components/ClinicalGapRadar";

const SYSTEMS_MODULES = [
  {
    id: "neuro",
    title: "Sistema Neurológico & Sensório",
    icon: Brain,
    badgeColor: "bg-indigo-50 text-indigo-800 border-indigo-200",
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
    badgeColor: "bg-sky-50 text-sky-800 border-sky-200",
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
    badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
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
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    description: "Inspeção cutânea, escala de Braden, estadiamento de lesões por pressão e integridade tecidual.",
    caseScenario: {
      patient: "Paciente A. P. L., 79 anos, restrita ao leito e incontinente.",
      findings: [
        { label: "Escala de Braden", value: "Escore Total 11 (Alto Risco de Lesão por Pressão)", status: "critical" },
        { label: "Região Sacra", value: "Hiperemia não branqueável (LPP Estágio 1)", status: "critical" },
        { label: "Calcanhares", value: "Pele íntegra, com palidez sob pressão prolongada", status: "altered" }
      ],
      missingGaps: [
        { key: "reposicionamento", label: "Horários de Mudança de Decúbito Registrados", hint: "Checar se o protocolo de alívio de pressão a cada 2 horas está em vigor." },
        { key: "barreira_umidade", label: "Prescrição de Creme Barreira para Incontinência", hint: "Proteger o estrato córneo contra maceração por umidade e dermatite associada." }
      ]
    },
    clinicalPearls: [
      "Hiperemia não branqueável já é lesão celular instalada: o dano tecidual começa de dentro para fora.",
      "A massagem sobre proeminências ósseas hiperemiadas é contraindicada, pois causa isquemia adicional e necrose tecidual profunda."
    ]
  }
];

export default function SystemsAssessmentLab() {
  const [selectedSysId, setSelectedSysId] = useState("neuro");
  const [addedFindingsBySys, setAddedFindingsBySys] = useState({});

  const activeSystem = SYSTEMS_MODULES.find((s) => s.id === selectedSysId) || SYSTEMS_MODULES[0];
  const currentAdded = addedFindingsBySys[selectedSysId] || [];

  function handleAddGap(gap, resultingItem) {
    if (!currentAdded.some((item) => item.key === gap.key)) {
      const newItem = resultingItem || {
        label: gap.label.split(" ")[0] || "Dado",
        value: "Avaliado e Registrado",
        status: "normal"
      };
      setAddedFindingsBySys({
        ...addedFindingsBySys,
        [selectedSysId]: [...currentAdded, { ...newItem, key: gap.key }]
      });
    }
  }

  function handleSelectSystem(sys) {
    setSelectedSysId(sys.id);
  }

  const currentDetected = [
    ...activeSystem.caseScenario.findings,
    ...currentAdded
  ];

  const currentMissingGaps = activeSystem.caseScenario.missingGaps.filter(
    (g) => !currentAdded.some((item) => item.key === g.key)
  );

  const totalParams = currentDetected.length + currentMissingGaps.length;
  const completeness = totalParams > 0 ? Math.round((currentDetected.length / totalParams) * 100) : 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <StudentHeader activeTab="sistemas" />

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Cabeçalho Clínico Limpo */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-teal-800 uppercase tracking-wider block">
              Semiologia & Avaliação Céfalo-Caudal
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Semiologia por Sistemas Orgânicos
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Treine a inspeção metódica de sinais, manobras semiológicas e prevenção de pontos cegos.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 self-start sm:self-auto">
            <ClipboardList className="h-4 w-4 text-teal-700" />
            <span>Exame Físico Estruturado</span>
          </div>
        </div>

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
                    ? "bg-white border-teal-700 ring-1 ring-teal-700 shadow-xs"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-xl ${isSelected ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <ChevronRight className={`h-4 w-4 ${isSelected ? "text-teal-700" : "text-slate-300"}`} />
                </div>
                <h3 className="text-xs font-bold text-slate-900 mt-2 line-clamp-1">
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
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${activeSystem.badgeColor}`}>
                  {activeSystem.title}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  Cenário Simulado
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Identificação do Paciente
                </span>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">
                  {activeSystem.caseScenario.patient}
                </p>
              </div>

              {/* Radar Clínico */}
              <ClinicalGapRadar
                detectedItems={currentDetected}
                missingGaps={currentMissingGaps}
                onAddGap={handleAddGap}
                completenessPercentage={completeness}
                title={`Investigação do ${activeSystem.title.split("&")[0]}`}
              />
            </div>
          </div>

          {/* Painel Lateral: Pérolas Clínicas */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide block">
                Pérolas da Prática Semiologia
              </span>

              <div className="space-y-2.5">
                {activeSystem.clinicalPearls.map((pearl, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                    <p>{pearl}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-xs text-slate-700 shadow-xs space-y-2">
              <span className="font-bold flex items-center gap-1.5 text-slate-900">
                <BookOpen className="h-4 w-4 text-teal-700" />
                Sistematização do Exame Físico
              </span>
              <p className="text-slate-500 leading-relaxed">
                A coleta metódica céfalo-caudal assegura que nenhuma resposta humana seja omitida antes da prescrição de enfermagem.
              </p>
            </div>
          </div>
        </div>
      </main>

      <StudentFooter />
    </div>
  );
}
