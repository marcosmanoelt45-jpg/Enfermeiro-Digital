import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Loader2, Plus, Trash2, UserRound, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import AssessmentStepContent, { ASSESSMENT_STEPS, DEFAULT_ASSESSMENT_DATA, AssessmentRiskBanner, buildCaseSummary } from "@/components/AssessmentSteps";
import { generateRandomName, generateRandomAge } from "@/lib/sampleNames";

const PROFILE_STEP = { key: "profile", label: "Perfil", icon: UserRound };
const QUESTION_STEP = { key: "question", label: "Pergunta", icon: HelpCircle };
const WIZARD_STEPS = [PROFILE_STEP, ...ASSESSMENT_STEPS, QUESTION_STEP];

const QUESTION_CHIPS = [
  { id: "diagnostico", label: "Diagnóstico de enfermagem", question: "Considerando o caso clínico acima, qual o diagnóstico de enfermagem (NANDA-I) mais provável para este paciente?" },
  { id: "complicacoes", label: "Complicações potenciais", question: "Considerando o caso clínico acima, quais as complicações potenciais que o enfermeiro deve prever e monitorar neste caso?" },
  { id: "erros", label: "Erros mais comuns", question: "Considerando o caso clínico acima, qual o erro mais comum no cuidado deste paciente que deve ser evitado?" },
  { id: "intervencoes", label: "Intervenções (NIC)", question: "Considerando o caso clínico acima, qual a intervenção de enfermagem (NIC) mais adequada para este caso?" },
  { id: "resultados", label: "Resultados (NOC)", question: "Considerando o caso clínico acima, qual o resultado esperado (NOC) mais adequado para este paciente?" },
  { id: "fatores", label: "Fatores de risco", question: "Considerando o caso clínico acima, qual o fator de risco que exige atenção prioritária neste caso?" },
  { id: "prioridade", label: "Prioridade de atendimento", question: "Considerando o caso clínico acima, qual a prioridade de atendimento para este paciente?" },
  { id: "plano", label: "Plano de cuidado", question: "Considerando o caso clínico acima, qual a ação do plano de cuidado de enfermagem mais adequada?" },
];

