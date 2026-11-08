import React, { useCallback, useRef, useState } from "react";
import PropTypes from "prop-types";
import { m as motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageShell from "@/components/layout/PageShell";
import { shake, sheetVariants, scrimVariants, vibrate } from "@/lib/motion";
import { AVALIADORES } from "../logica/avaliar.js";
import Arrastar from "./tipos/Arrastar.jsx";
import TocarRegiao from "./tipos/TocarRegiao.jsx";
import Ordenar from "./tipos/Ordenar.jsx";
import Medir from "./tipos/Medir.jsx";
import Escolher from "./tipos/Escolher.jsx";
import ResultadoMinijogo from "./ResultadoMinijogo.jsx";

const TIPOS = { arrastar: Arrastar, "tocar-regiao": TocarRegiao, ordenar: Ordenar, medir: Medir, escolher: Escolher };

/**
 * Motor de minijogos movido a dados (C11). `modo`: "livre" ocupa a tela; "plantao" e "consulta" abrem numa
 * folha inferior. `onConcluir` recebe o resultado do C11 (inclui `achado` para preencher lacunas do Plantão).
 */
export default function MinijogoRunner({ definicao, onConcluir, modo = "livre", onFechar }) {
  const [rodada, setRodada] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [tremer, setTremer] = useState(0);
  const errosRef = useRef(0);
  const inicio = useRef(Date.now());

  const conferir = useCallback(
    (acao) => {
      const r = AVALIADORES[definicao.tipo](definicao, acao);
      // Tocar devolve o total acumulado a cada toque; os outros tipos devolvem os erros desta tentativa.
      errosRef.current = definicao.tipo === "tocar-regiao" ? r.erros : errosRef.current + r.erros;
      setFeedback(r);
      if (r.concluido) {
        vibrate(15);
        setResultado({
          minijogoId: definicao.id,
          acertos: r.acertos,
          erros: errosRef.current,
          tempoMs: Date.now() - inicio.current,
          concluido: true,
          ...(definicao.achado ? { achado: definicao.achado } : {}),
        });
      } else {
        vibrate([30, 40, 30]);
        setTremer((n) => n + 1);
      }
      return r;
    },
    [definicao]
  );

  const reiniciar = () => {
    errosRef.current = 0;
    inicio.current = Date.now();
    setFeedback(null);
    setResultado(null);
    setRodada((n) => n + 1);
  };

  const Jogo = TIPOS[definicao.tipo];
  const corpo = (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <h1 className="text-lg font-extrabold">{definicao.titulo}</h1>
          <p className="text-sm font-semibold text-[#9FB3C6]">{definicao.instrucao}</p>
        </div>
        {onFechar && (
          <Button variant="ghost" size="icon" onClick={onFechar} aria-label="Fechar">
            <X size={20} aria-hidden="true" />
          </Button>
        )}
      </header>
      {resultado ? (
        <ResultadoMinijogo definicao={definicao} resultado={resultado} avaliacao={feedback} onTentarDeNovo={reiniciar} onContinuar={() => onConcluir?.(resultado)} />
      ) : (
        <motion.div key={`${rodada}-${tremer}`} animate={tremer > 0 ? shake : undefined}>
          <Jogo key={rodada} definicao={definicao} conferir={conferir} feedback={feedback} />
        </motion.div>
      )}
    </div>
  );

  // A cena da mesa é larga (paisagem) no computador: objetos à esquerda e à direita da bandeja.
  const larga = definicao.arrastar?.cena?.tipo === "mesa";
  if (modo === "livre") return <PageShell semDock larguraMax={larga ? "4xl" : "xl"}>{corpo}</PageShell>;

  return (
    <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true" aria-label={definicao.titulo}>
      <motion.div className="absolute inset-0 bg-black/70" variants={scrimVariants} initial="hidden" animate="show" exit="exit" onClick={onFechar} />
      <motion.div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border border-[#27394B] bg-[#0B131D] p-4 pb-8" variants={sheetVariants} initial="hidden" animate="show" exit="exit">
        {corpo}
      </motion.div>
    </div>
  );
}

MinijogoRunner.propTypes = {
  definicao: PropTypes.object.isRequired,
  onConcluir: PropTypes.func,
  modo: PropTypes.oneOf(["livre", "plantao", "consulta"]),
  onFechar: PropTypes.func,
};
