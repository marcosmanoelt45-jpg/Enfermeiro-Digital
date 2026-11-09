import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { m as motion, useAnimationControls } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageShell from "@/components/layout/PageShell";
import { shake, sheetVariants, scrimVariants, vibrate } from "@/lib/motion";
import { AVALIADORES } from "../logica/avaliar.js";
import { avisoDoErro, CHANCES } from "../logica/chances.js";
import { sortearItens } from "../logica/sorteio.js";
import Arrastar from "./tipos/Arrastar.jsx";
import TocarRegiao from "./tipos/TocarRegiao.jsx";
import Ordenar from "./tipos/Ordenar.jsx";
import Medir from "./tipos/Medir.jsx";
import Escolher from "./tipos/Escolher.jsx";
import Ausculta from "./tipos/Ausculta.jsx";
import ResultadoMinijogo from "./ResultadoMinijogo.jsx";

const TIPOS = { arrastar: Arrastar, "tocar-regiao": TocarRegiao, ordenar: Ordenar, medir: Medir, escolher: Escolher, ausculta: Ausculta };

/**
 * Motor de minijogos movido a dados (C11). `modo`: "livre" ocupa a tela; "plantao" e "consulta" abrem numa
 * folha inferior. `onConcluir` recebe o resultado do C11 (inclui `achado` para preencher lacunas do Plantão).
 */
export default function MinijogoRunner({ definicao: original, onConcluir, modo = "livre", onFechar }) {
  const [rodada, setRodada] = useState(0);
  // Cada rodada sorteia os distratores (quando a definição pede): o jogo e a nota usam a mesma definição.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const definicao = useMemo(() => sortearItens(original), [original, rodada]);
  const [feedback, setFeedback] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [tremer, setTremer] = useState(0);
  const [aviso, setAviso] = useState(null); // aviso do 1º erro (ou da entrega vazia)
  const chancesRef = useRef(0);
  // Tremida no erro sem remontar o jogo (antes a key mudava e apagava o que o aluno já tinha montado).
  const controles = useAnimationControls();
  useEffect(() => {
    if (tremer > 0) controles.start(shake);
  }, [tremer, controles]);
  const errosRef = useRef(0);
  const inicio = useRef(Date.now());

  const conferir = useCallback(
    (acao) => {
      const r = AVALIADORES[definicao.tipo](definicao, acao);
      // Tocar devolve o total acumulado a cada toque; os outros tipos devolvem os erros desta tentativa.
      errosRef.current = definicao.tipo === "tocar-regiao" ? r.erros : errosRef.current + r.erros;
      // Tocar região e escolher (1 toque) seguem como antes; os demais têm 2 chances com aviso.
      const comChances = !["tocar-regiao"].includes(definicao.tipo);
      if (!r.concluido && comChances) {
        const a = avisoDoErro(definicao, acao, r);
        vibrate([30, 40, 30]);
        setTremer((n) => n + 1);
        if (a.vazio) {
          setAviso({ texto: a.mensagem, tom: "info" });
          setFeedback(null);
          return { ...r, aviso: a.mensagem };
        }
        chancesRef.current += 1;
        if (chancesRef.current < CHANCES) {
          setAviso({ texto: a.mensagem, tom: "alerta" });
          setFeedback(null); // destrava: o aluno corrige sem perder o que já montou
          return { ...r, aviso: a.mensagem };
        }
        setFeedback(r);
        setAviso(null);
        setResultado({ minijogoId: definicao.id, acertos: r.acertos, erros: errosRef.current, tempoMs: Date.now() - inicio.current, concluido: false });
        return r;
      }
      setAviso(null);
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
    chancesRef.current = 0;
    setAviso(null);
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
        <>
          {aviso && (
            <p role="status" aria-live="polite" className={`rounded-xl border px-3 py-2 text-sm font-bold ${aviso.tom === "info" ? "border-[#27394B] bg-[#131F2E] text-[#EAF2F8]" : "border-[#FFC247]/50 bg-[#FFC247]/10 text-[#FFE2A3]"}`}>
              {aviso.texto}
              {aviso.tom === "alerta" && <span className="mt-0.5 block text-xs font-semibold text-[#9FB3C6]">Última chance: corrija e confira de novo.</span>}
            </p>
          )}
          <motion.div animate={controles}>
            <Jogo key={rodada} definicao={definicao} conferir={conferir} feedback={feedback} />
          </motion.div>
        </>
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
