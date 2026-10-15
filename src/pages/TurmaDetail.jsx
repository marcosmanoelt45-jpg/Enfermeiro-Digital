import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Plus,
  ClipboardList,
  Check,
  X,
  Loader2,
  Hash,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  UserCircle,
  Settings,
  Pencil,
  Trash2,
  UserMinus
} from "lucide-react";
import { DEMO_TURMA, DEMO_MEMBERS, DEMO_ASSIGNMENTS, DEMO_ANSWERS } from "@/data/demoTurma";
import { Image as ImageComponent } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function TurmaDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [turma, setTurma] = useState(null);
  const [members, setMembers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "" });

  async function load(silent = false) {
    if (!silent) setLoading(true);
    try {
      if (id === "demo-turma-enf-2026") {
        setTurma(DEMO_TURMA);
        setMembers(DEMO_MEMBERS);
        setAssignments(DEMO_ASSIGNMENTS);
        setAnswers(DEMO_ANSWERS);
        return;
      }
      const t = await base44.entities.Turma.get(id);
      setTurma(t);
      const m = await base44.entities.TurmaMember.filter({ turma_id: id }, "-updated_date", 200);
      setMembers(m);
      const myMem = m.find((x) => x.user_id === user?.id);
      if (!myMem && t.teacher_id !== user?.id) {
        navigate("/turmas");
        return;
      }
      if (!silent) {
        try {
          await base44.functions.invoke("syncAssignmentMembers", { turma_id: id });
        } catch {}
      }
      const a = await base44.entities.CaseAssignment.filter({ turma_id: id }, "-created_date", 200);
      setAssignments(a);
      if (t.teacher_id === user?.id || myMem?.role === "professor") {
        const ans = await base44.entities.StudentAnswer.filter(
          { turma_id: id },
          "-updated_date",
          500
        );
        setAnswers(ans);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // atualizações em tempo real: recarrega silenciosamente quando algo muda na turma
    const refresh = () => load(true);
    const unsubMembers = base44.entities.TurmaMember.subscribe(refresh);
    const unsubAnswers = base44.entities.StudentAnswer.subscribe(refresh);
    const unsubAssignments = base44.entities.CaseAssignment.subscribe(refresh);
    return () => {
      unsubMembers();
      unsubAnswers();
      unsubAssignments();
    };
  }, [id, user?.id]);

  const myMember = members.find((m) => m.user_id === user?.id);
  const isProfessor =
    turma?.teacher_id === user?.id || myMember?.role === "professor";
  const isOwner = turma?.teacher_id === user?.id;
  const students = members.filter((m) => m.role === "aluno");
  const professor = members.find((m) => m.role === "professor");

  function copyCode() {
    if (!turma) return;
    navigator.clipboard?.writeText(turma.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function answersForAssignment(aid) {
    return answers.filter((a) => a.assignment_id === aid);
  }

  function openEdit() {
    setEditForm({ name: turma.name || "", description: turma.description || "" });
    setEditOpen(true);
  }

  async function saveEdit() {
    setBusy(true);
    try {
      await base44.entities.Turma.update(id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
      });
      setEditOpen(false);
      load();
    } finally {
      setBusy(false);
    }
  }

  async function deleteTurma() {
    setBusy(true);
    try {
      await base44.entities.StudentAnswer.deleteMany({ turma_id: id });
      await base44.entities.CaseAssignment.deleteMany({ turma_id: id });
      await base44.entities.TurmaMember.deleteMany({ turma_id: id });
      await base44.entities.Turma.delete(id);
      navigate("/turmas");
    } finally {
      setBusy(false);
    }
  }

  async function expelStudent(memberId) {
    setBusy(true);
    try {
      await base44.entities.TurmaMember.delete(memberId);
      try {
        await base44.functions.invoke("syncAssignmentMembers", { turma_id: id });
      } catch {}
      load();
    } finally {
      setBusy(false);
    }
  }

  async function deleteAssignment(assignmentId) {
    setBusy(true);
    try {
      await base44.entities.StudentAnswer.deleteMany({ assignment_id: assignmentId });
      await base44.entities.CaseAssignment.delete(assignmentId);
      load();
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!turma) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-500">
        <p>Turma não encontrada.</p>
        <Button variant="outline" className="mt-3" onClick={() => navigate("/turmas")}>
          Voltar para turmas
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <button
            onClick={() => navigate("/turmas")}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" /> Turmas
          </button>
          <div className="mt-2 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-slate-800">{turma.name}</h1>
              {turma.description && (
                <p className="text-sm text-slate-500">{turma.description}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {isProfessor && (
                <button
                  onClick={openEdit}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-2.5 py-2 text-sm text-slate-500 hover:bg-slate-50"
                  title="Editar turma"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              {isProfessor && (
                <button
                  onClick={copyCode}
                  className="flex items-center gap-1.5 rounded-xl border-2 border-dashed border-teal-300 px-3 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50"
                  title="Copiar código"
                >
                  {copied ? <CheckCheck className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
                  {turma.code}
                </button>
              )}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <Users className="h-3.5 w-3.5" />
            {students.length} aluno{students.length !== 1 ? "s" : ""}
            {turma.teacher_name && (
              <span className="flex items-center gap-1">
                ·
                {professor?.photo_url && (
                  <div className="h-4 w-4 overflow-hidden rounded-full bg-teal-100">
                    <ImageComponent src={professor.photo_url} fittingType="fill" className="h-full w-full" />
                  </div>
                )}
                Prof. {turma.teacher_name}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4 space-y-4">
        {isProfessor && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <UserCircle className="h-4 w-4 text-teal-600" /> Alunos da turma
              </h2>
              <Button
                size="sm"
                onClick={() => navigate(`/turma/${id}/nova-atividade`)}
                className="rounded-xl bg-teal-600 hover:bg-teal-700"
              >
                <Plus className="h-4 w-4" /> Nova atividade
              </Button>
            </div>
            {students.length === 0 ? (
              <p className="text-sm text-slate-400">
                Nenhum aluno entrou ainda. Compartilhe o código{" "}
                <span className="font-mono font-medium text-teal-700">{turma.code}</span>.
              </p>
            ) : (
              <div className="space-y-1.5">
                {students.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-teal-100">
                        {s.photo_url ? (
                          <ImageComponent src={s.photo_url} fittingType="fill" className="h-full w-full" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <UserCircle className="h-5 w-5 text-teal-400" />
                          </div>
                        )}
                      </div>
                      <span className="min-w-0 truncate text-xs text-slate-600">
                        {s.user_name || s.user_email}
                      </span>
                    </div>
                    {isOwner && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            disabled={busy}
                            className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs text-rose-500 hover:bg-rose-50 disabled:opacity-50"
                            title="Expulsar aluno"
                          >
                            <UserMinus className="h-3.5 w-3.5" /> Expulsar
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Expulsar aluno?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {s.user_name || s.user_email} será removido da turma e perderá acesso às atividades. Ele poderá entrar novamente com o código.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => expelStudent(s.id)}
                              className="bg-rose-600 hover:bg-rose-700"
                            >
                              Expulsar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {isProfessor && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <Settings className="h-4 w-4 text-teal-600" /> Configurações da turma
            </h2>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={openEdit}
                className="justify-start rounded-xl"
              >
                <Pencil className="h-4 w-4" /> Editar nome e descrição
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={busy}
                    className="justify-start rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <Trash2 className="h-4 w-4" /> Excluir turma
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir turma permanentemente?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Todos os alunos, atividades e respostas desta turma serão apagados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={deleteTurma}
                      className="bg-rose-600 hover:bg-rose-700"
                    >
                      Excluir tudo
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <ClipboardList className="h-4 w-4 text-teal-600" /> Atividades
          </h2>
          {assignments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
              {isProfessor
                ? "Nenhuma atividade publicada. Toque em \"Nova atividade\" para compartilhar um caso."
                : "Nenhuma atividade disponível ainda."}
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map((a) => {
                const ans = answersForAssignment(a.id);
                const open = expanded[a.id];
                return (
                  <div
                    key={a.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800">{a.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">
                          {a.question}
                        </p>
                        {a.due_date && (
                          <p className="mt-1 text-xs text-slate-400">Prazo: {a.due_date}</p>
                        )}
                      </div>
                      {isProfessor ? (
                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            onClick={() =>
                              setExpanded((e) => ({ ...e, [a.id]: !e[a.id] }))
                            }
                            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-slate-50"
                          >
                            {ans.length} resposta{ans.length !== 1 ? "s" : ""}
                            {open ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                disabled={busy}
                                className="flex items-center rounded-lg border border-rose-200 px-1.5 py-1 text-xs text-rose-500 hover:bg-rose-50 disabled:opacity-50"
                                title="Excluir atividade"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir atividade?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  "{a.title}" e todas as respostas dos alunos serão apagados permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteAssignment(a.id)}
                                  className="bg-rose-600 hover:bg-rose-700"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => navigate(`/assignment/${a.id}`)}
                          className="shrink-0 rounded-xl bg-teal-600 hover:bg-teal-700"
                        >
                          Responder
                        </Button>
                      )}
                    </div>

                    {isProfessor && open && (
                      <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                        <p className="text-xs text-slate-400">
                          Resposta correta:{" "}
                          <span className="font-medium text-slate-700">
                            {a.correct_answer}
                          </span>
                        </p>
                        {ans.length === 0 ? (
                          <p className="text-sm text-slate-400">
                            Nenhuma resposta ainda.
                          </p>
                        ) : (
                          ans.map((r) => (
                            <div
                              key={r.id}
                              className="rounded-xl bg-slate-50 p-2.5 text-sm"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-slate-700">
                                  {r.student_name || "Aluno"}
                                </span>
                                {r.is_correct ? (
                                  <span className="flex items-center gap-1 text-xs text-emerald-600">
                                    <Check className="h-3.5 w-3.5" /> Correto
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-xs text-rose-500">
                                    <X className="h-3.5 w-3.5" /> Incorreto
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-slate-600">
                                Escolha: {r.selected_option}
                              </p>
                              {r.rationale && (
                                <p className="mt-0.5 text-xs text-slate-400">
                                  Justificativa: {r.rationale}
                                </p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <footer className="mx-auto max-w-2xl px-4 py-4 text-center">
        <p className="text-[11px] text-slate-400">
          © 2026 Marcos Manoel Tavares Neumann — Criador e detentor dos direitos do Enfermeiro Digital
        </p>
      </footer>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Editar turma</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-slate-700">Nome da turma</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700">Descrição</Label>
              <Input
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                className="mt-1"
                placeholder="Opcional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button
              onClick={saveEdit}
              disabled={busy || !editForm.name.trim()}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
