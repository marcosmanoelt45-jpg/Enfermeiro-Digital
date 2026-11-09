import React, { useMemo, useRef, useState } from "react";
import { History, Layers, RotateCcw, Timer, Zap } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/surface";
import PlurallQuestionCard from "@/components/simulador/PlurallQuestionCard";
import { CabecalhoSecao, HistoricoModulo, OpcoesModulo } from "@/components/modulo/InicioModulo.jsx";
import { useAuth } from "@/lib/AuthContext";
import { celebrate } from "@/lib/celebrate";
import { vibrate } from "@/lib/motion";
import { clinicalHistoryService, MODULE_TYPES } from "@/services/clinicalHistoryService";
import { clinicalGamificationService } from "@/services/clinicalGamificationService";
import BANCO from "@/data/questoes/banco.json";
import { TOPICOS_PRATICA } from "@/data/questoes/temas.js";
import { montarSessao } from "./logica/sessao.js";

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
  const inicio = useRef(Date.now());

  const pendentes = useMemo(() => {
    void versao;
    return clinicalHistoryService.getQuestoesRevisao(userId) || [];
  }, [userId, versao]);

  const comecar = (m, tema = "todos") => {
    const qs = montarSessao(m === "revisao" ? pendentes : BANCO, { modo: m, tema });
    if (!qs.length) return;
    setModo(m);
    setSessao(qs);
    setEstados(qs.map(() => NOVO));
    setIndice(0);
    setDica(false);
    inicio.current = Date.now();
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
      clinicalGamificationService.registrarAcertoQuestao?.(userId);
      if (est.tentativas === 0 && indice === 0) celebrate({ count: 40, y: 0.6 });
      mudar((e) => ({ ...e, status: e.tentativas === 0 ? "verde" : "amarela", tentativas: 2, isFinalizada: true, selectedChoice: escolha }));
    } else if (est.tentativas === 0) {
      vibrate([30, 40, 30]);
      mudar((e) => ({ ...e, status: "amarela", tentativas: 1, selectedChoice: null, opcoesFalhadas: [...e.opcoesFalhadas, escolha] }));
      setDica(true);
    } else {
      vibrate([30, 40, 30]);
      clinicalGamificationService.registrarErroVermelhoQuestao?.(userId);
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
      { titulo: `Questões · ${MODOS[modo]}`, pacienteNome: "Questões", modalidade: MODOS[modo], modo, totalQuestoes: lista.length, acertos, amarelas, vermelhas, precisao, tempoSegundos: (Date.now() - inicio.current) / 1000, questoes: lista },
      userId
    );
    if (modo === "revisao") clinicalHistoryService.removerQuestoesRevisao(lista.filter((x) => x.status === "verde" || x.status === "amarela"), userId);
    if (acertos) clinicalGamificationService.recordActivity("case_solved", acertos * 25, userId);
    if (precisao >= 70) celebrate();
    setVersao((v) => v + 1);
    setSecao("fim");
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

  if (secao === "fim") {
    const verdes = estados.filter((e) => e.status === "verde").length;
    return (
      <PageShell activeTab="questoes">
        <Panel className="space-y-3 text-center">
          <p className="text-5xl font-black text-[#20D5B5]">{verdes}/{sessao.length}</p>
          <p className="text-sm font-semibold text-[#9FB3C6]">certas de primeira. As que você errou foram para a Revisão.</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button variant="primary" onClick={() => comecar(modo === "revisao" ? "rapida" : modo)}>Mais questões</Button>
            <Button variant="outline" onClick={() => setSecao("inicio")}>Voltar</Button>
          </div>
        </Panel>
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
          <HistoricoModulo moduleType={MODULE_TYPES.VIDEOCHAMADA} userId={userId} />
        </div>
      )}
    </PageShell>
  );
}
