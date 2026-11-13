import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp, Search, ShieldCheck, Trash2 } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { vibrate } from "@/lib/motion";
import { deletarConta, historicoDaConta, listarContas, souAdmin } from "./servicoAdmin.js";

const dataHora = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
};

const cartao = "rounded-2xl border-2 border-[#27394B] bg-[#131F2E]";

/**
 * Admin (rota /admin): só para a conta em public.admins. O servidor responde 403 para qualquer outra;
 * aqui a tela também se esconde. Lista de contas com busca, histórico de uma conta e deleção com confirmação.
 */
export default function AdminPage() {
  const navigate = useNavigate();
  const [permitido, setPermitido] = useState(null);
  const [selecionada, setSelecionada] = useState(null);

  useEffect(() => {
    let vivo = true;
    souAdmin().then((ok) => vivo && setPermitido(ok));
    return () => {
      vivo = false;
    };
  }, []);

  if (permitido === null) {
    return (
      <PageShell activeTab="perfil">
        <p className="py-16 text-center text-sm font-bold text-[#9FB3C6]">Conferindo acesso…</p>
      </PageShell>
    );
  }

  if (!permitido) {
    return (
      <PageShell activeTab="perfil">
        <div className={`${cartao} space-y-3 p-5 text-center`}>
          <p className="text-base font-black">Página não disponível</p>
          <p className="text-sm font-semibold text-[#9FB3C6]">Esta área é só da administração do Enfere.</p>
          <Button variant="primary" onClick={() => navigate("/")}>Voltar ao início</Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell activeTab="perfil">
      {selecionada ? (
        <DetalheConta conta={selecionada} onVoltar={() => setSelecionada(null)} />
      ) : (
        <ListaContas onAbrir={setSelecionada} />
      )}
    </PageShell>
  );
}

function ListaContas({ onAbrir }) {
  const [busca, setBusca] = useState("");
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async (termo) => {
    setErro(null);
    try {
      setDados(await listarContas(termo));
    } catch (e) {
      setErro(e.message);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => carregar(busca), busca ? 300 : 0);
    return () => clearTimeout(t);
  }, [busca, carregar]);

  return (
    <>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#20D5B5]/15 text-[#20D5B5]">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-black">Administração</h1>
          <p className="text-sm font-semibold text-[#9FB3C6]">
            {dados ? `${dados.total} ${dados.total === 1 ? "conta" : "contas"} no app` : "Contas do app"}
          </p>
        </div>
      </div>

      <label className="relative block">
        <span className="sr-only">Buscar por e-mail ou nome</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9FB3C6]" aria-hidden="true" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por e-mail ou nome"
          className="h-11 rounded-2xl border-2 border-[#27394B] bg-[#0B131D] pl-9 text-[#EAF2F8]"
        />
      </label>

      {erro && <p className="rounded-2xl border-2 border-[#FF6B6B]/40 bg-[#FF6B6B]/10 p-3 text-sm font-bold text-[#FF6B6B]">{erro}</p>}

      {!dados && !erro && <p className="py-10 text-center text-sm font-bold text-[#9FB3C6]">Carregando contas…</p>}

      {dados && dados.contas.length === 0 && (
        <p className="py-10 text-center text-sm font-bold text-[#9FB3C6]">Nenhuma conta encontrada.</p>
      )}

      {dados && dados.contas.length > 0 && (
        <ul className="space-y-2">
          {dados.contas.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onAbrir({ ...c, ehVoce: c.id === dados.voceId })}
                className={`${cartao} flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150 hover:border-[#20D5B5]/60`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black text-white">
                    {c.nome || "Sem nome"}
                    {c.id === dados.voceId && <span className="ml-2 text-xs font-bold text-[#20D5B5]">você</span>}
                  </span>
                  <span className="block truncate text-xs font-semibold text-[#9FB3C6]">{c.email}</span>
                </span>
                <span className="shrink-0 text-right text-[11px] font-semibold leading-tight text-[#9FB3C6]">
                  último acesso
                  <span className="block font-bold text-[#EAF2F8]">{dataHora(c.ultimoAcesso)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function DetalheConta({ conta, onVoltar }) {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);
  const [aberta, setAberta] = useState(null);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    let vivo = true;
    historicoDaConta(conta.id)
      .then((d) => vivo && setDados(d))
      .catch((e) => vivo && setErro(e.message));
    return () => {
      vivo = false;
    };
  }, [conta.id]);

  return (
    <>
      <Button variant="ghost" size="sm" onClick={onVoltar} className="-ml-2 text-[#9FB3C6]">
        <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" /> Contas
      </Button>

      <section className={`${cartao} space-y-1 p-4`}>
        <h1 className="text-lg font-black">{conta.nome || "Sem nome"}</h1>
        <p className="break-all text-sm font-semibold text-[#9FB3C6]">{conta.email}</p>
        <dl className="grid grid-cols-2 gap-2 pt-2 text-xs">
          <div>
            <dt className="font-semibold text-[#9FB3C6]">Criada em</dt>
            <dd className="font-bold">{dataHora(conta.criadoEm)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-[#9FB3C6]">Último acesso</dt>
            <dd className="font-bold">{dataHora(conta.ultimoAcesso)}</dd>
          </div>
        </dl>
      </section>

      {erro && <p className="rounded-2xl border-2 border-[#FF6B6B]/40 bg-[#FF6B6B]/10 p-3 text-sm font-bold text-[#FF6B6B]">{erro}</p>}
      {!dados && !erro && <p className="py-8 text-center text-sm font-bold text-[#9FB3C6]">Carregando histórico…</p>}

      {dados && (
        <>
          <section className="space-y-2">
            <h2 className="text-sm font-black uppercase tracking-wide text-[#9FB3C6]">
              Consultas ao Vivo ({dados.consultas.length})
            </h2>
            {dados.consultas.length === 0 && <p className="text-sm font-semibold text-[#9FB3C6]">Nenhuma conversa gravada.</p>}
            {dados.consultas.map((s) => {
              const aqui = aberta === s.id;
              return (
                <div key={s.id} className={cartao}>
                  <button
                    type="button"
                    aria-expanded={aqui}
                    onClick={() => setAberta(aqui ? null : s.id)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black">{s.tema || s.personagem}</span>
                      <span className="block text-xs font-semibold text-[#9FB3C6]">
                        {dataHora(s.criadoEm)} · {s.mensagens.length} mensagens · {s.status}
                      </span>
                    </span>
                    {aqui ? <ChevronUp className="h-4 w-4 text-[#9FB3C6]" /> : <ChevronDown className="h-4 w-4 text-[#9FB3C6]" />}
                  </button>
                  {aqui && (
                    <ol className="space-y-2 border-t-2 border-[#27394B] p-3">
                      {s.mensagens.map((m) => (
                        <li key={m.ordem} className={`flex ${m.autor === "aluno" ? "justify-end" : "justify-start"}`}>
                          <p
                            className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm font-semibold ${
                              m.autor === "aluno" ? "bg-[#20D5B5]/15 text-[#EAF2F8]" : "bg-[#0B131D] text-[#EAF2F8]"
                            }`}
                          >
                            <span className="mb-0.5 block text-[11px] font-black text-[#9FB3C6]">
                              {m.autor === "aluno" ? "Aluno" : "Paciente"}
                            </span>
                            {m.texto}
                          </p>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              );
            })}
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-black uppercase tracking-wide text-[#9FB3C6]">Atividades ({dados.atividades.length})</h2>
            {dados.atividades.length === 0 && <p className="text-sm font-semibold text-[#9FB3C6]">Nenhuma atividade sincronizada.</p>}
            <ul className="space-y-1.5">
              {dados.atividades.map((a, i) => (
                <li key={a.id || i} className={`${cartao} flex items-center gap-3 px-3 py-2`}>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{a.titulo || a.modulo || "Atividade"}</span>
                    <span className="block text-xs font-semibold text-[#9FB3C6]">{dataHora(a.em)}</span>
                  </span>
                  {typeof a.nota === "number" && <span className="text-sm font-black text-[#3DD68C]">{a.nota}</span>}
                </li>
              ))}
            </ul>
            <p className="text-xs font-semibold text-[#9FB3C6]">O chat do Goti fica só no aparelho do aluno e não aparece aqui.</p>
          </section>
        </>
      )}

      {!conta.ehVoce && (
        <section className="rounded-2xl border-2 border-[#FF6B6B]/40 p-4">
          <p className="text-sm font-black text-[#FF6B6B]">Apagar conta</p>
          <p className="mb-3 text-xs font-semibold text-[#9FB3C6]">Remove o login e todos os dados ligados. Não dá para desfazer.</p>
          <Button variant="danger" onClick={() => setConfirmando(true)}>
            <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" /> Apagar esta conta
          </Button>
        </section>
      )}

      <ConfirmarDelecao conta={conta} aberto={confirmando} onFechar={() => setConfirmando(false)} onApagada={onVoltar} />
    </>
  );
}

function ConfirmarDelecao({ conta, aberto, onFechar, onApagada }) {
  const [digitado, setDigitado] = useState("");
  const [apagando, setApagando] = useState(false);
  const [erro, setErro] = useState(null);
  const confere = digitado.trim().toLowerCase() === (conta.email || "").toLowerCase();

  useEffect(() => {
    if (!aberto) {
      setDigitado("");
      setErro(null);
    }
  }, [aberto]);

  const apagar = async () => {
    setApagando(true);
    setErro(null);
    try {
      await deletarConta(conta.id, digitado.trim());
      vibrate(15);
      toast({ title: "Conta apagada", description: conta.email });
      onFechar();
      onApagada();
    } catch (e) {
      vibrate([30, 40, 30]);
      setErro(e.message);
    } finally {
      setApagando(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && !apagando && onFechar()}>
      <DialogContent className="border-2 border-[#27394B] bg-[#131F2E] text-[#EAF2F8]">
        <DialogHeader>
          <DialogTitle>Apagar a conta?</DialogTitle>
          <DialogDescription className="text-[#9FB3C6]">
            Para confirmar, digite o e-mail <strong className="break-all text-[#EAF2F8]">{conta.email}</strong>.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={digitado}
          onChange={(e) => setDigitado(e.target.value)}
          placeholder={conta.email}
          autoComplete="off"
          aria-label="E-mail da conta"
          className="h-11 rounded-2xl border-2 border-[#27394B] bg-[#0B131D] text-[#EAF2F8]"
        />
        {erro && <p className="text-sm font-bold text-[#FF6B6B]">{erro}</p>}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onFechar} disabled={apagando}>Cancelar</Button>
          <Button variant="danger" onClick={apagar} disabled={!confere} loading={apagando}>Apagar para sempre</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
