import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { m as motion } from "framer-motion";
import { buscarPersonagem } from "../dados/personagens.js";
import { caminhoDoClipe, resolverClipe } from "../logica/clipes.js";

// Clipes montados desde o início; os outros só quando alguém os pede (preload="metadata").
const SEMPRE = ["parado", "falando", "pensando"];
const UMA_VEZ = new Set(["acerto", "erro"]);
const TEMPO_LIMITE_MS = 6000;

/**
 * Palco do personagem: vídeos webm+mp4 empilhados com crossfade por opacidade, camada anti-PiP e
 * fallback visual (inicial + poster) quando o personagem não tem clipe. Generaliza o PacienteVideoStage.
 */
export default function PersonagemStage({ personagemId, emocao = "parado", falando = false, onReacaoTerminou, className = "" }) {
  const personagem = buscarPersonagem(personagemId);
  const pedida = falando ? "falando" : emocao;
  const ativa = personagem ? resolverClipe(personagem, pedida) : null;

  const [montados, setMontados] = useState(() => new Set(SEMPRE));
  const videos = useRef({});
  const aoTerminarRef = useRef(onReacaoTerminou);
  useEffect(() => {
    aoTerminarRef.current = onReacaoTerminou;
  });

  // Monta sob demanda o clipe pedido.
  useEffect(() => {
    if (ativa && !montados.has(ativa)) setMontados((s) => new Set(s).add(ativa));
  }, [ativa, montados]);

  const clipesDoPersonagem = useMemo(() => new Set(personagem?.clipes ?? []), [personagem]);

  // Toca o clipe ativo e pausa os demais. Falando fica em loop; acerto/erro tocam uma vez.
  useEffect(() => {
    for (const [nome, vid] of Object.entries(videos.current)) {
      if (!vid) continue;
      vid.muted = true;
      vid.defaultMuted = true;
      vid.playsInline = true;
      if (nome !== ativa) {
        vid.pause();
        continue;
      }
      vid.loop = !UMA_VEZ.has(nome);
      if (UMA_VEZ.has(nome)) {
        try {
          vid.currentTime = 0;
        } catch {
          // sem metadados ainda
        }
      }
      vid.play().catch(() => {});
    }
  }, [ativa, montados]);

  // Se o clipe de reação não carregar, o palco não fica preso nele.
  useEffect(() => {
    if (!UMA_VEZ.has(ativa)) return undefined;
    const t = setTimeout(() => aoTerminarRef.current?.("timeout"), TEMPO_LIMITE_MS);
    return () => clearTimeout(t);
  }, [ativa]);

  if (!personagem) return null;
  const temClipe = clipesDoPersonagem.size > 0;

  return (
    <div
      className={`relative overflow-hidden rounded-[20px] bg-[#16222E] border-2 border-[#27394B] select-none w-full ${className || "h-[220px] md:h-[300px]"}`}
      role="img"
      aria-label={personagem.nome}
    >
      {/* Camada anti-PiP: bloqueia os botões que o navegador injeta sobre o vídeo */}
      <div className="absolute inset-0 z-30 bg-transparent" aria-hidden="true" />

      {/* Fallback visual: aparece enquanto os clipes carregam ou quando não existem */}
      <div className="absolute inset-0 z-0 flex flex-col items-center justify-center p-4 text-center bg-[#16222E]">
        <motion.div
          className="relative w-24 h-24 rounded-full bg-[#1C2C3C] border border-[#2B3F54] overflow-hidden flex items-center justify-center text-[#20D5B5] font-extrabold text-3xl"
          animate={!temClipe && falando ? { scale: [1, 1.04, 1] } : { scale: 1 }}
          transition={!temClipe && falando ? { duration: 0.9, repeat: Infinity, ease: "easeInOut" } : { duration: 0.15 }}
        >
          <span aria-hidden="true">{personagem.nome.replace(/^(Sr\.|Sra\.|Dr\.|Dra\.|Dona|Enfermeira)\s+/, "").charAt(0)}</span>
          <img
            src={personagem.poster}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </motion.div>
        <p className="mt-2 text-sm font-bold text-slate-200">{personagem.nome}</p>
      </div>

      {[...montados]
        .filter((nome) => clipesDoPersonagem.has(nome))
        .map((nome) => {
          const base = caminhoDoClipe(personagem, nome);
          const visivel = nome === ativa;
          return (
            <video
              key={`${personagemId}-${nome}`}
              ref={(el) => {
                videos.current[nome] = el;
              }}
              muted
              playsInline
              disablePictureInPicture
              disableRemotePlayback
              controlsList="nodownload noplaybackrate nofullscreen"
              preload={SEMPRE.includes(nome) ? "auto" : "metadata"}
              onEnded={() => UMA_VEZ.has(nome) && aoTerminarRef.current?.(nome)}
              className={`absolute inset-0 w-full h-full object-cover pointer-events-none select-none transition-opacity duration-150 ${
                visivel ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              <source src={`${base}.webm`} type="video/webm" />
              <source src={`${base}.mp4`} type="video/mp4" />
            </video>
          );
        })}
    </div>
  );
}

PersonagemStage.propTypes = {
  personagemId: PropTypes.string.isRequired,
  emocao: PropTypes.string,
  falando: PropTypes.bool,
  onReacaoTerminou: PropTypes.func,
  className: PropTypes.string,
};
