import React, { useState } from "react";
import { CheckCircle2, ExternalLink, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { getAssemblyAiKey, saveAssemblyAiKey, testAssemblyAiKey } from "@/lib/assemblyai";

export default function AssemblyAiKeyCard() {
  const stored = getAssemblyAiKey();
  const [key, setKey] = useState(stored);
  const [saving, setSaving] = useState(false);
  const [validated, setValidated] = useState(false);

  async function handleSaveAndTest() {
    const value = key.trim();
    if (!value) {
      setValidated(false);
      toast({
        title: "Chave não informada",
        description: "Cole a chave da AssemblyAI para habilitar a transcrição.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      await testAssemblyAiKey(value);
      saveAssemblyAiKey(value);
      setValidated(true);
      toast({
        title: "Transcrição funcionando",
        description: "Chave validada e salva neste navegador.",
      });
    } catch (err) {
      setValidated(false);
      toast({
        title: "Chave não validada",
        description: err?.message || "Confira a chave e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
      <p className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
        <KeyRound className="h-4 w-4 text-teal-600 dark:text-teal-400" /> Transcrição de Áudio (AssemblyAI)
      </p>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-300">
        A gravação na Avaliação por Áudio é transcrita pela AssemblyAI. Cole a sua chave de API para habilitar.
      </p>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Input
          type="password"
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            setValidated(false);
          }}
          placeholder="Cole aqui a sua API key da AssemblyAI"
          autoComplete="off"
          className="rounded-lg text-xs border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
        />
        <Button
          onClick={handleSaveAndTest}
          disabled={saving}
          className="shrink-0 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold"
        >
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Salvar &amp; Testar
        </Button>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-[11px] text-slate-500 dark:text-slate-400">A chave fica salva apenas neste navegador.</p>
        {validated || (stored && !saving) ? (
          <p className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {validated ? "Testada agora" : "Chave salva"}
          </p>
        ) : (
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Não configurada</p>
        )}
      </div>

      <a
        href="https://www.assemblyai.com/dashboard/signup"
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 dark:text-teal-300 hover:underline"
      >
        Obter uma chave da AssemblyAI <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
