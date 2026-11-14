import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Droplets, Syringe, Scale, Gauge, FlaskConical } from "lucide-react";
import { bombaInfusao, CONVERSOES, diluicao, dosePorPeso, doseVolume, FORMULAS, gotejamento } from "../logica/calculadora.js";

// Calculadora livre: a pessoa escolhe o tipo de conta, digita os dados e vê o resultado com as etapas.
// Não rende PE (é ferramenta de conferência, não exercício).

const TIPOS = [
  { id: "gotejamento", rotulo: "Gotejamento", icone: Droplets },
  { id: "volume", rotulo: "Quanto aspirar", icone: Syringe },
  { id: "peso", rotulo: "Dose por peso", icone: Scale },
  { id: "bomba", rotulo: "Bomba (mL/h)", icone: Gauge },
  { id: "diluicao", rotulo: "Frasco com pó", icone: FlaskConical },
];

const ESTADO_INICIAL = {
  gotejamento: { volume: "", tempo: "", unidadeTempo: "h", equipo: "macro" },
  volume: { prescrito: "", disponivel: "", volumeDisponivel: "" },
  peso: { dosePorKg: "", peso: "", vezesAoDia: "" },
  bomba: { dose: "", porMinuto: false, porKg: false, peso: "", quantidade: "", volumeSolucao: "", doseEmMcg: false, quantidadeEmMg: false },
  diluicao: { quantidadeFrasco: "", diluente: "", volumePo: "", prescrito: "" },
};

const CONTA = { gotejamento, volume: doseVolume, peso: dosePorPeso, bomba: bombaInfusao, diluicao };

function Campo({ rotulo, valor, onMudar, sufixo, placeholder }) {
  return (
    <label className="block">
      <span className="text-xs font-extrabold text-[#9FB3C6]">{rotulo}</span>
      <span className="mt-1 flex items-center rounded-xl border-2 border-[#27394B] bg-[#0B131D] focus-within:border-[#20D5B5]">
        <input
          inputMode="decimal"
          value={valor}
          onChange={(e) => onMudar(e.target.value)}
          placeholder={placeholder}
          className="w-full min-w-0 bg-transparent px-3 py-2.5 text-base font-bold text-[#EAF2F8] outline-none placeholder:text-[#4F6378]"
        />
        {sufixo && <span className="shrink-0 pr-3 text-xs font-bold text-[#9FB3C6]">{sufixo}</span>}
      </span>
    </label>
  );
}
Campo.propTypes = { rotulo: PropTypes.string, valor: PropTypes.string, onMudar: PropTypes.func, sufixo: PropTypes.string, placeholder: PropTypes.string };

