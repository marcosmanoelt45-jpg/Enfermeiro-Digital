import React, { useState, useRef, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { Check, HeartPulse, ClipboardCheck, BrainCircuit, Wine, Footprints, Activity, FileText, Mic, MicOff } from "lucide-react";
import VitalSlider from "@/components/VitalSlider";
import RiskBadge from "@/components/RiskBadge";
import PainLocationPicker from "@/components/PainLocationPicker";
import { Button } from "@/components/ui/button";
import {
  computeGlobalRisk,
  computeBradenTotal,
  computeCamPositive,
  computeAuditTotal,
  computeSakTotal,
  computeCaloiTotal,
  RISK_META,
} from "@/lib/riskEngine";
import { SOURCES } from "@/lib/sources";

export const ASSESSMENT_STEPS = [
  { key: "vitals", label: "Sinais Vitais", icon: HeartPulse },
  { key: "braden", label: "BRADEN", icon: ClipboardCheck },
  { key: "cam", label: "CAM", icon: BrainCircuit },
  { key: "audit", label: "AUDIT", icon: Wine },
  { key: "sak", label: "SAK", icon: Footprints },
  { key: "caloi", label: "CALOI", icon: Activity },
  { key: "notes", label: "Relato & Notas", icon: FileText },
];

export const DEFAULT_ASSESSMENT_DATA = {
  pa_sistolica: 120, pa_diastolica: 80, fc: 72, fr: 16, tax: 36.6, sat: 98,
  braden_perception: 4, braden_moisture: 4, braden_activity: 4, braden_mobility: 4, braden_nutrition: 4, braden_friction: 3,
  cam_acute: false, cam_inattention: false, cam_disorganized: false, cam_altered_loc: false,
  audit_1: 0, audit_2: 0, audit_3: 0, audit_4: 0, audit_5: 0, audit_6: 0, audit_7: 0, audit_8: 0, audit_9: 0, audit_10: 0,
  sak_disorientation: false, sak_urination: false, sak_walking: false, sak_caregiver: false, sak_postop: false, sak_previous_falls: false, sak_meds: 0,
  caloi_pain_intensity: 0, caloi_pain_location: [], caloi_pain_characteristics: [],
  notes: "",
};

const BRADEN_ITEMS = [
  { key: "braden_perception", label: "Percepção Sensorial", min: 1, max: 4, color: "teal" },
  { key: "braden_moisture", label: "Umidade", min: 1, max: 4, color: "sky" },
  { key: "braden_activity", label: "Atividade", min: 1, max: 4, color: "violet" },
  { key: "braden_mobility", label: "Mobilidade", min: 1, max: 4, color: "amber" },
  { key: "braden_nutrition", label: "Nutrição", min: 1, max: 4, color: "teal" },
  { key: "braden_friction", label: "Fricção/Cisalhamento", min: 1, max: 3, color: "rose" },
];

const AUDIT_ITEMS = [
  { key: "audit_1", label: "1. Frequência do consumo de álcool" },
  { key: "audit_2", label: "2. Doses em um dia comum" },
  { key: "audit_3", label: "3. 6+ doses numa mesma ocasião" },
  { key: "audit_4", label: "4. Dificuldade de parar de beber" },
  { key: "audit_5", label: "5. Deixou de fazer algo esperado" },
  { key: "audit_6", label: "6. Beber logo pela manhã" },
  { key: "audit_7", label: "7. Culpa/remorso após beber" },
  { key: "audit_8", label: "8. Amnésia da noite anterior" },
  { key: "audit_9", label: "9. Ferimento por causa do beber" },
  { key: "audit_10", label: "10. Alguém sugeriu diminuir" },
];

const SAK_ITEMS = [
  { key: "sak_disorientation", label: "Desorientação/Confusão", points: 5 },
  { key: "sak_urination", label: "Micções frequentes", points: 5 },
  { key: "sak_walking", label: "Limitação para deambular", points: 4 },
  { key: "sak_caregiver", label: "Ausência de acompanhante", points: 0.5 },
  { key: "sak_postop", label: "Pós-operatório", points: 0.5 },
  { key: "sak_previous_falls", label: "Queda prévia", points: 1 },
];

const CALOI_PAIN_CHARS = ["Pontada", "Queimação", "Que irradia", "Latejante", "Contínua", "Em peso", "Em cólica", "Pressão", "Dor aguda", "Dor surda"];

function SourceLink({ srcKey }) {
  const s = SOURCES[srcKey];
  if (!s || !s.url) return null;
  return (
    <a href={s.url} target="_blank" rel="noreferrer" className="text-xs text-[#20D5B5] underline">
      Ver fonte ({s.label})
    </a>
  );
}

function VoiceNotesButton({ onText }) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const interimRef = useRef("");
  const onTextRef = useRef(onText);

  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onresult = null;
        try { recognitionRef.current.abort(); } catch {}
      }
    };
  }, []);

  function toggle() {
    if (listening) {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch {}
      }
      const pending = (interimRef.current || "").trim();
      if (pending && onTextRef.current) {
        onTextRef.current(pending);
      }
      interimRef.current = "";
      setListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Microfone indisponível", description: "Este navegador não reconhece fala. Use o Chrome ou digite o texto." });
      return;
    }

    try {
      isListeningRef.current = true;
      interimRef.current = "";

      const rec = new SpeechRecognition();
      rec.lang = "pt-BR";
      rec.continuous = true;
      rec.interimResults = true;

      rec.onresult = (e) => {
        let finalTrans = "";
        let interimTrans = "";
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            finalTrans += e.results[i][0].transcript + " ";
          } else {
            interimTrans += e.results[i][0].transcript;
          }
        }
        interimRef.current = interimTrans;
        if (finalTrans.trim() && onTextRef.current) {
          onTextRef.current(finalTrans.trim());
          interimRef.current = "";
        }
      };

      rec.onerror = (e) => {
        if (e.error === "no-speech") return; // Pausa natural
        if (e.error === "not-allowed") {
          isListeningRef.current = false;
          setListening(false);
        }
      };

      rec.onend = () => {
        if (isListeningRef.current && recognitionRef.current) {
          try {
            rec.start();
          } catch (err) {
            console.debug("[VoiceNotes] Auto-restart silencioso:", err);
          }
        }
      };

      rec.start();
      recognitionRef.current = rec;
      setListening(true);
    } catch {
      isListeningRef.current = false;
      setListening(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={toggle}
      className={`rounded-xl text-xs gap-1.5 ${listening ? "bg-rose-500/15 text-[#FF6B6B] border-[#FF6B6B]/40 animate-pulse" : "text-[#20D5B5] border-[#20D5B5]/40 hover:bg-[#20D5B5]/10"}`}
    >
      {listening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
      {listening ? "Parar de Ouvir" : "Ditar Relato"}
    </Button>
  );
}

export function getAssessmentTotals(data) {
  return {
    bradenTotal: computeBradenTotal(data),
    camPositive: computeCamPositive(data),
    auditTotal: computeAuditTotal(data),
    sakTotal: computeSakTotal(data),
    caloiTotal: computeCaloiTotal(data),
  };
}

export function AssessmentStepTabs({ step, setStep }) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
      {ASSESSMENT_STEPS.map((s, i) => {
        const Icon = s.icon;
        const active = i === step;
        const done = i < step;
        return (
          <button
            type="button"
            key={s.key}
            onClick={() => setStep(i)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              active
                ? "bg-[#20D5B5] text-[#0A1118] shadow-sm font-bold"
                : done
                ? "bg-[#20D5B5]/15 text-[#20D5B5]"
                : "bg-[#131F2E] text-[#9FB3C6] hover:bg-[#16222E] border border-[#1F3045]"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

export const AssessmentStepNav = AssessmentStepTabs;

export function AssessmentRiskBanner({ data }) {
  const risk = computeGlobalRisk(data);
  const meta = RISK_META[risk] || RISK_META.estavel;
  return (
    <div className={`mb-4 flex items-center justify-between rounded-2xl border p-4 ${meta.surface || meta.bg} ${meta.border}`}>
      <div>
        <p className="text-xs uppercase tracking-wide text-[#9FB3C6]">Status Global Preliminar</p>
        <p className={`text-base font-semibold ${meta.text || meta.color}`}>{meta.title}</p>
        <p className="text-xs text-[#9FB3C6]">{meta.description}</p>
      </div>
      <RiskBadge status={risk} />
    </div>
  );
}

export function AssessmentStepContent({ data, set, step }) {
  const { bradenTotal, camPositive, auditTotal, sakTotal, caloiTotal } = getAssessmentTotals(data);

  if (step === 0) {
    return (
      <div className="space-y-4">
        <VitalSlider label="PA Sistólica" unit="mmHg" value={data.pa_sistolica} min={60} max={220} step={5} onChange={(v) => set("pa_sistolica", v)} accentColor="teal" />
        <VitalSlider label="PA Diastólica" unit="mmHg" value={data.pa_diastolica} min={40} max={140} step={5} onChange={(v) => set("pa_diastolica", v)} accentColor="teal" />
        <VitalSlider label="Frequência Cardíaca" unit="bpm" value={data.fc} min={30} max={200} step={2} onChange={(v) => set("fc", v)} accentColor="rose" />
        <VitalSlider label="Frequência Respiratória" unit="irpm" value={data.fr} min={8} max={45} step={1} onChange={(v) => set("fr", v)} accentColor="sky" />
        <VitalSlider label="Temperatura Axilar" unit="°C" value={data.tax} min={34} max={42} step={0.1} onChange={(v) => set("tax", v)} accentColor="amber" />
        <VitalSlider label="Saturação O₂" unit="%" value={data.sat} min={70} max={100} step={1} onChange={(v) => set("sat", v)} accentColor="teal" />
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[#9FB3C6] font-medium">Escala de Braden — risco de lesão por pressão.</p>
        {BRADEN_ITEMS.map((it) => (
          <VitalSlider key={it.key} label={it.label} value={data[it.key]} min={it.min} max={it.max} step={1} onChange={(v) => set(it.key, v)} accentColor={it.color} />
        ))}
        <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-4 text-center shadow-xs">
          <p className="text-xs uppercase tracking-wide text-[#9FB3C6] font-bold">Escore Total BRADEN</p>
          <p className="text-4xl font-bold tabular-nums text-[#EAF2F8]">{bradenTotal}</p>
          <p className="mt-1 text-xs text-[#20D5B5] font-medium">
            {bradenTotal <= 9 ? "Risco muito alto" : bradenTotal <= 12 ? "Risco alto" : bradenTotal <= 14 ? "Risco moderado" : bradenTotal <= 18 ? "Risco brando" : "Sem risco"}
          </p>
          <div className="mt-2"><SourceLink srcKey="braden" /></div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-[#9FB3C6] font-medium">Confusion Assessment Method — marque os itens observados.</p>
        {[
          { key: "cam_acute", label: "1. Início agudo ou flutuação" },
          { key: "cam_inattention", label: "2. Desatenção" },
          { key: "cam_disorganized", label: "3. Pensamento desorganizado" },
          { key: "cam_altered_loc", label: "4. Nível de consciência alterado" },
        ].map((it) => (
          <button
            type="button"
            key={it.key}
            onClick={() => set(it.key, !data[it.key])}
            className={`flex w-full items-center gap-3 rounded-2xl border-2 p-4 transition ${data[it.key] ? "border-[#20D5B5] bg-[#20D5B5]/15" : "border-[#1F3045] bg-[#131F2E]"}`}
          >
            <div className={`flex h-6 w-6 items-center justify-center rounded-md border-2 ${data[it.key] ? "border-[#20D5B5] bg-[#20D5B5] text-[#0A1118]" : "border-[#27394B]"}`}>
              {data[it.key] && <Check className="h-4 w-4" />}
            </div>
            <span className="text-sm font-semibold text-[#EAF2F8]">{it.label}</span>
          </button>
        ))}
        <div className={`rounded-2xl border p-4 text-center ${camPositive ? "border-[#FFC247]/40 bg-[#FFC247]/10" : "border-[#20D5B5]/40 bg-[#20D5B5]/10"}`}>
          <p className="text-xs uppercase tracking-wide text-[#9FB3C6] font-bold">CAM</p>
          <p className="text-2xl font-bold text-[#EAF2F8]">{camPositive ? "Positivo (Confusão)" : "Negativo"}</p>
          <div className="mt-2"><SourceLink srcKey="cam" /></div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    const auditZone = auditTotal >= 20 ? "Zona IV (Provável dependência)" : auditTotal >= 16 ? "Zona III (Uso nocivo)" : auditTotal >= 8 ? "Zona II (Consumo de risco)" : "Zona I (Baixo risco)";
    return (
      <div className="space-y-4">
        <p className="text-sm text-[#9FB3C6] font-medium">AUDIT (OMS) — Questionário para Identificação de Problemas Relacionados ao Uso de Álcool.</p>
        {AUDIT_ITEMS.slice(0, 8).map((it) => (
          <VitalSlider key={it.key} label={it.label} value={data[it.key]} min={0} max={4} step={1} onChange={(v) => set(it.key, v)} accentColor="violet" />
        ))}
        {AUDIT_ITEMS.slice(8).map((it) => (
          <div key={it.key} className="space-y-1.5 rounded-2xl border border-[#1F3045] bg-[#131F2E] p-3.5">
            <p className="text-xs font-semibold text-[#EAF2F8]">{it.label}</p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { val: 0, label: "Não (0)" },
                { val: 2, label: "Sim, no passado (2)" },
                { val: 4, label: "Sim, no último ano (4)" }
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.val}
                  onClick={() => set(it.key, opt.val)}
                  className={`rounded-xl border p-2 text-xs font-medium transition text-center ${
                    Number(data[it.key]) === opt.val
                      ? "border-[#20D5B5] bg-[#20D5B5]/20 text-[#20D5B5]"
                      : "border-[#1F3045] bg-[#0E1722] text-[#9FB3C6] hover:bg-[#16222E]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-4 text-center shadow-xs">
          <p className="text-xs uppercase tracking-wide text-[#9FB3C6] font-bold">Escore Total AUDIT</p>
          <p className="text-4xl font-bold tabular-nums text-[#EAF2F8]">{auditTotal}</p>
          <p className="mt-1 text-xs text-[#20D5B5] font-medium">{auditZone}</p>
          <div className="mt-2"><SourceLink srcKey="audit" /></div>
        </div>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-[#9FB3C6] font-medium">Escala SAK (Severo-Almeida-Kuchenbecker) — marque os fatores presentes.</p>
        {SAK_ITEMS.map((it) => (
          <button
            type="button"
            key={it.key}
            onClick={() => set(it.key, !data[it.key])}
            className={`flex w-full items-center gap-3 rounded-2xl border-2 p-4 transition ${data[it.key] ? "border-[#FFC247] bg-[#FFC247]/15" : "border-[#1F3045] bg-[#131F2E]"}`}
          >
            <div className={`flex h-6 w-6 items-center justify-center rounded-md border-2 ${data[it.key] ? "border-[#FFC247] bg-[#FFC247] text-[#0A1118]" : "border-[#27394B]"}`}>
              {data[it.key] && <Check className="h-4 w-4" />}
            </div>
            <span className="flex-1 text-sm font-semibold text-[#EAF2F8] text-left">{it.label}</span>
            <span className="shrink-0 rounded-full bg-[#0E1722] px-2 py-0.5 text-xs font-semibold text-[#9FB3C6]">{it.points} pts</span>
          </button>
        ))}
        <VitalSlider label="Nº de medicamentos administrados (últimas 24h)" value={data.sak_meds} min={0} max={15} step={1} onChange={(v) => set("sak_meds", v)} accentColor="amber" />
        <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-4 text-center shadow-xs">
          <p className="text-xs uppercase tracking-wide text-[#9FB3C6] font-bold">Escore de Risco SAK</p>
          <p className="text-4xl font-bold tabular-nums text-[#EAF2F8]">{sakTotal}</p>
          <p className="mt-1 text-xs text-[#FFC247] font-medium">{sakTotal >= 10.5 ? "Alto risco" : sakTotal >= 6.5 ? "Risco moderado" : "Baixo risco"}</p>
          <div className="mt-2"><SourceLink srcKey="sak" /></div>
        </div>
      </div>
    );
  }

  if (step === 5) {
    return (
      <div className="space-y-5">
        <p className="text-sm text-[#9FB3C6] font-medium">CALOI — escala de dor (intensidade, localização e características).</p>
        <VitalSlider label="Intensidade da Dor" unit="/10" value={data.caloi_pain_intensity} min={0} max={10} step={1} onChange={(v) => set("caloi_pain_intensity", v)} accentColor="rose" />
        <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-4 shadow-xs">
          <p className="text-sm font-bold text-[#EAF2F8]">Localização da Dor</p>
          <p className="mt-0.5 text-xs text-[#9FB3C6]">Selecione todos os locais aplicáveis</p>
          <div className="mt-2">
            <PainLocationPicker value={data.caloi_pain_location || []} onChange={(locs) => set("caloi_pain_location", locs)} />
          </div>
        </div>
        <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-4 shadow-xs">
          <p className="text-sm font-bold text-[#EAF2F8]">Características da Dor</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {CALOI_PAIN_CHARS.map((c) => {
              const active = (data.caloi_pain_characteristics || []).includes(c);
              return (
                <button
                  type="button"
                  key={c}
                  onClick={() => {
                    const cur = data.caloi_pain_characteristics || [];
                    set("caloi_pain_characteristics", active ? cur.filter((x) => x !== c) : [...cur, c]);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${active ? "border-[#FF6B6B] bg-[#FF6B6B]/20 text-[#FF6B6B]" : "border-[#1F3045] bg-[#0E1722] text-[#9FB3C6] hover:border-[#27394B]"}`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
        <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-4 text-center shadow-xs">
          <p className="text-xs uppercase tracking-wide text-[#9FB3C6] font-bold">Escore de Dor CALOI</p>
          <p className="text-4xl font-bold tabular-nums text-[#EAF2F8]">{caloiTotal}/10</p>
          <p className="mt-1 text-xs text-[#FF6B6B] font-medium">{caloiTotal >= 7 ? "Dor severa" : caloiTotal >= 4 ? "Dor moderada" : caloiTotal > 0 ? "Dor leve" : "Sem dor"}</p>
        </div>
      </div>
    );
  }

  if (step === 6) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[#EAF2F8]">Relato Clínico, Ferimentos e Observações</h3>
          <p className="mt-1 text-xs text-[#9FB3C6] leading-relaxed">
            Descreva aqui detalhes cruciais como mecanismo de lesão (ex: trauma, lesão por pressão), uso de substâncias, queixas álgicas ou histórico cirúrgico. A IA usará todo esse relato para formular diagnósticos completos.
          </p>
        </div>

        <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wide text-[#9FB3C6] flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-[#20D5B5]" />
              Observações Clínicas à Beira-Leito
            </label>
            <VoiceNotesButton onText={(t) => set("notes", (data.notes ? data.notes + " " : "") + t)} />
          </div>

          <textarea
            value={data.notes || ""}
            onChange={(e) => set("notes", e.target.value)}
            rows={5}
            className="w-full text-sm rounded-xl border border-[#27394B] bg-[#0B131D] p-3.5 focus:outline-none focus:ring-1 focus:ring-[#20D5B5] text-[#EAF2F8] leading-relaxed"
            placeholder="Ex: Paciente admitido após trauma torácico, curativo oclusivo limpo e seco. Refere dor ao respirar fundo..."
          />
        </div>

        <div className="rounded-2xl border border-[#1F3045] bg-[#0E1722] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9FB3C6] mb-2.5">
            Resumo Consolidado dos Parâmetros das Escalas
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-[#131F2E] p-2.5 rounded-xl border border-[#1F3045]">
              <span className="text-[#9FB3C6] block text-[11px] font-medium">Sinais Vitais</span>
              <span className="font-bold text-[#EAF2F8]">PA {data.pa_sistolica}/{data.pa_diastolica} · FC {data.fc}</span>
            </div>
            <div className="bg-[#131F2E] p-2.5 rounded-xl border border-[#1F3045]">
              <span className="text-[#9FB3C6] block text-[11px] font-medium">BRADEN</span>
              <span className="font-bold text-[#EAF2F8]">{bradenTotal} pts</span>
            </div>
            <div className="bg-[#131F2E] p-2.5 rounded-xl border border-[#1F3045]">
              <span className="text-[#9FB3C6] block text-[11px] font-medium">SAK (Quedas)</span>
              <span className="font-bold text-[#EAF2F8]">{sakTotal} pts</span>
            </div>
            <div className="bg-[#131F2E] p-2.5 rounded-xl border border-[#1F3045]">
              <span className="text-[#9FB3C6] block text-[11px] font-medium">CAM (Delirium)</span>
              <span className="font-bold text-[#EAF2F8]">{camPositive ? "Positivo" : "Negativo"}</span>
            </div>
            <div className="bg-[#131F2E] p-2.5 rounded-xl border border-[#1F3045]">
              <span className="text-[#9FB3C6] block text-[11px] font-medium">AUDIT (Álcool)</span>
              <span className="font-bold text-[#EAF2F8]">{auditTotal} pts</span>
            </div>
            <div className="bg-[#131F2E] p-2.5 rounded-xl border border-[#1F3045]">
              <span className="text-[#9FB3C6] block text-[11px] font-medium">CALOI (Dor)</span>
              <span className="font-bold text-[#EAF2F8]">{caloiTotal}/10</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default AssessmentStepContent;

export function buildCaseSummary(profile, data) {
  const { bradenTotal, camPositive, auditTotal, sakTotal, caloiTotal } = getAssessmentTotals(data);
  const lines = [];
  if (profile.name) lines.push(`Paciente simulado: ${profile.name}, ${profile.age || "?"} anos, sexo ${profile.gender === "M" ? "masculino" : profile.gender === "F" ? "feminino" : "outro"}.`);
  if (profile.medical_history) lines.push(`Histórico: ${profile.medical_history}`);
  if (profile.previous_diseases) lines.push(`Doenças prévias: ${profile.previous_diseases}`);
  if (profile.allergies) lines.push(`Alergias: ${profile.allergies}`);
  if (profile.current_medications) lines.push(`Medicamentos em uso: ${profile.current_medications}`);
  if (profile.previous_anamnesis) lines.push(`Anamnese prévia (repasse): ${profile.previous_anamnesis}`);
  if (profile.notes) lines.push(`Observações: ${profile.notes}`);
  if (data.notes) lines.push(`Relato atual da avaliação: ${data.notes}`);
  lines.push("");
  lines.push("Sinais Vitais:");
  lines.push(`PA ${data.pa_sistolica}/${data.pa_diastolica} mmHg | FC ${data.fc} bpm | FR ${data.fr} irpm | Tax ${data.tax} °C | SatO₂ ${data.sat}%`);
  lines.push(`BRADEN: ${bradenTotal} | CAM: ${camPositive ? "Positivo (confusão)" : "Negativo"} | AUDIT: ${auditTotal} | SAK: ${sakTotal} | Dor (CALOI): ${caloiTotal}/10`);
  if (data.caloi_pain_intensity > 0) {
    const locs = Array.isArray(data.caloi_pain_location) ? data.caloi_pain_location.join(", ") : (data.caloi_pain_location || "");
    const chars = (data.caloi_pain_characteristics || []).join(", ");
    lines.push(`Dor: ${locs || "local não especificado"}${chars ? ` — ${chars}` : ""}`);
  }
  return lines.join("\n");
}
