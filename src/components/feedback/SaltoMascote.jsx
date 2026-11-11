import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { m as motion, useReducedMotion } from "framer-motion";
import { novoSorteio, sortearSalto } from "./sorteioSalto.js";

/**
 * Comemoração do acerto, no estilo do Duolingo: às vezes o Goti salta de baixo da tela e cai de volta, num arco só.
 * Os pulos são vídeos feitos no Flow com fundo verde e recortados por scripts/assets/processar-pulo-goti.py:
 * - giro-punho: pula com o punho para cima e piscando (cerca de 0,7 s);
 * - giro: aperta os olhos e pula com o punho erguido (cerca de 0,65 s).
 * O sorteio (quando pula e qual) fica em sorteioSalto.js. Não bloqueia toques.
 * `disparo` é um contador: cada valor novo é um acerto, que pode ou não virar pulo.
 * Com "reduzir movimento" ligado, não pula.
 */
const PULOS = {
  // duracao: tempo do arco na tela (o vídeo da pose tem a mesma duração, ~0,7 s)
  "giro-punho": { nome: "goti-pulo-giro-punho", largura: 360, altura: 402, duracao: 700 },
  giro: { nome: "goti-pulo-giro", largura: 360, altura: 400, duracao: 640 },
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

// Um movimento só: o Goti sobe de baixo da tela até perto do meio (desacelerando) e cai para fora (acelerando),
// sem pousar em lugar nenhum. O vídeo só troca a pose (o corpo está estabilizado no arquivo).
function Pulo({ pulo, onFim }) {
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

  if (!src) return null;
  const estilo = { width: LARGURA_NA_TELA, height: altura };
  const fora = altura + 40; // px abaixo da borda: o Goti inteiro escondido
  const topo = -Math.round(window.innerHeight * 0.34);
  const t = (y, r) => `translateY(${y}px) rotate(${r}deg)`;
  return (
    <motion.div
      className="absolute bottom-0 left-1/2 -ml-[105px] will-change-transform"
      initial={{ transform: t(fora, -6) }}
      animate={{ transform: [t(fora, -6), t(topo, 0), t(fora, 8)] }}
      transition={{ duration: pulo.duracao / 1000, times: [0, 0.48, 1], ease: [[0.3, 0.75, 0.45, 1], [0.55, 0, 0.7, 0.25]] }}
      onAnimationComplete={onFim}
    >
      {webp ? <img src={src} alt="" style={estilo} /> : <video src={src} style={estilo} autoPlay muted playsInline preload="auto" onError={onFim} />}
    </motion.div>
  );
}
Pulo.propTypes = { pulo: PropTypes.object.isRequired, onFim: PropTypes.func.isRequired };
