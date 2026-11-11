import React from "react";
import PropTypes from "prop-types";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip, Inset, Panel } from "@/components/ui/surface";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { AnimatedProgress } from "@/components/ui/animated-progress";

const NOMES = { S: "Situação", B: "Antecedentes", A: "Avaliação", R: "Recomendação" };
const tom = (n) => (n >= 70 ? "success" : n >= 40 ? "warning" : "danger");

// Relatório SBAR: 4 cartões (nota, o que foi bem, o que faltou com o trecho de referência, dica) e as lacunas.
export default function RelatorioPlantao({ relatorio, onNova, onSair }) {
  return (
    <div className="space-y-4">
      <Panel className="space-y-2 text-center" role="status">
        <h1 className="text-xl font-extrabold">{relatorio.titulo}</h1>
        <p className="text-sm font-semibold text-[#9FB3C6]">Nota geral</p>
        <p className="text-4xl font-black text-[#20D5B5]"><AnimatedNumber value={relatorio.notas.geral} /></p>
        {relatorio.comentarioGeral && <p className="text-sm font-semibold">{relatorio.comentarioGeral}</p>}
        {relatorio.aviso && <p className="text-xs font-bold text-[#FFC247]" role="note">{relatorio.aviso}</p>}
      </Panel>

      {["S", "B", "A", "R"].map((l) => {
        const d = relatorio.letras[l];
        const bem = d.elementos.filter((e) => e.presente);
        const faltaram = d.elementos.filter((e) => !e.presente);
        return (
          <Panel key={l} className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-extrabold">{l} · {NOMES[l]}</h2>
              <Chip tone={tom(d.nota)}>{d.nota}</Chip>
            </div>
            <AnimatedProgress value={d.nota} tone={tom(d.nota)} label={`Nota de ${NOMES[l]}`} className="h-2" />
            {d.numeros.total > 0 && <p className="text-xs font-semibold text-[#9FB3C6]">Números conferidos: {d.numeros.ok} de {d.numeros.total} certos.</p>}
            {bem.length > 0 && (
              <ul className="space-y-1 text-sm font-semibold">
                {bem.map((e) => <li key={e.elemento} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-[#3DD68C]" aria-hidden="true" /><span>{e.elemento}</span></li>)}
              </ul>
            )}
            {faltaram.length > 0 && (
              <ul className="space-y-1 text-sm font-semibold">
                {faltaram.map((e) => <li key={e.elemento} className="flex gap-2"><X size={16} className="mt-0.5 shrink-0 text-[#FF6B6B]" aria-hidden="true" /><span>Faltou: {e.elemento}</span></li>)}
              </ul>
            )}
            {d.faltou && <p className="text-sm font-bold text-[#FFC247]">{d.faltou}</p>}
            <Inset className="space-y-1">
              <p className="text-xs font-extrabold text-[#9FB3C6]">Como ficaria</p>
              <p className="text-sm font-semibold">{d.referencia}</p>
            </Inset>
            <p className="text-sm font-semibold text-[#9FB3C6]">Dica: {d.dica}</p>
          </Panel>
        );
      })}

      <Panel className="space-y-2">
        <h2 className="text-base font-extrabold">Exame do paciente</h2>
        {relatorio.lacunas.map((l) => (
          <div key={l.campo} className="flex items-start gap-2 text-sm font-semibold">
            {l.avaliada ? <Check size={16} className="mt-0.5 shrink-0 text-[#3DD68C]" aria-hidden="true" /> : <X size={16} className="mt-0.5 shrink-0 text-[#FF6B6B]" aria-hidden="true" />}
            <span><b>{l.rotulo}:</b> {l.avaliada ? l.achado : `não examinado (o achado era: ${l.esperado})`}</span>
          </div>
        ))}
      </Panel>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onSair}>Voltar</Button>
        <Button variant="primary" className="flex-1" onClick={onNova}>Outro plantão</Button>
      </div>
    </div>
  );
}

RelatorioPlantao.propTypes = {
  relatorio: PropTypes.object.isRequired,
  onNova: PropTypes.func.isRequired,
  onSair: PropTypes.func.isRequired,
};
