import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Flame, Trophy, Zap } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { AvatarDe } from "./componentes.jsx";
import { ofensivaJuntos } from "./logicaSocial.js";
import { desfazerAmizade, meuPerfil, perfilDe, semanaAtual, SocialIndisponivel } from "./servicoSocial.js";
import { CORES_FUNDO, normalizarAvatar, sortearAvatar } from "@/features/avatar/pecas.js";

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Perfil de um amigo (rota /perfil/:id): avatar, ofensiva, números, ofensiva juntos e as últimas 4 semanas. */
export default function PerfilAmigoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(undefined);
  const [eu, setEu] = useState(null);
  const [erro, setErro] = useState(null);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    Promise.all([perfilDe(id), meuPerfil()])
      .then(([p, m]) => {
        setPerfil(p);
        setEu(m);
      })
      .catch((e) => setErro(e instanceof SocialIndisponivel ? "O social ainda está sendo preparado." : e.message));
  }, [id]);

  const semanas = useMemo(() => {
    const dias = new Set(perfil?.dias_estudados ?? []);
    const hoje = new Date();
    return Array.from({ length: 28 }, (_, i) => {
      const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - (27 - i));
      return { dia: iso(d), estudou: dias.has(iso(d)), hoje: i === 27 };
    });
  }, [perfil]);

  if (erro) {
    return (
      <PageShell activeTab="social">
        <p className="rounded-2xl border-2 border-[#FFC247]/40 bg-[#FFC247]/10 p-3 text-sm font-bold text-[#FFC247]">{erro}</p>
      </PageShell>
    );
  }
  if (perfil === undefined) {
    return (
      <PageShell activeTab="social">
        <p className="py-10 text-center text-sm font-bold text-[#9FB3C6]">Carregando o perfil…</p>
      </PageShell>
    );
  }
  if (!perfil) {
    return (
      <PageShell activeTab="social">
        <p className="py-10 text-center text-sm font-bold text-[#9FB3C6]">Esse perfil não está disponível para você.</p>
        <Button variant="outline" onClick={() => navigate("/social")}>Voltar ao social</Button>
      </PageShell>
    );
  }

  const temAvatar = perfil.avatar && Object.keys(perfil.avatar).length > 0;
  const fundo = CORES_FUNDO[normalizarAvatar(temAvatar ? perfil.avatar : sortearAvatar(perfil.user_id)).fundo];
  const juntos = eu ? ofensivaJuntos(eu.dias_estudados, perfil.dias_estudados) : 0;
  const peSemana = perfil.semana === semanaAtual() ? perfil.pe_semana : 0;
  const numeros = [
    { icone: Flame, cor: "#FFC247", valor: perfil.ofensiva, rotulo: "Ofensiva" },
    { icone: Trophy, cor: "#FFC247", valor: perfil.melhor_ofensiva, rotulo: "Recorde" },
    { icone: Zap, cor: "#20D5B5", valor: perfil.pe_total, rotulo: "PE no total" },
    { icone: Zap, cor: "#20D5B5", valor: peSemana, rotulo: "PE na semana" },
  ];

  const desfazer = async () => {
    try {
      await desfazerAmizade(perfil.user_id);
      toast({ title: "Amizade desfeita" });
      navigate("/social");
    } catch (e) {
      toast({ title: "Não foi possível agora", description: e.message });
    }
  };

  return (
    <PageShell activeTab="social">
      <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-black text-[#9FB3C6]">
        <ChevronLeft className="h-5 w-5" aria-hidden="true" /> Voltar
      </button>

      <div className="overflow-hidden rounded-3xl border-2 border-[#27394B]">
        <div className="flex justify-center pt-6" style={{ background: fundo }}>
          <AvatarDe perfil={perfil} tamanho={170} redondo={false} />
        </div>
        <div className="bg-[#131F2E] p-4">
          <h1 className="text-xl font-black">{perfil.nome}</h1>
          <p className="text-sm font-semibold text-[#9FB3C6]">No Enfere desde {new Date(perfil.criado_em).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</p>
          {juntos > 0 && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#FFC247]/12 px-3 py-1 text-sm font-black text-[#FFC247]">
              <Flame className="h-4 w-4 fill-current" aria-hidden="true" /> {juntos} {juntos === 1 ? "dia" : "dias"} estudando juntos
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {numeros.map(({ icone: Icone, cor, valor, rotulo }) => (
          <div key={rotulo} className="rounded-2xl border-2 border-[#27394B] bg-[#131F2E] p-3">
            <div className="flex items-center gap-1.5 text-2xl font-black" style={{ color: cor }}>
              <Icone className="h-5 w-5 fill-current" aria-hidden="true" /> {valor ?? 0}
            </div>
            <p className="text-xs font-bold text-[#9FB3C6]">{rotulo}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border-2 border-[#27394B] bg-[#131F2E] p-4" aria-label="Últimas 4 semanas">
        <h2 className="mb-3 text-sm font-black">Últimas 4 semanas</h2>
        <div className="grid grid-cols-7 gap-1.5">
          {semanas.map((d) => (
            <span
              key={d.dia}
              title={d.dia}
              className={`aspect-square rounded-lg ${d.estudou ? "bg-[#FF9600]" : "bg-[#1B2A3A]"} ${d.hoje ? "ring-2 ring-[#FFC247] ring-offset-2 ring-offset-[#131F2E]" : ""}`}
            />
          ))}
        </div>
      </section>

      {eu && eu.user_id !== perfil.user_id && (
        <div className="pt-2">
          {confirmando ? (
            <div className="flex gap-2">
              <Button variant="danger" className="flex-1" onClick={desfazer}>Desfazer amizade</Button>
              <Button variant="outline" className="flex-1" onClick={() => setConfirmando(false)}>Cancelar</Button>
            </div>
          ) : (
            <Button variant="ghost" className="w-full text-[#9FB3C6]" onClick={() => setConfirmando(true)}>Desfazer amizade</Button>
          )}
        </div>
      )}
    </PageShell>
  );
}
