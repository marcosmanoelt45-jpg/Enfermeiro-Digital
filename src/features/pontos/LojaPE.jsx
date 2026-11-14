import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Shield, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { toast } from "@/components/ui/use-toast";
import { vibrate } from "@/lib/motion";
import { celebrate } from "@/lib/celebrate";
import { clinicalGamificationService } from "@/services/clinicalGamificationService";
import { LOJA_PE, MAX_BLOQUEIOS, minutosDeDobro, podeComprar } from "./regrasPE.js";

const ICONES = { Shield, Zap };

/** Arte do item; se a imagem não carregar, fica o ícone na cor do item. */
export function ArteItem({ item, className = "h-16 w-16" }) {
  const [falhou, setFalhou] = useState(!item.imagem);
  const Icone = ICONES[item.icone] ?? Sparkles;
  if (falhou) return <Icone className={className} style={{ color: item.cor }} aria-hidden="true" />;
  return <img src={item.imagem} alt="" className={`${className} object-contain`} draggable={false} onError={() => setFalhou(true)} />;
}
ArteItem.propTypes = { item: PropTypes.object.isRequired, className: PropTypes.string };

/**
 * Loja de PE: saldo, o que a pessoa já tem guardado (bloqueios e PE em dobro) e os itens.
 * Usada na página /loja e no botão de PE do cabeçalho.
 */
export default function LojaPE({ userId, onMudou }) {
  const [estado, setEstado] = useState(() => clinicalGamificationService.getState(userId));
  const [agora, setAgora] = useState(() => Date.now());
  const saldo = estado.studyPoints ?? estado.totalXp ?? 0;
  const bloqueios = estado.streakFreezeAvailable ?? 0;
  const minutos = minutosDeDobro(estado, agora);
  const bloqueio = LOJA_PE.find((i) => i.id === "bloqueio_ofensiva");

  useEffect(() => setEstado(clinicalGamificationService.getState(userId)), [userId]);

  // o relógio do PE em dobro anda sozinho (a cada 20 s basta: mostra minutos)
  useEffect(() => {
    if (!minutos) return undefined;
    const t = setInterval(() => setAgora(Date.now()), 20000);
    return () => clearInterval(t);
  }, [minutos]);

  const comprar = (item) => {
    const r = clinicalGamificationService.comprarItem(item.id, userId);
    if (!r.success) {
      vibrate([30, 40, 30]);
      toast({ title: "Não deu para comprar", description: r.reason, variant: "destructive" });
      return;
    }
    vibrate(15);
    setEstado(r.state);
    setAgora(Date.now());
    onMudou?.(r.state);
    if (item.minutos) {
      celebrate({ count: 40, spread: 60, y: 0.7 });
      toast({ title: "PE em dobro ativado", description: `Tudo o que você concluir rende o dobro por ${minutosDeDobro(r.state)} minutos.` });
    } else {
      toast({ title: "Bloqueio guardado", description: "Se você ficar um dia sem estudar, ele protege sua ofensiva sozinho." });
    }
  };

  return (
    <div className="space-y-5">
      {/* saldo e o que já está guardado */}
      <section className="flex flex-wrap items-end justify-between gap-4 rounded-3xl border-2 border-[#27394B] bg-[#131F2E] p-5" aria-label="Seu saldo">
        <div>
          <p className="text-xs font-bold text-[#9FB3C6]">Seu saldo</p>
          <p className="mt-1 text-4xl font-black leading-none text-[#FFC247] tabular-nums">
            <AnimatedNumber value={saldo} /> <span className="text-xl">PE</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-2xl bg-[#0B131D] py-1.5 pl-1.5 pr-3 text-xs font-black text-[#EAF2F8]" title="Bloqueios de ofensiva guardados">
            <span className="flex">
              {Array.from({ length: MAX_BLOQUEIOS }, (_, i) => (
                <span key={i} className={i < bloqueios ? "" : "opacity-25 grayscale"}>
                  <ArteItem item={bloqueio} className="h-6 w-6" />
                </span>
              ))}
            </span>
            {bloqueios}/{MAX_BLOQUEIOS} bloqueios
          </span>
          {minutos > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-2xl bg-[#FFC247]/15 px-3 py-2 text-xs font-black text-[#FFC247]">
              <Zap className="h-3.5 w-3.5 fill-current" aria-hidden="true" /> PE em dobro · {minutos} min
            </span>
          )}
        </div>
      </section>

      {/* itens */}
      <section aria-label="Itens da loja" className="grid gap-3 sm:grid-cols-3">
        {LOJA_PE.map((item) => {
          const pode = podeComprar(item, { ...estado, studyPoints: saldo });
          return (
            <article key={item.id} className="flex items-center gap-4 rounded-3xl border-2 border-[#27394B] bg-[#131F2E] p-4 sm:flex-col sm:items-stretch sm:text-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl sm:h-28 sm:w-full" style={{ background: `${item.cor}14` }}>
                <ArteItem item={item} className="h-16 w-16 sm:h-24 sm:w-24" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div>
                  <h3 className="text-sm font-black text-[#EAF2F8]">{item.titulo}</h3>
                  <p className="mt-0.5 text-xs font-semibold leading-snug text-[#9FB3C6]">{item.descricao}</p>
                </div>
                <Button
                  type="button"
                  variant={pode.ok ? "warning" : "locked"}
                  size="sm"
                  disabled={!pode.ok}
                  onClick={() => comprar(item)}
                  className="mt-auto w-full sm:w-full"
                  aria-label={`Comprar ${item.titulo} por ${item.custo} PE`}
                >
                  {item.custo} PE
                </Button>
                {!pode.ok && <p className="text-[11px] font-bold text-[#9FB3C6]">{pode.motivo}</p>}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
LojaPE.propTypes = { userId: PropTypes.string, onMudou: PropTypes.func };
