import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { CalendarDays, ChevronDown, Flame, Shield } from "lucide-react";
import { vibrate } from "@/lib/motion";

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const CURTO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// cor da célula pelo quanto estudou no dia (do apagado ao verde cheio)
function nivel(pe, maximo) {
  if (pe <= 0) return 0;
  const r = pe / Math.max(maximo, 1);
  return r > 0.75 ? 4 : r > 0.5 ? 3 : r > 0.25 ? 2 : 1;
}
const FUNDO = ["#16222E", "rgba(32,213,181,0.22)", "rgba(32,213,181,0.42)", "rgba(32,213,181,0.68)", "#20D5B5"];

/**
 * Dedicação semanal: os últimos 7 dias em barras e, ao abrir, as últimas 4 semanas em calendário com os PE de
 * cada dia. Serve para o próprio perfil e para o perfil de um amigo.
 * - `pontos`: { "AAAA-MM-DD": PE }. Sem ele (perfil de amigo antigo), cada dia mostra só se estudou.
 * - `ativos`: dias em que estudou (mesmo sem PE). `protegidos`: dias salvos pelo bloqueio de ofensiva.
 */
export default function DedicacaoSemanal({ pontos, ativos = [], protegidos = [], abertoInicial = false }) {
  const [aberto, setAberto] = useState(abertoInicial);
  const comPontos = Boolean(pontos);

  const dados = useMemo(() => {
    const mapa = pontos || {};
    const estudou = new Set([...ativos, ...Object.keys(mapa).filter((d) => (Number(mapa[d]) || 0) > 0)]);
    const salvo = new Set(protegidos);
    const hoje = new Date();
    const hojeIso = iso(hoje);
    const dia = (d) => {
      const chave = iso(d);
      return { chave, pe: Number(mapa[chave]) || 0, estudou: estudou.has(chave), salvo: salvo.has(chave) && !estudou.has(chave), hoje: chave === hojeIso, numero: d.getDate(), futuro: chave > hojeIso };
    };
    const ultimos7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - (6 - i));
      return { ...dia(d), rotulo: CURTO[d.getDay()] };
    });
    // 4 semanas de segunda a domingo, terminando na semana de hoje
    const segunda = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - ((hoje.getDay() || 7) - 1) - 21);
    const semanas = Array.from({ length: 4 }, (_, s) =>
      Array.from({ length: 7 }, (_, i) => dia(new Date(segunda.getFullYear(), segunda.getMonth(), segunda.getDate() + s * 7 + i)))
    );
    const todos = semanas.flat().filter((d) => !d.futuro);
    const melhor = todos.reduce((m, d) => (d.pe > m.pe ? d : m), { pe: 0 });
    return {
      ultimos7,
      semanas,
      pe7: ultimos7.reduce((s, d) => s + d.pe, 0),
      ativos7: ultimos7.filter((d) => d.estudou).length,
      max7: Math.max(...ultimos7.map((d) => d.pe), 1),
      max28: Math.max(...todos.map((d) => d.pe), 1),
      pe28: todos.reduce((s, d) => s + d.pe, 0),
      ativos28: todos.filter((d) => d.estudou).length,
      melhor,
    };
  }, [pontos, ativos, protegidos]);

  const alternar = () => {
    vibrate(8);
    setAberto((v) => !v);
  };

  return (
    <section className="rounded-2xl border-2 border-[#27394B] bg-[#131F2E]" aria-label="Dedicação semanal">
      <div className="flex items-start justify-between gap-3 p-4 pb-2">
        <div>
          <h2 className="text-sm font-black text-[#EAF2F8]">Dedicação semanal</h2>
          <p className="mt-0.5 text-xs font-bold text-[#9FB3C6]">
            {comPontos && <><span className="text-[#20D5B5]">{dados.pe7} PE</span> · </>}
            {dados.ativos7} de 7 dias estudados
          </p>
        </div>
      </div>

      {/* últimos 7 dias */}
      <div className="flex items-end gap-2 px-4" role="img" aria-label={dados.ultimos7.map((d) => `${d.rotulo}: ${comPontos ? `${d.pe} PE` : d.estudou ? "estudou" : "não estudou"}`).join(", ")}>
        {dados.ultimos7.map((d) => {
          const altura = d.estudou ? Math.max(18, Math.round((comPontos ? d.pe / dados.max7 : 1) * 100)) : 0;
          return (
            <div key={d.chave} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <span className={`h-4 text-[11px] font-black tabular-nums ${d.estudou ? "text-[#20D5B5]" : "text-transparent"}`}>{comPontos && d.pe > 0 ? d.pe : "·"}</span>
              <div className="relative flex h-20 w-full max-w-[34px] items-end overflow-hidden rounded-xl bg-[#0B131D]">
                {d.estudou && <div className={`w-full rounded-xl ${d.hoje ? "bg-[#20D5B5]" : "bg-[#20D5B5]/70"}`} style={{ height: `${altura}%` }} />}
                {d.salvo && <Shield className="absolute inset-x-0 bottom-2 mx-auto h-4 w-4 fill-[#5AB8F0]/30 text-[#5AB8F0]" aria-hidden="true" />}
              </div>
              <span className={`text-[11px] font-black ${d.hoje ? "text-[#20D5B5]" : "text-[#9FB3C6]"}`}>{d.hoje ? "Hoje" : d.rotulo}</span>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={alternar}
        aria-expanded={aberto}
        className="mt-3 flex w-full items-center justify-center gap-1.5 border-t-2 border-[#27394B] py-2.5 text-xs font-black text-[#20D5B5] transition-colors duration-150 hover:bg-[#16222E]"
      >
        <CalendarDays className="h-4 w-4" aria-hidden="true" />
        {aberto ? "Esconder as últimas 4 semanas" : "Ver as últimas 4 semanas"}
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${aberto ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {aberto && (
        <div className="animate-[avatarEntra_180ms_ease-out] border-t-2 border-[#27394B] p-4 motion-reduce:animate-none">
          {/* resumo das 4 semanas */}
          <div className="mb-4 grid grid-cols-3 gap-2">
            {[
              comPontos ? { valor: dados.pe28, rotulo: "PE no período" } : null,
              { valor: dados.ativos28, rotulo: "dias estudados" },
              comPontos ? { valor: dados.melhor.pe ? `${dados.melhor.pe}` : "–", rotulo: dados.melhor.pe ? `melhor dia (${dados.melhor.numero})` : "melhor dia" } : null,
            ]
              .filter(Boolean)
              .map((c) => (
                <div key={c.rotulo} className="rounded-xl bg-[#0B131D] px-2 py-2 text-center">
                  <p className="text-lg font-black leading-tight text-[#EAF2F8] tabular-nums">{c.valor}</p>
                  <p className="text-[10px] font-bold text-[#9FB3C6]">{c.rotulo}</p>
                </div>
              ))}
          </div>

          {/* calendário: semana de segunda a domingo; a última coluna é o total da semana */}
          <div className="grid grid-cols-[repeat(7,minmax(0,1fr))_auto] gap-1.5">
            {SEMANA.map((s) => (
              <span key={s} className="text-center text-[10px] font-black text-[#9FB3C6]">{s}</span>
            ))}
            <span className="pl-1 text-right text-[10px] font-black text-[#9FB3C6]">{comPontos ? "PE" : "Dias"}</span>
            {dados.semanas.map((semana) => {
              const total = comPontos ? semana.reduce((s, d) => s + d.pe, 0) : semana.filter((d) => d.estudou).length;
              return (
                <React.Fragment key={semana[0].chave}>
                  {semana.map((d) => {
                    const n = d.estudou ? (comPontos ? Math.max(1, nivel(d.pe, dados.max28)) : 3) : 0;
                    return (
                      <div
                        key={d.chave}
                        title={`${d.chave}${comPontos ? ` · ${d.pe} PE` : ""}`}
                        className={`relative flex aspect-square flex-col items-center justify-center rounded-xl ${d.futuro ? "opacity-30" : ""} ${d.hoje ? "ring-2 ring-[#FFC247] ring-offset-2 ring-offset-[#131F2E]" : ""}`}
                        style={{ background: FUNDO[n] }}
                      >
                        <span className={`absolute left-1.5 top-1 text-[9px] font-bold ${n >= 3 ? "text-[#0B131D]/70" : "text-[#9FB3C6]/70"}`}>{d.numero}</span>
                        {d.salvo ? (
                          <Shield className="mt-1.5 h-3.5 w-3.5 fill-[#5AB8F0]/30 text-[#5AB8F0]" aria-label="Protegido pelo bloqueio" />
                        ) : d.estudou ? (
                          comPontos && d.pe > 0 ? (
                            <span className={`mt-1.5 text-xs font-black tabular-nums ${n >= 3 ? "text-[#0B131D]" : "text-[#EAF2F8]"}`}>{d.pe}</span>
                          ) : (
                            <Flame className={`mt-1.5 h-3.5 w-3.5 fill-current ${n >= 3 ? "text-[#0B131D]" : "text-[#20D5B5]"}`} aria-label="Estudou" />
                          )
                        ) : null}
                      </div>
                    );
                  })}
                  <span className="flex items-center justify-end pl-1 text-xs font-black tabular-nums text-[#EAF2F8]">{total}</span>
                </React.Fragment>
              );
            })}
          </div>

          {/* legenda */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold text-[#9FB3C6]">
            <span className="flex items-center gap-1">
              Menos
              {FUNDO.map((c) => (
                <span key={c} className="h-3 w-3 rounded" style={{ background: c }} />
              ))}
              Mais
            </span>
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-[#5AB8F0]" aria-hidden="true" /> salvo pelo bloqueio
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
DedicacaoSemanal.propTypes = {
  pontos: PropTypes.object,
  ativos: PropTypes.array,
  protegidos: PropTypes.array,
  abertoInicial: PropTypes.bool,
};
