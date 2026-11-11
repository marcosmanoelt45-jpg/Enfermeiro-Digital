import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { m as motion, useReducedMotion } from "framer-motion";
import { novoSorteio, sortearSalto } from "./sorteioSalto.js";

/**
 * Comemoração do acerto, no estilo do Duolingo: às vezes o Goti sobe pela base da tela, comemora e desce.
 * Os pulos são vídeos feitos no Flow com fundo verde e recortados por scripts/assets/processar-pulo-goti.py:
 * - giro-punho: pula com o punho para cima e piscando (cerca de 1,6 s);
 * - giro: aperta os olhos e pula com o punho erguido (cerca de 1,3 s).
 * O sorteio (quando pula e qual) fica em sorteioSalto.js. Não bloqueia toques.
 * `disparo` é um contador: cada valor novo é um acerto, que pode ou não virar pulo.
 * Com "reduzir movimento" ligado, não pula.
 */
const PULOS = {
  "giro-punho": { nome: "goti-pulo-giro-punho", largura: 360, altura: 494, duracao: 1580 },
  giro: { nome: "goti-pulo-giro", largura: 360, altura: 464, duracao: 1330 },
};
const LARGURA_NA_TELA = 210; // px

// Safari e iOS não mostram WebM com transparência: lá vai o WebP animado (toca uma vez).
const usaWebp = () =>
  typeof navigator !== "undefined" && (/iPad|iPhone|iPod/.test(navigator.userAgent) || /^((?!chrome|android).)*safari/i.test(navigator.userAgent));

// Cada pulo em WebP ganha um endereço novo (blob) para recomeçar do 1º quadro; o arquivo só é baixado uma vez.
const blobs = {};
async function urlDoWebp(nome) {
  if (!blobs[nome]) blobs[nome] = fetch(`/goti/${nome}.webp`).then((r) => r.blob());
  return URL.createObjectURL(await blobs[nome]);
}

let sorteio = novoSorteio(); // vale para o app todo: a sequência de acertos atravessa as telas

export default function SaltoMascote({ disparo }) {
  const reduzir = useReducedMotion();
  const [ativo, setAtivo] = useState(null);
  const fim = useCallback(() => setAtivo(null), []);
  useEffect(() => {
    if (!(disparo > 0) || reduzir) return;
    const r = sortearSalto(sorteio);
    sorteio = r.estado;
    if (r.salto) setAtivo({ tipo: r.salto, chave: disparo });
  }, [disparo, reduzir]);

  // Deixa os arquivos no cache logo na primeira tela com respostas, para o 1º pulo não chegar atrasado.
  useEffect(() => {
    Object.values(PULOS).forEach((p) => {
      if (usaWebp()) urlDoWebp(p.nome).then((u) => URL.revokeObjectURL(u)).catch(() => {});
      else fetch(`/goti/${p.nome}.webm`).catch(() => {});
    });
  }, []);

  if (!ativo || typeof document === "undefined") return null;
  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[65] overflow-hidden" aria-hidden="true">
      <Pulo key={ativo.chave} pulo={PULOS[ativo.tipo]} onFim={fim} />
    </div>,
    document.body
  );
}
SaltoMascote.propTypes = { disparo: PropTypes.number.isRequired };

function Pulo({ pulo, onFim }) {
  const [saindo, setSaindo] = useState(false);
  const [src, setSrc] = useState(null);
  const webp = useRef(usaWebp()).current;
  const altura = Math.round((pulo.altura * LARGURA_NA_TELA) / pulo.largura);

  useEffect(() => {
    let url = null;
    let vivo = true;
    if (webp) {
      urlDoWebp(pulo.nome)
        .then((u) => {
          url = u;
          if (vivo) setSrc(u);
          else URL.revokeObjectURL(u);
        })
        .catch(onFim);
    } else setSrc(`/goti/${pulo.nome}.webm`);
    return () => {
      vivo = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [pulo.nome, webp, onFim]);

  // O WebP não avisa quando acaba: sai pela duração. O vídeo sai no `ended` (com a mesma duração de reserva).
  useEffect(() => {
    if (!src) return undefined;
    const t = setTimeout(() => setSaindo(true), pulo.duracao + (webp ? 0 : 400));
    return () => clearTimeout(t);
  }, [src, pulo.duracao, webp]);

  if (!src) return null;
  const estilo = { width: LARGURA_NA_TELA, height: altura };
  return (
    <motion.div
      className="absolute bottom-[max(4.5rem,env(safe-area-inset-bottom))] left-1/2 -ml-[105px] will-change-transform"
      initial={{ opacity: 0, transform: "translateY(45%) scale(0.92)" }}
      animate={
        saindo
          ? { opacity: 0, transform: "translateY(60%) scale(0.96)", transition: { duration: 0.22, ease: [0.5, 0, 0.75, 0] } }
          : { opacity: 1, transform: "translateY(0%) scale(1)", transition: { type: "spring", duration: 0.35, bounce: 0.3 } }
      }
      onAnimationComplete={() => saindo && onFim()}
    >
      {webp ? (
        <img src={src} alt="" style={estilo} />
      ) : (
        <video src={src} style={estilo} autoPlay muted playsInline preload="auto" onEnded={() => setSaindo(true)} onError={onFim} />
      )}
    </motion.div>
  );
}
Pulo.propTypes = { pulo: PropTypes.object.isRequired, onFim: PropTypes.func.isRequired };
