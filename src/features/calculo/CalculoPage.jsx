import React, { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Panel, Tile } from "@/components/ui/surface";
import PageShell from "@/components/layout/PageShell";
import { useAuth } from "@/lib/AuthContext";
import { celebrate } from "@/lib/celebrate";
import { clinicalHistoryService, MODULE_TYPES } from "@/services/clinicalHistoryService";
import { clinicalGamificationService } from "@/services/clinicalGamificationService";
import banco from "@/data/calculo/banco.json";
import CalculoCena from "./CalculoCena.jsx";
import ResultadoRodada from "./componentes/ResultadoRodada.jsx";
import { MODOS, montarRodada, notaDaRodada, xpDaRodada } from "./logica/rodada.js";

// Cálculo com o Médico: escolha do modo, a rodada na cena do Dr. Rui e o resultado.
export default function CalculoPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [fase, setFase] = useState("escolha"); // escolha | rodada | resultado
  const [modoId, setModoId] = useState("rotina");
  const [rodada, setRodada] = useState(null);
  const [resumo, setResumo] = useState(null);
  const [numero, setNumero] = useState(0);
  const inicio = useRef(Date.now());

  const comecar = (id) => {
    setModoId(id);
    setRodada(montarRodada(banco, id));
    setResumo(null);
    setNumero((n) => n + 1);
    inicio.current = Date.now();
    setFase("rodada");
  };

  const finalizar = useCallback(
    (r) => {
      const modo = MODOS[modoId];
      const id = `calculo-${inicio.current}`;
      clinicalHistoryService.submitActivity({
        id,
        moduleType: MODULE_TYPES.CALCULO_MEDICO,
        title: `Cálculo com o médico · ${modo.rotulo}`,
        patientInfo: `${r.acertos} de ${r.total} prescrições`,
        durationSeconds: Math.round((Date.now() - inicio.current) / 1000),
        score: notaDaRodada(r),
        evaluation: { acertos: r.acertos, primeira: r.primeira, graves: r.graves },
        userId,
      });
      clinicalGamificationService.recordActivity("calculo_medico", xpDaRodada(r), userId, { activityId: id });
      if (r.total && r.acertos / r.total >= 0.7) celebrate();
      setResumo(r);
      setFase("resultado");
    },
    [modoId, userId]
  );

  if (fase === "rodada" && rodada) {
    return <CalculoCena key={numero} rodada={rodada} modo={MODOS[modoId]} onFinalizar={finalizar} onSair={() => setFase("escolha")} />;
  }

  if (fase === "resultado" && resumo) {
    return (
      <PageShell activeTab="calculos">
        <ResultadoRodada resumo={resumo} modo={MODOS[modoId]} onNova={() => comecar(modoId)} onSair={() => setFase("escolha")} />
      </PageShell>
    );
  }

  return (
    <PageShell activeTab="calculos">
      <header className="space-y-1">
        <h1 className="text-xl font-extrabold">Cálculo com o Médico</h1>
        <p className="text-sm font-semibold text-[#9FB3C6]">O Dr. Rui dita a prescrição. Calcule, ou questione se algo não parecer certo.</p>
      </header>
      <div className="space-y-3">
        {Object.values(MODOS).map((m) => (
          <Tile key={m.id} className="space-y-2">
            <p className="text-base font-extrabold">{m.rotulo}</p>
            <p className="text-sm font-semibold text-[#9FB3C6]">{m.descricao}</p>
            <Button variant="primary" className="w-full" onClick={() => comecar(m.id)}>Começar</Button>
          </Tile>
        ))}
      </div>
      <Panel className="text-sm font-semibold text-[#9FB3C6]">
        Dica: o teclado mostra a unidade esperada. Em gotas e ampolas a resposta é um número inteiro.
      </Panel>
      <Button variant="ghost" className="w-full" onClick={() => navigate("/dashboard")}>Voltar ao início</Button>
    </PageShell>
  );
}
