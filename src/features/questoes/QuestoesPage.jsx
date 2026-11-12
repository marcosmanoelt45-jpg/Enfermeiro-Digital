import React, { useEffect, useMemo, useRef, useState } from "react";
import { History, Layers, RotateCcw, Timer, Zap } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/surface";
import PlurallQuestionCard from "@/components/simulador/PlurallQuestionCard";
import RevisaoFinalModal from "@/components/simulador/RevisaoFinalModal";
import { CabecalhoSecao, OpcoesModulo } from "@/components/modulo/InicioModulo.jsx";
import { useAuth } from "@/lib/AuthContext";
import { celebrate } from "@/lib/celebrate";
import { vibrate } from "@/lib/motion";
import { clinicalHistoryService, MODULE_TYPES } from "@/services/clinicalHistoryService";
import { clinicalGamificationService } from "@/services/clinicalGamificationService";
import { registrarResposta } from "@/components/feedback/comemoracoes.js";
import BANCO from "@/data/questoes/banco.json";
import { TOPICOS_PRATICA } from "@/data/questoes/temas.js";
import { embaralharAlternativas, montarSessao, resumoDaSessao, todasRespondidas } from "./logica/sessao.js";

const NOVO = { selectedChoice: null, tentativas: 0, status: "aberta", isFinalizada: false, opcoesFalhadas: [] };
const MODOS = { rapida: "Rápidas", normal: "Normais", revisao: "Revisão" };

