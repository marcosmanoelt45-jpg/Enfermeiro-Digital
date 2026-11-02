import * as React from "react"
import { animate, useReducedMotion } from "framer-motion"

/**
 * Número que "rola" até o novo valor (pontos, ofensiva, XP).
 * Na primeira montagem mostra o valor direto; anima só quando o valor muda.
 */
export function AnimatedNumber({ value = 0, duration = 0.6, className, format = (n) => n.toLocaleString("pt-BR") }) {
  const reduceMotion = useReducedMotion()
  const target = Number(value) || 0
  const [display, setDisplay] = React.useState(target)
  const fromRef = React.useRef(target)

  React.useEffect(() => {
    const from = fromRef.current
    if (reduceMotion || from === target) {
      fromRef.current = target
      setDisplay(target)
      return undefined
    }
    // fromRef acompanha o valor exibido, então uma mudança no meio da animação continua de onde parou.
    const controls = animate(from, target, {
      duration,
      ease: [0.23, 1, 0.32, 1],
      onUpdate: (latest) => {
        fromRef.current = latest
        setDisplay(Math.round(latest))
      },
    })
    return () => controls.stop()
  }, [target, duration, reduceMotion])

  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {format(display)}
    </span>
  )
}
