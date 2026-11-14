import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { m as motion } from "framer-motion";
import { Copy, Crown, Flame, MessageCircle, Send, Share2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { vibrate } from "@/lib/motion";
import AvatarPessoa from "@/features/avatar/AvatarPessoa.jsx";
import { sortearAvatar } from "@/features/avatar/pecas.js";
import { linkDoConvite, meuConvite } from "./servicoSocial.js";
import { linkTelegram, linkWhatsApp, textoDoConvite } from "./logicaSocial.js";

const EASE_OUT = [0.23, 1, 0.32, 1];

/** Avatar de um perfil público (sorteia um estável pelo id se a pessoa ainda não montou o dela). */
export function AvatarDe({ perfil, tamanho = 48, redondo = true }) {
  const temAvatar = perfil?.avatar && Object.keys(perfil.avatar).length > 0;
  return <AvatarPessoa avatar={temAvatar ? perfil.avatar : sortearAvatar(perfil?.user_id || perfil?.nome || "x")} nome={perfil?.nome} tamanho={tamanho} redondo={redondo} />;
}
AvatarDe.propTypes = { perfil: PropTypes.object, tamanho: PropTypes.number, redondo: PropTypes.bool };

/** Cartão de convidar amigos: gera o link e oferece WhatsApp, Telegram, copiar e o compartilhar do celular. */
export function CartaoConvite({ nome }) {
  const [link, setLink] = useState(null);
  const [erro, setErro] = useState(null);
  useEffect(() => {
    let vivo = true;
    meuConvite()
      .then((c) => vivo && setLink(linkDoConvite(c)))
      .catch((e) => vivo && setErro(e.message));
    return () => {
      vivo = false;
    };
  }, []);
  const texto = link ? textoDoConvite(nome, link) : "";
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link);
      vibrate(12);
      toast({ title: "Link copiado", description: "Cole na conversa com seu colega." });
    } catch {
      toast({ title: "Não deu para copiar", description: link });
    }
  };
  const compartilhar = async () => {
    try {
      await navigator.share({ title: "Estude comigo no Enfere", text: texto, url: link });
    } catch {
      /* a pessoa fechou a janela */
    }
  };
  return (
    <section className="rounded-2xl border-2 border-[#20D5B5]/40 bg-[#20D5B5]/8 p-4" aria-labelledby="convite-titulo">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#20D5B5] text-[#062B25]">
          <UserPlus className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <h2 id="convite-titulo" className="text-base font-black text-[#EAF2F8]">
            Convide colegas
          </h2>
          <p className="text-sm font-semibold text-[#9FB3C6]">Mande o link. Quem entrar por ele vira seu amigo aqui e vocês acompanham a ofensiva um do outro.</p>
        </div>
      </div>
      {erro ? (
        <p className="mt-3 text-sm font-bold text-[#FFC247]">{erro}</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Button asChild variant="success" disabled={!link}>
            <a href={link ? linkWhatsApp(texto) : undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!link}>
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </Button>
          <Button asChild variant="info" disabled={!link}>
            <a href={link ? linkTelegram(link, texto) : undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!link}>
              <Send className="h-4 w-4" /> Telegram
            </a>
          </Button>
          <Button variant="outline" onClick={copiar} disabled={!link}>
            <Copy className="h-4 w-4" /> Copiar link
          </Button>
          {typeof navigator !== "undefined" && navigator.share ? (
            <Button variant="outline" onClick={compartilhar} disabled={!link}>
              <Share2 className="h-4 w-4" /> Outros
            </Button>
          ) : null}
        </div>
      )}
    </section>
  );
}
CartaoConvite.propTypes = { nome: PropTypes.string };

