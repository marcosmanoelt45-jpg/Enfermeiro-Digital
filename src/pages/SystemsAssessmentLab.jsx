import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Brain,
  Wind,
  Heart,
  Layers,
  ChevronRight,
  Lightbulb,
  ChevronDown,
  History,
  Clock,
  BookmarkPlus,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import StudentHeader from "@/components/StudentHeader";
import StudentFooter from "@/components/StudentFooter";
import ClinicalGapRadar from "@/components/ClinicalGapRadar";
import CaseHistoryModal from "@/components/history/CaseHistoryModal";
import { clinicalHistoryService, MODULE_TYPES } from "@/services/clinicalHistoryService";

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
  const [showPearls, setShowPearls] = useState(false);

  // Histórico & Cronômetro de Atividade Semiológica
  const [searchParams] = useSearchParams();
  const [currentActivityId, setCurrentActivityId] = useState(null);
  const [activitySeconds, setActivitySeconds] = useState(0);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setActivitySeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "review" || action === "continue" || action === "history") {
      setIsHistoryOpen(true);
    }
  }, [searchParams]);

  const activeSystem = SYSTEMS_MODULES.find((s) => s.id === selectedSysId) || SYSTEMS_MODULES[0];
  const currentAdded = addedFindingsBySys[selectedSysId] || [];

  function handleSaveDraft() {
    const draft = clinicalHistoryService.saveDraft({
      id: currentActivityId,
      moduleType: MODULE_TYPES.SYSTEMS_ASSESSMENT,
      title: `Semiologia: ${activeSystem.title.split("&")[0]}`,
      patientInfo: `${activeSystem.caseScenario.patient}`,
      progress: completeness || 25,
      durationSeconds: activitySeconds,
      formData: { selectedSysId, addedFindingsBySys }
    });
    setCurrentActivityId(draft.id);
    setToastMessage("Rascunho de semiologia salvo no Histórico!");
    setTimeout(() => setToastMessage(""), 3000);
  }

  function handleResumeActivity(item) {
    if (item?.formData) {
      if (item.formData.selectedSysId) setSelectedSysId(item.formData.selectedSysId);
      if (item.formData.addedFindingsBySys) setAddedFindingsBySys(item.formData.addedFindingsBySys);
      if (item.durationSeconds) setActivitySeconds(item.durationSeconds);
    }
    setCurrentActivityId(item.id);
    setIsHistoryOpen(false);
  }

  function handleAddGap(gap, resultingItem) {
    if (!currentAdded.some((item) => item.key === gap.key)) {
      const newItem = resultingItem || {
        label: gap.label || "Dado Clínico",
        value: gap.hint || "Avaliado e Registrado no prontuário",
        status: "normal"
      };
      setAddedFindingsBySys({
        ...addedFindingsBySys,
        [selectedSysId]: [...currentAdded, { ...newItem, key: gap.key, canRemove: true }]
      });
    }
  }

  function handleRemoveGap(item) {
    const key = item.key;
    setAddedFindingsBySys({
      ...addedFindingsBySys,
      [selectedSysId]: currentAdded.filter((x) => x.key !== key)
    });
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-800 dark:text-slate-100">
      <StudentHeader activeTab="sistemas" />

      <main className="flex-1 mx-auto max-w-5xl w-full px-4 sm:px-6 py-6 space-y-6">
        {/* Barra Superior Limpa e Funcional */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Semiologia por Sistemas Orgânicos
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Avaliação Céfalo-Caudal
            </span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
            {/* Cronômetro */}
            <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              <Clock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>{clinicalHistoryService.formatDuration(activitySeconds)}</span>
            </span>

            {/* Salvar Rascunho */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              className="rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
              title="Salvar rascunho da semiologia no Histórico"
            >
              <BookmarkPlus className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Salvar Rascunho</span>
            </Button>

            {/* Botão de Histórico de Semiologia */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHistoryOpen(true)}
              className="rounded-xl border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
            >
              <History className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Histórico de Semiologia</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPearls((v) => !v)}
              className="rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
            >
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              <span>{showPearls ? "Ocultar Pérolas" : "Pérolas da Prática"}</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showPearls ? "rotate-180" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Notificação Toast */}
        {toastMessage && (
          <div className="p-3.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs flex items-center gap-2 animate-in fade-in shadow-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Banner de Acesso Rápido ao Histórico de Semiologia */}
        <div
          onClick={() => setIsHistoryOpen(true)}
          className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform shadow-2xs">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Consultar Histórico de Avaliações Semiológicas</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Retomar Atividades
                </span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Veja as investigações céfalo-caudais que você já realizou, escores de completude e continue achados em andamento.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsHistoryOpen(true);
            }}
            className="rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-white dark:hover:bg-slate-900 shrink-0"
          >
            <span>Abrir Histórico</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1 text-indigo-600" />
          </Button>
        </div>

        {/* Pérolas Clínicas Sob Demanda (Divulgação Progressiva) */}
        {showPearls && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/60 p-4 shadow-xs space-y-2.5 animate-in fade-in">
            <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Pérolas Clínicas — {activeSystem.title}
            </span>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {activeSystem.clinicalPearls.map((pearl, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
                  <p>{pearl}</p>
                </div>
              ))}
            </div>
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
                    ? "bg-white dark:bg-slate-900 border-emerald-600 ring-2 ring-emerald-600/20 shadow-xs"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-xl ${isSelected ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <ChevronRight className={`h-4 w-4 ${isSelected ? "text-emerald-600 dark:text-emerald-400" : "text-slate-300 dark:text-slate-600"}`} />
                </div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-2 line-clamp-1">
                  {sys.title.split("&")[0]}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {sys.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Cenário do Sistema Selecionado & Radar de Lacunas em Largura Total */}
        <div className="w-full space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${activeSystem.badgeColor}`}>
                {activeSystem.title}
              </span>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-400">
                Cenário Simulado à Beira-Leito
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                Identificação do Paciente
              </span>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                {activeSystem.caseScenario.patient}
              </p>
            </div>

            {/* Radar Clínico */}
            <ClinicalGapRadar
              detectedItems={currentDetected}
              missingGaps={currentMissingGaps}
              onAddGap={handleAddGap}
              onRemoveGap={handleRemoveGap}
              completenessPercentage={completeness}
              title={`Investigação do ${activeSystem.title.split("&")[0]}`}
            />
          </div>
        </div>

        {/* Modal Unificado de Histórico de Semiologia */}
        <CaseHistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          onResumeActivity={handleResumeActivity}
          defaultModuleFilter={MODULE_TYPES.SYSTEMS_ASSESSMENT}
          lockModuleFilter={true}
          title="Histórico de Semiologia por Sistemas"
        />
      </main>

      <StudentFooter />
    </div>
  );
}
