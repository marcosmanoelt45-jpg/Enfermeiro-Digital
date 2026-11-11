import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { m as motion, useReducedMotion } from "framer-motion";
import { novoSorteio, sortearSalto } from "./sorteioSalto.js";

/**
 * Comemoração do acerto, no estilo do Duolingo: às vezes o Goti pula na tela e some, em cerca de 1 s.
 * Duas variações, sorteadas em sorteioSalto.js:
 * - vertical: agacha, dispara de baixo até o meio da tela esticado, fica um instante no alto e cai.
 * - lateral: entra pela direita em dois quiques, cada um amassando no chão, e sai por baixo.
 * Não bloqueia toques. `disparo` é um contador: cada valor novo é um acerto (que pode ou não virar pulo).
 * Com "reduzir movimento" ligado, não pula.
 */
const FORA = 280; // px abaixo da borda: o Goti inteiro fora da tela
let sorteio = novoSorteio(); // vale para o app todo: a sequência de acertos atravessa as telas

export default function SaltoMascote({ disparo }) {
  const reduzir = useReducedMotion();
  const [ativo, setAtivo] = useState(null);
  useEffect(() => {
    if (!(disparo > 0) || reduzir) return;
    const r = sortearSalto(sorteio);
    sorteio = r.estado;
    if (r.salto) setAtivo({ tipo: r.salto, chave: disparo });
  }, [disparo, reduzir]);

  if (!ativo || typeof document === "undefined") return null;
  const fim = () => setAtivo(null);
  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[65] overflow-hidden" aria-hidden="true">
      {ativo.tipo === "vertical" ? <PuloVertical key={ativo.chave} onFim={fim} /> : <PuloLateral key={ativo.chave} onFim={fim} />}
    </div>,
    document.body
  );
}

SaltoMascote.propTypes = { disparo: PropTypes.number.isRequired };

// Transform montado à mão (string completa): o framer acelera na GPU e a ordem fica sob controle.
// A origem (base dos pés) vai na classe: transformOrigin no `style` do framer trava a animação do transform.
const t = (x, y, rot, sx, sy) => `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${sx}, ${sy})`;

function PuloVertical({ onFim }) {
  const topo = Math.round(window.innerHeight * 0.48);
  return (
    <motion.img
      src="/goti/goti-pose-happy.png"
      alt=""
      width={168}
      height={226}
      className="absolute bottom-0 left-1/2 -ml-[84px] h-auto w-[168px] origin-bottom will-change-transform"
      initial={{ transform: t(0, FORA, -8, 1, 1) }}
      animate={{
        transform: [
          t(0, FORA, -8, 1, 1),
          t(0, 40, -6, 1.1, 0.88), // agacha logo antes de sair (antecipação)
          t(0, -topo * 0.9, 3, 0.92, 1.12), // dispara esticado
          t(0, -topo, 0, 1.03, 0.98), // flutua no alto
          t(0, -topo * 0.9, -3, 0.97, 1.04),
          t(0, FORA, 10, 0.94, 1.1), // cai de volta
        ],
      }}
      transition={{ duration: 0.9, times: [0, 0.16, 0.38, 0.5, 0.6, 1], ease: ["easeOut", [0.23, 1, 0.32, 1], "easeOut", "easeIn", "easeIn"] }}
      onAnimationComplete={onFim}
    />
  );
}
PuloVertical.propTypes = { onFim: PropTypes.func.isRequired };

function PuloLateral({ onFim }) {
  const L = window.innerWidth;
  const alto = Math.round(window.innerHeight * 0.3);
  const chao = -Math.round(window.innerHeight * 0.06); // um pouco acima da borda de baixo
  const x0 = L * 0.5 + 120; // fora da tela, à direita
  const x1 = L * 0.18; // 1º quique
  const x2 = -L * 0.06; // 2º quique, quase no meio
  return (
    <motion.img
      src="/goti/goti-jumping.webp"
      alt=""
      width={176}
      height={176}
      className="absolute bottom-0 left-1/2 -ml-[88px] h-auto w-[176px] origin-bottom will-change-transform"
      initial={{ transform: t(x0, -alto * 0.6, 14, 1, 1) }}
      animate={{
        transform: [
          t(x0, -alto * 0.6, 14, 1, 1),
          t(x1, chao, 0, 1.14, 0.84), // aterrissa e amassa
          t((x1 + x2) / 2, -alto, -6, 0.94, 1.08), // sobe de novo, esticado
          t(x2, chao, 0, 1.12, 0.86), // 2º pouso
          t(x2, -alto * 0.55, 4, 0.96, 1.06), // pulinho de despedida
          t(x2 - 30, FORA, -10, 0.95, 1.08), // sai por baixo
        ],
      }}
      transition={{ duration: 1.15, times: [0, 0.2, 0.38, 0.56, 0.72, 1], ease: ["easeIn", "easeOut", "easeIn", "easeOut", "easeIn"] }}
      onAnimationComplete={onFim}
    />
  );
}
PuloLateral.propTypes = { onFim: PropTypes.func.isRequired };
