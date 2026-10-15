import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DEMO_ASSIGNMENTS } from "@/data/demoTurma";

export default function AssignmentAnswer() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [existing, setExisting] = useState(null);
  const [selected, setSelected] = useState("");
  const [rationale, setRationale] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        let a = null;
        try {
          a = await base44.entities.CaseAssignment.get(id);
        } catch {
          a = DEMO_ASSIGNMENTS.find((item) => item.id === id);
        }
        if (!a) {
          a = DEMO_ASSIGNMENTS.find((item) => item.id === id);
        }
        setAssignment(a);

        const studentId = user?.id || "demo-student-1";
        const ans = await base44.entities.StudentAnswer.filter(
          { assignment_id: id, student_id: studentId },
          "-updated_date",
          1
        );
        if (ans && ans[0]) setExisting(ans[0]);
      } catch (e) {
        // Se ainda não encontrou mas é demo
        const demo = DEMO_ASSIGNMENTS.find((item) => item.id === id);
        if (demo) {
          setAssignment(demo);
        } else {
          setError(e.message || "Erro ao carregar atividade");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user?.id]);

  async function handleSubmit() {
    if (!selected || !assignment) return;
    setSubmitting(true);
    setError("");
    try {
      const studentId = user?.id || "demo-student-1";
      const studentName = user?.full_name || user?.name || user?.email || "Aluno Visitante";
      const created = await base44.entities.StudentAnswer.create({
        assignment_id: id,
        turma_id: assignment.turma_id,
        student_id: studentId,
        student_name: studentName,
        selected_option: selected,
        rationale: rationale.trim(),
        is_correct: selected === assignment.correct_answer,
      });
      setExisting(created);
    } catch (e) {
      setError(e.message || "Erro ao enviar resposta");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-500">
        <p>Atividade não encontrada.</p>
        <Button variant="outline" className="mt-3" onClick={() => navigate(-1)}>
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <button
            onClick={() => navigate(`/turma/${assignment.turma_id}`)}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar para a turma
          </button>
          <h1 className="mt-2 text-lg font-semibold text-slate-800">{assignment.title}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4 space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-teal-600">
            Caso clínico
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {assignment.scenario}
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-800">{assignment.question}</h2>
          <p className="mt-1 text-xs text-slate-400">
            Selecione o diagnóstico de enfermagem mais provável.
          </p>

          {existing ? (
            <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
              <p className="mt-2 font-medium text-emerald-700">Resposta registrada!</p>
              <p className="mt-1 text-sm text-slate-600">
                Sua escolha: <span className="font-medium">{existing.selected_option}</span>
              </p>
              {existing.rationale && (
                <p className="mt-1 text-xs text-slate-500">
                  Justificativa: {existing.rationale}
                </p>
              )}
              <p className="mt-3 text-xs text-slate-400">
                O professor poderá comentar o caso em aula. A resposta correta não é
                exibida diretamente.
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {(assignment.options || []).map((opt) => {
                const active = selected === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => setSelected(opt)}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left text-sm transition ${
                      active
                        ? "border-teal-500 bg-teal-50 text-teal-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        active ? "border-teal-600 bg-teal-600" : "border-slate-300"
                      }`}
                    >
                      {active && <span className="h-2 w-2 rounded-full bg-white" />}
                    </span>
                    {opt}
                  </button>
                );
              })}

              <div className="pt-2">
                <label className="text-sm font-medium text-slate-700">
                  Justificativa (opcional)
                </label>
                <Textarea
                  className="mt-1 min-h-[80px]"
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="Explique brevemente o raciocínio clínico da sua escolha..."
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-2 text-sm text-rose-600">
                  <AlertCircle className="h-4 w-4" /> {error}
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={!selected || submitting}
                className="w-full rounded-xl bg-teal-600 hover:bg-teal-700"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Enviar resposta"
                )}
              </Button>
            </div>
          )}
        </section>
      </main>

      <footer className="mx-auto max-w-2xl px-4 py-4 text-center">
        <p className="text-[11px] text-slate-400">
          © 2026 Marcos Manoel Tavares Neumann — Criador e detentor dos direitos do Enfermeiro Digital
        </p>
      </footer>
    </div>
  );
}
