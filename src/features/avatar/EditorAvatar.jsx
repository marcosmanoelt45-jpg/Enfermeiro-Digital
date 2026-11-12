import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, m as motion } from "framer-motion";
import { Check, ChevronLeft, Crown, Dices, Glasses, IdCard, Palette, Scissors, Shield, Shirt, Smile, UserRound } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { vibrate } from "@/lib/motion";
import AvatarPessoa from "./AvatarPessoa.jsx";
import { CATEGORIAS, normalizarAvatar, sortearAvatar } from "./pecas.js";
import { gravarMeuAvatarLocal, lerMeuAvatar } from "./meuAvatar.js";
import { atualizarMeuPerfil, SocialIndisponivel } from "@/features/social/servicoSocial.js";

const ICONES = { rosto: Smile, cabelo: Scissors, barba: UserRound, oculos: Glasses, mascara: Shield, cabeca: Crown, roupa: Shirt, cracha: IdCard, fundo: Palette };
const EASE_OUT = [0.23, 1, 0.32, 1];

/**
 * Editor do avatar (rota /avatar). Prévia grande em cima (do lado no computador), abas de categoria e, em cada
 * uma, as cores em bolinhas e as opções em miniaturas do próprio avatar com aquela peça. "Aleatório" sorteia tudo.
 * Salva no aparelho e no perfil público (o que amigos e o pódio veem).
 */
export default function EditorAvatar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const inicial = useMemo(() => lerMeuAvatar(user?.id).avatar, [user?.id]);
  const [avatar, setAvatar] = useState(inicial);
  const [aba, setAba] = useState(CATEGORIAS[0].id);
  const [salvando, setSalvando] = useState(false);
  const categoria = CATEGORIAS.find((c) => c.id === aba);
  const mudou = JSON.stringify(avatar) !== JSON.stringify(inicial);

  const escolher = (campo, valor) => {
    vibrate(8);
    setAvatar((a) => normalizarAvatar({ ...a, [campo]: valor }));
  };

  const salvar = async () => {
    setSalvando(true);
    gravarMeuAvatarLocal(user?.id, avatar);
    try {
      await atualizarMeuPerfil({ avatar });
    } catch (e) {
      if (!(e instanceof SocialIndisponivel)) console.warn("[avatar] salvo só no aparelho:", e?.message);
    }
    setSalvando(false);
    vibrate(15);
    toast({ title: "Avatar salvo", description: "É assim que seus amigos vão te ver." });
    navigate("/conta");
  };

  return (
    <PageShell activeTab="perfil" semDock larguraMax="4xl">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-xl text-[#9FB3C6] hover:bg-[#16222E]" aria-label="Voltar">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-black">Seu avatar</h1>
        <Button variant="outline" size="sm" onClick={() => { vibrate(10); setAvatar(sortearAvatar()); }} aria-label="Sortear um avatar">
          <Dices className="h-4 w-4" /> Aleatório
        </Button>
      </div>

      <div className="md:grid md:grid-cols-[280px_1fr] md:gap-6">
        {/* Prévia: fica parada no topo enquanto a lista rola (no celular) */}
        <div className="sticky top-0 z-10 -mx-4 bg-[#0B131D] px-4 pb-3 pt-1 md:static md:mx-0 md:px-0">
          <div className="mx-auto w-48 overflow-hidden rounded-3xl md:w-full">
            <AvatarPessoa avatar={avatar} nome={user?.full_name} tamanho={280} className="h-auto w-full" titulo="Prévia do seu avatar" />
          </div>
          <Button variant="primary" size="lg" className="mt-3 hidden w-full md:flex" onClick={salvar} loading={salvando} disabled={!mudou && !salvando}>
            Salvar avatar
          </Button>
        </div>

        <div>
          <div role="tablist" aria-label="Partes do avatar" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:flex-wrap md:px-0">
            {CATEGORIAS.map((c) => {
              const Icone = ICONES[c.id];
              const ativa = c.id === aba;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={ativa}
                  onClick={() => setAba(c.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-2xl border-2 px-3 py-2 text-sm font-extrabold transition-colors duration-150 ${
                    ativa ? "border-[#20D5B5] bg-[#20D5B5]/12 text-[#20D5B5]" : "border-[#27394B] text-[#9FB3C6] hover:border-[#3A516A]"
                  }`}
                >
                  <Icone className="h-4 w-4" aria-hidden="true" />
                  {c.rotulo}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={aba}
              role="tabpanel"
              className="mt-3 space-y-5 pb-28 md:pb-4"
              initial={{ opacity: 0, transform: "translateY(6px)" }}
              animate={{ opacity: 1, transform: "translateY(0px)", transition: { duration: 0.18, ease: EASE_OUT } }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
            >
              {categoria.grupos.map((g) => (
                <section key={g.campo} aria-label={g.rotulo}>
                  <h2 className="mb-2 text-sm font-black text-[#EAF2F8]">{g.rotulo}</h2>
                  {g.tipo === "cor" ? (
                    <div className="flex flex-wrap gap-2.5">
                      {g.cores.map((cor, i) => {
                        const marcada = avatar[g.campo] === i;
                        return (
                          <button
                            key={cor}
                            type="button"
                            onClick={() => escolher(g.campo, i)}
                            aria-label={`${g.rotulo} ${i + 1}`}
                            aria-pressed={marcada}
                            className={`relative h-11 w-11 rounded-full border-[3px] transition-transform duration-100 active:scale-95 ${marcada ? "border-[#20D5B5]" : "border-[#27394B]"}`}
                            style={{ background: cor }}
                          >
                            {marcada && <Check className="absolute inset-0 m-auto h-5 w-5 text-[#0B131D] drop-shadow-[0_0_2px_#fff]" strokeWidth={3.5} />}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-5">
                      {g.opcoes.map((o) => {
                        const marcada = avatar[g.campo] === o.id;
                        return (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => escolher(g.campo, o.id)}
                            aria-pressed={marcada}
                            className={`group relative overflow-hidden rounded-2xl border-[3px] bg-[#131F2E] text-center transition-colors duration-150 ${
                              marcada ? "border-[#20D5B5]" : "border-[#27394B] hover:border-[#3A516A]"
                            }`}
                          >
                            <AvatarPessoa avatar={{ ...avatar, [g.campo]: o.id }} nome={user?.full_name} tamanho={120} className="h-auto w-full" />
                            <span className="block truncate px-1 py-1.5 text-[11px] font-extrabold text-[#9FB3C6]">{o.rotulo}</span>
                            {marcada && (
                              <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#20D5B5] text-[#0B131D]">
                                <Check className="h-4 w-4" strokeWidth={3.5} aria-hidden="true" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Botão de salvar fixo embaixo no celular */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#27394B] bg-[#0B131D]/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 md:hidden">
        <Button variant="primary" size="lg" className="w-full" onClick={salvar} loading={salvando} disabled={!mudou && !salvando}>
          Salvar avatar
        </Button>
      </div>
    </PageShell>
  );
}
