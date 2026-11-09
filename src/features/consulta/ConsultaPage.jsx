import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/surface";
import { AnimatedProgress } from "@/components/ui/animated-progress";
import PageShell from "@/components/layout/PageShell";
import GotiAnimated from "@/components/mascot/GotiAnimated";
import { useAuth } from "@/lib/AuthContext";
import { isLocalDemoSession } from "@/services/supabaseClient";

import EstadoBloqueado from "@/features/cena/componentes/EstadoBloqueado.jsx";
import { PERSONAGENS } from "@/features/cena/dados/personagens.js";
import { consulta, ErroServidor } from "@/features/cena/servidor.js";
import { desbloquearAudio } from "@/features/cena/voz/reprodutor.js";
import { PERSONALIDADES, TEMAS } from "./dados/index.js";
import ConsultaCena from "./ConsultaCena.jsx";
import ProntuarioConsulta from "./componentes/ProntuarioConsulta.jsx";


const DIFICULDADES = [
  { id: "facil", rotulo: "Fácil" },
  { id: "normal", rotulo: "Normal" },
  { id: "dificil", rotulo: "Difícil" },
];
const PACIENTES = PERSONAGENS.filter((p) => p.papel === "paciente");
const chaveRascunho = (userId) => `enfere_consulta_rascunho_${userId}`;

function lerRascunho(userId) {
  try {
    return localStorage.getItem(chaveRascunho(userId));
  } catch {
    return null;
  }
}
function gravarRascunho(userId, sessaoId) {
  try {
    if (sessaoId) localStorage.setItem(chaveRascunho(userId), sessaoId);
    else localStorage.removeItem(chaveRascunho(userId));
  } catch {
    // sem localStorage: a retomada não funciona, o resto sim
  }
}

