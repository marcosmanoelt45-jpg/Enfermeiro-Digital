import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { EyeOff, VolumeX } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { vibrate } from "@/lib/motion";
import { mutarSons, sonsMutados, EVENTO_SOM } from "@/lib/somGlobal.js";
import { atualizarMeuPerfil, meuPerfil } from "@/features/social/servicoSocial.js";

function Chave({ ligado, onClick, rotulo, carregando }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={rotulo}
      disabled={carregando}
      onClick={onClick}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-150 disabled:opacity-50 ${ligado ? "bg-[#20D5B5]" : "bg-[#27394B]"}`}
    >
      <span
        className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ease-[cubic-bezier(.23,1,.32,1)]"
        style={{ transform: ligado ? "translateX(20px)" : "translateX(0px)" }}
      />
    </button>
  );
}
Chave.propTypes = { ligado: PropTypes.bool, onClick: PropTypes.func, rotulo: PropTypes.string, carregando: PropTypes.bool };

/**
 * Duas opções do perfil:
 * - Ocultar perfil: some do pódio geral e de quem não é amigo (amigos continuam vendo). Fica na conta.
 * - Mutar sons: tira todo áudio do site (vozes, vídeos, efeitos). Fica no aparelho.
 */
export default function PrivacidadeESom({ comSocial = true }) {
  const [oculto, setOculto] = useState(null); // null = carregando / sem social
  const [salvando, setSalvando] = useState(false);
  const [mudo, setMudo] = useState(() => sonsMutados());

  useEffect(() => {
    if (!comSocial) return;
    meuPerfil()
      .then((p) => setOculto(p ? !p.no_ranking_geral : false))
      .catch(() => setOculto(null));
  }, [comSocial]);

  useEffect(() => {
    const ouvir = (e) => setMudo(Boolean(e.detail?.mudo));
    window.addEventListener(EVENTO_SOM, ouvir);
    return () => window.removeEventListener(EVENTO_SOM, ouvir);
  }, []);

  const trocarOculto = async () => {
    const novo = !oculto;
    vibrate(10);
    setSalvando(true);
    setOculto(novo);
    try {
      await atualizarMeuPerfil({ no_ranking_geral: !novo });
      toast({ title: novo ? "Perfil oculto" : "Perfil visível", description: novo ? "Só seus amigos te veem agora." : "Você aparece no pódio geral." });
    } catch (e) {
      setOculto(!novo);
      toast({ title: "Não foi possível agora", description: e.message });
    } finally {
      setSalvando(false);
    }
  };

  const trocarSom = () => {
    vibrate(10);
    mutarSons(!mudo);
    setMudo(!mudo);
  };

  return (
    <section className="space-y-2 rounded-2xl border-2 border-[#27394B] bg-[#131F2E] p-4" aria-label="Privacidade e som">
      {comSocial && oculto !== null && (
        <div className="flex items-center gap-3">
          <EyeOff className="h-5 w-5 shrink-0 text-[#9FB3C6]" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-[#EAF2F8]">Ocultar perfil</p>
            <p className="text-xs font-semibold text-[#9FB3C6]">Some do pódio geral e de quem não é seu amigo. Amigos continuam te vendo.</p>
          </div>
          <Chave ligado={oculto} onClick={trocarOculto} rotulo="Ocultar perfil" carregando={salvando} />
        </div>
      )}
      <div className="flex items-center gap-3">
        <VolumeX className="h-5 w-5 shrink-0 text-[#9FB3C6]" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-[#EAF2F8]">Mutar sons</p>
          <p className="text-xs font-semibold text-[#9FB3C6]">Tira todos os áudios do site: vozes, vídeos e efeitos.</p>
        </div>
        <Chave ligado={mudo} onClick={trocarSom} rotulo="Mutar sons" />
      </div>
    </section>
  );
}
PrivacidadeESom.propTypes = { comSocial: PropTypes.bool };