export default function CaseBuilder() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [profile, setProfile] = useState({
    name: "", age: "", gender: "M",
    previous_diseases: "", medical_history: "", current_medications: "", allergies: "", previous_anamnesis: "", notes: "",
  });
  const [data, setData] = useState(DEFAULT_ASSESSMENT_DATA);
  const [title, setTitle] = useState("");
  const [selectedChips, setSelectedChips] = useState([]);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [dueDate, setDueDate] = useState("");

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  function setOpt(i, val) {
    const opts = [...options];
    opts[i] = val;
    setOptions(opts);
  }
  function addOpt() {
    setOptions([...options, ""]);
  }
  function rmOpt(i) {
    const removed = options[i];
    const opts = options.filter((_, idx) => idx !== i);
    setOptions(opts);
    if (correctAnswer === removed) setCorrectAnswer("");
  }

  function toggleChip(chip) {
    setSelectedChips((prev) => {
      const exists = prev.find((c) => c.id === chip.id);
      let next;
      if (exists) {
        next = prev.filter((c) => c.id !== chip.id);
      } else {
        next = [...prev, chip];
      }
      setQuestion(next.map((c) => c.question).join("\n\n"));
      return next;
    });
  }

  const next = () => setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  async function handleSave() {
    setError("");
    const opts = options.map((o) => o.trim()).filter(Boolean);
    if (!title.trim()) {
      setError("Defina um título para a atividade.");
      setStep(0);
      return;
    }
    if (!question.trim()) {
      setError("Selecione ao menos um tema de pergunta e/ou escreva a pergunta.");
      setStep(WIZARD_STEPS.length - 1);
      return;
    }
    if (opts.length < 2) {
      setError("Cadastre ao menos 2 opções de resposta.");
      setStep(WIZARD_STEPS.length - 1);
      return;
    }
    if (!correctAnswer) {
      setError("Selecione a resposta correta.");
      setStep(WIZARD_STEPS.length - 1);
      return;
    }
    setSaving(true);
    try {
      const mems = await base44.entities.TurmaMember.filter({ turma_id: id }, "-updated_date", 500);
      const memberIds = Array.from(new Set([user.id, ...mems.map((m) => m.user_id).filter(Boolean)]));
      await base44.entities.CaseAssignment.create({
        turma_id: id,
        teacher_id: user.id,
        teacher_name: user.full_name || user.email,
        title: title.trim(),
        scenario: buildCaseSummary(profile, data),
        case_data: { profile, assessment: data, chips: selectedChips.map((c) => c.id) },
        question: question.trim(),
        options: opts,
        correct_answer: correctAnswer,
        explanation: explanation.trim(),
        members: memberIds,
        status: "ativa",
        due_date: dueDate || null,
      });
      navigate(`/turma/${id}`);
    } catch (e) {
      setError(e.message || "Erro ao criar atividade");
      setSaving(false);
    }
  }

  const isProfileStep = step === 0;
  const isQuestionStep = step === WIZARD_STEPS.length - 1;
  const assessmentStep = step - 1;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/turma/${id}`)} className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-base font-semibold text-slate-800">Montar caso clínico</h1>
          </div>
          <div className="mt-3 flex items-center gap-1 overflow-x-auto pb-1">
            {WIZARD_STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = i === step;
              const done = i < step;
              return (
                <button key={s.key} onClick={() => setStep(i)}
                  className={`flex shrink-0 flex-col items-center gap-1 rounded-xl px-2 py-1.5 transition ${active ? "text-teal-700" : "text-slate-400"}`}>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition ${active ? "border-teal-600 bg-teal-50" : done ? "border-teal-300 bg-teal-100" : "border-slate-200 bg-white"}`}>
                    {done ? <Check className="h-4 w-4 text-teal-600" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className="text-[10px] font-medium leading-tight">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4 pb-28">
        {!isProfileStep && !isQuestionStep && <AssessmentRiskBanner data={data} />}

        {isProfileStep && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Título da atividade *</label>
              <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Caso clínico — Risco de queda" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Nome do paciente simulado *</label>
              <div className="mt-1 flex gap-2">
                <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Ex: Sr. Silva, Paciente A..." />
                <Button type="button" variant="outline" size="icon" onClick={() => { const r = generateRandomName(); setProfile((p) => ({ ...p, name: r.name, gender: r.gender })); }} title="Nome aleatório" className="shrink-0 rounded-lg">
                  <Plus className="h-4 w-4 text-teal-600" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Idade</label>
                <div className="mt-1 flex gap-2">
                  <Input type="number" value={profile.age} onChange={(e) => setProfile({ ...profile, age: e.target.value })} />
                  <Button type="button" variant="outline" size="icon" onClick={() => setProfile((p) => ({ ...p, age: generateRandomAge() }))} title="Idade aleatória" className="shrink-0 rounded-lg">
                    <Plus className="h-4 w-4 text-teal-600" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Sexo</label>
                <select value={profile.gender} onChange={(e) => setProfile({ ...profile, gender: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Histórico prévio</label>
              <Textarea className="mt-1 min-h-[60px]" value={profile.medical_history} onChange={(e) => setProfile({ ...profile, medical_history: e.target.value })} placeholder="Comorbidades, cirurgias, condições crônicas..." />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Doenças prévias</label>
              <Textarea className="mt-1 min-h-[50px]" value={profile.previous_diseases} onChange={(e) => setProfile({ ...profile, previous_diseases: e.target.value })} placeholder="Ex: HAS, DM2, IC..." />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Medicamentos em uso</label>
              <Textarea className="mt-1 min-h-[50px]" value={profile.current_medications} onChange={(e) => setProfile({ ...profile, current_medications: e.target.value })} placeholder="Ex: Losartana 50mg, Metformina..." />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Alergias</label>
              <Input className="mt-1" value={profile.allergies} onChange={(e) => setProfile({ ...profile, allergies: e.target.value })} placeholder="Ex: Penicilina, dipirona..." />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Anamnese prévia (repasse de outro serviço)</label>
              <Textarea className="mt-1 min-h-[60px]" value={profile.previous_anamnesis} onChange={(e) => setProfile({ ...profile, previous_anamnesis: e.target.value })} placeholder="Simule informações trazidas de outro atendimento..." />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Observações</label>
              <Textarea className="mt-1 min-h-[50px]" value={profile.notes} onChange={(e) => setProfile({ ...profile, notes: e.target.value })} placeholder="Notas adicionais do caso..." />
            </div>
          </div>
        )}

        {!isProfileStep && !isQuestionStep && (
          <AssessmentStepContent data={data} set={set} step={assessmentStep} />
        )}

        {isQuestionStep && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-medium text-slate-700">Escolha os temas da pergunta</p>
              <p className="mt-0.5 text-xs text-slate-400">Toque nos balões para montar a pergunta. Você pode editar o texto depois.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {QUESTION_CHIPS.map((chip) => {
                  const active = selectedChips.find((c) => c.id === chip.id);
                  return (
                    <button key={chip.id} type="button" onClick={() => toggleChip(chip)}
                      className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition ${active ? "border-teal-600 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-500 hover:border-teal-300"}`}>
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Pergunta para os alunos *</label>
              <Textarea className="mt-1 min-h-[80px]" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Selecione um tema acima ou escreva a pergunta..." />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Opções de resposta *</label>
              <div className="mt-1 space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={opt} onChange={(e) => setOpt(i, e.target.value)} placeholder={`Opção ${i + 1}`} />
                    {options.length > 2 && (
                      <Button type="button" variant="outline" size="icon" onClick={() => rmOpt(i)} className="shrink-0">
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addOpt} className="w-full border-dashed">
                  <Plus className="h-4 w-4" /> Adicionar opção
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Resposta correta (oculta para os alunos) *</label>
              <select value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                <option value="">Selecione a resposta correta...</option>
                {options.map((o) => o.trim()).filter(Boolean).map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Comentário do professor (opcional)</label>
              <Textarea className="mt-1 min-h-[60px]" value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="Justificativa clínica que poderá ser compartilhada após a resposta..." />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Prazo (opcional)</label>
              <Input type="date" className="mt-1" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>

            {error && (
              <div className="rounded-lg bg-rose-50 p-2 text-sm text-rose-600">{error}</div>
            )}
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 inset-x-0 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3 flex gap-3">
          <Button variant="outline" onClick={prev} disabled={step === 0} className="flex-1 rounded-xl py-5">Anterior</Button>
          {step < WIZARD_STEPS.length - 1 ? (
            <Button onClick={next} className="flex-1 rounded-xl bg-teal-600 py-5 hover:bg-teal-700">Próximo</Button>
          ) : (
            <Button onClick={handleSave} disabled={saving} className="flex-1 rounded-xl bg-teal-600 py-5 hover:bg-teal-700">
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Check className="mr-2 h-5 w-5" /> Publicar atividade</>}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