/** Pódio com os 3 primeiros (2º à esquerda, 1º no meio e mais alto, 3º à direita). */
export function Podio({ lista, unidade, meuId, animar = true }) {
  const [p1, p2, p3] = lista;
  // `animar` false: entra já no lugar (trocar a métrica não reanima nem pisca). A coluna é fixa por lugar (não
  // por pessoa), então trocar quem está em 1º só troca o conteúdo.
  const inicio = (v) => (animar ? v : false);
  const coluna = (p, lugar, altura, cor, atraso) =>
    p ? (
      <div className="flex min-w-0 flex-1 flex-col items-center" key={`lugar-${lugar}`}>
        <motion.div
          initial={inicio({ opacity: 0, transform: "translateY(12px)" })}
          animate={{ opacity: 1, transform: "translateY(0px)", transition: { duration: 0.3, ease: EASE_OUT, delay: atraso + 0.25 } }}
          className="relative"
        >
          <div className={`rounded-full p-1 ${p.user_id === meuId ? "bg-[#20D5B5]" : "bg-transparent"}`}>
            <AvatarDe perfil={p} tamanho={lugar === 1 ? 76 : 60} />
          </div>
          {lugar === 1 && (
            <Crown className="absolute -top-4 left-1/2 -ml-3.5 h-7 w-7 fill-[#FFC247] text-[#FFC247]" aria-hidden="true" />
          )}
        </motion.div>
        <p className="mt-1 max-w-full truncate text-xs font-black text-[#EAF2F8]">{p.user_id === meuId ? "Você" : String(p.nome || "Estudante").split(" ")[0]}</p>
        <p className="text-xs font-extrabold" style={{ color: cor }}>
          {p.valor} {unidade}
        </p>
        <motion.div
          className="mt-1.5 flex w-full items-start justify-center rounded-t-2xl pt-2 text-xl font-black text-[#0B131D]"
          style={{ height: altura, background: cor, transformOrigin: "50% 100%" }}
          initial={inicio({ transform: "scaleY(0.2)", opacity: 0 })}
          animate={{ transform: "scaleY(1)", opacity: 1, transition: { duration: 0.4, ease: EASE_OUT, delay: atraso } }}
        >
          {lugar}
        </motion.div>
      </div>
    ) : (
      <div className="flex-1" key={`vazio-${lugar}`} />
    );
  return (
    <div className="flex items-end gap-2 px-2" aria-label="Pódio">
      {coluna(p2, 2, 70, "#B9C6D3", 0.1)}
      {coluna(p1, 1, 100, "#FFC247", 0)}
      {coluna(p3, 3, 52, "#E59A5C", 0.2)}
    </div>
  );
}
Podio.propTypes = { lista: PropTypes.array.isRequired, unidade: PropTypes.string, meuId: PropTypes.string, animar: PropTypes.bool };

/** Linha de uma pessoa no ranking ou na lista de amigos. */
export function LinhaPessoa({ perfil, posicao, valor, unidade, eu, extra, onClick, indice = 0, animar = true }) {
  return (
    <motion.li
      initial={animar ? { opacity: 0, transform: "translateY(6px)" } : false}
      animate={{ opacity: 1, transform: "translateY(0px)", transition: { duration: 0.2, ease: EASE_OUT, delay: Math.min(indice, 10) * 0.03 } }}
    >
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-left transition-colors duration-150 ${
          eu ? "border-[#20D5B5]/60 bg-[#20D5B5]/8" : "border-[#27394B] bg-[#131F2E] hover:border-[#3A516A]"
        }`}
      >
        {posicao != null && <span className="w-6 text-center text-sm font-black text-[#9FB3C6]">{posicao}</span>}
        <AvatarDe perfil={perfil} tamanho={44} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-black text-[#EAF2F8]">{eu ? `${perfil.nome} (você)` : perfil.nome}</span>
          {extra && <span className="block truncate text-xs font-bold text-[#9FB3C6]">{extra}</span>}
        </span>
        {valor != null && (
          <span className="flex items-center gap-1 text-sm font-black text-[#FFC247]">
            {unidade === "dias" && <Flame className="h-4 w-4 fill-current" aria-hidden="true" />}
            {valor}
            {unidade !== "dias" && <span className="text-xs text-[#9FB3C6]">{unidade}</span>}
          </span>
        )}
      </button>
    </motion.li>
  );
}
LinhaPessoa.propTypes = {
  perfil: PropTypes.object.isRequired,
  posicao: PropTypes.number,
  valor: PropTypes.number,
  unidade: PropTypes.string,
  eu: PropTypes.bool,
  extra: PropTypes.node,
  onClick: PropTypes.func,
  indice: PropTypes.number,
  animar: PropTypes.bool,
};
