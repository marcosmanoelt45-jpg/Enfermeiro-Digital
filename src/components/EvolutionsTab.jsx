import React, { useState, useEffect } from "react";
import { evolutionService, authService } from "@/services";
import { FileText, Loader2, Plus, Trash2, Save, ShieldCheck, CheckCircle2, AlertTriangle, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

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
  const [corenInput, setCorenInput] = useState("");
  const [signing, setSigning] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await evolutionService.filter({ patient_id: patientId }, "-created_date", 100);
      setEvolutions(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    authService.getCurrentUser().then((u) => {
      if (u?.coren) setCorenInput(u.coren);
    });
  }, [patientId]);

  function update(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function save() {
    setSaving(true);
    try {
      await evolutionService.create({ patient_id: patientId, ...form });
      setForm({ subjective: "", objective: "", assessment: "", plan: "" });
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (confirm("Deseja realmente remover esta evolução?")) {
      await evolutionService.delete(id);
      load();
    }
  }

  function openSignModal(ev) {
    setSelectedEvolution(ev);
    setSignModalOpen(true);
  }

  async function handleSignConfirm() {
    if (!selectedEvolution) return;
    if (!corenInput.trim()) {
      alert("Informe seu registro COREN para assinar a evolução.");
      return;
    }

    setSigning(true);
    try {
      await evolutionService.signEvolution(selectedEvolution.id, corenInput.trim());
      setSignModalOpen(false);
      setSelectedEvolution(null);
      load();
    } catch (err) {
      alert("Erro ao assinar evolução: " + err.message);
    } finally {
      setSigning(false);
    }
  }

  return (
    <div className="space-y-4">
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="w-full rounded-2xl bg-teal-600 py-5 hover:bg-teal-700 shadow-sm transition">
          <Plus className="mr-2 h-5 w-5" /> Nova Evolução Estruturada (SOAP)
        </Button>
      ) : (
        <div className="rounded-2xl border border-teal-100 bg-white p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal-600" />
              <div>
                <p className="text-sm font-semibold text-slate-800">Nova Evolução de Enfermagem</p>
                <p className="text-xs text-slate-500">Estrutura clínica SOAP de acordo com a Resolução COFEN nº 736/2024</p>
              </div>
            </div>
            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-medium text-teal-700">Rascunho</span>
          </div>

          {FIELDS.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">{f.label}</Label>
              <Textarea
                value={form[f.key]}
                onChange={(e) => update(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="rounded-xl border-slate-200 focus:border-teal-500 text-sm"
                rows={2}
              />
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <Button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700">
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
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Evoluções Registradas ({evolutions.length})
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
            <span>Assinatura Avançada (Lei nº 14.063/2020)</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div>
        ) : evolutions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
            Nenhuma evolução registrada para este paciente.
          </div>
        ) : (
          <div className="space-y-3">
            {evolutions.map((ev) => (
              <div
                key={ev.id}
                className={`rounded-2xl border bg-white p-4 shadow-sm transition ${
                  ev.signed ? "border-emerald-200 bg-emerald-50/20" : "border-slate-200"
                }`}
              >
                <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-slate-500">
                      {new Date(ev.created_date).toLocaleString("pt-BR")}
                    </p>
                    {ev.signed ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" /> Assinado & Auditado
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800">
                        Pendente de Assinatura
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {!ev.signed && (
                      <Button
                        size="sm"
                        onClick={() => openSignModal(ev)}
                        className="h-8 rounded-xl bg-teal-600 px-3 text-xs font-medium hover:bg-teal-700"
                      >
                        <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Revisar e Assinar
                      </Button>
                    )}
                    <button
                      onClick={() => remove(ev.id)}
                      className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 transition"
                      title="Excluir evolução"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {ev.subjective && (
                    <p className="text-slate-800 leading-relaxed">
                      <span className="font-semibold text-slate-500">S (Subjetivo): </span>{ev.subjective}
                    </p>
                  )}
                  {ev.objective && (
                    <p className="text-slate-800 leading-relaxed">
                      <span className="font-semibold text-slate-500">O (Objetivo): </span>{ev.objective}
                    </p>
                  )}
                  {ev.assessment && (
                    <p className="text-slate-800 leading-relaxed">
                      <span className="font-semibold text-slate-500">A (Avaliação): </span>{ev.assessment}
                    </p>
                  )}
                  {ev.plan && (
                    <p className="text-slate-800 leading-relaxed">
                      <span className="font-semibold text-slate-500">P (Plano): </span>{ev.plan}
                    </p>
                  )}
                </div>

                {ev.signed && (
                  <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-2.5 text-[11px] text-emerald-900 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Responsável Técnico: {ev.signer_name || "Enfermeiro(a)"} ({ev.signer_coren})</span>
                      <span className="text-[10px] text-emerald-700">{new Date(ev.signed_at).toLocaleString("pt-BR")} UTC</span>
                    </div>
                    {ev.signature_hash_sha256 && (
                      <div className="flex items-center gap-1 font-mono text-[10px] text-emerald-700 break-all">
                        <KeyRound className="h-3 w-3 shrink-0" />
                        <span>SHA-256: {ev.signature_hash_sha256}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Assinatura Avançada Human-in-the-Loop */}
      <Dialog open={signModalOpen} onOpenChange={setSignModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <ShieldCheck className="h-5 w-5 text-teal-600" />
              Revisar, Aceitar e Assinar Evolução
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm">
            <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Conformidade Legal & Integridade</p>
                <p>Ao assinar, será gerado um carimbo de data/hora UTC e um Hash SHA-256 criptográfico imutável, tornando esta anotação um documento oficial em conformidade com a Resolução COFEN nº 736/2024.</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Registro Profissional (COREN):</Label>
              <Input
                value={corenInput}
                onChange={(e) => setCorenInput(e.target.value)}
                placeholder="Ex: COREN-SP 123456"
                className="rounded-xl text-sm"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setSignModalOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={handleSignConfirm}
              disabled={signing || !corenInput.trim()}
              className="rounded-xl bg-teal-600 hover:bg-teal-700"
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
