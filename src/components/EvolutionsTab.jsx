import React, { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { evolutionService, authService } from "@/services";
import { FileText, Loader2, Plus, Trash2, Save, ShieldCheck, CheckCircle2, AlertTriangle, KeyRound, Lock, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const FIELDS = [
  { key: "subjective", label: "Subjetivo (S)", placeholder: "Relato do paciente / queixas" },
  { key: "objective", label: "Objetivo (O)", placeholder: "Sinais vitais, exame físico, dados observáveis" },
  { key: "assessment", label: "Avaliação (A)", placeholder: "Interpretação clínica, diagnósticos" },
  { key: "plan", label: "Plano (P)", placeholder: "Condutas, intervenções, prescrições" }
];

export default function EvolutionsTab({ patientId }) {
  const [evolutions, setEvolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subjective: "", objective: "", assessment: "", plan: "" });
  const [saving, setSaving] = useState(false);

  // Modal de Assinatura Avançada
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [selectedEvolution, setSelectedEvolution] = useState(null);
  const [profileCoren, setProfileCoren] = useState("");
  const [corenInput, setCorenInput] = useState("");
  const [signing, setSigning] = useState(false);

  // Confirmação de exclusão
  const [deleteId, setDeleteId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await evolutionService.filter({ patient_id: patientId }, "-created_date", 100);
      setEvolutions(data || []);
    } catch (err) {
      toast({ variant: "destructive", title: "Erro ao carregar evoluções", description: err.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    authService.getCurrentUser().then((u) => {
      if (u?.coren) {
        setProfileCoren(u.coren);
        setCorenInput(u.coren);
      }
    });
  }, [patientId]);

  function update(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function save() {
    setSaving(true);
    try {
      await evolutionService.create({ patient_id: patientId, ...form });
      toast({ title: "Evolução salva como rascunho" });
      setForm({ subjective: "", objective: "", assessment: "", plan: "" });
      setShowForm(false);
      load();
    } catch (err) {
      toast({ variant: "destructive", title: "Não foi possível salvar", description: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function confirmRemove() {
    if (!deleteId) return;
    try {
      await evolutionService.delete(deleteId);
      toast({ title: "Evolução removida" });
      load();
    } catch (err) {
      toast({ variant: "destructive", title: "Não foi possível remover", description: err.message });
    } finally {
      setDeleteId(null);
    }
  }

  function openSignModal(ev) {
    setSelectedEvolution(ev);
    setSignModalOpen(true);
  }

  async function handleSignConfirm() {
    if (!selectedEvolution) return;
    const finalCoren = profileCoren || corenInput.trim();
    if (!finalCoren) {
      toast({ title: "COREN obrigatório", description: "Informe seu registro COREN para assinar a evolução." });
      return;
    }

    setSigning(true);
    try {
      await evolutionService.signEvolution(selectedEvolution.id, finalCoren);
      toast({ title: "Evolução assinada com sucesso!" });
      setSignModalOpen(false);
      setSelectedEvolution(null);
      load();
    } catch (err) {
      toast({ variant: "destructive", title: "Não foi possível assinar", description: err.message });
    } finally {
      setSigning(false);
    }
  }

  function copyHash(hash) {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    toast({ title: "Hash copiado para a área de transferência" });
  }

  return (
    <div className="space-y-4">
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="w-full rounded-2xl py-5 transition">
          <Plus className="mr-2 h-5 w-5" /> Nova Evolução Estruturada (SOAP)
        </Button>
      ) : (
        <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#1F3045] pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#20D5B5]" />
              <div>
                <p className="text-sm font-semibold text-[#EAF2F8]">Nova Evolução de Enfermagem</p>
                <p className="text-xs text-[#9FB3C6]">Estrutura clínica SOAP de acordo com a Resolução COFEN nº 736/2024</p>
              </div>
            </div>
            <span className="rounded-full bg-[#20D5B5]/15 border border-[#20D5B5]/30 px-2.5 py-1 text-[11px] font-medium text-[#20D5B5]">Rascunho</span>
          </div>

          {FIELDS.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label className="text-xs font-semibold text-[#9FB3C6]">{f.label}</Label>
              <Textarea
                value={form[f.key]}
                onChange={(e) => update(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="rounded-xl border-[#27394B] bg-[#0B131D] text-[#EAF2F8] focus:border-[#20D5B5] text-sm"
                rows={2}
              />
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <Button onClick={save} disabled={saving} className="flex-1 rounded-xl">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Salvar Rascunho
            </Button>
            <Button onClick={() => setShowForm(false)} variant="outline" className="rounded-xl">
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9FB3C6]">
            Evoluções Registradas ({evolutions.length})
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-[#9FB3C6]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#20D5B5]" />
            <span>Assinatura Avançada (Lei nº 14.063/2020)</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#20D5B5]" /></div>
        ) : evolutions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#1F3045] bg-[#131F2E] p-8 text-center text-sm text-[#52667A]">
            Nenhuma evolução registrada para este paciente.
          </div>
        ) : (
          <div className="space-y-3">
            {evolutions.map((ev) => (
              <div
                key={ev.id}
                className={`rounded-2xl border p-4 shadow-sm transition ${
                  ev.signed
                    ? "border-[#20D5B5]/30 bg-[#20D5B5]/5"
                    : "border-[#1F3045] bg-[#131F2E]"
                }`}
              >
                <div className="mb-3 flex items-center justify-between border-b border-[#1F3045] pb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-[#9FB3C6]">
                      {new Date(ev.created_date || ev.created_at).toLocaleString("pt-BR")}
                    </p>
                    {ev.signed ? (
                      <span className="flex items-center gap-1 rounded-full bg-[#20D5B5]/20 border border-[#20D5B5]/30 px-2.5 py-0.5 text-[10px] font-semibold text-[#20D5B5]">
                        <CheckCircle2 className="h-3 w-3" /> Assinado & Auditado
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#FFC247]/20 border border-[#FFC247]/30 px-2.5 py-0.5 text-[10px] font-semibold text-[#FFC247]">
                        Pendente de Assinatura
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {!ev.signed && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => openSignModal(ev)}
                          className="h-8 rounded-xl px-3 text-xs font-medium"
                        >
                          <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Revisar e Assinar
                        </Button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(ev.id)}
                          aria-label="Excluir evolução"
                          className="rounded-lg p-1.5 text-[#52667A] hover:bg-red-500/10 hover:text-[#FF6B6B] transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {ev.subjective && (
                    <p className="text-[#EAF2F8] leading-relaxed">
                      <span className="font-semibold text-[#9FB3C6]">S (Subjetivo): </span>{ev.subjective}
                    </p>
                  )}
                  {ev.objective && (
                    <p className="text-[#EAF2F8] leading-relaxed">
                      <span className="font-semibold text-[#9FB3C6]">O (Objetivo): </span>{ev.objective}
                    </p>
                  )}
                  {ev.assessment && (
                    <p className="text-[#EAF2F8] leading-relaxed">
                      <span className="font-semibold text-[#9FB3C6]">A (Avaliação): </span>{ev.assessment}
                    </p>
                  )}
                  {ev.plan && (
                    <p className="text-[#EAF2F8] leading-relaxed">
                      <span className="font-semibold text-[#9FB3C6]">P (Plano): </span>{ev.plan}
                    </p>
                  )}
                </div>

                {ev.signed && (
                  <div className="mt-3 rounded-xl border border-[#20D5B5]/30 bg-[#0E1722] p-2.5 text-[11px] text-[#9FB3C6] space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <Lock className="h-3 w-3 text-[#20D5B5]" />
                        <span className="font-semibold text-[#EAF2F8]">
                          Selo do Servidor: {ev.signer_name || "Enfermeiro(a)"} ({ev.signer_coren || "COREN registrado"})
                        </span>
                      </div>
                      <span className="text-[10px] text-[#9FB3C6]">
                        {ev.signed_at
                          ? `${new Date(ev.signed_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (Horário de Brasília)`
                          : "Data pendente"}
                      </span>
                    </div>
                    {ev.signed_by && (
                      <p className="text-[10px] text-[#52667A]">Assinado por UID: {ev.signed_by}</p>
                    )}
                    {ev.signature_hash_sha256 && (
                      <div className="flex items-center justify-between gap-2 font-mono text-[10px] text-[#20D5B5] bg-[#131F2E] px-2 py-1 rounded">
                        <div className="flex items-center gap-1 overflow-hidden">
                          <KeyRound className="h-3 w-3 shrink-0" />
                          <span className="truncate">SHA-256: {ev.signature_hash_sha256.slice(0, 16)}…{ev.signature_hash_sha256.slice(-8)}</span>
                          {ev.signature_origin === "local" && <span className="shrink-0 font-sans text-[#FFC247]">(offline, não verificável)</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => copyHash(ev.signature_hash_sha256)}
                          aria-label="Copiar Hash SHA-256"
                          className="hover:text-white p-0.5"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-[#131F2E] border-[#1F3045] text-[#EAF2F8]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#EAF2F8]">Deseja remover esta evolução?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#9FB3C6]">
              Esta ação removerá o rascunho de evolução. Evoluções assinadas não podem ser excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#1F3045] bg-[#0E1722] text-[#9FB3C6] hover:bg-[#16222E]">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove} className="bg-[#FF6B6B] hover:bg-[#FF6B6B]/80 text-white">
              Sim, remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Assinatura Avançada Human-in-the-Loop */}
      <Dialog open={signModalOpen} onOpenChange={setSignModalOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-[#131F2E] border-[#1F3045] text-[#EAF2F8]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#EAF2F8]">
              <ShieldCheck className="h-5 w-5 text-[#20D5B5]" />
              Revisar, Aceitar e Assinar Evolução
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm">
            <div className="rounded-xl bg-[#FFC247]/10 p-3 text-xs text-[#FFC247] border border-[#FFC247]/30 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-[#FFC247]" />
              <div>
                <p className="font-semibold text-[#EAF2F8]">Conformidade Legal & Integridade</p>
                <p>Ao assinar, será gerado um carimbo de data/hora oficial e um Hash SHA-256 criptográfico imutável, tornando esta anotação um documento oficial em conformidade com a Resolução COFEN nº 736/2024.</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#9FB3C6]">Registro Profissional (COREN):</Label>
              {profileCoren ? (
                <div className="rounded-xl bg-[#0B131D] border border-[#27394B] p-2.5 text-xs text-[#9FB3C6]">
                  COREN do seu perfil (altere em Minha Conta): <strong className="text-[#20D5B5]">{profileCoren}</strong>
                </div>
              ) : (
                <Input
                  value={corenInput}
                  onChange={(e) => setCorenInput(e.target.value)}
                  placeholder="Ex: COREN-SP 123456"
                  className="rounded-xl text-sm bg-[#0B131D] border-[#27394B] text-[#EAF2F8]"
                />
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setSignModalOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={handleSignConfirm}
              disabled={signing || (!profileCoren && !corenInput.trim())}
              className="rounded-xl"
            >
              {signing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Revisar, Aceitar e Assinar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