function Escolha({ opcoes, valor, onMudar, rotulo }) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="flex gap-1 rounded-xl border-2 border-[#27394B] bg-[#0B131D] p-1">
      {opcoes.map(([v, r]) => (
        <button
          key={String(v)}
          type="button"
          role="radio"
          aria-checked={valor === v}
          onClick={() => onMudar(v)}
          className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-black transition-colors duration-150 ${valor === v ? "bg-[#20D5B5] text-[#062B25]" : "text-[#9FB3C6]"}`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
Escolha.propTypes = { opcoes: PropTypes.array, valor: PropTypes.any, onMudar: PropTypes.func, rotulo: PropTypes.string };

export default function CalculadoraLivre() {
  const [tipo, setTipo] = useState("gotejamento");
  const [dados, setDados] = useState(ESTADO_INICIAL);
  const d = dados[tipo];
  const mudar = (campo) => (valor) => setDados((s) => ({ ...s, [tipo]: { ...s[tipo], [campo]: valor } }));
  const tocado = Object.entries(d).some(([, v]) => typeof v === "string" && v.trim() !== "");
  const r = useMemo(() => (tocado ? CONTA[tipo](d) : null), [tipo, d, tocado]);

  return (
    <div className="space-y-4">
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {TIPOS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTipo(t.id)}
            aria-pressed={tipo === t.id}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-sm font-black transition-colors duration-150 ${
              tipo === t.id ? "border-[#20D5B5] bg-[#20D5B5]/15 text-[#20D5B5]" : "border-[#27394B] text-[#9FB3C6]"
            }`}
          >
            <t.icone className="h-4 w-4" aria-hidden="true" /> {t.rotulo}
          </button>
        ))}
      </div>

      <section className="space-y-3 rounded-3xl border-2 border-[#27394B] bg-[#131F2E] p-4">
        {tipo === "gotejamento" && (
          <>
            <Escolha rotulo="Equipo" valor={d.equipo} onMudar={mudar("equipo")} opcoes={[["macro", "Macrogotas"], ["micro", "Microgotas"]]} />
            <div className="grid grid-cols-2 gap-3">
              <Campo rotulo="Volume" valor={d.volume} onMudar={mudar("volume")} sufixo="mL" placeholder="1000" />
              <Campo rotulo="Tempo" valor={d.tempo} onMudar={mudar("tempo")} sufixo={d.unidadeTempo === "h" ? "h" : "min"} placeholder="8" />
            </div>
            <Escolha rotulo="Unidade do tempo" valor={d.unidadeTempo} onMudar={mudar("unidadeTempo")} opcoes={[["h", "Horas"], ["min", "Minutos"]]} />
          </>
        )}
        {tipo === "volume" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Campo rotulo="Dose prescrita" valor={d.prescrito} onMudar={mudar("prescrito")} sufixo="mg/UI" placeholder="150" />
            <Campo rotulo="Dose no frasco" valor={d.disponivel} onMudar={mudar("disponivel")} sufixo="mg/UI" placeholder="500" />
            <Campo rotulo="Volume do frasco" valor={d.volumeDisponivel} onMudar={mudar("volumeDisponivel")} sufixo="mL" placeholder="5" />
          </div>
        )}
        {tipo === "peso" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Campo rotulo="Dose por kg" valor={d.dosePorKg} onMudar={mudar("dosePorKg")} sufixo="/kg" placeholder="50" />
            <Campo rotulo="Peso" valor={d.peso} onMudar={mudar("peso")} sufixo="kg" placeholder="12" />
            <Campo rotulo="Vezes ao dia (opcional)" valor={d.vezesAoDia} onMudar={mudar("vezesAoDia")} sufixo="x" placeholder="3" />
          </div>
        )}
        {tipo === "bomba" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Campo rotulo="Dose" valor={d.dose} onMudar={mudar("dose")} sufixo={`${d.doseEmMcg ? "mcg" : "mg/UI"}${d.porKg ? "/kg" : ""}${d.porMinuto ? "/min" : "/h"}`} placeholder="800" />
              {d.porKg ? <Campo rotulo="Peso" valor={d.peso} onMudar={mudar("peso")} sufixo="kg" placeholder="70" /> : <div />}
              <Campo rotulo="Fármaco na solução" valor={d.quantidade} onMudar={mudar("quantidade")} sufixo={d.quantidadeEmMg ? "mg" : "mg/UI"} placeholder="25000" />
              <Campo rotulo="Volume da solução" valor={d.volumeSolucao} onMudar={mudar("volumeSolucao")} sufixo="mL" placeholder="250" />
            </div>
            <Escolha rotulo="Dose por" valor={d.porMinuto} onMudar={mudar("porMinuto")} opcoes={[[false, "Por hora"], [true, "Por minuto"]]} />
            <Escolha rotulo="Dose pelo peso" valor={d.porKg} onMudar={mudar("porKg")} opcoes={[[false, "Dose fixa"], [true, "Por kg"]]} />
            <Escolha
              rotulo="Unidades"
              valor={d.doseEmMcg && d.quantidadeEmMg}
              onMudar={(v) => setDados((s) => ({ ...s, bomba: { ...s.bomba, doseEmMcg: v, quantidadeEmMg: v } }))}
              opcoes={[[false, "Mesma unidade"], [true, "Dose em mcg, frasco em mg"]]}
            />
          </>
        )}
        {tipo === "diluicao" && (
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Dose do frasco" valor={d.quantidadeFrasco} onMudar={mudar("quantidadeFrasco")} sufixo="mg/UI" placeholder="5000000" />
            <Campo rotulo="Diluente" valor={d.diluente} onMudar={mudar("diluente")} sufixo="mL" placeholder="8" />
            <Campo rotulo="Volume do pó (se houver)" valor={d.volumePo} onMudar={mudar("volumePo")} sufixo="mL" placeholder="2" />
            <Campo rotulo="Dose prescrita" valor={d.prescrito} onMudar={mudar("prescrito")} sufixo="mg/UI" placeholder="2000000" />
          </div>
        )}
      </section>

      <section aria-live="polite" className={`rounded-3xl border-2 p-4 ${r?.ok ? "border-[#20D5B5]/60 bg-[#20D5B5]/10" : "border-[#27394B] bg-[#0E1722]"}`}>
        {!r ? (
          <p className="text-sm font-semibold text-[#9FB3C6]">Preencha os campos: o resultado e as etapas da conta aparecem aqui.</p>
        ) : !r.ok ? (
          <p className="text-sm font-bold text-[#FFC247]">{r.erro}</p>
        ) : (
          <>
            <p className="text-xs font-extrabold uppercase tracking-wide text-[#20D5B5]">Resultado</p>
            <p className="mt-0.5 text-3xl font-black text-[#EAF2F8]">
              {String(r.resultado).replace(".", ",")} <span className="text-base font-extrabold text-[#9FB3C6]">{r.unidade}</span>
            </p>
            {r.extra && <p className="text-sm font-bold text-[#9FB3C6]">{r.extra}</p>}
            <ol className="mt-3 space-y-1 border-t border-[#20D5B5]/25 pt-3">
              {r.etapas.map((e, i) => (
                <li key={i} className="flex gap-2 text-sm font-semibold text-[#C9D6E2]">
                  <span className="font-black text-[#20D5B5]">{i + 1}.</span>
                  <span className="tabular-nums">{e}</span>
                </li>
              ))}
            </ol>
          </>
        )}
      </section>
    </div>
  );
}

