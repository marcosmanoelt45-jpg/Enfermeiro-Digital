import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import PlurallQuestionCard from "@/components/simulador/PlurallQuestionCard";
import { useAuth } from "@/lib/AuthContext";
import { clinicalHistoryService } from "@/services/clinicalHistoryService";
import { registrarResposta } from "@/components/feedback/comemoracoes.js";
import { clinicalGamificationService } from "@/services/clinicalGamificationService";
import { vibrate } from "@/lib/motion";

const NOVO = { selectedChoice: null, tentativas: 0, status: "aberta", isFinalizada: false, opcoesFalhadas: [] };

// Revisão das questões que ficaram pendentes no antigo Atendimento por voz (videochamada).
// Duas tentativas por questão: acertar tira a questão da fila; errar duas vezes revela a resposta.
export default function RevisaoPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const questoes = useMemo(() => clinicalHistoryService.getQuestoesRevisao(user?.id) || [], [user?.id]);
  const [indice, setIndice] = useState(0);
  const [estado, setEstado] = useState(NOVO);
  const [dicaVisivel, setDicaVisivel] = useState(false);
  const [resolvidas, setResolvidas] = useState(0);

  const questao = questoes[indice];
  const fim = indice >= questoes.length;

  const selecionar = (i) => {
    if (estado.isFinalizada || estado.opcoesFalhadas.includes(i)) return;
    setEstado((e) => ({ ...e, selectedChoice: i }));
  };

  const verificar = (override = null) => {
    const escolha = override ?? estado.selectedChoice;
    if (escolha === null || escolha === undefined || estado.isFinalizada) return;
    if (Number(escolha) === Number(questao?.correta ?? 0)) {
      vibrate(15);
      registrarResposta({ userId: user?.id, resultado: "acerto" });
      clinicalHistoryService.removerQuestoesRevisao([questao], user?.id);
      setResolvidas((n) => n + 1);
      setEstado((e) => ({ ...e, status: e.tentativas === 0 ? "verde" : "amarela", tentativas: 2, isFinalizada: true, selectedChoice: escolha }));
    } else if (estado.tentativas === 0) {
      vibrate([30, 40, 30]);
      registrarResposta({ userId: user?.id, resultado: "primeiro_erro" });
      setEstado((e) => ({ ...e, status: "amarela", tentativas: 1, selectedChoice: null, opcoesFalhadas: [...e.opcoesFalhadas, escolha] }));
    } else {
      vibrate([30, 40, 30]);
      registrarResposta({ userId: user?.id, resultado: "erro" });
      setEstado((e) => ({ ...e, status: "vermelha", tentativas: 2, isFinalizada: true, selectedChoice: escolha, opcoesFalhadas: [...e.opcoesFalhadas, escolha] }));
    }
  };

  const proxima = () => {
    // Terminou a última questão: a revisão conta como atividade concluída e acende a ofensiva do dia.
    // (rende o PE da revisão, de regrasPE.js)
    if (indice + 1 >= questoes.length) clinicalGamificationService.recordActivity("revisao", null, user?.id);
    setIndice((i) => i + 1);
    setEstado(NOVO);
    setDicaVisivel(false);
  };

  return (
    <PageShell>
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold">Revisão de questões</h1>
        <p className="text-sm text-[#9FB3C6]">Questões que ficaram pendentes no antigo Atendimento por voz.</p>
      </header>

      {questoes.length === 0 ? (
        <div className="space-y-3 rounded-3xl border border-[#27394B] bg-[#131F2E] p-5 text-center">
          <p className="font-bold">Nenhuma questão pendente. 🎉</p>
          <Button variant="primary" onClick={() => navigate("/consulta")}>Treinar na Consulta ao Vivo</Button>
        </div>
      ) : fim ? (
        <div className="space-y-3 rounded-3xl border border-[#27394B] bg-[#131F2E] p-5 text-center">
          <p className="text-lg font-extrabold">Revisão concluída</p>
          <p className="text-sm text-[#9FB3C6]">Você resolveu {resolvidas} de {questoes.length}. As que errou continuam na fila.</p>
          <Button variant="primary" onClick={() => navigate("/conta")}>Voltar ao perfil</Button>
        </div>
      ) : (
        <PlurallQuestionCard
          key={indice}
          questao={questao}
          numQuestao={indice + 1}
          totalQuestoes={questoes.length}
          selectedChoice={estado.selectedChoice}
          onSelectChoice={selecionar}
          opcoesIncorretasTentadas={estado.opcoesFalhadas}
          tentativas={estado.tentativas}
          status={estado.status}
          isFinalizada={estado.isFinalizada}
          onVerificar={verificar}
          onProxima={proxima}
          isLastQuestion={indice === questoes.length - 1}
          hintVisible={dicaVisivel}
          onToggleHint={() => setDicaVisivel((v) => !v)}
        />
      )}
    </PageShell>
  );
}