const Chip = ({ ativo, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={ativo}
    className={`rounded-full border px-3 py-1.5 text-sm font-bold transition-colors ${ativo ? "border-[#20D5B5] bg-[#20D5B5]/15 text-[#20D5B5]" : "border-[#27394B] text-[#EAF2F8]"}`}
  >
    {children}
  </button>
);

export default function ConsultaPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id ?? "anon";

  const [passo, setPasso] = useState(1);
  const [tema, setTema] = useState(null);
  const [personagemId, setPersonagemId] = useState(PACIENTES[0]?.id);
  const [personalidadeId, setPersonalidadeId] = useState("surpresa");
  const [dificuldade, setDificuldade] = useState("normal");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [sessao, setSessao] = useState(null);
  const [retomada, setRetomada] = useState(null);
  const [emCena, setEmCena] = useState(false);
  const [retomando, setRetomando] = useState(true);
  const [retomadaPendente, setRetomadaPendente] = useState(false);

  const demo = isLocalDemoSession();

  // Recarregou no meio da conversa: o rascunho guarda só o id; a conversa vem do servidor.
  useEffect(() => {
    const id = demo ? null : lerRascunho(userId);
    if (!id) {
      setRetomando(false);
      return undefined;
    }
    let vivo = true;
    consulta
      .retomar(id)
      .then((r) => {
        if (!vivo) return;
        setSessao({ sessaoId: r.sessaoId, personagemId: r.personagemId, personalidadePublica: "surpresa", briefing: r.briefing ?? { nome: "Paciente", setor: "" } });
        setRetomada({ turnos: r.turnos, rapport: r.rapport, turnosRestantes: r.turnosRestantes });
        // Não entra direto: o aluno escolhe continuar ou começar outra (e o toque libera o áudio).
        setRetomadaPendente(true);
      })
      .catch(() => gravarRascunho(userId, null))
      .finally(() => vivo && setRetomando(false));
    return () => {
      vivo = false;
    };
  }, [userId, demo]);

  const criar = useCallback(async () => {
    setErro(null);
    setCarregando(true);
    setPasso(3);
    const p = PACIENTES.find((x) => x.id === personagemId) ?? PACIENTES[0];
    try {
      const r = await consulta.criar({
        arquetipoId: null,
        tema,
        idade: 62 + Math.floor(Math.random() * 19),
        sexo: p.sexo,
        personagemId: p.id,
        personalidadeId,
        dificuldade,
      });
      gravarRascunho(userId, r.sessaoId);
      setSessao({ sessaoId: r.sessaoId, personagemId: r.personagemId, personalidadePublica: personalidadeId, tema: TEMAS.find((x) => x.id === tema)?.rotulo ?? null, briefing: r.briefing });
    } catch (e) {
      setErro(e instanceof ErroServidor ? e : new ErroServidor("ERRO_INTERNO"));
    } finally {
      setCarregando(false);
    }
  }, [personagemId, tema, personalidadeId, dificuldade, userId]);

  const sair = useCallback(() => {
    gravarRascunho(userId, null);
    navigate("/");
  }, [navigate, userId]);

  const novaConsulta = useCallback(() => {
    gravarRascunho(userId, null);
    setSessao(null);
    setRetomada(null);
    setRetomadaPendente(false);
    setEmCena(false);
    setErro(null);
    setPasso(1);
  }, [userId]);

  const comecar = () => {
    desbloquearAudio(); // dentro do toque: libera o áudio no iOS
    setEmCena(true);
  };

  if (demo) {
    return (
      <PageShell>
        <EstadoBloqueado tipo="demo" mensagem="Crie sua conta para conversar com pacientes." acao={{ rotulo: "Criar conta", onClick: () => navigate("/register") }} />
      </PageShell>
    );
  }

  if (emCena && sessao) {
    return <ConsultaCena sessao={sessao} retomada={retomada} onSair={sair} onNova={novaConsulta} onFinalizada={() => gravarRascunho(userId, null)} />;
  }

  if (retomadaPendente && sessao) {
    return (
      <PageShell>
        <div className="space-y-4 rounded-3xl border border-[#1F3045] bg-[#131F2E] p-5 text-center">
          <h1 className="text-lg font-extrabold">Você tem uma consulta em andamento</h1>
          <p className="text-sm font-semibold text-[#9FB3C6]">
            {sessao.briefing?.nome ? `Com ${sessao.briefing.nome}` : "Com o mesmo paciente"}
            {retomada?.turnos?.length ? ` · ${retomada.turnos.filter((t) => t.autor === "aluno").length} falas suas` : ""}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="flex-1" onClick={novaConsulta}>Começar outra</Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => {
                desbloquearAudio();
                setRetomadaPendente(false);
                setEmCena(true);
              }}
            >
              Continuar conversa
            </Button>
          </div>
        </div>
      </PageShell>
    );
  }

  if (retomando) {
    return (
      <PageShell>
        <p className="py-10 text-center text-sm font-bold text-[#9FB3C6]" role="status">Retomando sua consulta…</p>
      </PageShell>
    );
  }

  return (
    <PageShell larguraMax={passo === 3 && sessao ? "6xl" : "xl"}>
      <header className="space-y-2">
        <h1 className="text-xl font-extrabold">Consulta ao Vivo</h1>
        <AnimatedProgress value={(passo / 3) * 100} label={`Passo ${passo} de 3`} />
      </header>

      {passo === 1 && (
        <Panel className="space-y-5">
          <section className="space-y-2">
            <h2 className="text-base font-extrabold">Quem é o paciente?</h2>
            <p className="text-sm font-semibold text-[#9FB3C6]">Escolha o assunto da consulta.</p>
            <div className="flex flex-wrap gap-2">
              <Chip ativo={tema === null} onClick={() => setTema(null)}>Aleatório</Chip>
              {TEMAS.map((t) => (
                <Chip key={t.id} ativo={tema === t.id} onClick={() => setTema(t.id)}>{t.rotulo}</Chip>
              ))}
            </div>
          </section>
          <section className="space-y-2">
            <p className="text-sm font-bold">Paciente</p>
            <div className="grid grid-cols-2 gap-3">
              {PACIENTES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={personagemId === p.id}
                  onClick={() => setPersonagemId(p.id)}
                  className={`rounded-2xl border p-3 text-left transition-colors ${personagemId === p.id ? "border-[#20D5B5] bg-[#20D5B5]/10" : "border-[#27394B]"}`}
                >
                  <p className="font-extrabold">{p.nome}</p>
                  <p className="text-xs font-semibold text-[#9FB3C6]">{p.sexo === "M" ? "Homem" : "Mulher"}, idoso</p>
                </button>
              ))}
            </div>
          </section>
          <Button variant="primary" size="lg" className="w-full" onClick={() => setPasso(2)}>Continuar</Button>
        </Panel>
      )}

      {passo === 2 && (
        <Panel className="space-y-5">
          <section className="space-y-2">
            <h2 className="text-base font-extrabold">Como ele é?</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {PERSONALIDADES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={personalidadeId === p.id}
                  onClick={() => setPersonalidadeId(p.id)}
                  className={`rounded-2xl border p-3 text-left transition-colors ${p.id === "surpresa" ? "sm:col-span-2" : ""} ${personalidadeId === p.id ? "border-[#20D5B5] bg-[#20D5B5]/10" : "border-[#27394B]"}`}
                >
                  <p className="font-extrabold">{p.nome}</p>
                  <p className="text-xs font-semibold text-[#9FB3C6]">{p.descricao}</p>
                </button>
              ))}
            </div>
          </section>
          <section className="space-y-2">
            <p className="text-sm font-bold">Dificuldade</p>
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Dificuldade">
              {DIFICULDADES.map((d) => (
                <Chip key={d.id} ativo={dificuldade === d.id} onClick={() => setDificuldade(d.id)}>{d.rotulo}</Chip>
              ))}
            </div>
          </section>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPasso(1)}>Voltar</Button>
            <Button variant="primary" className="flex-1" onClick={criar}>Preparar paciente</Button>
          </div>
        </Panel>
      )}

      {passo === 3 && carregando && (
        <Panel className="flex flex-col items-center gap-3 py-8 text-center" role="status">
          <GotiAnimated animation="thinking" size="md" />
          <p className="font-extrabold">Preparando seu paciente…</p>
          <p className="text-sm font-semibold text-[#9FB3C6]">Isso leva alguns segundos.</p>
        </Panel>
      )}

      {passo === 3 && !carregando && erro && (
        erro.codigo === "COTA_EXCEDIDA" ? (
          <EstadoBloqueado tipo="cota" mensagem={erro.message} acao={{ rotulo: "Praticar cálculo de doses", onClick: () => navigate("/laboratorio-calculos") }} />
        ) : erro.codigo === "NAO_AUTENTICADO" || erro.codigo === "SESSAO_DEMO" ? (
          <EstadoBloqueado tipo="demo" mensagem="Entre na sua conta para conversar com pacientes." acao={{ rotulo: "Entrar", onClick: () => navigate("/login") }} />
        ) : (
          <Panel className="space-y-3 text-center" role="alert">
            <p className="font-extrabold">Não foi possível preparar o paciente</p>
            <p className="text-sm font-semibold text-[#9FB3C6]">{erro.message}</p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => setPasso(2)}>Voltar</Button>
              <Button variant="primary" onClick={criar}>Tentar de novo</Button>
            </div>
          </Panel>
        )
      )}

      {passo === 3 && !carregando && !erro && sessao && (
        <div className="space-y-4">
          <p className="text-center text-sm font-semibold text-[#9FB3C6]">Leia o prontuário. O resto você descobre conversando com o paciente.</p>
          <ProntuarioConsulta sessao={sessao} />
          <Button variant="primary" size="xl" className="mx-auto flex w-full max-w-[760px]" onClick={comecar}>Começar consulta</Button>
        </div>
      )}
    </PageShell>
  );
}
