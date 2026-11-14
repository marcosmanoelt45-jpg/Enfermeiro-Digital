import React, { useCallback, useRef, useState } from "react";
import { Calculator as CalculatorIcon, History, ListChecks, Shuffle, Sigma, Timer, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/surface";
import { CabecalhoSecao, HistoricoModulo, ListaComBusca, OpcoesModulo } from "@/components/modulo/InicioModulo.jsx";
import PageShell from "@/components/layout/PageShell";
import { useAuth } from "@/lib/AuthContext";
import { celebrate } from "@/lib/celebrate";
import { clinicalHistoryService, MODULE_TYPES } from "@/services/clinicalHistoryService";
import { clinicalGamificationService } from "@/services/clinicalGamificationService";
import banco from "@/data/calculo/banco.json";
import CalculoCena from "./CalculoCena.jsx";
import ResultadoRodada from "./componentes/ResultadoRodada.jsx";
import CalculadoraLivre, { QuadroFormulas } from "./componentes/CalculadoraLivre.jsx";
import { MODOS, montarRodada, montarRodadaEscolhida, notaDaRodada, xpDaRodada } from "./logica/rodada.js";

const fmtN = (n) => String(n).replace(".", ",");
const ITENS = banco.map((q) => ({
  id: q.id,
  titulo: `${q.prescricao.farmaco} ${fmtN(q.prescricao.dose)} ${q.prescricao.unidadeDose}`,
  subtitulo: [q.prescricao.via, q.prescricao.frequencia, q.unidade ? `resposta em ${q.unidade}` : "confira a prescrição"].filter(Boolean).join(" · "),
  etiqueta: q.erroProposital ? "Com erro" : q.categoria,
  busca: `${q.categoria} ${q.tipo} ${q.disponivel ?? ""}`,
}));

// Cálculo com o Médico: escolha do modo, a rodada na cena do Dr. Rui e o resultado.
export default function CalculoPage() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [fase, setFase] = useState("escolha"); // escolha | rodada | resultado
  const [secao, setSecao] = useState("inicio"); // inicio | aleatorias | lista | historico
  const [escolhidas, setEscolhidas] = useState(() => new Set());
  const [modoId, setModoId] = useState("rotina");
  const [rodada, setRodada] = useState(null);
  const [resumo, setResumo] = useState(null);
  const [numero, setNumero] = useState(0);
  const inicio = useRef(Date.now());

  const comecar = (id, ids = null) => {
    setModoId(id);
    setRodada(ids ? montarRodadaEscolhida(banco, ids) : montarRodada(banco, id));
    setResumo(null);
    setNumero((n) => n + 1);
    inicio.current = Date.now();
    setFase("rodada");
  };

  // Salva sozinho a cada resposta: a rodada aparece no histórico em andamento.
  const progresso = useCallback(
    ({ feitos, total }) => {
      const modo = MODOS[modoId];
      clinicalHistoryService.autoSalvar({
        id: `calculo-${inicio.current}`,
        moduleType: MODULE_TYPES.CALCULO_MEDICO,
        title: `Cálculo com o médico · ${modo.rotulo}`,
        patientInfo: `${feitos} de ${total} prescrições`,
        progress: Math.round((feitos / (total || 1)) * 100),
        durationSeconds: (Date.now() - inicio.current) / 1000,
        formData: { modoId, ids: rodada?.map((i) => i.id) ?? [] },
        userId,
      });
    },
    [modoId, userId, rodada]
  );

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
        formData: { modoId, ids: rodada?.map((i) => i.id) ?? [] },
        userId,
      });
      clinicalGamificationService.recordActivity("calculo_medico", xpDaRodada(r), userId, { activityId: id });
      if (r.total && r.acertos / r.total >= 0.7) celebrate();
      setResumo(r);
      setFase("resultado");
    },
    [modoId, userId, rodada]
  );

  if (fase === "rodada" && rodada) {
    return <CalculoCena key={numero} rodada={rodada} modo={MODOS[modoId]} onFinalizar={finalizar} onProgresso={progresso} onSair={() => setFase("escolha")} />;
  }

  if (fase === "resultado" && resumo) {
    return (
      <PageShell activeTab="calculos">
        <ResultadoRodada resumo={resumo} modo={MODOS[modoId]} onNova={() => (modoId === "escolhidas" ? comecar(modoId, rodada.map((i) => i.id)) : comecar(modoId))} onSair={() => setFase("escolha")} />
      </PageShell>
    );
  }

  const alternar = (i) =>
    setEscolhidas((s) => {
      const n = new Set(s);
      if (n.has(i.id)) n.delete(i.id);
      else n.add(i.id);
      return n;
    });

  return (
    <PageShell activeTab="calculos">
      <header className="space-y-1">
        <h1 className="text-xl font-extrabold">Cálculo com o Dr. Rui</h1>
        <p className="text-sm font-semibold text-[#9FB3C6]">O Dr. Rui dita a prescrição. Calcule, ou questione se algo não parecer certo.</p>
      </header>

      {secao === "inicio" && (
        <OpcoesModulo
          opcoes={[
            { id: "aleatorias", rotulo: "Questões aleatórias", descricao: "Rápidas (3 min) ou médias (5 min)", icone: Shuffle, destaque: true, onClick: () => setSecao("aleatorias") },
            { id: "escolher", rotulo: "Escolher questões", descricao: `Busque entre as ${banco.length} prescrições`, icone: ListChecks, onClick: () => setSecao("lista") },
            { id: "calculadora", rotulo: "Calculadora livre", descricao: "Gotejamento, aspiração, peso, bomba e frasco com pó", icone: CalculatorIcon, onClick: () => setSecao("calculadora") },
            { id: "formulas", rotulo: "Fórmulas", descricao: "Todas as fórmulas e conversões numa tela", icone: Sigma, onClick: () => setSecao("formulas") },
            { id: "historico", rotulo: "Histórico", descricao: "Suas rodadas e notas", icone: History, onClick: () => setSecao("historico") },
          ]}
        />
      )}

      {secao === "calculadora" && (
        <div className="space-y-3">
          <CabecalhoSecao titulo="Calculadora livre" onVoltar={() => setSecao("inicio")} />
          <CalculadoraLivre />
        </div>
      )}

      {secao === "formulas" && (
        <div className="space-y-3">
          <CabecalhoSecao titulo="Fórmulas" onVoltar={() => setSecao("inicio")} />
          <QuadroFormulas />
        </div>
      )}

      {secao === "aleatorias" && (
        <div className="space-y-3">
          <CabecalhoSecao titulo="Questões aleatórias" onVoltar={() => setSecao("inicio")} />
          <OpcoesModulo
            opcoes={[
              { id: "rapidas", rotulo: "Questões rápidas", descricao: "Cerca de 3 minutos · de 4 a 7 questões", icone: Zap, onClick: () => comecar("rapidas") },
              { id: "medias", rotulo: "Questões médias", descricao: "Cerca de 5 minutos · de 7 a 9 questões", icone: Timer, onClick: () => comecar("medias") },
            ]}
          />
        </div>
      )}

      {secao === "lista" && (
        <div className="space-y-3 pb-24">
          <CabecalhoSecao titulo="Escolher questões" onVoltar={() => setSecao("inicio")} />
          <ListaComBusca itens={ITENS} placeholder="Buscar (ex.: heparina, microgotas, BIC, pediátrico)" onEscolher={alternar} selecionados={escolhidas} />
          <div className="fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-30 px-4 md:bottom-6">
            <div className="mx-auto max-w-xl">
              <Button variant="primary" size="lg" className="w-full" disabled={!escolhidas.size} onClick={() => comecar("escolhidas", [...escolhidas])}>
                {escolhidas.size ? `Começar com ${escolhidas.size} ${escolhidas.size === 1 ? "questão" : "questões"}` : "Toque nas questões para escolher"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {secao === "historico" && (
        <div className="space-y-3">
          <CabecalhoSecao titulo="Histórico" onVoltar={() => setSecao("inicio")} />
          <HistoricoModulo
            moduleType={MODULE_TYPES.CALCULO_MEDICO}
            userId={userId}
            onRefazer={(a) => (a.formData?.ids?.length ? comecar("escolhidas", a.formData.ids) : comecar("rapidas"))}
          />
        </div>
      )}

      {secao === "inicio" && (
        <Panel className="text-sm font-semibold text-[#9FB3C6]">
          Dica: o teclado mostra a unidade esperada. Em gotas e ampolas a resposta é um número inteiro.
        </Panel>
      )}
    </PageShell>
  );
}
