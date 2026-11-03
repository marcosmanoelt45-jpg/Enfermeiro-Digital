import React from 'react';
import { m as motion, useReducedMotion } from 'framer-motion';
import { spring } from '@/lib/motion';
import { clinicalGamificationService } from '@/services/clinicalGamificationService';

export default function WeeklyActivityChart({ weeklyDays = [] }) {
  const reduceMotion = useReducedMotion();
  const safeDays = Array.isArray(weeklyDays) && weeklyDays.length === 7
    ? weeklyDays
    : clinicalGamificationService.getPast7Days({}, false);

  const maxXp = Math.max(100, ...safeDays.map((d) => Number(d.xp) || 0));

  // Texto acessível com resumo de cada dia para leitores de tela
  const ariaSummary = safeDays
    .map((d) => `${d.dayShort} ${Number(d.xp) || 0} PE`)
    .join(', ');

  return (
    <div
      role="img"
      aria-label={`Dedicação semanal: ${ariaSummary}`}
      className="flex items-end justify-between gap-2.5 h-28 pt-3 pb-1 px-1 select-none"
    >
      {safeDays.map((item, idx) => {
        const xpVal = Number(item.xp) || 0;
        const pct = xpVal > 0 ? Math.max(14, Math.round((xpVal / maxXp) * 100)) : 6;
        const isActive = xpVal > 0 || item.completed;

        return (
          <div
            key={item.date || idx}
            className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group"
          >
            {/* Valor de PE acima da barra */}
            <span
              className={`text-[10px] font-mono font-bold transition-opacity ${
                item.isToday && xpVal > 0
                  ? 'text-[#20D5B5] opacity-100'
                  : xpVal > 0
                  ? 'text-[#20D5B5]/80 opacity-90'
                  : 'text-[#9FB3C6]/40 opacity-70'
              }`}
            >
              {xpVal}
            </span>

            {/* Trilho e Barra Animada via scaleY */}
            <div className="w-full flex justify-center items-end h-16 relative">
              <motion.div
                style={{ originY: 1 }}
                initial={reduceMotion ? false : { scaleY: 0 }}
                animate={{ scaleY: pct / 100 }}
                transition={reduceMotion ? { duration: 0 } : { ...spring.fill, delay: idx * 0.04 }}
                className={`w-full max-w-[28px] h-full rounded-t-lg ${
                  item.isToday
                    ? 'bg-[#20D5B5] shadow-xs shadow-[#20D5B5]/20 ring-1 ring-[#20D5B5]'
                    : isActive
                    ? 'bg-[#20D5B5]/60 hover:bg-[#20D5B5]/80'
                    : 'bg-[#16222E] ring-1 ring-inset ring-[#27394B]'
                }`}
              />
            </div>

            {/* Rótulo do dia */}
            <div className="text-center">
              <span
                className={`text-[10px] font-bold block ${
                  item.isToday
                    ? 'text-[#20D5B5] font-black'
                    : 'text-[#9FB3C6]'
                }`}
              >
                {item.dayShort}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
