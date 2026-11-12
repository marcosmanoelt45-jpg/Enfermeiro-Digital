import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, Trophy, Users } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { vibrate } from "@/lib/motion";
import { CartaoConvite, LinhaPessoa, Podio } from "./componentes.jsx";
import { METRICAS, ofensivaJuntos, ordenarPodio, estudouHojePerfil } from "./logicaSocial.js";
import { atualizarMeuPerfil, listarAmigos, meuPerfil, perfisDoPodio, semanaAtual, SocialIndisponivel } from "./servicoSocial.js";

const segmento = (ativo) =>
  `flex-1 rounded-xl px-3 py-2 text-sm font-black transition-colors duration-150 ${ativo ? "bg-[#20D5B5] text-[#062B25]" : "text-[#9FB3C6] hover:text-[#EAF2F8]"}`;

/**
 * Social (rota /social): duas abas.
 * - Pódio: os 3 primeiros num pódio e o resto em lista, por Ofensiva, Recorde ou PE da semana, entre amigos ou no
 *   ranking geral (todo mundo, menos quem ocultou o perfil).
 * - Amigos: convite por link (WhatsApp, Telegram, copiar) e a lista de amigos, com a ofensiva juntos de cada um.
 */
export default function SocialPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [aba, setAba] = useState("podio");
  const [escopo, setEscopo] = useState("geral"); // todo mundo aparece no pódio geral (quem não ocultou o perfil)
  const [metrica, setMetrica] = useState("ofensiva");
  const [perfis, setPerfis] = useState(null);
  const [amigos, setAmigos] = useState(null);
  const [eu, setEu] = useState(null);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      const [p, a, m] = await Promise.all([perfisDoPodio(escopo), listarAmigos(), meuPerfil()]);
      setPerfis(p);
      setAmigos(a);
      setEu(m);
    } catch (e) {
      setErro(e instanceof SocialIndisponivel ? "O social ainda está sendo preparado. Volte daqui a pouco." : e.message);
    }
  }, [escopo]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const ranking = useMemo(() => ordenarPodio(perfis ?? [], metrica, semanaAtual()), [perfis, metrica]);
  const unidade = METRICAS[metrica].curto;

  const entrarNoGeral = async () => {
    vibrate(12);
    try {
      await atualizarMeuPerfil({ no_ranking_geral: true });
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  };

  return (
    <PageShell activeTab="social">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFC247]/15 text-[#FFC247]">
          <Trophy className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-black">Social</h1>
          <p className="text-sm font-semibold text-[#9FB3C6]">Estude junto, compare ofensivas e suba no pódio.</p>
        </div>
      </div>

      <div role="tablist" className="flex gap-1 rounded-2xl border-2 border-[#27394B] bg-[#131F2E] p-1">
        <button type="button" role="tab" aria-selected={aba === "podio"} className={segmento(aba === "podio")} onClick={() => setAba("podio")}>
          Pódio
        </button>
        <button type="button" role="tab" aria-selected={aba === "amigos"} className={segmento(aba === "amigos")} onClick={() => setAba("amigos")}>
          Amigos{amigos?.length ? ` (${amigos.length})` : ""}
        </button>
      </div>

      {erro && <p className="rounded-2xl border-2 border-[#FFC247]/40 bg-[#FFC247]/10 p-3 text-sm font-bold text-[#FFC247]">{erro}</p>}

      {aba === "podio" && !erro && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1 rounded-xl border-2 border-[#27394B] p-0.5">
              <button type="button" aria-pressed={escopo === "amigos"} className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-black ${escopo === "amigos" ? "bg-[#16222E] text-[#EAF2F8]" : "text-[#9FB3C6]"}`} onClick={() => setEscopo("amigos")}>
                <Users className="h-3.5 w-3.5" aria-hidden="true" /> Amigos
              </button>
              <button type="button" aria-pressed={escopo === "geral"} className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-black ${escopo === "geral" ? "bg-[#16222E] text-[#EAF2F8]" : "text-[#9FB3C6]"}`} onClick={() => setEscopo("geral")}>
                <Globe className="h-3.5 w-3.5" aria-hidden="true" /> Geral
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(METRICAS).map(([id, m]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={metrica === id}
                  onClick={() => setMetrica(id)}
                  className={`rounded-full border-2 px-3 py-1 text-xs font-black transition-colors duration-150 ${metrica === id ? "border-[#FFC247] bg-[#FFC247]/15 text-[#FFC247]" : "border-[#27394B] text-[#9FB3C6]"}`}
                >
                  {m.rotulo}
                </button>
              ))}
            </div>
          </div>

          {escopo === "geral" && eu && !eu.no_ranking_geral && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-[#27394B] bg-[#131F2E] p-3">
              <p className="text-sm font-semibold text-[#9FB3C6]">Seu perfil está oculto: só seus amigos te veem. Mostrar deixa nome, avatar e números visíveis no pódio.</p>
              <Button size="sm" variant="primary" onClick={entrarNoGeral}>
                Mostrar
              </Button>
            </div>
          )}

          {perfis === null ? (
            <p className="py-10 text-center text-sm font-bold text-[#9FB3C6]">Carregando o pódio…</p>
          ) : ranking.length <= 1 && escopo === "amigos" ? (
            <div className="space-y-4">
              <p className="text-center text-sm font-bold text-[#9FB3C6]">O pódio fica divertido com amigos. Chame alguém da sua turma!</p>
              <CartaoConvite nome={eu?.nome || user?.full_name} />
            </div>
          ) : (
            <>
              <Podio key={`${escopo}-${metrica}`} lista={ranking.slice(0, 3)} unidade={unidade} meuId={user?.id} />
              <ol className="space-y-2" key={`l-${escopo}-${metrica}`}>
                {ranking.slice(3).map((p, i) => (
                  <LinhaPessoa
                    key={p.user_id}
                    indice={i}
                    perfil={p}
                    posicao={p.posicao}
                    valor={p.valor}
                    unidade={unidade}
                    eu={p.user_id === user?.id}
                    onClick={() => p.user_id !== user?.id && navigate(`/perfil/${p.user_id}`)}
                  />
                ))}
              </ol>
            </>
          )}
        </div>
      )}

      {aba === "amigos" && !erro && (
        <div className="space-y-4">
          <CartaoConvite nome={eu?.nome || user?.full_name} />
          {amigos === null ? (
            <p className="py-6 text-center text-sm font-bold text-[#9FB3C6]">Carregando seus amigos…</p>
          ) : amigos.length === 0 ? (
            <p className="py-6 text-center text-sm font-bold text-[#9FB3C6]">Você ainda não tem amigos aqui. Mande o convite acima!</p>
          ) : (
            <ul className="space-y-2">
              {amigos
                .slice()
                .sort((a, b) => (b.ofensiva || 0) - (a.ofensiva || 0))
                .map((a, i) => {
                  const juntos = eu ? ofensivaJuntos(eu.dias_estudados, a.dias_estudados) : 0;
                  const hoje = estudouHojePerfil(a.dias_estudados);
                  return (
                    <LinhaPessoa
                      key={a.user_id}
                      indice={i}
                      perfil={a}
                      valor={a.ofensiva}
                      unidade="dias"
                      extra={`${juntos ? `${juntos} ${juntos === 1 ? "dia" : "dias"} juntos · ` : ""}${hoje ? "Já estudou hoje" : "Ainda não estudou hoje"}`}
                      onClick={() => navigate(`/perfil/${a.user_id}`)}
                    />
                  );
                })}
            </ul>
          )}
        </div>
      )}
    </PageShell>
  );
}
