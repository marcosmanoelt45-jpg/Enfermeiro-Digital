import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  Hash,
  Loader2,
  GraduationCap,
  ArrowLeft,
  UserCog,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { generateTurmaCode } from "@/lib/turmaUtils";

export default function Turmas() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [needsRole, setNeedsRole] = useState(false);
  const [roleSaving, setRoleSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");

  const isProfessor = user?.user_type === "professor";

  async function load() {
    if (!user) return;
    setLoading(true);
    try {
      const list = await base44.entities.TurmaMember.filter(
        { user_id: user.id },
        "-updated_date",
        200
      );
      setMemberships(list);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    if (!user.user_type) {
      setNeedsRole(true);
      setLoading(false);
    } else {
      setNeedsRole(false);
      load();
    }
  }, [user]);

  useEffect(() => {
    if (!user || needsRole) return;
    const unsub = base44.entities.TurmaMember.subscribe(() => load());
    return unsub;
  }, [user, needsRole]);

  async function chooseRole(type) {
    setRoleSaving(true);
    setError("");
    try {
      await base44.auth.updateMe({ user_type: type });
      window.location.reload();
    } catch (e) {
      setError(e.message || "Erro ao definir perfil");
      setRoleSaving(false);
    }
  }

  async function handleJoin() {
    setError("");
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setJoining(true);
    try {
      const turmas = await base44.entities.Turma.filter({ code }, "-updated_date", 1);
      const turma = turmas[0];
      if (!turma) {
        setError("Código de turma não encontrado.");
        return;
      }
      const existing = await base44.entities.TurmaMember.filter(
        { turma_id: turma.id, user_id: user.id },
        "-updated_date",
        1
      );
      if (existing[0]) {
        navigate(`/turma/${turma.id}`);
        return;
      }
      await base44.entities.TurmaMember.create({
        turma_id: turma.id,
        turma_code: turma.code,
        turma_name: turma.name,
        user_id: user.id,
        user_name: user.full_name || user.email,
        user_email: user.email,
        role: "aluno",
      });
      try {
        await base44.functions.invoke("syncAssignmentMembers", { turma_id: turma.id });
      } catch {}
      navigate(`/turma/${turma.id}`);
    } catch (e) {
      setError(e.message || "Erro ao entrar na turma.");
    } finally {
      setJoining(false);
    }
  }

  async function handleCreate() {
    if (!form.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const code = generateTurmaCode();
      const turma = await base44.entities.Turma.create({
        name: form.name.trim(),
        code,
        teacher_id: user.id,
        teacher_name: user.full_name || user.email,
        description: form.description,
      });
      await base44.entities.TurmaMember.create({
        turma_id: turma.id,
        turma_code: code,
        turma_name: turma.name,
        user_id: user.id,
        user_name: user.full_name || user.email,
        user_email: user.email,
        role: "professor",
      });
      setCreateOpen(false);
      setForm({ name: "", description: "" });
      navigate(`/turma/${turma.id}`);
    } catch (e) {
      setError(e.message || "Erro ao criar turma.");
    } finally {
      setSaving(false);
    }
  }

  if (needsRole) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white">
              <UserCog className="h-6 w-6" />
            </div>
            <h1 className="text-lg font-semibold text-slate-800">Como você vai usar o app?</h1>
            <p className="mt-1 text-sm text-slate-500">
              Escolha seu perfil para continuar.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedRole("aluno")}
              className={`rounded-2xl border-2 p-5 text-left transition ${
                selectedRole === "aluno"
                  ? "border-teal-600 bg-teal-50"
                  : "border-slate-200 hover:border-teal-500 hover:bg-teal-50"
              }`}
            >
              <GraduationCap className="h-7 w-7 text-teal-600" />
              <p className="mt-2 font-semibold text-slate-800">Aluno</p>
              <p className="text-xs text-slate-500">Entrar em turmas e responder casos</p>
            </button>
            <button
              onClick={() => setSelectedRole("professor")}
              className={`rounded-2xl border-2 p-5 text-left transition ${
                selectedRole === "professor"
                  ? "border-teal-600 bg-teal-50"
                  : "border-slate-200 hover:border-teal-500 hover:bg-teal-50"
              }`}
            >
              <ClipboardList className="h-7 w-7 text-teal-600" />
              <p className="mt-2 font-semibold text-slate-800">Professor</p>
              <p className="text-xs text-slate-500">Criar turmas e compartilhar casos</p>
            </button>
          </div>

          {selectedRole && (
            <div className="mt-5 space-y-2">
              <Button
                onClick={() => chooseRole(selectedRole)}
                disabled={roleSaving}
                className="w-full rounded-xl bg-teal-600 hover:bg-teal-700"
              >
                {roleSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/register?role=${selectedRole}`)}
                className="w-full rounded-xl"
              >
                Criar conta
              </Button>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg bg-rose-50 p-2 text-sm text-rose-600">{error}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            <h1 className="text-lg font-semibold text-slate-800">Minhas Turmas</h1>
            {isProfessor ? (
              <Button
                onClick={() => setCreateOpen(true)}
                size="sm"
                className="rounded-xl bg-teal-600 hover:bg-teal-700"
              >
                <Plus className="h-4 w-4" /> Criar turma
              </Button>
            ) : (
              <span className="text-xs text-slate-400">Aluno</span>
            )}
          </div>

          {!isProfessor && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <Label className="flex items-center gap-1.5 text-slate-700">
                <Hash className="h-4 w-4 text-teal-600" /> Entrar em uma turma com código
              </Label>
              <div className="mt-2 flex gap-2">
                <Input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Ex: AB3X9K"
                  className="uppercase rounded-xl"
                />
                <Button
                  onClick={handleJoin}
                  disabled={joining || !joinCode.trim()}
                  className="shrink-0 rounded-xl bg-teal-600 hover:bg-teal-700"
                >
                  {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
                </Button>
              </div>
              {error && (
                <p className="mt-2 text-xs text-rose-500">{error}</p>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          </div>
        ) : memberships.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">
            {isProfessor
              ? "Você ainda não criou turmas. Toque em \"Criar turma\" para começar."
              : "Você ainda não entrou em nenhuma turma. Use o código compartilhado pelo professor."}
          </div>
        ) : (
          memberships.map((m) => (
            <button
              key={m.id}
              onClick={() => navigate(`/turma/${m.turma_id}`)}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-teal-300 hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">{m.turma_name}</p>
                  <p className="text-xs text-slate-400">
                    Código: {m.turma_code} ·{" "}
                    {m.role === "professor" ? "Professor" : "Aluno"}
                  </p>
                </div>
              </div>
              <ArrowLeft className="h-4 w-4 rotate-180 text-slate-300" />
            </button>
          ))
        )}
      </main>

      <footer className="mx-auto max-w-2xl px-4 py-4 text-center">
        <p className="text-[11px] text-slate-400">
          © 2026 Marcos Manoel Tavares Neumann — Criador e detentor dos direitos do Enfermeiro Digital
        </p>
      </footer>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Criar nova turma</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome da turma *</Label>
              <Input
                className="mt-1"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Enfermagem 2026 — Turma A"
              />
            </div>
            <div>
              <Label>Descrição (opcional)</Label>
              <Textarea
                className="mt-1 min-h-[70px]"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Disciplina, semestre, observações..."
              />
            </div>
            <p className="text-xs text-slate-400">
              Um código de entrada será gerado automaticamente para você compartilhar com os alunos.
            </p>
            {error && (
              <div className="rounded-lg bg-rose-50 p-2 text-sm text-rose-600">{error}</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving || !form.name.trim()}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar turma"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
