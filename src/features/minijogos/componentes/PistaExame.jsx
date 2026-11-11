import React from "react";
import PropTypes from "prop-types";
import { Eye, FlaskConical, HeartPulse, Ruler } from "lucide-react";

// O que o aluno encontra ao examinar (exames do Plantão sem minijogo próprio): imagem do achado, tela do
// monitor, medidas, laudo e observações. Mostra o achado bruto; a interpretação é do aluno.
export default function PistaExame({ pista }) {
  if (!pista) return null;
  const { imagem, monitor, medidas, laudo, notas } = pista;
  return (
    <section aria-label="O que você encontra" className="space-y-3">
      {imagem && (
        <img src={imagem} alt="Achado do exame físico" width={768} height={576} loading="lazy" className="aspect-[4/3] max-h-[38vh] w-full rounded-2xl border-2 border-[#27394B] bg-[#16222E] object-cover" />
      )}
      {monitor && <Monitor {...monitor} />}
      {medidas?.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {medidas.map(([rotulo, valor]) => (
            <div key={rotulo} className="rounded-2xl border-2 border-[#1F3045] bg-[#0E1722] p-3">
              <p className="flex items-center gap-1.5 text-xs font-bold leading-tight text-[#9FB3C6]">
                <Ruler size={13} aria-hidden="true" className="shrink-0" />
                {rotulo}
              </p>
              <p className="mt-1 text-xl font-black tabular-nums text-[#EAF2F8]">{valor}</p>
            </div>
          ))}
        </div>
      )}
      {laudo?.length > 0 && (
        <div className="rounded-2xl border-2 border-[#1F3045] bg-[#0E1722] p-3">
          <p className="flex items-center gap-1.5 text-xs font-bold text-[#9FB3C6]">
            <FlaskConical size={14} aria-hidden="true" />
            Resultado de exame
          </p>
          {laudo.map(([exame, valor, ref]) => (
            <div key={exame} className="mt-2 flex items-baseline justify-between gap-3 border-t border-[#1F3045] pt-2">
              <span className="text-sm font-bold text-[#EAF2F8]">{exame}</span>
              <span className="text-right">
                <span className="block text-lg font-black tabular-nums text-[#EAF2F8]">{valor}</span>
                {ref && <span className="block text-xs font-semibold text-[#9FB3C6]">ref.: {ref}</span>}
              </span>
            </div>
          ))}
        </div>
      )}
      {notas?.length > 0 && (
        <ul className="space-y-1.5 rounded-2xl border-2 border-[#1F3045] bg-[#0E1722] p-3">
          {notas.map((n) => (
            <li key={n} className="flex gap-2 text-sm font-semibold leading-snug text-[#EAF2F8]">
              <Eye size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-[#20D5B5]" />
              <span>{n}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
PistaExame.propTypes = { pista: PropTypes.object };

// Traço de ECG: um complexo P-QRS-T por batimento; a largura do ciclo segue a frequência.
function tracado(fc, largura = 300, altura = 60) {
  const ciclo = Math.max(28, Math.min(120, (60 / fc) * 90));
  const base = altura * 0.62;
  let d = `M0 ${base}`;
  for (let x = 0; x < largura; x += ciclo) {
    const p = (f) => (x + ciclo * f).toFixed(1);
    d += ` L${p(0.12)} ${base} Q${p(0.17)} ${base - 6} ${p(0.22)} ${base} L${p(0.3)} ${base} L${p(0.33)} ${base + 5}`;
    d += ` L${p(0.37)} ${base - altura * 0.55} L${p(0.41)} ${base + 9} L${p(0.45)} ${base} L${p(0.55)} ${base}`;
    d += ` Q${p(0.63)} ${base - 10} ${p(0.71)} ${base} L${p(1)} ${base}`;
  }
  return d;
}

function Monitor({ titulo = "Monitor multiparamétrico", fc, ritmo, spo2, o2, bcf }) {
  return (
    <div className="rounded-2xl border-2 border-[#1F3045] bg-[#0E1722] p-3">
      <p className="flex items-center gap-1.5 text-xs font-bold text-[#9FB3C6]">
        <HeartPulse size={13} aria-hidden="true" />
        {titulo}
      </p>
      {fc && (
        <div className="mt-2 flex items-center gap-3">
          <svg viewBox="0 0 300 60" className="h-12 flex-1" aria-label={ritmo === "taquicardia" ? "Traçado com complexos regulares e muito próximos" : "Traçado com complexos regulares"} role="img">
            <path d={tracado(fc)} fill="none" stroke="#3DD68C" strokeWidth="2" strokeLinejoin="round" />
          </svg>
          <p className="text-right leading-none text-[#3DD68C]">
            <span className="block text-[10px] font-bold">FC</span>
            <span className="text-3xl font-black tabular-nums">{fc}</span>
          </p>
        </div>
      )}
      {bcf && (
        <p className="mt-2 flex items-baseline justify-between text-[#FFC247]">
          <span className="text-xs font-bold">BCF (bpm)</span>
          <span className="text-4xl font-black tabular-nums">{bcf}</span>
        </p>
      )}
      {spo2 && (
        <p className="mt-2 flex items-baseline justify-between text-[#38BDF8]">
          <span className="text-xs font-bold">SpO2 %</span>
          <span className="text-3xl font-black tabular-nums">{spo2}</span>
        </p>
      )}
      {o2 && <p className="mt-2 border-t border-[#1F3045] pt-2 text-sm font-bold text-[#EAF2F8]">{o2}</p>}
    </div>
  );
}
Monitor.propTypes = { titulo: PropTypes.string, fc: PropTypes.number, ritmo: PropTypes.string, spo2: PropTypes.number, o2: PropTypes.string, bcf: PropTypes.number };
