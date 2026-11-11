import React, { useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import { Chip, Tile } from "@/components/ui/surface";
import PageShell from "@/components/layout/PageShell";
import { useAuth } from "@/lib/AuthContext";
import { clinicalHistoryService, MODULE_TYPES } from "@/services/clinicalHistoryService";
import { clinicalGamificationService } from "@/services/clinicalGamificationService";
import { catalogoPronto, ROTULOS_CATEGORIA, ROTULOS_TIPO } from "@/features/minijogos/dados/index.js";
import { notaDoResultado } from "@/features/minijogos/logica/avaliar.js";
import VideotecaConteudo from "@/features/tecnicas/VideotecaConteudo.jsx";
import MinijogoRunner from "@/features/minijogos/componentes/MinijogoRunner.jsx";
import MaoEstetoscopio from "@/features/minijogos/componentes/ausculta/MaoEstetoscopio.jsx";


function estimarTempo(m) {
  if (m.tipo === "medir") return `${(m.medir.duracaoSeg ?? 20) + 10} s`;
  if (m.tipo === "escolher") return "1 min";
  if (m.tipo === "ordenar") return "2 min";
  if (m.tipo === "ausculta") return "3 min";
  return "2 min";
}

// Duas páginas separadas: "Vídeos" (POPs com vídeo e checklist, em /tecnicas) e "Minijogos" (em /minijogos, só no Menu).
export default function TecnicasPage({ secao = "videos" }) {
  const minijogos = secao === "minijogos";
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [categoria, setCategoria] = useState("todas");
  const [aberto, setAberto] = useState(null);
  const [versao, setVersao] = useState(0);

  const catalogo = useMemo(() => catalogoPronto(), []);

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
    <PageShell activeTab={minijogos ? "minijogos" : "tecnicas"} larguraMax="4xl">
      <header className="space-y-1">
        <h1 className="text-xl font-extrabold">{minijogos ? "Minijogos" : "Vídeos"}</h1>
        <p className="text-sm font-semibold text-[#9FB3C6]">{minijogos ? "Pratique com as mãos, no seu ritmo." : "Procedimentos passo a passo, com vídeo e checklist."}</p>
      </header>

      {minijogos && (
        <>
          {categorias.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {["todas", ...categorias].map((c) => (
              <button key={c} type="button" aria-pressed={categoria === c} onClick={() => setCategoria(c)} className={`rounded-full border px-3 py-1 text-xs font-bold ${categoria === c ? "border-[#20D5B5] text-[#20D5B5]" : "border-[#27394B] text-[#EAF2F8]"}`}>
                {c === "todas" ? "Todas" : ROTULOS_CATEGORIA[c] ?? c}
              </button>
            ))}
          </div>
          )}
          <div className={`grid gap-4 ${visiveis.length > 1 ? "sm:grid-cols-2" : ""}`}>
            {visiveis.map((m) => (
              <Tile key={m.id} className={`overflow-hidden p-0 ${visiveis.length === 1 ? "md:flex md:items-stretch" : ""}`}>
                <button type="button" onClick={() => setAberto(m)} className={`relative block w-full overflow-hidden bg-[#0F1924] ${visiveis.length === 1 ? "aspect-[16/10] md:aspect-auto md:w-[58%]" : "aspect-[16/10]"}`} aria-label={`Jogar: ${m.titulo}`}>
                  {m.tipo === "ausculta" ? (
                    <svg viewBox="80 200 736 660" className="absolute inset-0 h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
                      <image href="/minijogos/ausculta/marcus-costas.webp" width="896" height="1200" />
                      <MaoEstetoscopio x={540} y={600} escala={2.24} />
                    </svg>
                  ) : (
                    <>
                      <img src="/minijogos/mesa.webp" alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" decoding="async" />
                      <img src="/minijogos/topo-bandeja.webp" alt="" className="absolute left-1/2 top-1/2 w-[62%] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_10px_18px_rgba(0,0,0,0.45)]" loading="lazy" decoding="async" />
                    </>
                  )}
                </button>
                <div className="flex flex-1 flex-col justify-center gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-lg font-extrabold leading-snug md:text-xl">{m.titulo}</p>
                    {concluidos.has(m.id) && <Chip tone="success">Concluído</Chip>}
                  </div>
                  <p className="text-sm font-semibold text-[#9FB3C6]">{ROTULOS_TIPO[m.tipo]} · {ROTULOS_CATEGORIA[m.categoria]} · {estimarTempo(m)}</p>
                  {m.instrucao && <p className="text-sm font-semibold">{m.instrucao}</p>}
                  <Button variant="primary" size="lg" className="w-full" onClick={() => setAberto(m)}>{concluidos.has(m.id) ? "Jogar de novo" : "Jogar"}</Button>
                </div>
              </Tile>
            ))}
          </div>
        </>
      )}

      {!minijogos && <VideotecaConteudo titulo="POPs com vídeo e checklist" embutido />}
    </PageShell>
  );
}

TecnicasPage.propTypes = { secao: PropTypes.oneOf(["videos", "minijogos"]) };
