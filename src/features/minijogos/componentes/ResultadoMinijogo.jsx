import React from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/surface";

function formatarTempo(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// Explicações do que importa: distratores colocados na bandeja e o feedback da alternativa escolhida.
function motivos(definicao, avaliacao) {
  if (definicao.tipo === "arrastar") return (avaliacao?.detalhes ?? []).filter((d) => d.estado === "errado" && d.explicacao).map((d) => ({ id: d.id, texto: d.explicacao, rotulo: definicao.arrastar.itens.find((i) => i.id === d.id)?.label }));
  if (definicao.tipo === "escolher") return (avaliacao?.detalhes ?? []).filter((d) => d.feedback).map((d) => ({ id: d.id, texto: d.feedback }));
  return [];
}

export default function ResultadoMinijogo({ definicao, resultado, avaliacao, onTentarDeNovo, onContinuar }) {
  const porques = motivos(definicao, avaliacao);
  return (
    <Panel className="space-y-4 text-center" role="status">
      <h2 className="text-lg font-extrabold">{resultado.erros === 0 ? "Perfeito!" : "Concluído!"}</h2>
      <dl className="grid grid-cols-3 gap-2 text-center">
        <div><dt className="text-xs font-bold text-[#9FB3C6]">Acertos</dt><dd className="text-xl font-black text-[#3DD68C]">{resultado.acertos}</dd></div>
        <div><dt className="text-xs font-bold text-[#9FB3C6]">Erros</dt><dd className="text-xl font-black text-[#FF6B6B]">{resultado.erros}</dd></div>
        <div><dt className="text-xs font-bold text-[#9FB3C6]">Tempo</dt><dd className="text-xl font-black">{formatarTempo(resultado.tempoMs)}</dd></div>
      </dl>
      {resultado.achado && <p className="rounded-xl border border-[#27394B] p-2 text-sm font-semibold">{resultado.achado.texto}: <b>{resultado.achado.valor}</b></p>}
      {porques.length > 0 && (
        <ul className="space-y-1 text-left text-sm font-semibold text-[#9FB3C6]">
          {porques.map((p) => <li key={p.id}>{p.rotulo ? <b className="text-[#EAF2F8]">{p.rotulo}: </b> : null}{p.texto}</li>)}
        </ul>
      )}
      <p className="text-xs font-semibold text-[#9FB3C6]">
        Fonte:{" "}
        {definicao.fonte.url ? (
          <a href={definicao.fonte.url} target="_blank" rel="noopener noreferrer" className="underline decoration-[#27394B] underline-offset-2 hover:text-white">{definicao.fonte.titulo}</a>
        ) : (
          definicao.fonte.titulo
        )}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onTentarDeNovo}>Tentar de novo</Button>
        <Button variant="primary" className="flex-1" onClick={onContinuar}>Continuar</Button>
      </div>
    </Panel>
  );
}

ResultadoMinijogo.propTypes = {
  definicao: PropTypes.object.isRequired,
  resultado: PropTypes.object.isRequired,
  avaliacao: PropTypes.object,
  onTentarDeNovo: PropTypes.func.isRequired,
  onContinuar: PropTypes.func.isRequired,
};
