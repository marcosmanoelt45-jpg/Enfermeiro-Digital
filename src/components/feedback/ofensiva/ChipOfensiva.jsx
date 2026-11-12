import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { m as motion, useAnimationControls } from "framer-motion";
import { Flame } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { estudouHoje } from "../comemoracoes.js";

/**
 * Contador de ofensiva do topo. Como no Duolingo, o foguinho fica cinza enquanto a pessoa não estudou hoje
 * (a ofensiva ainda corre risco) e laranja depois. Quando o número sobe, a chama dá um único pulo; não há
 * animação em repouso, porque o topo fica na tela o dia inteiro.
 */
export default function ChipOfensiva({ estado, compacto = false }) {
  const dias = Number(estado?.streak) || 0;
  const hoje = estudouHoje(estado);
  const controle = useAnimationControls();
  const anterior = useRef(dias);

  useEffect(() => {
    if (dias > anterior.current) {
      controle.start({
        transform: ["scale(1) rotate(0deg)", "scale(1.35) rotate(-8deg)", "scale(1) rotate(0deg)"],
        transition: { duration: 0.45, ease: [0.23, 1, 0.32, 1] },
      });
    }
    anterior.current = dias;
  }, [dias, controle]);

  const rotulo = compacto ? (dias === 1 ? "dia" : "dias") : dias === 1 ? "dia seguido" : "dias seguidos";
  return (
    <div
      className={`flex items-center rounded-2xl border border-[#27394B] bg-[#16222E] font-black transition-colors duration-200 ${
        compacto ? "gap-1.5 px-3 py-1.5 text-xs shadow-sm" : "gap-2 px-4 py-2.5 text-sm"
      } ${hoje ? "text-[#FFC247]" : "text-[#7D8FA3]"}`}
      title={hoje ? "Ofensiva garantida hoje" : "Estude hoje para manter a ofensiva"}
    >
      <motion.span animate={controle} className="inline-flex" style={{ transformOrigin: "50% 85%" }}>
        <Flame className={`${compacto ? "h-4 w-4" : "h-5 w-5"} fill-current`} aria-hidden="true" />
      </motion.span>
      <span>
        <AnimatedNumber value={dias} /> {rotulo}
      </span>
    </div>
  );
}
ChipOfensiva.propTypes = { estado: PropTypes.object, compacto: PropTypes.bool };
