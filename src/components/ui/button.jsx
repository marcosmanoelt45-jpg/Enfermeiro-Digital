import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Botão "Enfere Vivo": face sólida + lábio 3D que afunda ao pressionar.
 * As cores de cada variante vivem em src/index.css (.btn-3d-*), então classes
 * utilitárias passadas em className continuam podendo sobrescrever a face.
 *
 * Nomes antigos (default, clinical, duo*, destructive, outline, secondary, ghost, link)
 * continuam válidos; os novos (primary, success, danger, warning, info, locked) são aliases legíveis.
 */
const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-extrabold select-none outline-none focus-visible:ring-2 focus-visible:ring-[#20D5B5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B131D] disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "btn-3d-teal",
        primary: "btn-3d-teal",
        clinical: "btn-3d-teal",
        duo: "btn-3d-teal",
        success: "btn-3d-emerald",
        duoEmerald: "btn-3d-emerald",
        warning: "btn-3d-amber",
        duoAmber: "btn-3d-amber",
        info: "btn-3d-sky",
        duoSky: "btn-3d-sky",
        danger: "btn-3d-rose",
        destructive: "btn-3d-rose",
        duoRose: "btn-3d-rose",
        outline: "btn-3d-outline",
        duoOutline: "btn-3d-outline",
        locked: "btn-3d-locked",
        secondary:
          "rounded-xl bg-[#16222E] text-[#EAF2F8] border border-[#27394B] tap-press hover:bg-[#1B2B3A]",
        ghost:
          "rounded-xl text-[#C9D6E2] tap-press hover:bg-white/5 hover:text-[#EAF2F8] disabled:opacity-50",
        link: "text-[#20D5B5] underline-offset-4 hover:underline disabled:opacity-50",
      },
      size: {
        default: "h-10 px-4 text-sm rounded-[14px]",
        sm: "h-8 px-3 text-xs rounded-xl [--lip:3px]",
        lg: "h-12 px-6 text-base rounded-2xl",
        xl: "h-14 px-8 text-lg rounded-[18px] [--lip:5px]",
        icon: "h-10 w-10 rounded-[14px] [--lip:3px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={asChild ? undefined : disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
            {children}
          </>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
