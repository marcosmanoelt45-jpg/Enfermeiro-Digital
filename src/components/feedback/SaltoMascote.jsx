import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { m as motion } from "framer-motion";

/**
 * Comemoração do acerto: o Goti salta de baixo até o meio da tela e cai de volta, em menos de 1 s.
 * Não fica dentro da mensagem e não bloqueia toques. `disparo` é um contador: cada valor novo é um salto.
 * Com "reduzir movimento" ligado, o MotionConfig do app tira o transform e o salto não aparece.
 */
const FORA = 260; // px abaixo da borda: o Goti inteiro fora da tela

export default function SaltoMascote({ disparo }) {
  const [ativo, setAtivo] = useState(0);
  useEffect(() => {
    if (disparo > 0) setAtivo(disparo);
  }, [disparo]);

  if (!ativo || typeof document === "undefined") return null;
  // Em pixels (o framer não interpola entre % e vh): sai de baixo da tela e sobe até pouco acima do meio.
  const topo = Math.round(window.innerHeight * 0.46);
  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[65] overflow-hidden" aria-hidden="true">
      <motion.img
        key={ativo}
        src="/goti/goti-pose-happy.png"
        alt=""
        width={168}
        height={226}
        className="absolute bottom-0 left-1/2 -ml-[84px] h-auto w-[168px] will-change-transform"
        initial={{ y: FORA, rotate: -10, scaleX: 0.94, scaleY: 1.08 }}
        animate={{
          y: [FORA, -topo * 0.94, -topo, -topo * 0.94, FORA],
          rotate: [-10, 4, 0, -4, 12],
          scaleX: [0.94, 1, 1.04, 1, 0.96],
          scaleY: [1.08, 1, 0.96, 1, 1.06],
        }}
        transition={{ duration: 0.95, times: [0, 0.34, 0.46, 0.58, 1], ease: ["easeOut", "easeOut", "easeIn", "easeIn"] }}
        onAnimationComplete={() => setAtivo(0)}
      />
    </div>,
    document.body
  );
}

SaltoMascote.propTypes = { disparo: PropTypes.number.isRequired };
