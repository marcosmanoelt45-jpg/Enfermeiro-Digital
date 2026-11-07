import React, { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Chip, Tile } from "@/components/ui/surface";
import PageShell from "@/components/layout/PageShell";
import { useAuth } from "@/lib/AuthContext";
import { celebrate } from "@/lib/celebrate";
import { clinicalHistoryService, MODULE_TYPES } from "@/services/clinicalHistoryService";
import { clinicalGamificationService } from "@/services/clinicalGamificationService";
import { PLANTAO_CENARIOS } from "@/data/sbarPlantaoDados";
import PlantaoCena from "./PlantaoCena.jsx";
import RelatorioPlantao from "./componentes/RelatorioPlantao.jsx";

const dificuldade = (c) => (c.lacunas.length >= 3 ? { rotulo: "Normal", tom: "warning" } : { rotulo: "Fácil", tom: "success" });

// Plantão com a Enfermeira: escolha do cenário, a cena e o relatório SBAR.
export default function PlantaoPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [fase, setFase] = useState("escolha"); // escolha | cena | relatorio
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
        userId,
      });
      clinicalGamificationService.recordActivity("plantao_vivo", 35, userId, { activityId: id });
      if (r.notas.geral >= 70) celebrate();
      setRelatorio(r);
      setFase("relatorio");
    },
    [cenario, userId]
  );

  if (fase === "cena" && cenario) return <PlantaoCena key={numero} cenario={cenario} onFinalizado={finalizado} onSair={() => setFase("escolha")} />;

  if (fase === "relatorio" && relatorio) {
    return (
      <PageShell activeTab="sbar">
        <RelatorioPlantao relatorio={relatorio} onNova={() => setFase("escolha")} onSair={() => navigate("/")} />
      </PageShell>
    );
  }

  return (
    <PageShell activeTab="sbar">
      <header className="space-y-1">
        <h1 className="text-xl font-extrabold">Plantão com a Enfermeira</h1>
        <p className="text-sm font-semibold text-[#9FB3C6]">Passe o plantão em ordem SBAR. Consulte o prontuário e examine o paciente antes de falar dos achados.</p>
      </header>
      <div className="space-y-3">
        {PLANTAO_CENARIOS.map((c) => {
          const d = dificuldade(c);
          return (
            <Tile key={c.id} className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-extrabold leading-snug">{c.title}</p>
                <Chip tone={d.tom}>{d.rotulo}</Chip>
              </div>
              <p className="text-xs font-semibold text-[#9FB3C6]">{c.sector}</p>
              <p className="text-xs font-semibold">{c.diagnosis}</p>
              <Button variant="primary" size="sm" className="w-full" onClick={() => comecar(c)}>Passar o plantão</Button>
            </Tile>
          );
        })}
      </div>
    </PageShell>
  );
}
