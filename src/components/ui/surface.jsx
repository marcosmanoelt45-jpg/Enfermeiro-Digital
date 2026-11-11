import React from "react";
import { cn } from "@/lib/utils";

/**
 * Primitivas de superfície "Enfere Vivo" para manter consistência absoluta
 * de superfícies escuras, bordas táteis e tipografia.
 */

export function Panel({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-[#1F3045] bg-[#131F2E] p-4 sm:p-5 text-[#EAF2F8] shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Inset({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#1F3045] bg-[#0E1722] p-3 sm:p-4 text-[#EAF2F8]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Tile({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#27394B] bg-[#16222E] p-3 text-[#EAF2F8]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

const chipTones = {
  brand: "bg-[#20D5B5]/15 border-[#20D5B5]/30 text-[#20D5B5]",
  warning: "bg-[#FFC247]/15 border-[#FFC247]/30 text-[#FFC247]",
  danger: "bg-[#FF6B6B]/15 border-[#FF6B6B]/30 text-[#FF6B6B]",
  info: "bg-[#38BDF8]/15 border-[#38BDF8]/30 text-[#38BDF8]",
  neutral: "bg-[#16222E] border-[#27394B] text-[#9FB3C6]",
  success: "bg-[#3DD68C]/15 border-[#3DD68C]/30 text-[#3DD68C]",
};

export function Chip({ tone = "brand", className, children, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border",
        chipTones[tone] || chipTones.brand,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

