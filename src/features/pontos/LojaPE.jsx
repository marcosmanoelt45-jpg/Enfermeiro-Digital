import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Shield, Zap, Sparkles, Stethoscope, ArrowRightLeft, GraduationCap, Gamepad2, Video, ListChecks, RotateCcw, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { toast } from "@/components/ui/use-toast";
import { vibrate } from "@/lib/motion";
import { celebrate } from "@/lib/celebrate";
import { clinicalGamificationService } from "@/services/clinicalGamificationService";
import { LOJA_PE, MAX_BLOQUEIOS, PE_POR_ATIVIDADE, minutosDeDobro, podeComprar } from "./regrasPE.js";

const ICONES = { Shield, Zap };

// O que rende PE (valores de regrasPE.js), na linguagem do aluno.
const GANHOS = [
  { icone: Stethoscope, titulo: "Consulta ao Vivo", pe: PE_POR_ATIVIDADE.consulta, extra: "+ bônus pela nota" },
  { icone: ArrowRightLeft, titulo: "Plantão com a Ana", pe: PE_POR_ATIVIDADE.plantao_vivo, extra: "+ bônus pela nota" },
  { icone: GraduationCap, titulo: "Caso clínico", pe: PE_POR_ATIVIDADE.case_solved },
  { icone: Gamepad2, titulo: "Minijogo", pe: PE_POR_ATIVIDADE.tecnica, extra: "+ bônus pela nota" },
  { icone: Video, titulo: "Vídeo assistido até o fim", pe: PE_POR_ATIVIDADE.video, extra: "1ª vez de cada vídeo" },
  { icone: ListChecks, titulo: "Questão certa", pe: PE_POR_ATIVIDADE.questao, extra: "por questão" },
  { icone: Calculator, titulo: "Cálculo com o Dr. Rui", pe: null, extra: "por acerto, mais se for de primeira" },
  { icone: RotateCcw, titulo: "Revisão concluída", pe: PE_POR_ATIVIDADE.revisao },
];

/**
 * Loja de PE: saldo, bloqueios guardados, PE em dobro ativo, itens para comprar e a tabela de como ganhar PE.
 * Usada na aba "Loja" do Perfil e no botão de PE do cabeçalho.
 */
export default function LojaPE({ userId, onMudou }) {
  const [estado, setEstado] = useState(() => clinicalGamificationService.getState(userId));
  const [agora, setAgora] = useState(() => Date.now());
  const saldo = estado.studyPoints ?? estado.totalXp ?? 0;
  const bloqueios = estado.streakFreezeAvailable ?? 0;
  const minutos = minutosDeDobro(estado, agora);

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
    <div className="space-y-4">
      {/* saldo */}
      <section className="rounded-3xl border-2 border-[#FFC247]/40 bg-[#131F2E] p-4" aria-label="Seu saldo">
        <p className="text-xs font-extrabold uppercase tracking-wide text-[#9FB3C6]">Seu saldo</p>
        <p className="mt-0.5 text-4xl font-black text-[#FFC247]">
          <AnimatedNumber value={saldo} /> <span className="text-xl">PE</span>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#5EB8FF]/15 px-3 py-1 text-xs font-black text-[#5EB8FF]">
            <Shield className="h-3.5 w-3.5" aria-hidden="true" /> {bloqueios} de {MAX_BLOQUEIOS} bloqueios
          </span>
          {minutos > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFC247]/20 px-3 py-1 text-xs font-black text-[#FFC247]">
              <Zap className="h-3.5 w-3.5 fill-current" aria-hidden="true" /> PE em dobro: {minutos} min
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#16222E] px-3 py-1 text-xs font-bold text-[#9FB3C6]">
              <Zap className="h-3.5 w-3.5" aria-hidden="true" /> PE em dobro desligado
            </span>
          )}
        </div>
      </section>

      {/* itens */}
      <section className="space-y-2.5" aria-labelledby="loja-itens">
        <h2 id="loja-itens" className="text-sm font-black text-[#EAF2F8]">Loja</h2>
        {LOJA_PE.map((item) => {
          const Icone = ICONES[item.icone] ?? Sparkles;
          const pode = podeComprar(item, { ...estado, studyPoints: saldo });
          return (
            <article key={item.id} className="flex items-center gap-3 rounded-2xl border-2 border-[#27394B] bg-[#131F2E] p-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: `${item.cor}22`, color: item.cor }}>
                <Icone className="h-6 w-6" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-black text-[#EAF2F8]">{item.titulo}</h3>
                <p className="text-xs font-semibold leading-snug text-[#9FB3C6]">{item.descricao}</p>
                {!pode.ok && <p className="mt-0.5 text-[11px] font-bold text-[#FFC247]">{pode.motivo}</p>}
              </div>
              <Button type="button" variant={pode.ok ? "warning" : "locked"} size="sm" disabled={!pode.ok} onClick={() => comprar(item)} className="shrink-0" aria-label={`Comprar ${item.titulo} por ${item.custo} PE`}>
                {item.custo} PE
              </Button>
            </article>
          );
        })}
      </section>

      {/* como ganhar */}
      <section className="rounded-2xl border-2 border-[#27394B] bg-[#0E1722] p-3" aria-labelledby="loja-ganhar">
        <h2 id="loja-ganhar" className="text-sm font-black text-[#EAF2F8]">Como ganhar PE</h2>
        <p className="text-xs font-semibold text-[#9FB3C6]">O PE vem de terminar uma atividade. Nota a partir de 70% dá +10; a partir de 90%, +20.</p>
        <ul className="mt-2 divide-y divide-[#1F3045]">
          {GANHOS.map((g) => (
            <li key={g.titulo} className="flex items-center gap-3 py-2">
              <g.icone className="h-4 w-4 shrink-0 text-[#20D5B5]" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-[#EAF2F8]">{g.titulo}</span>
                {g.extra && <span className="block text-[11px] font-semibold text-[#9FB3C6]">{g.extra}</span>}
              </span>
              {g.pe != null && <span className="text-sm font-black text-[#FFC247]">+{g.pe}</span>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
LojaPE.propTypes = { userId: PropTypes.string, onMudou: PropTypes.func };