/** Uma fórmula com a fração desenhada (numerador sobre denominador). */
function Fracao({ cima, baixo }) {
  return (
    <span className="inline-flex flex-col items-center align-middle text-center">
      <span className="px-1 pb-1">{cima}</span>
      <span className="h-0.5 w-full rounded-full bg-[#20D5B5]" aria-hidden="true" />
      <span className="px-1 pt-1">{baixo}</span>
    </span>
  );
}
Fracao.propTypes = { cima: PropTypes.string, baixo: PropTypes.string };

/** Quadro de fórmulas do cálculo de medicamentos, com as conversões. */
export function QuadroFormulas() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {FORMULAS.map((f) => (
          <article key={f.id} className="rounded-2xl border-2 border-[#27394B] bg-[#131F2E] p-4">
            <h3 className="text-sm font-black text-[#EAF2F8]">{f.titulo}</h3>
            <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#0B131D] px-3 py-3 text-sm font-extrabold text-[#EAF2F8]" aria-label={`${f.resultado} = ${f.fracao ? `${f.fracao[0]} dividido por ${f.fracao[1]}` : f.linha}`}>
              <span className="text-[#FFC247]">{f.resultado}</span>
              <span className="text-[#9FB3C6]">=</span>
              {f.fracao ? <Fracao cima={f.fracao[0]} baixo={f.fracao[1]} /> : <span>{f.linha}</span>}
            </div>
            {f.dica && <p className="mt-2 text-xs font-semibold text-[#9FB3C6]">{f.dica}</p>}
          </article>
        ))}
      </div>
      <article className="rounded-2xl border-2 border-[#27394B] bg-[#0E1722] p-4">
        <h3 className="text-sm font-black text-[#EAF2F8]">Conversões</h3>
        <ul className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {CONVERSOES.map((c) => (
            <li key={c} className="rounded-lg bg-[#131F2E] px-3 py-2 text-sm font-bold tabular-nums text-[#C9D6E2]">
              {c}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs font-semibold text-[#9FB3C6]">Gotas e microgotas sempre em número inteiro (arredonde).</p>
      </article>
    </div>
  );
}
