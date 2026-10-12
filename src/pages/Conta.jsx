import React, { useState, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, Mail, UserCircle, ShieldCheck, Loader2, GraduationCap, School, Camera, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Image as ImageComponent } from "@/components/ui/image";
import { toast } from "@/components/ui/use-toast";
import PhotoCropper from "@/components/PhotoCropper";

export default function Conta() {
  const { user, logout, checkUserAuth } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.full_name || "");
  const [savingName, setSavingName] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const fileRef = useRef(null);

  const profileLabel =
    user?.user_type === "professor"
      ? "Professor"
      : user?.user_type === "aluno"
      ? "Aluno"
      : "Não definido";

  function handleLogout() {
    setBusy(true);
    logout(true);
  }

  async function switchProfile(type) {
    if (switching || user?.user_type === type) return;
    setSwitching(true);
    try {
      await base44.auth.updateMe({ user_type: type });
      await checkUserAuth();
      toast({
        title: "Perfil atualizado",
        description: type === "professor" ? "Agora você está como Professor." : "Agora você está como Aluno.",
      });
    } catch (err) {
      toast({
        title: "Erro ao trocar perfil",
        description: err.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSwitching(false);
    }
  }

  async function saveName() {
    if (!nameValue.trim() || nameValue.trim() === user?.full_name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const newName = nameValue.trim();
      await base44.auth.updateMe({ full_name: newName });
      // sincroniza o nome em todas as turmas e membros onde o usuário aparece
      try {
        await base44.entities.TurmaMember.updateMany(
          { user_id: user.id },
          { $set: { user_name: newName } }
        );
        await base44.entities.Turma.updateMany(
          { teacher_id: user.id },
          { $set: { teacher_name: newName } }
        );
      } catch {}
      await checkUserAuth();
      toast({ title: "Nome atualizado", description: "Seu nome foi atualizado em todas as turmas." });
      setEditingName(false);
    } catch (err) {
      toast({ title: "Erro ao salvar nome", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setSavingName(false);
    }
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Tamanho máximo: 10 MB.", variant: "destructive" });
      return;
    }
    setPendingFile(file);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function uploadCroppedPhoto(file) {
    setPendingFile(null);
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      await base44.auth.updateMe({ photo_url: file_url });
      try {
        await base44.entities.TurmaMember.updateMany(
          { user_id: user.id },
          { $set: { photo_url: file_url } }
        );
      } catch {}
      await checkUserAuth();
      toast({ title: "Foto atualizada" });
    } catch (err) {
      toast({ title: "Erro ao enviar foto", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
          <h1 className="mt-2 text-lg font-semibold text-slate-800">Minha conta</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4 space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="h-16 w-16 overflow-hidden rounded-2xl bg-teal-600">
                {user?.photo_url ? (
                  <ImageComponent src={user.photo_url} fittingType="fill" className="h-full w-full" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white">
                    <UserCircle className="h-8 w-8" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-teal-600 text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-50"
                title="Alterar foto"
              >
                {uploadingPhoto ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>
            <div className="min-w-0 flex-1">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveName()}
                    className="rounded-lg"
                    autoFocus
                  />
                  <Button type="button" size="icon" variant="outline" onClick={() => setEditingName(false)} disabled={savingName} className="shrink-0 rounded-lg">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button type="button" size="icon" onClick={saveName} disabled={savingName || !nameValue.trim()} className="shrink-0 rounded-lg bg-teal-600 hover:bg-teal-700">
                    {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800">
                      {user?.full_name || "Usuário"}
                    </p>
                    <p className="truncate text-sm text-slate-500">{user?.email}</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setNameValue(user?.full_name || ""); setEditingName(true); }} className="shrink-0 text-teal-600 hover:bg-teal-50">
                    Editar
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="h-4 w-4 text-slate-400" /> {user?.email}
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <ShieldCheck className="h-4 w-4 text-slate-400" /> Perfil: {profileLabel}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-700">Trocar perfil</p>
          <p className="mt-0.5 text-xs text-slate-400">Alterne entre Aluno e Professor nesta conta.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => switchProfile("aluno")}
              disabled={switching}
              className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm font-medium transition ${
                user?.user_type === "aluno"
                  ? "border-teal-600 bg-teal-50 text-teal-700"
                  : "border-slate-200 text-slate-500 hover:border-teal-300"
              }`}
            >
              {switching ? <Loader2 className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />} Aluno
            </button>
            <button
              type="button"
              onClick={() => switchProfile("professor")}
              disabled={switching}
              className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm font-medium transition ${
                user?.user_type === "professor"
                  ? "border-teal-600 bg-teal-50 text-teal-700"
                  : "border-slate-200 text-slate-500 hover:border-teal-300"
              }`}
            >
              {switching ? <Loader2 className="h-4 w-4 animate-spin" /> : <School className="h-4 w-4" />} Professor
            </button>
          </div>
        </div>

        <Button
          onClick={handleLogout}
          disabled={busy}
          variant="destructive"
          className="w-full rounded-xl"
        >
          {busy ? (
            "Saindo..."
          ) : (
            <>
              <LogOut className="h-4 w-4" /> Sair da conta
            </>
          )}
        </Button>
      </main>

      <footer className="mx-auto max-w-2xl px-4 py-4 text-center">
        <p className="text-[11px] text-slate-400">
          © 2026 Marcos Manoel Tavares Neumann — Criador e detentor dos direitos do Enfermeiro Digital
        </p>
      </footer>

      {pendingFile && (
        <PhotoCropper
          file={pendingFile}
          onConfirm={uploadCroppedPhoto}
          onCancel={() => setPendingFile(null)}
        />
      )}
    </div>
  );
}
