import * as React from "react"
import { m as motion, useReducedMotion } from "framer-motion"

import { cn } from "@/lib/utils"
import { spring } from "@/lib/motion"

const tones = {
  brand: "bg-[#20D5B5]",
  success: "bg-[#3DD68C]",
  warning: "bg-[#FFC247]",
  danger: "bg-[#FF6B6B]",
}

/**
 * Barra de progresso cápsula com preenchimento em mola e brilho que percorre a barra
 * quando o valor aumenta. `value` vai de 0 a 100.
 */
const AnimatedProgress = React.forwardRef(
  ({ value = 0, tone = "brand", minVisible = 0, className, barClassName, label, ...props }, ref) => {
    const reduceMotion = useReducedMotion()
    const clamped = Math.min(100, Math.max(0, Number(value) || 0))
    const shown = clamped > 0 ? Math.max(clamped, minVisible) : 0
    const previous = React.useRef(shown)
    const [shineKey, setShineKey] = React.useState(0)

    React.useEffect(() => {
      if (shown > previous.current) setShineKey((k) => k + 1)
      previous.current = shown
    }, [shown])

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clamped)}
        aria-label={label}
        className={cn("relative h-3 w-full overflow-hidden rounded-full bg-[#16222E] ring-1 ring-inset ring-[#27394B]", className)}
        {...props}
      >
        <motion.div
          className={cn("relative h-full overflow-hidden rounded-full", tones[tone] || tones.brand, barClassName)}
          initial={false}
          animate={{ width: `${shown}%` }}
          transition={reduceMotion ? { duration: 0 } : spring.fill}
        >
          <span className="pointer-events-none absolute inset-x-2 top-[3px] h-[3px] rounded-full bg-white/35" />
          {!reduceMotion && shineKey > 0 && (
            <span key={shineKey} className="progress-shine pointer-events-none absolute inset-y-0 -left-1/2 w-1/2" />
          )}
        </motion.div>
      </div>
    )
  }
)
AnimatedProgress.displayName = "AnimatedProgress"

export { AnimatedProgress }
