import React, { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { History, TextSearch, Mic, Shuffle } from "lucide-react";
import { CabecalhoSecao, HistoricoModulo, ListaComBusca, OpcoesModulo } from "@/components/modulo/InicioModulo.jsx";
import PageShell from "@/components/layout/PageShell";
import { useAuth } from "@/lib/AuthContext";
import { celebrate } from "@/lib/celebrate";
import { clinicalHistoryService, MODULE_TYPES } from "@/services/clinicalHistoryService";
import { clinicalGamificationService } from "@/services/clinicalGamificationService";
import { PLANTAO_CENARIOS } from "@/data/sbarPlantaoDados";
import PlantaoCena from "./PlantaoCena.jsx";
import RelatorioPlantao from "./componentes/RelatorioPlantao.jsx";

const dificuldade = (c) => (c.lacunas.length >= 3 ? "Normal" : "Fácil");
const setorSemLeito = (c) => c.sector.split("•")[0].trim();
const ITENS = PLANTAO_CENARIOS.map((c) => ({
  id: c.id,
  titulo: c.title,
  subtitulo: `${setorSemLeito(c)} · ${c.age} anos`,
  etiqueta: dificuldade(c),
  busca: `${c.diagnosis} ${c.sector}`,
}));

// Plantão com a Enfermeira: escolha do cenário, a cena e o relatório SBAR.
export default function PlantaoPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [fase, setFase] = useState("escolha"); // escolha | cena | relatorio
  const [secao, setSecao] = useState("inicio"); // inicio | lista | historico
  const [cenario, setCenario] = useState(null);
  const [relatorio, setRelatorio] = useState(null);
  const [numero, setNumero] = useState(0);
  const inicio = useRef(Date.now());

  const comecar = (c) => {
    setCenario(c);
    setRelatorio(null);
    setNumero((n) => n + 1);
    inicio.current = Date.now();
    setFase("cena");
  };

  // Salva sozinho a cada fala do aluno: o plantão aparece no histórico em andamento.
  const progresso = useCallback(
    ({ respondidas, total }) => {
      if (!cenario) return;
      clinicalHistoryService.autoSalvar({
        id: `plantao-${cenario.id}-${inicio.current}`,
        moduleType: MODULE_TYPES.PLANTAO_VIVO,
        title: `Plantão: ${cenario.title}`,
        patientInfo: `${cenario.sector} · ${cenario.name}`,
        progress: Math.round((respondidas / (total || 1)) * 100),
        durationSeconds: (Date.now() - inicio.current) / 1000,
        formData: { cenarioId: cenario.id },
        userId,
      });
    },
    [cenario, userId]
  );

  const finalizado = useCallback(
    (r, lacunas) => {
      const id = `plantao-${cenario.id}-${inicio.current}`;
      const examinadas = Object.values(lacunas).filter((l) => l.avaliada).length;
      clinicalHistoryService.submitActivity({
        id,
        moduleType: MODULE_TYPES.PLANTAO_VIVO,
        title: `Plantão: ${cenario.title}`,
        patientInfo: `${cenario.sector} · ${cenario.name}`,
        durationSeconds: Math.round((Date.now() - inicio.current) / 1000),
        score: r.notas.geral,
        evaluation: { ...r.notas, lacunasExaminadas: examinadas },
        formData: { cenarioId: cenario.id },
        userId,
      });
      clinicalGamificationService.recordActivity("plantao_vivo", 35, userId, { activityId: id });
      if (r.notas.geral >= 70) celebrate();
      setRelatorio(r);
      setFase("relatorio");
    },
    [cenario, userId]
  );

  if (fase === "cena" && cenario) return <PlantaoCena key={numero} cenario={cenario} onFinalizado={finalizado} onProgresso={progresso} onSair={() => setFase("escolha")} />;

  if (fase === "relatorio" && relatorio) {
    return (
      <PageShell activeTab="sbar">
        <RelatorioPlantao relatorio={relatorio} onNova={() => setFase("escolha")} onSair={() => navigate("/")} />
      </PageShell>
    );
  }

  const aleatorio = () => comecar(PLANTAO_CENARIOS[Math.floor(Math.random() * PLANTAO_CENARIOS.length)]);
  const porId = (id) => PLANTAO_CENARIOS.find((c) => c.id === id);

  return (
    <PageShell activeTab="sbar">
      <header className="space-y-1">
        <h1 className="text-xl font-extrabold">Plantão ao Vivo</h1>
        <p className="text-sm font-semibold text-[#9FB3C6]">Passe o plantão em ordem SBAR para a enfermeira Ana. Consulte o prontuário e examine o paciente antes de falar dos achados.</p>
      </header>

      {secao === "inicio" && (
        <OpcoesModulo
          opcoes={[
            { id: "aleatorio", rotulo: "Novo caso aleatório", descricao: `Um dos ${PLANTAO_CENARIOS.length} pacientes, sorteado`, icone: Shuffle, destaque: true, onClick: aleatorio },
            { id: "escolher", rotulo: "Escolher caso", descricao: "Busque por doença, setor ou idade", icone: TextSearch, onClick: () => setSecao("lista") },
            { id: "historico", rotulo: "Histórico de casos", descricao: "Seus plantões e notas", icone: History, onClick: () => setSecao("historico") },
            { id: "gravacao", rotulo: "Modo gravação", descricao: "Grave a passagem completa ou treine com timer", icone: Mic, onClick: () => navigate("/plantao/gravacao") },
          ]}
        />
      )}

      {secao === "lista" && (
        <div className="space-y-3">
          <CabecalhoSecao titulo="Escolher caso" onVoltar={() => setSecao("inicio")} />
          <ListaComBusca itens={ITENS} placeholder="Buscar caso (ex.: sepse, UTI, pediatria)" onEscolher={(i) => comecar(porId(i.id))} />
        </div>
      )}

      {secao === "historico" && (
        <div className="space-y-3">
          <CabecalhoSecao titulo="Histórico de casos" onVoltar={() => setSecao("inicio")} />
          <HistoricoModulo
            moduleType={MODULE_TYPES.PLANTAO_VIVO}
            userId={userId}
            onRefazer={(a) => {
              const c = porId(a.formData?.cenarioId) ?? PLANTAO_CENARIOS.find((x) => a.id?.startsWith(`plantao-${x.id}-`));
              if (c) comecar(c);
            }}
          />
        </div>
      )}
    </PageShell>
  );
}