// Questões de múltipla escolha (curativo, medicamento, punção, sinais vitais…), com 2 chances:
// errou a 1ª, aparece a dica; errou a 2ª, a resposta e a explicação de cada alternativa.
// As erradas vão para a Revisão. Banco recuperado do antigo Atendimento por voz.
export default function QuestoesPage() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [secao, setSecao] = useState("inicio"); // inicio | temas | historico | sessao | fim
  const [modo, setModo] = useState("rapida");
  const [sessao, setSessao] = useState([]);
  const [indice, setIndice] = useState(0);
  const [estados, setEstados] = useState([]);
  const [dica, setDica] = useState(false);
  const [versao, setVersao] = useState(0);
  const [revisao, setRevisao] = useState(null); // resumo aberto na Revisão final (fim da sessão ou histórico)
  const [daSessao, setDaSessao] = useState(false); // confete só no fim de uma sessão, não ao abrir o histórico
  const inicio = useRef(Date.now());
  const idHistorico = useRef(null); // id da sessão no histórico: o salvamento automático e o fim usam o mesmo

  const pendentes = useMemo(() => {
    void versao;
    return clinicalHistoryService.getQuestoesRevisao(userId) || [];
  }, [userId, versao]);

  const sessoes = useMemo(() => {
    void versao;
    return clinicalHistoryService.getAllActivities(MODULE_TYPES.VIDEOCHAMADA, userId).filter((a) => Array.isArray(a.details?.questoes) && a.details.questoes.length);
  }, [userId, versao]);

  // Salva sozinho a cada resposta: a sessão aparece nos históricos mesmo antes de a pessoa terminar.
  useEffect(() => {
    if (secao !== "sessao" || !sessao.length || !idHistorico.current) return;
    if (!estados.some((e) => e.tentativas > 0 || e.isFinalizada)) return;
    const lista = sessao.map((qq, i) => ({ ...qq, status: estados[i]?.isFinalizada ? estados[i].status : estados[i]?.tentativas > 0 ? "amarela" : "pulada", escolhaAluno: estados[i]?.selectedChoice }));
    const finalizadas = estados.filter((e) => e.isFinalizada).length;
    const agora = new Date();
    clinicalHistoryService.autoSalvar({
      id: idHistorico.current,
      moduleType: MODULE_TYPES.VIDEOCHAMADA,
      title: `Questões · ${MODOS[modo]}`,
      patientInfo: `Questões · ${MODOS[modo]} (${sessao.length} questões)`,
      progress: Math.round((finalizadas / sessao.length) * 100),
      durationSeconds: (Date.now() - inicio.current) / 1000,
      formData: { modo },
      userId,
      extra: {
        dataDisplay: agora.toLocaleDateString("pt-BR"),
        horaDisplay: agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        details: {
          modalidade: MODOS[modo],
          totalQuestoes: sessao.length,
          acertos: lista.filter((x) => x.status === "verde").length,
          amarelas: lista.filter((x) => x.status === "amarela").length,
          vermelhas: lista.filter((x) => x.status === "vermelha").length,
          questoes: lista.filter((x) => x.status !== "pulada"),
        },
      },
    });
    setVersao((v) => v + 1);
  }, [estados, secao, sessao, modo, userId]);

  // Refazer uma lista (as erradas de uma sessão, ou um filtro do histórico) até acertar.
  const refazer = (lista) => {
    const qs = lista.map((q, i) => embaralharAlternativas({ ...q, status: undefined, escolhaAluno: undefined, numQuestao: i + 1 }));
    if (!qs.length) return;
    setRevisao(null);
    setModo("revisao");
    setSessao(qs);
    setEstados(qs.map(() => NOVO));
    setIndice(0);
    setDica(false);
    inicio.current = Date.now();
    idHistorico.current = `act_vid_${inicio.current}`;
    setSecao("sessao");
  };

  const comecar = (m, tema = "todos") => {
    const qs = montarSessao(m === "revisao" ? pendentes : BANCO, { modo: m, tema });
    if (!qs.length) return;
    setModo(m);
    setSessao(qs);
    setEstados(qs.map(() => NOVO));
    setIndice(0);
    setDica(false);
    inicio.current = Date.now();
    idHistorico.current = `act_vid_${inicio.current}`;
    setSecao("sessao");
  };

  const q = sessao[indice];
  const est = estados[indice] ?? NOVO;
  const mudar = (fn) => setEstados((lista) => lista.map((e, i) => (i === indice ? fn(e) : e)));

  const verificar = (override = null) => {
    const escolha = override ?? est.selectedChoice;
    if (escolha === null || escolha === undefined || est.isFinalizada) return;
    if (Number(escolha) === Number(q.correta)) {
      vibrate(15);
      registrarResposta({ userId, resultado: "acerto" });
      if (est.tentativas === 0 && indice === 0) celebrate({ count: 40, y: 0.6 });
      mudar((e) => ({ ...e, status: e.tentativas === 0 ? "verde" : "amarela", tentativas: 2, isFinalizada: true, selectedChoice: escolha }));
    } else if (est.tentativas === 0) {
      vibrate([30, 40, 30]);
      registrarResposta({ userId, resultado: "primeiro_erro" });
      mudar((e) => ({ ...e, status: "amarela", tentativas: 1, selectedChoice: null, opcoesFalhadas: [...e.opcoesFalhadas, escolha] }));
      setDica(false); // a dica só aparece quando a pessoa pedir em "Ver dica"
    } else {
      vibrate([30, 40, 30]);
      registrarResposta({ userId, resultado: "erro" });
      mudar((e) => ({ ...e, status: "vermelha", tentativas: 2, isFinalizada: true, selectedChoice: escolha, opcoesFalhadas: [...e.opcoesFalhadas, escolha] }));
    }
  };

  const terminar = () => {
    const lista = sessao.map((qq, i) => ({ ...qq, status: estados[i].isFinalizada ? estados[i].status : "pulada", escolhaAluno: estados[i].selectedChoice }));
    const acertos = lista.filter((x) => x.status === "verde").length;
    const amarelas = lista.filter((x) => x.status === "amarela").length;
    const vermelhas = lista.filter((x) => x.status === "vermelha").length;
    const precisao = Math.round(((acertos + amarelas * 0.5) / (lista.length || 1)) * 100);
    clinicalHistoryService.saveVideochamadaSession(
      { id: idHistorico.current, titulo: `Questões · ${MODOS[modo]}`, pacienteNome: "Questões", modalidade: MODOS[modo], modo, totalQuestoes: lista.length, acertos, amarelas, vermelhas, precisao, tempoSegundos: (Date.now() - inicio.current) / 1000, questoes: lista },
      userId
    );
    if (modo === "revisao") clinicalHistoryService.removerQuestoesRevisao(lista.filter((x) => x.status === "verde" || x.status === "amarela"), userId);
    // Sessão terminada acende a ofensiva do dia (com acertos vem junto o PE; sem acertos, só o dia).
    if (acertos) clinicalGamificationService.recordActivity("case_solved", acertos * 25, userId);
    else if (lista.some((x) => x.status !== "pulada")) clinicalGamificationService.concluirAtividadeDoDia(userId);
    setVersao((v) => v + 1);
    setDaSessao(true);
    setRevisao(resumoDaSessao(lista, (Date.now() - inicio.current) / 1000));
    setSecao("inicio");
  };

  const proxima = () => {
    if (indice >= sessao.length - 1) return terminar();
    setIndice((i) => i + 1);
    setDica(false);
  };

  if (secao === "sessao" && q) {
    return (
      <PageShell activeTab="questoes" semDock>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setSecao("inicio")}>← Sair</Button>
          <p className="text-xs font-bold text-[#9FB3C6]">{MODOS[modo]} · {q.tema}</p>
        </div>
        <PlurallQuestionCard
          key={`${modo}-${indice}`}
          questao={q}
          numQuestao={indice + 1}
          totalQuestoes={sessao.length}
          selectedChoice={est.selectedChoice}
          onSelectChoice={(i) => !est.isFinalizada && !est.opcoesFalhadas.includes(i) && mudar((e) => ({ ...e, selectedChoice: i }))}
          opcoesIncorretasTentadas={est.opcoesFalhadas}
          tentativas={est.tentativas}
          status={est.status}
          isFinalizada={est.isFinalizada}
          onVerificar={verificar}
          onProxima={proxima}
          isLastQuestion={indice === sessao.length - 1}
          hintVisible={dica}
          onToggleHint={() => setDica((v) => !v)}
        />
      </PageShell>
    );
  }

  return (
    <PageShell activeTab="questoes">
      <header className="space-y-1">
        <h1 className="text-xl font-extrabold">Questões</h1>
        <p className="text-sm font-semibold text-[#9FB3C6]">Curativo, medicamentos, punção venosa e sinais vitais. Duas chances por questão.</p>
      </header>

      {secao === "inicio" && (
        <OpcoesModulo
          opcoes={[
            { id: "rapida", rotulo: "Rápidas", descricao: "De 4 a 6 questões", icone: Zap, destaque: true, onClick: () => comecar("rapida") },
            { id: "normal", rotulo: "Normais", descricao: "De 7 a 9 questões", icone: Timer, onClick: () => comecar("normal") },
            { id: "temas", rotulo: "Escolher tema", descricao: "Curativo, cálculo, punção…", icone: Layers, onClick: () => setSecao("temas") },
            { id: "revisao", rotulo: "Revisão", descricao: pendentes.length ? `${pendentes.length} questões para refazer` : "Nada para revisar agora", icone: RotateCcw, onClick: () => pendentes.length && comecar("revisao") },
            { id: "historico", rotulo: "Histórico", descricao: "Suas sessões e notas", icone: History, onClick: () => setSecao("historico") },
          ]}
        />
      )}

      {secao === "temas" && (
        <div className="space-y-3">
          <CabecalhoSecao titulo="Escolher tema" onVoltar={() => setSecao("inicio")} />
          <div className="grid gap-2 sm:grid-cols-2">
            {TOPICOS_PRATICA.map((t) => (
              <button key={t.id} type="button" onClick={() => comecar("normal", t.id)} className="btn-3d-outline rounded-2xl p-4 text-left">
                <span className="block text-sm font-extrabold">{t.titulo}</span>
                <span className="block text-xs font-semibold text-[#9FB3C6]">{t.descricao}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {secao === "historico" && (
        <div className="space-y-3">
          <CabecalhoSecao titulo="Histórico" onVoltar={() => setSecao("inicio")} />
          {sessoes.length === 0 ? (
            <Panel className="text-center text-sm font-semibold text-[#9FB3C6]">Nada por aqui ainda. Resolva uma sessão de questões.</Panel>
          ) : (
            <>
              <Button variant="primary" className="w-full" onClick={() => setDaSessao(false) || setRevisao(resumoDaSessao(todasRespondidas(sessoes), 0))}>
                Ver todas as questões respondidas
              </Button>
              <ul className="divide-y divide-[#27394B] overflow-hidden rounded-2xl border border-[#27394B] bg-[#131F2E]">
                {sessoes.map((a) => {
                  const d = a.details;
                  return (
                    <li key={a.id}>
                      <button type="button" onClick={() => setDaSessao(false) || setRevisao(resumoDaSessao(d.questoes, a.durationSeconds))} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#16222E]">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-extrabold">{a.title}</span>
                          <span className="block text-xs font-semibold text-[#9FB3C6]">{a.dataDisplay} {a.horaDisplay} · {d.totalQuestoes} questões{a.status === "em_andamento" ? " · em andamento" : ""}</span>
                        </span>
                        <span className="flex shrink-0 gap-1 text-[11px] font-black tabular-nums">
                          <span className="rounded-full bg-[#20D5B5]/15 px-2 py-0.5 text-[#20D5B5]">{d.acertos}</span>
                          <span className="rounded-full bg-[#FFC247]/15 px-2 py-0.5 text-[#FFC247]">{d.amarelas}</span>
                          <span className="rounded-full bg-[#F25F5C]/15 px-2 py-0.5 text-[#F25F5C]">{d.vermelhas}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}

      <RevisaoFinalModal
        isOpen={Boolean(revisao)}
        resumo={revisao}
        onRefazerErradas={() => refazer((revisao?.questoes ?? []).filter((q) => q.status === "amarela" || q.status === "vermelha"))}
        onNovaPratica={() => {
          setRevisao(null);
          comecar("rapida");
        }}
        onVoltarHub={() => setRevisao(null)}
        celebrar={daSessao}
      />
    </PageShell>
  );
}
