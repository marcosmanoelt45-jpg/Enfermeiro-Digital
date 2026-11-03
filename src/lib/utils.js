import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const isIframe = typeof window !== 'undefined' && window.self !== window.top;

// Aceita só links http(s). Bloqueia javascript:, data: e afins vindos de texto livre.
export function safeHttpUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(String(value).trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}
