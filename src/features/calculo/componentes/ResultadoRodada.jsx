import React from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import { Chip, Panel } from "@/components/ui/surface";
import { AnimatedNumber } from "@/components/ui/animated-number";

function tempo(s) {
  return s >= 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s} s`;
}

export default function ResultadoRodada({ resumo, modo, onNova, onSair }) {
  const titulo = resumo.graves > 0 ? "Atenção com as prescrições com erro" : resumo.acertos === resumo.total ? "Rodada perfeita!" : "Rodada concluída";
  return (
    <Panel className="space-y-4 text-center" role="status">
      <h1 className="text-xl font-extrabold">{titulo}</h1>
      <p className="text-sm font-semibold text-[#9FB3C6]">{modo.rotulo}</p>
      <dl className="grid grid-cols-2 gap-3">
        <div><dt className="text-xs font-bold text-[#9FB3C6]">Acertos</dt><dd className="text-2xl font-black text-[#3DD68C]"><AnimatedNumber value={resumo.acertos} /> de {resumo.total}</dd></div>
        <div><dt className="text-xs font-bold text-[#9FB3C6]">De primeira</dt><dd className="text-2xl font-black"><AnimatedNumber value={resumo.primeira} /></dd></div>
        <div><dt className="text-xs font-bold text-[#9FB3C6]">Tempo médio</dt><dd className="text-2xl font-black tabular-nums">{tempo(resumo.tempoMedioS)}</dd></div>
        <div><dt className="text-xs font-bold text-[#9FB3C6]">Erros graves</dt><dd className="text-2xl font-black text-[#FF6B6B]"><AnimatedNumber value={resumo.graves} /></dd></div>
      </dl>
      {resumo.graves > 0 && (
        <div className="space-y-1 rounded-2xl border border-[#FF6B6B]/40 bg-[#FF6B6B]/10 p-3">
          <Chip tone="danger">Erro grave</Chip>
          <p className="text-sm font-bold">Você calculou {resumo.graves === 1 ? "uma prescrição" : `${resumo.graves} prescrições`} que estava errada. Na prática, a conduta certa é questionar antes de preparar.</p>
        </div>
      )}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onSair}>Voltar</Button>
        <Button variant="primary" className="flex-1" onClick={onNova}>Nova rodada</Button>
      </div>
    </Panel>
  );
}

ResultadoRodada.propTypes = {
  resumo: PropTypes.object.isRequired,
  modo: PropTypes.object.isRequired,
  onNova: PropTypes.func.isRequired,
  onSair: PropTypes.func.isRequired,
};
