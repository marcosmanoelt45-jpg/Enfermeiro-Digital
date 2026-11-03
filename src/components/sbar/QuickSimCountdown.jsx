import { useEffect, useRef, useState } from "react";

// Contagem da Simulação Rápida: só este bloco re-renderiza, e a barra anima por transform.
export default function QuickSimCountdown({ deadline, total, onExpire }) {
  const [restante, setRestante] = useState(() => Math.max(0, deadline - Date.now()));
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  });
  useEffect(() => {
    let disparou = false;
    const tick = () => {
      const r = Math.max(0, deadline - Date.now());
      setRestante(r);
      if (r === 0 && !disparou) {
        disparou = true;
        onExpireRef.current?.();
      }
    };
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [deadline]);

  const seg = Math.ceil(restante / 1000);
  const cor = seg <= 10 ? "#F0645F" : seg <= 30 ? "#FFC247" : "#20D5B5";
  return (
    <div className="sticky top-2 z-20 rounded-2xl border border-[#1F3045] bg-[#0E1722]/95 p-3 backdrop-blur-sm" role="timer" aria-live="off">
      <div className="flex items-center justify-between text-xs font-bold">
        <span className="text-[#9FB3C6]">Simulação rápida</span>
        <span className="tabular-nums text-base font-black" style={{ color: cor }} aria-label={`${seg} segundos restantes`}>
          {String(Math.floor(seg / 60)).padStart(2, "0")}:{String(seg % 60).padStart(2, "0")}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#1F3045]">
        <div
          className="h-full origin-left rounded-full transition-[transform,background-color] duration-300 ease-linear"
          style={{ transform: `scaleX(${restante / total})`, backgroundColor: cor }}
        />
      </div>
    </div>
  );
}
