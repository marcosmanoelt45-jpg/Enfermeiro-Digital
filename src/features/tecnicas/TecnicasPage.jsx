import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Chip, Panel, Tile } from "@/components/ui/surface";
import PageShell from "@/components/layout/PageShell";
import { useAuth } from "@/lib/AuthContext";
import { MASTER_PROCEDURES } from "@/services/procedureService";
import { SEMIOLOGY_KNOWLEDGE_BASE } from "@/data/semiologyFindings";
import { clinicalHistoryService, MODULE_TYPES } from "@/services/clinicalHistoryService";
import { clinicalGamificationService } from "@/services/clinicalGamificationService";
import { montarCatalogo, ROTULOS_CATEGORIA, ROTULOS_TIPO } from "@/features/minijogos/dados/index.js";
import { notaDoResultado } from "@/features/minijogos/logica/avaliar.js";
import MinijogoRunner from "@/features/minijogos/componentes/MinijogoRunner.jsx";

const ABAS = [
  { id: "minijogos", rotulo: "Minijogos" },
  { id: "pops", rotulo: "POPs" },
  { id: "videos", rotulo: "Vídeos" },
];

function estimarTempo(m) {
  if (m.tipo === "medir") return `${(m.medir.duracaoSeg ?? 20) + 10} s`;
  if (m.tipo === "escolher") return "1 min";
  if (m.tipo === "ordenar") return "2 min";
  return "2 min";
}

// Aba Técnicas: minijogos (gerados dos POPs e da semiologia, mais os criados à mão), POPs e vídeos.
export default function TecnicasPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [aba, setAba] = useState("minijogos");
  const [categoria, setCategoria] = useState("todas");
  const [aberto, setAberto] = useState(null);
  const [versao, setVersao] = useState(0);

  const catalogo = useMemo(() => montarCatalogo({ procedimentos: MASTER_PROCEDURES, semiologia: SEMIOLOGY_KNOWLEDGE_BASE }), []);

  // Concluídos: lidos do histórico (atividades "tecnica" com o id do minijogo).
  const concluidos = useMemo(() => {
    void versao;
    const itens = clinicalHistoryService.getAllActivities(MODULE_TYPES.TECNICA, userId);
    return new Set(itens.filter((i) => i.status === "concluido").map((i) => i.id));
  }, [userId, versao]);

  const categorias = useMemo(() => [...new Set(catalogo.todos.map((m) => m.categoria))], [catalogo]);
  const visiveis = catalogo.todos.filter((m) => categoria === "todas" || m.categoria === categoria);

  const concluir = useCallback(
    (resultado) => {
      const def = catalogo.porId[resultado.minijogoId];
      clinicalHistoryService.submitActivity({
        id: resultado.minijogoId,
        moduleType: MODULE_TYPES.TECNICA,
        title: def?.titulo ?? resultado.minijogoId,
        patientInfo: `${ROTULOS_TIPO[def?.tipo] ?? "Minijogo"} · ${ROTULOS_CATEGORIA[def?.categoria] ?? ""}`,
        durationSeconds: Math.round(resultado.tempoMs / 1000),
        score: notaDoResultado(resultado),
        evaluation: { acertos: resultado.acertos, erros: resultado.erros },
        userId,
      });
      clinicalGamificationService.recordActivity("tecnica", 30, userId, { activityId: `${resultado.minijogoId}:${Date.now()}` });
      setVersao((v) => v + 1);
      setAberto(null);
    },
    [catalogo, userId]
  );

  if (aberto) {
    return <MinijogoRunner definicao={aberto} modo="livre" onConcluir={concluir} onFechar={() => setAberto(null)} />;
  }

  return (
    <PageShell activeTab="tecnicas">
      <header className="space-y-3">
        <h1 className="text-xl font-extrabold">Técnicas</h1>
        <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Seções">
          {ABAS.map((a) => (
            <button key={a.id} type="button" role="tab" aria-selected={aba === a.id} onClick={() => setAba(a.id)} className={`rounded-full border px-3 py-1.5 text-sm font-bold ${aba === a.id ? "border-[#20D5B5] bg-[#20D5B5]/15 text-[#20D5B5]" : "border-[#27394B]"}`}>
              {a.rotulo}
            </button>
          ))}
        </div>
      </header>

      {aba === "minijogos" && (
        <>
          <div className="flex flex-wrap gap-2">
            {["todas", ...categorias].map((c) => (
              <button key={c} type="button" aria-pressed={categoria === c} onClick={() => setCategoria(c)} className={`rounded-full border px-3 py-1 text-xs font-bold ${categoria === c ? "border-[#20D5B5] text-[#20D5B5]" : "border-[#27394B] text-[#EAF2F8]"}`}>
                {c === "todas" ? "Todas" : ROTULOS_CATEGORIA[c] ?? c}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {visiveis.map((m) => (
              <Tile key={m.id} className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-extrabold leading-snug">{m.titulo}</p>
                  {concluidos.has(m.id) && <Chip tone="success">Concluído</Chip>}
                </div>
                <p className="text-xs font-semibold text-[#9FB3C6]">{ROTULOS_TIPO[m.tipo]} · {ROTULOS_CATEGORIA[m.categoria]} · {estimarTempo(m)}</p>
                <Button variant="primary" size="sm" className="w-full" onClick={() => setAberto(m)}>{concluidos.has(m.id) ? "Jogar de novo" : "Jogar"}</Button>
              </Tile>
            ))}
          </div>
        </>
      )}

      {aba === "pops" && (
        <Panel className="space-y-3">
          <p className="text-sm font-semibold text-[#9FB3C6]">Checklists e passo a passo de {MASTER_PROCEDURES.length} procedimentos.</p>
          <Button variant="primary" onClick={() => navigate("/procedimentos")}>Abrir POPs e checklists</Button>
        </Panel>
      )}

      {aba === "videos" && (
        <Panel className="space-y-3">
          <p className="text-sm font-semibold text-[#9FB3C6]">Videoteca com os vídeos do acervo LabEnf da UFSM.</p>
          <Button variant="primary" onClick={() => navigate("/procedimentos")}>Abrir a videoteca</Button>
        </Panel>
      )}
    </PageShell>
  );
}
