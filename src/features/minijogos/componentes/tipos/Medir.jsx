import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { m as motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Contar (FR, pulso) anima o tórax ou um ponto na frequência do caso; termômetro e glicosímetro mostram o valor no visor.
function Animacao({ medir }) {
  const { instrumento, valorCorreto } = medir;
  const periodo = 60 / Math.max(1, valorCorreto);
  if (instrumento === "contar-fr") {
    return (
      <motion.svg viewBox="0 0 100 80" className="mx-auto h-40 w-40" aria-label="Tórax do paciente respirando" role="img" animate={{ scaleY: [1, 1.08, 1] }} transition={{ duration: periodo, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: "50% 100%" }}>
        <path d="M22 70 Q18 30 36 14 Q50 8 64 14 Q82 30 78 70 Z" fill="#16222E" stroke="#20D5B5" strokeWidth="2" />
      </motion.svg>
    );
  }
  if (instrumento === "contar-pulso") {
    return <motion.div className="mx-auto h-16 w-16 rounded-full bg-[#FF6B6B]" role="img" aria-label="Pulso do paciente" animate={{ scale: [1, 1.25, 1] }} transition={{ duration: periodo, repeat: Infinity, ease: "easeOut" }} />;
  }
  return (
    <div className="mx-auto w-40 rounded-xl border-2 border-[#27394B] bg-[#0E1722] p-3 text-center" role="img" aria-label={`Visor: ${valorCorreto} ${medir.unidade}`}>
      <span className="font-mono text-3xl font-black text-[#20D5B5]">{valorCorreto}</span>
      <span className="ml-1 text-sm font-bold text-[#9FB3C6]">{medir.unidade}</span>
    </div>
  );
}
Animacao.propTypes = { medir: PropTypes.object.isRequired };

export default function Medir({ definicao, conferir, feedback }) {
  const { medir } = definicao;
  const contando = medir.instrumento === "contar-fr" || medir.instrumento === "contar-pulso";
  const [restante, setRestante] = useState(medir.duracaoSeg ?? 0);
  const [valor, setValor] = useState("");

  // Contagem regressiva de observação (o aluno conta; depois informa por minuto).
  useEffect(() => {
    if (!contando || !medir.duracaoSeg || restante <= 0) return undefined;
    const t = setTimeout(() => setRestante((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [contando, medir.duracaoSeg, restante]);

  const pronto = !contando || !medir.duracaoSeg || restante <= 0;

  return (
    <div className="space-y-4">
      <Animacao medir={medir} />
      {contando && medir.duracaoSeg > 0 && (
        <p className="text-center text-sm font-bold text-[#9FB3C6]" role="timer" aria-live="off">
          {pronto ? "Tempo esgotado. Agora informe." : `Observe e conte… ${restante}s`}
        </p>
      )}
      <div className="flex items-center gap-2">
        <Input
          type="text"
          inputMode="decimal"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          disabled={!pronto}
          placeholder={`Valor em ${medir.unidade}`}
          aria-label={`Valor em ${medir.unidade}`}
          className="bg-[#131F2E] border-[#27394B] text-[#EAF2F8]"
        />
        <span className="text-sm font-bold text-[#9FB3C6]">{medir.unidade}</span>
      </div>
      {feedback && !feedback.concluido && <p className="text-center text-xs font-bold text-[#FF6B6B]" role="status">Não foi dessa vez. Confira a contagem e tente de novo.</p>}
      <Button variant="primary" className="w-full" disabled={!pronto || !valor.trim()} onClick={() => conferir(valor)}>Conferir</Button>
    </div>
  );
}

Medir.propTypes = { definicao: PropTypes.object.isRequired, conferir: PropTypes.func.isRequired, feedback: PropTypes.object };
