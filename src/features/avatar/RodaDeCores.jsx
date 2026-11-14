import React, { useMemo } from "react";
import { m as motion } from "framer-motion";
import { Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const EASE_OUT = [0.23, 1, 0.32, 1];
const LADO = 320; // tamanho da roda
const BOLA = 40;

function hsl(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  const l = (mx + mn) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s, l };
}

/**
 * Posições das cores na roda. Cores vivas em volta, na ordem do arco-íris; neutras (branco, cinza, preto) num anel
 * de dentro. Quando todas têm quase o mesmo matiz (tons de pele), a volta segue do mais claro ao mais escuro.
 */
function posicoes(cores) {
  const itens = cores.map((cor, i) => ({ cor, i, ...hsl(cor) }));
  const vivas = itens.filter((c) => c.s >= 0.18 && c.l > 0.1 && c.l < 0.96);
  const neutras = itens.filter((c) => !vivas.includes(c));
  const hs = vivas.map((c) => c.h);
  const faixa = hs.length ? Math.max(...hs) - Math.min(...hs) : 0;
  const mesmoMatiz = faixa < 50;
  // no tom de pele não há neutras: tudo vai para a volta, do claro ao escuro
  const volta = mesmoMatiz ? [...itens].sort((a, b) => b.l - a.l) : [...vivas].sort((a, b) => a.h - b.h || b.l - a.l);
  const dentro = mesmoMatiz ? [] : neutras.sort((a, b) => b.l - a.l);
  const c = LADO / 2;
  const anel = (lista, raio, giro) =>
    lista.map((item, k) => {
      const ang = giro + (k / lista.length) * Math.PI * 2;
      return { ...item, x: c + raio * Math.sin(ang), y: c - raio * Math.cos(ang) };
    });
  return [...anel(volta, c - BOLA / 2 - 4, 0), ...anel(dentro, 66, dentro.length ? Math.PI / dentro.length : 0)];
}

/** Botão que abre a roda (anel com as cores da paleta). */
export function BotaoRoda({ cores, rotulo, onClick }) {
  const gradiente = useMemo(() => {
    const vivas = cores.map(hsl).filter((c) => c.s >= 0.18).sort((a, b) => a.h - b.h);
    const lista = (vivas.length > 1 ? vivas : cores.map(hsl)).map((c) => `hsl(${c.h} ${Math.round(c.s * 100)}% ${Math.round(c.l * 100)}%)`);
    return `conic-gradient(${[...lista, lista[0]].join(", ")})`;
  }, [cores]);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ver todas as cores: ${rotulo}`}
      title="Todas as cores"
      className="relative h-11 w-11 rounded-full p-[3px] transition-transform duration-100 active:scale-95"
      style={{ background: gradiente }}
    >
      <span className="flex h-full w-full items-center justify-center rounded-full bg-[#0B131D] text-lg font-black leading-none text-[#EAF2F8]">+</span>
    </button>
  );
}

/**
 * Roda com todas as cores de um grupo do avatar. Tocar numa cor já escolhe (a prévia muda na hora); "Pronto" fecha.
 */
export default function RodaDeCores({ aberta, onFechar, rotulo, cores, valor, onEscolher }) {
  const pontos = useMemo(() => posicoes(cores), [cores]);
  const pct = (v) => `${(v / LADO) * 100}%`;
  return (
    <Dialog open={aberta} onOpenChange={(v) => { if (!v) onFechar(); }}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[380px] rounded-3xl border-2 border-[#27394B] bg-[#131F2E] p-5 text-[#EAF2F8] sm:rounded-3xl [&>button:last-child]:hidden">
        <div className="text-center">
          <DialogTitle className="text-base font-black">{rotulo}</DialogTitle>
          <DialogDescription className="mt-1 text-xs font-bold text-[#9FB3C6]">{cores.length} cores. Toque numa para usar.</DialogDescription>
        </div>
        {/* posições em %: a roda encolhe junto em telas estreitas */}
        <div className="relative mx-auto aspect-square w-full" style={{ maxWidth: LADO }}>
          {/* cor escolhida no meio */}
          <motion.span
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-16 w-16 rounded-full border-4 border-[#0B131D] shadow-[0_0_0_2px_#27394B]"
            style={{ background: cores[valor], marginLeft: -32, marginTop: -32 }}
            animate={{ backgroundColor: cores[valor] }}
            transition={{ duration: 0.15, ease: EASE_OUT }}
          />
          {pontos.map((p, k) => {
            const marcada = p.i === valor;
            return (
              <motion.button
                key={p.i}
                type="button"
                onClick={() => onEscolher(p.i)}
                aria-label={`${rotulo}: cor ${p.i + 1}`}
                aria-pressed={marcada}
                className={`absolute rounded-full border-[3px] ${marcada ? "z-10 border-[#20D5B5]" : "border-[#0B131D] hover:border-[#3A516A]"}`}
                style={{ width: BOLA, height: BOLA, left: pct(p.x), top: pct(p.y), marginLeft: -BOLA / 2, marginTop: -BOLA / 2, background: p.cor }}
                initial={{ opacity: 0, transform: "scale(0.85)" }}
                animate={{ opacity: 1, transform: marcada ? "scale(1.12)" : "scale(1)" }}
                transition={{ duration: 0.18, ease: EASE_OUT, delay: Math.min(k * 0.012, 0.2) }}
              >
                {marcada && <Check className="absolute inset-0 m-auto h-5 w-5 text-[#0B131D] drop-shadow-[0_0_2px_#fff]" strokeWidth={3.5} aria-hidden="true" />}
              </motion.button>
            );
          })}
        </div>
        <Button variant="primary" className="w-full" onClick={onFechar}>
          Pronto
        </Button>
      </DialogContent>
    </Dialog>
  );
}
