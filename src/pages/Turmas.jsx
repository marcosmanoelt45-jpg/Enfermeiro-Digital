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
      await base44.auth.updateMe({ user_type: type, role: type });
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
    if (code === "ENF2026") {
      navigate("/turma/demo-turma-enf-2026");
      return;
    }
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4 transition-colors">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="mb-5 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white">
              <UserCog className="h-6 w-6" />
            </div>
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Como você vai usar o app?</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Escolha seu perfil para continuar.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedRole("aluno")}
              className={`rounded-2xl border-2 p-5 text-left transition ${
                selectedRole === "aluno"
                  ? "border-teal-600 bg-teal-50 dark:bg-teal-950/40"
                  : "border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-600 hover:bg-teal-50/50 dark:hover:bg-slate-800"
              }`}
            >
              <GraduationCap className="h-7 w-7 text-teal-600 dark:text-teal-400" />
              <p className="mt-2 font-semibold text-slate-800 dark:text-slate-100">Aluno</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Entrar em turmas e responder casos</p>
            </button>
            <button
              onClick={() => setSelectedRole("professor")}
              className={`rounded-2xl border-2 p-5 text-left transition ${
                selectedRole === "professor"
                  ? "border-teal-600 bg-teal-50 dark:bg-teal-950/40"
                  : "border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-600 hover:bg-teal-50/50 dark:hover:bg-slate-800"
              }`}
            >
              <ClipboardList className="h-7 w-7 text-teal-600 dark:text-teal-400" />
              <p className="mt-2 font-semibold text-slate-800 dark:text-slate-100">Professor</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Criar turmas e compartilhar casos</p>
            </button>
          </div>

          {selectedRole && (
            <div className="mt-5 space-y-2">
              <Button
                onClick={() => chooseRole(selectedRole)}
                disabled={roleSaving}
                className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white"
              >
                {roleSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/register?role=${selectedRole}`)}
                className="w-full rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                Criar conta
              </Button>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 p-2 text-sm text-rose-600 dark:text-rose-400">{error}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      <header className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300">
                {isProfessor ? "Professor" : "Aluno"}
              </span>
              <button
                type="button"
                onClick={() => chooseRole(isProfessor ? "aluno" : "professor")}
                disabled={roleSaving}
                className="text-[11px] text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 underline transition"
                title="Trocar visão entre Aluno e Professor"
              >
                {roleSaving ? "Trocando..." : `Mudar p/ ${isProfessor ? "Aluno" : "Professor"}`}
              </button>
            </div>
            {isProfessor ? (
              <Button
                onClick={() => setCreateOpen(true)}
                size="sm"
                className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white"
              >
                <Plus className="h-4 w-4" /> Criar turma
              </Button>
            ) : null}
          </div>

          {!isProfessor && (
            <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <Label className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                <Hash className="h-4 w-4 text-teal-600 dark:text-teal-400" /> Entrar em uma turma com código
              </Label>
              <div className="mt-2 flex gap-2">
                <Input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Ex: AB3X9K"
                  className="uppercase rounded-xl bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
                <Button
                  onClick={handleJoin}
                  disabled={joining || !joinCode.trim()}
                  className="shrink-0 rounded-xl bg-teal-600 hover:bg-teal-700 text-white"
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
        {/* CARD DA TURMA MODELO / DEMONSTRAÇÃO */}
        <div className="rounded-2xl border-2 border-teal-200 dark:border-teal-800/60 bg-gradient-to-r from-teal-50/80 to-sky-50/80 dark:from-slate-900 dark:to-slate-900/90 p-4 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 bg-teal-100 dark:bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                    Turma Modelo / Demonstração
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Código: ENF2026
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                  Enfermagem Clínica &amp; Terapia Intensiva — 2026
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                  Turma exemplo com 7 alunos fictícios, 2 estudos de caso atribuídos e respostas corrigidas para exploração do módulo docente/discente.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-teal-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-teal-700 dark:text-teal-400 font-medium">Ambiente Interativo Ativo</span>
            <Button
              size="sm"
              onClick={() => navigate("/turma/demo-turma-enf-2026")}
              className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-4 h-8"
            >
              Explorar Turma Modelo
              <ArrowLeft className="h-3.5 w-3.5 rotate-180 ml-1.5" />
            </Button>
          </div>
        </div>

        {/* LISTA DE TURMAS DO USUÁRIO */}
        <div className="pt-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-2 px-1">
            Suas Turmas ({memberships.length})
          </span>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
            </div>
          ) : memberships.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
              {isProfessor
                ? 'Você ainda não criou turmas próprias. Toque em "Criar turma" acima para iniciar.'
                : 'Você ainda não entrou em turmas criadas por seus professores. Use o campo acima para inserir o código.'}
            </div>
          ) : (
            <div className="space-y-2.5">
              {memberships.map((m) => (
                <button
                  key={m.id}
                  onClick={() => navigate(`/turma/${m.turma_id}`)}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-left transition hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-400">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-100">{m.turma_name}</p>
                      <p className="text-xs text-slate-400">
                        Código: {m.turma_code} ·{" "}
                        {m.role === "professor" ? "Professor" : "Aluno"}
                      </p>
                    </div>
                  </div>
                  <ArrowLeft className="h-4 w-4 rotate-180 text-slate-300 dark:text-slate-600" />
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="mx-auto max-w-2xl px-4 py-4 text-center">
        <p className="text-[11px] text-slate-400 dark:text-slate-400">
          © 2026 Marcos Manoel Tavares Neumann — Criador e detentor dos direitos da plataforma Enfere
        </p>
      </footer>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-2xl dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">Criar nova turma</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-slate-700 dark:text-slate-300">Nome da turma *</Label>
              <Input
                className="mt-1 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Enfermagem 2026 — Turma A"
              />
            </div>
            <div>
              <Label className="text-slate-700 dark:text-slate-300">Descrição (opcional)</Label>
              <Textarea
                className="mt-1 min-h-[70px] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Disciplina, semestre, observações..."
              />
            </div>
            <p className="text-xs text-slate-400">
              Um código de entrada será gerado automaticamente para você compartilhar com os alunos.
            </p>
            {error && (
              <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 p-2 text-sm text-rose-600 dark:text-rose-400">{error}</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving || !form.name.trim()}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar turma"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
