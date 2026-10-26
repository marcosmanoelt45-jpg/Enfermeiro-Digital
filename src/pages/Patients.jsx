import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Activity, Loader2, Wand2, Shuffle, Library, BookOpen, Users, UserCircle, LogOut } from "lucide-react";
import PatientCard from "@/components/PatientCard";
import { generateRandomName, generateRandomAge, formatToInitials } from "@/lib/sampleNames";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/lib/AuthContext";

export default function Patients() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [patients, setPatients] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", age: "", gender: "M" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [p, a] = await Promise.all([
      base44.entities.Patient.list("-updated_date", 200),
      base44.entities.Assessment.list("-created_date", 200)]
      );
      setPatients(p);
      setAssessments(a);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {load();}, []);

  const latestRiskByPatient = {};
  assessments.forEach((a) => {
    if (!latestRiskByPatient[a.patient_id] || new Date(a.created_date) > new Date(latestRiskByPatient[a.patient_id].created_date)) {
      latestRiskByPatient[a.patient_id] = a;
    }
  });

  const filtered = patients.filter((p) =>
  !search || p.name?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const created = await base44.entities.Patient.create({
        name: form.name.trim(),
        age: form.age ? Number(form.age) : null,
        gender: form.gender
      });
      setOpen(false);
      setForm({ name: "", age: "", gender: "M" });
      load();
      navigate(`/patient/${created.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2"
                title="Voltar ao início"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white">
                  <Activity className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">Bem-vindo ao Enfere</h1>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Versão experimental</p>
                </div>
              </button>
              <div className="flex flex-row gap-2">
                <Button onClick={() => navigate("/conta")} variant="outline" size="sm" className="rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <UserCircle className="h-4 w-4" /> Conta
                </Button>
                <Button onClick={() => logout(true)} variant="outline" size="sm" className="rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <LogOut className="h-4 w-4" /> Sair
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => navigate("/referencias")} variant="outline" size="sm" className="rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                <BookOpen className="h-4 w-4" /> Referências
              </Button>
              <Button onClick={() => navigate("/banco-casos")} variant="outline" size="sm" className="rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                <Library className="h-4 w-4" /> Banco de Casos
              </Button>
              <Button onClick={() => setOpen(true)} size="sm" className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold">
                <Plus className="h-4 w-4" /> Novo caso
              </Button>
            </div>
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar caso..."
              className="rounded-xl pl-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4 space-y-3">
        {loading ?
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div> :
        filtered.length === 0 ?
        <div className="py-20 text-center text-sm text-slate-500 dark:text-slate-400">
            Nenhum caso cadastrado. Toque em <span className="font-semibold text-slate-700 dark:text-slate-200">Novo caso</span> para criar uma simulação.
          </div> :

        filtered.map((p) =>
        <PatientCard key={p.id} patient={p} latestRisk={latestRiskByPatient[p.id]?.risk_status} />
        )
        }
      </main>

      <footer className="mx-auto max-w-2xl px-4 py-4 text-center">
        <p className="text-[11px] text-slate-400 dark:text-slate-500">© 2026 Marcos Manoel Tavares Neumann — Criador e detentor dos direitos da plataforma Enfere</p>
      </footer>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">Novo Caso para Estudo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                <span>Iniciais do paciente (LGPD) *</span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded font-semibold border border-emerald-200 dark:border-emerald-800">
                  Anonimizado
                </span>
              </label>
              <div className="mt-1 flex gap-2">
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  onBlur={() => setForm((f) => ({ ...f, name: formatToInitials(f.name) }))}
                  placeholder="Ex: J.S.F. (apenas iniciais)"
                  className="font-mono uppercase font-semibold border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                />
                <Button type="button" variant="outline" size="icon" onClick={() => {const r = generateRandomName();setForm((f) => ({ ...f, name: r.name, gender: r.gender }));}} title="Gerar iniciais aleatórias" className="shrink-0 rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200">
                  <Wand2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </Button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">LGPD: utilize apenas iniciais (ex: J.S.F.). Nomes completos são convertidos.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Idade</label>
                <div className="mt-1 flex gap-2">
                  <Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100" />
                  <Button type="button" variant="outline" size="icon" onClick={() => setForm((f) => ({ ...f, age: generateRandomAge() }))} title="Idade aleatória" className="shrink-0 rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200">
                    <Shuffle className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Sexo</label>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm">
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>
            <button type="button" onClick={() => {const r = generateRandomName();setForm({ name: r.name, age: generateRandomAge(), gender: r.gender });}} className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-teal-300 dark:border-teal-700 py-2 text-xs font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40">
              <Wand2 className="h-3.5 w-3.5" /> Preencher caso aleatório
            </button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="bg-teal-600 hover:bg-teal-700 text-white font-semibold">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>);

}
